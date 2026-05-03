import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from './configuration/config/config.module';
import { DatabaseModule } from './configuration/database/database.module';
import { LoggerModule } from './configuration/logger/logger.module';
import { CommonModule } from './common/common.module';
import { EmailModule } from './configuration/email/email.module';
import { SubscriptionsModule } from './resources/subscriptions/subscriptions.module';

/**
 * Scheduler Module - Dedicated for scheduled cron jobs
 *
 * This module:
 * - Does NOT import HTTP/REST controllers
 * - Does NOT start Express/Fastify server
 * - Does NOT include BullMQ processors (those are in worker.module.ts)
 * - ONLY runs scheduled cron jobs (subscription expiry, renewal, etc.)
 * - Should run as a SINGLE instance (no horizontal scaling)
 * - Connects to same database as API server
 *
 * Usage:
 *   npm run start:scheduler        # Development
 *   npm run start:scheduler:prod   # Production
 */
@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule,
    DatabaseModule,
    LoggerModule,
    CommonModule,
    EmailModule,
    SubscriptionsModule,
  ],
})
export class SchedulerModule {}
