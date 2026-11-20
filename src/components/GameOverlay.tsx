import { Award, Heart, ShieldAlert } from 'lucide-react';
import { MAX_FREE_DEATHS, getRemainingLives } from '../game/constants';
import type { GameMode, PersistentState } from '../game/types';
import { InstallAppButton } from './InstallAppModal';

interface GameOverlayProps {
  mode: GameMode;
  state: PersistentState;
  hasSave: boolean;
  onStartNew: () => void;
  onContinue: () => void;
  onResume: () => void;
  onRestart: () => void;
  onRespawnCheckpoint: () => void;
  onBuyExtraLifeBreB: () => void;
  onOpenDonations?: () => void;
  onOpenCredits?: () => void;
  onOpenInstall?: () => void;
}

export function GameOverlay({
  mode,
  state,
  hasSave,
  onStartNew,
  onContinue,
  onResume,
  onRestart,
  onRespawnCheckpoint,
  onBuyExtraLifeBreB,
  onOpenDonations,
  onOpenCredits,
  onOpenInstall,
}: GameOverlayProps) {
  if (mode === 'PLAYING') return null;

  const hasWarehouse = state.islandStructures.some((s) => s.kind === 'warehouse');
  const livesLeft = getRemainingLives(state);
  const totalLives = MAX_FREE_DEATHS + (state.extraLivesPurchased || 0);

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#030d17]/75 backdrop-blur-xs p-4">
      {mode === 'TITLE_MENU' && (
        <div className="w-full max-w-lg rounded-xl bg-[#0a1d2e] border border-[#254a6b] p-6 shadow-2xl">
          <div className="text-xs font-semibold text-sky-300 mb-1">
            El Océano de las Cenizas Saladas · Historia desde el Segundo 0
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-50">
            Marea Mutante
          </h2>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            Inicia con la historia y la Misión 1 guiada, desafía Cuarteles Piratas (Rango F a SSS),
            construye pueblos e imperios en islas y sobrevive con tus 5 vidas.
          </p>

          <div className="mt-4 pt-3 border-t border-[#183750] grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-slate-300">
            <div><b className="text-amber-300">Mover / Navegar:</b> WASD / Joystick</div>
            <div><b className="text-amber-300">Atacar / Minar:</b> Clic / Espacio</div>
            <div><b className="text-amber-300">Tomar Timón:</b> F / Botón Timón</div>
            <div><b className="text-amber-300">Armas 1-5:</b> Teclas 1-5</div>
            <div><b className="text-amber-300">Esquivar:</b> Shift</div>
            <div><b className="text-amber-300">Menú (Pausa auto):</b> Tab</div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            {hasSave ? (
              <>
                <button
                  type="button"
                  onClick={onContinue}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm cursor-pointer whitespace-nowrap"
                >
                  Continuar aventura
                </button>
                <button
                  type="button"
                  onClick={onStartNew}
                  className="px-4 py-2.5 rounded-lg bg-[#133047] hover:bg-[#1a405e] border border-[#2c5a80] text-slate-100 font-semibold text-sm cursor-pointer whitespace-nowrap"
                >
                  Nueva partida
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onStartNew}
                className="w-full px-4 py-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm cursor-pointer whitespace-nowrap"
              >
                Zarpar a la aventura
              </button>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-[#183750] flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="text-slate-300">
              <span className="text-slate-400">Autor:</span>{' '}
              <b className="text-amber-300">Rubén Darío Correa Cuellar</b>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <InstallAppButton onOpenGuide={onOpenInstall} />
              {onOpenCredits && (
                <button
                  type="button"
                  onClick={onOpenCredits}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/45 text-amber-200 font-semibold text-[11px] cursor-pointer"
                >
                  <Award className="w-3.5 h-3.5 text-amber-300" />
                  <span>Créditos</span>
                </button>
              )}
              {onOpenDonations && (
                <button
                  type="button"
                  onClick={onOpenDonations}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/40 text-rose-200 font-semibold text-[11px] cursor-pointer"
                >
                  <Heart className="w-3.5 h-3.5 text-rose-400" />
                  <span>Donar Bre-B (@3155552964)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {mode === 'PAUSED' && (
        <div className="w-full max-w-sm rounded-xl bg-[#0a1d2e] border border-[#254a6b] p-6 shadow-2xl text-center">
          <h2 className="font-display text-2xl font-bold text-slate-50">Juego en pausa</h2>
          <p className="text-xs text-slate-300 mt-1.5">
            Nivel {state.level} · Islas descubiertas: {state.stats.islandsVisited}
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={onResume}
              className="px-5 py-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm cursor-pointer"
            >
              Reanudar
            </button>
            <button
              type="button"
              onClick={onRestart}
              className="px-4 py-2.5 rounded-lg bg-[#133047] hover:bg-[#1a405e] border border-[#2c5a80] text-slate-100 font-semibold text-sm cursor-pointer"
            >
              Reiniciar
            </button>
          </div>
          <div className="mt-4 pt-3 border-t border-[#183750] flex flex-col items-center gap-2 text-[11px] text-slate-300">
            <div>
              Autor del Juego: <b className="text-amber-300">Rubén Darío Correa Cuellar</b>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <InstallAppButton onOpenGuide={onOpenInstall} />
              {onOpenCredits && (
                <button
                  type="button"
                  onClick={onOpenCredits}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/45 text-amber-200 font-semibold cursor-pointer"
                >
                  <Award className="w-3.5 h-3.5 text-amber-300" />
                  <span>Créditos</span>
                </button>
              )}
              {onOpenDonations && (
                <button
                  type="button"
                  onClick={onOpenDonations}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/40 text-rose-200 font-semibold cursor-pointer"
                >
                  <Heart className="w-3.5 h-3.5 text-rose-400" />
                  <span>Apoyar vía Bre-B Colombia</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {mode === 'GAME_OVER' && (
        <div className="w-full max-w-md rounded-xl bg-[#0a1d2e] border border-rose-500/50 p-6 shadow-2xl text-center">
          <div className="text-xs font-semibold text-rose-400 mb-1">
            Has caído en combate · Muertes: {state.deathsUsed}/{totalLives}
          </div>
          <h2 className="font-display text-2xl font-bold text-slate-50">
            {livesLeft > 0 ? 'Rescate en Punto de Control' : 'Límite de 5 Muertes Alcanzado'}
          </h2>

          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#071522] border border-[#1d3e5c] text-xs font-bold">
            <Heart className={`w-3.5 h-3.5 ${livesLeft > 0 ? 'text-emerald-400' : 'text-rose-500'}`} />
            <span className={livesLeft > 0 ? 'text-emerald-300' : 'text-rose-300'}>
              {livesLeft > 0
                ? `Vidas restantes: ${livesLeft} de ${totalLives}`
                : '0 vidas restantes — Requiere pago de Vida Extra'}
            </span>
          </div>

          {livesLeft > 0 ? (
            <div className="mt-3 rounded-lg bg-[#071522] border border-[#1d3e5c] p-3 text-left text-xs space-y-1">
              <div className="text-emerald-300 font-bold">
                Destino: {state.checkpoint?.label || 'Fondeadero Inicial'} (Día {state.checkpoint?.savedDay || 1})
              </div>
              <div className="text-rose-300">
                Penalización al reaparecer: <b>-1 Nivel</b> (mín. 1), <b>XP → 0</b> y{' '}
                <b>-{hasWarehouse ? '20%' : '35%'} recursos</b>
                {hasWarehouse ? ' (Almacén protege parte del botín)' : ''}.
              </div>
            </div>
          ) : (
            <div className="mt-3 rounded-lg bg-rose-950/45 border border-rose-500/45 p-3 text-left text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-rose-300 font-bold">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Ya moriste {state.deathsUsed} veces en esta partida</span>
              </div>
              <p className="text-slate-200 leading-relaxed">
                Solo puedes morir 5 veces gratis por partida. Para seguir con tu barco, imperios y
                progreso actual, adquiere una <b className="text-amber-300">Vida Extra vía Bre-B (@3155552964)</b>{' '}
                o comienza una nueva partida desde cero.
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
                className="flex-1 px-4 py-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm cursor-pointer"
              >
                Reaparecer en Punto de Control
              </button>
            ) : (
              <button
                type="button"
                onClick={onBuyExtraLifeBreB}
                className="flex-1 px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm cursor-pointer inline-flex items-center justify-center gap-1.5"
              >
                <Heart className="w-4 h-4" />
                <span>Pagar Vida Extra (Bre-B)</span>
              </button>
            )}
            <button
              type="button"
              onClick={onRestart}
              className="px-4 py-2.5 rounded-lg bg-[#133047] hover:bg-[#1a405e] border border-[#2c5a80] text-slate-100 font-semibold text-sm cursor-pointer"
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

