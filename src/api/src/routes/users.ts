// Users Routes
import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { success, error, badRequest } from '../utils/response';
import { UpdateCurrentUserRequest } from '../types';
import { getUserRepository } from '../repositories/BaseRepository';

const router = express.Router();

router.use(authenticateToken);

// Get current user
router.get('/me', (req, res) => {
  return success(res, req.user);
});

// Update current user
router.patch('/me', async (req, res) => {
  try {
    const { fullName }: UpdateCurrentUserRequest = req.body;

    if (!fullName) {
      return badRequest(res, 'fullName is required');
    }

    const updatedUser = await getUserRepository().update(req.user.id, {
      fullName,
    });

    if (!updatedUser) {
      return error(res, 'user_not_found', 'User not found');
    }

    return success(res, updatedUser);
  } catch (err) {
    return error(res, 'server_error', 'Failed to update user');
  }
});

export { router as usersRouter };
