export type ExecutionStatus = 
    | 'idle' 
    | 'submitting' 
    | 'waiting' 
    | 'active' 
    | 'completed' 
    | 'failed' 
    | 'rate-limited';

export interface SecurityPayload {
    id: string;
    name: string;
    description: string;
    expectedBehavior: string;
    code: string;
}

export interface JobResponse {
    jobId?: string;
    error?: string;
}

export interface PollResult {
    stdout: string;
    exitCode: number | null;
}

export interface PollResponse {
    status: 'waiting' | 'active' | 'done' | 'error';
    result?: PollResult;
    error?: string;
}
