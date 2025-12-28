// Comet-X Types

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  status?: 'pending' | 'streaming' | 'complete' | 'error';
  toolCalls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  result?: unknown;
  status: 'pending' | 'running' | 'complete' | 'error';
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  pageContext?: PageContext;
  createdAt: number;
  updatedAt: number;
}

export interface PageContext {
  url: string;
  title: string;
  content: string;
  selectedText?: string;
  metadata?: PageMetadata;
}

export interface PageMetadata {
  description?: string;
  keywords?: string[];
  author?: string;
  publishedDate?: string;
  images?: string[];
}

export interface Settings {
  apiEndpoint: string;
  apiKey: string;
  defaultModel: string;
  theme: 'dark' | 'light' | 'system';
  language: 'ar' | 'en';
  enableContextMenu: boolean;
  enableKeyboardShortcuts: boolean;
  maxTokens: number;
  temperature: number;
}

export interface AppState {
  isLoading: boolean;
  isStreaming: boolean;
  currentConversation: Conversation | null;
  conversations: Conversation[];
  settings: Settings;
  error: string | null;
}

// Chrome Extension Message Types
export type MessageType =
  | 'CHAT'
  | 'ANALYZE_PAGE'
  | 'GET_SELECTION'
  | 'SUMMARIZE'
  | 'TRANSLATE'
  | 'EXPLAIN'
  | 'GET_SETTINGS'
  | 'SAVE_SETTINGS'
  | 'OPEN_SIDEPANEL';

export interface ExtensionMessage {
  type: MessageType;
  payload?: unknown;
  tabId?: number;
}

export interface ExtensionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// Azure OpenAI Types
export interface AzureConfig {
  endpoint: string;
  apiKey: string;
  deploymentName: string;
  apiVersion: string;
}

export interface ChatCompletionRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface ChatCompletionResponse {
  id: string;
  choices: Array<{
    index: number;
    message: {
      role: 'assistant';
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Tool Definitions
export const AVAILABLE_TOOLS = [
  'summarize_page',
  'extract_text',
  'translate',
  'search_page',
  'get_links',
  'get_images',
  'explain_code',
  'generate_code',
] as const;

export type ToolName = typeof AVAILABLE_TOOLS[number];

export interface ToolDefinition {
  name: ToolName;
  description: string;
  parameters: Record<string, {
    type: string;
    description: string;
    required?: boolean;
  }>;
}
