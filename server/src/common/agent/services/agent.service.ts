import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { AiService } from 'src/common/ai/ai.service';
import { UserContextService } from 'src/common/services/user-context.service';
import { ToolRegistryService } from './tool-registry.service';
import { ConversationStoreService, ConversationMessage } from './conversation-store.service';
import { MemoryService } from './memory.service';
import {
  AgentContext,
  AgentLlmResponse,
  ToolCategory,
  ToolExecutionResult,
} from '../interfaces/tool.interface';
import { buildSystemPrompt, buildToolResultMessage } from '../prompts/agent-system.prompt';
import { getDomainGuidance } from '../prompts/domain-guidance.prompt';

const MAX_ITERATIONS = 10;
const MAX_TOOL_RESULT_TOKENS = 2000;
const MEMORY_EXTRACT_INTERVAL = 10;

export interface AgentChatRequest {
  message: string;
  conversationId?: string;
}

export interface AgentChatResponse {
  conversationId: string;
  response: string;
  suggestedActions?: Array<{ label: string; prompt: string }>;
  toolsExecuted?: Array<{
    name: string;
    success: boolean;
    durationMs: number;
  }>;
  confirmationRequired?: {
    tool: string;
    params: Record<string, any>;
    description: string;
  };
}

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);

  constructor(
    private readonly aiService: AiService,
    private readonly userContextService: UserContextService,
    private readonly toolRegistry: ToolRegistryService,
    private readonly conversationStore: ConversationStoreService,
    private readonly memoryService: MemoryService,
  ) {}

  async chat(request: AgentChatRequest): Promise<AgentChatResponse> {
    const user = this.userContextService.getCurrentUser();
    const conversationId = request.conversationId || uuidv4();

    const context: AgentContext = {
      userId: user?.sub || '',
      organizationId: user?.organizationId || '',
      role: user?.role || '',
      conversationId,
      userName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email || 'User',
      userEmail: user?.email || '',
      organizationName: user?.organization?.name || '',
    };

    this.logger.log(
      `[AGENT] Chat started: conv=${conversationId}, user=${context.userName}, msg="${request.message.substring(0, 80)}"`,
    );

    await this.conversationStore.addMessage(conversationId, {
      role: 'user',
      content: request.message,
      timestamp: new Date().toISOString(),
    });

    const [userMemories, orgMemories] = await Promise.all([
      this.memoryService.getUserMemories(context.userId),
      this.memoryService.getOrgMemories(context.organizationId),
    ]);

    const memorySection = this.memoryService.formatForPrompt(
      context.userName || 'User',
      userMemories,
      orgMemories,
    );

    const allToolsExecuted: Array<{
      name: string;
      success: boolean;
      durationMs: number;
    }> = [];
    const activeCategories = new Set<ToolCategory>();

    let iteration = 0;
    let finalResponse: AgentChatResponse | null = null;

    while (iteration < MAX_ITERATIONS && !finalResponse) {
      iteration++;
      this.logger.log(`[AGENT] Iteration ${iteration}/${MAX_ITERATIONS}`);

      const compactHistory = await this.conversationStore.getCompactHistory(conversationId);

      const domainGuidance = getDomainGuidance(Array.from(activeCategories));
      const toolSchemas = this.toolRegistry.getToolSchemasForPrompt(
        activeCategories.size > 0 ? Array.from(activeCategories) : undefined,
      );

      const systemPrompt = buildSystemPrompt({
        userName: context.userName || 'User',
        userEmail: context.userEmail || '',
        userRole: context.role,
        organizationName: context.organizationName || '',
        organizationId: context.organizationId,
        conversationId,
        memorySection: memorySection + domainGuidance,
        toolSchemas,
        destructiveToolNames: this.toolRegistry.getDestructiveToolNames(),
      });

      const messages = this.buildLlmMessages(compactHistory);

      try {
        const llmResponse = await this.aiService.chatJson<AgentLlmResponse>(
          {
            systemPrompt,
            messages,
            maxTokens: 4096,
          },
          context.organizationId,
        );

        if (llmResponse.type === 'response') {
          await this.conversationStore.addMessage(conversationId, {
            role: 'assistant',
            content: llmResponse.content || '',
            timestamp: new Date().toISOString(),
          });

          finalResponse = {
            conversationId,
            response: llmResponse.content || '',
            suggestedActions: llmResponse.suggestedActions,
            toolsExecuted: allToolsExecuted.length > 0 ? allToolsExecuted : undefined,
          };
        } else if (llmResponse.type === 'confirmation_required') {
          await this.conversationStore.addMessage(conversationId, {
            role: 'assistant',
            content: llmResponse.content || '',
            timestamp: new Date().toISOString(),
          });

          finalResponse = {
            conversationId,
            response: llmResponse.content || '',
            confirmationRequired: llmResponse.pendingAction,
            toolsExecuted: allToolsExecuted.length > 0 ? allToolsExecuted : undefined,
          };
        } else if (llmResponse.type === 'tool_calls' && llmResponse.calls?.length) {
          this.logger.log(
            `[AGENT] LLM requested ${llmResponse.calls.length} tool(s): ${llmResponse.calls.map((c) => c.tool).join(', ')}`,
          );

          for (const call of llmResponse.calls) {
            const tool = this.toolRegistry.getTool(call.tool);
            if (tool) activeCategories.add(tool.category);
          }

          const results = await this.toolRegistry.executeTools(
            llmResponse.calls,
            context,
          );

          for (const r of results) {
            allToolsExecuted.push({
              name: r.toolName,
              success: r.result.success,
              durationMs: r.durationMs,
            });
          }

          const truncatedResults = results.map((r) => ({
            callId: r.callId,
            toolName: r.toolName,
            success: r.result.success,
            data: r.result.success
              ? this.truncateToolResult(r.result.data)
              : undefined,
            error: r.result.error,
          }));

          const toolResultMessage = buildToolResultMessage(truncatedResults);

          await this.conversationStore.addMessage(conversationId, {
            role: 'tool_results',
            content: toolResultMessage,
            timestamp: new Date().toISOString(),
            toolCalls: llmResponse.calls,
            toolResults: truncatedResults,
          });
        } else {
          finalResponse = {
            conversationId,
            response:
              llmResponse.content ||
              'I encountered an unexpected response format. Could you rephrase your request?',
            toolsExecuted: allToolsExecuted.length > 0 ? allToolsExecuted : undefined,
          };
        }
      } catch (error) {
        this.logger.error(
          `[AGENT] LLM call failed at iteration ${iteration}: ${(error as Error).message}`,
        );
        finalResponse = {
          conversationId,
          response:
            'I encountered an error while processing your request. Please try again.',
          toolsExecuted: allToolsExecuted.length > 0 ? allToolsExecuted : undefined,
        };
      }
    }

    if (!finalResponse) {
      finalResponse = {
        conversationId,
        response:
          'I reached the maximum number of steps for this request. Here is what was completed so far.',
        toolsExecuted: allToolsExecuted,
      };
    }

    this.triggerMemoryExtraction(conversationId, context).catch(() => {});

    return finalResponse;
  }

  async confirmAction(
    conversationId: string,
    confirmed: boolean,
  ): Promise<AgentChatResponse> {
    const confirmMessage = confirmed
      ? 'Yes, proceed with the action.'
      : 'No, cancel the action.';

    return this.chat({ message: confirmMessage, conversationId });
  }

  async getHistory(conversationId: string) {
    return this.conversationStore.getHistory(conversationId);
  }

  async clearConversation(conversationId: string): Promise<void> {
    const user = this.userContextService.getCurrentUser();
    const context: AgentContext = {
      userId: user?.sub || '',
      organizationId: user?.organizationId || '',
      role: user?.role || '',
      conversationId,
    };

    await this.triggerMemoryExtraction(conversationId, context);
    await this.conversationStore.clearHistory(conversationId);
  }

  getAvailableTools() {
    const tools = this.toolRegistry.getAllTools();
    return tools.map((t) => ({
      name: t.name,
      description: t.description,
      category: t.category,
      requiresConfirmation: t.requiresConfirmation || false,
    }));
  }

  private buildLlmMessages(
    compactHistory: { summary: string | null; recentMessages: ConversationMessage[] },
  ): Array<{ role: 'user' | 'assistant'; content: string }> {
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    if (compactHistory.summary) {
      messages.push({
        role: 'assistant',
        content: `[Previous conversation summary: ${compactHistory.summary}]`,
      });
    }

    for (const msg of compactHistory.recentMessages) {
      if (msg.role === 'user') {
        messages.push({ role: 'user', content: msg.content });
      } else if (msg.role === 'assistant') {
        messages.push({ role: 'assistant', content: msg.content });
      } else if (msg.role === 'tool_results') {
        messages.push({ role: 'assistant', content: msg.content });
      }
    }

    return messages;
  }

  private truncateToolResult(data: any): any {
    if (!data) return data;

    const json = JSON.stringify(data);
    const estimatedTokens = json.length / 4;

    if (estimatedTokens <= MAX_TOOL_RESULT_TOKENS) return data;

    if (data?.data && Array.isArray(data.data)) {
      return {
        data: data.data.slice(0, 10),
        totalItems: data.totalItems || data.data.length,
        showing: `10 of ${data.totalItems || data.data.length}`,
        note: 'Truncated. Ask for specific items or apply filters to narrow results.',
      };
    }

    const truncated = json.substring(0, MAX_TOOL_RESULT_TOKENS * 4);
    try {
      return JSON.parse(truncated + '"}');
    } catch {
      return { note: 'Result truncated due to size', preview: truncated.substring(0, 500) };
    }
  }

  private async triggerMemoryExtraction(
    conversationId: string,
    context: AgentContext,
  ): Promise<void> {
    try {
      const messageCount =
        await this.conversationStore.getMessageCount(conversationId);

      if (messageCount < 4) return;

      if (messageCount % MEMORY_EXTRACT_INTERVAL === 0 || messageCount >= 4) {
        const history =
          await this.conversationStore.getHistory(conversationId);

        await this.memoryService.extractMemories(
          history.messages,
          context.userId,
          context.organizationId,
          conversationId,
        );
      }
    } catch (error) {
      this.logger.warn(
        `Memory extraction failed: ${(error as Error).message}`,
      );
    }
  }
}
