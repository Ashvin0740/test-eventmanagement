import express from 'express';
import controllers from './controllers.js';
import authMiddleware from '../../middlewares/auth.js';

const router = express.Router();
router.get('/nearby', authMiddleware.isUserAuthenticated, controllers.getNearbyEvents);
router.get('/trending', authMiddleware.isUserAuthenticated, controllers.getTrendingEvents);

export default router;
