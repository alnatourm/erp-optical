import React, { useState, useEffect } from 'react';
import {
  Coins,
  DollarSign,
  Building2,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  CreditCard,
  Lock,
  Printer,
  FileText,
  X,
  Send,
  RotateCcw,
  UserCheck,
  Receipt,
  Plus
} from 'lucide-react';
import { DailyCashClosing, Branch, Invoice, UserAccount } from '../types';
import { useLanguage } from '../lib/i18n';

interface BranchCashModuleProps {
  cashClosings: DailyCashClosing[];
  branches: Branch[];
  activeBranch: Branch;
  invoices?: Invoice[];
  currentUser?: UserAccount;
  users?: UserAccount[];
  onRecordCashClosing: (closing: Partial<DailyCashClosing>) => void;
}

export const BranchCashModule: React.FC<BranchCashModuleProps> = ({
  cashClosings,
  branches,
  activeBranch,
  invoices = [],
  currentUser,
  users = [],
  onRecordCashClosing,
}) => {
  const { lang, t } = useLanguage();
  
  // Custom date selection state, defaulting to today
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const todayStr = selectedDate;

  // Dynamic calculation of live sales from active branch invoices
  const branchInvoices = invoices.filter((i) => i.branchId === activeBranch.id);

  // Strictly filter today's invoices for active branch
  const targetInvoices = branchInvoices.filter(
    (i) => i.invoiceDate === todayStr || (i.createdAt && i.createdAt.startsWith(todayStr))
  );

  let liveCashSales = 0;
  let liveCardSales = 0;
  let liveVisaSales = 0;
  let liveCliqSales = 0;
  let liveBankTransferSales = 0;
  let liveInsuranceSales = 0;

  targetInvoices.forEach((i) => {
    const processNonCash = (method: string, amount: number) => {
      liveCardSales += amount;
      if (method === 'Credit Card' || method === 'Visa') liveVisaSales += amount;
      else if (method === 'Cliq') liveCliqSales += amount;
      else if (method === 'Bank Transfer') liveBankTransferSales += amount;
      else if (method === 'Insurance') liveInsuranceSales += amount;
    };

    if (i.paymentMethod === 'Cash') {
      liveCashSales += i.paidAmount || 0;
    } else if (i.paymentMethod === 'Split' && i.splitMethods) {
      i.splitMethods.forEach(sm => {
        if (sm.method === 'Cash') {
          liveCashSales += sm.amount;
        } else {
          processNonCash(sm.method, sm.amount);
        }
      });
    } else {
      processNonCash(i.paymentMethod, i.paidAmount || 0);
    }
  });

  const [expenseItems, setExpenseItems] = useState<{ id: string; title: string; amount: number; category: string; time: string }[]>([]);

  const [newExpenseTitle, setNewExpenseTitle] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  const [newExpenseCategory, setNewExpenseCategory] = useState('ضيافة');
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  const totalExpenseItemsSum = expenseItems.reduce((acc, curr) => acc + curr.amount, 0);

  // Helper to determine automatic opening cash float based on last closing status
  const getCalculatedOpeningInfo = () => {
    const branchClosings = cashClosings
      .filter((c) => c.branchId === activeBranch.id)
      .sort((a, b) => new Date(b.date || b.createdAt || '').getTime() - new Date(a.date || a.createdAt || '').getTime());

    if (branchClosings.length === 0) {
      return { amount: 0, reason: 'no_history' as const };
    }

    const last = branchClosings[0];
    if (last.status === 'HandedOver' || last.handoverToAccountant) {
      return { amount: 0, reason: 'handed_over' as const, lastDate: last.date };
    } else {
      const carried = typeof last.cashInSafe === 'number' ? last.cashInSafe : Math.max(0, (last.openingBalance || 0) + (last.cashSales || 0) - (last.expenses || 0));
      return { amount: carried, reason: 'not_handed_over' as const, lastDate: last.date };
    }
  };

  const openingInfo = getCalculatedOpeningInfo();

  const [openingBalance, setOpeningBalance] = useState<number>(() => openingInfo.amount);
  const [cashSales, setCashSales] = useState<number>(liveCashSales);
  const [cardSales, setCardSales] = useState<number>(liveCardSales);
  const [expenses, setExpenses] = useState<number>(totalExpenseItemsSum);
  const [cashInSafe, setCashInSafe] = useState<number>(openingInfo.amount + liveCashSales - totalExpenseItemsSum);
  const [notes, setNotes] = useState<string>(
    lang === 'ar' ? 'إغلاق الكاش اليومي وإيداع الخزينة.' : 'Daily register closing and safe deposit.'
  );

  // Sync opening balance whenever active branch or cash closings change
  useEffect(() => {
    const info = getCalculatedOpeningInfo();
    setOpeningBalance(info.amount);
  }, [activeBranch.id, cashClosings]);

  // Sync state when active branch, live sales, or expense items change
  useEffect(() => {
    setCashSales(liveCashSales);
    setCardSales(liveCardSales);
    const expTotal = expenseItems.reduce((acc, curr) => acc + curr.amount, 0);
    setExpenses(expTotal);
    const expected = openingBalance + liveCashSales - expTotal;
    setCashInSafe(expected > 0 ? expected : 0);
  }, [activeBranch.id, liveCashSales, liveCardSales, expenseItems, openingBalance]);

  // Handler to add new petty cash expense
  const handleAddPettyExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(newExpenseAmount);
    if (!newExpenseTitle.trim() || isNaN(amt) || amt <= 0) return;

    const newItem = {
      id: `exp-${Date.now()}`,
      title: newExpenseTitle.trim(),
      amount: amt,
      category: newExpenseCategory,
      time: new Date().toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' }),
    };

    setExpenseItems((prev) => [...prev, newItem]);
    setNewExpenseTitle('');
    setNewExpenseAmount('');
    setShowExpenseModal(false);
  };

  const handleRemovePettyExpense = (id: string) => {
    setExpenseItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Modals & Handover State
  const [zReportModalOpen, setZReportModalOpen] = useState(false);
  const [selectedZReport, setSelectedZReport] = useState<DailyCashClosing | null>(null);
  
  const [handoverModalOpen, setHandoverModalOpen] = useState(false);
  const [selectedAccountant, setSelectedAccountant] = useState<string>('');
  const [isCustomRecipient, setIsCustomRecipient] = useState<boolean>(false);
  const [customRecipientName, setCustomRecipientName] = useState<string>('');
  const [handoverNotes, setHandoverNotes] = useState<string>('');
  const [handoverSuccessBanner, setHandoverSuccessBanner] = useState<string | null>(null);

  const expectedCashInSafe = openingBalance + cashSales - expenses;
  const reconciliationDifference = cashInSafe - expectedCashInSafe;

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'accountant':
        return lang === 'ar' ? 'المحاسبة والمالية' : 'Accountant';
      case 'admin':
        return lang === 'ar' ? 'إدارة النظام' : 'Admin';
      case 'sales_person':
        return lang === 'ar' ? 'مبيعات / كاشير' : 'Sales Person';
      case 'call_center':
        return lang === 'ar' ? 'خدمة العملاء' : 'Call Center';
      case 'lab_tech':
        return lang === 'ar' ? 'فني المختبر' : 'Lab Tech';
      default:
        return role;
    }
  };

  // Group users into categories for handover
  const activeUsers = users.filter((u) => u.isActive !== false);
  const accountantsAndAdmins = activeUsers.filter((u) => u.role === 'accountant' || u.role === 'admin');
  const otherStaff = activeUsers.filter((u) => u.role !== 'accountant' && u.role !== 'admin');

  // Auto initialize selected recipient from real system users
  useEffect(() => {
    if (activeUsers.length > 0 && (!selectedAccountant || selectedAccountant.includes('ماجد الهنيدي') || selectedAccountant.includes('سامي الخطيب'))) {
      const defaultUser = accountantsAndAdmins[0] || activeUsers[0];
      if (defaultUser) {
        setSelectedAccountant(`${defaultUser.fullName} (${getRoleLabel(defaultUser.role)})`);
      }
    }
  }, [users, handoverModalOpen]);

  // Submit standard Daily Closing
  const handleSubmitClosing = (e: React.FormEvent) => {
    e.preventDefault();
    const newClosing: Partial<DailyCashClosing> = {
      branchId: activeBranch.id,
      date: new Date().toISOString().split('T')[0],
      openingBalance,
      cashSales,
      cardSales,
      visaSales: liveVisaSales,
      cliqSales: liveCliqSales,
      bankTransferSales: liveBankTransferSales,
      insuranceSales: liveInsuranceSales,
      expenses,
      expenseDetails: expenseItems,
      cashInSafe,
      reconciliationDifference,
      notes,
      closedBy: currentUser?.fullName || 'مدير الفرع / أمين الصندوق',
      status: 'Approved'
    };
    onRecordCashClosing(newClosing);

    // Open Z-Report for immediate preview & print
    setSelectedZReport(newClosing as DailyCashClosing);
    setZReportModalOpen(true);
  };

  // Confirm Handover to Accountant & Zero out Cash Drawer
  const handleConfirmHandoverAndReset = () => {
    const amountToHand = cashInSafe;
    const nowTime = new Date().toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' });

    const recipient = isCustomRecipient
      ? (customRecipientName.trim() || (lang === 'ar' ? 'مندوب آخر' : 'Other Delegate'))
      : (selectedAccountant || (lang === 'ar' ? 'المحاسب/المستلم' : 'Recipient'));

    const handoverClosing: Partial<DailyCashClosing> = {
      branchId: activeBranch.id,
      date: new Date().toISOString().split('T')[0],
      openingBalance,
      cashSales,
      cardSales,
      visaSales: liveVisaSales,
      cliqSales: liveCliqSales,
      bankTransferSales: liveBankTransferSales,
      insuranceSales: liveInsuranceSales,
      expenses,
      expenseDetails: expenseItems,
      cashInSafe: amountToHand,
      reconciliationDifference,
      notes: `تم تسليم المبلغ [${amountToHand} دينار] للمستلم (${recipient}). ${handoverNotes}`,
      closedBy: currentUser?.fullName || 'مدير الفرع / الكاشير',
      status: 'HandedOver',
      handoverToAccountant: {
        accountantName: recipient,
        amountHanded: amountToHand,
        handoverTime: `${todayStr} ${nowTime}`,
        handoverBy: currentUser?.fullName || 'مدير الفرع',
        notes: handoverNotes
      }
    };

    // Save Handover record to Firestore / ERP Store
    onRecordCashClosing(handoverClosing);

    // Zero out / Reset Cash drawer for the new shift/cycle
    setOpeningBalance(0);
    setCashSales(0);
    setCardSales(0);
    setExpenses(0);
    setCashInSafe(0);

    setHandoverModalOpen(false);
    setHandoverSuccessBanner(
      lang === 'ar'
        ? `✅ تم تسليم المبلغ النظير (${amountToHand} JOD) للمستلم [${recipient}] وتصفير الصندوق اليومي بنجاح.`
        : `✅ Handed over (${amountToHand} JOD) to recipient [${recipient}] and reset cash drawer balance.`
    );

    // Show Z-Report printout for handover
    setSelectedZReport(handoverClosing as DailyCashClosing);
    setZReportModalOpen(true);
  };

  const handleOpenZReport = (closing: DailyCashClosing) => {
    let reportToShow = { ...closing };
    // Dynamically calculate missing card breakdowns for legacy records
    if (reportToShow.cardSales > 0 && !reportToShow.visaSales && !reportToShow.cliqSales && !reportToShow.bankTransferSales && !reportToShow.insuranceSales) {
      let legacyInvoices = invoices.filter(i => i.branchId === reportToShow.branchId && (i.invoiceDate === reportToShow.date || (i.createdAt && i.createdAt.startsWith(reportToShow.date))));

      let cVisa = 0, cCliq = 0, cTrans = 0, cIns = 0;
      legacyInvoices.forEach(i => {
        const processNonCash = (method: string, amount: number) => {
          if (method === 'Credit Card' || method === 'Visa') cVisa += amount;
          else if (method === 'Cliq') cCliq += amount;
          else if (method === 'Bank Transfer') cTrans += amount;
          else if (method === 'Insurance') cIns += amount;
        };
        if (i.paymentMethod === 'Split' && i.splitMethods) {
          i.splitMethods.forEach(sm => {
            if (sm.method !== 'Cash') processNonCash(sm.method, sm.amount);
          });
        } else if (i.paymentMethod !== 'Cash') {
          processNonCash(i.paymentMethod, i.paidAmount || 0);
        }
      });
      reportToShow.visaSales = cVisa;
      reportToShow.cliqSales = cCliq;
      reportToShow.bankTransferSales = cTrans;
      reportToShow.insuranceSales = cIns;
    }
    setSelectedZReport(reportToShow);
    setZReportModalOpen(true);
  };

  const branchClosings = cashClosings.filter((c) => c.branchId === activeBranch.id);

  return (
    <div id="branch-cash-module" className="p-6 space-y-6 max-w-7xl mx-auto text-slate-900">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {lang === 'ar' ? 'إدارة الصندوق اليومية وتقرير (Z. REPORT)' : 'Branch Cash Management & Z. REPORT'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {lang === 'ar'
                  ? 'مطابقة الكاش المباشر بالفواتير، تسليم المبالغ للمحاسب، وتصفير الصندوق مع إصدار Z-Report.'
                  : 'Live sales reconciliation, accountant cash handover, and zeroing cash register with Z-Report.'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-lg border border-slate-200 text-xs text-slate-800 font-bold shadow-xs">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>{activeBranch.name}</span>
          </div>

          {/* Quick Handover Button */}
          <button
            type="button"
            onClick={() => setHandoverModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-xs transition flex items-center gap-2 cursor-pointer"
          >
            <Send className="w-4 h-4 text-white" />
            {lang === 'ar' ? '🤝 تسليم الكاش للمحاسب وتصفير الصندوق' : 'Handover Cash & Reset'}
          </button>

          <button
            onClick={() => {
              const latest = branchClosings[0] || {
                id: 'z-sample',
                branchId: activeBranch.id,
                date: todayStr,
                openingBalance,
                cashSales,
                cardSales,
                expenses,
                cashInSafe,
                reconciliationDifference,
                closedBy: currentUser?.fullName || 'الكاشير الرئيسي',
                status: 'Approved',
                notes: 'Z-Report Daily Register Closing'
              };
              handleOpenZReport(latest as DailyCashClosing);
            }}
            className="bg-slate-900 hover:bg-black text-white px-4 py-2 rounded-lg text-xs font-bold shadow-xs transition flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            {lang === 'ar' ? 'طباعة تقرير Z. REPORT' : 'Generate Z-REPORT'}
          </button>
        </div>
      </div>

      {/* Handover Success Banner */}
      {handoverSuccessBanner && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-bold flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{handoverSuccessBanner}</span>
          </div>
          <button
            onClick={() => setHandoverSuccessBanner(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold text-xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Daily Closing Form */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-3">
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-600" />
              {lang === 'ar'
                ? `مطابقة وإغلاق الكاش اليومي`
                : `Perform Daily Register Cash Reconciliation`}
            </h3>
            
            <div className="flex items-center gap-3">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1.5 rounded-md border border-blue-100">
                {lang === 'ar' ? `فواتير اليوم: ${targetInvoices.length} فاتورة` : `Today Invoices: ${targetInvoices.length}`}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmitClosing} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Opening Cash Float */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-slate-700 font-bold block">
                    {lang === 'ar' ? 'رصيد الكاش الافتتاحي (دينار)' : 'Opening Cash Float (JOD)'}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const info = getCalculatedOpeningInfo();
                      setOpeningBalance(info.amount);
                      setCashInSafe(info.amount + cashSales - expenses);
                    }}
                    className="text-[10px] text-blue-600 hover:text-blue-800 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-100 transition cursor-pointer"
                  >
                    {lang === 'ar' ? '🔄 إعادة ضبط تلقائي' : '🔄 Auto Reset'}
                  </button>
                </div>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={openingBalance}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setOpeningBalance(val);
                    setCashInSafe(val + cashSales - expenses);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-mono rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold text-sm"
                />

                {openingInfo.reason === 'handed_over' && (
                  <p className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg p-2 font-medium leading-relaxed">
                    ✅ {lang === 'ar'
                      ? `تم تسليم نقدية الإغلاق السابق للمحاسب بنجاح، لذا الرصيد الافتتاحي للدرج اليوم هو (0) دينار.`
                      : `Previous cash was handed over to accountant. Opening float is 0 JOD.`}
                  </p>
                )}

                {openingInfo.reason === 'not_handed_over' && (
                  <p className="text-[11px] text-amber-900 bg-amber-50 border border-amber-200 rounded-lg p-2 font-medium leading-relaxed">
                    ⚠️ {lang === 'ar'
                      ? `لم يتم تسليم نقدية الإغلاق السابق للمحاسب، تم ترحيل المبلغ المتبقي (${openingInfo.amount} JOD) كرصيد افتتاحي اليوم.`
                      : `Previous cash was not handed over to accountant. Carried over (${openingInfo.amount} JOD) as today's opening float.`}
                  </p>
                )}

                {openingInfo.reason === 'no_history' && (
                  <p className="text-[11px] text-slate-600 bg-slate-100 border border-slate-200 rounded-lg p-2 font-medium leading-relaxed">
                    ℹ️ {lang === 'ar'
                      ? `لا توجد سجلات إغلاق سابقة لهذا الفرع، الرصيد الافتتاحي هو (0) دينار.`
                      : `No previous closings for this branch. Default opening float is 0 JOD.`}
                  </p>
                )}
              </div>

              {/* Cash Sales */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-slate-700 font-bold block">
                    {lang === 'ar' ? 'إجمالي المبيعات النقدية اليوم (دينار)' : 'Total Cash Sales Today (JOD)'}
                  </label>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    {lang === 'ar' ? 'تلقائي من الفواتير' : 'From Invoices'}
                  </span>
                </div>
                <input
                  type="number"
                  value={cashSales}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setCashSales(val);
                    setCashInSafe(openingBalance + val - expenses);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 text-emerald-700 font-bold font-mono rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-500">
                  {lang === 'ar'
                    ? '💡 مجموع الدفعات النقدية المسجلة بفواتير البيع للفرع اليوم.'
                    : '💡 Total cash payments from today sales invoices.'}
                </p>
              </div>

              {/* Card Sales */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-slate-700 font-bold block">
                    {lang === 'ar' ? 'إجمالي مبيعات بطاقات الدفع/الفيزا (دينار)' : 'Total Credit Card Sales (JOD)'}
                  </label>
                  <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                    {lang === 'ar' ? 'تلقائي من الفواتير' : 'From Invoices'}
                  </span>
                </div>
                <input
                  type="number"
                  value={cardSales}
                  onChange={(e) => setCardSales(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 text-blue-700 font-bold font-mono rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-500">
                  {lang === 'ar'
                    ? '💡 مجموع مدفوعات الفيزا والتحويلات المباشرة للحساب البنكي.'
                    : '💡 Card and bank transfer totals from sales.'}
                </p>
                {liveCardSales > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-slate-200 text-[10px]">
                    {liveVisaSales > 0 && <span className="bg-white border border-slate-200 px-2 py-1 rounded shadow-sm text-slate-600"><span className="font-bold text-blue-700">Visa:</span> {liveVisaSales} JOD</span>}
                    {liveCliqSales > 0 && <span className="bg-white border border-slate-200 px-2 py-1 rounded shadow-sm text-slate-600"><span className="font-bold text-purple-700">CliQ:</span> {liveCliqSales} JOD</span>}
                    {liveBankTransferSales > 0 && <span className="bg-white border border-slate-200 px-2 py-1 rounded shadow-sm text-slate-600"><span className="font-bold text-emerald-700">Transfer:</span> {liveBankTransferSales} JOD</span>}
                    {liveInsuranceSales > 0 && <span className="bg-white border border-slate-200 px-2 py-1 rounded shadow-sm text-slate-600"><span className="font-bold text-amber-700">Insurance:</span> {liveInsuranceSales} JOD</span>}
                  </div>
                )}
              </div>

              {/* Petty Cash Expenses */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-slate-700 font-bold block">
                    {lang === 'ar' ? 'المصاريف والنثريات النقدية (دينار)' : 'Petty Cash Expenses (JOD)'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowExpenseModal(true)}
                    className="text-[10px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded border border-rose-200 transition cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    {lang === 'ar' ? 'إضافة/عرض السجل' : 'Manage List'}
                  </button>
                </div>
                <input
                  type="number"
                  value={expenses}
                  readOnly
                  className="w-full bg-slate-100 border border-slate-200 text-rose-700 font-bold font-mono rounded-lg p-2.5 focus:outline-none cursor-not-allowed"
                />
                <p className="text-[10px] text-slate-500">
                  {lang === 'ar'
                    ? '💡 المصروفات اليومية المسحوبة من صندوق الفرع (ضيافة، نظافة، صيانة).'
                    : '💡 Out-of-pocket expenses paid from register.'}
                </p>
              </div>
            </div>

            {/* Itemized Petty Cash List Preview */}
            {expenseItems.length > 0 && (
              <div className="bg-rose-50/50 border border-rose-200/80 rounded-xl p-3 space-y-2">
                <div className="flex justify-between items-center border-b border-rose-200/60 pb-1.5">
                  <span className="font-bold text-rose-900 text-xs flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-rose-600" />
                    {lang === 'ar' ? 'تفاصيل سجل المصاريف والنثريات اليومية:' : 'Today Petty Expenses List:'}
                  </span>
                  <span className="font-mono font-bold text-rose-700 text-xs">
                    {totalExpenseItemsSum.toFixed(2)} JOD
                  </span>
                </div>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {expenseItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-rose-100 text-[11px]"
                    >
                      <div className="flex items-center gap-2">
                        <span className="bg-rose-100 text-rose-800 font-bold px-1.5 py-0.5 rounded text-[10px]">
                          {item.category}
                        </span>
                        <span className="font-medium text-slate-800">{item.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({item.time})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold font-mono text-rose-700">{item.amount} JOD</span>
                        <button
                          type="button"
                          onClick={() => handleRemovePettyExpense(item.id)}
                          className="text-slate-400 hover:text-rose-600 p-0.5"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cash Calculation Box */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 font-mono">
              <div className="flex justify-between text-slate-700 text-xs">
                <span className="font-sans font-bold text-slate-700">
                  {lang === 'ar' ? 'الكاش المفترض وجوده في الخزينة:' : 'Expected Physical Cash in Safe:'}
                </span>
                <span className="font-bold text-slate-900 text-sm">{expectedCashInSafe.toFixed(2)} JOD</span>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-sans font-bold block">
                  {lang === 'ar' ? 'الكاش الفعلي المحسوب في الخزينة (دينار)' : 'Actual Counted Cash in Safe (JOD)'}
                </label>
                <input
                  type="number"
                  value={cashInSafe}
                  onChange={(e) => setCashInSafe(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-amber-300 text-amber-900 text-base font-bold rounded-lg p-2.5 font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-between text-xs font-bold pt-1 border-t border-slate-200">
                <span className="font-sans text-slate-600">
                  {lang === 'ar' ? 'الفارق / العجز أو الزيادة:' : 'Reconciliation Discrepancy:'}
                </span>
                <span className={reconciliationDifference === 0 ? 'text-emerald-700' : 'text-rose-700'}>
                  {reconciliationDifference > 0 ? `+${reconciliationDifference}` : reconciliationDifference} JOD
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-slate-700 font-bold block">
                {lang === 'ar' ? 'ملاحظات مدير الفرع / أمين الصندوق' : 'Closing Manager Notes'}
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-medium rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              ></textarea>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Cash Handover & Zero Out Button */}
              <button
                type="button"
                onClick={() => setHandoverModalOpen(true)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-lg shadow-xs cursor-pointer flex items-center justify-center gap-2 transition"
              >
                <Send className="w-4 h-4" />
                {lang === 'ar' ? '🤝 تسليم الكاش للمحاسب وتصفير الصندوق' : 'Handover Cash to Accountant & Reset'}
              </button>

              {/* Standard Z-Report Save Button */}
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 rounded-lg shadow-xs cursor-pointer flex items-center justify-center gap-2 transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                {lang === 'ar' ? 'حفظ الصندوق وإصدار تقرير Z-REPORT' : 'Save & Print Daily Z-REPORT'}
              </button>
            </div>
          </form>
        </div>

        {/* Right: Previous Closings History */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wide flex items-center gap-2 border-b border-slate-100 pb-3">
            <FileCheck className="w-4 h-4 text-blue-600" />
            {lang === 'ar' ? `سجل الإغلاقات وتقارير Z (${activeBranch.code})` : `Recent Z-Reports (${activeBranch.code})`}
          </h3>

          <div className="space-y-3 max-h-[500px] overflow-y-auto ltr:pr-1 rtl:pl-1">
            {branchClosings.map((c) => (
              <div key={c.id} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="flex items-center justify-between font-mono">
                  <span className="font-bold text-slate-900">{c.date}</span>
                  <div className="flex items-center gap-1.5">
                    {c.status === 'HandedOver' && (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200">
                        {lang === 'ar' ? 'مُسلَّم ومصفَّر' : 'Handed Over'}
                      </span>
                    )}
                    <button
                      onClick={() => handleOpenZReport(c)}
                      className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-2.5 py-1 rounded border border-blue-200 transition cursor-pointer flex items-center gap-1 text-[10px]"
                    >
                      <Printer className="w-3 h-3" />
                      Z-REPORT
                    </button>
                  </div>
                </div>
                <div className="text-[11px] text-slate-700 space-y-0.5 font-mono">
                  <div>
                    {lang === 'ar' ? 'كاش:' : 'Cash:'} {c.cashSales} JOD | {lang === 'ar' ? 'فيزا:' : 'Cards:'} {c.cardSales} JOD
                  </div>
                  <div>
                    {lang === 'ar' ? 'في الخزينة:' : 'In Safe:'} {c.cashInSafe} JOD
                  </div>
                  {c.handoverToAccountant && (
                    <div className="text-[10px] text-emerald-700 font-bold font-sans pt-1 border-t border-slate-200 flex items-center gap-1">
                      <UserCheck className="w-3 h-3 shrink-0" />
                      <span>{lang === 'ar' ? `سُلّم للمحاسب: ${c.handoverToAccountant.accountantName}` : `Handed to: ${c.handoverToAccountant.accountantName}`}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {branchClosings.length === 0 && (
              <div className="p-6 text-center text-xs text-slate-400 font-medium">
                {lang === 'ar' ? 'لا توجد تقارير إغلاق سابقة لفرع اليوم.' : 'No previous closing reports found.'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Petty Cash Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-slate-900">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <div className="p-2 bg-rose-100 text-rose-700 rounded-lg">
                  <Receipt className="w-5 h-5" />
                </div>
                <span>{lang === 'ar' ? 'إضافة بند نثريات/مصروفات اليوم' : 'Add Petty Cash Expense'}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowExpenseModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPettyExpense} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-700 font-bold block">
                  {lang === 'ar' ? 'تصنيف المصروف:' : 'Expense Category:'}
                </label>
                <select
                  value={newExpenseCategory}
                  onChange={(e) => setNewExpenseCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                >
                  <option value="ضيافة">{lang === 'ar' ? 'ضيافة زبائن (شاي/قهوة/مياه)' : 'Hospitality'}</option>
                  <option value="نظافة">{lang === 'ar' ? 'أدوات تنظيف ومطهرات' : 'Cleaning'}</option>
                  <option value="صيانة">{lang === 'ar' ? 'صيانة سريعة ومستلزمات' : 'Maintenance'}</option>
                  <option value="شحن">{lang === 'ar' ? 'رسوم شحن وتوصيل مستعجل' : 'Shipping / Delivery'}</option>
                  <option value="أخرى">{lang === 'ar' ? 'مصروفات أخرى' : 'Other'}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-bold block">
                  {lang === 'ar' ? 'البيان/تفاصيل المصروف:' : 'Expense Description:'}
                </label>
                <input
                  type="text"
                  required
                  value={newExpenseTitle}
                  onChange={(e) => setNewExpenseTitle(e.target.value)}
                  placeholder={lang === 'ar' ? 'مثال: ضيافة زبائن محل صويلح...' : 'e.g. Tea & Coffee for clients'}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-bold block">
                  {lang === 'ar' ? 'المبلغ (دينار):' : 'Amount (JOD):'}
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={newExpenseAmount}
                  onChange={(e) => setNewExpenseAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-mono font-bold text-rose-700 text-sm focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="submit"
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer text-xs"
                >
                  <Plus className="w-4 h-4" />
                  {lang === 'ar' ? 'إضافة إلى سجل المصاريف' : 'Add to Expense Log'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl transition cursor-pointer text-xs"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Handover & Cash Zeroing Modal */}
      {handoverModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 text-slate-900">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                  <Send className="w-5 h-5" />
                </div>
                <span>{lang === 'ar' ? '🤝 تسليم الكاش للمحاسب وتصفير الصندوق' : 'Cash Handover to Accountant & Zeroing'}</span>
              </div>
              <button
                onClick={() => setHandoverModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between font-bold text-emerald-900">
                <span>{lang === 'ar' ? 'الفرع:' : 'Branch:'}</span>
                <span>{activeBranch.name}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 text-sm pt-2 border-t border-emerald-200 font-mono">
                <span>{lang === 'ar' ? 'المبلغ الصافي المراد تسليمه للمحاسب:' : 'Net Cash Amount to Hand Over:'}</span>
                <span className="text-emerald-700 text-base">{cashInSafe.toFixed(2)} JOD</span>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-2">
                <label className="text-slate-700 font-bold block">
                  {lang === 'ar' ? 'اختيار الشخص/المحاسب المستلم للكاش:' : 'Select Receiving Person/Accountant:'}
                </label>
                <select
                  value={isCustomRecipient ? 'CUSTOM' : selectedAccountant}
                  onChange={(e) => {
                    if (e.target.value === 'CUSTOM') {
                      setIsCustomRecipient(true);
                    } else {
                      setIsCustomRecipient(false);
                      setSelectedAccountant(e.target.value);
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-bold rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                >
                  {accountantsAndAdmins.length > 0 && (
                    <optgroup label={lang === 'ar' ? '📊 المحاسبة والمالية وإدارة النظام' : 'Finance & Admin'}>
                      {accountantsAndAdmins.map((acc) => (
                        <option key={acc.id} value={`${acc.fullName} (${getRoleLabel(acc.role)})`}>
                          {acc.fullName} — {getRoleLabel(acc.role)} ({acc.username})
                        </option>
                      ))}
                    </optgroup>
                  )}

                  {otherStaff.length > 0 && (
                    <optgroup label={lang === 'ar' ? '👤 موظفو الفروع والمندوبون المعينون' : 'Branch Staff & Delegates'}>
                      {otherStaff.map((st) => (
                        <option key={st.id} value={`${st.fullName} (${getRoleLabel(st.role)})`}>
                          {st.fullName} — {getRoleLabel(st.role)} ({st.username})
                        </option>
                      ))}
                    </optgroup>
                  )}

                  <optgroup label={lang === 'ar' ? '✍️ مندوب آخر / موظف مفوض' : 'Other External Delegate'}>
                    <option value="CUSTOM">{lang === 'ar' ? '➕ إدخال اسم مستلم/مندوب آخر يدويًا' : '➕ Enter Custom Delegate Name'}</option>
                  </optgroup>
                </select>

                {isCustomRecipient && (
                  <div className="space-y-1 pt-1">
                    <label className="text-slate-700 font-bold block">
                      {lang === 'ar' ? 'اسم المندوب/الموظف المستلم للكاش:' : 'Custom Delegate Name:'}
                    </label>
                    <input
                      type="text"
                      required
                      value={customRecipientName}
                      onChange={(e) => setCustomRecipientName(e.target.value)}
                      placeholder={lang === 'ar' ? 'مثال: المندوب أحمد - بتكليف من قسم المحاسبة' : 'e.g., Driver Ahmad - Sent by Accountant'}
                      className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-bold rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-bold block">
                  {lang === 'ar' ? 'اسم الموضّف/المسلّم للكاش:' : 'Handed Over By:'}
                </label>
                <input
                  type="text"
                  disabled
                  value={currentUser?.fullName || 'مدير الفرع / الكاشير'}
                  className="w-full bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-lg p-2.5 cursor-not-allowed"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-bold block">
                  {lang === 'ar' ? 'ملاحظات وإيصال تسليم الكاش:' : 'Handover Receipt Notes:'}
                </label>
                <textarea
                  rows={2}
                  value={handoverNotes}
                  onChange={(e) => setHandoverNotes(e.target.value)}
                  placeholder={lang === 'ar' ? 'أدخل أي ملاحظات خاصة بعملية تسليم النقدية للفرع...' : 'Add any specific notes...'}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                ></textarea>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleConfirmHandoverAndReset}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer text-xs"
              >
                <RotateCcw className="w-4 h-4" />
                {lang === 'ar' ? 'تأكيد تسليم الكاش وتصفير الصندوق' : 'Confirm Handover & Zero Cash Drawer'}
              </button>
              <button
                type="button"
                onClick={() => setHandoverModalOpen(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-3 rounded-xl transition cursor-pointer text-xs"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Z-REPORT Modal */}
      {zReportModalOpen && selectedZReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold">
                <FileText className="w-5 h-5 text-blue-600" />
                <span>{lang === 'ar' ? 'تقرير الإغلاق النهائي - Z. REPORT' : 'Official Z. REPORT Daily Closing'}</span>
              </div>
              <button
                onClick={() => setZReportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Thermal Receipt Visual Container */}
            <div id="z-report-receipt" className="bg-amber-50/50 border border-dashed border-amber-300 rounded-xl p-5 text-center font-mono text-xs space-y-3 text-slate-900">
              <div className="space-y-1">
                <h2 className="font-bold text-base uppercase tracking-wider text-slate-900">OPTIVISION ENTERPRISE</h2>
                <p className="text-[11px] font-sans font-medium text-slate-600">{activeBranch.name}</p>
                <p className="text-[10px] text-slate-400 font-mono">------------------------------------</p>
                <h3 className="font-bold text-sm bg-slate-900 text-white py-1 rounded">*** Z - REPORT ***</h3>
                <p className="text-[10px] text-slate-500 font-sans">{lang === 'ar' ? 'تقرير التصفية والإغلاق اليومي' : 'Daily End-Of-Day Financial Reset'}</p>
              </div>

              <div className="text-left rtl:text-right space-y-1 pt-2 border-t border-slate-200 text-[11px]">
                <div className="flex justify-between"><span>DATE:</span><span>{selectedZReport.date}</span></div>
                <div className="flex justify-between"><span>BRANCH CODE:</span><span>{activeBranch.code}</span></div>
                <div className="flex justify-between"><span>CLOSED BY:</span><span>{selectedZReport.closedBy || 'Cashier'}</span></div>
                <div className="flex justify-between"><span>STATUS:</span><span className="font-bold text-emerald-700">{selectedZReport.status === 'HandedOver' ? 'HANDED OVER & ZEROED' : selectedZReport.status}</span></div>
              </div>

              <p className="text-[10px] text-slate-400 font-mono">------------------------------------</p>

              <div className="text-left rtl:text-right space-y-1.5 text-[11px]">
                <div className="flex justify-between text-slate-700"><span>OPENING FLOAT:</span><span>{(selectedZReport.openingBalance || 0).toFixed(2)} JOD</span></div>
                <div className="flex justify-between font-bold text-emerald-700"><span>CASH SALES:</span><span>{(selectedZReport.cashSales || 0).toFixed(2)} JOD</span></div>
                <div className="flex justify-between font-bold text-blue-700"><span>CARD SALES:</span><span>{(selectedZReport.cardSales || 0).toFixed(2)} JOD</span></div>
                <div className="flex justify-between text-[10px] text-slate-500 pl-4 rtl:pl-0 rtl:pr-4"><span>- Visa/CC:</span><span>{(selectedZReport.visaSales || 0).toFixed(2)} JOD</span></div>
                <div className="flex justify-between text-[10px] text-slate-500 pl-4 rtl:pl-0 rtl:pr-4"><span>- CliQ:</span><span>{(selectedZReport.cliqSales || 0).toFixed(2)} JOD</span></div>
                <div className="flex justify-between text-[10px] text-slate-500 pl-4 rtl:pl-0 rtl:pr-4"><span>- Transfer:</span><span>{(selectedZReport.bankTransferSales || 0).toFixed(2)} JOD</span></div>
                <div className="flex justify-between text-[10px] text-slate-500 pl-4 rtl:pl-0 rtl:pr-4"><span>- Insurance:</span><span>{(selectedZReport.insuranceSales || 0).toFixed(2)} JOD</span></div>
                {((selectedZReport.cardSales || 0) - ((selectedZReport.visaSales || 0) + (selectedZReport.cliqSales || 0) + (selectedZReport.bankTransferSales || 0) + (selectedZReport.insuranceSales || 0))) > 0.01 && (
                  <div className="flex justify-between text-[10px] text-slate-500 pl-4 rtl:pl-0 rtl:pr-4">
                    <span>- Others (Manual Entry):</span>
                    <span>{((selectedZReport.cardSales || 0) - ((selectedZReport.visaSales || 0) + (selectedZReport.cliqSales || 0) + (selectedZReport.bankTransferSales || 0) + (selectedZReport.insuranceSales || 0))).toFixed(2)} JOD</span>
                  </div>
                )}
                <div className="flex justify-between text-rose-700"><span>EXPENSES:</span><span>-{(selectedZReport.expenses || 0).toFixed(2)} JOD</span></div>
                {selectedZReport.expenseDetails && selectedZReport.expenseDetails.length > 0 ? (
                  <div className="text-[10px] text-rose-500 pl-4 rtl:pl-0 rtl:pr-4 space-y-0.5">
                    {selectedZReport.expenseDetails.map((exp: any) => (
                      <div key={exp.id} className="flex justify-between">
                        <span>- {exp.title}</span>
                        <span>{exp.amount.toFixed(2)} JOD</span>
                      </div>
                    ))}
                  </div>
                ) : selectedZReport.expenses > 0 ? (
                  <div className="text-[10px] text-rose-500 pl-4 rtl:pl-0 rtl:pr-4 space-y-0.5">
                    <div className="flex justify-between">
                      <span>- Uncategorized / Manual Entry</span>
                      <span>{(selectedZReport.expenses).toFixed(2)} JOD</span>
                    </div>
                  </div>
                ) : null}
                <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-300">
                  <span>TOTAL SALES:</span>
                  <span>{((selectedZReport.cashSales || 0) + (selectedZReport.cardSales || 0)).toFixed(2)} JOD</span>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 font-mono">------------------------------------</p>

              <div className="text-left rtl:text-right space-y-1 text-[11px]">
                <div className="flex justify-between text-slate-700"><span>EXPECTED SAFE:</span><span>{((selectedZReport.openingBalance || 0) + (selectedZReport.cashSales || 0) - (selectedZReport.expenses || 0)).toFixed(2)} JOD</span></div>
                <div className="flex justify-between font-bold text-amber-900"><span>ACTUAL COUNTED:</span><span>{(selectedZReport.cashInSafe || 0).toFixed(2)} JOD</span></div>
                <div className="flex justify-between font-bold text-rose-700"><span>DISCREPANCY:</span><span>{(selectedZReport.reconciliationDifference || 0).toFixed(2)} JOD</span></div>
              </div>

              {selectedZReport.handoverToAccountant && (
                <>
                  <p className="text-[10px] text-slate-400 font-mono">------------------------------------</p>
                  <div className="p-2 bg-emerald-100/60 rounded border border-emerald-300 text-left rtl:text-right text-[11px] space-y-1">
                    <div className="font-bold text-emerald-900">🤝 ACCOUNTANT HANDOVER:</div>
                    <div className="flex justify-between text-emerald-900"><span>TO ACCOUNTANT:</span><span>{selectedZReport.handoverToAccountant.accountantName}</span></div>
                    <div className="flex justify-between text-emerald-900 font-bold"><span>AMOUNT HANDED:</span><span>{selectedZReport.handoverToAccountant.amountHanded.toFixed(2)} JOD</span></div>
                    <div className="flex justify-between text-emerald-800 text-[10px]"><span>HANDOVER TIME:</span><span>{selectedZReport.handoverToAccountant.handoverTime}</span></div>
                  </div>
                </>
              )}

              <p className="text-[10px] text-slate-400 font-mono">------------------------------------</p>
              <div className="text-[10px] font-sans text-slate-500 italic">
                {selectedZReport.status === 'HandedOver'
                  ? 'تم تسليم المبلغ كاملاً للمحاسب وتصفير الصندوق.'
                  : 'تم قفل الصندوق وإعادة تعيين العداد اليومي.'}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  const receiptElement = document.getElementById('z-report-receipt');
                  if (!receiptElement) return;
                  
                  let portal = document.getElementById('direct-print-portal');
                  if (!portal) {
                    portal = document.createElement('div');
                    portal.id = 'direct-print-portal';
                    document.body.appendChild(portal);
                  }
                  portal.innerHTML = receiptElement.innerHTML;
                  
                  window.print();
                  
                  setTimeout(() => {
                    if (portal) portal.innerHTML = '';
                  }, 500);
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer text-xs"
              >
                <Printer className="w-4 h-4" />
                {lang === 'ar' ? 'طباعة التقرير (Print)' : 'Print Z-Report'}
              </button>
              <button
                onClick={() => setZReportModalOpen(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl transition cursor-pointer text-xs"
              >
                {lang === 'ar' ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

