import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FileText, FolderOpen, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '../ui/utils';
import { useUIStore } from '../../stores/uiStore';
import { useGlobalSearch } from '../../hooks/useSearch';
import { useWorkspaces } from '../../hooks/useWorkspaces';

export function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen } = useUIStore();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { data: searchResults, isFetching } = useGlobalSearch(query);
  const { data: workspaces } = useWorkspaces();

  useEffect(() => {
    if (commandPaletteOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [commandPaletteOpen]);

  function close() {
    setCommandPaletteOpen(false);
    setQuery('');
  }

  function go(path: string) {
    navigate(path);
    close();
  }

  const hasResults =
    (searchResults?.workspaces.length ?? 0) > 0 ||
    (searchResults?.papers.length ?? 0) > 0;

  const showDefault = query.trim().length < 2;

  return (
    <AnimatePresence>
      {commandPaletteOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={close}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              'relative z-10 w-full max-w-xl rounded-2xl overflow-hidden',
              'bg-white dark:bg-dark-secondary',
              'border border-surface-border dark:border-dark-border',
              'shadow-soft-xl'
            )}
          >
            {/* Input */}
            <div className="flex items-center gap-3 px-4 h-13 border-b border-surface-border dark:border-dark-border">
              {isFetching ? (
                <Loader2 className="h-4 w-4 text-slate-400 animate-spin shrink-0" />
              ) : (
                <Search className="h-4 w-4 text-slate-400 shrink-0" />
              )}
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search workspaces, papers..."
                className="flex-1 py-3.5 text-sm bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none"
              />
              <kbd className="hidden sm:inline-flex items-center rounded border border-surface-border dark:border-dark-border px-1.5 py-0.5 text-2xs font-mono text-slate-400">
                Esc
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-80 overflow-y-auto scrollbar-thin py-2">
              {showDefault ? (
                <div>
                  <p className="px-4 py-1.5 text-2xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-600">
                    Workspaces
                  </p>
                  {workspaces?.slice(0, 5).map((ws) => (
                    <button
                      key={ws._id}
                      onClick={() => go(`/workspaces/${ws._id}`)}
                      className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-surface-secondary dark:hover:bg-dark-tertiary transition-colors group"
                    >
                      <FolderOpen className="h-4 w-4 text-brand-500 shrink-0" />
                      <span className="flex-1 text-sm text-slate-700 dark:text-slate-300 text-left truncate">
                        {ws.name}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                  {!workspaces?.length && (
                    <p className="px-4 py-2 text-sm text-slate-400">No workspaces</p>
                  )}
                </div>
              ) : hasResults ? (
                <>
                  {(searchResults?.workspaces.length ?? 0) > 0 && (
                    <div>
                      <p className="px-4 py-1.5 text-2xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-600">
                        Workspaces
                      </p>
                      {searchResults!.workspaces.map((ws) => (
                        <button
                          key={ws._id}
                          onClick={() => go(`/workspaces/${ws._id}`)}
                          className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-surface-secondary dark:hover:bg-dark-tertiary transition-colors group"
                        >
                          <FolderOpen className="h-4 w-4 text-brand-500 shrink-0" />
                          <span className="flex-1 text-sm text-slate-700 dark:text-slate-300 text-left truncate">
                            {ws.name}
                          </span>
                          <ArrowRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </div>
                  )}
                  {(searchResults?.papers.length ?? 0) > 0 && (
                    <div>
                      <p className="px-4 py-1.5 text-2xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-600">
                        Papers
                      </p>
                      {searchResults!.papers.map((p) => (
                        <button
                          key={p._id}
                          onClick={() => go(`/papers`)}
                          className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-surface-secondary dark:hover:bg-dark-tertiary transition-colors group"
                        >
                          <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                          <span className="flex-1 text-sm text-slate-700 dark:text-slate-300 text-left truncate">
                            {p.title}
                          </span>
                          <ArrowRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Search className="h-8 w-8 text-slate-200 dark:text-slate-700 mb-2" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    No results for "{query}"
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between px-4 py-2 border-t border-surface-border dark:border-dark-border">
              <p className="text-2xs text-slate-400">
                <kbd className="font-mono">↑↓</kbd> navigate · <kbd className="font-mono">↵</kbd> select
              </p>
              <p className="text-2xs text-slate-400">Paper Lens</p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
