import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, FileText, Calendar } from 'lucide-react';
import { useProfile, useUpdateProfile } from '../hooks/useProfile';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Avatar, Skeleton } from '../components/ui/Primitives';
import { toast } from '../components/ui/Toast';
import { extractApiError, formatRelativeTime } from '../components/ui/utils';

const schema = z.object({
  name: z.string().min(2).max(80),
  bio: z.string().max(500).optional(),
});

type FormData = z.infer<typeof schema>;

export default function ProfilePage() {
  const { data: user, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: user ? { name: user.name, bio: user.bio || '' } : undefined,
  });

  async function onSubmit(data: FormData) {
    try {
      await updateProfile.mutateAsync(data);
      toast.success('Profile updated');
    } catch (err) {
      toast.error('Failed to update profile', extractApiError(err));
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-xl space-y-6 animate-fade-in">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <div className="rounded-xl border border-surface-border dark:border-dark-border p-6 space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-3 w-48 rounded" />
            </div>
          </div>
          <Skeleton className="h-9 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-white/5 p-6 rounded-2xl border border-surface-border dark:border-dark-border shadow-soft-sm">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <User className="h-5 w-5 text-brand-500" />
            Profile settings
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your personal profile and account credentials
          </p>
        </div>
      </div>

      {/* Profile Header */}
      <div className="rounded-2xl border border-surface-border dark:border-dark-border bg-white dark:bg-white/5 p-6 shadow-soft">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-surface-border dark:border-white/5">
          {user && <Avatar src={user.avatarUrl} name={user.name} size="xl" />}
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {user?.name}
            </h2>
            <div className="flex items-center gap-1.5 mt-1">
              <Mail className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-xs text-slate-500 dark:text-slate-400">{user?.email}</span>
            </div>
            {user?.createdAt && (
              <div className="flex items-center gap-1.5 mt-1">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-[11px] text-slate-400">
                  Member since {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Full name"
            leftIcon={<User className="h-4 w-4" />}
            error={errors.name?.message}
            {...register('name')}
          />
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5 mb-0.5">
              <FileText className="h-4 w-4 text-slate-400" />
              Bio <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              {...register('bio')}
              rows={3}
              placeholder="Tell us about your research interests..."
              className="w-full rounded-xl border border-surface-border dark:border-dark-border bg-white dark:bg-dark-secondary text-slate-900 dark:text-slate-100 text-xs px-3.5 py-2.5 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/15 resize-none transition-all shadow-soft-sm"
            />
          </div>
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              size="sm"
              loading={updateProfile.isPending}
              disabled={!isDirty}
              className="bg-gradient-to-r from-brand-500 to-indigo-600 text-white font-bold shadow-soft-sm hover:scale-[1.02] active:scale-[0.98] transition-all h-9 px-4 rounded-xl text-xs"
            >
              Save Changes
            </Button>
          </div>
        </form>
      </div>

      {/* Account Info */}
      <div className="rounded-2xl border border-surface-border dark:border-dark-border bg-white dark:bg-white/5 p-6 shadow-soft">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">
          Account Details
        </h3>
        <div className="space-y-1">
          {[
            { label: 'Role', value: user?.role ?? '-' },
            { label: 'Email verified', value: user?.isEmailVerified ? 'Yes' : 'No' },
            { label: 'Last login', value: user?.lastLoginAt ? formatRelativeTime(user.lastLoginAt) : 'N/A' },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-surface-border dark:border-white/5 last:border-0 text-xs">
              <span className="text-slate-500 dark:text-slate-400">{label}</span>
              <span className="text-slate-900 dark:text-slate-100 font-bold capitalize">
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
