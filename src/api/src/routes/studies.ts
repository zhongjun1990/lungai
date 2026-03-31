// Studies Routes
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken } from '../middleware/auth';
import { success, error, badRequest, notFound } from '../utils/response';
import { CreateStudyRequest, UpdateStudyRequest } from '../types';
import { getStudyRepository, getPatientRepository } from '../repositories/BaseRepository';

const router = express.Router();

router.use(authenticateToken);

// List studies
router.get('/', async (req, res) => {
  try {
    const { page = 1, perPage = 20, patientId, modality, status } = req.query;
    const tenantId = req.user.tenantId;

    const studies = await getStudyRepository().listByTenant(tenantId);
    const total = await getStudyRepository().countByTenant(tenantId);

    return success(res, studies, {
      total,
      page: Number(page),
      perPage: Number(perPage),
    });
  } catch (err) {
    return error(res, 'server_error', 'Failed to list studies');
  }
});

// Create study
router.post('/', async (req, res) => {
  try {
    const {
      studyInstanceUid,
      patientId,
      studyDate,
      studyTime,
      modality,
      bodyPart,
      description,
      physicianName,
    }: CreateStudyRequest = req.body;

    if (!patientId || !studyDate || !modality) {
      return badRequest(res, 'patientId, studyDate, and modality are required');
    }

    // Verify patient exists
    const patient = await getPatientRepository().findById(patientId, req.user.tenantId);
    if (!patient) {
      return notFound(res, 'Patient not found');
    }

    const study = await getStudyRepository().create({
      id: uuidv4(),
      studyInstanceUid,
      patientId,
      studyDate,
      studyTime,
      modality,
      bodyPart,
      description,
      physicianName,
      tenantId: req.user.tenantId,
    });

    return success(res, study);
  } catch (err) {
    return error(res, 'server_error', 'Failed to create study');
  }
});

// Get study
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const study = await getStudyRepository().findById(id, req.user.tenantId);

    if (!study) {
      return notFound(res, 'Study not found');
    }

    return success(res, study);
  } catch (err) {
    return error(res, 'server_error', 'Failed to get study');
  }
});

// Update study
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates: UpdateStudyRequest = req.body;

    const study = await getStudyRepository().update(id, req.user.tenantId, updates);

    if (!study) {
      return notFound(res, 'Study not found');
    }

    return success(res, study);
  } catch (err) {
    return error(res, 'server_error', 'Failed to update study');
  }
});

export { router as studiesRouter };
