// ─── Company ──────────────────────────────────────────

export enum CompanySize {
  STARTUP = "STARTUP",
  SMALL = "SMALL",
  MEDIUM = "MEDIUM",
  LARGE = "LARGE",
  ENTERPRISE = "ENTERPRISE",
}

export enum CompanyStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

export const CompanySizeLabels: Record<CompanySize, string> = {
  [CompanySize.STARTUP]: "Startup",
  [CompanySize.SMALL]: "Small",
  [CompanySize.MEDIUM]: "Medium",
  [CompanySize.LARGE]: "Large",
  [CompanySize.ENTERPRISE]: "Enterprise",
};

export const CompanyStatusLabels: Record<CompanyStatus, string> = {
  [CompanyStatus.ACTIVE]: "Active",
  [CompanyStatus.INACTIVE]: "Inactive",
};

export interface CrmCompany {
  id: string;
  organizationId: string;
  name: string;
  industry?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  size?: CompanySize;
  annualRevenue?: number;
  status: CompanyStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCompanyRequest {
  name: string;
  industry?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  size?: CompanySize;
  annualRevenue?: number;
  status?: CompanyStatus;
  notes?: string;
}

export type UpdateCompanyRequest = Partial<CreateCompanyRequest>;

// ─── Contact ──────────────────────────────────────────

export enum ContactStatus {
  LEAD = "LEAD",
  PROSPECT = "PROSPECT",
  CUSTOMER = "CUSTOMER",
  CHURNED = "CHURNED",
}

export enum ContactSource {
  WEBSITE = "WEBSITE",
  REFERRAL = "REFERRAL",
  SOCIAL_MEDIA = "SOCIAL_MEDIA",
  COLD_OUTREACH = "COLD_OUTREACH",
  EVENT = "EVENT",
  OTHER = "OTHER",
}

export const ContactStatusLabels: Record<ContactStatus, string> = {
  [ContactStatus.LEAD]: "Lead",
  [ContactStatus.PROSPECT]: "Prospect",
  [ContactStatus.CUSTOMER]: "Customer",
  [ContactStatus.CHURNED]: "Churned",
};

export const ContactSourceLabels: Record<ContactSource, string> = {
  [ContactSource.WEBSITE]: "Website",
  [ContactSource.REFERRAL]: "Referral",
  [ContactSource.SOCIAL_MEDIA]: "Social Media",
  [ContactSource.COLD_OUTREACH]: "Cold Outreach",
  [ContactSource.EVENT]: "Event",
  [ContactSource.OTHER]: "Other",
};

export interface CrmContact {
  id: string;
  organizationId: string;
  companyId?: string;
  ownerId?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  status: ContactStatus;
  source?: ContactSource;
  notes?: string;
  lastContactedAt?: string;
  company?: { id: string; name: string };
  owner?: { id: string; firstName: string; lastName: string };
  createdAt: string;
  updatedAt: string;
}

export interface CreateContactRequest {
  companyId?: string;
  ownerId?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  status?: ContactStatus;
  source?: ContactSource;
  notes?: string;
  lastContactedAt?: string;
}

export type UpdateContactRequest = Partial<CreateContactRequest>;

// ─── Deal ──────────────────────────────────────────

export enum DealStage {
  LEAD = "LEAD",
  QUALIFIED = "QUALIFIED",
  PROPOSAL = "PROPOSAL",
  NEGOTIATION = "NEGOTIATION",
  CLOSED_WON = "CLOSED_WON",
  CLOSED_LOST = "CLOSED_LOST",
}

export enum DealPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
}

export const DealStageLabels: Record<DealStage, string> = {
  [DealStage.LEAD]: "Lead",
  [DealStage.QUALIFIED]: "Qualified",
  [DealStage.PROPOSAL]: "Proposal",
  [DealStage.NEGOTIATION]: "Negotiation",
  [DealStage.CLOSED_WON]: "Closed Won",
  [DealStage.CLOSED_LOST]: "Closed Lost",
};

export const DealStageColors: Record<DealStage, string> = {
  [DealStage.LEAD]: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  [DealStage.QUALIFIED]: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  [DealStage.PROPOSAL]: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  [DealStage.NEGOTIATION]: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  [DealStage.CLOSED_WON]: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  [DealStage.CLOSED_LOST]: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

export const DealPriorityLabels: Record<DealPriority, string> = {
  [DealPriority.LOW]: "Low",
  [DealPriority.MEDIUM]: "Medium",
  [DealPriority.HIGH]: "High",
};

export const STAGE_ORDER: DealStage[] = [
  DealStage.LEAD,
  DealStage.QUALIFIED,
  DealStage.PROPOSAL,
  DealStage.NEGOTIATION,
  DealStage.CLOSED_WON,
  DealStage.CLOSED_LOST,
];

export interface CrmDeal {
  id: string;
  organizationId: string;
  contactId?: string;
  companyId?: string;
  ownerId?: string;
  title: string;
  value: number;
  currency: string;
  stage: DealStage;
  probability: number;
  expectedCloseDate?: string;
  actualCloseDate?: string;
  priority: DealPriority;
  notes?: string;
  position: number;
  contact?: { id: string; firstName: string; lastName: string; email?: string };
  company?: { id: string; name: string };
  owner?: { id: string; firstName: string; lastName: string };
  createdAt: string;
  updatedAt: string;
}

export interface CreateDealRequest {
  contactId?: string;
  companyId?: string;
  ownerId?: string;
  title: string;
  value?: number;
  currency?: string;
  stage?: DealStage;
  probability?: number;
  expectedCloseDate?: string;
  priority?: DealPriority;
  notes?: string;
}

export type UpdateDealRequest = Partial<CreateDealRequest>;

export interface UpdateDealStageRequest {
  stage: DealStage;
  position?: number;
}

export type DealPipeline = Record<DealStage, CrmDeal[]>;

// ─── Activity ──────────────────────────────────────────

export enum ActivityType {
  NOTE = "NOTE",
  CALL = "CALL",
  EMAIL = "EMAIL",
  MEETING = "MEETING",
  TASK = "TASK",
}

export enum ActivityStatus {
  PLANNED = "PLANNED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export const ActivityTypeLabels: Record<ActivityType, string> = {
  [ActivityType.NOTE]: "Note",
  [ActivityType.CALL]: "Call",
  [ActivityType.EMAIL]: "Email",
  [ActivityType.MEETING]: "Meeting",
  [ActivityType.TASK]: "Task",
};

export const ActivityStatusLabels: Record<ActivityStatus, string> = {
  [ActivityStatus.PLANNED]: "Planned",
  [ActivityStatus.COMPLETED]: "Completed",
  [ActivityStatus.CANCELLED]: "Cancelled",
};

export interface CrmActivity {
  id: string;
  organizationId: string;
  contactId?: string;
  companyId?: string;
  dealId?: string;
  type: ActivityType;
  subject: string;
  description?: string;
  activityDate: string;
  durationMinutes?: number;
  status: ActivityStatus;
  dueDate?: string;
  isReminder: boolean;
  contact?: { id: string; firstName: string; lastName: string };
  company?: { id: string; name: string };
  deal?: { id: string; title: string };
  createdAt: string;
  updatedAt: string;
}

export interface CreateActivityRequest {
  contactId?: string;
  companyId?: string;
  dealId?: string;
  type: ActivityType;
  subject: string;
  description?: string;
  activityDate: string;
  durationMinutes?: number;
  status?: ActivityStatus;
  dueDate?: string;
  isReminder?: boolean;
}

export type UpdateActivityRequest = Partial<CreateActivityRequest>;

// ─── Dashboard ──────────────────────────────────────────

export interface CrmDashboardStats {
  totalContacts: number;
  totalCompanies: number;
  totalDeals: number;
  totalPipelineValue: number;
  wonRevenue: number;
  winRate: number;
  weightedForecast: number;
  pipelineByStage: Record<DealStage, { count: number; value: number }>;
  upcomingReminders: CrmActivity[];
}

export interface CsvImportResult {
  imported: number;
  errors: string[];
}

// ─── Currency Utility ──────────────────────────────────────────

export const EXCHANGE_RATES_FROM_USD: Record<string, number> = {
  USD: 1,
  INR: 92.5,
  EUR: 0.87,
  GBP: 0.75,
};

export function convertCurrency(valueInUsd: number, targetCurrency: string): number {
  const rate = EXCHANGE_RATES_FROM_USD[targetCurrency] ?? 1;
  return valueInUsd * rate;
}

export function formatCrmCurrency(valueInUsd: number, currency?: string): string {
  const cur = currency || (typeof window !== "undefined"
    ? JSON.parse(sessionStorage.getItem("app-store") || "{}").state?.crmCurrency
    : null) || "INR";
  const converted = convertCurrency(valueInUsd, cur);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: cur,
    maximumFractionDigits: 0,
  }).format(converted);
}

// ─── Audit Activities ──────────────────────────────────────

export enum CrmAuditAction {
  CREATE = "CREATE",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
  IMPORT = "IMPORT",
  STAGE_CHANGE = "STAGE_CHANGE",
}

export const CrmAuditActionLabels: Record<CrmAuditAction, string> = {
  [CrmAuditAction.CREATE]: "Created",
  [CrmAuditAction.UPDATE]: "Updated",
  [CrmAuditAction.DELETE]: "Deleted",
  [CrmAuditAction.IMPORT]: "Imported",
  [CrmAuditAction.STAGE_CHANGE]: "Stage Changed",
};

export const CrmAuditActionColors: Record<CrmAuditAction, string> = {
  [CrmAuditAction.CREATE]: "text-green-600 bg-green-50",
  [CrmAuditAction.UPDATE]: "text-blue-600 bg-blue-50",
  [CrmAuditAction.DELETE]: "text-red-600 bg-red-50",
  [CrmAuditAction.IMPORT]: "text-purple-600 bg-purple-50",
  [CrmAuditAction.STAGE_CHANGE]: "text-amber-600 bg-amber-50",
};

export enum CrmAuditEntityType {
  COMPANY = "COMPANY",
  CONTACT = "CONTACT",
  DEAL = "DEAL",
}

export const CrmAuditEntityTypeLabels: Record<CrmAuditEntityType, string> = {
  [CrmAuditEntityType.COMPANY]: "Company",
  [CrmAuditEntityType.CONTACT]: "Contact",
  [CrmAuditEntityType.DEAL]: "Deal",
};

export interface CrmAuditActivity {
  id: string;
  action: CrmAuditAction;
  entityType: CrmAuditEntityType;
  entityId?: string;
  description?: string;
  performedByUser?: { id: string; firstName: string; lastName: string; email: string };
  details?: any;
  createdAt: string;
}
