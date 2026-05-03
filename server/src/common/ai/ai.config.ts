import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AiConfig {
  constructor(private readonly configService: ConfigService) {}

  get apiBaseUrl(): string {
    return this.configService.get<string>('AI_API_BASE_URL', 'https://api.openai.com/v1');
  }

  get apiKey(): string {
    return this.configService.get<string>('AI_API_KEY', '');
  }

  get model(): string {
    return this.configService.get<string>('AI_MODEL', 'gpt-4o-mini');
  }

  get maxTokens(): number {
    return this.configService.get<number>('AI_MAX_TOKENS', 4096);
  }

  get temperature(): number {
    return this.configService.get<number>('AI_TEMPERATURE', 0.3);
  }

  get requestUrl(): string {
    return `${this.apiBaseUrl}/chat/completions`;
  }

  get headers(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }
}
