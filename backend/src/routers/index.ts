import express from 'express';

import authRouter from './route/auth/index.js';
import requestLimiter from './middlewares/request-limiter.js';
import eventsRouter from './route/events/index.js';
import rsvpRouter from './route/rsvp/index.js';
import analyticsRouter from './route/analytics/index.js';
import discoveryRouter from './route/discovery/index.js';
import profileRouter from './route/profile/index.js';

const router = express.Router();

router.use(requestLimiter.apiLimiter);

router.use('/auth', authRouter);
router.use('/profile', profileRouter);
router.use('/events', eventsRouter);
router.use('/rsvp', rsvpRouter);
router.use('/discovery', discoveryRouter);
router.use('/analytics', analyticsRouter);

export default router;
