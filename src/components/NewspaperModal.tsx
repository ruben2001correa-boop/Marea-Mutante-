import { AlertCircle, Bot, Crosshair, Newspaper, RefreshCw, Skull, Sparkles, Trophy, X } from 'lucide-react';
import { getShipClassName, TITLE_MAP } from '../game/socialAndKingdoms';
import type { PersistentState } from '../game/types';

interface NewspaperModalProps {
  open: boolean;
  state: PersistentState;
  aiLoading?: boolean;
  aiError?: string | null;
  onGenerateAiEdition?: () => void;
  onClose: () => void;
  onHuntBounty: (bountyId: string) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  PORTADA: 'text-amber-300 border-amber-400/50 bg-amber-400/15',
  PELIGRO: 'text-rose-300 border-rose-500/60 bg-rose-500/15',
  CRÓNICA: 'text-fuchsia-300 border-fuchsia-400/50 bg-fuchsia-500/15',
  GUERRA: 'text-orange-300 border-orange-400/55 bg-orange-500/15',
  RECOMPENSA: 'text-rose-300 border-rose-400/50 bg-rose-400/10',
  MUNDO: 'text-sky-300 border-sky-400/50 bg-sky-400/10',
  CLIMA: 'text-cyan-300 border-cyan-400/50 bg-cyan-400/10',
  ECONOMÍA: 'text-emerald-300 border-emerald-400/50 bg-emerald-400/10',
};

export function NewspaperModal({
  open,
  state,
  aiLoading = false,
  aiError = null,
  onGenerateAiEdition,
  onClose,
  onHuntBounty,
}: NewspaperModalProps) {
  if (!open) return null;

  const titleName = TITLE_MAP[state.activeTitleId]?.name || 'Náufrago';
  const shipClass = getShipClassName(state.raft.level, state.warshipNuclearShield);
  const claimedCount = state.pirateBounties.filter((b) => b.claimed).length;

  return (
    <div className="fixed inset-0 z-50 bg-[#030b14]/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="w-full max-w-5xl max-h-[92vh] rounded-xl bg-[#071625] border border-[#2b5276] shadow-2xl flex flex-col overflow-hidden">
        {/* Masthead */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-[#0b1f33] border-b border-[#204464]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-amber-400/15 border border-amber-400/50 flex items-center justify-center shrink-0">
              <Newspaper className="w-5 h-5 text-amber-300" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-lg sm:text-xl font-extrabold text-amber-200 tracking-wide truncate">
                EL CORREO DEL HORIZONTE
              </h2>
              <p className="text-[11px] text-slate-300 font-mono-num truncate">
                Edición #{state.newspaper.edition} · Día {state.dayCount} · Última Hora Marítima
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onGenerateAiEdition && (
              <button
                type="button"
                disabled={aiLoading}
                onClick={onGenerateAiEdition}
                className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/25 hover:bg-emerald-600/40 disabled:opacity-50 border border-emerald-400/55 text-emerald-200 text-xs font-bold cursor-pointer"
                title="Redactar crónica en vivo con Inteligencia Artificial según tu partida"
              >
                {aiLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Bot className="w-3.5 h-3.5" />
                )}
                <span>{aiLoading ? 'Redactando IA...' : 'Edición Especial IA'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-[#112c44] hover:bg-[#1a4163] text-slate-200 cursor-pointer shrink-0"
              aria-label="Cerrar periódico"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* AI Error Banner if upstream failed */}
        {aiError && (
          <div className="px-4 py-2 bg-rose-950/75 border-b border-rose-500/45 flex items-center justify-between gap-2 text-[11px] text-rose-100">
            <div className="flex items-center gap-2 min-w-0">
              <AlertCircle className="w-3.5 h-3.5 text-rose-300 shrink-0" />
              <span className="truncate">
                Redacción IA no disponible ({aiError}) — mostrando edición local con eventos del mundo.
              </span>
            </div>
            {onGenerateAiEdition && (
              <button
                type="button"
                disabled={aiLoading}
                onClick={onGenerateAiEdition}
                className="px-2 py-0.5 rounded bg-rose-600/35 hover:bg-rose-600/55 border border-rose-400/50 text-[10px] font-bold text-rose-100 shrink-0 cursor-pointer"
              >
                Reintentar IA
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto deck-scroll p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left: World News & Player Wanted Poster */}
          <div className="lg:col-span-7 space-y-3">
            {/* Player's Own Wanted Poster */}
            <div className="rounded-xl bg-[#f3e5c8] text-slate-900 border-2 border-[#a67c46] p-3.5 shadow-lg">
              <div className="flex items-center justify-between border-b-2 border-[#8c6230] pb-1.5">
                <span className="font-display font-black tracking-[0.2em] text-sm sm:text-base text-[#5c3610]">
                  DEAD OR ALIVE · SE BUSCA
                </span>
                <span className="font-mono-num text-[11px] font-bold text-[#6e461b]">
                  ID {state.playerProfile.id}
                </span>
              </div>
              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-display text-lg font-extrabold text-[#2b1704]">
                    {state.clan.founded ? `[${state.clan.tag}] ` : ''}
                    {state.playerProfile.name}
                  </div>
                  <div className="text-xs font-semibold text-[#5c3a14]">
                    {titleName} · {shipClass} (Nv.{state.raft.level})
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-[#6e461b]">
                    Recompensa Oficial
                  </div>
                  <div className="font-mono-num text-xl font-black text-[#8f2d14]">
                    {state.bounty.toLocaleString()} B
                  </div>
                </div>
              </div>
            </div>

            {state.newspaper.aiSummary && (
              <div className="rounded-lg bg-emerald-950/35 border border-emerald-400/40 px-3 py-2 text-xs text-emerald-200 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-emerald-300">Editorial del Día: </span>
                  <span>{state.newspaper.aiSummary}</span>
                </div>
              </div>
            )}

            {/* Daily Gazette Articles */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-amber-300">
                <span>Crónicas del Mundo · Día {state.dayCount}</span>
                <span className="font-mono-num text-[10px] text-slate-400">
                  {state.newspaper.articles.length} noticias activas
                </span>
              </div>
              {state.newspaper.articles.length === 0 ? (
                <article className="rounded-lg bg-[#0b1f31] border border-[#1d3f5e] p-3 space-y-1.5">
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded border text-amber-300 border-amber-400/50 bg-amber-400/15">
                    PORTADA
                  </span>
                  <h3 className="text-sm font-bold text-slate-100 leading-snug">
                    Edición en preparación desde el Cuartel de Noticias
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {(state.recentEventsLog || []).length > 0
                      ? `Último hecho confirmado: ${state.recentEventsLog![0].text}. Pulsa "Edición Especial IA" para actualizar el boletín completo.`
                      : 'Las gaviotas corresponsales recorren las islas de La Marina, los bastiones piratas y las zonas seguras.'}
                  </p>
                </article>
              ) : (
                state.newspaper.articles.map((art) => (
                  <article
                    key={art.id}
                    className="rounded-lg bg-[#0b1f31] border border-[#1d3f5e] p-3 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${
                            CATEGORY_COLORS[art.category] || 'text-slate-200 border-slate-500'
                          }`}
                        >
                          {art.category}
                        </span>
                        {art.viaAi && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/40 text-emerald-300">
                            IA EN VIVO
                          </span>
                        )}
                      </div>
                      <span className="font-mono-num text-[10px] text-slate-400">
                        Día {art.day}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-100 leading-snug">
                      {art.headline}
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">{art.body}</p>
                  </article>
                ))
              )}
            </div>
          </div>

          {/* Right: Pirate Head Bounties */}
          <div className="lg:col-span-5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-300">
                <Skull className="w-4 h-4" />
                <span>Recompensas por Piratas</span>
              </div>
              <span className="font-mono-num text-[11px] text-slate-300">
                Capturados: {claimedCount}/{state.pirateBounties.length}
              </span>
            </div>

            <div className="space-y-2">
              {state.pirateBounties.map((b) => (
                <div
                  key={b.id}
                  className={`rounded-lg p-3 border ${
                    b.claimed
                      ? 'bg-[#081722] border-emerald-500/40 opacity-75'
                      : b.active
                        ? 'bg-[#1a1f33] border-amber-400'
                        : 'bg-[#0b1f31] border-[#214566]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-extrabold text-amber-200 truncate">
                        {b.name}
                      </div>
                      <div className="text-[11px] text-rose-300 font-semibold">
                        {b.epithet} · Peligro {'★'.repeat(Math.min(6, b.dangerLevel))}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono-num text-xs font-extrabold text-amber-300">
                        {b.bountyValue.toLocaleString()} B
                      </div>
                      <div className="font-mono-num text-[10px] text-emerald-300">
                        +{b.rewardOro} Oro · +{b.rewardFame} Fama
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-300 mt-1.5 leading-snug">
                    {b.description}
                  </p>

                  <div className="mt-2.5 flex items-center justify-between gap-2">
                    {b.claimed ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300">
                        <Trophy className="w-3.5 h-3.5" />
                        <span>Cabeza Cobrada</span>
                      </span>
                    ) : b.active ? (
                      <span className="text-[11px] font-bold text-amber-300">
                        ¡Objetivo marcado en el minimapa!
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">
                        Se busca vivo o hundido
                      </span>
                    )}

                    {!b.claimed && (
                      <button
                        type="button"
                        onClick={() => onHuntBounty(b.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold cursor-pointer shrink-0"
                      >
                        <Crosshair className="w-3 h-3" />
                        <span>{b.active ? 'Ir / Reubicar' : 'Rastrear y Cazar'}</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
