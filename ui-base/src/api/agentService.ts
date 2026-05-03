import { apiService } from "./apiService";
import type {
  AgentChatResponse,
  ConversationHistory,
  AgentTool,
  AgentMemory,
} from "./agentTypes";
import type { BaseResponse } from "./types";

class AgentServiceClass {
  private baseUrl = "/agent";

  async chat(
    message: string,
    conversationId?: string
  ): Promise<BaseResponse<AgentChatResponse>> {
    return apiService.post(`${this.baseUrl}/chat`, {
      message,
      conversationId,
    });
  }

  async confirmAction(
    conversationId: string,
    confirmed: boolean
  ): Promise<BaseResponse<AgentChatResponse>> {
    return apiService.post(
      `${this.baseUrl}/conversations/${conversationId}/confirm`,
      { confirmed }
    );
  }

  async getHistory(
    conversationId: string
  ): Promise<BaseResponse<ConversationHistory>> {
    return apiService.get(
      `${this.baseUrl}/conversations/${conversationId}/history`
    );
  }

  async clearConversation(
    conversationId: string
  ): Promise<BaseResponse<void>> {
    return apiService.delete(
      `${this.baseUrl}/conversations/${conversationId}`
    );
  }

  async getAvailableTools(): Promise<BaseResponse<AgentTool[]>> {
    return apiService.get(`${this.baseUrl}/tools`);
  }

  async getMemories(
    category?: string
  ): Promise<BaseResponse<AgentMemory[]>> {
    const params: Record<string, string> = {};
    if (category) params.category = category;
    return apiService.get(`${this.baseUrl}/memories`, params);
  }

  async deleteMemory(memoryId: string): Promise<BaseResponse<void>> {
    return apiService.delete(`${this.baseUrl}/memories/${memoryId}`);
  }

  async getOrgMemories(): Promise<BaseResponse<AgentMemory[]>> {
    return apiService.get(`${this.baseUrl}/memories/org`);
  }
}

export const agentService = new AgentServiceClass();
