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
  Moon,
  Newspaper,
  Package,
  PanelRightClose,
  PanelRightOpen,
  Pause,
  Play,
  Radiation,
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
import { useState } from 'react';
import { MAX_FREE_DEATHS, getRemainingLives } from '../game/constants';
import {
  MOOD_META,
  computeVitalPerformanceModifiers,
  createInitialVitals,
} from '../game/needsAndPsychology';
import { getShipClassName, TITLE_MAP } from '../game/socialAndKingdoms';
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
  onOpenSettings?: () => void;
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
  onOpenSettings,
  onOpenInstall,
  onToggleSound,
  onTogglePause,
  isOnline = true,
  myRank = null,
  activePlayersCount = 0,
}: HudBarProps) {
  const [resourcesPopupOpen, setResourcesPopupOpen] = useState(false);
  const [vitalsPopupOpen, setVitalsPopupOpen] = useState(false);
  const [infoExpanded, setInfoExpanded] = useState(false);
  const [actionsExpanded, setActionsExpanded] = useState(false);
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
  const shipClass = getShipClassName(state.raft.level, state.warshipNuclearShield);
  const titleName = TITLE_MAP[state.activeTitleId]?.name || 'Náufrago';
  const isCalmEarly = state.dayCount <= 2;
  const livesLeft = getRemainingLives(state);
  const totalLives = MAX_FREE_DEATHS + (state.extraLivesPurchased || 0);

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

  return (
    <header
      className={`relative shrink-0 bg-[#071624]/95 border-b border-[#1b3a54] z-30 safe-pt safe-px ${
        isLandscapeCompact || isPortrait ? 'px-2 py-1' : 'px-2.5 py-1.5'
      }`}
    >
      <div className="flex items-center justify-between gap-1.5 flex-nowrap">
        {/* Constant Core: ONLY Vida (HP) and Estamina (ST) + ultra-compact Info toggle */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5" title="Vida (HP)">
            <Heart className={`w-3.5 h-3.5 shrink-0 ${hpPct <= 30 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`} />
            <div className="w-16 sm:w-24 h-2 bg-[#030d16] rounded-full overflow-hidden border border-[#1a344b]">
              <div
                className={`h-full transition-[width] duration-150 ${
                  hpPct <= 30 ? 'bg-rose-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${hpPct}%` }}
              />
            </div>
            <span className="font-mono-num text-[11px] font-extrabold text-slate-100 whitespace-nowrap">
              {Math.ceil(state.hp)}/{state.maxHp}
            </span>
          </div>

          <div className="flex items-center gap-1.5" title="Estamina (ST)">
            <Zap className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <div className="w-12 sm:w-18 h-2 bg-[#030d16] rounded-full overflow-hidden border border-[#1a344b]">
              <div
                className="h-full bg-sky-400 transition-[width] duration-100"
                style={{ width: `${stPct}%` }}
              />
            </div>
            <span className="font-mono-num text-[11px] font-extrabold text-sky-200 whitespace-nowrap">
              {Math.floor(state.st)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              setInfoExpanded((p) => !p);
              if (infoExpanded) {
                setResourcesPopupOpen(false);
                setVitalsPopupOpen(false);
              }
            }}
            className={`min-h-[30px] inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-bold cursor-pointer whitespace-nowrap transition-colors ${
              infoExpanded
                ? 'bg-sky-500/20 border-sky-400/60 text-sky-100'
                : 'bg-[#0c2135] hover:bg-[#13324f] border-[#244a6d] text-slate-200'
            }`}
            title="Desplegar información de navío, recursos, vitales y alertas"
          >
            <span>Info</span>
            {hasUrgentAlert && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />}
            {!hasUrgentAlert && hasAnyCriticalVital && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            )}
            {infoExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Compact Right Controls: Collapsible Ventanas + Drawer + Pausa */}
        <div className="flex items-center gap-1 shrink-0">
          {uiPaused && (
            <span className="hidden sm:inline px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-400/40 text-[10px] font-bold text-amber-300">
              Pausa
            </span>
          )}
          {war.active && (
            <span className="px-1.5 py-0.5 rounded bg-rose-500/20 border border-rose-400/50 text-[10px] font-bold text-rose-200 inline-flex items-center gap-1">
              <Swords className="w-3 h-3" />
              <span>{war.remaining}/{war.total}</span>
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
            onClick={() => setActionsExpanded((p) => !p)}
            className={`min-h-[32px] inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] sm:text-[11px] font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              actionsExpanded
                ? 'bg-amber-400/20 border-amber-400/60 text-amber-200'
                : 'bg-[#10283d] hover:bg-[#173652] border-[#264d70] text-slate-100'
            }`}
            title="Desplegar ventanas: Misiones, Periódico, Ranking, Destino, Donar y Ajustes"
          >
            <span>Ventanas</span>
            {(state.newspaper.unread || Boolean(activeStory)) && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
            )}
            {actionsExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          <button
            type="button"
            onClick={onToggleDrawer}
            className="min-h-[32px] inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#10283d] hover:bg-[#173652] border border-[#264d70] text-[10px] sm:text-[11px] font-semibold text-slate-100 transition-colors whitespace-nowrap cursor-pointer"
            title="Abrir / recoger panel lateral"
          >
            {drawerOpen ? <PanelRightClose className="w-3.5 h-3.5" /> : <PanelRightOpen className="w-3.5 h-3.5" />}
            <span className="hidden xs:inline">{drawerOpen ? 'Recoger' : 'Menú'}</span>
          </button>

          {(mode === 'PLAYING' || mode === 'PAUSED') && (
            <button
              type="button"
              onClick={onTogglePause}
              className="min-h-[32px] min-w-[32px] inline-flex items-center justify-center p-1.5 rounded-lg bg-[#10283d] hover:bg-[#173652] border border-[#264d70] text-slate-100 cursor-pointer"
              aria-label={mode === 'PAUSED' ? 'Reanudar' : 'Pausa / Menú Ultratumba'}
              title="Pausa / Menú Ultratumba"
            >
              {mode === 'PAUSED' ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Expandable Secondary Action Bar (only shown when user opens Ventanas) */}
      {actionsExpanded && (
        <div className="mt-1.5 pt-1.5 border-t border-[#183852] flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => {
              setActionsExpanded(false);
              onOpenStory();
            }}
            className="relative min-h-[36px] inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#10283d] hover:bg-[#173652] border border-cyan-500/45 text-[11px] font-semibold text-cyan-200 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-300" />
            <span>Misiones</span>
            {activeStory && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />}
          </button>

          <button
            type="button"
            onClick={() => {
              setActionsExpanded(false);
              onOpenNewspaper();
            }}
            className="relative min-h-[36px] inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#10283d] hover:bg-[#173652] border border-[#2b587f] text-[11px] font-semibold text-amber-200 cursor-pointer"
          >
            <Newspaper className="w-3.5 h-3.5 text-amber-300" />
            <span>Periódico</span>
            {state.newspaper.unread && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
          </button>

          <button
            type="button"
            onClick={() => {
              setActionsExpanded(false);
              onOpenProfile();
            }}
            className="min-h-[36px] inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#10283d] hover:bg-[#173652] border border-[#2b587f] text-[11px] font-semibold text-sky-200 cursor-pointer"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-300" />
            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-rose-400'}`} />
            <span>Ranking{myRank ? ` #${myRank}` : ''}{activePlayersCount > 0 ? ` (${activePlayersCount})` : ''}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActionsExpanded(false);
              onOpenDestiny();
            }}
            className="min-h-[36px] inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/50 text-[11px] font-semibold text-amber-300 cursor-pointer"
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>Destino</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActionsExpanded(false);
              onOpenDonations();
            }}
            className="min-h-[36px] inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/45 text-[11px] font-semibold text-rose-200 cursor-pointer"
          >
            <Heart className="w-3.5 h-3.5 text-rose-400" />
            <span>Donar / Vida</span>
          </button>

          {!isInstalled && onOpenInstall && (
            <button
              type="button"
              onClick={() => {
                setActionsExpanded(false);
                if (isInstallable) {
                  void install();
                } else {
                  onOpenInstall();
                }
              }}
              className="min-h-[36px] inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/45 text-[11px] font-semibold text-sky-200 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isInstallable ? 'Instalar' : 'APK'}</span>
            </button>
          )}

          {onOpenSettings && (
            <button
              type="button"
              onClick={() => {
                setActionsExpanded(false);
                onOpenSettings();
              }}
              className="min-h-[36px] inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#10283d] hover:bg-[#173652] border border-[#264d70] text-[11px] font-semibold text-slate-100 cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-sky-300" />
              <span>Config</span>
            </button>
          )}

          <button
            type="button"
            onClick={onToggleSound}
            className="min-h-[36px] inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#10283d] hover:bg-[#173652] border border-[#264d70] text-[11px] font-semibold text-slate-100 cursor-pointer"
          >
            {state.sound ? <Volume2 className="w-3.5 h-3.5 text-amber-300" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
            <span>{state.sound ? 'Audio ON' : 'Mute'}</span>
          </button>
        </div>
      )}

      {/* Expandable Ship, Location, Vitals & Resources Drawer (hidden by default) */}
      {infoExpanded && (
        <div className="mt-1.5 pt-1.5 border-t border-[#183852] space-y-1.5 text-[10px]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-display font-bold text-slate-100">Marea Mutante</span>
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
              <span className="text-cyan-200">· {WEATHER_LABELS[weather]}</span>
              <span className="text-emerald-300">· {shipClass}</span>
              <span className="text-slate-200">· {locationLabel}</span>
            </div>

            <div className="flex items-center gap-1.5">
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

              <button
                type="button"
                onClick={() => setVitalsPopupOpen((p) => !p)}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border font-bold cursor-pointer ${moodMeta.bgClass} ${moodMeta.borderClass} ${moodMeta.textClass}`}
              >
                <Brain className="w-3 h-3" />
                <span>{moodMeta.shortLabel} {Math.round(vitals.mentalHealth)}%</span>
              </button>

              <button
                type="button"
                onClick={() => setResourcesPopupOpen((p) => !p)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#0c2135] hover:bg-[#13324f] border border-[#244a6d] font-mono-num text-slate-200 cursor-pointer"
              >
                <Package className="w-3 h-3 text-amber-300" />
                <span>Recursos</span>
                {resourcesPopupOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {/* Alerts / Active Status Row inside Info */}
          <div className="flex flex-wrap items-center gap-2 text-[10px]">
            {state.radiationExposure > 15 && (
              <span className="inline-flex items-center gap-1 text-lime-300 font-bold">
                <Radiation className="w-3 h-3" /> ☢️ Radiación {Math.round(state.radiationExposure)}%
              </span>
            )}
            {state.jammedTimer > 0 && (
              <span className="inline-flex items-center gap-1 text-cyan-300 font-bold">
                <WifiOff className="w-3 h-3" /> ⚡ Señal Hackeada ({Math.ceil(state.jammedTimer)}s)
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
              <span className="text-sky-300 font-semibold">
                Tregua inicial (Día {state.dayCount}/2)
              </span>
            )}
            {randomEvent.active && (
              <span className="inline-flex items-center gap-1 text-amber-300 font-bold">
                <Sparkles className="w-3 h-3" /> {randomEvent.title} ({Math.ceil(randomEvent.timer)}s)
              </span>
            )}
            {activeStory && (
              <button
                type="button"
                onClick={onOpenStory}
                className="inline-flex items-center gap-1 text-cyan-300 hover:text-cyan-200 font-bold cursor-pointer"
              >
                <BookOpen className="w-3 h-3" />
                <span>Misión ({activeStory.progress}/{activeStory.target})</span>
              </button>
            )}
            {state.stealthTimer > 0 && (
              <span className="font-mono-num text-purple-300 font-semibold">
                Sigilo {Math.ceil(state.stealthTimer)}s
              </span>
            )}
            {inShelter && <span className="text-emerald-300 font-semibold">En Refugio Seguro</span>}
          </div>

          {vitalsPopupOpen && (
            <div className="pt-1 border-t border-[#183852] space-y-1">
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
                <span className="text-slate-300 ml-auto font-sans">
                  Vel {Math.round(perf.speedMult * 100)}% · CaC {Math.round(perf.meleeMult * 100)}% · Dist {Math.round(perf.rangedMult * 100)}%
                </span>
              </div>
              {perf.activeStatuses.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
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
            <div className="pt-1 border-t border-[#183852] flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono-num text-slate-200">
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
              <span><b className="text-purple-400 font-sans">F.Ép</b> {r.frag_epico}</span>
              <span><b className="text-amber-300 font-sans">F.Leg</b> {r.frag_legendario}</span>
              <span><b className="text-cyan-300 font-sans">F.Div</b> {r.frag_divino}</span>
              <span><b className="text-lime-300 font-sans">F.Nuc</b> {r.nuc_frag}</span>
              <span><b className="text-amber-200 font-sans">Alc</b> {r.alc}</span>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

