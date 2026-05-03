import { Injectable, OnModuleInit } from '@nestjs/common';
import { ExpressAdapter } from '@bull-board/express';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ConfigService } from '@nestjs/config';
import basicAuth from 'express-basic-auth';
import { EmailQueue } from '../queues/email.queue';
import { FileProcessingQueue } from '../queues/file-processing.queue';
import { NotificationQueue } from '../queues/notification.queue';
import { CleanupQueue } from '../queues/cleanup.queue';
import { DeadLetterQueue } from '../queues/dead-letter.queue';
import { SubscriptionQueue } from '../queues/subscription.queue';
import { AiQueue } from '../queues/ai.queue';

@Injectable()
export class BullBoardService implements OnModuleInit {
  private serverAdapter: ExpressAdapter;

  constructor(
    private readonly emailQueue: EmailQueue,
    private readonly fileProcessingQueue: FileProcessingQueue,
    private readonly notificationQueue: NotificationQueue,
    private readonly cleanupQueue: CleanupQueue,
    private readonly deadLetterQueue: DeadLetterQueue,
    private readonly subscriptionQueue: SubscriptionQueue,
    private readonly aiQueue: AiQueue,
    private readonly configService: ConfigService,
  ) {
    this.serverAdapter = new ExpressAdapter();
    this.serverAdapter.setBasePath('/admin/queues');
  }

  onModuleInit() {
    const queues = [
      new BullMQAdapter(this.emailQueue['queue']),
      new BullMQAdapter(this.fileProcessingQueue['queue']),
      new BullMQAdapter(this.notificationQueue['queue']),
      new BullMQAdapter(this.cleanupQueue['queue']),
      new BullMQAdapter(this.deadLetterQueue['queue']),
      new BullMQAdapter(this.subscriptionQueue['queue']),
      new BullMQAdapter(this.aiQueue['queue']),
    ];

    createBullBoard({
      queues,
      serverAdapter: this.serverAdapter,
    });
  }

  getAuthMiddleware() {
    const username = this.configService.get('BULL_BOARD_USERNAME') || 'admin';
    const password = this.configService.get('BULL_BOARD_PASSWORD') || 'admin';

    return basicAuth({
      users: { [username]: password },
      challenge: true,
      realm: 'Bull Board Dashboard',
    });
  }

  getRouter() {
    const router = this.serverAdapter.getRouter();
    router.use(this.getAuthMiddleware());
    return router;
  }
}
