import { ToolCategory } from '../interfaces/tool.interface';

const DOMAIN_GUIDANCE: Record<string, string> = {
  [ToolCategory.CRM]: `## CRM Domain Knowledge
- Companies, Contacts, Deals, and Activities are the core CRM entities
- Contacts belong to Companies (via companyId). Always create/find the company first before adding contacts
- Deals can be linked to both a Contact and a Company. Deals have stages: LEAD, QUALIFIED, PROPOSAL, NEGOTIATION, CLOSED_WON, CLOSED_LOST
- The deal pipeline shows deals grouped by stage with total values
- When importing contacts/companies, use CSV format. The import tools accept raw CSV data
- Activities track interactions (CALL, EMAIL, MEETING, TASK, NOTE) and can be linked to contacts, companies, or deals
- The CRM dashboard provides: total companies, total contacts, total deal value, conversion rate, deals by stage
- When the user asks about "revenue" or "pipeline", use crm_get_dashboard or crm_get_pipeline
- When the user asks to "add a customer", create a Company first, then optionally a Contact under it`,

  [ToolCategory.FINANCE]: `## Finance Domain Knowledge
- Core entities: Invoices, Estimates, Products, Vendors, Expenses, Tax Rates, Recurring Invoices
- Invoice workflow: DRAFT → SENT → PAID/PARTIALLY_PAID/OVERDUE/CANCELLED/VOID
- Invoices have line items. Each item can reference a Product and a Tax Rate
- Invoices link to CRM: crmCompanyId and crmContactId for the customer
- Estimates can be converted to Invoices (finance_convert_estimate)
- Estimates support versioning — each edit creates a new version
- Recurring invoices auto-generate invoices at a set frequency (WEEKLY, MONTHLY, QUARTERLY, YEARLY)
- Expenses track company spending, linked to categories and vendors. Can be marked as reimbursable
- Products have a type (PRODUCT or SERVICE) and a default unit price
- Tax rates have a type (PERCENTAGE or FIXED) and can be marked as default
- The finance dashboard shows: total revenue, outstanding, overdue, expenses, profit by period
- The aging report shows overdue invoices grouped by age (0-30, 31-60, 61-90, 90+ days)
- Export endpoints return CSV data for invoices, products, vendors, expenses
- When creating invoices, ALWAYS include at least one line item with description, quantity, and unitPrice
- Currency defaults to the organization setting. Common currencies: USD, EUR, GBP, INR`,

  [ToolCategory.PROJECTS]: `## Projects Domain Knowledge
- Projects have a unique key (uppercase, e.g., "PROJ") used in ticket numbers (e.g., PROJ-1, PROJ-2)
- Projects contain: Sprints, Tickets, Board Columns, Boards, Members
- Tickets have: type (STORY, BUG, TASK, EPIC), priority (LOWEST to HIGHEST), status (via column), assignee, sprint
- Tickets live in Board Columns. Moving a ticket = changing its columnId and position
- Sprints have states: PLANNED → ACTIVE → COMPLETED. Only one sprint can be active at a time
- The backlog contains tickets not assigned to any sprint
- Board Columns are organization-level (shared across projects). Default columns: TO DO, IN PROGRESS, DONE
- Boards are saved views with filters (by sprint, type, priority, assignee, labels)
- Project members have roles: ADMIN, MEMBER, VIEWER
- Ticket comments support rich text up to 10,000 characters
- Story points use Fibonacci: 1, 2, 3, 5, 8, 13, 21
- When setting up a new project: create project → add members → create sprint → create board columns (if needed) → create tickets
- AI features available: enhance-ticket, parse-ticket, detect-duplicates, summarize-comments, decompose (break into subtasks), sprint-insights, risk-analysis
- The project summary shows: ticket counts by status/type/priority, sprint progress, member count`,

  [ToolCategory.HR]: `## HR Domain Knowledge
- Departments have a hierarchy (parentDepartmentId) and a department head (headUserId)
- Designations (job titles) belong to departments and have levels
- Leave Types define available leave categories (e.g., Annual, Sick, Casual)
- Leave Balances track total/used/remaining days per user per leave type per year
- Leave Requests go through: PENDING → APPROVED/REJECTED. Include startDate, endDate, daysCount
- Attendance tracks daily clock-in/clock-out with total hours and status (PRESENT, ABSENT, HALF_DAY, LATE, ON_LEAVE)
- Payroll records monthly salary: basicSalary, allowances (JSON), deductions (JSON), grossSalary, netSalary
- Announcements have types (GENERAL, POLICY, EVENT, URGENT) and priority (LOW, MEDIUM, HIGH, CRITICAL)
- Documents store HR files (contracts, policies, certificates) with type, URL, visibility (public/private)
- HR Dashboard shows: total employees, department breakdown, leave stats, attendance summary, payroll totals
- When asking about "team" or "staff", use employees_list or hr_list_departments
- When asking about "time off" or "vacation", use leave requests and leave balances`,

  [ToolCategory.CHATS]: `## Chats Domain Knowledge
- Chat rooms can be DIRECT (1:1) or GROUP (multiple members)
- Creating a DIRECT room requires exactly one other memberIds entry
- Creating a GROUP room requires a name and at least one member
- Messages are simple text (1-5000 characters)
- markAsRead marks all messages in a room as read for the current user
- getUnreadCounts returns a map of chatRoomId → unread count
- When the user asks to "message someone", find the user first (users_list), then create a DIRECT room, then send the message`,

  [ToolCategory.SUBSCRIPTIONS]: `## Subscriptions Domain Knowledge
- Subscription plans define pricing tiers with: name, pricePerUserMonthly/Annual, maxContacts, features (JSON)
- Each organization has one active subscription linked to a plan
- Billing cycles: MONTHLY or ANNUAL (annual is typically discounted)
- Trial management: organizations can have trial periods with start/end dates
- Pricing calculation: base price per user × user count, with volume discounts for larger counts
- Upgrade/downgrade: changing plans mid-cycle uses proration (pro-rated credits/charges)
- User count changes can be scheduled to take effect at the end of the billing cycle
- Invoices are generated for each billing period and linked to the subscription
- Invoice statuses: DRAFT, SENT, PAID, OVERDUE, CANCELLED
- The customer portal (Stripe) allows self-service billing management
- Admin operations (admin_upgrade, admin_update_user_count) bypass normal flow — use only when explicitly requested`,

  [ToolCategory.ANALYTICS]: `## Analytics Domain Knowledge
- KPIs endpoint returns: total users, active users, total organizations, revenue metrics
- User analytics shows user registration trends, activity patterns
- Organization breakdown shows per-org metrics (SUPERADMIN only)
- Date filtering: use startDate and endDate in ISO format (YYYY-MM-DD)
- When the user asks about "growth", "trends", or "metrics", use analytics tools`,

  [ToolCategory.AUDIT]: `## Audit Domain Knowledge
- Audit logs track all API actions: who did what, when, on which record
- Filterable by module (USERS, CRM, FINANCE, etc.), action (CREATE, UPDATE, DELETE), date range
- user_history shows all actions by a specific user — useful for investigation/compliance
- audit_stats provides aggregate counts by module and action
- When the user asks "who changed X" or "what happened to Y", use audit tools`,

  [ToolCategory.NOTIFICATIONS]: `## Notifications Domain Knowledge
- Notifications are per-user within an organization
- Types include system alerts, assignment notifications, mentions, etc.
- Use unread_count for badge counts, list for full details
- mark_all_read is useful when the user says "clear notifications" or "I've seen everything"`,

  [ToolCategory.USERS]: `## Users Domain Knowledge
- Users belong to organizations and have roles: ADMIN or USER
- Users can be invited via email (users_invite)
- User statuses: ACTIVE, INACTIVE, SUSPENDED
- Soft delete supported (users_delete), with restore (users_restore) and permanent delete (users_force_delete)
- When the user asks about "team members" or "people", use users_list`,

  [ToolCategory.ORGANIZATIONS]: `## Organizations Domain Knowledge
- Organizations are the top-level tenant entity
- Each org has: name, slug, domain, timezone, settings (JSON), billing details
- Settings can be updated separately via organizations_update_settings
- Organizations have subscription plans linked to them
- Slug and domain must be unique across the platform`,

  [ToolCategory.EMPLOYEES]: `## Employees Domain Knowledge
- Employees are platform-level users (SUPERADMIN, SUPPORT roles)
- Different from regular Users who belong to organizations
- Employee profiles can be updated independently of their account status`,

  [ToolCategory.RBAC]: `## RBAC Domain Knowledge
- Roles contain permissions as a JSON structure mapping resources to allowed actions
- Resources represent modules (USERS, CRM, FINANCE, etc.)
- Actions represent operations (CREATE, READ, UPDATE, DELETE, LIST, EXPORT, IMPORT)
- Use rbac_get_role_actions to check what a role can do on a specific resource
- When modifying permissions, update the role's permissions JSON object`,

  [ToolCategory.ASSETS]: `## Assets Domain Knowledge
- Assets are uploaded files (images, documents) stored with URL, filename, mimetype, size
- Assets are organization-scoped
- Used by other modules for attachments (e.g., HR documents, project assets, expense receipts)`,
};

export function getDomainGuidance(categories: ToolCategory[]): string {
  const guidance = categories
    .filter((cat) => DOMAIN_GUIDANCE[cat])
    .map((cat) => DOMAIN_GUIDANCE[cat]);

  if (guidance.length === 0) return '';
  return '\n\n' + guidance.join('\n\n');
}

export function getAllDomainCategories(): ToolCategory[] {
  return Object.keys(DOMAIN_GUIDANCE) as ToolCategory[];
}
