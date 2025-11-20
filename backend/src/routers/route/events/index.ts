import express from 'express';
import controllers from './controllers.js';
import authMiddleware from '../../middlewares/auth.js';

const router = express.Router();

// Public routes
router.get('/', controllers.listEvents);
router.get('/:iEventId', controllers.getEventDetails);

// Authenticated routes
router.post('/', authMiddleware.isUserAuthenticated, controllers.createEvent);
router.put('/:iEventId', authMiddleware.isUserAuthenticated, controllers.updateEvent);
router.delete('/:iEventId', authMiddleware.isUserAuthenticated, controllers.deleteEvent);

export default router;
