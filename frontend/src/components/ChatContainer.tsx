import React from "react";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import { useChat } from "../hooks/useChat";
import "./ChatContainer.css";

const ChatContainer: React.FC = () => {
  const {
    messages,
    isTyping,
    isConnected,
    sendMessage,
    clearMessages,
    retryLastMessage,
  } = useChat();

  return (
    <div className="chat-container">
      {!isConnected && (
        <div className="connection-banner">
          <div className="connection-status">
            <span className="status-icon">⚠️</span>
            Connecting to server...
          </div>
        </div>
      )}

      <div className="chat-header">
        <div className="chat-info">
          <h2>Chat Session</h2>
          <p>{messages.length} messages</p>
        </div>
        <div className="chat-actions">
          <button
            className="btn-secondary"
            onClick={clearMessages}
            disabled={messages.length === 0}
            title="Clear conversation"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 6h18l-2 13H5L3 6z" />
              <path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
            Clear
          </button>
          <button
            className="btn-secondary"
            onClick={retryLastMessage}
            disabled={!messages.length || isTyping}
            title="Retry last message"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 12a9 9 0 019-9 9.75 9.75 0 016.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 01-9 9 9.75 9.75 0 01-6.74-2.74L3 16" />
              <path d="M3 21v-5h5" />
            </svg>
            Retry
          </button>
        </div>
      </div>

      <MessageList
        messages={messages}
        isTyping={isTyping}
        onSuggestionClick={sendMessage} // Pass sendMessage to handle suggestion clicks
      />

      <MessageInput
        onSendMessage={sendMessage}
        disabled={!isConnected || isTyping}
        placeholder={isConnected ? "Type your message..." : "Connecting..."}
      />
    </div>
  );
};

export default ChatContainer;
