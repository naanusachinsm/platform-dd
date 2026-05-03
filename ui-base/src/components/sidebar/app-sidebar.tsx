"use client";

import * as React from "react";
import {
  Building2,
  Command,
  FolderKanban,
  Users,
  MessageSquare,
  Handshake,
  Shield,
} from "lucide-react";

import { NavMain } from "@/components/sidebar/nav-main";
import { NavUser } from "@/components/sidebar/nav-user";
import { TeamSwitcher } from "@/components/sidebar/team-switcher";
import { useAppStore } from "@/stores/appStore";
import { useLocation } from "react-router-dom";
import { getNavigationRoutes } from "@/components/auth";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const user = useAppStore((state) => state.user);
  const location = useLocation();

  // Get role-based navigation data
  const userRole = user?.role?.toUpperCase() || "";
  const accessibleRoutePermissions = getNavigationRoutes(userRole);
  const accessibleRoutes = accessibleRoutePermissions.map(
    (permission) => permission.path
  );

  // Navigation data with dynamic active state and role-based filtering
  const navData = React.useMemo(() => {
    // Create role-specific navigation items
    const getNavItemsForRole = () => {
      if (userRole.toLowerCase() === "user") {
        // Navigation for USER role
        return [
          {
            title: "Project Management",
            url: "#",
            icon: FolderKanban,
            isActive: location.pathname.startsWith("/dashboard/projects"),
            items: [
              {
                title: "Projects",
                url: "/dashboard/projects",
              },
            ],
            requiredRoutes: ["/dashboard/projects"],
          },
          {
            title: "Lead Management",
            url: "#",
            icon: Handshake,
            isActive: location.pathname.startsWith("/dashboard/crm"),
            items: [
              { title: "Dashboard", url: "/dashboard/crm/dashboard" },
              { title: "Contacts", url: "/dashboard/crm/contacts" },
              { title: "Companies", url: "/dashboard/crm/companies" },
              { title: "Deals", url: "/dashboard/crm/deals" },
              { title: "Activities", url: "/dashboard/crm/activities" },
            ],
            requiredRoutes: ["/dashboard/crm/dashboard", "/dashboard/crm/contacts", "/dashboard/crm/companies", "/dashboard/crm/deals", "/dashboard/crm/activities"],
          },
          // {
          //   title: "Finance",
          //   url: "#",
          //   icon: DollarSign,
          //   isActive: location.pathname.startsWith("/dashboard/finance"),
          //   items: [
          //     { title: "Dashboard", url: "/dashboard/finance/dashboard" },
          //     { title: "Invoices", url: "/dashboard/finance/invoices" },
          //     { title: "Estimates", url: "/dashboard/finance/estimates" },
          //     { title: "Expenses", url: "/dashboard/finance/expenses" },
          //     { title: "Activities", url: "/dashboard/finance/activities" },
          //   ],
          //   requiredRoutes: ["/dashboard/finance/dashboard", "/dashboard/finance/invoices", "/dashboard/finance/estimates", "/dashboard/finance/expenses", "/dashboard/finance/activities"],
          // },
          // {
          //   title: "HR Portal",
          //   url: "#",
          //   icon: UserCog,
          //   isActive: location.pathname.startsWith("/dashboard/hr"),
          //   items: [
          //     { title: "Dashboard", url: "/dashboard/hr/dashboard" },
          //     { title: "Leave", url: "/dashboard/hr/leave" },
          //     { title: "Announcements", url: "/dashboard/hr/announcements" },
          //     { title: "Documents", url: "/dashboard/hr/documents" },
          //   ],
          //   requiredRoutes: ["/dashboard/hr/dashboard", "/dashboard/hr/leave", "/dashboard/hr/announcements", "/dashboard/hr/documents"],
          // },
          {
            title: "Connect",
            url: "#",
            icon: MessageSquare,
            isActive: location.pathname.startsWith("/dashboard/chat"),
            items: [
              {
                title: "Chat",
                url: "/dashboard/chat",
              },
            ],
            requiredRoutes: ["/dashboard/chat"],
          },
          // {
          //   title: "AI Agent",
          //   url: "/dashboard/agent",
          //   icon: Bot,
          //   isActive: location.pathname.startsWith("/dashboard/agent"),
          //   items: [
          //     {
          //       title: "Agent",
          //       url: "/dashboard/agent",
          //     },
          //   ],
          //   requiredRoutes: ["/dashboard/agent"],
          // },
        ];
      }

      // Default navigation for admin/superadmin
      return [
        {
          title: "Organization",
          url: "#",
          icon: Building2,
          isActive:
            location.pathname.startsWith("/dashboard/organizations") ||
            location.pathname === "/dashboard",
          items: [
            {
              title: "Organizations",
              url: "/dashboard/organizations",
            },
          ],
          requiredRoutes: ["/dashboard/organizations"],
        },
        {
          title: "User Management",
          url: "#",
          icon: Users,
          isActive:
            location.pathname.startsWith("/dashboard/users") ||
            location.pathname.startsWith("/dashboard/platform/employees"),
          items: [
            {
              title: "Users",
              url: "/dashboard/users",
            },
            // Add Platform Employees for SUPERADMIN employees
            ...(user?.type === "employee" && user?.role === "SUPERADMIN"
              ? [
                  {
                    title: "Platform Employees",
                    url: "/dashboard/platform/employees",
                  },
                ]
              : []),
          ],
          requiredRoutes: [
            "/dashboard/users",
            ...(user?.type === "employee" && user?.role === "SUPERADMIN"
              ? ["/dashboard/platform/employees"]
              : []),
          ],
        },
        {
          title: "Project Management",
          url: "#",
          icon: FolderKanban,
          isActive: location.pathname.startsWith("/dashboard/projects"),
          items: [
            {
              title: "Projects",
              url: "/dashboard/projects",
            },
          ],
          requiredRoutes: ["/dashboard/projects"],
        },
        {
          title: "Lead Management",
          url: "#",
          icon: Handshake,
          isActive: location.pathname.startsWith("/dashboard/crm"),
          items: [
            { title: "Dashboard", url: "/dashboard/crm/dashboard" },
            { title: "Contacts", url: "/dashboard/crm/contacts" },
            { title: "Companies", url: "/dashboard/crm/companies" },
            { title: "Deals", url: "/dashboard/crm/deals" },
            { title: "Activities", url: "/dashboard/crm/activities" },
          ],
          requiredRoutes: ["/dashboard/crm/dashboard", "/dashboard/crm/contacts", "/dashboard/crm/companies", "/dashboard/crm/deals", "/dashboard/crm/activities"],
        },
        // {
        //   title: "Finance",
        //   url: "#",
        //   icon: DollarSign,
        //   isActive: location.pathname.startsWith("/dashboard/finance"),
        //   items: [
        //     { title: "Dashboard", url: "/dashboard/finance/dashboard" },
        //     { title: "Invoices", url: "/dashboard/finance/invoices" },
        //     { title: "Estimates", url: "/dashboard/finance/estimates" },
        //     { title: "Expenses", url: "/dashboard/finance/expenses" },
        //     { title: "Products", url: "/dashboard/finance/products" },
        //     { title: "Vendors", url: "/dashboard/finance/vendors" },
        //     { title: "Activities", url: "/dashboard/finance/activities" },
        //   ],
        //   requiredRoutes: ["/dashboard/finance/dashboard", "/dashboard/finance/invoices", "/dashboard/finance/estimates", "/dashboard/finance/expenses", "/dashboard/finance/products", "/dashboard/finance/vendors", "/dashboard/finance/activities"],
        // },
        // {
        //   title: "HR Portal",
        //   url: "#",
        //   icon: UserCog,
        //   isActive: location.pathname.startsWith("/dashboard/hr"),
        //   items: [
        //     { title: "Dashboard", url: "/dashboard/hr/dashboard" },
        //     { title: "Departments", url: "/dashboard/hr/departments" },
        //     { title: "Designations", url: "/dashboard/hr/designations" },
        //     { title: "Leave", url: "/dashboard/hr/leave" },
        //     // { title: "Attendance", url: "/dashboard/hr/attendance" },
        //     // { title: "Payroll", url: "/dashboard/hr/payroll" },
        //     { title: "Announcements", url: "/dashboard/hr/announcements" },
        //     { title: "Documents", url: "/dashboard/hr/documents" },
        //   ],
        //   requiredRoutes: ["/dashboard/hr/dashboard", "/dashboard/hr/departments", "/dashboard/hr/designations", "/dashboard/hr/leave", "/dashboard/hr/announcements", "/dashboard/hr/documents"],
        // },
        {
          title: "Connect",
          url: "#",
          icon: MessageSquare,
          isActive: location.pathname.startsWith("/dashboard/chat"),
          items: [
            {
              title: "Chat",
              url: "/dashboard/chat",
            },
          ],
          requiredRoutes: ["/dashboard/chat"],
        },
        // {
        //   title: "AI Agent",
        //   url: "/dashboard/agent",
        //   icon: Bot,
        //   isActive: location.pathname.startsWith("/dashboard/agent"),
        //   items: [
        //     {
        //       title: "Agent",
        //       url: "/dashboard/agent",
        //     },
        //   ],
        //   requiredRoutes: ["/dashboard/agent"],
        // },
        // {
        //   title: "Subscription",
        //   url: "#",
        //   icon: CreditCard,
        //   isActive:
        //     location.pathname.startsWith("/dashboard/subscriptions") ||
        //     location.pathname.startsWith("/dashboard/invoices"),
        //   items: [
        //     {
        //       title: "Subscriptions",
        //       url: "/dashboard/subscriptions",
        //     },
        //     {
        //       title: "Invoices",
        //       url: "/dashboard/invoices",
        //     },
        //   ],
        //   requiredRoutes: [
        //     "/dashboard/subscriptions",
        //     "/dashboard/invoices",
        //   ],
        // },
        {
          title: "Access Control",
          url: "#",
          icon: Shield,
          isActive: location.pathname.startsWith("/dashboard/rbac"),
          items: [
            {
              title: "Actions",
              url: "/dashboard/rbac/actions",
            },
            {
              title: "Resources",
              url: "/dashboard/rbac/resources",
            },
            {
              title: "Roles",
              url: "/dashboard/rbac/roles",
            },
          ],
          requiredRoutes: [
            "/dashboard/rbac/actions",
            "/dashboard/rbac/resources",
            "/dashboard/rbac/roles",
          ],
        },
        {
          title: "System",
          url: "#",
          icon: Command,
          isActive: location.pathname.startsWith("/dashboard/audit-logs"),
          items: [
            {
              title: "Audit Logs",
              url: "/dashboard/audit-logs",
            },
          ],
          requiredRoute: "/dashboard/audit-logs",
        },
      ];
    };

    // Use role-specific navigation instead of filtering
    const allNavItems = getNavItemsForRole();

    // Filter navigation items based on user role
    const filteredNavItems = allNavItems
      .filter((navItem) => {
        if (navItem.requiredRoute) {
          return accessibleRoutes.includes(navItem.requiredRoute);
        }
        if (navItem.requiredRoutes) {
          return navItem.requiredRoutes.some((route) =>
            accessibleRoutes.includes(route)
          );
        }
        return false;
      })
      .map((navItem) => {
        // Filter items within each navigation group
        if (navItem.requiredRoutes) {
          const filteredItems = navItem.items.filter((item) =>
            accessibleRoutes.includes(item.url)
          );
          return {
            ...navItem,
            items: filteredItems,
          };
        }
        return navItem;
      })
      .filter((navItem) => navItem.items.length > 0); // Only show groups with accessible items

    return {
      navMain: filteredNavItems,
    };
  }, [location.pathname, accessibleRoutes, userRole]);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navData.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
