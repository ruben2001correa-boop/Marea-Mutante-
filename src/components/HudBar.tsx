import {
  BookOpen,
  Brain,
  ChevronDown,
  ChevronUp,
  Download,
  Droplets,
  GitBranch,
  Heart,
  Moon,
  Newspaper,
  Package,
  PanelRightClose,
  PanelRightOpen,
  Pause,
  Play,
  Radiation,
  ShieldAlert,
  Sparkles,
  Swords,
  Trophy,
  Utensils,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { MAX_FREE_DEATHS, getRemainingLives } from '../game/constants';
import {
  MOOD_META,
  computeVitalPerformanceModifiers,
  createInitialVitals,
} from '../game/needsAndPsychology';
import { getShipClassName, TITLE_MAP } from '../game/socialAndKingdoms';
import type { GameMode, PersistentState, RandomEventState, WarEventState, WeatherType } from '../game/types';
import { usePWAInstall } from '../hooks/usePWAInstall';

export type HudLayoutMode = 'portrait' | 'landscape-compact' | 'landscape-wide';

interface HudBarProps {
  state: PersistentState;
  mode: GameMode;
  uiPaused: boolean;
  layoutMode: HudLayoutMode;
  locationLabel: string;
  weather: WeatherType;
  dangerousWater: boolean;
  inShelter: boolean;
  war: WarEventState;
  randomEvent: RandomEventState;
  drawerOpen: boolean;
  onToggleDrawer: () => void;
  onOpenDestiny: () => void;
  onOpenNewspaper: () => void;
  onOpenProfile: () => void;
  onOpenDonations: () => void;
  onOpenStory: () => void;
  onOpenInstall?: () => void;
  onToggleSound: () => void;
  onTogglePause: () => void;
  isOnline?: boolean;
  myRank?: number | null;
  activePlayersCount?: number;
}

const WEATHER_LABELS: Record<WeatherType, string> = {
  despejado: 'Despejado',
  brisa: 'Brisa Favorable',
  lluvia: 'Lluvia',
  tormenta: 'Tormenta',
  niebla: 'Niebla',
  oleaje: 'Oleaje Fuerte',
};

export function HudBar({
  state,
  mode,
  uiPaused,
  layoutMode,
  locationLabel,
  weather,
  dangerousWater,
  inShelter,
  war,
  randomEvent,
  drawerOpen,
  onToggleDrawer,
  onOpenDestiny,
  onOpenNewspaper,
  onOpenProfile,
  onOpenDonations,
  onOpenStory,
  onOpenInstall,
  onToggleSound,
  onTogglePause,
  isOnline = true,
  myRank = null,
  activePlayersCount = 0,
}: HudBarProps) {
  const [resourcesPopupOpen, setResourcesPopupOpen] = useState(false);
  const [vitalsPopupOpen, setVitalsPopupOpen] = useState(false);
  const { isInstallable, isInstalled, install } = usePWAInstall();

  const vitals = state.vitals || createInitialVitals();
  const perf = computeVitalPerformanceModifiers(state);
  const activeMoodKey = vitals.mentalHealth <= 28 ? 'lokito' : vitals.mood;
  const moodMeta = MOOD_META[activeMoodKey] || MOOD_META.equilibrio;
  const hasAnyCriticalVital =
    vitals.thirst <= 30 ||
    vitals.hunger <= 30 ||
    vitals.sleepiness <= 30 ||
    vitals.fatigue <= 30 ||
    vitals.mentalHealth <= 35;

  const hpPct = Math.max(0, Math.min(100, Math.round((state.hp / state.maxHp) * 100)));
  const stPct = Math.max(0, Math.min(100, Math.round((state.st / state.maxSt) * 100)));
  const hullPct = Math.max(0, Math.min(100, Math.round((state.raft.hp / Math.max(1, state.raft.maxHp)) * 100)));
  const r = state.resources;
  const shipClass = getShipClassName(state.raft.level);
  const titleName = TITLE_MAP[state.activeTitleId]?.name || 'Náufrago';
  const isCalmEarly = state.elapsedSeconds < 180;
  const livesLeft = getRemainingLives(state);
  const totalLives = MAX_FREE_DEATHS + (state.extraLivesPurchased || 0);

  const isPortrait = layoutMode === 'portrait';
  const isLandscapeCompact = layoutMode === 'landscape-compact';
  const showInlineFullResources = layoutMode === 'landscape-wide';

  const activeStory = state.storyMissions.find(
    (m) => m.status === 'active' || m.status === 'decision_pending'
  );
  const hasCriticalStrip =
    uiPaused ||
    state.raft.damagedMode ||
    dangerousWater ||
    war.active ||
    randomEvent.active ||
    Boolean(activeStory) ||
    hasAnyCriticalVital ||
    activeMoodKey !== 'equilibrio';
  const hasSecondaryStrip = isCalmEarly || state.stealthTimer > 0 || inShelter;
  const showStatusStrip = isLandscapeCompact ? hasCriticalStrip : hasCriticalStrip || hasSecondaryStrip;

  return (
    <header
      className={`relative shrink-0 bg-[#071624] border-b border-[#1b3a54] z-30 ${
        isLandscapeCompact ? 'px-2 py-0.5' : 'px-2.5 py-1'
      }`}
    >
      <div
        className={`flex items-center justify-between gap-x-2 gap-y-1 ${
          isPortrait ? 'flex-wrap' : 'flex-nowrap'
        }`}
      >
        {/* Title, Clan, Ship Class, Day, Weather & Context */}
        <div className="flex items-center gap-1.5 min-w-0 shrink">
          <h1
            className={`font-display font-bold text-slate-50 whitespace-nowrap shrink-0 ${
              isLandscapeCompact || isPortrait ? 'text-xs' : 'text-sm'
            }`}
          >
            Marea Mutante
          </h1>
          {state.clan.founded && (
            <span className="font-mono-num text-[10px] font-extrabold text-amber-300 bg-amber-400/15 border border-amber-400/40 px-1 py-0.5 rounded shrink-0">
              [{state.clan.tag}]
            </span>
          )}
          <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-medium whitespace-nowrap min-w-0">
            <span className="font-mono-num text-amber-300 font-bold">Nv.{state.level}</span>
            {!isLandscapeCompact && (
              <>
                <span className="text-slate-500 hidden xl:inline" aria-hidden="true">·</span>
                <span className="text-amber-200 hidden xl:inline truncate max-w-[120px]">{titleName}</span>
              </>
            )}
            <span className="text-slate-500" aria-hidden="true">·</span>
            <span className="font-mono-num text-sky-300">D{state.dayCount}</span>
            <span
              title={`Te quedan ${livesLeft} de ${totalLives} vidas (límite de 5 muertes gratuitas)`}
              className={`font-mono-num px-1 py-0.5 rounded border text-[9px] sm:text-[10px] font-bold ${
                livesLeft <= 1
                  ? 'bg-rose-500/20 border-rose-400/60 text-rose-300 animate-pulse'
                  : 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300'
              }`}
            >
              ♥{livesLeft}/{totalLives}
            </span>
            {!isPortrait && (
              <>
                <span className="text-slate-500 hidden sm:inline" aria-hidden="true">·</span>
                <span className="text-cyan-200 hidden sm:inline truncate max-w-[95px]">
                  {WEATHER_LABELS[weather]}
                </span>
              </>
            )}
            {showInlineFullResources && (
              <>
                <span className="text-slate-500 hidden lg:inline" aria-hidden="true">·</span>
                <span className="text-emerald-300 hidden lg:inline">{shipClass}</span>
                <span className="text-slate-500 hidden md:inline" aria-hidden="true">·</span>
                <span className="text-slate-200 hidden md:inline truncate max-w-[130px]">
                  {locationLabel}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Vitals, Hull & Adaptive Resources */}
        <div className="flex items-center gap-x-2 gap-y-1 flex-wrap sm:flex-nowrap min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-semibold text-slate-400">HP</span>
            <div className="w-10 sm:w-14 h-1.5 sm:h-2 bg-[#030d16] rounded-full overflow-hidden border border-[#1a344b]">
              <div
                className={`h-full transition-[width] duration-150 ${
                  hpPct <= 30 ? 'bg-rose-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${hpPct}%` }}
              />
            </div>
            <span className="font-mono-num text-[10px] sm:text-[11px] font-bold text-slate-100">
              {Math.ceil(state.hp)}/{state.maxHp}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[10px] font-semibold text-slate-400">ST</span>
            <div className="w-8 sm:w-11 h-1.5 sm:h-2 bg-[#030d16] rounded-full overflow-hidden border border-[#1a344b]">
              <div
                className="h-full bg-sky-400 transition-[width] duration-100"
                style={{ width: `${stPct}%` }}
              />
            </div>
            <span className="font-mono-num text-[10px] sm:text-[11px] font-bold text-sky-200">
              {Math.floor(state.st)}
            </span>
          </div>

          <div className="flex items-center gap-1" title="Resistencia del casco del navío">
            <span className="text-[10px] font-semibold text-amber-400">Casco</span>
            <div className="w-10 sm:w-12 h-1.5 sm:h-2 bg-[#030d16] rounded-full overflow-hidden border border-[#1a344b]">
              <div
                className={`h-full transition-[width] duration-150 ${
                  state.raft.damagedMode || hullPct <= 25 ? 'bg-rose-500' : 'bg-amber-400'
                }`}
                style={{ width: `${hullPct}%` }}
              />
            </div>
            <span className="font-mono-num text-[10px] sm:text-[11px] font-bold text-amber-200">
              {Math.ceil(state.raft.hp)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setVitalsPopupOpen((p) => !p)}
            title="Necesidades vitales (Sed, Hambre, Sueño, Cansancio, Mente) y efecto en rendimiento"
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-bold cursor-pointer whitespace-nowrap ${moodMeta.bgClass} ${moodMeta.borderClass} ${moodMeta.textClass} ${
              activeMoodKey === 'lokito' ? 'animate-pulse' : ''
            }`}
          >
            <Brain className="w-3 h-3 shrink-0" />
            <span>{moodMeta.shortLabel}</span>
            <span className="font-mono-num text-[9px] opacity-85">
              {Math.round(vitals.mentalHealth)}%
            </span>
            {hasAnyCriticalVital && (
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping shrink-0" />
            )}
          </button>

          {showInlineFullResources ? (
            <div className="hidden xl:flex items-center gap-x-2 text-[11px] font-mono-num text-slate-200">
              <span><b className="text-amber-400 font-sans">Mad</b> {r.mad}</span>
              <span><b className="text-sky-300 font-sans">Cht</b> {r.cht}</span>
              <span><b className="text-cyan-300 font-sans">Agu</b> {r.agu}</span>
              <span><b className="text-yellow-300 font-sans">Pez</b> {r.pez}</span>
              <span><b className="text-lime-400 font-sans">Veg</b> {r.veg}</span>
              <span><b className="text-emerald-300 font-sans">Gui</b> {r.gui}</span>
              <span><b className="text-amber-300 font-sans">Oro</b> {r.oro}</span>
              <span><b className="text-slate-300 font-sans">Car</b> {r.car}</span>
              <span><b className="text-slate-200 font-sans">Hie</b> {r.hie}</span>
              <span><b className="text-blue-300 font-sans">Tit</b> {r.tit}</span>
              <span><b className="text-purple-300 font-sans">Cri</b> {r.cri}</span>
              <span><b className="text-cyan-400 font-sans">Tec</b> {r.tec}</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setResourcesPopupOpen((p) => !p)}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#0c2135] hover:bg-[#13324f] border border-[#244a6d] text-[10px] font-mono-num text-slate-200 cursor-pointer whitespace-nowrap"
              title="Ver todos los recursos"
            >
              <Package className="w-3 h-3 text-amber-300 shrink-0" />
              <span>Mad {r.mad}</span>
              <span className="text-amber-300">Oro {r.oro}</span>
              {resourcesPopupOpen ? (
                <ChevronUp className="w-3 h-3 text-slate-400" />
              ) : (
                <ChevronDown className="w-3 h-3 text-slate-400" />
              )}
            </button>
          )}
        </div>

        {/* Compact Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onOpenStory}
            className="relative inline-flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded bg-[#10283d] hover:bg-[#173652] border border-cyan-500/45 text-[10px] sm:text-[11px] font-semibold text-cyan-200 transition-colors whitespace-nowrap cursor-pointer"
            title="Historia y Misiones Dramáticas (El Océano de las Cenizas Saladas)"
          >
            <BookOpen className="w-3 h-3 text-cyan-300" />
            {!isPortrait && !isLandscapeCompact && <span className="hidden md:inline">Misiones</span>}
            {activeStory && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
            )}
          </button>

          <button
            type="button"
            onClick={onOpenNewspaper}
            className="relative inline-flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded bg-[#10283d] hover:bg-[#173652] border border-[#2b587f] text-[10px] sm:text-[11px] font-semibold text-amber-200 transition-colors whitespace-nowrap cursor-pointer"
            title="Periódico del Mundo y Recompensas"
          >
            <Newspaper className="w-3 h-3 text-amber-300" />
            {!isPortrait && !isLandscapeCompact && <span className="hidden md:inline">Periódico</span>}
            {state.newspaper.unread && (
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
            )}
          </button>

          <button
            type="button"
            onClick={onOpenProfile}
            className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded bg-[#10283d] hover:bg-[#173652] border border-[#2b587f] text-[10px] sm:text-[11px] font-semibold text-sky-200 transition-colors whitespace-nowrap cursor-pointer"
            title={`${state.playerProfile.name} (${state.playerProfile.id}) · Clasificación Mundial (${isOnline ? 'En línea' : 'Sin internet'})`}
          >
            <Trophy className="w-3 h-3 text-amber-300" />
            <span
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                isOnline ? 'bg-emerald-400' : 'bg-rose-400'
              }`}
            />
            {myRank ? (
              <span className="font-mono-num text-amber-300 font-extrabold">#{myRank}</span>
            ) : null}
            {!isPortrait && !isLandscapeCompact && (
              <span className="hidden lg:inline max-w-[78px] truncate">
                {state.playerProfile.name}
              </span>
            )}
            {activePlayersCount > 0 && !isPortrait && (
              <span className="hidden xl:inline font-mono-num text-[9px] text-emerald-300">
                ({activePlayersCount})
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenDestiny}
            className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/50 text-[10px] sm:text-[11px] font-semibold text-amber-300 transition-colors whitespace-nowrap cursor-pointer"
            title="Árbol del Destino"
          >
            <GitBranch className="w-3 h-3" />
            {!isPortrait && !isLandscapeCompact && <span className="hidden sm:inline">Destino</span>}
          </button>

          <button
            type="button"
            onClick={onOpenDonations}
            className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/45 text-[10px] sm:text-[11px] font-semibold text-rose-200 transition-colors whitespace-nowrap cursor-pointer"
            title="Donaciones Bre-B Colombia (@3155552964) · Créditos: Ruben Dario Correa Cuellar"
          >
            <Heart className="w-3 h-3 text-rose-400" />
            {!isPortrait && !isLandscapeCompact && <span className="hidden sm:inline">Donar</span>}
          </button>

          {!isInstalled && onOpenInstall && (
            <button
              type="button"
              onClick={() => {
                if (isInstallable) {
                  void install();
                } else {
                  onOpenInstall();
                }
              }}
              className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded border text-[10px] sm:text-[11px] font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                isInstallable
                  ? 'bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-400/55 text-emerald-200'
                  : 'bg-sky-500/15 hover:bg-sky-500/25 border-sky-400/45 text-sky-200'
              }`}
              title="Instalar app en Android / móvil o compilar .APK"
            >
              <Download className="w-3 h-3" />
              {!isPortrait && !isLandscapeCompact && (
                <span className="hidden sm:inline">{isInstallable ? 'Instalar' : 'APK'}</span>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={onToggleDrawer}
            className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded bg-[#10283d] hover:bg-[#173652] border border-[#264d70] text-[10px] sm:text-[11px] font-semibold text-slate-100 transition-colors whitespace-nowrap cursor-pointer"
          >
            {drawerOpen ? <PanelRightClose className="w-3 h-3" /> : <PanelRightOpen className="w-3 h-3" />}
            <span>{drawerOpen ? 'Recoger' : 'Menú'}</span>
          </button>

          <button
            type="button"
            onClick={onToggleSound}
            className="inline-flex items-center justify-center p-1 rounded bg-[#10283d] hover:bg-[#173652] border border-[#264d70] text-slate-100 cursor-pointer"
            aria-label={state.sound ? 'Silenciar' : 'Activar sonido'}
          >
            {state.sound ? <Volume2 className="w-3.5 h-3.5 text-amber-300" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
          </button>

          {(mode === 'PLAYING' || mode === 'PAUSED') && (
            <button
              type="button"
              onClick={onTogglePause}
              className="inline-flex items-center justify-center p-1 rounded bg-[#10283d] hover:bg-[#173652] border border-[#264d70] text-slate-100 cursor-pointer"
              aria-label={mode === 'PAUSED' ? 'Reanudar' : 'Pausa'}
            >
              {mode === 'PAUSED' ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Expandable Vitals & Psychology Detail Strip */}
      {vitalsPopupOpen && (
        <div className="mt-1 pt-1.5 pb-0.5 border-t border-[#183852] space-y-1 text-[10px]">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono-num">
            <span className={`inline-flex items-center gap-1 ${vitals.thirst <= 30 ? 'text-rose-300 font-bold' : 'text-sky-200'}`}>
              <Droplets className="w-3 h-3 text-sky-400" /> Sed {Math.round(vitals.thirst)}%
            </span>
            <span className={`inline-flex items-center gap-1 ${vitals.hunger <= 30 ? 'text-rose-300 font-bold' : 'text-amber-200'}`}>
              <Utensils className="w-3 h-3 text-amber-400" /> Hambre {Math.round(vitals.hunger)}%
            </span>
            <span className={`inline-flex items-center gap-1 ${vitals.sleepiness <= 30 ? 'text-rose-300 font-bold' : 'text-indigo-200'}`}>
              <Moon className="w-3 h-3 text-indigo-300" /> Sueño {Math.round(vitals.sleepiness)}%
            </span>
            <span className={`inline-flex items-center gap-1 ${vitals.fatigue <= 30 ? 'text-rose-300 font-bold' : 'text-purple-200'}`}>
              <Zap className="w-3 h-3 text-purple-300" /> Energía {Math.round(vitals.fatigue)}%
            </span>
            <span className={`inline-flex items-center gap-1 ${vitals.mentalHealth <= 28 ? 'text-fuchsia-300 font-bold animate-pulse' : 'text-emerald-200'}`}>
              <Brain className="w-3 h-3 text-fuchsia-300" /> Mente {Math.round(vitals.mentalHealth)}%
            </span>
            <span className="text-slate-300 ml-auto font-sans">
              Rendimiento: <b className="text-cyan-300">Vel {Math.round(perf.speedMult * 100)}%</b> ·{' '}
              <b className="text-rose-300">CaC {Math.round(perf.meleeMult * 100)}%</b> ·{' '}
              <b className="text-amber-300">Dist {Math.round(perf.rangedMult * 100)}%</b> ·{' '}
              <b className="text-emerald-300">Daño Rec. {Math.round(perf.defenseMult * 100)}%</b>
            </span>
          </div>
          {perf.activeStatuses.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {perf.activeStatuses.map((st) => (
                <span
                  key={st.id}
                  className="px-1.5 py-0.5 rounded bg-[#0c2235] border border-[#244c6e] text-[10px]"
                  style={{ color: st.color }}
                >
                  <b>{st.label}:</b> {st.effectText}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Expandable Resources Drawer Dropdown for Compact / Portrait / Mid-width screens */}
      {resourcesPopupOpen && !showInlineFullResources && (
        <div className="mt-1 pt-1 border-t border-[#183852] flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] font-mono-num text-slate-200">
          <span><b className="text-amber-400 font-sans">Mad</b> {r.mad}</span>
          <span><b className="text-sky-300 font-sans">Cht</b> {r.cht}</span>
          <span><b className="text-cyan-300 font-sans">Agu</b> {r.agu}</span>
          <span><b className="text-yellow-300 font-sans">Pez</b> {r.pez}</span>
          <span><b className="text-lime-400 font-sans">Veg</b> {r.veg}</span>
          <span><b className="text-emerald-300 font-sans">Gui</b> {r.gui}</span>
          <span><b className="text-amber-300 font-sans">Oro</b> {r.oro}</span>
          <span><b className="text-slate-300 font-sans">Car</b> {r.car}</span>
          <span><b className="text-slate-200 font-sans">Hie</b> {r.hie}</span>
          <span><b className="text-blue-300 font-sans">Tit</b> {r.tit}</span>
          <span><b className="text-purple-300 font-sans">Cri</b> {r.cri}</span>
          <span><b className="text-cyan-400 font-sans">Tec</b> {r.tec}</span>
          <span className="text-emerald-300 font-sans ml-auto">
            {shipClass} · {locationLabel}
          </span>
        </div>
      )}

      {/* Status Strips */}
      {showStatusStrip && (
        <div className="mt-0.5 pt-0.5 border-t border-[#183852] flex flex-wrap items-center justify-between gap-2 text-[10px] sm:text-[11px]">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[10px] font-mono-num">
            <span className={vitals.thirst <= 30 ? 'text-rose-300 font-bold animate-pulse' : 'text-sky-300'}>
              💧{Math.round(vitals.thirst)}%
            </span>
            <span className={vitals.hunger <= 30 ? 'text-rose-300 font-bold animate-pulse' : 'text-amber-200'}>
              🍲{Math.round(vitals.hunger)}%
            </span>
            <span className={vitals.sleepiness <= 30 ? 'text-rose-300 font-bold animate-pulse' : 'text-indigo-200'}>
              😴{Math.round(vitals.sleepiness)}%
            </span>
            <span className={vitals.fatigue <= 30 ? 'text-rose-300 font-bold animate-pulse' : 'text-purple-200'}>
              ⚡{Math.round(vitals.fatigue)}%
            </span>
            <span className={vitals.mentalHealth <= 28 ? 'text-fuchsia-300 font-bold animate-pulse' : 'text-emerald-300'}>
              🧠{Math.round(vitals.mentalHealth)}%
            </span>
            {activeMoodKey !== 'equilibrio' && (
              <span className={`font-sans font-bold ${moodMeta.textClass}`}>
                · {moodMeta.label}
              </span>
            )}
          </div>
          {uiPaused && (
            <div className="text-amber-300 font-bold">
              Escenario pausado mientras mejoras o gestionas ventanas
            </div>
          )}
          {state.raft.damagedMode && (
            <div className="flex items-center gap-1 text-rose-400 font-bold">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>
                {state.raft.level >= 7
                  ? '¡Buque de Guerra averiado! Repara el casco'
                  : '¡Balsa destruida por monstruos! Repara para volver a zarpar'}
              </span>
            </div>
          )}
          {dangerousWater && (
            <div className="flex items-center gap-1 text-lime-300 font-bold">
              <Radiation className="w-3.5 h-3.5" />
              <span>☣️ Aguas Peligrosas: merodean monstruos gigantes y Leviatanes</span>
            </div>
          )}
          {!isLandscapeCompact && !uiPaused && isCalmEarly && !dangerousWater && (
            <div className="text-sky-300 font-semibold">
              Aguas Tranquilas ({Math.ceil(180 - state.elapsedSeconds)}s para explorar islas y mejorar)
            </div>
          )}
          {war.active && (
            <div className="flex items-center gap-1.5 text-rose-300 font-bold">
              <Swords className="w-3.5 h-3.5" />
              <span>{war.title} · Oleada {war.wave} ({war.remaining}/{war.total})</span>
            </div>
          )}
          {randomEvent.active && (
            <div className="flex items-center gap-1.5 text-amber-300 font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                Evento: {randomEvent.title} · {Math.ceil(randomEvent.timer)}s
                {randomEvent.targetCount > 0 ? ` (${randomEvent.progress}/${randomEvent.targetCount})` : ''}
              </span>
            </div>
          )}
          {activeStory && (
            <button
              type="button"
              onClick={onOpenStory}
              className="flex items-center gap-1 text-cyan-300 hover:text-cyan-200 font-bold cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>
                {activeStory.status === 'decision_pending'
                  ? 'Misión: ¡Decisión moral pendiente!'
                  : `Misión activa (${activeStory.progress}/${activeStory.target})`}
              </span>
            </button>
          )}
          {!isLandscapeCompact && state.stealthTimer > 0 && (
            <div className="font-mono-num text-purple-300 font-semibold">
              Sigilo: {Math.ceil(state.stealthTimer)}s
            </div>
          )}
          {!isLandscapeCompact && inShelter && (
            <div className="text-emerald-300 font-semibold">
              En Refugio Seguro (+HP)
            </div>
          )}
        </div>
      )}
    </header>
  );
}
