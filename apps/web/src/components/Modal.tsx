interface ModalProps {
    isOpen: boolean;
    title: string;
    content: string;
    onClose: () => void;
}

export default function Modal({ isOpen, title, content, onClose }: ModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
                className="absolute inset-0 bg-canvas/80 backdrop-blur-sm transition-opacity duration-300"
                onClick={onClose}
            />

            <div className="bg-surface-card border border-hairline rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col z-10 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="bg-canvas-soft border-b border-hairline px-6 py-4 flex items-center justify-between">
                    <h3 className="text-sm font-bold tracking-tight text-ink uppercase text-[11px] tracking-[0.08em] font-mono">
                        {title}
                    </h3>
                    <button 
                        onClick={onClose}
                        className="text-body hover:text-ink text-lg font-bold leading-none cursor-pointer p-1"
                        aria-label="Close modal"
                    >
                        &times;
                    </button>
                </div>

                <div className="p-6 overflow-y-auto text-xs text-body leading-relaxed whitespace-pre-wrap font-sans select-text max-h-[60vh]">
                    {content}
                </div>

                <div className="bg-canvas-soft border-t border-hairline px-6 py-3.5 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded text-xs font-bold bg-ink text-canvas hover:bg-muted border border-ink cursor-pointer transition-all duration-150"
                    >
                        Acknowledge & Close
                    </button>
                </div>
            </div>
        </div>
    );
}
