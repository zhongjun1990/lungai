// Patients Routes
import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { success } from '../utils/response';

const router = express.Router();

router.use(authenticateToken);

// List patients
router.get('/', (req, res) => {
  const { page = 1, perPage = 20, query } = req.query;
  // TODO: Implement patient listing
  return success(res, [], { total: 0, page: Number(page), perPage: Number(perPage) });
});

// Create patient
router.post('/', (req, res) => {
  // TODO: Implement patient creation
  return success(res, { message: 'Patient created (placeholder)' });
});

// Get patient
router.get('/:id', (req, res) => {
  // TODO: Implement patient retrieval
  return success(res, { message: 'Patient details (placeholder)' });
});

// Update patient
router.patch('/:id', (req, res) => {
  // TODO: Implement patient update
  return success(res, { message: 'Patient updated (placeholder)' });
});

export { router as patientsRouter };
