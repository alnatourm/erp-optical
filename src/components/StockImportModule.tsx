import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Building2,
  User,
  Clock,
  RefreshCw,
  Info,
  ShieldCheck,
  FileCode,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Branch, StockImportLog, Product } from '../types';
import { useLanguage } from '../lib/i18n';

interface StockImportModuleProps {
  branches: Branch[];
  activeBranch: Branch;
  products: Product[];
  importLogs: StockImportLog[];
  onExecuteImport: (
    rows: Array<{ barcode: string; description: string; sellingPrice: number; quantity: number }>,
    targetBranchId: string,
    importedBy: string,
    filename: string
  ) => StockImportLog;
}

interface ParsedRow {
  barcode: string;
  description: string;
  sellingPrice: number;
  quantity: number;
  isDuplicate: boolean;
  existingProduct?: Product;
}

export const StockImportModule: React.FC<StockImportModuleProps> = ({
  branches,
  activeBranch,
  products,
  importLogs,
  onExecuteImport,
}) => {
  const { lang, t } = useLanguage();
  const [selectedBranchId, setSelectedBranchId] = useState<string>(activeBranch.id);
  const [accountantName, setAccountantName] = useState<string>(
    lang === 'ar' ? 'المحاسب سامي' : 'Accountant Sami'
  );
  const [fileName, setFileName] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [importSuccessLog, setImportSuccessLog] = useState<StockImportLog | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isTotalsConfirmed, setIsTotalsConfirmed] = useState<boolean>(false);

  // Download Sample Excel Template
  const handleDownloadTemplate = () => {
    const sampleData = [
      { Barcode: '100001', Description: 'G ARMANI', 'Selling Price': 100, Quantity: 1 },
      { Barcode: '100002', Description: 'RAY-BAN Aviator Gold', 'Selling Price': 120, Quantity: 2 },
      { Barcode: '100006', Description: 'TOM FORD TF5634 Black', 'Selling Price': 210, Quantity: 3 },
      { Barcode: '100007', Description: 'VERSACE VE3290 Gold Frame', 'Selling Price': 185, Quantity: 1 },
      { Barcode: '200002', Description: 'Zeiss Anti-Blue Progressive Lens', 'Selling Price': 75, Quantity: 10 },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock Import');
    XLSX.writeFile(workbook, 'OptiVision_Stock_Import_Template.xlsx');
  };

  // Handle Excel File Upload & Validation
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setValidationError(null);
    setImportSuccessLog(null);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const jsonRaw = XLSX.utils.sheet_to_json<any>(worksheet);

        if (jsonRaw.length === 0) {
          setValidationError('The uploaded Excel file appears to be empty.');
          setIsProcessing(false);
          return;
        }

        // Validate Structure
        const firstRow = jsonRaw[0];
        const keys = Object.keys(firstRow).map((k) => k.trim().toLowerCase());

        const hasBarcode = keys.some((k) => k.includes('barcode') || k.includes('code'));
        const hasDescription = keys.some((k) => k.includes('description') || k.includes('name') || k.includes('frame'));

        if (!hasBarcode || !hasDescription) {
          setValidationError(
            'Invalid Excel Structure! Required columns: "Barcode", "Description", "Selling Price", "Quantity".'
          );
          setIsProcessing(false);
          return;
        }

        // Process and detect duplicates with robust multi-language key matching
        const processed: ParsedRow[] = jsonRaw.map((row) => {
          const rowKeys = Object.keys(row);

          const findVal = (keywords: string[]): any => {
            const matchedKey = rowKeys.find((k) => {
              const cleanK = k.toLowerCase().trim().replace(/[\s_\-]/g, '');
              return keywords.some((kw) => cleanK.includes(kw));
            });
            return matchedKey !== undefined ? row[matchedKey] : undefined;
          };

          const rawBarcode = findVal(['barcode', 'code', 'باركود', 'رمز']) ?? '';
          const cleanBarcode = String(rawBarcode).trim();

          const rawDesc = findVal(['description', 'desc', 'name', 'frame', 'اسم', 'وصف', 'صنف']) ?? 'Optical Item';

          const rawPrice = findVal(['sellingprice', 'price', 'selling', 'cost', 'سعرالبيع', 'السعر', 'سعر', 'تكلفة']);
          const parsedPrice = rawPrice !== undefined && !isNaN(parseFloat(rawPrice)) ? parseFloat(rawPrice) : 0;

          const rawQty = findVal(['quantity', 'qty', 'count', 'الكمية', 'كمية', 'عدد']);
          const parsedQty = rawQty !== undefined && !isNaN(parseInt(rawQty)) ? parseInt(rawQty) : 1;

          const existing = products.find((p) => p.barcode === cleanBarcode);

          return {
            barcode: cleanBarcode,
            description: String(rawDesc).trim(),
            sellingPrice: parsedPrice,
            quantity: parsedQty,
            isDuplicate: !!existing,
            existingProduct: existing,
          };
        });

        setParsedRows(processed);
        setIsTotalsConfirmed(false);
        setIsProcessing(false);
      } catch (err: any) {
        setValidationError(`Failed to parse Excel file: ${err.message || 'Unknown format'}`);
        setIsProcessing(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  // Execute Import
  const handleConfirmImport = () => {
    if (parsedRows.length === 0) return;

    const log = onExecuteImport(
      parsedRows.map((r) => ({
        barcode: r.barcode,
        description: r.description,
        sellingPrice: r.sellingPrice,
        quantity: r.quantity,
      })),
      selectedBranchId,
      accountantName,
      fileName || 'Uploaded_Stock.xlsx'
    );

    setImportSuccessLog(log);
    setParsedRows([]);
    setFileName('');
  };

  const duplicateCount = parsedRows.filter((r) => r.isDuplicate).length;
  const newItemCount = parsedRows.filter((r) => !r.isDuplicate).length;

  return (
    <div id="stock-import-module" className="p-6 space-y-6 max-w-7xl mx-auto text-slate-900">
      {/* Module Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {lang === 'ar' ? 'وحدة استيراد المخزون من إكسل (شاشة المحاسب)' : 'Stock Import Console (Accountant View)'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {lang === 'ar'
                  ? 'تحميل ملفات إكسل لاستيراد البضاعة، اكتشاف الباركود المكرر تلقائياً، وتحديث المخزون للفروع.'
                  : 'Upload Excel files to import stock, auto-detect duplicate barcodes, and update multi-branch inventory.'}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleDownloadTemplate}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-4 py-2.5 rounded-lg border border-slate-200 transition cursor-pointer flex items-center gap-2 shrink-0"
        >
          <Download className="w-4 h-4 text-blue-600" />
          {lang === 'ar' ? 'تحميل قالب إكسل تجريبي' : 'Download Sample Excel Template'}
        </button>
      </div>

      {/* Step 1: Branch Selection & Accountant Log Details */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
        <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wide flex items-center gap-2">
          <Building2 className="w-4 h-4 text-blue-600" />
          {lang === 'ar' ? 'الخطوة 1: تحديد الفرع والمحاسب المسؤول' : 'Step 1: Import Destination & Audit Info'}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Branch Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600">
              {lang === 'ar' ? 'الفرع المستهدف للاستيراد' : 'Target Branch for Import'}
            </label>
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-lg p-2.5 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>

          {/* Accountant Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600">
              {lang === 'ar' ? 'اسم المحاسب / الموظف المسؤول' : 'Imported By (Accountant / Staff Name)'}
            </label>
            <div className="relative">
              <input
                type="text"
                value={accountantName}
                onChange={(e) => setAccountantName(e.target.value)}
                placeholder={lang === 'ar' ? 'مثال: المحاسب سامي' : 'e.g. Accountant Sami'}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-lg p-2.5 pl-9 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Date Stamp Info */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600">
              {lang === 'ar' ? 'تاريخ ووقت الاستيراد' : 'Import Date & Time'}
            </label>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-mono text-slate-700 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>{new Date().toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Step 2: Excel File Upload Dropzone */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wide flex items-center gap-2">
          <Upload className="w-4 h-4 text-blue-600" />
          {lang === 'ar' ? 'الخطوة 2: رفع ملف الإكسل (.xlsx, .xls, .csv)' : 'Step 2: Upload Excel File (.xlsx, .xls, .csv)'}
        </h3>

        <div className="border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-xl p-8 text-center bg-slate-50/50 transition cursor-pointer relative group">
          <input
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />

          <div className="space-y-3 pointer-events-none">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mx-auto group-hover:scale-105 transition">
              <FileSpreadsheet className="w-6 h-6" />
            </div>

            <div>
              <p className="text-sm font-bold text-slate-900">
                {fileName ? fileName : lang === 'ar' ? 'اضغط هنا أو اسحب ملف الإكسل للرفع' : 'Click or Drag Excel File to Upload'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {lang === 'ar' ? 'يدعم الأعمدة:' : 'Supports columns:'}{' '}
                <code className="text-blue-700 font-bold bg-blue-50 px-1 rounded">Barcode</code>,{' '}
                <code className="text-blue-700 font-bold bg-blue-50 px-1 rounded">Description</code>,{' '}
                <code className="text-blue-700 font-bold bg-blue-50 px-1 rounded">Selling Price</code>,{' '}
                <code className="text-blue-700 font-bold bg-blue-50 px-1 rounded">Quantity</code>
              </p>
            </div>
          </div>
        </div>

        {/* Validation Error Message */}
        {validationError && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
            <span className="font-medium">{validationError}</span>
          </div>
        )}

        {/* Import Success Log Notification */}
        {importSuccessLog && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-lg space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              {lang === 'ar' ? 'تم استيراد وتحديث البضاعة وتسجيل العملية بنجاح!' : 'Stock Import Successfully Executed & Logged!'}
            </div>
            <p className="text-slate-700 font-medium">
              {lang === 'ar' ? 'رقم الاستيراد:' : 'Import ID:'} <span className="font-mono font-bold text-blue-700">{importSuccessLog.id}</span> |{' '}
              {lang === 'ar' ? 'إجمالي المواد:' : 'Total Processed:'}{' '}
              <span className="font-bold text-slate-900">{importSuccessLog.totalItems}</span> |{' '}
              {lang === 'ar' ? 'أصناف جديدة:' : 'New Items:'}{' '}
              <span className="font-bold text-emerald-700">{importSuccessLog.newItemsCount}</span> |{' '}
              {lang === 'ar' ? 'تحديث مكرر:' : 'Duplicates Updated:'}{' '}
              <span className="font-bold text-amber-700">{importSuccessLog.updatedItemsCount}</span>
            </p>
          </div>
        )}
      </div>

      {/* Step 3: Excel Validation & Interactive Preview Table */}
      {parsedRows.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-blue-600" />
                {lang === 'ar'
                  ? `الخطوة 3: معاينة وتدقيق الباركود المكرر (${parsedRows.length} سجل)`
                  : `Step 3: Preview & Duplicate Detection (${parsedRows.length} Rows Parsed)`}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                {lang === 'ar'
                  ? `مراجعة السجلات قبل إدخالها إلى مخزون ${branches.find((b) => b.id === selectedBranchId)?.name}.`
                  : `Review Excel records prior to importing into ${branches.find((b) => b.id === selectedBranchId)?.name}.`}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 text-xs bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 font-medium">
                <span className="text-emerald-700 font-bold">
                  {newItemCount} {lang === 'ar' ? 'أصناف جديدة' : 'New Items'}
                </span>
                <span className="text-slate-300">|</span>
                <span className="text-amber-700 font-bold">
                  {duplicateCount} {lang === 'ar' ? 'مكرر (سيتم زيادة الكمية)' : 'Duplicates (Will Update Qty)'}
                </span>
              </div>

              <button
                onClick={handleConfirmImport}
                disabled={!isTotalsConfirmed}
                className={`${isTotalsConfirmed ? 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer text-white' : 'bg-slate-300 text-slate-500 cursor-not-allowed'} font-bold text-xs px-5 py-2.5 rounded-lg shadow-xs transition flex items-center gap-2`}
              >
                <CheckCircle2 className="w-4 h-4" />
                {lang === 'ar' ? 'تأكيد وتنفيذ الاستيراد' : 'Confirm & Execute Import'}
              </button>
            </div>
          </div>

          {/* Verification Summary Panel */}
          <div className="bg-slate-100 p-4 rounded-lg border border-slate-200 shadow-inner">
            <div className="flex flex-wrap gap-4 justify-between items-center text-sm font-bold">
              <span className="text-slate-700">{lang === 'ar' ? 'إجمالي الأصناف المستوردة:' : 'Total Imported Items:'}</span>
              <div className="flex flex-wrap gap-6">
                <div className="text-blue-800">
                  <span className="text-xs text-slate-500 mx-2">{lang === 'ar' ? 'الكمية الإجمالية:' : 'Total Qty:'}</span>
                  {parsedRows.reduce((acc, row) => acc + (row.quantity || 0), 0)}
                </div>
                <div className="text-emerald-800">
                  <span className="text-xs text-slate-500 mx-2">{lang === 'ar' ? 'المبلغ الإجمالي (تقريبي):' : 'Total Price (Estimated):'}</span>
                  {parsedRows.reduce((acc, row) => acc + ((row.sellingPrice || 0) * (row.quantity || 0)), 0).toFixed(2)} JOD
                </div>
              </div>
            </div>
            <div className="w-full mt-4 pt-4 border-t border-slate-200 flex items-center gap-2">
              <input
                type="checkbox"
                id="confirm-totals"
                checked={isTotalsConfirmed}
                onChange={(e) => setIsTotalsConfirmed(e.target.checked)}
                className="w-4 h-4 text-emerald-600 bg-white border-slate-300 rounded focus:ring-emerald-500 cursor-pointer"
              />
              <label htmlFor="confirm-totals" className="text-xs text-slate-700 font-medium cursor-pointer">
                {lang === 'ar' 
                  ? 'أؤكد أن الكميات والمبالغ الإجمالية مطابقة تماماً للمستندات الورقية الخاصة بالشحنة.' 
                  : 'I confirm that the total quantities and prices match the physical shipment documentation.'}
              </label>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs text-slate-800">
              <thead className="bg-slate-100 uppercase font-bold text-[11px] text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">{lang === 'ar' ? 'الباركود' : 'Barcode'}</th>
                  <th className="p-3">{lang === 'ar' ? 'الوصف / اسم الإطار' : 'Description / Frame Name'}</th>
                  <th className="p-3">{lang === 'ar' ? 'سعر البيع' : 'Selling Price'}</th>
                  <th className="p-3">{lang === 'ar' ? 'الكمية' : 'Quantity'}</th>
                  <th className="p-3">{lang === 'ar' ? 'إجراء حالة الاستيراد' : 'Import Action Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[12px]">
                {parsedRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition">
                    <td className="p-3 text-slate-400">{idx + 1}</td>
                    <td className="p-3 font-bold text-blue-700">{row.barcode}</td>
                    <td className="p-3 font-sans text-slate-900 font-semibold">{row.description}</td>
                    <td className="p-3 font-bold text-emerald-700">{row.sellingPrice} {lang === 'ar' ? 'د.أ' : 'JOD'}</td>
                    <td className="p-3 font-bold text-slate-900">{row.quantity} {lang === 'ar' ? 'قطعة' : 'Pcs'}</td>
                    <td className="p-3 font-sans">
                      {row.isDuplicate ? (
                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-bold">
                          <RefreshCw className="w-3 h-3 text-amber-600" />
                          {lang === 'ar' ? 'باركود مكرر ← تحديث السعر والكمية' : 'Duplicate Barcode → Update Qty & Price'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          {lang === 'ar' ? 'إضافة صنف جديد' : 'New Product Insertion'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Previous Import Audit Logs */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wide flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          {lang === 'ar' ? 'سجل تدقيق عمليات استيراد المخزون السابقة' : 'Stock Import Audit Logs History'}
        </h3>

        {importLogs.length === 0 ? (
          <p className="text-xs text-slate-400">
            {lang === 'ar' ? 'لا توجد سجلات استيراد سابقة مسجلة.' : 'No previous import logs registered.'}
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs text-slate-800">
              <thead className="bg-slate-100 uppercase font-bold text-[10px] text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="p-3">{lang === 'ar' ? 'رقم الاستيراد' : 'Import ID'}</th>
                  <th className="p-3">{lang === 'ar' ? 'اسم الملف' : 'File Name'}</th>
                  <th className="p-3">{lang === 'ar' ? 'الفرع' : 'Branch'}</th>
                  <th className="p-3">{lang === 'ar' ? 'المحاسب' : 'Accountant'}</th>
                  <th className="p-3">{lang === 'ar' ? 'التاريخ والوقت' : 'Date & Time'}</th>
                  <th className="p-3">{lang === 'ar' ? 'إجمالي الأصناف' : 'Total Items'}</th>
                  <th className="p-3">{lang === 'ar' ? 'جديد / مكرر' : 'New / Duplicates'}</th>
                  <th className="p-3">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {importLogs.map((log) => {
                  const br = branches.find((b) => b.id === log.branchId);
                  return (
                    <tr key={log.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 text-blue-700 font-bold">{log.id}</td>
                      <td className="p-3 font-sans text-slate-900 font-semibold">{log.filename}</td>
                      <td className="p-3 font-sans text-slate-700">{br ? br.name : log.branchId}</td>
                      <td className="p-3 font-sans text-slate-700">{log.importedBy}</td>
                      <td className="p-3 text-slate-500">{log.importDate}</td>
                      <td className="p-3 font-bold text-slate-900">{log.totalItems}</td>
                      <td className="p-3">
                        <span className="text-emerald-700 font-bold">
                          {log.newItemsCount} {lang === 'ar' ? 'جديد' : 'New'}
                        </span>{' '}
                        /{' '}
                        <span className="text-amber-700 font-bold">
                          {log.updatedItemsCount} {lang === 'ar' ? 'محدث' : 'Updated'}
                        </span>
                      </td>
                      <td className="p-3 font-sans">
                        <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-200">
                          {log.status === 'Completed' ? (lang === 'ar' ? 'مكتمل' : 'Completed') : log.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
