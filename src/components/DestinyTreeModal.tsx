import { X } from 'lucide-react';
import { useState } from 'react';
import { canUnlockDestinyNode, hasDestiny } from '../game/constants';
import { DESTINY_MAP, DESTINY_TREE } from '../game/destinyTree';
import type { PersistentState, ResourceBag } from '../game/types';

interface DestinyTreeModalProps {
  open: boolean;
  state: PersistentState;
  onClose: () => void;
  onUnlockNode: (nodeId: string) => void;
}

const BRANCH_COLORS: Record<string, string> = {
  centro: '#f8fafc',
  abordaje: '#fb7185',
  balistica: '#38bdf8',
  naval: '#fbbf24',
  alquimia: '#34d399',
};

function formatCost(cost: Partial<ResourceBag>): string {
  const labels: Record<string, string> = {
    mad: 'Madera',
    cht: 'Chatarra',
    agu: 'Agua',
    pez: 'Pez',
    oro: 'Oro',
    tit: 'Titanio',
    cri: 'Cristal Abisal',
  };
  const entries = Object.entries(cost).filter(([, v]) => (v || 0) > 0);
  if (entries.length === 0) return 'Sin costo material';
  return entries.map(([k, v]) => `${v} ${labels[k] || k}`).join(' · ');
}

export function DestinyTreeModal({
  open,
  state,
  onClose,
  onUnlockNode,
}: DestinyTreeModalProps) {
  const [selectedId, setSelectedId] = useState<string>('abordaje_t2');

  if (!open) return null;

  const selected = DESTINY_MAP[selectedId] || DESTINY_TREE[0];
  const isUnlocked = hasDestiny(state, selected.id);
  const canUnlock = canUnlockDestinyNode(state, selected.id);

  return (
    <div className="fixed inset-0 z-50 bg-[#030b14]/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-5xl max-h-[92vh] rounded-xl bg-[#071625] border border-[#254b6e] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#0a1e30] border-b border-[#1b3c58]">
          <div>
            <h2 className="font-display text-lg sm:text-xl font-bold text-amber-300">
              Tabla del Destino
            </h2>
            <p className="text-xs text-slate-300">
              Nivel {state.level} · Fama disponible:{' '}
              <span className="font-mono-num text-sky-300 font-bold">{state.fame}</span> ·
              Desbloqueados: {state.destinyUnlocked.length}/{DESTINY_TREE.length}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-[#112c44] hover:bg-[#1a4163] text-slate-200 cursor-pointer"
            aria-label="Cerrar Tabla del Destino"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Graph + Inspector */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 min-h-0 overflow-y-auto">
          {/* Interactive SVG Node Tree */}
          <div className="lg:col-span-2 bg-[#040f1a] p-3 flex items-center justify-center overflow-auto">
            <svg
              viewBox="0 0 1000 640"
              className="w-full h-auto max-h-[58vh] select-none"
            >
              {/* Subtle radial rings */}
              <circle cx="500" cy="320" r="170" fill="none" stroke="#10293e" strokeDasharray="6 6" />
              <circle cx="500" cy="320" r="310" fill="none" stroke="#10293e" strokeDasharray="6 6" />

              {/* Branch Labels */}
              <text x="90" y="25" fill="#fb7185" fontSize="14" fontWeight="700">ABORDAJE</text>
              <text x="820" y="25" fill="#38bdf8" fontSize="14" fontWeight="700">BALÍSTICA</text>
              <text x="70" y="630" fill="#fbbf24" fontSize="14" fontWeight="700">ING. NAVAL</text>
              <text x="820" y="630" fill="#34d399" fontSize="14" fontWeight="700">ALQUIMIA</text>

              {/* Edges */}
              {DESTINY_TREE.map((node) =>
                node.requires.map((reqId) => {
                  const parent = DESTINY_MAP[reqId];
                  if (!parent) return null;
                  const active = hasDestiny(state, node.id) && hasDestiny(state, parent.id);
                  const reachable = hasDestiny(state, parent.id);
                  return (
                    <line
                      key={`${parent.id}-${node.id}`}
                      x1={parent.x}
                      y1={parent.y}
                      x2={node.x}
                      y2={node.y}
                      stroke={
                        active
                          ? BRANCH_COLORS[node.branch]
                          : reachable
                            ? '#335f85'
                            : '#142a3d'
                      }
                      strokeWidth={active ? 4 : 2.5}
                    />
                  );
                })
              )}

              {/* Nodes */}
              {DESTINY_TREE.map((node) => {
                const unlocked = hasDestiny(state, node.id);
                const available = canUnlockDestinyNode(state, node.id);
                const isSel = selectedId === node.id;
                const radius = node.tier === 5 ? 26 : node.tier === 1 ? 26 : 20;
                const strokeCol = unlocked
                  ? BRANCH_COLORS[node.branch]
                  : available
                    ? '#fde047'
                    : '#294c6b';

                return (
                  <g
                    key={node.id}
                    onClick={() => setSelectedId(node.id)}
                    className="cursor-pointer"
                  >
                    {isSel && (
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={radius + 6}
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth={2}
                      />
                    )}
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={radius}
                      fill={unlocked ? '#102f4a' : '#081726'}
                      stroke={strokeCol}
                      strokeWidth={unlocked || available ? 3.5 : 2}
                    />
                    <text
                      x={node.x}
                      y={node.y + 4}
                      textAnchor="middle"
                      fill={unlocked ? '#ffffff' : available ? '#fde047' : '#7ea2c2'}
                      fontSize="12"
                      fontWeight="700"
                    >
                      T{node.tier}
                    </text>
                    <text
                      x={node.x}
                      y={node.y + radius + 14}
                      textAnchor="middle"
                      fill={unlocked ? '#e2e8f0' : '#94a3b8'}
                      fontSize="11"
                      fontWeight="600"
                    >
                      {node.name}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Selected Node Inspector */}
          <div className="p-4 bg-[#091c2d] border-t lg:border-t-0 lg:border-l border-[#1b3c58] flex flex-col justify-between gap-4">
            <div className="space-y-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-sky-300">
                  Rama {selected.branch} · Tier {selected.tier}
                </div>
                <h3 className="font-display text-xl font-bold text-slate-50 mt-0.5">
                  {selected.name}
                </h3>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{selected.description}</p>

              <div className="rounded-lg p-3 bg-[#0e263b] border border-[#224666]">
                <div className="text-[11px] font-semibold text-amber-300">Bonificación</div>
                <div className="text-xs font-bold text-slate-100 mt-0.5">
                  {selected.bonusLabel}
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="font-semibold text-slate-300">Requisitos de Desbloqueo:</div>
                <div className={state.level >= selected.minLevel ? 'text-emerald-300' : 'text-rose-400'}>
                  • Nivel mínimo: {selected.minLevel} (Actual: {state.level})
                </div>
                <div className={state.fame >= selected.fameCost ? 'text-emerald-300' : 'text-rose-400'}>
                  • Fama requerida: {selected.fameCost} (Disponible: {state.fame})
                </div>
                <div className="text-sky-200">
                  • Materiales: {formatCost(selected.resourceCost)}
                </div>
              </div>
            </div>

            <div>
              {isUnlocked ? (
                <div className="w-full py-2.5 rounded-lg bg-emerald-600/25 border border-emerald-500/60 text-emerald-300 text-xs font-bold text-center">
                  Maestría Desbloqueada
                </div>
              ) : (
                <button
                  type="button"
                  disabled={!canUnlock}
                  onClick={() => onUnlockNode(selected.id)}
                  className="w-full py-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-slate-950 font-bold text-xs cursor-pointer"
                >
                  {canUnlock ? 'Desbloquear Nodo' : 'Requisitos insuficientes'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
