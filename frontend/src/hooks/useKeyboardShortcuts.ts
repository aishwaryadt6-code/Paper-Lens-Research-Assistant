import { useEffect } from 'react';
import { useUIStore } from '../stores/uiStore';

export function useKeyboardShortcuts() {
  const { setCommandPaletteOpen, setUploadModalOpen } = useUIStore();

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const isMac = navigator.platform.toUpperCase().includes('MAC');
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (modifier && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }

      if (modifier && e.key === 'u') {
        e.preventDefault();
        setUploadModalOpen(true);
      }

      if (e.key === 'Escape') {
        setCommandPaletteOpen(false);
        setUploadModalOpen(false);
      }
    }

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setCommandPaletteOpen, setUploadModalOpen]);
}
