import Editor from '@monaco-editor/react';

interface CodeEditorProps {
    code: string;
    onChange: (value: string) => void;
    onClear: () => void;
    onReset: () => void;
}

export default function CodeEditor({ code, onChange, onClear, onReset }: CodeEditorProps) {
    return (
        <div className="flex-1 glass-panel rounded-xl overflow-hidden flex flex-col border border-white/8 min-h-[350px]">

            <div className="bg-slate-900/80 border-b border-white/8 px-4 py-2.5 flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400">main.py</span>
                <div className="flex space-x-2">
                    <button
                        onClick={onClear}
                        className="px-2.5 py-1 text-[11px] rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition duration-150 cursor-pointer"
                        title="Clear Editor"
                    >
                        Clear
                    </button>
                    <button
                        onClick={onReset}
                        className="px-2.5 py-1 text-[11px] rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition duration-150 cursor-pointer"
                        title="Reset Code"
                    >
                        Reset
                    </button>
                </div>
            </div>

            <div className="flex-1 bg-[#1e1e1e] p-1 relative min-h-[300px]">
                <Editor
                    height="100%"
                    language="python"
                    value={code}
                    onChange={(value) => onChange(value || '')}
                    theme="vs-dark"
                    options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        fontFamily: 'var(--font-mono)',
                        automaticLayout: true,
                        scrollBeyondLastLine: false,
                        lineNumbersMinChars: 3,
                    }}
                />
            </div>
        </div>
    );
}
