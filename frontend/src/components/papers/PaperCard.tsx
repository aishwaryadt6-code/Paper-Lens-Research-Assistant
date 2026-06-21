import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Trash2, Download, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { cn, formatBytes, formatRelativeTime } from '../ui/utils';
import { Paper, PaperStatus } from '../../types';
import { Badge } from '../ui/Primitives';
import { useDeletePaper } from '../../hooks/usePapers';
import { toast } from '../ui/Toast';
import { extractApiError } from '../ui/utils';
import apiClient from '../../services/apiClient';

const statusConfig: Record<PaperStatus, { label: string; icon: React.ReactNode; badge: 'success' | 'warning' | 'danger' | 'default' }> = {
  ready:      { label: 'Ready',      icon: <CheckCircle className="h-3 w-3" />,             badge: 'success' },
  processing: { label: 'Processing', icon: <Loader2 className="h-3 w-3 animate-spin" />,    badge: 'warning' },
  uploading:  { label: 'Uploading',  icon: <Loader2 className="h-3 w-3 animate-spin" />,    badge: 'default' },
  failed:     { label: 'Failed',     icon: <AlertCircle className="h-3 w-3" />,              badge: 'danger'  },
};

interface PaperCardProps {
  paper: Paper;
}

export function PaperCard({ paper }: PaperCardProps) {
  const navigate = useNavigate();
  const deletePaper = useDeletePaper();
  const status = statusConfig[paper.status];

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm(`Delete "${paper.title}"?`)) return;
    try {
      await deletePaper.mutateAsync(paper._id);
      toast.success('Paper deleted');
    } catch (err) {
      toast.error('Failed to delete paper', extractApiError(err));
    }
  }

  async function handleDownload(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    try {
      const response = await apiClient.get(`/papers/${paper._id}/stream`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = paper.originalFileName || `${paper.title}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error('Failed to download paper', extractApiError(err));
    }
  }

  return (
    <motion.div
      whileHover={{ y: -2 }}
      onClick={() => navigate(`/papers/${paper._id}`)}
      className={cn(
        'group relative flex flex-col rounded-2xl p-5 cursor-pointer',
        'bg-white dark:bg-dark-secondary',
        'border border-surface-border dark:border-dark-border shadow-soft',
        'hover:shadow-soft-md hover:border-brand-500/20 transition-all duration-300'
      )}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-surface-secondary dark:bg-dark-tertiary shrink-0">
          <FileText className="h-4 w-4 text-slate-400 dark:text-slate-500" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate leading-snug">
            {paper.title}
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-600 mt-0.5 truncate">
            {paper.originalFileName}
          </p>
        </div>
        <Badge variant={status.badge} className="shrink-0 flex items-center gap-1">
          {status.icon}
          {status.label}
        </Badge>
      </div>

      <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-600">
        <span>{formatBytes(paper.fileSize)}</span>
        {paper.pageCount && <><span>·</span><span>{paper.pageCount} pages</span></>}
        <span>·</span>
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>{formatRelativeTime(paper.createdAt)}</span>
        </div>
      </div>

      {/* Hover actions */}
      <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleDownload}
          className="flex items-center justify-center h-7 w-7 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-surface-secondary dark:hover:bg-dark-tertiary transition-colors"
          title="Download PDF"
        >
          <Download className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={handleDelete}
          disabled={deletePaper.isPending}
          className="flex items-center justify-center h-7 w-7 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          title="Delete paper"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  );
}
