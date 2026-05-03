import {
  ToolDefinition,
  ToolCategory,
  ToolResult,
} from '../interfaces/tool.interface';
import { NotificationsService } from 'src/resources/notifications/notifications.service';

export function createNotificationsTools(
  notificationsService: NotificationsService,
): ToolDefinition[] {
  return [
    {
      name: 'notifications_list',
      description:
        'List notifications for the current user with optional read status filter and pagination',
      category: ToolCategory.NOTIFICATIONS,
      inputSchema: {
        type: 'object',
        properties: {
          read: {
            type: 'boolean',
            description:
              'Filter by read status (true for read, false for unread)',
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
          const result =
            await notificationsService.getUserNotifications(params);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'notifications_unread_count',
      description: 'Get the count of unread notifications for the current user',
      category: ToolCategory.NOTIFICATIONS,
      inputSchema: {
        type: 'object',
        properties: {},
      },
      handler: async (): Promise<ToolResult> => {
        try {
          const result = await notificationsService.getUnreadCount();
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'notifications_mark_read',
      description: 'Mark a specific notification as read',
      category: ToolCategory.NOTIFICATIONS,
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Notification ID to mark as read' },
        },
        required: ['id'],
      },
      handler: async (params): Promise<ToolResult> => {
        try {
          const result = await notificationsService.markAsRead(params.id);
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'notifications_mark_all_read',
      description: 'Mark all notifications as read for the current user',
      category: ToolCategory.NOTIFICATIONS,
      inputSchema: {
        type: 'object',
        properties: {},
      },
      handler: async (): Promise<ToolResult> => {
        try {
          const result = await notificationsService.markAllAsRead();
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
    {
      name: 'notifications_delete',
      description: 'Delete a specific notification',
      category: ToolCategory.NOTIFICATIONS,
      requiresConfirmation: true,
      inputSchema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Notification ID to delete',
          },
        },
        required: ['id'],
      },
      handler: async (params): Promise<ToolResult> => {
        try {
          const result = await notificationsService.deleteNotification(
            params.id,
          );
          return { success: true, data: result };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      },
    },
  ];
}
