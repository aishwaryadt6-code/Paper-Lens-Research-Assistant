import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Download, Trash2, FileText, Calendar, HardDrive,
  User, FolderOpen, CheckCircle, AlertCircle, Loader2, ExternalLink,
  Clock, Sparkles, BrainCircuit
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../components/ui/Button';
import { Badge, Skeleton } from '../components/ui/Primitives';
import { EmptyState } from '../components/ui/EmptyState';
import { useDeletePaper, usePapers } from '../hooks/usePapers';
import { toast } from '../components/ui/Toast';
import { cn, formatBytes, formatRelativeTime, extractApiError } from '../components/ui/utils';
import SimilarityPanel from '../modules/ai-insights/SimilarityPanel';
import ContradictionPanel from '../modules/ai-insights/ContradictionPanel';
import GraphPanel from '../modules/ai-insights/GraphPanel';
import apiClient from '../services/apiClient';
import { ApiResponse, Paper, PaperStatus, User as IUser, Workspace } from '../types';

const statusConfig: Record<PaperStatus, { label: string; icon: React.ReactNode; variant: 'success' | 'warning' | 'danger' | 'default' }> = {
  ready:      { label: 'Ready',      icon: <CheckCircle className="h-3 w-3" />, variant: 'success' },
  processing: { label: 'Processing', icon: <Loader2 className="h-3 w-3 animate-spin" />, variant: 'warning' },
  uploading:  { label: 'Uploading',  icon: <Loader2 className="h-3 w-3 animate-spin" />, variant: 'default' },
  failed:     { label: 'Failed',     icon: <AlertCircle className="h-3 w-3" />, variant: 'danger' },
};

function usePaper(id: string) {
  return useQuery({
    queryKey: ['papers', 'detail', id],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<{ paper: Paper }>>(`/papers/${id}`);
      return res.data.data!.paper;
    },
    enabled: !!id,
    staleTime: 60_000,
  });
}

function usePaperAIStatus(id: string, enabled: boolean) {
  return useQuery({
    queryKey: ['papers', 'ai-status', id],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<any>>(`/ai-knowledge-graph/paper/${id}/ai-status`);
      return res.data.data!;
    },
    enabled: !!id && enabled,
    refetchInterval: (data) => {
      const status = (data as any)?.state?.data?.jobStatus || (data as any)?.jobStatus;
      if (status === 'pending' || status === 'processing') {
        return 3000;
      }
      return false;
    },
  });
}

export default function PaperDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryTab = searchParams.get('tab') as any;
  
  const { data: paper, isLoading, error } = usePaper(id!);
  const workspaceId = paper?.workspace
    ? typeof paper.workspace === 'string'
      ? paper.workspace
      : (paper.workspace as any)._id
    : '';
  const { data: workspacePapersRes } = usePapers(workspaceId, 1, 100);
  const workspacePapers = workspacePapersRes?.items || [];

  const deletePaper = useDeletePaper();
  const [pdfError, setPdfError] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [activeMetadataTab, setActiveMetadataTab] = useState<'abstract' | 'references' | 'insights'>(
    ['abstract', 'references', 'insights'].includes(queryTab) ? queryTab : 'abstract'
  );
  const [activeInsightsSubTab, setActiveInsightsSubTab] = useState<'overview' | 'similarity' | 'contradiction' | 'graph'>('overview');
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [activeAccordionIdx, setActiveAccordionIdx] = useState<number | null>(null);
  const [loadingStepIdx, setLoadingStepIdx] = useState(0);
  const loadingSteps = ["Analyzing paper...", "Generating insights...", "Structuring results..."];
  const queryClient = useQueryClient();
  const { data: aiStatus } = usePaperAIStatus(id!, activeMetadataTab === 'insights');

  useEffect(() => {
    if (aiStatus?.jobStatus === 'completed') {
      queryClient.invalidateQueries({ queryKey: ['papers', 'detail', id] });
    }
  }, [aiStatus?.jobStatus, id, queryClient]);

  const retryExtraction = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post<ApiResponse<{ paper: Paper }>>(`/papers/${id}/extract/retry`);
      return res.data.data!.paper;
    },
    onSuccess: () => {
      toast.success('Extraction retried');
      queryClient.invalidateQueries({ queryKey: ['papers', 'detail', id] });
    },
    onError: (err) => {
      toast.error('Failed to retry extraction', extractApiError(err));
    },
  });

  const generateInsights = useMutation({
    mutationFn: async () => {
      setGenerationError(null);
      const res = await apiClient.post<ApiResponse<{ paper: Paper }>>(`/papers/${id}/generate-insights`);
      return res.data.data!.paper;
    },
    onSuccess: (updatedPaper) => {
      queryClient.setQueryData(['papers', 'detail', id], updatedPaper);
      toast.success('AI Insights generated successfully');
    },
    onError: (err: any) => {
      const apiErr = extractApiError(err);
      setGenerationError(apiErr || 'Unable to generate AI Insights.');
      toast.error('Failed to generate AI Insights', apiErr);
    },
  });

  const handleRetryInsights = () => {
    setGenerationError(null);
    generateInsights.mutate();
  };

  useEffect(() => {
    if (
      activeMetadataTab === 'insights' &&
      paper &&
      !paper.aiInsights?.executiveSummary &&
      !generateInsights.isPending &&
      !generationError
    ) {
      generateInsights.mutate();
    }
  }, [activeMetadataTab, paper, generateInsights.isPending, generationError, id]);

  useEffect(() => {
    let interval: any;
    if (generateInsights.isPending || paper?.aiInsightsStatus === 'processing') {
      interval = setInterval(() => {
        setLoadingStepIdx((prev) => (prev + 1) % loadingSteps.length);
      }, 2000);
    } else {
      setLoadingStepIdx(0);
    }
    return () => clearInterval(interval);
  }, [generateInsights.isPending, paper?.aiInsightsStatus]);

  useEffect(() => {
    if (!id || paper?.status !== 'ready') return;

    let active = true;
    let objectUrl: string | null = null;

    async function loadPdf() {
      setPdfLoading(true);
      setPdfError(false);
      try {
        const response = await apiClient.get(`/papers/${id}/stream`, {
          responseType: 'blob',
        });
        if (active) {
          const blob = new Blob([response.data], { type: 'application/pdf' });
          objectUrl = URL.createObjectURL(blob);
          setPdfUrl(objectUrl);
        }
      } catch (err) {
        if (active) {
          setPdfError(true);
        }
      } finally {
        if (active) {
          setPdfLoading(false);
        }
      }
    }

    loadPdf();

    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [id, paper?.status]);

  async function handleDownload() {
    if (!paper) return;
    try {
      let downloadUrl = pdfUrl;
      let tempUrl: string | null = null;
      if (!downloadUrl) {
        const response = await apiClient.get(`/papers/${paper._id}/stream`, {
          responseType: 'blob',
        });
        const blob = new Blob([response.data], { type: 'application/pdf' });
        tempUrl = URL.createObjectURL(blob);
        downloadUrl = tempUrl;
      }
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = paper.originalFileName || `${paper.title}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      if (tempUrl) {
        URL.revokeObjectURL(tempUrl);
      }
    } catch (err) {
      toast.error('Failed to download paper', extractApiError(err));
    }
  }

  async function handleDelete() {
    if (!paper) return;
    if (!confirm(`Delete "${paper.title}"? This cannot be undone.`)) return;
    try {
      await deletePaper.mutateAsync(paper._id);
      toast.success('Paper deleted');
      navigate(-1);
    } catch (err) {
      toast.error('Failed to delete paper', extractApiError(err));
    }
  }

  const uploaderName = paper?.uploadedBy
    ? typeof paper.uploadedBy === 'string'
      ? paper.uploadedBy
      : (paper.uploadedBy as IUser).name
    : '—';

  const workspaceName = paper?.workspace
    ? typeof paper.workspace === 'string'
      ? paper.workspace
      : (paper.workspace as Workspace).name
    : '—';

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in max-w-5xl">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-[600px] rounded-xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !paper) {
    return (
      <EmptyState
        icon={<FileText className="h-8 w-8" />}
        title="Paper not found"
        description="This paper doesn't exist or you don't have access to it."
        action={{ label: 'Go back', onClick: () => navigate(-1) }}
      />
    );
  }

  const status = statusConfig[paper.status];

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <button
            onClick={() => navigate(-1)}
            className="mt-0.5 shrink-0 flex items-center justify-center h-8 w-8 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-surface-secondary dark:hover:bg-dark-tertiary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100 leading-snug truncate">
              {paper.title}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {paper.originalFileName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleDownload}
            className="flex items-center gap-1.5 h-8 px-3"
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            loading={deletePaper.isPending}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* PDF Preview */}
        <div className="lg:col-span-2">
          <div className={cn(
            'rounded-xl border border-surface-border dark:border-dark-border overflow-hidden',
            'bg-slate-100 dark:bg-dark-tertiary',
          )}>
            {paper.status !== 'ready' ? (
              <div className="flex flex-col items-center justify-center h-[600px] gap-3">
                {status.icon}
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  PDF is {status.label.toLowerCase()}...
                </p>
              </div>
            ) : pdfLoading ? (
              <div className="flex flex-col items-center justify-center h-[600px] gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Loading PDF preview...
                </p>
              </div>
            ) : pdfError ? (
              <div className="flex flex-col items-center justify-center h-[600px] gap-4">
                <FileText className="h-12 w-12 text-slate-300 dark:text-slate-600" />
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Unable to preview in browser
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-600 mt-1">
                    Download the file to view it
                  </p>
                </div>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 text-sm text-brand-600 dark:text-brand-400 hover:underline"
                >
                  <Download className="h-4 w-4" />
                  Download Paper
                </button>
              </div>
            ) : (
              <motion.iframe
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                src={pdfUrl || undefined}
                title={paper.title}
                className="w-full h-[600px] border-0"
                onError={() => setPdfError(true)}
              />
            )}
          </div>

          {/* Extracted Information Section */}
          <div className="rounded-2xl border border-surface-border dark:border-dark-border bg-white dark:bg-white/5 p-5 mt-6 shadow-soft hover:shadow-soft-lg hover:-translate-y-0.5 duration-300 transition-all">
            <div className="flex items-center justify-between border-b border-surface-border dark:border-dark-border pb-3 mb-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Extracted Information
                </h2>
              </div>
              <div>
                {paper.extractionStatus === 'completed' && (
                  <Badge variant="success" className="flex items-center gap-1 text-xs">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Extraction Complete
                  </Badge>
                )}
                {paper.extractionStatus === 'processing' && (
                  <Badge variant="warning" className="flex items-center gap-1.5 text-xs">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Extracting...
                  </Badge>
                )}
                {paper.extractionStatus === 'pending' && (
                  <Badge variant="default" className="flex items-center gap-1 text-xs">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    Pending Extraction
                  </Badge>
                )}
                {paper.extractionStatus === 'failed' && (
                  <div className="flex items-center gap-2">
                    <Badge variant="danger" className="flex items-center gap-1 text-xs">
                      <AlertCircle className="h-3.5 w-3.5" />
                      Extraction Failed
                    </Badge>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => retryExtraction.mutate()}
                      loading={retryExtraction.isPending}
                      className="text-xs py-1 px-2.5 h-7"
                    >
                      Retry
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {paper.extractionStatus === 'processing' || paper.extractionStatus === 'pending' ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-brand-600 dark:text-brand-400" />
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Parsing document contents...
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    We are extracting sections, keywords, and bibliography. This will take a moment.
                  </p>
                </div>
              </div>
            ) : paper.extractionStatus === 'failed' ? (
              <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
                <AlertCircle className="h-10 w-10 text-red-500" />
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Failed to parse PDF
                  </p>
                  <p className="text-xs text-red-500 dark:text-red-400 mt-1 bg-red-50 dark:bg-red-950/30 p-2.5 rounded-lg max-w-md whitespace-pre-wrap">
                    {paper.extractionError || 'An error occurred during text extraction.'}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => retryExtraction.mutate()}
                  loading={retryExtraction.isPending}
                  className="mt-2"
                >
                  Retry Extraction Process
                </Button>
              </div>
            ) : paper.extractedMetadata ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-1 bg-slate-50 dark:bg-white/5 rounded-full border border-surface-border dark:border-white/5 w-fit shadow-inner overflow-x-auto max-w-full scrollbar-none">
                  {[
                    { id: 'abstract', label: 'Abstract & Info' },
                    { id: 'references', label: 'References' },
                    { id: 'insights', label: 'AI Insights' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setActiveMetadataTab(t.id as any)}
                      className={cn(
                        'relative px-4 py-1.5 text-xs font-bold rounded-full transition-all duration-300 whitespace-nowrap',
                        activeMetadataTab === t.id
                          ? 'bg-gradient-to-r from-brand-500 to-indigo-600 text-white shadow-md shadow-brand-500/20 scale-[1.02]'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5'
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {paper.parserDiagnostics?.parserWarnings && paper.parserDiagnostics.parserWarnings.length > 0 && (
                  <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 rounded-lg text-xs text-amber-800 dark:text-amber-300">
                    <p className="font-semibold mb-1">Parser Warnings:</p>
                    <ul className="list-disc pl-4 space-y-0.5">
                      {paper.parserDiagnostics.parserWarnings.map((w, idx) => (
                        <li key={idx}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {activeMetadataTab === 'abstract' && (
                  <div className="space-y-4 pt-2">
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                        Extracted Title
                      </h3>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-snug">
                        {paper.extractedMetadata.title || paper.title}
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                        Extracted Authors
                      </h3>
                      <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line">
                        {paper.extractedMetadata.authors || 'None detected'}
                      </p>
                    </div>

                    {paper.extractedMetadata.keywords && (
                      <div>
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                          Keywords
                        </h3>
                        <div className="flex flex-wrap gap-1.5">
                          {paper.extractedMetadata.keywords.split(/[,;\n]/).map((k) => k.trim()).filter(k => k.length > 0).map((kw, i) => (
                            <Badge key={i} variant="default" className="text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-dark-tertiary">
                              {kw}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                        Abstract
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-dark-tertiary p-3.5 rounded-lg whitespace-pre-line border border-slate-100 dark:border-dark-border">
                        {paper.extractedMetadata.abstract || 'No abstract detected.'}
                      </p>
                    </div>
                  </div>
                )}

                {activeMetadataTab === 'references' && (
                  <div className="pt-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                      Extracted References / Bibliography
                    </h3>
                    {paper.extractedMetadata.references ? (
                      <pre className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-dark-tertiary p-3 rounded-lg border border-slate-100 dark:border-dark-border whitespace-pre-wrap font-mono leading-relaxed max-h-[400px] overflow-y-auto">
                        {paper.extractedMetadata.references}
                      </pre>
                    ) : (
                      <p className="text-sm text-slate-400 italic">No references section detected.</p>
                    )}
                  </div>
                )}

                {activeMetadataTab === 'insights' && (
                  <div className="pt-2">
                    {/* Loading State with cycling messages */}
                    {(generateInsights.isPending || paper.aiInsightsStatus === 'processing') && (
                      <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
                        <div>
                          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                            {loadingSteps[loadingStepIdx]}
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                            Gemini is reading the paper details and preparing your summary, takeaways, and review questions.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Error State */}
                    {(generationError || paper.aiInsightsStatus === 'failed') && !generateInsights.isPending && (
                      <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                        <AlertCircle className="h-10 w-10 text-red-500" />
                        <div>
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Unable to generate AI Insights.
                          </p>
                          <p className="text-xs text-red-500 dark:text-red-400 mt-1 max-w-md bg-red-50 dark:bg-red-950/30 p-2.5 rounded-lg whitespace-pre-wrap mx-auto">
                            {generationError || paper.extractionError || 'An error occurred while calling the AI service.'}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={handleRetryInsights}
                          loading={generateInsights.isPending}
                          className="mt-2"
                        >
                          Retry AI Insights
                        </Button>
                      </div>
                    )}

                    {/* Display State */}
                    {paper.aiInsights?.executiveSummary && !generateInsights.isPending && !generationError && (
                      <div className="space-y-6 pt-2">
                        {/* Sub Tab Bar inside AI Insights */}
                        <div className="flex border-b border-slate-100 dark:border-slate-800 gap-4 mb-2 overflow-x-auto scrollbar-none">
                          {[
                            { id: 'overview', label: 'Overview' },
                            { id: 'similarity', label: 'Similarity' },
                            { id: 'contradiction', label: 'Contradictions' },
                            { id: 'graph', label: 'Knowledge Graph' },
                          ].map((subTab) => (
                            <button
                              key={subTab.id}
                              onClick={() => setActiveInsightsSubTab(subTab.id as any)}
                              className={cn(
                                'pb-2 text-xs font-bold transition-all relative border-b-2 border-transparent -mb-[1px]',
                                activeInsightsSubTab === subTab.id
                                  ? 'border-brand-500 text-brand-600 dark:text-brand-400 font-semibold'
                                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                              )}
                            >
                              {subTab.label}
                            </button>
                          ))}
                        </div>

                        {/* Background Job Banners */}
                        {aiStatus && (aiStatus.jobStatus === 'pending' || aiStatus.jobStatus === 'processing') && (
                          <div className="flex items-center gap-2 text-2xs font-semibold text-brand-650 dark:text-brand-400 bg-brand-500/5 border border-brand-500/10 px-3.5 py-2 rounded-xl animate-pulse mb-3 select-text">
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-500" />
                            AI Background Pipeline Processing (Workspace similarity, contradictions, and knowledge graphs)...
                          </div>
                        )}
                        {aiStatus && (aiStatus.jobStatus === 'failed' || aiStatus.jobStatus === 'delayed') && (
                          <div className="flex items-center gap-2 text-2xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-500/5 border border-amber-500/15 px-3.5 py-2 rounded-xl mb-3 animate-pulse select-text">
                            <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                            AI Processing Delayed (Local ML Service Offline). Retrying automatically.
                          </div>
                        )}

                        {activeInsightsSubTab === 'overview' && (
                          <div className="space-y-6 animate-fade-in">
                            {/* Section 1: Executive Summary - Chat-Style UI */}
                            <div className="bg-slate-50 dark:bg-dark-tertiary/40 rounded-2xl p-5 border border-surface-border dark:border-white/5 shadow-soft-sm relative overflow-hidden flex flex-col gap-4">
                              <div className="flex items-center justify-between border-b border-surface-border dark:border-white/5 pb-2.5">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                                  <BrainCircuit className="h-4 w-4 text-brand-500" />
                                  AI Analysis Stream
                                </h3>
                                <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                                  Synthesis Complete
                                </span>
                              </div>

                              <div className="space-y-4">
                                {/* User Question Prompt Bubble */}
                                <div className="flex justify-end">
                                  <div className="bg-brand-500/10 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300 text-xs px-3.5 py-2.5 rounded-2xl rounded-tr-sm max-w-sm font-medium">
                                    Summarize the core methodology and contributions of this research paper.
                                  </div>
                                </div>

                                {/* AI Assistant Answer Bubble */}
                                <div className="flex items-start gap-3">
                                  <div className="h-7 w-7 rounded-lg bg-gradient-to-r from-brand-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-md shadow-brand-500/10">
                                    <Sparkles className="h-3.5 w-3.5 text-white" />
                                  </div>
                                  <div className="flex-1 bg-white dark:bg-dark-secondary text-xs text-slate-700 dark:text-slate-350 p-4 rounded-2xl rounded-tl-sm border border-surface-border dark:border-white/5 shadow-soft space-y-3">
                                    {paper.aiInsights.executiveSummary.split('\n\n').filter(p => p.trim().length > 0).map((para, idx) => (
                                      <p key={idx} className="leading-relaxed">
                                        {para.trim()}
                                      </p>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Section 2: Key Findings - Chips/Tags UI */}
                            <div className="bg-white dark:bg-white/5 rounded-2xl p-5 border border-surface-border dark:border-white/5 shadow-soft-sm">
                              <div className="flex items-center gap-1.5 mb-4">
                                <div className="h-6 w-6 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                                </div>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                  Core Findings & Key Takeaways
                                </h3>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {paper.aiInsights.keyFindings.map((finding, idx) => (
                                  <div 
                                    key={idx} 
                                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-500/5 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/10 hover:border-emerald-500/25 hover:scale-[1.01] hover:-translate-y-0.5 transition-all duration-200 cursor-default shadow-soft-sm"
                                  >
                                    {finding}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Section 3: Viva Questions - Accordion UI */}
                            <div className="bg-white dark:bg-white/5 rounded-2xl p-5 border border-surface-border dark:border-white/5 shadow-soft-sm">
                              <div className="flex items-center gap-1.5 mb-4">
                                <div className="h-6 w-6 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                  <Clock className="h-3.5 w-3.5 text-amber-500" />
                                </div>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                  Viva practice Prep Questions
                                </h3>
                              </div>
                              <div className="space-y-2.5">
                                {paper.aiInsights.vivaQuestions.map((q, idx) => {
                                  const isOpen = activeAccordionIdx === idx;
                                  return (
                                    <div 
                                      key={idx} 
                                      className="rounded-xl border border-surface-border dark:border-white/5 bg-slate-50/50 dark:bg-white/5 overflow-hidden transition-all duration-300 shadow-soft-sm hover:border-brand-500/15"
                                    >
                                      <button
                                        onClick={() => setActiveAccordionIdx(isOpen ? null : idx)}
                                        className="w-full flex items-center justify-between p-3.5 text-left text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors gap-4"
                                      >
                                        <span className="flex gap-2">
                                          <span className="text-amber-500 font-bold">Q{idx + 1}.</span>
                                          <span>{q}</span>
                                        </span>
                                        <motion.span
                                          animate={{ rotate: isOpen ? 180 : 0 }}
                                          transition={{ duration: 0.2 }}
                                          className="text-slate-400 shrink-0"
                                        >
                                          ▼
                                        </motion.span>
                                      </button>
                                      <AnimatePresence>
                                        {isOpen && (
                                          <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                                            className="border-t border-surface-border dark:border-white/5 bg-white dark:bg-dark-secondary/30 p-4"
                                          >
                                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                                              💡 **Viva Preparation Guide**: Explain how this specific finding or methodology is established by the author's experiments. Highlight variables, limitations, and how it addresses the research problem compared to existing solutions.
                                            </p>
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}

                        {activeInsightsSubTab === 'similarity' && (
                          <div className="animate-fade-in">
                            <SimilarityPanel currentPaper={paper} allPapers={workspacePapers} aiStatus={aiStatus} />
                          </div>
                        )}

                        {activeInsightsSubTab === 'contradiction' && (
                          <div className="animate-fade-in">
                            <ContradictionPanel currentPaper={paper} allPapers={workspacePapers} aiStatus={aiStatus} />
                          </div>
                        )}

                        {activeInsightsSubTab === 'graph' && (
                          <div className="animate-fade-in">
                            <GraphPanel currentPaper={paper} allPapers={workspacePapers} aiStatus={aiStatus} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic text-center py-4">No metadata available.</p>
            )}
          </div>
        </div>

        {/* Metadata Panel */}
        <div className="space-y-4">
          {/* Status + Actions */}
          <div className="rounded-xl border border-surface-border dark:border-dark-border bg-white dark:bg-dark-secondary p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-600 mb-3">
              Status
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={status.variant} className="flex items-center gap-1.5 w-fit text-xs">
                {status.icon}
                {status.label}
              </Badge>
              {paper.parserDiagnostics?.documentType && (
                <Badge variant="default" className="text-xs capitalize">
                  Type: {paper.parserDiagnostics.documentType.replace('_', ' ')}
                </Badge>
              )}
            </div>

            {paper.processingError && (
              <p className="text-xs text-red-500 dark:text-red-400 mt-2 bg-red-50 dark:bg-red-950/30 rounded-lg p-2">
                {paper.processingError}
              </p>
            )}
          </div>

          {/* Paper Details */}
          <div className="rounded-xl border border-surface-border dark:border-dark-border bg-white dark:bg-dark-secondary p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-600 mb-3">
              Details
            </h3>
            <dl className="space-y-3">
              {[
                {
                  icon: HardDrive,
                  label: 'File size',
                  value: formatBytes(paper.fileSize),
                },
                {
                  icon: FileText,
                  label: 'Pages',
                  value: paper.pageCount ? `${paper.pageCount} pages` : 'Unknown',
                },
                {
                  icon: FolderOpen,
                  label: 'Workspace',
                  value: workspaceName,
                },
                {
                  icon: User,
                  label: 'Uploaded by',
                  value: uploaderName,
                },
                {
                  icon: Calendar,
                  label: 'Uploaded',
                  value: formatRelativeTime(paper.createdAt),
                },
                ...(paper.parserDiagnostics ? [
                  {
                    icon: CheckCircle,
                    label: 'Confidence',
                    value: paper.parserDiagnostics.extractionConfidence !== undefined ? `${paper.parserDiagnostics.extractionConfidence}%` : '0%',
                  },
                  {
                    icon: Clock,
                    label: 'Has TOC',
                    value: paper.parserDiagnostics.hasTableOfContents ? 'Yes' : 'No',
                  }
                ] : [])
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-2.5">
                  <Icon className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-2xs text-slate-400 dark:text-slate-600">{label}</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300 truncate">{value}</p>
                  </div>
                </div>
              ))}
            </dl>
          </div>

          {/* Tags */}
          {paper.tags.length > 0 && (
            <div className="rounded-xl border border-surface-border dark:border-dark-border bg-white dark:bg-dark-secondary p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-600 mb-3">
                Tags
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {paper.tags.map((tag) => (
                  <Badge key={tag} variant="default">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Open in new tab */}
          <a
            href={pdfUrl || undefined}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'flex items-center justify-center gap-2 w-full h-9 rounded-lg text-sm',
              'border border-surface-border dark:border-dark-border',
              'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100',
              'hover:bg-surface-secondary dark:hover:bg-dark-tertiary transition-colors',
              (!pdfUrl || pdfLoading) && 'pointer-events-none opacity-50'
            )}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open PDF in new tab
          </a>
        </div>
      </div>
    </div>
  );
}
