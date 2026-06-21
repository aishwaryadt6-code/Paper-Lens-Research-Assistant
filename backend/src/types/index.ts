import { Request } from 'express';
import { Types } from 'mongoose';

export type UserRole = 'researcher' | 'admin';
export type WorkspaceRole = 'owner' | 'editor' | 'viewer';
export type NotificationType = 'upload_completed' | 'upload_failed' | 'workspace_invite';
export type PaperStatus = 'uploading' | 'processing' | 'ready' | 'failed';
export type ExtractionStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface ExtractedMetadata {
  fullText: string;
  title: string;
  authors: string;
  abstract: string;
  keywords: string;
  introduction: string;
  methodology: string;
  results: string;
  conclusion: string;
  references: string;
  sections?: { title: string; content: string }[];
}

export interface IParserDiagnostics {
  parserVersion: string;
  documentType: 'research_paper' | 'thesis' | 'book' | 'report' | 'unknown';
  detectedTitle: string;
  detectedAuthors: string;
  detectedSections: string[];
  missingSections: string[];
  parserWarnings: string[];
  extractionConfidence: number;
  hasTableOfContents: boolean;
}


export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: UserRole;
  };
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface WorkspaceMember {
  userId: Types.ObjectId;
  role: WorkspaceRole;
  joinedAt: Date;
}

export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface GoogleAuthDTO {
  idToken: string;
}

export interface CreateWorkspaceDTO {
  name: string;
  description?: string;
}

export interface UpdateWorkspaceDTO {
  name?: string;
  description?: string;
}

export interface UpdateProfileDTO {
  name?: string;
  bio?: string;
  settings?: {
    theme?: 'light' | 'dark' | 'system';
    language?: string;
    notifications?: {
      email?: boolean;
      inApp?: boolean;
    };
  };
}

export interface InviteMemberDTO {
  email: string;
  role: WorkspaceRole;
}
