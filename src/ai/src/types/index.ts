export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AnalysisFinding {
  type: string;
  confidence: number;
  bbox?: BoundingBox;
  volume?: number;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface AnalysisResult {
  taskId: string;
  modelId: string;
  modelVersion: string;
  findings: AnalysisFinding[];
  visualizationUrl?: string;
  reportText?: string;
  metrics: {
    inferenceTimeMs: number;
    totalFindings: number;
    confidenceScore: number;
  };
  rawOutput?: Record<string, unknown>;
  createdAt: Date;
}

export interface AnalysisTask {
  id: string;
  studyId: string;
  modelId: string;
  modelVersion: string;
  parameters?: Record<string, unknown>;
  status: 'pending' | 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  errorMessage?: string;
  startedAt?: Date;
  completedAt?: Date;
}

export interface ModelInput {
  imageData: Buffer;
  imageSize: {
    width: number;
    height: number;
    channels?: number;
  };
  parameters?: Record<string, unknown>;
}

export interface ModelOutput {
  success: boolean;
  findings: AnalysisFinding[];
  confidenceScore: number;
  inferenceTimeMs: number;
  visualizationData?: Buffer;
  rawOutput?: Record<string, unknown>;
}

export interface QueuedTask {
  id: string;
  studyId: string;
  modelId: string;
  modelVersion: string;
  parameters?: Record<string, unknown>;
  priority: number;
  createdAt: Date;
}
