import {
  Award,
  BookmarkCheck,
  Flame,
  Globe,
  Heart,
  Maximize2,
  Minimize2,
  Play,
  RotateCcw,
  ShieldAlert,
  Skull,
  Sliders,
  UserCheck,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  DIFFICULTY_CATALOG,
  MAX_FREE_DEATHS,
  getDifficultyModifiers,
  getRemainingLives,
} from '../game/constants';
import { t } from '../game/i18n';
import type { DifficultyLevel, GameMode, PersistentState } from '../game/types';
import { InstallAppButton } from './InstallAppModal';

interface GameOverlayProps {
  mode: GameMode;
  state: PersistentState;
  hasSave: boolean;
  onStartNew: () => void;
  onContinue: () => void;
  onResume: () => void;
  onRestart: () => void;
  onSaveGame?: () => void;
  onOpenSettings?: () => void;
  onOpenAccount?: () => void;
  onChangeDifficulty?: (diff: DifficultyLevel) => void;
  onToggleSound?: () => void;
  onChangeLanguage?: (lang: 'es' | 'en') => void;
  onRespawnCheckpoint: () => void;
  onBuyExtraLifeBreB: () => void;
  onOpenDonations?: () => void;
  onOpenCredits?: () => void;
  onOpenInstall?: () => void;
  isFullscreen?: boolean;
  fullscreenSupported?: boolean;
  onToggleFullscreen?: () => void;
}

export function GameOverlay({
  mode,
  state,
  hasSave,
  onStartNew,
  onContinue,
  onResume,
  onRestart,
  onSaveGame,
  onOpenSettings,
  onOpenAccount,
  onChangeDifficulty,
  onToggleSound,
  onChangeLanguage,
  onRespawnCheckpoint,
  onBuyExtraLifeBreB,
  onOpenDonations,
  onOpenCredits,
  onOpenInstall,
  isFullscreen = false,
  fullscreenSupported = false,
  onToggleFullscreen,
}: GameOverlayProps) {
  if (mode === 'PLAYING') return null;

  const lang = state.language || 'es';
  const hasWarehouse = state.islandStructures.some((s) => s.kind === 'warehouse');
  const livesLeft = getRemainingLives(state);
  const totalLives = MAX_FREE_DEATHS + (state.extraLivesPurchased || 0);
  const currentDiff = getDifficultyModifiers(state.difficulty);

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      className="fixed inset-0 z-40 flex items-center justify-center bg-[#030b14]/88 backdrop-blur-sm p-3 sm:p-5 safe-p-all overflow-y-auto"
    >
      {mode === 'TITLE_MENU' && (
        <div className="w-full max-w-2xl rounded-2xl bg-[#081726] border border-[#264d72] p-4 sm:p-6 shadow-2xl space-y-3.5 my-auto">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-300 mb-0.5">
                <Skull className="w-3.5 h-3.5" />
                <span>Lobby · {t(lang, 'underworldMenu')}</span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-50">
                {t(lang, 'gameTitle')}
              </h2>
              <p className="text-xs sm:text-sm text-sky-200/90 mt-0.5">
                {t(lang, 'subtitle')}
              </p>
            </div>
            <div className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-400/40 text-xs font-mono-num font-bold text-emerald-300 shrink-0">
              ♥ {livesLeft}/{totalLives}
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Despierta nadando en el mar sin balsa, rescata tu destino junto a la Vice-Capitana Vega,
            enfrenta 11 Semi-Bosses y Bosses Abismales, forja armas Épicas/Legendarias/Divinas con
            Armeros y Forjadores, y levanta imperios amurallados estilo AoE.
          </p>

          {/* Lobby Difficulty Selector (up to Infernal) */}
          <div className="rounded-xl p-3 bg-[#06121f] border border-[#1a3a57] space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-amber-300">
                <Flame className="w-3.5 h-3.5 text-rose-400" />
                Dificultad de Expedición
              </span>
              <span
                className="text-[11px] font-extrabold px-2 py-0.5 rounded border"
                style={{
                  color: currentDiff.badgeColor,
                  borderColor: `${currentDiff.badgeColor}66`,
                  backgroundColor: `${currentDiff.badgeColor}18`,
                }}
              >
                {currentDiff.label} · {currentDiff.graceDays}d Tregua
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              {DIFFICULTY_CATALOG.map((d) => {
                const active = (state.difficulty || 'superviviente') === d.id;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => onChangeDifficulty?.(d.id)}
                    className={`min-h-[40px] px-2 py-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                      active
                        ? 'bg-[#122e47] shadow-md scale-[1.01]'
                        : 'bg-[#091a2a] hover:bg-[#0e263d] opacity-80 hover:opacity-100'
                    }`}
                    style={{
                      borderColor: active ? d.badgeColor : '#1d3e5e',
                    }}
                  >
                    <div
                      className="text-[11px] font-extrabold leading-tight"
                      style={{ color: d.badgeColor }}
                    >
                      {d.label}
                    </div>
                    <div className="text-[9px] font-mono-num text-slate-300 mt-0.5">
                      x{d.enemyHpMult.toFixed(1)} HP · x{d.xpFameMult.toFixed(1)} XP
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="text-[11px] text-slate-300 flex flex-wrap items-center justify-between gap-2 pt-0.5">
              <span>{currentDiff.description}</span>
              <span className="font-mono-num text-[10px] text-cyan-300">
                Daño x{currentDiff.enemyDmgMult} · Recursos x{currentDiff.resourceMult} · Botín +{Math.round(currentDiff.fragLuckBonus * 100)}%
              </span>
            </div>
          </div>

          {/* Quick Lobby Game Settings Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl px-3 py-2 bg-[#071522] border border-[#183750]">
            <span className="text-[11px] font-bold text-slate-300">Ajustes de Lobby:</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {onToggleSound && (
                <button
                  type="button"
                  onClick={onToggleSound}
                  className="min-h-[36px] inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0d2338] hover:bg-[#143452] border border-[#244c70] text-[11px] font-bold text-slate-100 cursor-pointer"
                >
                  {state.sound ? <Volume2 className="w-3.5 h-3.5 text-amber-300" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
                  <span>{state.sound ? 'Audio ON' : 'Mute'}</span>
                </button>
              )}
              {onChangeLanguage && (
                <button
                  type="button"
                  onClick={() => onChangeLanguage(lang === 'es' ? 'en' : 'es')}
                  className="min-h-[36px] inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0d2338] hover:bg-[#143452] border border-[#244c70] text-[11px] font-bold text-cyan-200 cursor-pointer"
                >
                  <Globe className="w-3.5 h-3.5 text-cyan-300" />
                  <span>{lang === 'es' ? 'Español' : 'English'}</span>
                </button>
              )}
              {onOpenSettings && (
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="min-h-[36px] inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0d2338] hover:bg-[#143452] border border-[#244c70] text-[11px] font-bold text-amber-200 cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5 text-amber-300" />
                  <span>{t(lang, 'settings')}</span>
                </button>
              )}
              {onOpenAccount && (
                <button
                  type="button"
                  onClick={onOpenAccount}
                  className="min-h-[36px] inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0d2338] hover:bg-[#143452] border border-[#244c70] text-[11px] font-bold text-sky-200 cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5 text-sky-300" />
                  <span>{t(lang, 'account')}</span>
                </button>
              )}
              {fullscreenSupported && onToggleFullscreen && (
                <button
                  type="button"
                  onClick={onToggleFullscreen}
                  className={`min-h-[36px] inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-bold cursor-pointer ${
                    isFullscreen
                      ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200'
                      : 'bg-[#0d2338] hover:bg-[#143452] border-[#244c70] text-slate-100'
                  }`}
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-3.5 h-3.5 text-emerald-300" />
                  ) : (
                    <Maximize2 className="w-3.5 h-3.5 text-cyan-300" />
                  )}
                  <span>{isFullscreen ? t(lang, 'exitFullscreen') : t(lang, 'fullscreen')}</span>
                </button>
              )}
            </div>
          </div>

          {/* Main Underworld Menu Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {hasSave && (
              <button
                type="button"
                onClick={onContinue}
                className="min-h-[48px] px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-sm inline-flex items-center justify-center gap-2 cursor-pointer shadow-lg"
              >
                <Play className="w-4 h-4" />
                <span>
                  {t(lang, 'continueGame')} (Día {state.dayCount} · Nv.{state.level})
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={onStartNew}
              className={`min-h-[48px] px-4 py-2.5 rounded-xl font-extrabold text-sm inline-flex items-center justify-center gap-2 cursor-pointer ${
                hasSave
                  ? 'bg-[#122e47] hover:bg-[#194061] border border-[#2d5e88] text-slate-100'
                  : 'sm:col-span-2 bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-lg'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              <span>{t(lang, 'newGame')} ({currentDiff.label})</span>
            </button>
          </div>

          <div className="pt-2.5 border-t border-[#183750] grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-300">
            <div><b className="text-amber-300">Mover:</b> WASD / Joystick / Mando</div>
            <div><b className="text-amber-300">Atacar:</b> Clic / Espacio / Auto-Mira</div>
            <div><b className="text-amber-300">Timón / NPC:</b> F / G</div>
            <div><b className="text-amber-300">Puertas:</b> Entra por el lado Sur</div>
          </div>

          <div className="pt-2.5 border-t border-[#183750] flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="text-slate-300">
              <span className="text-slate-400">Autor:</span>{' '}
              <b className="text-amber-300">Rubén Darío Correa Cuellar</b>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <InstallAppButton onOpenGuide={onOpenInstall} />
              {onOpenCredits && (
                <button
                  type="button"
                  onClick={onOpenCredits}
                  className="min-h-[40px] inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/45 text-amber-200 font-semibold text-xs cursor-pointer"
                >
                  <Award className="w-3.5 h-3.5 text-amber-300" />
                  <span>{t(lang, 'credits')}</span>
                </button>
              )}
              {onOpenDonations && (
                <button
                  type="button"
                  onClick={onOpenDonations}
                  className="min-h-[40px] inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/40 text-rose-200 font-semibold text-xs cursor-pointer"
                >
                  <Heart className="w-3.5 h-3.5 text-rose-400" />
                  <span>Donar (@3155552964)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {mode === 'PAUSED' && (
        <div className="w-full max-w-md rounded-2xl bg-[#081726] border border-[#264d72] p-5 sm:p-6 shadow-2xl text-center space-y-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-300 mb-1">
              {t(lang, 'underworldMenu')} · Pausa
            </div>
            <h2 className="font-display text-2xl font-bold text-slate-50">Juego en Pausa</h2>
            <p className="text-xs text-slate-300 mt-1">
              Nivel {state.level} · Día {state.dayCount} · Islas: {state.stats.islandsVisited}
            </p>
          </div>

          <div className="space-y-2.5">
            <button
              type="button"
              onClick={onResume}
              className="w-full min-h-[48px] px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-sm inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4" />
              <span>{t(lang, 'resumeGame')}</span>
            </button>

            {onSaveGame && (
              <button
                type="button"
                onClick={onSaveGame}
                className="w-full min-h-[44px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <BookmarkCheck className="w-4 h-4" />
                <span>{t(lang, 'saveGame')}</span>
              </button>
            )}

            <div className="grid grid-cols-2 gap-2">
              {onOpenSettings && (
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="min-h-[44px] px-3 py-2 rounded-xl bg-[#102940] hover:bg-[#173b5c] border border-[#244c70] text-slate-100 font-bold text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sliders className="w-4 h-4 text-amber-300" />
                  <span>{t(lang, 'settings')}</span>
                </button>
              )}
              {onOpenAccount && (
                <button
                  type="button"
                  onClick={onOpenAccount}
                  className="min-h-[44px] px-3 py-2 rounded-xl bg-[#102940] hover:bg-[#173b5c] border border-[#244c70] text-sky-200 font-bold text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <UserCheck className="w-4 h-4 text-sky-300" />
                  <span>{t(lang, 'account')}</span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={onRestart}
              className="w-full min-h-[44px] px-4 py-2 rounded-xl bg-[#133047] hover:bg-[#1a405e] border border-[#2c5a80] text-slate-200 font-semibold text-xs cursor-pointer"
            >
              {t(lang, 'newGame')}
            </button>
          </div>

          <div className="pt-3 border-t border-[#183750] flex flex-wrap items-center justify-center gap-2 text-xs text-slate-300">
            <InstallAppButton onOpenGuide={onOpenInstall} />
            {onOpenCredits && (
              <button
                type="button"
                onClick={onOpenCredits}
                className="min-h-[38px] inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-400/15 border border-amber-400/45 text-amber-200 font-semibold cursor-pointer"
              >
                <Award className="w-3.5 h-3.5 text-amber-300" />
                <span>Créditos</span>
              </button>
            )}
            {onOpenDonations && (
              <button
                type="button"
                onClick={onOpenDonations}
                className="min-h-[38px] inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/15 border border-rose-400/40 text-rose-200 font-semibold cursor-pointer"
              >
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                <span>Donar Bre-B</span>
              </button>
            )}
          </div>
        </div>
      )}

      {mode === 'GAME_OVER' && (
        <div className="w-full max-w-md rounded-2xl bg-[#0a1d2e] border border-rose-500/50 p-5 sm:p-6 shadow-2xl text-center my-auto">
          <div className="text-xs font-semibold text-rose-400 mb-1">
            Has caído · Muertes: {state.deathsUsed}/{totalLives}
          </div>
          <h2 className="font-display text-2xl font-bold text-slate-50">
            {livesLeft > 0 ? 'Rescate en Punto de Control' : 'Límite de 5 Vidas Alcanzado'}
          </h2>

          {state.lastDeathCause && (
            <div className="mt-3 rounded-xl bg-rose-950/35 border border-rose-500/45 p-3 text-left space-y-2 max-h-56 overflow-y-auto deck-scroll">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-extrabold text-rose-300">
                  {state.lastDeathCause.headline}
                </div>
                {state.lastDeathCause.aiLoading && !state.lastDeathCause.aiRoast && (
                  <span className="text-[10px] font-bold text-amber-300 animate-pulse shrink-0">
                    Analizando manquedad...
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-200 leading-snug">
                {state.lastDeathCause.causeDetail}
              </p>
              <div className="pt-1.5 border-t border-rose-500/25 text-[11px] italic text-amber-200 leading-snug">
                💬 {state.lastDeathCause.sarcasm}
              </div>
              {state.lastDeathCause.facts && state.lastDeathCause.facts.length > 0 && (
                <div className="pt-1.5 border-t border-rose-500/25 space-y-0.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-rose-300">
                    Factos de tu caída:
                  </div>
                  {state.lastDeathCause.facts.map((fact, idx) => (
                    <div key={idx} className="text-[10.5px] text-slate-200 leading-snug">
                      • {fact}
                    </div>
                  ))}
                </div>
              )}
              {state.lastDeathCause.retryTaunt && (
                <div className="text-[10.5px] font-bold text-emerald-300 pt-1">
                  👉 {state.lastDeathCause.retryTaunt}
                </div>
              )}
            </div>
          )}

          <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#071522] border border-[#1d3e5c] text-xs font-bold">
            <Heart className={`w-3.5 h-3.5 ${livesLeft > 0 ? 'text-emerald-400' : 'text-rose-500'}`} />
            <span className={livesLeft > 0 ? 'text-emerald-300' : 'text-rose-300'}>
              {livesLeft > 0
                ? `Vidas restantes: ${livesLeft} de ${totalLives}`
                : '0 vidas restantes — Requiere pago verificado de Vida Extra'}
            </span>
          </div>

          {livesLeft > 0 ? (
            <div className="mt-3 rounded-lg bg-[#071522] border border-[#1d3e5c] p-3 text-left text-xs space-y-1">
              <div className="text-emerald-300 font-bold">
                Destino: {state.checkpoint?.label || 'Fondeadero Inicial'} (Día {state.checkpoint?.savedDay || 1})
              </div>
              <div className="text-rose-300">
                Penalización al reaparecer: <b>-1 Nivel</b> (mín. 1), <b>XP → 0</b> y{' '}
                <b>-{hasWarehouse ? '20%' : '35%'} recursos</b>.
              </div>
            </div>
          ) : (
            <div className="mt-3 rounded-lg bg-rose-950/45 border border-rose-500/45 p-3 text-left text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-rose-300 font-bold">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Ya consumiste tus {totalLives} vidas en esta partida</span>
              </div>
              <p className="text-slate-200 leading-relaxed">
                Para revivir con tu barco, imperios y armas actuales, adquiere una{' '}
                <b className="text-amber-300">Vida Extra vía Nequi / Bre-B (@3155552964)</b> (se
                desbloquea tras verificar el pago) o inicia una nueva partida.
              </p>
            </div>
          )}

          <div className="mt-4 py-3 border-y border-[#183750] grid grid-cols-3 gap-2 text-xs">
            <div>
              <div className="text-slate-400">Nivel</div>
              <div className="font-mono-num font-bold text-slate-100 mt-0.5">{state.level}</div>
            </div>
            <div>
              <div className="text-slate-400">Enemigos</div>
              <div className="font-mono-num font-bold text-amber-300 mt-0.5">{state.stats.kills}</div>
            </div>
            <div>
              <div className="text-slate-400">Islas</div>
              <div className="font-mono-num font-bold text-sky-300 mt-0.5">{state.stats.islandsVisited}</div>
            </div>
          </div>

          <div className="mt-5 flex flex-col sm:flex-row gap-2.5">
            {livesLeft > 0 ? (
              <button
                type="button"
                onClick={onRespawnCheckpoint}
                className="flex-1 min-h-[48px] px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm cursor-pointer"
              >
                Reaparecer en Punto de Control
              </button>
            ) : (
              <button
                type="button"
                onClick={onBuyExtraLifeBreB}
                className="flex-1 min-h-[48px] px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm cursor-pointer inline-flex items-center justify-center gap-1.5"
              >
                <Heart className="w-4 h-4" />
                <span>Pagar Vida Extra (Nequi / Bre-B)</span>
              </button>
            )}
            <button
              type="button"
              onClick={onRestart}
              className="min-h-[48px] px-4 py-2.5 rounded-xl bg-[#133047] hover:bg-[#1a405e] border border-[#2c5a80] text-slate-100 font-semibold text-sm cursor-pointer"
            >
              Nueva partida
            </button>
          </div>
          <div className="mt-4 pt-2.5 border-t border-[#183750] text-[11px] text-slate-400">
            Créditos: <span className="text-amber-300 font-semibold">Rubén Darío Correa Cuellar</span>
          </div>
        </div>
      )}
    </div>
  );
}
