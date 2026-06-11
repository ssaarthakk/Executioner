import { SecurityPayload } from '../types';

interface PayloadSelectorProps {
    payloads: SecurityPayload[];
    selectedId: string;
    onSelect: (payload: SecurityPayload) => void;
}

export default function PayloadSelector({ payloads, selectedId, onSelect }: PayloadSelectorProps) {
    const currentPayload = payloads.find(p => p.id === selectedId);

    return (
        <div className="bg-surface-card border border-hairline rounded-lg p-5 flex flex-col space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold tracking-tight text-ink uppercase text-[11px] tracking-[0.08em] font-mono">
                    Sandbox Security Scenarios
                </h2>
            </div>
            
            <div className="flex flex-wrap gap-2">
                {payloads.map(payload => (
                    <button
                        key={payload.id}
                        onClick={() => onSelect(payload)}
                        className={`px-3 py-1.5 rounded text-xs font-medium border transition-all duration-150 cursor-pointer ${
                            selectedId === payload.id
                                ? 'bg-ink text-canvas border-ink shadow-sm'
                                : 'bg-canvas-soft hover:bg-surface-card hover:border-hairline-strong text-body border-hairline'
                        }`}
                    >
                        {payload.name}
                    </button>
                ))}
            </div>

            {currentPayload && (
                <div className="p-3.5 bg-canvas-soft border border-hairline-soft rounded-md text-xs space-y-1.5">
                    <p className="text-body leading-relaxed">
                        <span className="font-semibold text-ink">Exploit Target:</span> {currentPayload.description}
                    </p>
                    <p className="text-muted leading-relaxed">
                        <span className="font-semibold text-body">Sandbox Defense Limit:</span> {currentPayload.expectedBehavior}
                    </p>
                </div>
            )}
        </div>
    );
}
