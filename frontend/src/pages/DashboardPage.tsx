import { motion } from 'framer-motion';
import { FileText, FolderOpen, Upload, TrendingUp, Plus, ArrowRight, Search, User, Sparkles, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useWorkspaces } from '../hooks/useWorkspaces';
import { useRecentPapers } from '../hooks/usePapers';
import { useUIStore } from '../stores/uiStore';
import { WorkspaceCard } from '../components/workspace/WorkspaceCard';
import { PaperCard } from '../components/papers/PaperCard';
import { Skeleton } from '../components/ui/Primitives';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { CreateWorkspaceModal } from '../components/workspace/CreateWorkspaceModal';
import { useState } from 'react';

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data: workspaces, isLoading: wsLoading } = useWorkspaces();
  const { data: recentPapers, isLoading: papersLoading } = useRecentPapers();
  const { setUploadModalOpen } = useUIStore();
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const totalPapers = workspaces?.reduce((s, w) => s + w.statistics.paperCount, 0) ?? 0;
  const activeWorkspacesCount = workspaces?.filter(w => w.isActive).length ?? 0;
  const aiInsightsCount = recentPapers?.filter(p => p.aiInsights?.executiveSummary).length ?? 0;

  const stats = [
    { 
      label: 'Papers Cataloged', 
      value: totalPapers, 
      icon: BookOpen, 
      color: 'text-brand-600 dark:text-brand-400', 
      bg: 'bg-brand-500/10 dark:bg-brand-500/20' 
    },
    { 
      label: 'AI Insights Ready', 
      value: aiInsightsCount, 
      icon: Sparkles, 
      color: 'text-emerald-600 dark:text-emerald-400', 
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/20' 
    },
    { 
      label: 'Active Workspaces', 
      value: activeWorkspacesCount, 
      icon: FolderOpen, 
      color: 'text-amber-600 dark:text-amber-400', 
      bg: 'bg-amber-500/10 dark:bg-amber-500/20' 
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-10 relative">
      {/* Background Glow Blobs */}
      <div className="absolute top-[-50px] right-[-50px] w-80 h-80 bg-brand-500/5 rounded-full blur-[80px] pointer-events-none" />

      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#0f172a]/45 backdrop-blur-md p-6 rounded-2xl border border-surface-border dark:border-white/5 shadow-soft">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-brand-600 dark:text-brand-400 font-bold mb-1">
            <Sparkles className="h-3.5 w-3.5" />
            AI Research Control Center
          </div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-50">
            Welcome, {user?.name.split(' ')[0]} 👋
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
            Manage your workspaces, read analyzed publications, and extract research insights instantly.
          </p>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-3 w-full md:w-auto md:justify-end">
          <div className="relative w-full max-w-xs">
            <input
              type="text"
              placeholder="Search library (Ctrl K)..."
              className="w-full h-9 pl-9 pr-3 rounded-xl border border-surface-border dark:border-white/10 bg-slate-50 dark:bg-dark-secondary/50 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/15 focus:border-brand-500 transition-all cursor-pointer shadow-inner"
              readOnly
              onClick={() => {
                const searchTrigger = document.querySelector('[aria-label="Open command palette"]') as HTMLButtonElement;
                if (searchTrigger) searchTrigger.click();
              }}
            />
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          </div>
          
          <Link 
            to="/profile" 
            className="shrink-0 flex items-center justify-center h-9 w-9 rounded-xl bg-white dark:bg-white/5 border border-surface-border dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 transition-all shadow-soft-sm hover:scale-105"
            title="View Profile"
          >
            <User className="h-4 w-4 text-slate-600 dark:text-slate-300" />
          </Link>
        </div>
      </div>

      {/* Stats Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }, i) => (
          <motion.div
            key={label}
            {...fadeUp}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className="rounded-2xl border border-surface-border dark:border-white/5 bg-white dark:bg-white/5 p-5 hover:-translate-y-0.5 hover:shadow-soft-md hover:border-brand-500/10 transition-all duration-300 group cursor-default shadow-soft"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xs font-bold uppercase tracking-wider text-slate-405 dark:text-slate-500 group-hover:text-brand-500 transition-colors">
                {label}
              </span>
              <div className={`flex items-center justify-center h-8 w-8 rounded-xl ${bg} group-hover:scale-105 transition-transform duration-300`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight leading-none">{value}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick Action Glow Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Upload Action */}
        <div 
          onClick={() => setUploadModalOpen(true)}
          className="rounded-2xl border border-brand-500/10 dark:border-brand-500/10 bg-gradient-to-tr from-brand-500/5 to-indigo-500/10 hover:from-brand-500/10 hover:to-indigo-500/15 p-6 flex items-center justify-between cursor-pointer group hover:-translate-y-0.5 hover:shadow-glow hover:border-brand-500/20 transition-all duration-300"
        >
          <div className="space-y-1.5 pr-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Upload className="h-4 w-4 text-brand-500 group-hover:animate-bounce" />
              Upload Research Paper
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Drag and drop PDF files to extract bibliography metadata and trigger AI Insights analysis.
            </p>
          </div>
          <button className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-r from-brand-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-brand-500/20 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-brand-500/30 transition-all duration-350">
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Create Workspace Action */}
        <div 
          onClick={() => setCreateModalOpen(true)}
          className="rounded-2xl border border-emerald-500/10 dark:border-emerald-500/10 bg-gradient-to-tr from-emerald-500/5 to-teal-500/10 hover:from-emerald-500/10 hover:to-teal-500/15 p-6 flex items-center justify-between cursor-pointer group hover:-translate-y-0.5 hover:shadow-glow hover:border-emerald-500/20 transition-all duration-300"
        >
          <div className="space-y-1.5 pr-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-emerald-500" />
              Create Shared Workspace
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Build a collaborative workspace collections to organize academic topics with colleagues.
            </p>
          </div>
          <button className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-r from-emerald-500 to-teal-650 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-emerald-500/30 transition-all duration-350">
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Workspaces list */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">
            Research Workspaces
          </h2>
          <Link
            to="/workspaces"
            className="flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 hover:underline font-bold"
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {wsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 rounded-2xl" />
            ))}
          </div>
        ) : workspaces?.length === 0 ? (
          <EmptyState
            icon={<FolderOpen className="h-8 w-8 text-slate-400 animate-pulse" />}
            title="No workspaces created"
            description="Create your first research folder to begin sorting your publications."
            action={{ label: 'Create workspace', onClick: () => setCreateModalOpen(true) }}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {workspaces?.slice(0, 6).map((ws) => (
              <WorkspaceCard key={ws._id} workspace={ws} />
            ))}
          </div>
        )}
      </section>

      {/* Recent Papers list */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">
            Recent Publications
          </h2>
          <Link
            to="/papers"
            className="flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 hover:underline font-bold"
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {papersLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
        ) : recentPapers?.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-8 w-8 text-slate-400 animate-pulse" />}
            title="No papers in library"
            description="Drag PDFs here or upload a file directly to construct your workspace catalog."
            action={{ label: 'Upload paper', onClick: () => setUploadModalOpen(true) }}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentPapers?.slice(0, 6).map((paper) => (
              <PaperCard key={paper._id} paper={paper} />
            ))}
          </div>
        )}
      </section>

      <CreateWorkspaceModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
    </div>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

