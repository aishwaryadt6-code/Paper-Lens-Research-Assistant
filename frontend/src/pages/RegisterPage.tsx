import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, Lock, Sparkles } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';
import { toast } from '../components/ui/Toast';
import { extractApiError } from '../components/ui/utils';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(80),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Minimum 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const { register: registerUser } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    try {
      await registerUser.mutateAsync(data);
    } catch (err) {
      toast.error('Registration failed', extractApiError(err));
    }
  }

  return (
    <div className="animate-fade-in bg-white/70 dark:bg-dark-secondary/50 backdrop-blur-xl border border-surface-border dark:border-white/5 rounded-2xl p-8 shadow-soft-xl relative overflow-hidden">
      {/* Decorative gradient line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 via-indigo-500 to-indigo-600" />
      
      <div className="mb-6">
        <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5 tracking-tight">
          Create Account <Sparkles className="h-4 w-4 text-brand-500" />
        </h1>
        <p className="text-xs text-slate-505 dark:text-slate-400 mt-1">
          Start parsing and synthesizing papers with AI
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Full name"
          type="text"
          placeholder="Dr. Jane Smith"
          leftIcon={<User className="h-4 w-4" />}
          error={errors.name?.message}
          autoComplete="name"
          className="focus:ring-brand-500/20"
          {...register('name')}
        />
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
          placeholder="Min. 8 chars, 1 uppercase, 1 number"
          leftIcon={<Lock className="h-4 w-4" />}
          error={errors.password?.message}
          autoComplete="new-password"
          hint="At least 8 characters, one uppercase letter and one number"
          className="focus:ring-brand-500/20"
          {...register('password')}
        />

        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-brand-500 to-indigo-600 hover:scale-[1.01] hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-200 shadow-md shadow-brand-500/10 hover:shadow-glow font-bold text-xs h-10 rounded-xl mt-4"
          loading={registerUser.isPending}
        >
          Create Free Account
        </Button>
      </form>

      <p className="mt-6 text-center text-2xs text-slate-500 dark:text-slate-400">
        Already have an account?{' '}
        <Link
          to="/login"
          className="text-brand-600 dark:text-brand-400 font-bold hover:underline"
        >
          Sign in
        </Link>
      </p>

      <p className="mt-4 text-center text-[10px] text-slate-400 dark:text-slate-650 leading-normal border-t border-surface-border dark:border-white/5 pt-3">
        By creating an account, you agree to our terms of service and privacy policy.
      </p>
    </div>
  );
}

