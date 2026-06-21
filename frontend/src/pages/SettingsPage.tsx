import { Sun, Moon, Monitor, Globe, Bell } from 'lucide-react';
import { useUIStore } from '../stores/uiStore';
import { useUpdateProfile } from '../hooks/useProfile';
import { useProfile } from '../hooks/useProfile';
import { toast } from '../components/ui/Toast';
import { extractApiError } from '../components/ui/utils';
import { cn } from '../components/ui/utils';

const themes = [
  { value: 'light' as const, label: 'Light', icon: Sun },
  { value: 'dark' as const, label: 'Dark', icon: Moon },
  { value: 'system' as const, label: 'System', icon: Monitor },
];

const languages = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
  { value: 'ta', label: 'Tamil' },
  { value: 'te', label: 'Telugu' },
  { value: 'kn', label: 'Kannada' },
];

export default function SettingsPage() {
  const { theme, setTheme } = useUIStore();
  const { data: user } = useProfile();
  const updateProfile = useUpdateProfile();

  async function updateSetting(key: string, value: unknown) {
    try {
      await updateProfile.mutateAsync({ settings: { [key]: value } } as Parameters<typeof updateProfile.mutateAsync>[0]);
      toast.success('Settings saved');
    } catch (err) {
      toast.error('Failed to save settings', extractApiError(err));
    }
  }

  return (
    <div className="max-w-xl space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-white/5 p-6 rounded-2xl border border-surface-border dark:border-dark-border shadow-soft-sm">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Globe className="h-5 w-5 text-brand-500" />
            Settings
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Customize your Paper Lens application experience and workspace configurations
          </p>
        </div>
      </div>

      {/* Appearance */}
      <section className="rounded-2xl border border-surface-border dark:border-dark-border bg-white dark:bg-white/5 p-6 shadow-soft">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">Appearance</h2>
        <div>
          <p className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-3">Theme preference</p>
          <div className="grid grid-cols-3 gap-3">
            {themes.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 shadow-soft-sm',
                  theme === value
                    ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold shadow-glow-sm scale-[1.02]'
                    : 'border-surface-border dark:border-dark-border text-slate-600 dark:text-slate-400 hover:border-brand-500/25 hover:bg-slate-50/50 dark:hover:bg-white/5'
                )}
              >
                <Icon className="h-4.5 w-4.5" />
                <span className="text-xs">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Language */}
      <section className="rounded-2xl border border-surface-border dark:border-dark-border bg-white dark:bg-white/5 p-6 shadow-soft">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">Language</h2>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5 mb-1.5">
            <Globe className="h-4 w-4 text-slate-400" />
            Interface language
          </label>
          <select
            value={user?.settings.language ?? 'en'}
            onChange={(e) => updateSetting('language', e.target.value)}
            className="w-full h-10 rounded-xl border border-surface-border dark:border-dark-border bg-white dark:bg-dark-secondary text-slate-900 dark:text-slate-100 text-xs px-3 focus:outline-none focus:ring-2 focus:ring-brand-500/15 shadow-soft-sm"
          >
            {languages.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </section>

      {/* Notifications */}
      <section className="rounded-2xl border border-surface-border dark:border-dark-border bg-white dark:bg-white/5 p-6 shadow-soft">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">Notifications</h2>
        <div className="space-y-1">
          {[
            {
              key: 'email',
              label: 'Email notifications',
              description: 'Receive updates about uploads and workspace activity via email',
              value: user?.settings.notifications.email ?? true,
            },
            {
              key: 'inApp',
              label: 'In-app notifications',
              description: 'Show notifications within Paper Lens dashboard',
              value: user?.settings.notifications.inApp ?? true,
            },
          ].map(({ key, label, description, value }) => (
            <div
              key={key}
              className="flex items-start justify-between gap-4 py-3 border-b border-surface-border dark:border-white/5 last:border-0"
            >
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{label}</p>
                <p className="text-2xs text-slate-400 dark:text-slate-500 mt-0.5 leading-relaxed">{description}</p>
              </div>
              <button
                onClick={() => updateSetting(`notifications.${key}`, !value)}
                className={cn(
                  'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200',
                  value ? 'bg-brand-500' : 'bg-slate-200 dark:bg-dark-border'
                )}
              >
                <span
                  className={cn(
                    'inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-200',
                    value ? 'translate-x-4' : 'translate-x-0.5'
                  )}
                />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
