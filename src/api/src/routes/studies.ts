// Studies Routes
import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { success } from '../utils/response';

const router = express.Router();

router.use(authenticateToken);

// List studies
router.get('/', (req, res) => {
  const { page = 1, perPage = 20, patientId, modality } = req.query;
  // TODO: Implement study listing
  return success(res, [], { total: 0, page: Number(page), perPage: Number(perPage) });
});

// Create study
router.post('/', (req, res) => {
  // TODO: Implement study creation
  return success(res, { message: 'Study created (placeholder)' });
});

// Get study
router.get('/:id', (req, res) => {
  // TODO: Implement study retrieval
  return success(res, { message: 'Study details (placeholder)' });
});

// Update study
router.patch('/:id', (req, res) => {
  // TODO: Implement study update
  return success(res, { message: 'Study updated (placeholder)' });
});

// Get study series
router.get('/:id/series', (req, res) => {
  // TODO: Implement series listing
  return success(res, [], { total: 0 });
});

export { router as studiesRouter };
