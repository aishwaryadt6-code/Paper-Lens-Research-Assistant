import { useState } from 'react';
import { FolderOpen, Plus, Search, ArrowRight } from 'lucide-react';
import { useWorkspaces } from '../hooks/useWorkspaces';
import { WorkspaceCard } from '../components/workspace/WorkspaceCard';
import { CreateWorkspaceModal } from '../components/workspace/CreateWorkspaceModal';
import { Skeleton } from '../components/ui/Primitives';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { EmptyState } from '../components/ui/EmptyState';
import { Workspace } from '../types';

export default function WorkspacesPage() {
  const { data: workspaces, isLoading } = useWorkspaces();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Workspace | null>(null);
  const [search, setSearch] = useState('');

  const filtered = workspaces?.filter((ws) =>
    ws.name.toLowerCase().includes(search.toLowerCase()) ||
    ws.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-white/5 p-6 rounded-2xl border border-surface-border dark:border-dark-border shadow-soft-sm">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-brand-500" />
            Workspaces
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Organize papers and collaborate with teammates across {workspaces?.length ?? 0} workspace{workspaces?.length !== 1 ? 's' : ''}.
          </p>
        </div>
        <Button 
          size="sm" 
          onClick={() => setCreateOpen(true)}
          className="bg-gradient-to-r from-brand-500 to-indigo-600 text-white font-bold text-xs h-9 rounded-xl hover:scale-[1.02] shadow-soft hover:shadow-brand-500/20 active:scale-[0.98] transition-all"
        >
          <Plus className="h-4 w-4 mr-1" />
          New Workspace
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <Input
          placeholder="Search workspaces..."
          leftIcon={<Search className="h-4 w-4" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      ) : filtered?.length === 0 ? (
        <EmptyState
          icon={<FolderOpen className="h-8 w-8 text-slate-400" />}
          title={search ? 'No matching workspaces' : 'No workspaces yet'}
          description={
            search
              ? `No workspaces match "${search}".`
              : 'Create a workspace to organize your research papers and collaborate with your team.'
          }
          action={!search ? { label: 'Create workspace', onClick: () => setCreateOpen(true) } : undefined}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered?.map((ws) => (
            <WorkspaceCard
              key={ws._id}
              workspace={ws}
              onEdit={(w) => setEditTarget(w)}
            />
          ))}
        </div>
      )}

      <CreateWorkspaceModal
        open={createOpen || !!editTarget}
        onClose={() => { setCreateOpen(false); setEditTarget(null); }}
        editTarget={editTarget}
      />
    </div>
  );
}
