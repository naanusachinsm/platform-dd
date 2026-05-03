// Role-based route permissions configuration

export type UserRole =
  | "SUPERADMIN"
  | "ADMIN"
  | "USER"
  | "SUPPORT"
  | "INSTRUCTOR"
  | "STUDENT";

export interface RoutePermission {
  path: string;
  roles: UserRole[];
  description?: string;
}

// Define route permissions for different user roles
export const ROUTE_PERMISSIONS: RoutePermission[] = [
  // Organizations management
  {
    path: "/dashboard/organizations",
    roles: ["SUPERADMIN", "ADMIN", "SUPPORT"],
    description: "Organizations management - Superadmin, Admin, and Support",
  },

  // Employees management
  {
    path: "/dashboard/employees",
    roles: ["SUPERADMIN", "ADMIN", "SUPPORT"],
    description: "Employees management - Superadmin, Admin, and Support",
  },

  // Platform employees management
  {
    path: "/dashboard/platform/employees",
    roles: ["SUPERADMIN"],
    description: "Platform employees management - Superadmin only",
  },

  // Users management
  {
    path: "/dashboard/users",
    roles: ["SUPERADMIN", "ADMIN", "SUPPORT"],
    description: "Users management - Superadmin, Admin, and Support",
  },

  // Audit logs
  {
    path: "/dashboard/audit-logs",
    roles: ["SUPERADMIN", "ADMIN", "SUPPORT"],
    description: "Audit logs - Superadmin, Admin, and Support",
  },

  // Subscription Management
  {
    path: "/dashboard/subscriptions",
    roles: ["SUPERADMIN", "ADMIN", "SUPPORT"],
    description: "Subscriptions management - Superadmin, Admin, and Support",
  },
  {
    path: "/dashboard/subscriptions/:id",
    roles: ["SUPERADMIN", "ADMIN", "SUPPORT"],
    description: "Subscription detail and upgrade - Superadmin, Admin, and Support",
  },
  {
    path: "/dashboard/invoices",
    roles: ["SUPERADMIN", "ADMIN", "SUPPORT"],
    description: "Invoices management - Superadmin, Admin, and Support",
  },

  // CRM
  {
    path: "/dashboard/crm",
    roles: ["SUPERADMIN", "ADMIN", "USER", "SUPPORT"],
    description: "CRM Dashboard - Superadmin, Admin, User, and Support",
  },
  {
    path: "/dashboard/crm/dashboard",
    roles: ["SUPERADMIN", "ADMIN", "USER", "SUPPORT"],
    description: "CRM Dashboard - Superadmin, Admin, User, and Support",
  },
  {
    path: "/dashboard/crm/contacts",
    roles: ["SUPERADMIN", "ADMIN", "USER", "SUPPORT"],
    description: "CRM Contacts - Superadmin, Admin, User, and Support",
  },
  {
    path: "/dashboard/crm/companies",
    roles: ["SUPERADMIN", "ADMIN", "USER", "SUPPORT"],
    description: "CRM Companies - Superadmin, Admin, User, and Support",
  },
  {
    path: "/dashboard/crm/deals",
    roles: ["SUPERADMIN", "ADMIN", "USER", "SUPPORT"],
    description: "CRM Deals - Superadmin, Admin, User, and Support",
  },
  {
    path: "/dashboard/crm/deals/:dealId",
    roles: ["SUPERADMIN", "ADMIN", "USER", "SUPPORT"],
    description: "CRM Deal Detail - Superadmin, Admin, User, and Support",
  },
  {
    path: "/dashboard/crm/activities",
    roles: ["SUPERADMIN", "ADMIN", "USER", "SUPPORT"],
    description: "CRM Activities - Superadmin, Admin, User, and Support",
  },

  // Finance
  {
    path: "/dashboard/finance",
    roles: ["SUPERADMIN", "ADMIN", "USER", "SUPPORT"],
    description: "Finance Dashboard - Superadmin, Admin, User, and Support",
  },
  {
    path: "/dashboard/finance/dashboard",
    roles: ["SUPERADMIN", "ADMIN", "USER", "SUPPORT"],
    description: "Finance Dashboard - Superadmin, Admin, User, and Support",
  },
  {
    path: "/dashboard/finance/invoices",
    roles: ["SUPERADMIN", "ADMIN", "USER", "SUPPORT"],
    description: "Finance Invoices - Superadmin, Admin, User, and Support",
  },
  {
    path: "/dashboard/finance/estimates",
    roles: ["SUPERADMIN", "ADMIN", "USER", "SUPPORT"],
    description: "Finance Estimates - Superadmin, Admin, User, and Support",
  },
  {
    path: "/dashboard/finance/products",
    roles: ["SUPERADMIN", "ADMIN", "SUPPORT"],
    description: "Finance Products - Admin only (catalog config)",
  },
  {
    path: "/dashboard/finance/expenses",
    roles: ["SUPERADMIN", "ADMIN", "USER", "SUPPORT"],
    description: "Finance Expenses - Superadmin, Admin, User, and Support",
  },
  {
    path: "/dashboard/finance/vendors",
    roles: ["SUPERADMIN", "ADMIN", "SUPPORT"],
    description: "Finance Vendors - Admin only (vendor config)",
  },
  {
    path: "/dashboard/finance/activities",
    roles: ["SUPERADMIN", "ADMIN", "USER", "SUPPORT"],
    description: "Finance Activities - Superadmin, Admin, User, and Support",
  },

  // HR Portal
  {
    path: "/dashboard/hr",
    roles: ["SUPERADMIN", "ADMIN", "USER", "SUPPORT"],
    description: "HR Dashboard",
  },
  {
    path: "/dashboard/hr/dashboard",
    roles: ["SUPERADMIN", "ADMIN", "USER", "SUPPORT"],
    description: "HR Dashboard",
  },
  {
    path: "/dashboard/hr/departments",
    roles: ["SUPERADMIN", "ADMIN", "SUPPORT"],
    description: "HR Departments - Admin only (org structure)",
  },
  {
    path: "/dashboard/hr/designations",
    roles: ["SUPERADMIN", "ADMIN", "SUPPORT"],
    description: "HR Designations - Admin only (roles/levels)",
  },
  {
    path: "/dashboard/hr/leave",
    roles: ["SUPERADMIN", "ADMIN", "USER", "SUPPORT"],
    description: "HR Leave management",
  },
  {
    path: "/dashboard/hr/attendance",
    roles: ["SUPERADMIN", "ADMIN", "USER", "SUPPORT"],
    description: "HR Attendance management",
  },
  {
    path: "/dashboard/hr/payroll",
    roles: ["SUPERADMIN", "ADMIN", "SUPPORT"],
    description: "HR Payroll management",
  },
  {
    path: "/dashboard/hr/announcements",
    roles: ["SUPERADMIN", "ADMIN", "USER", "SUPPORT"],
    description: "HR Announcements",
  },
  {
    path: "/dashboard/hr/documents",
    roles: ["SUPERADMIN", "ADMIN", "USER", "SUPPORT"],
    description: "HR Documents management",
  },

  // Projects / Task Tracking
  {
    path: "/dashboard/projects",
    roles: ["SUPERADMIN", "ADMIN", "USER", "SUPPORT"],
    description: "Projects list - Superadmin, Admin, User, and Support",
  },
  {
    path: "/dashboard/projects/:projectKey",
    roles: ["SUPERADMIN", "ADMIN", "USER", "SUPPORT"],
    description: "Project detail view - Superadmin, Admin, User, and Support",
  },
  {
    path: "/dashboard/projects/:projectKey/settings",
    roles: ["SUPERADMIN", "ADMIN", "USER", "SUPPORT"],
    description: "Project settings - Superadmin, Admin, User, and Support",
  },
  {
    path: "/dashboard/projects/:projectKey/tickets/:ticketNumber",
    roles: ["SUPERADMIN", "ADMIN", "USER", "SUPPORT"],
    description: "Ticket detail view - Superadmin, Admin, User, and Support",
  },

  // Chat
  {
    path: "/dashboard/chat",
    roles: ["SUPERADMIN", "ADMIN", "USER", "SUPPORT"],
    description: "Chat - All roles",
  },

  // AI Agent
  {
    path: "/dashboard/agent",
    roles: ["SUPERADMIN", "ADMIN", "USER", "SUPPORT"],
    description: "AI Agent - All roles",
  },

  // RBAC Management
  {
    path: "/dashboard/rbac/actions",
    roles: ["SUPERADMIN", "ADMIN"],
    description: "RBAC Actions management - Superadmin and Admin",
  },
  {
    path: "/dashboard/rbac/resources",
    roles: ["SUPERADMIN", "ADMIN"],
    description: "RBAC Resources management - Superadmin and Admin",
  },
  {
    path: "/dashboard/rbac/roles",
    roles: ["SUPERADMIN", "ADMIN"],
    description: "RBAC Roles management - Superadmin and Admin",
  },

  // Common routes - Available to all authenticated users
  {
    path: "/dashboard/profile",
    roles: ["SUPERADMIN", "ADMIN", "USER", "SUPPORT", "INSTRUCTOR", "STUDENT"],
    description: "User profile - All authenticated users",
  },
];

// Helper function to check if a user role has access to a specific route
export function hasRouteAccess(userRole: string, routePath: string, userType?: string): boolean {
  // Normalize user role to uppercase for comparison
  const normalizedRole = userRole.toUpperCase() as UserRole;
  
  // Employees (SUPERADMIN) have access to all routes
  // SUPPORT employees have access to all routes except analytics
  if (userType === "employee" && normalizedRole === "SUPERADMIN") {
    return true;
  }
  
  // SUPPORT employees have access to all routes
  if (userType === "employee" && normalizedRole === "SUPPORT") {
    return true;
  }
  
  // First try exact match
  let permission = ROUTE_PERMISSIONS.find((p) => p.path === routePath);

  // If no exact match, try to match dynamic routes (with parameters)
  if (!permission) {
    permission = ROUTE_PERMISSIONS.find((p) => {
      // Check if this is a dynamic route pattern (e.g. :id, :projectKey, :ticketKey)
      if (p.path.includes(":")) {
        const escapedPath = p.path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const pattern = escapedPath.replace(/:[\w]+/g, "[^/]+");
        const regex = new RegExp(`^${pattern}$`);
        return regex.test(routePath);
      }
      return false;
    });
  }

  if (!permission) {
    // If no specific permission is defined, deny access by default
    return false;
  }
  return permission.roles.includes(normalizedRole);
}

// Helper function to get all accessible routes for a user role
export function getAccessibleRoutes(userRole: string): string[] {
  const normalizedRole = userRole.toUpperCase() as UserRole;
  return ROUTE_PERMISSIONS.filter((permission) =>
    permission.roles.includes(normalizedRole)
  ).map((permission) => permission.path);
}

// Helper function to get routes that should be shown in navigation for a role
export function getNavigationRoutes(userRole: string): RoutePermission[] {
  const normalizedRole = userRole.toUpperCase() as UserRole;
  return ROUTE_PERMISSIONS.filter((permission) =>
    permission.roles.includes(normalizedRole)
  );
}

// Default route for each role after login
export function getDefaultRoute(userRole: string): string {
  const normalizedRole = userRole.toUpperCase() as UserRole;

  if (normalizedRole === "USER") {
    return "/dashboard/projects";
  }

  return "/dashboard/organizations";
}

