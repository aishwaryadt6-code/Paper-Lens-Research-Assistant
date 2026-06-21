import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, CheckCheck, FileText, FolderOpen, AlertCircle } from 'lucide-react';
import { cn, formatRelativeTime } from '../ui/utils';
import { useNotifications, useMarkRead, useMarkAllRead } from '../../hooks/useNotifications';
import { Skeleton } from '../ui/Primitives';
import { NotificationType } from '../../types';

const notificationIcons: Record<NotificationType, React.ReactNode> = {
  upload_completed: <FileText className="h-4 w-4 text-emerald-500" />,
  upload_failed: <AlertCircle className="h-4 w-4 text-red-500" />,
  workspace_invite: <FolderOpen className="h-4 w-4 text-brand-500" />,
};

interface NotificationPanelProps {
  onClose: () => void;
}

export function NotificationPanel({ onClose }: NotificationPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const { data, isLoading } = useNotifications();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <motion.div
      ref={panelRef}
      initial={{ opacity: 0, y: 6, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.97 }}
      transition={{ duration: 0.15 }}
      className={cn(
        'absolute right-0 top-full mt-1.5 w-80 rounded-xl z-50 overflow-hidden',
        'bg-white dark:bg-dark-secondary',
        'border border-surface-border dark:border-dark-border',
        'shadow-soft-lg'
      )}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border dark:border-dark-border">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-slate-500" />
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Notifications
          </span>
          {data && data.unreadCount > 0 && (
            <span className="inline-flex items-center justify-center h-4 min-w-[1rem] px-1 rounded-full bg-brand-600 text-white text-2xs font-medium">
              {data.unreadCount}
            </span>
          )}
        </div>
        {data && data.unreadCount > 0 && (
          <button
            onClick={() => markAllRead.mutate()}
            className="flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 hover:underline"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </button>
        )}
      </div>

      <div className="max-h-80 overflow-y-auto scrollbar-thin">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-full rounded" />
                  <Skeleton className="h-3 w-2/3 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : data?.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <Bell className="h-8 w-8 text-slate-200 dark:text-slate-700 mb-2" />
            <p className="text-sm text-slate-500 dark:text-slate-400">No notifications yet</p>
          </div>
        ) : (
          <div>
            {data?.items.map((n) => (
              <button
                key={n._id}
                onClick={() => !n.isRead && markRead.mutate(n._id)}
                className={cn(
                  'w-full flex items-start gap-3 px-4 py-3 text-left transition-colors',
                  'hover:bg-surface-secondary dark:hover:bg-dark-tertiary',
                  !n.isRead && 'bg-brand-50/50 dark:bg-brand-950/20'
                )}
              >
                <div className="shrink-0 mt-0.5 p-1.5 rounded-lg bg-surface-secondary dark:bg-dark-tertiary">
                  {notificationIcons[n.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm text-slate-900 dark:text-slate-100 leading-snug', !n.isRead && 'font-medium')}>
                    {n.title}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                    {n.message}
                  </p>
                  <p className="text-2xs text-slate-400 dark:text-slate-600 mt-1">
                    {formatRelativeTime(n.createdAt)}
                  </p>
                </div>
                {!n.isRead && (
                  <div className="mt-2 h-1.5 w-1.5 rounded-full bg-brand-500 shrink-0" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
