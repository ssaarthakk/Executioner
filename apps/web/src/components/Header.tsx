interface HeaderProps {
    apiHealth: 'online' | 'offline' | 'checking';
}

export default function Header({ apiHealth }: HeaderProps) {
    return (
        <header className="bg-canvas border-b border-hairline px-6 py-4 flex items-center justify-between z-10">
            <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-white font-mono font-bold tracking-tighter text-sm">
                    Ex
                </div>
                <div>
                    <h1 className="text-md font-bold tracking-tight text-ink flex items-center">
                        EXECUTIONER
                        <span className="ml-2.5 text-[10px] font-mono tracking-wider px-2 py-0.5 rounded bg-surface-strong text-ink border border-hairline-strong font-medium">
                            SANDBOX v3.12
                        </span>
                    </h1>
                </div>
            </div>

            <div className="flex items-center space-x-6 text-xs font-medium">
                <div className="flex items-center space-x-2">
                    <span className="text-body font-normal">API Connection:</span>
                    <div className="flex items-center space-x-1.5 px-2 py-1 rounded bg-canvas-soft border border-hairline">
                        <span className={`w-2.5 h-2.5 rounded-full border border-white/20 ${
                            apiHealth === 'online' ? 'bg-semantic-success' :
                            apiHealth === 'offline' ? 'bg-semantic-error' : 'bg-muted'
                        }`} />
                        <span className={`font-mono uppercase text-[10px] font-bold ${
                            apiHealth === 'online' ? 'text-semantic-success' :
                            apiHealth === 'offline' ? 'text-semantic-error' : 'text-body'
                        }`}>
                            {apiHealth}
                        </span>
                    </div>
                </div>
            </div>
        </header>
    );
}
