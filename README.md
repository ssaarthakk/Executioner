# Secure Python Execution Architecture Monorepo

A secure, sandboxed, and highly-scalable browser-based Python code execution service. Users can write Python code in the React workspace editor, hit "Run", and retrieve output dynamically through an asynchronous job queue—fully isolated inside unprivileged, read-only Docker containers.

## 🏗️ Architecture Design

The application consists of four main layers:
1.  **Frontend (`apps/web`)**: A React Single Page Application styled with Tailwind CSS v4, utilizing Monaco Editor. It submits jobs to the API and polls for status updates.
2.  **API Gateway (`apps/api`)**: A Node.js Express server that validates incoming code snippets, limits client-side request rates, generates job tokens, and queues tasks into Redis.
3.  **Job Queue (BullMQ + Redis)**: Decouples the API server from execution limits, enqueuing code runs to prevent gateway bottlenecks.
4.  **Worker Thread (`apps/worker`)**: A Node.js background worker process that consumes BullMQ jobs, spawns disposable hardened Docker containers, streams code to stdin, and saves outputs.
5.  **Docker Sandbox (`infrastructure/sandbox`)**: A minimal `python:3.12-slim` image stripped of network privileges (`--network=none`), running as non-root (`runner` user, UID 10000), with a read-only root system, CPU/memory limits, and process PID bounds.

---

## 🛠️ Local Development Setup

Follow these steps to set up and run the entire stack locally:

### 1. Prerequisites
Ensure you have the following installed on your machine:
- **Node.js**: v20+ LTS
- **pnpm**: `pnpm install -g pnpm`
- **Docker**: Desktop or Engine running locally
- **Redis**: v7+ (running on port `6379`)

---

### 2. Installation
Clone the repository and install all monorepo workspace dependencies:
```bash
pnpm install
```

---

### 3. Build the Docker Sandbox Image
You must compile and tag the hardened Docker image locally so the Worker can find it:
```bash
docker build -t python-sandbox:latest ./infrastructure/sandbox
```
Verify the image successfully executes as the unprivileged user (UID 10000):
```bash
docker run --rm python-sandbox:latest id
# Expected output: uid=10000(runner) gid=10000(runner) groups=10000(runner)
```

---

### 4. Run Redis Locally
If you do not have Redis running on your host, you can launch a local Redis instance in Docker:
```bash
docker run -d --name executioner-redis -p 6379:6379 redis:7-alpine
```

---

### 5. Setup Environment Configurations
Create the environment variables for each application layer:

#### Frontend (`apps/web/.env`)
Create an `.env` file inside `apps/web/` to point the client to the API server:
```env
VITE_API_URL=http://localhost:3000
```

#### API Gateway (`apps/api/.env`)
Create an `.env` file inside `apps/api/`:
```env
PORT=3000
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

#### Worker Daemon (`apps/worker/.env`)
Create an `.env` file inside `apps/worker/`:
```env
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

---

### 6. Start the Services
Run each service in a separate terminal window from the root of the project:

#### Start the API Gateway
```bash
pnpm --filter @executioner/api run dev
```

#### Start the Worker Thread
```bash
pnpm --filter @executioner/worker run dev
```

#### Start the React Frontend
```bash
pnpm --filter @executioner/web run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser to write and run Python scripts securely!
