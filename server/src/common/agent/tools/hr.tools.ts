import { ToolDefinition, ToolCategory, AgentContext } from '../interfaces/tool.interface';
import { HrService } from 'src/resources/hr/hr.service';

export function createHrTools(hrService: HrService): ToolDefinition[] {
  return [
    // ─── Departments ──────────────────────────────────────────
    {
      name: 'hr_list_departments',
      description: 'List all HR departments with optional filtering by status, search term, and pagination.',
      category: ToolCategory.HR,
      inputSchema: {
        type: 'object',
        properties: {
          search: { type: 'string', description: 'Search term to filter departments by name' },
          status: { type: 'string', description: 'Filter by department status', enum: ['ACTIVE', 'INACTIVE'] },
          page: { type: 'integer', description: 'Page number for pagination', minimum: 1, default: 1 },
          limit: { type: 'integer', description: 'Number of items per page', minimum: 1, maximum: 100, default: 10 },
        },
      },
      handler: async (params: any, context: AgentContext) => {
        try {
          const result = await hrService.findAllDepartments(params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'hr_create_department',
      description: 'Create a new HR department with a name and optional description, head user, parent department, and status.',
      category: ToolCategory.HR,
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Name of the department' },
          description: { type: 'string', description: 'Description of the department' },
          headUserId: { type: 'string', description: 'User ID of the department head' },
          parentDepartmentId: { type: 'string', description: 'ID of the parent department for hierarchy' },
          status: { type: 'string', description: 'Status of the department', enum: ['ACTIVE', 'INACTIVE'] },
        },
        required: ['name'],
      },
      handler: async (params: any, context: AgentContext) => {
        try {
          const result = await hrService.createDepartment(params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'hr_get_department',
      description: 'Get details of a specific HR department by its ID.',
      category: ToolCategory.HR,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'ID of the department to retrieve' },
        },
        required: ['id'],
      },
      handler: async (params: any, context: AgentContext) => {
        try {
          const result = await hrService.findDepartmentById(params.id);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'hr_update_department',
      description: 'Update an existing HR department by its ID. Can update name, description, head user, parent department, and status.',
      category: ToolCategory.HR,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'ID of the department to update' },
          name: { type: 'string', description: 'New name of the department' },
          description: { type: 'string', description: 'New description of the department' },
          headUserId: { type: 'string', description: 'New head user ID' },
          parentDepartmentId: { type: 'string', description: 'New parent department ID' },
          status: { type: 'string', description: 'New status', enum: ['ACTIVE', 'INACTIVE'] },
        },
        required: ['id'],
      },
      handler: async (params: any, context: AgentContext) => {
        try {
          const result = await hrService.updateDepartment(params.id, params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'hr_delete_department',
      description: 'Delete an HR department by its ID. This is a destructive action that requires confirmation.',
      category: ToolCategory.HR,
      requiresConfirmation: true,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'ID of the department to delete' },
        },
        required: ['id'],
      },
      handler: async (params: any, context: AgentContext) => {
        try {
          const result = await hrService.deleteDepartment(params.id);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },

    // ─── Designations ──────────────────────────────────────────
    {
      name: 'hr_list_designations',
      description: 'List all HR designations with optional filtering by status, department, search term, and pagination.',
      category: ToolCategory.HR,
      inputSchema: {
        type: 'object',
        properties: {
          search: { type: 'string', description: 'Search term to filter designations by name' },
          status: { type: 'string', description: 'Filter by designation status', enum: ['ACTIVE', 'INACTIVE'] },
          departmentId: { type: 'string', description: 'Filter by department ID' },
          page: { type: 'integer', description: 'Page number for pagination', minimum: 1, default: 1 },
          limit: { type: 'integer', description: 'Number of items per page', minimum: 1, maximum: 100, default: 10 },
        },
      },
      handler: async (params: any, context: AgentContext) => {
        try {
          const result = await hrService.findAllDesignations(params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'hr_create_designation',
      description: 'Create a new HR designation with a name and optional department, description, level, and status.',
      category: ToolCategory.HR,
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Name of the designation' },
          departmentId: { type: 'string', description: 'ID of the department this designation belongs to' },
          description: { type: 'string', description: 'Description of the designation' },
          level: { type: 'integer', description: 'Level/rank of the designation' },
          status: { type: 'string', description: 'Status of the designation', enum: ['ACTIVE', 'INACTIVE'] },
        },
        required: ['name'],
      },
      handler: async (params: any, context: AgentContext) => {
        try {
          const result = await hrService.createDesignation(params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'hr_update_designation',
      description: 'Update an existing HR designation by its ID.',
      category: ToolCategory.HR,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'ID of the designation to update' },
          name: { type: 'string', description: 'New name of the designation' },
          departmentId: { type: 'string', description: 'New department ID' },
          description: { type: 'string', description: 'New description' },
          level: { type: 'integer', description: 'New level/rank' },
          status: { type: 'string', description: 'New status', enum: ['ACTIVE', 'INACTIVE'] },
        },
        required: ['id'],
      },
      handler: async (params: any, context: AgentContext) => {
        try {
          const result = await hrService.updateDesignation(params.id, params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'hr_delete_designation',
      description: 'Delete an HR designation by its ID. This is a destructive action that requires confirmation.',
      category: ToolCategory.HR,
      requiresConfirmation: true,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'ID of the designation to delete' },
        },
        required: ['id'],
      },
      handler: async (params: any, context: AgentContext) => {
        try {
          const result = await hrService.deleteDesignation(params.id);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },

    // ─── Leave Types ──────────────────────────────────────────
    {
      name: 'hr_list_leave_types',
      description: 'List all leave types with optional filtering by status, search term, and pagination.',
      category: ToolCategory.HR,
      inputSchema: {
        type: 'object',
        properties: {
          search: { type: 'string', description: 'Search term to filter leave types by name' },
          status: { type: 'string', description: 'Filter by leave type status', enum: ['ACTIVE', 'INACTIVE'] },
          page: { type: 'integer', description: 'Page number for pagination', minimum: 1, default: 1 },
          limit: { type: 'integer', description: 'Number of items per page', minimum: 1, maximum: 100, default: 10 },
        },
      },
      handler: async (params: any, context: AgentContext) => {
        try {
          const result = await hrService.findAllLeaveTypes(params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'hr_create_leave_type',
      description: 'Create a new leave type with a name and configuration options.',
      category: ToolCategory.HR,
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Name of the leave type' },
          description: { type: 'string', description: 'Description of the leave type' },
          defaultDays: { type: 'number', description: 'Default number of days allocated per year' },
          isPaid: { type: 'boolean', description: 'Whether this is a paid leave type' },
          isCarryForward: { type: 'boolean', description: 'Whether unused days carry forward to next year' },
          maxCarryForwardDays: { type: 'number', description: 'Maximum days that can be carried forward' },
          status: { type: 'string', description: 'Status of the leave type', enum: ['ACTIVE', 'INACTIVE'] },
        },
        required: ['name'],
      },
      handler: async (params: any, context: AgentContext) => {
        try {
          const result = await hrService.createLeaveType(params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'hr_update_leave_type',
      description: 'Update an existing leave type by its ID.',
      category: ToolCategory.HR,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'ID of the leave type to update' },
          name: { type: 'string', description: 'New name of the leave type' },
          description: { type: 'string', description: 'New description' },
          defaultDays: { type: 'number', description: 'New default number of days' },
          isPaid: { type: 'boolean', description: 'Whether this is a paid leave type' },
          isCarryForward: { type: 'boolean', description: 'Whether unused days carry forward' },
          maxCarryForwardDays: { type: 'number', description: 'New max carry forward days' },
          status: { type: 'string', description: 'New status', enum: ['ACTIVE', 'INACTIVE'] },
        },
        required: ['id'],
      },
      handler: async (params: any, context: AgentContext) => {
        try {
          const result = await hrService.updateLeaveType(params.id, params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },

    // ─── Leave Requests ──────────────────────────────────────────
    {
      name: 'hr_list_leave_requests',
      description: 'List leave requests with optional filtering by status, leave type, user, and pagination. Non-admin users only see their own requests.',
      category: ToolCategory.HR,
      inputSchema: {
        type: 'object',
        properties: {
          search: { type: 'string', description: 'Search term to filter leave requests' },
          status: { type: 'string', description: 'Filter by request status', enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'] },
          leaveTypeId: { type: 'string', description: 'Filter by leave type ID' },
          userId: { type: 'string', description: 'Filter by user ID (admin only)' },
          page: { type: 'integer', description: 'Page number for pagination', minimum: 1, default: 1 },
          limit: { type: 'integer', description: 'Number of items per page', minimum: 1, maximum: 100, default: 10 },
        },
      },
      handler: async (params: any, context: AgentContext) => {
        try {
          const result = await hrService.findAllLeaveRequests(params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'hr_create_leave_request',
      description: 'Create a new leave request for the current user.',
      category: ToolCategory.HR,
      inputSchema: {
        type: 'object',
        properties: {
          leaveTypeId: { type: 'string', description: 'ID of the leave type' },
          startDate: { type: 'string', description: 'Start date of the leave (YYYY-MM-DD)' },
          endDate: { type: 'string', description: 'End date of the leave (YYYY-MM-DD)' },
          daysCount: { type: 'number', description: 'Number of leave days requested' },
          reason: { type: 'string', description: 'Reason for the leave request' },
        },
        required: ['leaveTypeId', 'startDate', 'endDate', 'daysCount'],
      },
      handler: async (params: any, context: AgentContext) => {
        try {
          const result = await hrService.createLeaveRequest(params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'hr_update_leave_request',
      description: 'Update a leave request by its ID. Admins can approve/reject; users can only cancel their own requests.',
      category: ToolCategory.HR,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'ID of the leave request to update' },
          status: { type: 'string', description: 'New status', enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'] },
          reason: { type: 'string', description: 'Updated reason' },
          startDate: { type: 'string', description: 'Updated start date (YYYY-MM-DD)' },
          endDate: { type: 'string', description: 'Updated end date (YYYY-MM-DD)' },
          daysCount: { type: 'number', description: 'Updated number of leave days' },
        },
        required: ['id'],
      },
      handler: async (params: any, context: AgentContext) => {
        try {
          const result = await hrService.updateLeaveRequest(params.id, params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'hr_delete_leave_request',
      description: 'Delete a leave request by its ID. Users can only delete their own requests. Requires confirmation.',
      category: ToolCategory.HR,
      requiresConfirmation: true,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'ID of the leave request to delete' },
        },
        required: ['id'],
      },
      handler: async (params: any, context: AgentContext) => {
        try {
          const result = await hrService.deleteLeaveRequest(params.id);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },

    // ─── Leave Balances ──────────────────────────────────────────
    {
      name: 'hr_get_leave_balances',
      description: 'Get leave balances with optional filtering by user, leave type, and year.',
      category: ToolCategory.HR,
      inputSchema: {
        type: 'object',
        properties: {
          userId: { type: 'string', description: 'Filter by user ID' },
          leaveTypeId: { type: 'string', description: 'Filter by leave type ID' },
          year: { type: 'integer', description: 'Filter by year' },
          page: { type: 'integer', description: 'Page number for pagination', minimum: 1, default: 1 },
          limit: { type: 'integer', description: 'Number of items per page', minimum: 1, maximum: 100, default: 10 },
        },
      },
      handler: async (params: any, context: AgentContext) => {
        try {
          const result = await hrService.findLeaveBalances(params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'hr_create_leave_balance',
      description: 'Create a leave balance record for a user, specifying the leave type, year, and day allocations.',
      category: ToolCategory.HR,
      inputSchema: {
        type: 'object',
        properties: {
          userId: { type: 'string', description: 'ID of the user' },
          leaveTypeId: { type: 'string', description: 'ID of the leave type' },
          year: { type: 'integer', description: 'Year for the leave balance' },
          totalDays: { type: 'number', description: 'Total allocated leave days' },
          usedDays: { type: 'number', description: 'Number of days already used' },
          remainingDays: { type: 'number', description: 'Number of remaining days' },
        },
        required: ['userId', 'leaveTypeId', 'year'],
      },
      handler: async (params: any, context: AgentContext) => {
        try {
          const result = await hrService.createLeaveBalance(params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },

    // ─── Attendance ──────────────────────────────────────────
    {
      name: 'hr_list_attendance',
      description: 'List attendance records with optional filtering by user, date range, and pagination.',
      category: ToolCategory.HR,
      inputSchema: {
        type: 'object',
        properties: {
          userId: { type: 'string', description: 'Filter by user ID' },
          startDate: { type: 'string', description: 'Filter start date (YYYY-MM-DD)' },
          endDate: { type: 'string', description: 'Filter end date (YYYY-MM-DD)' },
          status: { type: 'string', description: 'Filter by attendance status', enum: ['PRESENT', 'ABSENT', 'HALF_DAY', 'LATE', 'ON_LEAVE'] },
          page: { type: 'integer', description: 'Page number for pagination', minimum: 1, default: 1 },
          limit: { type: 'integer', description: 'Number of items per page', minimum: 1, maximum: 100, default: 10 },
        },
      },
      handler: async (params: any, context: AgentContext) => {
        try {
          const result = await hrService.findAllAttendance(params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'hr_create_attendance',
      description: 'Create an attendance record for a user on a specific date.',
      category: ToolCategory.HR,
      inputSchema: {
        type: 'object',
        properties: {
          userId: { type: 'string', description: 'ID of the user' },
          date: { type: 'string', description: 'Date of the attendance record (YYYY-MM-DD)' },
          clockIn: { type: 'string', description: 'Clock-in time (HH:mm or ISO timestamp)' },
          clockOut: { type: 'string', description: 'Clock-out time (HH:mm or ISO timestamp)' },
          totalHours: { type: 'number', description: 'Total hours worked' },
          status: { type: 'string', description: 'Attendance status', enum: ['PRESENT', 'ABSENT', 'HALF_DAY', 'LATE', 'ON_LEAVE'] },
          notes: { type: 'string', description: 'Additional notes' },
        },
        required: ['userId', 'date'],
      },
      handler: async (params: any, context: AgentContext) => {
        try {
          const result = await hrService.createAttendance(params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'hr_update_attendance',
      description: 'Update an existing attendance record by its ID.',
      category: ToolCategory.HR,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'ID of the attendance record to update' },
          clockIn: { type: 'string', description: 'Updated clock-in time' },
          clockOut: { type: 'string', description: 'Updated clock-out time' },
          totalHours: { type: 'number', description: 'Updated total hours worked' },
          status: { type: 'string', description: 'Updated status', enum: ['PRESENT', 'ABSENT', 'HALF_DAY', 'LATE', 'ON_LEAVE'] },
          notes: { type: 'string', description: 'Updated notes' },
        },
        required: ['id'],
      },
      handler: async (params: any, context: AgentContext) => {
        try {
          const result = await hrService.updateAttendance(params.id, params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },

    // ─── Payroll ──────────────────────────────────────────
    {
      name: 'hr_list_payroll',
      description: 'List payroll records with optional filtering by user, month, year, and pagination.',
      category: ToolCategory.HR,
      inputSchema: {
        type: 'object',
        properties: {
          userId: { type: 'string', description: 'Filter by user ID' },
          month: { type: 'integer', description: 'Filter by month (1-12)', minimum: 1, maximum: 12 },
          year: { type: 'integer', description: 'Filter by year' },
          status: { type: 'string', description: 'Filter by payroll status', enum: ['DRAFT', 'PROCESSED', 'PAID'] },
          page: { type: 'integer', description: 'Page number for pagination', minimum: 1, default: 1 },
          limit: { type: 'integer', description: 'Number of items per page', minimum: 1, maximum: 100, default: 10 },
        },
      },
      handler: async (params: any, context: AgentContext) => {
        try {
          const result = await hrService.findAllPayroll(params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'hr_create_payroll',
      description: 'Create a payroll record for a user for a specific month and year.',
      category: ToolCategory.HR,
      inputSchema: {
        type: 'object',
        properties: {
          userId: { type: 'string', description: 'ID of the user' },
          month: { type: 'integer', description: 'Payroll month (1-12)', minimum: 1, maximum: 12 },
          year: { type: 'integer', description: 'Payroll year' },
          basicSalary: { type: 'number', description: 'Basic salary amount' },
          allowances: { type: 'number', description: 'Total allowances' },
          deductions: { type: 'number', description: 'Total deductions' },
          grossSalary: { type: 'number', description: 'Gross salary (before deductions)' },
          netSalary: { type: 'number', description: 'Net salary (after deductions)' },
          status: { type: 'string', description: 'Payroll status', enum: ['DRAFT', 'PROCESSED', 'PAID'] },
        },
        required: ['userId', 'month', 'year', 'basicSalary'],
      },
      handler: async (params: any, context: AgentContext) => {
        try {
          const result = await hrService.createPayroll(params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'hr_update_payroll',
      description: 'Update an existing payroll record by its ID.',
      category: ToolCategory.HR,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'ID of the payroll record to update' },
          basicSalary: { type: 'number', description: 'Updated basic salary' },
          allowances: { type: 'number', description: 'Updated allowances' },
          deductions: { type: 'number', description: 'Updated deductions' },
          grossSalary: { type: 'number', description: 'Updated gross salary' },
          netSalary: { type: 'number', description: 'Updated net salary' },
          status: { type: 'string', description: 'Updated status', enum: ['DRAFT', 'PROCESSED', 'PAID'] },
        },
        required: ['id'],
      },
      handler: async (params: any, context: AgentContext) => {
        try {
          const result = await hrService.updatePayroll(params.id, params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },

    // ─── Announcements ──────────────────────────────────────────
    {
      name: 'hr_list_announcements',
      description: 'List HR announcements with optional filtering by type, priority, status, and pagination.',
      category: ToolCategory.HR,
      inputSchema: {
        type: 'object',
        properties: {
          search: { type: 'string', description: 'Search term to filter announcements by title or content' },
          type: { type: 'string', description: 'Filter by announcement type', enum: ['GENERAL', 'POLICY', 'EVENT', 'HOLIDAY', 'OTHER'] },
          priority: { type: 'string', description: 'Filter by priority', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
          status: { type: 'string', description: 'Filter by status', enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'] },
          page: { type: 'integer', description: 'Page number for pagination', minimum: 1, default: 1 },
          limit: { type: 'integer', description: 'Number of items per page', minimum: 1, maximum: 100, default: 10 },
        },
      },
      handler: async (params: any, context: AgentContext) => {
        try {
          const result = await hrService.findAllAnnouncements(params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'hr_create_announcement',
      description: 'Create a new HR announcement with title, content, and optional type, priority, status, and scheduling.',
      category: ToolCategory.HR,
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Title of the announcement' },
          content: { type: 'string', description: 'Content/body of the announcement' },
          type: { type: 'string', description: 'Type of announcement', enum: ['GENERAL', 'POLICY', 'EVENT', 'HOLIDAY', 'OTHER'] },
          priority: { type: 'string', description: 'Priority level', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
          status: { type: 'string', description: 'Publication status', enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'] },
          publishedAt: { type: 'string', description: 'Publish date/time (ISO 8601)' },
          expiresAt: { type: 'string', description: 'Expiry date/time (ISO 8601)' },
          isPinned: { type: 'boolean', description: 'Whether to pin the announcement' },
        },
        required: ['title', 'content'],
      },
      handler: async (params: any, context: AgentContext) => {
        try {
          const result = await hrService.createAnnouncement(params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'hr_update_announcement',
      description: 'Update an existing HR announcement by its ID.',
      category: ToolCategory.HR,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'ID of the announcement to update' },
          title: { type: 'string', description: 'Updated title' },
          content: { type: 'string', description: 'Updated content' },
          type: { type: 'string', description: 'Updated type', enum: ['GENERAL', 'POLICY', 'EVENT', 'HOLIDAY', 'OTHER'] },
          priority: { type: 'string', description: 'Updated priority', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
          status: { type: 'string', description: 'Updated status', enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'] },
          publishedAt: { type: 'string', description: 'Updated publish date/time (ISO 8601)' },
          expiresAt: { type: 'string', description: 'Updated expiry date/time (ISO 8601)' },
          isPinned: { type: 'boolean', description: 'Updated pin state' },
        },
        required: ['id'],
      },
      handler: async (params: any, context: AgentContext) => {
        try {
          const result = await hrService.updateAnnouncement(params.id, params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'hr_delete_announcement',
      description: 'Delete an HR announcement by its ID. This is a destructive action that requires confirmation.',
      category: ToolCategory.HR,
      requiresConfirmation: true,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'ID of the announcement to delete' },
        },
        required: ['id'],
      },
      handler: async (params: any, context: AgentContext) => {
        try {
          const result = await hrService.deleteAnnouncement(params.id);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },

    // ─── Documents ──────────────────────────────────────────
    {
      name: 'hr_list_documents',
      description: 'List HR documents with optional filtering by document type, status, and pagination. Non-admin users only see their own or public documents.',
      category: ToolCategory.HR,
      inputSchema: {
        type: 'object',
        properties: {
          search: { type: 'string', description: 'Search term to filter documents by title' },
          documentType: { type: 'string', description: 'Filter by document type' },
          status: { type: 'string', description: 'Filter by status', enum: ['ACTIVE', 'INACTIVE'] },
          userId: { type: 'string', description: 'Filter by user ID (admin only)' },
          page: { type: 'integer', description: 'Page number for pagination', minimum: 1, default: 1 },
          limit: { type: 'integer', description: 'Number of items per page', minimum: 1, maximum: 100, default: 10 },
        },
      },
      handler: async (params: any, context: AgentContext) => {
        try {
          const result = await hrService.findAllDocuments(params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'hr_create_document',
      description: 'Create an HR document record with a title and file URL.',
      category: ToolCategory.HR,
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Title of the document' },
          fileUrl: { type: 'string', description: 'URL of the uploaded file' },
          userId: { type: 'string', description: 'ID of the user this document belongs to' },
          documentType: { type: 'string', description: 'Type/category of the document' },
          fileName: { type: 'string', description: 'Original file name' },
          fileSize: { type: 'integer', description: 'File size in bytes' },
          isPublic: { type: 'boolean', description: 'Whether the document is publicly accessible' },
          status: { type: 'string', description: 'Document status', enum: ['ACTIVE', 'INACTIVE'] },
        },
        required: ['title', 'fileUrl'],
      },
      handler: async (params: any, context: AgentContext) => {
        try {
          const result = await hrService.createDocument(params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'hr_update_document',
      description: 'Update an existing HR document by its ID.',
      category: ToolCategory.HR,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'ID of the document to update' },
          title: { type: 'string', description: 'Updated title' },
          fileUrl: { type: 'string', description: 'Updated file URL' },
          documentType: { type: 'string', description: 'Updated document type' },
          fileName: { type: 'string', description: 'Updated file name' },
          fileSize: { type: 'integer', description: 'Updated file size in bytes' },
          isPublic: { type: 'boolean', description: 'Updated public visibility' },
          status: { type: 'string', description: 'Updated status', enum: ['ACTIVE', 'INACTIVE'] },
        },
        required: ['id'],
      },
      handler: async (params: any, context: AgentContext) => {
        try {
          const result = await hrService.updateDocument(params.id, params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'hr_delete_document',
      description: 'Delete an HR document by its ID. Only admins can delete documents. Requires confirmation.',
      category: ToolCategory.HR,
      requiresConfirmation: true,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'ID of the document to delete' },
        },
        required: ['id'],
      },
      handler: async (params: any, context: AgentContext) => {
        try {
          const result = await hrService.deleteDocument(params.id);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },

    // ─── Dashboard ──────────────────────────────────────────
    {
      name: 'hr_get_dashboard',
      description: 'Get HR dashboard statistics including total departments, users, pending leave requests, today\'s attendance, and active announcements.',
      category: ToolCategory.HR,
      inputSchema: {
        type: 'object',
        properties: {},
      },
      handler: async (params: any, context: AgentContext) => {
        try {
          const result = await hrService.getDashboardStats();
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
  ];
}
