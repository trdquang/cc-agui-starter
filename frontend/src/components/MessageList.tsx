import { useEffect, useRef } from "react";
import { Message } from "../types";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import "./MessageList.css";

interface MessageListProps {
  messages: Message[];
  isTyping: boolean;
  onSuggestionClick: (text: string) => void; // Added prop for handling suggestion clicks
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  isTyping,
  onSuggestionClick,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  if (messages.length === 0 && !isTyping) {
    return (
      <div className="message-list empty">
        <div className="empty-state">
          <div className="empty-icon">🤖</div>
          <h3>Welcome to AG-UI Chatbot</h3>
          <p>
            Start a conversation by typing a message below. I'm here to help
            with any questions you might have!
          </p>
          <div className="example-prompts">
            <div
              className="example-prompt"
              onClick={() => onSuggestionClick("Hello! How are you?")}
            >
              "Hello! How are you?"
            </div>
            <div
              className="example-prompt"
              onClick={() => onSuggestionClick("What can you help me with?")}
            >
              "What can you help me with?"
            </div>
            <div
              className="example-prompt"
              onClick={() => onSuggestionClick("Tell me about AG-UI")}
            >
              "Tell me about AG-UI"
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="message-list" ref={containerRef}>
      <div className="messages-container">
        {messages.map((message, index) => (
          <MessageBubble
            key={message.id}
            message={message}
            isFirst={index === 0 || messages[index - 1].role !== message.role}
            isLast={
              index === messages.length - 1 ||
              messages[index + 1]?.role !== message.role
            }
          />
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default MessageList;
