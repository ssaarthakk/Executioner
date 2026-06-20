import 'dotenv/config';
import http from 'http';
import { WebSocketServer } from 'ws';
import express from 'express';
import cors from 'cors';
import executeRouter from './routes/execute.js';
import { handleWebSocketConnection } from './wsHandler.js';
import { initializeRedisSubscriber } from './redisSubscriber.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '20kb' }));

app.use('/execute', executeRouter);

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url || '', `http://${request.headers.host || 'localhost'}`);

    if (url.pathname === '/ws') {
        const sessionId = url.searchParams.get('sessionId');

        if (!sessionId || sessionId.trim().length === 0) {
            socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
            socket.destroy();
            return;
        }

        wss.handleUpgrade(request, socket, head, async (ws) => {
            const clientIp = (request.headers['x-forwarded-for'] as string) || request.socket.remoteAddress || '127.0.0.1';
            try {
                await handleWebSocketConnection(ws, sessionId, clientIp);
            } catch (err) {
                console.error('[Server] Upgrade connection handling error:', err);
                ws.close(1011, 'Internal error');
            }
        });
    } else {
        socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
        socket.destroy();
    }
});

await initializeRedisSubscriber();

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`API and WebSocket Server booted on port ${PORT}`);
});
