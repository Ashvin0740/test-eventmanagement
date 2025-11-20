import { Request, Response } from 'express';
import type { TUserLang } from '../globals/lib/message.js';
import type { TUser } from '../models/User.js';

declare module 'express-serve-static-core' {
    interface Request {
        sRemoteAddress: string;
        eLang: TUserLang;
        oData: { user?: InstanceType<TUser>; [key: string]: any };
    }

    interface Response {
        reply: (args: { code: number; message: string }, data?: any, header?: any) => void;
    }
}

export interface SocketClient {
    user: InstanceType<TUser>;
}

declare global {
    var io: any; // Socket.IO server instance
}
