import {
  ToolDefinition,
  ToolCategory,
  ToolResult,
} from '../interfaces/tool.interface';
import { AnalyticsService } from 'src/resources/analytics/analytics.service';

export function createAnalyticsTools(
  analyticsService: AnalyticsService,
): ToolDefinition[] {
  return [
    {
      name: 'analytics_kpis',
      description:
        'Get key performance indicator statistics with optional date range and organization filtering',
      category: ToolCategory.ANALYTICS,
      inputSchema: {
        type: 'object',
        properties: {
          startDate: {
            type: 'string',
            description: 'Start date for the KPI period (ISO 8601)',
          },
          endDate: {
            type: 'string',
            description: 'End date for the KPI period (ISO 8601)',
          },
          organizationId: {
            type: 'string',
            description: 'Filter KPIs by organization ID',
          },
        },
      },
      handler: async (params): Promise<ToolResult> => {
        try {
          const result = await analyticsService.getKpiStats(params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'analytics_users',
      description:
        'Get user-related analytics including activity, growth, and engagement metrics',
      category: ToolCategory.ANALYTICS,
      inputSchema: {
        type: 'object',
        properties: {
          startDate: {
            type: 'string',
            description: 'Start date for the analytics period (ISO 8601)',
          },
          endDate: {
            type: 'string',
            description: 'End date for the analytics period (ISO 8601)',
          },
          organizationId: {
            type: 'string',
            description: 'Filter analytics by organization ID',
          },
        },
      },
      handler: async (params): Promise<ToolResult> => {
        try {
          const result = await analyticsService.getUsersAnalytics(params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'analytics_org_breakdown',
      description:
        'Get analytics broken down by organization for cross-org comparison',
      category: ToolCategory.ANALYTICS,
      inputSchema: {
        type: 'object',
        properties: {
          startDate: {
            type: 'string',
            description: 'Start date for the breakdown period (ISO 8601)',
          },
          endDate: {
            type: 'string',
            description: 'End date for the breakdown period (ISO 8601)',
          },
        },
      },
      handler: async (params): Promise<ToolResult> => {
        try {
          const result =
            await analyticsService.getOrganizationBreakdown(params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
  ];
}
