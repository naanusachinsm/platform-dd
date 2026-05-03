export interface AiChatParams {
  systemPrompt: string;
  messages: AiMessage[];
  responseFormat?: 'json' | 'text';
  maxTokens?: number;
  temperature?: number;
}

export interface AiMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AiChatResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface AiProvider {
  chat(params: AiChatParams): Promise<AiChatResponse>;
}

export const AI_PROVIDER = 'AI_PROVIDER';
