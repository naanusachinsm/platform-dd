import { Module } from '@nestjs/common';
import { ConfigModule } from './configuration/config/config.module';
import { DatabaseModule } from './configuration/database/database.module';
import { LoggerModule } from './configuration/logger/logger.module';
import { CommonModule } from './common/common.module';
import { ExcelModule } from './configuration/excel/excel.module';
import { EmailModule } from './configuration/email/email.module';
import { MulterModule } from './configuration/multer/multer.module';
import { WsModule } from './resources/ws/ws.module';
import { WorkerBullModule } from './configuration/bull/worker-bull.module';

/**
 * Worker Module - Dedicated for processing BullMQ jobs
 *
 * This module:
 * - Does NOT import HTTP/REST controllers
 * - Does NOT start Express/Fastify server
 * - Processes BullMQ jobs from Redis queues
 * - Does NOT run scheduled cron jobs (those are in scheduler.module.ts)
 * - Connects to same Redis as API server
 * - Can be horizontally scaled (multiple instances)
 */
@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    LoggerModule,
    CommonModule,
    ExcelModule,
    EmailModule,
    MulterModule,
    WsModule,
    WorkerBullModule,
  ],
})
export class WorkerModule {}
