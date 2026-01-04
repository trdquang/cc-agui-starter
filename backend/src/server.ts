import express from "express";
import cors from "cors";
import { createServer } from "http";
import { ChatbotAgent } from "./chatbot-agent.js";
import { OpenAI } from "openai";
import { randomUUID } from "crypto";

// Custom message interface for session storage
interface SessionMessage {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  createdAt: Date;
  toolCalls?: any[];
  toolCallId?: string;
}

export interface ServerConfig {
  port?: number;
  corsOrigin?: string | string[];
  openaiApiKey?: string;
}

export class ChatbotServer {
  private app: express.Application;
  private server: any;
  private agent!: ChatbotAgent;
  private config: ServerConfig;
  private activeSessions = new Map<string, {
    threadId: string;
    messages: SessionMessage[];
    lastActivity: Date;
  }>();

  constructor(config: ServerConfig = {}) {
    this.config = {
      port: config.port ?? 3001,
      corsOrigin: config.corsOrigin ?? "http://localhost:3000",
      ...config
    };

    this.app = express();
    this.server = createServer(this.app);
    this.setupMiddleware();
    this.setupRoutes();
    this.setupAgent();
  }

  private setupMiddleware(): void {
    this.app.use(cors({
      origin: this.config.corsOrigin,
      credentials: true
    }));
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  private setupRoutes(): void {
    // AG-UI HTTP endpoint for HttpAgent
    this.app.post('/agent', async (req, res) => {
      console.log('=== AG-UI agent endpoint called ===');
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      console.log('Request headers:', req.headers);

      try {
        const { threadId, runId, messages, tools, context } = req.body;

        if (!messages || !Array.isArray(messages)) {
          return res.status(400).json({ error: 'Invalid messages format' });
        }

        // Set up Server-Sent Events
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
        });

        // Create or get session
        let session = this.activeSessions.get(threadId);
        if (!session) {
          session = {
            threadId,
            messages: [],
            lastActivity: new Date()
          };
          this.activeSessions.set(threadId, session);
        }

        // Convert AG-UI messages to our format
        const agMessages = messages.map((msg: any) => {
          const baseMessage = {
            id: msg.id || randomUUID(),
            content: msg.content
          };

          switch (msg.role) {
            case "user":
              return { ...baseMessage, role: "user" as const };
            case "assistant":
              return {
                ...baseMessage,
                role: "assistant" as const,
                ...(msg.toolCalls ? { toolCalls: msg.toolCalls } : {})
              };
            case "system":
              return { ...baseMessage, role: "system" as const };
            case "tool":
              return {
                ...baseMessage,
                role: "tool" as const,
                toolCallId: msg.toolCallId || randomUUID()
              };
            default:
              return { ...baseMessage, role: "user" as const };
          }
        });

        // Update session messages
        session.messages = agMessages.map(msg => ({
          ...msg,
          createdAt: new Date()
        }));
        session.lastActivity = new Date();

        // Run agent and stream events
        const runObservable = this.agent.run({
          threadId,
          runId: runId || randomUUID(),
          messages: agMessages,
          tools: tools || [],
          context: context || [],
          state: null,
          forwardedProps: {}
        });

        runObservable.subscribe({
          next: (event: any) => {
            console.log('Backend emitting event:', event);
            const eventData = JSON.stringify(event);
            res.write(`data: ${eventData}\n\n`);
          },
          error: (error: any) => {
            console.error('Agent run error:', error);
            const errorEvent = {
              type: 'RUN_ERROR',
              message: error.message || 'Unknown error',
              timestamp: Date.now()
            };
            res.write(`data: ${JSON.stringify(errorEvent)}\n\n`);
            res.end();
          },
          complete: () => {
            const completeEvent = {
              type: 'RUN_FINISHED',
              timestamp: Date.now()
            };
            res.write(`data: ${JSON.stringify(completeEvent)}\n\n`);
            res.end();
          }
        });

        // Handle client disconnect
        req.on('close', () => {
          console.log('Client disconnected from AG-UI endpoint');
        });

      } catch (error) {
        console.error('Error in AG-UI endpoint:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Health check endpoint
    this.app.get("/api/health", (req, res) => {
      res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        sessions: this.activeSessions.size
      });
    });

    // Get session info
    this.app.get("/api/session/:sessionId", (req, res) => {
      const { sessionId } = req.params;
      const session = this.activeSessions.get(sessionId);

      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      res.json({
        threadId: session.threadId,
        messageCount: session.messages.length,
        lastActivity: session.lastActivity
      });
    });

    // Clear session
    this.app.delete("/api/session/:sessionId", (req, res) => {
      const { sessionId } = req.params;
      const deleted = this.activeSessions.delete(sessionId);

      res.json({ deleted });
    });
  }

  private setupAgent(): void {
    const openai = new OpenAI({
      apiKey: this.config.openaiApiKey || process.env.OPENAI_API_KEY,
    });

    this.agent = new ChatbotAgent(openai, {
      model: "gpt-4o-mini",
      systemPrompt: `You are an AI assistant built with the AG-UI protocol. You can engage in helpful conversations and provide assistance on various topics. Keep your responses clear, concise, and engaging.`,
      maxTokens: 2000,
      temperature: 0.7
    });
  }

  start(): Promise<void> {
    return new Promise((resolve) => {
      this.server.listen(this.config.port, () => {
        console.log(`🚀 AG-UI Chatbot Server running on port ${this.config.port}`);
        console.log(`🌐 CORS enabled for: ${this.config.corsOrigin}`);
        resolve();
      });
    });
  }

  stop(): Promise<void> {
    return new Promise((resolve) => {
      this.server.close(() => {
        console.log("Server stopped");
        resolve();
      });
    });
  }

  getActiveSessions(): number {
    return this.activeSessions.size;
  }
}