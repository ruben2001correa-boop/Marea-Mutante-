import {
  AlertCircle,
  ArrowRight,
  Bot,
  ChevronDown,
  ChevronUp,
  History,
  MessageCircle,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { MOOD_META, computeVitalPerformanceModifiers } from '../game/needsAndPsychology';
import { getNpcMoodState, type NpcConversationSession } from '../game/npcConversations';
import type { PersistentState } from '../game/types';

interface NpcChatModalProps {
  session: NpcConversationSession | null;
  state: PersistentState;
  onSelectChoice: (choiceIndex: number) => void;
  onSendFreeMessage: (text: string) => void;
  onToggleAiMode: () => void;
  onNextStep: (keepTalking?: boolean) => void;
  onClose: () => void;
}

const TONE_BADGE: Record<string, string> = {
  empatica: 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200',
  pragmatica: 'bg-sky-500/20 border-sky-400/50 text-sky-200',
  humor: 'bg-amber-500/20 border-amber-400/50 text-amber-200',
  soberbia: 'bg-orange-500/20 border-orange-400/55 text-orange-200',
};

export function NpcChatModal({
  session,
  state,
  onSelectChoice,
  onSendFreeMessage,
  onToggleAiMode,
  onNextStep,
  onClose,
}: NpcChatModalProps) {
  const [customInput, setCustomInput] = useState('');
  const [showPastHistory, setShowPastHistory] = useState(false);

  if (!session) return null;

  const npcMood = getNpcMoodState(state, session.npcId);
  const npcMeta = MOOD_META[npcMood.mood] || MOOD_META.equilibrio;
  const playerMoodKey = state.vitals.mentalHealth <= 28 ? 'lokito' : state.vitals.mood;
  const playerMeta = MOOD_META[playerMoodKey] || MOOD_META.equilibrio;
  const perf = computeVitalPerformanceModifiers(state);
  const pastHistory = state.npcChatHistory?.[session.npcId] || [];

  const handleSubmitCustom = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = customInput.trim();
    if (!trimmed || session.aiLoading) return;
    setCustomInput('');
    onSendFreeMessage(trimmed);
  };

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 safe-p-all"
    >
      <div className="w-full max-w-2xl max-h-[92dvh] flex flex-col rounded-2xl bg-[#071828] border border-cyan-400/50 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 bg-[#0a2136] border-b border-[#1b4160] flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-9 h-9 rounded-full border-2 border-slate-950 flex items-center justify-center shrink-0 shadow"
              style={{ backgroundColor: session.npcColor }}
            >
              <MessageCircle className="w-4 h-4 text-slate-950" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-display text-sm sm:text-base font-bold text-slate-50 truncate">
                  {session.npcName}
                </h2>
                <span
                  className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${npcMeta.bgClass} ${npcMeta.borderClass} ${npcMeta.textClass}`}
                >
                  Actitud: {npcMeta.shortLabel}
                </span>
                <span className="font-mono-num text-[10px] text-amber-300 font-bold">
                  Afinidad {npcMood.affinity >= 0 ? `+${npcMood.affinity}` : npcMood.affinity}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 truncate">
                {session.npcRole} · {npcMood.reason}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onToggleAiMode}
              title="Activar o desactivar generación de diálogos vivos por Inteligencia Artificial"
              className={`min-h-[38px] inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-bold cursor-pointer ${
                session.aiMode
                  ? 'bg-emerald-500/20 border-emerald-400/55 text-emerald-200'
                  : 'bg-[#0e2a42] border-[#255075] text-slate-300'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>{session.aiMode ? 'IA Viva ON' : 'Modo Local'}</span>
            </button>

            <span className="px-2 py-1 rounded bg-cyan-500/20 border border-cyan-400/50 text-cyan-200 text-[10px] font-mono-num font-bold">
              Ocasión {session.turn}
              {!session.milestoneClaimed && '/3'}
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar conversación"
              className="min-w-[44px] min-h-[44px] rounded-xl bg-[#11314d] hover:bg-[#19466d] text-slate-200 flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Player Psychological Strip + Past History Toggle */}
        <div className="px-4 py-1.5 bg-[#061421] border-b border-[#16344f] flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Tu mente:</span>
            <span
              className={`font-mono-num font-bold ${
                state.vitals.mentalHealth <= 28
                  ? 'text-fuchsia-300 animate-pulse'
                  : state.vitals.mentalHealth >= 70
                    ? 'text-emerald-300'
                    : 'text-amber-300'
              }`}
            >
              {Math.round(state.vitals.mentalHealth)}%
            </span>
            <span
              className={`px-1.5 py-0.5 rounded border text-[10px] font-bold ${playerMeta.bgClass} ${playerMeta.borderClass} ${playerMeta.textClass}`}
            >
              {playerMeta.label}
            </span>
            <span className="hidden sm:inline text-[10px] text-slate-400 font-mono-num">
              Vel {Math.round(perf.speedMult * 100)}% · CaC {Math.round(perf.meleeMult * 100)}%
            </span>
          </div>

          {pastHistory.length > 0 && (
            <button
              type="button"
              onClick={() => setShowPastHistory((v) => !v)}
              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#0c2235] hover:bg-[#13314d] border border-[#23486b] text-[10px] font-bold text-amber-200 cursor-pointer"
            >
              <History className="w-3 h-3 text-amber-300" />
              <span>Historial ({pastHistory.length})</span>
              {showPastHistory ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
        </div>

        {/* AI Error Banner if upstream returned an error */}
        {session.aiError && (
          <div className="px-4 py-1.5 bg-amber-950/70 border-b border-amber-500/40 flex items-center gap-2 text-[11px] text-amber-200">
            <AlertCircle className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span className="truncate">
              IA en pausa ({session.aiError}) — puedes seguir con las respuestas del repertorio narrativo.
            </span>
          </div>
        )}

        {/* Collapsible Prior Conversations History */}
        {showPastHistory && pastHistory.length > 0 && (
          <div className="max-h-40 overflow-y-auto deck-scroll px-4 py-2.5 bg-[#040e18] border-b border-[#193b59] space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
              Historial de Conversaciones Previas con {session.npcName}
            </div>
            {pastHistory.slice(-24).map((h, i) => (
              <div
                key={`${h.ts}_${i}`}
                className="text-[11px] text-slate-300 border-l-2 border-[#234d73] pl-2 py-0.5"
              >
                <span className="font-bold text-sky-300">{h.name}: </span>
                <span>{h.text}</span>
              </div>
            ))}
          </div>
        )}

        {/* Active Conversation Transcript */}
        <div className="flex-1 overflow-y-auto deck-scroll p-4 space-y-2.5 bg-[#05121e]">
          {session.transcript.map((entry, idx) => {
            if (entry.speaker === 'sistema') {
              return (
                <div
                  key={idx}
                  className="rounded-xl bg-amber-400/15 border border-amber-400/50 px-3 py-2 text-xs text-amber-200 font-semibold flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>{entry.text}</span>
                </div>
              );
            }
            const isPlayer = entry.speaker === 'player';
            return (
              <div
                key={idx}
                className={`flex flex-col ${isPlayer ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[90%] rounded-xl px-3 py-2 border text-xs sm:text-sm leading-relaxed ${
                    isPlayer
                      ? 'bg-sky-900/55 border-sky-400/45 text-sky-50'
                      : 'bg-[#0b2338] border-[#214b6e] text-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span
                      className="text-[10px] font-bold"
                      style={{ color: isPlayer ? '#7dd3fc' : session.npcColor }}
                    >
                      {entry.name}
                    </span>
                    {entry.moodBadge && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-black/30 text-slate-300">
                        {entry.moodBadge}
                      </span>
                    )}
                    {entry.viaAi && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                        IA
                      </span>
                    )}
                  </div>
                  <p>{entry.text}</p>
                </div>
              </div>
            );
          })}

          {session.aiLoading && (
            <div className="flex items-start">
              <div className="rounded-xl px-3 py-2 border border-cyan-500/40 bg-[#0a2034] text-xs text-cyan-200 animate-pulse flex items-center gap-2">
                <Bot className="w-3.5 h-3.5" />
                <span>{session.npcName} está pensando su respuesta...</span>
              </div>
            </div>
          )}
        </div>

        {/* Interactive Footer */}
        <div className="p-3.5 bg-[#091d30] border-t border-[#1c4261]">
          {session.stage === 'choosing' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-amber-300">
                  Elige una respuesta o escribe libremente (Ocasión {session.turn}):
                </span>
              </div>

              <div className="space-y-1.5 max-h-[185px] overflow-y-auto deck-scroll pr-0.5">
                {session.choices.map((c, idx) => (
                  <button
                    key={c.id}
                    type="button"
                    disabled={session.aiLoading}
                    onClick={() => onSelectChoice(idx)}
                    className="w-full min-h-[44px] text-left rounded-xl px-3 py-2 bg-[#0d273f] hover:bg-[#143a5c] disabled:opacity-50 border border-[#245278] hover:border-amber-400/65 transition-all cursor-pointer flex items-start gap-2"
                  >
                    <span
                      className={`px-1.5 py-0.5 rounded border text-[9px] font-bold shrink-0 mt-0.5 ${
                        TONE_BADGE[c.toneKind] || TONE_BADGE.pragmatica
                      }`}
                    >
                      {c.toneLabel}
                    </span>
                    <span className="text-xs text-slate-100 leading-snug">{c.playerText}</span>
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmitCustom} className="flex items-center gap-1.5 pt-1">
                <input
                  type="text"
                  maxLength={220}
                  value={customInput}
                  disabled={session.aiLoading}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder={`Dile lo que quieras a ${session.npcName} (IA Viva)...`}
                  className="flex-1 min-h-[44px] px-3 py-1.5 rounded-lg bg-[#05121e] border border-[#245075] focus:border-cyan-400 text-xs text-slate-100 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!customInput.trim() || session.aiLoading}
                  className="min-h-[44px] px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 text-xs font-extrabold inline-flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar</span>
                </button>
              </form>
            </div>
          )}

          {session.stage === 'reading_reply' && (
            <div className="space-y-2.5">
              <div className="rounded-lg bg-[#0d273f] border border-cyan-400/45 px-3 py-2 text-xs text-cyan-200 font-semibold">
                {session.latestOutcomeNote}
              </div>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-[11px] text-slate-300">
                  Lee la reacción con calma y pulsa Siguiente para continuar.
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  {session.turn >= 3 && (
                    <button
                      type="button"
                      disabled={session.aiLoading}
                      onClick={() => onNextStep(true)}
                      className="min-h-[44px] px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-extrabold cursor-pointer"
                    >
                      Seguir charlando 💬
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={session.aiLoading}
                    onClick={() => onNextStep(false)}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs sm:text-sm font-extrabold inline-flex items-center gap-1.5 cursor-pointer shadow-lg"
                  >
                    <span>
                      {session.turn < 3
                        ? 'Siguiente 💬'
                        : session.milestoneClaimed
                          ? 'Finalizar 💬'
                          : 'Ver desenlace 💬'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {session.stage === 'finished' && (
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs text-emerald-300 font-semibold">
                Conversación guardada en tu historial.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onNextStep(true)}
                  className="min-h-[44px] px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold cursor-pointer"
                >
                  Seguir hablando
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs sm:text-sm font-extrabold cursor-pointer shrink-0"
                >
                  Continuar aventura
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
