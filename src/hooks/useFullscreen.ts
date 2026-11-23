import { useCallback, useEffect, useState } from 'react';

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: (options?: FullscreenOptions) => Promise<void> | void;
};

type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
  webkitFullscreenEnabled?: boolean;
};

function getFullscreenElement(): Element | null {
  if (typeof document === 'undefined') return null;
  const doc = document as FullscreenDocument;
  return doc.fullscreenElement || doc.webkitFullscreenElement || null;
}

export function isFullscreenSupported(): boolean {
  if (typeof document === 'undefined') return false;
  const doc = document as FullscreenDocument;
  const el = document.documentElement as FullscreenElement;
  return Boolean(
    doc.fullscreenEnabled ||
      doc.webkitFullscreenEnabled ||
      el.requestFullscreen ||
      el.webkitRequestFullscreen
  );
}

export function isNativeAndroidCapacitor(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as unknown as { Capacitor?: { isNativePlatform?: () => boolean; getPlatform?: () => string } };
  try {
    return Boolean(w.Capacitor?.isNativePlatform?.() && w.Capacitor?.getPlatform?.() === 'android');
  } catch {
    return false;
  }
}

export async function requestAppFullscreen(
  orientationPref: 'auto' | 'landscape' | 'portrait' = 'auto'
): Promise<boolean> {
  if (typeof document === 'undefined') return false;
  if (getFullscreenElement()) return true;

  const el = document.documentElement as FullscreenElement;
  try {
    if (el.requestFullscreen) {
      await el.requestFullscreen({ navigationUI: 'hide' });
    } else if (el.webkitRequestFullscreen) {
      await el.webkitRequestFullscreen({ navigationUI: 'hide' });
    } else {
      return false;
    }

    // Apply orientation preference once in fullscreen if supported
    try {
      const ori = screen.orientation as ScreenOrientation & {
        lock?: (lockType: string) => Promise<void>;
        unlock?: () => void;
      };
      if (orientationPref === 'landscape' && ori?.lock) {
        await ori.lock('landscape');
      } else if (orientationPref === 'portrait' && ori?.lock) {
        await ori.lock('portrait');
      } else if (orientationPref === 'auto' && ori?.unlock) {
        ori.unlock();
      }
    } catch {
      // Many browsers do not support locking orientation even in fullscreen
    }
    return true;
  } catch {
    return false;
  }
}

export async function exitAppFullscreen(): Promise<void> {
  if (typeof document === 'undefined') return;
  const doc = document as FullscreenDocument;
  try {
    if (doc.fullscreenElement && doc.exitFullscreen) {
      await doc.exitFullscreen();
    } else if (doc.webkitFullscreenElement && doc.webkitExitFullscreen) {
      await doc.webkitExitFullscreen();
    }
  } catch {
    // Ignore exit errors
  }
  try {
    const ori = screen.orientation as ScreenOrientation & { unlock?: () => void };
    ori?.unlock?.();
  } catch {
    // Ignore unlock errors
  }
}

export function useFullscreen(orientationPref: 'auto' | 'landscape' | 'portrait' = 'auto') {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => Boolean(getFullscreenElement()));
  const supported = isFullscreenSupported();
  const isNativeAndroid = isNativeAndroidCapacitor();

  useEffect(() => {
    const onChange = () => {
      setIsFullscreen(Boolean(getFullscreenElement()));
    };
    document.addEventListener('fullscreenchange', onChange);
    document.addEventListener('webkitfullscreenchange', onChange);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      document.removeEventListener('webkitfullscreenchange', onChange);
    };
  }, []);

  const enter = useCallback(async () => {
    return requestAppFullscreen(orientationPref);
  }, [orientationPref]);

  const exit = useCallback(async () => {
    await exitAppFullscreen();
  }, []);

  const toggle = useCallback(async () => {
    if (getFullscreenElement()) {
      await exitAppFullscreen();
      return false;
    }
    return requestAppFullscreen(orientationPref);
  }, [orientationPref]);

  return {
    isFullscreen: isFullscreen || isNativeAndroid,
    isWebFullscreen: isFullscreen,
    supported,
    isNativeAndroid,
    enter,
    exit,
    toggle,
  };
}
