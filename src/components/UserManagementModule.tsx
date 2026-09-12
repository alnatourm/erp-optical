import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Building2,
  CheckCircle2,
  XCircle,
  Key,
  Mail,
  Phone,
  Trash2,
  Edit2,
  LogIn,
  Search,
  BadgeCheck,
  Lock,
  AlertOctagon,
} from 'lucide-react';
import { UserAccount, UserRole, Branch, Product } from '../types';
import { Plus, MapPin, Store, Database, Download, Upload } from 'lucide-react';
import { useLanguage } from '../lib/i18n';

interface UserManagementModuleProps {
  users: UserAccount[];
  branches: Branch[];
  products?: Product[];
  currentUser: UserAccount;
  onSaveUser: (userData: Partial<UserAccount> & { username: string; fullName: string; role: UserRole }) => void;
  onToggleUserStatus: (userId: string) => void;
  onDeleteUser: (userId: string) => void;
  onSwitchUser: (userId: string) => void;
  onSaveBranch?: (branchData: Partial<Branch> & { name: string; code: string; city: string }) => void;
  onDeleteBranch?: (branchId: string) => void;
  onPurgeDatabase?: () => void;
  onBackupSystemData?: () => void;
  onRestoreSystemData?: (jsonString: string) => void;
}

export const UserManagementModule: React.FC<UserManagementModuleProps> = ({
  users,
  branches,
  products = [],
  currentUser,
  onSaveUser,
  onToggleUserStatus,
  onDeleteUser,
  onSwitchUser,
  onSaveBranch,
  onDeleteBranch,
  onPurgeDatabase,
  onBackupSystemData,
  onRestoreSystemData,
}) => {
  const { lang, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'users' | 'branches'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);

  // Branch management state
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [branchName, setBranchName] = useState('');
  const [branchCode, setBranchCode] = useState('');
  const [branchCity, setBranchCity] = useState('');
  const [branchAddress, setBranchAddress] = useState('');
  const [branchPhone, setBranchPhone] = useState('');
  const [branchIsMain, setBranchIsMain] = useState(false);

  const openCreateBranchModal = () => {
    setEditingBranch(null);
    setBranchName('');
    setBranchCode(`AMMAN-${Math.floor(10 + Math.random() * 90)}`);
    setBranchCity('Amman');
    setBranchAddress('');
    setBranchPhone('+962 6 500 0000');
    setBranchIsMain(false);
    setIsBranchModalOpen(true);
  };

  const openEditBranchModal = (b: Branch) => {
    setEditingBranch(b);
    setBranchName(b.name);
    setBranchCode(b.code);
    setBranchCity(b.city || 'Amman');
    setBranchAddress(b.address);
    setBranchPhone(b.phone);
    setBranchIsMain(!!b.isMain);
    setIsBranchModalOpen(true);
  };

  const handleBranchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchName.trim() || !branchCode.trim() || !onSaveBranch) return;

    onSaveBranch({
      id: editingBranch ? editingBranch.id : undefined,
      name: branchName.trim(),
      code: branchCode.trim().toUpperCase(),
      city: branchCity.trim() || 'Amman',
      address: branchAddress.trim() || 'Jordan',
      phone: branchPhone.trim() || '+962 6 000 0000',
      isMain: branchIsMain,
    });

    setIsBranchModalOpen(false);
  };

  // Form fields
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('sales_person');
  const [branchId, setBranchId] = useState('all');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [isActive, setIsActive] = useState(true);

  const openCreateModal = () => {
    setEditingUser(null);
    setUsername('');
    setFullName('');
    setPassword('Opti@2026');
    setRole('sales_person');
    setBranchId('all');
    setEmail('');
    setPhone('');
    setPin('');
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (user: UserAccount) => {
    setEditingUser(user);
    setUsername(user.username);
    setFullName(user.fullName);
    setPassword('••••••••');
    setRole(user.role);
    setBranchId(user.branchId);
    setEmail(user.email || '');
    setPhone(user.phone || '');
    setPin(user.pin || '');
    setIsActive(user.isActive);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !fullName.trim()) return;

    onSaveUser({
      id: editingUser ? editingUser.id : undefined,
      username: username.trim(),
      fullName: fullName.trim(),
      role,
      branchId,
      email: email.trim() || `${username.trim()}@optivision.jo`,
      phone: phone.trim() || '+962 7 9000 0000',
      pin: pin.trim() || '1234', // default pin
      isActive,
    });

    setIsModalOpen(false);
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRole = selectedRoleFilter === 'all' || u.role === selectedRoleFilter;

    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (userRole: UserRole) => {
    switch (userRole) {
      case 'admin':
        return <span className="bg-purple-100 text-purple-800 border border-purple-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">{lang === 'ar' ? 'مسؤول النظام العام' : 'Admin / System Manager'}</span>;
      case 'accountant':
        return <span className="bg-blue-100 text-blue-800 border border-blue-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">{lang === 'ar' ? 'محاسب مالي' : 'Accountant'}</span>;
      case 'sales_person':
        return <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">{lang === 'ar' ? 'موظف مبيعات / أخصائي' : 'Shop Sales / Optician'}</span>;
      case 'call_center':
        return <span className="bg-cyan-100 text-cyan-800 border border-cyan-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">{lang === 'ar' ? 'موظف مركز الاتصال' : 'Call Center Agent'}</span>;
      case 'lab_tech':
        return <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">{lang === 'ar' ? 'فني مختبر وعدسات' : 'Lab Technician'}</span>;
      default:
        return <span className="bg-slate-100 text-slate-800 border border-slate-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">{userRole}</span>;
    }
  };

  const getBranchName = (bId: string) => {
    if (bId === 'all') return lang === 'ar' ? 'جميع الفروع (الإدارة العامة)' : 'All Branches (Enterprise)';
    const found = branches.find((b) => b.id === bId);
    return found ? found.name : bId;
  };

  return (
    <div id="user-management-module" className="p-6 space-y-6 max-w-7xl mx-auto text-slate-900">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {lang === 'ar' ? 'لوحة التحكم: إدارة حسابات الموظفين وفروع المراكز' : 'Admin Panel: Staff Accounts & Store Branches'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {lang === 'ar' ? 'إدارة مستخدمي النظام، الأدوار والصلاحيات، وفروع مراكز النظارات' : 'Manage system users, access roles, and optical store branch locations.'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {onBackupSystemData && (
            <button
              onClick={onBackupSystemData}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold text-xs px-3 py-2.5 rounded-lg transition cursor-pointer flex items-center gap-1.5"
              title={lang === 'ar' ? 'تصدير نسخة احتياطية من كافة بيانات النظام' : 'Export JSON Backup'}
            >
              <Download className="w-4 h-4 text-blue-600" />
              {lang === 'ar' ? 'حفظ نسخة احتياطية' : 'Export Backup'}
            </button>
          )}

          {onRestoreSystemData && (
            <label
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold text-xs px-3 py-2.5 rounded-lg transition cursor-pointer flex items-center gap-1.5"
              title={lang === 'ar' ? 'استعادة بيانات النظام من ملف JSON' : 'Restore JSON Backup'}
            >
              <Upload className="w-4 h-4 text-emerald-600" />
              <span>{lang === 'ar' ? 'استعادة النسخة' : 'Restore Backup'}</span>
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (evt) => {
                    const content = evt.target?.result as string;
                    if (content) onRestoreSystemData(content);
                  };
                  reader.readAsText(file);
                }}
              />
            </label>
          )}

          {onPurgeDatabase && currentUser.role === 'admin' && (
            <button
              onClick={() => setIsPurgeModalOpen(true)}
              className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs px-3 py-2.5 rounded-lg transition cursor-pointer flex items-center gap-1.5"
              title={lang === 'ar' ? 'مسح البيانات التجريبية للافتتاح الرسمي' : 'Wipe sample data for production launch'}
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              {lang === 'ar' ? 'تفريغ البيانات التجريبية' : 'Clear Sample Data'}
            </button>
          )}

          {activeTab === 'users' ? (
            <button
              onClick={openCreateModal}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-xs transition cursor-pointer flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              {lang === 'ar' ? 'إضافة حساب موظف جديد' : 'Create Staff Account'}
            </button>
          ) : (
            <button
              onClick={openCreateBranchModal}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-xs transition cursor-pointer flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {lang === 'ar' ? 'إضافة فرع / معرض جديد' : 'Add New Branch Outlet'}
            </button>
          )}
        </div>
      </div>

      {/* Primary Module Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'users'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          <Users className="w-4 h-4" />
          {lang === 'ar' ? `حسابات الموظفين (${users.length})` : `Staff Accounts (${users.length})`}
        </button>

        <button
          onClick={() => setActiveTab('branches')}
          className={`px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-2 ${
            activeTab === 'branches'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          <Building2 className="w-4 h-4" />
          {lang === 'ar' ? `فروع ومراكز النظارات (${branches.length})` : `Optical Branches & Outlets (${branches.length})`}
        </button>
      </div>

      {activeTab === 'users' ? (
        <>
          {/* Admin Notice Banner */}
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
            <div className="text-xs text-purple-900 leading-relaxed font-medium">
              <strong className="font-bold block text-purple-950">
                {lang === 'ar' ? 'نظام التحكم حسب أدوار الموظفين مفعل:' : 'Role-Based Page Control Active:'}
              </strong>
              {lang === 'ar'
                ? 'الموظف المسجل كـ "مبيعات" يرى المبيعات وسجل العملاء فقط، "المحاسب" يرى المالية والصندوق والمستوردات، "مركز الاتصال" يرى التذكيرات الدورية، و"فني المختبر" يرى طلبات تجهيز العدسات.'
                : 'Staff logged in as Shop Sales Person only see POS & Customer 360; Accountants see Finance, Cash & Imports; Call Center Agents see Call Center Reminders; and Lab Techs see Lab Job Orders.'}
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute ltr:left-3 rtl:right-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={lang === 'ar' ? 'بحث باسم الموظف أو اسم المستخدم...' : 'Search by name or username...'}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg ltr:pl-9 ltr:pr-3 rtl:pr-9 rtl:pl-3 py-2 text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium text-slate-900"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              <span className="text-xs font-bold text-slate-500 shrink-0">
                {lang === 'ar' ? 'تصفية حسب الدور:' : 'Role Filter:'}
              </span>
              {[
                { id: 'all', label: lang === 'ar' ? 'جميع الأدوار' : 'All Roles' },
                { id: 'admin', label: lang === 'ar' ? 'المدير' : 'Admin' },
                { id: 'accountant', label: lang === 'ar' ? 'المحاسب' : 'Accountant' },
                { id: 'sales_person', label: lang === 'ar' ? 'المبيعات / الأخصائي' : 'Sales / Optician' },
                { id: 'call_center', label: lang === 'ar' ? 'مركز الاتصال' : 'Call Center' },
                { id: 'lab_tech', label: lang === 'ar' ? 'المختبر' : 'Lab Tech' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSelectedRoleFilter(f.id)}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-bold transition cursor-pointer whitespace-nowrap ${
                    selectedRoleFilter === f.id
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* User Accounts List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((user) => {
              const isCurrent = user.id === currentUser.id;

              return (
                <div
                  key={user.id}
                  className={`bg-white border rounded-xl p-5 shadow-xs transition flex flex-col justify-between gap-4 relative ${
                    isCurrent ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {isCurrent && (
                    <div className="absolute top-3 ltr:right-3 rtl:left-3 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                      <BadgeCheck className="w-3 h-3" /> {lang === 'ar' ? 'مسجل الدخول الآن' : 'Logged In Now'}
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-sm shrink-0">
                        {user.fullName.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm leading-tight">{user.fullName}</h3>
                        <p className="text-xs text-blue-700 font-mono font-semibold">@{user.username}</p>
                        <div className="mt-1.5">{getRoleBadge(user.role)}</div>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-medium">{getBranchName(user.branchId)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{user.email || (lang === 'ar' ? 'غير متوفر' : 'N/A')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-mono">{user.phone || (lang === 'ar' ? 'غير متوفر' : 'N/A')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status and Action Buttons */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => onToggleUserStatus(user.id)}
                      className={`text-[11px] font-bold flex items-center gap-1 px-2.5 py-1 rounded-md border transition cursor-pointer ${
                        user.isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                      }`}
                    >
                      {user.isActive ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> {lang === 'ar' ? 'نشط' : 'Active'}
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 text-rose-600" /> {lang === 'ar' ? 'معطل' : 'Disabled'}
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-1">
                      {!isCurrent && (
                        <button
                          onClick={() => onSwitchUser(user.id)}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-md border border-blue-200 transition cursor-pointer flex items-center gap-1"
                          title={lang === 'ar' ? 'التبديل والدخول بهذا الحساب' : 'Switch login to this user'}
                        >
                          <LogIn className="w-3 h-3" /> {lang === 'ar' ? 'الانتقال للعمل بـ' : 'Login As'}
                        </button>
                      )}

                      <button
                        onClick={() => openEditModal(user)}
                        className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 transition cursor-pointer"
                        title={lang === 'ar' ? 'تعديل بيانات المستخدم' : 'Edit User'}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {!isCurrent && (
                        <button
                          onClick={() => onDeleteUser(user.id)}
                          className="p-1.5 hover:bg-rose-50 rounded text-rose-400 hover:text-rose-600 transition cursor-pointer"
                          title={lang === 'ar' ? 'حذف الحساب' : 'Delete User'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="space-y-6">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
            <Building2 className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-900 leading-relaxed font-medium">
              <strong className="font-bold block text-blue-950">Optical Store Outlets & Multi-Branch Directory:</strong>
              Add new shop locations, edit address details, or remove inactive branches. Stock imports, sales POS invoices, and staff accounts link directly to these branch locations.
            </div>
          </div>

          {/* Branches Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {branches.map((b) => {
              const branchStaffCount = users.filter((u) => u.branchId === b.id || u.branchId === 'all').length;
              const branchStockCount = products.filter((p) => p.branchId === b.id).length;

              return (
                <div
                  key={b.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition p-5 space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-base text-slate-900">{b.name}</h3>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="font-mono text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md">
                            {b.code}
                          </span>
                          {b.isMain && (
                            <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-md">
                              Central Main Store
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl text-slate-600 shrink-0">
                        <Store className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{b.city || 'Amman'}, {b.address}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-mono">{b.phone}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-center text-xs">
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-500 block uppercase">Assigned Staff</span>
                        <span className="font-bold text-slate-900">{branchStaffCount} Users</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-500 block uppercase">Stock Inventory</span>
                        <span className="font-bold text-emerald-700">{branchStockCount} Items</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => openEditBranchModal(b)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-3.5 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                      Edit Branch
                    </button>

                    {onDeleteBranch && branches.length > 1 && (
                      <button
                        onClick={() => onDeleteBranch(b.id)}
                        className="p-2 text-rose-500 hover:bg-rose-50 border border-rose-200 rounded-lg transition cursor-pointer flex items-center gap-1 text-xs font-bold"
                        title="Delete Branch"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal for Creating / Editing User */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Key className="w-4 h-4 text-blue-600" />
                {editingUser ? `Edit Account: @${editingUser.username}` : 'Create New User Account'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-700 font-bold block">Username *</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. sales_khalid"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 font-bold block">Password *</label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono pr-8"
                    />
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3" />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-bold block">Full Staff Name *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Khalid Othman"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-700 font-bold block">Assign Staff Role *</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="admin">Admin (Full System Access)</option>
                    <option value="accountant">Accountant (Finance & Inventory)</option>
                    <option value="sales_person">Shop Sales Person / Optician (POS & Rx)</option>
                    <option value="call_center">Call Center Agent (CRM & Follow-ups)</option>
                    <option value="lab_tech">Laboratory Tech (Lens Edging & Jobs)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 font-bold block">Assigned Branch *</label>
                  <select
                    value={branchId}
                    onChange={(e) => setBranchId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="all">All Branches (Global Access)</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-700 font-bold block">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="khalid@optivision.jo"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 font-bold block">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+962 7 9000 1234"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {(role === 'admin' || role === 'accountant') && (
                <div className="space-y-1">
                  <label className="text-slate-700 font-bold block">Approval PIN Code</label>
                  <input
                    type="text"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="e.g. 1234"
                    maxLength={4}
                    className="w-full sm:w-1/2 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono tracking-widest"
                  />
                  <p className="text-slate-500 text-[10px]">4-digit PIN used for managerial approvals (e.g., discounts)</p>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="userActiveCheck"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                />
                <label htmlFor="userActiveCheck" className="text-slate-800 font-bold cursor-pointer">
                  Account Status Active (Can log into the ERP)
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded-lg shadow-xs transition cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {editingUser ? 'Save User Account Changes' : 'Create Staff Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for Creating / Editing Branch Outlet */}
      {isBranchModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 shadow-xl space-y-4 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Store className="w-5 h-5 text-emerald-600" />
                {editingBranch ? `Edit Branch: ${editingBranch.name}` : 'Add New Optical Branch Outlet'}
              </h3>
              <button
                onClick={() => setIsBranchModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBranchSubmit} className="space-y-3 text-xs font-medium">
              <div className="space-y-1">
                <label className="text-slate-700 font-bold block">Branch Outlet Name *</label>
                <input
                  type="text"
                  required
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  placeholder="e.g. Amman Mecca Street Store"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-700 font-bold block">Branch Code *</label>
                  <input
                    type="text"
                    required
                    value={branchCode}
                    onChange={(e) => setBranchCode(e.target.value)}
                    placeholder="e.g. AMMAN-MECCA"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 font-bold block">City *</label>
                  <input
                    type="text"
                    required
                    value={branchCity}
                    onChange={(e) => setBranchCity(e.target.value)}
                    placeholder="e.g. Amman, Irbid, Aqaba"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-bold block">Street Address</label>
                <input
                  type="text"
                  value={branchAddress}
                  onChange={(e) => setBranchAddress(e.target.value)}
                  placeholder="e.g. Mecca Street, Building 88, Near Sweifieh"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-bold block">Phone Number</label>
                <input
                  type="text"
                  value={branchPhone}
                  onChange={(e) => setBranchPhone(e.target.value)}
                  placeholder="e.g. +962 6 580 1234"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="branchIsMainCheck"
                  checked={branchIsMain}
                  onChange={(e) => setBranchIsMain(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                />
                <label htmlFor="branchIsMainCheck" className="text-slate-800 font-bold cursor-pointer">
                  Mark as Central Headquarters / Main Store
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBranchModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-lg shadow-xs transition cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {editingBranch ? 'Save Branch Changes' : 'Create Branch Outlet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal to Clear Database */}
      {isPurgeModalOpen && onPurgeDatabase && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-slate-900">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl shrink-0">
                <AlertOctagon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Purge All Sample Data?</h3>
                <p className="text-xs text-slate-500 font-medium font-medium">Prepare OptiVision ERP for fresh store production.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium bg-slate-50 p-3 rounded-lg border border-slate-200">
              This action will <strong>permanently wipe all sample products, invoices, customers, call center reminders, lab orders, and cash closings</strong> so you can start with a clean database for your optical shop.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsPurgeModalOpen(false)}
                className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-bold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onPurgeDatabase();
                  setIsPurgeModalOpen(false);
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow-xs transition cursor-pointer flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Yes, Clear Database & Start Working
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
