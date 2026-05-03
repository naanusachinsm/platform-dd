import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { BaseProcessor } from './base.processor';
import { QueueName } from '../enums/queue.enum';
import { JobResult } from '../interfaces/queue.interface';
import { AiService } from 'src/common/ai/ai.service';
import { WsGateway } from 'src/resources/ws/ws.gateway';
import { AiJobData } from '../queues/ai.queue';

@Processor(QueueName.AI_PROCESSING)
export class AiProcessor extends WorkerHost {
  protected readonly logger = new Logger(AiProcessor.name);
  private readonly baseProcessor: AiProcessorImpl;

  constructor(
    private readonly aiService: AiService,
    private readonly wsGateway: WsGateway,
  ) {
    super();
    this.baseProcessor = new AiProcessorImpl(aiService, wsGateway);
  }

  async process(job: Job): Promise<any> {
    return await this.baseProcessor.executeWithLogging(job);
  }
}

class AiProcessorImpl extends BaseProcessor {
  protected readonly logger = new Logger('AiProcessorImpl');

  constructor(
    private readonly aiService: AiService,
    private readonly wsGateway: WsGateway,
  ) {
    super();
  }

  async process(job: Job<AiJobData>): Promise<JobResult> {
    try {
      const { ai, organizationId, jobType, wsRoom, meta } = job.data;

      this.validateJobData(job, ['ai', 'organizationId', 'jobType']);

      await this.updateProgress(job, 10, `Processing ${jobType}...`);

      const result = await this.aiService.chatJson({
        systemPrompt: ai.systemPrompt,
        messages: [{ role: 'user', content: ai.userMessage }],
        responseFormat: ai.responseFormat ?? 'json',
        temperature: ai.temperature,
        maxTokens: ai.maxTokens,
      }, organizationId);

      await this.updateProgress(job, 90, `${jobType} complete`);

      if (wsRoom) {
        this.emitResult(wsRoom, {
          jobType,
          jobId: job.id,
          ...meta,
          data: result,
        });
      }

      return this.createSuccessResult(result);
    } catch (error: any) {
      const { jobType, wsRoom, meta } = job.data || {};
      if (wsRoom) {
        this.emitResult(wsRoom, {
          jobType,
          jobId: job.id,
          ...meta,
          error: error.message,
        });
      }
      return this.createErrorResult(error);
    }
  }

  private emitResult(wsRoom: string, payload: any) {
    try {
      this.wsGateway.emitAiResult(wsRoom, payload);
    } catch (error) {
      this.logger.warn(`Failed to emit AI result to ${wsRoom}: ${(error as Error).message}`);
    }
  }
}
