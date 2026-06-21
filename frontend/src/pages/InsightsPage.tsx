import { useState } from 'react';
import { FileText, Microscope, Search, CheckCircle, Loader2, Sparkles, FolderOpen, ArrowRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useRecentPapers } from '../hooks/usePapers';
import { Skeleton, Badge } from '../components/ui/Primitives';
import { Input } from '../components/ui/Input';
import { EmptyState } from '../components/ui/EmptyState';
import { useUIStore } from '../stores/uiStore';
import { cn, formatBytes, formatRelativeTime } from '../components/ui/utils';

export default function InsightsPage() {
  const { data: papers, isLoading } = useRecentPapers();
  const { setUploadModalOpen } = useUIStore();
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const filtered = papers?.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.originalFileName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-brand-500" />
            AI Insights Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Review automatically generated summaries, key findings, and practice questions for your papers.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <Input
          placeholder="Search papers for insights..."
          leftIcon={<Search className="h-4 w-4" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : filtered?.length === 0 ? (
        <EmptyState
          icon={<Microscope className="h-8 w-8 text-brand-500" />}
          title={search ? 'No matching papers' : 'No research papers found'}
          description={
            search
              ? `No papers match "${search}".`
              : 'Upload a research paper to generate executive summaries and viva prep questions.'
          }
          action={
            !search
              ? { label: 'Upload paper', onClick: () => setUploadModalOpen(true) }
              : undefined
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered?.map((paper) => {
            const hasInsights = !!paper.aiInsights?.executiveSummary;
            const isProcessing = paper.aiInsightsStatus === 'processing';
            const isFailed = paper.aiInsightsStatus === 'failed';

            return (
              <div
                key={paper._id}
                onClick={() => navigate(`/papers/${paper._id}?tab=insights`)}
                className={cn(
                  'group relative flex flex-col justify-between rounded-2xl p-5 cursor-pointer',
                  'bg-white dark:bg-white/5',
                  'border border-slate-100 dark:border-white/5',
                  'hover:border-brand-500/20 dark:hover:border-brand-500/20',
                  'hover:shadow-soft-md hover:-translate-y-1 transition-all duration-300'
                )}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="h-9 w-9 rounded-xl bg-brand-500/10 dark:bg-brand-500/20 flex items-center justify-center shrink-0">
                      <Microscope className="h-4.5 w-4.5 text-brand-600 dark:text-brand-400" />
                    </div>
                    {hasInsights ? (
                      <Badge variant="success" className="text-2xs font-semibold flex items-center gap-1 shrink-0">
                        <CheckCircle className="h-3 w-3" />
                        Insights Ready
                      </Badge>
                    ) : isProcessing ? (
                      <Badge variant="warning" className="text-2xs font-semibold flex items-center gap-1 shrink-0">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Generating
                      </Badge>
                    ) : isFailed ? (
                      <Badge variant="danger" className="text-2xs font-semibold flex items-center gap-1 shrink-0">
                        Failed
                      </Badge>
                    ) : (
                      <Badge variant="default" className="text-2xs font-semibold flex items-center gap-1 shrink-0">
                        Not Started
                      </Badge>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors line-clamp-1">
                      {paper.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {hasInsights
                        ? paper.aiInsights?.executiveSummary
                        : 'Click to open and automatically initiate AI analysis for summary, findings, and viva prep.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 dark:border-white/5 pt-3 mt-4 text-[10px] text-slate-400">
                  <span>{formatBytes(paper.fileSize)}</span>
                  <span className="flex items-center gap-1 text-brand-600 dark:text-brand-400 font-semibold hover:underline">
                    View Insights <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
