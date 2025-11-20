import express from 'express';
import controllers from './controllers.js';
import authMiddleware from '../../middlewares/auth.js';

const router = express.Router();

router.use(authMiddleware.isUserAuthenticated);

router.get('/', controllers.getUserProfile);
router.get('/logout', controllers.logout);

export default router;
