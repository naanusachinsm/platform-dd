import { Module, Global, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { BullModule as NestBullModule } from '@nestjs/bullmq';
import { SequelizeModule } from '@nestjs/sequelize';
import { QueueName } from './enums/queue.enum';
import { BullConfig } from './config/bull.config';

// Queue Services
import { EmailQueue } from './queues/email.queue';
import { FileProcessingQueue } from './queues/file-processing.queue';
import { NotificationQueue } from './queues/notification.queue';
import { CleanupQueue } from './queues/cleanup.queue';
import { DeadLetterQueue } from './queues/dead-letter.queue';
import { SubscriptionQueue } from './queues/subscription.queue';
import { AiQueue } from './queues/ai.queue';

// Processors
import { EmailProcessor } from './processors/email.processor';
import { FileProcessingProcessor } from './processors/file-processing.processor';
import { NotificationProcessor } from './processors/notification.processor';
import { CleanupProcessor } from './processors/cleanup.processor';
import { DeadLetterProcessor } from './processors/dead-letter.processor';
import { SubscriptionProcessor } from './processors/subscription.processor';
import { AiProcessor } from './processors/ai.processor';

// Dependencies
import { EmailService } from '../email/email.service';
import { ExcelService } from '../excel/excel.service';
import { TokenRefreshService } from 'src/common/services/token-refresh.service';
import { CircuitBreakerService } from 'src/common/services/circuit-breaker.service';

// Entities needed by processors
import { GmailOAuthToken } from 'src/resources/users/entities/gmail-oauth-token.entity';
import { User } from 'src/resources/users/entities/user.entity';

// Import WsModule for WsGateway
import { WsModule } from 'src/resources/ws/ws.module';
// Import SubscriptionsModule for subscription services
import { SubscriptionsModule } from 'src/resources/subscriptions/subscriptions.module';
// Import AuditLogsModule for audit logging in processors
import { AuditLogsModule } from 'src/resources/audit-logs/audit-logs.module';
import { NotificationsModule } from 'src/resources/notifications/notifications.module';

@Global()
@Module({
  imports: [
    ConfigModule,
    HttpModule,
    WsModule,
    SubscriptionsModule,
    AuditLogsModule,
    NotificationsModule,
    SequelizeModule.forFeature([
      GmailOAuthToken,
      User,
    ]),
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
  providers: [
    EmailQueue,
    FileProcessingQueue,
    NotificationQueue,
    CleanupQueue,
    DeadLetterQueue,
    SubscriptionQueue,
    AiQueue,
    EmailProcessor,
    FileProcessingProcessor,
    NotificationProcessor,
    CleanupProcessor,
    DeadLetterProcessor,
    SubscriptionProcessor,
    AiProcessor,
    EmailService,
    ExcelService,
    TokenRefreshService,
    CircuitBreakerService,
  ],
  exports: [
    EmailQueue,
    FileProcessingQueue,
    NotificationQueue,
    CleanupQueue,
    DeadLetterQueue,
    SubscriptionQueue,
  ],
})
export class WorkerBullModule implements OnModuleInit {
  private readonly logger = new Logger(WorkerBullModule.name);

  async onModuleInit() {
    this.logger.log('🔧 Worker BullMQ Module Initialized');
    try {
      this.logger.log('👷 Workers ready to process jobs from Redis');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.warn(`⚠️ Redis connection issue detected: ${errorMessage}. Workers may not function properly.`);
      this.logger.warn('💡 Make sure Redis is running or start it with: redis-server');
    }
  }
}
