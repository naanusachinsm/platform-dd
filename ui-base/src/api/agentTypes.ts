export interface AgentMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  toolsExecuted?: ToolExecutionSummary[];
  confirmationRequired?: ConfirmationRequest;
  suggestedActions?: SuggestedAction[];
}

export interface ToolExecutionSummary {
  name: string;
  success: boolean;
  durationMs: number;
}

export interface SuggestedAction {
  label: string;
  prompt: string;
}

export interface ConfirmationRequest {
  tool: string;
  params: Record<string, unknown>;
  description: string;
}

export interface AgentChatRequest {
  message: string;
  conversationId?: string;
}

export interface AgentChatResponse {
  conversationId: string;
  response: string;
  suggestedActions?: SuggestedAction[];
  toolsExecuted?: ToolExecutionSummary[];
  confirmationRequired?: ConfirmationRequest;
}

export interface ConversationHistory {
  conversationId: string;
  messages: Array<{
    role: string;
    content: string;
    timestamp: string;
    toolCalls?: unknown[];
    toolResults?: unknown[];
  }>;
  messageCount: number;
  createdAt: string;
  summary?: string;
}

export interface AgentTool {
  name: string;
  description: string;
  category: string;
  requiresConfirmation: boolean;
}

export interface AgentMemory {
  id: string;
  category: string;
  content: string;
  relevanceScore: number;
  lastAccessedAt: string;
  createdAt: string;
}
