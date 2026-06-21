import { Upload, CheckCircle, AlertCircle, Loader2, X, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUploadStore } from '../stores/uploadStore';
import { useUIStore } from '../stores/uiStore';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { cn, formatBytes } from '../components/ui/utils';

export default function UploadsPage() {
  const { queue, removeFile, clearCompleted } = useUploadStore();
  const { setUploadModalOpen } = useUIStore();

  const hasCompleted = queue.some((f) => f.status === 'done' || f.status === 'error');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Uploads</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Track your upload progress
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasCompleted && (
            <Button variant="secondary" size="sm" onClick={clearCompleted}>
              <Trash2 className="h-3.5 w-3.5" />
              Clear completed
            </Button>
          )}
          <Button size="sm" onClick={() => setUploadModalOpen(true)}>
            <Upload className="h-3.5 w-3.5" />
            Upload Papers
          </Button>
        </div>
      </div>

      {queue.length === 0 ? (
        <EmptyState
          icon={<Upload className="h-8 w-8" />}
          title="No uploads"
          description="Upload research papers to your workspace to see them here."
          action={{ label: 'Upload papers', onClick: () => setUploadModalOpen(true) }}
        />
      ) : (
        <div className="rounded-xl border border-surface-border dark:border-dark-border bg-white dark:bg-dark-secondary overflow-hidden">
          <AnimatePresence>
            {queue.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={cn(
                  'flex items-center gap-4 px-5 py-4',
                  i < queue.length - 1 && 'border-b border-surface-border dark:border-dark-border'
                )}
              >
                <div className="shrink-0">
                  {item.status === 'done' && <CheckCircle className="h-5 w-5 text-emerald-500" />}
                  {item.status === 'error' && <AlertCircle className="h-5 w-5 text-red-500" />}
                  {(item.status === 'uploading' || item.status === 'pending') && (
                    <Loader2 className="h-5 w-5 text-brand-500 animate-spin" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                    {item.file.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-400">{formatBytes(item.file.size)}</span>
                    {item.status === 'uploading' && (
                      <span className="text-xs text-brand-600 dark:text-brand-400">
                        {item.progress}%
                      </span>
                    )}
                    {item.error && (
                      <span className="text-xs text-red-500">{item.error}</span>
                    )}
                  </div>
                  {item.status === 'uploading' && (
                    <div className="mt-2 h-1 bg-surface-tertiary dark:bg-dark-border rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-brand-500 rounded-full"
                        animate={{ width: `${item.progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  )}
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <span
                    className={cn(
                      'text-xs font-medium px-2 py-0.5 rounded-full',
                      item.status === 'done' && 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300',
                      item.status === 'error' && 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300',
                      item.status === 'uploading' && 'bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300',
                      item.status === 'pending' && 'bg-surface-secondary dark:bg-dark-tertiary text-slate-500'
                    )}
                  >
                    {item.status === 'done' ? 'Complete' : item.status === 'error' ? 'Failed' : item.status === 'uploading' ? 'Uploading' : 'Pending'}
                  </span>
                  {(item.status === 'done' || item.status === 'error') && (
                    <button
                      onClick={() => removeFile(item.id)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
