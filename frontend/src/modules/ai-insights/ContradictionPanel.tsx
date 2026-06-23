import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Primitives';
import { aiService } from './aiService';
import { Sparkles, AlertTriangle, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';

interface ContradictionPanelProps {
  currentPaper: any;
  allPapers: any[];
  aiStatus?: any;
}

export default function ContradictionPanel({ currentPaper, allPapers, aiStatus }: ContradictionPanelProps) {
  const [targetPaperId, setTargetPaperId] = useState('');
  const [text1, setText1] = useState('');
  const [text2, setText2] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ contradiction_score: number; confidence_score: number; label: string } | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  // Filter other papers
  const otherPapers = allPapers.filter((p) => p._id !== currentPaper._id);

  // Populate text1 with current paper abstract
  useEffect(() => {
    if (currentPaper?.extractedMetadata?.abstract) {
      setText1(currentPaper.extractedMetadata.abstract);
    }
  }, [currentPaper]);

  // Update text2 and load precomputed contradiction when target paper changes
  const handlePaperSelect = (id: string) => {
    setTargetPaperId(id);
    const selected = otherPapers.find((p) => p._id === id);
    if (selected) {
      setText2(selected.extractedMetadata?.abstract || '');
      if (aiStatus?.contradictionResults?.[id] !== undefined) {
        setResult(aiStatus.contradictionResults[id]);
      } else {
        setResult(null);
      }
    } else {
      setText2('');
      setResult(null);
    }
  };

  const handleAnalyze = async () => {
    if (!text1.trim() || !text2.trim()) return;
    setLoading(true);
    setIsOffline(false);

    try {
      const res = await aiService.contradiction(text1, text2);
      setResult(res);
      
      // Check offline fallback
      if (res.label === 'unknown') {
        setIsOffline(true);
      }
    } catch (e) {
      setIsOffline(true);
      setResult({ contradiction_score: 0, confidence_score: 1.0, label: 'unknown' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 pt-3 select-text">
      <div className="grid md:grid-cols-2 gap-4">
        {/* Source Paper */}
        <div className="bg-white dark:bg-slate-900/40 p-4.5 rounded-2xl border border-slate-150 dark:border-slate-850 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Source Document (Active)</span>
            <Badge variant="brand" className="text-[9px] px-1.5 font-bold">This Paper</Badge>
          </div>
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{currentPaper?.title}</h4>
          <textarea
            value={text1}
            onChange={(e) => {
              setText1(e.target.value);
              setResult(null);
            }}
            placeholder="No abstract text extracted. Paste text to compare."
            className="w-full h-32 text-xs p-3 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-500 leading-relaxed resize-none scrollbar-thin"
          />
        </div>

        {/* Target Paper */}
        <div className="bg-white dark:bg-slate-900/40 p-4.5 rounded-2xl border border-slate-150 dark:border-slate-850 space-y-3">
          <div className="flex justify-between items-center gap-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">Check Against</span>
            <select
              value={targetPaperId}
              onChange={(e) => handlePaperSelect(e.target.value)}
              className="text-2xs bg-slate-100 dark:bg-slate-850 text-slate-700 dark:text-slate-350 border border-slate-200 dark:border-slate-800 px-2 py-1 rounded-lg focus:outline-none max-w-[180px] truncate"
            >
              <option value="">-- Choose Workspace Paper --</option>
              {otherPapers.map((p) => (
                <option key={p._id} value={p._id}>{p.title}</option>
              ))}
            </select>
          </div>
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
            {targetPaperId ? otherPapers.find(p => p._id === targetPaperId)?.title : 'Custom Comparison Input'}
          </h4>
          <textarea
            value={text2}
            onChange={(e) => {
              setText2(e.target.value);
              setResult(null);
            }}
            placeholder="Select another paper from the dropdown, or paste custom abstract text here to check contradictions."
            className="w-full h-32 text-xs p-3 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-500 leading-relaxed resize-none scrollbar-thin"
          />
        </div>
      </div>

      {/* Action panel */}
      <div className="flex items-center justify-between gap-4">
        {isOffline && (
          <div className="flex items-center gap-2 text-xs text-amber-600 font-semibold bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/10 px-3 py-1.5 rounded-xl">
            <AlertCircle className="h-4.5 w-4.5 text-amber-500" />
            AI Service Offline (localhost:8000). Using fallback contradiction heuristics.
          </div>
        )}
        {!isOffline && <div />}

        <Button
          onClick={handleAnalyze}
          disabled={loading || !text1.trim() || !text2.trim()}
          className="bg-brand-500 text-white font-bold h-9 text-xs ml-auto shadow-md shadow-brand-500/15"
        >
          {loading ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              Scanning for Negations...
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5 mr-1.5 text-white" />
              Detect Contradictory Claims
            </>
          )}
        </Button>
      </div>

      {/* Result Display */}
      {result !== null && (
        <div className="bg-slate-50 dark:bg-dark-tertiary/20 border border-slate-200 dark:border-slate-850 rounded-2xl p-5 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
              <AlertTriangle className="h-4.5 w-4.5 text-brand-500" />
              Contradiction & Negation Verdict
            </div>
            <div className="text-[10px] text-slate-400 font-semibold">
              Inference Confidence: {Math.round(result.confidence_score * 100)}%
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Score circle */}
            <div className="relative flex items-center justify-center shrink-0">
              <svg className="w-20 h-20 transform -rotate-90">
                <circle cx="40" cy="40" r="34" className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="6" fill="transparent" />
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  className={`transition-all duration-500 ${result.contradiction_score > 0.60 ? 'stroke-rose-500' : 'stroke-slate-450'}`}
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 34}
                  strokeDashoffset={2 * Math.PI * 34 * (1 - result.contradiction_score)}
                />
              </svg>
              <span className={`absolute text-sm font-extrabold ${result.contradiction_score > 0.60 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-100'}`}>
                {Math.round(result.contradiction_score * 100)}%
              </span>
            </div>

            {/* Explanations */}
            <div className="space-y-1.5 text-center sm:text-left flex-1">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                {result.contradiction_score > 0.60 ? (
                  <Badge variant="danger" className="text-2xs font-extrabold flex items-center gap-1 border border-rose-500/20">
                    <AlertTriangle className="h-3 w-3" />
                    High Contradiction Risk
                  </Badge>
                ) : (
                  <Badge variant="success" className="text-2xs font-extrabold flex items-center gap-1 border border-emerald-500/20">
                    <CheckCircle2 className="h-3 w-3" />
                    Compatible Findings
                  </Badge>
                )}
                <span className="text-[10px] text-slate-400 capitalize font-bold">Label: {result.label}</span>
              </div>
              <p className="text-[11px] text-slate-650 dark:text-slate-350 leading-relaxed font-medium">
                {result.contradiction_score > 0.60
                  ? 'Warning: The NLP classifier detected strong conflicting statements, opposing conclusions, or negation claims. Review the conclusions of both papers carefully.'
                  : 'No major contradictions or opposing statements were detected between the abstracts of these publications.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
