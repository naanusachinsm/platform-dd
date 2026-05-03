import { DocContent, DocCallout, DocFeatureList } from "@/components/documentation/DocContent";

export default function OverviewPage() {
  return (
    <DocContent>
      <p className="text-sm text-muted-foreground mb-8 font-normal leading-relaxed font-['Inter',sans-serif]">
        A comprehensive, multi-tenant SaaS platform designed to empower organizations
        with modern business management tools. Built with
        modern technologies including NestJS, React, and MySQL, the platform provides
        enterprise-grade features like role-based access control, project management,
        subscription billing, and comprehensive audit logging.
      </p>

      <DocCallout variant="tip" title="Key Capabilities">
        Manage organizations with multi-tenant isolation, configure role-based access
        control with granular permissions, track projects with boards and backlogs,
        handle subscriptions with flexible billing plans, monitor system activity
        with comprehensive audit logs—all from a single, intuitive interface.
      </DocCallout>

      <h2 className="text-xl font-bold">Core Features</h2>
      <p className="text-sm text-muted-foreground mb-6 font-['Inter',sans-serif]">
        The platform offers a wide range of features designed to streamline
        your business operations:
      </p>

      <div className="grid gap-6 md:grid-cols-2 my-6">
        <div className="space-y-3">
          <h3 className="text-base font-bold">User & Organization Management</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Multi-tenant architecture with complete data isolation</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Role-based access control (RBAC) with granular permissions</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>User management: employees, roles, and permission assignment</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Organization settings and configuration management</span>
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <h3 className="text-base font-bold">Subscriptions & Billing</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Flexible subscription plans (Free, Basic, Pro, Enterprise)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Automated billing cycles and invoice generation</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Usage tracking and plan limits enforcement</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Subscription management and upgrade/downgrade workflows</span>
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <h3 className="text-base font-bold">Project Management</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Kanban boards for visual task management</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Backlog management for planning and prioritization</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Ticket tracking with status workflows</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Team collaboration and assignment</span>
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <h3 className="text-base font-bold">System & Audit</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Comprehensive audit trail for all system activities</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Real-time notifications via WebSocket</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Push notification support for important events</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>Exportable reports and historical data analysis</span>
            </li>
          </ul>
        </div>
      </div>

      <h2 className="text-xl font-bold">Getting Started</h2>
      <p className="text-sm text-muted-foreground mb-6 font-['Inter',sans-serif]">
        Follow these simple steps to get started with the platform:
      </p>

      <div className="space-y-4 my-6">
        <div className="flex gap-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-sm">
            1
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold mb-2">Create an Account</h3>
            <p className="text-sm text-muted-foreground font-['Inter',sans-serif]">
              Sign up for an account using email or Google OAuth. Create your organization
              and configure basic settings. You'll be automatically assigned the Admin role
              and can start inviting team members.
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-sm">
            2
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold mb-2">Set Up Your Organization</h3>
            <p className="text-sm text-muted-foreground font-['Inter',sans-serif]">
              Configure your organization settings, invite team members, and assign roles
              with appropriate permissions. Set up your subscription plan to match your
              organization's needs.
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-sm">
            3
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold mb-2">Create Projects</h3>
            <p className="text-sm text-muted-foreground font-['Inter',sans-serif]">
              Set up projects to organize your team's work. Use Kanban boards for visual
              task management and backlogs for planning and prioritization.
            </p>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold">Architecture Overview</h2>
      <p className="text-sm text-muted-foreground mb-6 font-['Inter',sans-serif]">
        The platform is built on a modern, scalable architecture:
      </p>

      <div className="my-6 space-y-5">
        <div>
          <h3 className="text-base font-bold">Multi-Tenant Architecture</h3>
          <p className="text-sm text-muted-foreground font-['Inter',sans-serif]">
            Each organization operates in complete data isolation. All database queries
            automatically filter by organization ID, ensuring users can only access data
            belonging to their organization. SUPERADMIN role can bypass tenant filtering
            for system administration.
          </p>
        </div>

        <div>
          <h3 className="text-base font-bold">Role-Based Access Control (RBAC)</h3>
          <p className="text-sm text-muted-foreground font-['Inter',sans-serif]">
            Comprehensive RBAC system with fine-grained permission control. Permissions are
            defined at resource and action (Create, Read, Update, Delete) levels. Roles can
            be customized per organization, and permissions are checked dynamically on every
            API request.
          </p>
        </div>

        <div>
          <h3 className="text-base font-bold">Queue-Based Processing</h3>
          <p className="text-sm text-muted-foreground font-['Inter',sans-serif]">
            Heavy operations are handled asynchronously using BullMQ (Redis-based queue system).
            This ensures the application remains responsive, handles failures gracefully with
            retries, and scales horizontally with worker processes.
          </p>
        </div>

        <div>
          <h3 className="text-base font-bold">Audit Logging</h3>
          <p className="text-sm text-muted-foreground font-['Inter',sans-serif]">
            Comprehensive audit trail for all system activities. Every API request, data change,
            and user action is logged with timestamps, user information, and request details.
            Audit logs support compliance requirements and troubleshooting.
          </p>
        </div>
      </div>

      <h2 className="text-xl font-bold">Next Steps</h2>
      <p className="text-sm text-muted-foreground mb-6 font-['Inter',sans-serif]">
        Explore the detailed documentation for each feature:
      </p>

      <div className="grid gap-4 md:grid-cols-2 my-6">
        <a
          href="/documentation/organizations"
          className="block p-4 border border-border rounded-lg hover:bg-accent transition-colors"
        >
          <h3 className="text-base font-bold mb-1">Organizations</h3>
          <p className="text-sm text-muted-foreground font-['Inter',sans-serif]">
            Learn about multi-tenant organization management
          </p>
        </a>
        <a
          href="/documentation/user-management"
          className="block p-4 border border-border rounded-lg hover:bg-accent transition-colors"
        >
          <h3 className="text-base font-bold mb-1">User Management</h3>
          <p className="text-sm text-muted-foreground font-['Inter',sans-serif]">
            Manage users, roles, and permissions
          </p>
        </a>
        <a
          href="/documentation/subscriptions"
          className="block p-4 border border-border rounded-lg hover:bg-accent transition-colors"
        >
          <h3 className="text-base font-bold mb-1">Subscriptions</h3>
          <p className="text-sm text-muted-foreground font-['Inter',sans-serif]">
            Subscription plans, limits, and billing
          </p>
        </a>
        <a
          href="/documentation/system"
          className="block p-4 border border-border rounded-lg hover:bg-accent transition-colors"
        >
          <h3 className="text-base font-bold mb-1">System</h3>
          <p className="text-sm text-muted-foreground font-['Inter',sans-serif]">
            Audit logs and system administration
          </p>
        </a>
      </div>
    </DocContent>
  );
}
