import { Server } from 'http';
import { Server as SocketIOServer, ServerOptions } from 'socket.io';
// import rootSocket from './lib/socket';

class SocketManager {
    options: Partial<ServerOptions>;

    constructor() {
        this.options = {
            pingInterval: 30000,
            pingTimeout: 15000,
            cookie: false,
            maxHttpBufferSize: 2048,
            serveClient: true,
            transports: ['polling', 'websocket'],
            allowUpgrades: true,
            perMessageDeflate: false,
        };
    }

    initialize(httpServer: Server) {
        global.io = new SocketIOServer(httpServer, {
            ...this.options,
            cors: {
                origin: '*',
                methods: ['GET', 'POST'],
            },
        });

        // Handle real-time event attendee count updates
        global.io.on('connection', (socket: any) => {
            console.log('Client connected:', socket.id);

            // Join event room for real-time updates
            socket.on('joinEvent', (eventId: string) => {
                socket.join(`event:${eventId}`);
                console.log(`Client ${socket.id} joined event:${eventId}`);
            });

            // Leave event room
            socket.on('leaveEvent', (eventId: string) => {
                socket.leave(`event:${eventId}`);
                console.log(`Client ${socket.id} left event:${eventId}`);
            });

            socket.on('disconnect', () => {
                console.log('Client disconnected:', socket.id);
            });
        });

        console.log('Socket initialized ⚡️');
    }
}

export default new SocketManager();
