import { useState } from "react";
import ChatContainer from "./components/ChatContainer";
import Sidebar from "./components/Sidebar";
import "./App.css";

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app">
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <main className={`main-content ${sidebarOpen ? "sidebar-open" : ""}`}>
        <header className="app-header">
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <h1 className="app-title">
            <span className="title-icon">🤖</span>
            AG-UI Chatbot
          </h1>
          <div className="status-indicator">
            <span className="status-dot"></span>
            <span>Online</span>
          </div>
        </header>
        <ChatContainer />
      </main>
    </div>
  );
}

export default App;
