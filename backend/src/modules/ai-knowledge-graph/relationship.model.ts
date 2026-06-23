import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPaperRelationship extends Document {
  _id: Types.ObjectId;
  sourcePaperId: Types.ObjectId;
  targetPaperId: Types.ObjectId;
  relationType: 'similarity' | 'contradiction' | 'weak';
  similarityScore: number;
  contradictionScore: number;
  confidenceScore: number;
  reasoningSummary: string;
  workspaceId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PaperRelationshipSchema = new Schema<IPaperRelationship>(
  {
    sourcePaperId: {
      type: Schema.Types.ObjectId,
      ref: 'Paper',
      required: true,
    },
    targetPaperId: {
      type: Schema.Types.ObjectId,
      ref: 'Paper',
      required: true,
    },
    relationType: {
      type: String,
      enum: ['similarity', 'contradiction', 'weak'],
      required: true,
    },
    similarityScore: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    contradictionScore: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    confidenceScore: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    reasoningSummary: {
      type: String,
      required: true,
      default: '',
    },
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'paper_relationships',
  }
);

// Indexes
PaperRelationshipSchema.index({ sourcePaperId: 1 });
PaperRelationshipSchema.index({ targetPaperId: 1 });
PaperRelationshipSchema.index({ workspaceId: 1 });
PaperRelationshipSchema.index({ relationType: 1 });
PaperRelationshipSchema.index({ similarityScore: -1 });
PaperRelationshipSchema.index({ updatedAt: -1 });

// Composite index to avoid duplicate connections between same pair of papers in a workspace
PaperRelationshipSchema.index({ sourcePaperId: 1, targetPaperId: 1 }, { unique: true });

export const PaperRelationship = mongoose.model<IPaperRelationship>(
  'PaperRelationship',
  PaperRelationshipSchema
);
export default PaperRelationship;
