import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'ar';

export interface Translations {
  // Common Navigation
  dashboard: string;
  import: string;
  products: string;
  pos: string;
  customers: string;
  laboratory: string;
  call_center: string;
  cash: string;
  suppliers: string;
  users: string;
  export_php: string;

  // Header & System
  optiVision: string;
  multiBranch: string;
  branchLabel: string;
  quickSearch: string;
  languageToggle: string;
  loginSwitch: string;
  clearData: string;
  currentRole: string;

  // Dashboard & KPIs
  kpiOverview: string;
  branchPerformanceCharts: string;
  activeOutlet: string;
  managerLabel: string;
  stockImportBtn: string;
  newRxInvoiceBtn: string;
  totalBranchRevenue: string;
  inventoryValuation: string;
  lowStockAlerts: string;
  labJobsInProcess: string;
  pendingFollowUps: string;
  costValue: string;
  retailValue: string;
  lowStockTitle: string;
  viewAllInventory: string;
  pendingCallsTitle: string;
  processCalls: string;
  activeLabJobsTitle: string;
  manageLab: string;

  // Common Table & Form Labels
  searchPlaceholder: string;
  category: string;
  frameType: string;
  quantity: string;
  costPrice: string;
  sellingPrice: string;
  action: string;
  actions: string;
  save: string;
  cancel: string;
  edit: string;
  delete: string;
  status: string;
  date: string;
  notes: string;

  // POS Module
  salesPosTitle: string;
  salesPosSub: string;
  newInvoice: string;
  invoiceHistory: string;
  quickPickCustomer: string;
  customerName: string;
  phoneNumber: string;
  deliveryDate: string;
  salesEmployee: string;
  opticalRx: string;
  rightEye: string;
  leftEye: string;
  sph: string;
  cyl: string;
  axis: string;
  addVal: string;
  disVal: string;
  ipdVal: string;
  productsSection: string;
  scanBarcode: string;
  addInvoiceRow: string;
  barcode: string;
  description: string;
  priceJod: string;
  qty: string;
  discount: string;
  total: string;
  subtotal: string;
  salesTax: string;
  grandTotal: string;
  paidNow: string;
  remainingDue: string;
  full100: string;
  deposit50: string;
  deposit20: string;
  unpaid0: string;
  settleRestPayment: string;
  confirmOrder: string;
  readyForPickup: string;
  fullyPaid: string;

  // Customer 360
  customer360Title: string;
  customer360Sub: string;
  totalInvoices: string;
  totalSpend: string;
  prescriptionRx: string;
  invoicesTab: string;
  framesTab: string;
  lensesTab: string;
  contactsTab: string;
  paymentsTab: string;
  callsTab: string;
  newCustomerBtn: string;

  // General & Roles
  adminRole: string;
  accountantRole: string;
  salesRole: string;
  callCenterRole: string;
  labTechRole: string;
}

const translations: Record<Language, Translations> = {
  en: {
    // Navigation
    dashboard: 'Overview & KPIs',
    import: 'Excel Stock Import',
    products: 'Product Database',
    pos: 'Sales POS & Invoice',
    customers: 'Customer 360 & Rx',
    laboratory: 'Laboratory Jobs',
    call_center: 'Call Center Rules',
    cash: 'Branch Cash Closing',
    suppliers: 'Suppliers & POs',
    users: 'User & Staff Accounts',
    export_php: 'cPanel / PHP MySQL',

    // Header
    optiVision: 'OptiVision ERP',
    multiBranch: 'Multi-Branch Optical System',
    branchLabel: 'Branch:',
    quickSearch: 'Quick Search... (/)',
    languageToggle: 'العربية (Arabic)',
    loginSwitch: 'Login / Switch Account',
    clearData: 'Clear Sample Data',
    currentRole: 'Active Staff Role',

    // Dashboard & KPIs
    kpiOverview: 'KPI Overview',
    branchPerformanceCharts: 'Branch Performance & Charts',
    activeOutlet: 'Active Branch:',
    managerLabel: 'Manager:',
    stockImportBtn: 'Stock Accountant Import',
    newRxInvoiceBtn: 'New Prescription Invoice',
    totalBranchRevenue: 'Total Branch Revenue',
    inventoryValuation: 'Inventory Valuation',
    lowStockAlerts: 'Low Stock Items',
    labJobsInProcess: 'Lab Jobs In Process',
    pendingFollowUps: 'Pending Follow-Ups',
    costValue: 'Cost Value:',
    retailValue: 'Retail Value:',
    lowStockTitle: 'Low Stock Inventory Alerts',
    viewAllInventory: 'View All Inventory',
    pendingCallsTitle: 'Pending Call Center Follow-ups',
    processCalls: 'Process Calls',
    activeLabJobsTitle: 'Active Lab Orders',
    manageLab: 'Manage Lab',

    // Common Table & Form Labels
    searchPlaceholder: 'Search...',
    category: 'Category',
    frameType: 'Frame Type',
    quantity: 'Quantity',
    costPrice: 'Cost Price',
    sellingPrice: 'Selling Price',
    action: 'Action',
    actions: 'Actions',
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    status: 'Status',
    date: 'Date',
    notes: 'Notes',

    // POS
    salesPosTitle: 'Sales POS & Invoice Management',
    salesPosSub: 'Issue prescription orders, accept partial deposits or full payment, and settle remaining balance upon product delivery.',
    newInvoice: 'New Sales Invoice (POS)',
    invoiceHistory: 'Invoice History & Pickup Settlement',
    quickPickCustomer: 'Quick Pick Customer:',
    customerName: 'Customer Name',
    phoneNumber: 'Phone Number',
    deliveryDate: 'Delivery Date',
    salesEmployee: 'Sales Employee',
    opticalRx: 'Optical Prescription Details',
    rightEye: 'RIGHT EYE (O.D.)',
    leftEye: 'LEFT EYE (O.S.)',
    sph: 'SPH',
    cyl: 'CYL',
    axis: 'AXIS',
    addVal: 'ADD',
    disVal: 'DIS',
    ipdVal: 'IPD',
    productsSection: 'Products Section',
    scanBarcode: 'Scan Barcode',
    addInvoiceRow: 'Add Invoice Row',
    barcode: 'Barcode',
    description: 'Description',
    priceJod: 'Price (JOD)',
    qty: 'Qty',
    discount: 'Discount',
    total: 'Total',
    subtotal: 'Subtotal:',
    salesTax: 'Sales Tax (16%):',
    grandTotal: 'Grand Total:',
    paidNow: 'Amount Paid Now (JOD):',
    remainingDue: 'Remaining Balance Due:',
    full100: 'Full (100%)',
    deposit50: '50% Deposit',
    deposit20: '20 JOD Deposit',
    unpaid0: '0 JOD (Unpaid)',
    settleRestPayment: 'Settle Rest Payment',
    confirmOrder: 'Confirm Order & Deduct Stock',
    readyForPickup: 'Ready for Pickup',
    fullyPaid: '100% Fully Paid',

    // Customer 360
    customer360Title: 'Customer 360° History Profile',
    customer360Sub: 'Instant search by Phone, Name, Barcode, or Invoice Number to view full optical history.',
    totalInvoices: 'Total Invoices',
    totalSpend: 'Total Spend',
    prescriptionRx: 'Prescription Rx',
    invoicesTab: 'Invoices',
    framesTab: 'Frames',
    lensesTab: 'Lenses',
    contactsTab: 'Contacts',
    paymentsTab: 'Payments',
    callsTab: 'Call Log',
    newCustomerBtn: 'Create New Customer',

    // Roles
    adminRole: 'ADMINISTRATOR',
    accountantRole: 'ACCOUNTANT',
    salesRole: 'SHOP SALES / OPTICIAN',
    callCenterRole: 'CALL CENTER AGENT',
    labTechRole: 'LABORATORY TECH',
  },
  ar: {
    // Navigation
    dashboard: 'لوحة التحكم والمؤشرات',
    import: 'استيراد المخزون من إكسل',
    products: 'قاعدة بيانات المنتجات والإطارات',
    pos: 'نقطة البيع وفواتير المبيعات',
    customers: 'سجل العملاء والوصفات الطبية',
    laboratory: 'أعمال المختبر والتجهيز',
    call_center: 'مركز الاتصال والمتابعة الدوري',
    cash: 'إغلاق صندوق الفرع اليومي',
    suppliers: 'الموردين وأوامر الشراء',
    users: 'إدارة حسابات الموظفين',
    export_php: 'تصدير قواعد البيانات (PHP MySQL)',

    // Header
    optiVision: 'أوبتي فيجن ERP',
    multiBranch: 'نظام إدارة مراكز النظارات والعدسات',
    branchLabel: 'الفرع الحقيقي:',
    quickSearch: 'بحث سريع... (/)',
    languageToggle: 'English (الإنجليزية)',
    loginSwitch: 'تسجيل الدخول / تبديل الحساب',
    clearData: 'تفريغ البيانات التجريبية',
    currentRole: 'صلاحية الموظف الحالية',

    // Dashboard & KPIs
    kpiOverview: 'ملخص المؤشرات (KPIs)',
    branchPerformanceCharts: 'أداء الفروع والرسوم البيانية',
    activeOutlet: 'الفرع الحالي النشط:',
    managerLabel: 'المسؤول:',
    stockImportBtn: 'استيراد جرد المخزون',
    newRxInvoiceBtn: 'فاتورة نظارات ووصفة جديدة',
    totalBranchRevenue: 'إجمالي إيرادات الفرع',
    inventoryValuation: 'قيمة بضاعة المخزون',
    lowStockAlerts: 'تنبيهات الأصناف الشبه منتهية',
    labJobsInProcess: 'أعمال المختبر جاري التجهيز',
    pendingFollowUps: 'متابعات العميل المعلقة',
    costValue: 'بسعر التكلفة:',
    retailValue: 'بسعر البيع:',
    lowStockTitle: 'الأصناف المنخفضة في المخزن',
    viewAllInventory: 'عرض كافة المخزون',
    pendingCallsTitle: 'اتصالات المتابعة المطلوبة',
    processCalls: 'إجراء الاتصالات',
    activeLabJobsTitle: 'طلبات المختبر الحالية',
    manageLab: 'إدارة المختبر',

    // Common Table & Form Labels
    searchPlaceholder: 'بحث...',
    category: 'الفئة',
    frameType: 'نوع الإطار',
    quantity: 'الكمية',
    costPrice: 'سعر التكلفة',
    sellingPrice: 'سعر البيع',
    action: 'الإجراء',
    actions: 'الإجراءات',
    save: 'حفظ',
    cancel: 'إلغاء',
    edit: 'تعديل',
    delete: 'حذف',
    status: 'الحالة',
    date: 'التاريخ',
    notes: 'ملاحظات',

    // POS
    salesPosTitle: 'إدارة فواتير المبيعات ونقاط البيع',
    salesPosSub: 'إصدار طلبات النظارات والعدسات، قبول العربون الجزئي أو الدفع الكامل، وتسوية الباقي عند الاستلام.',
    newInvoice: 'فاتورة مبيعات جديدة (POS)',
    invoiceHistory: 'سجل الفواتير وتسوية الاستلام',
    quickPickCustomer: 'اختيار عميل سريع:',
    customerName: 'اسم العميل الكريـم',
    phoneNumber: 'رقم الهاتف / الموبايل',
    deliveryDate: 'تاريخ الاستلام الجاهز',
    salesEmployee: 'الموظف البائع / الأخصائي',
    opticalRx: 'تفاصيل فحص النظر والوصفة الطبية (Rx)',
    rightEye: 'العين اليمنى (O.D.)',
    leftEye: 'العين اليسرى (O.S.)',
    sph: 'الدرجة (SPH)',
    cyl: 'الانحراف (CYL)',
    axis: 'المحور (AXIS)',
    addVal: 'الإضافة (ADD)',
    disVal: 'المسافة (DIS)',
    ipdVal: 'انحراف البؤرة (IPD)',
    productsSection: 'جدول المنتجات والخدمات',
    scanBarcode: 'مسح الباركود',
    addInvoiceRow: 'إضافة بند جديد',
    barcode: 'الباركود',
    description: 'الوصف / اسم الصنف',
    priceJod: 'السعر (دينار)',
    qty: 'الكمية',
    discount: 'الخصم',
    total: 'الإجمالي',
    subtotal: 'المجموع الفرعي:',
    salesTax: 'ضريبة المبيعات (16%):',
    grandTotal: 'المجموع الإجمالي النهائي:',
    paidNow: 'المبلغ المدفوع الآن (دينار):',
    remainingDue: 'المبلغ المتبقي المطلوب عند الاستلام:',
    full100: 'دفع كامل (100%)',
    deposit50: 'عربون 50%',
    deposit20: 'عربون 20 دينار',
    unpaid0: '0 دينار (آجل)',
    settleRestPayment: 'تسوية باقي المبلغ والاستلام',
    confirmOrder: 'تأكيد الطلب وخصم الكمية',
    readyForPickup: 'جاهز للتسليم',
    fullyPaid: 'مدفوع بالكامل 100%',

    // Customer 360
    customer360Title: 'سجل العميل الشامل 360°',
    customer360Sub: 'بحث فوري برقم الهاتف، الاسم، الباركود أو رقم الفاتورة لعرض تاريخ النظارات والوصفات.',
    totalInvoices: 'إجمالي الفواتير',
    totalSpend: 'إجمالي المشتريات',
    prescriptionRx: 'فحص النظر والوصفات',
    invoicesTab: 'الفواتير',
    framesTab: 'الإطارات',
    lensesTab: 'العدسات',
    contactsTab: 'العدسات اللاصقة',
    paymentsTab: 'الدفعات والمالية',
    callsTab: 'سجل الاتصالات',
    newCustomerBtn: 'إضافة عميل جديد',

    // Roles
    adminRole: 'مدير النظام العام',
    accountantRole: 'محاسب مالي',
    salesRole: 'بائع / أخصائي نظارات',
    callCenterRole: 'موظف مركز الاتصالات',
    labTechRole: 'فني المختبر والتجهيز',
  },
};

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: keyof Translations) => string;
  dir: 'ltr' | 'rtl';
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  setLang: () => {},
  toggleLanguage: () => {},
  t: (key) => translations.en[key] || String(key),
  dir: 'ltr',
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem('opti_language');
    return (saved === 'ar' || saved === 'en') ? saved : 'en';
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('opti_language', newLang);
  };

  const toggleLanguage = () => {
    setLang(lang === 'en' ? 'ar' : 'en');
  };

  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
  }, [lang, dir]);

  const t = (key: keyof Translations) => {
    return translations[lang][key] || translations['en'][key] || String(key);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLanguage, t, dir }}>
      <div dir={dir} className={lang === 'ar' ? 'font-sans rtl-app' : 'font-sans'}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
