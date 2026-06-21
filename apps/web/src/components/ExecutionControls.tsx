import { ExecutionStatus } from '../types';
import Timeline from './Timeline';

interface ExecutionControlsProps {
    status: ExecutionStatus;
    jobId: string | null;
    exitCode: number | null;
    apiHealth: 'online' | 'offline' | 'checking';
    onRun: () => void;
    onCancel: () => void;
}

export default function ExecutionControls({ status, jobId, exitCode, apiHealth, onRun, onCancel }: ExecutionControlsProps) {
    const getStatusBadgeClass = () => {
        switch (status) {
            case 'idle': return 'bg-canvas-soft text-body border-hairline';
            case 'submitting': return 'bg-timeline-thinking/20 text-timeline-thinking border-timeline-thinking/40';
            case 'waiting': return 'bg-timeline-grep/20 text-timeline-grep border-timeline-grep/40 animate-pulse';
            case 'active': return 'bg-timeline-read/20 text-timeline-read border-timeline-read/40 animate-pulse';
            case 'completed': 
                return exitCode === 0 
                    ? 'bg-semantic-success/10 text-semantic-success border-semantic-success/20' 
                    : 'bg-semantic-error/10 text-semantic-error border-semantic-error/20';
            case 'failed': return 'bg-semantic-error/10 text-semantic-error border-semantic-error/20';
            case 'rate-limited': return 'bg-semantic-error/15 text-semantic-error border-semantic-error/30';
            default: return 'bg-canvas-soft text-body border-hairline';
        }
    };

    const isRunning = status === 'submitting' || status === 'waiting' || status === 'active';

    return (
        <div className="bg-surface-card border border-hairline rounded-lg p-5 flex flex-col space-y-5">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <div className="text-[10px] uppercase font-mono tracking-[0.08em] text-body font-bold">
                        Execution State
                    </div>
                    
                    <div className="flex items-center space-x-2">
                        <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 border rounded-full ${getStatusBadgeClass()}`}>
                            {status.replace('-', ' ')}
                        </span>
                        
                        {jobId && (
                            <span className="text-[10px] font-mono text-muted truncate max-w-[120px]" title={jobId}>
                                ID: {jobId.slice(0, 8)}...
                            </span>
                        )}
                    </div>
                </div>

                {isRunning ? (
                    <button
                        onClick={onCancel}
                        className="px-5 py-2.5 rounded text-xs font-bold bg-semantic-error hover:bg-semantic-error/85 text-white border border-semantic-error/10 hover:scale-[1.01] transition-all duration-150 cursor-pointer"
                        title="Force kill container execution"
                    >
                        Cancel Run
                    </button>
                ) : (
                    <button
                        onClick={onRun}
                        disabled={apiHealth !== 'online'}
                        className={`px-5 py-2.5 rounded text-xs font-bold text-on-primary transition-all duration-150 cursor-pointer ${
                            apiHealth !== 'online'
                                ? 'bg-canvas-soft text-muted border border-hairline cursor-not-allowed'
                                : 'bg-primary hover:bg-primary-active text-white border border-primary/10 hover:scale-[1.01]'
                        }`}
                    >
                        Run Code
                    </button>
                )}
            </div>
            
            <hr className="border-t border-hairline-soft" />

            <Timeline status={status} exitCode={exitCode} />
        </div>
    );
}
