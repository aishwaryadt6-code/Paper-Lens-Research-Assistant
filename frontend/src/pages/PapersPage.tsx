import { useState } from 'react';
import { FileText, Upload, Search } from 'lucide-react';
import { useRecentPapers } from '../hooks/usePapers';
import { PaperCard } from '../components/papers/PaperCard';
import { Skeleton } from '../components/ui/Primitives';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { EmptyState } from '../components/ui/EmptyState';
import { useUIStore } from '../stores/uiStore';

export default function PapersPage() {
  const { data: papers, isLoading } = useRecentPapers();
  const { setUploadModalOpen } = useUIStore();
  const [search, setSearch] = useState('');

  const filtered = papers?.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.originalFileName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-white/5 p-6 rounded-2xl border border-surface-border dark:border-dark-border shadow-soft-sm">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileText className="h-5 w-5 text-brand-500" />
            Papers Library
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage, read, and generate AI insights from all your uploaded research papers.
          </p>
        </div>
        <Button 
          size="sm" 
          onClick={() => setUploadModalOpen(true)}
          className="bg-gradient-to-r from-brand-500 to-indigo-600 text-white font-bold text-xs h-9 rounded-xl hover:scale-[1.02] shadow-soft hover:shadow-brand-500/20 active:scale-[0.98] transition-all"
        >
          <Upload className="h-3.5 w-3.5 mr-1" />
          Upload Paper
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <Input
          placeholder="Search papers by title or file name..."
          leftIcon={<Search className="h-4 w-4" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : filtered?.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-8 w-8 text-slate-400" />}
          title={search ? 'No matching papers' : 'No papers yet'}
          description={
            search
              ? `No papers match "${search}".`
              : 'Upload your first research paper to get started with AI-powered analysis.'
          }
          action={
            !search
              ? { label: 'Upload paper', onClick: () => setUploadModalOpen(true) }
              : undefined
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered?.map((paper) => (
            <PaperCard key={paper._id} paper={paper} />
          ))}
        </div>
      )}
    </div>
  );
}
