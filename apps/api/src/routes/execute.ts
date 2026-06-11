import { Router, Request, Response } from 'express';
import { Queue } from 'bullmq';
import { v4 as uuidv4 } from 'uuid';
import { validateCode } from '../middleware/validate.js';
import { limiter } from '../middleware/rateLimiter.js';

const router = Router();

const connection = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
};

interface JobPayload {
    code: string;
}

interface ExecutionResult {
    stdout: string;
    exitCode: number | null;
}

const queue = new Queue<JobPayload, ExecutionResult>('code-execution', { connection });

router.post('/', limiter, validateCode, async (req: Request, res: Response) => {
    try {
        const { code } = req.body;
        const jobId = uuidv4();
        await queue.add('run', { code }, { jobId });
        res.json({ jobId });
    } catch (err: any) {
        console.error('Failed to queue job:', err);
        res.status(500).json({ error: 'Failed to queue job' });
    }
});

router.get('/:jobId', async (req: Request, res: Response) => {
    try {
        const { jobId } = req.params;
        if (typeof jobId !== 'string') {
            res.status(400).json({ error: 'Invalid job ID' });
            return;
        }
        const job = await queue.getJob(jobId);

        if (!job) {
            res.status(404).json({ error: 'Job not found' });
            return;
        }

        const state = await job.getState();

        if (state === 'completed') {
            res.json({ status: 'done', result: job.returnvalue });
            return;
        }

        if (state === 'failed') {
            res.json({ status: 'error', error: job.failedReason || 'Job execution failed' });
            return;
        }

        res.json({ status: state });
    } catch (err: any) {
        console.error(`Failed to get job status for ${req.params.jobId}:`, err);
        res.status(500).json({ error: 'Failed to retrieve job details' });
    }
});

export default router;