import { ExecutionStatus } from '../types';

interface ExecutionControlsProps {
    status: ExecutionStatus;
    jobId: string | null;
    exitCode: number | null;
    apiHealth: 'online' | 'offline' | 'checking';
    onRun: () => void;
}

export default function ExecutionControls({ status, jobId, exitCode, apiHealth, onRun }: ExecutionControlsProps) {
    const getStatusBadgeClass = () => {
        switch (status) {
            case 'idle': return 'bg-slate-800 text-slate-400 border border-slate-700';
            case 'submitting': return 'bg-amber-500/10 text-amber-400 border border-amber-500/30';
            case 'waiting': return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 animate-pulse';
            case 'active': return 'bg-blue-500/10 text-blue-400 border border-blue-500/30 animate-pulse';
            case 'completed': 
                return exitCode === 0 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/30';
            case 'failed': return 'bg-rose-500/10 text-rose-400 border border-rose-500/30';
            case 'rate-limited': return 'bg-red-500/20 text-red-400 border border-red-500/40';
            default: return 'bg-slate-800 text-slate-400';
        }
    };

    const isRunning = status === 'submitting' || status === 'waiting' || status === 'active';

    return (
        <div className="glass-panel rounded-xl p-5 flex items-center justify-between border border-white/8">
            <div>
                <div className="text-xs text-slate-400 font-semibold mb-1">EXECUTION STATE</div>
                <span className={`text-[11px] font-mono px-2.5 py-1 rounded-full uppercase font-bold tracking-wider ${getStatusBadgeClass()}`}>
                    {status.replace('-', ' ')}
                </span>
                {jobId && (
                    <div className="text-[10px] font-mono text-slate-500 mt-2 truncate max-w-[180px]">
                        ID: {jobId}
                    </div>
                )}
            </div>

            <button
                onClick={onRun}
                disabled={isRunning || apiHealth !== 'online'}
                className={`px-6 py-3 rounded-lg text-sm font-bold text-white shadow-lg transition-all duration-200 cursor-pointer ${
                    isRunning
                        ? 'bg-indigo-500/40 text-slate-300 cursor-not-allowed border border-indigo-500/20'
                        : apiHealth !== 'online'
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                        : 'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 hover:scale-[1.02] border border-indigo-400/20 hover:shadow-indigo-500/20'
                }`}
            >
                {status === 'submitting' ? 'Submitting...' :
                 status === 'waiting' ? 'Queued...' :
                 status === 'active' ? 'Executing...' : 'Run Code'}
            </button>
        </div>
    );
}
