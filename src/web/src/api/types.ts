// Common Types
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// User Types
export type UserRole = 'admin' | 'radiologist' | 'technician' | 'viewer';
export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface User extends BaseEntity {
  email: string;
  fullName: string;
  role: UserRole;
  tenantId: string;
  status: UserStatus;
  lastLoginAt?: string;
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
  tenantId: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// Patient Types
export type PatientGender = 'male' | 'female' | 'other';

export interface Patient extends BaseEntity {
  mrn: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: PatientGender;
  phone?: string;
  email?: string;
  address?: string;
  tenantId: string;
  notes?: string;
}

export interface CreatePatientRequest {
  mrn: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: PatientGender;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}

export interface UpdatePatientRequest extends Partial<CreatePatientRequest> {}

// Study Types
export type StudyModality =
  | 'CT'
  | 'MRI'
  | 'X-Ray'
  | 'Ultrasound'
  | 'Nuclear Medicine'
  | 'PET'
  | 'Other';

export type StudyStatus = 'pending' | 'uploading' | 'uploaded' | 'processing' | 'completed' | 'failed';

export interface Study extends BaseEntity {
  patientId: string;
  studyInstanceUid: string;
  studyDate: string;
  modality: StudyModality;
  bodyPart?: string;
  accessionNumber?: string;
  description?: string;
  status: StudyStatus;
  numberOfSeries: number;
  numberOfInstances: number;
  fileSizeBytes?: number;
  thumbnailUrl?: string;
  tenantId: string;
  patient?: Patient;
}

export interface CreateStudyRequest {
  patientId: string;
  studyInstanceUid?: string;
  studyDate: string;
  modality: StudyModality;
  bodyPart?: string;
  accessionNumber?: string;
  description?: string;
}

export interface UpdateStudyRequest extends Partial<CreateStudyRequest> {
  status?: StudyStatus;
}

// Analysis Task Types
export type AnalysisStatus =
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type AnalysisType = 'lung_nodule' | 'chest_xray' | 'brain_tumor' | 'bone_fracture';

export interface AnalysisTask extends BaseEntity {
  studyId: string;
  type: AnalysisType;
  status: AnalysisStatus;
  priority: number;
  queuedAt?: string;
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
  progressPercent?: number;
  tenantId: string;
  study?: Study;
}

export interface CreateAnalysisTaskRequest {
  studyId: string;
  type: AnalysisType;
  priority?: number;
}

// Analysis Result Types
export interface Finding {
  id: string;
  type: string;
  confidence: number;
  description: string;
  location?: {
    x: number;
    y: number;
    z?: number;
  };
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
    depth?: number;
  };
  severity?: 'mild' | 'moderate' | 'severe';
}

export interface AnalysisResult extends BaseEntity {
  taskId: string;
  studyId: string;
  type: AnalysisType;
  summary: string;
  findings: Finding[];
  rawOutput?: Record<string, unknown>;
  modelVersion: string;
  tenantId: string;
}

// Report Types
export type ReportStatus = 'draft' | 'review' | 'approved' | 'signed';

export interface ReportSection {
  title: string;
  content: string;
}

export interface Report extends BaseEntity {
  studyId: string;
  resultId?: string;
  title: string;
  status: ReportStatus;
  sections: ReportSection[];
  findingsSummary?: string;
  impression?: string;
  recommendation?: string;
  signedBy?: string;
  signedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  pdfUrl?: string;
  tenantId: string;
}

export interface CreateReportRequest {
  studyId: string;
  resultId?: string;
  title: string;
  sections?: ReportSection[];
  findingsSummary?: string;
  impression?: string;
  recommendation?: string;
}

export interface UpdateReportRequest extends Partial<CreateReportRequest> {
  status?: ReportStatus;
}

// Pagination Types
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

// Query Params
export interface ListQueryParams extends PaginationParams {
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
