// ─── Tax Rates ──────────────────────────────────────────

export enum TaxRateType {
  GST = "GST",
  VAT = "VAT",
  SALES_TAX = "SALES_TAX",
  CUSTOM = "CUSTOM",
}

export const TaxRateTypeLabels: Record<TaxRateType, string> = {
  [TaxRateType.GST]: "GST",
  [TaxRateType.VAT]: "VAT",
  [TaxRateType.SALES_TAX]: "Sales Tax",
  [TaxRateType.CUSTOM]: "Custom",
};

export interface FinTaxRate {
  id: string;
  organizationId: string;
  name: string;
  rate: number;
  type: TaxRateType;
  description?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaxRateRequest {
  name: string;
  rate: number;
  type?: TaxRateType;
  description?: string;
  isDefault?: boolean;
  isActive?: boolean;
}

export type UpdateTaxRateRequest = Partial<CreateTaxRateRequest>;

// ─── Products ──────────────────────────────────────────

export enum ProductType {
  PRODUCT = "PRODUCT",
  SERVICE = "SERVICE",
}

export const ProductTypeLabels: Record<ProductType, string> = {
  [ProductType.PRODUCT]: "Product",
  [ProductType.SERVICE]: "Service",
};

export const ProductTypeColors: Record<ProductType, string> = {
  [ProductType.PRODUCT]: "text-blue-600 bg-blue-50",
  [ProductType.SERVICE]: "text-purple-600 bg-purple-50",
};

export interface FinProduct {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  type: ProductType;
  unitPrice: number;
  unit?: string;
  sku?: string;
  taxRateId?: string;
  taxRate?: FinTaxRate;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  type?: ProductType;
  unitPrice: number;
  unit?: string;
  sku?: string;
  taxRateId?: string;
  isActive?: boolean;
}

export type UpdateProductRequest = Partial<CreateProductRequest>;

// ─── Vendors ──────────────────────────────────────────

export interface FinVendor {
  id: string;
  organizationId: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  website?: string;
  notes?: string;
  crmCompanyId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVendorRequest {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  website?: string;
  notes?: string;
  crmCompanyId?: string;
  isActive?: boolean;
}

export type UpdateVendorRequest = Partial<CreateVendorRequest>;

// ─── Invoices ──────────────────────────────────────────

export enum InvoiceStatus {
  DRAFT = "DRAFT",
  SENT = "SENT",
  VIEWED = "VIEWED",
  PARTIALLY_PAID = "PARTIALLY_PAID",
  PAID = "PAID",
  OVERDUE = "OVERDUE",
  CANCELLED = "CANCELLED",
}

export const InvoiceStatusLabels: Record<InvoiceStatus, string> = {
  [InvoiceStatus.DRAFT]: "Draft",
  [InvoiceStatus.SENT]: "Sent",
  [InvoiceStatus.VIEWED]: "Viewed",
  [InvoiceStatus.PARTIALLY_PAID]: "Partially Paid",
  [InvoiceStatus.PAID]: "Paid",
  [InvoiceStatus.OVERDUE]: "Overdue",
  [InvoiceStatus.CANCELLED]: "Cancelled",
};

export const InvoiceStatusColors: Record<InvoiceStatus, string> = {
  [InvoiceStatus.DRAFT]: "text-gray-600 bg-gray-50",
  [InvoiceStatus.SENT]: "text-blue-600 bg-blue-50",
  [InvoiceStatus.VIEWED]: "text-indigo-600 bg-indigo-50",
  [InvoiceStatus.PARTIALLY_PAID]: "text-amber-600 bg-amber-50",
  [InvoiceStatus.PAID]: "text-green-600 bg-green-50",
  [InvoiceStatus.OVERDUE]: "text-red-600 bg-red-50",
  [InvoiceStatus.CANCELLED]: "text-slate-500 bg-slate-50",
};

export enum DiscountType {
  PERCENTAGE = "PERCENTAGE",
  FIXED = "FIXED",
}

export interface FinInvoiceItem {
  id?: string;
  productId?: string;
  product?: { id: string; name: string };
  description: string;
  quantity: number;
  unitPrice: number;
  taxRateId?: string;
  taxRate?: { id: string; name: string; rate: number };
  taxAmount: number;
  discountPercent: number;
  lineTotal: number;
  sortOrder: number;
}

export interface FinInvoice {
  id: string;
  organizationId: string;
  invoiceNumber: string;
  crmCompanyId?: string;
  crmCompany?: { id: string; name: string };
  crmContactId?: string;
  crmContact?: { id: string; firstName: string; lastName: string; email?: string };
  crmDealId?: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  taxTotal: number;
  discountAmount: number;
  discountType?: DiscountType;
  total: number;
  amountPaid: number;
  amountDue: number;
  currency: string;
  notes?: string;
  terms?: string;
  customerName?: string;
  customerEmail?: string;
  sentAt?: string;
  viewedAt?: string;
  paidAt?: string;
  items?: FinInvoiceItem[];
  payments?: FinInvoicePayment[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvoiceItemRequest {
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRateId?: string;
  discountPercent?: number;
  sortOrder?: number;
}

export interface CreateInvoiceRequest {
  crmCompanyId?: string;
  crmContactId?: string;
  crmDealId?: string;
  status?: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  discountAmount?: number;
  discountType?: DiscountType;
  currency?: string;
  notes?: string;
  terms?: string;
  customerName?: string;
  customerEmail?: string;
  items?: CreateInvoiceItemRequest[];
}

export type UpdateInvoiceRequest = Partial<CreateInvoiceRequest>;

// ─── Invoice Payments ──────────────────────────────────

export enum PaymentMethod {
  CASH = "CASH",
  BANK_TRANSFER = "BANK_TRANSFER",
  CARD = "CARD",
  UPI = "UPI",
  CHECK = "CHECK",
  OTHER = "OTHER",
}

export const PaymentMethodLabels: Record<PaymentMethod, string> = {
  [PaymentMethod.CASH]: "Cash",
  [PaymentMethod.BANK_TRANSFER]: "Bank Transfer",
  [PaymentMethod.CARD]: "Card",
  [PaymentMethod.UPI]: "UPI",
  [PaymentMethod.CHECK]: "Check",
  [PaymentMethod.OTHER]: "Other",
};

export interface FinInvoicePayment {
  id: string;
  invoiceId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentRequest {
  amount: number;
  paymentDate: string;
  paymentMethod?: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
}

// ─── Estimates ──────────────────────────────────────────

export enum EstimateStatus {
  DRAFT = "DRAFT",
  SENT = "SENT",
  VIEWED = "VIEWED",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
  EXPIRED = "EXPIRED",
  CONVERTED = "CONVERTED",
}

export const EstimateStatusLabels: Record<EstimateStatus, string> = {
  [EstimateStatus.DRAFT]: "Draft",
  [EstimateStatus.SENT]: "Sent",
  [EstimateStatus.VIEWED]: "Viewed",
  [EstimateStatus.ACCEPTED]: "Accepted",
  [EstimateStatus.REJECTED]: "Rejected",
  [EstimateStatus.EXPIRED]: "Expired",
  [EstimateStatus.CONVERTED]: "Converted",
};

export const EstimateStatusColors: Record<EstimateStatus, string> = {
  [EstimateStatus.DRAFT]: "text-gray-600 bg-gray-50",
  [EstimateStatus.SENT]: "text-blue-600 bg-blue-50",
  [EstimateStatus.VIEWED]: "text-indigo-600 bg-indigo-50",
  [EstimateStatus.ACCEPTED]: "text-green-600 bg-green-50",
  [EstimateStatus.REJECTED]: "text-red-600 bg-red-50",
  [EstimateStatus.EXPIRED]: "text-amber-600 bg-amber-50",
  [EstimateStatus.CONVERTED]: "text-purple-600 bg-purple-50",
};

export interface FinEstimate {
  id: string;
  organizationId: string;
  estimateNumber: string;
  crmCompanyId?: string;
  crmCompany?: { id: string; name: string };
  crmContactId?: string;
  crmContact?: { id: string; firstName: string; lastName: string; email?: string };
  crmDealId?: string;
  status: EstimateStatus;
  issueDate: string;
  validUntil?: string;
  subtotal: number;
  taxTotal: number;
  discountAmount: number;
  discountType?: DiscountType;
  total: number;
  currency: string;
  notes?: string;
  terms?: string;
  customerName?: string;
  customerEmail?: string;
  version: number;
  convertedInvoiceId?: string;
  sentAt?: string;
  viewedAt?: string;
  acceptedAt?: string;
  rejectedAt?: string;
  items?: FinInvoiceItem[];
  createdAt: string;
  updatedAt: string;
}

export interface FinEstimateVersion {
  id: string;
  estimateId: string;
  version: number;
  snapshot: FinEstimate;
  createdAt: string;
  createdBy?: string;
}

export interface CreateEstimateRequest {
  crmCompanyId?: string;
  crmContactId?: string;
  crmDealId?: string;
  status?: EstimateStatus;
  issueDate: string;
  validUntil?: string;
  discountAmount?: number;
  discountType?: DiscountType;
  currency?: string;
  notes?: string;
  terms?: string;
  customerName?: string;
  customerEmail?: string;
  items?: CreateInvoiceItemRequest[];
}

export type UpdateEstimateRequest = Partial<CreateEstimateRequest>;

// ─── Recurring Invoices ──────────────────────────────────

export enum RecurringFrequency {
  WEEKLY = "WEEKLY",
  BIWEEKLY = "BIWEEKLY",
  MONTHLY = "MONTHLY",
  QUARTERLY = "QUARTERLY",
  SEMI_ANNUALLY = "SEMI_ANNUALLY",
  YEARLY = "YEARLY",
}

export const RecurringFrequencyLabels: Record<RecurringFrequency, string> = {
  [RecurringFrequency.WEEKLY]: "Weekly",
  [RecurringFrequency.BIWEEKLY]: "Bi-weekly",
  [RecurringFrequency.MONTHLY]: "Monthly",
  [RecurringFrequency.QUARTERLY]: "Quarterly",
  [RecurringFrequency.SEMI_ANNUALLY]: "Semi-annually",
  [RecurringFrequency.YEARLY]: "Yearly",
};

export interface FinRecurringInvoice {
  id: string;
  organizationId: string;
  basedOnInvoiceId: string;
  basedOnInvoice?: { id: string; invoiceNumber: string; customerName?: string; total: number; currency: string };
  frequency: RecurringFrequency;
  nextIssueDate: string;
  endDate?: string;
  autoSend: boolean;
  isActive: boolean;
  lastGeneratedAt?: string;
  totalGenerated: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRecurringInvoiceRequest {
  basedOnInvoiceId: string;
  frequency: RecurringFrequency;
  nextIssueDate: string;
  endDate?: string;
  autoSend?: boolean;
  isActive?: boolean;
}

export type UpdateRecurringInvoiceRequest = Partial<CreateRecurringInvoiceRequest>;

// ─── Expense Categories ──────────────────────────────────

export interface FinExpenseCategory {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseCategoryRequest {
  name: string;
  description?: string;
  isActive?: boolean;
}

export type UpdateExpenseCategoryRequest = Partial<CreateExpenseCategoryRequest>;

// ─── Expenses ──────────────────────────────────────────

export enum ReimbursementStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  REIMBURSED = "REIMBURSED",
}

export const ReimbursementStatusLabels: Record<ReimbursementStatus, string> = {
  [ReimbursementStatus.PENDING]: "Pending",
  [ReimbursementStatus.APPROVED]: "Approved",
  [ReimbursementStatus.REJECTED]: "Rejected",
  [ReimbursementStatus.REIMBURSED]: "Reimbursed",
};

export const ReimbursementStatusColors: Record<ReimbursementStatus, string> = {
  [ReimbursementStatus.PENDING]: "text-amber-600 bg-amber-50",
  [ReimbursementStatus.APPROVED]: "text-green-600 bg-green-50",
  [ReimbursementStatus.REJECTED]: "text-red-600 bg-red-50",
  [ReimbursementStatus.REIMBURSED]: "text-blue-600 bg-blue-50",
};

export interface FinExpense {
  id: string;
  organizationId: string;
  categoryId?: string;
  category?: { id: string; name: string };
  vendorId?: string;
  vendor?: { id: string; name: string };
  amount: number;
  expenseDate: string;
  description?: string;
  receiptAssetId?: string;
  paymentMethod?: PaymentMethod;
  referenceNumber?: string;
  isRecurring: boolean;
  recurringFrequency?: string;
  isReimbursable: boolean;
  reimbursementStatus?: ReimbursementStatus;
  notes?: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseRequest {
  categoryId?: string;
  vendorId?: string;
  amount: number;
  expenseDate: string;
  description?: string;
  receiptAssetId?: string;
  paymentMethod?: PaymentMethod;
  referenceNumber?: string;
  isRecurring?: boolean;
  recurringFrequency?: string;
  isReimbursable?: boolean;
  reimbursementStatus?: ReimbursementStatus;
  notes?: string;
  currency?: string;
}

export type UpdateExpenseRequest = Partial<CreateExpenseRequest>;

// ─── Dashboard ──────────────────────────────────────────

export interface FinanceDashboardStats {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  outstanding: number;
  overdue: number;
  overdueCount: number;
  totalInvoices: number;
  totalExpenseCount: number;
  recentInvoices: FinInvoice[];
  recentExpenses: FinExpense[];
}

export interface AgingBucket {
  count: number;
  amount: number;
  invoices: FinInvoice[];
}

export interface AgingReport {
  current: AgingBucket;
  "1_30": AgingBucket;
  "31_60": AgingBucket;
  "61_90": AgingBucket;
  "90_plus": AgingBucket;
}

// ─── Activities ──────────────────────────────────────────

export enum FinActivityAction {
  CREATE = "CREATE",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
  STATUS_CHANGE = "STATUS_CHANGE",
  CONVERT = "CONVERT",
  PAYMENT = "PAYMENT",
}

export const FinActivityActionLabels: Record<FinActivityAction, string> = {
  [FinActivityAction.CREATE]: "Created",
  [FinActivityAction.UPDATE]: "Updated",
  [FinActivityAction.DELETE]: "Deleted",
  [FinActivityAction.STATUS_CHANGE]: "Status Changed",
  [FinActivityAction.CONVERT]: "Converted",
  [FinActivityAction.PAYMENT]: "Payment",
};

export const FinActivityActionColors: Record<FinActivityAction, string> = {
  [FinActivityAction.CREATE]: "text-green-600 bg-green-50",
  [FinActivityAction.UPDATE]: "text-blue-600 bg-blue-50",
  [FinActivityAction.DELETE]: "text-red-600 bg-red-50",
  [FinActivityAction.STATUS_CHANGE]: "text-amber-600 bg-amber-50",
  [FinActivityAction.CONVERT]: "text-purple-600 bg-purple-50",
  [FinActivityAction.PAYMENT]: "text-indigo-600 bg-indigo-50",
};

export enum FinEntityType {
  INVOICE = "INVOICE",
  ESTIMATE = "ESTIMATE",
  PRODUCT = "PRODUCT",
  VENDOR = "VENDOR",
  EXPENSE = "EXPENSE",
  EXPENSE_CATEGORY = "EXPENSE_CATEGORY",
  TAX_RATE = "TAX_RATE",
  RECURRING_INVOICE = "RECURRING_INVOICE",
}

export const FinEntityTypeLabels: Record<FinEntityType, string> = {
  [FinEntityType.INVOICE]: "Invoice",
  [FinEntityType.ESTIMATE]: "Estimate",
  [FinEntityType.PRODUCT]: "Product",
  [FinEntityType.VENDOR]: "Vendor",
  [FinEntityType.EXPENSE]: "Expense",
  [FinEntityType.EXPENSE_CATEGORY]: "Expense Category",
  [FinEntityType.TAX_RATE]: "Tax Rate",
  [FinEntityType.RECURRING_INVOICE]: "Recurring Invoice",
};

export interface FinActivity {
  id: string;
  action: FinActivityAction;
  entityType: FinEntityType;
  entityId?: string;
  description?: string;
  performedByUser?: { id: string; firstName: string; lastName: string; email: string };
  details?: any;
  createdAt: string;
}

// ─── CSV Import ──────────────────────────────────────────

export interface FinanceCsvImportResult {
  imported: number;
  errors: string[];
}

// ─── Currency ──────────────────────────────────────────

export const FINANCE_CURRENCIES = [
  { value: "INR", label: "INR (\u20B9)" },
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (\u20AC)" },
  { value: "GBP", label: "GBP (\u00A3)" },
] as const;

// ─── Helpers ──────────────────────────────────────────

export function formatCurrency(amount: number, currency = "INR"): string {
  const locale = currency === "INR" ? "en-IN" : "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}
