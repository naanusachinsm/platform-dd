import { Injectable, Logger } from '@nestjs/common';
import { AiChatParams, AiChatResponse } from './ai.interface';
import { OpenAiProvider } from './providers/openai.provider';
import { CircuitBreakerService } from '../services/circuit-breaker.service';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly provider: OpenAiProvider,
    private readonly circuitBreaker: CircuitBreakerService,
  ) {}

  async chat(params: AiChatParams, organizationId?: string): Promise<AiChatResponse> {
    const circuitKey = `ai:${organizationId ?? 'global'}`;

    const isOpen = await this.circuitBreaker.isOpen(circuitKey);
    if (isOpen) {
      throw new Error('AI service temporarily unavailable. Please try again later.');
    }

    try {
      const response = await this.retryWithBackoff(() => this.provider.chat(params));
      await this.circuitBreaker.recordSuccess(circuitKey);

      this.logger.debug(
        `AI call completed — tokens: ${response.usage.totalTokens} (prompt: ${response.usage.promptTokens}, completion: ${response.usage.completionTokens})`,
      );

      return response;
    } catch (error) {
      await this.circuitBreaker.recordFailure(circuitKey);
      this.logger.error(`AI call failed: ${(error as Error).message}`);
      throw error;
    }
  }

  async chatJson<T = any>(params: AiChatParams, organizationId?: string): Promise<T> {
    const response = await this.chat(
      { ...params, responseFormat: 'json' },
      organizationId,
    );

    try {
      return JSON.parse(response.content);
    } catch {
      this.logger.warn('Failed to parse AI JSON response, attempting extraction');
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('AI response was not valid JSON');
    }
  }

  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxAttempts = 3,
    initialDelay = 1000,
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        if (attempt >= maxAttempts || !this.isRetryable(error)) {
          throw error;
        }

        const delay = initialDelay * Math.pow(2, attempt - 1);
        this.logger.debug(`Retry attempt ${attempt}/${maxAttempts} after ${delay}ms`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  private isRetryable(error: any): boolean {
    const status = error?.response?.status;
    if (status === 429) return true;
    if (status >= 500) return true;
    if (error?.code === 'ECONNRESET' || error?.code === 'ETIMEDOUT') return true;
    return false;
  }
}
