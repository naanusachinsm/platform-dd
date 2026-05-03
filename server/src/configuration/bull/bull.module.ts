import { Module, Global, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { BullModule as NestBullModule } from '@nestjs/bullmq';
import { QueueName } from './enums/queue.enum';
import { BullConfig } from './config/bull.config';

// Queues
import { EmailQueue } from './queues/email.queue';
import { FileProcessingQueue } from './queues/file-processing.queue';
import { NotificationQueue } from './queues/notification.queue';
import { CleanupQueue } from './queues/cleanup.queue';
import { DeadLetterQueue } from './queues/dead-letter.queue';
import { SubscriptionQueue } from './queues/subscription.queue';
import { AiQueue } from './queues/ai.queue';

// Services & Controller (NO PROCESSORS - they run in separate worker process)
import { BullBoardService } from './services/bull-board.service';
import { QueueHealthService } from './services/queue-health.service';
import { BullController } from './bull.controller';
import { AuditLogsModule } from 'src/resources/audit-logs/audit-logs.module';

@Global()
@Module({
  imports: [
    ConfigModule,
    HttpModule,
    AuditLogsModule,
    NestBullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        return {
          connection: BullConfig.getConnectionConfig(configService),
        };
      },
      inject: [ConfigService],
    }),
    NestBullModule.registerQueue({ name: QueueName.EMAIL }),
    NestBullModule.registerQueue({ name: QueueName.FILE_PROCESSING }),
    NestBullModule.registerQueue({ name: QueueName.NOTIFICATION }),
    NestBullModule.registerQueue({ name: QueueName.CLEANUP }),
    NestBullModule.registerQueue({ name: QueueName.DEAD_LETTER }),
    NestBullModule.registerQueue({ name: QueueName.SUBSCRIPTION }),
    NestBullModule.registerQueue({ name: QueueName.AI_PROCESSING }),
  ],
  controllers: [BullController],
  providers: [
    EmailQueue,
    FileProcessingQueue,
    NotificationQueue,
    CleanupQueue,
    DeadLetterQueue,
    SubscriptionQueue,
    AiQueue,
    BullBoardService,
    QueueHealthService,
  ],
  exports: [
    EmailQueue,
    FileProcessingQueue,
    NotificationQueue,
    CleanupQueue,
    DeadLetterQueue,
    SubscriptionQueue,
    AiQueue,
    BullBoardService,
    QueueHealthService,
  ],
})
export class BullModule implements OnModuleInit {
  constructor(
    private readonly emailQueue: EmailQueue,
    private readonly fileProcessingQueue: FileProcessingQueue,
    private readonly notificationQueue: NotificationQueue,
    private readonly cleanupQueue: CleanupQueue,
    private readonly deadLetterQueue: DeadLetterQueue,
  ) {}

  async onModuleInit() {
    console.log(
      '🚀 BullMQ Module Initialized (API Server - Queue Producer Only)',
    );
    console.log('📊 Bull Board Dashboard: http://localhost:4000/admin/queues');
    console.log('');
    console.log('⚠️  IMPORTANT: No processors running in this process!');
    console.log('   Start worker process separately: npm run start:worker');
    console.log('');

    try {
      const emailMetrics = await this.emailQueue.getMetrics();
      const fileMetrics = await this.fileProcessingQueue.getMetrics();
      const notificationMetrics = await this.notificationQueue.getMetrics();
      const cleanupMetrics = await this.cleanupQueue.getMetrics();

      console.log('📧 Email Queue:', emailMetrics.counts);
      console.log('📁 File Processing Queue:', fileMetrics.counts);
      console.log('🔔 Notification Queue:', notificationMetrics.counts);
      console.log('🧹 Cleanup Queue:', cleanupMetrics.counts);
    } catch (error) {
      console.warn('⚠️  Could not fetch queue metrics - Redis may not be available');
      console.warn('💡 Make sure Redis is running or start it with: redis-server');
      console.warn('   The server will start but queue functionality will be limited');
    }
  }
}
