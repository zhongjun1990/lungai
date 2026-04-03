import { apiClient } from './client';
import type {
  LoginRequest,
  LoginResponse,
  User,
  Patient,
  CreatePatientRequest,
  UpdatePatientRequest,
  Study,
  CreateStudyRequest,
  UpdateStudyRequest,
  AnalysisTask,
  CreateAnalysisTaskRequest,
  AnalysisResult,
  Report,
  CreateReportRequest,
  UpdateReportRequest,
  PaginatedResponse,
  ListQueryParams,
} from './types';

// Authentication API
export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', data, {
      requireAuth: false,
    });
    apiClient.setToken(response.accessToken);
    return response;
  },

  refreshToken: async (refreshToken: string): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/refresh', {
      refreshToken,
    });
    apiClient.setToken(response.accessToken);
    return response;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
    apiClient.setToken(null);
  },
};

// Users API
export const usersApi = {
  getCurrentUser: async (): Promise<User> => {
    return apiClient.get<User>('/users/me');
  },
};

// Patients API
export const patientsApi = {
  getPatients: async (params?: ListQueryParams): Promise<PaginatedResponse<Patient>> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());
    if (params?.search) searchParams.set('search', params.search);
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);

    const queryString = searchParams.toString();
    return apiClient.get<PaginatedResponse<Patient>>(
      `/patients${queryString ? `?${queryString}` : ''}`
    );
  },

  getPatient: async (id: string): Promise<Patient> => {
    return apiClient.get<Patient>(`/patients/${id}`);
  },

  createPatient: async (data: CreatePatientRequest): Promise<Patient> => {
    return apiClient.post<Patient>('/patients', data);
  },

  updatePatient: async (id: string, data: UpdatePatientRequest): Promise<Patient> => {
    return apiClient.patch<Patient>(`/patients/${id}`, data);
  },

  deletePatient: async (id: string): Promise<void> => {
    return apiClient.delete(`/patients/${id}`);
  },
};

// Studies API
export const studiesApi = {
  getStudies: async (params?: ListQueryParams): Promise<PaginatedResponse<Study>> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());
    if (params?.search) searchParams.set('search', params.search);
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);

    const queryString = searchParams.toString();
    return apiClient.get<PaginatedResponse<Study>>(
      `/studies${queryString ? `?${queryString}` : ''}`
    );
  },

  getStudy: async (id: string): Promise<Study> => {
    return apiClient.get<Study>(`/studies/${id}`);
  },

  createStudy: async (data: CreateStudyRequest): Promise<Study> => {
    return apiClient.post<Study>('/studies', data);
  },

  updateStudy: async (id: string, data: UpdateStudyRequest): Promise<Study> => {
    return apiClient.patch<Study>(`/studies/${id}`, data);
  },

  deleteStudy: async (id: string): Promise<void> => {
    return apiClient.delete(`/studies/${id}`);
  },
};

// Analysis Tasks API
export const analysisApi = {
  getTasks: async (params?: ListQueryParams): Promise<PaginatedResponse<AnalysisTask>> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());
    if (params?.search) searchParams.set('search', params.search);
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);

    const queryString = searchParams.toString();
    return apiClient.get<PaginatedResponse<AnalysisTask>>(
      `/analysis-tasks${queryString ? `?${queryString}` : ''}`
    );
  },

  getTask: async (id: string): Promise<AnalysisTask> => {
    return apiClient.get<AnalysisTask>(`/analysis-tasks/${id}`);
  },

  createTask: async (data: CreateAnalysisTaskRequest): Promise<AnalysisTask> => {
    return apiClient.post<AnalysisTask>('/analysis-tasks', data);
  },

  cancelTask: async (id: string): Promise<void> => {
    return apiClient.delete(`/analysis-tasks/${id}`);
  },

  getResult: async (taskId: string): Promise<AnalysisResult> => {
    return apiClient.get<AnalysisResult>(`/analysis-tasks/${taskId}/results`);
  },
};

// Reports API
export const reportsApi = {
  getReports: async (params?: ListQueryParams): Promise<PaginatedResponse<Report>> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());
    if (params?.search) searchParams.set('search', params.search);
    if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);

    const queryString = searchParams.toString();
    return apiClient.get<PaginatedResponse<Report>>(
      `/reports${queryString ? `?${queryString}` : ''}`
    );
  },

  getReport: async (id: string): Promise<Report> => {
    return apiClient.get<Report>(`/reports/${id}`);
  },

  createReport: async (data: CreateReportRequest): Promise<Report> => {
    return apiClient.post<Report>('/reports', data);
  },

  updateReport: async (id: string, data: UpdateReportRequest): Promise<Report> => {
    return apiClient.patch<Report>(`/reports/${id}`, data);
  },

  deleteReport: async (id: string): Promise<void> => {
    return apiClient.delete(`/reports/${id}`);
  },

  downloadReport: async (id: string): Promise<Blob> => {
    const response = await fetch(`${apiClient.getBaseUrl()}/reports/${id}/download`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiClient.getToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to download report');
    }

    return response.blob();
  },
};
