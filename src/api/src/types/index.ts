// API Type Definitions

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'radiologist' | 'technician' | 'viewer';
  tenantId: string;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export interface Patient {
  id: string;
  mrn: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: 'male' | 'female' | 'other' | 'unknown';
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Study {
  id: string;
  studyInstanceUid?: string;
  patientId: string;
  studyDate: string;
  studyTime?: string;
  modality: string;
  bodyPart?: string;
  description?: string;
  physicianName?: string;
  status: 'pending' | 'processing' | 'completed' | 'archived';
  seriesCount: number;
  instanceCount: number;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Series {
  id: string;
  studyId: string;
  seriesInstanceUid?: string;
  seriesNumber?: number;
  modality: string;
  description?: string;
  numberOfInstances: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Instance {
  id: string;
  seriesId: string;
  sopInstanceUid?: string;
  instanceNumber?: number;
  fileLocation: string;
  fileSize?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AnalysisTask {
  id: string;
  studyId: string;
  modelId: string;
  modelVersion: string;
  status: 'pending' | 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  priority: number;
  parameters?: Record<string, unknown>;
  errorMessage?: string;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AnalysisFinding {
  type: string;
  confidence: number;
  bbox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  volume?: number;
  description?: string;
}

export interface AnalysisResult {
  id: string;
  taskId: string;
  modelId: string;
  modelVersion: string;
  findings: AnalysisFinding[];
  visualizationUrl?: string;
  reportText?: string;
  metrics?: {
    inferenceTimeMs?: number;
    totalFindings?: number;
    confidenceScore?: number;
  };
  rawOutput?: Record<string, unknown>;
  createdAt: Date;
}

export interface Report {
  id: string;
  studyId: string;
  analysisTaskId: string;
  templateId?: string;
  status: 'draft' | 'review' | 'approved' | 'signed' | 'archived';
  content?: Record<string, unknown>;
  signedBy?: string;
  signedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    perPage?: number;
  };
  links?: {
    self: string;
    next?: string;
    prev?: string;
    first?: string;
    last?: string;
  };
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: string;
    requestId: string;
  };
}

// Request Types
export interface LoginRequest {
  email: string;
  password: string;
  tenantId: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface CreatePatientRequest {
  id?: string;
  mrn: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: 'male' | 'female' | 'other' | 'unknown';
}

export interface UpdatePatientRequest {
  mrn?: string;
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  gender?: 'male' | 'female' | 'other' | 'unknown';
}

export interface CreateStudyRequest {
  id?: string;
  studyInstanceUid?: string;
  patientId: string;
  studyDate: string;
  studyTime?: string;
  modality: string;
  bodyPart?: string;
  description?: string;
  physicianName?: string;
}

export interface UpdateStudyRequest {
  bodyPart?: string;
  description?: string;
  physicianName?: string;
  status?: 'pending' | 'processing' | 'completed' | 'archived';
}

export interface SubmitAnalysisTaskRequest {
  studyId: string;
  modelId: string;
  modelVersion: string;
  parameters?: Record<string, unknown>;
  priority?: number;
}

export interface GenerateReportRequest {
  analysisTaskId: string;
  templateId?: string;
  parameters?: Record<string, unknown>;
}

export interface UpdateReportRequest {
  content?: Record<string, unknown>;
  status?: 'draft' | 'review' | 'approved' | 'signed' | 'archived';
}

export interface UpdateCurrentUserRequest {
  fullName?: string;
}

export interface GetUploadUrlRequest {
  studyInstanceUid: string;
  seriesInstanceUid: string;
  sopInstanceUid: string;
  filename: string;
  contentType: string;
}

export interface GetUploadUrlResponse {
  uploadUrl: string;
  uploadMethod: 'PUT' | 'POST';
  expiresIn: number;
  uploadHeaders?: Record<string, string>;
}

export interface SystemStatus {
  status: 'healthy' | 'warning' | 'critical';
  version: string;
  uptime: number;
  services: Array<{
    name: string;
    status: 'healthy' | 'warning' | 'critical';
    responseTimeMs?: number;
  }>;
  resources: {
    cpu: number;
    memory: number;
    gpu?: {
      memory: number;
      utilization: number;
    };
  };
}

export interface PaginationParams {
  page?: number;
  perPage?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  query?: string;
}
