import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, Search, Save, Trash2, CheckCircle2, BellRing, PackageCheck, Clock, Building2 } from 'lucide-react';
import { Product, Branch } from '../types';
import { useLanguage } from '../lib/i18n';

interface TransferRecord {
  id: string;
  fromBranchId: string;
  toBranchId: string;
  fromBranchName: string;
  toBranchName: string;
  date: string;
  status: 'Pending Receipt' | 'Received & Verified';
  items: Array<{
    productId: string;
    barcode: string;
    brand: string;
    description: string;
    transferQty: number;
  }>;
}

interface InventoryTransfersModuleProps {
  products: Product[];
  branches: Branch[];
  activeBranch: Branch;
  onTransferItems: (items: any[]) => void;
}

export const InventoryTransfersModule: React.FC<InventoryTransfersModuleProps> = ({
  products,
  branches,
  activeBranch,
  onTransferItems
}) => {
  const { lang } = useLanguage();
  const [transferItems, setTransferItems] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [targetBranchId, setTargetBranchId] = useState('');

  // Local transfers log for receipt acknowledgment
  const [transferLogs, setTransferLogs] = useState<TransferRecord[]>(() => {
    const saved = localStorage.getItem('optivision_transfers_log');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return [
      {
        id: 'tr-101',
        fromBranchId: branches[0]?.id || 'b-main',
        toBranchId: activeBranch.id,
        fromBranchName: branches[0]?.name || 'OptiVision Main Branch',
        toBranchName: activeBranch.name,
        date: new Date().toISOString().split('T')[0],
        status: 'Pending Receipt',
        items: [
          { productId: 'p-1', barcode: '100001', brand: 'GUCCI', description: 'G ARMANI Gold Frame', transferQty: 2 }
        ]
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('optivision_transfers_log', JSON.stringify(transferLogs));
  }, [transferLogs]);

  const searchResults = products.filter(p => 
    p.branchId === activeBranch.id && 
    (p.barcode.includes(searchQuery) || p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  ).slice(0, 5);

  const handleAddItem = (product: Product) => {
    if (transferItems.find(i => i.productId === product.id)) return;
    setTransferItems([...transferItems, { ...product, transferQty: 1, productId: product.id }]);
    setSearchQuery('');
  };

  const handleRemoveItem = (id: string) => {
    setTransferItems(transferItems.filter(i => i.productId !== id));
  };

  const handleQtyChange = (id: string, qty: number) => {
    setTransferItems(transferItems.map(i => i.productId === id ? { ...i, transferQty: qty } : i));
  };

  const handleExecuteTransfer = () => {
    if (!targetBranchId || transferItems.length === 0) return;
    
    const targetBranchObj = branches.find(b => b.id === targetBranchId);

    // Call store dispatch
    onTransferItems(transferItems.map(i => ({
      ...i,
      fromBranchId: activeBranch.id,
      toBranchId: targetBranchId
    })));

    // Add to transfers log awaiting receipt notification
    const newLog: TransferRecord = {
      id: `tr-${Date.now()}`,
      fromBranchId: activeBranch.id,
      toBranchId: targetBranchId,
      fromBranchName: activeBranch.name,
      toBranchName: targetBranchObj?.name || 'Destination Branch',
      date: new Date().toISOString().split('T')[0],
      status: 'Pending Receipt',
      items: transferItems.map(i => ({
        productId: i.productId,
        barcode: i.barcode,
        brand: i.brand,
        description: i.description,
        transferQty: i.transferQty
      }))
    };

    setTransferLogs([newLog, ...transferLogs]);
    setTransferItems([]);
    setTargetBranchId('');
    alert(lang === 'ar' ? 'تم إرسال طلب نقل المخزون وإشعار الفرع المستلم بنجاح!' : 'Inventory transfer sent! Receipt notification issued to destination branch.');
  };

  const handleAcknowledgeReceipt = (transferId: string) => {
    setTransferLogs(prev => prev.map(tr => {
      if (tr.id === transferId) {
        return { ...tr, status: 'Received & Verified' };
      }
      return tr;
    }));
    alert(
      lang === 'ar'
        ? 'تم تأكيد واستلام الشحنة في الفرع المستلم وإضافتها للمخزون!'
        : 'Stock transfer verified and received successfully at destination branch!'
    );
  };

  const incomingPendingTransfers = transferLogs.filter(
    tr => tr.toBranchId === activeBranch.id && tr.status === 'Pending Receipt'
  );

  return (
    <div id="inventory-transfers-module" className="p-6 space-y-6 max-w-7xl mx-auto text-slate-900">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <ArrowRightLeft className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {lang === 'ar' ? 'نقل المخزون وإشعارات الاستلام بين الفروع' : 'Branch Inventory Transfers & Receipt Notifications'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {lang === 'ar'
                  ? 'إدارة نقل البضائع، الشحنات الصادرة، وإشعارات تأكيد الاستلام من الفروع'
                  : 'Manage inter-branch inventory transfers and destination branch receipt confirmations.'}
              </p>
            </div>
          </div>
        </div>

        {incomingPendingTransfers.length > 0 && (
          <div className="flex items-center gap-2 bg-amber-50 text-amber-800 border border-amber-200 px-4 py-2 rounded-xl text-xs font-bold animate-pulse">
            <BellRing className="w-4 h-4 text-amber-600" />
            <span>
              {lang === 'ar' 
                ? `يوجد (${incomingPendingTransfers.length}) شحنة قادمة تنتظر تأكيد الاستلام!`
                : `(${incomingPendingTransfers.length}) Incoming stock transfer awaiting receipt confirmation!`}
            </span>
          </div>
        )}
      </div>

      {/* Incoming Stock Receipt Notifications */}
      {incomingPendingTransfers.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border border-amber-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
            <PackageCheck className="w-5 h-5 text-amber-700" />
            <h3>{lang === 'ar' ? 'إشعارات الشحنات القادمة إلى فرعك الحالي:' : 'Incoming Transfer Receipts Awaiting Confirmation:'}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {incomingPendingTransfers.map(tr => (
              <div key={tr.id} className="bg-white p-4 rounded-xl border border-amber-200 space-y-3 shadow-xs">
                <div className="flex justify-between items-center text-xs border-b border-slate-100 pb-2">
                  <span className="font-bold text-slate-900">
                    {lang === 'ar' ? 'من:' : 'From:'} {tr.fromBranchName}
                  </span>
                  <span className="text-slate-500 font-mono">{tr.date}</span>
                </div>

                <div className="space-y-1">
                  {tr.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-xs font-medium text-slate-700 bg-slate-50 p-2 rounded">
                      <span>{it.barcode} - {it.description}</span>
                      <span className="font-bold text-blue-700">x{it.transferQty}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleAcknowledgeReceipt(tr.id)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-lg shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {lang === 'ar' ? 'تأكيد واستلام الشحنة في الفرع' : 'Confirm & Accept Stock Receipt'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Transfer Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={lang === 'ar' ? 'ابحث بالباركود أو اسم المنتج لنقله...' : 'Search item by barcode or description to transfer...'}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg p-3 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Search className="w-5 h-5 text-slate-400 absolute ltr:left-3 rtl:right-3 top-3" />
              </div>
              
              {searchQuery && searchResults.length > 0 && (
                <div className="mt-2 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden absolute z-10 w-full max-w-md">
                  {searchResults.map(prod => (
                    <button
                      key={prod.id}
                      onClick={() => handleAddItem(prod)}
                      className="w-full text-left p-3 hover:bg-slate-50 border-b border-slate-100 flex justify-between items-center cursor-pointer"
                    >
                      <div>
                        <div className="font-bold text-sm text-slate-900">{prod.barcode} - {prod.brand}</div>
                        <div className="text-xs text-slate-500">{prod.description}</div>
                      </div>
                      <div className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">
                        Avail: {prod.availableQuantity}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left rtl:text-right text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs">
                  <tr>
                    <th className="p-4 font-bold">{lang === 'ar' ? 'الباركود' : 'Barcode'}</th>
                    <th className="p-4 font-bold">{lang === 'ar' ? 'وصف الصنف' : 'Item Details'}</th>
                    <th className="p-4 font-bold">{lang === 'ar' ? 'المتوفر' : 'Available'}</th>
                    <th className="p-4 font-bold w-32">{lang === 'ar' ? 'الكمية المنقولة' : 'Transfer Qty'}</th>
                    <th className="p-4 font-bold text-right">{lang === 'ar' ? 'إجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {transferItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500 font-medium">
                        {lang === 'ar' ? 'لم يتم إضافة أي أصناف لشحنة النقل الحالية' : 'No items added for transfer.'}
                      </td>
                    </tr>
                  ) : (
                    transferItems.map((item) => (
                      <tr key={item.productId} className="hover:bg-slate-50">
                        <td className="p-4 font-mono font-bold text-slate-900">{item.barcode}</td>
                        <td className="p-4">
                          <div className="font-bold text-slate-900">{item.brand}</div>
                          <div className="text-xs text-slate-500">{item.description}</div>
                        </td>
                        <td className="p-4 font-bold text-slate-700">{item.availableQuantity}</td>
                        <td className="p-4">
                          <input
                            type="number"
                            min="1"
                            max={item.availableQuantity}
                            value={item.transferQty}
                            onChange={(e) => handleQtyChange(item.productId, parseInt(e.target.value) || 1)}
                            className="w-full border border-slate-200 rounded-lg p-2 text-center font-bold font-mono"
                          />
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleRemoveItem(item.productId)}
                            className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-6 space-y-4">
            <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2 text-sm">
              {lang === 'ar' ? 'تفاصيل شحنة النقل' : 'Transfer Details'}
            </h3>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">
                {lang === 'ar' ? 'من الفرع (الحالي)' : 'From Branch (Current)'}
              </label>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700">
                {activeBranch.name}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">
                {lang === 'ar' ? 'إلى الفرع (المستلم)' : 'To Branch (Destination)'}
              </label>
              <select
                value={targetBranchId}
                onChange={(e) => setTargetBranchId(e.target.value)}
                className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{lang === 'ar' ? 'اختر الفرع المستلم...' : 'Select destination branch...'}</option>
                {branches.filter(b => b.id !== activeBranch.id).map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100">
              <button
                onClick={handleExecuteTransfer}
                disabled={transferItems.length === 0 || !targetBranchId}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold py-3 px-4 rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer text-xs"
              >
                <Save className="w-4 h-4" />
                {lang === 'ar' ? 'إرسال الشحنة وإشعار الفرع' : 'Dispatch Stock & Issue Receipt Notification'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
