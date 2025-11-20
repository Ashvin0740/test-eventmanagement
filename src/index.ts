import './globals/index.js';
import MongoDB from './config/mongodb.js';
import Redis from './config/redis.js';
import app from './app.js';
import socket from './sockets/index.js';

try {
    await Redis.connect();
    await MongoDB.connect();
    app.initialize();
    socket.initialize(app.httpServer);
} catch (error) {
    console.error('[index.ts] Error', error);
    process.exit(1);
}

const gracefulShutdown = async (signal: string) => {
    log.cyan(`\nReceived ${signal}. Starting graceful shutdown...`);

    try {
        await Redis.client.quit();
        await Redis.pub.quit();
        await Redis.sub.quit();
        await MongoDB.disconnect();

        log.green('Graceful shutdown completed');
        process.exit(0);
    } catch (error) {
        console.error('Error during graceful shutdown:', error);
        process.exit(1);
    }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
