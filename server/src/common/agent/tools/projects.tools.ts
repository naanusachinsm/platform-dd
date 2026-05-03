import {
  ToolDefinition,
  ToolCategory,
  ToolResult,
  AgentContext,
  ToolInputSchema,
} from '../interfaces/tool.interface';
import { ProjectService } from 'src/resources/projects/services/project.service';
import { TicketService } from 'src/resources/projects/services/ticket.service';
import { SprintService } from 'src/resources/projects/services/sprint.service';
import { BoardColumnService } from 'src/resources/projects/services/board-column.service';
import { BoardService } from 'src/resources/projects/services/board.service';

export function createProjectsTools(
  projectService: ProjectService,
  ticketService: TicketService,
  sprintService: SprintService,
  boardColumnService: BoardColumnService,
  boardService: BoardService,
): ToolDefinition[] {
  return [
    // ── Projects ──────────────────────────────────────────────
    {
      name: 'projects_list',
      description: 'List and search projects with optional status filter.',
      category: ToolCategory.PROJECTS,
      inputSchema: {
        type: 'object',
        properties: {
          search: {
            type: 'string',
            description: 'Search by project name or key',
          },
          status: { type: 'string', description: 'Filter by project status' },
          page: { type: 'integer', description: 'Page number', minimum: 1 },
          limit: {
            type: 'integer',
            description: 'Items per page',
            minimum: 1,
            maximum: 100,
          },
        },
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await projectService.findAll(params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'projects_create',
      description: 'Create a new project with a unique key.',
      category: ToolCategory.PROJECTS,
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Project name' },
          key: {
            type: 'string',
            description:
              'Unique project key used as ticket prefix (e.g. PROJ)',
          },
          description: {
            type: 'string',
            description: 'Project description',
          },
          leadUserId: {
            type: 'string',
            description: 'Project lead user ID',
          },
        },
        required: ['name', 'key'],
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await projectService.create(params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'projects_get',
      description: 'Get a project by its ID.',
      category: ToolCategory.PROJECTS,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Project ID' },
        },
        required: ['id'],
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await projectService.findOne(params.id);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'projects_update',
      description: 'Update an existing project.',
      category: ToolCategory.PROJECTS,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Project ID' },
          name: { type: 'string', description: 'Project name' },
          description: {
            type: 'string',
            description: 'Project description',
          },
          leadUserId: {
            type: 'string',
            description: 'Project lead user ID',
          },
        },
        required: ['id'],
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await projectService.update(params.id, params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'projects_delete',
      description: 'Delete a project by its ID.',
      category: ToolCategory.PROJECTS,
      requiresConfirmation: true,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Project ID' },
        },
        required: ['id'],
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await projectService.remove(params.id);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },

    // ── Project Members ───────────────────────────────────────
    {
      name: 'projects_list_members',
      description: 'List all members of a project.',
      category: ToolCategory.PROJECTS,
      inputSchema: {
        type: 'object',
        properties: {
          projectId: { type: 'string', description: 'Project ID' },
        },
        required: ['projectId'],
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await projectService.getMembers(params.projectId);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'projects_add_member',
      description: 'Add a user as a member to a project.',
      category: ToolCategory.PROJECTS,
      inputSchema: {
        type: 'object',
        properties: {
          projectId: { type: 'string', description: 'Project ID' },
          userId: { type: 'string', description: 'User ID to add' },
          role: {
            type: 'string',
            description: 'Member role in the project',
          },
        },
        required: ['projectId', 'userId'],
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await projectService.addMember(
            params.projectId,
            params,
          );
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'projects_remove_member',
      description: 'Remove a member from a project.',
      category: ToolCategory.PROJECTS,
      requiresConfirmation: true,
      inputSchema: {
        type: 'object',
        properties: {
          projectId: { type: 'string', description: 'Project ID' },
          userId: { type: 'string', description: 'User ID to remove' },
        },
        required: ['projectId', 'userId'],
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await projectService.removeMember(
            params.projectId,
            params.userId,
          );
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },

    // ── Sprints ───────────────────────────────────────────────
    {
      name: 'projects_list_sprints',
      description: 'List all sprints for a project.',
      category: ToolCategory.PROJECTS,
      inputSchema: {
        type: 'object',
        properties: {
          projectId: { type: 'string', description: 'Project ID' },
        },
        required: ['projectId'],
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await sprintService.findAll(params.projectId);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'projects_create_sprint',
      description: 'Create a new sprint for a project.',
      category: ToolCategory.PROJECTS,
      inputSchema: {
        type: 'object',
        properties: {
          projectId: { type: 'string', description: 'Project ID' },
          name: { type: 'string', description: 'Sprint name' },
          goal: { type: 'string', description: 'Sprint goal' },
          startDate: {
            type: 'string',
            description: 'Start date (ISO 8601)',
          },
          endDate: { type: 'string', description: 'End date (ISO 8601)' },
        },
        required: ['projectId', 'name'],
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await sprintService.create(
            params.projectId,
            params,
          );
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'projects_update_sprint',
      description: 'Update an existing sprint.',
      category: ToolCategory.PROJECTS,
      inputSchema: {
        type: 'object',
        properties: {
          projectId: { type: 'string', description: 'Project ID' },
          id: { type: 'string', description: 'Sprint ID' },
          name: { type: 'string', description: 'Sprint name' },
          goal: { type: 'string', description: 'Sprint goal' },
          startDate: {
            type: 'string',
            description: 'Start date (ISO 8601)',
          },
          endDate: { type: 'string', description: 'End date (ISO 8601)' },
        },
        required: ['projectId', 'id'],
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await sprintService.update(
            params.projectId,
            params.id,
            params,
          );
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'projects_start_sprint',
      description: 'Start a sprint, moving it from planning to active.',
      category: ToolCategory.PROJECTS,
      inputSchema: {
        type: 'object',
        properties: {
          projectId: { type: 'string', description: 'Project ID' },
          id: { type: 'string', description: 'Sprint ID' },
        },
        required: ['projectId', 'id'],
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await sprintService.start(
            params.projectId,
            params.id,
          );
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'projects_complete_sprint',
      description:
        'Complete a sprint, marking it as finished and optionally moving remaining tickets.',
      category: ToolCategory.PROJECTS,
      inputSchema: {
        type: 'object',
        properties: {
          projectId: { type: 'string', description: 'Project ID' },
          id: { type: 'string', description: 'Sprint ID' },
        },
        required: ['projectId', 'id'],
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await sprintService.complete(
            params.projectId,
            params.id,
          );
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'projects_delete_sprint',
      description: 'Delete a sprint from a project.',
      category: ToolCategory.PROJECTS,
      requiresConfirmation: true,
      inputSchema: {
        type: 'object',
        properties: {
          projectId: { type: 'string', description: 'Project ID' },
          id: { type: 'string', description: 'Sprint ID' },
        },
        required: ['projectId', 'id'],
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await sprintService.remove(
            params.projectId,
            params.id,
          );
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },

    // ── Tickets ───────────────────────────────────────────────
    {
      name: 'projects_list_tickets',
      description:
        'List and filter tickets for a project by type, priority, assignee, sprint, or board column.',
      category: ToolCategory.PROJECTS,
      inputSchema: {
        type: 'object',
        properties: {
          projectId: { type: 'string', description: 'Project ID' },
          type: {
            type: 'string',
            description: 'Filter by ticket type',
            enum: ['STORY', 'BUG', 'TASK', 'EPIC'],
          },
          priority: {
            type: 'string',
            description: 'Filter by priority',
            enum: ['LOWEST', 'LOW', 'MEDIUM', 'HIGH', 'HIGHEST'],
          },
          assigneeId: {
            type: 'string',
            description: 'Filter by assignee user ID',
          },
          sprintId: {
            type: 'string',
            description: 'Filter by sprint ID',
          },
          columnId: {
            type: 'string',
            description: 'Filter by board column ID',
          },
          page: { type: 'integer', description: 'Page number', minimum: 1 },
          limit: {
            type: 'integer',
            description: 'Items per page',
            minimum: 1,
            maximum: 100,
          },
        },
        required: ['projectId'],
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await ticketService.findAll(
            params.projectId,
            params,
          );
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'projects_create_ticket',
      description: 'Create a new ticket (story, bug, task, or epic) in a project.',
      category: ToolCategory.PROJECTS,
      inputSchema: {
        type: 'object',
        properties: {
          projectId: { type: 'string', description: 'Project ID' },
          title: { type: 'string', description: 'Ticket title' },
          description: {
            type: 'string',
            description: 'Ticket description (supports markdown)',
          },
          type: {
            type: 'string',
            description: 'Ticket type',
            enum: ['STORY', 'BUG', 'TASK', 'EPIC'],
          },
          priority: {
            type: 'string',
            description: 'Ticket priority',
            enum: ['LOWEST', 'LOW', 'MEDIUM', 'HIGH', 'HIGHEST'],
          },
          assigneeId: {
            type: 'string',
            description: 'Assignee user ID',
          },
          sprintId: {
            type: 'string',
            description: 'Sprint ID to assign to',
          },
          columnId: {
            type: 'string',
            description: 'Board column ID',
          },
          storyPoints: {
            type: 'integer',
            description: 'Story point estimate',
            minimum: 0,
          },
          dueDate: {
            type: 'string',
            description: 'Due date (ISO 8601)',
          },
          labels: {
            type: 'array',
            description: 'Ticket labels',
            items: { type: 'string' },
          },
        },
        required: ['projectId', 'title'],
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await ticketService.create(
            params.projectId,
            params,
          );
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'projects_get_ticket',
      description: 'Get a ticket by its ID within a project.',
      category: ToolCategory.PROJECTS,
      inputSchema: {
        type: 'object',
        properties: {
          projectId: { type: 'string', description: 'Project ID' },
          id: { type: 'string', description: 'Ticket ID' },
        },
        required: ['projectId', 'id'],
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await ticketService.findOne(
            params.projectId,
            params.id,
          );
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'projects_update_ticket',
      description: 'Update an existing ticket.',
      category: ToolCategory.PROJECTS,
      inputSchema: {
        type: 'object',
        properties: {
          projectId: { type: 'string', description: 'Project ID' },
          id: { type: 'string', description: 'Ticket ID' },
          title: { type: 'string', description: 'Ticket title' },
          description: {
            type: 'string',
            description: 'Ticket description',
          },
          type: {
            type: 'string',
            description: 'Ticket type',
            enum: ['STORY', 'BUG', 'TASK', 'EPIC'],
          },
          priority: {
            type: 'string',
            description: 'Ticket priority',
            enum: ['LOWEST', 'LOW', 'MEDIUM', 'HIGH', 'HIGHEST'],
          },
          assigneeId: {
            type: 'string',
            description: 'Assignee user ID',
          },
          sprintId: {
            type: 'string',
            description: 'Sprint ID',
          },
          columnId: {
            type: 'string',
            description: 'Board column ID',
          },
          storyPoints: {
            type: 'integer',
            description: 'Story point estimate',
            minimum: 0,
          },
          dueDate: {
            type: 'string',
            description: 'Due date (ISO 8601)',
          },
          labels: {
            type: 'array',
            description: 'Ticket labels',
            items: { type: 'string' },
          },
        },
        required: ['projectId', 'id'],
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await ticketService.update(
            params.projectId,
            params.id,
            params,
          );
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'projects_delete_ticket',
      description: 'Delete a ticket from a project.',
      category: ToolCategory.PROJECTS,
      requiresConfirmation: true,
      inputSchema: {
        type: 'object',
        properties: {
          projectId: { type: 'string', description: 'Project ID' },
          id: { type: 'string', description: 'Ticket ID' },
        },
        required: ['projectId', 'id'],
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await ticketService.remove(
            params.projectId,
            params.id,
          );
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'projects_move_ticket',
      description: 'Move a ticket to a different board column and/or position.',
      category: ToolCategory.PROJECTS,
      inputSchema: {
        type: 'object',
        properties: {
          projectId: { type: 'string', description: 'Project ID' },
          id: { type: 'string', description: 'Ticket ID' },
          columnId: {
            type: 'string',
            description: 'Target board column ID',
          },
          position: {
            type: 'integer',
            description: 'Position within the column',
            minimum: 0,
          },
        },
        required: ['projectId', 'id', 'columnId', 'position'],
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await ticketService.moveTicket(
            params.projectId,
            params.id,
            params,
          );
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'projects_assign_ticket',
      description:
        'Assign or unassign a ticket to a user. Omit assigneeId to unassign.',
      category: ToolCategory.PROJECTS,
      inputSchema: {
        type: 'object',
        properties: {
          projectId: { type: 'string', description: 'Project ID' },
          id: { type: 'string', description: 'Ticket ID' },
          assigneeId: {
            type: 'string',
            description: 'User ID to assign (omit to unassign)',
          },
        },
        required: ['projectId', 'id'],
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await ticketService.assignTicket(
            params.projectId,
            params.id,
            params,
          );
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'projects_get_backlog',
      description:
        'Get backlog data for a project, including unassigned tickets and sprint breakdown.',
      category: ToolCategory.PROJECTS,
      inputSchema: {
        type: 'object',
        properties: {
          projectId: { type: 'string', description: 'Project ID' },
        },
        required: ['projectId'],
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await ticketService.getBacklogData(params.projectId);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'projects_get_summary',
      description:
        'Get a project summary with ticket counts by status, type, and priority.',
      category: ToolCategory.PROJECTS,
      inputSchema: {
        type: 'object',
        properties: {
          projectId: { type: 'string', description: 'Project ID' },
        },
        required: ['projectId'],
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await ticketService.getProjectSummary(
            params.projectId,
          );
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },

    // ── Board Columns ─────────────────────────────────────────
    {
      name: 'projects_list_columns',
      description: 'List all board columns available for the organization.',
      category: ToolCategory.PROJECTS,
      inputSchema: {
        type: 'object',
        properties: {},
      },
      handler: async (_params: any, context: AgentContext): Promise<ToolResult> => {
        try {
          const result = await boardColumnService.findAll(
            context.organizationId,
          );
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'projects_create_column',
      description: 'Create a new board column.',
      category: ToolCategory.PROJECTS,
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Column name' },
        },
        required: ['name'],
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await boardColumnService.create(params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'projects_update_column',
      description: 'Update an existing board column.',
      category: ToolCategory.PROJECTS,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Column ID' },
          name: { type: 'string', description: 'Column name' },
        },
        required: ['id'],
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await boardColumnService.update(params.id, params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
  ];
}
