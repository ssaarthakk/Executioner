import Docker from 'dockerode';
import { Redis } from 'ioredis';

const isWindows = process.platform === 'win32';
const docker = new Docker(isWindows ? { socketPath: '//./pipe/docker_engine' } : { socketPath: '/var/run/docker.sock' });

const redisHost = process.env.REDIS_HOST || '127.0.0.1';
const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);

const redisPublisher = new Redis({ host: redisHost, port: redisPort });
const redisSubscriber = new Redis({ host: redisHost, port: redisPort });

const MAX_OUTPUT_BYTES = 512 * 1024;
const MAX_BUFFER_CHUNKS = 500;
const TIMEOUT_MS = 30000;

export interface RunnerResult {
    success: boolean;
    exitCode: number | null;
    error?: string;
}

async function killPythonProcesses(container: Docker.Container): Promise<void> {
    try {
        const killExec = await container.exec({
            Cmd: ['pkill', '-9', '-x', 'python3'],
            AttachStdout: false,
            AttachStderr: false
        });
        const killStream = await killExec.start({});
        await new Promise<void>((resolve) => {
            killStream.on('data', () => { });
            killStream.on('end', () => resolve());
            killStream.on('error', () => resolve());
        });
    } catch (err: any) {
        console.log(`[Runner] Python process kill failed: ${err.message}`);
    }
}

export async function runCode(code: string, sessionId: string): Promise<RunnerResult> {
    const sessionKey = `session:${sessionId}`;
    const containerId = await redisPublisher.hget(sessionKey, 'containerId');

    if (!containerId) {
        throw new Error(`No container pinned to session ${sessionId}`);
    }

    const container = docker.getContainer(containerId);
    console.log(`[Runner] Starting code execution for session ${sessionId} in container ${containerId.slice(0, 12)}`);

    await killPythonProcesses(container);

    const codeBase64 = Buffer.from(code).toString('base64');
    try {
        const writeExec = await container.exec({
            Cmd: ['sh', '-c', `echo "${codeBase64}" | base64 -d > /tmp/user_code.py`],
            AttachStdout: true,
            AttachStderr: true
        });
        const writeStream = await writeExec.start({});
        await new Promise<void>((resolve, reject) => {
            writeStream.on('data', () => { });
            writeStream.on('end', () => resolve());
            writeStream.on('error', reject);
        });
    } catch (err: any) {
        console.error(`[Runner] Failed to write code to container for session ${sessionId}:`, err);
        return { success: false, exitCode: null, error: 'Failed to write code to sandbox' };
    }

    await redisPublisher.hset(sessionKey, { status: 'running' });
    const runningMsg = JSON.stringify({ type: 'running' });
    await redisPublisher.publish(`output:${sessionId}`, runningMsg);

    const runExec = await container.exec({
        Cmd: ['python3', '-u', '/tmp/user_code.py'],
        AttachStdin: true,
        AttachStdout: true,
        AttachStderr: true,
        Tty: true
    });

    const runStream = await runExec.start({ hijack: true, stdin: true });

    const stdinChannel = `stdin:${sessionId}`;
    const resizeChannel = `resize:${sessionId}`;
    const cancelChannel = `cancel:${sessionId}`;
    let isTerminated = false;

    const handleRedisMessage = async (channel: string, message: string) => {
        try {
            if (channel === stdinChannel) {
                const buffer = Buffer.from(message, 'base64');
                runStream.write(buffer);
            } else if (channel === resizeChannel) {
                const { cols, rows } = JSON.parse(message);
                runExec.resize({ h: rows, w: cols }).catch(() => { });
            } else if (channel === cancelChannel) {
                console.log(`[Runner] Cancel request received for session ${sessionId}`);
                isTerminated = true;

                await killPythonProcesses(container);

                runStream.destroy();
            }
        } catch (err: any) {
            console.error(`[Runner] Error processing channel message:`, err.message);
        }
    };

    await redisSubscriber.subscribe(stdinChannel, resizeChannel, cancelChannel);
    redisSubscriber.on('message', handleRedisMessage);

    const timeoutTimer = setTimeout(async () => {
        if (isTerminated) return;
        isTerminated = true;
        console.log(`[Runner] Timeout (30s) reached for session ${sessionId}`);

        const timeoutMsg = JSON.stringify({
            type: 'error',
            message: 'TimeoutError: Code execution exceeded the 30 second limit'
        });
        await redisPublisher.publish(`output:${sessionId}`, timeoutMsg);
        await redisPublisher.rpush(`outbuf:${sessionId}`, timeoutMsg);

        await killPythonProcesses(container);

        runStream.destroy();
    }, TIMEOUT_MS);

    let outputBytesTotal = 0;

    const onData = async (chunk: Buffer) => {
        if (isTerminated) return;

        outputBytesTotal += chunk.length;
        if (outputBytesTotal > MAX_OUTPUT_BYTES) {
            isTerminated = true;
            console.log(`[Runner] Output limit exceeded (${MAX_OUTPUT_BYTES} bytes) for session ${sessionId}`);

            const errorMsg = JSON.stringify({
                type: 'error',
                message: `Output limit exceeded (${MAX_OUTPUT_BYTES / 1024} KB limit)`
            });
            await redisPublisher.publish(`output:${sessionId}`, errorMsg);
            await redisPublisher.rpush(`outbuf:${sessionId}`, errorMsg);

            await killPythonProcesses(container);

            runStream.destroy();
            return;
        }

        const outputMsg = JSON.stringify({
            type: 'output',
            data: chunk.toString('base64')
        });

        await redisPublisher.publish(`output:${sessionId}`, outputMsg);

        const bufferKey = `outbuf:${sessionId}`;
        await redisPublisher.multi()
            .rpush(bufferKey, outputMsg)
            .ltrim(bufferKey, -MAX_BUFFER_CHUNKS, -1)
            .expire(bufferKey, 300)
            .exec();
    };

    runStream.on('data', onData);

    await new Promise<void>((resolve) => {
        runStream.on('end', () => resolve());
        runStream.on('error', () => resolve());
    });

    clearTimeout(timeoutTimer);
    await redisSubscriber.unsubscribe(stdinChannel, resizeChannel, cancelChannel);
    redisSubscriber.off('message', handleRedisMessage);

    let exitCode = null;
    try {
        const inspectResult = await runExec.inspect();
        exitCode = inspectResult.ExitCode;
    } catch (err: any) {
        console.log(`[Runner] Failed to inspect exec exit code: ${err.message}`);
    }

    console.log(`[Runner] Execution finished for session ${sessionId} with exit code ${exitCode}`);

    await redisPublisher.hset(sessionKey, { status: 'idle' });

    const doneMsg = JSON.stringify({
        type: 'done',
        exitCode
    });
    await redisPublisher.publish(`output:${sessionId}`, doneMsg);
    await redisPublisher.rpush(`outbuf:${sessionId}`, doneMsg);

    return { success: true, exitCode };
}