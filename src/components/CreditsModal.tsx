import { Anchor, Award, BookOpen, Compass, Heart, Sparkles, Swords, X } from 'lucide-react';
import { BRE_B_KEY, GAME_CREATOR_NAME } from './DonationModal';

interface CreditsModalProps {
  open: boolean;
  onClose: () => void;
  onOpenDonations?: () => void;
}

export function CreditsModal({ open, onClose, onOpenDonations }: CreditsModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#030b14]/88 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="w-full max-w-2xl max-h-[92vh] rounded-xl bg-[#071625] border border-amber-400/45 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#0a1f33] border-b border-[#1b3c58]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-amber-400/15 border border-amber-400/45 flex items-center justify-center">
              <Award className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-slate-50">
                Créditos Oficiales · Marea Mutante
              </h2>
              <p className="text-xs text-sky-300">
                El Océano de las Cenizas Saladas · El Último Rumbo de los Olvidados
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-[#112c44] hover:bg-[#1a4163] text-slate-200 cursor-pointer"
            aria-label="Cerrar créditos"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto deck-scroll p-4 sm:p-5 space-y-4">
          {/* Featured Author Hero */}
          <div className="rounded-xl bg-gradient-to-br from-[#0e2740] via-[#0a1d30] to-[#081624] border border-amber-400/60 p-5 text-center shadow-lg">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/45 text-[11px] font-bold uppercase tracking-wider text-amber-300 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Autor y Creador del Juego</span>
            </div>
            <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-amber-300 tracking-tight">
              {GAME_CREATOR_NAME}
            </h3>
            <p className="text-xs sm:text-sm text-slate-200 mt-2 max-w-lg mx-auto leading-relaxed">
              Concepto original, dirección creativa, narrativa de{' '}
              <span className="text-sky-300 font-semibold">El Océano de las Cenizas Saladas</span>,
              diseño de sistemas de supervivencia naval, progresión de reinos y mecánica de combate.
            </p>
          </div>

          {/* Credit Sections */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl bg-[#0b1f31] border border-[#1f4263] p-3.5 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                <BookOpen className="w-4 h-4" />
                <span>Historia y Universo</span>
              </div>
              <p className="text-xs text-slate-200 font-semibold">{GAME_CREATOR_NAME}</p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Guion dramático, misiones morales, diálogos de la tripulación y monólogos interiores
                del capitán náufrago.
              </p>
            </div>

            <div className="rounded-xl bg-[#0b1f31] border border-[#1f4263] p-3.5 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                <Compass className="w-4 h-4" />
                <span>Diseño de Juego y Mecánicas</span>
              </div>
              <p className="text-xs text-slate-200 font-semibold">{GAME_CREATOR_NAME}</p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Evolución de navío, pueblos e imperios en islas, búnkeres nucleares, leviatanes
                abisales y cuarteles piratas Rango F–SSS.
              </p>
            </div>

            <div className="rounded-xl bg-[#0b1f31] border border-[#1f4263] p-3.5 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                <Swords className="w-4 h-4" />
                <span>Combate, Clima y Tripulación</span>
              </div>
              <p className="text-xs text-slate-200 font-semibold">{GAME_CREATOR_NAME}</p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Árbol del Destino, reliquias del Viejo Mundo, sistema de 5 vidas, eventos dinámicos
                y comportamiento de sobrevivientes.
              </p>
            </div>

            <div className="rounded-xl bg-[#0b1f31] border border-[#1f4263] p-3.5 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-300">
                <Anchor className="w-4 h-4" />
                <span>Agradecimiento a Mecenas</span>
              </div>
              <p className="text-xs text-slate-200 font-semibold">Comunidad de Capitanes</p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Gracias a quienes apoyan este proyecto independiente vía Bre-B Colombia (
                <span className="font-mono-num text-amber-300">{BRE_B_KEY}</span>).
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-[#091a2a] border border-[#1d3e5e] px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-300">
              ¿Disfrutas la aventura? Apoya directamente al autor{' '}
              <b className="text-amber-300">{GAME_CREATOR_NAME}</b>.
            </div>
            <div className="flex items-center gap-2">
              {onOpenDonations && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenDonations();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/50 text-rose-200 text-xs font-bold cursor-pointer"
                >
                  <Heart className="w-3.5 h-3.5 text-rose-400" />
                  <span>Apoyar (Bre-B)</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold cursor-pointer"
              >
                Volver
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
