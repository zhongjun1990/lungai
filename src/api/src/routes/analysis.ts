// Analysis Tasks Routes
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken } from '../middleware/auth';
import { success, error, badRequest, notFound } from '../utils/response';
import { SubmitAnalysisTaskRequest } from '../types';
import { getAnalysisTaskRepository, getStudyRepository, getAnalysisResultRepository } from '../repositories/BaseRepository';
import { config } from '../config';

// In-memory sample analysis results for development
const sampleAnalysisResults: Record<string, {
  taskId: string;
  status: string;
  findings: Array<{
    type: string;
    confidence: number;
    bbox?: { x: number; y: number; width: number; height: number };
    volume?: number;
    description?: string;
  }>;
  visualizationUrl?: string;
  reportText?: string;
  metrics?: {
    inferenceTimeMs?: number;
    totalFindings?: number;
    confidenceScore?: number;
  };
}> = {
  't1-1234567890': {
    taskId: 't1-1234567890',
    status: 'completed',
    findings: [
      {
        type: 'lung_nodule',
        confidence: 0.85,
        bbox: { x: 120, y: 150, width: 25, height: 25 },
        volume: 12.5,
        description: 'Small pulmonary nodule detected in right upper lobe',
      },
      {
        type: 'lung_nodule',
        confidence: 0.72,
        bbox: { x: 280, y: 320, width: 18, height: 18 },
        volume: 5.2,
        description: 'Small pulmonary nodule detected in left lower lobe',
      },
    ],
    reportText: `Analysis Findings (2 total):

1. lung_nodule
   Confidence: 85.0%
   Small pulmonary nodule detected in right upper lobe
   Location: x=120, y=150, w=25, h=25
   Estimated volume: 12.50 mm³

2. lung_nodule
   Confidence: 72.0%
   Small pulmonary nodule detected in left lower lobe
   Location: x=280, y=320, w=18, h=18
   Estimated volume: 5.20 mm³
`,
    metrics: {
      inferenceTimeMs: 1250,
      totalFindings: 2,
      confidenceScore: 0.785,
    },
  },
};

const router = express.Router();

router.use(authenticateToken);

// List analysis tasks
router.get('/', async (req, res) => {
  try {
    const { page = 1, perPage = 20 } = req.query;
    const tenantId = req.user.tenantId;

    const tasks = await getAnalysisTaskRepository().listByTenant(tenantId);
    const total = await getAnalysisTaskRepository().countByTenant(tenantId);

    return success(res, tasks, {
      total,
      page: Number(page),
      perPage: Number(perPage),
    });
  } catch (err) {
    return error(res, 'server_error', 'Failed to list analysis tasks');
  }
});

// Submit analysis task
router.post('/', async (req, res) => {
  try {
    const { studyId, modelId, modelVersion, parameters, priority = 5 }: SubmitAnalysisTaskRequest = req.body;

    if (!studyId || !modelId || !modelVersion) {
      return badRequest(res, 'studyId, modelId, and modelVersion are required');
    }

    // Verify study exists
    const study = await getStudyRepository().findById(studyId, req.user.tenantId);
    if (!study) {
      return notFound(res, 'Study not found');
    }

    const task = await getAnalysisTaskRepository().create({
      id: uuidv4(),
      studyId,
      modelId,
      modelVersion,
      status: 'pending',
      priority,
      parameters,
    });

    return success(res, task);
  } catch (err) {
    return error(res, 'server_error', 'Failed to submit analysis task');
  }
});

// Get analysis task
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const task = await getAnalysisTaskRepository().findById(id);

    if (!task) {
      return notFound(res, 'Analysis task not found');
    }

    return success(res, task);
  } catch (err) {
    return error(res, 'server_error', 'Failed to get analysis task');
  }
});

// Get analysis task status
router.get('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const task = await getAnalysisTaskRepository().findById(id);

    if (!task) {
      return notFound(res, 'Analysis task not found');
    }

    return success(res, { status: task.status });
  } catch (err) {
    return error(res, 'server_error', 'Failed to get analysis task status');
  }
});

// Get analysis task results
router.get('/:id/results', async (req, res) => {
  try {
    const { id } = req.params;
    const task = await getAnalysisTaskRepository().findById(id);

    if (!task) {
      return notFound(res, 'Analysis task not found');
    }

    // First try to get results from MongoDB
    let results = null;
    try {
      results = await getAnalysisResultRepository().findByTaskId(id);
    } catch (err) {
      // MongoDB might not be available, continue to sample data
    }

    // If no results in MongoDB and using memory store, return sample data
    if (!results && (config.server.nodeEnv === 'development' || !config.database.mongodb.uri)) {
      const sample = sampleAnalysisResults[id];
      if (sample) {
        results = {
          id: `result-${id}`,
          taskId: id,
          modelId: task.modelId,
          modelVersion: task.modelVersion,
          findings: sample.findings,
          visualizationUrl: sample.visualizationUrl,
          reportText: sample.reportText,
          metrics: sample.metrics,
          createdAt: new Date(),
        };
      }
    }

    if (!results) {
      return notFound(res, 'Analysis results not found');
    }

    return success(res, {
      taskId: id,
      status: task.status,
      findings: results.findings,
      reportText: results.reportText,
      visualizationUrl: results.visualizationUrl,
      metrics: results.metrics,
    });
  } catch (err) {
    return error(res, 'server_error', 'Failed to get analysis results');
  }
});

// Cancel analysis task
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const task = await getAnalysisTaskRepository().findById(id);

    if (!task) {
      return notFound(res, 'Analysis task not found');
    }

    if (task.status === 'processing' || task.status === 'completed') {
      return badRequest(res, 'Cannot cancel task in current status');
    }

    await getAnalysisTaskRepository().update(id, { status: 'cancelled' });

    return success(res, { message: 'Analysis task cancelled' });
  } catch (err) {
    return error(res, 'server_error', 'Failed to cancel analysis task');
  }
});

export { router as analysisRouter };
