import { useEffect, useRef } from 'react';

export interface BackStackLayer {
  id: string;
  open: boolean;
  onClose: () => void;
}

/**
 * Unifies browser history (popstate) and Android/Capacitor hardware back button
 * so pressing Back closes the topmost open modal/drawer instead of exiting the app.
 */
export function useBackStack(layers: BackStackLayer[]) {
  const openLayers = layers.filter((l) => l.open);
  const openIdsKey = openLayers.map((l) => l.id).join('|');
  const openLayersRef = useRef<BackStackLayer[]>(openLayers);
  openLayersRef.current = openLayers;

  const pushedCountRef = useRef<number>(0);

  // Sync history state stack with number of open overlays
  useEffect(() => {
    const desiredCount = openLayersRef.current.length;
    if (desiredCount > pushedCountRef.current) {
      const diff = desiredCount - pushedCountRef.current;
      for (let i = 0; i < diff; i++) {
        try {
          window.history.pushState({ mareaModal: true, depth: pushedCountRef.current + i + 1 }, '');
        } catch {
          // Ignore sandboxed history errors
        }
      }
      pushedCountRef.current = desiredCount;
    } else if (desiredCount < pushedCountRef.current) {
      pushedCountRef.current = desiredCount;
    }
  }, [openIdsKey]);

  useEffect(() => {
    const closeTopLayer = (): boolean => {
      const active = openLayersRef.current;
      if (active.length === 0) return false;
      const top = active[active.length - 1];
      top.onClose();
      return true;
    };

    const handlePopState = () => {
      if (openLayersRef.current.length > 0) {
        pushedCountRef.current = Math.max(0, pushedCountRef.current - 1);
        closeTopLayer();
      }
    };

    const handleDomBackButton = (e: Event) => {
      if (openLayersRef.current.length > 0) {
        e.preventDefault();
        closeTopLayer();
      }
    };

    window.addEventListener('popstate', handlePopState);
    document.addEventListener('backbutton', handleDomBackButton);

    let capRemove: (() => void) | null = null;
    try {
      const capApp = (window as unknown as {
        Capacitor?: {
          Plugins?: {
            App?: {
              addListener?: (
                ev: string,
                cb: (info: { canGoBack?: boolean }) => void
              ) => Promise<{ remove: () => void }> | { remove: () => void };
            };
          };
        };
      }).Capacitor?.Plugins?.App;

      if (capApp?.addListener) {
        const res = capApp.addListener('backButton', () => {
          closeTopLayer();
        });
        if (res && typeof (res as Promise<{ remove: () => void }>).then === 'function') {
          void (res as Promise<{ remove: () => void }>).then((handle) => {
            capRemove = () => handle.remove();
          });
        } else if (res && typeof (res as { remove: () => void }).remove === 'function') {
          capRemove = () => (res as { remove: () => void }).remove();
        }
      }
    } catch {
      // Safe fallback outside Capacitor
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('backbutton', handleDomBackButton);
      capRemove?.();
    };
  }, []);
}
