import { useState, useCallback, useEffect, useRef } from 'react';
import { Message, AgentEvent } from '../types';
import { useAgent } from './useAgent';
import { v4 as uuidv4 } from 'uuid';

interface UseChatReturn {
  messages: Message[];
  isTyping: boolean;
  isConnected: boolean;
  sessionId: string | null;
  sendMessage: (content: string) => void;
  clearMessages: () => void;
  retryLastMessage: () => void;
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentAssistantMessage, setCurrentAssistantMessage] = useState<Message | null>(null);
  const lastUserMessageRef = useRef<string | null>(null);

  const {
    connectionStatus,
    sessionId,
    initializeSession,
    sendMessage: agentSendMessage,
    onAgentEvent
  } = useAgent();

  // Initialize session when connected
  useEffect(() => {
    if (connectionStatus.connected && !sessionId) {
      initializeSession();
    }
  }, [connectionStatus.connected, sessionId, initializeSession]);

  // Handle agent events
  useEffect(() => {
    onAgentEvent((event: AgentEvent) => {
      handleAgentEvent(event);
    });
  }, []);

  const handleAgentEvent = (event: AgentEvent) => {
    console.log('Frontend received event:', event);

    switch (event.type) {
      case 'RUN_STARTED':
        setIsTyping(true);
        console.log('Run started - typing indicator on');
        break;

      case 'TEXT_MESSAGE_START':
        const newMessage: Message = {
          id: event.messageId!,
          role: 'assistant',
          content: '',
          createdAt: new Date()
        };
        console.log('Text message start - creating message with ID:', event.messageId);
        setCurrentAssistantMessage(newMessage);
        setMessages(prev => [...prev, newMessage]);
        break;

      case 'TEXT_MESSAGE_CONTENT':
        console.log('Text content received:', {
          messageId: event.messageId,
          delta: event.delta,
          currentMessageId: currentAssistantMessage?.id
        });

        // Update message by messageId instead of relying on currentAssistantMessage
        setMessages(prev =>
          prev.map(msg =>
            msg.id === event.messageId
              ? { ...msg, content: msg.content + (event.delta || '') }
              : msg
          )
        );

        // Also update currentAssistantMessage if it matches
        if (currentAssistantMessage && event.messageId === currentAssistantMessage.id) {
          setCurrentAssistantMessage(prev =>
            prev ? { ...prev, content: prev.content + (event.delta || '') } : null
          );
        }
        break;

      case 'TEXT_MESSAGE_END':
        console.log('Text message end - messageId:', event.messageId);
        setCurrentAssistantMessage(null);
        setIsTyping(false);
        break;

      case 'TOOL_CALL_START':
        console.log('Tool call started:', event.toolCallName);
        break;

      case 'TOOL_CALL_END':
        console.log('Tool call ended:', event.toolCallName);
        break;

      case 'RUN_FINISHED':
        setIsTyping(false);
        break;

      case 'RUN_ERROR':
        setIsTyping(false);
        console.error('Agent error:', event.message);
        // Could add error message to chat
        break;

      default:
        console.log('Unhandled event:', event.type, event);
    }
  };

  const sendMessage = useCallback((content: string) => {
    if (!content.trim() || !sessionId) return;

    // Add user message immediately
    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: content.trim(),
      createdAt: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    lastUserMessageRef.current = content.trim();

    // Send to backend via AG-UI agent
    agentSendMessage(content.trim());
  }, [sessionId, agentSendMessage]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setCurrentAssistantMessage(null);
    setIsTyping(false);
  }, []);

  const retryLastMessage = useCallback(() => {
    if (lastUserMessageRef.current) {
      sendMessage(lastUserMessageRef.current);
    }
  }, [sendMessage]);

  return {
    messages,
    isTyping,
    isConnected: connectionStatus.connected,
    sessionId,
    sendMessage,
    clearMessages,
    retryLastMessage
  };
}