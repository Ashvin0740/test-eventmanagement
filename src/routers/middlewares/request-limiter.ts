import { NextFunction, Request, Response } from 'express';
import redis from '../../config/redis.js';

class RequestLimiter {
    constructor() {
        this.setLimit = this.setLimit.bind(this);
        this.apiLimiter = this.apiLimiter.bind(this);
    }

    setLimit = async (params: { path: string; remoteAddress: string; maxRequestTime: number }): Promise<boolean> => {
        try {
            /*
             * This will be used to bypass the rate limit for the following paths
             * start from inside router file ( ex. /profile/...)
             */
            if ([''].includes(params.path)) return true;

            const key = `rl:${params.remoteAddress}:${params.path}`;
            const maxRequests = 5;
            const windowMs = params.maxRequestTime;

            const current = await redis.client.incr(key);
            if (current === 1) await redis.client.pexpire(key, windowMs);

            if (current > maxRequests) return false;

            return true;
        } catch (error) {
            console.log('[setLimit] request-limiter.ts:15 :: RequestLimiter :: setLimit :: error:', error);
            return false;
        }
    };

    apiLimiter = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const params = {
                path: req.path,
                remoteAddress: req.sRemoteAddress || '127.0.0.1',
                maxRequestTime: 1000,
            };

            const result = await this.setLimit(params);
            if (!result) return res.reply(message.badRequestCM('Too many requests'));
            next();
        } catch (error) {
            console.log('[apiLimiter] :: request-limiter.ts:32 :: RequestLimiter :: apiLimiter :: error:', error);
            return res.reply(message.serverErrorCM('Something went wrong'), error);
        }
    };
}

export default new RequestLimiter();
