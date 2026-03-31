// Analysis Result Repository - MongoDB
import { AnalysisResult as AnalysisResultModel } from '../models/AnalysisResult';
import { AnalysisResult, AnalysisFinding } from '../types';

export interface CreateAnalysisResultParams {
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
}

export class AnalysisResultRepository {
  async findByTaskId(taskId: string): Promise<AnalysisResult | null> {
    try {
      const result = await AnalysisResultModel.findOne({ taskId });
      if (!result) return null;

      const obj = result.toObject();
      return {
        id: obj._id?.toString() || '',
        taskId: obj.taskId,
        modelId: obj.modelId,
        modelVersion: obj.modelVersion,
        findings: obj.findings || [],
        visualizationUrl: obj.visualizationUrl,
        reportText: obj.reportText,
        metrics: obj.metrics,
        createdAt: obj.createdAt || new Date(),
      };
    } catch (err) {
      return null;
    }
  }

  async create(params: CreateAnalysisResultParams): Promise<AnalysisResult> {
    const result = await AnalysisResultModel.create(params);
    const obj = result.toObject();
    return {
      id: obj._id?.toString() || '',
      taskId: obj.taskId,
      modelId: obj.modelId,
      modelVersion: obj.modelVersion,
      findings: obj.findings || [],
      visualizationUrl: obj.visualizationUrl,
      reportText: obj.reportText,
      metrics: obj.metrics,
      createdAt: obj.createdAt || new Date(),
    };
  }

  async deleteByTaskId(taskId: string): Promise<boolean> {
    try {
      const result = await AnalysisResultModel.deleteOne({ taskId });
      return result.deletedCount > 0;
    } catch (err) {
      return false;
    }
  }
}

export const analysisResultRepository = new AnalysisResultRepository();
