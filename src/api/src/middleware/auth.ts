// JWT Authentication Middleware
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { unauthorized, forbidden } from '../utils/response';
import type { User } from '../types';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export interface AuthRequest extends Request {
  user: User;
}

export function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    unauthorized(res, 'Authentication required');
    return;
  }

  try {
    const decoded = jwt.verify(token, config.auth.jwtSecret) as User;
    req.user = decoded;
    next();
  } catch (err) {
    unauthorized(res, 'Invalid or expired token');
    return;
  }
}

export function requireRole(
  ...roles: User['role'][]
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      unauthorized(res, 'Authentication required');
      return;
    }

    if (!roles.includes(req.user.role)) {
      forbidden(res, 'Insufficient permissions');
      return;
    }

    next();
  };
}

export function requireTenant(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const resourceTenantId = req.params.tenantId || req.body.tenantId;

  if (resourceTenantId && req.user.tenantId !== resourceTenantId) {
    forbidden(res, 'Access to this resource is restricted');
    return;
  }

  next();
}
