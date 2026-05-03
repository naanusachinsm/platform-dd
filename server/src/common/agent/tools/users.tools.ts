import { ToolDefinition, ToolCategory, AgentContext } from '../interfaces/tool.interface';
import { UsersService } from 'src/resources/users/users.service';

export function createUsersTools(usersService: UsersService): ToolDefinition[] {
  return [
    {
      name: 'users_list',
      description: 'List all users with optional filtering by search term, status, role, and pagination.',
      category: ToolCategory.USERS,
      inputSchema: {
        type: 'object',
        properties: {
          search: { type: 'string', description: 'Search term to filter users by email, first name, or last name' },
          status: { type: 'string', description: 'Filter by user status', enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'] },
          role: { type: 'string', description: 'Filter by user role', enum: ['ADMIN', 'USER'] },
          page: { type: 'integer', description: 'Page number for pagination', minimum: 1, default: 1 },
          limit: { type: 'integer', description: 'Number of items per page', minimum: 1, maximum: 100, default: 10 },
        },
      },
      handler: async (params: any, context: AgentContext) => {
        try {
          const result = await usersService.findAll(params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'users_get',
      description: 'Get details of a specific user by their ID.',
      category: ToolCategory.USERS,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'ID of the user to retrieve' },
        },
        required: ['id'],
      },
      handler: async (params: any, context: AgentContext) => {
        try {
          const result = await usersService.findUserById(params.id);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'users_get_by_email',
      description: 'Find a user by their email address.',
      category: ToolCategory.USERS,
      inputSchema: {
        type: 'object',
        properties: {
          email: { type: 'string', description: 'Email address of the user to find' },
        },
        required: ['email'],
      },
      handler: async (params: any, context: AgentContext) => {
        try {
          const result = await usersService.findByEmail(params.email);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'users_invite',
      description: 'Invite a new user to an organization by sending them an invitation email with credentials.',
      category: ToolCategory.USERS,
      inputSchema: {
        type: 'object',
        properties: {
          email: { type: 'string', description: 'Email address of the user to invite' },
          organizationId: { type: 'string', description: 'ID of the organization to invite the user to' },
        },
        required: ['email', 'organizationId'],
      },
      handler: async (params: any, context: AgentContext) => {
        try {
          const result = await usersService.inviteUser(params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'users_update',
      description: 'Update a user\'s profile information by their ID.',
      category: ToolCategory.USERS,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'ID of the user to update' },
          firstName: { type: 'string', description: 'Updated first name' },
          lastName: { type: 'string', description: 'Updated last name' },
          role: { type: 'string', description: 'Updated role', enum: ['ADMIN', 'USER'] },
          status: { type: 'string', description: 'Updated status', enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'] },
          avatarUrl: { type: 'string', description: 'Updated avatar URL' },
        },
        required: ['id'],
      },
      handler: async (params: any, context: AgentContext) => {
        try {
          const result = await usersService.updateUser(params.id, params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'users_delete',
      description: 'Soft-delete a user by their ID. The user can be restored later. Requires confirmation.',
      category: ToolCategory.USERS,
      requiresConfirmation: true,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'ID of the user to delete' },
        },
        required: ['id'],
      },
      handler: async (params: any, context: AgentContext) => {
        try {
          const result = await usersService.removeUser(params.id);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'users_restore',
      description: 'Restore a previously soft-deleted user by their ID.',
      category: ToolCategory.USERS,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'ID of the user to restore' },
        },
        required: ['id'],
      },
      handler: async (params: any, context: AgentContext) => {
        try {
          const result = await usersService.restoreUser(params.id);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'users_force_delete',
      description: 'Permanently delete a user by their ID. This action cannot be undone. Requires confirmation.',
      category: ToolCategory.USERS,
      requiresConfirmation: true,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'ID of the user to permanently delete' },
        },
        required: ['id'],
      },
      handler: async (params: any, context: AgentContext) => {
        try {
          const result = await usersService.permanentlyDeleteUser(params.id);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
  ];
}
