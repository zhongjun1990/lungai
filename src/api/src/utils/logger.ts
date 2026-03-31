// Logging utility using Pino
import pino from 'pino';
import { config } from '../config';

export const logger = pino({
  level: config.logging.level,
  transport: config.server.nodeEnv === 'development'
    ? { target: 'pino-pretty' }
    : undefined,
  formatters: {
    level: (label) => ({ level: label.toUpperCase() }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export function logRequest(req: any) {
  logger.info({
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    requestId: req.headers['x-request-id'],
  }, 'Request received');
}

export function logResponse(req: any, res: any, duration: number) {
  logger.info({
    method: req.method,
    url: req.originalUrl,
    statusCode: res.statusCode,
    responseTime: `${duration}ms`,
    requestId: req.headers['x-request-id'],
  }, 'Response sent');
}
