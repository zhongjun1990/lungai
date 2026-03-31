import { Response } from 'express';

export interface ApiResponse<T> {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    perPage?: number;
  };
  links?: {
    self: string;
    next?: string;
    prev?: string;
    first?: string;
    last?: string;
  };
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: string;
    requestId: string;
  };
}

export function success<T>(
  res: Response,
  data: T,
  meta?: ApiResponse<T>['meta'],
  links?: ApiResponse<T>['links']
) {
  const response: ApiResponse<T> = { data };
  if (meta) response.meta = meta;
  if (links) response.links = links;
  return res.json(response);
}

export function badRequest(res: Response, message: string) {
  return res.status(400).json({
    error: {
      code: 'bad_request',
      message,
    },
  });
}

export function unauthorized(res: Response, message: string) {
  return res.status(401).json({
    error: {
      code: 'unauthorized',
      message,
    },
  });
}

export function forbidden(res: Response, message: string) {
  return res.status(403).json({
    error: {
      code: 'forbidden',
      message,
    },
  });
}

export function notFound(res: Response, message: string) {
  return res.status(404).json({
    error: {
      code: 'not_found',
      message,
    },
  });
}

export function error(res: Response, message: string, details?: string) {
  return res.status(500).json({
    error: {
      code: 'server_error',
      message,
      details,
    },
  });
}
