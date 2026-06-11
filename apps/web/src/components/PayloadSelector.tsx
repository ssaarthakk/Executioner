import { SecurityPayload } from '../types';

interface PayloadSelectorProps {
    payloads: SecurityPayload[];
    selectedId: string;
    onSelect: (payload: SecurityPayload) => void;
}

export default function PayloadSelector({ payloads, selectedId, onSelect }: PayloadSelectorProps) {
    const currentPayload = payloads.find(p => p.id === selectedId);

    return (
        <div className="glass-panel rounded-xl p-4 flex flex-col space-y-3">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                Sandbox Security Payloads
            </h2>
            <div className="flex flex-wrap gap-2">
                {payloads.map(payload => (
                    <button
                        key={payload.id}
                        onClick={() => onSelect(payload)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                            selectedId === payload.id
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 border border-indigo-500'
                                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/50'
                        }`}
                    >
                        {payload.name}
                    </button>
                ))}
            </div>

            {currentPayload && (
                <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-lg text-xs space-y-1">
                    <p className="text-slate-300">
                        <span className="font-semibold text-indigo-400">Intent:</span> {currentPayload.description}
                    </p>
                    <p className="text-slate-400">
                        <span className="font-semibold text-slate-300">Expected Result:</span> {currentPayload.expectedBehavior}
                    </p>
                </div>
            )}
        </div>
    );
}
