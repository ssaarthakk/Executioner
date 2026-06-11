import 'dotenv/config';
import { Worker, Job } from 'bullmq';
import { runCode, ExecutionResult } from './runner.js';

const connection = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
};

interface JobPayload {
    code: string;
}

const worker = new Worker<JobPayload, ExecutionResult>(
    'code-execution',
    async (job: Job) => {
        const { code } = job.data;
        const result = await runCode(code);
        return result;
    },
    { connection, concurrency: 5 }
);

worker.on('completed', (job: Job, result: ExecutionResult) => {
    console.log(`Job ${job.id} done. Exit: ${result.exitCode}`);
});

worker.on('failed', (job: Job | undefined, err: Error) => {
    console.error(`Job ${job?.id} failed: ${err.message}`);
});

console.log('Worker running. Waiting for jobs...');

async function gracefulShutdown(signal: string) {
    console.log(`Received ${signal}, closing worker...`);
    await worker.close();
    process.exit(0);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));