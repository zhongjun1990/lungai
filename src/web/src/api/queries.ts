import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  patientsApi,
  studiesApi,
  analysisApi,
  reportsApi,
} from './index';
import type {
  CreatePatientRequest,
  UpdatePatientRequest,
  CreateStudyRequest,
  UpdateStudyRequest,
  CreateAnalysisTaskRequest,
  CreateReportRequest,
  UpdateReportRequest,
  ListQueryParams,
} from './types';

// Query keys
export const queryKeys = {
  patients: ['patients'] as const,
  patient: (id: string) => ['patients', id] as const,
  studies: ['studies'] as const,
  study: (id: string) => ['studies', id] as const,
  analysisTasks: ['analysisTasks'] as const,
  analysisTask: (id: string) => ['analysisTasks', id] as const,
  analysisResult: (taskId: string) => ['analysisResult', taskId] as const,
  reports: ['reports'] as const,
  report: (id: string) => ['reports', id] as const,
};

// Patients hooks
export const usePatients = (params?: ListQueryParams) => {
  return useQuery({
    queryKey: [...queryKeys.patients, params],
    queryFn: () => patientsApi.getPatients(params),
  });
};

export const usePatient = (id: string) => {
  return useQuery({
    queryKey: queryKeys.patient(id),
    queryFn: () => patientsApi.getPatient(id),
    enabled: !!id,
  });
};

export const useCreatePatient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePatientRequest) => patientsApi.createPatient(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patients });
    },
  });
};

export const useUpdatePatient = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdatePatientRequest) => patientsApi.updatePatient(id, data),
    onSuccess: (newPatient) => {
      queryClient.setQueryData(queryKeys.patient(id), newPatient);
      queryClient.invalidateQueries({ queryKey: queryKeys.patients });
    },
  });
};

export const useDeletePatient = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => patientsApi.deletePatient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patients });
    },
  });
};

// Studies hooks
export const useStudies = (params?: ListQueryParams) => {
  return useQuery({
    queryKey: [...queryKeys.studies, params],
    queryFn: () => studiesApi.getStudies(params),
  });
};

export const useStudy = (id: string) => {
  return useQuery({
    queryKey: queryKeys.study(id),
    queryFn: () => studiesApi.getStudy(id),
    enabled: !!id,
  });
};

export const useCreateStudy = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateStudyRequest) => studiesApi.createStudy(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.studies });
    },
  });
};

export const useUpdateStudy = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateStudyRequest) => studiesApi.updateStudy(id, data),
    onSuccess: (newStudy) => {
      queryClient.setQueryData(queryKeys.study(id), newStudy);
      queryClient.invalidateQueries({ queryKey: queryKeys.studies });
    },
  });
};

export const useDeleteStudy = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => studiesApi.deleteStudy(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.studies });
    },
  });
};

// Analysis Tasks hooks
export const useAnalysisTasks = (params?: ListQueryParams) => {
  return useQuery({
    queryKey: [...queryKeys.analysisTasks, params],
    queryFn: () => analysisApi.getTasks(params),
  });
};

export const useAnalysisTask = (id: string) => {
  return useQuery({
    queryKey: queryKeys.analysisTask(id),
    queryFn: () => analysisApi.getTask(id),
    enabled: !!id,
  });
};

export const useCreateAnalysisTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAnalysisTaskRequest) => analysisApi.createTask(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.analysisTasks });
    },
  });
};

export const useCancelAnalysisTask = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => analysisApi.cancelTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.analysisTask(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.analysisTasks });
    },
  });
};

export const useAnalysisResult = (taskId: string) => {
  return useQuery({
    queryKey: queryKeys.analysisResult(taskId),
    queryFn: () => analysisApi.getResult(taskId),
    enabled: !!taskId,
  });
};

// Reports hooks
export const useReports = (params?: ListQueryParams) => {
  return useQuery({
    queryKey: [...queryKeys.reports, params],
    queryFn: () => reportsApi.getReports(params),
  });
};

export const useReport = (id: string) => {
  return useQuery({
    queryKey: queryKeys.report(id),
    queryFn: () => reportsApi.getReport(id),
    enabled: !!id,
  });
};

export const useCreateReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateReportRequest) => reportsApi.createReport(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reports });
    },
  });
};

export const useUpdateReport = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateReportRequest) => reportsApi.updateReport(id, data),
    onSuccess: (newReport) => {
      queryClient.setQueryData(queryKeys.report(id), newReport);
      queryClient.invalidateQueries({ queryKey: queryKeys.reports });
    },
  });
};

export const useDeleteReport = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => reportsApi.deleteReport(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reports });
    },
  });
};
