import { Module, Global, forwardRef } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SequelizeModule } from '@nestjs/sequelize';
import { UserContextService } from './services/user-context.service';
import { CryptoUtilityService } from './services/crypto-utility.service';
import { TransactionManager } from './services/transaction-manager.service';
import { RedisProgressService } from './services/redis-progress.service';
import { GmailService } from './services/gmail.service';
import { ScheduledTasksService } from './services/scheduled-tasks.service';
import { NotificationsModule } from 'src/resources/notifications/notifications.module';
import { TokenRefreshService } from './services/token-refresh.service';
import { CircuitBreakerService } from './services/circuit-breaker.service';
import { SchedulerHealthService } from './services/scheduler-health.service';
import { PlanLimitValidationService } from './services/plan-limit-validation.service';
import { QuotaManagementService } from './services/quota-management.service';
import { UserContextInterceptor } from './interceptors/user-context.interceptor';
import { AuditLogMiddleware } from './middleware/audit-log.middleware';
import { AuditLogsModule } from 'src/resources/audit-logs/audit-logs.module';
import { SubscriptionsModule } from 'src/resources/subscriptions/subscriptions.module';
import { User } from 'src/resources/users/entities/user.entity';
import { GmailOAuthToken } from 'src/resources/users/entities/gmail-oauth-token.entity';
import { Subscription } from 'src/resources/subscriptions/entities/subscription.entity';
import { SubscriptionPlan } from 'src/resources/subscriptions/entities/subscription-plan.entity';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { BullModule } from 'src/configuration/bull/bull.module';
import { AiModule } from './ai/ai.module';

@Global()
@Module({
  imports: [
    ScheduleModule.forRoot(),
    AuditLogsModule,
    forwardRef(() => SubscriptionsModule),
    forwardRef(() => NotificationsModule),
    BullModule,
    AiModule,
    SequelizeModule.forFeature([
      GmailOAuthToken,
      User,
      Subscription,
      SubscriptionPlan,
    ]),
  ],
  providers: [
    UserContextService,
    CryptoUtilityService,
    TransactionManager,
    RedisProgressService,
    GmailService,
    ScheduledTasksService,
    TokenRefreshService,
    CircuitBreakerService,
    SchedulerHealthService,
    PlanLimitValidationService,
    QuotaManagementService,
    AuditLogMiddleware,
    {
      provide: APP_INTERCEPTOR,
      useClass: UserContextInterceptor,
    },
  ],
  exports: [
    UserContextService,
    CryptoUtilityService,
    TransactionManager,
    RedisProgressService,
    GmailService,
    ScheduledTasksService,
    TokenRefreshService,
    CircuitBreakerService,
    SchedulerHealthService,
    PlanLimitValidationService,
    QuotaManagementService,
    AuditLogMiddleware,
  ],
})
export class CommonModule {}
