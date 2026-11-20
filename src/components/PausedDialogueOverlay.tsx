import { ArrowRight, MessageSquareText, SkipForward } from 'lucide-react';
import { MOOD_META } from '../game/needsAndPsychology';
import type { PausedDialogueLine } from '../game/npcConversations';

interface PausedDialogueOverlayProps {
  queue: PausedDialogueLine[];
  onNext: () => void;
  onSkipAll: () => void;
}

export function PausedDialogueOverlay({
  queue,
  onNext,
  onSkipAll,
}: PausedDialogueOverlayProps) {
  if (queue.length === 0) return null;

  const current = queue[0];
  const moodMeta = current.mood ? MOOD_META[current.mood] : null;
  const isLast = queue.length === 1;

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[1px] flex items-end justify-center p-3 sm:p-6"
    >
      <div className="w-full max-w-2xl rounded-2xl bg-[#061726]/96 border-2 border-amber-400/75 p-4 shadow-2xl">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <span
              className="w-3 h-3 rounded-full shrink-0 border border-black/40"
              style={{ backgroundColor: current.color }}
            />
            <span className="font-display text-sm sm:text-base font-extrabold text-amber-200 truncate">
              {current.speaker}
            </span>
            {current.role && (
              <span className="text-[11px] text-slate-400 font-semibold">
                · {current.role}
              </span>
            )}
            {moodMeta && (
              <span
                className={`px-2 py-0.5 rounded border text-[10px] font-bold ${moodMeta.bgClass} ${moodMeta.borderClass} ${moodMeta.textClass}`}
              >
                {moodMeta.shortLabel}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="px-2 py-0.5 rounded bg-[#0c273f] border border-[#244c6e] text-[10px] font-mono-num text-cyan-200">
              {queue.length} {queue.length === 1 ? 'diálogo' : 'diálogos'}
            </span>
            {queue.length > 1 && (
              <button
                type="button"
                onClick={onSkipAll}
                className="px-2 py-1 rounded-lg bg-[#0d2840] hover:bg-[#14395a] text-slate-300 text-[10px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                title="Cerrar todos los diálogos"
              >
                <SkipForward className="w-3 h-3" />
                <span>Omitir</span>
              </button>
            )}
          </div>
        </div>

        <div className="rounded-xl bg-[#0a2033] border border-[#1d4363] px-3.5 py-3 text-sm sm:text-base text-slate-100 leading-relaxed flex items-start gap-2.5">
          <MessageSquareText className="w-4 h-4 text-amber-300 shrink-0 mt-1" />
          <p>{current.text}</p>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="text-[11px] text-slate-400">
            ⏸️ Juego pausado para leer tranquilo · Pulsa [Espacio] o Siguiente
          </span>
          <button
            type="button"
            onClick={onNext}
            className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 text-xs sm:text-sm font-extrabold inline-flex items-center gap-1.5 cursor-pointer shadow-lg shrink-0"
          >
            <span>{isLast ? 'Entendido / Continuar 💬' : 'Siguiente 💬'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
