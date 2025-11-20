import express from 'express';
import controllers from './controllers.js';
import rsvpControllers from '../rsvp/controllers.js';
import authMiddleware from '../../middlewares/auth.js';

const router = express.Router();

// User routes
router.post('/register', controllers.register);
router.post('/login', authMiddleware.strictAuthLimiter, controllers.login);
router.get('/verify-email/:sVerificationToken', controllers.verifyEmail);
router.get('/events', authMiddleware.isUserAuthenticated, rsvpControllers.getUserEvents);

export default router;
