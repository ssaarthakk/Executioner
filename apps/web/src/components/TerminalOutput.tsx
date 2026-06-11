interface TerminalOutputProps {
    stdout: string;
    exitCode: number | null;
    errorMessage: string | null;
}

export default function TerminalOutput({ stdout, exitCode, errorMessage }: TerminalOutputProps) {
    return (
        <div className="flex-1 bg-surface-card border border-hairline rounded-lg overflow-hidden flex flex-col min-h-[380px]">
            
            <div className="bg-canvas-soft border-b border-hairline px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-hairline-strong" />
                    <div className="w-2.5 h-2.5 rounded-full bg-hairline" />
                    <div className="w-2.5 h-2.5 rounded-full bg-hairline-soft" />
                    <span className="text-[11px] font-mono font-medium text-body pl-2">stdout / stderr</span>
                </div>

                {exitCode !== null && (
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                        exitCode === 0 
                            ? 'bg-semantic-success/15 text-semantic-success border-semantic-success/30' 
                            : 'bg-semantic-error/15 text-semantic-error border-semantic-error/30'
                    }`}>
                        exit code: {exitCode}
                    </span>
                )}
            </div>

            
            <div className="flex-1 bg-canvas-soft p-4 overflow-y-auto font-mono text-xs text-ink whitespace-pre-wrap leading-relaxed select-text min-h-[320px]">
                {stdout || 'Console idle. Run python script to capture outputs.'}
            </div>

            
            {errorMessage && (
                <div className="bg-semantic-error/10 border-t border-semantic-error/25 p-4 text-xs">
                    <div className="flex space-x-2">
                        <span className="text-semantic-error font-bold">Error:</span>
                        <p className="text-semantic-error font-medium leading-normal">{errorMessage}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
