export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  createdAt: Date;
  toolCalls?: ToolCall[];
  toolCallId?: string;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: string;
}

export interface AgentEvent {
  type: string;
  messageId?: string;
  role?: string;
  delta?: string;
  toolCallId?: string;
  toolCallName?: string;
  parentMessageId?: string;
  threadId?: string;
  runId?: string;
  message?: string;
}

export interface ChatSession {
  id: string;
  threadId: string;
  messages: Message[];
  isTyping: boolean;
  lastActivity: Date;
}

export interface ConnectionStatus {
  connected: boolean;
  connecting: boolean;
  error?: string;
}