import { ExecutionStatus } from '../types';

interface TimelineProps {
    status: ExecutionStatus;
    exitCode: number | null;
}

export default function Timeline({ status, exitCode }: TimelineProps) {
    const isThinking = status === 'submitting' || status === 'waiting' || status === 'active' || status === 'completed' || status === 'failed';
    const isQueued = status === 'waiting' || status === 'active' || status === 'completed' || status === 'failed';
    const isAcquired = status === 'active' || status === 'completed' || status === 'failed';
    const isExecuting = status === 'active' || status === 'completed';
    const isFinished = status === 'completed' || status === 'failed' || status === 'rate-limited';

    const steps = [
        {
            id: 'thinking',
            label: 'Thinking',
            description: 'API Validation',
            activeClass: 'bg-timeline-thinking text-[#26251e] border-timeline-thinking',
            isActive: isThinking,
        },
        {
            id: 'queued',
            label: 'Queued',
            description: 'Redis Enqueue',
            activeClass: 'bg-timeline-grep text-[#26251e] border-timeline-grep',
            isActive: isQueued,
        },
        {
            id: 'acquired',
            label: 'Acquired',
            description: 'Worker Pull',
            activeClass: 'bg-timeline-read text-[#26251e] border-timeline-read',
            isActive: isAcquired,
        },
        {
            id: 'executing',
            label: 'Executing',
            description: 'Docker Sandbox',
            activeClass: 'bg-timeline-edit text-[#26251e] border-timeline-edit',
            isActive: isExecuting && status === 'active',
        },
        {
            id: 'finished',
            label: status === 'rate-limited' ? 'Rejected' : 'Finished',
            description: status === 'rate-limited' ? 'Rate Limited' : exitCode === 0 ? 'Success (Done)' : 'Failed (Exit error)',
            activeClass: status === 'rate-limited' 
                ? 'bg-semantic-error text-white border-semantic-error'
                : status === 'failed' || (exitCode !== null && exitCode !== 0)
                ? 'bg-semantic-error text-white border-semantic-error'
                : 'bg-timeline-done text-white border-timeline-done',
            isActive: isFinished,
        }
    ];

    return (
        <div className="flex flex-col space-y-3.5">
            <div className="text-[10px] uppercase font-mono tracking-[0.08em] text-body font-bold">
                Agent Action Timeline
            </div>
            
            <div className="grid grid-cols-5 gap-2">
                {steps.map((step) => {
                    const activeState = step.isActive;
                    return (
                        <div key={step.id} className="flex flex-col items-center">
                            
                            <div className={`w-full py-2 px-1 text-center rounded-full text-[10px] font-bold tracking-[0.05em] uppercase border transition-all duration-300 font-mono flex items-center justify-center min-h-[30px] ${
                                activeState 
                                    ? step.activeClass 
                                    : 'bg-canvas-soft text-muted border-hairline-soft'
                            }`}>
                                {step.label}
                            </div>
                                                
                            <div className="mt-1.5 text-center">
                                <div className={`text-[9px] font-medium transition-colors ${
                                    activeState ? 'text-ink font-semibold' : 'text-muted-soft'
                                }`}>
                                    {step.description}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
