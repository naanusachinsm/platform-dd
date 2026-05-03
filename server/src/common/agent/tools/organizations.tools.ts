import { ToolDefinition, ToolCategory, AgentContext } from '../interfaces/tool.interface';
import { OrganizationsService } from 'src/resources/organizations/organizations.service';

export function createOrganizationsTools(orgService: OrganizationsService): ToolDefinition[] {
  return [
    {
      name: 'organizations_list',
      description: 'List all organizations with optional filtering by search term, status, domain, and pagination.',
      category: ToolCategory.ORGANIZATIONS,
      inputSchema: {
        type: 'object',
        properties: {
          search: { type: 'string', description: 'Search term to filter organizations by name, slug, domain, or billing email' },
          status: { type: 'string', description: 'Filter by organization status', enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'] },
          domain: { type: 'string', description: 'Filter by domain name' },
          page: { type: 'integer', description: 'Page number for pagination', minimum: 1, default: 1 },
          limit: { type: 'integer', description: 'Number of items per page', minimum: 1, maximum: 100, default: 10 },
        },
      },
      handler: async (params: any, context: AgentContext) => {
        try {
          const result = await orgService.findAll(params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'organizations_get',
      description: 'Get details of a specific organization by its ID.',
      category: ToolCategory.ORGANIZATIONS,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'ID of the organization to retrieve' },
        },
        required: ['id'],
      },
      handler: async (params: any, context: AgentContext) => {
        try {
          const result = await orgService.findOrganizationById(params.id);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'organizations_get_by_slug',
      description: 'Find an organization by its unique slug.',
      category: ToolCategory.ORGANIZATIONS,
      inputSchema: {
        type: 'object',
        properties: {
          slug: { type: 'string', description: 'Unique slug of the organization' },
        },
        required: ['slug'],
      },
      handler: async (params: any, context: AgentContext) => {
        try {
          const result = await orgService.findBySlug(params.slug);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'organizations_get_by_domain',
      description: 'Find an organization by its domain name.',
      category: ToolCategory.ORGANIZATIONS,
      inputSchema: {
        type: 'object',
        properties: {
          domain: { type: 'string', description: 'Domain name of the organization' },
        },
        required: ['domain'],
      },
      handler: async (params: any, context: AgentContext) => {
        try {
          const result = await orgService.findByDomain(params.domain);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'organizations_create',
      description: 'Create a new organization with name, billing email, and optional details like slug, domain, address, and contact info.',
      category: ToolCategory.ORGANIZATIONS,
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Name of the organization' },
          billingEmail: { type: 'string', description: 'Billing email address' },
          slug: { type: 'string', description: 'Unique URL slug (auto-generated if not provided)' },
          domain: { type: 'string', description: 'Domain name of the organization' },
          timezone: { type: 'string', description: 'Timezone (e.g., America/New_York)' },
          description: { type: 'string', description: 'Description of the organization' },
          address: { type: 'string', description: 'Street address' },
          city: { type: 'string', description: 'City' },
          state: { type: 'string', description: 'State or province' },
          country: { type: 'string', description: 'Country' },
          postalCode: { type: 'string', description: 'Postal/ZIP code' },
          phone: { type: 'string', description: 'Phone number' },
          email: { type: 'string', description: 'Contact email address' },
          website: { type: 'string', description: 'Website URL' },
          logoUrl: { type: 'string', description: 'URL of the organization logo' },
        },
        required: ['name', 'billingEmail'],
      },
      handler: async (params: any, context: AgentContext) => {
        try {
          const result = await orgService.createOrganization(params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'organizations_update',
      description: 'Update an existing organization by its ID. Can update name, billing email, domain, address, and other details.',
      category: ToolCategory.ORGANIZATIONS,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'ID of the organization to update' },
          name: { type: 'string', description: 'Updated name' },
          billingEmail: { type: 'string', description: 'Updated billing email' },
          slug: { type: 'string', description: 'Updated slug' },
          domain: { type: 'string', description: 'Updated domain' },
          timezone: { type: 'string', description: 'Updated timezone' },
          description: { type: 'string', description: 'Updated description' },
          address: { type: 'string', description: 'Updated address' },
          city: { type: 'string', description: 'Updated city' },
          state: { type: 'string', description: 'Updated state' },
          country: { type: 'string', description: 'Updated country' },
          postalCode: { type: 'string', description: 'Updated postal code' },
          phone: { type: 'string', description: 'Updated phone number' },
          email: { type: 'string', description: 'Updated contact email' },
          website: { type: 'string', description: 'Updated website URL' },
          logoUrl: { type: 'string', description: 'Updated logo URL' },
        },
        required: ['id'],
      },
      handler: async (params: any, context: AgentContext) => {
        try {
          const result = await orgService.updateOrganization(params.id, params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'organizations_update_settings',
      description: 'Update organization-level settings by merging new settings with existing ones.',
      category: ToolCategory.ORGANIZATIONS,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'ID of the organization' },
          settings: { type: 'object', description: 'Settings key-value pairs to merge with existing settings' },
        },
        required: ['id', 'settings'],
      },
      handler: async (params: any, context: AgentContext) => {
        try {
          const result = await orgService.updateSettings(params.id, { settings: params.settings });
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'organizations_delete',
      description: 'Soft-delete an organization by its ID. The organization can be restored later. Requires confirmation.',
      category: ToolCategory.ORGANIZATIONS,
      requiresConfirmation: true,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'ID of the organization to delete' },
        },
        required: ['id'],
      },
      handler: async (params: any, context: AgentContext) => {
        try {
          const result = await orgService.removeOrganization(params.id);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'organizations_restore',
      description: 'Restore a previously soft-deleted organization by its ID.',
      category: ToolCategory.ORGANIZATIONS,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'ID of the organization to restore' },
        },
        required: ['id'],
      },
      handler: async (params: any, context: AgentContext) => {
        try {
          const result = await orgService.restoreOrganization(params.id);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'organizations_force_delete',
      description: 'Permanently delete an organization by its ID. This action cannot be undone. Requires confirmation.',
      category: ToolCategory.ORGANIZATIONS,
      requiresConfirmation: true,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'ID of the organization to permanently delete' },
        },
        required: ['id'],
      },
      handler: async (params: any, context: AgentContext) => {
        try {
          const result = await orgService.permanentlyDeleteOrganization(params.id);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
  ];
}
