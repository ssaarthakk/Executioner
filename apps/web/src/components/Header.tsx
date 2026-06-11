interface HeaderProps {
    apiHealth: 'online' | 'offline' | 'checking';
}

export default function Header({ apiHealth }: HeaderProps) {
    return (
        <header className="glass-panel border-t-0 border-x-0 px-6 py-4 flex items-center justify-between z-10">
            <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20">
                    P
                </div>
                <div>
                    <h1 className="text-lg font-bold tracking-tight text-white flex items-center">
                        SECURE RUNNER
                        <span className="ml-2 text-[10px] font-medium px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                            PYTHON 3.12
                        </span>
                    </h1>
                </div>
            </div>

            <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center space-x-2">
                    <span className="text-slate-400">API Connection:</span>
                    <div className="flex items-center space-x-1.5">
                        <span className={`w-2 h-2 rounded-full ${
                            apiHealth === 'online' ? 'bg-emerald-500' :
                            apiHealth === 'offline' ? 'bg-rose-500' : 'bg-slate-500'
                        }`} />
                        <span className={`font-semibold capitalize ${
                            apiHealth === 'online' ? 'text-emerald-400' :
                            apiHealth === 'offline' ? 'text-rose-400' : 'text-slate-400'
                        }`}>
                            {apiHealth}
                        </span>
                    </div>
                </div>
            </div>
        </header>
    );
}
