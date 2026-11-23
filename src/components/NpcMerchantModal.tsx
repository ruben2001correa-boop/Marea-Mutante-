import { Lock } from 'lucide-react';
import { Anvil, Compass, FlaskConical, Hammer, MessageCircle, ShoppingBag, Sparkles, Wrench, X } from 'lucide-react';
import { canAfford, canFireNuclearWeapon } from '../game/constants';
import { WEAPONS, getRarityColor, getRarityLabel, getWeaponUnlockStatus, isNpcForgedRarity } from '../game/weapons';
import type { PersistentState, PlayerEntity, ResourceBag, WorldNpcEntity } from '../game/types';
import { WeaponIcon } from './WeaponIcon';

export type WorldNpcTradeAction =
  | 'buy_mad'
  | 'buy_cht'
  | 'buy_agu'
  | 'buy_pez'
  | 'buy_gui'
  | 'buy_hie'
  | 'buy_tit'
  | 'buy_cri'
  | 'buy_tec'
  | 'buy_repelente'
  | 'buy_hamaca'
  | 'buy_alc'
  | 'sell_mad'
  | 'sell_pez'
  | 'sell_cht'
  | 'sell_car'
  | 'repair_hull_npc'
  | 'cure_ailments_npc'
  | 'map_forjador'
  | 'map_armero'
  | 'map_leviathan'
  | 'map_bounty'
  | 'transmute_epic_to_leg'
  | 'transmute_leg_to_div';

interface NpcMerchantModalProps {
  npc: WorldNpcEntity | null;
  state: PersistentState;
  player: PlayerEntity;
  onClose: () => void;
  onForgeWeapon: (weaponId: string) => void;
  onTradeAction: (action: WorldNpcTradeAction) => void;
  onOpenChat: (npc: WorldNpcEntity) => void;
}

function formatCost(cost?: Partial<ResourceBag>): string {
  if (!cost) return '';
  const labels: Record<string, string> = {
    mad: 'Mad',
    cht: 'Cht',
    agu: 'Agu',
    pez: 'Pez',
    veg: 'Veg',
    gui: 'Gui',
    oro: 'Oro',
    car: 'Car',
    hie: 'Hie',
    tit: 'Tit',
    cri: 'Cri',
    tec: 'Tec',
    nuc_frag: 'F.Nuc',
    cel_frag: 'F.Cel',
    alc: 'Alc',
    frag_epico: 'F.Épico',
    frag_legendario: 'F.Leg',
    frag_divino: 'F.Div',
  };
  return Object.entries(cost)
    .filter(([, v]) => (v || 0) > 0)
    .map(([k, v]) => `${v} ${labels[k] || k}`)
    .join(' · ');
}

export function NpcMerchantModal({
  npc,
  state,
  player,
  onClose,
  onForgeWeapon,
  onTradeAction,
  onOpenChat,
}: NpcMerchantModalProps) {
  if (!npc) return null;

  const r = state.resources;
  const isForgerNpc = npc.role === 'armero' || npc.role === 'forjador';
  const historyCount = state.npcChatHistory?.[npc.id]?.length || 0;

  const forgeableWeapons = isForgerNpc
    ? WEAPONS.filter((w) => {
        if (!isNpcForgedRarity(w.rarity)) return false;
        if (!w.craftCost) return false;
        if (npc.role === 'armero') {
          if (w.craftedByNpc === 'forjador') return false;
          // Armero can forge Épico, Legendario, and Divine labeled 'both'
          return true;
        }
        // Forjador can forge ALL Épico, Legendario & Divino weapons
        return true;
      })
    : [];

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      className="fixed inset-0 z-50 bg-[#030b14]/86 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 safe-p-all"
    >
      <div className="w-full max-w-3xl max-h-[92dvh] rounded-2xl bg-[#071625] border border-[#285075] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 bg-[#0a1e31] border-b border-[#1c3d5b] flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-11 h-11 rounded-xl border-2 border-slate-950 flex items-center justify-center shrink-0 shadow"
              style={{ backgroundColor: npc.color }}
            >
              {npc.role === 'armero' ? (
                <Hammer className="w-5 h-5 text-slate-950" />
              ) : npc.role === 'forjador' ? (
                <Anvil className="w-5 h-5 text-slate-950" />
              ) : npc.role === 'alquimista' ? (
                <FlaskConical className="w-5 h-5 text-slate-950" />
              ) : npc.role === 'cartografo' ? (
                <Compass className="w-5 h-5 text-slate-950" />
              ) : (
                <ShoppingBag className="w-5 h-5 text-slate-950" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-display text-base sm:text-lg font-bold text-slate-50 truncate">
                  {npc.name}
                </h2>
                <span className="px-2 py-0.5 rounded bg-amber-400/15 border border-amber-400/45 text-[10px] font-bold text-amber-200">
                  {npc.title}
                </span>
              </div>
              <p className="text-xs text-slate-300 truncate">
                {npc.islandName} · {npc.specialty}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenChat(npc)}
              className="min-h-[44px] px-3 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-400/55 text-cyan-200 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Conversar {historyCount > 0 ? `(${historyCount})` : ''}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar NPC"
              className="min-w-[44px] min-h-[44px] rounded-xl bg-[#112c44] hover:bg-[#1a4163] text-slate-200 flex items-center justify-center cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto deck-scroll p-4 space-y-4">
          <div className="rounded-xl bg-[#0b1f31] border border-[#1f4263] p-3 text-xs text-slate-200 italic">
            “{npc.greeting}”
          </div>

          {/* Fragment Wallet Strip */}
          <div className="rounded-xl bg-[#06131f] border border-[#1e4060] p-3 flex flex-wrap items-center gap-3 text-xs font-mono-num">
            <span className="text-amber-300 font-bold">Oro: {r.oro}</span>
            <span className="text-purple-300 font-bold">Frag. Épico: {r.frag_epico}</span>
            <span className="text-amber-200 font-bold">Frag. Legendario: {r.frag_legendario}</span>
            <span className="text-cyan-300 font-bold">Frag. Divino: {r.frag_divino}</span>
            <span className="text-sky-300">Cel: {r.cel_frag}</span>
            <span className="text-lime-300">Nuc: {r.nuc_frag}</span>
          </div>

          {/* Forging Section (ONLY for Armero / Forjador) */}
          {isForgerNpc && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 text-sm font-bold text-amber-300">
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {npc.role === 'forjador'
                      ? 'Forja Suprema (Épicas · Legendarias · Divinas)'
                      : 'Yunque del Armero (Épicas · Legendarias · Reliquias)'}
                  </span>
                </div>
                {npc.role === 'forjador' && (
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      disabled={r.frag_epico < 3 || r.oro < 6}
                      onClick={() => onTradeAction('transmute_epic_to_leg')}
                      className="min-h-[40px] px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-[11px] font-bold cursor-pointer"
                    >
                      3 F.Épico + 6 Oro → 1 F.Legendario
                    </button>
                    <button
                      type="button"
                      disabled={r.frag_legendario < 3 || r.oro < 12}
                      onClick={() => onTradeAction('transmute_leg_to_div')}
                      className="min-h-[40px] px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-slate-950 text-[11px] font-extrabold cursor-pointer"
                    >
                      3 F.Legendario + 12 Oro → 1 F.Divino
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {forgeableWeapons.map((w) => {
                  const owned = state.ownedWeapons.includes(w.id);
                  const tierStatus = getWeaponUnlockStatus(w.id, state.ownedWeapons);
                  const magicLocked = Boolean(w.isMagic && !state.magicUnlocked);
                  const nucCheck = w.isNuclear ? canFireNuclearWeapon(state, player, w) : { allowed: true };
                  const affordable = Boolean(w.craftCost && canAfford(r, w.craftCost));
                  const rarityCol = getRarityColor(w.rarity);
                  return (
                    <div
                      key={w.id}
                      className={`rounded-xl p-3 border space-y-2 ${
                        owned
                          ? 'bg-[#0b272a] border-emerald-500/45'
                          : !tierStatus.unlocked
                            ? 'bg-[#071522] border-[#183148] opacity-85'
                            : 'bg-[#0b1f31] border-[#1f4263]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-[#06131f] border border-[#1d3e5b] flex items-center justify-center shrink-0">
                            <WeaponIcon weaponId={w.id} category={w.category} className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="px-1.5 py-0.2 rounded bg-slate-800 border border-slate-600 text-[9px] font-mono-num font-bold text-amber-200 shrink-0">
                                T{tierStatus.tier}
                              </span>
                              <span className="text-xs font-extrabold truncate" style={{ color: rarityCol }}>
                                {w.name}
                              </span>
                            </div>
                            <div className="text-[10px] font-mono-num text-slate-300">
                              {getRarityLabel(w.rarity)} · Daño {w.damage} · Alc {w.range}
                            </div>
                          </div>
                        </div>
                        {owned ? (
                          <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold shrink-0">
                            Forjada
                          </span>
                        ) : !tierStatus.unlocked ? (
                          <span className="px-2 py-1 rounded bg-rose-950/70 border border-rose-500/40 text-rose-300 text-[10px] font-bold inline-flex items-center gap-1 shrink-0">
                            <Lock className="w-3 h-3" />
                            <span>Bloqueada</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={!affordable || magicLocked}
                            onClick={() => onForgeWeapon(w.id)}
                            className="min-h-[40px] px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-slate-950 text-xs font-extrabold cursor-pointer shrink-0"
                          >
                            Forjar
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-300 leading-snug">{w.description}</p>
                      {!owned && !tierStatus.unlocked && tierStatus.prereqName && (
                        <div className="text-[10px] text-rose-300 font-bold">
                          🔒 Requiere forjar primero (Tier {tierStatus.tier - 1}): {tierStatus.prereqName}
                        </div>
                      )}
                      {magicLocked && (
                        <div className="text-[10px] text-purple-300 font-semibold">
                          Requiere despertar la Magia en el Capítulo II de la historia.
                        </div>
                      )}
                      {!nucCheck.allowed && w.isNuclear && (
                        <div className="text-[10px] text-amber-300 font-semibold">
                          ☢ {nucCheck.reason}
                        </div>
                      )}
                      {!owned && w.craftCost && (
                        <div className="text-[10px] font-mono-num text-emerald-300">
                          Materiales: {formatCost(w.craftCost)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Role-Specific Shop / Services */}
          <div className="space-y-2">
            <div className="text-sm font-bold text-sky-300">
              Servicios y Suministros de {npc.name}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {npc.role === 'armero' && (
                <>
                  <NpcActionRow
                    label="Reparar Casco (+160 HP)"
                    costText="4 Oro · 4 Mad"
                    disabled={r.oro < 4 || r.mad < 4 || (state.raft.hp >= state.raft.maxHp && !state.raft.damagedMode)}
                    icon={<Wrench className="w-4 h-4 text-emerald-300" />}
                    onClick={() => onTradeAction('repair_hull_npc')}
                  />
                  <NpcActionRow
                    label="Comprar 4 Hierro"
                    costText="5 Oro"
                    disabled={r.oro < 5}
                    onClick={() => onTradeAction('buy_hie')}
                  />
                  <NpcActionRow
                    label="Comprar 2 Titanio"
                    costText="8 Oro"
                    disabled={r.oro < 8}
                    onClick={() => onTradeAction('buy_tit')}
                  />
                  <NpcActionRow
                    label="Vender 6 Chatarra → +4 Oro"
                    costText="6 Cht"
                    disabled={r.cht < 6}
                    onClick={() => onTradeAction('sell_cht')}
                  />
                </>
              )}

              {npc.role === 'forjador' && (
                <>
                  <NpcActionRow
                    label="Comprar 2 Titanio Puro"
                    costText="8 Oro"
                    disabled={r.oro < 8}
                    onClick={() => onTradeAction('buy_tit')}
                  />
                  <NpcActionRow
                    label="Comprar 1 Cristal Abisal"
                    costText="9 Oro"
                    disabled={r.oro < 9}
                    onClick={() => onTradeAction('buy_cri')}
                  />
                  <NpcActionRow
                    label="Comprar 1 Tecnología Antigua"
                    costText="7 Oro"
                    disabled={r.oro < 7}
                    onClick={() => onTradeAction('buy_tec')}
                  />
                  <NpcActionRow
                    label="Reparar Navío (+160 HP)"
                    costText="4 Oro · 4 Mad"
                    disabled={r.oro < 4 || r.mad < 4 || (state.raft.hp >= state.raft.maxHp && !state.raft.damagedMode)}
                    onClick={() => onTradeAction('repair_hull_npc')}
                  />
                </>
              )}

              {npc.role === 'mercader' && (
                <>
                  <NpcActionRow
                    label="Comprar 5 Madera"
                    costText="3 Oro"
                    disabled={r.oro < 3}
                    onClick={() => onTradeAction('buy_mad')}
                  />
                  <NpcActionRow
                    label="Comprar 5 Agua Potable"
                    costText="2 Oro"
                    disabled={r.oro < 2}
                    onClick={() => onTradeAction('buy_agu')}
                  />
                  <NpcActionRow
                    label="Comprar 2 Guisos Calientes"
                    costText="4 Oro"
                    disabled={r.oro < 4}
                    onClick={() => onTradeAction('buy_gui')}
                  />
                  <NpcActionRow
                    label="Comprar Saco de Descanso"
                    costText="5 Oro"
                    disabled={r.oro < 5}
                    onClick={() => onTradeAction('buy_hamaca')}
                  />
                  <NpcActionRow
                    label="Vender 6 Madera → +4 Oro"
                    costText="6 Mad"
                    disabled={r.mad < 6}
                    onClick={() => onTradeAction('sell_mad')}
                  />
                  <NpcActionRow
                    label="Vender 4 Pez → +3 Oro"
                    costText="4 Pez"
                    disabled={r.pez < 4}
                    onClick={() => onTradeAction('sell_pez')}
                  />
                </>
              )}

              {npc.role === 'alquimista' && (
                <>
                  <NpcActionRow
                    label="Curar Radiación, Resaca y Mente (+45 HP)"
                    costText="5 Oro · 2 Agu"
                    disabled={r.oro < 5 || r.agu < 2}
                    onClick={() => onTradeAction('cure_ailments_npc')}
                  />
                  <NpcActionRow
                    label="Comprar Incienso de Sigilo"
                    costText="4 Oro"
                    disabled={r.oro < 4}
                    onClick={() => onTradeAction('buy_repelente')}
                  />
                  <NpcActionRow
                    label="Comprar 1 Cristal Abisal"
                    costText="8 Oro"
                    disabled={r.oro < 8}
                    onClick={() => onTradeAction('buy_cri')}
                  />
                  <NpcActionRow
                    label="Comprar 2 Alcohol Medicinal"
                    costText="4 Oro"
                    disabled={r.oro < 4}
                    onClick={() => onTradeAction('buy_alc')}
                  />
                </>
              )}

              {npc.role === 'cartografo' && (
                <>
                  <NpcActionRow
                    label="Carta: Forjador Más Cercano"
                    costText="4 Oro"
                    disabled={r.oro < 4}
                    onClick={() => onTradeAction('map_forjador')}
                  />
                  <NpcActionRow
                    label="Carta: Armero Más Cercano"
                    costText="3 Oro"
                    disabled={r.oro < 3}
                    onClick={() => onTradeAction('map_armero')}
                  />
                  <NpcActionRow
                    label="Carta: Guarida de Leviatán"
                    costText="5 Oro"
                    disabled={r.oro < 5}
                    onClick={() => onTradeAction('map_leviathan')}
                  />
                  <NpcActionRow
                    label="Carta: Capitán Pirata Buscado"
                    costText="4 Oro"
                    disabled={r.oro < 4}
                    onClick={() => onTradeAction('map_bounty')}
                  />
                </>
              )}

              {npc.role === 'chatarrero' && (
                <>
                  <NpcActionRow
                    label="Comprar 5 Chatarra"
                    costText="3 Oro"
                    disabled={r.oro < 3}
                    onClick={() => onTradeAction('buy_cht')}
                  />
                  <NpcActionRow
                    label="Comprar 4 Hierro"
                    costText="4 Oro"
                    disabled={r.oro < 4}
                    onClick={() => onTradeAction('buy_hie')}
                  />
                  <NpcActionRow
                    label="Comprar 2 Titanio"
                    costText="7 Oro"
                    disabled={r.oro < 7}
                    onClick={() => onTradeAction('buy_tit')}
                  />
                  <NpcActionRow
                    label="Comprar 2 Piezas Tech"
                    costText="10 Oro"
                    disabled={r.oro < 10}
                    onClick={() => onTradeAction('buy_tec')}
                  />
                  <NpcActionRow
                    label="Vender 5 Carbón → +4 Oro"
                    costText="5 Car"
                    disabled={r.car < 5}
                    onClick={() => onTradeAction('sell_car')}
                  />
                  <NpcActionRow
                    label="Vender 6 Chatarra → +4 Oro"
                    costText="6 Cht"
                    disabled={r.cht < 6}
                    onClick={() => onTradeAction('sell_cht')}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NpcActionRow({
  label,
  costText,
  disabled,
  icon,
  onClick,
}: {
  label: string;
  costText: string;
  disabled: boolean;
  icon?: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="min-h-[48px] rounded-xl px-3 py-2 bg-[#0b1f31] hover:bg-[#122e47] disabled:opacity-40 border border-[#1f4263] hover:border-amber-400/60 flex items-center justify-between gap-2 text-left cursor-pointer transition-colors"
    >
      <div className="flex items-center gap-2 min-w-0">
        {icon}
        <span className="text-xs font-bold text-slate-100 truncate">{label}</span>
      </div>
      <span className="font-mono-num text-[11px] font-bold text-amber-300 shrink-0">{costText}</span>
    </button>
  );
}
