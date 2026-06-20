import { Redis } from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

const redisHost = process.env.REDIS_HOST || '127.0.0.1';
const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
const redis = new Redis({ host: redisHost, port: redisPort });

const SESSION_TTL = 900;
const META_TTL = 1200;

export interface SessionData {
    containerId: string;
    status: 'idle' | 'running';
    createdAt: number;
    lastHeartbeat: number;
}

export async function getSession(sessionId: string): Promise<SessionData | null> {
    const key = `session:${sessionId}`;
    const data = await redis.hgetall(key);
    
    if (!data || Object.keys(data).length === 0) {
        return null;
    }

    return {
        containerId: data.containerId,
        status: data.status as 'idle' | 'running',
        createdAt: parseInt(data.createdAt, 10),
        lastHeartbeat: parseInt(data.lastHeartbeat, 10)
    };
}

export async function createSession(sessionId: string): Promise<SessionData> {
    console.log(`[SessionManager] Requesting container from pool for session ${sessionId}`);

    const reqId = uuidv4();
    const requestPayload = JSON.stringify({ reqId, sessionId });
    await redis.rpush('container_pool:requests', requestPayload);

    const responseKey = `container_pool:response:${reqId}`;
    const response = await redis.blpop(responseKey, 5);

    if (!response) {
        throw new Error('Failed to acquire container from pool (Worker timeout)');
    }

    const { containerId } = JSON.parse(response[1]);
    console.log(`[SessionManager] Assigned container ${containerId.slice(0, 12)} to session ${sessionId}`);

    const now = Date.now();
    const sessionData = {
        containerId,
        status: 'idle' as const,
        createdAt: now,
        lastHeartbeat: now
    };

    const sessionKey = `session:${sessionId}`;
    const metaKey = `session_meta:${sessionId}`;

    await redis.multi()
        .hset(sessionKey, {
            containerId,
            status: 'idle',
            createdAt: now.toString(),
            lastHeartbeat: now.toString()
        })
        .expire(sessionKey, SESSION_TTL)
        .hset(metaKey, { containerId })
        .expire(metaKey, META_TTL)
        .sadd('active_sessions', sessionId)
        .exec();

    return sessionData;
}

export async function refreshHeartbeat(sessionId: string): Promise<void> {
    const sessionKey = `session:${sessionId}`;
    const exists = await redis.exists(sessionKey);
    
    if (exists) {
        const now = Date.now();
        await redis.multi()
            .hset(sessionKey, 'lastHeartbeat', now.toString())
            .expire(sessionKey, SESSION_TTL)
            .expire(`session_meta:${sessionId}`, META_TTL)
            .exec();
    }
}
