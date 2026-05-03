// Role entity types and interfaces for RBAC

export type PermissionStructure = {
  [resource: string]: string[];
};

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: PermissionStructure;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

// Action types as const assertions for all possible actions
export const ActionType = {
  CREATE: "CREATE",
  READ: "READ",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
  LIST: "LIST",
  EXPORT: "EXPORT",
  IMPORT: "IMPORT",
  VIEW: "VIEW",
  EDIT: "EDIT",
  APPROVE: "APPROVE",
  REJECT: "REJECT",
  PUBLISH: "PUBLISH",
  ARCHIVE: "ARCHIVE",
  RESTORE: "RESTORE",
} as const;

export type ActionType = (typeof ActionType)[keyof typeof ActionType];

// Module names as const assertions for all possible modules
export const ModuleName = {
  EMPLOYEE: "EMPLOYEES",
  ENQUIRY: "ENQUIRIES",
  FEEDBACK: "FEEDBACKS",
  ANALYTICS: "ANALYTICS",
  ROLE: "ROLES",
  ORGANIZATION: "ORGANIZATIONS",
  USER: "USERS",
  CONTACT: "CONTACTS",
  TEMPLATE: "TEMPLATES",
  CAMPAIGN: "CAMPAIGNS",
  SUBSCRIPTION: "SUBSCRIPTIONS",
  INVOICE: "INVOICES",
  DASHBOARD: "DASHBOARDS",
  REPORTS: "REPORTS",
  SETTINGS: "SETTINGS",
  AUDIT: "AUDITS",
  AUDITLOGS: "AUDITLOGS",
  NOTIFICATION: "NOTIFICATIONS",
  PROFILE: "PROFILES",
  PROJECT: "PROJECTS",
  TICKET: "TICKETS",
  SPRINT: "SPRINTS",
  BOARD: "BOARDS",
  CRM_COMPANY: "CRM_COMPANIES",
  CRM_CONTACT: "CRM_CONTACTS",
  CRM_DEAL: "CRM_DEALS",
  CRM_ACTIVITY: "CRM_ACTIVITIES",
  FIN_TAX_RATE: "FIN_TAX_RATES",
  FIN_PRODUCT: "FIN_PRODUCTS",
  FIN_VENDOR: "FIN_VENDORS",
  FIN_INVOICE: "FIN_INVOICES",
  FIN_ESTIMATE: "FIN_ESTIMATES",
  FIN_RECURRING_INVOICE: "FIN_RECURRING_INVOICES",
  FIN_EXPENSE_CATEGORY: "FIN_EXPENSE_CATEGORIES",
  FIN_EXPENSE: "FIN_EXPENSES",
  HR_DEPARTMENT: "HR_DEPARTMENTS",
  HR_DESIGNATION: "HR_DESIGNATIONS",
  HR_ANNOUNCEMENT: "HR_ANNOUNCEMENTS",
  HR_DOCUMENT: "HR_DOCUMENTS",
  HR_LEAVE_TYPE: "HR_LEAVE_TYPES",
  HR_LEAVE_REQUEST: "HR_LEAVE_REQUESTS",
  HR_LEAVE_BALANCE: "HR_LEAVE_BALANCES",
  HR_ATTENDANCE: "HR_ATTENDANCE",
  HR_PAYROLL: "HR_PAYROLL",
  HR_DASHBOARD: "HR_DASHBOARD",
} as const;

export type ModuleName = (typeof ModuleName)[keyof typeof ModuleName];

// Response type for module actions API
export interface ModuleActionsResponse {
  actions: ActionType[];
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
  permissions: PermissionStructure;
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  permissions?: PermissionStructure;
}

export interface GetRolesParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
