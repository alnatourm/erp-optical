import React, { useState, useMemo, useEffect } from 'react';
import {
  Receipt,
  Scan,
  Plus,
  Trash2,
  CheckCircle2,
  Printer,
  Glasses,
  User,
  UserPlus,
  Phone,
  Calendar,
  Building2,
  Search,
  DollarSign,
  FileText,
  Clock,
  Sparkles,
  History,
  HandCoins,
  PackageCheck,
  AlertCircle,
  X,
  Filter,
  RotateCcw,
  Lock,
  ChevronDown,
} from 'lucide-react';
import {
  Branch,
  Product,
  Customer,
  Invoice,
  InvoiceItem,
  OpticalPrescription,
  PaymentMethod,
  DeliveryStatus,
  UserAccount,
} from '../types';
import { useLanguage } from '../lib/i18n';
import { InvoiceReceiptModal } from './InvoiceReceiptModal';

interface SalesInvoiceModuleProps {
  currentUser?: UserAccount;
  users?: UserAccount[];
  branches: Branch[];
  activeBranch: Branch;
  products: Product[];
  customers: Customer[];
  invoices?: Invoice[];
  onCreateInvoice: (data: any) => Invoice;
  onDeleteInvoice?: (invoiceId: string) => void;
  onSettlePayment?: (
    invoiceId: string,
    paymentAmount: number,
    paymentMethod?: PaymentMethod,
    notes?: string
  ) => Invoice | null;
  onUpdateDeliveryStatus?: (invoiceId: string, status: DeliveryStatus) => void;
  onSaveCustomer?: (customer: Partial<Customer> & { name: string; phone: string }) => Customer;
  invoiceToEdit?: Invoice | null;
  onClearEdit?: () => void;
  onUpdateInvoice?: (id: string, updates: Partial<Invoice>) => void;
}

export const SalesInvoiceModule: React.FC<SalesInvoiceModuleProps> = ({
  branches,
  activeBranch,
  products,
  customers,
  invoices = [],
  onCreateInvoice,
  onDeleteInvoice,
  onSettlePayment,
  onUpdateDeliveryStatus,
  onSaveCustomer,
  currentUser,
  users = [],
  invoiceToEdit,
  onClearEdit,
  onUpdateInvoice,
}) => {
  const { lang, t } = useLanguage();
  const [activeSubTab, setActiveSubTab] = useState<'new_sale' | 'invoice_history'>('new_sale');

  // Tax Rate State (Default 0% - Tax removed completely)
  const [taxRate, setTaxRate] = useState<number>(0);

  // Discount Approval State
  const [discountApprovalOpen, setDiscountApprovalOpen] = useState(false);
  const [pendingDiscount, setPendingDiscount] = useState<{ index: number, value: number } | null>(null);
  const [adminPin, setAdminPin] = useState('');
  const [pinError, setPinError] = useState('');

  // Customer Info (Starts empty for fresh sale)
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerSearchQuery, setCustomerSearchQuery] = useState<string>('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState<boolean>(false);
  
  // Create New Customer Modal State
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState<boolean>(false);
  const [newCustName, setNewCustName] = useState<string>('');
  const [newCustPhone, setNewCustPhone] = useState<string>('');
  const [newCustNotes, setNewCustNotes] = useState<string>('');

  // Product Search & Barcode Filter State
  const [productSearchQuery, setProductSearchQuery] = useState<string>('');
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('all');
  const [showProductDropdown, setShowProductDropdown] = useState<boolean>(false);

  const [deliveryDate, setDeliveryDate] = useState<string>(
    new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [salesEmployee, setSalesEmployee] = useState<string>(currentUser?.fullName || 'Khalid Othman');
  const [cashier, setCashier] = useState<string>(currentUser?.fullName || 'Muna Al-Fayez');

  // Filter registered customers based on search query
  const filteredCustomersList = useMemo(() => {
    const q = customerSearchQuery.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.barcode && c.barcode.toLowerCase().includes(q)) ||
        (c.secondaryPhone && c.secondaryPhone.includes(q))
    );
  }, [customers, customerSearchQuery]);

  // Keep sales employee & cashier strictly locked to currently logged-in staff user
  React.useEffect(() => {
    if (currentUser?.fullName) {
      setSalesEmployee(currentUser.fullName);
      setCashier(currentUser.fullName);
    }
  }, [currentUser]);

  // Prescription State (Starts empty for fresh sale)
  const [rightSph, setRightSph] = useState<string>('');
  const [rightCyl, setRightCyl] = useState<string>('');
  const [rightAxis, setRightAxis] = useState<string>('');

  const [leftSph, setLeftSph] = useState<string>('');
  const [leftCyl, setLeftCyl] = useState<string>('');
  const [leftAxis, setLeftAxis] = useState<string>('');

  const [addVal, setAddVal] = useState<string>('');
  const [aVal, setAVal] = useState<string>('');
  const [bVal, setBVal] = useState<string>('');
  const [cVal, setCVal] = useState<string>('');
  const [ipdVal, setIpdVal] = useState<string>('');
  const [optometristName, setOptometristName] = useState<string>('');

  // Notification for prescription actions
  const [rxMessage, setRxMessage] = useState<{ type: 'success' | 'info' | 'warning'; text: string } | null>(null);

  // Items State (1 clean row ready for barcode scan or manual typing)
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      barcode: '',
      description: '',
      itemType: 'frame',
      price: 0,
      quantity: 1,
      discount: 0,
      total: 0,
    },
  ]);

  // Payment & Financials
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [splitMethods, setSplitMethods] = useState<{method: string, amount: number}[]>([
    { method: 'Cash', amount: 0 },
    { method: 'Visa', amount: 0 }
  ]);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [warrantyTerms, setWarrantyTerms] = useState<string>('12 Months Frame & Lens Coating Warranty');
  const [notes, setNotes] = useState<string>('');
  const [needsLabJob, setNeedsLabJob] = useState<boolean>(false);

  useEffect(() => {
    if (invoiceToEdit) {
      setActiveSubTab('new_sale');
      setCustomerName(invoiceToEdit.customerName || '');
      setCustomerPhone(invoiceToEdit.customerPhone || '');
      setSelectedCustomerId(invoiceToEdit.customerId || '');
      
      setDeliveryDate(invoiceToEdit.deliveryDate || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      setSalesEmployee(invoiceToEdit.salesEmployee || currentUser?.fullName || '');
      setCashier(invoiceToEdit.cashier || currentUser?.fullName || '');
      
      if (invoiceToEdit.prescription) {
        setRightSph(invoiceToEdit.prescription.rightEye?.sph || '');
        setRightCyl(invoiceToEdit.prescription.rightEye?.cyl || '');
        setRightAxis(invoiceToEdit.prescription.rightEye?.axis || '');
        setLeftSph(invoiceToEdit.prescription.leftEye?.sph || '');
        setLeftCyl(invoiceToEdit.prescription.leftEye?.cyl || '');
        setLeftAxis(invoiceToEdit.prescription.leftEye?.axis || '');
        setAddVal(invoiceToEdit.prescription.add || '');
        setAVal(invoiceToEdit.prescription.a || '');
        setBVal(invoiceToEdit.prescription.b || '');
        setCVal(invoiceToEdit.prescription.c || '');
        setIpdVal(invoiceToEdit.prescription.ipd || '');
        setOptometristName(invoiceToEdit.prescription.optometristName || '');
      } else {
        // Reset prescription
        setRightSph(''); setRightCyl(''); setRightAxis('');
        setLeftSph(''); setLeftCyl(''); setLeftAxis('');
        setAddVal(''); setAVal(''); setBVal(''); setCVal(''); setIpdVal(''); setOptometristName('');
      }

      setItems(invoiceToEdit.items || []);
      setPaymentMethod(invoiceToEdit.paymentMethod || 'Cash');
      if (invoiceToEdit.paymentMethod === 'Split' && invoiceToEdit.splitMethods) {
         setSplitMethods(invoiceToEdit.splitMethods);
      } else {
         setSplitMethods([{ method: 'Cash', amount: 0 }, { method: 'Visa', amount: 0 }]);
      }
      setPaidAmount(invoiceToEdit.paidAmount || 0);
      setWarrantyTerms(invoiceToEdit.warrantyTerms || '12 Months Frame & Lens Coating Warranty');
      setNotes(invoiceToEdit.notes || '');
      setNeedsLabJob(invoiceToEdit.needsLabJob || false);
    }
  }, [invoiceToEdit]);


  useEffect(() => {
    if (paymentMethod === 'Split') {
      if (splitMethods[0].amount + splitMethods[1].amount !== paidAmount) {
        setSplitMethods([
          { method: splitMethods[0].method, amount: paidAmount - splitMethods[1].amount },
          { method: splitMethods[1].method, amount: splitMethods[1].amount }
        ]);
      }
    }
  }, [paidAmount, paymentMethod]);

  useEffect(() => {
    // Automatically set lab job requirement if there are optical lenses
    const hasOpticalLens = items.some(i => i.itemType === 'lens');
    if (hasOpticalLens) {
      setNeedsLabJob(true);
    }
  }, [items]);

  // Invoice Receipt Modal View
  const [createdInvoice, setCreatedInvoice] = useState<Invoice | null>(null);

  // Invoice History State
  const [historySearch, setHistorySearch] = useState('');
  const [historyFilter, setHistoryFilter] = useState<'all' | 'pending_balance' | 'ready_pickup' | 'completed'>('all');

  // Settlement Modal State
  const [selectedInvoiceToSettle, setSelectedInvoiceToSettle] = useState<Invoice | null>(null);
  const [settleAmount, setSettleAmount] = useState<number>(0);
  const [settlePaymentMethod, setSettlePaymentMethod] = useState<PaymentMethod>('Cash');
  const [settleNotes, setSettleNotes] = useState<string>('Paid rest upon pickup of finished optical order.');

  // Clear prescription fields specifically
  const clearPrescriptionFields = () => {
    setRightSph('');
    setRightCyl('');
    setRightAxis('');
    setLeftSph('');
    setLeftCyl('');
    setLeftAxis('');
    setAddVal('');
    setAVal('');
    setBVal('');
    setCVal('');
    setIpdVal('');
    setOptometristName('');
    setRxMessage(null);
  };

  // Reset entire POS form for a fresh new invoice
  const handleResetForm = () => {
    setCustomerName('');
    setCustomerPhone('');
    setSelectedCustomerId('');
    setCustomerSearchQuery('');
    setShowCustomerDropdown(false);
    setDeliveryDate(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setSalesEmployee(currentUser?.fullName || 'Khalid Othman');
    setCashier(currentUser?.fullName || 'Muna Al-Fayez');
    clearPrescriptionFields();
    setItems([
      {
        barcode: '',
        description: '',
        itemType: 'frame',
        price: 0,
        quantity: 1,
        discount: 0,
        total: 0,
      },
    ]);
    setPaymentMethod('Cash');
    setPaidAmount(0);
    setNotes('');
    setWarrantyTerms('12 Months Frame & Lens Coating Warranty');
  };

  // Select Customer from search dropdown
  const handleSelectCustomerFromSearch = (c: Customer) => {
    handleSelectCustomer(c);
    setCustomerSearchQuery(`${c.name} (${c.phone})`);
    setShowCustomerDropdown(false);
  };

  // Create New Customer Handler
  const handleCreateNewCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim() || !newCustPhone.trim()) {
      alert(
        lang === 'ar'
          ? 'يرجى كتابة اسم العميل ورقم الهاتف على الأقل.'
          : 'Please enter customer name and phone number.'
      );
      return;
    }

    let savedCust: Customer;
    if (onSaveCustomer) {
      savedCust = onSaveCustomer({
        name: newCustName.trim(),
        phone: newCustPhone.trim(),
        notes: newCustNotes.trim(),
      });
    } else {
      const generatedId = `c-${Date.now()}`;
      savedCust = {
        id: generatedId,
        name: newCustName.trim(),
        phone: newCustPhone.trim(),
        notes: newCustNotes.trim(),
        loyaltyPoints: 10,
        membershipLevel: 'Standard',
        createdAt: new Date().toISOString(),
      };
    }

    setCustomerName(savedCust.name);
    setCustomerPhone(savedCust.phone);
    setSelectedCustomerId(savedCust.id);
    setCustomerSearchQuery(`${savedCust.name} (${savedCust.phone})`);
    setIsNewCustomerModalOpen(false);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustNotes('');

    setRxMessage({
      type: 'success',
      text: lang === 'ar'
        ? `تم إنشاء وتعبئة العميل الجديد (${savedCust.name}) بنجاح.`
        : `New customer (${savedCust.name}) created and filled in invoice successfully.`
    });
  };

  // Quick Existing Customer Selection
  const handleSelectCustomer = (c: Customer) => {
    setSelectedCustomerId(c.id);
    setCustomerName(c.name);
    setCustomerPhone(c.phone);

    // Keep prescription & item fields empty for new invoice as requested
    clearPrescriptionFields();

    // Check if customer has any previous invoice with a prescription
    const customerInvoices = invoices.filter(
      (inv) => inv.customerId === c.id || inv.customerPhone === c.phone || (c.name && inv.customerName.toLowerCase() === c.name.toLowerCase())
    );

    const matchWithRx = customerInvoices.find((i) => i.prescription && (i.prescription.rightEye?.sph || i.prescription.leftEye?.sph));

    if (matchWithRx) {
      setRxMessage({
        type: 'info',
        text: lang === 'ar'
          ? `تم اختيار العميل (${c.name}). بقيت الحقول فارغة لفاتورة جديدة. يمكنك النقر فوق "استدعاء أحدث فحص نظر" لاستعادة فحص العميل السابق.`
          : `Selected ${c.name}. Prescription fields cleared for new invoice. Click "Load Last Prescription" to restore their previous Rx.`
      });
    } else {
      setRxMessage({
        type: 'info',
        text: lang === 'ar'
          ? `تم اختيار العميل (${c.name}). الحقول فارغة وتعد جاهزة لإدخال الفاتورة الجديدة.`
          : `Selected ${c.name}. Form fields are ready for the new invoice.`
      });
    }
  };

  // Load Previous Prescription on Demand
  const handleLoadPreviousPrescription = () => {
    if (!customerName && !customerPhone && !selectedCustomerId) {
      setRxMessage({
        type: 'warning',
        text: lang === 'ar'
          ? 'يرجى إدخال اسم العميل أو اختيار عميل مسجل أولاً لاستدعاء فحص النظر السابق.'
          : 'Please select or enter a customer first to load their previous prescription.'
      });
      return;
    }

    const customerInvoices = invoices
      .filter((inv) => {
        if (selectedCustomerId && inv.customerId === selectedCustomerId) return true;
        if (customerPhone && customerPhone.trim().length > 3 && inv.customerPhone === customerPhone.trim()) return true;
        if (customerName && customerName.trim().length > 2 && inv.customerName.toLowerCase() === customerName.trim().toLowerCase()) return true;
        return false;
      })
      .sort((a, b) => new Date(b.invoiceDate || b.createdAt).getTime() - new Date(a.invoiceDate || a.createdAt).getTime());

    const matchWithRx = customerInvoices.find(
      (inv) => inv.prescription && (inv.prescription.rightEye?.sph || inv.prescription.leftEye?.sph)
    );

    if (matchWithRx && matchWithRx.prescription) {
      const rx = matchWithRx.prescription;
      setRightSph(rx.rightEye?.sph || '');
      setRightCyl(rx.rightEye?.cyl || '');
      setRightAxis(rx.rightEye?.axis || '');
      setLeftSph(rx.leftEye?.sph || '');
      setLeftCyl(rx.leftEye?.cyl || '');
      setLeftAxis(rx.leftEye?.axis || '');
      setAddVal(rx.add || '');
      setAVal(rx.a || '');
      setBVal(rx.b || '');
      setCVal(rx.c || '');
      setIpdVal(rx.ipd || '');
      if (rx.optometristName) setOptometristName(rx.optometristName);

      setRxMessage({
        type: 'success',
        text: lang === 'ar'
          ? `تم استدعاء فحص النظر بنجاح من طلب سابق رقم #${matchWithRx.invoiceNumber} بتاريخ (${matchWithRx.invoiceDate})`
          : `Successfully loaded Rx from previous order #${matchWithRx.invoiceNumber} (${matchWithRx.invoiceDate})`
      });
    } else {
      setRxMessage({
        type: 'warning',
        text: lang === 'ar'
          ? 'لم يتم العثور على فحص نظر سابق مسجل لهذا العميل.'
          : 'No previous prescription found for this customer.'
      });
    }
  };

  // Products available strictly in active branch
  const branchProducts = products.filter((p) => p.branchId === activeBranch.id);

  // Filtered branch products for fast search & barcode lookup
  const filteredBranchProducts = useMemo(() => {
    return branchProducts.filter((p) => {
      if (productCategoryFilter !== 'all' && p.frameType !== productCategoryFilter) {
        return false;
      }
      const q = productSearchQuery.trim().toLowerCase();
      if (!q) return true;
      const barcodeMatch = p.barcode ? p.barcode.toLowerCase().includes(q) : false;
      const brandMatch = p.brand ? p.brand.toLowerCase().includes(q) : false;
      const modelMatch = p.model ? p.model.toLowerCase().includes(q) : false;
      const colorMatch = p.color ? p.color.toLowerCase().includes(q) : false;
      return barcodeMatch || brandMatch || modelMatch || colorMatch;
    });
  }, [branchProducts, productCategoryFilter, productSearchQuery]);

  // Handler to add product from quick search bar / dropdown
  const handleAddProductToInvoice = (p: Product) => {
    const newRow: InvoiceItem = {
      barcode: p.barcode,
      description: `${p.brand} - ${p.model}`,
      itemType:
        p.frameType === 'Ophthalmic Lens'
          ? 'lens'
          : p.frameType === 'Contact Lens'
          ? 'contact_lens'
          : 'frame',
      price: p.sellingPrice,
      quantity: 1,
      discount: 0,
      total: p.sellingPrice,
      productId: p.id,
    };
    setItems((prev) => {
      if (prev.length === 1 && !prev[0].barcode && !prev[0].description) {
        return [newRow];
      }
      return [...prev, newRow];
    });
    setProductSearchQuery('');
    setShowProductDropdown(false);
  };

  // Handler on Enter key in Product / Barcode Search Input
  const handleProductSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const q = productSearchQuery.trim();
      if (!q) return;

      const exactBarcodeMatch = branchProducts.find(
        (p) => p.barcode.toLowerCase() === q.toLowerCase()
      );

      if (exactBarcodeMatch) {
        handleAddProductToInvoice(exactBarcodeMatch);
      } else if (filteredBranchProducts.length > 0) {
        handleAddProductToInvoice(filteredBranchProducts[0]);
      } else {
        alert(
          lang === 'ar'
            ? `عذراً، لم يتم العثور على أي صنف يطابق الباركود أو الاسم "${q}" في مخزون الفرع الحالي.`
            : `No product found matching barcode or name "${q}" in branch stock.`
        );
      }
    }
  };

  const getAutoItemType = (barcode: string): InvoiceItem['itemType'] | null => {
    if (barcode.startsWith('1') || barcode.startsWith('2')) return 'frame';
    if (barcode.startsWith('3')) return 'contact_lens';
    if (barcode.startsWith('4')) return 'lens';
    if (barcode.startsWith('5')) return 'service';
    return null;
  };

  // Barcode Auto Lookup on Typing / Scanning (Allows full manual typing without interrupting popups)
  const handleBarcodeChange = (index: number, newBarcode: string) => {
    const updated = [...items];
    const cleanBarcode = newBarcode.trim();

    updated[index].barcode = cleanBarcode;

    if (!cleanBarcode) {
      updated[index].description = '';
      updated[index].price = 0;
      updated[index].productId = undefined;
      updated[index].total = 0;
      setItems(updated);
      return;
    }

    const autoType = getAutoItemType(cleanBarcode);

    // Search product strictly inside active branch inventory
    const foundInBranch = branchProducts.find((p) => p.barcode === cleanBarcode);

    if (foundInBranch) {
      updated[index].description = `${foundInBranch.brand} - ${foundInBranch.model}`;
      updated[index].price = foundInBranch.sellingPrice;
      updated[index].itemType = autoType || (
        foundInBranch.frameType === 'Ophthalmic Lens'
          ? 'lens'
          : foundInBranch.frameType === 'Contact Lens'
          ? 'contact_lens'
          : foundInBranch.frameType === 'Service'
          ? 'service'
          : 'frame'
      );
      updated[index].productId = foundInBranch.id;
      updated[index].total =
        foundInBranch.sellingPrice * updated[index].quantity - updated[index].discount;
    } else {
      // Allow manual typing without clearing or throwing popups during keypresses
      updated[index].productId = undefined;
      if (autoType) {
        updated[index].itemType = autoType;
      }
    }

    setItems(updated);
  };

  // Manual explicit lookup trigger (e.g. on Enter key or button click)
  const handleLookupBarcodeExplicit = (index: number) => {
    const cleanBarcode = items[index].barcode.trim();
    if (!cleanBarcode) return;

    const foundInBranch = branchProducts.find((p) => p.barcode === cleanBarcode);
    if (foundInBranch) {
      handleBarcodeChange(index, cleanBarcode);
      return;
    }

    const foundInOtherBranch = products.find((p) => p.barcode === cleanBarcode);
    if (foundInOtherBranch) {
      const ownerBranch = branches.find((b) => b.id === foundInOtherBranch.branchId)?.name || foundInOtherBranch.branchId;
      alert(
        lang === 'ar'
          ? `❌ تنبيه مخزون الفرع: المنتج [${foundInOtherBranch.brand} - ${foundInOtherBranch.model}] ذو الباركود (${cleanBarcode}) موجود في فرع [${ownerBranch}] وليس في فرعك الحالي [${activeBranch.name}].`
          : `❌ Branch Inventory Alert: Item (${cleanBarcode}) belongs to branch [${ownerBranch}], NOT active branch [${activeBranch.name}].`
      );
    } else {
      alert(
        lang === 'ar'
          ? `⚠️ الباركود [${cleanBarcode}] غير مسجل في قاعدة بيانات الفرع (${activeBranch.name}). يمكنك إدخال اسم الوصف والسعر يدوياً.`
          : `⚠️ Product barcode [${cleanBarcode}] not found in ${activeBranch.name}. You can enter description and price manually.`
      );
    }
  };

  const handleUpdateItemRow = (index: number, field: keyof InvoiceItem, val: any) => {
    if (field === 'discount' && val > (items[index].discount || 0)) {
      const isAuthorized = currentUser?.role === 'admin' || currentUser?.role === 'accountant';
      if (!isAuthorized) {
        setPendingDiscount({ index, value: val });
        setAdminPin('');
        setPinError('');
        setDiscountApprovalOpen(true);
        return;
      }
    }

    const updated = [...items];
    (updated[index] as any)[field] = val;

    // Recalculate total
    const price = Number(updated[index].price) || 0;
    const qty = Number(updated[index].quantity) || 1;
    const disc = Number(updated[index].discount) || 0;
    updated[index].total = Math.max(0, price * qty - disc);

    setItems(updated);
  };

  const handleApproveDiscount = () => {
    const authorizedUser = users.find(u => 
      (u.role === 'admin' || u.role === 'accountant') && u.pin === adminPin
    );

    if (authorizedUser) {
      if (pendingDiscount) {
        const { index, value } = pendingDiscount;
        const updated = [...items];
        updated[index].discount = value;
        const price = Number(updated[index].price) || 0;
        const qty = Number(updated[index].quantity) || 1;
        updated[index].total = Math.max(0, price * qty - value);
        setItems(updated);
      }
      setDiscountApprovalOpen(false);
      setPendingDiscount(null);
    } else {
      setPinError(lang === 'ar' ? 'رمز التعريف الشخصي (PIN) غير صحيح أو لا توجد صلاحية' : 'Incorrect PIN or unauthorized');
    }
  };

  const handleAddItemRow = () => {
    setItems((prev) => [
      ...prev,
      {
        barcode: '',
        description: 'Frame / Optical Item',
        itemType: 'frame',
        price: 0,
        quantity: 1,
        discount: 0,
        total: 0,
      },
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalDiscount = items.reduce((sum, item) => sum + item.discount, 0);
  const netSubtotal = Math.max(0, subtotal - totalDiscount);
  const taxAmount = Math.round(netSubtotal * (taxRate / 100) * 100) / 100; // Sales Tax based on active taxRate (0% or 16%)
  const grandTotal = netSubtotal + taxAmount;
  const remainingBalance = Math.max(0, grandTotal - paidAmount);

  // Prevent Enter Key from submitting the form across input fields
  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter') {
      const target = e.target as HTMLElement;
      // Prevent Enter key from submitting the form unless explicitly clicking submit button
      if (target.tagName !== 'TEXTAREA' && target.getAttribute('type') !== 'submit') {
        e.preventDefault();
      }
    }
  };

  // Submit Invoice Form
  const handleSubmitInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert(lang === 'ar' ? 'يرجى إضافة صنف واحد على الأقل للفاتورة.' : 'Please add at least one item to the invoice.');
      return;
    }

    // Strict validation: Every item must be valid and exist in current branch inventory
    for (let i = 0; i < items.length; i++) {
      const row = items[i];
      if (!row.description.trim()) {
        alert(
          lang === 'ar'
            ? `يرجى إدخال اسم أو وصف الصنف في الصف رقم #${i + 1}.`
            : `Please enter description for item #${i + 1}.`
        );
        return;
      }

      if (row.barcode.trim()) {
        const isCustomOrderType = row.itemType === 'lens' || row.itemType === 'contact_lens' || row.barcode.trim().startsWith('3') || row.barcode.trim().startsWith('4');
        
        const matchInBranch = branchProducts.find((p) => p.barcode === row.barcode.trim() || p.id === row.productId);
        if (!matchInBranch) {
          const matchInOther = products.find((p) => p.barcode === row.barcode.trim());
          if (matchInOther) {
            const ownerBranch = branches.find((b) => b.id === matchInOther.branchId)?.name || matchInOther.branchId;
            alert(
              lang === 'ar'
                ? `لا يمكن إتمام البيع: الصنف [${row.description}] بالباركود (${row.barcode}) يتبع لفرع [${ownerBranch}]. لا يمكنك بيع منتجات خارج فرعك الحالي (${activeBranch.name}).`
                : `Cannot complete sale: Item [${row.description}] (${row.barcode}) belongs to branch [${ownerBranch}]. You can ONLY sell products in ${activeBranch.name} inventory!`
            );
            return;
          } else if (!isCustomOrderType) {
            alert(
              lang === 'ar'
                ? `لا يمكن إتمام البيع: الباركود (${row.barcode}) غير موجود في قاعدة بيانات فرع (${activeBranch.name}).`
                : `Cannot complete sale: Barcode (${row.barcode}) is not registered in ${activeBranch.name} inventory.`
            );
            return;
          }
        }

        if (matchInBranch && matchInBranch.currentQuantity < row.quantity && !isCustomOrderType) {
          alert(
            lang === 'ar'
              ? `الكمية المتوفرة في مخزون فرع (${activeBranch.name}) للصنف [${matchInBranch.brand} - ${matchInBranch.model}] هي (${matchInBranch.currentQuantity}) فقط.`
              : `Insufficient stock in ${activeBranch.name} for [${matchInBranch.brand} - ${matchInBranch.model}]. Available stock: ${matchInBranch.currentQuantity}.`
          );
          return;
        }
      }
    }

    const prescription: OpticalPrescription = {
      rightEye: { sph: rightSph, cyl: rightCyl, axis: rightAxis },
      leftEye: { sph: leftSph, cyl: leftCyl, axis: leftAxis },
      add: addVal,
      a: aVal,
      b: bVal,
      c: cVal,
      ipd: ipdVal,
      optometristName,
    };

    const invoicePayload = {
      customerId: selectedCustomerId,
      customerName,
      customerPhone,
      deliveryDate,
      salesEmployee,
      cashier,
      prescription,
      items,
      subtotal,
      discount: totalDiscount,
      tax: taxAmount,
      grandTotal,
      paidAmount,
      paymentMethod,
      splitMethods: paymentMethod === 'Split' ? splitMethods : [],
      warrantyTerms,
      notes,
      needsLabJob,
    };

    if (invoiceToEdit && onUpdateInvoice) {
      const remainingBalance = Math.max(0, grandTotal - paidAmount);
      onUpdateInvoice(invoiceToEdit.id, { ...invoicePayload, remainingBalance });
      if (onClearEdit) onClearEdit();
      setCreatedInvoice({ ...invoiceToEdit, ...invoicePayload, remainingBalance });
    } else {
      const inv = onCreateInvoice(invoicePayload);
      setCreatedInvoice(inv);
    }

    // Reset form state so next sale starts clean
    handleResetForm();
  };

  // Open Settlement Dialog
  const handleOpenSettleModal = (inv: Invoice) => {
    setSelectedInvoiceToSettle(inv);
    setSettleAmount(inv.remainingBalance > 0 ? inv.remainingBalance : 0);
    setSettlePaymentMethod('Cash');
    setSettleNotes(`Rest payment settled upon pickup at ${activeBranch.name}`);
  };

  const handleConfirmSettlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceToSettle || !onSettlePayment) return;

    const updated = onSettlePayment(
      selectedInvoiceToSettle.id,
      settleAmount,
      settlePaymentMethod,
      settleNotes
    );

    setSelectedInvoiceToSettle(null);
    if (updated) {
      setCreatedInvoice(updated);
    }
  };

  // Filtered Invoices History
  const branchInvoices = invoices.filter(
    (inv) =>
      inv.branchId === activeBranch.id ||
      activeBranch.isMain ||
      activeBranch.id === 'b-main' ||
      currentUser?.role === 'admin'
  );
  
  const pendingPickupInvoicesCount = branchInvoices.filter((i) => i.remainingBalance > 0).length;

  const filteredHistoryInvoices = branchInvoices.filter((inv) => {
    const query = historySearch.toLowerCase().trim();
    const matchesSearch =
      !query ||
      inv.invoiceNumber.toLowerCase().includes(query) ||
      inv.customerName.toLowerCase().includes(query) ||
      inv.customerPhone.toLowerCase().includes(query);

    if (!matchesSearch) return false;

    if (historyFilter === 'pending_balance') return inv.remainingBalance > 0;
    if (historyFilter === 'ready_pickup') return inv.deliveryStatus === 'Ready for Delivery' || inv.deliveryStatus === 'In Store' || inv.deliveryStatus === 'Dispatched from Lab';
    if (historyFilter === 'completed') return inv.remainingBalance === 0 && inv.deliveryStatus === 'Delivered';

    return true;
  });

  return (
    <div id="sales-invoice-module" className="p-6 space-y-6 max-w-7xl mx-auto text-slate-900">
      {/* Title Header with Subtabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{t('salesPosTitle')}</h2>
              <p className="text-xs text-slate-500 font-medium">
                {t('salesPosSub')}
              </p>
            </div>
          </div>
        </div>

        {/* Sub-Tabs Selector */}
        <div className="flex items-center gap-2 bg-slate-200/80 p-1 rounded-xl">
          <button
            onClick={() => setActiveSubTab('new_sale')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'new_sale'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Plus className="w-4 h-4 text-blue-600" />
            {t('newInvoice')}
          </button>

          <button
            onClick={() => setActiveSubTab('invoice_history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'invoice_history'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <History className="w-4 h-4 text-emerald-600" />
            {t('invoiceHistory')}
            {pendingPickupInvoicesCount > 0 && (
              <span className="bg-amber-500 text-white font-mono text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {pendingPickupInvoicesCount} {lang === 'ar' ? 'معلق' : 'Due'}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* SUBTAB 1: NEW SALES POS INVOICE CREATION */}
      {activeSubTab === 'new_sale' && (
        <form onSubmit={handleSubmitInvoice} onKeyDown={handleFormKeyDown} className="space-y-6">
          {/* Section 1: Customer & Header Info */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                {lang === 'ar' ? 'بيانات العميل ومعلومات الفاتورة' : 'Customer & Sales Header Information'}
              </h3>

              <button
                type="button"
                onClick={handleResetForm}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3.5 py-1.5 rounded-lg border border-slate-200 transition cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
                title={lang === 'ar' ? 'البدء بفاتورة جديدة وتفريغ الحقول' : 'Start fresh with an empty invoice form'}
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>{lang === 'ar' ? 'فاتورة جديدة / تفريغ' : 'Start Fresh / Clear Form'}</span>
              </button>
            </div>

            {/* Customer Search & Quick Creation Bar */}
            <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3.5 space-y-2.5">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={customerSearchQuery}
                    onChange={(e) => {
                      setCustomerSearchQuery(e.target.value);
                      setShowCustomerDropdown(true);
                    }}
                    onFocus={() => setShowCustomerDropdown(true)}
                    placeholder={
                      lang === 'ar'
                        ? '🔍 ابحث عن عميل مسجل برقم الهاتف أو الاسم أو الباركود...'
                        : '🔍 Search registered customer by phone, name, or barcode...'
                    }
                    className="w-full bg-white border border-slate-300 text-slate-900 text-xs rounded-lg p-2.5 ltr:pl-9 rtl:pr-9 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-xs"
                  />
                  <Search className={`w-4 h-4 text-slate-400 absolute top-3 ${lang === 'ar' ? 'right-3' : 'left-3'}`} />

                  {customerSearchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomerSearchQuery('');
                        setShowCustomerDropdown(false);
                      }}
                      className={`absolute top-2.5 ${lang === 'ar' ? 'left-3' : 'right-3'} text-slate-400 hover:text-slate-600 text-xs font-bold p-0.5 rounded-full hover:bg-slate-100`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}

                  {/* Dropdown Suggestions */}
                  {showCustomerDropdown && customerSearchQuery.trim() !== '' && (
                    <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-64 overflow-y-auto divide-y divide-slate-100">
                      {filteredCustomersList.length > 0 ? (
                        filteredCustomersList.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => handleSelectCustomerFromSearch(c)}
                            className={`w-full p-3 hover:bg-blue-50 text-right flex items-center justify-between transition cursor-pointer ${lang === 'ar' ? 'text-right' : 'text-left'}`}
                          >
                            <div>
                              <div className="font-bold text-slate-900 text-xs">{c.name}</div>
                              <div className="text-[11px] text-slate-500 font-mono">{c.phone} {c.address ? `• ${c.address}` : ''}</div>
                            </div>
                            <span className="text-[10px] bg-blue-100 text-blue-700 px-2.5 py-1 rounded-md font-bold">
                              {lang === 'ar' ? 'تعبئة البيانات' : 'Select Customer'}
                            </span>
                          </button>
                        ))
                      ) : (
                        <div className="p-4 text-center space-y-2">
                          <p className="text-xs text-slate-600 font-medium">
                            {lang === 'ar'
                              ? `لم يتم العثور على عميل مسجل يطابق "${customerSearchQuery}"`
                              : `No customer matches "${customerSearchQuery}"`}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              const isPhone = /^[0-9+ ]+$/.test(customerSearchQuery);
                              if (isPhone) {
                                setNewCustPhone(customerSearchQuery);
                                setNewCustName('');
                              } else {
                                setNewCustName(customerSearchQuery);
                                setNewCustPhone('');
                              }
                              setIsNewCustomerModalOpen(true);
                              setShowCustomerDropdown(false);
                            }}
                            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition cursor-pointer shadow-xs"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>
                              {lang === 'ar' ? 'إنشاء وتحديد عميل جديد' : 'Create & Fill New Customer'}
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Direct Create Customer Button */}
                <button
                  type="button"
                  onClick={() => {
                    setNewCustName(customerName || customerSearchQuery);
                    setNewCustPhone(customerPhone);
                    setIsNewCustomerModalOpen(true);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0 shadow-xs"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'إنشاء عميل جديد' : '+ Create New Customer'}</span>
                </button>
              </div>

              {/* Active Customer Selected Tag or Empty Prompt */}
              {selectedCustomerId ? (
                <div className="flex items-center justify-between text-xs bg-emerald-100/70 border border-emerald-300 text-emerald-900 rounded-lg px-3 py-1.5 font-bold">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    {lang === 'ar' ? `العميل المحدد: ${customerName} (${customerPhone})` : `Selected Customer: ${customerName} (${customerPhone})`}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCustomerId('');
                      setCustomerName('');
                      setCustomerPhone('');
                      setCustomerSearchQuery('');
                    }}
                    className="text-xs text-rose-600 hover:text-rose-800 underline font-bold cursor-pointer"
                  >
                    {lang === 'ar' ? 'إلغاء التحديد' : 'Deselect'}
                  </button>
                </div>
              ) : (
                <div className="text-[11px] text-slate-500 font-medium">
                  {lang === 'ar'
                    ? '💡 يمكنك البحث عن عميل موجود واستدعاء بياناته، أو إدخال الاسم والهاتف يدوياً، أو النقر على "إنشاء عميل جديد".'
                    : '💡 Search an existing customer, type name & phone manually, or click "Create New Customer".'}
                </div>
              )}
            </div>

            {/* Customer Inputs 3-Column Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  {lang === 'ar' ? 'اسم العميل *' : 'Customer Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder={lang === 'ar' ? 'مثال: أحمد عبد الله المجالي' : 'e.g. Ahmad M. Al-Majali'}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-lg p-2.5 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  {lang === 'ar' ? 'رقم الهاتف *' : 'Phone Number *'}
                </label>
                <input
                  type="text"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+962 7 9811 2233"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-lg p-2.5 font-mono font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>{lang === 'ar' ? 'موظف المبيعات *' : 'Sales Employee *'}</span>
                  {currentUser?.role === 'admin' ? (
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      <User className="w-3 h-3 text-emerald-600" />
                      {lang === 'ar' ? 'متاح للتعديل (صلاحية مدير)' : 'Editable (Admin)'}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                      <Lock className="w-3 h-3 text-slate-500" />
                      {lang === 'ar' ? 'مغلق باسم الحساب' : 'Locked to Session'}
                    </span>
                  )}
                </label>
                <div className="relative">
                  {currentUser?.role === 'admin' && users && users.length > 0 ? (
                    <>
                      <select
                        value={salesEmployee}
                        onChange={(e) => setSalesEmployee(e.target.value)}
                        className="w-full bg-white border border-slate-300 text-slate-900 font-bold text-xs rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none appearance-none"
                      >
                        {users.filter(u => u.isActive).map(u => (
                          <option key={u.id} value={u.fullName}>{u.fullName}</option>
                        ))}
                      </select>
                      <ChevronDown className={`w-4 h-4 text-slate-400 absolute top-2.5 ${lang === 'ar' ? 'left-3' : 'right-3'} pointer-events-none`} />
                    </>
                  ) : (
                    <input
                      type="text"
                      readOnly={currentUser?.role !== 'admin'}
                      value={salesEmployee}
                      onChange={(e) => setSalesEmployee(e.target.value)}
                      className={`w-full border border-slate-300 font-bold text-xs rounded-lg p-2.5 focus:outline-none ${
                        currentUser?.role === 'admin' 
                          ? 'bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500' 
                          : 'bg-slate-100/90 text-slate-800 cursor-not-allowed'
                      }`}
                      title={currentUser?.role !== 'admin' ? (lang === 'ar' ? 'هذا الحقل مغلق بأسماء موظف المبيعات المسجل دخولاً' : 'Locked to the currently logged-in sales employee') : ''}
                    />
                  )}
                  {currentUser?.role !== 'admin' && (
                    <Lock className={`w-3.5 h-3.5 text-slate-400 absolute top-3 ${lang === 'ar' ? 'left-3' : 'right-3'}`} />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Prescription Entry (Right Eye / Left Eye / Measurements) */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Glasses className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wide">
                  {lang === 'ar' ? 'تفاصيل القياسات وفحص النظر' : 'Optical Prescription Details'}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleLoadPreviousPrescription}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5"
                  title={lang === 'ar' ? 'استدعاء أحدث فحص نظر للعميل' : 'Copy previous prescription for this customer'}
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>{lang === 'ar' ? 'استدعاء أحدث فحص نظر' : 'Load Last Prescription'}</span>
                </button>

                {(rightSph || leftSph || rightCyl || leftCyl || addVal || ipdVal) && (
                  <button
                    type="button"
                    onClick={clearPrescriptionFields}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold px-2.5 py-1.5 rounded-lg border border-slate-200 transition cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>{lang === 'ar' ? 'تفريغ القياسات' : 'Clear Rx'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Status / Feedback Banner */}
            {rxMessage && (
              <div className={`p-3 rounded-lg text-xs font-medium flex items-center justify-between gap-2 border ${
                rxMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                rxMessage.type === 'warning' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                'bg-blue-50 text-blue-800 border-blue-200'
              }`}>
                <div className="flex items-center gap-2">
                  {rxMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                  {rxMessage.type === 'warning' && <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />}
                  {rxMessage.type === 'info' && <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />}
                  <span>{rxMessage.text}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setRxMessage(null)}
                  className="text-slate-400 hover:text-slate-600 transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Right Eye */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="font-bold text-xs text-blue-700 flex items-center justify-between">
                  <span>{lang === 'ar' ? 'العين اليمنى (O.D.)' : 'RIGHT EYE (O.D.)'}</span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {lang === 'ar' ? 'قياس النظر للبعيد والقريب' : 'Distance & Near Rx'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600">{lang === 'ar' ? 'SPH (الدرجة)' : 'SPH'}</label>
                    <input
                      type="text"
                      value={rightSph}
                      onChange={(e) => setRightSph(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-lg p-2 font-mono font-bold text-center focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600">{lang === 'ar' ? 'CYL (الانحراف)' : 'CYL'}</label>
                    <input
                      type="text"
                      value={rightCyl}
                      onChange={(e) => setRightCyl(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-lg p-2 font-mono text-center focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600">{lang === 'ar' ? 'AXIS (المحور)' : 'AXIS'}</label>
                    <input
                      type="text"
                      value={rightAxis}
                      onChange={(e) => setRightAxis(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-lg p-2 font-mono text-center focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Left Eye */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="font-bold text-xs text-blue-700 flex items-center justify-between">
                  <span>{lang === 'ar' ? 'العين اليسرى (O.S.)' : 'LEFT EYE (O.S.)'}</span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {lang === 'ar' ? 'قياس النظر للبعيد والقريب' : 'Distance & Near Rx'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600">{lang === 'ar' ? 'SPH (الدرجة)' : 'SPH'}</label>
                    <input
                      type="text"
                      value={leftSph}
                      onChange={(e) => setLeftSph(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-lg p-2 font-mono font-bold text-center focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600">{lang === 'ar' ? 'CYL (الانحراف)' : 'CYL'}</label>
                    <input
                      type="text"
                      value={leftCyl}
                      onChange={(e) => setLeftCyl(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-lg p-2 font-mono text-center focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600">{lang === 'ar' ? 'AXIS (المحور)' : 'AXIS'}</label>
                    <input
                      type="text"
                      value={leftAxis}
                      onChange={(e) => setLeftAxis(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-lg p-2 font-mono text-center focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Measurements */}
            <div className="grid grid-cols-5 gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <label className="text-[11px] font-bold text-slate-600">{lang === 'ar' ? 'ADD (إضافة)' : 'ADD (Addition)'}</label>
                <input
                  type="text"
                  value={addVal}
                  onChange={(e) => setAddVal(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-lg p-2 font-mono text-center"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600">A</label>
                <input
                  type="text"
                  value={aVal}
                  onChange={(e) => setAVal(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-lg p-2 font-mono text-center"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600">B</label>
                <input
                  type="text"
                  value={bVal}
                  onChange={(e) => setBVal(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-lg p-2 font-mono text-center"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600">C</label>
                <input
                  type="text"
                  value={cVal}
                  onChange={(e) => setCVal(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-lg p-2 font-mono text-center"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600">{lang === 'ar' ? 'IPD (المسافة بين البؤبؤين)' : 'IPD (Interpupillary Distance)'}</label>
                <input
                  type="text"
                  value={ipdVal}
                  onChange={(e) => setIpdVal(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-lg p-2 font-mono text-center"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Products Section with Barcode Scanner & Lookup */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 gap-2">
              <div className="flex items-center gap-2">
                <Scan className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wide">{lang === 'ar' ? 'المنتجات والمخزون' : 'Products & Stock'}</h3>
                <span className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold">
                  {lang === 'ar' ? `مخزون فرع ${activeBranch.name}: ${branchProducts.length} أصناف` : `Branch ${activeBranch.name} Stock: ${branchProducts.length} items`}
                </span>
              </div>

              <button
                type="button"
                onClick={handleAddItemRow}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                {lang === 'ar' ? 'إضافة صف فارغ' : 'Add Empty Row'}
              </button>
            </div>

            {/* Interactive Barcode Search & Category Filter Bar */}
            {branchProducts.length > 0 && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                  {/* Search Input with Barcode Icon & Suggestions */}
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={productSearchQuery}
                      onChange={(e) => {
                        setProductSearchQuery(e.target.value);
                        setShowProductDropdown(true);
                      }}
                      onFocus={() => setShowProductDropdown(true)}
                      onKeyDown={handleProductSearchKeyDown}
                      placeholder={
                        lang === 'ar'
                          ? '🔍 امسح أو اكتب الباركود، الماركة، أو الموديل واضغط Enter للإضافة المباشرة...'
                          : '🔍 Scan/type Barcode, Brand, or Model and press Enter...'
                      }
                      className="w-full bg-white border border-slate-300 text-slate-900 text-xs rounded-lg p-2.5 ltr:pl-9 rtl:pr-9 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-xs font-mono"
                    />
                    <Scan className={`w-4 h-4 text-blue-600 absolute top-3 ${lang === 'ar' ? 'right-3' : 'left-3'}`} />

                    {productSearchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setProductSearchQuery('');
                          setShowProductDropdown(false);
                        }}
                        className={`absolute top-2.5 ${lang === 'ar' ? 'left-3' : 'right-3'} text-slate-400 hover:text-slate-600 text-xs font-bold p-0.5 rounded-full hover:bg-slate-100`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}

                    {/* Auto-suggested filtered products dropdown */}
                    {showProductDropdown && productSearchQuery.trim() !== '' && (
                      <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-72 overflow-y-auto divide-y divide-slate-100">
                        {filteredBranchProducts.length > 0 ? (
                          filteredBranchProducts.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => handleAddProductToInvoice(p)}
                              className={`w-full p-3 hover:bg-blue-50 flex items-center justify-between transition cursor-pointer ${lang === 'ar' ? 'text-right' : 'text-left'}`}
                            >
                              <div>
                                <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                                  <span className="bg-slate-100 text-slate-700 font-mono px-2 py-0.5 rounded text-[10px] border border-slate-200">
                                    {p.barcode}
                                  </span>
                                  <span>{p.brand} - {p.model}</span>
                                </div>
                                <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                                  {p.frameType} {p.color ? `• ${p.color}` : ''} {p.size ? `• ${p.size}` : ''}
                                </div>
                              </div>
                              <div className="shrink-0 font-mono text-left">
                                <div className="text-xs font-bold text-emerald-700">{p.sellingPrice} JOD</div>
                                <div className="text-[10px] text-slate-500 font-bold">
                                  {lang === 'ar' ? `المتوفر: ${p.currentQuantity}` : `Stock: ${p.currentQuantity}`}
                                </div>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="p-4 text-center text-xs text-slate-500 font-medium">
                            {lang === 'ar'
                              ? `لم يتم العثور على أي صنف يطابق الباركود أو الاسم "${productSearchQuery}"`
                              : `No product found matching barcode or name "${productSearchQuery}"`}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Category Filter Selector */}
                  <div className="flex items-center gap-2">
                    <div className="relative shrink-0">
                      <select
                        value={productCategoryFilter}
                        onChange={(e) => setProductCategoryFilter(e.target.value)}
                        className="bg-white border border-slate-300 text-slate-800 text-xs font-bold rounded-lg p-2.5 ltr:pl-8 rtl:pr-8 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer shadow-xs"
                      >
                        <option value="all">{lang === 'ar' ? 'جميع التصنيفات (الكل)' : 'All Categories'}</option>
                        <option value="Optical Frame">{lang === 'ar' ? 'إطارات طبية' : 'Optical Frames'}</option>
                        <option value="Sunglasses">{lang === 'ar' ? 'نظارات شمسية' : 'Sunglasses'}</option>
                        <option value="Contact Lens">{lang === 'ar' ? 'عدسات لاصقة' : 'Contact Lenses'}</option>
                        <option value="Ophthalmic Lens">{lang === 'ar' ? 'عدسات طبية' : 'Ophthalmic Lenses'}</option>
                        <option value="Accessory">{lang === 'ar' ? 'إكسسوارات ومستلزمات' : 'Accessories'}</option>
                      </select>
                      <Filter className={`w-3.5 h-3.5 text-slate-500 absolute top-3 ${lang === 'ar' ? 'right-2.5' : 'left-2.5'}`} />
                    </div>

                    {productCategoryFilter !== 'all' && (
                      <button
                        type="button"
                        onClick={() => setProductCategoryFilter('all')}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 underline shrink-0 cursor-pointer"
                      >
                        {lang === 'ar' ? 'إعادة ضبط' : 'Reset Filter'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Sub Bar with instructions & item count */}
                <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 font-medium pt-1">
                  <span className="flex items-center gap-1.5 text-blue-700 font-bold">
                    <Scan className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    {lang === 'ar'
                      ? '💡 امسح الباركود مباشرة بقارئ الباركود، أو اكتب الموديل/الاسم واضغط Enter للإضافة السريعة للفاتورة.'
                      : '💡 Scan barcode directly, or type brand/model and press Enter for instant adding.'}
                  </span>
                  <span className="font-mono text-slate-600 font-bold">
                    {lang === 'ar'
                      ? `الأصناف المعروضة: ${filteredBranchProducts.length} من أصل ${branchProducts.length}`
                      : `Showing: ${filteredBranchProducts.length} of ${branchProducts.length}`}
                  </span>
                </div>
              </div>
            )}

            {/* Warning if branch has 0 products */}
            {branchProducts.length === 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  {lang === 'ar'
                    ? `تنبيه: لا توجد منتجات مسجلة في مخزون فرع (${activeBranch.name}) حالياً. يرجى إضافة منتجات لهذا الفرع أو تحويل مخزون إليه قبل إنشاء الفاتورة.`
                    : `Notice: No optical products registered in ${activeBranch.name} branch inventory yet. Please add stock or execute inventory transfers to this branch first.`}
                </span>
              </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-xs text-slate-800">
                <thead className="bg-slate-100 uppercase font-bold text-[10px] text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className={`p-3 ${lang === 'ar' ? 'text-right' : 'text-left'}`}>{lang === 'ar' ? 'امسح الباركود' : 'Barcode Scan'}</th>
                    <th className={`p-3 ${lang === 'ar' ? 'text-right' : 'text-left'}`}>{lang === 'ar' ? 'الوصف / اسم الصنف' : 'Description / Item Name'}</th>
                    <th className={`p-3 ${lang === 'ar' ? 'text-right' : 'text-left'}`}>{lang === 'ar' ? 'السعر (دينار)' : 'Price (JOD)'}</th>
                    <th className={`p-3 ${lang === 'ar' ? 'text-right' : 'text-left'}`}>{lang === 'ar' ? 'الكمية' : 'Qty'}</th>
                    <th className={`p-3 ${lang === 'ar' ? 'text-right' : 'text-left'}`}>{lang === 'ar' ? 'الخصم' : 'Discount'}</th>
                    <th className={`p-3 ${lang === 'ar' ? 'text-right' : 'text-left'}`}>{lang === 'ar' ? 'المجموع' : 'Total'}</th>
                    <th className={`p-3 ${lang === 'ar' ? 'text-left' : 'text-right'}`}>{lang === 'ar' ? 'إجراء' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition">
                      <td className="p-3 w-44">
                        <div className="relative">
                          <input
                            type="text"
                            value={row.barcode}
                            onChange={(e) => handleBarcodeChange(idx, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                if (idx === items.length - 1 && (row.barcode || row.description)) {
                                  handleAddItemRow();
                                }
                              }
                            }}
                            placeholder={lang === 'ar' ? 'امسح الباركود...' : 'Scan Barcode...'}
                            className={`w-full bg-slate-50 border border-slate-200 text-blue-700 font-bold font-mono text-xs rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none ${lang === 'ar' ? 'pr-8' : 'pl-8'}`}
                          />
                          <Scan className={`w-3.5 h-3.5 text-slate-400 absolute top-3 ${lang === 'ar' ? 'right-2.5' : 'left-2.5'}`} />
                        </div>
                      </td>

                      <td className="p-3">
                        <input
                          type="text"
                          value={row.description}
                          onChange={(e) => handleUpdateItemRow(idx, 'description', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-medium text-xs rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </td>

                      <td className="p-3 w-28">
                        <input
                          type="number"
                          value={row.price}
                          onChange={(e) => handleUpdateItemRow(idx, 'price', parseFloat(e.target.value) || 0)}
                          className={`w-full bg-slate-50 border border-slate-200 text-emerald-700 font-bold font-mono text-xs rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none ${lang === 'ar' ? 'text-left' : 'text-right'}`}
                        />
                      </td>

                      <td className="p-3 w-20">
                        <input
                          type="number"
                          value={row.quantity}
                          onChange={(e) => handleUpdateItemRow(idx, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-bold font-mono text-xs rounded-lg p-2.5 text-center focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </td>

                      <td className="p-3 w-24">
                        <input
                          type="number"
                          value={row.discount}
                          onChange={(e) => handleUpdateItemRow(idx, 'discount', parseFloat(e.target.value) || 0)}
                          className={`w-full bg-slate-50 border border-slate-200 text-amber-700 font-bold font-mono text-xs rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none ${lang === 'ar' ? 'text-left' : 'text-right'}`}
                        />
                      </td>

                      <td className={`p-3 w-28 font-mono font-bold text-slate-900 text-sm ${lang === 'ar' ? 'text-left' : 'text-right'}`}>
                        {row.total} {lang === 'ar' ? 'دينار' : 'JOD'}
                      </td>

                      <td className={`p-3 ${lang === 'ar' ? 'text-left' : 'text-right'}`}>
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(idx)}
                          className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4: Totals & Financial Calculations */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Additional Info Fields */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wide flex items-center gap-2 border-b border-slate-100 pb-3">
                <FileText className="w-4 h-4 text-blue-600" />
                {lang === 'ar' ? 'حقول الفاتورة والدفع الإضافية' : 'Additional Invoice & Payment Fields'}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>{lang === 'ar' ? 'اسم أمين الصندوق' : 'Cashier Name'}</span>
                    <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                      <Lock className="w-3 h-3 text-slate-400" />
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      value={cashier}
                      className="w-full bg-slate-100/90 border border-slate-300 text-slate-800 font-bold text-xs rounded-lg p-2.5 cursor-not-allowed focus:outline-none"
                    />
                    <Lock className={`w-3.5 h-3.5 text-slate-400 absolute top-3 ${lang === 'ar' ? 'left-3' : 'right-3'}`} />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">{lang === 'ar' ? 'طريقة الدفع' : 'Payment Method'}</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-lg p-2.5 font-medium cursor-pointer"
                  >
                    <option value="Cash">{lang === 'ar' ? 'نقدي' : 'Cash'}</option>
                    <option value="Visa">{lang === 'ar' ? 'فيزا (Visa)' : 'Visa'}</option>
                    <option value="Cliq">{lang === 'ar' ? 'كليك (Cliq)' : 'Cliq'}</option>
                    <option value="Insurance">{lang === 'ar' ? 'تأمين (Insurance)' : 'Insurance'}</option>
                    <option value="Split">{lang === 'ar' ? 'دفع مقسم' : 'Split Payment'}</option>
                    <option value="Bank Transfer">{lang === 'ar' ? 'حوالة بنكية' : 'Bank Transfer'}</option>
                  </select>
                </div>
                
                {paymentMethod === 'Split' && (
                  <div className="space-y-3 mt-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div className="flex gap-2">
                      <select 
                        value={splitMethods[0]?.method || 'Cash'}
                        onChange={(e) => setSplitMethods([{...splitMethods[0], method: e.target.value}, splitMethods[1]])}
                        className="w-1/2 border border-slate-300 rounded p-1.5 text-xs focus:ring-1 focus:ring-blue-500 bg-white"
                      >
                        <option value="Cash">{lang === 'ar' ? 'كاش' : 'Cash'}</option>
                        <option value="Visa">{lang === 'ar' ? 'فيزا' : 'Visa'}</option>
                        <option value="Cliq">{lang === 'ar' ? 'كليك' : 'Cliq'}</option>
                        <option value="Insurance">{lang === 'ar' ? 'تأمين' : 'Insurance'}</option>
                        <option value="Bank Transfer">{lang === 'ar' ? 'حوالة' : 'Bank Transfer'}</option>
                      </select>
                      <input type="number" value={splitMethods[0]?.amount || 0} onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setSplitMethods([{...splitMethods[0], amount: val}, {...splitMethods[1], amount: paidAmount - val}]);
                      }} className="w-1/2 border border-slate-300 rounded p-1.5 text-xs focus:ring-1 focus:ring-blue-500 font-bold" />
                    </div>
                    <div className="flex gap-2">
                      <select 
                        value={splitMethods[1]?.method || 'Visa'}
                        onChange={(e) => setSplitMethods([splitMethods[0], {...splitMethods[1], method: e.target.value}])}
                        className="w-1/2 border border-slate-300 rounded p-1.5 text-xs focus:ring-1 focus:ring-blue-500 bg-white"
                      >
                        <option value="Cash">{lang === 'ar' ? 'كاش' : 'Cash'}</option>
                        <option value="Visa">{lang === 'ar' ? 'فيزا' : 'Visa'}</option>
                        <option value="Cliq">{lang === 'ar' ? 'كليك' : 'Cliq'}</option>
                        <option value="Insurance">{lang === 'ar' ? 'تأمين' : 'Insurance'}</option>
                        <option value="Bank Transfer">{lang === 'ar' ? 'حوالة' : 'Bank Transfer'}</option>
                      </select>
                      <input type="number" value={splitMethods[1]?.amount || 0} onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setSplitMethods([{...splitMethods[0], amount: paidAmount - val}, {...splitMethods[1], amount: val}]);
                      }} className="w-1/2 border border-slate-300 rounded p-1.5 text-xs focus:ring-1 focus:ring-blue-500 font-bold" />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>{lang === 'ar' ? 'تاريخ التسليم' : 'Delivery Date'}</span>
                  </label>
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-lg p-2.5 font-mono focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1 md:col-span-3">
                  <label className="text-xs font-bold text-slate-700">{lang === 'ar' ? 'اسم فاحص النظر / أخصائي البصريات' : 'Optometrist Name / Eye Tester'}</label>
                  <input
                    type="text"
                    value={optometristName}
                    onChange={(e) => setOptometristName(e.target.value)}
                    placeholder={lang === 'ar' ? 'اسم الشخص الذي أجرى فحص النظر' : 'Name of the person who did the eye test'}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-lg p-2.5 font-medium"
                  />
                </div>

                <div className="space-y-1 md:col-span-3">
                  <label className="text-xs font-bold text-slate-700">{lang === 'ar' ? 'شروط الضمان' : 'Warranty Terms'}</label>
                  <input
                    type="text"
                    value={warrantyTerms}
                    onChange={(e) => setWarrantyTerms(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-lg p-2.5 font-medium"
                  />
                </div>

                <div className="space-y-1 md:col-span-3">
                  <label className="text-xs font-bold text-slate-700">{lang === 'ar' ? 'ملاحظات الفاتورة / تعليقات المختبر' : 'Invoice Notes / Lab Remarks'}</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-lg p-2.5 font-medium"
                  ></textarea>
                </div>
                <div className="md:col-span-3 flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    id="needsLabJob"
                    checked={needsLabJob}
                    onChange={(e) => setNeedsLabJob(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="needsLabJob" className="text-xs font-bold text-slate-800 cursor-pointer select-none">
                    {lang === 'ar' ? 'يتطلب تجهيز في المختبر (إرسال إلى قسم المختبر)' : 'Requires Lab Preparation (Send to Lab)'}
                  </label>
                </div>
              </div>
            </div>

            {/* Right: Totals Box with Full vs Partial Deposit Quick Options */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wide flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  {lang === 'ar' ? 'خيارات الدفع والإيداع' : 'Payment & Deposit Options'}
                </span>
                <span className="text-[10px] text-slate-500 font-mono font-bold bg-slate-100 px-2 py-0.5 rounded">
                  {lang === 'ar' ? 'دينار' : 'JOD'}
                </span>
              </h3>

              <div className="space-y-2.5 font-mono text-xs">
                <div className="flex justify-between text-slate-500 font-medium">
                  <span>{lang === 'ar' ? 'المجموع الفرعي:' : 'Subtotal:'}</span>
                  <span className="text-slate-900 font-bold">{subtotal.toFixed(2)} {lang === 'ar' ? 'دينار' : 'JOD'}</span>
                </div>

                <div className="flex justify-between text-slate-500 font-medium">
                  <span>{lang === 'ar' ? 'الخصم:' : 'Discount:'}</span>
                  <span className="text-amber-700 font-bold">-{totalDiscount.toFixed(2)} {lang === 'ar' ? 'دينار' : 'JOD'}</span>
                </div>

                {taxRate > 0 && (
                  <div className="flex items-center justify-between text-slate-500 font-medium">
                    <div className="flex items-center gap-1.5">
                      <span>{lang === 'ar' ? `ضريبة المبيعات (${taxRate}%):` : `Sales Tax (${taxRate}%):`}</span>
                      <button
                        type="button"
                        onClick={() => setTaxRate(0)}
                        className="text-[10px] text-red-600 hover:text-red-800 underline font-bold cursor-pointer font-sans"
                        title={lang === 'ar' ? 'إزالة الضريبة' : 'Remove Tax'}
                      >
                        {lang === 'ar' ? '[إلغاء الضريبة]' : '[Remove Tax]'}
                      </button>
                    </div>
                    <span className="text-slate-900 font-bold">+{taxAmount.toFixed(2)} {lang === 'ar' ? 'دينار' : 'JOD'}</span>
                  </div>
                )}

                <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
                  <span>{lang === 'ar' ? 'المجموع النهائي:' : 'Grand Total:'}</span>
                  <span className="text-blue-700">{grandTotal.toFixed(2)} {lang === 'ar' ? 'دينار' : 'JOD'}</span>
                </div>

                {/* Quick Payment Preset Buttons */}
                <div className="pt-2 space-y-1.5">
                  <label className="text-[11px] font-sans font-bold text-slate-700 block">
                    {lang === 'ar' ? 'خيارات الدفع السريع' : 'Quick Deposit / Payment Presets'}
                  </label>
                  <div className="grid grid-cols-2 gap-2 font-sans">
                    <button
                      type="button"
                      onClick={() => setPaidAmount(grandTotal)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-1 ${
                        paidAmount === grandTotal
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-50 hover:bg-emerald-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {lang === 'ar' ? 'كامل (100%)' : 'Full (100%)'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaidAmount(Math.round((grandTotal / 2) * 100) / 100)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-1 ${
                        paidAmount === Math.round((grandTotal / 2) * 100) / 100
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-slate-50 hover:bg-amber-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      <HandCoins className="w-3.5 h-3.5" />
                      {lang === 'ar' ? 'عربون 50%' : '50% Deposit'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaidAmount(Math.min(20, grandTotal))}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-1 ${
                        paidAmount === Math.min(20, grandTotal)
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-slate-50 hover:bg-amber-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {lang === 'ar' ? 'عربون 20 دينار' : '20 JOD Deposit'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaidAmount(0)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-1 ${
                        paidAmount === 0
                          ? 'bg-rose-600 text-white border-rose-600'
                          : 'bg-slate-50 hover:bg-rose-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {lang === 'ar' ? '0 دينار (غير مدفوع)' : '0 JOD (Unpaid)'}
                    </button>
                  </div>
                </div>

                <div className="pt-3 space-y-2 border-t border-slate-200">
                  <div>
                    <label className="text-[11px] font-sans font-bold text-slate-700">{lang === 'ar' ? 'المبلغ المدفوع الآن' : 'Amount Paid Now'} ({lang === 'ar' ? 'دينار' : 'JOD'})</label>
                    <input
                      type="number"
                      value={paidAmount}
                      max={grandTotal}
                      onChange={(e) => {
                        let val = parseFloat(e.target.value) || 0;
                        if (val > grandTotal) val = grandTotal;
                        if (val < 0) val = 0;
                        setPaidAmount(val);
                      }}
                      className="w-full bg-white border border-emerald-500 text-emerald-800 text-sm font-bold rounded-lg p-2.5 font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-between text-xs font-bold pt-1">
                    <span className="text-slate-600 font-sans">{lang === 'ar' ? 'الرصيد المتبقي:' : 'Remaining Balance Due:'}</span>
                    <span className={remainingBalance > 0 ? 'text-amber-700 font-mono' : 'text-emerald-700 font-mono'}>
                      {remainingBalance.toFixed(2)} {lang === 'ar' ? 'دينار' : 'JOD'}
                    </span>
                  </div>

                  {/* Visual Payment Status Alert Banner */}
                  {remainingBalance > 0 ? (
                    <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-lg text-[11px] text-amber-900 font-sans space-y-0.5">
                      <div className="font-bold flex items-center gap-1.5 text-amber-800">
                        <HandCoins className="w-3.5 h-3.5 shrink-0" />
                        <span>{lang === 'ar' ? 'تم تسجيل دفع جزئي' : 'Partial Payment Recorded'}</span>
                      </div>
                      <p className="text-[10px] text-amber-700">
                        {lang === 'ar' ? 'سيدفع العميل الرصيد المتبقي وقدره' : 'Client will pay remaining'} <strong>{remainingBalance.toFixed(2)} {lang === 'ar' ? 'دينار' : 'JOD'}</strong> {lang === 'ar' ? 'عند استلام المنتج.' : 'when receiving/picking up the product.'}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg text-[11px] text-emerald-900 font-sans space-y-0.5">
                      <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>{lang === 'ar' ? 'مدفوع بالكامل 100%' : '100% Fully Paid'}</span>
                      </div>
                      <p className="text-[10px] text-emerald-700">{lang === 'ar' ? 'لا يوجد رصيد متبقي على هذا الطلب.' : 'No balance remaining on this order.'}</p>
                    </div>
                  )}
                </div>
              </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3.5 rounded-lg shadow-xs transition cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                {invoiceToEdit 
                  ? (lang === 'ar' ? 'تحديث الفاتورة' : 'Update Invoice') 
                  : (lang === 'ar' ? 'تأكيد الطلب وخصم المخزون' : 'Confirm Order & Deduct Stock')}
              </button>
              {invoiceToEdit && onClearEdit && (
                <button
                  type="button"
                  onClick={() => {
                    if (onClearEdit) onClearEdit();
                    handleResetForm();
                  }}
                  className="mt-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs py-3.5 px-4 rounded-lg shadow-xs transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  {lang === 'ar' ? 'إلغاء التعديل' : 'Cancel Edit'}
                </button>
              )}
            </div>
            </div>
          </div>
        </form>
      )}

      {/* SUBTAB 2: INVOICE HISTORY & PICKUP SETTLEMENT */}
      {activeSubTab === 'invoice_history' && (
        <div className="space-y-6">
          {/* Search & Filter Toolbar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1">
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search invoice #, customer name, or phone number..."
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl p-2.5 pl-9 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-xs font-bold text-slate-500 shrink-0">Filter:</span>

              <button
                onClick={() => setHistoryFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
                  historyFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Orders ({branchInvoices.length})
              </button>

              <button
                onClick={() => setHistoryFilter('pending_balance')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  historyFilter === 'pending_balance'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                }`}
              >
                <HandCoins className="w-3.5 h-3.5" />
                Pending Rest Payment ({pendingPickupInvoicesCount})
              </button>

              <button
                onClick={() => setHistoryFilter('ready_pickup')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
                  historyFilter === 'ready_pickup'
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100'
                }`}
              >
                Ready for Pickup
              </button>

              <button
                onClick={() => setHistoryFilter('completed')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
                  historyFilter === 'completed'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                100% Fully Settled
              </button>
            </div>
          </div>

          {/* Invoices List */}
          {filteredHistoryInvoices.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 space-y-2">
              <Receipt className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="font-bold text-sm text-slate-700">No invoices match your search filter.</p>
              <p className="text-xs">Try clearing search keywords or selecting 'All Orders'.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredHistoryInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-5 shadow-xs transition space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-slate-100 text-slate-800 rounded-xl font-mono font-bold text-xs border border-slate-200">
                        {inv.invoiceNumber}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{inv.customerName}</h4>
                        <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
                          <span>Phone: {inv.customerPhone}</span>
                          <span>•</span>
                          <span>Date: {inv.invoiceDate}</span>
                          <span>•</span>
                          <span>Pickup Target: {inv.deliveryDate}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Delivery Badge */}
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 border ${
                          inv.deliveryStatus === 'Delivered'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : inv.deliveryStatus === 'Ready for Delivery'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        <PackageCheck className="w-3.5 h-3.5" />
                        {inv.deliveryStatus}
                      </span>

                      {/* Payment Badge */}
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border font-mono ${
                          inv.remainingBalance === 0
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {inv.remainingBalance === 0 ? '100% Paid' : `Due: ${inv.remainingBalance.toFixed(2)} JOD`}
                      </span>
                    </div>
                  </div>

                  {/* Items Summary Row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="md:col-span-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Items Included:</span>
                      <div className="space-y-1">
                        {inv.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between font-medium text-slate-800">
                            <span>• {it.description} ({it.quantity}x)</span>
                            <span className="font-mono text-slate-600">{it.total} JOD</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Financial Ledger Breakdown */}
                    <div className="border-t md:border-t-0 md:border-l border-slate-200 pt-2 md:pt-0 md:pl-4 space-y-1 font-mono">
                      <div className="flex justify-between text-slate-500">
                        <span>Grand Total:</span>
                        <span className="font-bold text-slate-900">{inv.grandTotal.toFixed(2)} JOD</span>
                      </div>
                      <div className="flex justify-between text-emerald-700 font-medium">
                        <span>Deposit Paid:</span>
                        <span>{inv.paidAmount.toFixed(2)} JOD</span>
                      </div>
                      <div className="flex justify-between text-amber-700 font-bold border-t border-slate-200 pt-1">
                        <span>Remaining Balance:</span>
                        <span>{inv.remainingBalance.toFixed(2)} JOD</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="text-[11px] text-slate-500">
                      Cashier: <span className="font-medium text-slate-700">{inv.cashier}</span> | Staff:{' '}
                      <span className="font-medium text-slate-700">{inv.salesEmployee}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCreatedInvoice(inv)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-3.5 py-2 rounded-lg border border-slate-200 transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        View / Print Receipt
                      </button>

                      {inv.deliveryStatus === 'Dispatched from Lab' && onUpdateDeliveryStatus && (
                        <button
                          onClick={() => onUpdateDeliveryStatus(inv.id, 'Ready for Delivery')}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-xs transition cursor-pointer flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          {lang === 'ar' ? 'تأكيد استلام المتجر' : 'Confirm Store Receipt'}
                        </button>
                      )}

                      {inv.remainingBalance === 0 && inv.deliveryStatus === 'Ready for Delivery' && onUpdateDeliveryStatus && (
                        <button
                          onClick={() => onUpdateDeliveryStatus(inv.id, 'Delivered')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-xs transition cursor-pointer flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          {lang === 'ar' ? 'تسليم للعميل' : 'Handover to Customer'}
                        </button>
                      )}

                      {inv.remainingBalance > 0 && (
                        <button
                          onClick={() => handleOpenSettleModal(inv)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-xs transition cursor-pointer flex items-center gap-1.5"
                        >
                          <HandCoins className="w-4 h-4" />
                          Settle Rest Payment ({inv.remainingBalance.toFixed(2)} JOD)
                        </button>
                      )}

                      {/* Delete Transaction Button */}
                      {onDeleteInvoice && (
                        <button
                          onClick={() => {
                            if (
                              window.confirm(
                                lang === 'ar'
                                  ? `هل أنت ألكيد من حذف الفاتورة رقم (${inv.invoiceNumber})؟ سيتم إلغاء الحركة وإرجاع الأصناف للمخزون تلقائياً.`
                                  : `Are you sure you want to delete invoice ${inv.invoiceNumber}? Items will be automatically restocked into inventory.`
                              )
                            ) {
                              onDeleteInvoice(inv.id);
                            }
                          }}
                          className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs px-3 py-2 rounded-lg transition cursor-pointer flex items-center gap-1"
                          title={lang === 'ar' ? 'حذف هذه الحركة وإرجاع المخزون' : 'Delete transaction and restock'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          {lang === 'ar' ? 'حذف الفاتورة' : 'Delete'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: SETTLE REMAINING PAYMENT WHEN CUSTOMER RECEIVES PRODUCT */}
      {selectedInvoiceToSettle && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200 font-sans">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <HandCoins className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Settle Rest Payment & Handover</h3>
                  <p className="text-xs text-slate-500 font-mono">Invoice #{selectedInvoiceToSettle.invoiceNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedInvoiceToSettle(null)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer Summary Box */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between font-bold">
                <span className="text-slate-500 uppercase text-[10px]">Client Name:</span>
                <span className="text-slate-900">{selectedInvoiceToSettle.customerName} ({selectedInvoiceToSettle.customerPhone})</span>
              </div>

              <div className="grid grid-cols-3 gap-2 font-mono text-center pt-1 border-t border-slate-200">
                <div className="bg-white p-2 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-400 block font-sans">Total Bill</span>
                  <span className="font-bold text-slate-900">{selectedInvoiceToSettle.grandTotal.toFixed(2)} JOD</span>
                </div>
                <div className="bg-white p-2 rounded border border-slate-200">
                  <span className="text-[10px] text-emerald-600 block font-sans">Previous Deposit</span>
                  <span className="font-bold text-emerald-700">{selectedInvoiceToSettle.paidAmount.toFixed(2)} JOD</span>
                </div>
                <div className="bg-amber-50 p-2 rounded border border-amber-300">
                  <span className="text-[10px] text-amber-800 block font-sans font-bold">Outstanding Rest</span>
                  <span className="font-extrabold text-amber-900">{selectedInvoiceToSettle.remainingBalance.toFixed(2)} JOD</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleConfirmSettlePayment} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Rest Payment Amount Received (JOD) *</label>
                <input
                  type="number"
                  required
                  min={0.01}
                  max={selectedInvoiceToSettle.remainingBalance}
                  step="any"
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-emerald-500 text-emerald-800 text-base font-extrabold rounded-xl p-3 font-mono focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Payment Method *</label>
                <select
                  value={settlePaymentMethod}
                  onChange={(e) => setSettlePaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl p-2.5 font-bold cursor-pointer"
                >
                  <option value="Cash">Cash (نقدي)</option>
                  <option value="Visa">Visa (فيزا)</option>
                  <option value="Cliq">Cliq (كليك)</option>
                  <option value="Insurance">Insurance (تأمين)</option>
                  <option value="Bank Transfer">Bank Transfer (حوالة بنكية)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Staff Notes / Pickup Remarks</label>
                <input
                  type="text"
                  value={settleNotes}
                  onChange={(e) => setSettleNotes(e.target.value)}
                  placeholder="e.g. Client received product in perfect condition"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl p-2.5 font-medium"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedInvoiceToSettle(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Settle Payment & Mark Delivered
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: INVOICE DIGITAL RECEIPT MODAL */}
      {createdInvoice && (
        <InvoiceReceiptModal
          invoice={createdInvoice}
          branches={branches}
          activeBranch={activeBranch}
          onClose={() => setCreatedInvoice(null)}
        />
      )}

      {/* MODAL 3: DISCOUNT APPROVAL */}
      {discountApprovalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              {lang === 'ar' ? 'مطلوب موافقة المشرف' : 'Admin Approval Required'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {lang === 'ar' 
                ? 'لا تملك صلاحية إضافة خصم. يرجى إدخال رمز التعريف الشخصي (PIN) للمدير أو المحاسب.' 
                : 'You do not have permission to apply discounts. Please enter an Admin or Accountant PIN.'}
            </p>
            <input
              type="password"
              placeholder="PIN"
              value={adminPin}
              onChange={(e) => setAdminPin(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-center tracking-[0.5em] font-mono text-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition mb-2"
              autoFocus
            />
            {pinError && <p className="text-xs text-rose-500 mb-4 text-center font-bold">{pinError}</p>}
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setDiscountApprovalOpen(false);
                  setPendingDiscount(null);
                }}
                className="px-4 py-2 text-slate-600 font-bold text-sm hover:bg-slate-100 rounded-lg transition cursor-pointer"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleApproveDiscount}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold text-sm shadow-xs transition cursor-pointer"
              >
                {lang === 'ar' ? 'اعتماد الخصم' : 'Approve Discount'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: CREATE NEW CUSTOMER MODAL */}
      {isNewCustomerModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600" />
                <span>{lang === 'ar' ? 'إضافة وتحديد عميل جديد' : 'Create & Select New Customer'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsNewCustomerModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewCustomer} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  {lang === 'ar' ? 'اسم العميل بالكامل *' : 'Full Customer Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder={lang === 'ar' ? 'مثال: محمد سليم العبداللات' : 'e.g. Mohammad S. Al-Abdallat'}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl p-3 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  autoFocus
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  {lang === 'ar' ? 'رقم الهاتف *' : 'Phone Number *'}
                </label>
                <input
                  type="text"
                  required
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="+962 7 9888 7766"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl p-3 font-mono font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  {lang === 'ar' ? 'ملاحظات إضافية (اختياري)' : 'Notes / Address (Optional)'}
                </label>
                <textarea
                  rows={2}
                  value={newCustNotes}
                  onChange={(e) => setNewCustNotes(e.target.value)}
                  placeholder={lang === 'ar' ? 'العنوان أو ملاحظات العميل...' : 'Address or customer notes...'}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl p-3 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsNewCustomerModalOpen(false)}
                  className="px-4 py-2.5 text-slate-600 font-bold text-xs hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{lang === 'ar' ? 'حفظ العميل وتعبئته بالفاتورة' : 'Save & Auto-Fill Invoice'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
