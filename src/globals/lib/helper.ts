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

    isObject: (o: object) => {
        return o instanceof Object && o.constructor === Object;
    },

    salt(length: number, type?: string) {
        if (process.env.NODE_ENV !== 'prod') return Array.from({ length }, (_, i) => i + 1).join('');
        if (type === 'string') {
            return crypto
                .randomBytes(Math.ceil(length / 2))
                .toString('hex')
                .slice(0, length);
        }

        let min: any = 1;
        let max: any = 9;

        for (let i = 1; i < length; i += 1) {
            min += '0';
            max += '9';
        }
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

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

    validateMobile: (mobile: string) => {
        // Accepts numbers with optional country code (e.g., +91), spaces, or dashes
        const regeX = /^(\+?\d{1,4}[-\s]?)?\d{10}$/;
        return regeX.test(mobile);
    },

    capitalize: (s: string) => (s && s[0].toUpperCase() + s.slice(1)) || '',

    getRandomNumber: (min = 0, max = 100000) => {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    deepClone: (data: any) => {
        try {
            return _.parse(_.stringify(data));
        } catch (error) {
            return data;
        }
    },
    isArray: (data: any[]) => {
        for (const element of data) {
            if (!Array.isArray(element)) return false;
        }
        return true;
    },
    isEqual: (id1: any, id2: any) => {
        return (id1 ? id1.toString() : id1) === (id2 ? id2.toString() : id2);
    },

    pick: (obj: any, array: any[]) => {
        const clonedObj = _.clone(obj);
        return array.reduce((acc: any, elem: any) => {
            if (elem in clonedObj) acc[elem] = clonedObj[elem];
            return acc;
        }, {});
    },

    isEmail(email: string) {
        const regeX = /[a-z0-9._%+-]+@[a-z0-9-]+[.]+[a-z]{2,5}$/;
        return !regeX.test(email);
    },

    isEmpty: (obj: any) => {
        if (obj === null || obj === undefined || Array.isArray(obj) || typeof obj !== 'object') {
            return true;
        }
        return Object.getOwnPropertyNames(obj).length === 0;
    },

    randomFromArray(array: any[]) {
        return array[Math.floor(Math.random() * array.length)];
    },

    randomBetween(min: number, max: number) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    shuffleArray: <T>(array: T[]): T[] => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    },

    clone: (data: any) => {
        const originalData = data.toObject ? data.toObject() : data; // for mongodb result operations
        const eType = originalData ? originalData.constructor : 'normal';
        if (eType === Object) return { ...originalData };
        if (eType === Array) return [...originalData];

        return data;
    },

    omit: (obj: any, array: any[], deepCloning = false) => {
        const clonedObject = deepCloning ? _.deepClone(obj) : _.clone(obj);
        const objectKeys = Object.keys(clonedObject);
        return objectKeys.reduce((acc: any, elem) => {
            if (!array.includes(elem)) acc[elem] = clonedObject[elem];
            return acc;
        }, {});
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

    getRandomWithProbability: (results: number[], weights: number[]) => {
        let s = 0;
        const num = Math.random();
        const lastIndex = weights.length - 1;

        for (let i = 0; i < lastIndex; i += 1) {
            s += weights[i];
            if (num < s) return results[i];
        }

        return results[lastIndex];

        // ex : getRandomWithProbability([1, 2, 3, 4], [0.3, 0.3, 0.3, 0.1])
    },

    randomizeAlphaNumericString: (length: number, size: number) => {
        let result = '';
        const output = new Set();
        const characters = '123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789'; // used 0-9 twice to reduce generating only chars string
        const charactersLength = characters.length;
        for (let j = 0; j < size; j += 1) {
            for (let i = 0; i < length; i += 1) {
                result += characters.charAt(Math.floor(Math.random() * charactersLength));
            }
            output.add(result);
            result = '';
        }
        return [...output];
    },

    decodeToken: (token: string) => {
        try {
            return jwt.decode(token) as any;
        } catch (error) {
            return undefined;
        }
    },

    isEmptyObject(obj: object = {}) {
        return !Object.keys(obj).length;
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

    emptyCallback: (error: any, response: any) => {},

    encryptPassword: (password: string) => {
        return crypto.createHmac('sha256', env.jwtSecret).update(password).digest('hex');
    },

    encryptData: (data: any): string => {
        try {
            // Handle null, undefined, or empty data
            if (data === null || data === undefined) {
                data = {};
            }

            // Convert data to JSON string if it's an object
            const dataString = typeof data === 'string' ? data : JSON.stringify(data);

            // Derive a 32-byte key from JWT secret using SHA-256
            const key = crypto.createHash('sha256').update(env.jwtSecret).digest();

            // Generate a random IV (Initialization Vector) for each encryption
            const iv = crypto.randomBytes(16);

            // Create cipher using AES-256-GCM
            const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

            // Encrypt the data
            let encrypted = cipher.update(dataString, 'utf8', 'hex');
            encrypted += cipher.final('hex');

            // Get the authentication tag
            const authTag = cipher.getAuthTag();

            // Combine IV, authTag, and encrypted data
            // Format: iv:authTag:encryptedData (all in hex)
            return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
        } catch (error) {
            console.error('Encryption error:', error);
            throw error;
        }
    },

    errorCallback: (error?: any): void => {
        if (error) console.log(error);
    },

    removeNull: (obj: Record<string, any>) => {
        for (const propName in obj) {
            if (obj[propName] === null || obj[propName] === undefined || obj[propName] === '') {
                delete obj[propName];
            }
        }
    },

    removeNullUndefined: (object: Record<string, any>, body: any[]) => {
        for (const key of body) {
            object[key] = !body[key] ? null : body[key];
        }
    },

    ObjectId: (id?: string) => (id ? new mongoose.Types.ObjectId(id) : new mongoose.Types.ObjectId()),

    toCamelCase: (str: string) =>
        str.substring(0, 1) +
        str.substring(1).replace(/_([a-z])(?=[a-z]|$)/g, function ($0: string, $1: string) {
            return $1.toUpperCase();
        }),

    isFileExist: async (absolutePath: import('fs').PathLike) => {
        try {
            await access(absolutePath);
            return true;
        } catch (err: any) {
            // Assuming the error is because the file doesn't exist
            if (err.code === 'ENOENT') return false;
            error('Error [isFileExist]: ', err);
            throw err; // Re-throw the error if it's something else
        }
    },

    delay: async (ttl: number) => await new Promise(resolve => setTimeout(resolve, ttl)),

    getProtoKey: (iProtoId: string) => `${iProtoId}:chance_game:proto`,

    getBoardKey: (iBoardId: string) => `${iBoardId.toString()}:chance_game`,

    getSchedulerKey: (sTask: string, iBoardId = '', iUserId = '', sNodeENV = process.env.NODE_ENV) => `${iBoardId}:scheduler:${sTask}:${iUserId}:chance_game:${sNodeENV}`,

    searchRegex: (search: string) => {
        // Returns a sanitized search string with RegExp special characters escaped,
        // to be safely used in regular expression patterns.
        if (!search) {
            return '';
        }
        return search.replace(/[.*+?^${}()|[\]\\'"]/g, (match: string) => '\\' + match);
    },
};

export default _;
