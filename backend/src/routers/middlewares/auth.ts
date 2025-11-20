import { NextFunction, Request, Response } from 'express';
import User from '../../models/User.js';
import redis from '../../config/redis.js';

class AuthMiddleware {
    async strictAuthLimiter(req: Request, res: Response, next: NextFunction) {
        const params = {
            path: req.path,
            remoteAddress: req.sRemoteAddress || '127.0.0.1',
            maxRequestTime: 60000, // 1 minute window
        };

        const key = `auth_rl:${params.remoteAddress}:${params.path}`;
        const maxRequests = 3; // Only 3 attempts per minute

        const current = await redis.client.incr(key);
        if (current === 1) await redis.client.pexpire(key, params.maxRequestTime);

        if (current > maxRequests) {
            return res.reply(message.badRequestCM('Too many authentication attempts. Please try again later.'));
        }

        next();
    }

    async isUserAuthenticated(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const token = req.header('authorization');
            if (!token) return res.reply(message.unauthorizedCM('Token is required'));

            const decodedToken = _.decodeToken(token);
            if (!decodedToken) return res.reply(message.unauthorizedCM('Invalid token'));

            const project = {
                sUserName: true,
                sEmail: true,
                eStatus: true,
                sAuthToken: true,
                oLocation: true,
                bEmailVerified: true,
                _id: true,
            };

            const user = await User.findOne({ _id: decodedToken._id }).select(project);
            if (!user) return res.reply(message.notFoundCM(message.custom.user_not_found));
            if (user.sAuthToken !== token) return res.reply(message.unauthorizedCM(message.custom.user_unauthorized));
            if (user.eStatus === 'd') return res.reply(message.forbiddenCM(message.custom.account_deleted));
            if (user.eStatus === 'n') return res.reply(message.forbiddenCM(message.custom.account_blocked));

            req.oData = { user };
            next();
        } catch (error) {
            console.log('[auth] :: middlewares/auth.ts :: isUserAuthenticated :: error:', error);
            return res.reply(message.serverErrorCM(message.custom.something_went_wrong('isUserAuthenticated')), error);
        }
    }
}

export default new AuthMiddleware();
