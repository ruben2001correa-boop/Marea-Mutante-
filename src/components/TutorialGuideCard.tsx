import { BookOpen, Compass, HelpCircle, X } from 'lucide-react';
import { useState } from 'react';
import { STORY_MISSION_MAP } from '../game/storyMissions';
import type { PersistentState } from '../game/types';

interface TutorialGuideCardProps {
  state: PersistentState;
  bottomPx: number;
  onOpenStory: () => void;
  onOpenDrawerIslands: () => void;
  onDismiss: () => void;
}

const TUTORIAL_STEPS = [
  {
    title: '1. Zarpa y toma el Timón',
    hint: 'Usa WASD o el Joystick para moverte y pulsa [Timón / F] sobre tu balsa para navegar hacia la señal cian.',
  },
  {
    title: '2. Historia · Misión 1',
    hint: 'Sigue la flecha cian a "La Boya de los Nombres" y pulsa [Atacar / Espacio] para derrotar a las 3 criaturas.',
  },
  {
    title: '3. Pisa tierra y construye',
    hint: 'Desembarca en una isla cercana y abre [Menú → Islas] para levantar un Refugio o fundar tu primer Pueblo.',
  },
  {
    title: '4. Sobrevive al Océano',
    hint: 'Cuida tus 5 vidas, evita provocar Leviatanes sin Arma Nuclear y vigila los Cuarteles Piratas (Rango F–SSS).',
  },
];

export function TutorialGuideCard({
  state,
  bottomPx,
  onOpenStory,
  onOpenDrawerIslands,
  onDismiss,
}: TutorialGuideCardProps) {
  const [minimized, setMinimized] = useState(false);

  if (state.tutorialDismissed) return null;

  const stepIdx = Math.min(TUTORIAL_STEPS.length - 1, Math.max(0, state.tutorialStep || 0));
  const step = TUTORIAL_STEPS[stepIdx];
  const activeMissionProg = state.storyMissions.find(
    (m) => m.status === 'active' || m.status === 'decision_pending'
  );
  const activeMissionDef = activeMissionProg ? STORY_MISSION_MAP[activeMissionProg.id] : null;

  if (minimized) {
    return (
      <div
        style={{ bottom: `${bottomPx}px` }}
        className="pointer-events-auto absolute left-1/2 -translate-x-1/2 z-20"
      >
        <button
          type="button"
          onClick={() => setMinimized(false)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#071929]/80 hover:bg-[#0d2840] border border-cyan-400/50 text-[10px] font-bold text-cyan-200 shadow-md backdrop-blur-[2px] cursor-pointer"
        >
          <Compass className="w-3 h-3 text-amber-300" />
          <span>Guía · {step.title}</span>
        </button>
      </div>
    );
  }

  return (
    <div
      style={{ bottom: `${bottomPx}px` }}
      onPointerDown={(e) => e.stopPropagation()}
      className="pointer-events-auto absolute left-1/2 -translate-x-1/2 z-20 w-[min(328px,calc(100vw-24px))] rounded-xl bg-[#061522]/82 hover:bg-[#071929]/95 border border-cyan-400/45 px-2.5 py-2 shadow-xl backdrop-blur-[3px] transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <HelpCircle className="w-3.5 h-3.5 text-amber-300 shrink-0" />
          <span className="text-[11px] font-extrabold text-amber-300 truncate">
            {step.title}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setMinimized(true)}
            className="px-1.5 py-0.5 rounded bg-[#0c243a] hover:bg-[#133554] text-[9px] font-semibold text-slate-300 cursor-pointer"
            title="Minimizar guía"
          >
            Min
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="p-0.5 rounded bg-[#0c243a] hover:bg-rose-950 text-slate-300 hover:text-rose-200 cursor-pointer"
            aria-label="Ocultar guía"
            title="Ocultar guía"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      <p className="text-[10px] text-slate-200 leading-snug mt-1">{step.hint}</p>

      {activeMissionDef && activeMissionProg && (
        <div className="mt-1.5 pt-1.5 border-t border-[#183854] flex items-center justify-between gap-2">
          <div className="min-w-0 text-[10px]">
            <span className="text-cyan-300 font-bold truncate block">
              {activeMissionDef.title} ({activeMissionProg.progress}/{activeMissionProg.target})
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {stepIdx === 2 && (
              <button
                type="button"
                onClick={onOpenDrawerIslands}
                className="px-2 py-0.5 rounded bg-amber-400 hover:bg-amber-300 text-slate-950 text-[10px] font-bold cursor-pointer"
              >
                Islas
              </button>
            )}
            <button
              type="button"
              onClick={onOpenStory}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-600/80 hover:bg-cyan-500 text-white text-[10px] font-bold cursor-pointer"
            >
              <BookOpen className="w-3 h-3" />
              <span>Historia</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
