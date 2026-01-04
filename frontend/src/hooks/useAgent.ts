import { useEffect, useRef, useState } from 'react';
import { HttpAgent, randomUUID } from '@ag-ui/client';
import { AgentEvent, ConnectionStatus } from '../types';

interface UseAgentReturn {
    agent: HttpAgent | null;
    connectionStatus: ConnectionStatus;
    sessionId: string | null;
    initializeSession: () => void;
    sendMessage: (message: string) => void;
    onAgentEvent: (callback: (event: AgentEvent) => void) => void;
    disconnect: () => void;
}

const AGENT_URL = '/agent';  // Use Vite proxy

export function useAgent(): UseAgentReturn {
    const [agent, setAgent] = useState<HttpAgent | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
        connected: false,
        connecting: false
    });
    const [sessionId, setSessionId] = useState<string | null>(null);
    const eventCallbackRef = useRef<((event: AgentEvent) => void) | null>(null);

    useEffect(() => {
        // Initialize AG-UI HttpAgent
        setConnectionStatus({ connected: false, connecting: true });

        try {
            const newAgent = new HttpAgent({
                url: AGENT_URL,
                agentId: 'chatbot-agent',
                threadId: randomUUID()
            });

            setAgent(newAgent);
            setConnectionStatus({ connected: true, connecting: false });
            setSessionId(newAgent.threadId);

            console.log('AG-UI Agent initialized with threadId:', newAgent.threadId);
        } catch (error) {
            console.error('Failed to initialize AG-UI agent:', error);
            setConnectionStatus({
                connected: false,
                connecting: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }

        return () => {
            // Cleanup if needed
        };
    }, []);

    const initializeSession = () => {
        // With AG-UI, the session is already initialized when the agent is created
        console.log('Session already initialized with threadId:', sessionId);
    };

    const sendMessage = (message: string) => {
        if (!agent || !sessionId) {
            console.error('Agent not ready or session not initialized');
            return;
        }

        // Add user message to agent's message history
        agent.messages.push({
            id: randomUUID(),
            role: 'user',
            content: message.trim()
        });

        try {
            // Run the agent with event subscriber
            agent.runAgent(
                {
                    tools: [],
                    context: []
                },
                {
                    onRunStartedEvent: () => {
                        if (eventCallbackRef.current) {
                            eventCallbackRef.current({
                                type: 'RUN_STARTED'
                            });
                        }
                    },
                    onTextMessageStartEvent: ({ event }) => {
                        if (eventCallbackRef.current) {
                            eventCallbackRef.current({
                                type: 'TEXT_MESSAGE_START',
                                messageId: event.messageId
                            });
                        }
                    },
                    onTextMessageContentEvent: ({ event }) => {
                        if (eventCallbackRef.current) {
                            eventCallbackRef.current({
                                type: 'TEXT_MESSAGE_CONTENT',
                                messageId: event.messageId,
                                delta: event.delta
                            });
                        }
                    },
                    onTextMessageEndEvent: ({ event }) => {
                        if (eventCallbackRef.current) {
                            eventCallbackRef.current({
                                type: 'TEXT_MESSAGE_END',
                                messageId: event.messageId
                            });
                        }
                    },
                    onRunFinishedEvent: () => {
                        if (eventCallbackRef.current) {
                            eventCallbackRef.current({
                                type: 'RUN_FINISHED'
                            });
                        }
                    },
                    onRunErrorEvent: ({ event }) => {
                        if (eventCallbackRef.current) {
                            eventCallbackRef.current({
                                type: 'RUN_ERROR',
                                message: event.message || 'Unknown error'
                            });
                        }
                    }
                }
            ).catch((error: any) => {
                console.error('Error running agent:', error);
                if (eventCallbackRef.current) {
                    eventCallbackRef.current({
                        type: 'RUN_ERROR',
                        message: error.message || 'Unknown error'
                    });
                }
            });

        } catch (error) {
            console.error('Error running agent:', error);
        }
    };

    const onAgentEvent = (callback: (event: AgentEvent) => void) => {
        eventCallbackRef.current = callback;
    };

    const disconnect = () => {
        // With HttpAgent, no explicit disconnect needed
        setAgent(null);
        setSessionId(null);
        setConnectionStatus({ connected: false, connecting: false });
    };

    return {
        agent,
        connectionStatus,
        sessionId,
        initializeSession,
        sendMessage,
        onAgentEvent,
        disconnect
    };
}