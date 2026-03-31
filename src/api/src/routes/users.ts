// Users Routes
import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { success } from '../utils/response';

const router = express.Router();

router.use(authenticateToken);

// Get current user
router.get('/me', (req, res) => {
  return success(res, req.user);
});

// Update current user
router.patch('/me', (req, res) => {
  // TODO: Implement user update
  return success(res, { message: 'User updated (placeholder)' });
});

export { router as usersRouter };
