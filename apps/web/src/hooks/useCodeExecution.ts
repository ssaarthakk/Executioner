import { useState, useEffect, useRef } from 'react';
import { ExecutionStatus, SecurityPayload } from '../types';
import { SECURITY_PAYLOADS } from '../constants/payloads';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export function useCodeExecution() {
    const [code, setCode] = useState<string>(SECURITY_PAYLOADS[0].code);
    const [selectedPayloadId, setSelectedPayloadId] = useState<string>('normal');
    const [status, setStatus] = useState<ExecutionStatus>('idle');
    const [jobId, setJobId] = useState<string | null>(null);
    const [stdout, setStdout] = useState<string>('');
    const [exitCode, setExitCode] = useState<number | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [apiHealth, setApiHealth] = useState<'online' | 'offline' | 'checking'>('checking');
    
    const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const pollCounterRef = useRef<number>(0);

    useEffect(() => {
        const checkHealth = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/health`);
                if (res.ok) {
                    setApiHealth('online');
                } else {
                    setApiHealth('offline');
                }
            } catch (err) {
                setApiHealth('offline');
            }
        };
        checkHealth();
        const healthTimer = setInterval(checkHealth, 10000);
        return () => {
            clearInterval(healthTimer);
        };
    }, []);

    useEffect(() => {
        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
        };
    }, []);

    const loadPayload = (payload: SecurityPayload) => {
        setCode(payload.code);
        setSelectedPayloadId(payload.id);
    };

    const handleRunCode = async () => {
        if (status === 'submitting' || status === 'waiting' || status === 'active') {
            return;
        }

        setStatus('submitting');
        setStdout('Submitting code to queue...\n');
        setExitCode(null);
        setErrorMessage(null);
        setJobId(null);
        pollCounterRef.current = 0;

        try {
            const response = await fetch(`${API_BASE_URL}/execute`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code })
            });

            if (response.status === 429) {
                setStatus('rate-limited');
                setErrorMessage('Too many requests. You have triggered the rate limiter (max 10 runs per minute).');
                setStdout('Execution rejected: 429 Too Many Requests\n');
                return;
            }

            const data = await response.json();

            if (!response.ok) {
                setStatus('failed');
                setErrorMessage(data.error || 'Validation error or submission failure.');
                setStdout(`Error: ${data.error || 'Failed to execute code'}\n`);
                return;
            }

            setJobId(data.jobId);
            setStatus('waiting');
            setStdout(prev => prev + `Job successfully queued. ID: ${data.jobId}\nPolling for worker thread...`);

            startPolling(data.jobId);
        } catch (err: any) {
            console.error(err);
            setStatus('failed');
            setErrorMessage('Could not establish connection to the API server.');
            setStdout('Error: API Connection Failed. Make sure the API server is running.\n');
        }
    };

    const startPolling = (targetJobId: string) => {
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
        }

        pollIntervalRef.current = setInterval(async () => {
            pollCounterRef.current += 1;

            if (pollCounterRef.current > 60) {
                stopPolling();
                setStatus('failed');
                setErrorMessage('Execution timed out while polling the queue.');
                setStdout(prev => prev + '\n[Error: Poll timeout reached. Is the worker container running?]');
                return;
            }

            try {
                const res = await fetch(`${API_BASE_URL}/execute/${targetJobId}`);
                if (!res.ok) {
                    throw new Error(`Server returned HTTP ${res.status}`);
                }

                const data = await res.json();

                if (data.status === 'done') {
                    stopPolling();
                    setStatus('completed');
                    setStdout(data.result?.stdout || '(No output produced)');
                    setExitCode(data.result?.exitCode);
                } else if (data.status === 'error') {
                    stopPolling();
                    setStatus('failed');
                    setErrorMessage(data.error);
                    setStdout(`Execution error: ${data.error}`);
                    setExitCode(1);
                } else if (data.status === 'active') {
                    setStatus('active');
                    setStdout('Job acquired by worker! Executing container...');
                } else if (data.status === 'waiting') {
                    setStatus('waiting');
                    setStdout(prev => {
                        if (prev.endsWith('...')) return prev.slice(0, -3) + '.';
                        if (prev.endsWith('..')) return prev + '.';
                        if (prev.endsWith('.')) return prev + '.';
                        return prev + '.';
                    });
                }
            } catch (err: any) {
                console.error('Polling error:', err);
                if (pollCounterRef.current > 10) {
                    stopPolling();
                    setStatus('failed');
                    setErrorMessage('Failed to fetch job updates from server.');
                    setStdout(prev => prev + '\n[Error: Lost communication with server]');
                }
            }
        }, 500);
    };

    const stopPolling = () => {
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
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
        stdout,
        exitCode,
        errorMessage,
        apiHealth,
        loadPayload,
        handleRunCode,
        handleClearEditor,
        handleResetEditor
    };
}
