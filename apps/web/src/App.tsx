import { useCodeExecution } from './hooks/useCodeExecution';
import { SECURITY_PAYLOADS } from './constants/payloads';
import Header from './components/Header';
import PayloadSelector from './components/PayloadSelector';
import CodeEditor from './components/CodeEditor';
import ExecutionControls from './components/ExecutionControls';
import TerminalOutput from './components/TerminalOutput';

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

    return (
        <div className="flex flex-col min-h-screen">
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
        </div>
    );
}
