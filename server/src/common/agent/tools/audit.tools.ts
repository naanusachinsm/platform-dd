import {
  ToolDefinition,
  ToolCategory,
  ToolResult,
} from '../interfaces/tool.interface';
import { AuditLogsService } from 'src/resources/audit-logs/audit-logs.service';

export function createAuditTools(
  auditLogsService: AuditLogsService,
): ToolDefinition[] {
  return [
    {
      name: 'audit_list',
      description:
        'List audit logs with filtering by module, action, date range, and organization',
      category: ToolCategory.AUDIT,
      inputSchema: {
        type: 'object',
        properties: {
          search: {
            type: 'string',
            description: 'Search term to filter audit logs',
          },
          module: {
            type: 'string',
            description: 'Filter by module name',
          },
          action: {
            type: 'string',
            description: 'Filter by action type',
          },
          fromDate: {
            type: 'string',
            description: 'Start date filter (ISO 8601)',
          },
          toDate: {
            type: 'string',
            description: 'End date filter (ISO 8601)',
          },
          organizationId: {
            type: 'string',
            description: 'Filter by organization ID',
          },
          page: { type: 'integer', description: 'Page number', default: 1 },
          limit: {
            type: 'integer',
            description: 'Items per page',
            default: 10,
          },
        },
      },
      handler: async (params): Promise<ToolResult> => {
        try {
          const result = await auditLogsService.findAll(params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'audit_get',
      description: 'Get a specific audit log entry by ID',
      category: ToolCategory.AUDIT,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Audit log ID' },
        },
        required: ['id'],
      },
      handler: async (params): Promise<ToolResult> => {
        try {
          const result = await auditLogsService.findAuditLogById(params.id);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'audit_get_stats',
      description:
        'Get aggregated audit statistics with optional filtering by organization, module, or action',
      category: ToolCategory.AUDIT,
      inputSchema: {
        type: 'object',
        properties: {
          organization_id: {
            type: 'string',
            description: 'Filter stats by organization ID',
          },
          module: {
            type: 'string',
            description: 'Filter stats by module name',
          },
          action: {
            type: 'string',
            description: 'Filter stats by action type',
          },
        },
      },
      handler: async (params): Promise<ToolResult> => {
        try {
          const result = await auditLogsService.getAuditStats(params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'audit_user_history',
      description: 'Get the complete audit history for a specific user',
      category: ToolCategory.AUDIT,
      inputSchema: {
        type: 'object',
        properties: {
          userId: {
            type: 'string',
            description: 'User ID to retrieve audit history for',
          },
        },
        required: ['userId'],
      },
      handler: async (params): Promise<ToolResult> => {
        try {
          const result = await auditLogsService.getEmployeeAuditHistory(
            params.userId,
          );
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
  ];
}
