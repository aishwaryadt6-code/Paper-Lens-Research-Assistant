import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from './utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftIcon, rightIcon, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-bold text-slate-600 dark:text-slate-455 mb-0.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full h-10 rounded-xl border bg-white dark:bg-dark-secondary text-slate-900 dark:text-slate-100 shadow-soft-sm',
              'border-surface-border dark:border-dark-border',
              'placeholder:text-slate-400 dark:placeholder:text-slate-600',
              'text-xs transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-brand-500/15 focus:border-brand-500',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              leftIcon ? 'pl-9' : 'px-3.5',
              rightIcon ? 'pr-9' : 'px-3.5',
              error && 'border-red-400 dark:border-red-500 focus:ring-red-400/20',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="text-2xs text-red-500 dark:text-red-400 mt-0.5">{error}</p>}
        {hint && !error && <p className="text-2xs text-slate-400 dark:text-slate-500 mt-0.5">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
export type { InputProps };
