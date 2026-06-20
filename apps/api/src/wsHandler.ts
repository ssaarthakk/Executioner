import WebSocket from 'ws';
import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { getSession, createSession, refreshHeartbeat } from './sessionManager.js';

const redisHost = process.env.REDIS_HOST || '127.0.0.1';
const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
const redisPublisher = new Redis({ host: redisHost, port: redisPort });

const queue = new Queue('code-execution', {
    connection: { host: redisHost, port: redisPort }
});

export const localSocketMap = new Map<string, WebSocket>();
const HEARTBEAT_INTERVAL = 30000;

export async function handleWebSocketConnection(ws: WebSocket, sessionId: string, clientIp: string): Promise<void> {
    console.log(`[WS] Connection initialized for session ${sessionId} (IP: ${clientIp})`);

    localSocketMap.set(sessionId, ws);
    let isAlive = true;

    ws.on('pong', () => {
        isAlive = true;
    });

    const heartbeatTimer = setInterval(async () => {
        if (!isAlive) {
            console.log(`[WS] Session ${sessionId} heartbeat timed out. Terminating connection.`);
            ws.terminate();
            return;
        }
        isAlive = false;
        try {
            ws.ping();
            await refreshHeartbeat(sessionId);
        } catch (err: any) {
            console.error(`[WS] Heartbeat update error for session ${sessionId}:`, err.message);
        }
    }, HEARTBEAT_INTERVAL);

    const checkRateLimit = async (): Promise<boolean> => {
        const rateLimitKey = `ratelimit:run:${clientIp}`;
        const count = await redisPublisher.incr(rateLimitKey);
        if (count === 1) {
            await redisPublisher.expire(rateLimitKey, 60);
        }
        return count <= 10;
    };

    try {
        let session = await getSession(sessionId);
        if (!session) {
            ws.send(JSON.stringify({ type: 'output', data: Buffer.from('Provisioning sandbox workspace container...\n').toString('base64') }));
            session = await createSession(sessionId);
        }

        ws.send(JSON.stringify({ type: 'ready', sessionId }));

        if (session.status === 'running') {
            console.log(`[WS] Active session ${sessionId} re-connected. Replaying output buffer.`);
            const logs = await redisPublisher.lrange(`outbuf:${sessionId}`, 0, -1);
            for (const log of logs) {
                ws.send(log);
            }
        }
    } catch (err: any) {
        console.error(`[WS] Failed to bootstrap session ${sessionId}:`, err);
        ws.send(JSON.stringify({ type: 'error', message: 'Failed to align sandbox runtime environment.' }));
        ws.close(4000, 'Bootstrap failed');
        clearInterval(heartbeatTimer);
        localSocketMap.delete(sessionId);
        return;
    }

    ws.on('message', async (data: string) => {
        try {
            const msg = JSON.parse(data);

            switch (msg.type) {
                case 'run': {
                    const ok = await checkRateLimit();
                    if (!ok) {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: 'Rate limit tripped: Max 10 runs per minute.'
                        }));
                        return;
                    }

                    if (!msg.code || typeof msg.code !== 'string') {
                        ws.send(JSON.stringify({ type: 'error', message: 'Bad code format' }));
                        return;
                    }

                    const rawCode = Buffer.from(msg.code, 'base64').toString('utf-8');
                    if (rawCode.length > 100000) {
                        ws.send(JSON.stringify({ type: 'error', message: 'Code size limit exceeded (max 100 KB)' }));
                        return;
                    }

                    await queue.add('run', { code: rawCode, sessionId });
                    break;
                }

                case 'stdin': {
                    if (msg.data && typeof msg.data === 'string') {
                        await redisPublisher.publish(`stdin:${sessionId}`, msg.data);
                    }
                    break;
                }

                case 'resize': {
                    if (typeof msg.cols === 'number' && typeof msg.rows === 'number') {
                        await redisPublisher.publish(`resize:${sessionId}`, JSON.stringify({
                            cols: msg.cols,
                            rows: msg.rows
                        }));
                    }
                    break;
                }

                case 'cancel': {
                    await redisPublisher.publish(`cancel:${sessionId}`, 'cancel');
                    break;
                }

                case 'heartbeat': {
                    isAlive = true;
                    await refreshHeartbeat(sessionId);
                    ws.send(JSON.stringify({ type: 'pong' }));
                    break;
                }

                default:
                    console.log(`[WS] Unknown client event: ${msg.type}`);
            }
        } catch (err: any) {
            console.error(`[WS] Client request error for ${sessionId}:`, err.message);
        }
    });

    ws.on('close', () => {
        console.log(`[WS] Session closed: ${sessionId}`);
        clearInterval(heartbeatTimer);
        localSocketMap.delete(sessionId);
    });

    ws.on('error', (err) => {
        console.error(`[WS] Socket error on session ${sessionId}:`, err);
    });
}
