import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/sequelize';
import { ConfigService } from '@nestjs/config';
import { GmailOAuthToken } from 'src/resources/users/entities/gmail-oauth-token.entity';
import { QuotaManagementService } from './quota-management.service';
import { SchedulerHealthService } from './scheduler-health.service';
import { SubscriptionExpiryService } from 'src/resources/subscriptions/services/subscription-expiry.service';
import { SubscriptionRenewalService } from 'src/resources/subscriptions/services/subscription-renewal.service';
import { AuditLogsService } from 'src/resources/audit-logs/audit-logs.service';
import { Inject, forwardRef } from '@nestjs/common';
import { NotificationEventService } from 'src/resources/notifications/services/notification-event.service';

@Injectable()
export class ScheduledTasksService implements OnModuleInit {
  private readonly logger = new Logger(ScheduledTasksService.name);

  constructor(
    @InjectModel(GmailOAuthToken)
    private readonly gmailTokenModel: typeof GmailOAuthToken,
    private readonly quotaManagementService: QuotaManagementService,
    private readonly schedulerHealthService: SchedulerHealthService,
    private readonly configService: ConfigService,
    private readonly subscriptionExpiryService: SubscriptionExpiryService,
    private readonly subscriptionRenewalService: SubscriptionRenewalService,
    private readonly auditLogsService: AuditLogsService,
    @Inject(forwardRef(() => NotificationEventService))
    private readonly notificationEventService?: NotificationEventService,
  ) {}

  onModuleInit() {
    this.logger.log('Scheduled tasks service initialized');
  }

  /**
   * Check and handle expired subscriptions
   * Runs daily at midnight UTC
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkSubscriptionExpiry() {
    const schedulerName = 'SubscriptionExpiry';
    this.schedulerHealthService.recordStart(schedulerName);
    const startTime = Date.now();

    try {
      this.logger.log('Running subscription expiry check...');

      await this.subscriptionExpiryService.checkExpiredSubscriptions();
      await this.subscriptionExpiryService.processScheduledCancellations();
      await this.subscriptionExpiryService.sendExpiryNotifications();

      const duration = Date.now() - startTime;
      this.schedulerHealthService.recordSuccess(schedulerName, duration);
      this.logger.log('Subscription expiry check completed');
    } catch (error) {
      const err = error as Error;
      const duration = Date.now() - startTime;
      this.schedulerHealthService.recordFailure(schedulerName, duration, err);
      this.logger.error(
        `Error checking subscription expiry: ${err.message}`,
        err.stack,
      );
    }
  }

  /**
   * Check subscriptions due for renewal and generate invoices
   * Runs daily at midnight UTC
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkSubscriptionRenewals() {
    const schedulerName = 'SubscriptionRenewals';
    this.schedulerHealthService.recordStart(schedulerName);
    const startTime = Date.now();

    try {
      this.logger.log('Running subscription renewal check...');

      await this.subscriptionRenewalService.checkRenewals();

      const duration = Date.now() - startTime;
      this.schedulerHealthService.recordSuccess(schedulerName, duration);
      this.logger.log('Subscription renewal check completed');
    } catch (error) {
      const err = error as Error;
      const duration = Date.now() - startTime;
      this.schedulerHealthService.recordFailure(schedulerName, duration, err);
      this.logger.error(
        `Error checking subscription renewals: ${err.message}`,
        err.stack,
      );
    }
  }
}
