import express from 'express';
import controllers from './controllers.js';
import authMiddleware from '../../middlewares/auth.js';

const router = express.Router();

// Analytics routes require authentication
router.get('/event/:iEventId', authMiddleware.isUserAuthenticated, controllers.getEventAnalytics);

export default router;
