import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { AiProvider, AiChatParams, AiChatResponse, AiMessage } from '../ai.interface';
import { AiConfig } from '../ai.config';

@Injectable()
export class OpenAiProvider implements AiProvider {
  private readonly logger = new Logger(OpenAiProvider.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly aiConfig: AiConfig,
  ) {}

  async chat(params: AiChatParams): Promise<AiChatResponse> {
    const messages: Array<{ role: string; content: string }> = [
      { role: 'system', content: params.systemPrompt },
      ...params.messages.map((m: AiMessage) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    if (params.responseFormat === 'json') {
      messages[0].content += '\n\nIMPORTANT: You MUST respond with valid JSON only. No markdown, no code fences, just raw JSON.';
    }

    const body: Record<string, any> = {
      model: this.aiConfig.model,
      messages,
      max_tokens: params.maxTokens ?? this.aiConfig.maxTokens,
      temperature: params.temperature ?? this.aiConfig.temperature,
    };

    if (params.responseFormat === 'json') {
      body.response_format = { type: 'json_object' };
    }

    this.logger.debug(`Sending request to LLM API: ${this.aiConfig.requestUrl} (model: ${this.aiConfig.model})`);

    try {
      const response = await firstValueFrom(
        this.httpService.post(this.aiConfig.requestUrl, body, {
          headers: this.aiConfig.headers,
          timeout: 120000,
        }),
      );

      const data = response.data;
      const choice = data.choices?.[0];

      if (!choice?.message?.content) {
        throw new Error('Empty response from LLM API');
      }

      return {
        content: choice.message.content,
        usage: {
          promptTokens: data.usage?.prompt_tokens ?? 0,
          completionTokens: data.usage?.completion_tokens ?? 0,
          totalTokens: data.usage?.total_tokens ?? 0,
        },
      };
    } catch (error) {
      if (error instanceof AxiosError && error.response) {
        this.logger.error(
          `LLM API error [${error.response.status}]: ${JSON.stringify(error.response.data)}`,
        );
      }
      throw error;
    }
  }
}
