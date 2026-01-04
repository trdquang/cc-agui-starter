import React from "react";
import "./Sidebar.css";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onToggle} />}
      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <h2>🤖 AG-UI Chat</h2>
          <button
            className="sidebar-close"
            onClick={onToggle}
            aria-label="Close sidebar"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="sidebar-content">
          <div className="sidebar-section">
            <h3>Features</h3>
            <ul>
              <li>🚀 Real-time streaming responses</li>
              <li>🔄 Event-driven architecture</li>
              <li>💬 Persistent conversations</li>
              <li>🤖 AI-powered assistance</li>
            </ul>
          </div>

          <div className="sidebar-section">
            <h3>About AG-UI</h3>
            <p>
              AG-UI (Agent User Interaction) is a protocol that standardizes how
              AI agents connect to user-facing applications, enabling real-time
              interactivity and human-in-the-loop collaboration.
            </p>
          </div>

          <div className="sidebar-section">
            <h3>Tech Stack</h3>
            <div className="tech-stack">
              <span className="tech-badge">React</span>
              <span className="tech-badge">TypeScript</span>
              <span className="tech-badge">Node.js</span>
              <span className="tech-badge">HTTP/SSE</span>
              <span className="tech-badge">OpenAI</span>
              <span className="tech-badge">AG-UI</span>
            </div>
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="footer-links">
            <a
              href="https://github.com/ag-ui-protocol/ag-ui"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              GitHub
            </a>
          </div>
          <p className="footer-text">Built with ❤️ using AG-UI Protocol</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
