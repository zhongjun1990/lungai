// Authentication Routes
import express from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { success, error, badRequest, unauthorized } from '../utils/response';
import { parseExpiresIn } from '../utils/jwt';
import { LoginRequest, LoginResponse } from '../types';
import { getUserRepository } from '../repositories/BaseRepository';

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password, tenantId }: LoginRequest = req.body;

    // Validate input
    if (!email || !password || !tenantId) {
      return badRequest(res, 'email, password, and tenantId are required');
    }

    // Find user and verify password
    const user = await getUserRepository().verifyPassword(email, password, tenantId);
    if (!user) {
      return unauthorized(res, 'Invalid credentials');
    }

    // Check user status
    if (user.status === 'inactive' || user.status === 'suspended') {
      return unauthorized(res, 'Account is inactive');
    }

    // Generate tokens
    const accessToken = (jwt as any).sign(
      { id: user.id, email: user.email, role: user.role, tenantId: user.tenantId },
      config.auth.jwtSecret as string,
      { expiresIn: config.auth.jwtExpiresIn as string }
    );

    const refreshToken = (jwt as any).sign(
      { id: user.id },
      config.auth.jwtSecret as string,
      { expiresIn: config.auth.jwtRefreshExpiresIn as string }
    );

    const response: LoginResponse = {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: parseExpiresIn(config.auth.jwtExpiresIn),
    };

    return success(res, response);
  } catch (err) {
    return error(res, 'server_error', 'Login failed');
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return badRequest(res, 'refreshToken is required');
    }

    // Verify refresh token
    const decoded = (jwt as any).verify(refreshToken, config.auth.jwtSecret as string) as { id: string };

    // Find user
    const user = await getUserRepository().findById(decoded.id);
    if (!user) {
      return unauthorized(res, 'Invalid refresh token');
    }

    // Check user status
    if (user.status === 'inactive' || user.status === 'suspended') {
      return unauthorized(res, 'Account is inactive');
    }

    // Generate new access token
    const accessToken = (jwt as any).sign(
      { id: user.id, email: user.email, role: user.role, tenantId: user.tenantId },
      config.auth.jwtSecret as string,
      { expiresIn: config.auth.jwtExpiresIn as string }
    );

    const response: LoginResponse = {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: parseExpiresIn(config.auth.jwtExpiresIn),
    };

    return success(res, response);
  } catch (err) {
    return error(res, 'server_error', 'Token refresh failed');
  }
});

// Logout
router.post('/logout', (req, res) => {
  try {
    // In a real implementation, you would invalidate the token in a database or cache
    // For now, we just return success
    return success(res, { message: 'Logged out successfully' });
  } catch (err) {
    return error(res, 'server_error', 'Logout failed');
  }
});

export { router as authRouter };
