import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { BaseQueueService } from '../services/base-queue.service';
import { QueueName, JobPriority } from '../enums/queue.enum';
import { JobOptions } from '../interfaces/queue.interface';

export interface AiJobData {
  jobType: string;
  organizationId: string;
  /** AI prompt configuration */
  ai: {
    systemPrompt: string;
    userMessage: string;
    responseFormat?: 'json' | 'text';
    temperature?: number;
    maxTokens?: number;
  };
  /** WebSocket room to emit results to (e.g. "project-<id>", "crm-<id>") */
  wsRoom?: string;
  /** Arbitrary metadata passed through to the result (e.g. projectId, ticketId, sprintId) */
  meta?: Record<string, any>;
}

@Injectable()
export class AiQueue extends BaseQueueService implements OnModuleInit {
  protected readonly logger = new Logger(AiQueue.name);
  protected readonly queue: Queue;

  constructor(private readonly configService: ConfigService) {
    super();
    this.queue = BaseQueueService.createQueue(
      QueueName.AI_PROCESSING,
      configService,
    );
  }

  async onModuleInit() {
    this.logger.log(`${QueueName.AI_PROCESSING} initialized`);
  }

  async enqueue(data: AiJobData, options?: JobOptions) {
    return this.addJob(
      data.jobType,
      data,
      { priority: JobPriority.NORMAL, timeout: 120000, ...options },
    );
  }
}
