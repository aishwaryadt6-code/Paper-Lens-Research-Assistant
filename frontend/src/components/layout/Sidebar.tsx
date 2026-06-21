import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  FolderOpen,
  FileText,
  Upload,
  User,
  Settings,
  ChevronLeft,
  ChevronRight,
  Plus,
  Microscope,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '../ui/utils';
import { Logo } from './Logo';
import { useUIStore } from '../../stores/uiStore';
import { useWorkspaces } from '../../hooks/useWorkspaces';
import { Avatar } from '../ui/Primitives';
import { useAuthStore } from '../../stores/authStore';
import { CreateWorkspaceModal } from '../workspace/CreateWorkspaceModal';

const mainNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/workspaces', icon: FolderOpen, label: 'Workspaces' },
  { to: '/papers', icon: FileText, label: 'Papers' },
  { to: '/insights', icon: Microscope, label: 'AI Insights' },
];

const bottomNav = [
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { data: workspaces } = useWorkspaces();
  const { user } = useAuthStore();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
      <motion.aside
        animate={{ width: sidebarCollapsed ? 64 : 240 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          'relative flex flex-col h-full shrink-0',
          'bg-surface-secondary dark:bg-dark-secondary',
          'border-r border-surface-border dark:border-dark-border',
          'overflow-hidden'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-14 border-b border-surface-border dark:border-dark-border shrink-0">
          <Logo iconOnly={sidebarCollapsed} />
        </div>

        {/* Main Nav */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin px-2 py-3 space-y-0.5">
          {mainNav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={label}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-2.5 h-9 rounded-lg text-sm transition-all duration-200 relative group border-l-2 border-transparent',
                  isActive
                    ? 'bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 font-semibold shadow-glow-sm border-l-brand-500'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-100'
                )
              }
              end={to === '/papers' || to === '/insights'}
            >
              <Icon className="h-4 w-4 shrink-0 group-hover:scale-110 transition-transform duration-200" />
              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="whitespace-nowrap"
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          ))}

          {/* Workspaces Section */}
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pt-4"
            >
              <div className="flex items-center justify-between px-2.5 mb-1.5">
                <span className="text-2xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-600">
                  Workspaces
                </span>
                <button
                  onClick={() => setCreateOpen(true)}
                  className="p-0.5 rounded text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                  title="New workspace"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="space-y-0.5">
                {workspaces?.slice(0, 6).map((ws) => (
                  <NavLink
                    key={ws._id}
                    to={`/workspaces/${ws._id}`}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-2.5 px-2.5 h-8 rounded-lg text-sm truncate transition-all duration-100',
                        isActive
                          ? 'bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-medium'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-dark-tertiary hover:text-slate-900 dark:hover:text-slate-100'
                      )
                    }
                  >
                    <div className="h-5 w-5 rounded bg-brand-100 dark:bg-brand-950 flex items-center justify-center shrink-0">
                      <FolderOpen className="h-3 w-3 text-brand-600 dark:text-brand-400" />
                    </div>
                    <span className="truncate">{ws.name}</span>
                  </NavLink>
                ))}
                {!workspaces?.length && (
                  <p className="px-2.5 text-xs text-slate-400 dark:text-slate-600 py-1">
                    No workspaces yet
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </nav>

        {/* Bottom Nav */}
        <div className="px-2 py-2 border-t border-surface-border dark:border-dark-border space-y-0.5">
          {bottomNav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-2.5 h-9 rounded-lg text-sm transition-all duration-100',
                  isActive
                    ? 'bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-medium'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-dark-tertiary hover:text-slate-900 dark:hover:text-slate-100'
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="whitespace-nowrap"
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          ))}

          {/* Admin link — only for admin role */}
          {user?.role === 'admin' && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-2.5 h-9 rounded-lg text-sm transition-all duration-100',
                  isActive
                    ? 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-medium'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-dark-tertiary hover:text-slate-900 dark:hover:text-slate-100'
                )
              }
            >
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="whitespace-nowrap"
                  >
                    Admin
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          )}

          {/* User */}
          {user && (
            <div className={cn('flex items-center gap-2.5 px-2.5 py-2 mt-1', sidebarCollapsed && 'justify-center')}>
              <Avatar src={user.avatarUrl} name={user.name} size="sm" className="shrink-0" />
              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 min-w-0"
                  >
                    <p className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">
                      {user.name}
                    </p>
                    <p className="text-2xs text-slate-400 dark:text-slate-600 truncate">{user.email}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={toggleSidebar}
          className={cn(
            'absolute -right-3 top-[52px] z-10',
            'flex items-center justify-center h-6 w-6 rounded-full',
            'bg-white dark:bg-dark-secondary border border-surface-border dark:border-dark-border',
            'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200',
            'shadow-soft-sm transition-colors'
          )}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </button>
      </motion.aside>

      <CreateWorkspaceModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
}
