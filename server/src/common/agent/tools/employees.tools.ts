import { ToolDefinition, ToolCategory, AgentContext } from '../interfaces/tool.interface';
import { EmployeesService } from 'src/resources/employees/employees.service';

export function createEmployeesTools(employeesService: EmployeesService): ToolDefinition[] {
  return [
    {
      name: 'employees_list',
      description: 'List all platform employees with optional filtering by search term, status, role, and pagination. Only accessible by SUPERADMIN and SUPPORT.',
      category: ToolCategory.EMPLOYEES,
      inputSchema: {
        type: 'object',
        properties: {
          search: { type: 'string', description: 'Search term to filter employees by email, first name, or last name' },
          status: { type: 'string', description: 'Filter by employee status', enum: ['ACTIVE', 'INACTIVE'] },
          role: { type: 'string', description: 'Filter by employee role', enum: ['SUPERADMIN', 'SUPPORT'] },
          page: { type: 'integer', description: 'Page number for pagination', minimum: 1, default: 1 },
          limit: { type: 'integer', description: 'Number of items per page', minimum: 1, maximum: 100, default: 10 },
        },
      },
      handler: async (params: any, context: AgentContext) => {
        try {
          const result = await employeesService.findAll(params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'employees_get',
      description: 'Get details of a specific platform employee by their ID.',
      category: ToolCategory.EMPLOYEES,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'ID of the employee to retrieve' },
        },
        required: ['id'],
      },
      handler: async (params: any, context: AgentContext) => {
        try {
          const result = await employeesService.findEmployeeById(params.id);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'employees_create',
      description: 'Create a new platform employee with email, name, role, and optional password. Only SUPERADMIN can perform this action.',
      category: ToolCategory.EMPLOYEES,
      inputSchema: {
        type: 'object',
        properties: {
          email: { type: 'string', description: 'Email address of the employee' },
          firstName: { type: 'string', description: 'First name of the employee' },
          lastName: { type: 'string', description: 'Last name of the employee' },
          role: { type: 'string', description: 'Role of the employee', enum: ['SUPERADMIN', 'SUPPORT'] },
          password: { type: 'string', description: 'Password (auto-generated if not provided)' },
        },
        required: ['email', 'firstName', 'lastName', 'role'],
      },
      handler: async (params: any, context: AgentContext) => {
        try {
          const result = await employeesService.createEmployee(params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'employees_update',
      description: 'Update an existing platform employee by their ID. Only SUPERADMIN can perform this action.',
      category: ToolCategory.EMPLOYEES,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'ID of the employee to update' },
          firstName: { type: 'string', description: 'Updated first name' },
          lastName: { type: 'string', description: 'Updated last name' },
          role: { type: 'string', description: 'Updated role', enum: ['SUPERADMIN', 'SUPPORT'] },
          status: { type: 'string', description: 'Updated status', enum: ['ACTIVE', 'INACTIVE'] },
        },
        required: ['id'],
      },
      handler: async (params: any, context: AgentContext) => {
        try {
          const result = await employeesService.updateEmployee(params.id, params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'employees_delete',
      description: 'Soft-delete a platform employee by their ID. Only SUPERADMIN can perform this action. Requires confirmation.',
      category: ToolCategory.EMPLOYEES,
      requiresConfirmation: true,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'ID of the employee to delete' },
        },
        required: ['id'],
      },
      handler: async (params: any, context: AgentContext) => {
        try {
          const result = await employeesService.removeEmployee(params.id);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'employees_restore',
      description: 'Restore a previously soft-deleted platform employee by their ID. Only SUPERADMIN can perform this action.',
      category: ToolCategory.EMPLOYEES,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'ID of the employee to restore' },
        },
        required: ['id'],
      },
      handler: async (params: any, context: AgentContext) => {
        try {
          const result = await employeesService.restoreEmployee(params.id);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'employees_force_delete',
      description: 'Permanently delete a platform employee by their ID. This action cannot be undone. Only SUPERADMIN can perform this action. Requires confirmation.',
      category: ToolCategory.EMPLOYEES,
      requiresConfirmation: true,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'ID of the employee to permanently delete' },
        },
        required: ['id'],
      },
      handler: async (params: any, context: AgentContext) => {
        try {
          const result = await employeesService.permanentlyDeleteEmployee(params.id);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
  ];
}
