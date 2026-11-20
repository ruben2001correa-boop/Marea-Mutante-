import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-lg bg-amber-600/95 border border-amber-300/60 px-3 py-1.5 text-xs font-bold text-slate-950 shadow-xl backdrop-blur-xs pointer-events-none"
    >
      <WifiOff className="w-3.5 h-3.5 shrink-0" />
      <span>Modo sin conexión · Partida guardada localmente</span>
    </div>
  );
}
