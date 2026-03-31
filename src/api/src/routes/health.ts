// Health Check Route
import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
  };

  res.json(health);
});

export { router as healthRouter };
