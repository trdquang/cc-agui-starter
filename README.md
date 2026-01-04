# AG-UI Protocol: Foundation Knowledge & Starter Project Guide

## What is AG-UI Protocol?

**AG-UI (Agent User Interface)** is a standardized protocol designed to facilitate seamless communication between AI agents and user interfaces. It provides a structured, event-driven approach to building interactive AI applications with real-time streaming capabilities.

### Core Concepts

#### 1. **Event-Driven Architecture**

AG-UI operates on a publish-subscribe model where agents emit events that UIs can listen to and react accordingly.

#### 2. **Streaming Communication**

Instead of waiting for complete responses, AG-UI enables real-time streaming of content as it's generated, providing immediate user feedback.

#### 3. **Protocol Standardization**

AG-UI defines standard event types and message structures, ensuring consistency across different implementations.

## AG-UI Event System

### Event Types

```typescript
enum EventType {
  RUN_STARTED = "RUN_STARTED",
  RUN_FINISHED = "RUN_FINISHED",
  TEXT_MESSAGE_START = "TEXT_MESSAGE_START",
  TEXT_MESSAGE_CONTENT = "TEXT_MESSAGE_CONTENT",
  TEXT_MESSAGE_END = "TEXT_MESSAGE_END",
  TOOL_CALL_START = "TOOL_CALL_START",
  TOOL_CALL_CONTENT = "TOOL_CALL_CONTENT",
  TOOL_CALL_END = "TOOL_CALL_END",
  ERROR = "ERROR",
}
```

### Event Flow

```
1. RUN_STARTED → Agent begins processing
2. TEXT_MESSAGE_START → Text response begins
3. TEXT_MESSAGE_CONTENT (multiple) → Streaming content
4. TEXT_MESSAGE_END → Text response complete
5. RUN_FINISHED → Agent processing complete
```

### Agent Interface

```typescript
interface Agent {
  run(input: RunAgentInput): RunAgent;
}

interface RunAgentInput {
  prompt: string;
  context?: any;
  sessionId?: string;
}

type RunAgent = () => Observable<BaseEvent>;
```

## Core Concepts: Agent and RunAgentInput

### What is an Agent?

An **Agent** in the AG-UI protocol represents an AI entity that can process user inputs and generate responses through a standardized interface. Think of it as a wrapper around your AI model (like OpenAI's GPT) that speaks the AG-UI "language".

#### Key Characteristics:

- **Standardized Interface**: All agents implement the same `run` method, ensuring consistency
- **Event-Driven**: Agents emit events (like `TEXT_MESSAGE_START`, `TEXT_MESSAGE_CONTENT`) instead of returning complete responses
- **Observable-Based**: Uses RxJS Observables for streaming real-time responses
- **Stateless**: Each agent run is independent, with state managed externally

#### Example Implementation:

```typescript
export class ChatbotAgent extends AbstractAgent {
  private openai: OpenAI;

  constructor(openai: OpenAI, config: ChatbotConfig = {}) {
    super();
    this.openai = openai;
    // Configure your AI model settings
  }

  /**
   * The run method of the Agent is called whenever the frontend sends a user input to the backend for processing. This happens when the user submits a message in the chat interface.
   *
   * @param {RunAgentInput} input - The input data required to run the agent.
   * @returns {Observable<BaseEvent>} - An observable that emits a stream of events during the agent's execution.
   */

  run(input: RunAgentInput): Observable<BaseEvent> {
    return new Observable((observer) => {
      // 1. Emit RUN_STARTED event
      observer.next({ type: EventType.RUN_STARTED });

      // 2. Process the input and stream responses
      this.processWithOpenAI(input, observer);

      // 3. Emit RUN_FINISHED when complete
      observer.next({ type: EventType.RUN_FINISHED });
    });
  }
}
```

### What is RunAgentInput?

**RunAgentInput** is the standardized data structure that contains all the information an agent needs to process a user's request.

#### Full Interface Structure:

```typescript
interface RunAgentInput {
  // Conversation context
  threadId: string; // Unique identifier for the conversation thread
  runId: string; // Unique identifier for this specific run
  messages: Message[]; // Complete conversation history

  // Tool and context data
  tools?: Tool[]; // Available tools the agent can use
  context?: any[]; // Additional context data
  state?: any; // Current state information
  forwardedProps?: any; // Custom properties passed through
}
```

#### Key Properties Explained:

**`threadId`**: A unique identifier for the entire conversation. All messages in the same chat session share the same threadId.

**`runId`**: A unique identifier for this specific agent execution. Each time the user sends a message, a new runId is generated.

**`messages`**: An array containing the full conversation history, including:

```typescript
interface Message {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string | ContentPart[];
  toolCalls?: ToolCall[]; // For function calling
  toolCallId?: string; // For tool responses
}
```

**`tools`** (optional): Array of available tools/functions the agent can call:

```typescript
interface Tool {
  name: string;
  description: string;
  parameters: object; // JSON Schema for parameters
}
```

**`context`** (optional): Additional context information that might influence the agent's behavior.

#### Real-World Usage Example:

```typescript
// When user sends "What's the weather in Paris?"
const input: RunAgentInput = {
  threadId: "thread-abc-123",
  runId: "run-def-456",
  messages: [
    {
      id: "msg-1",
      role: "system",
      content: "You are a helpful assistant.",
    },
    {
      id: "msg-2",
      role: "user",
      content: "What's the weather in Paris?",
    },
  ],
  tools: [
    {
      name: "get_weather",
      description: "Get weather information for a location",
      parameters: {
        type: "object",
        properties: {
          location: { type: "string" },
        },
      },
    },
  ],
  context: [],
  state: null,
  forwardedProps: {},
};

// Agent processes this input and streams back events
const observable = agent.run(input);
```

### How They Work Together

1. **Frontend** collects user input and conversation history
2. **RunAgentInput** packages this data in a standardized format
3. **Agent** receives the input and processes it with your AI model
4. **Agent** streams response events back to the frontend
5. **Frontend** renders the streaming response in real-time

This architecture enables:

- **Real-time streaming**: See responses as they're generated
- **Tool integration**: Agents can call external functions
- **Context awareness**: Full conversation history available
- **Standardization**: Any AG-UI frontend can work with any AG-UI agent

## Frontend Communication: HttpAgent

### What is HttpAgent?

**HttpAgent** is AG-UI's specialized HTTP client designed specifically for agent communication. HttpAgent uses Server-Sent Events (SSE) over HTTP to achieve real-time streaming while maintaining the simplicity of HTTP requests.

#### HttpAgent Architecture

```typescript
// AG-UI HttpAgent Approach
const agent = new HttpAgent({
  url: "/agent",
  agentId: "chatbot-agent",
  threadId: randomUUID(),
});

agent.runAgent(
  { tools: [], context: [] },
  {
    onTextMessageContentEvent: ({ event }) => {
      handleEvent(event);
    },
  }
);
```

#### Key Benefits

| Feature              | HttpAgent                            |
| -------------------- | ------------------------------------ |
| **Protocol**         | HTTP + Server-Sent Events            |
| **Connection**       | HTTP request with streaming response |
| **Message Format**   | AG-UI standardized events            |
| **State Management** | Built-in conversation threading      |
| **Error Recovery**   | HTTP retry mechanisms                |
| **Tool Support**     | Native AG-UI tool integration        |

### Why HttpAgent for AG-UI Frontend?

#### 1. **Simplified State Management**

HttpAgent automatically manages conversation state and message history:

```typescript
// HttpAgent automatically tracks messages
agent.messages.push({
  id: randomUUID(),
  role: "user",
  content: message.trim(),
});

// No need to manually sync conversation state
// Agent maintains full message history internally
```

#### 2. **Built-in AG-UI Event Handling**

HttpAgent provides typed event handlers for all AG-UI event types:

```typescript
agent.runAgent(
  { tools: [], context: [] },
  {
    // Typed event handlers with proper event structure
    onRunStartedEvent: () => setIsTyping(true),
    onTextMessageStartEvent: ({ event }) => createNewMessage(event.messageId),
    onTextMessageContentEvent: ({ event }) => appendContent(event.delta),
    onTextMessageEndEvent: ({ event }) => finalizeMessage(event.messageId),
    onToolCallStartEvent: ({ event }) => showToolUsage(event.toolCallName),
    onRunErrorEvent: ({ event }) => handleError(event.message),
  }
);
```

#### 3. **HTTP Benefits**

- **Simpler Infrastructure**: Works with standard HTTP load balancers
- **Better Caching**: HTTP responses can be cached by CDNs
- **Firewall Friendly**: No special port configurations needed
- **Debugging**: Standard HTTP tools work for troubleshooting
- **Reliability**: HTTP retry mechanisms handle network issues

#### 4. **Server-Sent Events for Streaming**

HttpAgent uses SSE under the hood for real-time streaming:

```typescript
// Backend sends SSE stream
res.writeHead(200, {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache",
  Connection: "keep-alive",
});

// Stream AG-UI events
res.write(`data: ${JSON.stringify(event)}\n\n`);
```

## Current Project Structure

This starter project demonstrates a complete AG-UI implementation with the following architecture:

### Project Layout

```
nt-agui-starter/
├── package.json              # Root workspace configuration
├── README.agui.md            # This documentation
├── README.md                 # Project overview
├── tsconfig.json             # Shared TypeScript config
├── backend/                  # Node.js backend with Express
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── chatbot-agent.ts  # AG-UI agent implementation
│       ├── index.ts          # Entry point
│       └── server.ts         # Express server with AG-UI endpoints
└── frontend/                 # React frontend with TypeScript
    ├── index.html
    ├── package.json
    ├── tsconfig.json
    ├── tsconfig.node.json
    ├── vite.config.ts        # Vite configuration
    ├── public/               # Static assets
    └── src/
        ├── App.css
        ├── App.tsx           # Main application component
        ├── index.css
        ├── main.tsx          # React entry point
        ├── components/       # UI components
        │   ├── ChatContainer.tsx
        │   ├── MessageBubble.tsx
        │   ├── MessageInput.tsx
        │   ├── MessageList.tsx
        │   ├── Sidebar.tsx
        │   └── TypingIndicator.tsx
        ├── hooks/            # React hooks
        │   ├── useAgent.ts   # HttpAgent management
        │   └── useChat.ts    # Chat state management
        └── types/            # TypeScript definitions
            └── index.ts
```

### Key Features

#### Backend (Express + AG-UI)

- **AG-UI Agent**: Implements the standard AG-UI protocol for OpenAI integration
- **HTTP Endpoints**: RESTful API for agent communication
- **Server-Sent Events**: Real-time streaming responses
- **TypeScript**: Full type safety throughout the backend

#### Frontend (React + AG-UI)

- **HttpAgent**: AG-UI's HTTP client for seamless agent communication
- **React Components**: Modern UI components for chat interface
- **Real-time Streaming**: Live response rendering with typing indicators
- **TypeScript**: Type-safe frontend development
- **Vite**: Fast development and optimized builds

#### Communication Flow

1. **User Input** → React components capture user messages
2. **HttpAgent** → Sends request to backend `/agent` endpoint
3. **AG-UI Agent** → Processes message with OpenAI and streams events
4. **Server-Sent Events** → Backend streams AG-UI events to frontend
5. **React UI** → Updates interface in real-time with streaming responses

## Getting Started

### Prerequisites:

- Node.js 18+
- OpenAI API key
- Git installed

### Setup Instructions:

1. **Clone the repository:**

   ```bash
   git clone <your-public-repo-url>
   cd nt-agui-starter
   ```

2. **Install dependencies:**

   ```bash
   npm install
   cd backend && npm install
   cd ../frontend && npm install
   ```

3. **Configure environment:**

   ```bash
   # Create .env file in backend/
   echo "OPENAI_API_KEY=your-api-key-here" > backend/.env
   ```

4. **Start development servers:**

   ```bash
   npm run dev
   ```

5. **Access the application:**
   - Frontend: http://localhost:300
   - Backend: http://localhost:3001

### Development Workflow

#### Backend Development

The backend uses Express with TypeScript and implements the AG-UI agent pattern:

```typescript
// backend/src/chatbot-agent.ts
export class ChatbotAgent extends AbstractAgent {
  run(input: RunAgentInput): RunAgent {
    return () =>
      new Observable<BaseEvent>((observer) => {
        // Emit AG-UI events for streaming responses
        observer.next({ type: EventType.RUN_STARTED });
        // ... process with OpenAI and stream content
        observer.next({ type: EventType.RUN_FINISHED });
      });
  }
}
```

#### Frontend Development

The frontend uses React with the AG-UI HttpAgent:

```typescript
// frontend/src/hooks/useAgent.ts
const agent = new HttpAgent({
  url: "/agent",
  agentId: "chatbot-agent",
});

// Stream responses from the agent
agent.runAgent(input, {
  onTextMessageContentEvent: ({ event }) => {
    setStreamingContent((prev) => prev + event.delta);
  },
});
```

## Key AG-UI Implementation Points

### 1. **Agent Interface Compliance**

Your agent must implement the `AbstractAgent` interface and emit proper AG-UI events.

### 2. **Event Streaming**

Use RxJS Observables to handle event streaming and manage subscriptions properly.

### 3. **Error Handling**

Implement comprehensive error handling for both network and agent-level errors.

### 4. **Real-time Communication**

Use HTTP with Server-Sent Events for real-time streaming communication.

### 5. **State Management**

Properly manage chat state, connection status, and message streaming.

## 🔧 Customization Options

### Agent Behavior

- Modify system prompts in the chatbot agent configuration
- Adjust model parameters (temperature, max tokens, etc.)
- Add custom tools and functions for enhanced capabilities

### UI/UX

- Customize message styling in component CSS files
- Add message types (images, files, etc.)
- Implement custom loading states and animations
- Modify the sidebar and chat container layouts

### Protocol Extensions

- Add custom AG-UI event types for specialized features
- Implement tool calling capabilities
- Add multi-modal support (images, audio, etc.)

## Common Pitfalls

1. **Event Subscription Management**: Always unsubscribe from observables to prevent memory leaks
2. **Error Boundaries**: Implement proper error boundaries in React components
3. **Rate Limiting**: Consider implementing rate limiting for API calls
4. **Security**: Validate all inputs and implement proper CORS configuration
5. **Environment Variables**: Ensure OpenAI API keys are properly configured

## Next Steps

1. **Add Authentication**: Implement user authentication and session management
2. **Persistence**: Add database integration for chat history storage
3. **Tool Integration**: Implement agent tools and function calling capabilities
4. **Deployment**: Set up production deployment with Docker or cloud platforms
5. **Testing**: Add comprehensive unit and integration tests
6. **Monitoring**: Implement logging and error tracking

## Additional Resources

- [AG-UI Protocol Documentation](https://github.com/ag-ui-protocol/ag-ui)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [React Documentation](https://reactjs.org/docs/)
- [RxJS Documentation](https://rxjs.dev/)
- [Express.js Documentation](https://expressjs.com/)

---

**Happy Building!**

This starter project provides the foundation for creating AG-UI compliant applications. Explore the codebase and extend it based on your specific requirements.
