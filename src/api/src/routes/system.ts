// System Routes
import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { success } from '../utils/response';

const router = express.Router();

// System status
router.get('/status', authenticateToken, (req, res) => {
  const systemStatus = {
    status: 'healthy',
    version: '1.0.0',
    uptime: process.uptime(),
    services: [
      {
        name: 'user-service',
        status: 'healthy',
        responseTimeMs: 12,
      },
      {
        name: 'imaging-service',
        status: 'healthy',
        responseTimeMs: 8,
      },
    ],
    resources: {
      cpu: 0.45,
      memory: 0.62,
    },
  };

  return success(res, systemStatus);
});

export { router as systemRouter };
