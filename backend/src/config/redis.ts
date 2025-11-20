import { Redis } from 'ioredis';
import env from './env.js';

interface RedisConfig {
    host: string;
    port: number;
    password: string;
    username: string;
}

interface LockInfo {
    owner: string;
    acquiredAt: number;
    ttl: number;
}

class RedisClient {
    private options: RedisConfig;
    public client: Redis;
    public pub: Redis;
    public sub: Redis;
    private lockOwner: string;

    constructor() {
        this.options = {
            host: env.database.redis.host,
            port: Number(env.database.redis.port),
            username: env.database.redis.username,
            password: env.database.redis.password,
        };

        this.client = new Redis(this.options);
        this.pub = new Redis(this.options);
        this.sub = new Redis(this.options);
        this.lockOwner = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    async connect() {
        try {
            this.pub.setMaxListeners(0);
            this.sub.setMaxListeners(0);

            await this.client.config('SET', 'notify-keyspace-events', 'Ex');
            await this.sub.subscribe('__keyevent@0__:expired');

            this.sub.on('message', this.onMessage);

            this.client.on('error', err => console.error('[redis.ts] client error::', err));
            this.pub.on('error', err => console.error('[redis.ts] pub error::', err));
            this.sub.on('error', err => console.error('[redis.ts] sub error::', err));

            console.log('Redis connected successfully 🔥');
        } catch (error) {
            console.error('[redis.ts] connect error::', error);
            process.exit(1);
        }
    }

    private async onMessage(channel: string, message: string): Promise<void> {
        let _channel;
        let _message;

        const [iBoardId, scheduler, sTaskName, iUserId, sGame, sNodeENV] = message.split(':');
        if (channel === '__keyevent@0__:expired' && sGame === 'sNodeENV') {
            if (sNodeENV !== process.env.NODE_ENV || scheduler !== 'scheduler') return console.log('[redis.ts] expired message not from scheduler or node', message);
            _channel = sTaskName;
            _message = { sTaskName, iBoardId, iUserId };
        } else {
            _channel = channel;
            _message = message;
        }

        let parsedMessage = '';
        try {
            parsedMessage = _.parse(_message);
        } catch (error) {
            console.error('[redis.ts] can not parse -> ', _message);
            parsedMessage = _message as string;
        }
        // emitter.asyncEmit(_channel, parsedMessage);
    }

    /**
     * Enhanced distributed lock with ownership verification
     * @param key - Lock key
     * @param ttl - Lock TTL in milliseconds
     * @param retryCount - Number of retries to acquire lock
     * @param retryDelay - Delay between retries in milliseconds
     */
    async acquireLock(key: string, ttl: number, retryCount: number = 3, retryDelay: number = 100): Promise<boolean> {
        const lockInfo: LockInfo = {
            owner: this.lockOwner,
            acquiredAt: Date.now(),
            ttl: ttl,
        };

        for (let i = 0; i < retryCount; i++) {
            try {
                // Try to acquire lock with ownership info
                const result = await this.client.set(key, JSON.stringify(lockInfo), 'PX', ttl, 'NX');
                if (result === 'OK') {
                    console.log(`[redis.ts] Lock acquired for key: ${key} by owner: ${this.lockOwner}`);
                    return true;
                }

                if (i < retryCount - 1) {
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                }
            } catch (error) {
                console.error(`[redis.ts] acquireLock attempt ${i + 1} error:`, error);
                if (i < retryCount - 1) {
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                }
            }
        }

        console.log(`[redis.ts] Failed to acquire lock for key: ${key} after ${retryCount} attempts`);
        return false;
    }

    /**
     * Release lock only if owned by current instance
     * @param key - Lock key
     */
    async releaseLock(key: string): Promise<boolean> {
        try {
            // Use Lua script for atomic check-and-delete
            const luaScript = `
                local lockKey = KEYS[1]
                local expectedOwner = ARGV[1]
                
                local lockInfo = redis.call('GET', lockKey)
                if not lockInfo then
                    return 0
                end
                
                local lockData = cjson.decode(lockInfo)
                if lockData.owner ~= expectedOwner then
                    return -1
                end
                
                redis.call('DEL', lockKey)
                return 1
            `;

            const result = await this.client.eval(luaScript, 1, key, this.lockOwner);

            if (result === 1) {
                console.log(`[redis.ts] Lock released for key: ${key} by owner: ${this.lockOwner}`);
                return true;
            } else if (result === -1) {
                console.log(`[redis.ts] Cannot release lock for key: ${key} - not owned by current instance`);
                return false;
            } else {
                console.log(`[redis.ts] Lock not found for key: ${key}`);
                return false;
            }
        } catch (error) {
            return false;
        }
    }

    async setJson(key: string, data: any, ttl?: number): Promise<boolean> {
        try {
            await this.client.call('JSON.SET', key, '$', JSON.stringify(data));

            if (ttl) {
                await this.client.expire(key, ttl);
            }

            return true;
        } catch (error) {
            console.error('[redis.ts] setJson error::', error);
            return false;
        }
    }

    async getJson(key: string): Promise<any> {
        try {
            const data = await this.client.call('JSON.GET', key, '$');
            if (!data) return log.red(`[redis.ts] getJson :: data not found for key :: ${key}`);
            return JSON.parse(data as any)[0];
        } catch (error) {
            console.error('[redis.ts] getJson error::', error);
            return null;
        }
    }

    async deleteJsonKey(key: string, path: string): Promise<boolean> {
        try {
            const result = await this.client.call('JSON.DEL', key, path);
            return result === 1;
        } catch (error) {
            console.error('[redis.ts] deleteJsonKey error::', error);
            return false;
        }
    }
}

export default new RedisClient();
