import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { access } from 'node:fs/promises';
import env from '../../config/env.js';
import { error } from 'node:console';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone.js';
import utc from 'dayjs/plugin/utc.js';

dayjs.extend(timezone);
dayjs.extend(utc);

const _ = {
    nVerificationTokenExpiresIn: 3 * 60 * 1000, // 3 minutes;

    parse: (data: any) => {
        try {
            return JSON.parse(data, (key: string, value: unknown) => {
                if (typeof value === 'string' && value.startsWith('function')) {
                    const body = value.substring(value.indexOf('{') + 1, value.lastIndexOf('}'));
                    const args = value.substring(value.indexOf('(') + 1, value.indexOf(')')).split(',');
                    // eslint-disable-next-line no-new-func, @typescript-eslint/no-implied-eval
                    return new Function(...args, body);
                }
                return value;
            });
        } catch (error) {
            return data;
        }
    },

    stringify: (data: any) => {
        return JSON.stringify(data, (key: string, value: unknown) => {
            return typeof value === 'function' ? value.toString() : value;
        });
    },

    toString: (key: any) => {
        try {
            return key.toString();
        } catch (error) {
            return '';
        }
    },

    deepClone: (data: any) => {
        try {
            return _.parse(_.stringify(data));
        } catch (error) {
            return data;
        }
    },

    pick: (obj: any, array: any[]) => {
        const clonedObj = _.clone(obj);
        return array.reduce((acc: any, elem: any) => {
            if (elem in clonedObj) acc[elem] = clonedObj[elem];
            return acc;
        }, {});
    },

    isEmpty: (obj: any) => {
        if (obj === null || obj === undefined || Array.isArray(obj) || typeof obj !== 'object') {
            return true;
        }
        return Object.getOwnPropertyNames(obj).length === 0;
    },

    clone: (data: any) => {
        const originalData = data.toObject ? data.toObject() : data; // for mongodb result operations
        const eType = originalData ? originalData.constructor : 'normal';
        if (eType === Object) return { ...originalData };
        if (eType === Array) return [...originalData];

        return data;
    },

    Date: {
        isValidDate: (d: Date) => dayjs(d).isValid(),

        getDateWithTimezone: () => {
            return dayjs().tz(env.timezone);
        },

        formatTimezoneDate: (date?: string | Date | number, format = 'YYYY-MM-DD HH:mm:ss') => {
            return date ? dayjs(date).tz(env.timezone).format(format) : dayjs().tz(env.timezone).format(format);
        },
    },

    decodeToken: (token: string) => {
        try {
            return jwt.decode(token) as any;
        } catch (error) {
            return undefined;
        }
    },

    encodeToken: (body: jwt.JwtPayload, expTime?: number) => {
        try {
            return expTime ? jwt.sign(_.clone(body), env.jwtSecret, { expiresIn: expTime }) : jwt.sign(_.clone(body), env.jwtSecret);
        } catch (error) {
            return undefined;
        }
    },
    verifyToken(token: string) {
        try {
            if (!token) return;
            return jwt.verify(token, env.jwtSecret);
        } catch (error: any) {
            return error ? error.message : error;
        }
    },

    encryptPassword: (password: string) => {
        return crypto.createHmac('sha256', env.jwtSecret).update(password).digest('hex');
    },

    errorCallback: (error?: any): void => {
        if (error) console.log(error);
    },

    ObjectId: (id?: string) => (id ? new mongoose.Types.ObjectId(id) : new mongoose.Types.ObjectId()),
};

export default _;
