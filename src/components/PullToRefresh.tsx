import { RefreshCw } from 'lucide-react';
import { useRef, useState, type ReactNode } from 'react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: ReactNode;
  className?: string;
  label?: string;
}

export function PullToRefresh({
  onRefresh,
  children,
  className = '',
  label = 'Desliza hacia abajo para actualizar',
}: PullToRefreshProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const startYRef = useRef<number | null>(null);
  const [pullPx, setPullPx] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const THRESHOLD = 58;

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el || el.scrollTop > 4 || refreshing) {
      startYRef.current = null;
      return;
    }
    startYRef.current = e.touches[0]?.clientY ?? null;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (startYRef.current === null || refreshing) return;
    const currentY = e.touches[0]?.clientY ?? startYRef.current;
    const delta = currentY - startYRef.current;
    if (delta > 0) {
      setPullPx(Math.min(82, delta * 0.55));
    } else {
      setPullPx(0);
    }
  };

  const handleTouchEnd = async () => {
    if (startYRef.current === null) return;
    const pulled = pullPx;
    startYRef.current = null;
    if (pulled >= THRESHOLD && !refreshing) {
      setRefreshing(true);
      setPullPx(44);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPullPx(0);
      }
    } else {
      setPullPx(0);
    }
  };

  return (
    <div
      ref={scrollRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`relative overflow-y-auto deck-scroll ${className}`}
    >
      {(pullPx > 8 || refreshing) && (
        <div
          style={{ height: `${Math.max(32, pullPx)}px` }}
          className="flex items-center justify-center gap-2 text-xs font-semibold text-sky-300 transition-[height] duration-150"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-amber-300' : ''}`} />
          <span>
            {refreshing
              ? 'Actualizando...'
              : pullPx >= THRESHOLD
                ? 'Suelta para actualizar'
                : label}
          </span>
        </div>
      )}
      {children}
    </div>
  );
}
