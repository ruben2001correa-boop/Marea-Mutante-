import {
  BookOpen,
  Brain,
  ChevronDown,
  ChevronUp,
  Download,
  Droplets,
  Gamepad2,
  GitBranch,
  Heart,
  MapPin,
  Maximize2,
  Minimize2,
  Moon,
  Newspaper,
  Package,
  PanelRightClose,
  PanelRightOpen,
  Pause,
  Play,
  Radiation,
  Shield,
  ShieldAlert,
  Sliders,
  Sparkles,
  Swords,
  Trophy,
  Utensils,
  Volume2,
  VolumeX,
  WifiOff,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { MAX_FREE_DEATHS, getDifficultyModifiers, getRemainingLives } from '../game/constants';
import {
  MOOD_META,
  SITUATIONAL_META,
  computeVitalPerformanceModifiers,
  createInitialVitals,
} from '../game/needsAndPsychology';
import { getMarineWantedLevel, getSeaRankInfo, getShipClassName, TITLE_MAP } from '../game/socialAndKingdoms';
import type { GameMode, PersistentState, RandomEventState, WarEventState, WeatherType } from '../game/types';
import type { DistanceTierInfo } from '../game/worldGen';
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
  distanceTier?: DistanceTierInfo;
  gamepadConnected?: boolean;
  war: WarEventState;
  randomEvent: RandomEventState;
  drawerOpen: boolean;
  onToggleDrawer: () => void;
  onOpenDestiny: () => void;
  onOpenNewspaper: () => void;
  onOpenProfile: () => void;
  onOpenDonations: () => void;
  onOpenStory: () => void;
  onOpenMap?: () => void;
  onOpenSettings?: () => void;
  onOpenInstall?: () => void;
  onPanelOpenChange?: (open: boolean) => void;
  onToggleSound: () => void;
  onTogglePause: () => void;
  isFullscreen?: boolean;
  fullscreenSupported?: boolean;
  onToggleFullscreen?: () => void;
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

const AGE_ROMAN: Record<number, string> = {
  1: 'I',
  2: 'II',
  3: 'III',
  4: 'IV',
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
  distanceTier,
  gamepadConnected = false,
  war,
  randomEvent,
  drawerOpen,
  onToggleDrawer,
  onOpenDestiny,
  onOpenNewspaper,
  onOpenProfile,
  onOpenDonations,
  onOpenStory,
  onOpenMap,
  onOpenSettings,
  onOpenInstall,
  onPanelOpenChange,
  onToggleSound,
  onTogglePause,
  isFullscreen = false,
  fullscreenSupported = false,
  onToggleFullscreen,
  isOnline = true,
  myRank = null,
  activePlayersCount = 0,
}: HudBarProps) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelTab, setPanelTab] = useState<'ventanas' | 'info'>('ventanas');
  const [resourcesPopupOpen, setResourcesPopupOpen] = useState(false);
  const [vitalsPopupOpen, setVitalsPopupOpen] = useState(true);
  const { isInstallable, isInstalled, install } = usePWAInstall();

  useEffect(() => {
    onPanelOpenChange?.(panelOpen);
    return () => {
      onPanelOpenChange?.(false);
    };
  }, [panelOpen, onPanelOpenChange]);

  const vitals = state.vitals || createInitialVitals();
  const perf = computeVitalPerformanceModifiers(state);
  const activeMoodKey = vitals.mentalHealth <= 28 ? 'lokito' : vitals.mood;
  const moodMeta = MOOD_META[activeMoodKey] || MOOD_META.equilibrio;
  const sitState = vitals.situationalState || 'normal';
  const sitMeta = SITUATIONAL_META[sitState] || SITUATIONAL_META.normal;
  const seaRank = getSeaRankInfo(myRank);
  const marineWanted = getMarineWantedLevel(state);
  const isResourceEventPulse =
    war.active || (randomEvent.active && randomEvent.kind === 'fish_frenzy');
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
  const shipClass = getShipClassName(state.raft.level, state.warshipNuclearShield);
  const titleName = TITLE_MAP[state.activeTitleId]?.name || 'Náufrago';
  const isCalmEarly = state.dayCount <= 2;
  const livesLeft = getRemainingLives(state);
  const totalLives = MAX_FREE_DEATHS + (state.extraLivesPurchased || 0);
  const diffDef = getDifficultyModifiers(state.difficulty);

  const isPortrait = layoutMode === 'portrait';
  const isLandscapeCompact = layoutMode === 'landscape-compact';

  const activeStory = state.storyMissions.find(
    (m) => m.status === 'active' || m.status === 'decision_pending'
  );
  const hasUrgentAlert =
    state.raft.damagedMode ||
    war.active ||
    state.radiationExposure > 30 ||
    state.jammedTimer > 0;
  const hasAnyDot =
    hasUrgentAlert ||
    hasAnyCriticalVital ||
    isResourceEventPulse ||
    state.newspaper.unread ||
    Boolean(activeStory);

  return (
    <header
      className={`relative shrink-0 bg-[#071624]/95 border-b border-[#1b3a54] z-30 safe-pt safe-px ${
        isLandscapeCompact || isPortrait ? 'px-2 py-1' : 'px-2.5 py-1.5'
      }`}
    >
      <div className="flex items-center justify-between gap-1.5 flex-nowrap">
        {/* Constant Core: ONLY Vida (HP) + Estamina (ST) compact so nothing ever collides */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 flex-1 overflow-hidden">
          <div className="flex items-center gap-1 min-w-0" title="Vida (HP)">
            <Heart className={`w-3.5 h-3.5 shrink-0 ${hpPct <= 30 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`} />
            <div className="w-11 xs:w-16 sm:w-22 h-2 bg-[#030d16] rounded-full overflow-hidden border border-[#1a344b] shrink-0">
              <div
                className={`h-full transition-[width] duration-150 ${
                  hpPct <= 30 ? 'bg-rose-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${hpPct}%` }}
              />
            </div>
            <span className="font-mono-num text-[10px] sm:text-[11px] font-extrabold text-slate-100 whitespace-nowrap">
              {Math.ceil(state.hp)}/{state.maxHp}
            </span>
          </div>

          <div className="flex items-center gap-1 min-w-0" title="Estamina (ST)">
            <Zap className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <div className="w-9 xs:w-14 sm:w-18 h-2 bg-[#030d16] rounded-full overflow-hidden border border-[#1a344b] shrink-0">
              <div
                className="h-full bg-sky-400 transition-[width] duration-100"
                style={{ width: `${stPct}%` }}
              />
            </div>
            <span className="font-mono-num text-[10px] sm:text-[11px] font-extrabold text-sky-200 whitespace-nowrap">
              {Math.floor(state.st)}
            </span>
          </div>

          {sitState !== 'normal' && (
            <span
              className={`hidden sm:inline-flex px-1.5 py-0.5 rounded-md border text-[10px] font-extrabold whitespace-nowrap items-center gap-0.5 animate-pulse ${sitMeta.bgClass} ${sitMeta.borderClass} ${sitMeta.textClass}`}
              title={`${sitMeta.label}: ${sitMeta.description}`}
            >
              <span>{sitMeta.icon}</span>
              <span>{sitMeta.shortLabel}</span>
            </span>
          )}

          {war.active && (
            <span className="hidden xs:inline-flex px-1.5 py-0.5 rounded bg-rose-500/20 border border-rose-400/50 text-[10px] font-bold text-rose-200 items-center gap-0.5 whitespace-nowrap">
              <Swords className="w-3 h-3" />
              <span>{war.remaining}/{war.total}</span>
            </span>
          )}
        </div>

        {/* Single Unified Collapsible Dropdown + Pause (never overflows narrow phones) */}
        <div className="flex items-center gap-1 shrink-0">
          {uiPaused && (
            <span className="hidden md:inline px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-400/40 text-[10px] font-bold text-amber-300">
              Pausa
            </span>
          )}
          {gamepadConnected && (
            <span
              className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/45 text-[9px] font-bold text-emerald-200"
              title="Control Bluetooth / USB conectado"
            >
              <Gamepad2 className="w-3 h-3" />
            </span>
          )}

          <button
            type="button"
            onClick={() => setPanelOpen((p) => !p)}
            className={`min-h-[32px] inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] sm:text-[11px] font-bold transition-colors whitespace-nowrap cursor-pointer ${
              panelOpen
                ? 'bg-amber-400/20 border-amber-400/65 text-amber-200'
                : 'bg-[#10283d] hover:bg-[#173652] border-[#264d70] text-slate-100'
            }`}
            title="Desplegar ventanas, menú lateral, pantalla completa e información de vitales/recursos"
          >
            <Package className={`w-3.5 h-3.5 shrink-0 ${isResourceEventPulse ? 'resource-event-pulse text-amber-300' : 'text-sky-300'}`} />
            <span>Panel</span>
            {hasAnyDot && (
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  hasUrgentAlert ? 'bg-rose-500 animate-ping' : 'bg-amber-400'
                }`}
              />
            )}
            {panelOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {(mode === 'PLAYING' || mode === 'PAUSED') && (
            <button
              type="button"
              onClick={onTogglePause}
              className="min-h-[32px] min-w-[32px] inline-flex items-center justify-center p-1.5 rounded-lg bg-[#10283d] hover:bg-[#173652] border border-[#264d70] text-slate-100 cursor-pointer shrink-0"
              aria-label={mode === 'PAUSED' ? 'Reanudar' : 'Pausa / Menú Ultratumba'}
              title="Pausa / Menú Ultratumba"
            >
              {mode === 'PAUSED' ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Compact Floating Dropdown Menu (zero layout push, clean access to every window & info) */}
      {panelOpen && (
        <div className="absolute right-2 left-2 sm:left-auto sm:w-[460px] top-full mt-1 rounded-xl bg-[#071929]/98 border border-[#28567d] shadow-2xl p-2.5 space-y-2.5 z-50 backdrop-blur-md max-h-[78dvh] overflow-y-auto deck-scroll">
          {/* Mode Tabs inside Panel */}
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#183852]">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPanelTab('ventanas')}
                className={`min-h-[32px] px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer border ${
                  panelTab === 'ventanas'
                    ? 'bg-amber-400/20 border-amber-400/60 text-amber-200'
                    : 'bg-[#0b2034] border-[#1f4466] text-slate-300'
                }`}
              >
                Ventanas y Controles
              </button>
              <button
                type="button"
                onClick={() => setPanelTab('info')}
                className={`min-h-[32px] px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer border inline-flex items-center gap-1 ${
                  panelTab === 'info'
                    ? 'bg-sky-500/20 border-sky-400/60 text-sky-100'
                    : 'bg-[#0b2034] border-[#1f4466] text-slate-300'
                }`}
              >
                <span>Info y Vitales</span>
                {(hasUrgentAlert || hasAnyCriticalVital) && (
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setPanelOpen(false);
                onToggleDrawer();
              }}
              className="min-h-[32px] inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600/25 hover:bg-emerald-600/40 border border-emerald-400/50 text-[11px] font-bold text-emerald-200 cursor-pointer shrink-0"
            >
              {drawerOpen ? <PanelRightClose className="w-3.5 h-3.5" /> : <PanelRightOpen className="w-3.5 h-3.5" />}
              <span>{drawerOpen ? 'Recoger Panel' : 'Menú Lateral'}</span>
            </button>
          </div>

          {panelTab === 'ventanas' && (
            <div className="grid grid-cols-2 xs:grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setPanelOpen(false);
                  onOpenStory();
                }}
                className="min-h-[38px] inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0d2438] hover:bg-[#153654] border border-cyan-500/45 text-[11px] font-semibold text-cyan-200 cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
                <span>Misiones</span>
                {activeStory && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setPanelOpen(false);
                  onOpenNewspaper();
                }}
                className="min-h-[38px] inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0d2438] hover:bg-[#153654] border border-[#2b587f] text-[11px] font-semibold text-amber-200 cursor-pointer"
              >
                <Newspaper className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span>Periódico</span>
                {state.newspaper.unread && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setPanelOpen(false);
                  onOpenProfile();
                }}
                className="min-h-[38px] inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0d2438] hover:bg-[#153654] border border-[#2b587f] text-[11px] font-semibold text-sky-200 cursor-pointer"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                <span className="truncate">
                  {myRank ? `#${myRank} ${seaRank.shortLabel}` : seaRank.shortLabel}
                  {activePlayersCount > 0 ? ` (${activePlayersCount})` : ''}
                </span>
              </button>

              {onOpenMap && (
                <button
                  type="button"
                  onClick={() => {
                    setPanelOpen(false);
                    onOpenMap();
                  }}
                  className="min-h-[38px] inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-fuchsia-500/15 hover:bg-fuchsia-500/25 border border-fuchsia-400/55 text-[11px] font-semibold text-fuchsia-200 cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5 text-fuchsia-300 shrink-0" />
                  <span>Mapa / Ruta</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setPanelOpen(false);
                  onOpenDestiny();
                }}
                className="min-h-[38px] inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/50 text-[11px] font-semibold text-amber-300 cursor-pointer"
              >
                <GitBranch className="w-3.5 h-3.5 shrink-0" />
                <span>Destino</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPanelOpen(false);
                  onOpenDonations();
                }}
                className="min-h-[38px] inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/45 text-[11px] font-semibold text-rose-200 cursor-pointer"
              >
                <Heart className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>Donar / Vida</span>
              </button>

              {onOpenSettings && (
                <button
                  type="button"
                  onClick={() => {
                    setPanelOpen(false);
                    onOpenSettings();
                  }}
                  className="min-h-[38px] inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0d2438] hover:bg-[#153654] border border-[#264d70] text-[11px] font-semibold text-slate-100 cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5 text-sky-300 shrink-0" />
                  <span>Config</span>
                </button>
              )}

              <button
                type="button"
                onClick={onToggleSound}
                className="min-h-[38px] inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0d2438] hover:bg-[#153654] border border-[#264d70] text-[11px] font-semibold text-slate-100 cursor-pointer"
              >
                {state.sound ? <Volume2 className="w-3.5 h-3.5 text-amber-300 shrink-0" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                <span>{state.sound ? 'Audio ON' : 'Mute'}</span>
              </button>

              {fullscreenSupported && onToggleFullscreen && (
                <button
                  type="button"
                  onClick={() => {
                    setPanelOpen(false);
                    onToggleFullscreen();
                  }}
                  className={`min-h-[38px] inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold cursor-pointer ${
                    isFullscreen
                      ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200'
                      : 'bg-[#0d2438] hover:bg-[#153654] border-[#264d70] text-slate-100'
                  }`}
                >
                  {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 shrink-0" /> : <Maximize2 className="w-3.5 h-3.5 shrink-0" />}
                  <span>{isFullscreen ? 'Salir Full' : 'Pantalla Full'}</span>
                </button>
              )}

              {!isInstalled && onOpenInstall && (
                <button
                  type="button"
                  onClick={() => {
                    setPanelOpen(false);
                    if (isInstallable) {
                      void install();
                    } else {
                      onOpenInstall();
                    }
                  }}
                  className="min-h-[38px] inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/45 text-[11px] font-semibold text-sky-200 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 shrink-0" />
                  <span>{isInstallable ? 'Instalar' : 'APK'}</span>
                </button>
              )}
            </div>
          )}

          {panelTab === 'info' && (
            <div className="space-y-2 text-[10px]">
              <div className="flex flex-wrap items-center gap-1.5">
                {state.clan.founded && (
                  <span className="font-mono-num font-extrabold text-amber-300 bg-amber-400/15 border border-amber-400/40 px-1 py-0.5 rounded">
                    [{state.clan.tag}]
                  </span>
                )}
                <span className="font-mono-num text-amber-300 font-bold">Nv.{state.level}</span>
                <span className="font-mono-num px-1 py-0.5 rounded bg-amber-400/15 border border-amber-400/40 text-amber-200 font-bold">
                  Edad {AGE_ROMAN[state.ageTier || 1]}
                </span>
                <span className="text-amber-200">{titleName}</span>
                <span className="font-mono-num text-sky-300">Día {state.dayCount}</span>
                <span
                  className="px-1.5 py-0.5 rounded border font-bold"
                  style={{
                    borderColor: `${diffDef.badgeColor}66`,
                    color: diffDef.badgeColor,
                    backgroundColor: `${diffDef.badgeColor}18`,
                  }}
                >
                  {diffDef.label}
                </span>
                <span
                  className={`font-mono-num px-1 py-0.5 rounded border font-bold ${
                    livesLeft <= 1
                      ? 'bg-rose-500/20 border-rose-400/60 text-rose-300'
                      : 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300'
                  }`}
                >
                  ♥{livesLeft}/{totalLives} vidas
                </span>
                {distanceTier && (
                  <span
                    className="px-1.5 py-0.5 rounded border font-bold inline-flex items-center gap-0.5"
                    style={{
                      borderColor: `${distanceTier.color}66`,
                      color: distanceTier.color,
                      backgroundColor: `${distanceTier.color}18`,
                    }}
                  >
                    {distanceTier.emoji} {distanceTier.label}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] bg-[#091c2e] rounded-lg px-2 py-1.5 border border-[#193a57]">
                <span className="text-cyan-200">
                  {WEATHER_LABELS[weather]} · <b className="text-emerald-300">{shipClass}</b> · <b className="text-slate-100">{locationLabel}</b>
                </span>
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-amber-400">Casco</span>
                  <div className="w-12 h-1.5 bg-[#030d16] rounded-full overflow-hidden border border-[#1a344b]">
                    <div
                      className={`h-full ${state.raft.damagedMode || hullPct <= 25 ? 'bg-rose-500' : 'bg-amber-400'}`}
                      style={{ width: `${hullPct}%` }}
                    />
                  </div>
                  <span className="font-mono-num font-bold text-amber-200">{Math.ceil(state.raft.hp)}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-[10px] bg-[#081929] rounded-lg px-2 py-1.5 border border-sky-500/35">
                <span className="inline-flex items-center gap-1 font-bold text-sky-300">
                  <Shield className="w-3 h-3" /> Marina: {'★'.repeat(marineWanted.stars)} ({marineWanted.label})
                </span>
                {state.worldGovDecree && (
                  <span className="text-amber-200 truncate">
                    🏛️ {state.worldGovDecree}
                  </span>
                )}
              </div>

              {/* Alerts */}
              <div className="flex flex-wrap items-center gap-2 text-[10px]">
                {state.radiationExposure > 15 && (
                  <span className="inline-flex items-center gap-1 text-lime-300 font-bold">
                    <Radiation className="w-3 h-3" /> ☢️ Radiación {Math.round(state.radiationExposure)}%
                  </span>
                )}
                {state.jammedTimer > 0 && (
                  <span className="inline-flex items-center gap-1 text-cyan-300 font-bold">
                    <WifiOff className="w-3 h-3" /> ⚡ Hackeada ({Math.ceil(state.jammedTimer)}s)
                  </span>
                )}
                {state.hangoverTimer > 0 && (
                  <span className="text-amber-300 font-bold">🍺 Resaca ({Math.ceil(state.hangoverTimer)}s)</span>
                )}
                {state.raft.damagedMode && (
                  <span className="inline-flex items-center gap-1 text-rose-400 font-bold">
                    <ShieldAlert className="w-3 h-3" /> Casco averiado
                  </span>
                )}
                {dangerousWater && (
                  <span className="inline-flex items-center gap-1 text-lime-300 font-bold">
                    <Radiation className="w-3 h-3" /> ☣️ Aguas Peligrosas
                  </span>
                )}
                {isCalmEarly && !dangerousWater && (
                  <span className="text-sky-300 font-semibold">Tregua inicial (Día {state.dayCount}/2)</span>
                )}
                {randomEvent.active && (
                  <span className="inline-flex items-center gap-1 text-amber-300 font-bold">
                    <Sparkles className="w-3 h-3" /> {randomEvent.title} ({Math.ceil(randomEvent.timer)}s)
                  </span>
                )}
                {inShelter && <span className="text-emerald-300 font-semibold">En Refugio Seguro</span>}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`px-2 py-1 rounded border font-bold inline-flex items-center gap-1 ${seaRank.bgClass} ${seaRank.borderClass} ${seaRank.textClass}`}
                  title="Puesto del Mar según tu posición en el Ranking (independiente de tu Título)"
                >
                  <span>{seaRank.icon}</span>
                  <span>{seaRank.label}{myRank ? ` (#${myRank})` : ''}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setVitalsPopupOpen((p) => !p)}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded border font-bold cursor-pointer ${moodMeta.bgClass} ${moodMeta.borderClass} ${moodMeta.textClass}`}
                >
                  <Brain className="w-3 h-3" />
                  <span>{moodMeta.shortLabel} {Math.round(vitals.mentalHealth)}%</span>
                </button>
                <button
                  type="button"
                  onClick={() => setResourcesPopupOpen((p) => !p)}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded border font-mono-num cursor-pointer ${
                    isResourceEventPulse
                      ? 'bg-amber-500/20 border-amber-400/65 text-amber-100'
                      : 'bg-[#0c2135] hover:bg-[#13324f] border-[#244a6d] text-slate-200'
                  }`}
                >
                  <Package
                    className={`w-3 h-3 text-amber-300 ${isResourceEventPulse ? 'resource-event-pulse' : ''}`}
                  />
                  <span>Mochila</span>
                  {isResourceEventPulse && (
                    <span className="text-[9px] font-sans font-bold text-amber-300">
                      {war.active ? '· Guerra' : '· Pesca'}
                    </span>
                  )}
                  {resourcesPopupOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>

              {vitalsPopupOpen && (
                <div className="pt-1.5 border-t border-[#183852] space-y-1">
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
                    {sitState !== 'normal' && (
                      <span className={`inline-flex items-center gap-1 font-bold ${sitMeta.textClass}`}>
                        {sitMeta.icon} {sitMeta.shortLabel} ({Math.round(vitals.combatIntensity || 0)}%)
                      </span>
                    )}
                  </div>
                  <div className="text-slate-300 font-sans">
                    Vel {Math.round(perf.speedMult * 100)}% · CaC {Math.round(perf.meleeMult * 100)}% · Dist {Math.round(perf.rangedMult * 100)}% · Def {Math.round((2 - perf.defenseMult) * 100)}%
                  </div>
                  {perf.activeStatuses.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {perf.activeStatuses.map((st) => (
                        <span
                          key={st.id}
                          className="px-1.5 py-0.5 rounded bg-[#0c2235] border border-[#244c6e]"
                          style={{ color: st.color }}
                        >
                          <b>{st.label}:</b> {st.effectText}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {resourcesPopupOpen && (
                <div className="pt-1.5 border-t border-[#183852] flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono-num text-slate-200">
                  <span className="inline-flex items-center gap-1"><b className={`text-amber-400 font-sans ${isResourceEventPulse ? 'resource-event-pulse' : ''}`}>🪵 Mad</b> {r.mad}</span>
                  <span className="inline-flex items-center gap-1"><b className={`text-sky-300 font-sans ${isResourceEventPulse ? 'resource-event-pulse' : ''}`}>⚙️ Cht</b> {r.cht}</span>
                  <span className="inline-flex items-center gap-1"><b className={`text-cyan-300 font-sans ${isResourceEventPulse ? 'resource-event-pulse' : ''}`}>💧 Agu</b> {r.agu}</span>
                  <span className="inline-flex items-center gap-1"><b className={`text-yellow-300 font-sans ${isResourceEventPulse ? 'resource-event-pulse' : ''}`}>🐟 Pez</b> {r.pez}</span>
                  <span className="inline-flex items-center gap-1"><b className={`text-lime-400 font-sans ${isResourceEventPulse ? 'resource-event-pulse' : ''}`}>🥬 Veg</b> {r.veg}</span>
                  <span className="inline-flex items-center gap-1"><b className={`text-emerald-300 font-sans ${isResourceEventPulse ? 'resource-event-pulse' : ''}`}>🍲 Gui</b> {r.gui}</span>
                  <span className="inline-flex items-center gap-1"><b className={`text-amber-300 font-sans ${isResourceEventPulse ? 'resource-event-pulse' : ''}`}>🪙 Oro</b> {r.oro}</span>
                  <span className="inline-flex items-center gap-1"><b className={`text-slate-300 font-sans ${isResourceEventPulse ? 'resource-event-pulse' : ''}`}>🪨 Car</b> {r.car}</span>
                  <span className="inline-flex items-center gap-1"><b className={`text-slate-200 font-sans ${isResourceEventPulse ? 'resource-event-pulse' : ''}`}>⛓️ Hie</b> {r.hie}</span>
                  <span className="inline-flex items-center gap-1"><b className={`text-blue-300 font-sans ${isResourceEventPulse ? 'resource-event-pulse' : ''}`}>🔷 Tit</b> {r.tit}</span>
                  <span className="inline-flex items-center gap-1"><b className={`text-purple-300 font-sans ${isResourceEventPulse ? 'resource-event-pulse' : ''}`}>💎 Cri</b> {r.cri}</span>
                  <span className="inline-flex items-center gap-1"><b className={`text-cyan-400 font-sans ${isResourceEventPulse ? 'resource-event-pulse' : ''}`}>🔌 Tec</b> {r.tec}</span>
                  <span className="inline-flex items-center gap-1"><b className={`text-purple-400 font-sans ${isResourceEventPulse ? 'resource-event-pulse' : ''}`}>🟣 F.Ép</b> {r.frag_epico}</span>
                  <span className="inline-flex items-center gap-1"><b className={`text-amber-300 font-sans ${isResourceEventPulse ? 'resource-event-pulse' : ''}`}>🟡 F.Leg</b> {r.frag_legendario}</span>
                  <span className="inline-flex items-center gap-1"><b className={`text-cyan-300 font-sans ${isResourceEventPulse ? 'resource-event-pulse' : ''}`}>💠 F.Div</b> {r.frag_divino}</span>
                  <span className="inline-flex items-center gap-1"><b className={`text-lime-300 font-sans ${isResourceEventPulse ? 'resource-event-pulse' : ''}`}>☢️ F.Nuc</b> {r.nuc_frag}</span>
                  <span className="inline-flex items-center gap-1"><b className={`text-amber-200 font-sans ${isResourceEventPulse ? 'resource-event-pulse' : ''}`}>🍺 Alc</b> {r.alc}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
}

