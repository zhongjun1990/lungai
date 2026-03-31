// In-memory data store (for development without database)
import bcrypt from 'bcryptjs';
import { User, Patient, Study, AnalysisTask, Report } from '../types';

interface InMemoryStore {
  users: User[];
  patients: Patient[];
  studies: Study[];
  analysisTasks: AnalysisTask[];
  reports: Report[];
}

const defaultTenantId = '7c9e6679-7425-40de-944b-e07fc1f90ae7';

const store: InMemoryStore = {
  users: [
    {
      id: 'a1b2c3d4-5678-90ef-ghij-klmnopqrstuv',
      email: 'admin@hospital.com',
      fullName: 'System Administrator',
      role: 'admin',
      tenantId: defaultTenantId,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'b2c3d4e5-6789-01fg-hijk-lmnopqrstuvw',
      email: 'doctor@hospital.com',
      fullName: 'Dr. Zhang Wei',
      role: 'radiologist',
      tenantId: defaultTenantId,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  patients: [
    {
      id: 'p1-1234567890',
      mrn: 'MRN-001',
      firstName: '小明',
      lastName: '李',
      birthDate: '1980-01-15',
      gender: 'male',
      tenantId: defaultTenantId,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'p2-1234567890',
      mrn: 'MRN-002',
      firstName: '芳',
      lastName: '王',
      birthDate: '1975-05-20',
      gender: 'female',
      tenantId: defaultTenantId,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  studies: [
    {
      id: 's1-1234567890',
      studyInstanceUid: '1.2.826.0.1.3680043.8.498.1234567890',
      patientId: 'p1-1234567890',
      studyDate: '2024-01-15',
      studyTime: '09:30:00',
      modality: 'CT',
      bodyPart: 'Chest',
      description: '胸部CT平扫',
      physicianName: 'Dr. Zhang',
      status: 'completed',
      seriesCount: 2,
      instanceCount: 256,
      tenantId: defaultTenantId,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  analysisTasks: [
    {
      id: 't1-1234567890',
      studyId: 's1-1234567890',
      modelId: 'lung-nodule-detector',
      modelVersion: 'v1.0.0',
      status: 'completed',
      priority: 5,
      startedAt: new Date(Date.now() - 3600000),
      completedAt: new Date(Date.now() - 3540000),
      createdAt: new Date(Date.now() - 3660000),
      updatedAt: new Date(Date.now() - 3540000),
    },
  ],
  reports: [
    {
      id: 'r1-1234567890',
      studyId: 's1-1234567890',
      analysisTaskId: 't1-1234567890',
      status: 'draft',
      createdAt: new Date(Date.now() - 3500000),
      updatedAt: new Date(Date.now() - 3500000),
    },
  ],
};

// Password hashes for in-memory auth (passwords: admin123, doctor123)
const passwordHashes: Record<string, string> = {
  'a1b2c3d4-5678-90ef-ghij-klmnopqrstuv': bcrypt.hashSync('admin123', 12),
  'b2c3d4e5-6789-01fg-hijk-lmnopqrstuvw': bcrypt.hashSync('doctor123', 12),
};

export const inMemoryStore = {
  // Users
  getUsers: () => store.users,
  findUserById: (id: string) => store.users.find(u => u.id === id),
  findUserByEmailAndTenant: (email: string, tenantId: string) =>
    store.users.find(u => u.email === email && u.tenantId === tenantId),
  verifyPassword: async (userId: string, password: string) => {
    const hash = passwordHashes[userId];
    if (!hash) return false;
    return bcrypt.compare(password, hash);
  },
  updateUserLastLogin: (id: string) => {
    const user = store.users.find(u => u.id === id);
    if (user) {
      user.lastLoginAt = new Date();
    }
  },
  updateUser: (id: string, updates: { fullName?: string; status?: 'active' | 'inactive' | 'suspended' }) => {
    const index = store.users.findIndex(u => u.id === id);
    if (index !== -1) {
      store.users[index] = {
        ...store.users[index],
        ...updates,
        updatedAt: new Date(),
      };
      return store.users[index];
    }
    return null;
  },

  // Patients
  getPatients: (tenantId: string) => store.patients.filter(p => p.tenantId === tenantId),
  findPatientById: (id: string, tenantId: string) =>
    store.patients.find(p => p.id === id && p.tenantId === tenantId),
  addPatient: (patient: Omit<Patient, 'createdAt' | 'updatedAt'>) => {
    const newPatient: Patient = {
      ...patient,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    store.patients.push(newPatient);
    return newPatient;
  },
  updatePatient: (id: string, tenantId: string, updates: Partial<Patient>) => {
    const index = store.patients.findIndex(p => p.id === id && p.tenantId === tenantId);
    if (index !== -1) {
      store.patients[index] = {
        ...store.patients[index],
        ...updates,
        updatedAt: new Date(),
      };
      return store.patients[index];
    }
    return null;
  },

  // Studies
  getStudies: (tenantId: string) => store.studies.filter(s => s.tenantId === tenantId),
  findStudyById: (id: string, tenantId: string) =>
    store.studies.find(s => s.id === id && s.tenantId === tenantId),
  addStudy: (study: Omit<Study, 'createdAt' | 'updatedAt'>) => {
    const newStudy: Study = {
      ...study,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    store.studies.push(newStudy);
    return newStudy;
  },
  updateStudy: (id: string, tenantId: string, updates: Partial<Study>) => {
    const index = store.studies.findIndex(s => s.id === id && s.tenantId === tenantId);
    if (index !== -1) {
      store.studies[index] = {
        ...store.studies[index],
        ...updates,
        updatedAt: new Date(),
      };
      return store.studies[index];
    }
    return null;
  },

  // Analysis Tasks
  getAnalysisTasks: () => store.analysisTasks,
  findAnalysisTaskById: (id: string) => store.analysisTasks.find(t => t.id === id),
  addAnalysisTask: (task: Omit<AnalysisTask, 'createdAt' | 'updatedAt'>) => {
    const newTask: AnalysisTask = {
      ...task,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    store.analysisTasks.push(newTask);
    return newTask;
  },
  updateAnalysisTask: (id: string, updates: Partial<AnalysisTask>) => {
    const index = store.analysisTasks.findIndex(t => t.id === id);
    if (index !== -1) {
      store.analysisTasks[index] = {
        ...store.analysisTasks[index],
        ...updates,
        updatedAt: new Date(),
      };
      return store.analysisTasks[index];
    }
    return null;
  },
  deleteAnalysisTask: (id: string) => {
    const index = store.analysisTasks.findIndex(t => t.id === id);
    if (index !== -1) {
      store.analysisTasks.splice(index, 1);
      return true;
    }
    return false;
  },

  // Reports
  getReports: () => store.reports,
  findReportById: (id: string) => store.reports.find(r => r.id === id),
  addReport: (report: Omit<Report, 'createdAt' | 'updatedAt'>) => {
    const newReport: Report = {
      ...report,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    store.reports.push(newReport);
    return newReport;
  },
  updateReport: (id: string, updates: Partial<Report>) => {
    const index = store.reports.findIndex(r => r.id === id);
    if (index !== -1) {
      store.reports[index] = {
        ...store.reports[index],
        ...updates,
        updatedAt: new Date(),
      };
      return store.reports[index];
    }
    return null;
  },
};
