export enum ToolCategory {
  AUTH = 'auth',
  USERS = 'users',
  ORGANIZATIONS = 'organizations',
  EMPLOYEES = 'employees',
  RBAC = 'rbac',
  CRM = 'crm',
  FINANCE = 'finance',
  PROJECTS = 'projects',
  HR = 'hr',
  CHATS = 'chats',
  SUBSCRIPTIONS = 'subscriptions',
  ANALYTICS = 'analytics',
  AUDIT = 'audit',
  NOTIFICATIONS = 'notifications',
  ASSETS = 'assets',
}

export interface JsonSchemaProperty {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'integer';
  description?: string;
  enum?: string[];
  default?: any;
  items?: JsonSchemaProperty;
  properties?: Record<string, JsonSchemaProperty>;
  required?: string[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
}

export interface ToolInputSchema {
  type: 'object';
  properties: Record<string, JsonSchemaProperty>;
  required?: string[];
}

export interface AgentContext {
  userId: string;
  organizationId: string;
  role: string;
  conversationId: string;
  userName?: string;
  userEmail?: string;
  organizationName?: string;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  category: ToolCategory;
  inputSchema: ToolInputSchema;
  requiresConfirmation?: boolean;
  handler: (params: any, context: AgentContext) => Promise<ToolResult>;
}

export interface ToolCallRequest {
  id: string;
  tool: string;
  params: Record<string, any>;
}

export interface AgentLlmResponse {
  type: 'response' | 'tool_calls' | 'confirmation_required';
  content?: string;
  thinking?: string;
  calls?: ToolCallRequest[];
  suggestedActions?: SuggestedAction[];
  pendingAction?: PendingAction;
}

export interface SuggestedAction {
  label: string;
  prompt: string;
}

export interface PendingAction {
  tool: string;
  params: Record<string, any>;
  description: string;
}

export interface ToolExecutionResult {
  callId: string;
  toolName: string;
  result: ToolResult;
  durationMs: number;
}
