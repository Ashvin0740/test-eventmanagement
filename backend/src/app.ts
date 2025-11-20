import http from 'http';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import type * as ExpressCore from 'express-serve-static-core';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import env from './config/env.js';
import router from './routers/index.js';
import _ from './globals/lib/helper.js';

interface RouterInstance {
    app: ExpressCore.Express;
    httpServer: http.Server;
    corsOptions: cors.CorsOptions;
    initialize(): void;
    setupMiddleware(): void;
    setupServer(): void;
    routeConfig(req: Request, res: Response, next: NextFunction): void;
    routeHandler(req: Request, res: Response): void;
    logErrors(err: Error, req: Request, res: Response, next: NextFunction): void;
    errorHandler(err: Error, req: Request, res: Response, next: NextFunction): void;
}

class Router implements RouterInstance {
    public app: ExpressCore.Express;
    public httpServer: http.Server;
    public corsOptions: cors.CorsOptions;

    constructor() {
        this.app = express();
        this.httpServer = http.createServer(this.app);
        this.corsOptions = {
            origin: '*',
            methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
            allowedHeaders: ['Content-Type', 'verification', 'authorization'],
            exposedHeaders: ['Content-Type', 'verification', 'authorization'],
        };
    }

    initialize(): void {
        this.setupMiddleware();
        this.setupServer();
    }

    setupMiddleware(): void {
        this.app.disable('etag');
        this.app.enable('trust proxy');

        this.app.set('view engine', 'ejs');
        this.app.set('views', 'src/services/seeds/views');

        this.app.use(cors(this.corsOptions));
        this.app.use(
            helmet({
                contentSecurityPolicy: {
                    directives: {
                        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
                        'img-src': ["'self'", 's3.amazonaws.com'],
                    },
                },
            })
        );
        this.app.use(compression());
        this.app.use(express.json({ limit: '16mb' }));
        this.app.use(
            express.urlencoded({
                limit: '16mb',
                extended: true,
                parameterLimit: 50000,
            })
        );

        this.app.use(
            morgan('dev', {
                skip: (req: Request) => req.path === '/ping' || req.path === '/favicon.ico',
            })
        );

        this.app.use(this.routeConfig.bind(this));
        this.app.use('/api/v1/', router);

        this.app.use('*', this.routeHandler.bind(this));
        this.app.use(this.logErrors.bind(this));
        this.app.use(this.errorHandler.bind(this));
    }

    setupServer(): void {
        this.httpServer = new http.Server(this.app);
        this.httpServer.timeout = 10000;

        if (!env.port) return log.red('🚀 :: app.ts:87 :: Router :: setupServer :: env.port:', env.port);
        this.httpServer.listen(Number(env.port), '0.0.0.0', () => console.log(`Server is running on ${env.port} 🌱`));
    }

    routeConfig(req: Request, res: Response, next: NextFunction): void {
        const forwardedFor = req.headers['x-forwarded-for'];
        req.sRemoteAddress = (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor) || req.ip || '127.0.0.1';

        if (req.path === '/ping') {
            res.status(200).send('Server is running');
            return;
        }

        res.reply = ({ code, message }: { code: number; message: string }, data = {}, header?: any) => {
            // Encrypt the data before sending
            // const encryptedData = _.encryptData(data);
            // res.status(code).set(header).json({ message, data: encryptedData });
            res.status(code).set(header).json({ message, data });
        };

        next();
    }

    routeHandler(_req: Request, res: Response): void {
        res.status(404).send({ message: 'Route not found!!' });
    }

    logErrors(err: Error, req: Request, _res: Response, next: NextFunction): void {
        log.error(`${req.method} ${req.url}`);
        log.error('body -> ', (req as Request & { body: any }).body);
        log.error(err.stack);
        return next(err);
    }

    errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
        res.status(500).send({ message: err });
    }
}

export default new Router();
