import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FolderOpen, FileText, Users, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { cn, formatRelativeTime } from '../ui/utils';
import { Workspace } from '../../types';
import { useDeleteWorkspace } from '../../hooks/useWorkspaces';
import { toast } from '../ui/Toast';
import { extractApiError } from '../ui/utils';

interface WorkspaceCardProps {
  workspace: Workspace;
  onEdit?: (workspace: Workspace) => void;
}

export function WorkspaceCard({ workspace, onEdit }: WorkspaceCardProps) {
  const navigate = useNavigate();
  const deleteWorkspace = useDeleteWorkspace();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    setMenuOpen(false);
    if (!confirm(`Delete workspace "${workspace.name}"? This cannot be undone.`)) return;
    try {
      await deleteWorkspace.mutateAsync(workspace._id);
      toast.success('Workspace deleted');
    } catch (err) {
      toast.error('Failed to delete workspace', extractApiError(err));
    }
  }

  return (
    <motion.div
      whileHover={{ y: -2 }}
      onClick={() => navigate(`/workspaces/${workspace._id}`)}
      className={cn(
        'group relative flex flex-col rounded-2xl cursor-pointer p-5',
        'bg-white dark:bg-dark-secondary',
        'border border-surface-border dark:border-dark-border shadow-soft',
        'hover:shadow-soft-md hover:border-brand-500/20 transition-all duration-300'
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-brand-50 dark:bg-brand-950">
          <FolderOpen className="h-5 w-5 text-brand-600 dark:text-brand-400" />
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
            className={cn(
              'flex items-center justify-center h-7 w-7 rounded-lg',
              'text-slate-400 opacity-0 group-hover:opacity-100',
              'hover:bg-surface-secondary dark:hover:bg-dark-tertiary',
              'transition-all duration-100'
            )}
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>

          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                'absolute right-0 top-full mt-1 w-40 rounded-xl z-10 overflow-hidden',
                'bg-white dark:bg-dark-secondary',
                'border border-surface-border dark:border-dark-border',
                'shadow-soft-lg'
              )}
            >
              <div className="p-1.5">
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onEdit?.(workspace); }}
                  className="flex items-center gap-2.5 w-full px-2.5 h-8 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-surface-secondary dark:hover:bg-dark-tertiary transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2.5 w-full px-2.5 h-8 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate mb-1">
        {workspace.name}
      </h3>
      {workspace.description && (
        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">
          {workspace.description}
        </p>
      )}

      <div className="mt-auto flex items-center gap-4 pt-3 border-t border-surface-border dark:border-dark-border">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <FileText className="h-3.5 w-3.5" />
          <span>{workspace.statistics.paperCount} papers</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <Users className="h-3.5 w-3.5" />
          <span>{workspace.statistics.memberCount} members</span>
        </div>
        <span className="ml-auto text-2xs text-slate-400 dark:text-slate-600">
          {formatRelativeTime(workspace.updatedAt)}
        </span>
      </div>
    </motion.div>
  );
}
