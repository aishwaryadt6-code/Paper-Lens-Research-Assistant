import { Outlet, Navigate } from 'react-router-dom';
import { Logo } from '../components/layout/Logo';
import { useAuthStore } from '../stores/authStore';
import { ToastContainer } from '../components/ui/Toast';
import { Sparkles, FileText, BrainCircuit } from 'lucide-react';
import { motion } from 'framer-motion';

export function AuthLayout() {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-full flex bg-[#F7F8FC] dark:bg-dark-surface overflow-hidden relative">
      {/* Dynamic Animated Blobs in Global Background */}
      <div className="absolute top-[-100px] right-[-100px] w-[400px] h-[400px] bg-brand-500/5 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[-100px] left-[20%] w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Left Panel: Split layout visual panel */}
      <div className="hidden lg:flex lg:w-[460px] xl:w-[500px] flex-col bg-brand-950 relative overflow-hidden shrink-0">
        {/* Animated Gradient flow */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-600 via-indigo-900 to-slate-950" />
        
        {/* Tech Grid Pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1.5px, transparent 0)`,
            backgroundSize: '24px 24px',
          }}
        />

        {/* Floating Animated Documents (AI flow style) */}
        <div className="absolute inset-0 pointer-events-none">
          {[
            { delay: 0, x: '10%', y: '25%', rotate: -15, scale: 0.8 },
            { delay: 2, x: '65%', y: '15%', rotate: 12, scale: 0.95 },
            { delay: 4, x: '45%', y: '60%', rotate: -8, scale: 0.85 },
          ].map((doc, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0.1, y: '100%' }}
              animate={{ 
                opacity: [0.1, 0.4, 0.4, 0.1], 
                y: ['80%', '20%'],
                rotate: [doc.rotate - 5, doc.rotate + 5, doc.rotate - 5]
              }}
              transition={{
                duration: 12,
                repeat: Infinity,
                delay: doc.delay,
                ease: 'easeInOut'
              }}
              style={{ left: doc.x }}
              className="absolute bg-white/10 border border-white/15 backdrop-blur-md p-4 rounded-xl flex flex-col gap-2 w-36 shadow-lg"
            >
              <div className="flex items-center gap-1.5 border-b border-white/10 pb-1.5">
                <FileText className="h-4 w-4 text-brand-300" />
                <div className="h-1.5 w-14 bg-white/30 rounded" />
              </div>
              <div className="h-1 w-full bg-white/20 rounded" />
              <div className="h-1 w-4/5 bg-white/20 rounded" />
              <div className="h-1 w-1/2 bg-white/20 rounded" />
            </motion.div>
          ))}

          {/* Connected neural nodes mock overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03]">
            <BrainCircuit className="h-96 w-96 text-white" />
          </div>
        </div>

        {/* Content of Left Panel */}
        <div className="relative z-10 flex flex-col h-full p-10 justify-between">
          <div className="flex items-center gap-2">
            <Logo className="text-white" />
          </div>

          <div className="space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-white text-[10px] font-bold tracking-wide uppercase w-fit">
              <Sparkles className="h-3 w-3 text-brand-300" />
              Research synthesizing engine
            </div>
            <blockquote className="text-2xl font-black text-white leading-snug tracking-tight">
              Unlock the core insights hidden in your documents.
            </blockquote>
            <p className="text-brand-200 text-xs leading-relaxed max-w-sm">
              Upload papers, extract findings, map conflicting research, and prepare for viva presentations in a single workspace.
            </p>
          </div>

          {/* Stats metrics */}
          <div className="grid grid-cols-3 gap-4 pt-8 border-t border-white/10">
            {[
              { value: '1,280+', label: 'Papers parsed' },
              { value: '50+', label: 'Workspaces' },
              { value: '98%', label: 'AI Accuracy' },
            ].map(({ value, label }) => (
              <div key={label}>
                <p className="text-lg font-bold text-white">{value}</p>
                <p className="text-[10px] text-brand-300 uppercase font-semibold tracking-wider">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel: Auth layout container with glass backdrop */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-center gap-2 mb-8 lg:hidden">
            <Logo />
          </div>
          <Outlet />
        </div>
      </div>

      <ToastContainer />
    </div>
  );
}

