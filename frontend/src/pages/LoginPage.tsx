import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Sparkles } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';
import { toast } from '../components/ui/Toast';
import { extractApiError } from '../components/ui/utils';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    try {
      await login.mutateAsync(data);
    } catch (err) {
      toast.error('Sign in failed', extractApiError(err));
    }
  }

  return (
    <div className="animate-fade-in bg-white/70 dark:bg-dark-secondary/50 backdrop-blur-xl border border-surface-border dark:border-white/5 rounded-2xl p-8 shadow-soft-xl relative overflow-hidden">
      {/* Decorative gradient overlay */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 via-indigo-500 to-indigo-600" />
      
      <div className="mb-6">
        <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5 tracking-tight">
          Welcome to Paper Lens AI <Sparkles className="h-4 w-4 text-brand-500" />
        </h1>
        <p className="text-xs text-slate-505 dark:text-slate-400 mt-1">
          Access your research intelligence dashboard
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email address"
          type="email"
          placeholder="youremail@gmail.com"
          leftIcon={<Mail className="h-4 w-4" />}
          error={errors.email?.message}
          autoComplete="email"
          className="focus:ring-brand-500/20"
          {...register('email')}
        />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          leftIcon={<Lock className="h-4 w-4" />}
          error={errors.password?.message}
          autoComplete="current-password"
          className="focus:ring-brand-500/20"
          {...register('password')}
        />

        <div className="flex items-center justify-between text-2xs text-slate-550 dark:text-slate-400">
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input type="checkbox" className="rounded border-slate-300 dark:border-dark-border text-brand-600 focus:ring-brand-500 h-3.5 w-3.5 bg-transparent" />
            <span>Remember me</span>
          </label>
          <a href="#" className="hover:underline text-brand-600 dark:text-brand-400 font-semibold" onClick={(e) => e.preventDefault()}>
            Forgot password?
          </a>
        </div>

        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-brand-500 to-indigo-600 hover:scale-[1.01] hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-200 shadow-md shadow-brand-500/10 hover:shadow-glow font-bold text-xs h-10 rounded-xl mt-2"
          loading={login.isPending}
        >
          Sign in to Platform
        </Button>
      </form>

      <p className="mt-6 text-center text-2xs text-slate-500 dark:text-slate-400">
        New to Paper Lens?{' '}
        <Link
          to="/register"
          className="text-brand-600 dark:text-brand-400 font-bold hover:underline"
        >
          Create free account
        </Link>
      </p>
    </div>
  );
}

