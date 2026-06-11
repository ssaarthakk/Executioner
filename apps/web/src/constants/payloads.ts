import { SecurityPayload } from '../types';

export const SECURITY_PAYLOADS: SecurityPayload[] = [
    {
        id: 'normal',
        name: 'Normal Execution',
        description: 'Runs simple Python code and prints the output.',
        expectedBehavior: 'Logs "4" to stdout.',
        code: `print(2 + 2)\n`
    },
    {
        id: 'timeout',
        name: 'Infinite Loop',
        description: 'Runs an infinite while loop to exceed runtime bounds.',
        expectedBehavior: 'Terminated after 5 seconds by the container runtime.',
        code: `while True:\n    pass\n`
    },
    {
        id: 'passwd',
        name: 'Read /etc/passwd',
        description: 'Attempts to read confidential system files from host.',
        expectedBehavior: 'Fails with PermissionError due to read-only container filesystem.',
        code: `try:\n    with open('/etc/passwd', 'r') as f:\n        print(f.read())\nexcept Exception as e:\n    print(f"Failed: {type(e).__name__}: {e}")\n`
    },
    {
        id: 'secrets',
        name: 'Read .env Secrets',
        description: 'Attempts to locate and read environment files containing secrets.',
        expectedBehavior: 'Fails with FileNotFoundError (host secrets are never mounted).',
        code: `try:\n    with open('/app/.env', 'r') as f:\n        print(f.read())\nexcept Exception as e:\n    print(f"Failed: {type(e).__name__}: {e}")\n`
    },
    {
        id: 'network',
        name: 'Network Request',
        description: 'Attempts to initiate outbound sockets or HTTP request exfiltration.',
        expectedBehavior: 'Fails with OSError due to network-disabled sandbox (--network=none).',
        code: `import urllib.request\ntry:\n    urllib.request.urlopen('http://google.com', timeout=3)\n    print("Success: Connected to internet!")\nexcept Exception as e:\n    print(f"Failed: {type(e).__name__}: {e}")\n`
    },
    {
        id: 'fork',
        name: 'Fork Bomb',
        description: 'Attempts to exhaust host process PID pool by spawning sub-processes.',
        expectedBehavior: 'Spawning processes is restricted and terminated by container PID limits.',
        code: `import os\ntry:\n    while True:\n        os.fork()\nexcept Exception as e:\n    print(f"Failed: {type(e).__name__}: {e}")\n`
    },
    {
        id: 'memory',
        name: 'Memory Bomb',
        description: 'Attempts to allocate huge strings to exhaust server memory.',
        expectedBehavior: 'Fails with MemoryError due to container cgroup memory limits (128 MB).',
        code: `try:\n    large_string = ' ' * (10**9)\n    print("Success: Allocated memory!")\nexcept Exception as e:\n    print(f"Failed: {type(e).__name__}: {e}")\n`
    }
];
