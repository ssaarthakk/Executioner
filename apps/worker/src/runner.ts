import { spawn } from 'node:child_process';

export interface ExecutionResult {
    stdout: string;
    exitCode: number | null;
}

export async function runCode(code: string): Promise<ExecutionResult> {
    return new Promise((resolve, reject) => {
        
        const proc = spawn('docker', [
            'run',
            '--rm',              // delete container after it exits
            '--network=none',    // NO network access
            '--read-only',       // filesystem is read-only
            '--tmpfs=/sandbox:size=10m,noexec,uid=10000,gid=10000,mode=1777', // writable scratch, 10 MB only
            '--memory=128m',     // max 128 MB RAM
            '--memory-swap=128m',// disable swap
            '--cpus=0.5',        // max 0.5 CPU cores
            '--pids-limit=64',   // max 64 processes
            '--cap-drop=ALL',    // drop every Linux capability
            '--security-opt=no-new-privileges', // no privilege escalation
            '-i',                // interactive: allows STDIN pipe
            'python-sandbox:latest'
        ]);

        proc.stdin.write(code);
        proc.stdin.end();

        let stdout = '';
        let stderr = '';
        const MAX_OUTPUT = 100_000;

        proc.stdout.on('data', (chunk: Buffer) => {
            stdout += chunk.toString();
            if (stdout.length > MAX_OUTPUT) {
                stdout = stdout.slice(0, MAX_OUTPUT) + '\n[output truncated]';
                proc.kill();
            }
        });

        proc.stderr.on('data', (chunk: Buffer) => {
            stderr += chunk.toString();
        });

        const timer = setTimeout(() => {
            proc.kill('SIGKILL');
            reject(new Error('Execution timed out'));
        }, 8000);

        proc.on('close', (exitCode: number | null) => {
            clearTimeout(timer);
            resolve({ stdout: stdout || stderr, exitCode });
        });

        proc.on('error', reject);
    });
}