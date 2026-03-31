// Series MongoDB Model
import mongoose, { Document, Schema } from 'mongoose';

export interface ISeries extends Document {
  studyId: string;
  seriesInstanceUid?: string;
  seriesNumber?: number;
  modality: string;
  description?: string;
  numberOfInstances: number;
  createdAt: Date;
  updatedAt: Date;
}

const SeriesSchema: Schema = new Schema({
  studyId: {
    type: String,
    required: true,
    index: true,
  },
  seriesInstanceUid: {
    type: String,
    unique: true,
    sparse: true,
  },
  seriesNumber: {
    type: Number,
  },
  modality: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  numberOfInstances: {
    type: Number,
    required: true,
    default: 0,
  },
}, {
  timestamps: true,
});

SeriesSchema.index({ studyId: 1 });
SeriesSchema.index({ seriesInstanceUid: 1 }, { unique: true, sparse: true });

export const Series = mongoose.model<ISeries>('Series', SeriesSchema);
