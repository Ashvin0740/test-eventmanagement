import redis from '../config/redis.js';

type QueueMap = Record<string, boolean>;

class Queue {
    private client: typeof redis.client | null = null;
    private queues: QueueMap;

    constructor() {
        this.queues = {};
    }

    initialize(): void {
        this.client = redis.client;
        this.queues = {};
    }

    async addJob(sQueueName: string, oData: any): Promise<void> {
        const nTask = await this.client?.lpush(`${sQueueName}:pending`, _.stringify(oData));
        const aKey = await this.client?.keys(`${sQueueName}:active`);
        if (nTask === 1 && !this.queues[sQueueName] && !aKey?.length) await this.processQueue(sQueueName);
    }

    async processQueue(sQueueName: string): Promise<void> {
        const oPending = await this.client?.rpop(`${sQueueName}:pending`);
        if (oPending) {
            this.queues[sQueueName] = true;
            await this.client?.lpush(`${sQueueName}:active`, oPending);
            this.processJob(sQueueName, _.parse(oPending));
        }
    }

    async processJob(sQueueName: string, oData: any): Promise<void> {
        await emitter.asyncEmit('customQueue', oData);
        await this.client?.rpop(`${sQueueName}:active`);
        delete this.queues[sQueueName];
        await this.processQueue(sQueueName);
    }
}

export default new Queue();
