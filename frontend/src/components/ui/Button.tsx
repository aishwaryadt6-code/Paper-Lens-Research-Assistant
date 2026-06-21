import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './utils';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-ring disabled:pointer-events-none disabled:opacity-50 select-none hover:scale-[1.01] active:scale-[0.99]',
  {
    variants: {
      variant: {
        primary:
          'bg-gradient-to-r from-brand-500 to-indigo-600 text-white shadow-soft-sm hover:shadow-glow-sm hover:brightness-105',
        secondary:
          'bg-white dark:bg-dark-tertiary text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-dark-border border border-surface-border dark:border-dark-border shadow-soft-sm',
        ghost:
          'text-slate-600 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-100',
        destructive:
          'bg-gradient-to-r from-red-500 to-red-600 text-white hover:brightness-105 active:scale-[0.98] shadow-soft-sm',
        outline:
          'border border-surface-border dark:border-dark-border bg-transparent text-slate-700 dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5',
        link: 'text-brand-600 dark:text-brand-400 underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-9 px-4',
        lg: 'h-10 px-5 text-base',
        xl: 'h-12 px-6 text-base',
        icon: 'h-9 w-9 p-0',
        'icon-sm': 'h-7 w-7 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
export type { ButtonProps };
