import React, { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  QrCode,
  Edit2,
  Trash2,
  Building2,
  Tag,
  Glasses,
  Printer,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileSpreadsheet,
  Download,
  Upload,
  UploadCloud,
  FileText,
  Eye,
  ShieldAlert,
} from 'lucide-react';
import { Product, Branch, FrameType, Gender, AgeGroup, ProductStatus, UserAccount } from '../types';
import { useLanguage } from '../lib/i18n';

interface ProductDatabaseModuleProps {
  products: Product[];
  branches: Branch[];
  activeBranch: Branch;
  onSaveProduct: (product: Partial<Product> & { barcode: string }) => void;
  currentUser?: UserAccount;
}

export const ProductDatabaseModule: React.FC<ProductDatabaseModuleProps> = ({
  products,
  branches,
  activeBranch,
  onSaveProduct,
  currentUser,
}) => {
  const { lang, t } = useLanguage();
  const isSalesPerson = currentUser?.role === 'sales_person';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>('ALL');
  const [selectedFrameTypeFilter, setSelectedFrameTypeFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

  const [barcodeLabelProduct, setBarcodeLabelProduct] = useState<Product | null>(null);

  // Excel / CSV Import state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFileName, setImportFileName] = useState('');
  const [parsedImportItems, setParsedImportItems] = useState<Array<{
    barcode: string;
    brand: string;
    model: string;
    description: string;
    frameType: FrameType;
    frameColor: string;
    size: string;
    material: string;
    gender: Gender;
    ageGroup: AgeGroup;
    purchaseCost: number;
    sellingPrice: number;
    currentQuantity: number;
    branchId: string;
    status: ProductStatus;
    isUpdate: boolean;
  }>>([]);
  const [importSuccessMsg, setImportSuccessMsg] = useState('');

  // Download Sample CSV Template
  const handleDownloadTemplate = () => {
    const templateHeaders = [
      'Barcode',
      'Brand',
      'Model',
      'Description',
      'FrameType',
      'FrameColor',
      'Size',
      'Material',
      'Gender',
      'AgeGroup',
      'PurchaseCost',
      'SellingPrice',
      'CurrentQty',
      'BranchCode',
    ];

    const sampleRows = [
      ['100020', 'RAY-BAN', 'RB3025 Aviator', 'Gold frame classic G-15 lens', 'Full Rim', 'Gold / Green', '58-14-135', 'Metal', 'Unisex', 'Adult', '45.00', '120.00', '15', 'AMMAN-MAIN'],
      ['100021', 'GUCCI', 'GG0061S 001', 'Square oversized luxury acetate frame', 'Full Rim', 'Black / Gold', '56-18-140', 'Acetate', 'Female', 'Adult', '85.00', '210.00', '8', 'AMMAN-MAIN'],
      ['100022', 'OAKLEY', 'Holbrook OO9102', 'Matte black sport sunglass Prizm', 'Full Rim', 'Matte Black', '55-18-137', 'TR90', 'Male', 'Adult', '50.00', '135.00', '12', 'AMMAN-MAIN'],
    ];

    const csvContent = [templateHeaders.join(','), ...sampleRows.map((r) => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'OptiVision_Product_Import_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Parse CSV File Upload
  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    setImportSuccessMsg('');

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
      if (lines.length <= 1) return;

      const items: typeof parsedImportItems = [];

      for (let i = 1; i < lines.length; i++) {
        // Split by comma handling quotes
        const rawRow = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || lines[i].split(',');
        const cols = rawRow.map((c) => c.replace(/^"|"$/g, '').trim());

        if (cols.length < 2) continue;

        const barcode = cols[0] || `1000${Math.floor(1000 + Math.random() * 9000)}`;
        const brand = cols[1] || 'GENERIC BRAND';
        const model = cols[2] || 'STANDARD';
        const description = cols[3] || `${brand} ${model}`;
        const frameType = (cols[4] as FrameType) || 'Full Rim';
        const frameColor = cols[5] || 'Black';
        const size = cols[6] || '52-18-140';
        const material = cols[7] || 'Acetate';
        const gender = (cols[8] as Gender) || 'Unisex';
        const ageGroup = (cols[9] as AgeGroup) || 'Adult';
        const purchaseCost = parseFloat(cols[10]) || 25;
        const sellingPrice = parseFloat(cols[11]) || 65;
        const currentQuantity = parseInt(cols[12]) || 10;
        const branchCode = cols[13] || 'AMMAN-MAIN';

        const foundBranch = branches.find((b) => b.code.toLowerCase() === branchCode.toLowerCase() || b.name.toLowerCase().includes(branchCode.toLowerCase()));
        const targetBranchId = foundBranch ? foundBranch.id : activeBranch.id;

        const isExisting = products.some((p) => p.barcode === barcode);

        items.push({
          barcode,
          brand,
          model,
          description,
          frameType,
          frameColor,
          size,
          material,
          gender,
          ageGroup,
          purchaseCost,
          sellingPrice,
          currentQuantity,
          branchId: targetBranchId,
          status: currentQuantity > 5 ? 'Active' : currentQuantity > 0 ? 'Low Stock' : 'Out of Stock',
          isUpdate: isExisting,
        });
      }

      setParsedImportItems(items);
    };

    reader.readAsText(file);
  };

  // Save imported products to store
  const handleExecuteImport = () => {
    if (parsedImportItems.length === 0) return;

    parsedImportItems.forEach((item) => {
      const existing = products.find(p => p.barcode === item.barcode);
      onSaveProduct({
        id: existing?.id,
        barcode: item.barcode,
        brand: item.brand || existing?.brand,
        model: item.model || existing?.model,
        description: item.description || existing?.description,
        frameType: item.frameType || existing?.frameType,
        frameColor: item.frameColor || existing?.frameColor,
        size: item.size || existing?.size,
        material: item.material || existing?.material,
        gender: item.gender || existing?.gender,
        ageGroup: item.ageGroup || existing?.ageGroup,
        purchaseCost: item.purchaseCost || existing?.purchaseCost,
        sellingPrice: item.sellingPrice || existing?.sellingPrice,
        discountPrice: existing?.discountPrice,
        tax: existing?.tax || 16,
        currentQuantity: (existing?.currentQuantity || 0) + item.currentQuantity,
        availableQuantity: (existing?.availableQuantity || 0) + item.currentQuantity,
        branchId: item.branchId || existing?.branchId || activeBranch.id,
        warehouse: 'Main Store Room',
        status: item.status || existing?.status || 'Active',
      });
    });

    setImportSuccessMsg(`Successfully imported / updated ${parsedImportItems.length} products in the database!`);
    setParsedImportItems([]);
    setImportFileName('');
  };

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.barcode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesBranch = selectedBranchFilter === 'ALL' || p.branchId === selectedBranchFilter;
    const matchesType = selectedFrameTypeFilter === 'ALL' || p.frameType === selectedFrameTypeFilter;
    const matchesStatus = selectedStatusFilter === 'ALL' || p.status === selectedStatusFilter;

    return matchesSearch && matchesBranch && matchesType && matchesStatus;
  });

  // Export to Excel / CSV for Accountant & Management
  const handleExportToExcel = () => {
    const headers = [
      'Barcode',
      'Brand',
      'Model',
      'Description',
      'Frame Type',
      'Frame Color',
      'Size',
      'Material',
      'Gender',
      'Age Group',
      'Purchase Cost (JOD)',
      'Selling Price (JOD)',
      'Discount Price (JOD)',
      'Tax %',
      'Current Qty',
      'Available Qty',
      'Total Inventory Valuation (Cost)',
      'Branch',
      'Warehouse Vault',
      'Status',
    ];

    const rows = filteredProducts.map((p) => {
      const branchName = branches.find((b) => b.id === p.branchId)?.name || p.branchId;
      const totalCostValue = (p.purchaseCost * p.currentQuantity).toFixed(2);

      return [
        `"${p.barcode}"`,
        `"${p.brand.replace(/"/g, '""')}"`,
        `"${p.model.replace(/"/g, '""')}"`,
        `"${(p.description || '').replace(/"/g, '""')}"`,
        `"${p.frameType}"`,
        `"${p.frameColor}"`,
        `"${p.size}"`,
        `"${p.material}"`,
        `"${p.gender}"`,
        `"${p.ageGroup}"`,
        p.purchaseCost,
        p.sellingPrice,
        p.discountPrice || '',
        p.tax,
        p.currentQuantity,
        p.availableQuantity,
        totalCostValue,
        `"${branchName}"`,
        `"${p.warehouse}"`,
        `"${p.status}"`,
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `OptiVision_Inventory_Valuation_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Open modal for Create or Edit
  const handleOpenModal = (prod?: Product) => {
    if (prod) {
      setModalMode('edit');
      setEditingProduct({ ...prod });
    } else {
      setModalMode('add');
      setEditingProduct({
        barcode: '',
        brand: '',
        model: '',
        description: '',
        frameType: 'Full Rim',
        frameColor: '',
        size: '',
        material: '',
        gender: 'Unisex',
        ageGroup: 'Adult',
        supplier: 'Luxottica Middle East',
        purchaseCost: 0,
        sellingPrice: 0,
        discountPrice: undefined,
        tax: 16,
        currentQuantity: 1,
        reservedQuantity: 0,
        minimumStock: 2,
        maximumStock: 20,
        warehouse: `${activeBranch.name} Vault`,
        branchId: activeBranch.id,
        status: 'Active',
        warrantyMonths: 12,
      });
    }
    setIsModalOpen(true);
  };

  const getAutoFrameType = (barcode: string): any => {
    if (barcode.startsWith('1')) return 'Full Rim';
    if (barcode.startsWith('2')) return 'Sunglasses';
    if (barcode.startsWith('3')) return 'Contact Lens';
    if (barcode.startsWith('4')) return 'Ophthalmic Lens';
    if (barcode.startsWith('5')) return 'Service';
    return undefined;
  };

  const handleBarcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newBarcode = e.target.value;
    const existing = products.find(p => p.barcode === newBarcode);
    const autoFrameType = getAutoFrameType(newBarcode);
    
    if (modalMode === 'add') {
      if (existing) {
        setEditingProduct({
          ...existing,
          barcode: newBarcode,
          currentQuantity: 0, // Reset to 0 so they can input the quantity they are adding
          _isAddingQuantity: true // Flag to indicate we should add this quantity
        } as any);
      } else {
        setEditingProduct(prev => {
          const baseUpdate = { barcode: newBarcode, ...(autoFrameType ? { frameType: autoFrameType } : {}) };
          if (!prev) return baseUpdate as any;
          
          // If we had previously auto-filled an existing item, and now the barcode doesn't match, 
          // we must remove the ID and the _isAddingQuantity flag so it acts as a new item again.
          const { id, _isAddingQuantity, ...rest } = prev as any;
          return { ...rest, ...baseUpdate } as any;
        });
      }
    } else {
      // In edit mode, just update the barcode and frameType if not manually overridden
      setEditingProduct(prev => {
        if (!prev) return { barcode: newBarcode } as any;
        const update = { barcode: newBarcode };
        if (autoFrameType && prev.barcode.charAt(0) !== newBarcode.charAt(0)) {
          (update as any).frameType = autoFrameType;
        }
        return { ...prev, ...update } as any;
      });
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.barcode) return;

    let finalProduct = { ...editingProduct };
    
    // If we auto-filled an existing product, add the inputted quantity to the existing quantity
    if ((editingProduct as any)._isAddingQuantity) {
      const existing = products.find(p => p.id === editingProduct.id);
      if (existing) {
        finalProduct.currentQuantity = (existing.currentQuantity || 0) + (editingProduct.currentQuantity || 0);
        finalProduct.availableQuantity = Math.max(0, finalProduct.currentQuantity - (existing.reservedQuantity || 0));
      }
      delete (finalProduct as any)._isAddingQuantity;
    }

    onSaveProduct(finalProduct as any);
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  return (
    <div id="product-database-module" className="p-6 space-y-6 max-w-7xl mx-auto text-slate-900">
      {/* Title & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {lang === 'ar' ? 'قاعدة بيانات المنتجات والنظارات والمخزون' : 'Product & Frame Inventory Database'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {lang === 'ar'
                  ? 'سجل مفصل للإطارات والعدسات الطبية والعدسات اللاصقة وأسعار التكلفة والضمان والفروع.'
                  : 'Detailed catalog of frames, lenses, contact lenses, purchase costs, branches, and warranties.'}
              </p>
            </div>
          </div>
        </div>

        {!isSalesPerson ? (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setImportSuccessMsg('');
                setIsImportModalOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-lg shadow-xs transition cursor-pointer flex items-center gap-2"
              title="Import products from Excel / CSV file"
            >
              <Upload className="w-4 h-4" />
              {lang === 'ar' ? 'استيراد إكسل (.csv)' : 'Import Excel (.csv)'}
            </button>

            <button
              onClick={handleExportToExcel}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-lg shadow-xs transition cursor-pointer flex items-center gap-2"
              title="Export filtered inventory with purchase costs and total valuation to Excel CSV"
            >
              <FileSpreadsheet className="w-4 h-4" />
              {lang === 'ar' ? 'تصدير إكسل (.csv)' : 'Export to Excel (.csv)'}
            </button>

            <button
              onClick={() => handleOpenModal()}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3.5 py-2.5 rounded-lg shadow-xs transition cursor-pointer flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {lang === 'ar' ? 'إضافة صنف جديد' : 'Add Item'}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-800 px-3.5 py-2 rounded-xl text-xs font-bold shrink-0">
            <Eye className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{lang === 'ar' ? 'شاشة البائع — استعلام قراءة فقط للمخزون' : 'Shop Sales View — Read-Only Inventory Lookup'}</span>
          </div>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col lg:flex-row items-center gap-3">
        {/* Search Box */}
        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              lang === 'ar'
                ? 'البحث بالباركود (مثال 100001)، الماركة، الموديل، الوصف...'
                : 'Search by Barcode (e.g. 100001), Brand (G ARMANI), Model, Description...'
            }
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-lg p-2.5 pl-9 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute ltr:left-3 rtl:right-3 top-2.5" />
        </div>

        {/* Branch Filter */}
        <div className="flex items-center gap-2 w-full lg:w-auto">
          <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedBranchFilter}
            onChange={(e) => setSelectedBranchFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg p-2.5 font-medium focus:bg-white focus:outline-none cursor-pointer w-full"
          >
            <option value="ALL">{lang === 'ar' ? 'جميع الفروع' : 'All Branches'}</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Frame Type Filter */}
        <div className="flex items-center gap-2 w-full lg:w-auto">
          <Glasses className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedFrameTypeFilter}
            onChange={(e) => setSelectedFrameTypeFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg p-2.5 font-medium focus:bg-white focus:outline-none cursor-pointer w-full"
          >
            <option value="ALL">{lang === 'ar' ? 'جميع الأنواع' : 'All Types'}</option>

            <option value="Full Rim">{lang === 'ar' ? 'إطار كامل (Full Rim)' : 'Full Rim'}</option>
            <option value="Semi Rimless">{lang === 'ar' ? 'نصف إطار (Semi Rimless)' : 'Semi Rimless'}</option>
            <option value="Rimless">{lang === 'ar' ? 'بدون إطار (Rimless)' : 'Rimless'}</option>
            <option value="Sunglasses">{lang === 'ar' ? 'نظارة شمسية' : 'Sunglasses'}</option>
            <option value="Ophthalmic Lens">{lang === 'ar' ? 'عدسة طبية' : 'Ophthalmic Lens'}</option>
            <option value="Contact Lens">{lang === 'ar' ? 'عدسة لاصقة' : 'Contact Lens'}</option>
            <option value="Accessory">{lang === 'ar' ? 'إكسسوار / بيت نظارة' : 'Accessory'}</option>
            <option value="Service">{lang === 'ar' ? 'خدمات' : 'Service'}</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 w-full lg:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg p-2.5 font-medium focus:bg-white focus:outline-none cursor-pointer w-full"
          >
            <option value="ALL">{lang === 'ar' ? 'جميع الحالات' : 'All Statuses'}</option>
            <option value="Active">{lang === 'ar' ? 'نشط ومتوفر' : 'Active'}</option>
            <option value="Low Stock">{lang === 'ar' ? 'منخفض المخزون' : 'Low Stock'}</option>
            <option value="Out of Stock">{lang === 'ar' ? 'نفذت الكمية' : 'Out of Stock'}</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right text-xs text-slate-800">
            <thead className="bg-slate-100 uppercase font-bold text-[10px] text-slate-700 border-b border-slate-200">
              <tr>
                <th className="p-3.5">{lang === 'ar' ? 'الباركود والرقم' : 'Barcode & ID'}</th>
                <th className="p-3.5">{lang === 'ar' ? 'الماركة والموديل' : 'Brand / Model'}</th>
                <th className="p-3.5">{lang === 'ar' ? 'تفاصيل الإطار' : 'Frame Details'}</th>
                <th className="p-3.5">{lang === 'ar' ? 'الفرع والخزنة' : 'Branch / Vault'}</th>
                <th className="p-3.5">
                  {isSalesPerson
                    ? lang === 'ar'
                      ? 'سعر البيع'
                      : 'Selling Price'
                    : lang === 'ar'
                    ? 'التكلفة وسعر البيع'
                    : 'Cost & Price'}
                </th>
                <th className="p-3.5">{lang === 'ar' ? 'كمية المخزون' : 'Stock Quantity'}</th>
                <th className="p-3.5">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                <th className="p-3.5 ltr:text-right rtl:text-left">{lang === 'ar' ? 'الإجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px]">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    No optical products found matching the criteria.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((prod) => {
                  const branch = branches.find((b) => b.id === prod.branchId);
                  return (
                    <tr key={prod.id} className="hover:bg-slate-50 transition">
                      <td className="p-3.5 font-mono">
                        <div className="font-bold text-blue-700">{prod.barcode}</div>
                        <div className="text-[10px] text-slate-400">{prod.id}</div>
                      </td>

                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 text-xs">{prod.brand}</div>
                        <div className="text-slate-700 font-semibold">{prod.model}</div>
                        <div className="text-[10px] text-slate-500">{prod.description}</div>
                      </td>

                      <td className="p-3.5 space-y-0.5">
                        <div className="text-slate-700">
                          <span className="font-bold text-slate-900">{prod.frameType}</span> • {prod.frameColor}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">
                          Size: {prod.size} | Mat: {prod.material} | {prod.gender}
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="font-bold text-slate-800">{branch ? branch.name : prod.branchId}</div>
                        <div className="text-[10px] text-slate-500 font-medium">{prod.warehouse}</div>
                      </td>

                      <td className="p-3.5 font-mono">
                        <div className="font-bold text-emerald-700 text-xs">{prod.sellingPrice} JOD</div>
                        {prod.discountPrice && (
                          <div className="text-[10px] text-amber-700 font-bold">Disc: {prod.discountPrice} JOD</div>
                        )}
                        {!isSalesPerson && (
                          <div className="text-[10px] text-slate-400">Cost: {prod.purchaseCost} JOD</div>
                        )}
                      </td>

                      <td className="p-3.5 font-mono">
                        <div className="font-bold text-slate-900">
                          {prod.currentQuantity} Pcs (Avail: {prod.availableQuantity})
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">
                          Min: {prod.minimumStock} | Max: {prod.maximumStock}
                        </div>
                      </td>

                      <td className="p-3.5">
                        {prod.currentQuantity <= 0 ? (
                          <span className="bg-rose-50 text-rose-700 px-2 py-0.5 rounded text-[10px] font-bold border border-rose-200">
                            Out of Stock
                          </span>
                        ) : prod.currentQuantity <= prod.minimumStock ? (
                          <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-[10px] font-bold border border-amber-200">
                            Low Stock
                          </span>
                        ) : (
                          <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-200">
                            Active
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 text-right space-x-1">
                        <button
                          onClick={() => setBarcodeLabelProduct(prod)}
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-blue-600 transition cursor-pointer"
                          title="Print Barcode Tag"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                        {!isSalesPerson && (
                          <button
                            onClick={() => handleOpenModal(prod)}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 transition cursor-pointer"
                            title="Edit Frame Attributes"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                {editingProduct.id ? 'Edit Frame / Product Attributes' : 'Add New Optical Frame'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-6">
              {/* Row 1: Barcode, Brand, Model */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Barcode *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.barcode || ''}
                    onChange={handleBarcodeChange}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-lg p-2.5 font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Brand *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.brand || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, brand: e.target.value })}
                    placeholder="e.g. GIORGIO ARMANI"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-lg p-2.5 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Model *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.model || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, model: e.target.value })}
                    placeholder="e.g. G ARMANI 3042"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-lg p-2.5 font-medium"
                  />
                </div>
              </div>

              {/* Row 2: Description, Frame Type, Color */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Description</label>
                  <input
                    type="text"
                    value={editingProduct.description || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                    placeholder="e.g. G ARMANI Designer Frame"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-lg p-2.5 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Frame Type</label>
                  <select
                    value={editingProduct.frameType || 'Full Rim'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, frameType: e.target.value as FrameType })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-lg p-2.5 font-medium cursor-pointer"
                  >
                    <option value="Full Rim">Full Rim</option>
                    <option value="Semi Rimless">Semi Rimless</option>
                    <option value="Rimless">Rimless</option>
                    <option value="Sunglasses">Sunglasses</option>
                    <option value="Ophthalmic Lens">Ophthalmic Lens</option>
                    <option value="Contact Lens">Contact Lens</option>
                    <option value="Accessory">Accessory</option>
                    <option value="Service">Service (خدمات)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Frame Color</label>
                  <input
                    type="text"
                    value={editingProduct.frameColor || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, frameColor: e.target.value })}
                    placeholder="e.g. Matte Black / Gold"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-lg p-2.5 font-medium"
                  />
                </div>
              </div>

              {/* Row 3: Size, Material, Gender, Age Group */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Size</label>
                  <input
                    type="text"
                    value={editingProduct.size || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, size: e.target.value })}
                    placeholder="54-18-145"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-lg p-2.5 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Material</label>
                  <input
                    type="text"
                    value={editingProduct.material || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, material: e.target.value })}
                    placeholder="Acetate / Titanium"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-lg p-2.5 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Gender</label>
                  <select
                    value={editingProduct.gender || 'Unisex'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, gender: e.target.value as Gender })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-lg p-2.5 font-medium cursor-pointer"
                  >
                    <option value="Men">Men</option>
                    <option value="Women">Women</option>
                    <option value="Unisex">Unisex</option>
                    <option value="Kids">Kids</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Age Group</label>
                  <select
                    value={editingProduct.ageGroup || 'Adult'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, ageGroup: e.target.value as AgeGroup })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-lg p-2.5 font-medium cursor-pointer"
                  >
                    <option value="Adult">Adult</option>
                    <option value="Kids">Kids</option>
                    <option value="Senior">Senior</option>
                    <option value="Unisex">Unisex</option>
                  </select>
                </div>
              </div>

              {/* Row 4: Pricing & Costs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Purchase Cost (JOD)</label>
                  <input
                    type="number"
                    value={editingProduct.purchaseCost ?? 0}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, purchaseCost: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-lg p-2.5 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-emerald-700">Selling Price (JOD) *</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.sellingPrice ?? 0}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, sellingPrice: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-white border border-blue-500 text-slate-900 text-xs rounded-lg p-2.5 font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Discount Price (JOD)</label>
                  <input
                    type="number"
                    value={editingProduct.discountPrice ?? ''}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        discountPrice: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                    className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-lg p-2.5 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Tax Rate (%)</label>
                  <input
                    type="number"
                    value={editingProduct.tax ?? 16}
                    onChange={(e) => setEditingProduct({ ...editingProduct, tax: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white border border-slate-200 text-slate-900 text-xs rounded-lg p-2.5 font-mono"
                  />
                </div>
              </div>

              {/* Row 5: Branch, Warehouse, Quantity */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Branch</label>
                  <select
                    value={editingProduct.branchId || activeBranch.id}
                    onChange={(e) => setEditingProduct({ ...editingProduct, branchId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-lg p-2.5 font-medium cursor-pointer"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Current Stock Quantity</label>
                  <input
                    type="number"
                    value={editingProduct.currentQuantity ?? 1}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, currentQuantity: parseInt(e.target.value) || 0 })
                    }
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-lg p-2.5 font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Warranty (Months)</label>
                  <input
                    type="number"
                    value={editingProduct.warrantyMonths ?? 12}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, warrantyMonths: parseInt(e.target.value) || 0 })
                    }
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-lg p-2.5 font-mono"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-2.5 rounded-lg shadow-xs cursor-pointer"
                >
                  Save Product Attributes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Barcode Tag Print Preview Modal */}
      {barcodeLabelProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="font-bold text-sm text-slate-800">Barcode Tag Print Preview</h4>
              <button
                onClick={() => setBarcodeLabelProduct(null)}
                className="text-slate-400 hover:text-slate-700 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Sticker Tag */}
            <div className="border-2 border-slate-800 rounded-xl p-4 text-center space-y-2 bg-slate-50 font-mono">
              <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">OptiVision Jordan</div>
              <div className="font-sans text-sm font-extrabold text-slate-900">{barcodeLabelProduct.brand}</div>
              <div className="text-xs text-slate-700 font-sans font-medium">{barcodeLabelProduct.model}</div>

              {/* Barcode lines simulation */}
              <div className="py-2 flex items-center justify-center gap-1">
                {Array.from({ length: 28 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-10 ${i % 3 === 0 ? 'w-1 bg-black' : i % 2 === 0 ? 'w-0.5 bg-slate-800' : 'w-1.5 bg-slate-900'}`}
                  ></div>
                ))}
              </div>

              <div className="font-bold text-sm tracking-widest text-slate-900">{barcodeLabelProduct.barcode}</div>
              <div className="text-xs font-extrabold text-emerald-700 font-sans mt-1">
                PRICE: {barcodeLabelProduct.sellingPrice} JOD
              </div>
            </div>

            <button
              onClick={() => {
                alert(`Printing barcode tag for #${barcodeLabelProduct.barcode}...`);
                setBarcodeLabelProduct(null);
              }}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-xs"
            >
              <Printer className="w-4 h-4" />
              Print Sticker Label
            </button>
          </div>
        </div>
      )}

      {/* Accountant Excel / CSV Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-5 text-slate-900 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Import Products & Stock from Excel / CSV</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Upload product list to bulk insert new optical frames or update purchase costs & prices.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Success Banner */}
            {importSuccessMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                {importSuccessMsg}
              </div>
            )}

            {/* Step 1: Download Template or Upload File */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Step 1: Get Excel Template
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Download our formatted CSV template with required optical columns (Barcode, Brand, Model, Purchase Cost, Selling Price, Qty).
                  </p>
                </div>
                <button
                  onClick={handleDownloadTemplate}
                  className="bg-white hover:bg-slate-100 text-blue-700 border border-blue-200 font-bold text-xs px-3.5 py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Sample Template (.csv)
                </button>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    <UploadCloud className="w-4 h-4 text-emerald-600" />
                    Step 2: Upload CSV / Excel File
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Select the exported CSV file from your accounting or inventory system.
                  </p>
                </div>

                <label className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-2 text-center">
                  <Upload className="w-4 h-4" />
                  {importFileName ? `Selected: ${importFileName}` : 'Choose CSV File to Upload'}
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleCsvFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Step 2: Parsed Table Preview */}
            {parsedImportItems.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-900 flex items-center gap-2">
                    <span>Parsed Preview ({parsedImportItems.length} Products Found)</span>
                  </h4>
                  <div className="flex items-center gap-2 text-[10px] font-bold">
                    <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                      {parsedImportItems.filter((i) => !i.isUpdate).length} New
                    </span>
                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded border border-blue-200">
                      {parsedImportItems.filter((i) => i.isUpdate).length} Update Existing
                    </span>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-bold tracking-wider sticky top-0">
                      <tr>
                        <th className="p-2.5">Action</th>
                        <th className="p-2.5">Barcode</th>
                        <th className="p-2.5">Brand & Model</th>
                        <th className="p-2.5">Frame Type</th>
                        <th className="p-2.5">Cost (JOD)</th>
                        <th className="p-2.5">Price (JOD)</th>
                        <th className="p-2.5">Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                      {parsedImportItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2.5">
                            {item.isUpdate ? (
                              <span className="bg-blue-50 text-blue-700 border border-blue-200 font-bold text-[9px] px-1.5 py-0.5 rounded">
                                Update
                              </span>
                            ) : (
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[9px] px-1.5 py-0.5 rounded">
                                New Item
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 font-mono font-bold text-slate-900">{item.barcode}</td>
                          <td className="p-2.5">
                            <span className="font-bold">{item.brand}</span> {item.model}
                          </td>
                          <td className="p-2.5">{item.frameType}</td>
                          <td className="p-2.5 font-bold text-slate-900">{item.purchaseCost.toFixed(2)}</td>
                          <td className="p-2.5 font-bold text-emerald-700">{item.sellingPrice.toFixed(2)}</td>
                          <td className="p-2.5 font-mono">{item.currentQuantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Modal Footer Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-bold text-xs transition cursor-pointer"
              >
                Close
              </button>

              {parsedImportItems.length > 0 && (
                <button
                  type="button"
                  onClick={handleExecuteImport}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow-xs transition cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Import & Save {parsedImportItems.length} Products
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
