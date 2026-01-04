import React from "react";
import { Message } from "../types";
import "./MessageBubble.css";

interface MessageBubbleProps {
  message: Message;
  isFirst: boolean;
  isLast: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isFirst,
  isLast,
}) => {
  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatContent = (content: string) => {
    // Simple markdown-like formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/`(.*?)`/g, "<code>$1</code>")
      .replace(/\n/g, "<br>");
  };

  return (
    <div className={`message-wrapper ${isUser ? "user" : "assistant"}`}>
      <div
        className={`message-bubble ${isFirst ? "first" : ""} ${
          isLast ? "last" : ""
        }`}
      >
        {isAssistant && isFirst && (
          <div className="message-avatar">
            <span className="avatar-icon">🤖</span>
          </div>
        )}

        <div className="message-content">
          {isAssistant && isFirst && (
            <div className="message-sender">AI Assistant</div>
          )}

          <div
            className="message-text"
            dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
          />

          {isLast && (
            <div className="message-time">
              {formatTime(message.createdAt)}
              {isUser && (
                <span className="message-status">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="20,6 9,17 4,12" />
                  </svg>
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
