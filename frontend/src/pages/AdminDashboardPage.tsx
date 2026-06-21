import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, Users, FolderOpen, FileText, Activity, ToggleLeft, ToggleRight } from 'lucide-react';
import { adminService } from '../services/adminService';
import { Skeleton, Badge, Avatar } from '../components/ui/Primitives';
import { cn, formatRelativeTime, extractApiError } from '../components/ui/utils';
import { toast } from '../components/ui/Toast';
import { User } from '../types';

type Tab = 'overview' | 'users' | 'workspaces' | 'papers' | 'audit';

export default function AdminDashboardPage() {
  const [tab, setTab] = useState<Tab>('overview');

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'overview',   label: 'Overview',   icon: <ShieldCheck className="h-4 w-4" /> },
    { key: 'users',      label: 'Users',      icon: <Users className="h-4 w-4" /> },
    { key: 'workspaces', label: 'Workspaces', icon: <FolderOpen className="h-4 w-4" /> },
    { key: 'papers',     label: 'Papers',     icon: <FileText className="h-4 w-4" /> },
    { key: 'audit',      label: 'Audit Logs', icon: <Activity className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-white/5 p-6 rounded-2xl border border-surface-border dark:border-dark-border shadow-soft-sm">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-brand-500" />
            Admin Control Center
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Monitor users, manage workspaces, track files, and review system logs.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-50 dark:bg-white/5 rounded-full border border-surface-border dark:border-white/5 w-fit shadow-inner">
        {tabs.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'flex items-center gap-1.5 px-4 h-8 rounded-full text-xs font-bold transition-all duration-300',
              tab === key
                ? 'bg-gradient-to-r from-brand-500 to-indigo-600 text-white shadow-md shadow-brand-500/20 scale-[1.02]'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5'
            )}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {tab === 'overview'   && <OverviewTab />}
      {tab === 'users'      && <UsersTab />}
      {tab === 'workspaces' && <WorkspacesTab />}
      {tab === 'papers'     && <PapersTab />}
      {tab === 'audit'      && <AuditTab />}
    </div>
  );
}

function OverviewTab() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: adminService.getStats,
    staleTime: 30_000,
  });

  const cards = [
    { label: 'Total Users',      value: stats?.totalUsers,      icon: Users,      color: 'text-brand-500',   bg: 'bg-brand-500/10' },
    { label: 'Active Users',     value: stats?.activeUsers,     icon: Users,      color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Total Workspaces', value: stats?.totalWorkspaces, icon: FolderOpen, color: 'text-amber-500',   bg: 'bg-amber-500/10' },
    { label: 'Total Papers',     value: stats?.totalPapers,     icon: FileText,   color: 'text-indigo-500',  bg: 'bg-indigo-500/10' },
  ];

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(({ label, value, icon: Icon, color, bg }) => (
        <div 
          key={label} 
          className="rounded-2xl border border-surface-border dark:border-dark-border bg-white dark:bg-white/5 p-5 shadow-soft hover:-translate-y-0.5 hover:shadow-soft-md duration-300 transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {label}
            </span>
            <div className={`flex items-center justify-center h-8 w-8 rounded-lg ${bg}`}>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
          </div>
          {isLoading ? (
            <Skeleton className="h-7 w-16 rounded mb-1" />
          ) : (
            <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-none">{value ?? 0}</p>
          )}
        </div>
      ))}
    </div>
  );
}

function UsersTab() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => adminService.listUsers(1, 50),
    staleTime: 30_000,
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminService.setUserActive(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('User status updated');
    },
    onError: (err) => toast.error('Failed to update user', extractApiError(err)),
  });

  const changeRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: 'researcher' | 'admin' }) =>
      adminService.setUserRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('User role updated');
    },
    onError: (err) => toast.error('Failed to update role', extractApiError(err)),
  });

  if (isLoading) return <TableSkeleton rows={5} cols={4} />;

  return (
    <div className="rounded-2xl border border-surface-border dark:border-dark-border bg-white dark:bg-white/5 overflow-hidden shadow-soft p-1">
      <div className="px-4 py-3 border-b border-surface-border dark:border-white/5">
        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
          {data?.total ?? 0} users registered
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-border dark:border-white/5">
              {['User', 'Role', 'Status', 'Joined', 'Actions'].map((h) => (
                <th key={h} className="text-left text-2xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data?.users.map((user) => (
              <tr key={user._id} className="border-b border-surface-border dark:border-white/5 last:border-0 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={user.name} src={user.avatarUrl} size="sm" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-250 truncate">{user.name}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={user.role}
                    onChange={(e) => changeRole.mutate({ id: user._id, role: e.target.value as 'researcher' | 'admin' })}
                    className="text-xs font-medium rounded-xl border border-surface-border dark:border-dark-border bg-white dark:bg-dark-secondary text-slate-700 dark:text-slate-350 px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-brand-500/15 shadow-sm"
                  >
                    <option value="researcher">Researcher</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={user.isActive ? 'success' : 'danger'} className="text-[10px] font-bold">
                    {user.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-2xs text-slate-400">
                  {formatRelativeTime(user.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleActive.mutate({ id: user._id, isActive: !user.isActive })}
                    className="text-xs text-slate-500 dark:text-slate-455 hover:text-brand-600 dark:hover:text-brand-400 flex items-center gap-1 transition-colors font-semibold"
                  >
                    {user.isActive
                      ? <ToggleRight className="h-5.5 w-5.5 text-emerald-500" />
                      : <ToggleLeft className="h-5.5 w-5.5 text-slate-300 dark:text-slate-600" />}
                    <span>{user.isActive ? 'Deactivate' : 'Activate'}</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function WorkspacesTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'workspaces'],
    queryFn: () => adminService.listWorkspaces(1, 50),
    staleTime: 30_000,
  });

  if (isLoading) return <TableSkeleton rows={5} cols={4} />;

  return (
    <div className="rounded-2xl border border-surface-border dark:border-dark-border bg-white dark:bg-white/5 overflow-hidden shadow-soft p-1">
      <div className="px-4 py-3 border-b border-surface-border dark:border-white/5">
        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{data?.total ?? 0} workspaces active</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-border dark:border-white/5">
              {['Name', 'Owner', 'Papers', 'Members', 'Status', 'Created'].map((h) => (
                <th key={h} className="text-left text-2xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data?.workspaces.map((ws) => {
              const owner = typeof ws.owner === 'string' ? ws.owner : (ws.owner as User).name;
              return (
                <tr key={ws._id} className="border-b border-surface-border dark:border-white/5 last:border-0 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 text-xs font-semibold text-slate-800 dark:text-slate-200">{ws.name}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{owner}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{ws.statistics.paperCount}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{ws.statistics.memberCount}</td>
                  <td className="px-4 py-3"><Badge variant={ws.isActive ? 'success' : 'danger'} className="text-[10px] font-bold">{ws.isActive ? 'Active' : 'Deleted'}</Badge></td>
                  <td className="px-4 py-3 text-2xs text-slate-400">{formatRelativeTime(ws.createdAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PapersTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'papers'],
    queryFn: () => adminService.listPapers(1, 50),
    staleTime: 30_000,
  });

  if (isLoading) return <TableSkeleton rows={5} cols={4} />;

  return (
    <div className="rounded-2xl border border-surface-border dark:border-dark-border bg-white dark:bg-white/5 overflow-hidden shadow-soft p-1">
      <div className="px-4 py-3 border-b border-surface-border dark:border-white/5">
        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{data?.total ?? 0} papers uploaded</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-border dark:border-white/5">
              {['Title', 'Uploaded By', 'Workspace', 'Status', 'Uploaded'].map((h) => (
                <th key={h} className="text-left text-2xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data?.papers.map((paper) => {
              const uploader = typeof paper.uploadedBy === 'string' ? paper.uploadedBy : (paper.uploadedBy as User).name;
              const workspace = typeof paper.workspace === 'string' ? paper.workspace : (paper.workspace as { name: string }).name;
              return (
                <tr key={paper._id} className="border-b border-surface-border dark:border-white/5 last:border-0 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 text-xs font-semibold text-slate-800 dark:text-slate-200 max-w-xs truncate">{paper.title}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{uploader}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{workspace}</td>
                  <td className="px-4 py-3">
                    <Badge variant={paper.status === 'ready' ? 'success' : paper.status === 'failed' ? 'danger' : 'warning'} className="text-[10px] font-bold">
                      {paper.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-2xs text-slate-400">{formatRelativeTime(paper.createdAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AuditTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'audit'],
    queryFn: () => adminService.listAuditLogs(1, 50),
    staleTime: 30_000,
  });

  if (isLoading) return <TableSkeleton rows={8} cols={4} />;

  return (
    <div className="rounded-2xl border border-surface-border dark:border-dark-border bg-white dark:bg-white/5 overflow-hidden shadow-soft p-1">
      <div className="px-4 py-3 border-b border-surface-border dark:border-white/5">
        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{data?.total ?? 0} audit events recorded</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-border dark:border-white/5">
              {['Actor', 'Action', 'Resource', 'IP', 'When'].map((h) => (
                <th key={h} className="text-left text-2xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data?.logs.map((log) => {
              const actorName = typeof log.actor === 'string' ? log.actor : (log.actor as User).name;
              return (
                <tr key={log._id} className="border-b border-surface-border dark:border-white/5 last:border-0 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 text-xs text-slate-700 dark:text-slate-350">{actorName}</td>
                  <td className="px-4 py-3">
                    <code className="text-[10px] bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded font-mono text-slate-600 dark:text-slate-400">
                      {log.action}
                    </code>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{log.resourceType}</td>
                  <td className="px-4 py-3 text-2xs text-slate-400">{log.ipAddress ?? '—'}</td>
                  <td className="px-4 py-3 text-2xs text-slate-400">{formatRelativeTime(log.createdAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TableSkeleton({ rows, cols }: { rows: number; cols: number }) {
  return (
    <div className="rounded-2xl border border-surface-border dark:border-dark-border bg-white dark:bg-white/5 overflow-hidden shadow-soft">
      <div className="px-4 py-3 border-b border-surface-border dark:border-white/5">
        <Skeleton className="h-4 w-24 rounded" />
      </div>
      <div className="p-4 space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4">
            {Array.from({ length: cols }).map((_, j) => (
              <Skeleton key={j} className="h-4 flex-1 rounded" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
