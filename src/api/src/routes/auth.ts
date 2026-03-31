// Authentication Routes
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { success, error, badRequest, unauthorized } from '../utils/response';
import { parseExpiresIn } from '../utils/jwt';
import { LoginRequest, LoginResponse } from '../types';

const router = express.Router();

// Dummy user data (replace with database implementation)
const users = [
  {
    id: 'a1b2c3d4-5678-90ef-ghij-klmnopqrstuv',
    email: 'admin@hospital.com',
    passwordHash: bcrypt.hashSync('admin123', 12),
    fullName: 'System Administrator',
    role: 'admin' as const,
    tenantId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
    status: 'active' as const,
    createdAt: new Date(),
  },
  {
    id: 'b2c3d4e5-6789-01fg-hijk-lmnopqrstuvw',
    email: 'doctor@hospital.com',
    passwordHash: bcrypt.hashSync('doctor123', 12),
    fullName: 'Dr. Zhang Wei',
    role: 'radiologist' as const,
    tenantId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
    status: 'active' as const,
    createdAt: new Date(),
  },
];

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password, tenantId }: LoginRequest = req.body;

    // Validate input
    if (!email || !password || !tenantId) {
      return badRequest(res, 'email, password, and tenantId are required');
    }

    // Find user
    const user = users.find(u => u.email === email && u.tenantId === tenantId);
    if (!user) {
      return unauthorized(res, 'Invalid credentials');
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return unauthorized(res, 'Invalid credentials');
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role, tenantId: user.tenantId },
      config.auth.jwtSecret,
      { expiresIn: config.auth.jwtExpiresIn }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      config.auth.jwtSecret,
      { expiresIn: config.auth.jwtRefreshExpiresIn }
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
    const decoded = jwt.verify(refreshToken, config.auth.jwtSecret) as { id: string };

    // Find user
    const user = users.find(u => u.id === decoded.id);
    if (!user) {
      return unauthorized(res, 'Invalid refresh token');
    }

    // Generate new access token
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role, tenantId: user.tenantId },
      config.auth.jwtSecret,
      { expiresIn: config.auth.jwtExpiresIn }
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
