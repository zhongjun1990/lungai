// Patients Routes
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken } from '../middleware/auth';
import { success, error, badRequest, notFound } from '../utils/response';
import { CreatePatientRequest, UpdatePatientRequest } from '../types';
import { getPatientRepository } from '../repositories/BaseRepository';

const router = express.Router();

router.use(authenticateToken);

// List patients
router.get('/', async (req, res) => {
  try {
    const { page = 1, perPage = 20, query } = req.query;
    const tenantId = req.user!.tenantId;

    const patients = await getPatientRepository().listByTenant(tenantId);
    const total = await getPatientRepository().countByTenant(tenantId);

    return success(res, patients, {
      total,
      page: Number(page),
      perPage: Number(perPage),
    });
  } catch (err) {
    return error(res, 'server_error', 'Failed to list patients');
  }
});

// Create patient
router.post('/', async (req, res) => {
  try {
    const { mrn, firstName, lastName, birthDate, gender }: CreatePatientRequest = req.body;

    if (!mrn || !firstName || !lastName || !birthDate || !gender) {
      return badRequest(res, 'mrn, firstName, lastName, birthDate, and gender are required');
    }

    const patient = await getPatientRepository().create({
      id: uuidv4(),
      mrn,
      firstName,
      lastName,
      birthDate,
      gender,
      tenantId: req.user!.tenantId,
    });

    return success(res, patient);
  } catch (err) {
    return error(res, 'server_error', 'Failed to create patient');
  }
});

// Get patient
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const patient = await getPatientRepository().findById(id, req.user!.tenantId);

    if (!patient) {
      return notFound(res, 'Patient not found');
    }

    return success(res, patient);
  } catch (err) {
    return error(res, 'server_error', 'Failed to get patient');
  }
});

// Update patient
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates: UpdatePatientRequest = req.body;

    const patient = await getPatientRepository().update(id, req.user!.tenantId, updates);

    if (!patient) {
      return notFound(res, 'Patient not found');
    }

    return success(res, patient);
  } catch (err) {
    return error(res, 'server_error', 'Failed to update patient');
  }
});

export { router as patientsRouter };
