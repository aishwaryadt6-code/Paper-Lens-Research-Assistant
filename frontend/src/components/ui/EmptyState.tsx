import { ReactNode } from 'react';
import { cn } from './utils';
import { Button } from './Button';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-16 px-6',
        className
      )}
    >
      <div className="mb-4 p-4 rounded-2xl bg-white dark:bg-dark-tertiary text-brand-600 dark:text-brand-400 border border-surface-border dark:border-dark-border shadow-soft-sm">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs text-balance">
        {description}
      </p>
      {action && (
        <Button className="mt-5" onClick={action.onClick} size="sm">
          {action.label}
        </Button>
      )}
    </div>
  );
}
