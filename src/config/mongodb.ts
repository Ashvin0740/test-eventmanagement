import mongoose from 'mongoose';
import env from './env.js';

class MongoDB {
    private options: mongoose.ConnectOptions;

    constructor() {
        this.options = {};
    }

    async connect() {
        try {
            if (!env.database.mongodb.uri) throw new Error('MongoDB URI is not set');

            await mongoose.connect(env.database.mongodb.uri, this.options);
            console.log('MongoDB connected successfully 🧬');
        } catch (error) {
            console.error('[mongodb.ts] Error', error);
            process.exit(1);
        }
    }

    async disconnect() {
        await mongoose.disconnect();
    }
}

export default new MongoDB();
