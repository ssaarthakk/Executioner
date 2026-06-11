export const TERMS_OF_SERVICE = `
1. ACCEPTANCE OF TERMS
By accessing or using the Secure Python Runner (the "Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, you must immediately cease all use of the Service.

2. DESCRIPTION OF SERVICE
The Service provides a sandboxed environment for testing and executing Python 3.12 code blocks. The Service is provided "AS IS" and "AS AVAILABLE". We reserve the right to modify, suspend, or terminate the Service at any time without notice.

3. ACCEPTABLE USE POLICY
You agree NOT to use the Service to:
- Attempt to gain unauthorized access to the host server, other containers, or private networks.
- Execute fork bombs, memory bombs, or other denial-of-service scripts intended to degrade system performance.
- Initiate outbound network sockets, port scanning, spamming, or coordinate distributed attacks.
- Attempt to install unauthorized packages, escape the Docker container boundary, or bypass resource limits.
- Run cryptocurrency mining software or background daemon operations.

4. LIMITATION OF LIABILITY
IN NO EVENT SHALL THE SERVICE ADMINISTRATORS, OPERATORS, OR OWNERS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR EXEMPLARY DAMAGES, INCLUDING BUT NOT LIMITED TO: LOSS OF DATA, LOSS OF PROFITS, SYSTEM OUTAGES, OR OTHER INTANGIBLE LOSSES ARISING OUT OF THE USE OR INABILITY TO USE THE SERVICE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.

5. INDEMNIFICATION
You agree to indemnify, defend, and hold harmless the Service administrators and developers from and against any and all claims, liabilities, damages, losses, and expenses (including legal fees) arising out of or in any way connected with your use of the Service or violation of these Terms.

6. SERVICE TERMINATION
We reserve the absolute right to log code inputs, analyze execution profiles, throttle requests, and block any user IP address at our sole discretion, without notice or liability.
`;

export const PRIVACY_POLICY = `
1. DATA WE COLLECT
We do not require user registration. We collect the following information during use:
- **IP Address**: Collected temporarily for rate-limiting, abuse prevention, and API routing.
- **Submitted Code**: Transmitted to the server and worker queue solely to perform compilation and execution.
- **Execution Metadata**: Job duration, exit codes, and output logs generated during runtime.

2. HOW WE USE YOUR DATA
The collected data is used exclusively to:
- Enforce the 10 runs/minute execution limit per IP.
- Debug and optimize sandbox isolation barriers.
- Detect, investigate, and prevent malicious exploits and system abuse.

3. DATA RETENTION
- IP addresses used for rate-limiting are stored in memory and expire automatically.
- Job payloads and stdout results are cleaned up from the Redis queue regularly.
- We do not store execution histories or scripts permanently.

4. THIRD-PARTY SHARING
We do not sell, trade, or share your submitted code or IP addresses with third parties. All execution takes place in local, isolated, non-networked container sandboxes.

5. SECURITY MEASURES
We implement strict cgroup resource constraints, read-only file systems, and PID limitations to isolate running containers. However, no internet-facing application is 100% secure; users execute code at their own risk.
`;
