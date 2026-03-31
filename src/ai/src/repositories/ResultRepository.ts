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
    return result ? result.toObject() : null;
  }

  async findByTaskId(taskId: string): Promise<AnalysisResult | null> {
    const result = await AnalysisResultModel.findOne({ taskId });
    return result ? result.toObject() : null;
  }

  async create(params: CreateResultParams): Promise<AnalysisResult> {
    const result = await AnalysisResultModel.create({
      ...params,
    });
    return result.toObject();
  }

  async update(id: string, updates: Partial<AnalysisResult>): Promise<AnalysisResult | null> {
    const result = await AnalysisResultModel.findByIdAndUpdate(
      id,
      updates,
      { new: true }
    );
    return result ? result.toObject() : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await AnalysisResultModel.findByIdAndDelete(id);
    return !!result;
  }
}

export const resultRepository = new ResultRepository();
