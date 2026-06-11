import { useState } from 'react';
import { useCodeExecution } from './hooks/useCodeExecution';
import { SECURITY_PAYLOADS } from './constants/payloads';
import Header from './components/Header';
import PayloadSelector from './components/PayloadSelector';
import CodeEditor from './components/CodeEditor';
import ExecutionControls from './components/ExecutionControls';
import TerminalOutput from './components/TerminalOutput';
import Modal from './components/Modal';
import { TERMS_OF_SERVICE, PRIVACY_POLICY } from './constants/legal';

export default function App() {
    const {
        code,
        setCode,
        selectedPayloadId,
        setSelectedPayloadId,
        status,
        jobId,
        stdout,
        exitCode,
        errorMessage,
        apiHealth,
        loadPayload,
        handleRunCode,
        handleClearEditor,
        handleResetEditor
    } = useCodeExecution();

    const [isTermsOpen, setIsTermsOpen] = useState(false);
    const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

    return (
        <div className="flex flex-col min-h-screen bg-canvas text-ink">
            <Header apiHealth={apiHealth} />

            <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 p-6 overflow-hidden">
                <div className="lg:col-span-7 flex flex-col space-y-4 min-h-[500px]">
                    <PayloadSelector
                        payloads={SECURITY_PAYLOADS}
                        selectedId={selectedPayloadId}
                        onSelect={loadPayload}
                    />

                    <CodeEditor
                        code={code}
                        onChange={(value) => {
                            setCode(value);
                            setSelectedPayloadId('');
                        }}
                        onClear={handleClearEditor}
                        onReset={handleResetEditor}
                    />
                </div>

                <div className="lg:col-span-5 flex flex-col space-y-4">
                    <ExecutionControls
                        status={status}
                        jobId={jobId}
                        exitCode={exitCode}
                        apiHealth={apiHealth}
                        onRun={handleRunCode}
                    />

                    <TerminalOutput
                        stdout={stdout}
                        exitCode={exitCode}
                        errorMessage={errorMessage}
                    />
                </div>
            </main>

            <footer className="py-4 text-center border-t border-hairline bg-canvas-soft text-[10px] tracking-wide text-body font-mono flex items-center justify-center space-x-4">
                <span>Secure Code Execution Sandbox System &copy; 2026.</span>
                <button 
                    onClick={() => setIsTermsOpen(true)}
                    className="hover:text-ink hover:underline cursor-pointer font-bold"
                >
                    Terms of Service
                </button>
                <span className="text-hairline-strong">|</span>
                <button 
                    onClick={() => setIsPrivacyOpen(true)}
                    className="hover:text-ink hover:underline cursor-pointer font-bold"
                >
                    Privacy Policy
                </button>
            </footer>

            <Modal 
                isOpen={isTermsOpen}
                title="Terms of Service"
                content={TERMS_OF_SERVICE}
                onClose={() => setIsTermsOpen(false)}
            />

            <Modal 
                isOpen={isPrivacyOpen}
                title="Privacy Policy"
                content={PRIVACY_POLICY}
                onClose={() => setIsPrivacyOpen(false)}
            />
        </div>
    );
}
