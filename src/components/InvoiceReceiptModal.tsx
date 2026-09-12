import React from 'react';
import { X, Printer, CheckCircle2, Building2, User, Phone, Calendar, ShieldCheck, Tag } from 'lucide-react';
import { Invoice, Branch } from '../types';
import { useLanguage } from '../lib/i18n';

interface InvoiceReceiptModalProps {
  invoice: Invoice;
  branches?: Branch[];
  activeBranch?: Branch;
  onClose: () => void;
}

export const InvoiceReceiptModal: React.FC<InvoiceReceiptModalProps> = ({
  invoice,
  branches = [],
  activeBranch,
  onClose,
}) => {
  const { lang } = useLanguage();

  // Find owner branch for this invoice
  const ownerBranch = branches.find((b) => b.id === invoice.branchId) || activeBranch || {
    id: invoice.branchId || 'b-main',
    name: 'OptiVision Optical Center',
    code: 'HQ',
    address: 'Main Street, Amman, Jordan',
    phone: '+962 6 500 0000',
  };

  const handlePrint = () => {
    const printableArea = document.querySelector('.printable-invoice');
    if (!printableArea) {
      console.error('Printable area not found');
      return;
    }

    // Ensure portal exists at root level
    let portal = document.getElementById('direct-print-portal');
    if (!portal) {
      portal = document.createElement('div');
      portal.id = 'direct-print-portal';
      document.body.appendChild(portal);
    }

    // Set portal content to the exact invoice layout
    // Use slightly larger font sizes/padding for standard receipt look if needed
    portal.innerHTML = `
      <div style="font-family: 'Cairo', sans-serif; padding: 20px;">
        ${printableArea.innerHTML}
      </div>
    `;

    // Trigger standard browser print. The @media print in index.css will hide #root 
    // and only show #direct-print-portal
    setTimeout(() => {
      window.print();
      
      // Cleanup after print dialog closes
      setTimeout(() => {
        portal.innerHTML = '';
      }, 500);
    }, 100);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative bg-white text-slate-900 rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 font-sans max-h-[92vh] overflow-y-auto">
        
        {/* Printable Area Wrapper */}
        <div className="printable-invoice space-y-6 bg-white p-2 sm:p-4 rounded-xl">
          {/* Header */}
          <div className="text-center border-b border-slate-200 pb-4 space-y-1">
            <div className="flex items-center justify-center gap-2 text-blue-600 font-bold mb-1">
              <Building2 className="w-5 h-5" />
              <span className="text-lg tracking-wider uppercase font-black">OptiVision Enterprise ERP</span>
            </div>
            <h3 className="text-xl font-extrabold tracking-tight uppercase text-slate-900">
              {ownerBranch.name}
            </h3>
            <p className="text-xs text-slate-600 font-medium">
              {ownerBranch.address} • Tel: {ownerBranch.phone}
            </p>

            <div className="pt-3 flex flex-wrap items-center justify-between text-xs font-mono font-bold text-slate-900 border-t border-slate-100 mt-2">
              <span className="bg-slate-100 px-2.5 py-1 rounded border border-slate-200 text-blue-700">
                {lang === 'ar' ? 'فاتورة رقم:' : 'INVOICE #:'} {invoice.invoiceNumber}
              </span>
              <span className="text-slate-600">
                {lang === 'ar' ? 'التاريخ:' : 'DATE:'} {invoice.invoiceDate}
              </span>
            </div>
          </div>

          {/* Customer & Staff Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="space-y-1">
              <span className="font-bold block text-slate-500 uppercase text-[10px] flex items-center gap-1">
                <User className="w-3 h-3 text-blue-600" />
                {lang === 'ar' ? 'معلومات العميل المستلم' : 'Customer / Recipient Info'}
              </span>
              <div className="font-bold text-slate-900 text-sm">{invoice.customerName}</div>
              <div className="text-slate-600 font-mono flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400" />
                {invoice.customerPhone}
              </div>
            </div>

            <div className="space-y-1 sm:text-right rtl:sm:text-left">
              <span className="font-bold block text-slate-500 uppercase text-[10px]">
                {lang === 'ar' ? 'موظف المبيعات والتسليم' : 'Sales & Pickup Info'}
              </span>
              <div className="font-semibold text-slate-800">
                {lang === 'ar' ? 'الموظف المسوؤل:' : 'Staff:'} {invoice.salesEmployee || 'Optical Staff'}
              </div>
              <div className="text-slate-600 font-medium flex items-center sm:justify-end rtl:sm:justify-start gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                {lang === 'ar' ? 'موعد استلام النظارة:' : 'Target Pickup:'} {invoice.deliveryDate}
              </div>
            </div>
          </div>

          {/* Prescription Record Matrix */}
          <div className="border border-slate-200 rounded-xl p-3 text-xs space-y-2 bg-slate-50">
            <div className="font-bold text-[10px] uppercase text-slate-500 flex items-center justify-between">
              <span>{lang === 'ar' ? 'سجل الفحص البصري والوصفة الطبية (Rx)' : 'Optical Prescription Record (Rx)'}</span>
              {invoice.prescription?.optometristName && (
                <span className="text-blue-700 font-medium">
                  {lang === 'ar' ? 'أخصائي الفحص:' : 'Optometrist:'} {invoice.prescription.optometristName}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-center font-mono text-[11px]">
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="font-bold block text-blue-800 font-sans mb-0.5">
                  {lang === 'ar' ? 'العين اليمنى (OD)' : 'RIGHT EYE (OD)'}
                </span>
                {lang === 'ar' ? 'كروي (SPH):' : 'SPH:'} <span className="font-bold">{invoice.prescription?.rightEye?.sph || '0.00'}</span> | {lang === 'ar' ? 'انحراف (CYL):' : 'CYL:'} {invoice.prescription?.rightEye?.cyl || '0.00'} | {lang === 'ar' ? 'المحور (AXIS):' : 'AXIS:'} {invoice.prescription?.rightEye?.axis || '0'}°
              </div>

              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="font-bold block text-blue-800 font-sans mb-0.5">
                  {lang === 'ar' ? 'العين اليسرى (OS)' : 'LEFT EYE (OS)'}
                </span>
                {lang === 'ar' ? 'كروي (SPH):' : 'SPH:'} <span className="font-bold">{invoice.prescription?.leftEye?.sph || '0.00'}</span> | {lang === 'ar' ? 'انحراف (CYL):' : 'CYL:'} {invoice.prescription?.leftEye?.cyl || '0.00'} | {lang === 'ar' ? 'المحور (AXIS):' : 'AXIS:'} {invoice.prescription?.leftEye?.axis || '0'}°
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-slate-600 pt-1 px-1">
              <span>{lang === 'ar' ? 'الإضافة القريبة (ADD):' : 'ADD:'} {invoice.prescription?.add || '0.00'}</span>
              <span>{lang === 'ar' ? 'مسافة الرؤية (DIS):' : 'DIS:'} {invoice.prescription?.dis || '64'}</span>
              <span>{lang === 'ar' ? 'مسافة الحدقتين (IPD):' : 'IPD:'} {invoice.prescription?.ipd || '64mm'}</span>
            </div>
          </div>

          {/* Items & Products Purchased */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs text-slate-800">
              <thead className="bg-slate-100 uppercase font-bold text-[10px] text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="p-2.5">{lang === 'ar' ? 'الباركود' : 'Barcode'}</th>
                  <th className="p-2.5">{lang === 'ar' ? 'الصنف / الوصف' : 'Description'}</th>
                  <th className="p-2.5 text-right">{lang === 'ar' ? 'الكمية' : 'Qty'}</th>
                  <th className="p-2.5 text-right">{lang === 'ar' ? 'السعر' : 'Price'}</th>
                  <th className="p-2.5 text-right">{lang === 'ar' ? 'المجموع' : 'Total'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px] font-mono">
                {invoice.items.map((it, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="p-2.5 font-bold text-blue-700">{it.barcode || 'N/A'}</td>
                    <td className="p-2.5 font-sans font-semibold text-slate-900">{it.description}</td>
                    <td className="p-2.5 text-right font-bold">{it.quantity}</td>
                    <td className="p-2.5 text-right">{it.price.toFixed(2)} JOD</td>
                    <td className="p-2.5 text-right font-bold text-slate-900">{it.total.toFixed(2)} JOD</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals & Financial Ledger */}
          <div className="border-t border-slate-200 pt-3 space-y-1.5 font-mono text-xs text-slate-700 bg-slate-50/70 p-3.5 rounded-xl border">
            <div className="flex justify-between font-medium">
              <span className="font-sans">{lang === 'ar' ? 'المجموع الفرعي:' : 'Subtotal:'}</span>
              <span>{invoice.subtotal.toFixed(2)} JOD</span>
            </div>

            {invoice.discount > 0 && (
              <div className="flex justify-between font-medium text-amber-700">
                <span className="font-sans">{lang === 'ar' ? 'الخصم المعتمد:' : 'Discount Applied:'}</span>
                <span>-{invoice.discount.toFixed(2)} JOD</span>
              </div>
            )}

            {invoice.tax > 0 && (
              <div className="flex justify-between text-slate-500">
                <span className="font-sans">
                  {lang === 'ar' ? 'ضريبة المبيعات (16%):' : 'Sales Tax (16%):'}
                </span>
                <span>{invoice.tax.toFixed(2)} JOD</span>
              </div>
            )}

            <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-1 border-t border-slate-200">
              <span className="font-sans">{lang === 'ar' ? 'المبلغ الإجمالي:' : 'GRAND TOTAL:'}</span>
              <span>{invoice.grandTotal.toFixed(2)} JOD</span>
            </div>

            <div className="flex justify-between font-bold text-emerald-700 pt-0.5">
              <span className="font-sans">{lang === 'ar' ? `المبلغ المدفوع (${invoice.paymentMethod}):` : `Deposit Paid (${invoice.paymentMethod}):`}</span>
              <span>{invoice.paidAmount.toFixed(2)} JOD</span>
            </div>

            <div className="flex justify-between font-bold text-slate-900 pt-0.5">
              <span className="font-sans">{lang === 'ar' ? 'الرصيد المتبقي عند الاستلام:' : 'Remaining Balance Due:'}</span>
              <span className={invoice.remainingBalance > 0 ? 'text-amber-800 font-extrabold' : 'text-emerald-700'}>
                {invoice.remainingBalance.toFixed(2)} JOD
              </span>
            </div>

            <div className="flex justify-between text-[11px] font-semibold text-slate-500 pt-1.5 border-t border-slate-200">
              <span className="font-sans">{lang === 'ar' ? 'حالة تجهيز الطلب:' : 'Order Delivery Status:'}</span>
              <span className="font-bold text-blue-700">{invoice.deliveryStatus}</span>
            </div>
          </div>

          {/* Footer Terms */}
          <div className="text-[10px] text-center text-slate-500 pt-2 border-t border-slate-200 font-medium space-y-0.5">
            <div>Warranty: {invoice.warrantyTerms || '12 Months Optical Warranty'}</div>
            <div className="font-bold text-slate-700">Thank you for choosing OptiVision Enterprise!</div>
          </div>

          {/* Modal Action Buttons (Hidden when printing via .no-print or @media print CSS) */}
          <div className="no-print pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              onClick={handlePrint}
              className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-md"
            >
              <Printer className="w-4 h-4" />
              {lang === 'ar' ? 'طباعة الفاتورة والوصل' : 'Print Invoice & Receipt'}
            </button>

            <button
              onClick={onClose}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-6 py-3 rounded-xl border border-slate-200 transition cursor-pointer"
            >
              {lang === 'ar' ? 'إغلاق' : 'Close Window'}
            </button>
          </div>
        </div>

        {/* Top-Right Modal Close Icon */}
        <button
          onClick={onClose}
          className="no-print absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

      </div>
    </div>
  );
};
