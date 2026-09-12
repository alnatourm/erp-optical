import React, { useState } from 'react';
import { FileText, Download, Filter, Receipt, Truck, Eye, X, Printer, Scissors, Wallet, Users, Edit2, Trash2, CheckCircle2, AlertCircle, BarChart3, TrendingUp, CreditCard, PieChart } from 'lucide-react';
import { Invoice, Supplier, Branch, PurchaseOrder, DailyCashClosing, Customer } from '../types';
import { useLanguage } from '../lib/i18n';

import { UserAccount } from '../types';

interface AccountantReportsModuleProps {
  currentUser?: UserAccount;
  onUpdateInvoice?: (id: string, updates: Partial<Invoice>) => void;
  onEditFullInvoice?: (inv: Invoice) => void;
  onDeleteInvoice?: (id: string) => void;
  invoices: Invoice[];
  suppliers: Supplier[];
  purchaseOrders?: PurchaseOrder[];
  onDeletePurchaseOrder?: (id: string) => void;
  onUpdatePurchaseOrder?: (id: string, updates: Partial<PurchaseOrder>) => void;
  cashClosings?: DailyCashClosing[];
  onDeleteCashClosing?: (id: string) => void;
  onUpdateCashClosing?: (id: string, updates: Partial<DailyCashClosing>) => void;
  onUpdatePurchaseOrderStatus?: (poId: string, newStatus: 'Pending' | 'Partially Received' | 'Received' | 'Cancelled') => void;
  onApproveCashHandover?: (id: string) => void;
  branches?: Branch[];
  activeBranch?: Branch;
  customers?: Customer[];
  onBackupSystemData?: () => void;
}

export const AccountantReportsModule: React.FC<AccountantReportsModuleProps> = ({
  invoices,
  suppliers,
  purchaseOrders = [],
  cashClosings = [],
  onUpdatePurchaseOrderStatus,
  onDeletePurchaseOrder,
  onUpdatePurchaseOrder,
  onDeleteCashClosing,
  onUpdateCashClosing,
  onDeleteInvoice,
  branches,
  activeBranch,
  currentUser,
  onUpdateInvoice,
  onEditFullInvoice,
  onApproveCashHandover,
  customers = [],
  onBackupSystemData
}) => {
  const { lang } = useLanguage();
  const [activeReport, setActiveReport] = useState<'invoices' | 'purchase_orders' | 'discounts' | 'z_reports' | 'clients'>('invoices');
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [editingZReport, setEditingZReport] = useState<DailyCashClosing | null>(null);
  const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null);
  
  const [editForm, setEditForm] = useState({
    subtotal: 0,
    grandTotal: 0,
    paidAmount: 0,
    paymentMethod: '',
    splitMethods: [] as {method: string, amount: number}[]
  });
  
  const [zReportEditForm, setZReportEditForm] = useState<Partial<DailyCashClosing>>({});
  const [poEditForm, setPOEditForm] = useState<Partial<PurchaseOrder>>({});

  const openZReportEditModal = (cc: DailyCashClosing) => {
    setEditingZReport(cc);
    setZReportEditForm({
      openingBalance: cc.openingBalance,
      cashSales: cc.cashSales,
      cardSales: cc.cardSales,
      visaSales: cc.visaSales,
      cliqSales: cc.cliqSales,
      bankTransferSales: cc.bankTransferSales,
      insuranceSales: cc.insuranceSales,
      expenses: cc.expenses,
      cashInSafe: cc.cashInSafe
    });
  };

  const openPOEditModal = (po: PurchaseOrder) => {
    setEditingPO(po);
    setPOEditForm({
      totalAmount: po.totalAmount,
      expectedDeliveryDate: po.expectedDeliveryDate,
      supplierName: po.supplierName
    });
  };

  const handleSaveZReportEdits = () => {
    if (editingZReport && onUpdateCashClosing) {
      const opening = editingZReport.openingBalance || 0;
      const cashS = zReportEditForm.cashSales || 0;
      const exp = zReportEditForm.expenses || 0;
      const expectedCash = opening + cashS - exp;
      const actualCash = zReportEditForm.cashInSafe || 0;
      const diff = actualCash - expectedCash;
      
      onUpdateCashClosing(editingZReport.id, {
        ...zReportEditForm,
        reconciliationDifference: diff
      });
      setEditingZReport(null);
    }
  };

  const handleSavePOEdits = () => {
    if (editingPO && onUpdatePurchaseOrder) {
      onUpdatePurchaseOrder(editingPO.id, poEditForm);
      setEditingPO(null);
    }
  };

  const openEditModal = (inv: Invoice) => {
    if (onEditFullInvoice) {
      onEditFullInvoice(inv);
      return;
    }
    setEditingInvoice(inv);
    setEditForm({
      subtotal: inv.subtotal || 0,
      grandTotal: inv.grandTotal || 0,
      paidAmount: inv.paidAmount || 0,
      paymentMethod: inv.paymentMethod || 'Cash',
      splitMethods: inv.splitMethods || [{method: 'Cash', amount: 0}, {method: 'Visa', amount: 0}]
    });
  };

  const handleSaveInvoiceEdits = () => {
    if (editingInvoice && onUpdateInvoice) {
      const remainingBalance = Math.max(0, editForm.grandTotal - editForm.paidAmount);
      onUpdateInvoice(editingInvoice.id, {
        subtotal: editForm.subtotal,
        grandTotal: editForm.grandTotal,
        paidAmount: editForm.paidAmount,
        remainingBalance,
        paymentMethod: editForm.paymentMethod,
        splitMethods: editForm.paymentMethod === 'Split' ? editForm.splitMethods : undefined
      });
      setEditingInvoice(null);
    }
  };


  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterSalesman, setFilterSalesman] = useState('');
  const [filterBalance, setFilterBalance] = useState('all');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('all');
  const [filterBranch, setFilterBranch] = useState('all');

  const filteredInvoices = invoices.filter(inv => {
    if (filterDateFrom && new Date(inv.invoiceDate) < new Date(filterDateFrom)) return false;
    if (filterDateTo && new Date(inv.invoiceDate) > new Date(filterDateTo)) return false;
    if (filterSalesman && !inv.salesEmployee.toLowerCase().includes(filterSalesman.toLowerCase())) return false;
    if (filterBalance === 'fully_paid' && inv.remainingBalance > 0) return false;
    if (filterBalance === 'partially_paid' && (inv.remainingBalance === 0 || inv.paidAmount === 0)) return false;
    if (filterBalance === 'unpaid' && inv.paidAmount > 0) return false;
    if (filterPaymentMethod !== 'all' && inv.paymentMethod !== filterPaymentMethod) return false;
    if (filterBranch !== 'all' && inv.branchId !== filterBranch) return false;
    return true;
  });

  const filteredDiscountInvoices = filteredInvoices.filter(inv => inv.discount > 0);

  const filteredPurchaseOrders = purchaseOrders.filter(po => {
    if (filterDateFrom && new Date(po.orderDate) < new Date(filterDateFrom)) return false;
    if (filterDateTo && new Date(po.orderDate) > new Date(filterDateTo)) return false;
    if (filterSalesman && !po.createdBy.toLowerCase().includes(filterSalesman.toLowerCase())) return false;
    if (filterBranch !== 'all' && po.branchId !== filterBranch) return false;
    return true;
  });

  const filteredCashClosings = cashClosings.filter(cc => {
    if (filterDateFrom && new Date(cc.date) < new Date(filterDateFrom)) return false;
    if (filterDateTo && new Date(cc.date) > new Date(filterDateTo)) return false;
    if (filterBranch !== 'all' && cc.branchId !== filterBranch) return false;
    return true;
  });

  const handleExportCSV = () => {
    let csvContent = "\uFEFF";
    
    if (activeReport === 'invoices') {
      csvContent += "Invoice #,Date,Customer,Amount (JOD),Paid,Balance,Payment Method\n";
      filteredInvoices.forEach(inv => {
        const date = new Date(inv.createdAt).toLocaleDateString();
        const paymentInfo = inv.paymentMethod === 'Split' && inv.splitMethods ? `Split: ${inv.splitMethods.map(s => `${s.method} (${s.amount})`).join(' / ')}` : inv.paymentMethod;
        csvContent += `${inv.invoiceNumber},${date},"${inv.customerName}",${inv.grandTotal},${inv.paidAmount},${inv.remainingBalance},"${paymentInfo}"\n`;
      });
    } else if (activeReport === 'discounts') {
      csvContent += "Invoice #,Date,Customer,Subtotal (JOD),Discount (JOD),Total (JOD)\n";
      filteredDiscountInvoices.forEach(inv => {
        const date = new Date(inv.createdAt).toLocaleDateString();
        csvContent += `${inv.invoiceNumber},${date},"${inv.customerName}",${inv.subtotal},${inv.discount},${inv.grandTotal}\n`;
      });
    } else if (activeReport === 'z_reports') {
      csvContent += "Branch ID,Date,Opening Balance,Cash Sales,Card Sales,Insurance,Expected Cash,Actual Cash,Difference,Notes\n";
      filteredCashClosings.forEach(cc => {
        const date = new Date(cc.date).toLocaleDateString();
        const expectedCash = (cc.openingBalance || 0) + (cc.cashSales || 0) - (cc.expenses || 0);
        csvContent += `${cc.branchId},${date},${cc.openingBalance},${cc.cashSales},${cc.cardSales},${cc.insuranceSales || 0},${expectedCash},${cc.cashInSafe},${cc.reconciliationDifference},"${cc.notes || ''}"\n`;
      });
    } else if (activeReport === 'purchase_orders') {
      csvContent += "P.O Number,Date,Supplier,Amount (JOD),Status,Expected Delivery\n";
      filteredPurchaseOrders.forEach(po => {
        csvContent += `"${po.poNumber}","${new Date(po.orderDate).toLocaleDateString()}","${po.supplierName}",${po.totalAmount},"${po.status}","${po.expectedDeliveryDate || ''}"\n`;
      });
    } else if (activeReport === 'clients') {
      csvContent += "Client Name,Phone,Secondary Phone,Email,Membership Level,Loyalty Points,Registration Date\n";
      customers.forEach(c => {
        const regDate = c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '';
        csvContent += `"${c.name}","${c.phone}","${c.secondaryPhone || ''}","${c.email || ''}","${c.membershipLevel}",${c.loyaltyPoints},"${regDate}"\n`;
      });
    } else {
      csvContent += "P.O Number,Date,Supplier,Amount (JOD),Status,Expected Delivery\n";
      filteredPurchaseOrders.forEach(po => {
        csvContent += `"${po.poNumber}","${new Date(po.orderDate).toLocaleDateString()}","${po.supplierName}",${po.totalAmount},"${po.status}","${po.expectedDeliveryDate || ''}"\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${activeReport}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto text-slate-900">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <PieChart className="w-8 h-8 text-blue-600" />
            {lang === 'ar' ? 'التقارير المالية والمحاسبية' : 'Financial & Accounting Reports'}
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-1">
            {lang === 'ar' ? 'نظرة شاملة على المبيعات، الخصومات، والتقارير اليومية' : 'Comprehensive overview of sales, discounts, and daily reports'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {onBackupSystemData && (
            <button
              onClick={onBackupSystemData}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition cursor-pointer flex items-center gap-2"
              title={lang === 'ar' ? 'تحميل نسخة احتياطية (JSON) من كامل قاعدة البيانات' : 'Download JSON Backup for all database'}
            >
              <Download className="w-4 h-4" />
              {lang === 'ar' ? 'نسخة احتياطية للبيانات' : 'Data Backup'}
            </button>
          )}
          <button
            onClick={handleExportCSV}
          className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition cursor-pointer flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          {lang === 'ar' ? 'تصدير التقرير (Excel)' : 'Export Report (CSV)'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-6">
        {[
          { id: 'invoices', icon: Receipt, label: lang === 'ar' ? 'تقرير المبيعات' : 'Sales Report' },
          { id: 'discounts', icon: Scissors, label: lang === 'ar' ? 'تقرير الخصومات' : 'Discounts Report' },
          { id: 'z_reports', icon: Wallet, label: lang === 'ar' ? 'إغلاقات الكاش (Z Report)' : 'Z Reports' },
          { id: 'purchase_orders', icon: Truck, label: lang === 'ar' ? 'أوامر الشراء' : 'Purchase Orders' },
          { id: 'clients', icon: Users, label: lang === 'ar' ? 'تقرير العملاء' : 'Clients Report' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveReport(tab.id as any)}
            className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col items-center justify-center gap-2 cursor-pointer ${
              activeReport === tab.id 
                ? 'bg-blue-600 border-blue-600 text-white shadow-md transform scale-[1.02]' 
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            <tab.icon className={`w-6 h-6 ${activeReport === tab.id ? 'text-white' : 'text-slate-400'}`} />
            <span className="text-xs font-bold text-center">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Filters Section */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-4 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">{lang === 'ar' ? 'من تاريخ' : 'Date From'}</label>
          <input 
            type="date" 
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">{lang === 'ar' ? 'إلى تاريخ' : 'Date To'}</label>
          <input 
            type="date" 
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">{lang === 'ar' ? 'الموظف (البائع)' : 'Salesman'}</label>
          <input 
            type="text" 
            placeholder={lang === 'ar' ? 'اسم الموظف...' : 'Salesman name...'}
            value={filterSalesman}
            onChange={(e) => setFilterSalesman(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">{lang === 'ar' ? 'الفرع' : 'Branch'}</label>
          <select 
            value={filterBranch}
            onChange={(e) => setFilterBranch(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">{lang === 'ar' ? 'جميع الفروع' : 'All Branches'}</option>
            {branches?.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
        {activeReport === 'invoices' && (
          <>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{lang === 'ar' ? 'الرصيد' : 'Balance'}</label>
              <select 
                value={filterBalance}
                onChange={(e) => setFilterBalance(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="all">{lang === 'ar' ? 'الكل' : 'All'}</option>
                <option value="fully_paid">{lang === 'ar' ? 'مدفوع بالكامل' : 'Fully Paid'}</option>
                <option value="partially_paid">{lang === 'ar' ? 'دفع جزئي' : 'Partially Paid'}</option>
                <option value="unpaid">{lang === 'ar' ? 'غير مدفوع' : 'Unpaid'}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{lang === 'ar' ? 'طريقة الدفع' : 'Payment Method'}</label>
              <select 
                value={filterPaymentMethod}
                onChange={(e) => setFilterPaymentMethod(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="all">{lang === 'ar' ? 'الكل' : 'All'}</option>
                <option value="Cash">{lang === 'ar' ? 'نقدي' : 'Cash'}</option>
                <option value="Visa">{lang === 'ar' ? 'فيزا' : 'Visa'}</option>
                <option value="Cliq">{lang === 'ar' ? 'كليك' : 'Cliq'}</option>
                <option value="Credit Card">{lang === 'ar' ? 'بطاقة ائتمان' : 'Credit Card'}</option>
                <option value="Bank Transfer">{lang === 'ar' ? 'حوالة بنكية' : 'Bank Transfer'}</option>
                <option value="Insurance">{lang === 'ar' ? 'تأمين' : 'Insurance'}</option>
              </select>
            </div>
          </>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {activeReport === 'invoices' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right text-sm">
               <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="p-4 font-medium">{lang === 'ar' ? 'رقم الفاتورة' : 'Invoice #'}</th>
                  <th className="p-4 font-medium">{lang === 'ar' ? 'التاريخ' : 'Date'}</th>
                  <th className="p-4 font-medium">{lang === 'ar' ? 'الفرع' : 'Branch'}</th>
                  <th className="p-4 font-medium">{lang === 'ar' ? 'العميل' : 'Customer'}</th>
                  <th className="p-4 font-medium">{lang === 'ar' ? 'القيمة' : 'Amount (JOD)'}</th>
                  <th className="p-4 font-medium">{lang === 'ar' ? 'المدفوع' : 'Paid'}</th>
                  <th className="p-4 font-medium">{lang === 'ar' ? 'الرصيد المتبقي' : 'Balance'}</th>
                  <th className="p-4 font-medium">{lang === 'ar' ? 'طريقة الدفع' : 'Payment Method'}</th>
                  <th className="p-4 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50">
                    <td className="p-4 font-bold text-slate-900">{inv.invoiceNumber}</td>
                    <td className="p-4 text-slate-600">{new Date(inv.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 font-medium text-slate-700">
                      {branches?.find(b => b.id === inv.branchId)?.name || 'Main Branch'}
                    </td>
                    <td className="p-4 font-bold text-slate-900">{inv.customerName}</td>
                    <td className="p-4 font-mono font-bold">{(inv.grandTotal || 0).toFixed(2)}</td>
                    <td className="p-4 font-mono text-emerald-600">{(inv.paidAmount || 0).toFixed(2)}</td>
                    <td className="p-4 font-mono text-rose-600">{(inv.remainingBalance || 0).toFixed(2)}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-md font-medium">
                        {inv.paymentMethod === 'Split' && inv.splitMethods ? `Split: ${inv.splitMethods.map(s => `${s.method} (${s.amount})`).join(' / ')}` : inv.paymentMethod}
                      </span>
                    </td>
                    <td className="p-4 flex items-center justify-end gap-1">
                      <button 
                        onClick={() => setViewingInvoice(inv)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                        title={lang === 'ar' ? 'عرض الفاتورة' : 'View Invoice'}
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      {currentUser?.role === 'admin' && (
                        <>
                          <button 
                            onClick={() => openEditModal(inv)}
                            className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                            title={lang === 'ar' ? 'تعديل الفاتورة' : 'Edit Invoice'}
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          {onDeleteInvoice && (
                            <button 
                              onClick={() => {
                                if (window.confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذه الفاتورة؟' : 'Are you sure you want to delete this invoice?')) {
                                  onDeleteInvoice(inv.id);
                                }
                              }}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title={lang === 'ar' ? 'حذف الفاتورة' : 'Delete Invoice'}
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredInvoices.length === 0 && (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-500">
                      {lang === 'ar' ? 'لا يوجد فواتير' : 'No invoices found.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeReport === 'discounts' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="p-4 font-medium">{lang === 'ar' ? 'رقم الفاتورة' : 'Invoice #'}</th>
                  <th className="p-4 font-medium">{lang === 'ar' ? 'التاريخ' : 'Date'}</th>
                  <th className="p-4 font-medium">{lang === 'ar' ? 'العميل' : 'Customer'}</th>
                  <th className="p-4 font-medium">{lang === 'ar' ? 'المجموع الفرعي' : 'Subtotal (JOD)'}</th>
                  <th className="p-4 font-medium text-red-600">{lang === 'ar' ? 'الخصم' : 'Discount (JOD)'}</th>
                  <th className="p-4 font-medium">{lang === 'ar' ? 'المجموع النهائي' : 'Total (JOD)'}</th>
                  <th className="p-4 font-medium w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDiscountInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      {lang === 'ar' ? 'لا يوجد فواتير بخصم' : 'No discounted invoices found'}
                    </td>
                  </tr>
                ) : (
                  filteredDiscountInvoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-50 transition">
                      <td className="p-4 font-bold text-blue-600">{inv.invoiceNumber}</td>
                      <td className="p-4 font-medium text-slate-700">{new Date(inv.createdAt).toLocaleDateString()}</td>
                      <td className="p-4 font-medium text-slate-900">{inv.customerName}</td>
                      <td className="p-4 font-bold text-slate-900">{(inv.subtotal || 0).toFixed(2)}</td>
                      <td className="p-4 font-bold text-red-600">-{(inv.discount || 0).toFixed(2)}</td>
                      <td className="p-4 font-bold text-emerald-600">{(inv.grandTotal || 0).toFixed(2)}</td>
                      <td className="p-4 flex items-center justify-end gap-1">
                        <button 
                          onClick={() => setViewingInvoice(inv)}
                          className="p-2 text-slate-400 hover:bg-white hover:text-blue-600 rounded-lg shadow-sm border border-transparent hover:border-slate-200 transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {currentUser?.role === 'admin' && (
                          <>
                            <button 
                              onClick={() => openEditModal(inv)}
                              className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                              title={lang === 'ar' ? 'تعديل الفاتورة' : 'Edit Invoice'}
                            >
                              <Edit2 className="w-5 h-5" />
                            </button>
                            {onDeleteInvoice && (
                              <button 
                                onClick={() => {
                                  if (window.confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذه الفاتورة؟' : 'Are you sure you want to delete this invoice?')) {
                                    onDeleteInvoice(inv.id);
                                  }
                                }}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title={lang === 'ar' ? 'حذف الفاتورة' : 'Delete Invoice'}
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeReport === 'z_reports' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="p-4 font-medium">{lang === 'ar' ? 'الفرع' : 'Branch'}</th>
                  <th className="p-4 font-medium">{lang === 'ar' ? 'التاريخ' : 'Date'}</th>
                  <th className="p-4 font-medium">{lang === 'ar' ? 'الرصيد الافتتاحي' : 'Opening (JOD)'}</th>
                  <th className="p-4 font-medium">{lang === 'ar' ? 'مبيعات الكاش' : 'Cash Sales (JOD)'}</th>
                  <th className="p-4 font-medium">{lang === 'ar' ? 'مبيعات البطاقات' : 'Card Sales (JOD)'}</th>
                  <th className="p-4 font-medium">{lang === 'ar' ? 'التأمين' : 'Insurance (JOD)'}</th>
                  <th className="p-4 font-medium">{lang === 'ar' ? 'الرصيد المتوقع' : 'Expected (JOD)'}</th>
                  <th className="p-4 font-medium">{lang === 'ar' ? 'الرصيد الفعلي' : 'Actual (JOD)'}</th>
                  <th className="p-4 font-medium">{lang === 'ar' ? 'الفرق' : 'Diff (JOD)'}</th>
                  <th className="p-4 font-medium">{lang === 'ar' ? 'الحالة والإجراء' : 'Status & Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCashClosings.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-500">
                      {lang === 'ar' ? 'لا يوجد سجلات إغلاق' : 'No cash closings found'}
                    </td>
                  </tr>
                ) : (
                  filteredCashClosings.map(cc => {
                    const branchName = branches?.find(b => b.id === cc.branchId)?.name || cc.branchId;
                    return (
                      <tr key={cc.id} className="hover:bg-slate-50 transition">
                        <td className="p-4 font-bold text-slate-700">{branchName}</td>
                        <td className="p-4 font-medium text-slate-700">{new Date(cc.date).toLocaleDateString()}</td>
                        <td className="p-4 text-slate-600">{(cc.openingBalance || 0).toFixed(2)}</td>
                        <td className="p-4 text-emerald-600">{(cc.cashSales || 0).toFixed(2)}</td>
                        <td className="p-4 text-blue-600">{(cc.cardSales || 0).toFixed(2)}</td>
                        <td className="p-4 text-purple-600">{cc.insuranceSales?.toFixed(2) || '0.00'}</td>
                        <td className="p-4 font-bold text-slate-700">{((cc.openingBalance || 0) + (cc.cashSales || 0) - (cc.expenses || 0)).toFixed(2)}</td>
                        <td className="p-4 font-bold text-slate-900">{(cc.cashInSafe || 0).toFixed(2)}</td>
                        <td className={`p-4 font-bold ${(cc.reconciliationDifference || 0) < 0 ? 'text-red-600' : (cc.reconciliationDifference || 0) > 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                          {(cc.reconciliationDifference || 0) > 0 ? '+' : ''}{(cc.reconciliationDifference || 0).toFixed(2)}
                        </td>
                        <td className="p-4 flex items-center gap-2">
                          {cc.status === 'HandedOver' ? (
                            <button
                              onClick={() => onApproveCashHandover && onApproveCashHandover(cc.id)}
                              className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
                            >
                              {lang === 'ar' ? 'تأكيد الاستلام' : 'Confirm Receipt'}
                            </button>
                          ) : cc.status === 'Approved' ? (
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                              {lang === 'ar' ? '✅ تم الاستلام' : '✅ Received'}
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-slate-500">
                              {cc.status}
                            </span>
                          )}
                          {currentUser?.role === 'admin' && onUpdateCashClosing && (
                            <button
                              onClick={() => openZReportEditModal(cc)}
                              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer ml-auto"
                              title={lang === 'ar' ? 'تعديل' : 'Edit'}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {currentUser?.role === 'admin' && onDeleteCashClosing && (
                            <button
                              onClick={() => {
                                if (window.confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذا التقرير؟' : 'Are you sure you want to delete this report?')) {
                                  onDeleteCashClosing(cc.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title={lang === 'ar' ? 'حذف' : 'Delete'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeReport === 'purchase_orders' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="p-4 font-medium">{lang === 'ar' ? 'رقم P.O' : 'P.O #'}</th>
                  <th className="p-4 font-medium">{lang === 'ar' ? 'التاريخ' : 'Date'}</th>
                  <th className="p-4 font-medium">{lang === 'ar' ? 'المورد' : 'Supplier'}</th>
                  <th className="p-4 font-medium">{lang === 'ar' ? 'القيمة' : 'Amount (JOD)'}</th>
                  <th className="p-4 font-medium">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                  <th className="p-4 font-medium">{lang === 'ar' ? 'تاريخ التسليم المتوقع' : 'Expected Delivery'}</th>
                  <th className="p-4 font-medium">{lang === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPurchaseOrders.map(po => (
                  <tr key={po.id} className="hover:bg-slate-50">
                    <td className="p-4 font-bold text-slate-900">{po.poNumber}</td>
                    <td className="p-4 text-slate-600">{new Date(po.orderDate).toLocaleDateString()}</td>
                    <td className="p-4 font-bold text-slate-900">{po.supplierName}</td>
                    <td className="p-4 font-mono font-bold text-emerald-700">{po.totalAmount.toLocaleString()}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        po.status === 'Received' ? 'bg-emerald-100 text-emerald-700' :
                        po.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {po.status === 'Pending' && lang === 'ar' ? 'قيد الانتظار' : po.status === 'Received' && lang === 'ar' ? 'مكتمل/مستلم' : po.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600">{po.expectedDeliveryDate || '-'}</td>
                    <td className="p-4">
                      {po.status === 'Pending' && onUpdatePurchaseOrderStatus && (
                        <button
                          onClick={() => onUpdatePurchaseOrderStatus(po.id, 'Received')}
                          className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-bold text-xs px-3 py-1.5 rounded-lg transition cursor-pointer"
                        >
                          {lang === 'ar' ? 'تأكيد الاستلام' : 'Mark Received'}
                        </button>
                      )}
                      {po.status === 'Received' && onUpdatePurchaseOrderStatus && (
                        <button
                          onClick={() => onUpdatePurchaseOrderStatus(po.id, 'Pending')}
                          className="bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 font-bold text-xs px-3 py-1.5 rounded-lg transition cursor-pointer"
                        >
                          {lang === 'ar' ? 'إلغاء الاستلام' : 'Undo'}
                        </button>
                      )}
                      {currentUser?.role === 'admin' && onUpdatePurchaseOrder && (
                        <button
                          onClick={() => openPOEditModal(po)}
                          className="ml-2 bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 font-bold text-xs px-2 py-1.5 rounded-lg transition cursor-pointer"
                          title={lang === 'ar' ? 'تعديل' : 'Edit'}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      {currentUser?.role === 'admin' && onDeletePurchaseOrder && (
                        <button
                          onClick={() => {
                            if (window.confirm(lang === 'ar' ? 'هل أنت متأكد من حذف أمر الشراء هذا؟' : 'Are you sure you want to delete this purchase order?')) {
                              onDeletePurchaseOrder(po.id);
                            }
                          }}
                          className="ml-2 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 font-bold text-xs px-2 py-1.5 rounded-lg transition cursor-pointer"
                          title={lang === 'ar' ? 'حذف' : 'Delete'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredPurchaseOrders.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      {lang === 'ar' ? 'لا يوجد تقارير لأوامر الشراء' : 'No purchase orders found.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeReport === 'clients' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="p-4 font-medium">{lang === 'ar' ? 'اسم العميل' : 'Client Name'}</th>
                  <th className="p-4 font-medium">{lang === 'ar' ? 'رقم الهاتف' : 'Phone'}</th>
                  <th className="p-4 font-medium">{lang === 'ar' ? 'رقم هاتف إضافي' : 'Secondary Phone'}</th>
                  <th className="p-4 font-medium">{lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}</th>
                  <th className="p-4 font-medium">{lang === 'ar' ? 'مستوى العضوية' : 'Membership'}</th>
                  <th className="p-4 font-medium">{lang === 'ar' ? 'نقاط الولاء' : 'Loyalty Points'}</th>
                  <th className="p-4 font-medium">{lang === 'ar' ? 'تاريخ التسجيل' : 'Registration Date'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="p-4 font-bold text-slate-900">{c.name}</td>
                    <td className="p-4 font-mono text-slate-700">{c.phone}</td>
                    <td className="p-4 font-mono text-slate-500">{c.secondaryPhone || '-'}</td>
                    <td className="p-4 text-slate-600">{c.email || '-'}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        c.membershipLevel === 'VIP' ? 'bg-purple-100 text-purple-700' :
                        c.membershipLevel === 'Gold' ? 'bg-amber-100 text-amber-700' :
                        c.membershipLevel === 'Silver' ? 'bg-slate-200 text-slate-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {c.membershipLevel}
                      </span>
                    </td>
                    <td className="p-4 font-mono font-bold text-emerald-600">{c.loyaltyPoints || 0}</td>
                    <td className="p-4 text-slate-500">{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '-'}</td>
                  </tr>
                ))}
                {customers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      {lang === 'ar' ? 'لا يوجد عملاء مسجلين' : 'No clients registered.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {viewingInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-2xl max-w-2xl w-full p-8 space-y-6 shadow-xl border border-slate-200 font-sans max-h-[90vh] overflow-y-auto">
            {/* Receipt Header */}
            <div className="text-center border-b border-slate-200 pb-4 space-y-1">
              <h3 className="text-xl font-extrabold tracking-tight uppercase text-slate-900">OptiVision Optical Store</h3>
              <p className="text-xs text-slate-600 font-medium">
                {branches?.find(b => b.id === viewingInvoice.branchId)?.name || activeBranch?.name} • 
                {branches?.find(b => b.id === viewingInvoice.branchId)?.address || activeBranch?.address}
              </p>
              <p className="text-xs text-slate-600 font-mono">
                Tel: {branches?.find(b => b.id === viewingInvoice.branchId)?.phone || activeBranch?.phone}
              </p>
              <div className="pt-2 flex items-center justify-between text-xs font-mono font-bold text-slate-900">
                <span>INVOICE: #{viewingInvoice.invoiceNumber}</span>
                <span>DATE: {viewingInvoice.invoiceDate}</span>
              </div>
            </div>

            {/* Customer & Prescription */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <span className="font-bold block text-slate-500 uppercase text-[10px]">Customer:</span>
                <span className="font-bold text-slate-900 text-sm">{viewingInvoice.customerName}</span>
                <span className="block text-slate-600 font-mono">{viewingInvoice.customerPhone}</span>
              </div>
              <div>
                <span className="font-bold block text-slate-500 uppercase text-[10px]">Sales Staff:</span>
                <span className="font-semibold text-slate-800">{viewingInvoice.salesEmployee}</span>
                <span className="block text-slate-500 font-medium">Delivery: {viewingInvoice.deliveryDate}</span>
              </div>
            </div>

            {/* Prescription Matrix */}
            <div className="border border-slate-200 rounded-xl p-3 text-xs space-y-2 bg-slate-50">
              <div className="font-bold text-[10px] uppercase text-slate-500">Optical Prescription Record</div>
              <div className="grid grid-cols-2 gap-2 text-center font-mono text-[11px]">
                <div className="bg-white p-2 rounded border border-slate-200">
                  <span className="font-bold block text-slate-800 font-sans">RIGHT EYE (OD)</span>
                  SPH {viewingInvoice.prescription.rightEye.sph} / CYL {viewingInvoice.prescription.rightEye.cyl} / AXIS {viewingInvoice.prescription.rightEye.axis}°
                </div>
                <div className="bg-white p-2 rounded border border-slate-200">
                  <span className="font-bold block text-slate-800 font-sans">LEFT EYE (OS)</span>
                  SPH {viewingInvoice.prescription.leftEye.sph} / CYL {viewingInvoice.prescription.leftEye.cyl} / AXIS {viewingInvoice.prescription.leftEye.axis}°
                </div>
              </div>
            </div>

            {/* Products Table */}
            <table className="w-full text-left text-xs text-slate-800">
              <thead className="bg-slate-100 uppercase font-bold text-[10px] text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="p-2">Barcode</th>
                  <th className="p-2">Description</th>
                  <th className="p-2 text-right">Qty</th>
                  <th className="p-2 text-right">Price</th>
                  <th className="p-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px] font-mono">
                {viewingInvoice.items.map((it, i) => (
                  <tr key={i}>
                    <td className="p-2 font-bold text-blue-700">{it.barcode}</td>
                    <td className="p-2 font-sans font-medium">{it.description}</td>
                    <td className="p-2 text-right">{it.quantity}</td>
                    <td className="p-2 text-right">{it.price} JOD</td>
                    <td className="p-2 text-right font-bold text-slate-900">{it.total} JOD</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals Summary */}
            <div className="border-t border-slate-200 pt-3 space-y-1 font-mono text-xs text-slate-700">
              <div className="flex justify-between font-medium">
                <span>Subtotal:</span>
                <span>{(viewingInvoice.subtotal || 0).toFixed(2)} JOD</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Tax (16%):</span>
                <span>{(viewingInvoice.tax || 0).toFixed(2)} JOD</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-1 border-t border-slate-200">
                <span>GRAND TOTAL:</span>
                <span>{(viewingInvoice.grandTotal || 0).toFixed(2)} JOD</span>
              </div>
              <div className="flex justify-between font-bold text-emerald-700">
                <span>Total Amount Paid ({viewingInvoice.paymentMethod === 'Split' && viewingInvoice.splitMethods ? viewingInvoice.splitMethods.map(s => `${s.method} ${s.amount}`).join(' / ') : viewingInvoice.paymentMethod}):</span>
                <span>{(viewingInvoice.paidAmount || 0).toFixed(2)} JOD</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900">
                <span>Remaining Balance Due:</span>
                <span>{(viewingInvoice.remainingBalance || 0).toFixed(2)} JOD</span>
              </div>
              <div className="flex justify-between text-[11px] font-semibold text-slate-500 pt-1">
                <span>Order Delivery Status:</span>
                <span className="font-bold text-blue-700">{viewingInvoice.deliveryStatus}</span>
              </div>
            </div>

            <div className="text-[10px] text-center text-slate-500 pt-2 border-t border-slate-200 font-medium">
              Warranty: {viewingInvoice.warrantyTerms} • Thank you for choosing OptiVision!
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-xs"
              >
                <Printer className="w-4 h-4" />
                Print Physical Thermal Invoice
              </button>
              <button
                onClick={() => setViewingInvoice(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-6 py-3 rounded-xl border border-slate-200 transition cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
      {editingInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-2xl max-w-md w-full p-6 space-y-6 shadow-xl border border-slate-200 font-sans">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="font-extrabold text-lg flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-amber-600" />
                {lang === 'ar' ? 'تعديل الفاتورة' : 'Edit Invoice'} #{editingInvoice.invoiceNumber}
              </h3>
              <button onClick={() => setEditingInvoice(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{lang === 'ar' ? 'المجموع الفرعي' : 'Subtotal'}</label>
                <input 
                  type="number" 
                  value={editForm.subtotal} 
                  onChange={(e) => setEditForm({...editForm, subtotal: parseFloat(e.target.value) || 0})}
                  className="w-full border border-slate-200 rounded-lg p-2.5 font-mono text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{lang === 'ar' ? 'المجموع النهائي' : 'Grand Total'}</label>
                <input 
                  type="number" 
                  value={editForm.grandTotal} 
                  onChange={(e) => setEditForm({...editForm, grandTotal: parseFloat(e.target.value) || 0})}
                  className="w-full border border-slate-200 rounded-lg p-2.5 font-mono text-sm focus:ring-2 focus:ring-amber-500 outline-none font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{lang === 'ar' ? 'المبلغ المدفوع' : 'Paid Amount'}</label>
                <input 
                  type="number" 
                  value={editForm.paidAmount} 
                  onChange={(e) => setEditForm({...editForm, paidAmount: parseFloat(e.target.value) || 0})}
                  className="w-full border border-slate-200 rounded-lg p-2.5 font-mono text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-emerald-700"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{lang === 'ar' ? 'طريقة الدفع' : 'Payment Method'}</label>
                <select 
                  value={editForm.paymentMethod} 
                  onChange={(e) => setEditForm({...editForm, paymentMethod: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <option value="Cash">Cash</option>
                  <option value="Visa">Visa</option>
                  <option value="Cliq">Cliq</option>
                  <option value="Split">Split</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Insurance">Insurance</option>
                </select>
              </div>
            </div>
            
            {editForm.paymentMethod === 'Split' && editForm.splitMethods && (
              <div className="space-y-3 mt-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="flex gap-2">
                  <select 
                    value={editForm.splitMethods[0]?.method || 'Cash'}
                    onChange={(e) => setEditForm({...editForm, splitMethods: [{...editForm.splitMethods[0], method: e.target.value}, editForm.splitMethods[1]]})}
                    className="w-1/2 border border-slate-300 rounded p-1.5 text-xs bg-white"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Visa">Visa</option>
                    <option value="Cliq">Cliq</option>
                    <option value="Insurance">Insurance</option>
                    <option value="Bank Transfer">Bank</option>
                  </select>
                  <input type="number" value={editForm.splitMethods[0]?.amount || 0} onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setEditForm({...editForm, splitMethods: [{...editForm.splitMethods[0], amount: val}, {...editForm.splitMethods[1], amount: editForm.paidAmount - val}]});
                  }} className="w-1/2 border border-slate-300 rounded p-1.5 text-xs font-bold" />
                </div>
                <div className="flex gap-2">
                  <select 
                    value={editForm.splitMethods[1]?.method || 'Visa'}
                    onChange={(e) => setEditForm({...editForm, splitMethods: [editForm.splitMethods[0], {...editForm.splitMethods[1], method: e.target.value}]})}
                    className="w-1/2 border border-slate-300 rounded p-1.5 text-xs bg-white"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Visa">Visa</option>
                    <option value="Cliq">Cliq</option>
                    <option value="Insurance">Insurance</option>
                    <option value="Bank Transfer">Bank</option>
                  </select>
                  <input type="number" value={editForm.splitMethods[1]?.amount || 0} onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setEditForm({...editForm, splitMethods: [{...editForm.splitMethods[0], amount: editForm.paidAmount - val}, {...editForm.splitMethods[1], amount: val}]});
                  }} className="w-1/2 border border-slate-300 rounded p-1.5 text-xs font-bold" />
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setEditingInvoice(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm py-2.5 rounded-xl transition"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleSaveInvoiceEdits}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm py-2.5 rounded-xl transition shadow-sm"
              >
                {lang === 'ar' ? 'حفظ التعديلات' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {editingZReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-2xl max-w-md w-full p-6 space-y-6 shadow-xl border border-slate-200 font-sans">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="font-extrabold text-lg flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-amber-600" />
                {lang === 'ar' ? 'تعديل التقرير' : 'Edit Report'}
              </h3>
              <button onClick={() => setEditingZReport(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{lang === 'ar' ? 'مبيعات الكاش' : 'Cash Sales'}</label>
                <input 
                  type="number" 
                  value={zReportEditForm.cashSales} 
                  onChange={(e) => setZReportEditForm({...zReportEditForm, cashSales: parseFloat(e.target.value) || 0})}
                  className="w-full border border-slate-200 rounded-lg p-2.5 font-mono text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{lang === 'ar' ? 'مبيعات البطاقات' : 'Card Sales'}</label>
                <input 
                  type="number" 
                  value={zReportEditForm.cardSales} 
                  onChange={(e) => setZReportEditForm({...zReportEditForm, cardSales: parseFloat(e.target.value) || 0})}
                  className="w-full border border-slate-200 rounded-lg p-2.5 font-mono text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{lang === 'ar' ? 'مبيعات فيزا' : 'Visa Sales'}</label>
                <input 
                  type="number" 
                  value={zReportEditForm.visaSales || 0} 
                  onChange={(e) => setZReportEditForm({...zReportEditForm, visaSales: parseFloat(e.target.value) || 0})}
                  className="w-full border border-slate-200 rounded-lg p-2.5 font-mono text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{lang === 'ar' ? 'مبيعات كليك' : 'Cliq Sales'}</label>
                <input 
                  type="number" 
                  value={zReportEditForm.cliqSales || 0} 
                  onChange={(e) => setZReportEditForm({...zReportEditForm, cliqSales: parseFloat(e.target.value) || 0})}
                  className="w-full border border-slate-200 rounded-lg p-2.5 font-mono text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{lang === 'ar' ? 'المصروفات' : 'Expenses'}</label>
                <input 
                  type="number" 
                  value={zReportEditForm.expenses} 
                  onChange={(e) => setZReportEditForm({...zReportEditForm, expenses: parseFloat(e.target.value) || 0})}
                  className="w-full border border-slate-200 rounded-lg p-2.5 font-mono text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{lang === 'ar' ? 'الرصيد الفعلي في الصندوق' : 'Cash in Safe'}</label>
                <input 
                  type="number" 
                  value={zReportEditForm.cashInSafe} 
                  onChange={(e) => setZReportEditForm({...zReportEditForm, cashInSafe: parseFloat(e.target.value) || 0})}
                  className="w-full border border-slate-200 rounded-lg p-2.5 font-mono text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>
            
            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setEditingZReport(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm py-2.5 rounded-xl transition"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleSaveZReportEdits}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm py-2.5 rounded-xl transition shadow-sm"
              >
                {lang === 'ar' ? 'حفظ التعديلات' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {editingPO && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-2xl max-w-md w-full p-6 space-y-6 shadow-xl border border-slate-200 font-sans">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="font-extrabold text-lg flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-amber-600" />
                {lang === 'ar' ? 'تعديل أمر الشراء' : 'Edit Purchase Order'} #{editingPO.poNumber}
              </h3>
              <button onClick={() => setEditingPO(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{lang === 'ar' ? 'المورد' : 'Supplier'}</label>
                <input 
                  type="text" 
                  value={poEditForm.supplierName} 
                  onChange={(e) => setPOEditForm({...poEditForm, supplierName: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{lang === 'ar' ? 'القيمة الإجمالية' : 'Total Amount'}</label>
                <input 
                  type="number" 
                  value={poEditForm.totalAmount} 
                  onChange={(e) => setPOEditForm({...poEditForm, totalAmount: parseFloat(e.target.value) || 0})}
                  className="w-full border border-slate-200 rounded-lg p-2.5 font-mono text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{lang === 'ar' ? 'تاريخ التسليم المتوقع' : 'Expected Delivery'}</label>
                <input 
                  type="date" 
                  value={poEditForm.expectedDeliveryDate || ''} 
                  onChange={(e) => setPOEditForm({...poEditForm, expectedDeliveryDate: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>
            
            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setEditingPO(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm py-2.5 rounded-xl transition"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleSavePOEdits}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm py-2.5 rounded-xl transition shadow-sm"
              >
                {lang === 'ar' ? 'حفظ التعديلات' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

