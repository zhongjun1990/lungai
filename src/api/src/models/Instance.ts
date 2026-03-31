// Instance MongoDB Model
import mongoose, { Document, Schema } from 'mongoose';

export interface IInstance extends Document {
  seriesId: string;
  sopInstanceUid?: string;
  instanceNumber?: number;
  fileLocation: string;
  fileSize?: number;
  tags?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const InstanceSchema: Schema = new Schema({
  seriesId: {
    type: String,
    required: true,
    index: true,
  },
  sopInstanceUid: {
    type: String,
    unique: true,
    sparse: true,
  },
  instanceNumber: {
    type: Number,
  },
  fileLocation: {
    type: String,
    required: true,
  },
  fileSize: {
    type: Number,
  },
  tags: {
    type: Schema.Types.Mixed,
  },
}, {
  timestamps: true,
});

InstanceSchema.index({ seriesId: 1 });
InstanceSchema.index({ sopInstanceUid: 1 }, { unique: true, sparse: true });

export const Instance = mongoose.model<IInstance>('Instance', InstanceSchema);
