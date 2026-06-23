import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPaperAIResult extends Document {
  paperId: Types.ObjectId;
  workspaceId: Types.ObjectId;
  similarityResults: any;
  contradictionResults: any;
  graphEdges: any;
  jobStatus: 'pending' | 'processing' | 'completed' | 'failed' | 'delayed';
  lastProcessedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PaperAIResultSchema = new Schema<IPaperAIResult>(
  {
    paperId: {
      type: Schema.Types.ObjectId,
      ref: 'Paper',
      required: true,
      unique: true,
    },
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
    },
    similarityResults: {
      type: Schema.Types.Mixed,
      default: {},
    },
    contradictionResults: {
      type: Schema.Types.Mixed,
      default: {},
    },
    graphEdges: {
      type: Schema.Types.Mixed,
      default: [],
    },
    jobStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'delayed'],
      default: 'pending',
    },
    lastProcessedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

PaperAIResultSchema.index({ paperId: 1 });
PaperAIResultSchema.index({ workspaceId: 1 });
PaperAIResultSchema.index({ jobStatus: 1 });

export const PaperAIResult = mongoose.model<IPaperAIResult>('PaperAIResult', PaperAIResultSchema);
export default PaperAIResult;
