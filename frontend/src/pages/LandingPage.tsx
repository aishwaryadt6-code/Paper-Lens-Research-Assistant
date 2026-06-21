import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileText, Search, GitBranch, BarChart3, ArrowRight, CheckCircle, Zap, Shield, Globe, Sparkles, Microscope, Layers, BrainCircuit
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Logo } from '../components/layout/Logo';

const features = [
  { icon: BrainCircuit, title: 'AI Document Intelligence', description: 'Automatically extract methodology, variables, abstracts, and reference hierarchies from PDFs.' },
  { icon: Search, title: 'Semantic Research Search', description: 'Query your personal repository using natural language to retrieve contextually matching papers.' },
  { icon: GitBranch, title: 'Cross-Paper Conflict Detector', description: 'Uncover contradictory results, opposing theories, and gaps across multiple papers automatically.' },
  { icon: BarChart3, title: 'Synthesis & Review Builder', description: 'Generate comprehensive literature reviews, side-by-side methodology comparisons, and synthesis tables.' },
  { icon: Zap, title: 'Contextual AI Insights', description: 'Get instant executive summaries, key findings, and interactive practice viva questions for exam prep.' },
  { icon: Globe, title: 'Multi-lingual Localization', description: 'Translate academic terminology seamlessly between English, Hindi, Tamil, Telugu, and Kannada.' },
];

const benefits = [
  'Process up to 10 scientific papers simultaneously',
  'Automated conflict and consensus mapping',
  'Methodological detail extraction at scale',
  'One-click bibliography exports (APA, IEEE, MLA, BibTeX)',
  'Export generated reports to PDF, DOCX, and slides',
  'Collaborative team workspaces with role-based access',
];

export default function LandingPage() {
  return (
    <div className="min-h-full bg-[#F7F8FC] dark:bg-dark-surface relative overflow-x-hidden">
      {/* Floating Animated Background Blobs */}
      <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] bg-gradient-to-r from-brand-500/10 to-indigo-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse duration-[8000ms]" />
      <div className="absolute top-[30%] right-[10%] w-[500px] h-[500px] bg-gradient-to-r from-emerald-500/5 to-teal-500/5 rounded-full blur-[100px] pointer-events-none animate-pulse duration-[6000ms]" />
      <div className="absolute bottom-[10%] left-[5%] w-[400px] h-[400px] bg-brand-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Floating Decorative Documents */}
      <div className="hidden lg:block absolute top-[25%] left-[8%] opacity-20 dark:opacity-10 animate-bounce duration-[6000ms]">
        <div className="bg-white p-4 rounded-xl shadow-soft border border-surface-border flex flex-col gap-2 w-40 transform -rotate-12">
          <div className="flex items-center gap-1.5 border-b border-surface-border pb-1.5">
            <FileText className="h-4 w-4 text-brand-500" />
            <div className="h-2 w-16 bg-slate-200 rounded" />
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded" />
          <div className="h-1.5 w-4/5 bg-slate-100 rounded" />
          <div className="h-1.5 w-1/2 bg-slate-100 rounded" />
        </div>
      </div>

      <div className="hidden lg:block absolute top-[40%] right-[5%] opacity-20 dark:opacity-10 animate-bounce duration-[8000ms]">
        <div className="bg-white p-4 rounded-xl shadow-soft border border-surface-border flex flex-col gap-2 w-44 transform rotate-12">
          <div className="flex items-center gap-1.5 border-b border-surface-border pb-1.5">
            <Sparkles className="h-4 w-4 text-emerald-500" />
            <div className="h-2 w-20 bg-slate-200 rounded" />
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded" />
          <div className="h-1.5 w-full bg-emerald-50 rounded" />
          <div className="h-1.5 w-2/3 bg-slate-100 rounded" />
        </div>
      </div>

      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-surface-border dark:border-white/5 bg-white/80 dark:bg-dark-surface/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
          <Logo />
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="font-semibold text-slate-700 dark:text-slate-350 hover:text-slate-900 dark:hover:text-slate-50">Sign in</Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="bg-gradient-to-r from-brand-500 to-indigo-600 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 shadow-soft-sm font-semibold">
                Get started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 dark:bg-brand-500/20 border border-brand-500/20 text-brand-700 dark:text-brand-300 text-xs font-bold mb-8 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-brand-500" />
            AI-Powered Research Intelligence
          </div>
          <h1 className="text-5xl sm:text-6xl font-black text-slate-900 dark:text-slate-50 tracking-tight leading-[1.1] mb-6 text-balance max-w-4xl mx-auto">
            Read, understand & synthesize research papers with{' '}
            <span className="bg-gradient-to-r from-brand-500 via-indigo-500 to-indigo-600 bg-clip-text text-transparent">
              contextual AI
            </span>
          </h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Paper Lens is a dedicated academic intelligence engine that parses PDFs, maps methodologies, flags contradictory research findings, and generates literature syntheses.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register">
              <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-brand-500 to-indigo-600 text-white font-semibold shadow-soft hover:shadow-glow hover:scale-[1.02] transition-all duration-250">
                Start research for free
                <ArrowRight className="h-4.5 w-4.5 ml-1.5" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto font-semibold shadow-soft-sm bg-white dark:bg-white/5 border border-surface-border dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/10">
                View platform demo
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Domain-Specific Product Preview Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-20 rounded-2xl border border-surface-border dark:border-white/5 overflow-hidden shadow-soft-xl bg-white dark:bg-dark-secondary"
        >
          {/* Mock Browser Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
            <div className="flex items-center gap-1.5">
              {['bg-red-400', 'bg-amber-400', 'bg-emerald-400'].map((c) => (
                <div key={c} className={`h-2.5 w-2.5 rounded-full ${c}`} />
              ))}
            </div>
            <div className="flex items-center gap-1 px-3 py-1 bg-white dark:bg-white/5 border border-surface-border dark:border-white/5 rounded-lg text-[10px] text-slate-400 font-mono w-72 justify-center">
              <Microscope className="h-3 w-3 text-brand-500 mr-1" />
              paper-lens.ai/workspace/project-alpha
            </div>
            <div className="h-4 w-4 bg-slate-100 dark:bg-white/10 rounded-full" />
          </div>
          
          {/* Mock Workspace Panel */}
          <div className="bg-[#F7F8FC] dark:bg-dark-surface/50 grid grid-cols-12 h-[420px] text-left text-xs">
            {/* Left sidebar: Workspace papers */}
            <div className="col-span-3 border-r border-surface-border dark:border-white/5 p-4 bg-white dark:bg-dark-secondary/50 flex flex-col gap-3">
              <div className="font-bold text-2xs uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Project Library
              </div>
              <div className="space-y-2 flex-1 overflow-y-auto">
                {[
                  { title: 'Neural Attention Networks.pdf', status: 'Ready' },
                  { title: 'Methodology Synthesis.pdf', status: 'Ready' },
                  { title: 'Clinical Trial Phase-II.pdf', status: 'Processing' },
                ].map((item, idx) => (
                  <div key={idx} className={`p-2 rounded-xl border flex items-start gap-2 ${idx === 0 ? 'bg-brand-500/5 border-brand-500/20 text-brand-700 dark:text-brand-300' : 'bg-slate-50/50 border-surface-border text-slate-700 dark:text-slate-400'}`}>
                    <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="font-semibold truncate text-2xs">{item.title}</p>
                      <p className="text-[9px] text-slate-400 mt-0.5">{item.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Middle panel: Document Reader + extracted info */}
            <div className="col-span-5 p-5 flex flex-col gap-4 overflow-y-auto bg-white dark:bg-dark-surface/20">
              <div className="border-b border-surface-border dark:border-white/5 pb-3">
                <div className="flex items-center gap-1.5 text-2xs text-brand-600 dark:text-brand-400 font-semibold mb-1">
                  <CheckCircle className="h-3 w-3 text-emerald-500" />
                  PDF Parsed Successfully
                </div>
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                  Attention Is All You Need
                </h3>
                <p className="text-2xs text-slate-455 mt-0.5">Vaswani et al. (2017)</p>
              </div>

              <div className="space-y-3">
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Abstract Highlights</h4>
                  <p className="text-2xs text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-white/5 p-3 rounded-xl border border-surface-border dark:border-white/5">
                    We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely...
                  </p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">Extracted Key Metrics</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-slate-50 dark:bg-white/5 border border-surface-border rounded-xl">
                      <p className="text-[9px] text-slate-400">Dataset size</p>
                      <p className="font-bold text-xs text-slate-700 dark:text-slate-350">WMT 2014 English-German</p>
                    </div>
                    <div className="p-2 bg-slate-50 dark:bg-white/5 border border-surface-border rounded-xl">
                      <p className="text-[9px] text-slate-400">BLEU score achieved</p>
                      <p className="font-bold text-xs text-slate-700 dark:text-slate-350">28.4 (State of the Art)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right panel: AI Assistant insights */}
            <div className="col-span-4 border-l border-surface-border dark:border-white/5 p-4 bg-slate-50/50 dark:bg-dark-secondary/20 flex flex-col gap-3">
              <div className="flex items-center gap-1.5 font-bold text-2xs uppercase tracking-wider text-slate-500 dark:text-slate-455 border-b border-surface-border dark:border-white/5 pb-2">
                <Sparkles className="h-3.5 w-3.5 text-brand-500" />
                AI Assistant Insights
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto">
                <div className="bg-white dark:bg-white/5 p-3 rounded-xl border border-brand-500/10 shadow-soft-sm">
                  <p className="font-bold text-2xs text-brand-600 dark:text-brand-400 mb-1">Executive Summary</p>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-normal">
                    This work introduces self-attention layers to replace RNNs in sequence modeling. Key advantages: parallelization and reduced training times.
                  </p>
                </div>

                <div className="bg-white dark:bg-white/5 p-3 rounded-xl border border-surface-border shadow-soft-sm">
                  <p className="font-bold text-2xs text-slate-800 dark:text-slate-250 mb-1">Opposing Findings / Conflicts</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
                    Opposes traditional recurrent neural model designs (e.g., Hochreiter & Schmidhuber, 1997) regarding sequence tracking limits.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="max-w-6xl mx-auto px-6 py-24 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight mb-3">
            Designed for Academic & Enterprise Literature Synthesis
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
            Paper Lens combines neural document parsing with LLM reasoning to simplify your research workflow.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(({ icon: Icon, title, description }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="rounded-2xl border border-surface-border dark:border-white/5 p-6 bg-white dark:bg-dark-secondary hover:shadow-soft-md hover:-translate-y-1 transition-all duration-300 group"
            >
              <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-brand-500/10 dark:bg-brand-500/20 mb-5 group-hover:scale-105 transition-transform duration-200">
                <Icon className="h-5 w-5 text-brand-600 dark:text-brand-400" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-2">{title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-white dark:bg-dark-secondary/50 border-y border-surface-border dark:border-white/5 py-24 relative z-10">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50 mb-4 tracking-tight">
                Unlock insights hidden in your documents
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                Whether you're conducting a systematic literature review, preparing for a thesis defense, or cross-referencing industry publications, our platform organizes your work seamlessly.
              </p>
              <Link to="/register">
                <Button className="bg-gradient-to-r from-brand-500 to-indigo-600 text-white font-semibold hover:scale-[1.03] transition-transform">
                  Create free account <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </Link>
            </div>
            <div className="bg-slate-50 dark:bg-white/5 border border-surface-border dark:border-white/5 rounded-2xl p-6 shadow-inner">
              <ul className="space-y-4">
                {benefits.map((b) => (
                  <li key={b} className="flex items-center gap-3 text-xs font-semibold text-slate-700 dark:text-slate-350">
                    <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-2xl mx-auto px-6 py-24 text-center relative z-10">
        <div className="h-12 w-12 rounded-2xl bg-brand-500/10 flex items-center justify-center mx-auto mb-6">
          <Shield className="h-6 w-6 text-brand-500" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50 mb-3 tracking-tight">
          Supercharge your research process today
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
          Join academic researchers and R&D teams leveraging Paper Lens AI.
        </p>
        <Link to="/register">
          <Button size="lg" className="bg-gradient-to-r from-brand-500 to-indigo-600 text-white font-semibold hover:scale-[1.02] shadow-soft hover:shadow-glow transition-all">
            Get started for free <ArrowRight className="h-4.5 w-4.5 ml-1.5" />
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-surface-border dark:border-white/5 bg-white dark:bg-dark-surface py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo />
          <p className="text-2xs text-slate-400">
            © {new Date().getFullYear()} Paper Lens. AI-Powered Research Synthesis.
          </p>
        </div>
      </footer>
    </div>
  );
}
