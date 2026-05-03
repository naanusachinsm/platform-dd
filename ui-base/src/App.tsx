import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Suspense, lazy } from "react";
import { GetStartedPage } from "@/pages/getstarted";
import AuthErrorPage from "@/pages/auth/AuthErrorPage";
import OAuthCallbackPage from "@/pages/auth/OAuthCallbackPage";
import EmployeeLoginPage from "@/pages/auth/EmployeeLoginPage";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import DocumentationLayout from "@/components/layouts/DocumentationLayout";
import { OrganizationsPage } from "@/pages/organization";
import { EmployeesPage } from "@/pages/employee";
import { PlatformEmployeesPage } from "@/pages/employee/PlatformEmployeesPage";
import { UsersPage } from "@/pages/user";
import { AuditLogsPage } from "@/pages/audit";
import { ProfilePage } from "@/pages/profile";
import { SubscriptionsPage } from "@/pages/subscriptions";
import SubscriptionDetailPage from "@/pages/subscriptions/SubscriptionDetailPage";
import { InvoicesPage } from "@/pages/invoices";
import ProjectsPage from "@/pages/projects/ProjectsPage";
import ProjectDetailPage from "@/pages/projects/ProjectDetailPage";
import TicketDetailPage from "@/pages/projects/TicketDetailPage";
import ChatPage from "@/pages/chat/ChatPage";
import AgentPage from "@/pages/agent/AgentPage";
import ContactsPage from "@/pages/crm/ContactsPage";
import CompaniesPage from "@/pages/crm/CompaniesPage";
import DealsPage from "@/pages/crm/DealsPage";
import CrmActivitiesPage from "@/pages/crm/CrmActivitiesPage";
import DealDetailPage from "@/pages/crm/DealDetailPage";
import CrmDashboardPage from "@/pages/crm/CrmDashboardPage";
import {
  HrDashboardPage,
  DepartmentsPage as HrDepartmentsPage,
  DesignationsPage as HrDesignationsPage,
  LeavePage as HrLeavePage,
  AttendancePage as HrAttendancePage,
  PayrollPage as HrPayrollPage,
  AnnouncementsPage as HrAnnouncementsPage,
  DocumentsPage as HrDocumentsPage,
} from "@/pages/hr";
import FinanceDashboardPage from "@/pages/finance/FinanceDashboardPage";
import FinanceActivityPage from "@/pages/finance/FinanceActivityPage";
import FinanceInvoicesPage from "@/pages/finance/InvoicesPage";
import EstimatesPage from "@/pages/finance/EstimatesPage";
import ProductsPage from "@/pages/finance/ProductsPage";
import ExpensesPage from "@/pages/finance/ExpensesPage";
import VendorsPage from "@/pages/finance/VendorsPage";
import { TermsOfServicePage, PrivacyPolicyPage, SupportPage } from "@/pages/legal";
import { ActionsPage, ResourcesPage, RolesPage } from "@/pages/rbac";
import { ProtectedRouteWithRole, DashboardIndexRedirect } from "@/components/auth";
import { ThemeProvider } from "@/components/providers";

import { Toaster } from "@/components/ui/sonner";

// Lazy load documentation pages
const OverviewPage = lazy(() =>
  import("@/pages/documentation").then((m) => ({ default: m.OverviewPage }))
);
const OrganizationsDocPage = lazy(() =>
  import("@/pages/documentation").then((m) => ({ default: m.OrganizationsPage }))
);
const UserManagementPage = lazy(() =>
  import("@/pages/documentation").then((m) => ({ default: m.UserManagementPage }))
);
const SystemDocPage = lazy(() =>
  import("@/pages/documentation").then((m) => ({ default: m.SystemPage }))
);
const SubscriptionsDocPage = lazy(() =>
  import("@/pages/documentation").then((m) => ({ default: m.SubscriptionsPage }))
);

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <Router>
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            <Route path="/" element={<GetStartedPage />} />
            <Route path="/terms-and-conditions" element={<TermsOfServicePage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="/auth/error" element={<AuthErrorPage />} />
            <Route path="/auth/callback" element={<OAuthCallbackPage />} />
            <Route path="/platform/login" element={<EmployeeLoginPage />} />
            <Route path="/documentation" element={<DocumentationLayout />}>
              <Route index element={<Navigate to="/documentation/overview" replace />} />
              <Route path="overview" element={<OverviewPage />} />
              <Route path="organizations" element={<OrganizationsDocPage />} />
              <Route path="user-management" element={<UserManagementPage />} />
              <Route path="subscriptions" element={<SubscriptionsDocPage />} />
              <Route path="system" element={<SystemDocPage />} />
            </Route>
            <Route
              path="dashboard"
              element={
                <ProtectedRouteWithRole>
                  <DashboardLayout />
                </ProtectedRouteWithRole>
              }
            >
              <Route index element={<DashboardIndexRedirect />} />
              <Route path="organizations" element={<OrganizationsPage />} />
              <Route path="employees" element={<EmployeesPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="subscriptions" element={<SubscriptionsPage />} />
              <Route path="subscriptions/:id" element={<SubscriptionDetailPage />} />
              <Route path="invoices" element={<InvoicesPage />} />
              <Route path="audit-logs" element={<AuditLogsPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="platform/employees" element={<PlatformEmployeesPage />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="projects/:projectKey" element={<ProjectDetailPage />} />
              <Route path="projects/:projectKey/tickets/:ticketNumber" element={<TicketDetailPage />} />
              <Route path="chat" element={<ChatPage />} />
              <Route path="agent" element={<AgentPage />} />
              <Route path="crm" element={<CrmDashboardPage />} />
              <Route path="crm/dashboard" element={<CrmDashboardPage />} />
              <Route path="crm/contacts" element={<ContactsPage />} />
              <Route path="crm/companies" element={<CompaniesPage />} />
              <Route path="crm/deals/:dealId" element={<DealDetailPage />} />
              <Route path="crm/deals" element={<DealsPage />} />
              <Route path="crm/activities" element={<CrmActivitiesPage />} />
              <Route path="hr" element={<HrDashboardPage />} />
              <Route path="hr/dashboard" element={<HrDashboardPage />} />
              <Route path="hr/departments" element={<HrDepartmentsPage />} />
              <Route path="hr/designations" element={<HrDesignationsPage />} />
              <Route path="hr/leave" element={<HrLeavePage />} />
              {/* <Route path="hr/attendance" element={<HrAttendancePage />} /> */}
              {/* <Route path="hr/payroll" element={<HrPayrollPage />} /> */}
              <Route path="hr/announcements" element={<HrAnnouncementsPage />} />
              <Route path="hr/documents" element={<HrDocumentsPage />} />
              <Route path="finance" element={<FinanceDashboardPage />} />
              <Route path="finance/dashboard" element={<FinanceDashboardPage />} />
              <Route path="finance/invoices" element={<FinanceInvoicesPage />} />
              <Route path="finance/estimates" element={<EstimatesPage />} />
              <Route path="finance/products" element={<ProductsPage />} />
              <Route path="finance/expenses" element={<ExpensesPage />} />
              <Route path="finance/vendors" element={<VendorsPage />} />
              <Route path="finance/activities" element={<FinanceActivityPage />} />
              <Route path="rbac/actions" element={<ActionsPage />} />
              <Route path="rbac/resources" element={<ResourcesPage />} />
              <Route path="rbac/roles" element={<RolesPage />} />
            </Route>
          </Routes>
        </Suspense>
        <Toaster />
      </Router>
    </ThemeProvider>
  );
}

export default App;
