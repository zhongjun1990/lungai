// Analysis Tasks Routes
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken } from '../middleware/auth';
import { success, error, badRequest, notFound } from '../utils/response';
import { SubmitAnalysisTaskRequest } from '../types';
import { getAnalysisTaskRepository, getStudyRepository } from '../repositories/BaseRepository';

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

    // TODO: Return actual analysis results from MongoDB
    return success(res, {
      taskId: id,
      status: task.status,
      findings: [],
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
