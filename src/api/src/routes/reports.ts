// Reports Routes
import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken } from '../middleware/auth';
import { success, error, badRequest, notFound } from '../utils/response';
import { GenerateReportRequest, UpdateReportRequest } from '../types';
import { getReportRepository, getAnalysisTaskRepository, getStudyRepository, getAnalysisResultRepository, getPatientRepository } from '../repositories/BaseRepository';
import { pdfGenerationService } from '../services/PdfGenerationService';

const router = express.Router();

router.use(authenticateToken);

// List reports
router.get('/', async (req, res) => {
  try {
    const { page = 1, perPage = 20 } = req.query;
    const tenantId = req.user.tenantId;

    const reports = await getReportRepository().listByTenant(tenantId);
    const total = await getReportRepository().countByTenant(tenantId);

    return success(res, reports, {
      total,
      page: Number(page),
      perPage: Number(perPage),
    });
  } catch (err) {
    return error(res, 'server_error', 'Failed to list reports');
  }
});

// Generate report
router.post('/', async (req, res) => {
  try {
    const { analysisTaskId, templateId, parameters }: GenerateReportRequest = req.body;

    if (!analysisTaskId) {
      return badRequest(res, 'analysisTaskId is required');
    }

    // Verify analysis task exists
    const task = await getAnalysisTaskRepository().findById(analysisTaskId);
    if (!task) {
      return notFound(res, 'Analysis task not found');
    }

    // Verify study exists and belongs to tenant
    const study = await getStudyRepository().findById(task.studyId, req.user.tenantId);
    if (!study) {
      return notFound(res, 'Study not found');
    }

    const report = await getReportRepository().create({
      id: uuidv4(),
      studyId: task.studyId,
      analysisTaskId,
      templateId,
      status: 'draft',
      content: parameters,
    });

    return success(res, report);
  } catch (err) {
    return error(res, 'server_error', 'Failed to generate report');
  }
});

// Get report
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const report = await getReportRepository().findById(id);

    if (!report) {
      return notFound(res, 'Report not found');
    }

    // Verify report belongs to study in tenant
    const study = await getStudyRepository().findById(report.studyId, req.user.tenantId);
    if (!study) {
      return notFound(res, 'Report not found');
    }

    return success(res, report);
  } catch (err) {
    return error(res, 'server_error', 'Failed to get report');
  }
});

// Update report
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates: UpdateReportRequest = req.body;

    const report = await getReportRepository().findById(id);
    if (!report) {
      return notFound(res, 'Report not found');
    }

    // Verify report belongs to study in tenant
    const study = await getStudyRepository().findById(report.studyId, req.user.tenantId);
    if (!study) {
      return notFound(res, 'Report not found');
    }

    const updatedReport = await getReportRepository().update(id, updates);

    return success(res, updatedReport);
  } catch (err) {
    return error(res, 'server_error', 'Failed to update report');
  }
});

// Download report as PDF
router.get('/:id.pdf', async (req, res) => {
  try {
    const { id } = req.params;
    const report = await getReportRepository().findById(id);

    if (!report) {
      return notFound(res, 'Report not found');
    }

    // Verify report belongs to study in tenant
    const study = await getStudyRepository().findById(report.studyId, req.user.tenantId);
    if (!study) {
      return notFound(res, 'Report not found');
    }

    // Get patient information
    const patient = await getPatientRepository().findById(study.patientId, req.user.tenantId);
    if (!patient) {
      return notFound(res, 'Patient not found');
    }

    // Get analysis results if available
    let analysisResult;
    if (report.analysisTaskId) {
      analysisResult = await getAnalysisResultRepository().findByTaskId(report.analysisTaskId);
    }

    // Generate PDF
    const pdfBuffer = await pdfGenerationService.generateReport({
      report,
      patient,
      study,
      analysisResult: analysisResult || undefined,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="medical-report-${id}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length.toString());
    res.send(pdfBuffer);
  } catch (err) {
    return error(res, 'server_error', 'Failed to download report');
  }
});

export { router as reportsRouter };
