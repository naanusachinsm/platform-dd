import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailQueue } from '../queues/email.queue';
import { FileProcessingQueue } from '../queues/file-processing.queue';
import { NotificationQueue } from '../queues/notification.queue';
import { CleanupQueue } from '../queues/cleanup.queue';
import { DeadLetterQueue } from '../queues/dead-letter.queue';
import { SubscriptionQueue } from '../queues/subscription.queue';
import { QueueRegistryService } from './queue-registry.service';

@Injectable()
export class QueueHealthService {
  private readonly logger = new Logger(QueueHealthService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly emailQueue: EmailQueue,
    private readonly fileProcessingQueue: FileProcessingQueue,
    private readonly notificationQueue: NotificationQueue,
    private readonly cleanupQueue: CleanupQueue,
    private readonly deadLetterQueue: DeadLetterQueue,
    private readonly subscriptionQueue: SubscriptionQueue,
  ) {}

  async checkRedisConnection(): Promise<{
    status: 'healthy' | 'unhealthy';
    message: string;
    latency?: number;
  }> {
    try {
      const startTime = Date.now();
      await this.emailQueue.getMetrics();
      const latency = Date.now() - startTime;

      return {
        status: 'healthy',
        message: 'Redis connection is healthy',
        latency,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Redis connection failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  async getQueueMetrics() {
    const queues = QueueRegistryService.getAllQueuesForHealth({
      emailQueue: this.emailQueue,
      fileProcessingQueue: this.fileProcessingQueue,
      notificationQueue: this.notificationQueue,
      cleanupQueue: this.cleanupQueue,
      deadLetterQueue: this.deadLetterQueue,
      subscriptionQueue: this.subscriptionQueue,
    });

    const metrics = await Promise.all(
      queues.map(async ({ name, queue }) => {
        try {
          const queueMetrics = await queue.getMetrics();
          return {
            queue: name,
            ...queueMetrics.counts,
            status: 'healthy',
          };
        } catch (error) {
          return {
            queue: name,
            status: 'error',
            error: error instanceof Error ? error.message : String(error),
          };
        }
      }),
    );

    return metrics;
  }

  async getWorkerHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    redis: any;
    queues: any[];
    timestamp: string;
  }> {
    const redisHealth = await this.checkRedisConnection();
    const queueMetrics = await this.getQueueMetrics();

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (redisHealth.status === 'unhealthy') {
      status = 'unhealthy';
    } else {
      const hasErrors = queueMetrics.some((m) => m.status === 'error');
      if (hasErrors) {
        status = 'degraded';
      }
    }

    return {
      status,
      redis: redisHealth,
      queues: queueMetrics,
      timestamp: new Date().toISOString(),
    };
  }

  async getWorkerStatus() {
    const health = await this.getWorkerHealth();
    const totalJobs = health.queues.reduce(
      (sum, q: any) =>
        sum +
        (q.waiting || 0) +
        (q.active || 0) +
        (q.completed || 0) +
        (q.failed || 0),
      0,
    );

    return {
      overall: health.status,
      redis: health.redis.status,
      totalQueues: health.queues.length,
      totalJobs,
      timestamp: health.timestamp,
    };
  }
}
