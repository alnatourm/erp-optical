import React, { useState } from 'react';
import {
  TrendingUp,
  Package,
  Receipt,
  Users,
  AlertTriangle,
  PhoneCall,
  Glasses,
  DollarSign,
  Building2,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  BarChart3,
  LayoutDashboard,
} from 'lucide-react';
import { Branch, Product, Invoice, CallReminder, LaboratoryJob } from '../types';
import { BranchPerformanceModule } from './BranchPerformanceModule';
import { useLanguage } from '../lib/i18n';

interface DashboardModuleProps {
  branches: Branch[];
  activeBranch: Branch;
  products: Product[];
  invoices: Invoice[];
  callReminders: CallReminder[];
  labJobs: LaboratoryJob[];
  onNavigateTab: (tab: any) => void;
  onSelectBranch?: (branchId: string) => void;
  initialSubTab?: 'overview' | 'branch_performance';
}

export const DashboardModule: React.FC<DashboardModuleProps> = ({
  branches,
  activeBranch,
  products,
  invoices,
  callReminders,
  labJobs,
  onNavigateTab,
  onSelectBranch,
  initialSubTab = 'overview',
}) => {
  const { lang, t } = useLanguage();
  const [subTab, setSubTab] = useState<'overview' | 'branch_performance'>(initialSubTab);

  // Filter data by active branch or show multi-branch totals
  const branchInvoices = invoices.filter((i) => i.branchId === activeBranch.id);
  const totalRevenue = branchInvoices.reduce((sum, i) => sum + i.grandTotal, 0);
  const totalPaid = branchInvoices.reduce((sum, i) => sum + i.paidAmount, 0);
  const totalOutstanding = branchInvoices.reduce((sum, i) => sum + i.remainingBalance, 0);

  const branchProducts = products.filter((p) => p.branchId === activeBranch.id);
  const inventoryValue = branchProducts.reduce((sum, p) => sum + p.purchaseCost * p.currentQuantity, 0);
  const retailInventoryValue = branchProducts.reduce((sum, p) => sum + p.sellingPrice * p.currentQuantity, 0);
  const lowStockItems = branchProducts.filter((p) => p.currentQuantity <= p.minimumStock);

  const pendingCalls = callReminders.filter((c) => c.status === 'Pending');
  const activeLabJobs = labJobs.filter((j) => j.status !== 'Delivered');

  const allSalesmen = invoices.reduce((acc, inv) => {
    const name = inv.salesEmployee;
    if (!acc[name]) acc[name] = 0;
    acc[name] += inv.grandTotal;
    return acc;
  }, {} as Record<string, number>);
  const bestSalesmanOverall = Object.entries(allSalesmen).sort((a, b) => (b[1] as number) - (a[1] as number))[0] || null;

  return (
    <div id="dashboard-module" className="p-6 space-y-6 max-w-7xl mx-auto text-slate-900">
      {/* Top Navigation Sub-Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2 bg-slate-200/80 p-1 rounded-xl">
          <button
            onClick={() => setSubTab('overview')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              subTab === 'overview'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-blue-600" />
            {t('kpiOverview')}
          </button>

          <button
            onClick={() => setSubTab('branch_performance')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              subTab === 'branch_performance'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-emerald-600" />
            {t('branchPerformanceCharts')}
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-1.5 py-0.5 rounded border border-emerald-300">
              {lang === 'ar' ? 'رسوم' : 'Charts'}
            </span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-500">
          <Building2 className="w-4 h-4 text-slate-400" />
          <span>{t('activeOutlet')} <strong className="text-slate-900 font-bold">{activeBranch.name}</strong></span>
        </div>
      </div>

      {/* Render Branch Performance Analytics Tab */}
      {subTab === 'branch_performance' ? (
        <BranchPerformanceModule
          branches={branches}
          activeBranch={activeBranch}
          products={products}
          invoices={invoices}
          onSelectBranch={onSelectBranch}
          onNavigateTab={onNavigateTab}
        />
      ) : (
        <>
          {/* Top Banner */}
      <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white tracking-wider uppercase">
              {activeBranch.code}
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">{activeBranch.name}</h2>
          </div>
          <p className="text-xs text-slate-400">
            {t('managerLabel')} <span className="text-slate-200 font-medium">{activeBranch.manager}</span> | {lang === 'ar' ? 'الهاتف:' : 'Phone:'}{' '}
            <span className="text-slate-200 font-medium">{activeBranch.phone}</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => onNavigateTab('import')}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2 rounded-lg border border-slate-700 transition cursor-pointer flex items-center gap-2"
          >
            <Package className="w-4 h-4 text-blue-400" />
            {t('stockImportBtn')}
          </button>

          <button
            onClick={() => onNavigateTab('pos')}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-xs transition cursor-pointer flex items-center gap-2"
          >
            <Receipt className="w-4 h-4" />
            {t('newRxInvoiceBtn')}
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              {lang === 'ar' ? 'إيرادات الفرع' : 'Branch Revenue'}
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {totalRevenue.toLocaleString()} {lang === 'ar' ? 'د.أ' : 'JOD'}
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {lang === 'ar' ? 'المدفوع:' : 'Paid:'}{' '}
              <span className="text-emerald-600 font-bold">
                {totalPaid.toLocaleString()} {lang === 'ar' ? 'د.أ' : 'JOD'}
              </span>{' '}
              | {lang === 'ar' ? 'المتبقي:' : 'Due:'}{' '}
              <span className="text-amber-600 font-bold">
                {totalOutstanding.toLocaleString()} {lang === 'ar' ? 'د.أ' : 'JOD'}
              </span>
            </p>
          </div>
        </div>

        {/* Inventory Value */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              {lang === 'ar' ? 'تقييم بضاعة أصول المخزون' : 'Stock Asset Valuation'}
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {inventoryValue.toLocaleString()} {lang === 'ar' ? 'د.أ' : 'JOD'}
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {lang === 'ar' ? 'بسعر البيع الإجمالي:' : 'Retail Value:'}{' '}
              <span className="text-blue-600 font-bold">
                {retailInventoryValue.toLocaleString()} {lang === 'ar' ? 'د.أ' : 'JOD'}
              </span>
            </p>
          </div>
        </div>

        {/* Lab Jobs Pending */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              {lang === 'ar' ? 'طلبات المختبر النشطة' : 'Active Lab Jobs'}
            </span>
            <div className="p-2 bg-sky-50 text-sky-600 rounded-lg">
              <Glasses className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {activeLabJobs.length} {lang === 'ar' ? 'طلبات' : 'Orders'}
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {lang === 'ar' ? 'خط تجهيز وقص العدسات' : 'Lens edging & assembly pipeline'}
            </p>
          </div>
        </div>

        {/* Pending Call Reminders */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              {lang === 'ar' ? 'مهام مركز الاتصالات' : 'Call Center Tasks'}
            </span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <PhoneCall className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {pendingCalls.length} {lang === 'ar' ? 'معلقة' : 'Pending'}
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {lang === 'ar' ? 'رضا العميل وفحص 6 أشهر' : '3-Day Satisfaction & 6-Mo Check'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Low Stock Alerts & Recent Invoices */}
        <div className="lg:col-span-2 space-y-6">
          {/* Low Stock Alerts Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">
                  {lang === 'ar' ? 'تنبيهات الأصناف منخفضة المخزون' : 'Low Stock & Reorder Alerts'}
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab('products')}
                className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                {lang === 'ar' ? 'عرض كامل المخزون' : 'View Inventory'} <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {lowStockItems.length === 0 ? (
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200 text-slate-600 text-xs font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                {lang === 'ar'
                  ? `جميع الإطارات والعدسات في ${activeBranch.name} أعلى من الحد الأدنى للمخزون.`
                  : `All optical frames and lenses in ${activeBranch.name} are above minimum stock levels.`}
              </div>
            ) : (
              <div className="space-y-2">
                {lowStockItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100/80 rounded-lg border border-slate-200 text-xs transition"
                  >
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span>{item.brand} - {item.model}</span>
                        <span className="font-mono text-[10px] text-slate-600 bg-white border border-slate-200 px-1.5 py-0.5 rounded font-semibold">
                          #{item.barcode}
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px] mt-0.5">{item.description}</p>
                    </div>

                    <div className="text-right">
                      <span className="font-bold text-amber-700 font-mono bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[11px]">
                        {item.currentQuantity} / {item.minimumStock} {lang === 'ar' ? 'الحد الأدنى' : 'Min'}
                      </span>
                      <p className="text-[10px] text-slate-500 mt-1 font-medium">
                        {lang === 'ar' ? 'السعر:' : 'Price:'} {item.sellingPrice} {lang === 'ar' ? 'د.أ' : 'JOD'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Sales Invoices */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">
                  {lang === 'ar' ? `أحدث فواتير المبيعات (${activeBranch.code})` : `Recent Sales Invoices (${activeBranch.code})`}
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab('pos')}
                className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                {lang === 'ar' ? 'الانتقال لنقطة البيع POS' : 'Go to POS'} <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {branchInvoices.length === 0 ? (
              <p className="text-slate-400 text-xs text-center py-6">
                {lang === 'ar' ? 'لا توجد فواتير مبيعات مسجلة حتى الآن لهذا الفرع.' : 'No sales invoices recorded yet for this branch.'}
              </p>
            ) : (
              <div className="space-y-2.5">
                {branchInvoices.slice(0, 4).map((inv) => (
                  <div
                    key={inv.id}
                    className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-lg border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-700">{inv.invoiceNumber}</span>
                        <span className="text-slate-300">•</span>
                        <span className="font-semibold text-slate-900">{inv.customerName}</span>
                        <span className="text-slate-500">({inv.customerPhone})</span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                        <span>{lang === 'ar' ? 'الأصناف:' : 'Items:'} {inv.items.map((i) => i.description).join(', ')}</span>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-end justify-between sm:justify-start gap-1 shrink-0">
                      <span className="font-bold text-slate-900 text-sm font-mono">{inv.grandTotal} {lang === 'ar' ? 'د.أ' : 'JOD'}</span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {lang === 'ar' ? 'الحالة:' : 'Status:'}{' '}
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          {inv.deliveryStatus}
                        </span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Branch Overview & Lab Jobs Pipeline */}
        <div className="space-y-6">
          {/* Top Performer Overall */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">
                {lang === 'ar' ? 'أفضل مبيعات (جميع الفروع)' : 'Top Salesman (All Outlets)'}
              </h3>
            </div>
            {bestSalesmanOverall ? (
              <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-lg border border-emerald-200">
                    {bestSalesmanOverall[0].charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{bestSalesmanOverall[0]}</div>
                    <div className="text-[10px] text-emerald-700 font-medium">{lang === 'ar' ? 'الأول على مستوى الفروع' : 'Top performer across outlets'}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-emerald-700 font-mono">{bestSalesmanOverall[1].toLocaleString()} <span className="text-xs">{lang === 'ar' ? 'د.أ' : 'JOD'}</span></div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold">{lang === 'ar' ? 'إجمالي المبيعات' : 'Total Revenue'}</div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 text-center py-2">{lang === 'ar' ? 'لا يوجد مبيعات' : 'No sales data'}</div>
            )}
          </div>

          {/* Multi-Branch Revenue Table */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-purple-600" />
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">
                  {lang === 'ar' ? 'مقارنة الفروع والأداء' : 'Branches Comparison'}
                </h3>
              </div>
            </div>

            <div className="space-y-2">
              {branches.map((b) => {
                const bInvoices = invoices.filter((i) => i.branchId === b.id);
                const rev = bInvoices.reduce((sum, i) => sum + i.grandTotal, 0);
                const bProds = products.filter((p) => p.branchId === b.id);
                const isSelected = b.id === activeBranch.id;

                return (
                  <div
                    key={b.id}
                    className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-50/80 border-blue-200 text-slate-900 font-medium'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-bold flex items-center gap-1.5">
                        <span>{b.name}</span>
                        {b.isMain && (
                          <span className="text-[9px] font-bold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200">
                            {lang === 'ar' ? 'المركز الرئيسي' : 'HQ'}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
                        {bProds.length} {lang === 'ar' ? 'صنف بالمخزون' : 'Items in Stock'} | {bInvoices.length} {lang === 'ar' ? 'فواتير' : 'Invoices'}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="font-bold text-emerald-700 font-mono">{rev} {lang === 'ar' ? 'د.أ' : 'JOD'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Laboratory Pipeline Snapshot */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Glasses className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">
                  {lang === 'ar' ? 'حالة خط إنتاج المختبر' : 'Lab Pipeline Status'}
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab('laboratory')}
                className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                {lang === 'ar' ? 'إدارة' : 'Manage'} <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {labJobs.length === 0 ? (
              <p className="text-slate-400 text-xs">
                {lang === 'ar' ? 'لا توجد طلبات مختبر حالية.' : 'No active laboratory orders.'}
              </p>
            ) : (
              <div className="space-y-2">
                {labJobs.slice(0, 3).map((job) => (
                  <div key={job.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{job.customerName}</span>
                      <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                        {job.status}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px]">
                      {lang === 'ar' ? 'الإطار:' : 'Frame:'} <span className="font-semibold text-slate-800">{job.frameDescription}</span>
                    </p>
                    <p className="text-slate-500 text-[10px]">{lang === 'ar' ? 'العدسة:' : 'Lens:'} {job.lensType} ({job.coating})</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )}
</div>
);
};
