import React from 'react';
import {
  Receipt,
  Users,
  Package,
  Coins,
  ClipboardCheck,
  Smartphone,
  Home,
  UserCheck,
  Building2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import { ERPTab } from './Sidebar';
import { useLanguage } from '../lib/i18n';
import { UserAccount, Branch } from '../types';

interface POSTabletLauncherProps {
  activeTab: ERPTab;
  onSelectTab: (tab: ERPTab) => void;
  currentUser: UserAccount;
  activeBranch: Branch;
}

export const POSTabletLauncher: React.FC<POSTabletLauncherProps> = ({
  activeTab,
  onSelectTab,
  currentUser,
  activeBranch,
}) => {
  const { lang } = useLanguage();
  const isRtl = lang === 'ar';

  const posButtons = [
    {
      id: 'pos' as ERPTab,
      titleAr: '🛒 فواتير المبيعات ونقطة البيع',
      titleEn: '🛒 POS & Sales Invoices',
      subtitleAr: 'إصدار الفواتير الفورية، المقاسات والعدسات والتسليمات',
      subtitleEn: 'Issue instant invoices, lens prescriptions & balances',
      icon: Receipt,
      bgGradient: 'from-emerald-600 via-emerald-700 to-teal-800',
      borderColor: 'border-emerald-400',
      shadowColor: 'shadow-emerald-900/40',
      badgeAr: 'الأهم | المبيعات اليومية',
      badgeEn: 'Primary | Sales',
    },
    {
      id: 'customers' as ERPTab,
      titleAr: '👥 سجل العملاء وفحوصات النظر',
      titleEn: '👥 Customers & Eye Prescriptions',
      subtitleAr: 'البحث عن العملاء، إنشاء كشف جديد، وعرض فحوصات النظر',
      subtitleEn: 'Customer search, new files & optical test history',
      icon: Users,
      bgGradient: 'from-blue-600 via-indigo-700 to-blue-900',
      borderColor: 'border-blue-400',
      shadowColor: 'shadow-blue-900/40',
      badgeAr: 'فحوصات ودرجات النظر',
      badgeEn: 'Eye Tests & Files',
    },
    {
      id: 'products' as ERPTab,
      titleAr: '👓 قاعدة بيانات الإطارات والعدسات',
      titleEn: '👓 Frames & Lenses Inventory',
      subtitleAr: 'الاستعلام عن أسعار النظارات والعدسات المتوفرة بالفرع',
      subtitleEn: 'Check prices & stock availability in branch',
      icon: Package,
      bgGradient: 'from-purple-600 via-purple-700 to-indigo-900',
      borderColor: 'border-purple-400',
      shadowColor: 'shadow-purple-900/40',
      badgeAr: 'أسعار الماركات والمخزون',
      badgeEn: 'Prices & Stock',
    },
    {
      id: 'cash' as ERPTab,
      titleAr: '💰 إغلاق الصندوق وتسليم الدرج',
      titleEn: '💰 Daily Cash Register Closing',
      subtitleAr: 'مطابقة نقدية الصندوق في نهاية الدوام وتسليمها للمحاسب',
      subtitleEn: 'Shift register closing & accountant handover',
      icon: Coins,
      bgGradient: 'from-amber-600 via-amber-700 to-orange-800',
      borderColor: 'border-amber-400',
      shadowColor: 'shadow-amber-900/40',
      badgeAr: 'صندوق اليومية والكاش',
      badgeEn: 'Daily Cash Box',
    },
    {
      id: 'audit' as ERPTab,
      titleAr: '📋 جرد وتدقيق المخزون بالفرع',
      titleEn: '📋 Branch Inventory Barcode Audit',
      subtitleAr: 'مسح باركود النظارات والعدسات للتأكد من الكميات الفعلية',
      subtitleEn: 'Scan frame barcodes & check actual quantities',
      icon: ClipboardCheck,
      bgGradient: 'from-slate-700 via-slate-800 to-slate-900',
      borderColor: 'border-slate-500',
      shadowColor: 'shadow-slate-950/50',
      badgeAr: 'جرد بالباركود',
      badgeEn: 'Barcode Count',
    },
  ];

  // Full Screen Touch Hub View
  if (activeTab === 'launcher') {
    return (
      <div className="min-h-full bg-slate-950 text-white p-4 md:p-8 flex flex-col justify-between select-none">
        {/* Header Bar */}
        <div className="max-w-7xl mx-auto w-full">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-2xl backdrop-blur-md mb-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl shadow-lg shadow-emerald-600/30">
                  <Smartphone className="w-8 h-8 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl md:text-2xl font-black text-white tracking-wide">
                      {isRtl ? 'لوحة تحكم موظفي المبيعات والتابلت' : 'Sales Staff Touch Launcher'}
                    </h1>
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs px-3 py-1 rounded-full font-mono font-bold tracking-wider">
                      POS Touch Hub
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 mt-1 flex items-center gap-2">
                    <span>
                      {isRtl ? 'اختر القسم المطلوب بالنقر المباشر على الكبسة الكبيرة:' : 'Tap any big button to enter the module:'}
                    </span>
                  </p>
                </div>
              </div>

              {/* Employee & Branch Info */}
              <div className="flex items-center gap-3 bg-slate-800/90 border border-slate-700/80 px-4 py-3 rounded-2xl">
                <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400 font-medium">
                    {isRtl ? 'الموظف الحالي | الفرع' : 'Current Staff | Branch'}
                  </div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="text-emerald-400">{currentUser?.fullName || 'موظف المبيعات'}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-indigo-300 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5" />
                      {activeBranch?.name || 'فرع العمل'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Large Touch Grid Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {posButtons.map((btn) => {
              const Icon = btn.icon;
              return (
                <button
                  key={btn.id}
                  type="button"
                  onClick={() => onSelectTab(btn.id)}
                  className={`group relative text-right flex flex-col justify-between p-6 md:p-8 rounded-3xl border-2 bg-gradient-to-br ${
                    btn.bgGradient
                  } ${btn.borderColor} ${
                    btn.shadowColor
                  } shadow-2xl transition-all duration-300 cursor-pointer hover:scale-[1.02] active:scale-[0.98] active:ring-4 active:ring-white/50 min-h-[220px] md:min-h-[240px]`}
                >
                  {/* Top Badge & Icon */}
                  <div className="flex items-center justify-between w-full mb-4">
                    <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-md shadow-inner text-white group-hover:scale-110 transition-transform">
                      <Icon className="w-9 h-9 md:w-10 md:h-10" />
                    </div>
                    <span className="text-xs font-bold font-mono bg-black/40 text-white px-3 py-1.5 rounded-xl border border-white/20 backdrop-blur-xs">
                      {isRtl ? btn.badgeAr : btn.badgeEn}
                    </span>
                  </div>

                  {/* Title & Subtitle */}
                  <div className="space-y-2">
                    <h2 className="text-xl md:text-2xl font-black text-white leading-snug group-hover:underline decoration-2 underline-offset-4">
                      {isRtl ? btn.titleAr : btn.titleEn}
                    </h2>
                    <p className="text-xs md:text-sm text-white/90 font-medium leading-relaxed">
                      {isRtl ? btn.subtitleAr : btn.subtitleEn}
                    </p>
                  </div>

                  {/* Bottom Enter Call to Action */}
                  <div className="mt-6 pt-4 border-t border-white/20 flex items-center justify-between text-xs font-black text-white uppercase tracking-wider">
                    <span className="flex items-center gap-1.5 bg-black/30 px-3 py-1.5 rounded-xl border border-white/20">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      {isRtl ? 'اضغط هنا للدخول الفوري' : 'Tap to Enter'}
                    </span>
                    <div className="p-2 bg-white text-slate-900 rounded-xl group-hover:translate-x-[-4px] transition-transform">
                      {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Inside Module Banner Mode with "Back to Touch Launcher" Button
  return (
    <div className="bg-slate-900 text-white p-2.5 md:p-3 shadow-xl border-b border-slate-800 transition-all sticky top-0 z-30">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        {/* BIG HOME RETURN BUTTON */}
        <button
          type="button"
          onClick={() => onSelectTab('launcher')}
          className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-95 text-white text-xs md:text-sm font-black px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-900/40 border border-emerald-400 cursor-pointer transition"
        >
          <Home className="w-5 h-5 text-amber-300 animate-bounce" />
          <span>{isRtl ? '🏠 العودة للوحة الكبسات الرئيسية' : '🏠 Back to Touch Launcher'}</span>
        </button>

        {/* Quick Module Touch Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 max-w-full">
          {posButtons.map((btn) => {
            const Icon = btn.icon;
            const isActive = activeTab === btn.id;

            return (
              <button
                key={btn.id}
                type="button"
                onClick={() => onSelectTab(btn.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 border ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-400 ring-2 ring-blue-300 shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {isRtl ? btn.titleAr.split(' ')[0] + ' ' + (btn.titleAr.split(' ')[1] || '') : btn.titleEn.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
