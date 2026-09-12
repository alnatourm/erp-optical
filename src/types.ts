export type FrameType = 'Full Rim' | 'Semi Rimless' | 'Rimless' | 'Sunglasses' | 'Contact Lens' | 'Ophthalmic Lens' | 'Accessory' | 'Service';
export type Gender = 'Men' | 'Women' | 'Unisex' | 'Kids';
export type AgeGroup = 'Adult' | 'Kids' | 'Senior' | 'Unisex';
export type ProductStatus = 'Active' | 'Low Stock' | 'Out of Stock' | 'Discontinued';

export type UserRole = 'admin' | 'accountant' | 'sales_person' | 'call_center' | 'lab_tech';

export interface UserAccount {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  branchId: string; // "all" or specific branch id
  email?: string;
  phone?: string;
  pin?: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  phone: string;
  address: string;
  manager?: string;
  city?: string;
  isMain?: boolean;
}

export interface Product {
  id: string;
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
  supplier: string;
  purchaseCost: number;
  sellingPrice: number;
  discountPrice?: number;
  tax: number; // percentage e.g. 16%
  currentQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  minimumStock: number;
  maximumStock: number;
  warehouse: string;
  branchId: string;
  status: ProductStatus;
  warrantyMonths: number;
  createdDate: string;
  updatedDate: string;
}

export interface StockImportLog {
  id: string;
  filename: string;
  importedBy: string;
  importDate: string;
  branchId: string;
  totalItems: number;
  newItemsCount: number;
  updatedItemsCount: number;
  duplicateBarcodes: string[];
  status: 'Completed' | 'Failed' | 'Warning';
  notes?: string;
}

export interface EyePrescription {
  sph: string; // e.g. "-2.25"
  cyl: string; // e.g. "-0.75"
  axis: string; // e.g. "180"
}

export interface OpticalPrescription {
  rightEye: EyePrescription;
  leftEye: EyePrescription;
  add?: string;
  a?: string;
  b?: string;
  c?: string;
  ipd?: string; // Interpupillary Distance in mm
  optometristName?: string;
  prescriptionDate?: string;
}

export interface InvoiceItem {
  barcode: string;
  description: string;
  itemType: 'frame' | 'lens' | 'contact_lens' | 'accessory' | 'service';
  price: number;
  quantity: number;
  discount: number;
  total: number;
  productId?: string;
  lensDetails?: {
    lensType: string; // Single Vision, Bifocal, Progressive
    index: string; // 1.56, 1.61, 1.67, 1.74
    coating: string; // Anti-Reflective, Blue Block, Photochromic
  };
}

export type PaymentMethod = 'Cash' | 'Credit Card' | 'Visa' | 'Cliq' | 'Insurance' | 'Split' | 'Bank Transfer';
export type InvoiceStatus = 'Draft' | 'Confirmed' | 'Completed' | 'Cancelled';
export type DeliveryStatus = 'In Store' | 'Sent to Lab' | 'Lab In Progress' | 'Dispatched from Lab' | 'Ready for Delivery' | 'Delivered';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  deliveryDate: string;
  branchId: string;
  salesEmployee: string;
  cashier: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  prescription: OpticalPrescription;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  tax: number; // calculated tax amount
  grandTotal: number;
  paidAmount: number;
  remainingBalance: number;
  splitMethods?: { method: string, amount: number }[];
  paymentMethod: PaymentMethod;
  invoiceStatus: InvoiceStatus;
  deliveryStatus: DeliveryStatus;
  warrantyTerms: string;
  notes?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  secondaryPhone?: string;
  email?: string;
  address?: string;
  birthDate?: string;
  gender?: 'Male' | 'Female';
  membershipLevel: 'Standard' | 'Silver' | 'Gold' | 'VIP';
  loyaltyPoints: number;
  notes?: string;
  createdAt: string;
}

export interface CallReminder {
  id: string;
  customerId: string;
  customerName: string;
  phone: string;
  invoiceNumber?: string;
  ruleType: 'post_sale_satisfaction' | '6_month_eye_check' | '1_month_contact_lens_reminder' | 'birthday_greeting' | 'custom_followup';
  scheduledDate: string;
  status: 'Pending' | 'Completed' | 'Rescheduled' | 'Cancelled';
  callDate?: string;
  agentNotes?: string;
  assignedBranchId: string;
}

export interface AppSetting {
  id: string; // e.g., 'lab_status_labels'
  value: Record<string, string>; // mapping from status ID to custom label
}

export interface LaboratoryJob {
  id: string;
  jobOrderNumber: string;
  invoiceNumber: string;
  customerName: string;
  branchId: string;
  frameBarcode: string;
  frameDescription: string;
  rightEyePrescription: string;
  leftEyePrescription: string;
  lensType: string;
  coating: string;
  technicianName?: string;
  status: 'Received at Lab' | 'Lens Edging' | 'Quality Check' | 'Ready for Pickup' | 'Delivered' | 'Frame Broken / Repair';
  repairCost?: number;
  notes?: string;
  sentDate: string;
  completedDate?: string;
}

export interface DailyCashClosing {
  id: string;
  branchId: string;
  date: string;
  openingBalance: number;
  cashSales: number;
  cardSales: number;
  visaSales?: number;
  cliqSales?: number;
  bankTransferSales?: number;
  insuranceSales?: number;
  expenses: number;
  expenseDetails?: { id: string; title: string; amount: number; category: string; time: string }[];
  cashInSafe: number;
  reconciliationDifference: number;
  closedBy: string;
  status: 'Open' | 'Closed' | 'Approved' | 'HandedOver';
  handoverToAccountant?: {
    accountantName: string;
    amountHanded: number;
    handoverTime: string;
    handoverBy: string;
    notes?: string;
  };
  notes?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  balance: number;
  address: string;
  purchaseOrdersNotes?: string;
}

export interface InventoryAuditItem {
  productId: string;
  barcode: string;
  brand: string;
  model: string;
  expectedQuantity: number;
  actualQuantity: number;
  status: 'Pending' | 'Present' | 'Missing' | 'Extra';
}

export interface InventoryAudit {
  id: string;
  branchId: string;
  createdDate: string;
  createdBy: string;
  status: 'In Progress' | 'Completed';
  completedDate?: string;
  completedBy?: string;
  items: InventoryAuditItem[];
  notes?: string;
}


export type POStatus = 'Pending' | 'Partially Received' | 'Received' | 'Cancelled';

export interface PurchaseOrderItem {
  barcode: string;
  description: string;
  quantityOrdered: number;
  quantityReceived: number;
  unitPrice: number;
  totalPrice: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  status: POStatus;
  items: PurchaseOrderItem[];
  totalAmount: number;
  notes?: string;
  branchId: string;
  createdBy: string;
}
