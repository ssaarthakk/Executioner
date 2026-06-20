import Docker from 'dockerode';
import { EventEmitter } from 'events';

export interface PoolContainerInfo {
    id: string;
    createdAt: number;
}

export class ContainerPool extends EventEmitter {
    private docker: Docker;
    private image: string;
    private minIdle: number;
    private maxIdle: number;
    private maxAgeMs: number;
    private pool: PoolContainerInfo[];
    private pending: number;

    constructor({
        image = 'python-sandbox:latest',
        minIdle = 3,
        maxIdle = 10,
        maxAgeMs = 10 * 60 * 1000
    } = {}) {
        super();
        const isWindows = process.platform === 'win32';
        this.docker = new Docker(isWindows ? { socketPath: '//./pipe/docker_engine' } : { socketPath: '/var/run/docker.sock' });
        this.image = image;
        this.minIdle = minIdle;
        this.maxIdle = maxIdle;
        this.maxAgeMs = maxAgeMs;
        this.pool = [];
        this.pending = 0;
    }

    public async initialize(): Promise<void> {
        console.log(`[ContainerPool] Initializing pool with minIdle: ${this.minIdle}`);
        const spawns = Array.from({ length: this.minIdle }, () => this.spawn());
        await Promise.all(spawns);
        console.log(`[ContainerPool] Initialized. Pool size: ${this.pool.length}`);
    }

    public async acquire(): Promise<PoolContainerInfo> {
        if (this.pool.length === 0) {
            console.log('[ContainerPool] Pool empty. Triggering sync spawn.');
            await this.spawn();
        }

        const container = this.pool.shift();
        if (!container) {
            throw new Error('Failed to acquire container from pool');
        }

        console.log(`[ContainerPool] Acquired container: ${container.id.slice(0, 12)}`);

        (async () => {
            try {
                await this.refill();
            } catch (err) {
                console.error('[ContainerPool] Async refill failed:', err);
            }
        })();

        return container;
    }

    public async destroy(containerId: string): Promise<void> {
        console.log(`[ContainerPool] Destroying container: ${containerId.slice(0, 12)}`);
        try {
            const container = this.docker.getContainer(containerId);
            await container.remove({ force: true });
        } catch (err: any) {
            console.log(`[ContainerPool] Container destroy log: ${err.message}`);
        }

        (async () => {
            try {
                await this.refill();
            } catch (err) {
                console.error('[ContainerPool] Async refill failed:', err);
            }
        })();
    }

    private async spawn(): Promise<void> {
        if (this.pool.length + this.pending >= this.maxIdle) {
            return;
        }

        this.pending++;
        try {
            const container = await this.docker.createContainer({
                Image: this.image,
                Cmd: ['sleep', 'infinity'],
                OpenStdin: true,
                StdinOnce: false,
                HostConfig: {
                    Memory: 128 * 1024 * 1024,
                    MemorySwap: 128 * 1024 * 1024,
                    NanoCpus: 500_000_000,
                    PidsLimit: 64,
                    CapDrop: ['ALL'],
                    SecurityOpt: ['no-new-privileges'],
                    ReadonlyRootfs: true,
                    Tmpfs: { '/tmp': 'size=32m,noexec,nosuid' },
                    AutoRemove: true
                },
                User: '10000:10000'
            });

            await container.start();
            this.pool.push({
                id: container.id,
                createdAt: Date.now()
            });
            console.log(`[ContainerPool] Container spawned: ${container.id.slice(0, 12)}`);
        } catch (err: any) {
            console.error('[ContainerPool] Spawn error:', err);
        } finally {
            this.pending--;
        }
    }

    private async refill(): Promise<void> {
        const shortage = this.minIdle - this.pool.length;
        if (shortage <= 0) return;

        console.log(`[ContainerPool] Refilling ${shortage} container(s)`);
        const spawns = Array.from({ length: shortage }, () => this.spawn());
        await Promise.all(spawns);
    }

    public async healthCheck(): Promise<void> {
        const now = Date.now();
        const stale = this.pool.filter(c => now - c.createdAt > this.maxAgeMs);
        this.pool = this.pool.filter(c => now - c.createdAt <= this.maxAgeMs);

        if (stale.length > 0) {
            console.log(`[ContainerPool] Evicting ${stale.length} stale container(s)`);
            await Promise.all(stale.map(c => this.destroy(c.id)));
        }
    }
}
