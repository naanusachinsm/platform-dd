import { AppSidebar } from "@/components/sidebar/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { OrganizationSelector } from "@/components/common/OrganizationSelector";
import { NotificationCenter } from "@/components/common/NotificationCenter";
import { PushNotificationPrompt } from "@/components/common/PushNotificationPrompt";
import { useNotifications } from "@/hooks/useNotifications";
import { useLocation, Outlet, Link } from "react-router-dom";
import { useState, useMemo } from "react";
import { useAppStore } from "@/stores";
import { Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import AgentChatPanel from "@/components/agent/AgentChatPanel";

// Navigation data for breadcrumb generation
const navData = {
  navMain: [
    {
      title: "Organization",
      url: "#",
      items: [{ title: "Organizations", url: "/dashboard/organizations" }],
    },
    {
      title: "User Management",
      url: "#",
      items: [{ title: "Employees", url: "/dashboard/employees" }],
    },
    {
      title: "System",
      url: "#",
      items: [{ title: "Audit Logs", url: "/dashboard/audit-logs" }],
    },
  ],
};

interface BreadcrumbItem {
  title: string;
  url?: string;
  isCurrentPage?: boolean;
}

export default function DashboardLayout() {
  const location = useLocation();
  const { user } = useAppStore();
  const isEmployee = user?.type === "employee";
  useNotifications();

  const [agentPanelOpen, setAgentPanelOpen] = useState(false);

  // Generate dynamic breadcrumbs based on current path
  const breadcrumbs = useMemo((): BreadcrumbItem[] => {
    const path = location.pathname;
    const breadcrumbItems: BreadcrumbItem[] = [];

    // Always start with Dashboard
    breadcrumbItems.push({ title: "Dashboard", url: "/dashboard" });

    // If we're on the main dashboard page or organizations (default), show Organizations
    if (path === "/dashboard" || path === "/dashboard/organizations") {
      breadcrumbItems.push({ title: "Organizations", isCurrentPage: true });
      return breadcrumbItems;
    }

    // Handle profile page
    if (path === "/dashboard/profile") {
      breadcrumbItems.push({ title: "Profile", isCurrentPage: true });
      return breadcrumbItems;
    }

    // Handle subscription detail page
    if (path.startsWith("/dashboard/subscriptions/") && path !== "/dashboard/subscriptions") {
      breadcrumbItems.push({ title: "Subscriptions", url: "/dashboard/subscriptions" });
      breadcrumbItems.push({ title: "Subscription Details", isCurrentPage: true });
      return breadcrumbItems;
    }

    // Handle deal detail page
    const dealDetailMatch = path.match(/^\/dashboard\/crm\/deals\/([^/]+)$/);
    if (dealDetailMatch && dealDetailMatch[1] !== "pipeline") {
      const dealId = dealDetailMatch[1];
      const storedTitle = sessionStorage.getItem(`deal-title-${dealId}`);
      const navTitle = (location.state as any)?.dealTitle;
      const dealTitle = navTitle || storedTitle || "Deal";
      breadcrumbItems.push({ title: "Crm" });
      breadcrumbItems.push({ title: "Deals", url: "/dashboard/crm/deals" });
      breadcrumbItems.push({ title: dealTitle, isCurrentPage: true });
      return breadcrumbItems;
    }

    // Handle ticket detail page
    const ticketMatch = path.match(/^\/dashboard\/projects\/([^/]+)\/tickets\/(\d+)$/);
    if (ticketMatch) {
      const projKey = ticketMatch[1].toUpperCase();
      const ticketNum = ticketMatch[2];
      breadcrumbItems.push({ title: "Projects", url: "/dashboard/projects" });
      breadcrumbItems.push({ title: projKey, url: `/dashboard/projects/${ticketMatch[1]}` });
      breadcrumbItems.push({ title: `${projKey}-${ticketNum}`, isCurrentPage: true });
      return breadcrumbItems;
    }

    // Handle project detail page
    if (path.startsWith("/dashboard/projects/") && path !== "/dashboard/projects") {
      const projectKey = path.split("/")[3]?.toUpperCase();
      breadcrumbItems.push({ title: "Projects", url: "/dashboard/projects" });
      breadcrumbItems.push({ title: projectKey || "Project", isCurrentPage: true });
      return breadcrumbItems;
    }

    // Find the matching navigation item
    for (const section of navData.navMain) {
      const matchingItem = section.items?.find((item) => item.url === path);
      if (matchingItem) {
        // Add section as intermediate breadcrumb
        breadcrumbItems.push({ title: section.title });
        // Add current page
        breadcrumbItems.push({
          title: matchingItem.title,
          isCurrentPage: true,
        });
        break;
      }
    }

    // Handle enquiry paths specifically
    if (path.includes("/enquiries/")) {
      breadcrumbItems.push({ title: "Business" });
      breadcrumbItems.push({ title: "Enquiries", url: "/dashboard/enquiries" });
      return breadcrumbItems;
    }

    // If no match found, generate from path segments
    if (breadcrumbItems.length === 1) {
      const segments = path.split("/").filter(Boolean).slice(1); // Remove 'dashboard'
      segments.forEach((segment, index) => {
        const title = segment
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
        breadcrumbItems.push({
          title,
          isCurrentPage: index === segments.length - 1,
        });
      });
    }

    return breadcrumbItems;
  }, [location.pathname]);

  return (
    <>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="overflow-hidden">
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4 flex-1">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <Breadcrumb>
                <BreadcrumbList>
                  {breadcrumbs.map((item, index) => (
                    <div key={item.title} className="flex items-center">
                      {index > 0 && <BreadcrumbSeparator className="mx-2" />}
                      <BreadcrumbItem>
                        {item.isCurrentPage ? (
                          <BreadcrumbPage>{item.title}</BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink asChild>
                            <Link to={item.url || "#"}>{item.title}</Link>
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                    </div>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="flex items-center gap-2 px-4">
              {isEmployee && <OrganizationSelector />}
              <NotificationCenter />
              <Button variant="ghost" size="icon" onClick={() => setAgentPanelOpen(true)} title="AI Agent">
                <Bot className="size-4" />
              </Button>
              <ThemeToggle />
            </div>
          </header>
          <div className="flex flex-1 flex-col overflow-hidden">
            <Outlet />
          </div>
        </SidebarInset>
      </SidebarProvider>

      <Sheet open={agentPanelOpen} onOpenChange={setAgentPanelOpen}>
        <AgentChatPanel userName={user?.firstName || ''} />
      </Sheet>

      <PushNotificationPrompt />
    </>
  );
}
