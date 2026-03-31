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
) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return unauthorized(res, 'Authentication required');
  }

  try {
    const decoded = jwt.verify(token, config.auth.jwtSecret) as User;
    req.user = decoded;
    next();
  } catch (err) {
    return unauthorized(res, 'Invalid or expired token');
  }
}

export function requireRole(
  ...roles: User['role'][]
) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return unauthorized(res, 'Authentication required');
    }

    if (!roles.includes(req.user.role)) {
      return forbidden(res, 'Insufficient permissions');
    }

    next();
  };
}

export function requireTenant(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const resourceTenantId = req.params.tenantId || req.body.tenantId;

  if (resourceTenantId && req.user.tenantId !== resourceTenantId) {
    return forbidden(res, 'Access to this resource is restricted');
  }

  next();
}
