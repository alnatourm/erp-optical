import React, { useState } from 'react';
import { Truck, Phone, Mail, MapPin, DollarSign, Plus, Edit2, FileText, Trash2, FileSpreadsheet, Search, CheckCircle2, PackagePlus, X, Sparkles, Download, ArrowRight, ArrowLeft, ChevronDown, ChevronRight, History, User } from 'lucide-react';
import { Supplier, PurchaseOrder, PurchaseOrderItem, Product } from '../types';
import { useLanguage } from '../lib/i18n';
import * as XLSX from 'xlsx';

interface SuppliersModuleProps {
  suppliers: Supplier[];
  products?: Product[];
  onSaveSupplier?: (supplier: Partial<Supplier>) => void;
  purchaseOrders?: PurchaseOrder[];
  onSavePurchaseOrder?: (po: Partial<PurchaseOrder>) => void;
  onSaveProduct?: (product: Partial<Product> & { barcode: string }) => void;
}

export const SuppliersModule: React.FC<SuppliersModuleProps> = ({ 
  suppliers, 
  products = [],
  onSaveSupplier,
  purchaseOrders = [],
  onSavePurchaseOrder,
  onSaveProduct
}) => {
  const { lang, t } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Partial<Supplier> | null>(null);

  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [selectedSupplierForPO, setSelectedSupplierForPO] = useState<Supplier | null>(null);
  const [poItems, setPoItems] = useState<PurchaseOrderItem[]>([]);
  const [poNotes, setPoNotes] = useState('');
  const [poExpectedDate, setPoExpectedDate] = useState('');

  const [viewingSupplierId, setViewingSupplierId] = useState<string | null>(null);
  const [expandedPOId, setExpandedPOId] = useState<string | null>(null);

  const [isPOTotalsConfirmed, setIsPOTotalsConfirmed] = useState(false);
  const [poIdToEdit, setPoIdToEdit] = useState<string | null>(null);

  // Quick Add New Product to DB from PO Modal State
  const [isQuickAddProductOpen, setIsQuickAddProductOpen] = useState(false);
  const [targetPOIndexForNewProduct, setTargetPOIndexForNewProduct] = useState<number | null>(null);
  const [newProductForm, setNewProductForm] = useState({
    barcode: '',
    brand: '',
    model: '',
    description: '',
    frameType: 'Full Rim' as const,
    purchaseCost: 40,
    sellingPrice: 90,
  });

  const handleOpenModal = (sup?: Supplier) => {
    if (sup) {
      setEditingSupplier(sup);
    } else {
      setEditingSupplier({
        name: '',
        contactPerson: '',
        phone: '',
        email: '',
        address: '',
        balance: 0,
        purchaseOrdersNotes: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSupplier && onSaveSupplier) {
      onSaveSupplier(editingSupplier);
    }
    setIsModalOpen(false);
    setEditingSupplier(null);
  };

  const handleOpenPOModal = (supplier: Supplier, poToEdit?: PurchaseOrder) => {
    setSelectedSupplierForPO(supplier);
    setIsPOTotalsConfirmed(false);
    if (poToEdit) {
      setPoIdToEdit(poToEdit.id);
      setPoItems([...poToEdit.items]);
      setPoNotes(poToEdit.notes || '');
      setPoExpectedDate(poToEdit.expectedDeliveryDate || '');
    } else {
      setPoIdToEdit(null);
      setPoItems([{ barcode: '', description: '', quantityOrdered: 1, quantityReceived: 0, unitPrice: 0, totalPrice: 0 }]);
      setPoNotes('');
      setPoExpectedDate('');
    }
    setIsPOModalOpen(true);
  };

  const handleAddPOItem = () => {
    setPoItems([...poItems, { barcode: '', description: '', quantityOrdered: 1, quantityReceived: 0, unitPrice: 0, totalPrice: 0 }]);
  };

  const handleUpdatePOItem = (index: number, field: keyof PurchaseOrderItem, value: any) => {
    const newItems = [...poItems];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === 'barcode') {
      const matchedProduct = products.find(p => p.barcode === value);
      if (matchedProduct) {
        const costP = matchedProduct.purchaseCost || (matchedProduct as any).costPrice || Math.round(matchedProduct.sellingPrice * 0.6) || 0;
        newItems[index].description = `${matchedProduct.brand} - ${matchedProduct.description}`;
        newItems[index].unitPrice = costP;
        newItems[index].totalPrice = newItems[index].quantityOrdered * costP;
      }
    } else if (field === 'quantityOrdered' || field === 'unitPrice') {
      newItems[index].totalPrice = newItems[index].quantityOrdered * newItems[index].unitPrice;
    }
    
    setPoItems(newItems);
  };

  const handleRemovePOItem = (index: number) => {
    const newItems = [...poItems];
    newItems.splice(index, 1);
    setPoItems(newItems);
  };

  const downloadPOTemplate = () => {
    const wsData = [
      ['Barcode / الرمز', 'Description / الصنف', 'Quantity / الكمية', 'Unit Price / السعر'],
      ['10001', 'Example Frame', 10, 5.50],
      ['10002', 'Example Lens', 5, 12.00]
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // Auto-size columns slightly for better visibility
    ws['!cols'] = [{ wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 15 }];
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'PO_Template');
    XLSX.writeFile(wb, 'PO_Import_Template.xlsx');
  };

  const handlePOExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const data: any[] = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) return;

        const importedItems: PurchaseOrderItem[] = data.map((row) => {
          const rowKeys = Object.keys(row);
          const findVal = (keywords: string[]) => {
            const k = rowKeys.find(key => keywords.some(kw => key.toLowerCase().includes(kw)));
            return k ? row[k] : undefined;
          };

          const rawBarcode = findVal(['barcode', 'code', 'باركود', 'رمز']) || 'PO-ITEM';
          const rawDesc = findVal(['description', 'name', 'item', 'صنف', 'وصف']) || 'Imported Frame / Lens';
          const rawQty = findVal(['quantity', 'qty', 'الكمية', 'عدد']) || 1;
          const rawPrice = findVal(['price', 'cost', 'السعر', 'تكلفة']) || 0;

          const qty = parseInt(rawQty) || 1;
          const price = parseFloat(rawPrice) || 0;

          return {
            barcode: String(rawBarcode).trim(),
            description: String(rawDesc).trim(),
            quantityOrdered: qty,
            quantityReceived: 0,
            unitPrice: price,
            totalPrice: qty * price
          };
        });

        setPoItems(importedItems);
        alert(lang === 'ar' ? `تم استيراد ${importedItems.length} صنف من ملف أكسل بنجاح!` : `Successfully imported ${importedItems.length} PO items from Excel!`);
      } catch (err: any) {
        alert(lang === 'ar' ? 'فشل قراءة ملف الاكسل' : 'Failed to parse Excel file.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleOpenQuickAddProduct = (index?: number) => {
    const existingRow = index !== undefined && poItems[index] ? poItems[index] : null;
    const generatedBarcode = existingRow?.barcode && existingRow.barcode !== 'PO-ITEM' 
      ? existingRow.barcode 
      : `PRD-${Date.now().toString().slice(-6)}`;
    
    const defaultBrand = selectedSupplierForPO?.name 
      ? selectedSupplierForPO.name.split(' ')[0].toUpperCase() 
      : 'OPTICAL';

    setTargetPOIndexForNewProduct(index !== undefined ? index : null);
    setNewProductForm({
      barcode: generatedBarcode,
      brand: defaultBrand,
      model: existingRow?.description ? existingRow.description.split(' - ')[0] : 'NEW MODEL',
      description: existingRow?.description || 'نظارة طبية / إطار جديد',
      frameType: 'Full Rim',
      purchaseCost: existingRow?.unitPrice || 40,
      sellingPrice: (existingRow?.unitPrice || 40) * 2,
    });
    setIsQuickAddProductOpen(true);
  };

  const handleSaveQuickProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductForm.barcode.trim()) return;

    if (onSaveProduct) {
      onSaveProduct({
        barcode: newProductForm.barcode.trim(),
        brand: newProductForm.brand.trim() || 'GENERIC',
        model: newProductForm.model.trim() || 'NEW FRAME',
        description: newProductForm.description.trim() || 'Optical Item',
        frameType: newProductForm.frameType,
        purchaseCost: newProductForm.purchaseCost,
        sellingPrice: newProductForm.sellingPrice,
        supplier: selectedSupplierForPO?.name || 'Main Supplier',
        currentQuantity: 0,
        availableQuantity: 0,
        reservedQuantity: 0,
        minimumStock: 2,
        maximumStock: 20,
      });
    }

    const fullDesc = `${newProductForm.brand.toUpperCase()} - ${newProductForm.description}`;
    const unitP = newProductForm.purchaseCost;

    if (targetPOIndexForNewProduct !== null && targetPOIndexForNewProduct < poItems.length) {
      const updated = [...poItems];
      updated[targetPOIndexForNewProduct] = {
        ...updated[targetPOIndexForNewProduct],
        barcode: newProductForm.barcode.trim(),
        description: fullDesc,
        unitPrice: unitP,
        totalPrice: unitP * updated[targetPOIndexForNewProduct].quantityOrdered,
      };
      setPoItems(updated);
    } else {
      setPoItems((prev) => [
        ...prev,
        {
          barcode: newProductForm.barcode.trim(),
          description: fullDesc,
          quantityOrdered: 1,
          quantityReceived: 0,
          unitPrice: unitP,
          totalPrice: unitP,
        },
      ]);
    }

    setIsQuickAddProductOpen(false);
  };

  const handleSelectProductForPOItem = (index: number, product: Product) => {
    const updated = [...poItems];
    const costP = product.purchaseCost || (product as any).costPrice || Math.round(product.sellingPrice * 0.6);
    updated[index] = {
      ...updated[index],
      barcode: product.barcode,
      description: `${product.brand} - ${product.description}`,
      unitPrice: costP,
      totalPrice: costP * updated[index].quantityOrdered
    };
    setPoItems(updated);
  };

  const handlePOSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSupplierForPO && onSavePurchaseOrder) {
      // Auto register any new items that don't exist in products DB
      if (onSaveProduct) {
        poItems.forEach(item => {
          if (item.barcode && !products.some(p => p.barcode === item.barcode)) {
            onSaveProduct({
              barcode: item.barcode,
              brand: selectedSupplierForPO.name.split(' ')[0].toUpperCase(),
              model: item.description,
              description: item.description,
              frameType: 'Full Rim',
              purchaseCost: item.unitPrice,
              sellingPrice: Math.round(item.unitPrice * 2) || 80,
              supplier: selectedSupplierForPO.name,
              currentQuantity: 0,
              availableQuantity: 0,
              reservedQuantity: 0,
            });
          }
        });
      }

      const totalAmount = poItems.reduce((sum, item) => sum + item.totalPrice, 0);
      onSavePurchaseOrder({
        ...(poIdToEdit ? { id: poIdToEdit } : {}),
        supplierId: selectedSupplierForPO.id,
        supplierName: selectedSupplierForPO.name,
        expectedDeliveryDate: poExpectedDate,
        notes: poNotes,
        items: poItems,
        totalAmount,
      });
      setIsPOModalOpen(false);
      setSelectedSupplierForPO(null);
    }
  };

  const viewingSupplier = suppliers.find(s => s.id === viewingSupplierId);
  const supplierPOs = purchaseOrders.filter(po => po.supplierId === viewingSupplierId).sort((a,b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());

  return (
    <div id="suppliers-module" className="p-6 space-y-6 max-w-7xl mx-auto text-slate-900">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            {viewingSupplierId ? (
              <button onClick={() => { setViewingSupplierId(null); setExpandedPOId(null); }} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer transition">
                {lang === 'ar' ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
              </button>
            ) : (
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Truck className="w-6 h-6" />
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {viewingSupplierId && viewingSupplier
                  ? (lang === 'ar' ? `سجل وتفاصيل: ${viewingSupplier.name}` : `Details & History: ${viewingSupplier.name}`)
                  : (lang === 'ar' ? 'سجل الموردين وأوامر الشراء' : 'Suppliers & Purchase Orders')
                }
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {viewingSupplierId
                  ? (lang === 'ar' ? 'عرض فواتير وأوامر الشراء الخاصة بهذا المورد' : 'View purchase orders and history for this supplier.')
                  : (lang === 'ar'
                    ? 'إدارة شركات تصنيع عدسات النظارات، الوكلاء المعتمدين للإطارات، وأرصدة الذمم المترتبة للموردين'
                    : 'Manage eyeglass frame brands, lens manufacturer accounts, and accounts payable balances.')
                }
              </p>
            </div>
          </div>
        </div>
        
        {!viewingSupplierId && onSaveSupplier && (
          <button
            onClick={() => handleOpenModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-xs transition flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            {lang === 'ar' ? 'إضافة مورد جديد' : 'Add New Supplier'}
          </button>
        )}
        {viewingSupplierId && viewingSupplier && onSavePurchaseOrder && (
          <button
            onClick={() => handleOpenPOModal(viewingSupplier)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-xs transition flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            {lang === 'ar' ? 'أمر شراء جديد' : 'New P.O.'}
          </button>
        )}
      </div>

      {!viewingSupplierId ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {suppliers.map((sup) => (
          <div
            key={sup.id}
            className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4 hover:border-slate-300 transition relative group"
          >
            {onSaveSupplier && (
              <button
                onClick={() => handleOpenModal(sup)}
                className="absolute top-4 right-4 rtl:left-4 rtl:right-auto p-2 bg-slate-50 text-slate-500 hover:text-blue-600 rounded-lg opacity-0 group-hover:opacity-100 transition cursor-pointer"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="pr-8 rtl:pr-0 rtl:pl-8">
                <h3 className="font-bold text-slate-900 text-sm">{sup.name}</h3>
                <p className="text-xs text-slate-500 font-medium">
                  {lang === 'ar' ? 'الشخص المسؤول: ' : 'Contact: '}{sup.contactPerson}
                </p>
              </div>
              <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Truck className="w-4 h-4" />
              </span>
            </div>

            <div className="space-y-2 text-xs text-slate-700 font-medium">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="font-mono text-slate-900">{sup.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="text-slate-900">{sup.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="text-slate-500">{sup.address}</span>
              </div>
            </div>
            
            {sup.purchaseOrdersNotes && (
              <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 text-xs">
                <span className="text-blue-800 font-bold block mb-1">
                  {lang === 'ar' ? 'ملاحظات أمر الشراء (P.O):' : 'P.O Notes:'}
                </span>
                <span className="text-blue-700 whitespace-pre-wrap">{sup.purchaseOrdersNotes}</span>
              </div>
            )}

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center text-xs mt-auto">
              <span className="text-slate-500 font-bold">
                {lang === 'ar' ? 'الرصيد الدائن / الذمم المترتبة:' : 'Outstanding Payable:'}
              </span>
              <span className="font-bold font-mono text-emerald-700">{sup.balance?.toLocaleString() || 0} {lang === 'ar' ? 'د.أ' : 'JOD'}</span>
            </div>

            <div className="flex gap-2 w-full mt-2">
              <button
                onClick={() => setViewingSupplierId(sup.id)}
                className="flex-1 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-2"
              >
                <History className="w-4 h-4" />
                {lang === 'ar' ? 'السجل والتفاصيل' : 'History & Details'}
              </button>
              {onSavePurchaseOrder && (
                <button
                  onClick={() => handleOpenPOModal(sup)}
                  className="flex-1 bg-blue-50 border border-blue-100 hover:bg-blue-100 text-blue-700 font-bold text-xs py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  {lang === 'ar' ? 'أمر شراء' : 'New P.O.'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      ) : (
        <div className="space-y-6">
          {viewingSupplier && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row gap-6">
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg mb-1">{viewingSupplier.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <User className="w-4 h-4 shrink-0" />
                    <span>{lang === 'ar' ? 'مسؤول الاتصال:' : 'Contact Person:'} {viewingSupplier.contactPerson}</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-700">
                   <div className="flex items-center gap-2">
                     <Phone className="w-4 h-4 text-blue-600 shrink-0" />
                     <span className="font-mono">{viewingSupplier.phone}</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                     <span>{viewingSupplier.email}</span>
                   </div>
                   <div className="flex items-center gap-2 sm:col-span-2">
                     <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                     <span>{viewingSupplier.address}</span>
                   </div>
                </div>
                {viewingSupplier.purchaseOrdersNotes && (
                  <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 text-sm mt-2">
                    <span className="text-blue-800 font-bold block mb-1">
                      {lang === 'ar' ? 'ملاحظات أمر الشراء (P.O):' : 'P.O Notes:'}
                    </span>
                    <span className="text-blue-700 whitespace-pre-wrap">{viewingSupplier.purchaseOrdersNotes}</span>
                  </div>
                )}
              </div>
              <div className="w-full md:w-64 flex flex-col justify-center items-center p-6 bg-slate-50 rounded-lg border border-slate-200 shrink-0 text-center">
                 <span className="text-slate-500 font-bold mb-2">
                   {lang === 'ar' ? 'الرصيد الدائن / الذمم:' : 'Outstanding Payable:'}
                 </span>
                 <span className="text-2xl font-bold font-mono text-emerald-700">{viewingSupplier.balance?.toLocaleString() || 0} {lang === 'ar' ? 'د.أ' : 'JOD'}</span>
              </div>
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                {lang === 'ar' ? 'سجل أوامر الشراء (P.O History)' : 'Purchase Order History'}
              </h3>
            </div>
            {supplierPOs.length === 0 ? (
               <div className="p-8 text-center text-slate-500 text-sm">
                 {lang === 'ar' ? 'لا توجد أوامر شراء مسجلة لهذا المورد.' : 'No purchase orders recorded for this supplier.'}
               </div>
            ) : (
               <div className="divide-y divide-slate-100">
                 {supplierPOs.map(po => (
                   <div key={po.id} className="group">
                     <div 
                       onClick={() => setExpandedPOId(expandedPOId === po.id ? null : po.id)}
                       className="p-4 hover:bg-slate-50 cursor-pointer flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition"
                     >
                       <div className="flex items-center gap-4">
                         <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                           {expandedPOId === po.id ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5 rtl:rotate-180" />}
                         </div>
                         <div>
                           <div className="font-bold text-slate-900 font-mono">{po.poNumber}</div>
                           <div className="text-xs text-slate-500 mt-1">{new Date(po.orderDate).toLocaleDateString()}</div>
                         </div>
                       </div>
                       
                       <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                         <div className="text-left rtl:text-right">
                           <div className="text-xs text-slate-500">{lang === 'ar' ? 'القيمة' : 'Amount'}</div>
                           <div className="font-bold font-mono text-slate-900">{po.totalAmount?.toLocaleString()} {lang === 'ar' ? 'د.أ' : 'JOD'}</div>
                         </div>
                         <div className="text-left rtl:text-right min-w-[100px]">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                              po.status === 'Received' ? 'bg-emerald-100 text-emerald-700' :
                              po.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {po.status === 'Pending' && lang === 'ar' ? 'قيد الانتظار' : po.status === 'Received' && lang === 'ar' ? 'مكتمل/مستلم' : po.status}
                            </span>
                         </div>
                       </div>
                     </div>
                     
                     {expandedPOId === po.id && (
                       <div className="p-4 bg-slate-50 border-t border-slate-100">
                         <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
                            <table className="w-full text-left rtl:text-right text-xs">
                               <thead className="bg-slate-50 text-slate-500 font-medium">
                                 <tr>
                                   <th className="p-3 border-b">{lang === 'ar' ? 'الباركود' : 'Barcode'}</th>
                                   <th className="p-3 border-b">{lang === 'ar' ? 'الوصف' : 'Description'}</th>
                                   <th className="p-3 border-b">{lang === 'ar' ? 'الكمية' : 'Qty'}</th>
                                   <th className="p-3 border-b">{lang === 'ar' ? 'السعر' : 'Unit Price'}</th>
                                   <th className="p-3 border-b">{lang === 'ar' ? 'المجموع' : 'Total'}</th>
                                 </tr>
                               </thead>
                               <tbody className="divide-y divide-slate-100">
                                 {po.items.map((item, idx) => (
                                   <tr key={idx} className="hover:bg-slate-50">
                                     <td className="p-3 font-mono">{item.barcode}</td>
                                     <td className="p-3">{item.description}</td>
                                     <td className="p-3 font-bold">{item.quantityOrdered}</td>
                                     <td className="p-3 font-mono">{item.unitPrice}</td>
                                     <td className="p-3 font-bold text-emerald-700 font-mono">{item.totalPrice}</td>
                                   </tr>
                                 ))}
                               </tbody>
                            </table>
                         </div>
                         {po.notes && (
                           <div className="mt-3 text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-200">
                             <span className="font-bold">{lang === 'ar' ? 'ملاحظات: ' : 'Notes: '}</span>
                             {po.notes}
                           </div>
                         )}
                         {po.status === 'Pending' && (
                           <div className="mt-4 flex justify-end">
                             <button
                               onClick={() => handleOpenPOModal(viewingSupplier, po)}
                               className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer"
                             >
                               <Edit2 className="w-4 h-4" />
                               {lang === 'ar' ? 'تعديل أمر الشراء' : 'Edit P.O.'}
                             </button>
                           </div>
                         )}
                       </div>
                     )}
                   </div>
                 ))}
               </div>
            )}
          </div>
        </div>
      )}

      {isModalOpen && editingSupplier && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b">
              {editingSupplier.id ? (lang === 'ar' ? 'تعديل بيانات المورد' : 'Edit Supplier') : (lang === 'ar' ? 'إضافة مورد جديد' : 'Add Supplier')}
            </h3>
            
            <form onSubmit={handleFormSubmit} className="space-y-4 text-left rtl:text-right">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{lang === 'ar' ? 'اسم الشركة / المورد' : 'Supplier Name'}</label>
                <input
                  type="text"
                  required
                  value={editingSupplier.name || ''}
                  onChange={e => setEditingSupplier({...editingSupplier, name: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{lang === 'ar' ? 'الشخص المسؤول' : 'Contact Person'}</label>
                  <input
                    type="text"
                    required
                    value={editingSupplier.contactPerson || ''}
                    onChange={e => setEditingSupplier({...editingSupplier, contactPerson: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">{lang === 'ar' ? 'رقم الهاتف' : 'Phone'}</label>
                  <input
                    type="text"
                    required
                    value={editingSupplier.phone || ''}
                    onChange={e => setEditingSupplier({...editingSupplier, phone: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm font-mono outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}</label>
                <input
                  type="email"
                  value={editingSupplier.email || ''}
                  onChange={e => setEditingSupplier({...editingSupplier, email: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm font-mono outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{lang === 'ar' ? 'العنوان' : 'Address'}</label>
                <input
                  type="text"
                  value={editingSupplier.address || ''}
                  onChange={e => setEditingSupplier({...editingSupplier, address: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{lang === 'ar' ? 'الرصيد الدائن المستحق (JOD)' : 'Outstanding Payable (JOD)'}</label>
                <input
                  type="number"
                  value={editingSupplier.balance ?? 0}
                  onChange={e => setEditingSupplier({...editingSupplier, balance: parseFloat(e.target.value) || 0})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm font-mono font-bold text-emerald-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{lang === 'ar' ? 'ملاحظات أوامر الشراء (P.O)' : 'Purchase Orders (P.O) Notes'}</label>
                <textarea
                  value={editingSupplier.purchaseOrdersNotes || ''}
                  onChange={e => setEditingSupplier({...editingSupplier, purchaseOrdersNotes: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm h-24 resize-none outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  placeholder={lang === 'ar' ? 'أضف أي ملاحظات حول أوامر الشراء، الدفعات، التوريدات...' : 'Add notes about purchase orders, shipments, payments...'}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-bold text-sm hover:bg-slate-100 rounded-lg transition cursor-pointer"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold text-sm shadow-xs transition cursor-pointer"
                >
                  {lang === 'ar' ? 'حفظ البيانات' : 'Save Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PO Modal */}
      {isPOModalOpen && selectedSupplierForPO && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b">
              {lang === 'ar' ? 'إنشاء أمر شراء جديد - ' : 'Create New P.O. - '}
              <span className="text-blue-600">{selectedSupplierForPO.name}</span>
            </h3>
            
            <form onSubmit={handlePOSubmit} className="space-y-4 text-left rtl:text-right">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{lang === 'ar' ? 'تاريخ التسليم المتوقع' : 'Expected Delivery Date'}</label>
                <input
                  type="date"
                  value={poExpectedDate}
                  onChange={e => setPoExpectedDate(e.target.value)}
                  className="w-full sm:w-1/3 bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                />
              </div>

              <div>
                <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
                  <label className="block text-xs font-bold text-slate-700">{lang === 'ar' ? 'الأصناف (المنتجات المطلوبة)' : 'Items Ordered'}</label>
                  
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenQuickAddProduct()}
                      className="cursor-pointer bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition"
                    >
                      <PackagePlus className="w-3.5 h-3.5 text-amber-600" />
                      <span className="hidden sm:inline">{lang === 'ar' ? 'صنف جديد' : 'New Product'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={downloadPOTemplate}
                      className="cursor-pointer bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{lang === 'ar' ? 'تحميل نموذج' : 'Template'}</span>
                    </button>

                    <label className="cursor-pointer bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition">
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>{lang === 'ar' ? 'استيراد من الاكسل' : 'Import Excel'}</span>
                      <input type="file" accept=".xlsx,.xls,.csv" onChange={handlePOExcelUpload} className="hidden" />
                    </label>

                    <button type="button" onClick={handleAddPOItem} className="text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition">
                      <Plus className="w-3.5 h-3.5" /> <span className="hidden sm:inline">{lang === 'ar' ? 'إضافة صنف' : 'Add Item'}</span>
                    </button>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {poItems.map((item, index) => (
                    <div key={index} className="flex flex-wrap sm:flex-nowrap gap-3 items-start border p-3 rounded-lg border-slate-200 bg-slate-50">
                      <div className="w-full sm:w-1/3 space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-500">{lang === 'ar' ? 'الباركود/الرمز' : 'Barcode'}</label>
                        <input
                          type="text"
                          placeholder={lang === 'ar' ? 'الباركود/الرمز' : 'Barcode'}
                          required
                          value={item.barcode}
                          onChange={e => handleUpdatePOItem(index, 'barcode', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded p-2 text-xs font-mono outline-none focus:border-blue-500"
                        />
                        <select
                          value={products.find(p => p.barcode === item.barcode)?.id || ""}
                          onChange={(e) => {
                            if (e.target.value === 'NEW_PRODUCT_PROMPT') {
                              handleOpenQuickAddProduct(index);
                              e.target.value = '';
                              return;
                            }
                            const selProd = products.find(p => p.id === e.target.value);
                            if (selProd) handleSelectProductForPOItem(index, selProd);
                          }}
                          className="w-full bg-white border border-slate-200 text-[10px] rounded p-1 text-slate-700 font-medium outline-none"
                        >
                          <option value="">{lang === 'ar' ? 'انقر لاختيار صنف موجود...' : 'Select existing product...'}</option>
                          <option value="NEW_PRODUCT_PROMPT" className="font-bold text-amber-700 bg-amber-50">
                            {lang === 'ar' ? '✨ + صنف جديد غير موجود بالقائمة (إضافة للأنظمة)' : '✨ + New Product (Add to DB)'}
                          </option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.barcode} - {p.brand} ({p.model})</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => handleOpenQuickAddProduct(index)}
                          className="w-full bg-amber-50/80 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded p-1 text-[10px] font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                        >
                          <PackagePlus className="w-3 h-3 text-amber-600" />
                          <span>{lang === 'ar' ? 'صنف جديد؟ انقر لتعريفه بالنظام' : 'New Product? Click to Add'}</span>
                        </button>
                      </div>
                      <div className="w-full sm:w-1/4">
                        <label className="block text-[10px] font-bold text-slate-500 mb-1.5">{lang === 'ar' ? 'الوصف' : 'Description'}</label>
                        <input
                          type="text"
                          placeholder={lang === 'ar' ? 'الوصف' : 'Description'}
                          required
                          value={item.description}
                          onChange={e => handleUpdatePOItem(index, 'description', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded p-2 text-xs outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="w-1/3 sm:w-1/6">
                        <label className="block text-[10px] font-bold text-slate-500 mb-1.5">{lang === 'ar' ? 'الكمية' : 'Qty'}</label>
                        <input
                          type="number"
                          placeholder={lang === 'ar' ? 'الكمية' : 'Qty'}
                          required min="1"
                          value={item.quantityOrdered}
                          onChange={e => handleUpdatePOItem(index, 'quantityOrdered', parseInt(e.target.value) || 1)}
                          className="w-full bg-white border border-slate-200 rounded p-2 text-xs outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="w-1/3 sm:w-1/6">
                        <label className="block text-[10px] font-bold text-slate-500 mb-1.5">{lang === 'ar' ? 'السعر' : 'Unit Price'}</label>
                        <input
                          type="number"
                          placeholder={lang === 'ar' ? 'السعر' : 'Unit Price'}
                          required min="0" step="0.01"
                          value={item.unitPrice}
                          onChange={e => handleUpdatePOItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-full bg-white border border-slate-200 rounded p-2 text-xs font-mono outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="w-1/4 sm:w-1/6 flex flex-col items-start justify-center">
                        <label className="block text-[10px] font-bold text-slate-500 mb-1.5 w-full">{lang === 'ar' ? 'المجموع' : 'Total'}</label>
                        <div className="flex items-center justify-between w-full mt-1.5">
                          <span className="text-xs font-bold font-mono px-2">{item.totalPrice.toFixed(2)}</span>
                          {poItems.length > 1 && (
                            <button type="button" onClick={() => handleRemovePOItem(index)} className="text-rose-500 hover:text-rose-700 cursor-pointer">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {poItems.length > 0 && (
                  <div className="bg-slate-100 p-4 mt-2 rounded-lg border border-slate-200 shadow-inner">
                    <div className="flex justify-between items-center text-sm font-bold mb-4">
                      <span className="text-slate-700">{lang === 'ar' ? 'إجمالي الأصناف:' : 'Total Items:'}</span>
                      <div className="flex gap-6">
                        <div className="text-blue-800">
                          <span className="text-xs text-slate-500 mr-2">{lang === 'ar' ? 'الكمية الإجمالية:' : 'Total Qty:'}</span>
                          {poItems.reduce((acc, item) => acc + item.quantityOrdered, 0)}
                        </div>
                        <div className="text-emerald-800">
                          <span className="text-xs text-slate-500 mr-2">{lang === 'ar' ? 'المبلغ الإجمالي:' : 'Total Price:'}</span>
                          {poItems.reduce((acc, item) => acc + item.totalPrice, 0).toFixed(2)} JOD
                        </div>
                      </div>
                    </div>
                    <div className="border-t border-slate-200 pt-3 flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="confirm-po-totals"
                        checked={isPOTotalsConfirmed}
                        onChange={(e) => setIsPOTotalsConfirmed(e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-white border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                      />
                      <label htmlFor="confirm-po-totals" className="text-xs text-slate-700 font-medium cursor-pointer">
                        {lang === 'ar' 
                          ? 'أؤكد صحة المبالغ والكميات المدخلة في أمر الشراء قبل الحفظ.' 
                          : 'I confirm the quantities and prices entered in this purchase order.'}
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{lang === 'ar' ? 'ملاحظات أمر الشراء (P.O)' : 'P.O Notes'}</label>
                <textarea
                  value={poNotes}
                  onChange={e => setPoNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm h-20 resize-none outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  placeholder={lang === 'ar' ? 'أي ملاحظات إضافية...' : 'Any additional notes...'}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsPOModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-bold text-sm hover:bg-slate-100 rounded-lg transition cursor-pointer"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={!isPOTotalsConfirmed || poItems.length === 0}
                  className={`${isPOTotalsConfirmed && poItems.length > 0 ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer' : 'bg-slate-300 text-slate-500 cursor-not-allowed'} px-6 py-2 rounded-lg font-bold text-sm shadow-xs transition`}
                >
                  {poIdToEdit 
                    ? (lang === 'ar' ? 'تحديث أمر الشراء' : 'Update P.O.') 
                    : (lang === 'ar' ? 'إنشاء أمر الشراء' : 'Create P.O.')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Add Product Modal */}
      {isQuickAddProductOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-slate-900 text-right rtl">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-lg">
                  <PackagePlus className="w-5 h-5" />
                </div>
                <span>{lang === 'ar' ? 'إضافة صنف جديد لقاعدة البيانات من أمر الشراء' : 'Add New Product to Database'}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickAddProductOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickProduct} className="space-y-3 text-xs">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] leading-relaxed">
                💡 {lang === 'ar' 
                  ? 'سيتم تسجيل هذا الصنف فوراً في قاعدة بيانات المنتجات وإدراجه تلقائياً في امر الشراء الحالي.' 
                  : 'This item will be saved directly into the Product Database and added to this Purchase Order.'}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-700 font-bold block">{lang === 'ar' ? 'الباركود / الرمز:' : 'Barcode:'}</label>
                  <input
                    type="text"
                    required
                    value={newProductForm.barcode}
                    onChange={(e) => setNewProductForm({ ...newProductForm, barcode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-700 font-bold block">{lang === 'ar' ? 'الماركة / العلامة التجارية:' : 'Brand:'}</label>
                  <input
                    type="text"
                    required
                    value={newProductForm.brand}
                    onChange={(e) => setNewProductForm({ ...newProductForm, brand: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-700 font-bold block">{lang === 'ar' ? 'الموديل / الرقم:' : 'Model:'}</label>
                  <input
                    type="text"
                    required
                    value={newProductForm.model}
                    onChange={(e) => setNewProductForm({ ...newProductForm, model: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-700 font-bold block">{lang === 'ar' ? 'نوع الإطار / التصنيف:' : 'Frame Type:'}</label>
                  <select
                    value={newProductForm.frameType}
                    onChange={(e) => setNewProductForm({ ...newProductForm, frameType: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="Full Rim">Full Rim (كامل)</option>
                    <option value="Semi-Rimless">Semi-Rimless (خيط)</option>
                    <option value="Rimless">Rimless (براغي)</option>
                    <option value="Sunglasses">Sunglasses (شمسية)</option>
                    <option value="Contact Lenses">Contact Lenses (عدسات)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-bold block">{lang === 'ar' ? 'الوصف والتفاصيل:' : 'Description:'}</label>
                <input
                  type="text"
                  required
                  value={newProductForm.description}
                  onChange={(e) => setNewProductForm({ ...newProductForm, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-700 font-bold block">{lang === 'ar' ? 'سعر التكلفة بالشراء (دينار):' : 'Purchase Cost (JOD):'}</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newProductForm.purchaseCost}
                    onChange={(e) => setNewProductForm({ ...newProductForm, purchaseCost: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono font-bold text-emerald-700 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-700 font-bold block">{lang === 'ar' ? 'سعر البيع المقترح (دينار):' : 'Selling Price (JOD):'}</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newProductForm.sellingPrice}
                    onChange={(e) => setNewProductForm({ ...newProductForm, sellingPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono font-bold text-blue-700 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="submit"
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer text-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {lang === 'ar' ? 'حفظ الصنف وإضافته لأمر الشراء' : 'Save Product & Add to PO'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsQuickAddProductOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl transition cursor-pointer text-xs"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
