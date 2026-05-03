import {
  ToolDefinition,
  ToolCategory,
  ToolResult,
} from '../interfaces/tool.interface';
import { RoleService } from 'src/resources/rbac/services/role.service';
import { ResourceService } from 'src/resources/rbac/services/resource.service';
import { ActionService } from 'src/resources/rbac/services/action.service';

export function createRbacTools(
  roleService: RoleService,
  resourceService: ResourceService,
  actionService: ActionService,
): ToolDefinition[] {
  return [
    {
      name: 'rbac_list_roles',
      description: 'List all roles with optional filtering and pagination',
      category: ToolCategory.RBAC,
      inputSchema: {
        type: 'object',
        properties: {
          search: {
            type: 'string',
            description: 'Search term to filter roles',
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
          const result = await roleService.findAll(params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'rbac_get_role',
      description: 'Get a specific role by ID with its permissions',
      category: ToolCategory.RBAC,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Role ID' },
        },
        required: ['id'],
      },
      handler: async (params): Promise<ToolResult> => {
        try {
          const result = await roleService.findRoleById(params.id);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'rbac_create_role',
      description: 'Create a new role with specified permissions',
      category: ToolCategory.RBAC,
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Role name' },
          description: { type: 'string', description: 'Role description' },
          permissions: {
            type: 'object',
            description:
              'Permissions object mapping resources to allowed actions',
          },
        },
        required: ['name', 'permissions'],
      },
      handler: async (params): Promise<ToolResult> => {
        try {
          const result = await roleService.create(params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'rbac_update_role',
      description: 'Update an existing role by ID',
      category: ToolCategory.RBAC,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Role ID' },
          name: { type: 'string', description: 'Updated role name' },
          description: {
            type: 'string',
            description: 'Updated role description',
          },
          permissions: {
            type: 'object',
            description: 'Updated permissions object',
          },
        },
        required: ['id'],
      },
      handler: async (params): Promise<ToolResult> => {
        try {
          const result = await roleService.updateRole(params.id, params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'rbac_delete_role',
      description: 'Delete a role by ID',
      category: ToolCategory.RBAC,
      requiresConfirmation: true,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Role ID to delete' },
        },
        required: ['id'],
      },
      handler: async (params): Promise<ToolResult> => {
        try {
          const result = await roleService.removeRole(params.id);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'rbac_get_role_actions',
      description:
        'Get the allowed actions for a specific role on a given resource',
      category: ToolCategory.RBAC,
      inputSchema: {
        type: 'object',
        properties: {
          roleName: { type: 'string', description: 'Name of the role' },
          resource: { type: 'string', description: 'Resource name' },
        },
        required: ['roleName', 'resource'],
      },
      handler: async (params): Promise<ToolResult> => {
        try {
          const result = await roleService.getActionsForResource(
            params.roleName,
            params.resource,
          );
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'rbac_list_resources',
      description: 'List all RBAC resources with optional filtering',
      category: ToolCategory.RBAC,
      inputSchema: {
        type: 'object',
        properties: {
          search: {
            type: 'string',
            description: 'Search term to filter resources',
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
          const result = await resourceService.findAll(params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'rbac_create_resource',
      description: 'Create a new RBAC resource',
      category: ToolCategory.RBAC,
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Resource name' },
          description: {
            type: 'string',
            description: 'Resource description',
          },
        },
        required: ['name'],
      },
      handler: async (params): Promise<ToolResult> => {
        try {
          const result = await resourceService.create(params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'rbac_list_actions',
      description: 'List all RBAC actions with optional filtering',
      category: ToolCategory.RBAC,
      inputSchema: {
        type: 'object',
        properties: {
          search: {
            type: 'string',
            description: 'Search term to filter actions',
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
          const result = await actionService.findAll(params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'rbac_create_action',
      description: 'Create a new RBAC action',
      category: ToolCategory.RBAC,
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Action name' },
          description: { type: 'string', description: 'Action description' },
        },
        required: ['name'],
      },
      handler: async (params): Promise<ToolResult> => {
        try {
          const result = await actionService.create(params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
  ];
}
