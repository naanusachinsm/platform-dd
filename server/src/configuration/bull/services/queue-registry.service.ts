import { Injectable } from '@nestjs/common';
import { BaseQueueService } from './base-queue.service';
import { QueueName } from '../enums/queue.enum';
import { EmailQueue } from '../queues/email.queue';
import { FileProcessingQueue } from '../queues/file-processing.queue';
import { NotificationQueue } from '../queues/notification.queue';
import { CleanupQueue } from '../queues/cleanup.queue';
import { DeadLetterQueue } from '../queues/dead-letter.queue';
import { SubscriptionQueue } from '../queues/subscription.queue';

@Injectable()
export class QueueRegistryService {
  static getAllQueueNames(): QueueName[] {
    return [
      QueueName.EMAIL,
      QueueName.FILE_PROCESSING,
      QueueName.NOTIFICATION,
      QueueName.CLEANUP,
      QueueName.DEAD_LETTER,
      QueueName.SUBSCRIPTION,
    ];
  }

  static mapQueuesToInstances(queues: {
    emailQueue: EmailQueue;
    fileProcessingQueue: FileProcessingQueue;
    notificationQueue: NotificationQueue;
    cleanupQueue: CleanupQueue;
    deadLetterQueue: DeadLetterQueue;
    subscriptionQueue: SubscriptionQueue;
  }): Map<string, BaseQueueService> {
    return new Map<string, BaseQueueService>([
      ['email', queues.emailQueue],
      ['file-processing', queues.fileProcessingQueue],
      ['notification', queues.notificationQueue],
      ['cleanup', queues.cleanupQueue],
      ['dead-letter', queues.deadLetterQueue],
      ['subscription', queues.subscriptionQueue],
    ]);
  }

  static getAllQueuesForHealth(queues: {
    emailQueue: EmailQueue;
    fileProcessingQueue: FileProcessingQueue;
    notificationQueue: NotificationQueue;
    cleanupQueue: CleanupQueue;
    deadLetterQueue: DeadLetterQueue;
    subscriptionQueue: SubscriptionQueue;
  }): Array<{ name: string; queue: BaseQueueService }> {
    return [
      { name: QueueName.EMAIL, queue: queues.emailQueue },
      { name: QueueName.FILE_PROCESSING, queue: queues.fileProcessingQueue },
      { name: QueueName.NOTIFICATION, queue: queues.notificationQueue },
      { name: QueueName.CLEANUP, queue: queues.cleanupQueue },
      { name: QueueName.DEAD_LETTER, queue: queues.deadLetterQueue },
      { name: QueueName.SUBSCRIPTION, queue: queues.subscriptionQueue },
    ];
  }
}
