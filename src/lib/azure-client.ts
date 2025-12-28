// Azure OpenAI Client for Comet-X
import type { AzureConfig, ChatCompletionRequest, ChatCompletionResponse } from '../types';

export class AzureOpenAIClient {
  private endpoint: string;
  private apiKey: string;
  private deploymentName: string;
  private apiVersion: string;

  constructor(config: AzureConfig) {
    this.endpoint = config.endpoint.replace(/\/$/, '');
    this.apiKey = config.apiKey;
    this.deploymentName = config.deploymentName;
    this.apiVersion = config.apiVersion;
  }

  private getUrl(): string {
    return `${this.endpoint}/openai/deployments/${this.deploymentName}/chat/completions?api-version=${this.apiVersion}`;
  }

  async chat(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    options: Partial<ChatCompletionRequest> = {}
  ): Promise<string> {
    const response = await fetch(this.getUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': this.apiKey,
      },
      body: JSON.stringify({
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens ?? 4096,
        stream: false,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Azure OpenAI Error: ${response.status} - ${error}`);
    }

    const data: ChatCompletionResponse = await response.json();
    return data.choices[0]?.message?.content ?? '';
  }

  async *chatStream(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    options: Partial<ChatCompletionRequest> = {}
  ): AsyncGenerator<string, void, unknown> {
    const response = await fetch(this.getUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': this.apiKey,
      },
      body: JSON.stringify({
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens ?? 4096,
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Azure OpenAI Error: ${response.status} - ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === 'data: [DONE]') continue;
        if (!trimmed.startsWith('data: ')) continue;

        try {
          const json = JSON.parse(trimmed.slice(6));
          const content = json.choices?.[0]?.delta?.content;
          if (content) {
            yield content;
          }
        } catch {
          // Skip invalid JSON
        }
      }
    }
  }
}

// Available models in Azure OpenAI
export const AZURE_MODELS = {
  'o3-mini': {
    name: 'o3-mini',
    description: 'نموذج التفكير المتقدم - للمهام المعقدة',
    maxTokens: 8192,
  },
  'gpt-4.1': {
    name: 'gpt-4.1',
    description: 'أحدث إصدار من GPT-4 - متوازن',
    maxTokens: 128000,
  },
  'gpt-4o': {
    name: 'gpt-4o',
    description: 'GPT-4 Omni - سريع ومتعدد الوسائط',
    maxTokens: 128000,
  },
} as const;

export type AzureModelId = keyof typeof AZURE_MODELS;
