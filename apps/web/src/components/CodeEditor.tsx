import Editor from '@monaco-editor/react';

interface CodeEditorProps {
    code: string;
    onChange: (value: string) => void;
    onClear: () => void;
    onReset: () => void;
}

export default function CodeEditor({ code, onChange, onClear, onReset }: CodeEditorProps) {
    return (
        <div className="flex-1 bg-surface-card border border-hairline rounded-lg overflow-hidden flex flex-col min-h-[380px]">
            
            <div className="bg-canvas-soft border-b border-hairline px-4 py-2 flex items-center justify-between">
                <span className="text-[11px] font-mono font-medium text-body">main.py</span>
                
                <div className="flex space-x-2">
                    <button
                        onClick={onClear}
                        className="px-2 py-0.5 text-[11px] font-medium rounded bg-surface-card border border-hairline hover:bg-canvas text-body hover:text-ink transition-all duration-150 cursor-pointer"
                        title="Clear editor contents"
                    >
                        Clear
                    </button>
                    <button
                        onClick={onReset}
                        className="px-2 py-0.5 text-[11px] font-medium rounded bg-surface-card border border-hairline hover:bg-canvas text-body hover:text-ink transition-all duration-150 cursor-pointer"
                        title="Reset code payload"
                    >
                        Reset
                    </button>
                </div>
            </div>

            {/* Monaco Editor Container (Dark Theme) */}
            <div className="flex-1 bg-[#1e1e1e] p-1 relative min-h-[320px]">
                <Editor
                    height="100%"
                    language="python"
                    value={code}
                    onChange={(value) => onChange(value || '')}
                    theme="vs-dark"
                    options={{
                        minimap: { enabled: false },
                        fontSize: 13,
                        fontFamily: 'var(--font-mono)',
                        automaticLayout: true,
                        scrollBeyondLastLine: false,
                        lineNumbersMinChars: 3,
                        renderLineHighlight: 'all',
                        scrollbar: {
                            vertical: 'visible',
                            horizontal: 'visible',
                            verticalScrollbarSize: 6,
                            horizontalScrollbarSize: 6,
                        }
                    }}
                />
            </div>
        </div>
    );
}
