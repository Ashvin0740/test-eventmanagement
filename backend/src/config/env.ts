process.env['NODE_ENV'] = process.env['NODE_ENV'] ?? 'dev';

export default {
    port: process.env['PORT'],

    baseUrl: process.env['BASE_URL']!,

    jwtSecret: process.env['JWT_SECRET']!,

    adminWebUrl: process.env['ADMIN_WEB_URL'] || 'http://localhost:3000',

    database: {
        mongodb: {
            uri: process.env['MONGODB_URI']!,
        },

        redis: {
            host: process.env['REDIS_HOST']!,
            port: process.env['REDIS_PORT']!,
            username: process.env['REDIS_USERNAME']!,
            password: process.env['REDIS_PASSWORD']!,
        },
    },

    smtp: {
        email: process.env['SMTP_EMAIL']!,
        password: process.env['SMTP_PASS']!,
    },

    google: {
        clientId: process.env['GOOGLE_CLIENT_ID']!,
        clientSecret: process.env['GOOGLE_CLIENT_SECRET']!,
    },

    sendgrid: {
        apiKey: process.env['SENDGRID_API_KEY']!,
        fromEmail: process.env['SENDGRID_FROM_EMAIL'] || 'noreply@eventplatform.com',
    },

    openweathermap: {
        apiKey: process.env['OPENWEATHERMAP_API_KEY']!,
    },

    timezone: process.env['TIMEZONE']!,
};
