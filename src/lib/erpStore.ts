import { useState, useEffect, Dispatch, SetStateAction } from 'react';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  getDocs, query, where, updateDoc
} from 'firebase/firestore';
import { db } from './firebase';
import {
  Branch,
  Product,
  Customer,
  Invoice,
  CallReminder,
  LaboratoryJob,
  DailyCashClosing,
  StockImportLog,
  Supplier,
  InvoiceItem,
  OpticalPrescription,
  UserAccount,
  DeliveryStatus,
  InventoryAudit,
  InventoryAuditItem,
  PurchaseOrder,
  POStatus,
  AppSetting,
} from '../types';
import {
  INITIAL_BRANCHES,
  INITIAL_PRODUCTS,
  INITIAL_CUSTOMERS,
  INITIAL_INVOICES,
  INITIAL_CALL_REMINDERS,
  INITIAL_LAB_JOBS,
  INITIAL_CASH_CLOSINGS,
  INITIAL_SUPPLIERS,
  INITIAL_USERS,
  INITIAL_PURCHASE_ORDERS,
} from '../mockData';

const STORAGE_KEYS = {
  CURRENT_USER_ID: 'optivision_current_user_id',
  ACTIVE_BRANCH: 'optivision_active_branch_id',
};

function getStoredItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (err) {
    return defaultValue;
  }
}

function setStoredItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    // ignore
  }
}

export function useERPStore() {
  const isPurgedInitial = typeof window !== 'undefined' && localStorage.getItem('erp_data_purged') === 'true';

  const [users, setUsers] = useState<UserAccount[]>(INITIAL_USERS);
  const [branches, setBranches] = useState<Branch[]>(INITIAL_BRANCHES);
  const [products, setProducts] = useState<Product[]>(() => isPurgedInitial ? [] : INITIAL_PRODUCTS);
  const [customers, setCustomers] = useState<Customer[]>(() => isPurgedInitial ? [] : INITIAL_CUSTOMERS);
  const [invoices, setInvoices] = useState<Invoice[]>(() => isPurgedInitial ? [] : INITIAL_INVOICES);
  const [callReminders, setCallReminders] = useState<CallReminder[]>(() => isPurgedInitial ? [] : INITIAL_CALL_REMINDERS);
  const [labJobs, setLabJobs] = useState<LaboratoryJob[]>(() => isPurgedInitial ? [] : INITIAL_LAB_JOBS);
  const [cashClosings, setCashClosings] = useState<DailyCashClosing[]>(() => isPurgedInitial ? [] : INITIAL_CASH_CLOSINGS);
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => isPurgedInitial ? [] : INITIAL_SUPPLIERS);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => isPurgedInitial ? [] : INITIAL_PURCHASE_ORDERS);
  const [importLogs, setImportLogs] = useState<StockImportLog[]>([]);
  const [inventoryAudits, setInventoryAudits] = useState<InventoryAudit[]>([]);
  const [settings, setSettings] = useState<AppSetting[]>([]);

  const [currentUserId, setCurrentUserIdState] = useState<string>(() =>
    getStoredItem(STORAGE_KEYS.CURRENT_USER_ID, 'u-admin')
  );

  const [activeBranchId, setActiveBranchIdState] = useState<string>(() =>
    getStoredItem(STORAGE_KEYS.ACTIVE_BRANCH, 'b-main')
  );

  const [isFirestoreConnected, setIsFirestoreConnected] = useState<boolean>(false);

  useEffect(() => {
    setStoredItem(STORAGE_KEYS.CURRENT_USER_ID, currentUserId);
  }, [currentUserId]);

  useEffect(() => {
    setStoredItem(STORAGE_KEYS.ACTIVE_BRANCH, activeBranchId);
  }, [activeBranchId]);

  // Firestore Real-time Subscriptions & Seed Logic
  useEffect(() => {
    let unsubscribes: Array<() => void> = [];

    const syncCollection = <T extends { id: string }>(
      collName: string,
      setState: Dispatch<SetStateAction<T[]>>,
      initialData: T[]
    ) => {
      const collRef = collection(db, collName);
      const unsub = onSnapshot(
        collRef,
        (snapshot) => {
          setIsFirestoreConnected(true);
          const isPurged = localStorage.getItem('erp_data_purged') === 'true';
          const hasSeeded = localStorage.getItem(`erp_seeded_${collName}`) === 'true';
          const exemptFromPurge = ['users', 'branches'].includes(collName);
          
          if (snapshot.empty && initialData.length > 0 && (!isPurged || exemptFromPurge) && !hasSeeded) {
            // Seed Firestore with initial data
            localStorage.setItem(`erp_seeded_${collName}`, 'true');
            initialData.forEach((item) => {
              setDoc(doc(db, collName, item.id), item).catch((e) =>
                console.error(`Error seeding ${collName}:`, e)
              );
            });
          } else {
            const list: T[] = snapshot.docs.map((docSnap) => docSnap.data() as T);
            setState(list);
          }
        },
        (error) => {
          console.warn(`Firestore subscription error on ${collName}:`, error);
          setIsFirestoreConnected(false);
        }
      );
      unsubscribes.push(unsub);
    };

    syncCollection('users', setUsers, INITIAL_USERS);
    syncCollection('branches', setBranches, INITIAL_BRANCHES);
    syncCollection('products', setProducts, INITIAL_PRODUCTS);
    syncCollection('customers', setCustomers, INITIAL_CUSTOMERS);
    syncCollection('invoices', setInvoices, INITIAL_INVOICES);
    syncCollection('callReminders', setCallReminders, INITIAL_CALL_REMINDERS);
    syncCollection('labJobs', setLabJobs, INITIAL_LAB_JOBS);
    syncCollection('cashClosings', setCashClosings, INITIAL_CASH_CLOSINGS);
    syncCollection('suppliers', setSuppliers, INITIAL_SUPPLIERS);
    syncCollection('purchaseOrders', setPurchaseOrders, INITIAL_PURCHASE_ORDERS);
    syncCollection('importLogs', setImportLogs, []);
    syncCollection('inventoryAudits', setInventoryAudits, []);
    syncCollection('settings', setSettings, []);

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, []);

  // Auto-cleanup orphaned lab jobs and call reminders whose invoices no longer exist
  useEffect(() => {
    if (invoices.length >= 0 && labJobs.length > 0) {
      const invoiceNumbers = new Set(invoices.map(i => i.invoiceNumber));
      const orphanedJobs = labJobs.filter(j => j.invoiceNumber && !invoiceNumbers.has(j.invoiceNumber));
      if (orphanedJobs.length > 0) {
        const batch = writeBatch(db);
        orphanedJobs.forEach(job => {
          batch.delete(doc(db, 'labJobs', job.id));
        });
        batch.commit().catch(err => console.error('Orphaned lab jobs cleanup error:', err));
        setLabJobs(prev => prev.filter(job => !job.invoiceNumber || invoiceNumbers.has(job.invoiceNumber)));
      }
    }
  }, [invoices, labJobs]);

  useEffect(() => {
    if (invoices.length >= 0 && callReminders.length > 0) {
      const invoiceNumbers = new Set(invoices.map(i => i.invoiceNumber));
      const orphanedReminders = callReminders.filter(cr => cr.invoiceNumber && !invoiceNumbers.has(cr.invoiceNumber));
      if (orphanedReminders.length > 0) {
        const batch = writeBatch(db);
        orphanedReminders.forEach(cr => {
          batch.delete(doc(db, 'callReminders', cr.id));
        });
        batch.commit().catch(err => console.error('Orphaned call reminders cleanup error:', err));
        setCallReminders(prev => prev.filter(cr => !cr.invoiceNumber || invoiceNumbers.has(cr.invoiceNumber)));
      }
    }
  }, [invoices, callReminders]);

  const currentUser = users.find((u) => u.id === currentUserId) || users[0] || INITIAL_USERS[0];
  const activeBranch = branches.find((b) => b.id === activeBranchId) || branches[0] || INITIAL_BRANCHES[0];

  const setCurrentUserId = (id: string) => {
    setCurrentUserIdState(id);
    const targetUser = users.find((u) => u.id === id);
    if (targetUser && targetUser.branchId !== 'all') {
      setActiveBranchIdState(targetUser.branchId);
    }
  };

  const setActiveBranchId = (id: string) => {
    setActiveBranchIdState(id);
  };

  // 1. User Account Operations
  const saveUserAccount = (
    userData: Partial<UserAccount> & { username: string; fullName: string; role: UserAccount['role'] }
  ) => {
    const existing = users.find(
      (u) => u.id === userData.id || u.username.toLowerCase() === userData.username.toLowerCase()
    );
    const now = new Date().toISOString().split('T')[0];
    const userId = userData.id || existing?.id || `u-${Date.now()}`;

    const userObj: UserAccount = {
      id: userId,
      username: userData.username,
      fullName: userData.fullName,
      role: userData.role,
      branchId: userData.branchId || 'all',
      email: userData.email || `${userData.username}@optivision.jo`,
      phone: userData.phone || '+962 7 9000 0000',
      isActive: userData.isActive !== undefined ? userData.isActive : existing?.isActive ?? true,
      createdAt: existing?.createdAt || now,
      lastLogin: existing?.lastLogin || 'Never',
    };

    setDoc(doc(db, 'users', userId), userObj).catch((err) =>
      console.error('Firestore saveUserAccount error:', err)
    );
  };

  const toggleUserStatus = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (target) {
      setDoc(doc(db, 'users', userId), { ...target, isActive: !target.isActive }).catch((err) =>
        console.error('Firestore toggleUserStatus error:', err)
      );
    }
  };

  const deleteUserAccount = (userId: string) => {
    deleteDoc(doc(db, 'users', userId)).catch((err) =>
      console.error('Firestore deleteUserAccount error:', err)
    );
  };

  // 2. Branch Operations
  const saveBranch = (branchData: Partial<Branch> & { name: string; code: string }) => {
    const branchId = branchData.id || `b-${Date.now()}`;
    const existing = branches.find((b) => b.id === branchId);

    const branchObj: Branch = {
      id: branchId,
      name: branchData.name,
      code: branchData.code.toUpperCase(),
      city: branchData.city || existing?.city || 'Amman',
      address: branchData.address || existing?.address || 'Jordan',
      phone: branchData.phone || existing?.phone || '+962 6 000 0000',
      manager: branchData.manager || existing?.manager || 'Branch Manager',
      isMain: branchData.isMain !== undefined ? branchData.isMain : existing?.isMain ?? false,
    };

    setDoc(doc(db, 'branches', branchId), branchObj).catch((err) =>
      console.error('Firestore saveBranch error:', err)
    );
  };

  const deleteBranch = (branchId: string) => {
    deleteDoc(doc(db, 'branches', branchId)).catch((err) =>
      console.error('Firestore deleteBranch error:', err)
    );
    if (activeBranchId === branchId) {
      setActiveBranchIdState('b-main');
    }
  };

  // 3. Product Inventory Operations
  const saveProduct = (productData: Partial<Product> & { barcode: string }) => {
    const existing = products.find(
      (p) => p.id === productData.id || p.barcode === productData.barcode
    );
    const productId = productData.id || existing?.id || `p-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString().split('T')[0];

    const currQty = productData.currentQuantity ?? existing?.currentQuantity ?? 1;
    const resQty = productData.reservedQuantity ?? existing?.reservedQuantity ?? 0;
    const availQty = Math.max(0, currQty - resQty);

    const productObj: any = {
      id: productId,
      barcode: productData.barcode,
      brand: productData.brand || existing?.brand || 'GENERIC BRAND',
      model: productData.model || productData.description || existing?.model || 'Optical Frame',
      description: productData.description || existing?.description || 'Optical Product',
      frameType: productData.frameType || existing?.frameType || 'Full Rim',
      frameColor: productData.frameColor || existing?.frameColor || 'Black',
      size: productData.size || existing?.size || '54-18-140',
      material: productData.material || existing?.material || 'Acetate',
      gender: productData.gender || existing?.gender || 'Unisex',
      ageGroup: productData.ageGroup || existing?.ageGroup || 'Adult',
      supplier: productData.supplier || existing?.supplier || 'Main Warehouse Supplier',
      purchaseCost: productData.purchaseCost ?? existing?.purchaseCost ?? 40,
      sellingPrice: productData.sellingPrice ?? existing?.sellingPrice ?? 80,
      discountPrice: productData.discountPrice ?? existing?.discountPrice,
      tax: productData.tax ?? existing?.tax ?? 16,
      currentQuantity: currQty,
      reservedQuantity: resQty,
      availableQuantity: availQty,
      minimumStock: productData.minimumStock ?? existing?.minimumStock ?? 2,
      maximumStock: productData.maximumStock ?? existing?.maximumStock ?? 20,
      warehouse: productData.warehouse || existing?.warehouse || `${activeBranch.name} Vault`,
      branchId: productData.branchId || existing?.branchId || activeBranch.id,
      status: availQty > 0 ? 'Active' : 'Out of Stock',
      warrantyMonths: productData.warrantyMonths ?? existing?.warrantyMonths ?? 12,
      createdDate: existing?.createdDate || now,
      updatedDate: now,
    };

    Object.keys(productObj).forEach(key => productObj[key] === undefined && delete productObj[key]);

    setDoc(doc(db, 'products', productId), productObj).catch((err) =>
      console.error('Firestore saveProduct error:', err)
    );
  };

  const deleteProduct = (productId: string) => {
    deleteDoc(doc(db, 'products', productId)).catch((err) =>
      console.error('Firestore deleteProduct error:', err)
    );
  };

  const deleteProductsBatch = (productIds: string[]) => {
    if (productIds.length === 0) return;
    for (let i = 0; i < productIds.length; i += 400) {
      const batch = writeBatch(db);
      const chunk = productIds.slice(i, i + 400);
      chunk.forEach((id) => batch.delete(doc(db, 'products', id)));
      batch.commit().catch((err) => console.error('Firestore deleteProductsBatch error:', err));
    }
  };

  const transferInventoryItems = (items: Array<{ productId: string, transferQty: number, fromBranchId: string, toBranchId: string }>) => {
    const batch = writeBatch(db);
    
    items.forEach(item => {
      // Find the source product
      const sourceProduct = products.find(p => p.id === item.productId);
      if (!sourceProduct) return;
      
      // Reduce quantity from source
      const newSourceQty = Math.max(0, sourceProduct.currentQuantity - item.transferQty);
      const newSourceAvailQty = Math.max(0, newSourceQty - sourceProduct.reservedQuantity);
      batch.update(doc(db, 'products', sourceProduct.id), {
        currentQuantity: newSourceQty,
        availableQuantity: newSourceAvailQty
      });
      
      // Look for the same barcode in the destination branch
      const destProduct = products.find(p => p.barcode === sourceProduct.barcode && p.branchId === item.toBranchId);
      
      if (destProduct) {
        const newDestQty = destProduct.currentQuantity + item.transferQty;
        const newDestAvailQty = Math.max(0, newDestQty - destProduct.reservedQuantity);
        batch.update(doc(db, 'products', destProduct.id), {
          currentQuantity: newDestQty,
          availableQuantity: newDestAvailQty
        });
      } else {
        // Create new product in destination branch
        const newDestId = `p-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const newProductObj = {
          ...sourceProduct,
          id: newDestId,
          branchId: item.toBranchId,
          currentQuantity: item.transferQty,
          reservedQuantity: 0,
          availableQuantity: item.transferQty,
          warehouse: 'Transfer Received',
        };
        batch.set(doc(db, 'products', newDestId), newProductObj);
      }
    });
    
    batch.commit().catch(err => console.error('Firestore transfer error:', err));
  };

  // Excel Bulk Stock Import Engine
  const importExcelStock = (
    rows: Array<{ barcode: string; description: string; sellingPrice: number; quantity: number }>,
    targetBranchId: string,
    importedBy: string,
    filename: string
  ) => {
    let newItemsCount = 0;
    let updatedItemsCount = 0;
    const duplicates: string[] = [];

    const now = new Date().toISOString().split('T')[0];
    const timeNow = new Date().toLocaleString();

    const batch = writeBatch(db);

    rows.forEach((row) => {
      const cleanBarcode = String(row.barcode).trim();
      if (!cleanBarcode) return;

      const existing = products.find((p) => p.barcode === cleanBarcode);

      if (existing) {
        duplicates.push(cleanBarcode);
        updatedItemsCount++;
        const newCurrQty = existing.currentQuantity + (Number(row.quantity) || 1);
        const newAvailQty = Math.max(0, newCurrQty - existing.reservedQuantity);

        const updatedProd: Product = {
          ...existing,
          description: row.description || existing.description,
          sellingPrice: Number(row.sellingPrice) || existing.sellingPrice,
          currentQuantity: newCurrQty,
          availableQuantity: newAvailQty,
          status: newAvailQty > 0 ? 'Active' : 'Out of Stock',
          updatedDate: now,
          branchId: targetBranchId || existing.branchId,
        };
        batch.set(doc(db, 'products', existing.id), updatedProd);
      } else {
        newItemsCount++;
        const qty = Number(row.quantity) || 1;
        const newProdId = `p-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        const newProd: Product = {
          id: newProdId,
          barcode: cleanBarcode,
          brand: row.description ? row.description.split(' ')[0].toUpperCase() : 'IMPORTED',
          model: row.description || 'Imported Frame',
          description: row.description || 'Optical Item',
          frameType: 'Full Rim',
          frameColor: 'Standard',
          size: 'Standard',
          material: 'Acetate / Metal',
          gender: 'Unisex',
          ageGroup: 'Adult',
          supplier: 'Excel Bulk Supplier',
          purchaseCost: Math.round((Number(row.sellingPrice) || 50) * 0.5),
          sellingPrice: Number(row.sellingPrice) || 100,
          tax: 16,
          currentQuantity: qty,
          reservedQuantity: 0,
          availableQuantity: qty,
          minimumStock: 2,
          maximumStock: 50,
          warehouse: 'Branch Main Vault',
          branchId: targetBranchId,
          status: qty > 0 ? 'Active' : 'Out of Stock',
          warrantyMonths: 12,
          createdDate: now,
          updatedDate: now,
        };
        batch.set(doc(db, 'products', newProdId), newProd);
      }
    });

    const logId = `imp-${Date.now()}`;
    const log: StockImportLog = {
      id: logId,
      filename: filename || 'Stock_Import.xlsx',
      importedBy: importedBy || 'Accountant',
      importDate: timeNow,
      branchId: targetBranchId,
      totalItems: rows.length,
      newItemsCount,
      updatedItemsCount,
      duplicateBarcodes: duplicates,
      status: 'Completed',
      notes: `Imported ${rows.length} rows for branch. ${newItemsCount} new, ${updatedItemsCount} updated duplicates.`,
    };

    batch.set(doc(db, 'importLogs', logId), log);

    batch.commit().catch((err) => console.error('Firestore importExcelStock batch error:', err));
    return log;
  };

  // 4. Customer Operations
  const saveCustomer = (customerData: Partial<Customer> & { name: string; phone: string }): Customer => {
    const existing = customers.find(
      (c) => (customerData.id && c.id === customerData.id) || c.phone === customerData.phone
    );
    const customerId = customerData.id || existing?.id || `c-${Date.now()}`;

    const customerObj: any = {
      id: customerId,
      name: customerData.name,
      phone: customerData.phone,
      secondaryPhone: customerData.secondaryPhone || existing?.secondaryPhone,
      email: customerData.email || existing?.email,
      address: customerData.address || existing?.address,
      birthDate: customerData.birthDate || existing?.birthDate,
      gender: customerData.gender || existing?.gender,
      membershipLevel: customerData.membershipLevel || existing?.membershipLevel || 'Standard',
      loyaltyPoints: customerData.loyaltyPoints ?? existing?.loyaltyPoints ?? 10,
      notes: customerData.notes || existing?.notes,
      createdAt: existing?.createdAt || new Date().toISOString().split('T')[0],
      opticalPrescription: (customerData as any).opticalPrescription || existing?.opticalPrescription,
    };

    Object.keys(customerObj).forEach(key => customerObj[key] === undefined && delete customerObj[key]);

    // Update local React state immediately so UI refreshes without waiting
    setCustomers(prev => {
      const idx = prev.findIndex(c => c.id === customerId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = customerObj;
        return copy;
      }
      return [customerObj, ...prev];
    });

    setDoc(doc(db, 'customers', customerId), customerObj).catch((err) =>
      console.error('Firestore saveCustomer error:', err)
    );
    return customerObj;
  };

  const deleteCustomer = async (customerId: string) => {
    setCustomers(prev => prev.filter(c => c.id !== customerId));
    deleteDoc(doc(db, 'customers', customerId)).catch((err) =>
      console.error('Firestore deleteCustomer error:', err)
    );
  };

  const deleteInvoice = async (invoiceId: string) => {
    const inv = invoices.find(i => i.id === invoiceId || i.invoiceNumber === invoiceId);
    if (!inv) return;

    const batch = writeBatch(db);
    batch.delete(doc(db, 'invoices', inv.id));

    // Delete associated lab jobs from Firestore directly
    try {
      const labJobsQuery = query(collection(db, 'labJobs'), where('invoiceNumber', '==', inv.invoiceNumber));
      const labJobsSnap = await getDocs(labJobsQuery);
      labJobsSnap.forEach(docSnap => batch.delete(docSnap.ref));
    } catch (e) {
      console.error('Error fetching lab jobs to delete:', e);
    }

    // Delete associated call reminders directly from Firestore
    try {
      const crsQuery = query(collection(db, 'callReminders'), where('invoiceNumber', '==', inv.invoiceNumber));
      const crsSnap = await getDocs(crsQuery);
      crsSnap.forEach(docSnap => batch.delete(docSnap.ref));
    } catch (e) {
      console.error('Error fetching call reminders to delete:', e);
    }

    // Restock inventory for items in this invoice
    inv.items.forEach(item => {
      const product = products.find(p => p.barcode === item.barcode || p.id === item.productId);
      if (product) {
        const restoredCurr = product.currentQuantity + item.quantity;
        const restoredAvail = product.availableQuantity + item.quantity;
        batch.update(doc(db, 'products', product.id), {
          currentQuantity: restoredCurr,
          availableQuantity: restoredAvail,
          status: restoredAvail > 0 ? 'Active' : product.status,
        });
      }
    });

    await batch.commit().catch(err => console.error('deleteInvoice batch error:', err));
    setInvoices(prev => prev.filter(i => i.id !== inv.id));
    setLabJobs(prev => prev.filter(job => job.invoiceNumber !== inv.invoiceNumber));
    setCallReminders(prev => prev.filter(cr => cr.invoiceNumber !== inv.invoiceNumber));
    setProducts(prev => prev.map(p => {
      const invoiceItem = inv.items.find(item => item.barcode === p.barcode || item.productId === p.id);
      if (invoiceItem) {
        const restoredCurr = p.currentQuantity + invoiceItem.quantity;
        const restoredAvail = p.availableQuantity + invoiceItem.quantity;
        return {
          ...p,
          currentQuantity: restoredCurr,
          availableQuantity: restoredAvail,
          status: restoredAvail > 0 ? 'Active' : p.status,
        };
      }
      return p;
    }));
  };

  const backupSystemData = () => {
    const data = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      products,
      customers,
      invoices,
      callReminders,
      labJobs,
      cashClosings,
      suppliers,
      purchaseOrders,
      inventoryAudits,
      importLogs,
    };
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OptiVision_System_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const restoreSystemData = async (jsonContent: string) => {
    try {
      const parsed = JSON.parse(jsonContent);
      if (!parsed || typeof parsed !== 'object') throw new Error('Invalid JSON backup file');

      if (Array.isArray(parsed.products)) setProducts(parsed.products);
      if (Array.isArray(parsed.customers)) setCustomers(parsed.customers);
      if (Array.isArray(parsed.invoices)) setInvoices(parsed.invoices);
      if (Array.isArray(parsed.callReminders)) setCallReminders(parsed.callReminders);
      if (Array.isArray(parsed.labJobs)) setLabJobs(parsed.labJobs);
      if (Array.isArray(parsed.cashClosings)) setCashClosings(parsed.cashClosings);
      if (Array.isArray(parsed.suppliers)) setSuppliers(parsed.suppliers);
      if (Array.isArray(parsed.purchaseOrders)) setPurchaseOrders(parsed.purchaseOrders);

      const batch = writeBatch(db);
      (parsed.products || []).forEach((p: any) => batch.set(doc(db, 'products', p.id), p));
      (parsed.customers || []).forEach((c: any) => batch.set(doc(db, 'customers', c.id), c));
      (parsed.invoices || []).forEach((i: any) => batch.set(doc(db, 'invoices', i.id), i));
      await batch.commit().catch(() => {});
      return true;
    } catch (err: any) {
      console.error('restoreSystemData error:', err);
      throw err;
    }
  };

  // 5. Invoice & Sales POS Operations
  const createInvoice = (data: {
    customerName: string;
    customerPhone: string;
    customerId?: string;
    prescription?: OpticalPrescription;
    items: InvoiceItem[];
    subtotal: number;
    discount: number;
    tax: number;
    grandTotal: number;
    paidAmount: number;
    paymentMethod: Invoice['paymentMethod'];
    splitMethods?: { method: string, amount: number }[];
    salesEmployee: string;
    cashier: string;
    warrantyTerms: string;
    notes?: string;
    deliveryDate?: string;
    needsLabJob?: boolean;
  }): Invoice => {
    const today = new Date().toISOString().split('T')[0];
    const currentYear = new Date().getFullYear();
    const branchCode = activeBranch.code || 'AMM-01';
    const branchPrefix = branchCode.split('-')[0];
    
    const prefix = `INV-${branchPrefix}-${currentYear}-`;
    const branchInvoicesThisYear = invoices.filter(inv => inv.invoiceNumber && inv.invoiceNumber.startsWith(prefix));
    
    let nextSeq = 1;
    if (branchInvoicesThisYear.length > 0) {
      const seqs = branchInvoicesThisYear.map(inv => {
        const parts = inv.invoiceNumber.split('-');
        const numPart = parseInt(parts[parts.length - 1], 10);
        return isNaN(numPart) ? 0 : numPart;
      });
      nextSeq = Math.max(0, ...seqs) + 1;
    }
    const invoiceNum = `${prefix}${nextSeq}`;

    let custId = data.customerId;
    if (!custId) {
      const saved = saveCustomer({
        name: data.customerName,
        phone: data.customerPhone,
      });
      custId = saved.id;
    }

    const invId = `inv-${Date.now()}`;
    const newInvoice: any = {
      id: invId,
      invoiceNumber: invoiceNum,
      invoiceDate: today,
      deliveryDate: data.deliveryDate || today,
      branchId: activeBranch.id,
      salesEmployee: data.salesEmployee || 'Sales Staff',
      cashier: data.cashier || 'Cashier',
      customerId: custId,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      prescription: data.prescription || {
        rightEye: { sph: '0.00', cyl: '0.00', axis: '0' },
        leftEye: { sph: '0.00', cyl: '0.00', axis: '0' },
      },
      items: data.items,
      subtotal: data.subtotal,
      discount: data.discount,
      tax: data.tax,
      grandTotal: data.grandTotal,
      paidAmount: data.paidAmount,
      remainingBalance: Math.max(0, data.grandTotal - data.paidAmount),
      paymentMethod: data.paymentMethod,
      splitMethods: data.splitMethods,
      invoiceStatus: 'Confirmed',
      deliveryStatus: data.needsLabJob
        ? 'Sent to Lab'
        : 'Delivered',
      warrantyTerms: data.warrantyTerms || '12 Months Optical Warranty',
      notes: data.notes,
      createdAt: new Date().toISOString(),
    };

    Object.keys(newInvoice).forEach(key => newInvoice[key] === undefined && delete newInvoice[key]);

    const batch = writeBatch(db);
    batch.set(doc(db, 'invoices', invId), newInvoice);

    // Decrease Product Quantities
    data.items.forEach((item) => {
      const p = products.find((prod) => prod.barcode === item.barcode);
      if (p) {
        const newCurr = Math.max(0, p.currentQuantity - item.quantity);
        const newAvail = Math.max(0, newCurr - p.reservedQuantity);
        const updatedP: Product = {
          ...p,
          currentQuantity: newCurr,
          availableQuantity: newAvail,
          status: newAvail <= 0 ? 'Out of Stock' : newAvail <= p.minimumStock ? 'Low Stock' : 'Active',
          updatedDate: today,
        };
        batch.set(doc(db, 'products', p.id), updatedP);
      }
    });

    // Auto-create Lab Job if needed
    if (data.needsLabJob) {
      const frameItem = data.items.find((i) => i.itemType === 'frame');
      const lensItem = data.items.find((i) => i.itemType === 'lens');
      const labId = `lab-${Date.now()}`;
      const newLabJob: LaboratoryJob = {
        id: labId,
        jobOrderNumber: `JOB-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        invoiceNumber: invoiceNum,
        customerName: data.customerName,
        branchId: activeBranch.id,
        frameBarcode: frameItem ? frameItem.barcode : 'CUSTOMER-FRAME',
        frameDescription: frameItem ? frameItem.description : 'Customer Own Frame',
        rightEyePrescription: `SPH ${data.prescription?.rightEye?.sph || '0.00'} / CYL ${data.prescription?.rightEye?.cyl || '0.00'} / AXIS ${data.prescription?.rightEye?.axis || '0'}`,
        leftEyePrescription: `SPH ${data.prescription?.leftEye?.sph || '0.00'} / CYL ${data.prescription?.leftEye?.cyl || '0.00'} / AXIS ${data.prescription?.leftEye?.axis || '0'}`,
        lensType: lensItem?.lensDetails?.lensType || 'Custom Optical Lens',
        coating: lensItem?.lensDetails?.coating || 'Anti-Reflective Coating',
        status: 'Received at Lab',
        sentDate: today,
        notes: `Lab order created automatically from invoice ${invoiceNum}`,
      };
      batch.set(doc(db, 'labJobs', labId), newLabJob);
    }

    // Auto Call Reminders
    const firstCallDate = data.deliveryDate || today;
    const cr1Id = `cr-${Date.now()}-1`;
    batch.set(doc(db, 'callReminders', cr1Id), {
      id: cr1Id,
      customerId: custId,
      customerName: data.customerName,
      phone: data.customerPhone,
      invoiceNumber: invoiceNum,
      ruleType: 'post_sale_satisfaction',
      scheduledDate: firstCallDate,
      status: 'Pending',
      assignedBranchId: activeBranch.id,
    });

    const dateIn6Months = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const cr2Id = `cr-${Date.now()}-2`;
    batch.set(doc(db, 'callReminders', cr2Id), {
      id: cr2Id,
      customerId: custId,
      customerName: data.customerName,
      phone: data.customerPhone,
      invoiceNumber: invoiceNum,
      ruleType: '6_month_eye_check',
      scheduledDate: dateIn6Months,
      status: 'Pending',
      assignedBranchId: activeBranch.id,
    });

    const hasContactLenses = data.items.some((i) => i.itemType === 'contact_lens');
    if (hasContactLenses) {
      const dateIn1Month = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const cr3Id = `cr-${Date.now()}-3`;
      batch.set(doc(db, 'callReminders', cr3Id), {
        id: cr3Id,
        customerId: custId,
        customerName: data.customerName,
        phone: data.customerPhone,
        invoiceNumber: invoiceNum,
        ruleType: '1_month_contact_lens_reminder',
        scheduledDate: dateIn1Month,
        status: 'Pending',
        assignedBranchId: activeBranch.id,
      });
    }

    batch.commit().catch((err) => console.error('Firestore createInvoice batch error:', err));
    return newInvoice;
  };

  // Settle Remaining Payment
  
  const updateInvoice = (invoiceId: string, updates: Partial<Invoice>) => {
    const inv = invoices.find(i => i.id === invoiceId);
    if (!inv) return;

    // Clean undefined values
    const cleanUpdates = { ...updates };
    Object.keys(cleanUpdates).forEach(key => (cleanUpdates as any)[key] === undefined && delete (cleanUpdates as any)[key]);

    if (cleanUpdates.items) {
      const batch = writeBatch(db);
      const oldItems = inv.items || [];
      const newItems = cleanUpdates.items;
      
      const stockDiff: Record<string, number> = {};
      
      oldItems.forEach(item => {
        if (item.barcode) {
          stockDiff[item.barcode] = (stockDiff[item.barcode] || 0) + item.quantity;
        }
      });
      
      newItems.forEach(item => {
        if (item.barcode) {
          stockDiff[item.barcode] = (stockDiff[item.barcode] || 0) - item.quantity;
        }
      });
      
      Object.keys(stockDiff).forEach(barcode => {
        const diff = stockDiff[barcode];
        if (diff !== 0) {
          const p = products.find(prod => prod.barcode === barcode);
          if (p) {
            const newCurr = Math.max(0, p.currentQuantity + diff);
            const newAvail = Math.max(0, newCurr - p.reservedQuantity);
            const updatedP: Product = {
              ...p,
              currentQuantity: newCurr,
              availableQuantity: newAvail,
              status: newAvail <= 0 ? 'Out of Stock' : newAvail <= p.minimumStock ? 'Low Stock' : 'Active',
              updatedDate: new Date().toISOString().split('T')[0],
            };
            batch.set(doc(db, 'products', p.id), updatedP);
          }
        }
      });
      
      batch.update(doc(db, 'invoices', invoiceId), cleanUpdates);
      batch.commit().catch(err => console.error('Firestore updateInvoice batch error:', err));
    } else {
      updateDoc(doc(db, 'invoices', invoiceId), cleanUpdates).catch((err) =>
        console.error('Firestore updateInvoice error:', err)
      );
    }
  };

  const settleInvoicePayment = (
    invoiceId: string,
    paymentAmount: number,
    paymentMethod?: Invoice['paymentMethod'],
    notes?: string
  ) => {
    const inv = invoices.find((i) => i.id === invoiceId);
    if (!inv) return null;

    const newPaid = Math.min(inv.grandTotal, inv.paidAmount + paymentAmount);
    const newRemaining = Math.max(0, inv.grandTotal - newPaid);
    const isFullyPaid = newRemaining <= 0;

    const updatedInvoice: any = {
      ...inv,
      paidAmount: newPaid,
      remainingBalance: newRemaining,
      paymentMethod: paymentMethod || inv.paymentMethod,
      invoiceStatus: isFullyPaid ? 'Completed' : inv.invoiceStatus,
      deliveryStatus: isFullyPaid ? 'Delivered' : inv.deliveryStatus,
      notes: notes ? `${inv.notes || ''} | [Pickup Payment: +${paymentAmount} JOD] ${notes}` : inv.notes,
    };

    Object.keys(updatedInvoice).forEach(key => updatedInvoice[key] === undefined && delete updatedInvoice[key]);

    const batch = writeBatch(db);
    batch.set(doc(db, 'invoices', invoiceId), updatedInvoice);

    if (isFullyPaid && inv.invoiceNumber) {
      const linkedJob = labJobs.find((j) => j.invoiceNumber === inv.invoiceNumber);
      if (linkedJob) {
        batch.set(doc(db, 'labJobs', linkedJob.id), {
          ...linkedJob,
          status: 'Delivered',
          completedDate: new Date().toISOString().split('T')[0],
        });
      }
    }

    batch.commit().catch((err) => console.error('Firestore settleInvoicePayment batch error:', err));
    return updatedInvoice;
  };

  // Lab Job Status Update
  const updateLabJobStatus = (
    jobId: string,
    status: LaboratoryJob['status'],
    technicianName?: string,
    repairCost?: number,
    notes?: string
  ) => {
    const job = labJobs.find((j) => j.id === jobId);
    if (!job) return;

    const updatedJob: any = {
      ...job,
      status,
    };
    if (technicianName) updatedJob.technicianName = technicianName;
    if (repairCost !== undefined) updatedJob.repairCost = repairCost;
    if (notes) updatedJob.notes = `${job.notes || ''} | ${notes}`;
    
    if (status === 'Delivered' || status === 'Ready for Pickup') {
      updatedJob.completedDate = new Date().toISOString().split('T')[0];
    }
    
    Object.keys(updatedJob).forEach(key => updatedJob[key] === undefined && delete updatedJob[key]);

    const batch = writeBatch(db);
    batch.set(doc(db, 'labJobs', jobId), updatedJob);

    if (job.invoiceNumber) {
      const inv = invoices.find((i) => i.invoiceNumber === job.invoiceNumber);
      if (inv) {
        batch.set(doc(db, 'invoices', inv.id), {
          ...inv,
          deliveryStatus: status === 'Delivered' ? 'Delivered' : status === 'Ready for Pickup' ? 'Dispatched from Lab' : 'Lab In Progress',
        });
      }
    }

    batch.commit().catch((err) => console.error('Firestore updateLabJobStatus batch error:', err));
  };

  const deleteLabJob = async (jobId: string) => {
    const batch = writeBatch(db);
    batch.delete(doc(db, 'labJobs', jobId));
    await batch.commit().catch(err => console.error('deleteLabJob batch error:', err));
    setLabJobs(prev => prev.filter(j => j.id !== jobId));
  };

  // Call Reminder Update
  const updateCallStatus = (
    reminderId: string,
    status: CallReminder['status'],
    agentNotes?: string,
    rescheduleDate?: string
  ) => {
    const r = callReminders.find((rem) => rem.id === reminderId);
    if (!r) return;

    const updated: any = {
      ...r,
      status,
    };
    if (agentNotes) updated.agentNotes = `${r.agentNotes || ''} | ${agentNotes}`;
    updated.callDate = new Date().toLocaleString();
    if (rescheduleDate) updated.scheduledDate = rescheduleDate;

    Object.keys(updated).forEach(key => updated[key] === undefined && delete updated[key]);

    setDoc(doc(db, 'callReminders', reminderId), updated).catch((err) =>
      console.error('Firestore updateCallStatus error:', err)
    );
  };

  // Cash Closing Operation
  const recordCashClosing = (data: Partial<DailyCashClosing>) => {
    const today = new Date().toISOString().split('T')[0];
    const closingId = `cash-${Date.now()}`;
    const newClosing: any = {
      id: closingId,
      branchId: activeBranch.id,
      date: today,
      openingBalance: data.openingBalance || 150,
      cashSales: data.cashSales || 0,
      cardSales: data.cardSales || 0,
      visaSales: data.visaSales || 0,
      cliqSales: data.cliqSales || 0,
      bankTransferSales: data.bankTransferSales || 0,
      insuranceSales: data.insuranceSales || 0,
      expenses: data.expenses || 0,
      expenseDetails: data.expenseDetails || [],
      cashInSafe: data.cashInSafe || 0,
      reconciliationDifference: data.reconciliationDifference || 0,
      closedBy: data.closedBy || 'Branch Cashier',
      status: data.status || 'Closed',
      handoverToAccountant: data.handoverToAccountant,
      notes: data.notes,
    };

    Object.keys(newClosing).forEach(key => newClosing[key] === undefined && delete newClosing[key]);

    setDoc(doc(db, 'cashClosings', closingId), newClosing).catch((err) =>
      console.error('Firestore recordCashClosing error:', err)
    );
  };


  const updateCashClosing = (id: string, updates: Partial<DailyCashClosing>) => {
    const cleanUpdates = { ...updates };
    Object.keys(cleanUpdates).forEach(key => (cleanUpdates as any)[key] === undefined && delete (cleanUpdates as any)[key]);
    updateDoc(doc(db, 'cashClosings', id), cleanUpdates).catch(err => console.error('Firestore updateCashClosing error:', err));
  };

  const deleteCashClosing = (id: string) => {
    deleteDoc(doc(db, 'cashClosings', id)).catch(err => console.error('Firestore deleteCashClosing error:', err));
  };

  const updatePurchaseOrder = (id: string, updates: Partial<PurchaseOrder>) => {
    const cleanUpdates = { ...updates };
    Object.keys(cleanUpdates).forEach(key => (cleanUpdates as any)[key] === undefined && delete (cleanUpdates as any)[key]);
    updateDoc(doc(db, 'purchaseOrders', id), cleanUpdates).catch(err => console.error('Firestore updatePurchaseOrder error:', err));
  };

  const deletePurchaseOrder = (id: string) => {
    deleteDoc(doc(db, 'purchaseOrders', id)).catch(err => console.error('Firestore deletePurchaseOrder error:', err));
  };

  const approveCashHandover = (id: string) => {
    updateDoc(doc(db, 'cashClosings', id), { status: 'Approved' }).catch((err) =>
      console.error('Firestore approveCashHandover error:', err)
    );
  };

  // Supplier Operations
  const saveSupplier = (supplierData: Partial<Supplier>) => {
    const supplierId = supplierData.id || `sup-${Date.now()}`;
    const newSupplier = {
      id: supplierId,
      name: supplierData.name || 'New Supplier',
      contactPerson: supplierData.contactPerson || 'Manager',
      phone: supplierData.phone || '+962 0 000 0000',
      email: supplierData.email || 'info@supplier.com',
      balance: supplierData.balance ?? 0,
      address: supplierData.address || 'Amman, Jordan',
      ...supplierData
    };
    
    setDoc(doc(db, 'suppliers', supplierId), newSupplier).catch((err) =>
      console.error('Firestore saveSupplier error:', err)
    );
  };

  const saveSetting = (settingId: string, value: Record<string, string>) => {
    const newSetting: AppSetting = {
      id: settingId,
      value,
    };
    
    setSettings((prev) => {
      const idx = prev.findIndex((s) => s.id === settingId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = newSetting;
        return copy;
      }
      return [...prev, newSetting];
    });

    setDoc(doc(db, 'settings', settingId), newSetting).catch((err) =>
      console.error('Firestore saveSetting error:', err)
    );
  };

  const savePurchaseOrder = (poData: Partial<PurchaseOrder>) => {
    const poId = poData.id || `po-${Date.now()}`;
    const newPO = {
      id: poId,
      poNumber: poData.poNumber || `PO-${Date.now().toString().slice(-6)}`,
      supplierId: poData.supplierId || '',
      supplierName: poData.supplierName || '',
      orderDate: poData.orderDate || new Date().toISOString().split('T')[0],
      expectedDeliveryDate: poData.expectedDeliveryDate || '',
      status: poData.status || 'Pending',
      items: poData.items || [],
      totalAmount: poData.totalAmount || 0,
      notes: poData.notes || '',
      branchId: activeBranch.id,
      createdBy: currentUser.name || 'Accountant',
      ...poData
    };

    setDoc(doc(db, 'purchaseOrders', poId), newPO).catch((err) =>
      console.error('Firestore savePurchaseOrder error:', err)
    );
  };

  const updatePurchaseOrderStatus = async (poId: string, newStatus: POStatus) => {
    const existingPO = purchaseOrders.find((po) => po.id === poId);
    if (!existingPO) return;
    
    const isReceiving = newStatus === 'Received' && existingPO.status !== 'Received';
    const isReverting = newStatus === 'Pending' && existingPO.status === 'Received';
    
    const updatedPO = { ...existingPO, status: newStatus };
    const batch = writeBatch(db);
    
    batch.set(doc(db, 'purchaseOrders', poId), updatedPO);
    
    if (isReceiving) {
      existingPO.items.forEach(item => {
        const destProduct = products.find(p => p.barcode === item.barcode && p.branchId === existingPO.branchId);
        
        if (destProduct) {
          const newQty = destProduct.currentQuantity + (item.quantityOrdered || 0);
          const newAvailQty = Math.max(0, newQty - destProduct.reservedQuantity);
          const newPurchaseCost = item.unitPrice > 0 ? item.unitPrice : destProduct.purchaseCost;
          
          batch.update(doc(db, 'products', destProduct.id), {
            currentQuantity: newQty,
            availableQuantity: newAvailQty,
            purchaseCost: newPurchaseCost,
            status: newAvailQty > 0 ? 'Active' : 'Out of Stock'
          });
        } else {
          const anyProduct = products.find(p => p.barcode === item.barcode);
          if (anyProduct) {
             const newProductId = `p-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
             const newPurchaseCost = item.unitPrice > 0 ? item.unitPrice : anyProduct.purchaseCost;
             
             batch.set(doc(db, 'products', newProductId), {
               ...anyProduct,
               id: newProductId,
               branchId: existingPO.branchId,
               purchaseCost: newPurchaseCost,
               currentQuantity: item.quantityOrdered || 0,
               availableQuantity: item.quantityOrdered || 0,
               reservedQuantity: 0,
               status: (item.quantityOrdered || 0) > 0 ? 'Active' : 'Out of Stock'
             });
          }
        }
      });
    } else if (isReverting) {
      // Deduct the quantities back
      existingPO.items.forEach(item => {
        const destProduct = products.find(p => p.barcode === item.barcode && p.branchId === existingPO.branchId);
        if (destProduct) {
          const newQty = Math.max(0, destProduct.currentQuantity - (item.quantityOrdered || 0));
          const newAvailQty = Math.max(0, newQty - destProduct.reservedQuantity);
          batch.update(doc(db, 'products', destProduct.id), {
            currentQuantity: newQty,
            availableQuantity: newAvailQty,
            status: newAvailQty > 0 ? 'Active' : 'Out of Stock'
          });
        }
      });
    }

    try {
      await batch.commit();
    } catch (err) {
      console.error('Firestore updatePurchaseOrderStatus error:', err);
    }
  };

  // Reset Demo Data
  const resetDemoData = async () => {
    localStorage.removeItem('erp_data_purged');
    setProducts(INITIAL_PRODUCTS);
    setCustomers(INITIAL_CUSTOMERS);
    setInvoices(INITIAL_INVOICES);
    setCallReminders(INITIAL_CALL_REMINDERS);
    setLabJobs(INITIAL_LAB_JOBS);
    setCashClosings(INITIAL_CASH_CLOSINGS);
    setSuppliers(INITIAL_SUPPLIERS);
    setPurchaseOrders(INITIAL_PURCHASE_ORDERS);

    const batch = writeBatch(db);
    INITIAL_PRODUCTS.forEach((p) => batch.set(doc(db, 'products', p.id), p));
    INITIAL_CUSTOMERS.forEach((c) => batch.set(doc(db, 'customers', c.id), c));
    INITIAL_INVOICES.forEach((i) => batch.set(doc(db, 'invoices', i.id), i));
    INITIAL_CALL_REMINDERS.forEach((cr) => batch.set(doc(db, 'callReminders', cr.id), cr));
    INITIAL_LAB_JOBS.forEach((lj) => batch.set(doc(db, 'labJobs', lj.id), lj));
    INITIAL_CASH_CLOSINGS.forEach((cc) => batch.set(doc(db, 'cashClosings', cc.id), cc));
    INITIAL_SUPPLIERS.forEach((s) => batch.set(doc(db, 'suppliers', s.id), s));
    INITIAL_PURCHASE_ORDERS.forEach((po) => batch.set(doc(db, 'purchaseOrders', po.id), po));
    await batch.commit().catch((err) => console.error('resetDemoData batch error:', err));
  };

  // Purge Database completely
  const purgeDatabase = async () => {
    localStorage.setItem('erp_data_purged', 'true');

    // Instantly wipe local React state so UI cleans immediately
    setProducts([]);
    setCustomers([]);
    setInvoices([]);
    setCallReminders([]);
    setLabJobs([]);
    setCashClosings([]);
    setImportLogs([]);
    setSuppliers([]);
    setPurchaseOrders([]);
    setInventoryAudits([]);

    const collectionsToPurge = [
      'products',
      'customers',
      'invoices',
      'callReminders',
      'labJobs',
      'cashClosings',
      'importLogs',
      'suppliers',
      'purchaseOrders',
      'inventoryAudits',
    ];

    try {
      for (const collName of collectionsToPurge) {
        const querySnapshot = await getDocs(collection(db, collName));
        if (!querySnapshot.empty) {
          const docs = querySnapshot.docs;
          for (let i = 0; i < docs.length; i += 400) {
            const chunk = docs.slice(i, i + 400);
            const batch = writeBatch(db);
            chunk.forEach((docSnap) => batch.delete(docSnap.ref));
            await batch.commit();
          }
        }
      }
      console.log('Database successfully purged & reset to fresh state.');
    } catch (err) {
      console.error('Firestore purgeDatabase error:', err);
    }
  };

  const updateDeliveryStatus = (invoiceId: string, status: DeliveryStatus) => {
    const inv = invoices.find((i) => i.id === invoiceId);
    if (!inv) return;
    const updated: any = { ...inv, deliveryStatus: status };
    if (status === 'Delivered') updated.invoiceStatus = 'Completed';
    Object.keys(updated).forEach(key => updated[key] === undefined && delete updated[key]);

    const batch = writeBatch(db);
    batch.set(doc(db, 'invoices', invoiceId), updated);

    if (status === 'Delivered' && inv.invoiceNumber) {
      const linkedJob = labJobs.find(j => j.invoiceNumber === inv.invoiceNumber);
      if (linkedJob) {
        batch.set(doc(db, 'labJobs', linkedJob.id), {
          ...linkedJob,
          status: 'Delivered',
          completedDate: new Date().toISOString().split('T')[0]
        });
      }
    }

    batch.commit().catch((err) =>
      console.error('Firestore updateDeliveryStatus error:', err)
    );
  };

  const createInventoryAudit = (branchId: string, createdBy: string) => {
    const auditId = `audit-${Date.now()}`;
    const branchProducts = products.filter(p => p.branchId === branchId && p.status !== 'Out of Stock');
    
    const items: InventoryAuditItem[] = branchProducts.map(p => ({
      productId: p.id,
      barcode: p.barcode,
      brand: p.brand,
      model: p.model,
      expectedQuantity: p.currentQuantity,
      actualQuantity: 0,
      status: 'Pending'
    }));

    const newAudit: InventoryAudit = {
      id: auditId,
      branchId,
      createdDate: new Date().toISOString(),
      createdBy,
      status: 'In Progress',
      items
    };

    setDoc(doc(db, 'inventoryAudits', auditId), newAudit).catch(err => 
      console.error('Firestore createInventoryAudit error:', err)
    );
  };

  const updateInventoryAuditItem = (auditId: string, productId: string, status: InventoryAuditItem['status'], actualQuantity: number) => {
    const audit = inventoryAudits.find(a => a.id === auditId);
    if (!audit) return;

    const updatedItems = audit.items.map(item => 
      item.productId === productId ? { ...item, status, actualQuantity } : item
    );

    const updatedAudit = { ...audit, items: updatedItems };

    setDoc(doc(db, 'inventoryAudits', auditId), updatedAudit).catch(err => 
      console.error('Firestore updateInventoryAuditItem error:', err)
    );
  };

  const scanInventoryAuditItem = (auditId: string, barcode: string, increment: number = 1) => {
    const audit = inventoryAudits.find(a => a.id === auditId);
    if (!audit) return { success: false, message: 'Audit not found' };

    const itemIndex = audit.items.findIndex(i => i.barcode.toLowerCase() === barcode.toLowerCase());
    
    if (itemIndex >= 0) {
      const item = audit.items[itemIndex];
      const newActual = item.actualQuantity + increment;
      let newStatus: InventoryAuditItem['status'] = 'Pending';
      if (newActual === item.expectedQuantity) newStatus = 'Present';
      else if (newActual < item.expectedQuantity) newStatus = 'Missing';
      else newStatus = 'Extra';

      const updatedItems = [...audit.items];
      updatedItems[itemIndex] = { ...item, actualQuantity: newActual, status: newStatus };

      setDoc(doc(db, 'inventoryAudits', auditId), { ...audit, items: updatedItems }).catch(err => 
        console.error('Firestore scanInventoryAuditItem error:', err)
      );
      return { success: true, message: `Updated: ${item.brand} ${item.model} (Qty: ${newActual})` };
    } else {
      const product = products.find(p => p.barcode.toLowerCase() === barcode.toLowerCase());
      if (product) {
         const newItem: InventoryAuditItem = {
           productId: product.id,
           barcode: product.barcode,
           brand: product.brand,
           model: product.model,
           expectedQuantity: 0,
           actualQuantity: increment,
           status: 'Extra'
         };
         setDoc(doc(db, 'inventoryAudits', auditId), { ...audit, items: [...audit.items, newItem] });
         return { success: true, message: `Added Extra: ${product.brand} ${product.model} (Qty: ${increment})` };
      }
      return { success: false, message: 'Barcode not found in system' };
    }
  };

  const completeInventoryAudit = (auditId: string, completedBy: string) => {
    const audit = inventoryAudits.find(a => a.id === auditId);
    if (!audit) return;

    const batch = writeBatch(db);

    const updatedItems = audit.items.map(item => {
      const isUncheckedPending = item.status === 'Pending';
      const finalStatus = isUncheckedPending ? ('Missing' as const) : item.status;
      const finalQty = isUncheckedPending ? 0 : item.actualQuantity;

      const finalItem = {
        ...item,
        status: finalStatus,
        actualQuantity: finalQty,
      };

      // Sync physical count to system product inventory
      const product = products.find(p => p.id === item.productId || p.barcode === item.barcode);
      if (product) {
        const pRef = doc(db, 'products', product.id);
        batch.update(pRef, {
          currentQuantity: finalQty,
          status: finalQty <= 0 ? 'Out of Stock' : (product.status === 'Out of Stock' ? 'Available' : product.status)
        });
      }

      return finalItem;
    });

    const updatedAudit: InventoryAudit = {
      ...audit,
      status: 'Completed',
      completedDate: new Date().toISOString(),
      completedBy,
      items: updatedItems,
    };

    batch.set(doc(db, 'inventoryAudits', auditId), updatedAudit);
    batch.commit().catch(err => console.error('Firestore completeInventoryAudit batch error:', err));
  };

  return {
    users,
    currentUser,
    setCurrentUserId,
    saveUserAccount,
    toggleUserStatus,
    deleteUserAccount,
    branches,
    saveBranch,
    deleteBranch,
    activeBranchId,
    setActiveBranchId,
    activeBranch,
    products,
    saveProduct,
    deleteProduct,
    deleteProductsBatch,
    transferInventoryItems,
    importExcelStock,
    customers,
    saveCustomer,
    deleteCustomer,
    invoices,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    backupSystemData,
    restoreSystemData,
    settleInvoicePayment,
    updateDeliveryStatus,
    callReminders,
    updateCallStatus,
    labJobs,
    updateLabJobStatus,
    deleteLabJob,
    cashClosings,
    recordCashClosing,
    updateCashClosing,
    deleteCashClosing,
    approveCashHandover,
    importLogs,
    suppliers,
    saveSupplier,
    purchaseOrders,
    savePurchaseOrder,
    updatePurchaseOrder,
    deletePurchaseOrder,
    settings,
    saveSetting,
    updatePurchaseOrderStatus,
    resetDemoData,
    purgeDatabase,
    isFirestoreConnected,
    inventoryAudits,
    createInventoryAudit,
    updateInventoryAuditItem,
    scanInventoryAuditItem,
    completeInventoryAudit,
  };
}
