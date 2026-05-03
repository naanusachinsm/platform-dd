import {
  ToolDefinition,
  ToolCategory,
  ToolResult,
  AgentContext,
  ToolInputSchema,
} from '../interfaces/tool.interface';
import { CrmService } from 'src/resources/crm/crm.service';

export function createCrmTools(crmService: CrmService): ToolDefinition[] {
  return [
    {
      name: 'crm_list_companies',
      description:
        'List and search CRM companies with optional filters for status, size, and industry.',
      category: ToolCategory.CRM,
      inputSchema: {
        type: 'object',
        properties: {
          search: { type: 'string', description: 'Search by company name' },
          status: {
            type: 'string',
            description: 'Filter by status',
            enum: ['ACTIVE', 'INACTIVE'],
          },
          size: {
            type: 'string',
            description: 'Filter by company size',
            enum: ['STARTUP', 'SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE'],
          },
          industry: { type: 'string', description: 'Filter by industry' },
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
          const result = await crmService.findAllCompanies(params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'crm_create_company',
      description: 'Create a new CRM company record.',
      category: ToolCategory.CRM,
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Company name' },
          industry: { type: 'string', description: 'Industry sector' },
          website: { type: 'string', description: 'Company website URL' },
          phone: { type: 'string', description: 'Phone number' },
          address: { type: 'string', description: 'Street address' },
          city: { type: 'string', description: 'City' },
          state: { type: 'string', description: 'State or province' },
          country: { type: 'string', description: 'Country' },
          size: {
            type: 'string',
            description: 'Company size',
            enum: ['STARTUP', 'SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE'],
          },
          status: {
            type: 'string',
            description: 'Company status',
            enum: ['ACTIVE', 'INACTIVE'],
          },
          notes: { type: 'string', description: 'Additional notes' },
        },
        required: ['name'],
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await crmService.createCompany(params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'crm_get_company',
      description: 'Get a CRM company by its ID.',
      category: ToolCategory.CRM,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Company ID' },
        },
        required: ['id'],
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await crmService.findCompanyById(params.id);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'crm_update_company',
      description: 'Update an existing CRM company.',
      category: ToolCategory.CRM,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Company ID' },
          name: { type: 'string', description: 'Company name' },
          industry: { type: 'string', description: 'Industry sector' },
          website: { type: 'string', description: 'Company website URL' },
          phone: { type: 'string', description: 'Phone number' },
          address: { type: 'string', description: 'Street address' },
          city: { type: 'string', description: 'City' },
          state: { type: 'string', description: 'State or province' },
          country: { type: 'string', description: 'Country' },
          size: {
            type: 'string',
            description: 'Company size',
            enum: ['STARTUP', 'SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE'],
          },
          status: {
            type: 'string',
            description: 'Company status',
            enum: ['ACTIVE', 'INACTIVE'],
          },
          notes: { type: 'string', description: 'Additional notes' },
        },
        required: ['id'],
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await crmService.updateCompany(params.id, params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'crm_delete_company',
      description: 'Delete a CRM company by its ID.',
      category: ToolCategory.CRM,
      requiresConfirmation: true,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Company ID' },
        },
        required: ['id'],
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await crmService.deleteCompany(params.id);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'crm_list_contacts',
      description:
        'List and search CRM contacts with optional filters for status, source, company, and owner.',
      category: ToolCategory.CRM,
      inputSchema: {
        type: 'object',
        properties: {
          search: { type: 'string', description: 'Search by name or email' },
          status: {
            type: 'string',
            description: 'Filter by status',
            enum: ['ACTIVE', 'INACTIVE'],
          },
          source: {
            type: 'string',
            description: 'Filter by lead source',
            enum: [
              'WEBSITE',
              'REFERRAL',
              'LINKEDIN',
              'COLD_CALL',
              'EVENT',
              'OTHER',
            ],
          },
          companyId: {
            type: 'string',
            description: 'Filter by associated company ID',
          },
          ownerId: {
            type: 'string',
            description: 'Filter by owner user ID',
          },
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
          const result = await crmService.findAllContacts(params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'crm_create_contact',
      description: 'Create a new CRM contact.',
      category: ToolCategory.CRM,
      inputSchema: {
        type: 'object',
        properties: {
          firstName: { type: 'string', description: 'First name' },
          lastName: { type: 'string', description: 'Last name' },
          email: { type: 'string', description: 'Email address' },
          phone: { type: 'string', description: 'Phone number' },
          companyId: {
            type: 'string',
            description: 'Associated company ID',
          },
          jobTitle: { type: 'string', description: 'Job title' },
          status: {
            type: 'string',
            description: 'Contact status',
            enum: ['ACTIVE', 'INACTIVE'],
          },
          source: {
            type: 'string',
            description: 'Lead source',
            enum: [
              'WEBSITE',
              'REFERRAL',
              'LINKEDIN',
              'COLD_CALL',
              'EVENT',
              'OTHER',
            ],
          },
          notes: { type: 'string', description: 'Additional notes' },
        },
        required: ['firstName', 'lastName'],
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await crmService.createContact(params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'crm_get_contact',
      description: 'Get a CRM contact by its ID.',
      category: ToolCategory.CRM,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Contact ID' },
        },
        required: ['id'],
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await crmService.findContactById(params.id);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'crm_update_contact',
      description: 'Update an existing CRM contact.',
      category: ToolCategory.CRM,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Contact ID' },
          firstName: { type: 'string', description: 'First name' },
          lastName: { type: 'string', description: 'Last name' },
          email: { type: 'string', description: 'Email address' },
          phone: { type: 'string', description: 'Phone number' },
          companyId: {
            type: 'string',
            description: 'Associated company ID',
          },
          jobTitle: { type: 'string', description: 'Job title' },
          status: {
            type: 'string',
            description: 'Contact status',
            enum: ['ACTIVE', 'INACTIVE'],
          },
          source: {
            type: 'string',
            description: 'Lead source',
            enum: [
              'WEBSITE',
              'REFERRAL',
              'LINKEDIN',
              'COLD_CALL',
              'EVENT',
              'OTHER',
            ],
          },
          notes: { type: 'string', description: 'Additional notes' },
        },
        required: ['id'],
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await crmService.updateContact(params.id, params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'crm_delete_contact',
      description: 'Delete a CRM contact by its ID.',
      category: ToolCategory.CRM,
      requiresConfirmation: true,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Contact ID' },
        },
        required: ['id'],
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await crmService.deleteContact(params.id);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'crm_list_deals',
      description:
        'List and search CRM deals with optional filters for stage, priority, contact, company, and owner.',
      category: ToolCategory.CRM,
      inputSchema: {
        type: 'object',
        properties: {
          search: { type: 'string', description: 'Search by deal title' },
          stage: {
            type: 'string',
            description: 'Filter by deal stage',
            enum: [
              'LEAD',
              'QUALIFIED',
              'PROPOSAL',
              'NEGOTIATION',
              'CLOSED_WON',
              'CLOSED_LOST',
            ],
          },
          priority: { type: 'string', description: 'Filter by priority' },
          contactId: {
            type: 'string',
            description: 'Filter by contact ID',
          },
          companyId: {
            type: 'string',
            description: 'Filter by company ID',
          },
          ownerId: {
            type: 'string',
            description: 'Filter by owner user ID',
          },
          dateRange: {
            type: 'string',
            description:
              'Filter by date range (e.g. this_week, this_month, this_quarter)',
          },
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
          const result = await crmService.findAllDeals(params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'crm_create_deal',
      description: 'Create a new CRM deal.',
      category: ToolCategory.CRM,
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Deal title' },
          contactId: {
            type: 'string',
            description: 'Associated contact ID',
          },
          companyId: {
            type: 'string',
            description: 'Associated company ID',
          },
          ownerId: { type: 'string', description: 'Owner user ID' },
          value: {
            type: 'number',
            description: 'Deal monetary value',
            minimum: 0,
          },
          currency: {
            type: 'string',
            description: 'Currency code (e.g. USD, EUR)',
          },
          stage: {
            type: 'string',
            description: 'Deal stage',
            enum: [
              'LEAD',
              'QUALIFIED',
              'PROPOSAL',
              'NEGOTIATION',
              'CLOSED_WON',
              'CLOSED_LOST',
            ],
          },
          probability: {
            type: 'number',
            description: 'Win probability percentage',
            minimum: 0,
            maximum: 100,
          },
          priority: { type: 'string', description: 'Deal priority' },
          notes: { type: 'string', description: 'Additional notes' },
        },
        required: ['title'],
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await crmService.createDeal(params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'crm_get_deal',
      description: 'Get a CRM deal by its ID.',
      category: ToolCategory.CRM,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Deal ID' },
        },
        required: ['id'],
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await crmService.findDealById(params.id);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'crm_update_deal',
      description: 'Update an existing CRM deal.',
      category: ToolCategory.CRM,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Deal ID' },
          title: { type: 'string', description: 'Deal title' },
          contactId: {
            type: 'string',
            description: 'Associated contact ID',
          },
          companyId: {
            type: 'string',
            description: 'Associated company ID',
          },
          ownerId: { type: 'string', description: 'Owner user ID' },
          value: {
            type: 'number',
            description: 'Deal monetary value',
            minimum: 0,
          },
          currency: {
            type: 'string',
            description: 'Currency code (e.g. USD, EUR)',
          },
          stage: {
            type: 'string',
            description: 'Deal stage',
            enum: [
              'LEAD',
              'QUALIFIED',
              'PROPOSAL',
              'NEGOTIATION',
              'CLOSED_WON',
              'CLOSED_LOST',
            ],
          },
          probability: {
            type: 'number',
            description: 'Win probability percentage',
            minimum: 0,
            maximum: 100,
          },
          priority: { type: 'string', description: 'Deal priority' },
          notes: { type: 'string', description: 'Additional notes' },
        },
        required: ['id'],
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await crmService.updateDeal(params.id, params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'crm_update_deal_stage',
      description:
        'Update the stage and optionally the position of a CRM deal in the pipeline.',
      category: ToolCategory.CRM,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Deal ID' },
          stage: {
            type: 'string',
            description: 'New deal stage',
            enum: [
              'LEAD',
              'QUALIFIED',
              'PROPOSAL',
              'NEGOTIATION',
              'CLOSED_WON',
              'CLOSED_LOST',
            ],
          },
          position: {
            type: 'integer',
            description: 'Position within the stage',
            minimum: 0,
          },
        },
        required: ['id', 'stage'],
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await crmService.updateDealStage(params.id, params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'crm_delete_deal',
      description: 'Delete a CRM deal by its ID.',
      category: ToolCategory.CRM,
      requiresConfirmation: true,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Deal ID' },
        },
        required: ['id'],
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await crmService.deleteDeal(params.id);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'crm_list_activities',
      description:
        'List CRM activities with optional filters for contact, company, deal, type, and status.',
      category: ToolCategory.CRM,
      inputSchema: {
        type: 'object',
        properties: {
          contactId: {
            type: 'string',
            description: 'Filter by contact ID',
          },
          companyId: {
            type: 'string',
            description: 'Filter by company ID',
          },
          dealId: { type: 'string', description: 'Filter by deal ID' },
          type: {
            type: 'string',
            description: 'Filter by activity type',
            enum: ['CALL', 'EMAIL', 'MEETING', 'TASK', 'NOTE'],
          },
          status: { type: 'string', description: 'Filter by status' },
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
          const result = await crmService.findAllActivities(params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'crm_create_activity',
      description: 'Create a new CRM activity (call, email, meeting, task, or note).',
      category: ToolCategory.CRM,
      inputSchema: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            description: 'Activity type',
            enum: ['CALL', 'EMAIL', 'MEETING', 'TASK', 'NOTE'],
          },
          subject: { type: 'string', description: 'Activity subject line' },
          contactId: {
            type: 'string',
            description: 'Associated contact ID',
          },
          companyId: {
            type: 'string',
            description: 'Associated company ID',
          },
          dealId: { type: 'string', description: 'Associated deal ID' },
          description: {
            type: 'string',
            description: 'Detailed description',
          },
          activityDate: {
            type: 'string',
            description: 'Date/time of the activity (ISO 8601)',
          },
          durationMinutes: {
            type: 'integer',
            description: 'Duration in minutes',
            minimum: 0,
          },
          status: { type: 'string', description: 'Activity status' },
          dueDate: {
            type: 'string',
            description: 'Due date (ISO 8601)',
          },
          isReminder: {
            type: 'boolean',
            description: 'Whether to set a reminder',
          },
        },
        required: ['type', 'subject'],
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await crmService.createActivity(params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'crm_get_activity',
      description: 'Get a CRM activity by its ID.',
      category: ToolCategory.CRM,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Activity ID' },
        },
        required: ['id'],
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await crmService.findActivityById(params.id);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'crm_update_activity',
      description: 'Update an existing CRM activity.',
      category: ToolCategory.CRM,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Activity ID' },
          type: {
            type: 'string',
            description: 'Activity type',
            enum: ['CALL', 'EMAIL', 'MEETING', 'TASK', 'NOTE'],
          },
          subject: { type: 'string', description: 'Activity subject line' },
          contactId: {
            type: 'string',
            description: 'Associated contact ID',
          },
          companyId: {
            type: 'string',
            description: 'Associated company ID',
          },
          dealId: { type: 'string', description: 'Associated deal ID' },
          description: {
            type: 'string',
            description: 'Detailed description',
          },
          activityDate: {
            type: 'string',
            description: 'Date/time of the activity (ISO 8601)',
          },
          durationMinutes: {
            type: 'integer',
            description: 'Duration in minutes',
            minimum: 0,
          },
          status: { type: 'string', description: 'Activity status' },
          dueDate: {
            type: 'string',
            description: 'Due date (ISO 8601)',
          },
          isReminder: {
            type: 'boolean',
            description: 'Whether to set a reminder',
          },
        },
        required: ['id'],
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await crmService.updateActivity(params.id, params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'crm_delete_activity',
      description: 'Delete a CRM activity by its ID.',
      category: ToolCategory.CRM,
      requiresConfirmation: true,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Activity ID' },
        },
        required: ['id'],
      },
      handler: async (params: any): Promise<ToolResult> => {
        try {
          const result = await crmService.deleteActivity(params.id);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'crm_get_pipeline',
      description:
        'Get the deals pipeline view grouped by stage for the current organization.',
      category: ToolCategory.CRM,
      inputSchema: {
        type: 'object',
        properties: {},
      },
      handler: async (_params: any, context: AgentContext): Promise<ToolResult> => {
        try {
          const result = await crmService.getDealsPipeline(
            context.organizationId,
          );
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'crm_get_dashboard',
      description:
        'Get CRM dashboard statistics including company, contact, deal, and activity summaries.',
      category: ToolCategory.CRM,
      inputSchema: {
        type: 'object',
        properties: {},
      },
      handler: async (_params: any, context: AgentContext): Promise<ToolResult> => {
        try {
          const result = await crmService.getDashboardStats(
            context.organizationId,
          );
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
  ];
}
