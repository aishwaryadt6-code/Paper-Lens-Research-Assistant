import mongoose, { Schema, Document, Types } from 'mongoose';
import { PaperStatus, ExtractionStatus, ExtractedMetadata, IParserDiagnostics } from '../types';

export interface IPaper extends Document {
  _id: Types.ObjectId;
  title: string;
  originalFileName: string;
  fileId: Types.ObjectId;
  fileSize: number;
  mimeType: string;
  checksum: string;
  workspace: Types.ObjectId;
  uploadedBy: Types.ObjectId;
  status: PaperStatus;
  pageCount?: number;
  processingError?: string;
  tags: string[];
  isActive: boolean;
  extractionStatus: ExtractionStatus;
  extractedMetadata?: ExtractedMetadata;
  parserDiagnostics?: IParserDiagnostics;
  extractionError?: string;
  extractionStartedAt?: Date;
  extractionCompletedAt?: Date;
  extractionVersion: number;
  aiInsights?: {
    executiveSummary: string;
    keyFindings: string[];
    vivaQuestions: string[];
    generatedAt: Date;
  };
  aiInsightsStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

const PaperSchema = new Schema<IPaper>(
  {
    title: {
      type: String,
      required: [true, 'Paper title is required'],
      trim: true,
      maxlength: [500, 'Title cannot exceed 500 characters'],
    },
    originalFileName: {
      type: String,
      required: true,
      trim: true,
    },
    fileId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
      min: [0, 'File size must be positive'],
    },
    mimeType: {
      type: String,
      required: true,
      default: 'application/pdf',
    },
    checksum: {
      type: String,
      required: true,
    },
    workspace: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['uploading', 'processing', 'ready', 'failed'] as PaperStatus[],
      default: 'uploading',
    },
    pageCount: {
      type: Number,
      default: null,
    },
    processingError: {
      type: String,
      default: null,
    },
    extractionStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    extractedMetadata: {
      fullText: { type: String, default: '' },
      title: { type: String, default: '' },
      authors: { type: String, default: '' },
      abstract: { type: String, default: '' },
      keywords: { type: String, default: '' },
      introduction: { type: String, default: '' },
      methodology: { type: String, default: '' },
      results: { type: String, default: '' },
      conclusion: { type: String, default: '' },
      references: { type: String, default: '' },
      sections: { type: [{ title: String, content: String }], default: [] },
    },
    parserDiagnostics: {
      parserVersion: { type: String, default: '2.2' },
      documentType: { type: String, default: 'unknown' },
      detectedTitle: { type: String, default: '' },
      detectedAuthors: { type: String, default: '' },
      detectedSections: { type: [String], default: [] },
      missingSections: { type: [String], default: [] },
      parserWarnings: { type: [String], default: [] },
      extractionConfidence: { type: Number, default: 0 },
      hasTableOfContents: { type: Boolean, default: false },
    },
    extractionError: {
      type: String,
      default: null,
    },
    extractionStartedAt: {
      type: Date,
      default: null,
    },
    extractionCompletedAt: {
      type: Date,
      default: null,
    },
    extractionVersion: {
      type: Number,
      default: 0,
    },
    tags: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    aiInsights: {
      executiveSummary: { type: String, default: '' },
      keyFindings: { type: [String], default: [] },
      vivaQuestions: { type: [String], default: [] },
      generatedAt: { type: Date, default: null }
    },
    aiInsightsStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending'
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete (ret as any).__v;
        return ret;
      },
    },
  }
);

PaperSchema.index({ workspace: 1 });
PaperSchema.index({ uploadedBy: 1 });
PaperSchema.index({ status: 1 });
PaperSchema.index({ checksum: 1, workspace: 1 });
PaperSchema.index({ title: 'text', originalFileName: 'text' });
PaperSchema.index({ createdAt: -1 });

export const Paper = mongoose.model<IPaper>('Paper', PaperSchema);
