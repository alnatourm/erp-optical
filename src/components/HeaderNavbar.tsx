import React, { useState } from 'react';
import {
  Building2,
  Search,
  Glasses,
  Download,
  ShieldCheck,
  ChevronDown,
  LogIn,
  CheckCircle2,
  Trash2,
  UserCheck,
  Lock,
  LogOut,
  AlertOctagon,
  Globe,
  Loader2,
} from 'lucide-react';
import { Branch, UserAccount } from '../types';
import { useLanguage } from '../lib/i18n';

interface HeaderNavbarProps {
  branches: Branch[];
  activeBranch: Branch;
  onSelectBranch: (branchId: string) => void;
  pendingCallsCount: number;
  labJobsCount: number;
  lowStockCount: number;
  users: UserAccount[];
  currentUser: UserAccount;
  onSwitchUser: (userId: string) => void;
  onOpenSearch: () => void;
  onOpenUsers?: () => void;
  onPurgeDatabase: () => void;
  isFirestoreConnected?: boolean;
}

export const HeaderNavbar: React.FC<HeaderNavbarProps> = ({
  branches,
  activeBranch,
  onSelectBranch,
  pendingCallsCount,
  labJobsCount,
  lowStockCount,
  users,
  currentUser,
  onSwitchUser,
  onOpenSearch,
  onOpenUsers,
  onPurgeDatabase,
  isFirestoreConnected,
}) => {
  const { lang, toggleLanguage, t } = useLanguage();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isPurgeConfirmOpen, setIsPurgeConfirmOpen] = useState(false);
  const [isPurging, setIsPurging] = useState(false);


  // Login form state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginBranchId, setLoginBranchId] = useState<string>(activeBranch?.id || 'b-main');
  const [loginError, setLoginError] = useState('');

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'accountant':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'sales_person':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'call_center':
        return 'bg-cyan-100 text-cyan-800 border-cyan-300';
      case 'lab_tech':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const getRoleLabel = (role: string) => {
    if (lang === 'ar') {
      switch (role) {
        case 'admin':
          return 'مدير النظام العام';
        case 'accountant':
          return 'محاسب مالي';
        case 'sales_person':
          return 'بائع / أخصائي نظارات';
        case 'call_center':
          return 'مركز الاتصالات';
        case 'lab_tech':
          return 'فني المختبر والتجهيز';
        default:
          return role;
      }
    }
    switch (role) {
      case 'admin':
        return 'ADMIN';
      case 'accountant':
        return 'ACCOUNTANT';
      case 'sales_person':
        return 'SHOP SALES / OPTICIAN';
      case 'call_center':
        return 'CALL CENTER AGENT';
      case 'lab_tech':
        return 'LAB TECH';
      default:
        return role.toUpperCase();
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const found = users.find(
      (u) => u.username.toLowerCase() === loginUsername.trim().toLowerCase()
    );

    if (!found) {
      setLoginError('Username not found. Please check username or contact admin.');
      return;
    }

    if (!found.isActive) {
      setLoginError('Account is disabled. Please contact system admin.');
      return;
    }

    // Set the selected working branch for today's session
    onSelectBranch(loginBranchId);
    onSwitchUser(found.id);
    setIsLoginModalOpen(false);
    setLoginUsername('');
    setLoginPassword('');
  };

  const handleExecutePurge = async () => {
    setIsPurging(true);
    try {
      await onPurgeDatabase();
    } catch (err) {
      console.error('Error purging database:', err);
    } finally {
      setIsPurging(false);
      setIsPurgeConfirmOpen(false);
      setIsProfileMenuOpen(false);
    }
  };

  return (
    <header id="opti-header" className="bg-white border-b border-slate-200 text-slate-900 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left Branding */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <Glasses className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base tracking-tight text-slate-900">
                {t('optiVision')}
              </h1>
              <span className="text-[10px] font-bold tracking-wider uppercase bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                ERP
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                  isFirestoreConnected
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
                title={
                  isFirestoreConnected
                    ? 'Cloud Firestore Database is connected & live-syncing'
                    : 'Connecting to Cloud Firestore...'
                }
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isFirestoreConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                  }`}
                />
                {isFirestoreConnected
                  ? lang === 'ar'
                    ? 'قاعدة بيانات سحابية مباشرة'
                    : 'Cloud DB Live'
                  : lang === 'ar'
                  ? 'جاري الاتصال بالسحابة'
                  : 'Cloud Connecting...'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">{t('multiBranch')}</p>
          </div>
        </div>

        {/* Center Active Branch Switcher & Quick Search */}
        <div className="flex items-center gap-3 flex-1 max-w-xl justify-center">
          {/* Branch Switcher */}
          {currentUser?.role === 'sales_person' ? (
            <div
              className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5"
              title={lang === 'ar' ? 'فرع العمل المعتمد لنوبة اليوم' : 'Assigned Working Branch for Today'}
            >
              <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="flex flex-col text-start">
                <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider leading-none">
                  {lang === 'ar' ? 'فرع العمل اليوم' : 'Working Branch'}
                </span>
                <span className="text-xs font-bold text-slate-900 leading-tight">
                  {activeBranch?.name} ({activeBranch?.code})
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5">
              <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="text-xs font-semibold text-slate-500 hidden sm:inline">{t('branchLabel')}</span>
              <select
                value={activeBranch?.id || ''}
                onChange={(e) => onSelectBranch(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer pr-1"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id} className="bg-white text-slate-900">
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Quick Search Button */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200/80 text-slate-600 text-xs px-3 py-2 rounded-lg border border-slate-200 transition cursor-pointer font-medium"
            title="Search Customer, Barcode, Phone, or Invoice"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden md:inline">{t('quickSearch')}</span>
            <kbd className="hidden lg:inline-block bg-white text-slate-500 text-[10px] px-1.5 py-0.5 rounded border border-slate-200 font-mono">
              /
            </kbd>
          </button>
        </div>

        {/* Right Action Widgets & Production User Profile Menu */}
        <div className="flex items-center gap-2 sm:gap-2.5 relative">
          {/* Language Switcher Toggle */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
            title="Switch Language (العربية / English)"
          >
            <Globe className="w-4 h-4 text-amber-700 shrink-0" />
            <span className="font-bold">{lang === 'ar' ? 'العربية' : 'English'}</span>
          </button>

          {/* User Profile Menu Button */}
          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200/80 text-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 transition cursor-pointer"
          >
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
              {(currentUser?.fullName || 'U').charAt(0)}
            </div>
            <div className="text-start hidden md:block">
              <div className="text-xs font-bold leading-tight text-slate-900 truncate max-w-[130px]">
                {currentUser?.fullName || 'User'}
              </div>
              <div className="flex items-center gap-1">
                <span
                  className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded border ${getRoleBadgeStyle(
                    currentUser?.role || 'admin'
                  )}`}
                >
                  {getRoleLabel(currentUser?.role || 'admin')}
                </span>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          </button>

          {/* Profile Dropdown Menu */}
          {isProfileMenuOpen && (
            <div className={`absolute ${lang === 'ar' ? 'left-0' : 'right-0'} top-12 w-72 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-3 space-y-2 text-slate-900`}>
              <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                  {(currentUser?.fullName || 'U').charAt(0)}
                </div>
                <div className="overflow-hidden">
                  <div className="font-bold text-xs text-slate-900 truncate">{currentUser?.fullName}</div>
                  <div className="text-[10px] text-blue-700 font-mono font-semibold">@{currentUser?.username}</div>
                  <div className="mt-1">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${getRoleBadgeStyle(currentUser?.role || 'admin')}`}>
                      {getRoleLabel(currentUser?.role || 'admin')}
                    </span>
                  </div>
                </div>
              </div>

              {currentUser?.role === 'admin' && onOpenUsers && (
                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    onOpenUsers();
                  }}
                  className="w-full text-left rtl:text-right px-3 py-2 text-xs font-bold text-purple-900 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition cursor-pointer flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4 text-purple-700 shrink-0" />
                  {lang === 'ar' ? 'إدارة حسابات وصلاحيات الموظفين' : 'Staff Account & Role Management'}
                </button>
              )}

              {/* Clear Database & Start Fresh Button */}
              {currentUser?.role === 'admin' && (
                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    setIsPurgeConfirmOpen(true);
                  }}
                  className="w-full text-left rtl:text-right px-3 py-2 text-xs font-bold text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition cursor-pointer flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4 text-rose-600 shrink-0" />
                  {lang === 'ar' ? 'تفريغ البيانات التجريبية والبدء من جديد' : 'Clear Sample Data & Start Fresh'}
                </button>
              )}

              {/* Login with Username / Password */}
              <button
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  setIsLoginModalOpen(true);
                }}
                className="w-full text-left rtl:text-right px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer flex items-center gap-2"
              >
                <LogIn className="w-4 h-4 text-blue-600 shrink-0" />
                {lang === 'ar' ? 'تسجيل الدخول بحساب موظف آخر' : 'Login to Different Staff Account'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Production Login Modal */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <LogIn className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    {lang === 'ar' ? 'تسجيل دخول الموظف' : 'Staff Account Login'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {lang === 'ar' ? 'أدخل اسم المستخدم وكلمة السر للمتابعة.' : 'Enter credentials to authenticate.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsLoginModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {loginError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg font-bold">
                {loginError}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-3 text-xs font-medium">
              <div className="space-y-1">
                <label className="text-slate-700 font-bold block flex items-center justify-between">
                  <span>{lang === 'ar' ? 'الفرع الذي تعمل منه اليوم' : 'Working Branch Today'}</span>
                  <span className="text-[10px] text-blue-600 font-bold">{lang === 'ar' ? 'مطلوب للمبيعات والمخزون' : 'Required for POS & Stock'}</span>
                </label>
                <div className="relative">
                  <select
                    value={loginBranchId}
                    onChange={(e) => setLoginBranchId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-bold block">
                  {lang === 'ar' ? 'اسم المستخدم' : 'Username'}
                </label>
                <input
                  type="text"
                  required
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder={lang === 'ar' ? 'مثال: admin, accountant' : 'e.g. admin, accountant, optician_tariq'}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-mono focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-bold block">
                  {lang === 'ar' ? 'كلمة المرور' : 'Password'}
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder={lang === 'ar' ? 'أدخل كلمة مرور الحساب' : 'Enter account password'}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-mono focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none rtl:pl-8 ltr:pr-8"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute ltr:right-2.5 rtl:left-2.5 top-3" />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsLoginModalOpen(false)}
                  className="px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-bold transition cursor-pointer"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg shadow-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <UserCheck className="w-4 h-4" />
                  {lang === 'ar' ? 'المصادقة وتسجيل الدخول' : 'Authenticate & Login'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal to Clear Database */}
      {isPurgeConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-slate-900">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl shrink-0">
                <AlertOctagon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  {lang === 'ar' ? 'مسح كافة البيانات التجريبية؟' : 'Purge All Sample Data?'}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {lang === 'ar' ? 'تجهيز نظام أوبتي فيجن للعمل الفعلي في المحل.' : 'Prepare OptiVision ERP for fresh store production.'}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium bg-slate-50 p-3 rounded-lg border border-slate-200">
              {lang === 'ar'
                ? 'سيؤدي هذا الإجراء إلى حذف جميع المنتجات والفواتير والعملاء وتنبيهات الاتصالات وطلبات المختبر وإغلاقات الصندوق بشكل نهائي، لبدء العمل بقاعدة بيانات فارغة ونظيفة.'
                : 'This action will permanently wipe all sample products, invoices, customers, call center reminders, lab orders, and cash closings so you can start with a clean database for your optical shop.'}
            </p>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                disabled={isPurging}
                onClick={() => setIsPurgeConfirmOpen(false)}
                className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-bold text-xs transition cursor-pointer disabled:opacity-50"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                disabled={isPurging}
                onClick={handleExecutePurge}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow-xs transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {isPurging ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{lang === 'ar' ? 'جاري المسح...' : 'Clearing Data...'}</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>{lang === 'ar' ? 'نعم، تفريغ البيانات والبدء' : 'Yes, Clear Database & Start Working'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};


