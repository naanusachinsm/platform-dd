import {
  ToolDefinition,
  ToolCategory,
  ToolResult,
} from '../interfaces/tool.interface';
import { ChatRoomService } from 'src/resources/chats/services/chat-room.service';
import { ChatMessageService } from 'src/resources/chats/services/chat-message.service';

export function createChatsTools(
  chatRoomService: ChatRoomService,
  chatMessageService: ChatMessageService,
): ToolDefinition[] {
  return [
    {
      name: 'chats_list_rooms',
      description:
        'List chat rooms for the current user with optional search and pagination',
      category: ToolCategory.CHATS,
      inputSchema: {
        type: 'object',
        properties: {
          search: {
            type: 'string',
            description: 'Search term to filter chat rooms',
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
          const result = await chatRoomService.findAllForUser(params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'chats_get_room',
      description: 'Get details of a specific chat room by ID',
      category: ToolCategory.CHATS,
      inputSchema: {
        type: 'object',
        properties: {
          chatRoomId: { type: 'string', description: 'Chat room ID' },
        },
        required: ['chatRoomId'],
      },
      handler: async (params): Promise<ToolResult> => {
        try {
          const result = await chatRoomService.findOne(params.chatRoomId);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'chats_create_room',
      description: 'Create a new chat room (direct or group)',
      category: ToolCategory.CHATS,
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Chat room name (required for group chats)',
          },
          type: {
            type: 'string',
            description: 'Chat room type',
            enum: ['DIRECT', 'GROUP'],
          },
          memberIds: {
            type: 'array',
            description: 'Array of user IDs to add as members',
            items: { type: 'string' },
          },
        },
        required: ['type', 'memberIds'],
      },
      handler: async (params): Promise<ToolResult> => {
        try {
          const result = await chatRoomService.create(params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'chats_update_room',
      description: 'Update a chat room (name, avatar)',
      category: ToolCategory.CHATS,
      inputSchema: {
        type: 'object',
        properties: {
          chatRoomId: { type: 'string', description: 'Chat room ID to update' },
          name: { type: 'string', description: 'Updated chat room name' },
          avatarUrl: {
            type: 'string',
            description: 'Updated avatar URL for the chat room',
          },
        },
        required: ['chatRoomId'],
      },
      handler: async (params): Promise<ToolResult> => {
        try {
          const result = await chatRoomService.update(
            params.chatRoomId,
            params,
          );
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'chats_leave_room',
      description: 'Leave a chat room',
      category: ToolCategory.CHATS,
      inputSchema: {
        type: 'object',
        properties: {
          chatRoomId: { type: 'string', description: 'Chat room ID to leave' },
        },
        required: ['chatRoomId'],
      },
      handler: async (params): Promise<ToolResult> => {
        try {
          const result = await chatRoomService.leaveRoom(params.chatRoomId);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'chats_add_members',
      description: 'Add members to a chat room',
      category: ToolCategory.CHATS,
      inputSchema: {
        type: 'object',
        properties: {
          chatRoomId: { type: 'string', description: 'Chat room ID' },
          userIds: {
            type: 'array',
            description: 'Array of user IDs to add',
            items: { type: 'string' },
          },
        },
        required: ['chatRoomId', 'userIds'],
      },
      handler: async (params): Promise<ToolResult> => {
        try {
          const result = await chatRoomService.addMembers(
            params.chatRoomId,
            params,
          );
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'chats_remove_member',
      description: 'Remove a member from a chat room',
      category: ToolCategory.CHATS,
      inputSchema: {
        type: 'object',
        properties: {
          chatRoomId: { type: 'string', description: 'Chat room ID' },
          userId: {
            type: 'string',
            description: 'User ID of the member to remove',
          },
        },
        required: ['chatRoomId', 'userId'],
      },
      handler: async (params): Promise<ToolResult> => {
        try {
          const result = await chatRoomService.removeMember(
            params.chatRoomId,
            params.userId,
          );
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'chats_list_messages',
      description: 'List messages in a chat room with pagination',
      category: ToolCategory.CHATS,
      inputSchema: {
        type: 'object',
        properties: {
          chatRoomId: {
            type: 'string',
            description: 'Chat room ID to list messages from',
          },
          page: { type: 'integer', description: 'Page number', default: 1 },
          limit: {
            type: 'integer',
            description: 'Items per page',
            default: 10,
          },
        },
        required: ['chatRoomId'],
      },
      handler: async (params): Promise<ToolResult> => {
        try {
          const result = await chatMessageService.findAll(
            params.chatRoomId,
            params,
          );
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'chats_send_message',
      description: 'Send a message in a chat room',
      category: ToolCategory.CHATS,
      inputSchema: {
        type: 'object',
        properties: {
          chatRoomId: {
            type: 'string',
            description: 'Chat room ID to send the message to',
          },
          content: {
            type: 'string',
            description: 'Message content',
          },
        },
        required: ['chatRoomId', 'content'],
      },
      handler: async (params): Promise<ToolResult> => {
        try {
          const result = await chatMessageService.create(
            params.chatRoomId,
            params,
          );
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'chats_mark_read',
      description: 'Mark all messages in a chat room as read',
      category: ToolCategory.CHATS,
      inputSchema: {
        type: 'object',
        properties: {
          chatRoomId: {
            type: 'string',
            description: 'Chat room ID to mark as read',
          },
        },
        required: ['chatRoomId'],
      },
      handler: async (params): Promise<ToolResult> => {
        try {
          const result = await chatRoomService.markAsRead(params.chatRoomId);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'chats_get_unread_counts',
      description:
        'Get unread message counts across all chat rooms for the current user',
      category: ToolCategory.CHATS,
      inputSchema: {
        type: 'object',
        properties: {},
      },
      handler: async (): Promise<ToolResult> => {
        try {
          const result = await chatRoomService.getUnreadCounts();
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'chats_delete_message',
      description: 'Delete a specific chat message',
      category: ToolCategory.CHATS,
      requiresConfirmation: true,
      inputSchema: {
        type: 'object',
        properties: {
          messageId: {
            type: 'string',
            description: 'Message ID to delete',
          },
        },
        required: ['messageId'],
      },
      handler: async (params): Promise<ToolResult> => {
        try {
          const result = await chatMessageService.delete(params.messageId);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
  ];
}
