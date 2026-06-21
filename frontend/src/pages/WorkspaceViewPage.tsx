import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FolderOpen, FileText, Users, Upload, UserPlus, ArrowLeft, CheckCircle, Database } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useWorkspace, useInviteMember } from '../hooks/useWorkspaces';
import { usePapers } from '../hooks/usePapers';
import { PaperCard } from '../components/papers/PaperCard';
import { Skeleton, Badge, Avatar } from '../components/ui/Primitives';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { toast } from '../components/ui/Toast';
import { extractApiError, formatBytes, formatRelativeTime } from '../components/ui/utils';
import { useUIStore } from '../stores/uiStore';
import { useAuthStore } from '../stores/authStore';
import { User } from '../types';

const inviteSchema = z.object({
  email: z.string().email('Invalid email'),
  role: z.enum(['editor', 'viewer']),
});
type InviteFormData = z.infer<typeof inviteSchema>;

function getMemberUser(member: { userId: string | User }): { name: string; email: string; avatarUrl?: string; id: string } {
  if (typeof member.userId === 'string') {
    return { name: member.userId, email: '', id: member.userId };
  }
  return {
    name: (member.userId as User).name,
    email: (member.userId as User).email,
    avatarUrl: (member.userId as User).avatarUrl,
    id: (member.userId as User)._id,
  };
}

export default function WorkspaceViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const { setUploadModalOpen, setActiveWorkspace } = useUIStore();
  const { data: workspace, isLoading: wsLoading } = useWorkspace(id!);
  const { data: papers, isLoading: papersLoading } = usePapers(id!);
  const inviteMember = useInviteMember();
  const [inviteOpen, setInviteOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { role: 'viewer' },
  });

  function handleUpload() {
    setActiveWorkspace(id!);
    setUploadModalOpen(true);
  }

  async function onInvite(data: InviteFormData) {
    try {
      await inviteMember.mutateAsync({ workspaceId: id!, ...data });
      toast.success('Member invited successfully');
      setInviteOpen(false);
      reset();
    } catch (err) {
      toast.error('Failed to invite member', extractApiError(err));
    }
  }

  const ownerId = workspace?.owner
    ? typeof workspace.owner === 'string'
      ? workspace.owner
      : (workspace.owner as User)._id
    : null;

  const isOwner = ownerId === currentUser?._id;

  if (wsLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-8 w-64 rounded-xl" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <EmptyState
        icon={<FolderOpen className="h-8 w-8 text-slate-400" />}
        title="Workspace not found"
        description="This workspace doesn't exist or you don't have access."
        action={{ label: 'Go back', onClick: () => navigate('/workspaces') }}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate('/workspaces')}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 mb-3 transition-colors group"
        >
          <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to Workspaces
        </button>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-white/5 p-6 rounded-2xl border border-surface-border dark:border-dark-border shadow-soft-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-11 w-11 rounded-xl bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 shrink-0">
              <FolderOpen className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-snug">
                {workspace.name}
              </h1>
              {workspace.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-xl">
                  {workspace.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isOwner && (
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => setInviteOpen(true)}
                className="font-bold text-xs h-9 rounded-xl border border-surface-border"
              >
                <UserPlus className="h-3.5 w-3.5 mr-1" />
                Invite Member
              </Button>
            )}
            <Button 
              size="sm" 
              onClick={handleUpload}
              className="bg-gradient-to-r from-brand-500 to-indigo-600 text-white font-bold text-xs h-9 rounded-xl hover:scale-[1.02] shadow-soft hover:shadow-brand-500/20 active:scale-[0.98] transition-all"
            >
              <Upload className="h-3.5 w-3.5 mr-1" />
              Upload Paper
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: FileText, label: 'Total Papers',  value: workspace.statistics.paperCount, color: 'text-brand-500', bg: 'bg-brand-500/10' },
          { icon: Users,    label: 'Teammates', value: workspace.statistics.memberCount, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { icon: Database,   label: 'Storage Used', value: formatBytes(workspace.statistics.storageUsedBytes), color: 'text-amber-500', bg: 'bg-amber-500/10' },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div 
            key={label} 
            className="rounded-2xl border border-surface-border dark:border-dark-border bg-white dark:bg-white/5 p-5 shadow-soft hover:-translate-y-0.5 hover:shadow-soft-md duration-300 transition-all group cursor-default"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {label}
              </span>
              <div className={`flex items-center justify-center h-7.5 w-7.5 rounded-lg ${bg}`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
            </div>
            <p className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-none">{value}</p>
          </div>
        ))}
      </div>

      {/* Members & Papers Grid */}
      <div className="grid lg:grid-cols-3 gap-6 items-start">
        {/* Members Column */}
        <section className="lg:col-span-1 space-y-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Workspace Members</h2>
          <div className="rounded-2xl border border-surface-border dark:border-dark-border bg-white dark:bg-white/5 shadow-soft overflow-hidden p-1">
            {workspace.members.map((member, i) => {
              const u = getMemberUser(member);
              return (
                <div
                  key={u.id}
                  className={`flex items-center gap-3 px-4 py-3 ${
                    i < workspace.members.length - 1
                      ? 'border-b border-surface-border dark:border-white/5'
                      : ''
                  }`}
                >
                  <Avatar name={u.name} src={u.avatarUrl} size="sm" className="shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate leading-snug">{u.name}</p>
                    {u.email && (
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">{u.email}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={member.role === 'owner' ? 'brand' : 'default'} className="text-[10px] font-bold">
                      {member.role}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Papers Column */}
        <section className="lg:col-span-2 space-y-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Papers Library</h2>
          {papersLoading ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {[1, 2, 4].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
            </div>
          ) : papers?.items.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-8 w-8 text-slate-400" />}
              title="No papers in this workspace"
              description="Upload research papers to start analyzing and synthesizing knowledge."
              action={{ label: 'Upload paper', onClick: handleUpload }}
            />
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {papers?.items.map((paper) => (
                <PaperCard key={paper._id} paper={paper} />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Invite Modal */}
      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Invite Member"
        description={`Invite someone to collaborate in "${workspace.name}".`}
      >
        <form onSubmit={handleSubmit(onInvite)} className="space-y-4">
          <Input
            label="Email address"
            type="email"
            placeholder="colleague@university.edu"
            error={errors.email?.message}
            {...register('email')}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">Role</label>
            <select
              {...register('role')}
              className="w-full h-10 rounded-xl border border-surface-border dark:border-dark-border bg-white dark:bg-dark-secondary text-slate-900 dark:text-slate-100 text-xs px-3 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
            >
              <option value="viewer">Viewer — can view papers</option>
              <option value="editor">Editor — can upload and manage papers</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button 
              variant="secondary" 
              type="button" 
              onClick={() => setInviteOpen(false)}
              className="h-9 rounded-xl text-xs font-bold border border-surface-border px-4"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              loading={inviteMember.isPending}
              className="bg-gradient-to-r from-brand-500 to-indigo-600 text-white h-9 rounded-xl text-xs font-bold hover:scale-[1.01] px-4"
            >
              Send Invite
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
