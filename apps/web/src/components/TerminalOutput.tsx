interface TerminalOutputProps {
    stdout: string;
    exitCode: number | null;
    errorMessage: string | null;
}

export default function TerminalOutput({ stdout, exitCode, errorMessage }: TerminalOutputProps) {
    return (
        <div className="flex-1 glass-panel rounded-xl overflow-hidden flex flex-col border border-white/8 min-h-[350px]">

            <div className="bg-slate-900/80 border-b border-white/8 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500" />
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-xs font-mono text-slate-400 pl-2">stdout / stderr</span>
                </div>

                {exitCode !== null && (
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                        exitCode === 0 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}>
                        exit code: {exitCode}
                    </span>
                )}
            </div>

            <div className="flex-1 terminal-panel p-4 overflow-y-auto text-xs text-slate-300 whitespace-pre-wrap leading-relaxed select-text min-h-[300px]">
                {stdout || 'Ready for execution. Click "Run Code" to execute python.'}
            </div>

            {errorMessage && (
                <div className="bg-rose-500/10 border-t border-rose-500/20 p-4">
                    <div className="flex space-x-2">
                        <span className="text-rose-400 font-bold">⚠️ Error:</span>
                        <p className="text-xs text-rose-300 font-medium leading-normal">{errorMessage}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
