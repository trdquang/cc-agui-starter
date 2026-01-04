import React from "react";
import "./TypingIndicator.css";

const TypingIndicator: React.FC = () => {
  return (
    <div className="message-wrapper assistant">
      <div className="message-bubble typing">
        <div className="message-avatar">
          <span className="avatar-icon">🤖</span>
        </div>
        <div className="typing-content">
          <div className="typing-bubble">
            <div className="typing-dots">
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
