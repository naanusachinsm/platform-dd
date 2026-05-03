import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import {
  ToolDefinition,
  ToolCategory,
  AgentContext,
  ToolResult,
  ToolExecutionResult,
  ToolCallRequest,
} from '../interfaces/tool.interface';

import { CrmService } from 'src/resources/crm/crm.service';
import { FinanceService } from 'src/resources/finance/finance.service';
import { ProjectService } from 'src/resources/projects/services/project.service';
import { TicketService } from 'src/resources/projects/services/ticket.service';
import { SprintService } from 'src/resources/projects/services/sprint.service';
import { BoardColumnService } from 'src/resources/projects/services/board-column.service';
import { BoardService } from 'src/resources/projects/services/board.service';
import { HrService } from 'src/resources/hr/hr.service';
import { UsersService } from 'src/resources/users/users.service';
import { OrganizationsService } from 'src/resources/organizations/organizations.service';
import { EmployeesService } from 'src/resources/employees/employees.service';
import { RoleService } from 'src/resources/rbac/services/role.service';
import { ResourceService } from 'src/resources/rbac/services/resource.service';
import { ActionService } from 'src/resources/rbac/services/action.service';
import { AnalyticsService } from 'src/resources/analytics/analytics.service';
import { AuditLogsService } from 'src/resources/audit-logs/audit-logs.service';
import { NotificationsService } from 'src/resources/notifications/notifications.service';
import { AssetsService } from 'src/resources/assets/assets.service';
import { ChatRoomService } from 'src/resources/chats/services/chat-room.service';
import { ChatMessageService } from 'src/resources/chats/services/chat-message.service';
import { SubscriptionsService } from 'src/resources/subscriptions/subscriptions.service';
import { SubscriptionPlansService } from 'src/resources/subscriptions/subscription-plans.service';

import { createCrmTools } from '../tools/crm.tools';
import { createFinanceTools } from '../tools/finance.tools';
import { createProjectsTools } from '../tools/projects.tools';
import { createHrTools } from '../tools/hr.tools';
import { createUsersTools } from '../tools/users.tools';
import { createOrganizationsTools } from '../tools/organizations.tools';
import { createEmployeesTools } from '../tools/employees.tools';
import { createRbacTools } from '../tools/rbac.tools';
import { createAnalyticsTools } from '../tools/analytics.tools';
import { createAuditTools } from '../tools/audit.tools';
import { createNotificationsTools } from '../tools/notifications.tools';
import { createAssetsTools } from '../tools/assets.tools';
import { createChatsTools } from '../tools/chats.tools';
import { createSubscriptionsTools } from '../tools/subscriptions.tools';

interface ServiceMap {
  [key: string]: { token: any; instance?: any };
}

@Injectable()
export class ToolRegistryService implements OnModuleInit {
  private readonly logger = new Logger(ToolRegistryService.name);
  private tools = new Map<string, ToolDefinition>();
  private toolsByCategory = new Map<ToolCategory, ToolDefinition[]>();

  private readonly serviceTokens: ServiceMap = {
    CrmService: { token: CrmService },
    FinanceService: { token: FinanceService },
    ProjectService: { token: ProjectService },
    TicketService: { token: TicketService },
    SprintService: { token: SprintService },
    BoardColumnService: { token: BoardColumnService },
    BoardService: { token: BoardService },
    HrService: { token: HrService },
    UsersService: { token: UsersService },
    OrganizationsService: { token: OrganizationsService },
    EmployeesService: { token: EmployeesService },
    RoleService: { token: RoleService },
    ResourceService: { token: ResourceService },
    ActionService: { token: ActionService },
    AnalyticsService: { token: AnalyticsService },
    AuditLogsService: { token: AuditLogsService },
    NotificationsService: { token: NotificationsService },
    AssetsService: { token: AssetsService },
    ChatRoomService: { token: ChatRoomService },
    ChatMessageService: { token: ChatMessageService },
    SubscriptionsService: { token: SubscriptionsService },
    SubscriptionPlansService: { token: SubscriptionPlansService },
  };

  constructor(private readonly moduleRef: ModuleRef) {}

  onModuleInit() {
    this.resolveServices();
    this.registerAllTools();
    this.logger.log(
      `Tool registry initialized with ${this.tools.size} tools across ${this.toolsByCategory.size} categories`,
    );
  }

  private resolveServices() {
    for (const [name, entry] of Object.entries(this.serviceTokens)) {
      try {
        entry.instance = this.moduleRef.get(entry.token, { strict: false });
        this.logger.debug(`Resolved service: ${name}`);
      } catch {
        this.logger.warn(`Could not resolve service: ${name}`);
      }
    }
  }

  private svc(name: string): any {
    return this.serviceTokens[name]?.instance;
  }

  private registerAllTools() {
    const toolGroups: ToolDefinition[][] = [];

    if (this.svc('CrmService'))
      toolGroups.push(createCrmTools(this.svc('CrmService')));

    if (this.svc('FinanceService'))
      toolGroups.push(createFinanceTools(this.svc('FinanceService')));

    if (this.svc('ProjectService'))
      toolGroups.push(
        createProjectsTools(
          this.svc('ProjectService'),
          this.svc('TicketService'),
          this.svc('SprintService'),
          this.svc('BoardColumnService'),
          this.svc('BoardService'),
        ),
      );

    if (this.svc('HrService'))
      toolGroups.push(createHrTools(this.svc('HrService')));

    if (this.svc('UsersService'))
      toolGroups.push(createUsersTools(this.svc('UsersService')));

    if (this.svc('OrganizationsService'))
      toolGroups.push(
        createOrganizationsTools(this.svc('OrganizationsService')),
      );

    if (this.svc('EmployeesService'))
      toolGroups.push(createEmployeesTools(this.svc('EmployeesService')));

    if (this.svc('RoleService'))
      toolGroups.push(
        createRbacTools(
          this.svc('RoleService'),
          this.svc('ResourceService'),
          this.svc('ActionService'),
        ),
      );

    if (this.svc('AnalyticsService'))
      toolGroups.push(createAnalyticsTools(this.svc('AnalyticsService')));

    if (this.svc('AuditLogsService'))
      toolGroups.push(createAuditTools(this.svc('AuditLogsService')));

    if (this.svc('NotificationsService'))
      toolGroups.push(
        createNotificationsTools(this.svc('NotificationsService')),
      );

    if (this.svc('AssetsService'))
      toolGroups.push(createAssetsTools(this.svc('AssetsService')));

    if (this.svc('ChatRoomService'))
      toolGroups.push(
        createChatsTools(
          this.svc('ChatRoomService'),
          this.svc('ChatMessageService'),
        ),
      );

    if (this.svc('SubscriptionsService'))
      toolGroups.push(
        createSubscriptionsTools(
          this.svc('SubscriptionsService'),
          this.svc('SubscriptionPlansService'),
        ),
      );

    for (const group of toolGroups) {
      for (const tool of group) {
        this.registerTool(tool);
      }
    }
  }

  private registerTool(tool: ToolDefinition) {
    if (this.tools.has(tool.name)) {
      this.logger.warn(`Duplicate tool name: ${tool.name}, skipping`);
      return;
    }
    this.tools.set(tool.name, tool);

    const catTools = this.toolsByCategory.get(tool.category) || [];
    catTools.push(tool);
    this.toolsByCategory.set(tool.category, catTools);
  }

  getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  getAllTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  getToolsByCategory(category: ToolCategory): ToolDefinition[] {
    return this.toolsByCategory.get(category) || [];
  }

  getCategories(): ToolCategory[] {
    return Array.from(this.toolsByCategory.keys());
  }

  getDestructiveToolNames(): string[] {
    return this.getAllTools()
      .filter((t) => t.requiresConfirmation)
      .map((t) => t.name);
  }

  getToolSchemasForPrompt(activeCategories?: ToolCategory[]): string {
    const sections: string[] = [];
    const categories = this.getCategories();

    for (const cat of categories) {
      const tools = this.getToolsByCategory(cat);
      if (!tools.length) continue;

      const isActive = !activeCategories || activeCategories.includes(cat);

      if (isActive) {
        sections.push(`### ${cat.toUpperCase()} Tools`);
        for (const tool of tools) {
          const confirm = tool.requiresConfirmation
            ? ' [REQUIRES CONFIRMATION]'
            : '';
          sections.push(`\n**${tool.name}** - ${tool.description}${confirm}`);
          sections.push(`  Input: ${this.formatInputSchema(tool)}`);
        }
      } else {
        sections.push(
          `\n### ${cat.toUpperCase()} Tools (${tools.length} tools available — ask to use them)`,
        );
        const summaries = tools
          .map((t) => `  - ${t.name}: ${t.description}`)
          .join('\n');
        sections.push(summaries);
      }
    }

    return sections.join('\n');
  }

  private formatInputSchema(tool: ToolDefinition): string {
    const props = tool.inputSchema.properties;
    const required = new Set(tool.inputSchema.required || []);
    const parts: string[] = [];

    for (const [key, schema] of Object.entries(props)) {
      const req = required.has(key) ? '*' : '?';
      const typePart = schema.enum
        ? schema.enum.map((e) => `"${e}"`).join('|')
        : schema.type;
      parts.push(`${key}${req}: ${typePart}`);
    }

    return `{ ${parts.join(', ')} }`;
  }

  async executeTool(
    call: ToolCallRequest,
    context: AgentContext,
  ): Promise<ToolExecutionResult> {
    const start = Date.now();
    const tool = this.tools.get(call.tool);

    if (!tool) {
      return {
        callId: call.id,
        toolName: call.tool,
        result: { success: false, error: `Unknown tool: ${call.tool}` },
        durationMs: Date.now() - start,
      };
    }

    try {
      const result = await tool.handler(call.params, context);
      return {
        callId: call.id,
        toolName: call.tool,
        result,
        durationMs: Date.now() - start,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.error(
        `Tool ${call.tool} failed: ${message}`,
        error instanceof Error ? error.stack : undefined,
      );
      return {
        callId: call.id,
        toolName: call.tool,
        result: { success: false, error: message },
        durationMs: Date.now() - start,
      };
    }
  }

  async executeTools(
    calls: ToolCallRequest[],
    context: AgentContext,
  ): Promise<ToolExecutionResult[]> {
    return Promise.all(calls.map((call) => this.executeTool(call, context)));
  }
}
