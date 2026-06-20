import 'dotenv/config';
import { Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import { ContainerPool } from './ContainerPool.js';
import { runCode, RunnerResult } from './runner.js';

const redisHost = process.env.REDIS_HOST || '127.0.0.1';
const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);

const connection = {
    host: redisHost,
    port: redisPort,
};

const redisClient = new Redis({ host: redisHost, port: redisPort });

const poolMinIdle = parseInt(process.env.POOL_MIN_IDLE || '3', 10);
const poolMaxIdle = parseInt(process.env.POOL_MAX_IDLE || '10', 10);

const containerPool = new ContainerPool({
    image: 'python-sandbox:latest',
    minIdle: poolMinIdle,
    maxIdle: poolMaxIdle
});

async function main() {
    await containerPool.initialize();

    const healthCheckTimer = setInterval(() => {
        containerPool.healthCheck().catch(err => {
            console.error('[Worker] ContainerPool healthcheck error:', err);
        });
    }, 60000);

    async function listenForContainerRequests() {
        console.log('[Worker] Listening for container pool requests on container_pool:requests...');
        while (true) {
            try {
                // BLPOP blocks until a request is pushed onto 'container_pool:requests'
                const result = await redisClient.blpop('container_pool:requests', 0);
                if (result) {
                    const { reqId, sessionId } = JSON.parse(result[1]);
                    console.log(`[Worker] Allocating container for request ${reqId} (Session ${sessionId})`);
                    
                    const container = await containerPool.acquire();
                    
                    const responseKey = `container_pool:response:${reqId}`;
                    await redisClient.rpush(responseKey, JSON.stringify({ containerId: container.id }));
                    await redisClient.expire(responseKey, 30);
                }
            } catch (err: any) {
                console.error('[Worker] Error in container requests loop:', err);
                await new Promise((resolve) => setTimeout(resolve, 2000));
            }
        }
    }
    
    listenForContainerRequests().catch(err => {
        console.error('[Worker] Fatal container requests loop crash:', err);
    });

    interface JobPayload {
        code: string;
        sessionId: string;
    }

    const worker = new Worker<JobPayload, RunnerResult>(
        'code-execution',
        async (job: Job) => {
            const { code, sessionId } = job.data;
            const result = await runCode(code, sessionId);
            return result;
        },
        { connection, concurrency: 5 }
    );

    worker.on('completed', (job: Job, result: RunnerResult) => {
        console.log(`[Worker] Job ${job.id} (Session: ${job.data.sessionId}) finished with success: ${result.success}`);
    });

    worker.on('failed', (job: Job | undefined, err: Error) => {
        console.error(`[Worker] Job ${job?.id} failed: ${err.message}`);
    });

    console.log('[Worker] Daemon fully booted. Waiting for execution jobs...');

    async function gracefulShutdown(signal: string) {
        console.log(`[Worker] Received ${signal}. Shutting down worker...`);
        clearInterval(healthCheckTimer);
        await worker.close();
        await redisClient.quit();
        process.exit(0);
    }

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
}

main().catch(err => {
    console.error('[Worker] Bootstrap failed:', err);
    process.exit(1);
});