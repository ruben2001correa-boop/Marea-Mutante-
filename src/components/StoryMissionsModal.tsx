import {
  Anchor,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Compass,
  Flame,
  MapPin,
  Play,
  ScrollText,
  Search,
  ShieldAlert,
  Skull,
  Sparkles,
  Swords,
  X,
  XCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  MISSION_CATEGORY_META,
  NARRATIVE_PILLARS,
  STORY_MISSIONS_CATALOG,
  STORY_MISSION_MAP,
  WORLD_STORY_LORE,
} from '../game/storyMissions';
import type { MissionCategory, PersistentState, StoryMissionId } from '../game/types';

interface StoryMissionsModalProps {
  open: boolean;
  canStartMissions: boolean;
  state: PersistentState;
  onClose: () => void;
  onStartMission: (missionId: StoryMissionId) => void;
  onAbandonMission?: (missionId: StoryMissionId) => void;
  onResolveChoice: (missionId: StoryMissionId, choice: 'A' | 'B') => void;
}

const PAGE_SIZE = 16;

export function StoryMissionsModal({
  open,
  canStartMissions,
  state,
  onClose,
  onStartMission,
  onAbandonMission,
  onResolveChoice,
}: StoryMissionsModalProps) {
  const [tab, setTab] = useState<'missions' | 'lore'>('missions');
  const [catFilter, setCatFilter] = useState<'all' | MissionCategory>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'active' | 'completed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  const progMap = useMemo(() => {
    const map = new Map<string, PersistentState['storyMissions'][number]>();
    for (const m of state.storyMissions) {
      map.set(m.id, m);
    }
    return map;
  }, [state.storyMissions]);

  const filteredMissions = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return STORY_MISSIONS_CATALOG.filter((def) => {
      if (catFilter !== 'all' && def.categoryKey !== catFilter) return false;
      const prog = progMap.get(def.id);
      const isActive =
        prog?.status === 'active' ||
        prog?.status === 'decision_pending' ||
        state.activeStoryMissionId === def.id;
      const isDone = prog?.status === 'completed';

      if (statusFilter === 'active' && !isActive) return false;
      if (statusFilter === 'completed' && !isDone) return false;
      if (statusFilter === 'available' && (isActive || isDone)) return false;

      if (!q) return true;
      return (
        def.title.toLowerCase().includes(q) ||
        def.premise.toLowerCase().includes(q) ||
        def.objectiveText.toLowerCase().includes(q) ||
        def.category.toLowerCase().includes(q)
      );
    });
  }, [catFilter, statusFilter, searchTerm, progMap, state.activeStoryMissionId]);

  if (!open) return null;

  const totalMissions = STORY_MISSIONS_CATALOG.length;
  const completedCount = state.storyMissions.filter((m) => m.status === 'completed').length;
  const activeMissionId = state.activeStoryMissionId;
  const totalPages = Math.max(1, Math.ceil(filteredMissions.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedMissions = filteredMissions.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      className="fixed inset-0 z-50 bg-[#030b14]/88 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 safe-p-all"
    >
      <div className="w-full max-w-5xl max-h-[92dvh] rounded-2xl bg-[#071625] border border-[#285075] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-[#0a1e31] border-b border-[#1c3d5b] gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-400/15 border border-amber-400/40 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-amber-300" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-base sm:text-lg font-bold text-slate-50 truncate">
                Crónicas de las Cenizas Saladas · Misiones ({totalMissions})
              </h2>
              <p className="text-xs text-slate-300">
                El Último Rumbo · Completadas:{' '}
                <b className="font-mono-num text-amber-300">
                  {completedCount}/{totalMissions}
                </b>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="inline-flex rounded-xl bg-[#06131f] border border-[#1d3e5c] p-1 text-xs">
              <button
                type="button"
                onClick={() => setTab('missions')}
                className={`min-h-[38px] px-3 py-1 rounded-lg font-semibold cursor-pointer transition-colors ${
                  tab === 'missions'
                    ? 'bg-amber-400 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Misiones ({completedCount}/{totalMissions})
              </button>
              <button
                type="button"
                onClick={() => setTab('lore')}
                className={`min-h-[38px] px-3 py-1 rounded-lg font-semibold cursor-pointer transition-colors ${
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
              className="min-w-[44px] min-h-[44px] rounded-xl bg-[#112c44] hover:bg-[#1a4163] text-slate-200 flex items-center justify-center cursor-pointer"
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
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              {/* Filter & Search Toolbar */}
              <div className="rounded-xl bg-[#0a1d2f] border border-[#1e405e] p-3 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="text-slate-300">
                    Las misiones generan <b className="text-cyan-300">escenas y eventos visibles en el océano</b>. Activa la que quieras y sigue el marcador dorado en tu brújula.
                  </div>
                  <span className="font-mono-num text-xs font-bold text-amber-300">
                    {completedCount} / {totalMissions} completadas
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setPage(1);
                      }}
                      placeholder="Buscar misión, jefe, evento..."
                      className="w-full min-h-[40px] pl-9 pr-3 py-1.5 rounded-lg bg-[#06131f] border border-[#23486b] text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div className="inline-flex rounded-lg bg-[#06131f] border border-[#1e3e5d] p-0.5 text-xs">
                    {(
                      [
                        ['all', 'Todas'],
                        ['available', 'Disponibles'],
                        ['active', 'Activa'],
                        ['completed', 'Completadas'],
                      ] as const
                    ).map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          setStatusFilter(id);
                          setPage(1);
                        }}
                        className={`min-h-[36px] px-2.5 py-1 rounded-md font-bold cursor-pointer ${
                          statusFilter === id
                            ? 'bg-sky-500/25 text-sky-200 border border-sky-400/40'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 8 Category Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto deck-scroll pb-1">
                  <button
                    type="button"
                    onClick={() => {
                      setCatFilter('all');
                      setPage(1);
                    }}
                    className={`min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap border cursor-pointer ${
                      catFilter === 'all'
                        ? 'bg-amber-400 text-slate-950 border-amber-300'
                        : 'bg-[#071625] text-slate-300 border-[#1f4263]'
                    }`}
                  >
                    Todas ({totalMissions})
                  </button>
                  {(Object.keys(MISSION_CATEGORY_META) as MissionCategory[]).map((key) => {
                    const meta = MISSION_CATEGORY_META[key];
                    const active = catFilter === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setCatFilter(key);
                          setPage(1);
                        }}
                        className={`min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap border cursor-pointer ${
                          active
                            ? 'bg-amber-400/25 text-amber-200 border-amber-400'
                            : 'bg-[#071625] text-slate-300 border-[#1f4263] hover:border-sky-400/50'
                        }`}
                      >
                        {meta.badge}
                      </button>
                    );
                  })}
                </div>
              </div>

              {pagedMissions.length === 0 ? (
                <div className="rounded-xl bg-[#0b1f31] border border-[#1f4263] p-8 text-center text-xs text-slate-400">
                  No se encontraron misiones con ese filtro.
                </div>
              ) : (
                pagedMissions.map((def) => {
                  const prog = progMap.get(def.id) || {
                    id: def.id,
                    status: 'available' as const,
                    progress: 0,
                    target: def.targetCount,
                  };
                  const isActive = prog.status === 'active' || activeMissionId === def.id;
                  const isPending = prog.status === 'decision_pending';
                  const isDone = prog.status === 'completed';
                  const anotherActive = Boolean(activeMissionId && activeMissionId !== def.id);
                  const catMeta = MISSION_CATEGORY_META[def.categoryKey];

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
                            <span
                              className="px-1.5 py-0.5 rounded bg-[#06131f] border text-[10px] font-bold"
                              style={{ borderColor: `${catMeta?.color || '#38bdf8'}55`, color: catMeta?.color || '#7dd3fc' }}
                            >
                              {catMeta?.badge || def.category}
                            </span>
                            <span className="text-[10px] font-mono-num text-slate-400">
                              Nivel {def.tier}
                            </span>
                          </div>
                          <h3 className="font-display text-base font-bold text-slate-50 mt-0.5">
                            {def.title}
                          </h3>
                        </div>

                        {isDone ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-400/40 text-xs font-bold text-emerald-300">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Completada
                          </span>
                        ) : isPending ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-400/20 border border-amber-400 text-xs font-bold text-amber-200 animate-pulse">
                            <Sparkles className="w-3.5 h-3.5" />
                            Decisión Pendiente
                          </span>
                        ) : isActive ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-sky-500/20 border border-sky-400 text-xs font-mono-num font-bold text-sky-200">
                              <Swords className="w-3.5 h-3.5" />
                              En curso ({prog.progress}/{prog.target})
                            </span>
                            {onAbandonMission && (
                              <button
                                type="button"
                                onClick={() => onAbandonMission(def.id)}
                                className="min-h-[38px] px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/30 border border-rose-400/50 text-rose-200 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Abandonar</span>
                              </button>
                            )}
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={!canStartMissions}
                            onClick={() => onStartMission(def.id)}
                            className="min-h-[42px] inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-slate-950 font-extrabold text-xs cursor-pointer"
                          >
                            <Play className="w-3.5 h-3.5" />
                            <span>
                              {!canStartMissions
                                ? 'Inicia partida primero'
                                : anotherActive
                                  ? 'Cambiar a esta Misión'
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

                      <div className="rounded-lg bg-[#06131f] border border-[#1c3b58] px-3 py-2 text-[11px] text-slate-300 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Anchor className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                          <span>
                            <b className="text-slate-100">Objetivo:</b> {def.objectiveText}
                          </span>
                        </div>
                        {isActive && typeof prog.markerX === 'number' && typeof prog.markerY === 'number' && (
                          <span className="inline-flex items-center gap-1 font-mono-num text-[10px] font-bold text-amber-300">
                            <MapPin className="w-3 h-3" />
                            Evento ({Math.round(prog.markerX)}, {Math.round(prog.markerY)})
                          </span>
                        )}
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
                                className="min-h-[44px] text-left rounded-lg bg-[#10263c] hover:bg-[#163654] border border-[#2a5982] hover:border-amber-400 p-2.5 space-y-1 cursor-pointer transition-colors"
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
                })
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between gap-2 pt-2">
                  <button
                    type="button"
                    disabled={safePage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#0d2235] hover:bg-[#143450] disabled:opacity-40 border border-[#214668] text-xs font-bold text-slate-100 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Anterior</span>
                  </button>
                  <span className="font-mono-num text-xs font-bold text-slate-300">
                    Página {safePage} / {totalPages} ({filteredMissions.length} misiones)
                  </span>
                  <button
                    type="button"
                    disabled={safePage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#0d2235] hover:bg-[#143450] disabled:opacity-40 border border-[#214668] text-xs font-bold text-slate-100 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>Siguiente</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
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
    <div
      onPointerDown={(e) => e.stopPropagation()}
      className="fixed inset-0 z-50 bg-[#030b14]/82 backdrop-blur-xs flex items-center justify-center p-4 safe-p-all"
    >
      <div className="w-full max-w-xl rounded-2xl bg-[#081726] border-2 border-amber-400/70 shadow-2xl p-5 space-y-3.5">
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
            className="min-w-[44px] min-h-[44px] rounded-xl bg-[#102940] hover:bg-[#193d5e] text-slate-300 flex items-center justify-center cursor-pointer"
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
              className="min-h-[48px] text-left rounded-xl bg-[#0f253a] hover:bg-[#173654] border border-[#2c5c86] hover:border-amber-400 p-3.5 space-y-1 cursor-pointer transition-colors"
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
