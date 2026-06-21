import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2, FolderOpen } from 'lucide-react';
import { cn, formatBytes } from '../ui/utils';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useUIStore } from '../../stores/uiStore';
import { useUploadStore } from '../../stores/uploadStore';
import { useUploadPaper } from '../../hooks/usePapers';
import { useWorkspaces } from '../../hooks/useWorkspaces';
import { toast } from '../ui/Toast';
import { extractApiError } from '../ui/utils';

export function UploadModal() {
  const { uploadModalOpen, setUploadModalOpen, activeWorkspaceId } = useUIStore();
  const { queue, addFiles, removeFile, clearCompleted } = useUploadStore();
  const { data: workspaces } = useWorkspaces();
  const [selectedWorkspace, setSelectedWorkspace] = useState(activeWorkspaceId || '');

  const uploadMutation = useUploadPaper(selectedWorkspace);

  const onDrop = useCallback(
    async (accepted: File[]) => {
      if (!selectedWorkspace) {
        toast.error('Select a workspace first');
        return;
      }
      const ids = addFiles(accepted);
      for (let i = 0; i < accepted.length; i++) {
        try {
          await uploadMutation.mutateAsync({ uploadId: ids[i], file: accepted[i] });
        } catch (err) {
          toast.error(`Failed to upload ${accepted[i].name}`, extractApiError(err));
        }
      }
    },
    [selectedWorkspace, addFiles, uploadMutation]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: 50 * 1024 * 1024,
    disabled: !selectedWorkspace,
  });

  const activeUploads = queue.filter((f) => f.status === 'uploading' || f.status === 'pending');
  const hasCompleted = queue.some((f) => f.status === 'done' || f.status === 'error');

  function handleClose() {
    if (activeUploads.length > 0) return;
    clearCompleted();
    setUploadModalOpen(false);
  }

  return (
    <Modal
      open={uploadModalOpen}
      onClose={handleClose}
      title="Upload Papers"
      description="Upload PDF research papers to your workspace."
      size="lg"
    >
      <div className="space-y-4">
        {/* Workspace Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <FolderOpen className="h-4 w-4" />
            Workspace
          </label>
          <select
            value={selectedWorkspace}
            onChange={(e) => setSelectedWorkspace(e.target.value)}
            className="w-full h-9 rounded-lg border border-surface-border dark:border-dark-border bg-white dark:bg-dark-secondary text-slate-900 dark:text-slate-100 text-sm px-3 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Select a workspace...</option>
            {workspaces?.map((ws) => (
              <option key={ws._id} value={ws._id}>
                {ws.name}
              </option>
            ))}
          </select>
        </div>

        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={cn(
            'relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all duration-150 p-8 cursor-pointer',
            isDragActive
              ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/20'
              : 'border-surface-border dark:border-dark-border hover:border-brand-300 dark:hover:border-brand-700 hover:bg-surface-secondary dark:hover:bg-dark-tertiary',
            !selectedWorkspace && 'opacity-50 cursor-not-allowed'
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center text-center gap-2">
            <div className={cn(
              'p-3 rounded-xl',
              isDragActive ? 'bg-brand-100 dark:bg-brand-950' : 'bg-surface-secondary dark:bg-dark-tertiary'
            )}>
              <Upload className={cn('h-6 w-6', isDragActive ? 'text-brand-600' : 'text-slate-400')} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {isDragActive ? 'Drop PDFs here' : 'Drag & drop PDFs'}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-600 mt-0.5">
                or click to browse · PDF only · max 50 MB per file
              </p>
            </div>
          </div>
        </div>

        {/* Upload Queue */}
        <AnimatePresence>
          {queue.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin"
            >
              {queue.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-surface-secondary dark:bg-dark-tertiary"
                >
                  <div className="shrink-0">
                    <FileText className="h-4 w-4 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                      {item.file.name}
                    </p>
                    <p className="text-2xs text-slate-400">{formatBytes(item.file.size)}</p>
                    {item.status === 'uploading' && (
                      <div className="mt-1.5 h-1 bg-surface-tertiary dark:bg-dark-border rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-brand-500 rounded-full"
                          animate={{ width: `${item.progress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    )}
                    {item.error && (
                      <p className="text-2xs text-red-500 mt-0.5">{item.error}</p>
                    )}
                  </div>
                  <div className="shrink-0">
                    {item.status === 'done' && <CheckCircle className="h-4 w-4 text-emerald-500" />}
                    {item.status === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
                    {(item.status === 'uploading' || item.status === 'pending') && (
                      <Loader2 className="h-4 w-4 text-brand-500 animate-spin" />
                    )}
                  </div>
                  {(item.status === 'done' || item.status === 'error') && (
                    <button
                      onClick={() => removeFile(item.id)}
                      className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-end gap-2.5 pt-1">
          {hasCompleted && (
            <Button variant="ghost" size="sm" onClick={clearCompleted}>
              Clear completed
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={activeUploads.length > 0}
          >
            {activeUploads.length > 0 ? `Uploading ${activeUploads.length}...` : 'Close'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
