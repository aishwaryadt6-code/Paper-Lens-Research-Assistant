import mongoose, { Schema, Document, Types } from 'mongoose';
import { WorkspaceRole, WorkspaceMember } from '../types';

export interface IWorkspace extends Document {
  _id: Types.ObjectId;
  name: string;
  description: string;
  owner: Types.ObjectId;
  members: WorkspaceMember[];
  settings: {
    isPublic: boolean;
    allowMemberInvite: boolean;
  };
  statistics: {
    paperCount: number;
    memberCount: number;
    storageUsedBytes: number;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WorkspaceMemberSchema = new Schema<WorkspaceMember>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: {
      type: String,
      enum: ['owner', 'editor', 'viewer'] as WorkspaceRole[],
      required: true,
    },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const WorkspaceSchema = new Schema<IWorkspace>(
  {
    name: {
      type: String,
      required: [true, 'Workspace name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      default: '',
      maxlength: [500, 'Description cannot exceed 500 characters'],
      trim: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: {
      type: [WorkspaceMemberSchema],
      default: [],
    },
    settings: {
      isPublic: { type: Boolean, default: false },
      allowMemberInvite: { type: Boolean, default: true },
    },
    statistics: {
      paperCount: { type: Number, default: 0 },
      memberCount: { type: Number, default: 1 },
      storageUsedBytes: { type: Number, default: 0 },
    },
    isActive: { type: Boolean, default: true },
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

WorkspaceSchema.index({ owner: 1 });
WorkspaceSchema.index({ 'members.userId': 1 });
WorkspaceSchema.index({ name: 'text', description: 'text' });
WorkspaceSchema.index({ createdAt: -1 });

export const Workspace = mongoose.model<IWorkspace>('Workspace', WorkspaceSchema);
