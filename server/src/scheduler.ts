/**
 * Dedicated Scheduler Process for Cron Jobs
 *
 * This runs separately from the main API server and workers to:
 * - Prevent duplicate cron job execution when scaling workers
 * - Isolate scheduler failures from API and worker processes
 * - Better resource management (schedulers are lightweight)
 * - Single instance deployment (no horizontal scaling needed)
 *
 * Usage:
 *   npm run start:scheduler        # Development
 *   npm run start:scheduler:prod   # Production
 *
 * NOTE: Only run ONE instance of the scheduler process!
 * Running multiple instances will cause duplicate cron job execution.
 */

import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { SchedulerModule } from './scheduler.module';

async function bootstrap() {
  const logger = new Logger('SchedulerBootstrap');

  try {
    const app = await NestFactory.createApplicationContext(SchedulerModule, {
      logger: ['log', 'error', 'warn', 'debug', 'verbose'],
    });

    logger.log('🚀 Scheduler Process Started');
    logger.log('⏰ Running scheduled cron jobs...');
    logger.log('📋 Active schedulers:');
    logger.log('   - Subscription expiry check (midnight UTC)');
    logger.log('   - Subscription renewal check (midnight UTC)');
    logger.log('⚠️  IMPORTANT: Only run ONE instance of the scheduler process!');
    logger.log('📈 Press Ctrl+C to stop');

    const gracefulShutdown = async (signal: string) => {
      logger.log(`🛑 Received ${signal}, shutting down gracefully...`);
      
      try {
        const shutdownTimeout = 30000;
        const shutdownPromise = app.close();
        const timeoutPromise = new Promise((resolve) => {
          setTimeout(() => {
            logger.warn('⚠️ Shutdown timeout reached, forcing exit');
            resolve(null);
          }, shutdownTimeout);
        });

        await Promise.race([shutdownPromise, timeoutPromise]);
        logger.log('✅ Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

    await app.init();
  } catch (error) {
    logger.error('❌ Failed to start scheduler process:', error);
    process.exit(1);
  }
}

bootstrap();
