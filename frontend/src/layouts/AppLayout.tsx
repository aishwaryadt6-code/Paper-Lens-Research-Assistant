import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Navbar } from '../components/layout/Navbar';
import { CommandPalette } from '../components/layout/CommandPalette';
import { UploadModal } from '../components/papers/UploadModal';
import { ToastContainer } from '../components/ui/Toast';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

export function AppLayout() {
  useKeyboardShortcuts();

  return (
    <div className="flex h-full bg-white dark:bg-dark-surface overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto scrollbar-thin bg-surface-secondary dark:bg-dark-surface">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <Outlet />
          </div>
        </main>
      </div>
      <CommandPalette />
      <UploadModal />
      <ToastContainer />
    </div>
  );
}
