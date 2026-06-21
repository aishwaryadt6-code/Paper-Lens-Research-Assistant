export type UserRole = 'researcher' | 'admin';
export type WorkspaceRole = 'owner' | 'editor' | 'viewer';
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


export type NotificationType = 'upload_completed' | 'upload_failed' | 'workspace_invite';
export type Theme = 'light' | 'dark' | 'system';

export interface User {
  _id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: UserRole;
  bio?: string;
  isEmailVerified: boolean;
  isActive: boolean;
  settings: {
    theme: Theme;
    language: string;
    notifications: {
      email: boolean;
      inApp: boolean;
    };
  };
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMember {
  userId: string | User;
  role: WorkspaceRole;
  joinedAt: string;
}

export interface Workspace {
  _id: string;
  name: string;
  description: string;
  owner: User | string;
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
  createdAt: string;
  updatedAt: string;
}

export interface Paper {
  _id: string;
  title: string;
  originalFileName: string;
  fileId: string;
  fileSize: number;
  mimeType: string;
  workspace: string | Workspace;
  uploadedBy: string | User;
  status: PaperStatus;
  pageCount?: number;
  processingError?: string;
  tags: string[];
  extractionStatus?: ExtractionStatus;
  extractedMetadata?: ExtractedMetadata;
  parserDiagnostics?: IParserDiagnostics;
  extractionError?: string;
  extractionStartedAt?: string;
  extractionCompletedAt?: string;
  extractionVersion?: number;
  aiInsights?: {
    executiveSummary: string;
    keyFindings: string[];
    vivaQuestions: string[];
    generatedAt: string;
  };
  aiInsightsStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  _id: string;
  recipient: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: Record<string, unknown>;
}

export interface ApiError {
  success: false;
  message: string;
  code?: string;
}

export interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
  paperId?: string;
}
