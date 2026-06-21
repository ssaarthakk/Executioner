import { useState, useEffect, useRef } from 'react';
import { ExecutionStatus, SecurityPayload } from '../types';
import { SECURITY_PAYLOADS } from '../constants/payloads';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function useCodeExecution() {
    const [code, setCode] = useState<string>(SECURITY_PAYLOADS[0].code);
    const [selectedPayloadId, setSelectedPayloadId] = useState<string>('normal');
    const [status, setStatus] = useState<ExecutionStatus>('idle');
    const [jobId, setJobId] = useState<string | null>(null);
    const [exitCode, setExitCode] = useState<number | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [apiHealth, setApiHealth] = useState<'online' | 'offline' | 'checking'>('checking');
    
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const subscribersRef = useRef<((data: string) => void)[]>([]);

    const [sessionId] = useState(() => {
        let id = localStorage.getItem('runnerSessionId');
        if (!id) {
            id = crypto.randomUUID();
            localStorage.setItem('runnerSessionId', id);
        }
        return id;
    });

    const notifySubscribers = (data: string) => {
        subscribersRef.current.forEach(callback => callback(data));
    };

    const subscribeToTerminal = (callback: (data: string) => void) => {
        subscribersRef.current.push(callback);
        return () => {
            subscribersRef.current = subscribersRef.current.filter(cb => cb !== callback);
        };
    };

    const getWsUrl = () => {
        const url = API_BASE_URL.replace(/^http/, 'ws');
        return `${url}/ws?sessionId=${sessionId}`;
    };

    const connect = () => {
        if (wsRef.current) return;

        const wsUrl = getWsUrl();
        console.log(`[WS] Connecting to ${wsUrl}`);
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log('[WS] Connected to gateway');
            setApiHealth('online');
            notifySubscribers('\r\n\x1b[32m[Connected to secure execution gateway]\x1b[0m\r\n');

            // Send local heartbeat
            heartbeatTimerRef.current = setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: 'heartbeat' }));
                }
            }, 30000);
        };

        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);

                switch (msg.type) {
                    case 'ready':
                        setStatus('idle');
                        break;
                    case 'queued':
                        setStatus('waiting');
                        setJobId(msg.jobId);
                        notifySubscribers('\x1b[33m[Execution queued in queue]\x1b[0m\r\n');
                        break;
                    case 'running':
                        setStatus('active');
                        notifySubscribers('\x1b[36m[Sandbox ready. Executing code snippet...]\x1b[0m\r\n');
                        break;
                    case 'output':
                        notifySubscribers(atob(msg.data));
                        break;
                    case 'done':
                        setStatus('completed');
                        setExitCode(msg.exitCode);
                        notifySubscribers(`\r\n\x1b[32m[Process exited with code ${msg.exitCode}]\x1b[0m\r\n`);
                        break;
                    case 'error':
                        setStatus('failed');
                        setErrorMessage(msg.message);
                        notifySubscribers(`\r\n\x1b[31m[Sandbox Error: ${msg.message}]\x1b[0m\r\n`);
                        break;
                    case 'pong':
                        break;
                }
            } catch (err: any) {
                console.error('[WS] Parse error:', err.message);
            }
        };

        ws.onclose = (event) => {
            console.log(`[WS] Connection closed: ${event.code}`);
            wsRef.current = null;
            setApiHealth('offline');
            setStatus('idle');
            
            if (heartbeatTimerRef.current) {
                clearInterval(heartbeatTimerRef.current);
                heartbeatTimerRef.current = null;
            }

            if (event.code !== 4000) {
                notifySubscribers('\r\n\x1b[33m[Lost gateway connection. Reconnecting...]\x1b[0m\r\n');
                reconnectTimerRef.current = setTimeout(connect, 3000);
            }
        };

        ws.onerror = () => {
            setApiHealth('offline');
        };
    };

    useEffect(() => {
        connect();

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
            if (reconnectTimerRef.current) {
                clearTimeout(reconnectTimerRef.current);
            }
            if (heartbeatTimerRef.current) {
                clearInterval(heartbeatTimerRef.current);
            }
        };
    }, []);

    const loadPayload = (payload: SecurityPayload) => {
        setCode(payload.code);
        setSelectedPayloadId(payload.id);
    };

    const handleRunCode = () => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            notifySubscribers('\r\n\x1b[31m[Gateway Offline: Cannot run code]\x1b[0m\r\n');
            return;
        }

        setStatus('submitting');
        setExitCode(null);
        setErrorMessage(null);
        setJobId(null);

        notifySubscribers('\x1b[2J\x1b[H\x1b[36m[Submitting code...]\x1b[0m\r\n');

        wsRef.current.send(JSON.stringify({
            type: 'run',
            code: btoa(code),
            language: 'python',
            version: '3.12'
        }));
    };

    const handleCancel = () => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'cancel' }));
            notifySubscribers('\r\n\x1b[31m[SIGKILL command sent to sandbox...]\x1b[0m\r\n');
        }
    };

    const sendStdin = (data: string) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'stdin',
                data: btoa(data)
            }));
        }
    };

    const sendResize = (cols: number, rows: number) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'resize',
                cols,
                rows
            }));
        }
    };

    const handleClearEditor = () => {
        setCode('');
        setSelectedPayloadId('');
    };

    const handleResetEditor = () => {
        const payload = SECURITY_PAYLOADS.find(p => p.id === selectedPayloadId);
        if (payload) {
            setCode(payload.code);
        } else {
            setCode(SECURITY_PAYLOADS[0].code);
            setSelectedPayloadId('normal');
        }
    };

    return {
        code,
        setCode,
        selectedPayloadId,
        setSelectedPayloadId,
        status,
        jobId,
        exitCode,
        errorMessage,
        apiHealth,
        loadPayload,
        handleRunCode,
        handleCancel,
        sendStdin,
        sendResize,
        subscribeToTerminal,
        handleClearEditor,
        handleResetEditor
    };
}
