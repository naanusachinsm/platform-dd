import { QueryInterface } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    const now = new Date();
    const roles = [
      {
        id: '550e8400-e29b-41d4-a716-446655440299',
        name: 'SUPERADMIN',
        description:
          'Super Administrator with complete system access and management privileges',
        permissions: JSON.stringify({
          // RBAC Related
          ROLES: ['CREATE', 'READ', 'UPDATE', 'LIST', 'EXPORT'],
          RBAC: ['CREATE', 'READ', 'UPDATE', 'LIST', 'EXPORT'],
          RESOURCES: ['CREATE', 'READ', 'UPDATE', 'LIST', 'EXPORT'],
          ACTIONS: ['CREATE', 'READ', 'UPDATE', 'LIST', 'EXPORT'],
          // Organization and User Management
          ORGANIZATIONS: ['CREATE', 'READ', 'UPDATE', 'LIST', 'EXPORT'],
          USERS: ['CREATE', 'READ', 'UPDATE', 'LIST', 'EXPORT'],
          EMPLOYEES: ['CREATE', 'READ', 'UPDATE', 'LIST', 'EXPORT'],
          // Subscription Management
          SUBSCRIPTIONS: ['READ', 'UPDATE', 'LIST', 'EXPORT'],
          INVOICES: ['READ', 'UPDATE', 'LIST', 'EXPORT'],
          // Assets
          ASSETS: ['CREATE', 'READ', 'DELETE', 'LIST'],
          // Task Tracking
          PROJECTS: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LIST', 'EXPORT'],
          TICKETS: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LIST', 'EXPORT'],
          SPRINTS: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LIST', 'EXPORT'],
          BOARDS: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LIST', 'EXPORT'],
          // Finance
          FIN_TAX_RATES: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LIST', 'EXPORT'],
          FIN_PRODUCTS: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LIST', 'EXPORT'],
          FIN_VENDORS: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LIST', 'EXPORT'],
          FIN_INVOICES: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LIST', 'EXPORT'],
          FIN_ESTIMATES: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LIST', 'EXPORT'],
          FIN_RECURRING_INVOICES: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LIST', 'EXPORT'],
          FIN_EXPENSE_CATEGORIES: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LIST', 'EXPORT'],
          FIN_EXPENSES: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LIST', 'EXPORT'],
          // HR
          HR_DEPARTMENTS: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LIST', 'EXPORT'],
          HR_DESIGNATIONS: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LIST', 'EXPORT'],
          HR_LEAVE_TYPES: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LIST', 'EXPORT'],
          HR_LEAVE_REQUESTS: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LIST', 'EXPORT'],
          HR_LEAVE_BALANCES: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LIST', 'EXPORT'],
          HR_ATTENDANCE: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LIST', 'EXPORT'],
          HR_PAYROLL: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LIST', 'EXPORT'],
          HR_ANNOUNCEMENTS: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LIST', 'EXPORT'],
          HR_DOCUMENTS: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LIST', 'EXPORT'],
          HR_DASHBOARD: ['READ', 'LIST'],
          // Other
          PROFILES: ['READ', 'UPDATE', 'LIST', 'EXPORT'],
          SETTINGS: ['READ', 'UPDATE', 'LIST', 'EXPORT'],
          ANALYTICS: ['READ', 'UPDATE', 'LIST', 'EXPORT'],
          AUDITLOGS: ['READ', 'UPDATE', 'LIST', 'EXPORT'],
          OVERVIEW: ['READ', 'UPDATE', 'LIST', 'EXPORT'],
        }),
        created_at: now,
        updated_at: now,
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440300',
        name: 'ADMIN',
        description: 'Administrator with full access to all features',
        permissions: JSON.stringify({
          // RBAC Related
          ROLES: ['CREATE', 'READ', 'UPDATE', 'LIST'],
          RBAC: ['CREATE', 'READ', 'UPDATE', 'LIST'],
          RESOURCES: ['CREATE', 'READ', 'UPDATE', 'LIST'],
          ACTIONS: ['CREATE', 'READ', 'UPDATE', 'LIST'],
          // Organization and User Management
          ORGANIZATIONS: ['READ', 'UPDATE', 'LIST'],
          USERS: ['CREATE', 'READ', 'UPDATE', 'LIST'],
          EMPLOYEES: [],
          // Subscription Management
          SUBSCRIPTIONS: ['CREATE', 'READ', 'UPDATE', 'LIST'],
          INVOICES: ['CREATE', 'READ', 'UPDATE', 'LIST'],
          // Assets
          ASSETS: ['CREATE', 'READ', 'DELETE', 'LIST'],
          // Task Tracking
          PROJECTS: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LIST'],
          TICKETS: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LIST'],
          SPRINTS: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LIST'],
          BOARDS: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LIST'],
          // Finance
          FIN_TAX_RATES: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LIST'],
          FIN_PRODUCTS: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LIST'],
          FIN_VENDORS: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LIST'],
          FIN_INVOICES: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LIST'],
          FIN_ESTIMATES: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LIST'],
          FIN_RECURRING_INVOICES: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LIST'],
          FIN_EXPENSE_CATEGORIES: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LIST'],
          FIN_EXPENSES: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LIST'],
          // HR
          HR_DEPARTMENTS: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LIST'],
          HR_DESIGNATIONS: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LIST'],
          HR_LEAVE_TYPES: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LIST'],
          HR_LEAVE_REQUESTS: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LIST'],
          HR_LEAVE_BALANCES: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LIST'],
          HR_ATTENDANCE: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LIST'],
          HR_PAYROLL: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LIST'],
          HR_ANNOUNCEMENTS: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LIST'],
          HR_DOCUMENTS: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LIST'],
          HR_DASHBOARD: ['READ', 'LIST'],
          // Other
          PROFILES: ['READ', 'UPDATE', 'LIST'],
          SETTINGS: ['READ', 'UPDATE', 'LIST'],
          ANALYTICS: ['READ', 'LIST'],
          AUDITLOGS: ['READ', 'LIST'],
          OVERVIEW: ['READ', 'LIST'],
        }),
        created_at: now,
        updated_at: now,
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440301',
        name: 'USER',
        description:
          'Regular user with basic access to email campaign features',
        permissions: JSON.stringify({
          // RBAC Related
          ROLES: ['READ', 'LIST'],
          RBAC: ['READ', 'LIST'],
          RESOURCES: ['READ', 'LIST'],
          ACTIONS: ['READ', 'LIST'],
          // Organization and User Management
          ORGANIZATIONS: ['READ', 'LIST'],
          USERS: ['READ', 'LIST'],
          EMPLOYEES: [],
          // Subscription Management
          SUBSCRIPTIONS: ['READ', 'LIST'],
          INVOICES: ['READ', 'LIST'],
          // Assets
          ASSETS: ['CREATE', 'READ', 'DELETE', 'LIST'],
          // Task Tracking
          PROJECTS: ['READ', 'LIST'],
          TICKETS: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LIST'],
          SPRINTS: ['READ', 'LIST'],
          BOARDS: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LIST'],
          // Finance
          FIN_TAX_RATES: ['READ', 'LIST'],
          FIN_PRODUCTS: ['READ', 'LIST'],
          FIN_VENDORS: ['READ', 'LIST'],
          FIN_INVOICES: ['CREATE', 'READ', 'UPDATE', 'LIST'],
          FIN_ESTIMATES: ['CREATE', 'READ', 'UPDATE', 'LIST'],
          FIN_RECURRING_INVOICES: ['READ', 'LIST'],
          FIN_EXPENSE_CATEGORIES: ['READ', 'LIST'],
          FIN_EXPENSES: ['CREATE', 'READ', 'UPDATE', 'LIST'],
          // HR
          HR_DEPARTMENTS: ['READ', 'LIST'],
          HR_DESIGNATIONS: ['READ', 'LIST'],
          HR_LEAVE_TYPES: ['READ', 'LIST'],
          HR_LEAVE_REQUESTS: ['CREATE', 'READ', 'UPDATE', 'LIST'],
          HR_LEAVE_BALANCES: ['READ', 'LIST'],
          HR_ATTENDANCE: ['CREATE', 'READ', 'LIST'],
          HR_PAYROLL: ['READ', 'LIST'],
          HR_ANNOUNCEMENTS: ['READ', 'LIST'],
          HR_DOCUMENTS: ['CREATE', 'READ', 'LIST'],
          HR_DASHBOARD: ['READ', 'LIST'],
          // Other
          PROFILES: ['READ', 'UPDATE'],
          SETTINGS: ['READ'],
          ANALYTICS: ['READ', 'LIST'],
          AUDITLOGS: ['READ', 'LIST'],
          OVERVIEW: ['READ', 'LIST'],
        }),
        created_at: now,
        updated_at: now,
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440302',
        name: 'SUPPORT',
        description:
          'Support role with read and update access to all resources for troubleshooting',
        permissions: JSON.stringify({
          // RBAC Related
          ROLES: ['READ', 'UPDATE', 'LIST', 'EXPORT'],
          RBAC: ['READ', 'UPDATE', 'LIST', 'EXPORT'],
          RESOURCES: ['READ', 'UPDATE', 'LIST', 'EXPORT'],
          ACTIONS: ['READ', 'UPDATE', 'LIST', 'EXPORT'],
          // Organization and User Management
          ORGANIZATIONS: ['CREATE', 'READ', 'UPDATE', 'LIST', 'EXPORT'],
          USERS: ['CREATE', 'READ', 'UPDATE', 'LIST', 'EXPORT'],
          EMPLOYEES: ['READ', 'UPDATE', 'LIST', 'EXPORT'],
          // Subscription Management
          SUBSCRIPTIONS: ['READ', 'UPDATE', 'LIST', 'EXPORT'],
          INVOICES: ['READ', 'UPDATE', 'LIST', 'EXPORT'],
          // Assets
          ASSETS: ['CREATE', 'READ', 'DELETE', 'LIST'],
          // Task Tracking
          PROJECTS: ['READ', 'UPDATE', 'LIST', 'EXPORT'],
          TICKETS: ['READ', 'UPDATE', 'LIST', 'EXPORT'],
          SPRINTS: ['READ', 'UPDATE', 'LIST', 'EXPORT'],
          BOARDS: ['READ', 'UPDATE', 'LIST', 'EXPORT'],
          // Finance
          FIN_TAX_RATES: ['READ', 'UPDATE', 'LIST', 'EXPORT'],
          FIN_PRODUCTS: ['READ', 'UPDATE', 'LIST', 'EXPORT'],
          FIN_VENDORS: ['READ', 'UPDATE', 'LIST', 'EXPORT'],
          FIN_INVOICES: ['READ', 'UPDATE', 'LIST', 'EXPORT'],
          FIN_ESTIMATES: ['READ', 'UPDATE', 'LIST', 'EXPORT'],
          FIN_RECURRING_INVOICES: ['READ', 'UPDATE', 'LIST', 'EXPORT'],
          FIN_EXPENSE_CATEGORIES: ['READ', 'UPDATE', 'LIST', 'EXPORT'],
          FIN_EXPENSES: ['READ', 'UPDATE', 'LIST', 'EXPORT'],
          // HR
          HR_DEPARTMENTS: ['READ', 'UPDATE', 'LIST', 'EXPORT'],
          HR_DESIGNATIONS: ['READ', 'UPDATE', 'LIST', 'EXPORT'],
          HR_LEAVE_TYPES: ['READ', 'UPDATE', 'LIST', 'EXPORT'],
          HR_LEAVE_REQUESTS: ['READ', 'UPDATE', 'LIST', 'EXPORT'],
          HR_LEAVE_BALANCES: ['READ', 'UPDATE', 'LIST', 'EXPORT'],
          HR_ATTENDANCE: ['READ', 'UPDATE', 'LIST', 'EXPORT'],
          HR_PAYROLL: ['READ', 'UPDATE', 'LIST', 'EXPORT'],
          HR_ANNOUNCEMENTS: ['READ', 'UPDATE', 'LIST', 'EXPORT'],
          HR_DOCUMENTS: ['READ', 'UPDATE', 'LIST', 'EXPORT'],
          HR_DASHBOARD: ['READ', 'LIST'],
          // Other
          PROFILES: ['READ', 'UPDATE', 'LIST', 'EXPORT'],
          SETTINGS: ['READ', 'UPDATE', 'LIST', 'EXPORT'],
          // ANALYTICS removed - no access for SUPPORT
          AUDITLOGS: ['READ', 'UPDATE', 'LIST', 'EXPORT'],
          OVERVIEW: ['READ', 'UPDATE', 'LIST', 'EXPORT'],
        }),
        created_at: now,
        updated_at: now,
      },
    ];

    await queryInterface.bulkInsert('roles', roles, {});
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.bulkDelete('roles', {}, {});
  },
};
