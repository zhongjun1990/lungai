import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { messageQueueService } from '../services';
import { resultRepository } from '../repositories/ResultRepository';
import { logger } from '../utils/logger';

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    services: {
      messageQueue: true,
      database: true,
      storage: true,
      models: true,
    },
    timestamp: new Date().toISOString(),
  });
});

router.post('/tasks', async (req, res) => {
  try {
    const { studyId, modelId, modelVersion = 'v1.0.0', parameters = {} } = req.body;

    if (!studyId || !modelId) {
      return res.status(400).json({
        error: 'Missing required fields: studyId and modelId are required',
      });
    }

    const taskId = uuidv4();
    const task = {
      id: taskId,
      studyId,
      modelId,
      modelVersion,
      parameters,
      status: 'pending',
      startedAt: new Date(),
    };

    await messageQueueService.publishTask(task);
    logger.info(`Task ${taskId} published for study ${studyId}`);

    res.status(202).json({
      taskId,
      message: 'Analysis task accepted and queued',
    });
  } catch (err) {
    logger.error('Failed to create analysis task:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Failed to create analysis task',
    });
  }
});

router.get('/results/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const result = await resultRepository.findByTaskId(taskId);

    if (!result) {
      return res.status(404).json({
        error: 'Result not found for this task',
      });
    }

    res.json(result);
  } catch (err) {
    logger.error('Failed to get analysis result:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Failed to get analysis result',
    });
  }
});

export { router as analysisRouter };
