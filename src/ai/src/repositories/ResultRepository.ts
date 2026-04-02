import { AnalysisResult as AnalysisResultModel } from '../models';
import { AnalysisResult } from '../types';

export interface CreateResultParams {
  taskId: string;
  modelId: string;
  modelVersion: string;
  findings: AnalysisResult['findings'];
  visualizationUrl?: string;
  reportText?: string;
  metrics: AnalysisResult['metrics'];
  rawOutput?: AnalysisResult['rawOutput'];
}

export class ResultRepository {
  async findById(id: string): Promise<AnalysisResult | null> {
    const result = await AnalysisResultModel.findById(id);
    if (!result) return null;
    const obj = result.toObject();
    return {
      taskId: obj.taskId,
      modelId: obj.modelId,
      modelVersion: obj.modelVersion,
      findings: obj.findings,
      visualizationUrl: obj.visualizationUrl,
      reportText: obj.reportText,
      metrics: obj.metrics || { inferenceTimeMs: 0, totalFindings: 0, confidenceScore: 0 },
      rawOutput: obj.rawOutput,
      createdAt: obj.createdAt,
    };
  }

  async findByTaskId(taskId: string): Promise<AnalysisResult | null> {
    const result = await AnalysisResultModel.findOne({ taskId });
    if (!result) return null;
    const obj = result.toObject();
    return {
      taskId: obj.taskId,
      modelId: obj.modelId,
      modelVersion: obj.modelVersion,
      findings: obj.findings,
      visualizationUrl: obj.visualizationUrl,
      reportText: obj.reportText,
      metrics: obj.metrics || { inferenceTimeMs: 0, totalFindings: 0, confidenceScore: 0 },
      rawOutput: obj.rawOutput,
      createdAt: obj.createdAt,
    };
  }

  async create(params: CreateResultParams): Promise<AnalysisResult> {
    const result = await AnalysisResultModel.create({
      ...params,
    });
    const obj = result.toObject();
    return {
      taskId: obj.taskId,
      modelId: obj.modelId,
      modelVersion: obj.modelVersion,
      findings: obj.findings,
      visualizationUrl: obj.visualizationUrl,
      reportText: obj.reportText,
      metrics: obj.metrics || { inferenceTimeMs: 0, totalFindings: 0, confidenceScore: 0 },
      rawOutput: obj.rawOutput,
      createdAt: obj.createdAt,
    };
  }

  async update(id: string, updates: Partial<AnalysisResult>): Promise<AnalysisResult | null> {
    const result = await AnalysisResultModel.findByIdAndUpdate(
      id,
      updates,
      { new: true }
    );
    if (!result) return null;
    const obj = result.toObject();
    return {
      taskId: obj.taskId,
      modelId: obj.modelId,
      modelVersion: obj.modelVersion,
      findings: obj.findings,
      visualizationUrl: obj.visualizationUrl,
      reportText: obj.reportText,
      metrics: obj.metrics || { inferenceTimeMs: 0, totalFindings: 0, confidenceScore: 0 },
      rawOutput: obj.rawOutput,
      createdAt: obj.createdAt,
    };
  }

  async delete(id: string): Promise<boolean> {
    const result = await AnalysisResultModel.findByIdAndDelete(id);
    return !!result;
  }
}

export const resultRepository = new ResultRepository();
