import express from 'express';
import controllers from './controllers.js';
import authMiddleware from '../../middlewares/auth.js';

const router = express.Router();

// All RSVP routes require authentication
router.post('/events/:iRsvpId', authMiddleware.isUserAuthenticated, controllers.createRSVP);
router.delete('/events/:iRsvpId', authMiddleware.isUserAuthenticated, controllers.deleteRSVP);
router.get('/user/events', authMiddleware.isUserAuthenticated, controllers.getUserEvents);

export default router;
