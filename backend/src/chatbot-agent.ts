import {
  AbstractAgent,
  RunAgentInput,
  EventType,
  BaseEvent,
} from "@ag-ui/client";
import { OpenAI } from "openai";
import { randomUUID } from "crypto";
import { Observable } from "rxjs";

// Use any type to work around RxJS version conflicts
type ObservableType = any;

export interface ChatbotConfig {
  model?: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
}

export class ChatbotAgent extends AbstractAgent {
  private openai: OpenAI;
  private config: ChatbotConfig;

  constructor(openai?: OpenAI, config: ChatbotConfig = {}) {
    super();
    this.openai = openai ?? new OpenAI();
    this.config = {
      model: config.model ?? "gpt-4o-mini",
      systemPrompt: config.systemPrompt ?? "You are a helpful AI assistant. Provide clear, concise, and helpful responses.",
      maxTokens: config.maxTokens ?? 2000,
      temperature: config.temperature ?? 0.7,
      ...config
    };
  }

  run(input: RunAgentInput): ObservableType {
    return new Observable((observer: any) => {
      const { threadId, runId } = input;

      console.log('Starting agent run with input:', {
        threadId,
        runId,
        messageCount: input.messages.length,
        tools: input.tools?.length || 0
      });

      // Emit run started event
      observer.next({
        type: EventType.RUN_STARTED,
        threadId,
        runId,
      });

      // Prepare messages with system prompt
      const messages = [
        {
          role: "system" as const,
          content: this.config.systemPrompt!,
        },
        ...input.messages.map((message) => {
          let messageContent = "";
          if (typeof message.content === 'string') {
            messageContent = message.content;
          } else if (Array.isArray(message.content) && message.content.length > 0) {
            const textContent = message.content.find((part: any) => part.type === "text");
            messageContent = textContent?.text || "";
          }

          return {
            role: message.role as any,
            content: messageContent,
            ...(message.role === "assistant" && message.toolCalls
              ? { tool_calls: message.toolCalls }
              : {}),
            ...(message.role === "tool"
              ? { tool_call_id: message.toolCallId }
              : {}),
          };
        }),
      ];

      console.log('Prepared messages for OpenAI:', JSON.stringify(messages, null, 2));

      // Make OpenAI API call with streaming
      this.openai.chat.completions
        .create({
          model: this.config.model!,
          messages,
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
          stream: true,
          // Convert AG-UI tools format to OpenAI's expected format if available
          ...(input.tools && input.tools.length > 0 ? {
            tools: input.tools.map((tool) => ({
              type: "function" as const,
              function: {
                name: tool.name,
                description: tool.description,
                parameters: tool.parameters,
              },
            })),
          } : {}),
        })
        .then(async (stream) => {
          console.log('Received OpenAI stream, processing...');
          const messageId = randomUUID();
          let isFirstChunk = true;
          let currentToolCall: any = null;
          let totalContent = "";

          // Process streaming response
          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta;

            if (!delta) continue;

            // Handle text content
            if (delta.content) {
              console.log('Received content chunk:', delta.content);
              totalContent += delta.content;

              if (isFirstChunk) {
                observer.next({
                  type: EventType.TEXT_MESSAGE_START,
                  messageId,
                  role: "assistant",
                });
                isFirstChunk = false;
              }

              observer.next({
                type: EventType.TEXT_MESSAGE_CONTENT,
                messageId,
                delta: delta.content,
              });
            }

            // Handle tool calls
            if (delta.tool_calls) {
              const toolCall = delta.tool_calls[0];

              if (toolCall.id && !currentToolCall) {
                currentToolCall = { id: toolCall.id, name: toolCall.function?.name, args: "" };
                observer.next({
                  type: EventType.TOOL_CALL_START,
                  toolCallId: toolCall.id,
                  toolCallName: toolCall.function?.name,
                  parentMessageId: messageId,
                });
              }

              if (toolCall.function?.arguments) {
                currentToolCall.args += toolCall.function.arguments;
                observer.next({
                  type: EventType.TOOL_CALL_CHUNK,
                  toolCallId: currentToolCall.id,
                  toolCallName: currentToolCall.name,
                  parentMessageId: messageId,
                  delta: toolCall.function.arguments,
                });
              }
            }
          }

          // End tool call if one was active
          if (currentToolCall) {
            observer.next({
              type: EventType.TOOL_CALL_END,
              toolCallId: currentToolCall.id,
              toolCallName: currentToolCall.name,
              parentMessageId: messageId,
            });
          }

          // End text message if we started one
          if (!isFirstChunk) {
            observer.next({
              type: EventType.TEXT_MESSAGE_END,
              messageId,
            });
          }

          // Emit run finished
          observer.next({
            type: EventType.RUN_FINISHED,
            threadId,
            runId,
          });

          observer.complete();
        })
        .catch((error) => {
          console.error("OpenAI API Error:", error);

          observer.next({
            type: EventType.RUN_ERROR,
            message: error.message || "Unknown error occurred",
          });

          observer.error(error);
        });
    });
  }

  // Helper methods
  getConfig(): ChatbotConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<ChatbotConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}