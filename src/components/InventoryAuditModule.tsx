import React, { useState, useRef } from 'react';
import { InventoryAudit, Branch, UserAccount, Product, PurchaseOrder } from '../types';
import { 
  ClipboardCheck, 
  CheckCircle2, 
  AlertCircle, 
  PlayCircle, 
  PlusCircle, 
  LayoutList, 
  Search, 
  Scan, 
  Barcode,
  ArrowRightLeft,
  Trash2,
  AlertTriangle,
  Check,
  Package,
  FileText,
  ShieldAlert,
  Layers,
  Sparkles
} from 'lucide-react';
import { useLanguage } from '../lib/i18n';

interface Props {
  audits: InventoryAudit[];
  branches: Branch[];
  activeBranch: Branch;
  currentUser: UserAccount;
  products?: Product[];
  purchaseOrders?: PurchaseOrder[];
  onCreateAudit: (branchId: string, createdBy: string) => void;
  onUpdateAuditItem: (auditId: string, productId: string, status: 'Pending' | 'Present' | 'Missing' | 'Extra', actualQty: number) => void;
  onScanAuditItem?: (auditId: string, barcode: string, increment: number) => { success: boolean; message: string };
  onCompleteAudit: (auditId: string, completedBy: string) => void;
  onDeleteProduct?: (productId: string) => void;
  onDeleteProductsBatch?: (productIds: string[]) => void;
}

export function InventoryAuditModule({
  audits,
  branches,
  activeBranch,
  currentUser,
  products = [],
  purchaseOrders = [],
  onCreateAudit,
  onUpdateAuditItem,
  onScanAuditItem,
  onCompleteAudit,
  onDeleteProduct,
  onDeleteProductsBatch
}: Props) {
  const { t, lang } = useLanguage();

  // Module Navigation Tab: 'physical_audit' | 'po_reconciliation'
  const [activeModuleTab, setActiveModuleTab] = useState<'physical_audit' | 'po_reconciliation'>('physical_audit');

  // State for Physical Audit
  const [activeAuditId, setActiveAuditId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [scanBarcode, setScanBarcode] = useState('');
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // State for PO Reconciliation Report
  const [reconcileFilter, setReconcileFilter] = useState<'all' | 'orphaned' | 'verified' | 'mismatch'>('all');
  const [reconcileSearch, setReconcileSearch] = useState('');
  const [showDeleteBatchModal, setShowDeleteBatchModal] = useState(false);
  const [singleToDelete, setSingleToDelete] = useState<Product | null>(null);

  // Filter audits for current branch
  const branchAudits = audits
    .filter(a => a.branchId === activeBranch.id)
    .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());
  
  const activeAudit = audits.find(a => a.id === activeAuditId);

  // Handle Physical Audit actions
  const handleCreateAudit = () => {
    onCreateAudit(activeBranch.id, currentUser.fullName);
  };

  const handleCompleteAudit = () => {
    if (!activeAudit) return;
    const pendingItems = activeAudit.items.filter(i => i.status === 'Pending');
    if (pendingItems.length > 0) {
      setShowConfirmModal(true);
      return;
    }
    onCompleteAudit(activeAudit.id, currentUser.fullName);
    setActiveAuditId(null);
  };

  const confirmCompleteAudit = () => {
    if (!activeAudit) return;
    onCompleteAudit(activeAudit.id, currentUser.fullName);
    setShowConfirmModal(false);
    setActiveAuditId(null);
  };

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAudit || !scanBarcode.trim() || !onScanAuditItem) return;

    const result = onScanAuditItem(activeAudit.id, scanBarcode.trim(), 1);
    if (result.success) {
      setSuccessMsg(result.message);
      setTimeout(() => setSuccessMsg(null), 3000);
      setScanBarcode('');
      barcodeInputRef.current?.focus();
    } else {
      setErrorMsg(result.message);
      setTimeout(() => setErrorMsg(null), 3000);
    }
  };

  const isSalesPerson = currentUser.role === 'sales_person';
  const isAdminOrAccountant = currentUser.role === 'admin' || currentUser.role === 'accountant';

  let filteredAuditItems = activeAudit?.items.filter(item => 
    item.barcode.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.model.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.brand.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (isSalesPerson) {
    filteredAuditItems = filteredAuditItems.filter(item => item.actualQuantity > 0);
  }

  // --- PO RECONCILIATION ENGINE ---
  const branchProducts = products.filter(p => !p.branchId || p.branchId === activeBranch.id);

  // Map barcodes to Purchase Orders
  const poMap = new Map<string, { poNumber: string; supplierName: string; createdDate: string; quantity: number; unitPrice: number; poStatus: string }>();
  
  purchaseOrders.forEach(po => {
    if (po.items && Array.isArray(po.items)) {
      po.items.forEach(item => {
        if (item.barcode) {
          poMap.set(String(item.barcode).trim(), {
            poNumber: po.poNumber,
            supplierName: po.supplierName,
            createdDate: po.orderDate,
            quantity: Number(item.quantityOrdered) || 0,
            unitPrice: Number(item.unitPrice) || 0,
            poStatus: po.status
          });
        }
      });
    }
  });

  // Calculate comparison rows
  const comparisonRows = branchProducts.map(product => {
    const bc = String(product.barcode).trim();
    const poEntry = poMap.get(bc);

    const isOrphaned = !poEntry;
    const isQtyMismatch = poEntry ? poEntry.quantity !== product.currentQuantity : false;

    let status: 'verified' | 'orphaned' | 'mismatch' = 'verified';
    if (isOrphaned) status = 'orphaned';
    else if (isQtyMismatch) status = 'mismatch';

    return {
      product,
      poEntry,
      status,
      isOrphaned,
      isQtyMismatch
    };
  });

  // Summary Metrics
  const totalSystemSKUs = comparisonRows.length;
  const totalSystemQty = comparisonRows.reduce((acc, r) => acc + (r.product.currentQuantity || 0), 0);
  const totalSystemValuation = comparisonRows.reduce((acc, r) => acc + ((r.product.currentQuantity || 0) * (r.product.purchaseCost || 0)), 0);

  const orphanedRows = comparisonRows.filter(r => r.status === 'orphaned');
  const orphanedSKUs = orphanedRows.length;
  const orphanedQty = orphanedRows.reduce((acc, r) => acc + (r.product.currentQuantity || 0), 0);
  const orphanedValuation = orphanedRows.reduce((acc, r) => acc + ((r.product.currentQuantity || 0) * (r.product.purchaseCost || 0)), 0);

  const verifiedRows = comparisonRows.filter(r => r.status === 'verified');
  const verifiedSKUs = verifiedRows.length;

  const mismatchRows = comparisonRows.filter(r => r.status === 'mismatch');
  const mismatchSKUs = mismatchRows.length;

  // Filtered comparison rows for display
  const filteredComparisonRows = comparisonRows.filter(r => {
    // Filter status
    if (reconcileFilter === 'orphaned' && r.status !== 'orphaned') return false;
    if (reconcileFilter === 'verified' && r.status !== 'verified') return false;
    if (reconcileFilter === 'mismatch' && r.status !== 'mismatch') return false;

    // Search query
    if (!reconcileSearch.trim()) return true;
    const q = reconcileSearch.toLowerCase();
    const bc = String(r.product.barcode || '').toLowerCase();
    const brand = String(r.product.brand || '').toLowerCase();
    const model = String(r.product.model || '').toLowerCase();
    const poNum = String(r.poEntry?.poNumber || '').toLowerCase();
    const supplier = String(r.poEntry?.supplierName || '').toLowerCase();

    return bc.includes(q) || brand.includes(q) || model.includes(q) || poNum.includes(q) || supplier.includes(q);
  });

  const handleDeleteSingleProduct = (p: Product) => {
    if (onDeleteProduct) {
      onDeleteProduct(p.id);
      setSingleToDelete(null);
      setSuccessMsg(lang === 'ar' ? `تم حذف المنتج ${p.brand} (${p.barcode}) بنجاح` : `Successfully deleted ${p.brand} (${p.barcode})`);
      setTimeout(() => setSuccessMsg(null), 3500);
    }
  };

  const handleDeleteAllOrphaned = () => {
    if (onDeleteProductsBatch && orphanedRows.length > 0) {
      const ids = orphanedRows.map(r => r.product.id);
      onDeleteProductsBatch(ids);
      setShowDeleteBatchModal(false);
      setSuccessMsg(lang === 'ar' ? `تم حذف ${ids.length} منتج غير مرتبط بأمر شراء بنجاح.` : `Successfully deleted ${ids.length} orphaned products.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Modal: Confirm Single Delete */}
      {singleToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-slate-900">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-100 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">
                {lang === 'ar' ? 'تأكيد حذف المنتج' : 'Confirm Delete Product'}
              </h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              {lang === 'ar' 
                ? `هل أنت أصلًا متأكد من حذف المنتج "${singleToDelete.brand} - ${singleToDelete.model}" (الباركود: ${singleToDelete.barcode}) من المخزون؟`
                : `Are you sure you want to delete "${singleToDelete.brand} - ${singleToDelete.model}" (Barcode: ${singleToDelete.barcode}) from system stock?`}
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setSingleToDelete(null)}
                className="px-4 py-2.5 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition text-sm cursor-pointer"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={() => handleDeleteSingleProduct(singleToDelete)}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition text-sm cursor-pointer shadow-xs"
              >
                {lang === 'ar' ? 'حذف المنتج' : 'Delete Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirm Delete All Orphaned Items */}
      {showDeleteBatchModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-slate-900">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-100 rounded-xl">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">
                {lang === 'ar' ? 'تأكيد حذف البضاعة غير المدرجة بالكامل' : 'Confirm Batch Delete Orphaned Stock'}
              </h3>
            </div>
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-800 space-y-2">
              <p className="font-bold text-sm">
                {lang === 'ar' ? `سيتم حذف ${orphanedSKUs} صنف (${orphanedQty} قطعة)` : `Will delete ${orphanedSKUs} SKUs (${orphanedQty} pieces)`}
              </p>
              <p>
                {lang === 'ar' 
                  ? `إجمالي قيمة هذه البضاعة غير المدرجة: ${orphanedValuation.toFixed(2)} دينار.` 
                  : `Total cost valuation of these orphaned items: ${orphanedValuation.toFixed(2)} JOD.`}
              </p>
              <p className="text-[11px] opacity-90">
                {lang === 'ar' 
                  ? 'هذا الإجراء سيضمن مطابقة مخزون النظام 100% مع الفواتير والطلبيات الرسمية فقط.'
                  : 'This action will align your system stock 100% with verified Purchase Orders.'}
              </p>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowDeleteBatchModal(false)}
                className="px-4 py-2.5 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition text-sm cursor-pointer"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleDeleteAllOrphaned}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition text-sm cursor-pointer shadow-xs flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {lang === 'ar' ? `حذف الكل (${orphanedSKUs} صنف)` : `Delete All (${orphanedSKUs} Items)`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Audit Completion with Unchecked Items */}
      {showConfirmModal && activeAudit && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="p-3 bg-amber-100 rounded-xl">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                {lang === 'ar' ? 'تأكيد إنهاء الجرد وإغلاقه' : 'Complete Audit & Reconcile'}
              </h3>
            </div>

            <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
              <p>
                {lang === 'ar'
                  ? `يوجد ${activeAudit.items.filter(i => i.status === 'Pending').length} عنصر لم يتم فحصها/مسحها في هذه القائمة.`
                  : `There are ${activeAudit.items.filter(i => i.status === 'Pending').length} unchecked items remaining in this audit list.`}
              </p>
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-800 font-medium">
                {lang === 'ar'
                  ? 'سيتم تسجيل كافة العناصر غير المفحوصة تلقائياً كـ "مفقودة" وسيتأثر مخزون النظام فوراً لتطابق الواقع.'
                  : 'All unchecked items will be automatically marked as "MISSING", and system inventory will be updated to reflect physical count.'}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={confirmCompleteAudit}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-2.5 rounded-xl transition cursor-pointer shadow-xs"
              >
                {lang === 'ar' ? 'تأكيد وإنهاء الجرد' : 'Confirm & Complete'}
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm px-4 py-2.5 rounded-xl transition cursor-pointer"
              >
                {lang === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Header */}
      <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 text-blue-700 rounded-xl">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {lang === 'ar' ? 'تدقيق وجرد المخزون' : 'Inventory Audit & Reconciliation'}
              </h1>
              <p className="text-slate-500 text-sm mt-0.5">
                {lang === 'ar' 
                  ? 'جرد المخزون الفعلي ومطابقته الجدارية مع أوامر الشراء الرسمية (P.O).' 
                  : 'Audit physical stock and compare side-by-side with official Purchase Orders.'}
              </p>
            </div>
          </div>
        </div>

        {/* Module View Navigation Switcher */}
        <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 self-stretch md:self-auto">
          <button
            onClick={() => setActiveModuleTab('physical_audit')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeModuleTab === 'physical_audit'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Scan className="w-4 h-4" />
            {lang === 'ar' ? 'الجرد الفعلي' : 'Physical Scan Audit'}
          </button>
          <button
            onClick={() => setActiveModuleTab('po_reconciliation')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeModuleTab === 'po_reconciliation'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" />
            {lang === 'ar' ? 'تقرير مطابقة P.O' : 'P.O. Reconciliation Report'}
            {orphanedSKUs > 0 && (
              <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-mono">
                {orphanedSKUs}
              </span>
            )}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{errorMsg}</p>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{successMsg}</p>
        </div>
      )}

      {/* TAB 1: PHYSICAL AUDIT SESSIONS */}
      {activeModuleTab === 'physical_audit' && (
        <>
          {isAdminOrAccountant && !activeAudit && (
            <div className="flex justify-end">
              <button 
                onClick={handleCreateAudit}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-xs transition flex items-center gap-2 cursor-pointer"
              >
                <PlusCircle className="w-5 h-5" />
                {lang === 'ar' ? 'بدء جرد جديد' : 'Initiate New Audit'}
              </button>
            </div>
          )}

          {!activeAudit ? (
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <h2 className="font-bold text-slate-800 flex items-center gap-2">
                  <LayoutList className="w-5 h-5 text-slate-400" />
                  {lang === 'ar' ? 'عمليات الجرد للفرع' : 'Branch Audits'}
                </h2>
              </div>
              <div className="p-4">
                {branchAudits.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <ClipboardCheck className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                    <p>{lang === 'ar' ? 'لا يوجد عمليات جرد حالية.' : 'No audits found for this branch.'}</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {branchAudits.map(audit => (
                      <div key={audit.id} className="border border-slate-200 rounded-xl p-4 flex flex-col justify-between hover:shadow-md transition">
                        <div>
                          <div className="flex justify-between items-start mb-3">
                            <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                              audit.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {audit.status}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">
                              {new Date(audit.createdDate).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 mb-1">
                            <span className="font-semibold text-slate-800">{lang === 'ar' ? 'بواسطة:' : 'By:'}</span> {audit.createdBy}
                          </p>
                          <p className="text-sm text-slate-600 mb-3">
                            <span className="font-semibold text-slate-800">{lang === 'ar' ? 'العناصر:' : 'Items:'}</span> {audit.items.length}
                          </p>
                        </div>
                        <button
                          onClick={() => setActiveAuditId(audit.id)}
                          className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 rounded-lg transition text-sm flex justify-center items-center gap-2 cursor-pointer"
                        >
                          {audit.status === 'Completed' ? (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              {lang === 'ar' ? 'عرض التفاصيل' : 'View Details'}
                            </>
                          ) : (
                            <>
                              <PlayCircle className="w-4 h-4" />
                              {lang === 'ar' ? 'متابعة الجرد' : 'Continue Audit'}
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden flex flex-col sm:flex-row h-auto min-h-[500px]">
              {/* Scanning Panel */}
              {activeAudit.status === 'In Progress' && isSalesPerson && (
                <div className="w-full sm:w-80 bg-slate-50 border-b sm:border-b-0 sm:border-r border-slate-200 p-6 flex flex-col shrink-0">
                  <button 
                    onClick={() => setActiveAuditId(null)}
                    className="text-slate-400 hover:text-slate-600 transition self-start mb-6 font-medium text-sm cursor-pointer"
                  >
                    {lang === 'ar' ? '← رجوع للقائمة' : '← Back to Audits'}
                  </button>

                  <div className="mb-6">
                    <h3 className="font-bold text-slate-800 mb-1 flex items-center gap-2">
                      <Scan className="w-5 h-5 text-blue-600" />
                      {lang === 'ar' ? 'مسح الباركود' : 'Scan Barcode'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {lang === 'ar' ? 'قم بمسح أو إدخال باركود المنتجات لإضافتها لقائمة الجرد الفعلية.' : 'Scan or enter product barcodes to add them to the physical count.'}
                    </p>
                  </div>

                  <form onSubmit={handleScanSubmit} className="flex flex-col gap-3">
                    <div className="relative">
                      <Barcode className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        ref={barcodeInputRef}
                        type="text" 
                        placeholder={lang === 'ar' ? 'الباركود...' : 'Barcode...'}
                        value={scanBarcode}
                        onChange={(e) => setScanBarcode(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl font-mono text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        autoFocus
                      />
                    </div>
                    <button 
                      type="submit"
                      disabled={!scanBarcode.trim()}
                      className="bg-blue-600 disabled:bg-slate-300 disabled:cursor-not-allowed hover:bg-blue-700 text-white py-3 rounded-xl font-bold shadow-xs transition cursor-pointer"
                    >
                      {lang === 'ar' ? 'تسجيل المنتج' : 'Log Item'}
                    </button>
                  </form>
                </div>
              )}

              {/* Table Panel */}
              <div className="flex-1 flex flex-col min-w-0">
                <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white">
                  <div className="flex items-center gap-3">
                    {isAdminOrAccountant && (
                      <button 
                        onClick={() => setActiveAuditId(null)}
                        className="text-slate-400 hover:text-slate-600 transition font-medium text-sm cursor-pointer"
                      >
                        {lang === 'ar' ? '← رجوع' : '← Back'}
                      </button>
                    )}
                    <div>
                      <h2 className="font-bold text-slate-800 text-lg">
                        {isSalesPerson ? (lang === 'ar' ? 'المنتجات المجردة' : 'Scanned Products') : (lang === 'ar' ? 'قائمة الجرد النشطة' : 'Active Audit List')}
                      </h2>
                      <p className="text-xs text-slate-500 font-mono">ID: {activeAudit.id}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64 shrink-0">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder={lang === 'ar' ? 'بحث في القائمة...' : 'Search list...'}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    {isAdminOrAccountant && activeAudit.status === 'In Progress' && (
                      <button 
                        onClick={handleCompleteAudit}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold shadow-xs transition flex items-center gap-2 whitespace-nowrap cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {lang === 'ar' ? 'إنهاء الجرد' : 'Complete Audit'}
                      </button>
                    )}
                  </div>
                </div>
                
                {isAdminOrAccountant && activeAudit.status === 'In Progress' && (
                  <div className="bg-amber-50/90 px-4 py-2.5 border-b border-amber-200 text-xs text-amber-900 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        <strong>{lang === 'ar' ? 'ملاحظة الأدمن:' : 'Admin Note:'}</strong>{' '}
                        {lang === 'ar'
                          ? 'يمكنك إنهاء الجرد في أي وقت. العناصر التي لم يُسجّلها الموظف ستُعتبر تلقائياً مفقودة وتحديث الكمية بالنظام.'
                          : 'Unchecked items will automatically be logged as MISSING and system stock adjusted.'}
                      </span>
                    </div>
                    <span className="font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full border border-amber-300 shrink-0 font-mono text-[11px]">
                      {activeAudit.items.filter(i => i.status === 'Pending').length} {lang === 'ar' ? 'غير مفحوص' : 'Unchecked'}
                    </span>
                  </div>
                )}

                <div className="overflow-x-auto flex-1 bg-white">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 font-semibold">{lang === 'ar' ? 'المنتج' : 'Product'}</th>
                        <th className="px-4 py-3 font-semibold">{lang === 'ar' ? 'الباركود' : 'Barcode'}</th>
                        
                        {!isSalesPerson && (
                          <th className="px-4 py-3 font-semibold text-center">{lang === 'ar' ? 'المتوقع (نظام)' : 'Expected (System)'}</th>
                        )}
                        
                        <th className="px-4 py-3 font-semibold text-center">{lang === 'ar' ? 'الفعلي' : 'Actual'}</th>
                        
                        {!isSalesPerson && (
                          <th className="px-4 py-3 font-semibold text-center">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                        )}

                        {isAdminOrAccountant && activeAudit.status === 'In Progress' && (
                          <th className="px-4 py-3 font-semibold text-right">{lang === 'ar' ? 'تعديل يدوي' : 'Manual Adjust'}</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredAuditItems.map(item => (
                        <tr key={item.productId} className="hover:bg-slate-50/50 transition">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-800">{item.brand}</div>
                            <div className="text-xs text-slate-500 max-w-[150px] truncate">{item.model}</div>
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-600 text-xs">{item.barcode}</td>
                          
                          {!isSalesPerson && (
                            <td className="px-4 py-3 text-center font-bold text-slate-700">{item.expectedQuantity}</td>
                          )}
                          
                          <td className="px-4 py-3 text-center font-bold text-blue-600 text-base">{item.actualQuantity}</td>
                          
                          {!isSalesPerson && (
                            <td className="px-4 py-3 text-center">
                              <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide ${
                                item.status === 'Present' ? 'bg-emerald-100 text-emerald-700' :
                                item.status === 'Missing' ? 'bg-rose-100 text-rose-700' :
                                item.status === 'Extra' ? 'bg-purple-100 text-purple-700' :
                                'bg-slate-100 text-slate-600'
                              }`}>
                                {item.status}
                              </span>
                            </td>
                          )}
                          
                          {isAdminOrAccountant && activeAudit.status === 'In Progress' && (
                            <td className="px-4 py-3 text-right">
                              <div className="flex justify-end items-center gap-1">
                                <button 
                                  onClick={() => onUpdateAuditItem(activeAudit.id, item.productId, 'Present', item.expectedQuantity)}
                                  className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-md transition cursor-pointer"
                                  title="Set as Present"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => onUpdateAuditItem(activeAudit.id, item.productId, 'Missing', 0)}
                                  className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-md transition cursor-pointer"
                                  title="Set as Missing"
                                >
                                  <AlertCircle className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                      {filteredAuditItems.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center py-12 text-slate-400">
                            {isSalesPerson 
                              ? (lang === 'ar' ? 'لم تقم بمسح أي منتجات بعد.' : 'You haven\'t scanned any items yet.')
                              : (lang === 'ar' ? 'لم يتم العثور على منتجات.' : 'No items found.')}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* TAB 2: PO RECONCILIATION REPORT VIEW */}
      {activeModuleTab === 'po_reconciliation' && (
        <div className="space-y-6">
          {/* Summary KPIs Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {lang === 'ar' ? 'إجمالي المخزون بالنظام' : 'Total System Stock'}
                </span>
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">{totalSystemSKUs} <span className="text-sm font-normal text-slate-500">SKUs</span></div>
              <div className="text-xs text-slate-500 mt-1 flex justify-between">
                <span>{totalSystemQty} {lang === 'ar' ? 'قطعة' : 'pcs'}</span>
                <span className="font-bold font-mono text-slate-700">{totalSystemValuation.toFixed(2)} JOD</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                  {lang === 'ar' ? 'مطابق لأوامر الشراء (P.O)' : 'PO-Verified Items'}
                </span>
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-700 font-mono">{verifiedSKUs} <span className="text-sm font-normal text-slate-500">SKUs</span></div>
              <div className="text-xs text-emerald-600 mt-1 font-semibold">
                {totalSystemSKUs > 0 ? ((verifiedSKUs / totalSystemSKUs) * 100).toFixed(1) : 100}% {lang === 'ar' ? 'نسبة المطابقة' : 'Match Rate'}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">
                  {lang === 'ar' ? 'غير مرتبط بأوامر شراء (للحذف)' : 'Orphaned / Unlinked Items'}
                </span>
                <ShieldAlert className="w-5 h-5 text-rose-600" />
              </div>
              <div className="text-2xl font-black text-rose-700 font-mono">{orphanedSKUs} <span className="text-sm font-normal text-rose-500">SKUs</span></div>
              <div className="text-xs text-rose-600 mt-1 flex justify-between font-medium">
                <span>{orphanedQty} {lang === 'ar' ? 'قطعة' : 'pcs'}</span>
                <span className="font-bold font-mono">{orphanedValuation.toFixed(2)} JOD</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                  {lang === 'ar' ? 'اختلاف في الكميات' : 'Qty Discrepancies'}
                </span>
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-amber-700 font-mono">{mismatchSKUs} <span className="text-sm font-normal text-slate-500">SKUs</span></div>
              <div className="text-xs text-slate-500 mt-1">
                {lang === 'ar' ? 'فرق بين أعداد الطلب والمستودع' : 'Discrepancy in recorded quantities'}
              </div>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Filter Pills */}
            <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
              <button
                onClick={() => setReconcileFilter('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  reconcileFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {lang === 'ar' ? 'جميع المنتجات' : 'All Items'} ({comparisonRows.length})
              </button>

              <button
                onClick={() => setReconcileFilter('orphaned')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  reconcileFilter === 'orphaned'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5" />
                {lang === 'ar' ? 'غير مدرج بمشتروات (للحذف)' : 'Orphaned (Need Deletion)'}
                <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-[10px] font-mono">
                  {orphanedSKUs}
                </span>
              </button>

              <button
                onClick={() => setReconcileFilter('verified')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  reconcileFilter === 'verified'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {lang === 'ar' ? 'مطابق لأمر الشراء' : 'PO-Verified'}
                <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full text-[10px] font-mono">
                  {verifiedSKUs}
                </span>
              </button>
            </div>

            {/* Right Controls: Search & Batch Action */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <div className="relative flex-1 md:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={lang === 'ar' ? 'بحث بالباركود أو الماركة...' : 'Search barcode or brand...'}
                  value={reconcileSearch}
                  onChange={(e) => setReconcileSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {isAdminOrAccountant && orphanedSKUs > 0 && onDeleteProductsBatch && (
                <button
                  onClick={() => setShowDeleteBatchModal(true)}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs px-4 py-2.5 rounded-xl font-bold transition shadow-xs flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                  {lang === 'ar' ? 'حذف البضاعة غير المدرجة بالكامل' : 'Batch Delete All Orphaned'}
                </button>
              )}
            </div>
          </div>

          {/* Comparison Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                <ArrowRightLeft className="w-4 h-4 text-blue-600" />
                {lang === 'ar' ? 'مقارنة المخزون الفعلي بالمستودع مقابل أوامر الشراء (P.O Side-by-Side)' : 'System Stock vs P.O. Entries Side-by-Side'}
              </div>
              <span className="text-xs text-slate-500 font-mono">
                {filteredComparisonRows.length} {lang === 'ar' ? 'عنصر معروض' : 'items displayed'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-100 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3.5">{lang === 'ar' ? 'الباركود والمنتج' : 'Barcode & Product'}</th>
                    <th className="px-4 py-3.5 bg-blue-50/50 text-blue-900 border-l border-r border-blue-100">
                      <div className="flex items-center gap-1">
                        <Package className="w-3.5 h-3.5 text-blue-600" />
                        {lang === 'ar' ? 'مخزون النظام الحالي' : 'Current System Stock'}
                      </div>
                    </th>
                    <th className="px-4 py-3.5 bg-purple-50/50 text-purple-900 border-r border-purple-100">
                      <div className="flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-purple-600" />
                        {lang === 'ar' ? 'سجل أمر الشراء (P.O)' : 'P.O. Entry Record'}
                      </div>
                    </th>
                    <th className="px-4 py-3.5 text-center">{lang === 'ar' ? 'حالة المطابقة' : 'Reconciliation Status'}</th>
                    {isAdminOrAccountant && (
                      <th className="px-4 py-3.5 text-right">{lang === 'ar' ? 'إجراء' : 'Action'}</th>
                    )}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredComparisonRows.map((row) => {
                    const p = row.product;
                    const po = row.poEntry;

                    return (
                      <tr key={p.id} className={`hover:bg-slate-50 transition ${row.isOrphaned ? 'bg-rose-50/20' : ''}`}>
                        {/* Product Info */}
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900 font-mono">{p.barcode}</div>
                          <div className="text-slate-700 font-semibold">{p.brand} <span className="text-slate-400 font-normal">| {p.model}</span></div>
                          <div className="text-[10px] text-slate-400">{p.description || p.frameType || 'Optical Item'}</div>
                        </td>

                        {/* System Stock */}
                        <td className="px-4 py-3 bg-blue-50/20 border-l border-r border-blue-50">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm font-mono">{p.currentQuantity}</span>
                            <span className="text-slate-500 text-[11px]">{lang === 'ar' ? 'قطعة' : 'pcs'}</span>
                          </div>
                          <div className="text-[11px] text-slate-600 mt-0.5">
                            Cost: <span className="font-mono font-semibold">{p.purchaseCost} JOD</span>
                          </div>
                          <div className="text-[10px] text-blue-700 font-mono font-bold">
                            Total: {(p.currentQuantity * p.purchaseCost).toFixed(2)} JOD
                          </div>
                        </td>

                        {/* PO Entry */}
                        <td className="px-4 py-3 bg-purple-50/20 border-r border-purple-50">
                          {po ? (
                            <div>
                              <div className="font-bold text-purple-900 font-mono">{po.poNumber}</div>
                              <div className="text-slate-700 text-[11px]">{po.supplierName}</div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                Qty Ordered: <strong>{po.quantity}</strong> | Price: <strong>{po.unitPrice} JOD</strong>
                              </div>
                            </div>
                          ) : (
                            <div className="text-rose-500 font-semibold italic text-[11px] flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5" />
                              {lang === 'ar' ? 'غير موجود بأي أمر شراء' : 'No P.O. Entry Found'}
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3 text-center">
                          {row.status === 'verified' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {lang === 'ar' ? 'مطابق لأمر الشراء' : 'Verified in PO'}
                            </span>
                          )}

                          {row.status === 'orphaned' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                              {lang === 'ar' ? 'غير مدرج (يلزم الحذف)' : 'Orphaned (Delete Required)'}
                            </span>
                          )}

                          {row.status === 'mismatch' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              {lang === 'ar' ? 'اختلاف بالكمية' : 'Qty Discrepancy'}
                            </span>
                          )}
                        </td>

                        {/* Action */}
                        {isAdminOrAccountant && (
                          <td className="px-4 py-3 text-right">
                            {row.isOrphaned && onDeleteProduct ? (
                              <button
                                onClick={() => setSingleToDelete(p)}
                                className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition cursor-pointer border border-rose-200"
                                title={lang === 'ar' ? 'حذف هذا المنتج' : 'Delete Orphaned Product'}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            ) : (
                              <span className="text-slate-300 text-xs">—</span>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}

                  {filteredComparisonRows.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-slate-400">
                        {lang === 'ar' ? 'لا يوجد نتائج تطابق البحث أو الفلتر.' : 'No items match your search/filter criteria.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
