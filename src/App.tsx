import React, { useState, useEffect } from 'react';
import { useERPStore } from './lib/erpStore';
import { useLanguage } from './lib/i18n';
import { HeaderNavbar } from './components/HeaderNavbar';
import { Sidebar, ERPTab } from './components/Sidebar';
import { DashboardModule } from './components/DashboardModule';
import { StockImportModule } from './components/StockImportModule';
import { ProductDatabaseModule } from './components/ProductDatabaseModule';
import { SalesInvoiceModule } from './components/SalesInvoiceModule';
import { Customer360Module } from './components/Customer360Module';
import { LaboratoryModule } from './components/LaboratoryModule';
import { CallCenterModule } from './components/CallCenterModule';
import { BranchCashModule } from './components/BranchCashModule';
import { SuppliersModule } from './components/SuppliersModule';
import { UserManagementModule } from './components/UserManagementModule';
import { InventoryAuditModule } from './components/InventoryAuditModule';
import { InventoryTransfersModule } from './components/InventoryTransfersModule';
import { AccountantReportsModule } from './components/AccountantReportsModule';
import { POSTabletLauncher } from './components/POSTabletLauncher';
import { Search, Glasses, User, Receipt, X } from 'lucide-react';

export default function App() {
  const store = useERPStore();
  const [activeTab, setActiveTab] = useState<ERPTab>('dashboard');
  const [invoiceToEdit, setInvoiceToEdit] = useState<any>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Role permissions routing check
  const allowedTabsByRole: Record<string, ERPTab[]> = {
    admin: ['launcher', 'dashboard', 'branch_performance', 'import', 'products', 'audit', 'transfers', 'pos', 'customers', 'laboratory', 'call_center', 'cash', 'suppliers', 'reports', 'users'],
    accountant: ['launcher', 'dashboard', 'import', 'products', 'audit', 'transfers', 'pos', 'cash', 'suppliers', 'reports'],
    sales_person: ['launcher', 'pos', 'customers', 'products', 'cash', 'audit'],
    call_center: ['launcher', 'call_center', 'customers'],
    lab_tech: ['launcher', 'laboratory', 'customers'],
  };

  useEffect(() => {
    const allowed = allowedTabsByRole[store.currentUser.role] || allowedTabsByRole.admin;
    if (!allowed.includes(activeTab)) {
      setActiveTab(allowed[0]);
    }
  }, [store.currentUser.id, store.currentUser.role]);

  const pendingCallsCount = store.callReminders.filter((c) => c.status === 'Pending').length;
  const labJobsCount = store.labJobs.filter((j) => j.status !== 'Delivered').length;
  const lowStockCount = store.products.filter(
    (p) => p.branchId === store.activeBranchId && p.currentQuantity <= p.minimumStock
  ).length;

  // Search Results
  const searchResultsProducts = searchQuery.trim()
    ? store.products.filter(
        (p) =>
          p.barcode.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.model.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const searchResultsCustomers = searchQuery.trim()
    ? store.customers.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.phone.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const searchResultsInvoices = searchQuery.trim()
    ? store.invoices.filter(
        (i) =>
          i.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          i.customerName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const { lang, dir } = useLanguage();

  return (
    <div
      dir={dir}
      className={`min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col antialiased ${
        lang === 'ar' ? 'rtl-app' : ''
      }`}
    >
      {/* Top Navbar */}
      <HeaderNavbar
        branches={store.branches}
        activeBranch={store.activeBranch}
        onSelectBranch={store.setActiveBranchId}
        pendingCallsCount={pendingCallsCount}
        labJobsCount={labJobsCount}
        lowStockCount={lowStockCount}
        users={store.users}
        currentUser={store.currentUser}
        onSwitchUser={store.setCurrentUserId}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenUsers={() => setActiveTab('users')}
        onPurgeDatabase={store.purgeDatabase}
        isFirestoreConnected={store.isFirestoreConnected}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          pendingCallsCount={pendingCallsCount}
          labJobsCount={labJobsCount}
          currentUser={store.currentUser}
        />

        {/* Dynamic Workspace Panel */}
        <main className="flex-1 overflow-y-auto bg-slate-50 pb-12">
          {/* Top Return Banner inside sales modules */}
          {activeTab !== 'launcher' &&
            (store.currentUser?.role === 'sales_person' ||
              ['pos', 'customers', 'products', 'cash', 'audit'].includes(activeTab)) && (
              <POSTabletLauncher
                activeTab={activeTab}
                onSelectTab={setActiveTab}
                currentUser={store.currentUser}
                activeBranch={store.activeBranch}
              />
            )}

          {/* Full Screen Touch Hub Launcher */}
          {activeTab === 'launcher' && (
            <POSTabletLauncher
              activeTab={activeTab}
              onSelectTab={setActiveTab}
              currentUser={store.currentUser}
              activeBranch={store.activeBranch}
            />
          )}
          {activeTab === 'dashboard' && (
            <DashboardModule
              branches={store.branches}
              activeBranch={store.activeBranch}
              products={store.products}
              onEditFullInvoice={(inv) => { setInvoiceToEdit(inv); setActiveTab('sales'); }}
              invoices={store.invoices}
              callReminders={store.callReminders}
              labJobs={store.labJobs}
              onNavigateTab={setActiveTab}
              onSelectBranch={store.setActiveBranchId}
              initialSubTab="overview"
            />
          )}

          {activeTab === 'branch_performance' && (
            <DashboardModule
              branches={store.branches}
              activeBranch={store.activeBranch}
              products={store.products}
              invoices={store.invoices}
              callReminders={store.callReminders}
              labJobs={store.labJobs}
              onNavigateTab={setActiveTab}
              onSelectBranch={store.setActiveBranchId}
              initialSubTab="branch_performance"
            />
          )}

          {activeTab === 'import' && (
            <StockImportModule
              branches={store.branches}
              activeBranch={store.activeBranch}
              products={store.products}
              importLogs={store.importLogs}
              onExecuteImport={store.importExcelStock}
            />
          )}

          {activeTab === 'products' && (
            <ProductDatabaseModule
              products={store.products}
              branches={store.branches}
              activeBranch={store.activeBranch}
              onSaveProduct={store.saveProduct}
              currentUser={store.currentUser}
            />
          )}

          {activeTab === 'audit' && (
            <InventoryAuditModule
              audits={store.inventoryAudits || []}
              branches={store.branches}
              activeBranch={store.activeBranch}
              currentUser={store.currentUser}
              products={store.products}
              purchaseOrders={store.purchaseOrders}
              onCreateAudit={store.createInventoryAudit}
              onUpdateAuditItem={store.updateInventoryAuditItem}
              onScanAuditItem={store.scanInventoryAuditItem}
              onCompleteAudit={store.completeInventoryAudit}
              onDeleteProduct={store.deleteProduct}
              onDeleteProductsBatch={store.deleteProductsBatch}
            />
          )}

          {activeTab === 'transfers' && (
            <InventoryTransfersModule
              products={store.products}
              branches={store.branches}
              activeBranch={store.activeBranch}
              onTransferItems={store.transferInventoryItems}
            />
          )}

          {activeTab === 'pos' && (
            <SalesInvoiceModule
              branches={store.branches}
              activeBranch={store.activeBranch}
              products={store.products}
              customers={store.customers}
              invoices={store.invoices}
              invoiceToEdit={invoiceToEdit}
              onClearEdit={() => setInvoiceToEdit(null)}
              onUpdateInvoice={store.updateInvoice}
              onCreateInvoice={store.createInvoice}
              onDeleteInvoice={store.deleteInvoice}
              onSettlePayment={store.settleInvoicePayment}
              onUpdateDeliveryStatus={store.updateDeliveryStatus}
              onSaveCustomer={store.saveCustomer}
              currentUser={store.currentUser}
              users={store.users}
            />
          )}

          {activeTab === 'customers' && (
            <Customer360Module
              customers={store.customers}
              invoices={store.invoices}
              callReminders={store.callReminders}
              labJobs={store.labJobs}
              branches={store.branches}
              activeBranch={store.activeBranch}
              currentUser={store.currentUser}
              onSaveCustomer={store.saveCustomer}
              onDeleteCustomer={store.deleteCustomer}
              onSettlePayment={store.settleInvoicePayment}
            />
          )}

          {activeTab === 'laboratory' && (
            <LaboratoryModule
              labJobs={store.labJobs}
              branches={store.branches}
              activeBranch={store.activeBranch}
              invoices={store.invoices}
              onUpdateJobStatus={store.updateLabJobStatus}
              onDeleteJob={store.deleteLabJob}
            />
          )}

          {activeTab === 'call_center' && (
            <CallCenterModule
              callReminders={store.callReminders}
              branches={store.branches}
              activeBranch={store.activeBranch}
              onUpdateCallStatus={store.updateCallStatus}
            />
          )}

          {activeTab === 'cash' && (
            <BranchCashModule
              cashClosings={store.cashClosings}
              branches={store.branches}
              activeBranch={store.activeBranch}
              invoices={store.invoices}
              currentUser={store.currentUser}
              users={store.users}
              onRecordCashClosing={store.recordCashClosing}
            />
          )}

          {activeTab === 'suppliers' && (
            <SuppliersModule 
              suppliers={store.suppliers} 
              products={store.products}
              onSaveSupplier={store.saveSupplier}
              purchaseOrders={store.purchaseOrders}
              onSavePurchaseOrder={store.savePurchaseOrder}
              onSaveProduct={store.saveProduct}
            />
          )}

          {activeTab === 'reports' && (
            <AccountantReportsModule
              onEditFullInvoice={(inv) => { setInvoiceToEdit(inv); setActiveTab('pos'); }}
              invoices={store.invoices}
              suppliers={store.suppliers}
              purchaseOrders={store.purchaseOrders}
              cashClosings={store.cashClosings}
              onUpdatePurchaseOrderStatus={store.updatePurchaseOrderStatus}
              onDeletePurchaseOrder={store.deletePurchaseOrder}
              onUpdatePurchaseOrder={store.updatePurchaseOrder}
              onDeleteCashClosing={store.deleteCashClosing}
              onUpdateCashClosing={store.updateCashClosing}
              onDeleteInvoice={store.deleteInvoice}
              branches={store.branches}
              activeBranch={store.activeBranch}
              currentUser={store.currentUser}
              onUpdateInvoice={store.updateInvoice}
              onApproveCashHandover={store.approveCashHandover}
              customers={store.customers}
              onBackupSystemData={store.backupSystemData}
            />
          )}

          {activeTab === 'users' && (
            <UserManagementModule
              users={store.users}
              branches={store.branches}
              products={store.products}
              currentUser={store.currentUser}
              onSaveUser={store.saveUserAccount}
              onToggleUserStatus={store.toggleUserStatus}
              onDeleteUser={store.deleteUserAccount}
              onSwitchUser={store.setCurrentUserId}
              onSaveBranch={store.saveBranch}
              onDeleteBranch={store.deleteBranch}
              onPurgeDatabase={store.purgeDatabase}
              onBackupSystemData={store.backupSystemData}
              onRestoreSystemData={store.restoreSystemData}
            />
          )}
        </main>
      </div>

      {/* Global Search Shortcut Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center pt-16 p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-2xl w-full p-5 space-y-4 shadow-xl text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 flex-1">
                <Search className="w-5 h-5 text-blue-600" />
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type to search Barcode (100001), Customer Name, Phone, or Invoice #"
                  className="w-full bg-transparent text-slate-900 text-sm focus:outline-none placeholder-slate-400 font-medium"
                />
              </div>
              <button
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchQuery('');
                }}
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Results Grid */}
            <div className="max-h-96 overflow-y-auto space-y-4 text-xs">
              {/* Products */}
              {searchResultsProducts.length > 0 && (
                <div className="space-y-2">
                  <span className="font-bold text-blue-700 uppercase text-[10px] tracking-wider block">
                    Frames & Products ({searchResultsProducts.length})
                  </span>
                  {searchResultsProducts.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        setIsSearchOpen(false);
                        setActiveTab('products');
                      }}
                      className="p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer flex justify-between items-center transition"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{p.brand} - {p.model}</div>
                        <div className="text-[10px] text-slate-500">Barcode: #{p.barcode} • {p.frameType}</div>
                      </div>
                      <span className="font-bold font-mono text-emerald-700">{p.sellingPrice} JOD</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Customers */}
              {searchResultsCustomers.length > 0 && (
                <div className="space-y-2">
                  <span className="font-bold text-purple-700 uppercase text-[10px] tracking-wider block">
                    Customers ({searchResultsCustomers.length})
                  </span>
                  {searchResultsCustomers.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => {
                        setIsSearchOpen(false);
                        setActiveTab('customers');
                      }}
                      className="p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer flex justify-between items-center transition"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{c.name}</div>
                        <div className="text-[10px] text-slate-500">Phone: {c.phone}</div>
                      </div>
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                        {c.membershipLevel}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Invoices */}
              {searchResultsInvoices.length > 0 && (
                <div className="space-y-2">
                  <span className="font-bold text-emerald-700 uppercase text-[10px] tracking-wider block">
                    Invoices ({searchResultsInvoices.length})
                  </span>
                  {searchResultsInvoices.map((inv) => (
                    <div
                      key={inv.id}
                      onClick={() => {
                        setIsSearchOpen(false);
                        setActiveTab('pos');
                      }}
                      className="p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer flex justify-between items-center transition"
                    >
                      <div>
                        <div className="font-bold font-mono text-blue-700">{inv.invoiceNumber}</div>
                        <div className="text-[10px] text-slate-600">{inv.customerName} ({inv.customerPhone})</div>
                      </div>
                      <span className="font-bold font-mono text-slate-900">{inv.grandTotal} JOD</span>
                    </div>
                  ))}
                </div>
              )}

              {searchQuery &&
                searchResultsProducts.length === 0 &&
                searchResultsCustomers.length === 0 &&
                searchResultsInvoices.length === 0 && (
                  <p className="text-slate-400 text-center py-6">No matching barcodes, customers, or invoices found.</p>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
