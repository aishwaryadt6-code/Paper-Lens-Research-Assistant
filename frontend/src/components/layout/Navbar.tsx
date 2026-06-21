import { useState, useRef, useEffect } from 'react';
import { Search, Bell, Upload, ChevronDown, LogOut, User, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../ui/utils';
import { useUIStore } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';
import { useAuth } from '../../hooks/useAuth';
import { useUnreadCount } from '../../hooks/useNotifications';
import { Avatar, Spinner } from '../ui/Primitives';
import { NotificationPanel } from '../notifications/NotificationPanel';

export function Navbar() {
  const { setCommandPaletteOpen, setUploadModalOpen, notificationPanelOpen, setNotificationPanelOpen } =
    useUIStore();
  const { user } = useAuthStore();
  const { logout } = useAuth();
  const { data: unreadCount = 0 } = useUnreadCount();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="flex items-center justify-between h-14 px-5 border-b border-surface-border dark:border-dark-border bg-white/80 dark:bg-[#0b1220]/85 backdrop-blur-md sticky top-0 z-30 shrink-0">
      {/* Search Trigger */}
      <button
        onClick={() => setCommandPaletteOpen(true)}
        className={cn(
          'flex items-center gap-2.5 h-9 px-3.5 rounded-xl text-xs w-64 shadow-soft-sm border border-black/5 dark:border-white/5 bg-white dark:bg-white/5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all duration-200 group'
        )}
      >
        <Search className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-brand-500 transition-colors" />
        <span className="flex-1 text-left">Search papers, keywords...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded-md border border-slate-200 dark:border-white/10 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-50 dark:bg-dark-tertiary">
          Ctrl K
        </kbd>
      </button>

      <div className="flex items-center gap-2">
        {/* Upload */}
        <button
          onClick={() => setUploadModalOpen(true)}
          className={cn(
            'flex items-center gap-2 h-9 px-4 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-brand-500 to-indigo-600 hover:scale-[1.03] hover:shadow-md hover:shadow-brand-500/20 active:scale-[0.98] transition-all duration-200'
          )}
        >
          <Upload className="h-4 w-4" />
          <span>Upload Paper</span>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotificationPanelOpen(!notificationPanelOpen)}
            className={cn(
              'relative flex items-center justify-center h-8 w-8 rounded-lg text-slate-500 dark:text-slate-400',
              'hover:bg-surface-secondary dark:hover:bg-dark-tertiary transition-colors'
            )}
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-brand-600 text-white text-2xs flex items-center justify-center font-medium">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <AnimatePresence>
            {notificationPanelOpen && (
              <NotificationPanel onClose={() => setNotificationPanelOpen(false)} />
            )}
          </AnimatePresence>
        </div>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen((v) => !v)}
            className="flex items-center gap-2 h-8 px-2 rounded-lg hover:bg-surface-secondary dark:hover:bg-dark-tertiary transition-colors"
          >
            {user && <Avatar src={user.avatarUrl} name={user.name} size="sm" />}
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className={cn(
                  'absolute right-0 top-full mt-1.5 w-52 rounded-xl',
                  'bg-white dark:bg-dark-secondary',
                  'border border-surface-border dark:border-dark-border',
                  'shadow-soft-lg z-50 overflow-hidden'
                )}
              >
                {user && (
                  <div className="px-3.5 py-3 border-b border-surface-border dark:border-dark-border">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                  </div>
                )}
                <div className="p-1.5">
                  {[
                    { icon: User, label: 'Profile', to: '/profile' },
                    { icon: Settings, label: 'Settings', to: '/settings' },
                  ].map(({ icon: Icon, label, to }) => (
                    <button
                      key={to}
                      onClick={() => { navigate(to); setProfileOpen(false); }}
                      className="flex items-center gap-2.5 w-full px-2.5 h-8 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-surface-secondary dark:hover:bg-dark-tertiary transition-colors"
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  ))}
                  <div className="my-1 border-t border-surface-border dark:border-dark-border" />
                  <button
                    onClick={() => logout.mutate()}
                    disabled={logout.isPending}
                    className="flex items-center gap-2.5 w-full px-2.5 h-8 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  >
                    {logout.isPending ? (
                      <Spinner size="sm" />
                    ) : (
                      <LogOut className="h-4 w-4" />
                    )}
                    Sign out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
