// Base Repository Interface and Factory
import { config } from '../config';
import { inMemoryStore } from '../store/inMemoryStore';
import { userRepository } from './UserRepository';
import { patientRepository } from './PatientRepository';
import { studyRepository } from './StudyRepository';

// Determine which repository implementation to use
const USE_MEMORY_STORE = config.server.nodeEnv === 'development' || !config.database.postgres.host;

// User Repository
export const getUserRepository = () => {
  if (USE_MEMORY_STORE) {
    return {
      findById: (id: string) => Promise.resolve(inMemoryStore.findUserById(id)),
      findByEmailAndTenant: (email: string, tenantId: string) => Promise.resolve(inMemoryStore.findUserByEmailAndTenant(email, tenantId)),
      verifyPassword: async (email: string, password: string, tenantId: string) => {
        const user = inMemoryStore.findUserByEmailAndTenant(email, tenantId);
        if (!user) return null;
        const isValid = await inMemoryStore.verifyPassword(user.id, password);
        if (!isValid) return null;
        inMemoryStore.updateUserLastLogin(user.id);
        return user;
      },
      update: (id: string, updates: { fullName?: string; status?: 'active' | 'inactive' | 'suspended' }) =>
        Promise.resolve(inMemoryStore.updateUser(id, updates)),
    };
  }
  return userRepository;
};

// Patient Repository
export const getPatientRepository = () => {
  if (USE_MEMORY_STORE) {
    return {
      findById: (id: string, tenantId: string) => Promise.resolve(inMemoryStore.findPatientById(id, tenantId)),
      findByMrn: (mrn: string, tenantId: string) => Promise.resolve(inMemoryStore.getPatients(tenantId).find(p => p.mrn === mrn)),
      create: (params: any) => Promise.resolve(inMemoryStore.addPatient(params)),
      update: (id: string, tenantId: string, updates: any) => Promise.resolve(inMemoryStore.updatePatient(id, tenantId, updates)),
      listByTenant: (tenantId: string) => Promise.resolve(inMemoryStore.getPatients(tenantId)),
      countByTenant: (tenantId: string) => Promise.resolve(inMemoryStore.getPatients(tenantId).length),
      delete: () => Promise.resolve(false),
    };
  }
  return patientRepository;
};

// Study Repository
export const getStudyRepository = () => {
  if (USE_MEMORY_STORE) {
    return {
      findById: (id: string, tenantId: string) => Promise.resolve(inMemoryStore.findStudyById(id, tenantId)),
      findByStudyInstanceUid: (uid: string, tenantId: string) => Promise.resolve(inMemoryStore.getStudies(tenantId).find(s => s.studyInstanceUid === uid)),
      create: (params: any) => Promise.resolve(inMemoryStore.addStudy(params)),
      update: (id: string, tenantId: string, updates: any) => Promise.resolve(inMemoryStore.updateStudy(id, tenantId, updates)),
      listByTenant: (tenantId: string) => Promise.resolve(inMemoryStore.getStudies(tenantId)),
      countByTenant: (tenantId: string) => Promise.resolve(inMemoryStore.getStudies(tenantId).length),
    };
  }
  return studyRepository;
};

// Analysis Tasks Repository
export const getAnalysisTaskRepository = () => {
  if (USE_MEMORY_STORE) {
    return {
      findById: (id: string) => Promise.resolve(inMemoryStore.findAnalysisTaskById(id)),
      create: (params: any) => Promise.resolve(inMemoryStore.addAnalysisTask(params)),
      update: (id: string, updates: any) => Promise.resolve(inMemoryStore.updateAnalysisTask(id, updates)),
      listByTenant: (tenantId: string) => Promise.resolve(inMemoryStore.getAnalysisTasks().filter(t => {
        const study = inMemoryStore.findStudyById(t.studyId, tenantId);
        return !!study;
      })),
      countByTenant: (tenantId: string) => Promise.resolve(inMemoryStore.getAnalysisTasks().filter(t => {
        const study = inMemoryStore.findStudyById(t.studyId, tenantId);
        return !!study;
      }).length),
      delete: (id: string) => Promise.resolve(inMemoryStore.deleteAnalysisTask(id)),
    };
  }
  // For real DB, we'll need to create a separate StudyRepository
  return {
    findById: () => Promise.resolve(null),
    create: () => Promise.resolve(null as any),
    update: () => Promise.resolve(null),
    listByTenant: () => Promise.resolve([]),
    countByTenant: () => Promise.resolve(0),
    delete: () => Promise.resolve(false),
  };
};

// Analysis Results Repository - always uses MongoDB (stored by AI service)
export const getAnalysisResultRepository = () => {
  const { analysisResultRepository } = require('./AnalysisResultRepository');
  return analysisResultRepository;
};

// Reports Repository
export const getReportRepository = () => {
  if (USE_MEMORY_STORE) {
    return {
      findById: (id: string) => Promise.resolve(inMemoryStore.findReportById(id)),
      create: (params: any) => Promise.resolve(inMemoryStore.addReport(params)),
      update: (id: string, updates: any) => Promise.resolve(inMemoryStore.updateReport(id, updates)),
      listByTenant: (tenantId: string) => Promise.resolve(inMemoryStore.getReports().filter(r => {
        const study = inMemoryStore.findStudyById(r.studyId, tenantId);
        return !!study;
      })),
      countByTenant: (tenantId: string) => Promise.resolve(inMemoryStore.getReports().filter(r => {
        const study = inMemoryStore.findStudyById(r.studyId, tenantId);
        return !!study;
      }).length),
    };
  }
  return {
    findById: () => Promise.resolve(null),
    create: () => Promise.resolve(null as any),
    update: () => Promise.resolve(null),
    listByTenant: () => Promise.resolve([]),
    countByTenant: () => Promise.resolve(0),
  };
};
