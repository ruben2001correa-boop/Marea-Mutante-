import { Anchor, BookOpen, CheckCircle2, Compass, Flame, Play, ScrollText, ShieldAlert, Skull, Sparkles, Swords, X } from 'lucide-react';
import { useState } from 'react';
import {
  NARRATIVE_PILLARS,
  STORY_MISSIONS_CATALOG,
  STORY_MISSION_MAP,
  WORLD_STORY_LORE,
} from '../game/storyMissions';
import type { PersistentState, StoryMissionId } from '../game/types';

interface StoryMissionsModalProps {
  open: boolean;
  canStartMissions: boolean;
  state: PersistentState;
  onClose: () => void;
  onStartMission: (missionId: StoryMissionId) => void;
  onResolveChoice: (missionId: StoryMissionId, choice: 'A' | 'B') => void;
}

export function StoryMissionsModal({
  open,
  canStartMissions,
  state,
  onClose,
  onStartMission,
  onResolveChoice,
}: StoryMissionsModalProps) {
  const [tab, setTab] = useState<'missions' | 'lore'>('missions');

  if (!open) return null;

  const completedCount = state.storyMissions.filter((m) => m.status === 'completed').length;
  const activeMissionId = state.activeStoryMissionId;

  return (
    <div className="fixed inset-0 z-50 bg-[#030b14]/88 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="w-full max-w-4xl max-h-[92vh] rounded-xl bg-[#071625] border border-[#285075] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#0a1e31] border-b border-[#1c3d5b] gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-amber-400/15 border border-amber-400/40 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-amber-300" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-base sm:text-lg font-bold text-slate-50 truncate">
                Crónicas de las Cenizas Saladas · Misiones
              </h2>
              <p className="text-[11px] text-slate-300">
                El Último Rumbo de los Olvidados · Progreso:{' '}
                <b className="text-amber-300">
                  {completedCount}/{STORY_MISSIONS_CATALOG.length}
                </b>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="inline-flex rounded-lg bg-[#06131f] border border-[#1d3e5c] p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setTab('missions')}
                className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
                  tab === 'missions'
                    ? 'bg-amber-400 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Misiones ({completedCount}/4)
              </button>
              <button
                type="button"
                onClick={() => setTab('lore')}
                className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
                  tab === 'lore'
                    ? 'bg-amber-400 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Historia del Mundo
              </button>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-[#112c44] hover:bg-[#1a4163] text-slate-200 cursor-pointer"
              aria-label="Cerrar historia y misiones"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto deck-scroll p-4 space-y-4">
          {tab === 'lore' ? (
            <>
              <div className="rounded-xl bg-gradient-to-br from-[#0b1f31] to-[#081523] border border-[#23486b] p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-300">
                  <Compass className="w-4 h-4" />
                  <span>{WORLD_STORY_LORE.worldTitle}</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  {WORLD_STORY_LORE.worldBody}
                </p>
              </div>

              <div className="rounded-xl bg-[#121622] border border-rose-500/35 p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-300">
                  <Flame className="w-4 h-4" />
                  <span>{WORLD_STORY_LORE.coreTitle}</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  {WORLD_STORY_LORE.coreBody}
                </p>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  Pilares Narrativos del Viaje
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {NARRATIVE_PILLARS.map((p) => (
                    <div
                      key={p.id}
                      className="rounded-xl bg-[#0b1f31] border border-[#1d3e5c] p-3.5 space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-xs font-bold text-slate-100">{p.title}</h3>
                        <span className="text-[10px] font-semibold text-amber-300">{p.subtitle}</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{p.text}</p>
                      {p.id === 'hull' && (
                        <div className="text-[10px] font-mono-num text-sky-300 pt-1">
                          Estado actual del casco: {Math.ceil(state.raft.hp)}/{state.raft.maxHp} HP
                        </div>
                      )}
                      {p.id === 'hunger' && (
                        <div className="text-[10px] font-mono-num text-emerald-300 pt-1">
                          Provisiones a bordo: {state.resources.gui} Guiso · {state.resources.veg} Veg
                        </div>
                      )}
                      {p.id === 'crew' && (
                        <div className="text-[10px] font-mono-num text-amber-200 pt-1">
                          Tripulantes vivos a bordo:{' '}
                          {state.survivors.filter((s) => s.unlocked).length}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className="rounded-xl bg-[#0a1d2f] border border-[#1e405e] p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="text-slate-300">
                  Completa las <b className="text-amber-300">4 Misiones Dramáticas</b> para desbloquear el título legendario{' '}
                  <b className="text-amber-300">Testigo de las Cenizas</b> y forjar tu destino en el océano.
                </div>
                <span className="font-mono-num text-[11px] font-bold text-sky-300">
                  {completedCount} / 4 completadas
                </span>
              </div>

              {STORY_MISSIONS_CATALOG.map((def) => {
                const prog = state.storyMissions.find((m) => m.id === def.id) || {
                  id: def.id,
                  status: 'available',
                  progress: 0,
                  target: def.targetCount,
                };
                const isActive = prog.status === 'active' || activeMissionId === def.id;
                const isPending = prog.status === 'decision_pending';
                const isDone = prog.status === 'completed';
                const anotherActive = Boolean(activeMissionId && activeMissionId !== def.id);

                return (
                  <div
                    key={def.id}
                    className={`rounded-xl border p-4 space-y-2.5 transition-colors ${
                      isPending
                        ? 'bg-[#171d2c] border-amber-400'
                        : isActive
                          ? 'bg-[#0e263c] border-sky-400'
                          : isDone
                            ? 'bg-[#081a28] border-emerald-500/45'
                            : 'bg-[#0b1f31] border-[#1f4263]'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                            {def.chapter}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-[#06131f] border border-[#23486b] text-[10px] text-sky-200">
                            {def.category}
                          </span>
                        </div>
                        <h3 className="font-display text-base font-bold text-slate-50 mt-0.5">
                          {def.title}
                        </h3>
                      </div>

                      {isDone ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-400/40 text-xs font-bold text-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Completada
                        </span>
                      ) : isPending ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-400/20 border border-amber-400 text-xs font-bold text-amber-200 animate-pulse">
                          <Sparkles className="w-3.5 h-3.5" />
                          Decisión Pendiente
                        </span>
                      ) : isActive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500/20 border border-sky-400 text-xs font-mono-num font-bold text-sky-200">
                          <Swords className="w-3.5 h-3.5" />
                          En curso ({prog.progress}/{prog.target})
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={anotherActive || !canStartMissions}
                          onClick={() => onStartMission(def.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-slate-950 font-bold text-xs cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>
                            {!canStartMissions
                              ? 'Inicia partida primero'
                              : anotherActive
                                ? 'Otra misión activa'
                                : 'Zarpar a Misión'}
                          </span>
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-slate-200 leading-relaxed">
                      <b className="text-sky-300">Premisa:</b> {def.premise}
                    </p>
                    <p className="text-xs text-rose-200/90 italic leading-relaxed">
                      <b className="not-italic text-rose-300">El golpe emocional:</b>{' '}
                      {def.emotionalHook}
                    </p>

                    <div className="rounded-lg bg-[#06131f] border border-[#1c3b58] px-3 py-2 text-[11px] text-slate-300 flex items-center gap-2">
                      <Anchor className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                      <span>
                        <b className="text-slate-100">Objetivo:</b> {def.objectiveText}
                      </span>
                    </div>

                    {isPending && (
                      <div className="rounded-lg bg-[#0a1828] border border-amber-400/50 p-3 space-y-2">
                        <div className="text-xs font-semibold text-amber-200">
                          {def.decisionPrompt}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {def.choices.map((ch) => (
                            <button
                              key={ch.id}
                              type="button"
                              onClick={() => onResolveChoice(def.id, ch.id)}
                              className="text-left rounded-lg bg-[#10263c] hover:bg-[#163654] border border-[#2a5982] hover:border-amber-400 p-2.5 space-y-1 cursor-pointer transition-colors"
                            >
                              <div className="text-xs font-bold text-amber-300">
                                Opción {ch.id}: {ch.label}
                              </div>
                              <div className="text-[11px] text-slate-300">{ch.emotionalNote}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {isDone && prog.choiceLabel && (
                      <div className="rounded-lg bg-emerald-950/35 border border-emerald-500/30 px-3 py-2 text-[11px] text-emerald-200 flex items-center gap-2">
                        <ScrollText className="w-3.5 h-3.5 shrink-0 text-emerald-300" />
                        <span>
                          <b>Tu decisión ({prog.choice}):</b> {prog.choiceLabel}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface StoryDilemmaPopupProps {
  missionId: StoryMissionId | null;
  onResolveChoice: (missionId: StoryMissionId, choice: 'A' | 'B') => void;
  onDefer: () => void;
}

export function StoryDilemmaPopup({
  missionId,
  onResolveChoice,
  onDefer,
}: StoryDilemmaPopupProps) {
  if (!missionId) return null;
  const def = STORY_MISSION_MAP[missionId];
  if (!def) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#030b14]/82 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-xl rounded-xl bg-[#081726] border-2 border-amber-400/70 shadow-2xl p-5 space-y-3.5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-rose-300">
              <Skull className="w-4 h-4" />
              <span>{def.chapter} · Decisión Moral</span>
            </div>
            <h3 className="font-display text-xl font-bold text-slate-50 mt-0.5">{def.title}</h3>
          </div>
          <button
            type="button"
            onClick={onDefer}
            className="p-1.5 rounded bg-[#102940] hover:bg-[#193d5e] text-slate-300 cursor-pointer"
            title="Decidir más tarde desde Historia"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">{def.decisionPrompt}</p>
        <div className="rounded-lg bg-[#0d1c2c] border border-rose-500/30 px-3 py-2 text-xs text-rose-200 italic flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <span>{def.emotionalHook}</span>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {def.choices.map((ch) => (
            <button
              key={ch.id}
              type="button"
              onClick={() => onResolveChoice(def.id, ch.id)}
              className="text-left rounded-xl bg-[#0f253a] hover:bg-[#173654] border border-[#2c5c86] hover:border-amber-400 p-3.5 space-y-1 cursor-pointer transition-colors"
            >
              <div className="text-xs sm:text-sm font-bold text-amber-300">
                {ch.id}. {ch.label}
              </div>
              <div className="text-xs text-slate-300">{ch.emotionalNote}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
