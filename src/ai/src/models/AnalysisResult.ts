// AnalysisResult MongoDB Model
import mongoose, { Document, Schema } from 'mongoose';
import { AnalysisFinding } from '../types';

interface IAnalysisFinding extends AnalysisFinding {}

interface IAnalysisResult extends Document {
  taskId: string;
  modelId: string;
  modelVersion: string;
  findings: IAnalysisFinding[];
  visualizationUrl?: string;
  reportText?: string;
  metrics?: {
    inferenceTimeMs: number;
    totalFindings: number;
    confidenceScore: number;
  };
  rawOutput?: Record<string, unknown>;
  createdAt: Date;
}

const AnalysisFindingSchema: Schema = new Schema({
  type: {
    type: String,
    required: true,
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 1,
  },
  bbox: {
    x: Number,
    y: Number,
    width: Number,
    height: Number,
  },
  volume: Number,
  description: String,
  metadata: Schema.Types.Mixed,
}, {
  _id: false,
});

const AnalysisResultSchema: Schema = new Schema({
  taskId: {
    type: String,
    required: true,
    index: true,
    unique: true,
  },
  modelId: {
    type: String,
    required: true,
  },
  modelVersion: {
    type: String,
    required: true,
  },
  findings: [AnalysisFindingSchema],
  visualizationUrl: String,
  reportText: String,
  metrics: {
    inferenceTimeMs: Number,
    totalFindings: Number,
    confidenceScore: Number,
  },
  rawOutput: Schema.Types.Mixed,
}, {
  timestamps: { createdAt: true, updatedAt: false },
});

AnalysisResultSchema.index({ taskId: 1 }, { unique: true });
AnalysisResultSchema.index({ modelId: 1, createdAt: -1 });

export const AnalysisResult = mongoose.model<IAnalysisResult>('AnalysisResult', AnalysisResultSchema);
