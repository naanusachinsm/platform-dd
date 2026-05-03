import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ProjectService } from 'src/resources/projects/services/project.service';
import { TicketService } from 'src/resources/projects/services/ticket.service';
import { SprintService } from 'src/resources/projects/services/sprint.service';
import { ProjectActivityService } from 'src/resources/projects/services/project-activity.service';
import { CrmService } from 'src/resources/crm/crm.service';
import { EmployeesService } from 'src/resources/employees/employees.service';
import { OrganizationsService } from 'src/resources/organizations/organizations.service';
import { AnalyticsService } from 'src/resources/analytics/analytics.service';
import { AuditLogsService } from 'src/resources/audit-logs/audit-logs.service';
import { NotificationsService } from 'src/resources/notifications/notifications.service';

export interface FetchContext {
  projectId?: string;
  organizationId?: string;
}

const SERVICE_MAP: Record<string, { token: any; }> = {
  ProjectService: { token: ProjectService },
  TicketService: { token: TicketService },
  SprintService: { token: SprintService },
  ProjectActivityService: { token: ProjectActivityService },
  CrmService: { token: CrmService },
  EmployeesService: { token: EmployeesService },
  OrganizationsService: { token: OrganizationsService },
  AnalyticsService: { token: AnalyticsService },
  AuditLogsService: { token: AuditLogsService },
  NotificationsService: { token: NotificationsService },
};

const CATALOG_FOR_PROMPT = `Available data sources (use these exact keys):
project_list          - List all projects the user has access to
project_summary       - Project KPIs: ticket counts by status, sprint stats, member count (requires projectId)
project_tickets       - All tickets with type, priority, status, assignee, due date (requires projectId)
project_sprints       - All sprints with name, status, start/end dates (requires projectId)
project_members       - Project members with names and roles (requires projectId)
project_activity      - Recent project activity log (requires projectId)
project_backlog       - Backlog tickets not assigned to any sprint (requires projectId)
crm_companies         - CRM companies list
crm_contacts          - CRM contacts list
crm_deals             - CRM deals list
crm_pipeline          - CRM deals pipeline by stage
crm_dashboard         - CRM dashboard stats (totals, revenue, conversion)
employees_list        - All employees in the organization
organizations_list    - All organizations
analytics_kpis        - Analytics KPIs (user counts, org counts, revenue)
audit_logs            - Recent audit logs
notifications_unread  - Unread notification count`;

@Injectable()
export class AiDataFetcherService implements OnModuleInit {
  private readonly logger = new Logger(AiDataFetcherService.name);
  private services = new Map<string, any>();

  constructor(private readonly moduleRef: ModuleRef) {}

  onModuleInit() {
    this.logger.log(`[INIT] Resolving ${Object.keys(SERVICE_MAP).length} service(s)...`);
    for (const [name, { token }] of Object.entries(SERVICE_MAP)) {
      try {
        const service = this.moduleRef.get(token, { strict: false });
        this.services.set(name, service);
        this.logger.log(`[INIT] OK: ${name}`);
      } catch (error) {
        this.logger.warn(`[INIT] FAIL: ${name} — ${(error as Error).message}`);
      }
    }
    this.logger.log(`[INIT] Resolved ${this.services.size}/${Object.keys(SERVICE_MAP).length} service(s)`);
  }

  getCatalogPrompt(): string {
    return CATALOG_FOR_PROMPT;
  }

  async fetch(sourceKeys: string[], context: FetchContext): Promise<Record<string, any>> {
    const results: Record<string, any> = {};

    await Promise.all(
      sourceKeys.map(async (key) => {
        try {
          results[key] = await this.fetchSource(key, context);
        } catch (error) {
          this.logger.warn(`Failed to fetch "${key}": ${(error as Error).message}`);
          results[key] = { error: `Failed to fetch: ${(error as Error).message}` };
        }
      }),
    );

    return results;
  }

  private async fetchSource(key: string, ctx: FetchContext): Promise<any> {
    switch (key) {
      case 'project_list':
        return this.call('ProjectService', 'findAll', [{}]);

      case 'project_summary':
        if (!ctx.projectId) return { note: 'No project selected' };
        return this.call('TicketService', 'getProjectSummary', [ctx.projectId]);

      case 'project_tickets':
        if (!ctx.projectId) return { note: 'No project selected' };
        return this.call('TicketService', 'findAll', [ctx.projectId, { page: 1, limit: 200 }]);

      case 'project_sprints':
        if (!ctx.projectId) return { note: 'No project selected' };
        return this.call('SprintService', 'findAll', [ctx.projectId]);

      case 'project_members':
        if (!ctx.projectId) return { note: 'No project selected' };
        return this.call('ProjectService', 'getMembers', [ctx.projectId]);

      case 'project_activity':
        if (!ctx.projectId) return { note: 'No project selected' };
        return this.call('ProjectActivityService', 'findAll', [ctx.projectId, 1, 20]);

      case 'project_backlog':
        if (!ctx.projectId) return { note: 'No project selected' };
        return this.call('TicketService', 'getBacklogData', [ctx.projectId]);

      case 'crm_companies':
        return this.call('CrmService', 'findAllCompanies', [{ page: 1, limit: 100 }]);

      case 'crm_contacts':
        return this.call('CrmService', 'findAllContacts', [{ page: 1, limit: 100 }]);

      case 'crm_deals':
        return this.call('CrmService', 'findAllDeals', [{ page: 1, limit: 100 }]);

      case 'crm_pipeline':
        return this.call('CrmService', 'getDealsPipeline', [ctx.organizationId]);

      case 'crm_dashboard':
        return this.call('CrmService', 'getDashboardStats', [ctx.organizationId]);

      case 'employees_list':
        return this.call('EmployeesService', 'findAll', [{ page: 1, limit: 100 }]);

      case 'organizations_list':
        return this.call('OrganizationsService', 'findAll', [{ page: 1, limit: 100 }]);

      case 'analytics_kpis':
        return this.call('AnalyticsService', 'getKpiStats', [{}]);

      case 'audit_logs':
        return this.call('AuditLogsService', 'findAll', [{ page: 1, limit: 20 }]);

      case 'notifications_unread':
        return this.call('NotificationsService', 'getUnreadCount', []);

      default:
        return { error: `Unknown data source: ${key}` };
    }
  }

  private async call(serviceName: string, method: string, args: any[]): Promise<any> {
    const service = this.services.get(serviceName);
    if (!service) {
      return { error: `${serviceName} not available` };
    }
    if (typeof service[method] !== 'function') {
      return { error: `${serviceName}.${method} not found` };
    }
    return service[method](...args);
  }
}
