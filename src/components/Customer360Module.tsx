import React, { useState } from 'react';
import {
  Users,
  Search,
  History,
  Glasses,
  Receipt,
  PhoneCall,
  ShieldCheck,
  Wrench,
  Award,
  Calendar,
  CreditCard,
  UserCheck,
  Eye,
  Plus,
  HandCoins,
  CheckCircle2,
  DollarSign,
  PackageCheck,
  X,
  AlertCircle,
  Sparkles,
  Layers,
  Edit,
  Trash2,
} from 'lucide-react';
import {
  Customer,
  Invoice,
  CallReminder,
  LaboratoryJob,
  OpticalPrescription,
  PaymentMethod,
  Branch,
} from '../types';
import { useLanguage } from '../lib/i18n';
import { InvoiceReceiptModal } from './InvoiceReceiptModal';
import { UserAccount } from '../types';

interface Customer360ModuleProps {
  customers: Customer[];
  invoices: Invoice[];
  callReminders: CallReminder[];
  labJobs: LaboratoryJob[];
  branches?: Branch[];
  activeBranch?: Branch;
  currentUser?: UserAccount;
  onSaveCustomer: (customerData: Partial<Customer> & { name: string; phone: string }) => Customer;
  onDeleteCustomer?: (id: string) => void;
  onSettlePayment?: (
    invoiceId: string,
    paymentAmount: number,
    paymentMethod?: PaymentMethod,
    notes?: string
  ) => Invoice | null;
}

export const Customer360Module: React.FC<Customer360ModuleProps> = ({
  customers,
  invoices,
  callReminders,
  labJobs,
  branches = [],
  activeBranch,
  currentUser,
  onSaveCustomer,
  onDeleteCustomer,
  onSettlePayment,
}) => {
  const { lang, t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(customers[0] || null);

  const [activeProfileTab, setActiveProfileTab] = useState<
    'rx' | 'invoices' | 'frames' | 'lenses' | 'contact_lenses' | 'payments' | 'calls'
  >('rx');

  // Invoice Receipt Modal view state
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);

  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');

  // Edit Customer Modal State
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editBirthDate, setEditBirthDate] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const handleOpenEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setEditName(c.name);
    setEditPhone(c.phone);
    setEditEmail(c.email || '');
    setEditAddress(c.address || '');
    setEditBirthDate(c.birthDate || '');
    setEditNotes(c.notes || '');
  };

  const handleSaveEditCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    const updated = onSaveCustomer({
      ...editingCustomer,
      name: editName,
      phone: editPhone,
      email: editEmail,
      address: editAddress,
      birthDate: editBirthDate,
      notes: editNotes,
    });
    setSelectedCustomer(updated);
    setEditingCustomer(null);
  };

  // Settlement Modal State
  const [selectedInvoiceToSettle, setSelectedInvoiceToSettle] = useState<Invoice | null>(null);
  const [settleAmount, setSettleAmount] = useState<number>(0);
  const [settlePaymentMethod, setSettlePaymentMethod] = useState<PaymentMethod>('Cash');
  const [settleNotes, setSettleNotes] = useState<string>('Paid rest upon pickup in Customer 360 profile.');

  // Search logic across Customers, Invoices, Barcodes
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) return;

    const q = query.toLowerCase();

    // 1. Match customer by name or phone
    const matchedCustomer = customers.find(
      (c) => c.name.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q)
    );

    if (matchedCustomer) {
      setSelectedCustomer(matchedCustomer);
      return;
    }

    // 2. Match invoice by invoice number or barcode
    const matchedInvoice = invoices.find(
      (inv) =>
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.items.some((it) => it.barcode.toLowerCase().includes(q))
    );

    if (matchedInvoice) {
      const c = customers.find((cust) => cust.id === matchedInvoice.customerId || cust.phone === matchedInvoice.customerPhone);
      if (c) setSelectedCustomer(c);
    }
  };

  // Aggregated data for selected customer
  const customerInvoices = invoices.filter(
    (i) =>
      i.customerId === selectedCustomer?.id ||
      i.customerPhone === selectedCustomer?.phone
  );

  const customerCalls = callReminders.filter(
    (cr) =>
      cr.customerId === selectedCustomer?.id ||
      cr.phone === selectedCustomer?.phone
  );

  const customerLabJobs = labJobs.filter((lj) =>
    customerInvoices.some((inv) => inv.invoiceNumber === lj.invoiceNumber)
  );

  // Extract frames purchased
  const framesPurchased = customerInvoices.flatMap((inv) =>
    inv.items
      .filter((i) => i.itemType === 'frame')
      .map((i) => ({ ...i, invoiceNumber: inv.invoiceNumber, date: inv.invoiceDate }))
  );

  // Extract lenses purchased
  const lensesPurchased = customerInvoices.flatMap((inv) =>
    inv.items
      .filter((i) => i.itemType === 'lens')
      .map((i) => ({ ...i, invoiceNumber: inv.invoiceNumber, date: inv.invoiceDate }))
  );

  // Extract contact lenses purchased
  const contactLensesPurchased = customerInvoices.flatMap((inv) =>
    inv.items
      .filter((i) => i.itemType === 'contact_lens')
      .map((i) => ({ ...i, invoiceNumber: inv.invoiceNumber, date: inv.invoiceDate }))
  );

  // Settlement Modal Handler
  const handleOpenSettleModal = (inv: Invoice) => {
    setSelectedInvoiceToSettle(inv);
    setSettleAmount(inv.remainingBalance > 0 ? inv.remainingBalance : 0);
    setSettlePaymentMethod('Cash');
    setSettleNotes(`Rest payment settled upon pickup in Customer 360 profile.`);
  };

  const handleConfirmSettlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceToSettle || !onSettlePayment) return;

    onSettlePayment(
      selectedInvoiceToSettle.id,
      settleAmount,
      settlePaymentMethod,
      settleNotes
    );

    setSelectedInvoiceToSettle(null);
  };

  const handleCreateNewCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName || !newCustPhone) return;

    const saved = onSaveCustomer({
      name: newCustName,
      phone: newCustPhone,
      email: newCustEmail,
    });

    setSelectedCustomer(saved);
    setIsAddCustomerOpen(false);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustEmail('');
  };

  // Financial totals for selected customer
  const totalCustomerOrderValue = customerInvoices.reduce((sum, i) => sum + i.grandTotal, 0);
  const totalCustomerPaid = customerInvoices.reduce((sum, i) => sum + i.paidAmount, 0);
  const totalCustomerRemainingDue = customerInvoices.reduce((sum, i) => sum + i.remainingBalance, 0);

  return (
    <div id="customer-360-module" className="p-6 space-y-6 max-w-7xl mx-auto text-slate-900">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {lang === 'ar' ? 'سجل العملاء والوصفات الطبية (Customer 360°)' : 'Customer 360° History Profile'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {lang === 'ar'
                  ? 'البحث السريع بالاسم، الهاتف، الباركود، أو رقم الفاتورة لعرض السجل الطبي الموحد.'
                  : 'Instant search by Phone, Name, Barcode, or Invoice Number to view full optical history.'}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsAddCustomerOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-xs transition cursor-pointer flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          {lang === 'ar' ? 'إضافة عميل جديد' : 'Create New Customer'}
        </button>
      </div>

      {/* Global Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={
              lang === 'ar'
                ? 'ابحث برقم الهاتف (+962...)، اسم العميل، الباركود (100001)، أو رقم الفاتورة (INV-AMM...)'
                : 'Search by Phone (+962...), Customer Name, Barcode (100001), or Invoice Number (INV-AMM...)'
            }
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-lg p-3 ltr:pl-10 rtl:pr-10 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
          />
          <Search className="w-4 h-4 text-slate-400 absolute ltr:left-3 rtl:right-3 top-3.5" />
        </div>
      </div>

      {/* Customer Selector Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <span className="text-xs text-slate-500 font-bold shrink-0">
          {lang === 'ar' ? 'الملفات المطابقة:' : 'Matching Profiles:'}
        </span>
        {customers
          .filter((c) => {
            if (!searchQuery.trim()) return true;
            const q = searchQuery.toLowerCase();
            return c.name.toLowerCase().includes(q) || c.phone.includes(q) || (c.barcode && c.barcode.toLowerCase().includes(q));
          })
          .map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCustomer(c)}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 border ${
              selectedCustomer?.id === c.id
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {c.name} ({c.phone})
          </button>
        ))}
      </div>

      {/* Main Customer 360 View */}
      {selectedCustomer && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Customer Profile Summary Card */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold text-lg">
                    {selectedCustomer.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{selectedCustomer.name}</h3>
                    <p className="text-xs text-slate-500 font-mono font-medium">{selectedCustomer.phone}</p>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  {selectedCustomer.membershipLevel} VIP
                </span>
              </div>

              <div className="space-y-2.5 text-xs text-slate-700 font-medium">
                <div className="flex justify-between">
                  <span className="text-slate-500">{lang === 'ar' ? 'نقاط الولاء:' : 'Loyalty Points:'}</span>
                  <span className="font-bold text-blue-600">{selectedCustomer.loyaltyPoints} {lang === 'ar' ? 'نقطة' : 'Pts'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{lang === 'ar' ? 'البريد الإلكتروني:' : 'Email:'}</span>
                  <span className="text-slate-900">{selectedCustomer.email || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{lang === 'ar' ? 'العنوان:' : 'Address:'}</span>
                  <span className="text-slate-900">{selectedCustomer.address || (lang === 'ar' ? 'عمان، الأردن' : 'Amman, Jordan')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{lang === 'ar' ? 'تاريخ الميلاد:' : 'Birth Date:'}</span>
                  <span className="font-mono text-slate-900">{selectedCustomer.birthDate || 'N/A'}</span>
                </div>
              </div>

              {selectedCustomer.notes && (
                <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-700 border border-slate-200 space-y-1">
                  <span className="font-bold text-blue-600 block text-[10px] uppercase">
                    {lang === 'ar' ? 'ملاحظات الفحص البصري:' : 'Optometrist Notes:'}
                  </span>
                  <p className="font-medium">{selectedCustomer.notes}</p>
                </div>
              )}

              {currentUser?.role === 'admin' && (
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(selectedCustomer)}
                    className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs py-2 rounded-lg transition flex items-center justify-center gap-1.5 border border-blue-200 cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>{lang === 'ar' ? 'تعديل العميل' : 'Edit Customer'}</span>
                  </button>
                  {onDeleteCustomer && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(lang === 'ar' ? `هل أنت متأكد من حذف العميل ${selectedCustomer.name}؟` : `Are you sure you want to delete customer ${selectedCustomer.name}?`)) {
                          onDeleteCustomer(selectedCustomer.id);
                          setSelectedCustomer(null);
                        }
                      }}
                      className="bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs px-3 py-2 rounded-lg transition flex items-center justify-center gap-1.5 border border-red-200 cursor-pointer"
                      title={lang === 'ar' ? 'حذف العميل' : 'Delete Customer'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white border border-slate-200 p-4 rounded-xl text-center shadow-xs">
                <span className="text-xs text-slate-500 font-bold block">{lang === 'ar' ? 'إجمالي الفواتير' : 'Total Invoices'}</span>
                <span className="text-xl font-bold text-slate-900 font-mono">{customerInvoices.length}</span>
              </div>
              <div className="bg-white border border-slate-200 p-4 rounded-xl text-center shadow-xs">
                <span className="text-xs text-slate-500 font-bold block">{lang === 'ar' ? 'إجمالي المشتريات' : 'Total Spend'}</span>
                <span className="text-xl font-bold text-emerald-600 font-mono">
                  {customerInvoices.reduce((sum, i) => sum + i.grandTotal, 0).toFixed(0)} JOD
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Multi-Tab History Browser */}
          <div className="lg:col-span-2 space-y-4">
            {/* Tabs Header */}
            <div className="flex items-center gap-2 overflow-x-auto bg-white p-1.5 rounded-xl border border-slate-200 shadow-xs">
              {[
                { id: 'rx', label: t('prescriptionRx'), icon: Eye },
                { id: 'invoices', label: t('invoicesTab'), icon: Receipt },
                { id: 'frames', label: t('framesTab'), icon: Glasses },
                { id: 'lenses', label: t('lensesTab'), icon: Glasses },
                { id: 'contact_lenses', label: t('contactsTab'), icon: Eye },
                { id: 'payments', label: t('paymentsTab'), icon: CreditCard },
                { id: 'calls', label: t('callsTab'), icon: PhoneCall },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeProfileTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveProfileTab(tab.id as any)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Content 1: Prescription History */}
            {activeProfileTab === 'rx' && (
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
                <h4 className="font-bold text-sm text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-600" />
                  {lang === 'ar' ? 'سجل الفحص البصري والوصفات الطبية عبر الوقت' : 'Prescription History over Time'}
                </h4>

                {customerInvoices.length === 0 ? (
                  <p className="text-xs text-slate-500 font-medium">
                    {lang === 'ar' ? 'لم يتم العثور على سجل فحص بصري سابق.' : 'No prescription history found.'}
                  </p>
                ) : (
                  <div className="space-y-4">
                    {customerInvoices.map((inv) => (
                      <div
                        key={inv.id}
                        className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3"
                      >
                        <div className="flex items-center justify-between text-xs border-b border-slate-200 pb-2">
                          <button
                            type="button"
                            onClick={() => setViewingInvoice(inv)}
                            className="font-mono font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer flex items-center gap-1"
                            title={lang === 'ar' ? 'انقر لعرض وطباعة الفاتورة الكاملة' : 'Click to view & print full invoice'}
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            <span>{inv.invoiceNumber}</span>
                          </button>
                          <span className="text-slate-500 font-medium">{inv.prescription.prescriptionDate || inv.invoiceDate}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                          <div className="bg-white p-3 rounded-lg border border-slate-200">
                            <span className="text-blue-700 font-sans font-bold block text-[11px] mb-1">
                              {lang === 'ar' ? 'العين اليمنى (OD)' : 'RIGHT EYE (OD)'}
                            </span>
                            SPH: <span className="text-slate-900 font-bold">{inv.prescription.rightEye.sph}</span> | CYL:{' '}
                            <span className="text-slate-900">{inv.prescription.rightEye.cyl}</span> | AXIS:{' '}
                            <span className="text-slate-900">{inv.prescription.rightEye.axis}°</span>
                          </div>

                          <div className="bg-white p-3 rounded-lg border border-slate-200">
                            <span className="text-blue-700 font-sans font-bold block text-[11px] mb-1">
                              {lang === 'ar' ? 'العين اليسرى (OS)' : 'LEFT EYE (OS)'}
                            </span>
                            SPH: <span className="text-slate-900 font-bold">{inv.prescription.leftEye.sph}</span> | CYL:{' '}
                            <span className="text-slate-900">{inv.prescription.leftEye.cyl}</span> | AXIS:{' '}
                            <span className="text-slate-900">{inv.prescription.leftEye.axis}°</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-[11px] text-slate-600 font-mono pt-1">
                          <span>{lang === 'ar' ? 'الإضافة (ADD):' : 'ADD:'} {inv.prescription.add || '0.00'}</span>
                          <span>{lang === 'ar' ? 'المسافة (DIS):' : 'DIS:'} {inv.prescription.dis || '64'}</span>
                          <span>{lang === 'ar' ? 'مسافة الحدقتين (IPD):' : 'IPD:'} {inv.prescription.ipd || '64mm'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab Content 2: Invoices */}
            {activeProfileTab === 'invoices' && (
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
                <h4 className="font-bold text-sm text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-blue-600" />
                  {lang === 'ar' ? 'سجل الفواتير والمشتريات' : 'Invoices & Purchase History'}
                </h4>

                <div className="space-y-3">
                  {customerInvoices.map((inv) => (
                    <div
                      key={inv.id}
                      className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setViewingInvoice(inv)}
                            className="font-mono font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer flex items-center gap-1 text-sm"
                            title={lang === 'ar' ? 'انقر لعرض وطباعة الفاتورة' : 'Click to view & print full invoice'}
                          >
                            <Receipt className="w-4 h-4" />
                            <span>{inv.invoiceNumber}</span>
                          </button>
                          <span className="text-slate-500 font-medium">({inv.invoiceDate})</span>
                        </div>
                        <p className="text-slate-700 font-medium">
                          {lang === 'ar' ? 'الأصناف:' : 'Items:'} {inv.items.map((i) => i.description).join(', ')}
                        </p>
                      </div>

                      <div className="text-right shrink-0 flex items-center gap-3">
                        <div>
                          <div className="font-bold text-slate-900 text-sm font-mono">{inv.grandTotal} JOD</div>
                          <span className="text-[10px] text-emerald-700 font-bold">{inv.deliveryStatus}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setViewingInvoice(inv)}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs px-3 py-1.5 rounded-lg border border-blue-200 transition cursor-pointer flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          {lang === 'ar' ? 'عرض / طباعة' : 'View / Print'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab Content 3: Frames Purchased */}
            {activeProfileTab === 'frames' && (
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
                <h4 className="font-bold text-sm text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <Glasses className="w-4 h-4 text-blue-600" />
                  {lang === 'ar' ? 'سجل إطارات النظارات المشتراة' : 'Frames Purchased History'}
                </h4>

                {framesPurchased.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    {lang === 'ar' ? 'لم يقم العميل بشراء أي إطارات بعد.' : 'No frames purchased by this client yet.'}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {framesPurchased.map((f, i) => (
                      <div key={i} className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs flex justify-between">
                        <div>
                          <div className="font-bold text-slate-900">{f.description}</div>
                          <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                            <span>{lang === 'ar' ? 'باركود:' : 'Barcode:'} #{f.barcode} |</span>
                            <button
                              type="button"
                              onClick={() => {
                                const matched = invoices.find((inv) => inv.invoiceNumber === f.invoiceNumber);
                                if (matched) setViewingInvoice(matched);
                              }}
                              className="text-blue-600 font-bold hover:underline cursor-pointer"
                              title={lang === 'ar' ? 'عرض الفاتورة' : 'Click to view & print full invoice'}
                            >
                              {lang === 'ar' ? 'فاتورة:' : 'Inv:'} {f.invoiceNumber}
                            </button>
                          </div>
                        </div>
                        <div className="text-right font-mono">
                          <div className="font-bold text-emerald-700">{f.price} JOD</div>
                          <div className="text-[10px] text-slate-500">{f.date}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab Content 4: Lenses Purchased */}
            {activeProfileTab === 'lenses' && (
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
                <h4 className="font-bold text-sm text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <Glasses className="w-4 h-4 text-blue-600" />
                  {lang === 'ar' ? 'سجل العدسات الطبية للنظارات المشتراة' : 'Ophthalmic Prescription Lenses Purchased'}
                </h4>

                {lensesPurchased.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    {lang === 'ar' ? 'لم يقم العميل بشراء أي عدسات طبية بعد.' : 'No ophthalmic lenses purchased by this client yet.'}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {lensesPurchased.map((l, i) => (
                      <div key={i} className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs flex justify-between">
                        <div>
                          <div className="font-bold text-slate-900">{l.description}</div>
                          {l.lensDetails && (
                            <div className="text-[10px] text-blue-600 font-medium">
                              Type: {l.lensDetails.lensType} | Index: {l.lensDetails.index} | Coating: {l.lensDetails.coating}
                            </div>
                          )}
                          <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                            <span>{lang === 'ar' ? 'باركود:' : 'Barcode:'} #{l.barcode} |</span>
                            <button
                              type="button"
                              onClick={() => {
                                const matched = invoices.find((inv) => inv.invoiceNumber === l.invoiceNumber);
                                if (matched) setViewingInvoice(matched);
                              }}
                              className="text-blue-600 font-bold hover:underline cursor-pointer"
                              title={lang === 'ar' ? 'عرض الفاتورة' : 'Click to view & print full invoice'}
                            >
                              {lang === 'ar' ? 'فاتورة:' : 'Inv:'} {l.invoiceNumber}
                            </button>
                          </div>
                        </div>
                        <div className="text-right font-mono">
                          <div className="font-bold text-emerald-700">{l.price} JOD</div>
                          <div className="text-[10px] text-slate-500">{l.date}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab Content 5: Contact Lenses Purchased */}
            {activeProfileTab === 'contact_lenses' && (
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
                <h4 className="font-bold text-sm text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-600" />
                  {lang === 'ar' ? 'سجل العدسات اللاصقة المشتراة' : 'Contact Lenses Purchased History'}
                </h4>

                {contactLensesPurchased.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    {lang === 'ar' ? 'لم يقم العميل بشراء أي عدسات لاصقة بعد.' : 'No contact lenses purchased by this client yet.'}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {contactLensesPurchased.map((cl, i) => (
                      <div key={i} className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs flex justify-between">
                        <div>
                          <div className="font-bold text-slate-900">{cl.description}</div>
                          <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                            <span>{lang === 'ar' ? 'باركود:' : 'Barcode:'} #{cl.barcode} |</span>
                            <button
                              type="button"
                              onClick={() => {
                                const matched = invoices.find((inv) => inv.invoiceNumber === cl.invoiceNumber);
                                if (matched) setViewingInvoice(matched);
                              }}
                              className="text-blue-600 font-bold hover:underline cursor-pointer"
                              title={lang === 'ar' ? 'عرض الفاتورة' : 'Click to view & print full invoice'}
                            >
                              {lang === 'ar' ? 'فاتورة:' : 'Inv:'} {cl.invoiceNumber}
                            </button>
                          </div>
                        </div>
                        <div className="text-right font-mono">
                          <div className="font-bold text-emerald-700">{cl.price} JOD</div>
                          <div className="text-[10px] text-slate-500">{cl.date}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab Content 6: Payments & Financial Ledger */}
            {activeProfileTab === 'payments' && (
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="font-bold text-sm text-slate-900 uppercase tracking-wide flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    {lang === 'ar' ? 'كشف الحساب والسجل المالي للعميل' : 'Client Financial & Payment Ledger'}
                  </h4>

                  <span className="text-xs font-bold text-slate-500 font-mono">
                    {lang === 'ar' ? 'العملة: دينار' : 'Currency: JOD'}
                  </span>
                </div>

                {/* Financial Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">
                      {lang === 'ar' ? 'إجمالي قيمة الطلبات' : 'Total Invoiced Orders'}
                    </span>
                    <span className="text-lg font-bold text-slate-900 font-mono">{totalCustomerOrderValue.toFixed(2)} JOD</span>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold uppercase text-emerald-800 block">
                      {lang === 'ar' ? 'إجمالي المدفوعات المستلمة' : 'Total Payments Received'}
                    </span>
                    <span className="text-lg font-bold text-emerald-700 font-mono">{totalCustomerPaid.toFixed(2)} JOD</span>
                  </div>

                  <div className={`p-3.5 rounded-xl border space-y-1 ${
                    totalCustomerRemainingDue > 0
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  }`}>
                    <span className="text-[10px] font-bold uppercase block">
                      {lang === 'ar' ? 'المبلغ المتبقي غير المدفوع (الذمم)' : 'Outstanding Unpaid Balance'}
                    </span>
                    <span className={`text-lg font-bold font-mono ${totalCustomerRemainingDue > 0 ? 'text-amber-800' : 'text-emerald-700'}`}>
                      {totalCustomerRemainingDue.toFixed(2)} JOD
                    </span>
                  </div>
                </div>

                {/* Transactions Table / List */}
                {customerInvoices.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    {lang === 'ar' ? 'لا توجد حركات مالية مسجلة لهذا العميل.' : 'No payment transaction records found for this client.'}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {customerInvoices.map((inv) => (
                      <div
                        key={inv.id}
                        className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setViewingInvoice(inv)}
                              className="font-mono font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded border border-blue-200 hover:underline cursor-pointer flex items-center gap-1 text-xs"
                              title={lang === 'ar' ? 'عرض الفاتورة' : 'Click to view & print full invoice'}
                            >
                              <Receipt className="w-3.5 h-3.5" />
                              <span>{inv.invoiceNumber}</span>
                            </button>
                            <span className="text-slate-500 font-medium">• {lang === 'ar' ? 'التاريخ:' : 'Date:'} {inv.invoiceDate}</span>
                            <span className="text-slate-500 font-medium">• {lang === 'ar' ? 'التسليم:' : 'Delivery:'} {inv.deliveryDate}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              inv.remainingBalance === 0
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}>
                              {lang === 'ar' 
                                ? (inv.remainingBalance === 0 ? 'مدفوعة بالكامل 100%' : 'دفعة عربون - يتبقى رصيد') 
                                : (inv.remainingBalance === 0 ? '100% Fully Paid' : 'Partial Deposit Paid - Rest Due')}
                            </span>
                          </div>
                        </div>

                        {/* Breakdown */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3 rounded-lg border border-slate-200 font-mono">
                          <div>
                            <span className="text-[10px] font-sans font-bold text-slate-400 block">
                              {lang === 'ar' ? 'قيمة الطلب:' : 'Total Order Value:'}
                            </span>
                            <span className="font-bold text-slate-900">{inv.grandTotal.toFixed(2)} JOD</span>
                          </div>

                          <div>
                            <span className="text-[10px] font-sans font-bold text-slate-400 block">
                              {lang === 'ar' ? 'المبلغ المدفوع:' : 'Paid Amount:'}
                            </span>
                            <span className="font-bold text-emerald-700">{inv.paidAmount.toFixed(2)} JOD</span>
                          </div>

                          <div>
                            <span className="text-[10px] font-sans font-bold text-slate-400 block">
                              {lang === 'ar' ? 'المتبقي:' : 'Remaining Due:'}
                            </span>
                            <span className={`font-bold ${inv.remainingBalance > 0 ? 'text-amber-700' : 'text-slate-700'}`}>
                              {inv.remainingBalance.toFixed(2)} JOD
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] font-sans font-bold text-slate-400 block">
                              {lang === 'ar' ? 'طريقة الدفع:' : 'Payment Method:'}
                            </span>
                            <span className="font-bold text-slate-800">{inv.paymentMethod}</span>
                          </div>
                        </div>

                        {/* Footer Details & Settle Button */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                          <div className="text-[11px] text-slate-500">
                            {lang === 'ar' ? 'أمين الصندوق:' : 'Cashier:'} <span className="font-medium text-slate-800">{inv.cashier}</span> | {lang === 'ar' ? 'الموظف المسؤول:' : 'Staff:'}{' '}
                            <span className="font-medium text-slate-800">{inv.salesEmployee}</span>
                            {inv.notes && <span className="block text-[10px] text-slate-400 italic">{inv.notes}</span>}
                          </div>

                          {inv.remainingBalance > 0 && onSettlePayment && (
                            <button
                              onClick={() => handleOpenSettleModal(inv)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-xs transition cursor-pointer flex items-center gap-1.5 self-end sm:self-auto"
                            >
                              <HandCoins className="w-3.5 h-3.5" />
                              {lang === 'ar' ? `تسديد المتبقي (${inv.remainingBalance.toFixed(2)} دينار)` : `Settle Rest (${inv.remainingBalance.toFixed(2)} JOD)`}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab Content 7: Call History */}
            {activeProfileTab === 'calls' && (
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
                <h4 className="font-bold text-sm text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <PhoneCall className="w-4 h-4 text-blue-600" />
                  {lang === 'ar' ? 'سجل اتصالات ومتابعة العميل' : 'Call Center & Follow-Up Logs'}
                </h4>

                {customerCalls.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    {lang === 'ar' ? 'لا يوجد سجل اتصالات لهذا العميل.' : 'No call log records found for this client.'}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {customerCalls.map((c) => (
                      <div key={c.id} className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs flex justify-between">
                        <div>
                          <div className="font-bold text-slate-900 capitalize">
                            {c.ruleType.replaceAll('_', ' ')}
                          </div>
                          <div className="text-[10px] text-slate-500">{lang === 'ar' ? 'الموعد:' : 'Scheduled:'} {c.scheduledDate}</div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {c.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: SETTLE REMAINING BALANCE ON PICKUP */}
      {selectedInvoiceToSettle && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200 font-sans">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <HandCoins className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    {lang === 'ar' ? 'تسديد المتبقي من قيمة الفاتورة' : 'Settle Rest Payment'}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {lang === 'ar' ? 'فاتورة #' : 'Invoice #'}{selectedInvoiceToSettle.invoiceNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedInvoiceToSettle(null)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between font-bold">
                <span className="text-slate-500 uppercase text-[10px]">
                  {lang === 'ar' ? 'اسم العميل:' : 'Client Name:'}
                </span>
                <span className="text-slate-900">{selectedInvoiceToSettle.customerName} ({selectedInvoiceToSettle.customerPhone})</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-slate-500 font-sans">
                  {lang === 'ar' ? 'إجمالي الفاتورة:' : 'Grand Total Order:'}
                </span>
                <span className="font-bold text-slate-900">{selectedInvoiceToSettle.grandTotal.toFixed(2)} JOD</span>
              </div>
              <div className="flex justify-between font-mono text-emerald-700">
                <span className="text-slate-500 font-sans">
                  {lang === 'ar' ? 'العربون المدفوع سابقاً:' : 'Deposit Already Paid:'}
                </span>
                <span className="font-bold">{selectedInvoiceToSettle.paidAmount.toFixed(2)} JOD</span>
              </div>
              <div className="flex justify-between font-mono text-amber-700 pt-1 border-t border-slate-200 font-bold">
                <span className="text-slate-700 font-sans">
                  {lang === 'ar' ? 'المبلغ المتبقي المطلوب:' : 'Outstanding Remaining Balance:'}
                </span>
                <span>{selectedInvoiceToSettle.remainingBalance.toFixed(2)} JOD</span>
              </div>
            </div>

            <form onSubmit={handleConfirmSettlePayment} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-700 font-bold block mb-1">
                  {lang === 'ar' ? 'المبلغ المستلم الآن (دينار) *' : 'Payment Amount Received Now (JOD) *'}
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  max={selectedInvoiceToSettle.remainingBalance}
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-emerald-500 text-emerald-800 text-sm font-bold font-mono rounded-lg p-3 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">
                  {lang === 'ar' ? 'طريقة الدفع *' : 'Payment Method *'}
                </label>
                <select
                  value={settlePaymentMethod}
                  onChange={(e) => setSettlePaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-medium rounded-lg p-2.5 cursor-pointer focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="Cash">{lang === 'ar' ? 'نقداً (كاش)' : 'Cash'}</option>
                  <option value="Visa">{lang === 'ar' ? 'فيزا' : 'Visa'}</option>
                  <option value="Cliq">{lang === 'ar' ? 'كليك' : 'Cliq'}</option>
                  <option value="Credit Card">{lang === 'ar' ? 'بطاقة ائتمان' : 'Credit Card'}</option>
                  <option value="Insurance">{lang === 'ar' ? 'تأمين صحي' : 'Insurance Claim'}</option>
                  <option value="Bank Transfer">{lang === 'ar' ? 'تحويل بنكي' : 'Bank Transfer'}</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">
                  {lang === 'ar' ? 'ملاحظات' : 'Notes / Remarks'}
                </label>
                <input
                  type="text"
                  value={settleNotes}
                  onChange={(e) => setSettleNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg p-2.5 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedInvoiceToSettle(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-lg transition cursor-pointer"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-lg shadow-xs transition cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {lang === 'ar'
                    ? `تأكيد استلام المبلغ (${settleAmount.toFixed(2)} دينار)`
                    : `Confirm Rest Payment (${settleAmount.toFixed(2)} JOD)`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Receipt Modal */}
      {viewingInvoice && (
        <InvoiceReceiptModal
          invoice={viewingInvoice}
          branches={branches}
          activeBranch={activeBranch}
          onClose={() => setViewingInvoice(null)}
        />
      )}

      {/* Add Customer Modal */}
      {isAddCustomerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wide">
                {lang === 'ar' ? 'إنشاء ملف عميل جديد' : 'Create Customer Profile'}
              </h3>
              <button onClick={() => setIsAddCustomerOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateNewCustomer} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-700 font-bold block mb-1">
                  {lang === 'ar' ? 'الاسم الكامل *' : 'Full Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder={lang === 'ar' ? 'مثال: طارق المنصور' : 'e.g. Tariq Al-Mansoor'}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg p-2.5 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">
                  {lang === 'ar' ? 'رقم الهاتف *' : 'Phone Number *'}
                </label>
                <input
                  type="text"
                  required
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="+962 7 9123 4567"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-mono rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg shadow-xs cursor-pointer transition"
              >
                {lang === 'ar' ? 'حفظ ملف العميل' : 'Save Customer Profile'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <Edit className="w-4 h-4 text-blue-600" />
                {lang === 'ar' ? 'تعديل بيانات العميل' : 'Edit Customer Profile'}
              </h3>
              <button onClick={() => setEditingCustomer(null)} className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSaveEditCustomer} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 font-bold block mb-1">
                  {lang === 'ar' ? 'الاسم الكامل *' : 'Full Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg p-2.5 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">
                  {lang === 'ar' ? 'رقم الهاتف *' : 'Phone Number *'}
                </label>
                <input
                  type="text"
                  required
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-mono rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">
                  {lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">
                  {lang === 'ar' ? 'العنوان' : 'Address'}
                </label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">
                  {lang === 'ar' ? 'تاريخ الميلاد' : 'Birth Date'}
                </label>
                <input
                  type="date"
                  value={editBirthDate}
                  onChange={(e) => setEditBirthDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-mono rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">
                  {lang === 'ar' ? 'ملاحظات' : 'Notes'}
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-lg transition cursor-pointer"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded-lg shadow-xs cursor-pointer transition"
                >
                  {lang === 'ar' ? 'حفظ التعديلات' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
