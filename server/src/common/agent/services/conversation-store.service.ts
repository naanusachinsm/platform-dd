import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { AiService } from 'src/common/ai/ai.service';
import { CONVERSATION_SUMMARY_PROMPT } from '../prompts/agent-system.prompt';

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'tool_results';
  content: string;
  timestamp: string;
  toolCalls?: any[];
  toolResults?: any[];
}

export interface ConversationHistory {
  conversationId: string;
  messages: ConversationMessage[];
  messageCount: number;
  createdAt: string;
  summary?: string;
}

export interface CompactHistory {
  summary: string | null;
  recentMessages: ConversationMessage[];
  totalMessages: number;
}

const CONVERSATION_TTL = 86400; // 24 hours
const SUMMARIZE_THRESHOLD = 15;
const RECENT_MESSAGES_KEEP = 5;

@Injectable()
export class ConversationStoreService {
  private readonly logger = new Logger(ConversationStoreService.name);
  private redis: Redis;

  constructor(
    private readonly configService: ConfigService,
    private readonly aiService: AiService,
  ) {
    this.redis = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD', ''),
      db: this.configService.get<number>('REDIS_DB', 0),
    });
  }

  private key(conversationId: string): string {
    return `agent:conv:${conversationId}`;
  }

  private summaryKey(conversationId: string): string {
    return `agent:conv:${conversationId}:summary`;
  }

  async getHistory(conversationId: string): Promise<ConversationHistory> {
    const raw = await this.redis.get(this.key(conversationId));
    if (!raw) {
      return {
        conversationId,
        messages: [],
        messageCount: 0,
        createdAt: new Date().toISOString(),
      };
    }

    const history: ConversationHistory = JSON.parse(raw);
    const summary = await this.redis.get(this.summaryKey(conversationId));
    if (summary) history.summary = summary;

    return history;
  }

  async addMessage(
    conversationId: string,
    message: ConversationMessage,
  ): Promise<void> {
    const history = await this.getHistory(conversationId);
    history.messages.push(message);
    history.messageCount = history.messages.length;

    await this.redis.setex(
      this.key(conversationId),
      CONVERSATION_TTL,
      JSON.stringify(history),
    );
  }

  async getCompactHistory(conversationId: string): Promise<CompactHistory> {
    const history = await this.getHistory(conversationId);

    if (history.messages.length <= SUMMARIZE_THRESHOLD) {
      return {
        summary: history.summary || null,
        recentMessages: history.messages,
        totalMessages: history.messages.length,
      };
    }

    const oldMessages = history.messages.slice(0, -RECENT_MESSAGES_KEEP);
    const recentMessages = history.messages.slice(-RECENT_MESSAGES_KEEP);

    let summary = history.summary;
    if (!summary) {
      summary = await this.summarizeMessages(conversationId, oldMessages);
    }

    return {
      summary,
      recentMessages,
      totalMessages: history.messages.length,
    };
  }

  private async summarizeMessages(
    conversationId: string,
    messages: ConversationMessage[],
  ): Promise<string> {
    try {
      const formatted = messages
        .filter((m) => m.role !== 'tool_results')
        .map((m) => `${m.role}: ${m.content}`)
        .join('\n');

      const prompt = CONVERSATION_SUMMARY_PROMPT.replace(
        '{{olderMessages}}',
        formatted,
      );

      const response = await this.aiService.chat({
        systemPrompt: prompt,
        messages: [
          { role: 'user', content: 'Summarize the conversation above.' },
        ],
      });

      const summary = response.content;
      await this.redis.setex(
        this.summaryKey(conversationId),
        CONVERSATION_TTL,
        summary,
      );

      return summary;
    } catch (error) {
      this.logger.warn(
        `Failed to summarize conversation ${conversationId}: ${(error as Error).message}`,
      );
      return '';
    }
  }

  async clearHistory(conversationId: string): Promise<void> {
    await this.redis.del(this.key(conversationId));
    await this.redis.del(this.summaryKey(conversationId));
  }

  async getMessageCount(conversationId: string): Promise<number> {
    const history = await this.getHistory(conversationId);
    return history.messageCount;
  }
}
