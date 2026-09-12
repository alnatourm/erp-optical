import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Building2,
  DollarSign,
  Receipt,
  Glasses,
  Calendar,
  Filter,
  ArrowUpRight,
  ChevronDown,
  PieChart as PieChartIcon,
  CreditCard,
  ShoppingBag,
  Store,
  Sparkles,
  Award,
  Printer,
  FileText,
  X,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Branch, Product, Invoice } from '../types';
import { useLanguage } from '../lib/i18n';

interface BranchPerformanceModuleProps {
  branches: Branch[];
  activeBranch: Branch;
  products: Product[];
  invoices: Invoice[];
  onSelectBranch?: (branchId: string) => void;
  onNavigateTab?: (tab: any) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Frames': '#3b82f6', // blue-500
  'Sunglasses': '#f59e0b', // amber-500
  'Ophthalmic Lenses': '#10b981', // emerald-500
  'Contact Lenses': '#8b5cf6', // purple-500
  'Accessories': '#06b6d4', // cyan-500
  'Other / Services': '#64748b', // slate-500
};

export const BranchPerformanceModule: React.FC<BranchPerformanceModuleProps> = ({
  branches,
  activeBranch,
  products,
  invoices,
  onSelectBranch,
  onNavigateTab,
}) => {
  const { lang, t } = useLanguage();
  const [selectedBranchId, setSelectedBranchId] = useState<string>(activeBranch.id || 'all');
  const [dateRange, setDateRange] = useState<'1d' | '7d' | '14d' | '30d' | 'all'>('30d');
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);

  // Currently inspected branch or 'all'
  const currentBranch = branches.find((b) => b.id === selectedBranchId) || activeBranch;

  // 1. Filter invoices by branch and dateRange
  const filteredInvoices = useMemo(() => {
    let result = invoices;
    
    // Filter by branch
    if (selectedBranchId !== 'all') {
      result = result.filter((i) => i.branchId === selectedBranchId);
    }
    
    // Filter by date range
    if (dateRange !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();
      
      const days = dateRange === '1d' ? 1 : dateRange === '7d' ? 7 : dateRange === '14d' ? 14 : dateRange === '30d' ? 30 : 0;
      cutoffDate.setDate(now.getDate() - days);
      
      result = result.filter(inv => {
        const invDate = new Date(inv.invoiceDate);
        return invDate >= cutoffDate;
      });
    }
    
    return result;
  }, [invoices, selectedBranchId, dateRange]);

  // 2. Filter products by branch
  const filteredProducts = useMemo(() => {
    if (selectedBranchId === 'all') {
      return products;
    }
    return products.filter((p) => p.branchId === selectedBranchId);
  }, [products, selectedBranchId]);

  // Key KPI Calculations
  const totalRevenue = useMemo(
    () => filteredInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0),
    [filteredInvoices]
  );

  const totalPaid = useMemo(
    () => filteredInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0),
    [filteredInvoices]
  );

  const totalOutstanding = useMemo(
    () => filteredInvoices.reduce((sum, inv) => sum + inv.remainingBalance, 0),
    [filteredInvoices]
  );

  const totalInvoicesCount = filteredInvoices.length;
  const averageOrderValue = totalInvoicesCount > 0 ? Math.round(totalRevenue / totalInvoicesCount) : 0;

  const topSalesmen = useMemo(() => {
    const salesmenData = filteredInvoices.reduce((acc, inv) => {
      if (!acc[inv.salesEmployee]) acc[inv.salesEmployee] = 0;
      acc[inv.salesEmployee] += inv.grandTotal;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(salesmenData)
      .map(([name, total]) => ({ name, total: total as number }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 3);
  }, [filteredInvoices]);

  // 3. Daily Revenue Aggregation
  const dailyData = useMemo(() => {
    // Collect dates or generate last N days
    const now = new Date();
    const daysCount = dateRange === '1d' ? 1 : dateRange === '7d' ? 7 : dateRange === '14d' ? 14 : dateRange === '30d' ? 30 : 30;

    const dateMap: Record<string, { date: string; revenue: number; paid: number; balance: number; orders: number }> = {};

    // Initialize all dates in range with 0
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const isoDate = d.toISOString().split('T')[0];
      const displayLabel = `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;

      dateMap[isoDate] = {
        date: displayLabel,
        revenue: 0,
        paid: 0,
        balance: 0,
        orders: 0,
      };
    }

    // Populate with actual invoice values
    filteredInvoices.forEach((inv) => {
      const invDate = inv.invoiceDate ? inv.invoiceDate.split('T')[0] : '';
      if (dateMap[invDate]) {
        dateMap[invDate].revenue += inv.grandTotal;
        dateMap[invDate].paid += inv.paidAmount;
        dateMap[invDate].balance += inv.remainingBalance;
        dateMap[invDate].orders += 1;
      } else if (invDate) {
        // If invoice date is outside prebuilt range, add it dynamically
        const dObj = new Date(invDate);
        const displayLabel = !isNaN(dObj.getTime())
          ? `${dObj.getDate()} ${dObj.toLocaleString('default', { month: 'short' })}`
          : invDate;

        dateMap[invDate] = {
          date: displayLabel,
          revenue: inv.grandTotal,
          paid: inv.paidAmount,
          balance: inv.remainingBalance,
          orders: 1,
        };
      }
    });

    return Object.values(dateMap);
  }, [filteredInvoices, dateRange]);

  // 4. Category Breakdown Aggregation
  const categoryData = useMemo(() => {
    const categoryTotals: Record<string, { category: string; revenue: number; units: number }> = {
      'Frames': { category: 'Frames', revenue: 0, units: 0 },
      'Sunglasses': { category: 'Sunglasses', revenue: 0, units: 0 },
      'Ophthalmic Lenses': { category: 'Ophthalmic Lenses', revenue: 0, units: 0 },
      'Contact Lenses': { category: 'Contact Lenses', revenue: 0, units: 0 },
      'Accessories': { category: 'Accessories', revenue: 0, units: 0 },
    };

    filteredInvoices.forEach((inv) => {
      inv.items.forEach((item) => {
        let cat = 'Frames';
        if (item.itemType === 'frame') {
          cat = item.description.toLowerCase().includes('sunglasses') ? 'Sunglasses' : 'Frames';
        } else if (item.itemType === 'lens') {
          cat = 'Ophthalmic Lenses';
        } else if (item.itemType === 'contact_lens') {
          cat = 'Contact Lenses';
        } else if (item.itemType === 'accessory') {
          cat = 'Accessories';
        }

        if (!categoryTotals[cat]) {
          categoryTotals[cat] = { category: cat, revenue: 0, units: 0 };
        }

        categoryTotals[cat].revenue += item.total || item.price * item.quantity;
        categoryTotals[cat].units += item.quantity || 1;
      });
    });

    const result = Object.values(categoryTotals).filter((c) => c.revenue > 0 || c.units > 0);
    // Sort by revenue descending
    result.sort((a, b) => b.revenue - a.revenue);
    return result;
  }, [filteredInvoices]);

  const topCategory = categoryData[0] || { category: 'None', revenue: 0, units: 0 };

  // 5. Payment Method Breakdown
  const paymentMethodData = useMemo(() => {
    const pmMap: Record<string, number> = {
      'Cash': 0,
      'Visa': 0,
      'Cliq': 0,
      'Credit Card': 0,
      'Insurance': 0,
      'Bank Transfer': 0,
    };

    filteredInvoices.forEach((inv) => {
      const pm = inv.paymentMethod || 'Cash';
      pmMap[pm] = (pmMap[pm] || 0) + inv.grandTotal;
    });

    return Object.entries(pmMap)
      .map(([name, value]) => ({ name, value }))
      .filter((item) => item.value > 0);
  }, [filteredInvoices]);

  // 6. Top Selling Products in Branch
  const topProducts = useMemo(() => {
    const prodMap: Record<string, { barcode: string; name: string; brand: string; category: string; units: number; revenue: number }> = {};

    filteredInvoices.forEach((inv) => {
      inv.items.forEach((item) => {
        const key = item.barcode || item.description;
        if (!prodMap[key]) {
          prodMap[key] = {
            barcode: item.barcode || 'N/A',
            name: item.description,
            brand: item.description.split(' ')[0] || 'Optical',
            category: item.itemType.toUpperCase(),
            units: 0,
            revenue: 0,
          };
        }
        prodMap[key].units += item.quantity || 1;
        prodMap[key].revenue += item.total || item.price * item.quantity;
      });
    });

    return Object.values(prodMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredInvoices]);

  return (
    <div id="branch-performance-module" className="p-6 space-y-6 max-w-7xl mx-auto text-slate-900">
      {/* Top Header & Branch Switcher Bar */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm text-white space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500 text-slate-950 uppercase tracking-wider flex items-center gap-1">
                <BarChart3 className="w-3 h-3" />
                {lang === 'ar' ? 'محرك تحليل الفروع والرسوم البيانية' : 'Branch Analytics Engine'}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {lang === 'ar' ? 'مؤشرات الإيرادات المباشرة وتنوع المبيعات' : 'Real-time Revenue & Product Mix'}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>
                {selectedBranchId === 'all'
                  ? lang === 'ar'
                    ? 'ملخص أداء كافة الفروع والمراكز'
                    : 'All Optical Branches Overview'
                  : currentBranch.name}
              </span>
              {currentBranch.isMain && selectedBranchId !== 'all' && (
                <span className="text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full">
                  {lang === 'ar' ? 'المقر الرئيسي' : 'Central HQ'}
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              {selectedBranchId === 'all'
                ? lang === 'ar'
                  ? `البيانات المجمعة لـ ${branches.length} فروع ومراكز في الأردن`
                  : `Consolidated data across ${branches.length} branches in Jordan`
                : lang === 'ar'
                ? `مدير الفرع: ${currentBranch.manager || 'مدير المعرض'} | العنوان: ${currentBranch.address} | الهاتف: ${currentBranch.phone}`
                : `Manager: ${currentBranch.manager || 'Store Manager'} | Address: ${currentBranch.address} | Phone: ${currentBranch.phone}`}
            </p>
          </div>

          {/* Controls: Branch Filter & Date Range */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Branch Selector Dropdown */}
            <div className="flex items-center gap-2 bg-slate-800 p-1.5 rounded-xl border border-slate-700">
              <Building2 className="w-4 h-4 text-emerald-400 ltr:ml-2 rtl:mr-2 shrink-0" />
              <select
                value={selectedBranchId}
                onChange={(e) => {
                  setSelectedBranchId(e.target.value);
                  if (onSelectBranch && e.target.value !== 'all') {
                    onSelectBranch(e.target.value);
                  }
                }}
                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer ltr:pr-3 rtl:pl-3"
              >
                <option value="all" className="bg-slate-900 text-white">
                  🏢 {lang === 'ar' ? `جميع الفروع مجمعة (${branches.length})` : `All Branches Combined (${branches.length})`}
                </option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id} className="bg-slate-900 text-white">
                    📍 {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Selector */}
            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
              {[
                { id: '1d', label: lang === 'ar' ? 'اليوم' : 'Today' },
                { id: '7d', label: lang === 'ar' ? '7 أيام' : '7 Days' },
                { id: '14d', label: lang === 'ar' ? '14 يوم' : '14 Days' },
                { id: '30d', label: lang === 'ar' ? '30 يوم' : '30 Days' },
                { id: 'all', label: lang === 'ar' ? 'كل الأوقات' : 'All Time' },
              ].map((r) => (
                <button
                  key={r.id}
                  onClick={() => setDateRange(r.id as any)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    dateRange === r.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {/* Print Report Button */}
            <button
              onClick={() => setShowPrintModal(true)}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs transition cursor-pointer shadow-xs border border-emerald-400"
              title={lang === 'ar' ? 'طباعة تقرير التحليلات PDF' : 'Generate printable PDF analytics report'}
            >
              <Printer className="w-4 h-4" />
              <span>{lang === 'ar' ? 'طباعة تقرير PDF' : 'Print PDF Report'}</span>
            </button>
          </div>
        </div>

        {/* Quick Branch Switcher Pills */}
        <div className="pt-3 border-t border-slate-800 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 ltr:mr-1 rtl:ml-1">
            {lang === 'ar' ? 'الفرع الحالي النشط:' : 'Switch Outlet:'}
          </span>
          <button
            onClick={() => {
              setSelectedBranchId('all');
            }}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer shrink-0 border ${
              selectedBranchId === 'all'
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-extrabold shadow-sm'
                : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            {lang === 'ar' ? 'جميع الفروع' : 'All Outlets'}
          </button>
          {branches.map((b) => (
            <button
              key={b.id}
              onClick={() => {
                setSelectedBranchId(b.id);
                if (onSelectBranch) onSelectBranch(b.id);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer shrink-0 border flex items-center gap-1.5 ${
                selectedBranchId === b.id
                  ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                  : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Store className="w-3.5 h-3.5 opacity-70" />
              <span>{b.name.replace(' Branch', '').replace('فرع ', '')}</span>
              {b.isMain && <span className="text-[9px] bg-purple-400/20 text-purple-300 px-1 rounded">HQ</span>}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Revenue */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              {lang === 'ar' ? 'إجمالي إيرادات المبيعات' : 'Gross Branch Revenue'}
            </span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
              {totalRevenue.toLocaleString()} <span className="text-sm text-slate-500 font-normal">د.أ</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                {lang === 'ar' ? (
                  <>من عدد <strong className="text-slate-800">{totalInvoicesCount}</strong> فاتورة مبيعات</>
                ) : (
                  <>From <strong className="text-slate-800">{totalInvoicesCount}</strong> sales invoices</>
                )}
              </span>
            </p>
          </div>
        </div>

        {/* Collected vs Due */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              {lang === 'ar' ? 'المبالغ المحصلة مقابل المتبقية' : 'Cash Collected vs Due'}
            </span>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
              {totalPaid.toLocaleString()} <span className="text-sm text-slate-500 font-normal">د.أ</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {lang === 'ar' ? 'الذمم المتبقية: ' : 'Due Balance: '}
              <span className="text-amber-600 font-bold font-mono">{totalOutstanding.toLocaleString()} د.أ</span>
            </p>
          </div>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              {lang === 'ar' ? 'متوسط قيمة الفاتورة' : 'Average Order Value'}
            </span>
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
              {averageOrderValue.toLocaleString()} <span className="text-sm text-slate-500 font-normal">{lang === 'ar' ? 'د.أ / فاتورة' : 'JOD / Order'}</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {lang === 'ar' ? 'عدد الأصناف بالفرع: ' : 'Inventory in branch: '}
              <span className="text-slate-800 font-bold">{filteredProducts.length} {lang === 'ar' ? 'صنف' : 'items'}</span>
            </p>
          </div>
        </div>

        {/* Top Product Category */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              {lang === 'ar' ? 'الفئة الأكثر مبيعاً' : 'Top Selling Category'}
            </span>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 truncate">
              {topCategory.category === 'None'
                ? lang === 'ar'
                  ? 'لا يوجد'
                  : 'None'
                : topCategory.category === 'Frames'
                ? lang === 'ar'
                  ? 'النظارات والإطارات الطبية'
                  : 'Frames'
                : topCategory.category === 'Sunglasses'
                ? lang === 'ar'
                  ? 'النظارات الشمسية'
                  : 'Sunglasses'
                : topCategory.category === 'Ophthalmic Lenses'
                ? lang === 'ar'
                  ? 'العدسات الطبية'
                  : 'Ophthalmic Lenses'
                : topCategory.category === 'Contact Lenses'
                ? lang === 'ar'
                  ? 'العدسات اللاصقة'
                  : 'Contact Lenses'
                : topCategory.category}
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {lang === 'ar' ? 'المبيعات: ' : 'Sales: '}
              <span className="text-emerald-600 font-bold font-mono">{topCategory.revenue.toLocaleString()} د.أ</span> ({topCategory.units} {lang === 'ar' ? 'قطعة' : 'units'})
            </p>
          </div>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Daily Revenue Trend Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                {lang === 'ar' ? 'أداء الفروع والرسوم البيانية (د.أ)' : 'Daily Branch Revenue & Collections (JOD)'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {lang === 'ar'
                  ? `الجدول الزمني المباشر لمبيعات ${selectedBranchId === 'all' ? 'جميع الفروع' : currentBranch.name}`
                  : `Day-by-day sales revenue timeline for ${selectedBranchId === 'all' ? 'All Outlets' : currentBranch.name}`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                <button
                  onClick={() => setChartType('area')}
                  className={`text-xs font-bold px-2.5 py-1 rounded transition cursor-pointer ${
                    chartType === 'area'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {lang === 'ar' ? 'رسم مساحي' : 'Area Chart'}
                </button>
                <button
                  onClick={() => setChartType('bar')}
                  className={`text-xs font-bold px-2.5 py-1 rounded transition cursor-pointer ${
                    chartType === 'bar'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {lang === 'ar' ? 'رسم أعمدة' : 'Bar Chart'}
                </button>
              </div>
            </div>
          </div>

          {/* Recharts Area / Bar Chart */}
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'area' ? (
                <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="paidGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                    unit=" JOD"
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-xl border border-slate-800 shadow-xl text-xs space-y-1 font-medium">
                            <p className="font-bold text-slate-300 border-b border-slate-800 pb-1">{label}</p>
                            <p className="text-emerald-400 font-bold">
                              Gross Revenue: {payload[0]?.value?.toLocaleString()} JOD
                            </p>
                            <p className="text-blue-400">
                              Collected Cash/Card: {payload[1]?.value?.toLocaleString()} JOD
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Gross Revenue (JOD)"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#revenueGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="paid"
                    name="Collected Cash/Card (JOD)"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#paidGrad)"
                  />
                </AreaChart>
              ) : (
                <BarChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                    unit=" JOD"
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-xl border border-slate-800 shadow-xl text-xs space-y-1 font-medium">
                            <p className="font-bold text-slate-300 border-b border-slate-800 pb-1">{label}</p>
                            <p className="text-emerald-400 font-bold">
                              Gross Revenue: {payload[0]?.value?.toLocaleString()} JOD
                            </p>
                            <p className="text-blue-400">
                              Collected Cash/Card: {payload[1]?.value?.toLocaleString()} JOD
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="revenue" name="Gross Revenue (JOD)" fill="#10b981" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="paid" name="Collected Cash/Card (JOD)" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right 1 Col: Top Selling Categories Donut Chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-purple-600" />
              Top Selling Product Categories
            </h3>
            <p className="text-xs text-slate-500 font-medium">Revenue share by category in this branch</p>
          </div>

          {categoryData.length === 0 ? (
            <div className="h-60 flex items-center justify-center text-xs text-slate-400">
              No product sales data for selected branch.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="revenue"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {categoryData.map((entry) => (
                        <Cell
                          key={entry.category}
                          fill={CATEGORY_COLORS[entry.category] || CATEGORY_COLORS['Other / Services']}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          const percent = totalRevenue > 0 ? ((data.revenue / totalRevenue) * 100).toFixed(1) : 0;
                          return (
                            <div className="bg-slate-900 text-white p-2.5 rounded-lg text-xs space-y-0.5 shadow-xl font-medium">
                              <p className="font-bold text-slate-200">{data.category}</p>
                              <p className="text-emerald-400 font-bold">{data.revenue.toLocaleString()} JOD ({percent}%)</p>
                              <p className="text-slate-400">{data.units} units sold</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Category Breakdown Cards List */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                {categoryData.map((cat) => {
                  const percent = totalRevenue > 0 ? ((cat.revenue / totalRevenue) * 100).toFixed(1) : 0;
                  const color = CATEGORY_COLORS[cat.category] || CATEGORY_COLORS['Other / Services'];

                  return (
                    <div key={cat.category} className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-slate-50">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }}></span>
                        <span className="font-semibold text-slate-800">{cat.category}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-slate-900">{cat.revenue.toLocaleString()} JOD</span>
                        <span className="text-[10px] text-slate-500 font-semibold ml-1.5 bg-slate-100 px-1.5 py-0.5 rounded">
                          {percent}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Grid: Top Selling Products Table & Payment Method Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Top Selling Products Table */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Glasses className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="font-bold text-base text-slate-900">Top-Selling Optical Products in Branch</h3>
                <p className="text-xs text-slate-500 font-medium">Best performing frames, lenses, and contacts</p>
              </div>
            </div>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('products')}
                className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                View Full Inventory <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {topProducts.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No item sales recorded for this branch yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-700">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Product / Model</th>
                    <th className="py-2.5 px-3">Barcode</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-center">Units Sold</th>
                    <th className="py-2.5 px-3 text-right">Total Sales</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topProducts.map((p, idx) => (
                    <tr key={p.barcode + idx} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3 font-bold text-slate-900">
                        {p.name}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-600 font-bold">
                        #{p.barcode}
                      </td>
                      <td className="py-3 px-3">
                        <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded">
                          {p.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-900 font-mono">
                        {p.units}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-600 font-mono">
                        {p.revenue.toLocaleString()} JOD
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right 1 Col: Payment Methods Breakdown */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-600" />
              Payment Method Mix
            </h3>
            <p className="text-xs text-slate-500 font-medium">Cash vs Card vs Insurance breakdown</p>
          </div>

          {paymentMethodData.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No payment transactions recorded.</p>
          ) : (
            <div className="space-y-3">
              {paymentMethodData.map((pm) => {
                const percent = totalRevenue > 0 ? Math.round((pm.value / totalRevenue) * 100) : 0;
                return (
                  <div key={pm.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="font-bold text-slate-800 flex items-center gap-2">
                        {pm.name === 'Cash' && '💵 Cash'}
                        {pm.name === 'Visa' && '💳 Visa'}
                        {pm.name === 'Cliq' && '📱 Cliq'}
                        {pm.name === 'Credit Card' && '💳 Credit Card'}
                        {pm.name === 'Insurance' && '🛡️ Medical Insurance'}
                        {pm.name === 'Bank Transfer' && '🏦 Bank Transfer'}
                        {pm.name === 'Split' && '✂️ Split Payment'}
                      </span>
                      <span className="font-mono font-bold text-slate-900">
                        {pm.value.toLocaleString()} JOD ({percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Salesman Performance Row */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              {lang === 'ar' ? 'أفضل الموظفين مبيعاً' : 'Top Performing Staff'}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              {lang === 'ar' ? 'أفضل 3 موظفين مبيعات' : 'Top 3 salesmen by revenue'}
            </p>
          </div>
          {topSalesmen.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              {lang === 'ar' ? 'لا يوجد بيانات مبيعات بعد.' : 'No sales data yet.'}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topSalesmen.map((salesman, idx) => (
                <div key={salesman.name} className="flex flex-col p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition cursor-default">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      idx === 0 ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                      idx === 1 ? 'bg-slate-200 text-slate-700 border border-slate-300' :
                      'bg-orange-100 text-orange-800 border border-orange-200'
                    }`}>
                      #{idx + 1}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {lang === 'ar' ? 'المبيعات' : 'Sales'}
                    </span>
                  </div>
                  <div className="font-bold text-slate-900 text-lg mb-1">{salesman.name}</div>
                  <div className="text-emerald-600 font-mono font-bold text-xl">{salesman.total.toLocaleString()} <span className="text-sm">{lang === 'ar' ? 'د.أ' : 'JOD'}</span></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Print Preview & PDF Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full my-8 text-slate-900 overflow-hidden flex flex-col">
            {/* Modal Header (Non-printable controls) */}
            <div className="bg-slate-900 text-white p-4 px-6 flex items-center justify-between no-print border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-sm">Executive Branch Performance Report — Print / PDF Preview</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  Print / Save as PDF
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Report Document Sheet */}
            <div className="p-8 space-y-6 print-container bg-white" id="printable-branch-report">
              {/* Header Logo & Title */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">OptiVision Optical Group</h1>
                  <p className="text-xs font-semibold text-slate-600">Central Analytics & Branch Performance Report</p>
                  <p className="text-[11px] text-slate-500 mt-1">Amman, Jordan • OptiVision Enterprise ERP</p>
                </div>
                <div className="text-right space-y-1">
                  <span className="px-3 py-1 bg-slate-100 text-slate-800 font-mono font-bold text-xs rounded border border-slate-300">
                    BRANCH ANALYTICS
                  </span>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Report Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* Branch & Filter Info Bar */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 font-bold block uppercase text-[10px]">Selected Branch</span>
                  <span className="font-bold text-slate-900 text-sm">{selectedBranchId === 'all' ? 'All Optical Outlets' : currentBranch.name}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block uppercase text-[10px]">Manager / Contact</span>
                  <span className="font-semibold text-slate-800">{selectedBranchId === 'all' ? 'Group Operations' : currentBranch.manager}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block uppercase text-[10px]">Time Period</span>
                  <span className="font-semibold text-slate-800 uppercase">{dateRange === 'all' ? 'All Historic Data' : `Last ${dateRange}`}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block uppercase text-[10px]">Total Invoices</span>
                  <span className="font-bold font-mono text-slate-900 text-sm">{totalInvoicesCount} Orders</span>
                </div>
              </div>

              {/* KPI Summary Matrix */}
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">
                  Financial Highlights (JOD)
                </h3>
                <div className="grid grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg">
                    <span className="text-[10px] text-emerald-800 font-bold block uppercase">Gross Revenue</span>
                    <span className="text-lg font-bold font-mono text-emerald-900">{totalRevenue.toLocaleString()} JOD</span>
                  </div>
                  <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg">
                    <span className="text-[10px] text-blue-800 font-bold block uppercase">Cash / Card Collected</span>
                    <span className="text-lg font-bold font-mono text-blue-900">{totalPaid.toLocaleString()} JOD</span>
                  </div>
                  <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg">
                    <span className="text-[10px] text-amber-800 font-bold block uppercase">Due / Outstanding</span>
                    <span className="text-lg font-bold font-mono text-amber-900">{totalOutstanding.toLocaleString()} JOD</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-[10px] text-slate-600 font-bold block uppercase">Average Order Value</span>
                    <span className="text-lg font-bold font-mono text-slate-900">{averageOrderValue.toLocaleString()} JOD</span>
                  </div>
                </div>
              </div>

              {/* Category Breakdown Table */}
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">
                  Product Category Revenue Share
                </h3>
                <table className="w-full text-xs text-left border border-slate-200 rounded-lg overflow-hidden">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5 px-3">Category</th>
                      <th className="p-2.5 px-3 text-center">Units Sold</th>
                      <th className="p-2.5 px-3 text-right">Revenue (JOD)</th>
                      <th className="p-2.5 px-3 text-right">% Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {categoryData.map((cat) => {
                      const pct = totalRevenue > 0 ? ((cat.revenue / totalRevenue) * 100).toFixed(1) : '0';
                      return (
                        <tr key={cat.category}>
                          <td className="p-2 px-3 font-bold text-slate-900">{cat.category}</td>
                          <td className="p-2 px-3 text-center font-mono font-semibold">{cat.units}</td>
                          <td className="p-2 px-3 text-right font-mono font-bold text-emerald-700">{cat.revenue.toLocaleString()} JOD</td>
                          <td className="p-2 px-3 text-right font-mono font-semibold text-slate-700">{pct}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Top Selling Products in Branch */}
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">
                  Top-Selling Optical Products
                </h3>
                <table className="w-full text-xs text-left border border-slate-200 rounded-lg overflow-hidden">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5 px-3">Product Name</th>
                      <th className="p-2.5 px-3">Barcode</th>
                      <th className="p-2.5 px-3 text-center">Units Sold</th>
                      <th className="p-2.5 px-3 text-right">Total Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {topProducts.map((prod, idx) => (
                      <tr key={idx}>
                        <td className="p-2 px-3 font-bold text-slate-900">{prod.name}</td>
                        <td className="p-2 px-3 font-mono text-slate-600">#{prod.barcode}</td>
                        <td className="p-2 px-3 text-center font-mono font-bold">{prod.units}</td>
                        <td className="p-2 px-3 text-right font-mono font-bold text-slate-900">{prod.revenue.toLocaleString()} JOD</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Signatures & Footer */}
              <div className="pt-8 border-t border-slate-300 grid grid-cols-2 gap-8 text-[11px] text-slate-600">
                <div>
                  <p className="font-bold text-slate-900 uppercase text-[10px]">Prepared By</p>
                  <p className="mt-6 border-t border-slate-400 pt-1 w-48 font-medium">OptiVision Analytics Engine</p>
                </div>
                <div>
                  <p className="font-bold text-slate-900 uppercase text-[10px]">Branch Manager Signature</p>
                  <p className="mt-6 border-t border-slate-400 pt-1 w-48 font-medium">Approved & Verified</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
