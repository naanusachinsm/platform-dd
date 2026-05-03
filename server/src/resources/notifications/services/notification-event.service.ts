import { Injectable, Logger } from '@nestjs/common';
import { NotificationsService } from '../notifications.service';
import { NotificationType } from 'src/common/enums/notification-type.enum';
import { WsGateway } from 'src/resources/ws/ws.gateway';
import { PushNotificationService } from './push-notification.service';

@Injectable()
export class NotificationEventService {
  private readonly logger = new Logger(NotificationEventService.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly wsGateway: WsGateway,
    private readonly pushNotificationService: PushNotificationService,
  ) {}

  /**
   * Create and send a notification to a specific user
   */
  async createAndSendNotification(params: {
    organizationId: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, any>;
    link?: string;
  }): Promise<void> {
    try {
      const notification = await this.notificationsService.createNotification({
        organizationId: params.organizationId,
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        data: params.data,
      });

      await this.wsGateway.emitNotification(params.userId, {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        createdAt: notification.createdAt,
        readAt: notification.readAt,
      });

      await this.pushNotificationService.sendPushNotification(
        params.userId,
        notification.title,
        notification.message,
        {
          id: notification.id,
          type: notification.type,
          link: params.link,
          ...notification.data,
        },
      );

      this.logger.log(`Notification created and sent: ${notification.id}`);
    } catch (error) {
      this.logger.error('Failed to create notification:', error);
    }
  }
}
