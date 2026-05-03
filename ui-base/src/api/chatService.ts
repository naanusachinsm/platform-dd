import { apiService } from "./apiService";
import type { BaseResponse, PaginatedData } from "./types";
import type {
  ChatRoom,
  ChatMessage,
  CreateChatRoomRequest,
  SendMessageRequest,
  AddChatMembersRequest,
  UpdateChatRoomRequest,
} from "./chatTypes";

class ChatService {
  private baseUrl = "/chats";

  async getChatRooms(params: {
    page?: number;
    limit?: number;
    searchTerm?: string;
  } = {}): Promise<BaseResponse<PaginatedData<ChatRoom>>> {
    return apiService.get(this.baseUrl, params as Record<string, string | number>);
  }

  async getChatRoom(chatRoomId: string): Promise<BaseResponse<ChatRoom>> {
    return apiService.get(`${this.baseUrl}/${chatRoomId}`);
  }

  async createChatRoom(data: CreateChatRoomRequest): Promise<BaseResponse<ChatRoom>> {
    return apiService.post(this.baseUrl, data);
  }

  async updateChatRoom(chatRoomId: string, data: UpdateChatRoomRequest): Promise<BaseResponse<ChatRoom>> {
    return apiService.put(`${this.baseUrl}/${chatRoomId}`, data);
  }

  async deleteChatRoom(chatRoomId: string): Promise<BaseResponse<void>> {
    return apiService.delete(`${this.baseUrl}/${chatRoomId}`);
  }

  async leaveChatRoom(chatRoomId: string): Promise<BaseResponse<void>> {
    return apiService.delete(`${this.baseUrl}/${chatRoomId}`);
  }

  async addMembers(chatRoomId: string, data: AddChatMembersRequest): Promise<BaseResponse<ChatRoom>> {
    return apiService.post(`${this.baseUrl}/${chatRoomId}/members`, data);
  }

  async removeMember(chatRoomId: string, userId: string): Promise<BaseResponse<void>> {
    return apiService.delete(`${this.baseUrl}/${chatRoomId}/members/${userId}`);
  }

  async getMessages(chatRoomId: string, params: {
    page?: number;
    limit?: number;
  } = {}): Promise<BaseResponse<PaginatedData<ChatMessage>>> {
    return apiService.get(`${this.baseUrl}/${chatRoomId}/messages`, params as Record<string, string | number>);
  }

  async sendMessage(chatRoomId: string, data: SendMessageRequest): Promise<BaseResponse<ChatMessage>> {
    return apiService.post(`${this.baseUrl}/${chatRoomId}/messages`, data);
  }

  async markAsRead(chatRoomId: string): Promise<BaseResponse<void>> {
    return apiService.put(`${this.baseUrl}/${chatRoomId}/read`);
  }

  async deleteMessage(messageId: string): Promise<BaseResponse<void>> {
    return apiService.delete(`${this.baseUrl}/messages/${messageId}`);
  }

  async getUnreadCounts(): Promise<BaseResponse<Record<string, number>>> {
    return apiService.get(`${this.baseUrl}/unread-counts`);
  }
}

export const chatService = new ChatService();
