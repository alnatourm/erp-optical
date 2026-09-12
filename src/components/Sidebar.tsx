import React from 'react';
import {
  LayoutDashboard,
  BarChart3,
  FileSpreadsheet,
  Package,
  Receipt,
  Users,
  FlaskConical,
  PhoneCall,
  Coins,
  Truck,
  Server,
  ChevronRight,
  ShieldCheck,
  ClipboardCheck,
  ArrowRightLeft,
  FileText,
} from 'lucide-react';
import { UserAccount } from '../types';
import { useLanguage } from '../lib/i18n';

export type ERPTab =
  | 'launcher'
  | 'dashboard'
  | 'branch_performance'
  | 'import'
  | 'products'
  | 'audit'
  | 'transfers'
  | 'pos'
  | 'customers'
  | 'laboratory'
  | 'call_center'
  | 'cash'
  | 'suppliers'
  | 'reports'
  | 'users';

interface SidebarProps {
  activeTab: ERPTab;
  onSelectTab: (tab: ERPTab) => void;
  pendingCallsCount: number;
  labJobsCount: number;
  currentUser: UserAccount;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  pendingCallsCount,
  labJobsCount,
  currentUser,
}) => {
  const { lang, t } = useLanguage();
  const [isCollapsed, setIsCollapsed] = React.useState<boolean>(() => currentUser?.role === 'sales_person');

  const allowedTabsByRole: Record<string, ERPTab[]> = {
    admin: ['launcher', 'dashboard', 'branch_performance', 'import', 'products', 'audit', 'transfers', 'pos', 'customers', 'laboratory', 'call_center', 'cash', 'suppliers', 'reports', 'users'],
    accountant: ['launcher', 'dashboard', 'import', 'products', 'audit', 'transfers', 'pos', 'cash', 'suppliers', 'reports'],
    sales_person: ['launcher', 'pos', 'customers', 'products', 'cash', 'audit'],
    call_center: ['launcher', 'call_center', 'customers'],
    lab_tech: ['launcher', 'laboratory', 'customers'],
  };

  const allowedTabs = allowedTabsByRole[currentUser?.role] || allowedTabsByRole.admin;

  const categoryNames: Record<string, { en: string; ar: string }> = {
    Overview: { en: 'Overview', ar: 'ملخص عام' },
    Inventory: { en: 'Inventory', ar: 'المخزون والمنتجات' },
    Sales: { en: 'Sales', ar: 'المبيعات والعملاء' },
    Operations: { en: 'Operations', ar: 'المختبر والمتابعة' },
    Finance: { en: 'Finance', ar: 'المالية والموردين' },
    Settings: { en: 'Settings', ar: 'الإعدادات والصلاحيات' },
  };

  const allMenuItems = [
    {
      id: 'dashboard' as ERPTab,
      label: t('dashboard'),
      icon: LayoutDashboard,
      badge: null,
      category: 'Overview',
    },
    {
      id: 'branch_performance' as ERPTab,
      label: lang === 'ar' ? 'أداء الفروع والرسوم' : 'Branch Performance',
      icon: BarChart3,
      badge: lang === 'ar' ? 'رسوم' : 'Charts',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
      category: 'Overview',
    },
    {
      id: 'import' as ERPTab,
      label: t('import'),
      icon: FileSpreadsheet,
      badge: lang === 'ar' ? 'محاسب' : 'Accountant',
      category: 'Inventory',
    },
    {
      id: 'products' as ERPTab,
      label: t('products'),
      icon: Package,
      badge: null,
      category: 'Inventory',
    },
    {
      id: 'audit' as ERPTab,
      label: lang === 'ar' ? 'جرد المخزون' : 'Stock Check',
      icon: ClipboardCheck,
      badge: lang === 'ar' ? 'تدقيق' : 'Audit',
      category: 'Inventory',
    },
    {
      id: 'transfers' as ERPTab,
      label: lang === 'ar' ? 'نقل المخزون' : 'Transfers',
      icon: ArrowRightLeft,
      badge: lang === 'ar' ? 'محاسب' : 'Accountant',
      category: 'Inventory',
    },
    {
      id: 'pos' as ERPTab,
      label: t('pos'),
      icon: Receipt,
      badge: 'POS',
      category: 'Sales',
    },
    {
      id: 'customers' as ERPTab,
      label: t('customers'),
      icon: Users,
      badge: null,
      category: 'Sales',
    },
    {
      id: 'laboratory' as ERPTab,
      label: t('laboratory'),
      icon: FlaskConical,
      badge: labJobsCount > 0 ? `${labJobsCount}` : null,
      badgeColor: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
      category: 'Operations',
    },
    {
      id: 'call_center' as ERPTab,
      label: t('call_center'),
      icon: PhoneCall,
      badge: pendingCallsCount > 0 ? `${pendingCallsCount}` : null,
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
      category: 'Operations',
    },
    {
      id: 'cash' as ERPTab,
      label: t('cash'),
      icon: Coins,
      badge: null,
      category: 'Finance',
    },
    {
      id: 'suppliers' as ERPTab,
      label: t('suppliers'),
      icon: Truck,
      badge: null,
      category: 'Finance',
    },
    {
      id: 'reports' as ERPTab,
      label: lang === 'ar' ? 'التقارير' : 'Reports',
      icon: FileText,
      badge: lang === 'ar' ? 'محاسب' : 'Accountant',
      category: 'Finance',
    },
    {
      id: 'users' as ERPTab,
      label: t('users'),
      icon: ShieldCheck,
      badge: lang === 'ar' ? 'مسؤول' : 'Admin',
      badgeColor: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
      category: 'Settings',
    },
  ];

  const menuItems = allMenuItems.filter((item) => allowedTabs.includes(item.id));

  return (
    <aside
      id="opti-sidebar"
      className={`${
        isCollapsed ? 'w-16' : 'w-60'
      } bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 min-h-[calc(100vh-4rem)] transition-all duration-300 relative group`}
    >
      {/* Collapse / Expand Toggle Header */}
      <div className="p-2 border-b border-slate-800 flex justify-between items-center text-slate-400">
        {!isCollapsed && (
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
            {lang === 'ar' ? 'القائمة الرئيسية' : 'Main Menu'}
          </span>
        )}
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer mx-auto"
          title={isCollapsed ? (lang === 'ar' ? 'توسيع القائمة' : 'Expand Sidebar') : (lang === 'ar' ? 'طي القائمة لزيادة مساحة العرض' : 'Collapse Sidebar')}
        >
          <ChevronRight
            className={`w-4 h-4 transition-transform ${
              isCollapsed ? (lang === 'ar' ? 'rotate-180' : '') : (lang === 'ar' ? '' : 'rotate-180')
            }`}
          />
        </button>
      </div>

      <div className="p-2.5 flex-1 space-y-4 overflow-y-auto">
        {['Overview', 'Inventory', 'Sales', 'Operations', 'Finance', 'Settings'].map((category) => {
          const items = menuItems.filter((i) => i.category === category);
          if (items.length === 0) return null;

          return (
            <div key={category} className="space-y-1">
              {!isCollapsed && (
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-2 mb-1.5">
                  {categoryNames[category]?.[lang] || category}
                </h3>
              )}
              {items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    title={isCollapsed ? item.label : undefined}
                    className={`w-full flex items-center ${
                      isCollapsed ? 'justify-center p-3' : 'justify-between px-3 py-2.5'
                    } rounded-xl text-xs font-medium transition cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white font-bold shadow-md ring-1 ring-blue-400'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </div>

                    {!isCollapsed && (
                      <div className="flex items-center gap-1.5">
                        {item.badge && (
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              item.badgeColor || (isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400')
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* System Status Footer */}
      <div className="p-4 bg-slate-950 border-t border-slate-800 text-xs text-slate-400 space-y-2">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-slate-300 font-medium text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            {lang === 'ar' ? 'المزامنة نشطة' : 'Sync Active'}
          </span>
          <span className="font-mono text-[10px] text-slate-500">v3.8.2</span>
        </div>
        <p className="text-[10px] text-slate-500 leading-tight">
          {lang === 'ar' ? 'نظام إدارة مراكز النظارات والمزيّة' : 'OptiVision Multi-Branch Cloud ERP System'}
        </p>
      </div>
    </aside>
  );
};

