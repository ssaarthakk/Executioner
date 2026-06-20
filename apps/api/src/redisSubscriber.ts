import { Redis } from 'ioredis';
import WebSocket from 'ws';
import { localSocketMap } from './wsHandler.js';

const redisHost = process.env.REDIS_HOST || '127.0.0.1';
const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
const redisSub = new Redis({ host: redisHost, port: redisPort });

export async function initializeRedisSubscriber(): Promise<void> {
    console.log('[RedisSubscriber] Subscribing to output:* channel pattern');
    
    try {
        const count = await redisSub.psubscribe('output:*');
        console.log(`[RedisSubscriber] Pattern subscribed. Active pattern count: ${count}`);
    } catch (err) {
        console.error('[RedisSubscriber] Pattern subscription failed:', err);
    }

    redisSub.on('pmessage', (pattern: string, channel: string, message: string) => {
        const sessionId = channel.substring('output:'.length);
        const ws = localSocketMap.get(sessionId);

        if (ws && ws.readyState === WebSocket.OPEN) {
            try {
                ws.send(message);
            } catch (err: any) {
                console.error(`[RedisSubscriber] Failed to send socket message to ${sessionId}:`, err.message);
            }
        }
    });
}
