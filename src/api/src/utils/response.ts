// API Response Utilities
import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ApiResponse, ErrorResponse } from '../types';

export function success<T>(
  res: Response,
  data: T,
  meta?: { total?: number; page?: number; perPage?: number },
  links?: { self: string; next?: string; prev?: string; first?: string; last?: string }
): Response<ApiResponse<T>> {
  const response: ApiResponse<T> = { data };
  if (meta) response.meta = meta;
  if (links) response.links = links;
  return res.json(response);
}

export function error(
  res: Response,
  code: string,
  message: string,
  details?: string,
  statusCode: number = 400
): Response<ErrorResponse> {
  const requestId = uuidv4();
  return res.status(statusCode).json({
    error: {
      code,
      message,
      details,
      requestId,
    },
  });
}

export function notFound(
  res: Response,
  resource: string = 'Resource'
): Response<ErrorResponse> {
  return error(res, 'resource_not_found', `${resource} not found`, undefined, 404);
}

export function unauthorized(
  res: Response,
  message: string = 'Authentication required'
): Response<ErrorResponse> {
  return error(res, 'invalid_credentials', message, undefined, 401);
}

export function forbidden(
  res: Response,
  message: string = 'Insufficient permissions'
): Response<ErrorResponse> {
  return error(res, 'insufficient_permissions', message, undefined, 403);
}

export function badRequest(
  res: Response,
  message: string = 'Invalid request',
  details?: string
): Response<ErrorResponse> {
  return error(res, 'invalid_parameter', message, details, 400);
}

export function conflict(
  res: Response,
  message: string = 'Resource conflict'
): Response<ErrorResponse> {
  return error(res, 'resource_conflict', message, undefined, 409);
}

export function tooManyRequests(
  res: Response,
  message: string = 'Rate limit exceeded'
): Response<ErrorResponse> {
  return error(res, 'rate_limit_exceeded', message, undefined, 429);
}

export function serverError(
  res: Response,
  message: string = 'Internal server error'
): Response<ErrorResponse> {
  return error(res, 'server_error', message, undefined, 500);
}
