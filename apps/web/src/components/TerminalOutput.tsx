import { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import 'xterm/css/xterm.css';

interface TerminalOutputProps {
    subscribeToTerminal: (callback: (data: string) => void) => () => void;
    sendStdin: (data: string) => void;
    sendResize: (cols: number, rows: number) => void;
    exitCode: number | null;
}

export default function TerminalOutput({ 
    subscribeToTerminal, 
    sendStdin, 
    sendResize,
    exitCode 
}: TerminalOutputProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const terminalRef = useRef<Terminal | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const term = new Terminal({
            cursorBlink: true,
            fontSize: 12,
            fontFamily: 'var(--font-mono)',
            theme: {
                background: '#252522',
                foreground: '#efeee8',
                cursor: '#efeee8',
                selectionBackground: 'rgba(255, 255, 255, 0.15)'
            },
            convertEol: true
        });

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        term.loadAddon(new WebLinksAddon());

        term.open(containerRef.current);
        
        setTimeout(() => {
            try {
                fitAddon.fit();
                sendResize(term.cols, term.rows);
            } catch (e) {}
        }, 50);

        terminalRef.current = term;
        fitAddonRef.current = fitAddon;

        term.clear();
        term.writeln('\x1b[33mEstablishing connection to execution gateway...\x1b[0m');

        const unsubscribe = subscribeToTerminal((data) => {
            term.write(data);
        });

        const onDataDisposable = term.onData((data) => {
            sendStdin(data);
        });

        const onResizeDisposable = term.onResize(({ cols, rows }) => {
            sendResize(cols, rows);
        });

        const resizeObserver = new ResizeObserver(() => {
            try {
                fitAddon.fit();
                sendResize(term.cols, term.rows);
            } catch (e) {}
        });
        resizeObserver.observe(containerRef.current);

        return () => {
            unsubscribe();
            onDataDisposable.dispose();
            onResizeDisposable.dispose();
            resizeObserver.disconnect();
            term.dispose();
        };
    }, [subscribeToTerminal, sendStdin, sendResize]);

    return (
        <div className="flex-grow bg-surface-card border border-hairline rounded-lg overflow-hidden flex flex-col min-h-[380px]">
            <div className="bg-canvas-soft border-b border-hairline px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-hairline-strong" />
                    <div className="w-2.5 h-2.5 rounded-full bg-hairline" />
                    <div className="w-2.5 h-2.5 rounded-full bg-hairline-soft" />
                    <span className="text-[11px] font-mono font-medium text-body pl-2">sandbox pty terminal</span>
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

            <div className="flex-1 bg-canvas-soft p-2 overflow-hidden min-h-[320px] relative" ref={containerRef} />
        </div>
    );
}
