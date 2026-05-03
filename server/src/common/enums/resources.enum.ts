/**
 * Enum for all available resources in the RBAC system
 */
export enum ResourceName {
  USERS = 'USERS',
  ROLES = 'ROLES',
  RBAC = 'RBAC',
  ACTIONS = 'ACTIONS',
  RESOURCES = 'RESOURCES',
  PROFILES = 'PROFILES',
  SETTINGS = 'SETTINGS',
  ORGANIZATIONS = 'ORGANIZATIONS',
  EMPLOYEES = 'EMPLOYEES',
  ENQUIRIES = 'ENQUIRIES',
  FEEDBACKS = 'FEEDBACKS',
  ASSETS = 'ASSETS',
  SUBSCRIPTIONS = 'SUBSCRIPTIONS',
  INVOICES = 'INVOICES',
  AUDIT_LOGS = 'AUDITLOGS',
  NOTIFICATIONS = 'NOTIFICATIONS',
  ANALYTICS = 'ANALYTICS',
  OVERVIEW = 'OVERVIEW',
  PROJECTS = 'PROJECTS',
  TICKETS = 'TICKETS',
  SPRINTS = 'SPRINTS',
  BOARDS = 'BOARDS',
  CRM_COMPANIES = 'CRM_COMPANIES',
  CRM_CONTACTS = 'CRM_CONTACTS',
  CRM_DEALS = 'CRM_DEALS',
  CRM_ACTIVITIES = 'CRM_ACTIVITIES',
  FIN_TAX_RATES = 'FIN_TAX_RATES',
  FIN_PRODUCTS = 'FIN_PRODUCTS',
  FIN_VENDORS = 'FIN_VENDORS',
  FIN_INVOICES = 'FIN_INVOICES',
  FIN_ESTIMATES = 'FIN_ESTIMATES',
  FIN_RECURRING_INVOICES = 'FIN_RECURRING_INVOICES',
  FIN_EXPENSE_CATEGORIES = 'FIN_EXPENSE_CATEGORIES',
  FIN_EXPENSES = 'FIN_EXPENSES',
  HR_DEPARTMENTS = 'HR_DEPARTMENTS',
  HR_DESIGNATIONS = 'HR_DESIGNATIONS',
  HR_LEAVE_TYPES = 'HR_LEAVE_TYPES',
  HR_LEAVE_REQUESTS = 'HR_LEAVE_REQUESTS',
  HR_ATTENDANCE = 'HR_ATTENDANCE',
  HR_PAYROLL = 'HR_PAYROLL',
  HR_ANNOUNCEMENTS = 'HR_ANNOUNCEMENTS',
  HR_LEAVE_BALANCES = 'HR_LEAVE_BALANCES',
  HR_DOCUMENTS = 'HR_DOCUMENTS',
  HR_DASHBOARD = 'HR_DASHBOARD',
  ALL = 'ALL', // Special resource that grants access to all resources
}

/**
 * Array of all resource names for validation and iteration
 */
export const ALL_RESOURCES = Object.values(ResourceName);

/**
 * Array of specific resource names (excluding ALL)
 */
export const SPECIFIC_RESOURCES = Object.values(ResourceName).filter(
  (resource) => resource !== ResourceName.ALL,
);

/**
 * Check if a string is a valid resource name
 * @param resource - The resource string to validate
 * @returns true if resource exists, false otherwise
 */
export function isValidResource(resource: string): resource is ResourceName {
  return Object.values(ResourceName).includes(resource as ResourceName);
}
