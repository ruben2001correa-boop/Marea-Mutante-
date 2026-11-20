import { useState } from 'react';
import {
  Anvil,
  Beer,
  BookmarkCheck,
  Compass,
  Flag,
  Hammer,
  History,
  MessageCircle,
  Radiation,
  Radio,
  ShieldCheck,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import { ACHIEVEMENTS_CATALOG, SURVIVORS_CATALOG } from '../game/destinyTree';
import {
  AOE_AGES_CATALOG,
  AOE_BUILDINGS_CATALOG,
  AOE_TECHS_CATALOG,
  WARSHIP_PASSIVES_CATALOG,
  canAfford,
  getIslandCorralLimit,
  getPopulationStats,
  getRaftCorralLimit,
  hasWarshipPassive,
} from '../game/constants';
import { MOOD_META } from '../game/needsAndPsychology';
import { getNpcMoodState } from '../game/npcConversations';
import { RELICS_CATALOG, getRelicRankColor } from '../game/relics';
import {
  ANIMAL_RANCH_INFO,
  CLAN_PERKS_CATALOG,
  CROPS_CATALOG,
  KINGDOMS_CATALOG,
  ROMANCE_CANDIDATES,
  TECH_PIECES_CATALOG,
  TITLES_CATALOG,
  getShipClassName,
} from '../game/socialAndKingdoms';
import {
  WEAPONS,
  WEAPON_MAP,
  getRarityColor,
  getRarityLabel,
  isNpcForgedRarity,
} from '../game/weapons';
import { WeaponIcon } from './WeaponIcon';
import type {
  CropKind,
  DrawerTab,
  IslandNode,
  IslandStructure,
  PersistentState,
  ResourceBag,
  ResourceKey,
  SurvivorId,
  WorldNpcEntity,
} from '../game/types';

export type TradeAction =
  | 'sell_mad'
  | 'sell_pez'
  | 'sell_car'
  | 'buy_mad'
  | 'buy_cht'
  | 'buy_agu'
  | 'buy_hie'
  | 'buy_tit'
  | 'buy_tec'
  | 'buy_repelente'
  | 'buy_hamaca';

interface SlideDrawerProps {
  open: boolean;
  tab: DrawerTab;
  state: PersistentState;
  currentIslandId: string | null;
  currentIslandName: string | null;
  discoveredIslands: Array<{ id: string; name: string; biome: string }>;
  inShelter: boolean;
  nearbyVillage: IslandNode | null;
  nearbyWorldNpc?: WorldNpcEntity | null;
  onClose: () => void;
  onTabChange: (tab: DrawerTab) => void;
  onEquipWeapon: (weaponId: string) => void;
  onCraftWeapon: (weaponId: string) => void;
  onCraftTechPiece: (techId: string) => void;
  onRepairRaft: () => void;
  onCookStew: () => void;
  onCraftConsumable: (kind: 'repelente' | 'hamaca') => void;
  onUpgradeRaft: (part: 'level' | 'engineLevel' | 'turretLevel' | 'distillerLevel' | 'solarLevel') => void;
  onUnlockWarshipPassive?: (passiveId: string) => void;
  onUnlockNuclearShield?: () => void;
  onCraftRadiationSuit?: () => void;
  onBuildShipRadio?: () => void;
  onBrewAlcohol?: () => void;
  onDrinkAlcohol?: () => void;
  onBuildOnIsland: (kind: IslandStructure['kind']) => void;
  onUpgradeAge?: () => void;
  onTrainIslandUnit?: (kind: 'villager' | 'guard' | 'patrol_ship') => void;
  onResearchAoeTech?: (techId: string) => void;
  onRepairStructures?: () => void;
  onFoundSettlement: (name: string, banner: string) => void;
  onUpgradeSettlement: (structureId: string) => void;
  onDesignateHqIsland: (islandId: string) => void;
  onSaveCheckpoint: () => void;
  onDeclareIslandWar: (kingdomId: string) => void;
  onKingdomAction: (kingdomId: string, action: 'gift' | 'peace') => void;
  onFoundOrUpgradeClan: (name?: string, tag?: string) => void;
  onUnlockClanPerk: (perkId: string) => void;
  onClanAction: (clanId: string, action: 'gift' | 'peace' | 'war') => void;
  onVillageAction: (villageNode: IslandNode, action: 'trade' | 'pillage') => void;
  onTrade: (action: TradeAction) => void;
  onRecruitOrUpgradeSurvivor: (id: SurvivorId) => void;
  onToggleRelic: (relicId: string) => void;
  onSelectTitle: (titleId: string) => void;
  onToggleDonorSkin: () => void;
  onRomanceAction: (candidateId: string, action: 'court' | 'marry') => void;
  onHaveChild: () => void;
  onSendChildMission?: (childId: string, kind: 'explore' | 'trade' | 'raid') => void;
  onBuildFarmPlot: (location: 'raft' | 'island') => void;
  onPlantCrop: (plotId: string, crop: CropKind) => void;
  onWaterPlot: (plotId: string) => void;
  onEatVeg: () => void;
  onCookGreenStew: () => void;
  onFeedCaptiveAnimal: (animalId: string) => void;
  onBreedCaptiveAnimal: (animalId: string) => void;
  onTalkToNpc: (npcId: string) => void;
  onOpenWorldNpc?: (npc: WorldNpcEntity) => void;
}

function formatCost(cost?: Partial<ResourceBag>): string {
  if (!cost) return 'Solo cofre raro';
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

export function SlideDrawer({
  open,
  tab,
  state,
  currentIslandId,
  currentIslandName,
  discoveredIslands,
  inShelter,
  nearbyVillage,
  nearbyWorldNpc,
  onClose,
  onTabChange,
  onEquipWeapon,
  onCraftWeapon,
  onCraftTechPiece,
  onRepairRaft,
  onCookStew,
  onCraftConsumable,
  onUpgradeRaft,
  onUnlockWarshipPassive,
  onUnlockNuclearShield,
  onCraftRadiationSuit,
  onBuildShipRadio,
  onBrewAlcohol,
  onDrinkAlcohol,
  onBuildOnIsland,
  onUpgradeAge,
  onTrainIslandUnit,
  onResearchAoeTech,
  onRepairStructures,
  onFoundSettlement,
  onUpgradeSettlement,
  onDesignateHqIsland,
  onSaveCheckpoint,
  onDeclareIslandWar,
  onKingdomAction,
  onFoundOrUpgradeClan,
  onUnlockClanPerk,
  onClanAction,
  onVillageAction,
  onTrade,
  onRecruitOrUpgradeSurvivor,
  onToggleRelic,
  onSelectTitle,
  onToggleDonorSkin,
  onRomanceAction,
  onHaveChild,
  onSendChildMission,
  onBuildFarmPlot,
  onPlantCrop,
  onWaterPlot,
  onEatVeg,
  onCookGreenStew,
  onFeedCaptiveAnimal,
  onBreedCaptiveAnimal,
  onTalkToNpc,
  onOpenWorldNpc,
}: SlideDrawerProps) {
  const [clanNameInput, setClanNameInput] = useState(state.clan.name || 'Marea Libre');
  const [clanTagInput, setClanTagInput] = useState(state.clan.tag || 'MAREA');
  const [selectedCrop, setSelectedCrop] = useState<CropKind>('algas');
  const [settlementNameInput, setSettlementNameInput] = useState('Puerto Ceniza');
  const [settlementBannerInput, setSettlementBannerInput] = useState<
    'dorado' | 'esmeralda' | 'carmesi' | 'cian'
  >('dorado');
  const [expandedHistoryNpcId, setExpandedHistoryNpcId] = useState<string | null>(null);

  const r = state.resources;
  const shipClass = getShipClassName(state.raft.level, state.warshipNuclearShield);
  const repairNeeded = state.raft.hp < state.raft.maxHp || state.raft.damagedMode;
  const canAffordRepair = r.mad >= 4 && (r.cht >= 2 || state.raft.damagedMode);
  const raftPlotsCount = state.farmPlots.filter((p) => p.location === 'raft').length;
  const raftAnimalsCount = state.captiveAnimals.filter((a) => a.location === 'raft').length;
  const islandAnimalsCount = state.captiveAnimals.filter(
    (a) => a.location === 'island' && (!currentIslandId || a.islandId === currentIslandId)
  ).length;
  const raftCorralLimit = getRaftCorralLimit(state.raft.level);
  const islandCorralLimit = getIslandCorralLimit(state, currentIslandId);
  const hasBaseOnCurrentIsland = Boolean(
    currentIslandId &&
      state.islandStructures.some(
        (s) => s.islandId === currentIslandId && (s.kind === 'hq' || s.kind === 'shelter')
      )
  );
  const currentIslandSettlements = currentIslandId
    ? state.islandStructures.filter(
        (st) => st.islandId === currentIslandId && st.kind === 'settlement'
      )
    : [];
  const allSettlements = state.islandStructures.filter((st) => st.kind === 'settlement');
  const nuclearOperational =
    state.raft.level >= 7 &&
    state.nuclearLabBuilt &&
    state.nuclearReactorBuilt &&
    state.radiationSuitCrafted &&
    state.warshipNuclearShield;

  const popStats = getPopulationStats(state);
  const currentAge = state.ageTier || 1;
  const nextAgeDef = AOE_AGES_CATALOG.find((a) => a.tier === currentAge + 1);
  const currentIslandStructures = currentIslandId
    ? state.islandStructures.filter((s) => s.islandId === currentIslandId)
    : [];
  const damagedStructuresCount = currentIslandStructures.filter(
    (s) => typeof s.hp === 'number' && typeof s.maxHp === 'number' && s.hp < s.maxHp
  ).length;

  const nearestForgeNpc =
    state.discoveredWorldNpcs?.find((n) => n.role === 'forjador' || n.role === 'armero') || null;

  return (
    <aside
      aria-label="Menú lateral deslizable"
      onPointerDown={(e) => e.stopPropagation()}
      className={`fixed top-[46px] right-0 bottom-0 z-40 w-full max-w-[405px] bg-[#071522]/96 backdrop-blur-md border-l border-[#1f4260] shadow-2xl flex flex-col transition-transform duration-200 ease-out safe-pb ${
        open ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {/* Header & Scrollable Tabs */}
      <div className="flex items-center justify-between px-2.5 py-2 bg-[#0a1d2e] border-b border-[#193852] gap-2">
        <div className="flex items-center gap-1 overflow-x-auto deck-scroll">
          {(
            [
              ['arsenal', 'Arsenal'],
              ['raft', 'Navío'],
              ['farm', 'Granja'],
              ['islands', 'Islas AoE'],
              ['clans', 'Clanes'],
              ['kingdoms', 'Reinos'],
              ['trade', 'Comercio'],
              ['crew', 'Equipo & NPCs'],
              ['family', 'Familia'],
              ['relics', 'Reliquias'],
              ['achievements', 'Logros'],
            ] as Array<[DrawerTab, string]>
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => onTabChange(id)}
              className={`min-h-[36px] px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                tab === id
                  ? 'bg-amber-400 text-slate-950'
                  : 'text-slate-300 hover:bg-[#133049]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="min-w-[40px] min-h-[40px] rounded-lg text-slate-300 hover:text-white hover:bg-[#14324d] flex items-center justify-center cursor-pointer shrink-0"
          aria-label="Recoger menú"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto deck-scroll p-3 space-y-2.5">
        {tab === 'arsenal' && (
          <>
            {/* Fragment Wallet */}
            <div className="rounded-xl p-2.5 bg-[#091c2d] border border-[#22476a] space-y-1.5">
              <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Anvil className="w-4 h-4" />
                <span>Fragmentos de Forja Especializada</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-[11px] font-mono-num">
                <div className="rounded bg-[#06131f] px-2 py-1 border border-purple-400/35 text-purple-300">
                  Épico: <b>{r.frag_epico}</b>
                </div>
                <div className="rounded bg-[#06131f] px-2 py-1 border border-amber-400/35 text-amber-300">
                  Legend: <b>{r.frag_legendario}</b>
                </div>
                <div className="rounded bg-[#06131f] px-2 py-1 border border-cyan-400/35 text-cyan-300">
                  Divino: <b>{r.frag_divino}</b>
                </div>
                <div className="rounded bg-[#06131f] px-2 py-1 border border-sky-400/30 text-sky-300">
                  Celest: <b>{r.cel_frag}</b>
                </div>
                <div className="rounded bg-[#06131f] px-2 py-1 border border-lime-400/30 text-lime-300">
                  Nuclear: <b>{r.nuc_frag}</b>
                </div>
                <div className="rounded bg-[#06131f] px-2 py-1 border border-amber-400/30 text-amber-200">
                  Alcohol: <b>{r.alc}</b>
                </div>
              </div>
              <p className="text-[11px] text-slate-300 leading-snug">
                Las armas <b className="text-purple-300">Épicas</b>, <b className="text-amber-300">Legendarias</b> y{' '}
                <b className="text-cyan-300">Divinas</b> solo las forja un <b className="text-orange-300">Armero</b> o{' '}
                <b className="text-cyan-300">Forjador</b> del mapa.
                {nearestForgeNpc
                  ? ` Más cercano: ${nearestForgeNpc.name} (${Math.round(nearestForgeNpc.x)}, ${Math.round(nearestForgeNpc.y)}).`
                  : ' Visita el Pontón Forja del Alba en (360, -250).'}
              </p>
              {nearbyWorldNpc &&
                (nearbyWorldNpc.role === 'armero' || nearbyWorldNpc.role === 'forjador') &&
                onOpenWorldNpc && (
                  <button
                    type="button"
                    onClick={() => onOpenWorldNpc(nearbyWorldNpc)}
                    className="w-full min-h-[42px] px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Hammer className="w-4 h-4" />
                    <span>Abrir Forja de {nearbyWorldNpc.name}</span>
                  </button>
                )}
            </div>

            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center justify-between bg-[#0d2235] border border-[#1f415e] rounded-lg px-3 py-2">
                <div>
                  <div className="text-xs font-bold text-emerald-300">Cocinar Guiso</div>
                  <div className="text-[11px] text-slate-300">2 Pez · 2 Agu → +1 Guiso</div>
                </div>
                <button
                  type="button"
                  disabled={r.pez < 2 || r.agu < 2}
                  onClick={onCookStew}
                  className="min-h-[40px] px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-xs font-bold text-white cursor-pointer"
                >
                  Cocinar
                </button>
              </div>

              <div className="flex items-center justify-between bg-[#0d2235] border border-[#1f415e] rounded-lg px-3 py-2">
                <div>
                  <div className="text-xs font-bold text-purple-300">Incienso de Sigilo</div>
                  <div className="text-[11px] text-slate-300">3 Mad · 2 Agu · 1 Oro → 45s sin ataques</div>
                </div>
                <button
                  type="button"
                  disabled={r.mad < 3 || r.agu < 2 || r.oro < 1}
                  onClick={() => onCraftConsumable('repelente')}
                  className="min-h-[40px] px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-xs font-bold text-white cursor-pointer"
                >
                  Crear
                </button>
              </div>

              <div className="flex items-center justify-between bg-[#0d2235] border border-[#1f415e] rounded-lg px-3 py-2">
                <div>
                  <div className="text-xs font-bold text-sky-300">Saco de Descanso</div>
                  <div className="text-[11px] text-slate-300">5 Mad · 2 Cht → Permite dormir</div>
                </div>
                <button
                  type="button"
                  disabled={r.mad < 5 || r.cht < 2}
                  onClick={() => onCraftConsumable('hamaca')}
                  className="min-h-[40px] px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-xs font-bold text-white cursor-pointer"
                >
                  Crear
                </button>
              </div>
            </div>

            <div className="text-xs font-semibold text-slate-400 pt-1">
              Armas y Herramientas ({state.ownedWeapons.length}/{WEAPONS.length})
            </div>

            {WEAPONS.map((w) => {
              const owned = state.ownedWeapons.includes(w.id);
              const inHotbarIdx = state.hotbar.indexOf(w.id);
              const isEquipped = inHotbarIdx === state.equippedSlot;
              const npcRequired = isNpcForgedRarity(w.rarity);
              const magicLocked = Boolean(w.isMagic && !state.magicUnlocked);
              const craftable = Boolean(!npcRequired && !magicLocked && w.craftCost && canAfford(r, w.craftCost));
              const rarityCol = getRarityColor(w.rarity);

              return (
                <div
                  key={w.id}
                  className={`rounded-lg p-2.5 border ${
                    isEquipped
                      ? 'bg-[#122f47] border-amber-400/70'
                      : 'bg-[#0b1f31] border-[#1c3b56]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <div className="w-8 h-8 rounded bg-[#071522] border border-[#1d3e5b] flex items-center justify-center shrink-0 mt-0.5">
                        <WeaponIcon weaponId={w.id} category={w.category} className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold truncate" style={{ color: rarityCol }}>
                            {w.name}
                          </span>
                          <span className="text-[10px] text-slate-400 uppercase">{w.category}</span>
                        </div>
                        <div className="text-[11px] text-slate-300 mt-0.5">{w.description}</div>
                        <div className="text-[10px] font-mono-num text-slate-400 mt-1">
                          {getRarityLabel(w.rarity)} · Daño {w.damage} · Alcance {w.range}
                        </div>
                        {magicLocked && !owned && (
                          <div className="text-[10px] font-bold text-purple-300 mt-1">
                            ✨ Magia bloqueada: avanza hasta el Capítulo II de la historia.
                          </div>
                        )}
                        {w.isNuclear && (
                          <div
                            className={`text-[10px] font-bold mt-1 ${
                              nuclearOperational ? 'text-lime-300' : 'text-amber-300'
                            }`}
                          >
                            {nuclearOperational
                              ? '☢ Operativa solo a bordo de tu Buque de Guerra Nuclear Blindado'
                              : '☢ Requiere Buque Nv.7 + Lab + Reactor + Traje + Blindaje Nuclear'}
                          </div>
                        )}
                      </div>
                    </div>

                    {owned ? (
                      <button
                        type="button"
                        onClick={() => onEquipWeapon(w.id)}
                        className={`min-h-[40px] px-2.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer shrink-0 ${
                          isEquipped
                            ? 'bg-amber-400 text-slate-950'
                            : 'bg-[#163a57] hover:bg-[#1d4a6e] text-sky-200'
                        }`}
                      >
                        {isEquipped ? 'En uso' : inHotbarIdx >= 0 ? `Slot ${inHotbarIdx + 1}` : 'Equipar'}
                      </button>
                    ) : npcRequired ? (
                      <span className="px-2 py-1 rounded bg-[#071522] border border-amber-400/40 text-[10px] font-bold text-amber-300 text-right shrink-0">
                        {w.craftedByNpc === 'forjador' ? 'Solo Forjador' : 'Armero / Forjador'}
                      </span>
                    ) : w.craftCost ? (
                      <button
                        type="button"
                        disabled={!craftable}
                        onClick={() => onCraftWeapon(w.id)}
                        className="min-h-[40px] px-2.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-xs font-bold text-white whitespace-nowrap cursor-pointer shrink-0"
                      >
                        Forjar
                      </button>
                    ) : (
                      <span className="text-[10px] font-semibold text-amber-300 whitespace-nowrap">
                        Cofre raro
                      </span>
                    )}
                  </div>
                  {!owned && w.craftCost && (
                    <div className="text-[10px] font-mono-num text-emerald-300 mt-1">
                      Costo: {formatCost(w.craftCost)}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}

        {tab === 'raft' && (
          <div className="space-y-2.5">
            <div className="rounded-lg p-2.5 bg-[#0d2235] border border-[#1f415e] text-xs text-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span>
                  Clase: <b className="text-amber-300">{shipClass}</b> (Nv.{state.raft.level})
                </span>
                <span className="font-mono-num text-amber-200 font-bold">
                  Casco {Math.ceil(state.raft.hp)}/{state.raft.maxHp}
                </span>
              </div>
              <div className="text-[11px] text-slate-300">
                {state.raft.level >= 7
                  ? '¡Buque de Guerra Nuclear activo! Desbloquea habilidades pasivas navales y blindaje atómico.'
                  : 'Mejora la balsa hasta Nv.7 para convertirla en un Buque de Guerra Nuclear.'}
              </div>
              {repairNeeded && (
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#1c3b56]">
                  <span className="text-[11px] text-rose-300 font-semibold">
                    {state.raft.damagedMode ? '¡CASCO AVERIADO!' : 'Casco dañado (+120 HP)'}
                  </span>
                  <button
                    type="button"
                    disabled={!canAffordRepair}
                    onClick={onRepairRaft}
                    className="min-h-[40px] inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold cursor-pointer"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Reparar (4 Mad{!state.raft.damagedMode ? ' · 2 Cht' : ''})</span>
                  </button>
                </div>
              )}
            </div>

            <UpgradeRow
              title={`Cubierta & Casco · Nv.${state.raft.level}`}
              desc="Amplía la nave hacia Balandra, Goleta, Fragata y Buque de Guerra Nuclear (Nv.7)."
              cost={{ mad: 12 + state.raft.level * 5, cht: 6 + state.raft.level * 3, hie: state.raft.level >= 3 ? state.raft.level : 0 }}
              bag={r}
              onClick={() => onUpgradeRaft('level')}
            />
            <UpgradeRow
              title={`Motor & Timón · Nv.${state.raft.engineLevel}`}
              desc="Mayor velocidad al surcar mares."
              cost={{ mad: 9 + state.raft.engineLevel * 4, cht: 8 + state.raft.engineLevel * 4, oro: state.raft.engineLevel + 1 }}
              bag={r}
              onClick={() => onUpgradeRaft('engineLevel')}
            />
            <UpgradeRow
              title={`Torretas Automáticas · Nv.${state.raft.turretLevel}`}
              desc="Defensa armada contra bandidos y monstruos."
              cost={{ cht: 14 + state.raft.turretLevel * 6, mad: 8, hie: 2, tit: state.raft.turretLevel >= 1 ? 2 : 0 }}
              bag={r}
              onClick={() => onUpgradeRaft('turretLevel')}
            />
            <UpgradeRow
              title={`Destilador Marino · Nv.${state.raft.distillerLevel}`}
              desc="Condensa agua potable periódicamente."
              cost={{ mad: 8 + state.raft.distillerLevel * 3, cht: 7 + state.raft.distillerLevel * 3 }}
              bag={r}
              onClick={() => onUpgradeRaft('distillerLevel')}
            />
            <UpgradeRow
              title={`Paneles Solares · Nv.${state.raft.solarLevel}`}
              desc="Acelera las torretas del navío."
              cost={{ cht: 10 + state.raft.solarLevel * 4, tit: state.raft.solarLevel >= 2 ? 1 : 0 }}
              bag={r}
              onClick={() => onUpgradeRaft('solarLevel')}
            />

            {/* Nuclear Warship Shield & Chain Checklist */}
            <div className="rounded-xl p-3 bg-[#0c2330] border border-lime-400/45 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-lime-300">
                  <Radiation className="w-4 h-4" />
                  <span>Blindaje Nuclear del Buque</span>
                </div>
                <span className="text-[10px] font-bold text-lime-200">
                  {state.warshipNuclearShield ? 'ACTIVO' : 'Requisito Atómico'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1 text-[10px]">
                <span className={state.raft.level >= 7 ? 'text-emerald-300' : 'text-slate-400'}>
                  {state.raft.level >= 7 ? '✓' : '○'} Buque Nv.7+
                </span>
                <span className={state.nuclearLabBuilt ? 'text-emerald-300' : 'text-slate-400'}>
                  {state.nuclearLabBuilt ? '✓' : '○'} Lab Nuclear
                </span>
                <span className={state.nuclearReactorBuilt ? 'text-emerald-300' : 'text-slate-400'}>
                  {state.nuclearReactorBuilt ? '✓' : '○'} Reactor Nuclear
                </span>
                <span className={state.radiationSuitCrafted ? 'text-emerald-300' : 'text-slate-400'}>
                  {state.radiationSuitCrafted ? '✓' : '○'} Traje Antirradiación
                </span>
              </div>
              {onUnlockNuclearShield && !state.warshipNuclearShield && (
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#183b4a]">
                  <span className="text-[10px] font-mono-num text-amber-300">
                    12 Tit · 8 Cri · 8 Tec · 5 F.Nuc
                  </span>
                  <button
                    type="button"
                    disabled={
                      state.raft.level < 7 ||
                      !state.nuclearLabBuilt ||
                      !state.nuclearReactorBuilt ||
                      !state.radiationSuitCrafted ||
                      !canAfford(r, { tit: 12, cri: 8, tec: 8, nuc_frag: 5 })
                    }
                    onClick={onUnlockNuclearShield}
                    className="min-h-[38px] px-3 py-1 rounded-lg bg-lime-500 hover:bg-lime-400 disabled:opacity-40 text-slate-950 text-xs font-extrabold cursor-pointer"
                  >
                    Instalar Blindaje Nuclear
                  </button>
                </div>
              )}
            </div>

            {/* Warship Passives (Nv.7+) */}
            <div className="pt-2 border-t border-[#193852] space-y-2">
              <div className="text-xs font-bold text-amber-300">
                Habilidades Pasivas del Buque de Guerra (Nv.7+)
              </div>
              {WARSHIP_PASSIVES_CATALOG.map((wp) => {
                const active = hasWarshipPassive(state, wp.id);
                const canBuy = state.raft.level >= wp.minRaftLevel && canAfford(r, wp.cost);
                return (
                  <div
                    key={wp.id}
                    className={`rounded-lg p-2.5 border flex items-center justify-between gap-2 ${
                      active ? 'bg-[#112d28] border-emerald-400/60' : 'bg-[#0b1f31] border-[#1c3b56]'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-amber-200">{wp.name}</div>
                      <div className="text-[11px] text-slate-300">{wp.description}</div>
                      <div className="text-[10px] font-semibold text-emerald-300 mt-0.5">{wp.bonusText}</div>
                      {!active && (
                        <div className="text-[10px] font-mono-num text-amber-300 mt-0.5">
                          Nv.{wp.minRaftLevel}+ · {formatCost(wp.cost)}
                        </div>
                      )}
                    </div>
                    {active ? (
                      <span className="text-[11px] font-bold text-emerald-300 shrink-0">Activa</span>
                    ) : (
                      onUnlockWarshipPassive && (
                        <button
                          type="button"
                          disabled={!canBuy}
                          onClick={() => onUnlockWarshipPassive(wp.id)}
                          className="min-h-[38px] px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-slate-950 text-xs font-bold cursor-pointer shrink-0"
                        >
                          Activar
                        </button>
                      )
                    )}
                  </div>
                );
              })}
            </div>

            {/* Ship Radio & Alcohol */}
            <div className="grid grid-cols-1 gap-2 pt-2 border-t border-[#193852]">
              {onBuildShipRadio && (
                <div className="rounded-lg p-2.5 bg-[#0b1f31] border border-[#1c3b56] flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-cyan-300 flex items-center gap-1">
                      <Radio className="w-3.5 h-3.5" />
                      <span>Radio Transmisor Naval</span>
                    </div>
                    <div className="text-[11px] text-slate-300">
                      Conecta con tus islas, detecta tormentas y neutraliza ataques de hackers.
                    </div>
                    {!state.shipRadioBuilt && (
                      <div className="text-[10px] font-mono-num text-amber-300">
                        4 Tec · 6 Hie · 6 Cht
                      </div>
                    )}
                  </div>
                  {state.shipRadioBuilt ? (
                    <span className="text-[11px] font-bold text-cyan-300 shrink-0">En línea</span>
                  ) : (
                    <button
                      type="button"
                      disabled={!canAfford(r, { tec: 4, hie: 6, cht: 6 })}
                      onClick={onBuildShipRadio}
                      className="min-h-[38px] px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-xs font-bold cursor-pointer shrink-0"
                    >
                      Instalar
                    </button>
                  )}
                </div>
              )}

              {(onBrewAlcohol || onDrinkAlcohol) && (
                <div className="rounded-lg p-2.5 bg-[#0b1f31] border border-[#1c3b56] flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-amber-300 flex items-center gap-1">
                      <Beer className="w-3.5 h-3.5" />
                      <span>Ron y Alcohol de Travesía ({r.alc})</span>
                    </div>
                    <div className="text-[11px] text-slate-300">
                      Sube la moral (+25 Mente, +20 HP), pero beber en exceso provoca resaca.
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    {onBrewAlcohol && (
                      <button
                        type="button"
                        disabled={r.veg < 3 || r.agu < 2}
                        onClick={onBrewAlcohol}
                        className="min-h-[38px] px-2 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white text-[11px] font-bold cursor-pointer"
                      >
                        Destilar
                      </button>
                    )}
                    {onDrinkAlcohol && (
                      <button
                        type="button"
                        disabled={r.alc <= 0}
                        onClick={onDrinkAlcohol}
                        className="min-h-[38px] px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-[11px] font-bold cursor-pointer"
                      >
                        Beber
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-[#193852] space-y-2">
              <div className="text-xs font-bold text-cyan-300">
                Taller Tecnológico (Piezas Tech de Islas Chatarra/Abisales)
              </div>
              {TECH_PIECES_CATALOG.map((tech) => {
                const crafted = state.craftedTech.includes(tech.id);
                const affordable = canAfford(r, tech.cost);
                return (
                  <div
                    key={tech.id}
                    className={`rounded-lg p-2.5 border flex items-center justify-between gap-2 ${
                      crafted ? 'bg-[#102d38] border-cyan-400/70' : 'bg-[#0b1f31] border-[#1c3b56]'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-cyan-200">{tech.name}</div>
                      <div className="text-[11px] text-slate-300">{tech.description}</div>
                      <div className="text-[10px] font-semibold text-emerald-300 mt-0.5">
                        {tech.bonusText}
                      </div>
                      {!crafted && (
                        <div className="text-[10px] font-mono-num text-amber-300 mt-0.5">
                          Costo: {formatCost(tech.cost)}
                        </div>
                      )}
                    </div>
                    {crafted ? (
                      <span className="text-[11px] font-bold text-cyan-300 shrink-0">Instalado</span>
                    ) : (
                      <button
                        type="button"
                        disabled={!affordable}
                        onClick={() => onCraftTechPiece(tech.id)}
                        className="min-h-[38px] px-2.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-xs font-bold cursor-pointer shrink-0"
                      >
                        Ensamblar
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'islands' && (
          <div className="space-y-2.5">
            {/* AoE Imperial Age Progression */}
            <div className="rounded-xl p-3 bg-gradient-to-br from-[#0e263c] to-[#081726] border border-amber-400/55 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-extrabold text-amber-300">
                    {AOE_AGES_CATALOG[currentAge - 1]?.name || 'Edad I'}
                  </div>
                  <div className="text-[10px] text-slate-300">
                    Población Imperial: <b className="text-sky-300">{popStats.pop}/{popStats.popCap}</b> ({popStats.villagers} ald. · {popStats.guards} guard. · {popStats.patrolShips} patr.)
                  </div>
                </div>
                {onRepairStructures && damagedStructuresCount > 0 && (
                  <button
                    type="button"
                    disabled={r.mad < 4}
                    onClick={onRepairStructures}
                    className="min-h-[36px] px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-[10px] font-bold cursor-pointer shrink-0"
                  >
                    Reparar ({damagedStructuresCount})
                  </button>
                )}
              </div>

              {nextAgeDef && onUpgradeAge ? (
                <div className="pt-2 border-t border-[#1c3e5e] flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-emerald-300 truncate">
                      Avanzar a {nextAgeDef.name}
                    </div>
                    <div className="text-[10px] font-mono-num text-amber-300">
                      {formatCost(nextAgeDef.cost)}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={!canAfford(r, nextAgeDef.cost)}
                    onClick={onUpgradeAge}
                    className="min-h-[38px] px-3 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-slate-950 text-xs font-extrabold cursor-pointer shrink-0"
                  >
                    Avanzar Edad
                  </button>
                </div>
              ) : (
                <div className="text-[10px] font-bold text-lime-300">
                  ★ Era Nuclear Máxima alcanzada
                </div>
              )}
            </div>

            <div className="rounded-lg p-3 bg-[#0b1f31] border border-[#1d3e5b] space-y-2">
              <div className="text-xs font-bold text-amber-300">
                Base Isleña, Cuartel y Punto de Control
              </div>
              <div className="text-[11px] text-slate-300">
                {currentIslandName
                  ? `Estás en: ${currentIslandName}.`
                  : 'Desembarca en una isla para construir edificios AoE, murallas y complejos.'}
                {state.hqIslandName && (
                  <span className="block text-emerald-300 font-semibold mt-1">
                    Cuartel establecido en: {state.hqIslandName}
                  </span>
                )}
              </div>

              <div className="pt-2 border-t border-[#173652] flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-wide text-emerald-300 font-bold">
                    Punto de Control Actual
                  </div>
                  <div className="text-[11px] text-slate-200 truncate">
                    {state.checkpoint?.label || 'Fondeadero Inicial'} (Día {state.checkpoint?.savedDay || 1})
                  </div>
                </div>
                <button
                  type="button"
                  disabled={!inShelter && !hasBaseOnCurrentIsland}
                  onClick={onSaveCheckpoint}
                  className="min-h-[38px] inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-[11px] font-bold cursor-pointer shrink-0"
                >
                  <BookmarkCheck className="w-3.5 h-3.5" />
                  <span>Guardar aquí</span>
                </button>
              </div>
            </div>

            {/* Designate HQ Island */}
            <div className="rounded-lg p-3 bg-[#0b1f31] border border-amber-400/50 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                  <Flag className="w-3.5 h-3.5" />
                  <span>Elegir Tu Isla Cuartel</span>
                </div>
                <span className="text-[10px] text-emerald-300 font-semibold">
                  {state.hqIslandId ? 'Traslado libre' : 'Costo HQ: 16 Mad · 12 Cht · 4 Oro'}
                </span>
              </div>
              {discoveredIslands.length > 0 && (
                <div className="space-y-1.5 max-h-32 overflow-y-auto deck-scroll pr-1">
                  {discoveredIslands.map((isl) => {
                    const isCurrentHq = state.hqIslandId === isl.id;
                    const canEstablish = Boolean(state.hqIslandId) || canAfford(r, { mad: 16, cht: 12, oro: 4 });
                    return (
                      <div
                        key={isl.id}
                        className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded border ${
                          isCurrentHq ? 'bg-[#102e2a] border-emerald-400/70' : 'bg-[#071522] border-[#18344d]'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="text-[11px] font-bold text-slate-100 truncate">
                            {isl.name}
                            {currentIslandId === isl.id && <span className="ml-1 text-[10px] text-sky-300">(Aquí)</span>}
                          </div>
                          <div className="text-[10px] text-slate-400 capitalize">Bioma: {isl.biome}</div>
                        </div>
                        {isCurrentHq ? (
                          <span className="text-[10px] font-bold text-emerald-300 shrink-0">Cuartel Actual</span>
                        ) : (
                          <button
                            type="button"
                            disabled={!canEstablish}
                            onClick={() => onDesignateHqIsland(isl.id)}
                            className="px-2 py-1 rounded bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-slate-950 text-[10px] font-bold cursor-pointer shrink-0"
                          >
                            {state.hqIslandId ? 'Mover HQ' : 'Hacer HQ'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* AoE Buildings */}
            <div className="text-xs font-bold text-sky-300 pt-1">
              Edificios de Aldea e Imperio (Age of Empires)
            </div>
            {AOE_BUILDINGS_CATALOG.map((b) => (
              <UpgradeRow
                key={b.kind}
                title={`${b.name} (Edad ${AGE_ROMAN[b.minAge]})`}
                desc={b.description}
                cost={b.cost}
                bag={r}
                forceDisable={!currentIslandName || currentAge < b.minAge}
                buttonLabel={currentAge < b.minAge ? `Edad ${AGE_ROMAN[b.minAge]}` : 'Construir'}
                onClick={() => onBuildOnIsland(b.kind)}
              />
            ))}

            {/* Train AoE Units */}
            {onTrainIslandUnit && (
              <div className="rounded-lg p-3 bg-[#0d2235] border border-cyan-500/40 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-cyan-300">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4" /> Entrenar Unidades Isleñas
                  </span>
                  <span className="font-mono-num">{popStats.pop}/{popStats.popCap}</span>
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  <TradeRow
                    title="Aldeano Recolector (4 Mad · 3 Gui)"
                    disabled={!currentIslandName || popStats.pop >= popStats.popCap || r.mad < 4 || r.gui < 3}
                    onClick={() => onTrainIslandUnit('villager')}
                  />
                  <TradeRow
                    title="Guardia Armado (6 Hie · 4 Oro · Cuartel)"
                    disabled={
                      !currentIslandName ||
                      popStats.pop >= popStats.popCap ||
                      !currentIslandStructures.some((s) => s.kind === 'barracks') ||
                      r.hie < 6 ||
                      r.oro < 4
                    }
                    onClick={() => onTrainIslandUnit('guard')}
                  />
                  <TradeRow
                    title="Barco Patrulla (10 Mad · 6 Hie · 6 Oro · Muelle)"
                    disabled={
                      !currentIslandName ||
                      popStats.pop >= popStats.popCap ||
                      !currentIslandStructures.some((s) => s.kind === 'patrol_dock') ||
                      r.mad < 10 ||
                      r.hie < 6 ||
                      r.oro < 6
                    }
                    onClick={() => onTrainIslandUnit('patrol_ship')}
                  />
                </div>
              </div>
            )}

            {/* Blacksmith Technologies */}
            {onResearchAoeTech && (
              <div className="space-y-1.5 pt-1">
                <div className="text-xs font-bold text-amber-300">
                  Investigaciones de Herrería Imperial
                </div>
                {AOE_TECHS_CATALOG.map((tech) => {
                  const done = state.aoeUpgrades?.includes(tech.id);
                  const canResearch = !done && currentAge >= tech.minAge && canAfford(r, tech.cost);
                  return (
                    <div
                      key={tech.id}
                      className={`rounded-lg p-2.5 border flex items-center justify-between gap-2 ${
                        done ? 'bg-[#102d2a] border-emerald-400/50' : 'bg-[#0b1f31] border-[#1c3b56]'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-100">{tech.name}</div>
                        <div className="text-[10px] text-emerald-300">{tech.bonusText}</div>
                        {!done && (
                          <div className="text-[10px] font-mono-num text-amber-300">
                            Edad {AGE_ROMAN[tech.minAge]} · {formatCost(tech.cost)}
                          </div>
                        )}
                      </div>
                      {done ? (
                        <span className="text-[10px] font-bold text-emerald-300 shrink-0">Completa</span>
                      ) : (
                        <button
                          type="button"
                          disabled={!canResearch}
                          onClick={() => onResearchAoeTech(tech.id)}
                          className="min-h-[36px] px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white text-xs font-bold cursor-pointer shrink-0"
                        >
                          Investigar
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Classic & Strategic Island Structures + Nuclear Chain */}
            <div className="text-xs font-bold text-lime-300 pt-1">
              Defensas, Radio y Complejo Nuclear
            </div>
            <UpgradeRow
              title="Almacén Seguro"
              desc="Protege tus recursos de los ladrones y suma +1 Oro cada día."
              cost={{ mad: 14, cht: 8 }}
              bag={r}
              forceDisable={!currentIslandName}
              buttonLabel="Construir"
              onClick={() => onBuildOnIsland('warehouse')}
            />
            <UpgradeRow
              title="Refugio Seguro (Con HP y Muro)"
              desc="Los enemigos golpean la puerta sin atravesarla y curas dentro."
              cost={{ mad: 12, cht: 6, hie: 4 }}
              bag={r}
              forceDisable={!currentIslandName}
              buttonLabel="Construir"
              onClick={() => onBuildOnIsland('shelter')}
            />
            <UpgradeRow
              title="Torreta de Isla"
              desc="Vigía armado permanente sobre la isla."
              cost={{ mad: 8, cht: 10, oro: 2 }}
              bag={r}
              forceDisable={!currentIslandName}
              buttonLabel="Construir"
              onClick={() => onBuildOnIsland('turret')}
            />
            <UpgradeRow
              title="Extractor de Recursos"
              desc="Extrae madera, carbón, hierro, chatarra o titanio automáticamente."
              cost={{ mad: 10, cht: 12, tit: 1 }}
              bag={r}
              forceDisable={!currentIslandName}
              buttonLabel="Construir"
              onClick={() => onBuildOnIsland('extractor')}
            />
            <UpgradeRow
              title="Antena de Radio Isleña"
              desc="Conecta islas en red de radio y neutraliza interferencias de hackers."
              cost={{ mad: 10, hie: 8, tec: 4 }}
              bag={r}
              forceDisable={!currentIslandName}
              buttonLabel="Construir"
              onClick={() => onBuildOnIsland('radio_antenna')}
            />
            <UpgradeRow
              title="Destilería Isleña"
              desc="Produce Alcohol/Ron periódicamente para abastecer a tu tripulación."
              cost={{ mad: 12, cht: 6, veg: 4 }}
              bag={r}
              forceDisable={!currentIslandName}
              buttonLabel="Construir"
              onClick={() => onBuildOnIsland('distillery')}
            />
            <UpgradeRow
              title="Laboratorio Nuclear"
              desc="Paso 1 de la cadena nuclear. Requiere Edad III+ o tecnología avanzada."
              cost={{ hie: 16, tit: 8, tec: 6, cri: 3 }}
              bag={r}
              forceDisable={!currentIslandName || state.nuclearLabBuilt}
              buttonLabel={state.nuclearLabBuilt ? 'Construido' : 'Construir'}
              onClick={() => onBuildOnIsland('nuclear_lab')}
            />
            <UpgradeRow
              title="Reactor Nuclear"
              desc="Paso 2: enriquece combustible atómico (requiere Laboratorio Nuclear)."
              cost={{ hie: 20, tit: 12, tec: 8, cri: 5, nuc_frag: 3 }}
              bag={r}
              forceDisable={!currentIslandName || !state.nuclearLabBuilt || state.nuclearReactorBuilt}
              buttonLabel={state.nuclearReactorBuilt ? 'Operativo' : 'Construir'}
              onClick={() => onBuildOnIsland('nuclear_reactor')}
            />
            {onCraftRadiationSuit && (
              <div className="rounded-lg p-2.5 bg-[#0b1f31] border border-lime-400/40 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-lime-300">
                    Traje Antirradiación (Paso 3)
                  </div>
                  <div className="text-[11px] text-slate-300">
                    Bloquea 90% de la radiación del reactor y zonas tóxicas.
                  </div>
                  {!state.radiationSuitCrafted && (
                    <div className="text-[10px] font-mono-num text-amber-300">
                      6 Tit · 4 Cri · 4 Tec · 6 Cht
                    </div>
                  )}
                </div>
                {state.radiationSuitCrafted ? (
                  <span className="text-[11px] font-bold text-lime-300 shrink-0">Equipado</span>
                ) : (
                  <button
                    type="button"
                    disabled={!state.nuclearLabBuilt || !canAfford(r, { tit: 6, cri: 4, tec: 4, cht: 6 })}
                    onClick={onCraftRadiationSuit}
                    className="min-h-[38px] px-3 py-1 rounded-lg bg-lime-500 hover:bg-lime-400 disabled:opacity-40 text-slate-950 text-xs font-extrabold cursor-pointer shrink-0"
                  >
                    Fabricar
                  </button>
                )}
              </div>
            )}

            {/* Custom Island Settlements */}
            <div className="rounded-lg p-3 bg-[#0d2235] border border-amber-400/55 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-extrabold text-amber-300">
                  Fundar Pueblo → Reino → Imperio
                </div>
                <span className="text-[10px] font-mono-num text-emerald-300">
                  {allSettlements.length} fundado(s)
                </span>
              </div>
              <div className="space-y-1.5 bg-[#071522]/85 border border-[#1a3a57] rounded-lg p-2">
                <input
                  type="text"
                  maxLength={24}
                  value={settlementNameInput}
                  onChange={(e) => setSettlementNameInput(e.target.value)}
                  placeholder="Nombre del pueblo o reino..."
                  className="w-full min-h-[38px] px-2.5 py-1 rounded bg-[#0a1c2d] border border-[#285073] text-xs text-slate-100"
                />
                <div className="flex items-center gap-1 flex-wrap">
                  {(
                    [
                      ['dorado', 'Dorado', 'bg-amber-400'],
                      ['esmeralda', 'Esmeralda', 'bg-emerald-400'],
                      ['carmesi', 'Carmesí', 'bg-rose-500'],
                      ['cian', 'Cian', 'bg-cyan-400'],
                    ] as const
                  ).map(([id, label, dotClass]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setSettlementBannerInput(id)}
                      className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer border ${
                        settlementBannerInput === id
                          ? 'bg-[#173957] border-amber-300 text-white'
                          : 'bg-[#081726] border-[#1d3e5b] text-slate-300'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${dotClass}`} />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="text-[10px] font-mono-num text-emerald-300">
                    14 Mad · 8 Cht · 3 Veg
                  </span>
                  <button
                    type="button"
                    disabled={!currentIslandName || !canAfford(r, { mad: 14, cht: 8, veg: 3 })}
                    onClick={() =>
                      onFoundSettlement(
                        settlementNameInput.trim() || 'Puerto Ceniza',
                        settlementBannerInput
                      )
                    }
                    className="min-h-[38px] px-3 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-slate-950 text-[11px] font-extrabold cursor-pointer shrink-0"
                  >
                    Fundar Pueblo
                  </button>
                </div>
              </div>

              {currentIslandSettlements.map((st) => {
                const tierName = st.level >= 3 ? 'Imperio' : st.level === 2 ? 'Reino' : 'Pueblo';
                const nextCost =
                  st.level === 1
                    ? { mad: 18, hie: 6, oro: 6 }
                    : st.level === 2
                      ? { hie: 12, tit: 4, cri: 2, oro: 12 }
                      : null;
                return (
                  <div key={st.id} className="rounded-lg p-2 bg-[#071522] border border-[#244a6d] space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-100 truncate">
                        {tierName} {st.customName || 'Sin Nombre'}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-[#122e47] text-[10px] font-bold text-amber-300">
                        Nv.{st.level}
                      </span>
                    </div>
                    {nextCost && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono-num text-amber-200">{formatCost(nextCost)}</span>
                        <button
                          type="button"
                          disabled={!canAfford(r, nextCost)}
                          onClick={() => onUpgradeSettlement(st.id)}
                          className="min-h-[36px] px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-[10px] font-bold cursor-pointer"
                        >
                          {st.level === 1 ? 'Elevar a Reino' : 'Proclamar Imperio'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'clans' && (
          <div className="space-y-2.5">
            {!state.clan.founded ? (
              <div className="rounded-lg p-3 bg-[#0d2235] border border-amber-400/60 space-y-2">
                <div className="text-xs font-bold text-amber-300">Fundar Tu Propio Clan Naval</div>
                <div className="grid grid-cols-3 gap-1.5">
                  <input
                    type="text"
                    maxLength={20}
                    value={clanNameInput}
                    onChange={(e) => setClanNameInput(e.target.value)}
                    placeholder="Nombre del clan"
                    className="col-span-2 min-h-[40px] px-2.5 py-1 rounded bg-[#071522] border border-[#285073] text-xs text-slate-100"
                  />
                  <input
                    type="text"
                    maxLength={5}
                    value={clanTagInput}
                    onChange={(e) => setClanTagInput(e.target.value.toUpperCase())}
                    placeholder="TAG"
                    className="min-h-[40px] px-2.5 py-1 rounded bg-[#071522] border border-[#285073] text-xs text-amber-300 font-mono-num uppercase"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono-num text-emerald-300">6 Mad · 4 Oro · 2 Hie</span>
                  <button
                    type="button"
                    disabled={r.mad < 6 || r.oro < 4 || r.hie < 2}
                    onClick={() => onFoundOrUpgradeClan(clanNameInput, clanTagInput)}
                    className="min-h-[40px] px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-slate-950 text-xs font-bold cursor-pointer"
                  >
                    Fundar Clan
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-lg p-3 bg-[#0d2235] border border-amber-400/70 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-amber-300">
                      [{state.clan.tag}] {state.clan.name}
                    </div>
                    <div className="text-[11px] text-slate-300">
                      Rango Nv.{state.clan.level} · Miembros: {state.clan.members + state.survivors.filter((s) => s.unlocked).length}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={r.oro < 6 + state.clan.level * 3 || r.hie < 4}
                    onClick={() => onFoundOrUpgradeClan()}
                    className="min-h-[38px] px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-slate-950 text-[11px] font-bold cursor-pointer"
                  >
                    Subir Nv. ({6 + state.clan.level * 3} Oro)
                  </button>
                </div>

                <div className="pt-1.5 border-t border-[#1a3a57] space-y-1.5">
                  {CLAN_PERKS_CATALOG.map((pk) => {
                    const owned = state.clan.perks.includes(pk.id);
                    const affordable = canAfford(r, pk.cost);
                    return (
                      <div
                        key={pk.id}
                        className="flex items-center justify-between gap-2 bg-[#071522] border border-[#18344d] rounded px-2.5 py-1.5"
                      >
                        <div className="min-w-0">
                          <div className="text-[11px] font-bold text-slate-100">{pk.name}</div>
                          <div className="text-[10px] text-emerald-300">{pk.desc}</div>
                        </div>
                        {owned ? (
                          <span className="text-[10px] font-bold text-emerald-300">Activo</span>
                        ) : (
                          <button
                            type="button"
                            disabled={!affordable}
                            onClick={() => onUnlockClanPerk(pk.id)}
                            className="min-h-[36px] px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white text-[10px] font-bold cursor-pointer shrink-0"
                          >
                            Activar
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {state.clan.rivals.map((rc) => {
              const status = rc.conquered
                ? 'Sometido'
                : rc.atWar
                  ? 'En Guerra'
                  : rc.relation >= 35
                    ? 'Aliado'
                    : rc.relation <= -30
                      ? 'Hostil'
                      : 'Neutral';

              return (
                <div key={rc.id} className="rounded-lg p-2.5 bg-[#0b1f31] border border-[#1d3e5b]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold" style={{ color: rc.color }}>
                      [{rc.tag}] {rc.name}
                    </span>
                    <span className="text-[10px] font-mono-num text-slate-200 font-bold">
                      {status} · Poder {rc.power}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300 mt-0.5">{rc.specialty}</div>
                  {!rc.conquered && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        disabled={r.oro < 3}
                        onClick={() => onClanAction(rc.id, 'gift')}
                        className="min-h-[36px] px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-[11px] font-bold text-white cursor-pointer"
                      >
                        Tributo (3 Oro)
                      </button>
                      {rc.atWar ? (
                        <button
                          type="button"
                          disabled={r.oro < 7}
                          onClick={() => onClanAction(rc.id, 'peace')}
                          className="min-h-[36px] px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-[11px] font-bold text-white cursor-pointer"
                        >
                          Tregua (7 Oro)
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={!state.clan.founded}
                          onClick={() => onClanAction(rc.id, 'war')}
                          className="min-h-[36px] px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-[11px] font-bold text-white cursor-pointer"
                        >
                          Guerra de Clanes
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab === 'farm' && (
          <div className="space-y-3">
            <div className="rounded-lg p-2.5 bg-[#0d2235] border border-emerald-500/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-lime-300">
                  Despensa Verde ({r.veg} Cultivos)
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  disabled={r.veg <= 0 || (state.hp >= state.maxHp && state.st >= state.maxSt)}
                  onClick={onEatVeg}
                  className="min-h-[40px] px-2 py-1.5 rounded bg-lime-600 hover:bg-lime-500 disabled:opacity-40 text-white text-[11px] font-bold cursor-pointer"
                >
                  Comer 1 Veg (+22 HP/ST)
                </button>
                <button
                  type="button"
                  disabled={r.veg < 2 || r.pez < 1}
                  onClick={onCookGreenStew}
                  className="min-h-[40px] px-2 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-[11px] font-bold cursor-pointer"
                >
                  2 Veg + 1 Pez → +1 Guiso
                </button>
              </div>
            </div>

            <div className="rounded-lg p-2.5 bg-[#0b1f31] border border-[#1d3e5b] space-y-2">
              <div className="text-xs font-bold text-amber-300">
                Huertos de Cultivo ({raftPlotsCount}/4 Balsa)
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  disabled={raftPlotsCount >= 4 || r.mad < 4 || r.agu < 2}
                  onClick={() => onBuildFarmPlot('raft')}
                  className="min-h-[40px] px-2 py-1.5 rounded bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-slate-950 text-[11px] font-bold cursor-pointer"
                >
                  Huerto Balsa (4 Mad · 2 Agu)
                </button>
                <button
                  type="button"
                  disabled={!currentIslandName || r.mad < 4 || r.agu < 2}
                  onClick={() => onBuildFarmPlot('island')}
                  className="min-h-[40px] px-2 py-1.5 rounded bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white text-[11px] font-bold cursor-pointer"
                >
                  Huerto Isla (4 Mad · 2 Agu)
                </button>
              </div>

              <div className="grid grid-cols-2 gap-1">
                {CROPS_CATALOG.map((crop) => (
                  <button
                    key={crop.id}
                    type="button"
                    onClick={() => setSelectedCrop(crop.id)}
                    className={`px-2 py-1.5 rounded border text-left text-[10px] cursor-pointer ${
                      selectedCrop === crop.id
                        ? 'bg-[#143752] border-amber-400 text-amber-200 font-bold'
                        : 'bg-[#071522] border-[#18344d] text-slate-300'
                    }`}
                  >
                    <div>{crop.name}</div>
                    <div className="text-[9px] text-emerald-300">
                      {formatCost(crop.seedCost)} → +{crop.yieldVeg} Veg
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {state.farmPlots.map((plot, idx) => {
              const cropDef = plot.crop ? CROPS_CATALOG.find((c) => c.id === plot.crop) : null;
              const chosenCrop = CROPS_CATALOG.find((c) => c.id === selectedCrop)!;
              const canPlant = canAfford(r, chosenCrop.seedCost);
              return (
                <div
                  key={plot.id}
                  className="rounded-lg p-2.5 bg-[#0b1f31] border border-[#1d3e5b] flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-100">
                      Parcela #{idx + 1} · {plot.location === 'raft' ? 'En Navío' : 'En Isla'}
                    </div>
                    {cropDef ? (
                      <div className="text-[11px] text-emerald-300">
                        {cropDef.name} · {Math.min(100, Math.round(plot.growth))}%
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400">Lista para sembrar</div>
                    )}
                  </div>
                  {!plot.crop ? (
                    <button
                      type="button"
                      disabled={!canPlant}
                      onClick={() => onPlantCrop(plot.id, selectedCrop)}
                      className="min-h-[38px] px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-[11px] font-bold cursor-pointer shrink-0"
                    >
                      Sembrar
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={plot.watered || r.agu < 1}
                      onClick={() => onWaterPlot(plot.id)}
                      className="min-h-[38px] px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white text-[11px] font-bold cursor-pointer shrink-0"
                    >
                      {plot.watered ? 'Regado' : 'Regar (1 Agu)'}
                    </button>
                  )}
                </div>
              );
            })}

            <div className="pt-2 border-t border-[#193852] space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-amber-300">Corral Visible</span>
                <span className="font-mono-num text-[10px] font-bold text-sky-300">
                  Navío {raftAnimalsCount}/{raftCorralLimit} · Isla {islandAnimalsCount}/{islandCorralLimit}
                </span>
              </div>
              {state.captiveAnimals.map((cap) => {
                const info = ANIMAL_RANCH_INFO[cap.kind];
                const pct = Math.min(100, Math.round((cap.prodTimer / cap.prodInterval) * 100));
                const locCount =
                  cap.location === 'raft'
                    ? raftAnimalsCount
                    : state.captiveAnimals.filter(
                        (a) => a.location === 'island' && a.islandId === cap.islandId
                      ).length;
                const locLimit =
                  cap.location === 'raft'
                    ? raftCorralLimit
                    : getIslandCorralLimit(state, cap.islandId);
                return (
                  <div
                    key={cap.id}
                    className="rounded-lg p-2.5 bg-[#0b1f31] border border-[#1d3e5b] space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-100">
                        {cap.name} · Nv.{cap.level}
                      </span>
                      <span className="text-[10px] font-mono-num text-emerald-300">
                        +{info.yieldAmt + (cap.level - 1)} {info.yieldKey.toUpperCase()} ({pct}%)
                      </span>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        disabled={r.veg < 1}
                        onClick={() => onFeedCaptiveAnimal(cap.id)}
                        className="flex-1 min-h-[38px] px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-[10px] font-bold cursor-pointer"
                      >
                        Alimentar (1 Veg)
                      </button>
                      <button
                        type="button"
                        disabled={locCount >= locLimit || r.veg < 2 || r.agu < 2}
                        onClick={() => onBreedCaptiveAnimal(cap.id)}
                        className="flex-1 min-h-[38px] px-2 py-1 rounded bg-pink-600 hover:bg-pink-500 disabled:opacity-40 text-white text-[10px] font-bold cursor-pointer"
                      >
                        {locCount >= locLimit ? 'Lleno' : 'Criar (2 Veg · 2 Agu)'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'kingdoms' && (
          <div className="space-y-2.5">
            {nearbyVillage && !nearbyVillage.depleted && (
              <div className="rounded-lg p-3 bg-[#132c42] border border-amber-400">
                <div className="text-xs font-bold text-amber-300">
                  Pueblo Cercano: {nearbyVillage.villageName}
                </div>
                <div className="text-[11px] text-slate-200 mt-0.5">
                  Si decides saquearlo, toda tu tripulación bajará a robar y hacer de las suyas.
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => onVillageAction(nearbyVillage, 'trade')}
                    className="flex-1 min-h-[40px] px-2.5 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white cursor-pointer"
                  >
                    Comerciar
                  </button>
                  <button
                    type="button"
                    onClick={() => onVillageAction(nearbyVillage, 'pillage')}
                    className="flex-1 min-h-[40px] px-2.5 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white cursor-pointer"
                  >
                    ¡Saquear con Tripulación!
                  </button>
                </div>
              </div>
            )}

            {KINGDOMS_CATALOG.map((kd) => {
              const kState = state.kingdoms.find((x) => x.id === kd.id);
              const rel = kState?.relation ?? 0;
              const statusText = kState?.conquered
                ? 'Conquistado'
                : kState?.atWar
                  ? 'En Guerra'
                  : rel >= 40
                    ? 'Aliado'
                    : rel >= 10
                      ? 'Amigo'
                      : rel <= -30
                        ? 'Enemigo'
                        : 'Neutral';

              return (
                <div key={kd.id} className="rounded-lg p-2.5 bg-[#0b1f31] border border-[#1d3e5b]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold" style={{ color: kd.color }}>
                      {kd.name}
                    </span>
                    <span className="text-[10px] font-mono-num font-bold text-slate-200">
                      {statusText} ({rel})
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300 mt-1">{kd.description}</div>

                  {!kState?.conquered && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        disabled={r.oro < 3}
                        onClick={() => onKingdomAction(kd.id, 'gift')}
                        className="min-h-[36px] px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-[11px] font-bold text-white cursor-pointer"
                      >
                        Regalo (3 Oro)
                      </button>
                      {kState?.atWar ? (
                        <button
                          type="button"
                          disabled={r.oro < 8}
                          onClick={() => onKingdomAction(kd.id, 'peace')}
                          className="min-h-[36px] px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-[11px] font-bold text-white cursor-pointer"
                        >
                          Firmar Paz (8 Oro)
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={!state.hqIslandId}
                          onClick={() => onDeclareIslandWar(kd.id)}
                          className="min-h-[36px] px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-[11px] font-bold text-white cursor-pointer"
                        >
                          Guerra de Islas
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab === 'trade' && (
          <div className="space-y-2">
            <TradeRow title="Vender 6 Madera → +3 Oro" disabled={r.mad < 6} onClick={() => onTrade('sell_mad')} />
            <TradeRow title="Vender 4 Pez → +3 Oro" disabled={r.pez < 4} onClick={() => onTrade('sell_pez')} />
            <TradeRow title="Vender 5 Carbón → +4 Oro" disabled={r.car < 5} onClick={() => onTrade('sell_car')} />
            <TradeRow title="Comprar 5 Madera ← 3 Oro" disabled={r.oro < 3} onClick={() => onTrade('buy_mad')} />
            <TradeRow title="Comprar 4 Chatarra ← 3 Oro" disabled={r.oro < 3} onClick={() => onTrade('buy_cht')} />
            <TradeRow title="Comprar 4 Agua ← 2 Oro" disabled={r.oro < 2} onClick={() => onTrade('buy_agu')} />
            <TradeRow title="Comprar 4 Hierro ← 4 Oro" disabled={r.oro < 4} onClick={() => onTrade('buy_hie')} />
            <TradeRow title="Comprar 2 Titanio ← 7 Oro" disabled={r.oro < 7} onClick={() => onTrade('buy_tit')} />
            <TradeRow title="Comprar 1 Pieza Tech ← 6 Oro" disabled={r.oro < 6} onClick={() => onTrade('buy_tec')} />
            <TradeRow title="Comprar Incienso Sigilo ← 4 Oro" disabled={r.oro < 4} onClick={() => onTrade('buy_repelente')} />
            <TradeRow title="Comprar Saco Descanso ← 5 Oro" disabled={r.oro < 5} onClick={() => onTrade('buy_hamaca')} />
          </div>
        )}

        {tab === 'crew' && (
          <div className="space-y-3">
            <div className="rounded-lg p-2.5 bg-[#0d2235] border border-[#1f415e] text-[11px] text-slate-300">
              Tu tripulación desembarca en las islas contigo para buscar provisiones, disfrutar sus gustos y saquear pueblos si así lo ordenas.
            </div>

            {SURVIVORS_CATALOG.map((def) => {
              const st = state.survivors.find((s) => s.id === def.id);
              const unlocked = Boolean(st?.unlocked);
              const level = st?.level || 1;
              const cost: Partial<ResourceBag> = unlocked
                ? { mad: 10 + level * 5, oro: 4 + level * 2, tit: level >= 3 ? 2 : 0 }
                : def.recruitCost;
              const affordable = canAfford(r, cost);
              const npcMood = getNpcMoodState(state, def.id);
              const moodMeta = MOOD_META[npcMood.mood] || MOOD_META.equilibrio;
              const history = state.npcChatHistory?.[def.id] || [];
              const showHist = expandedHistoryNpcId === def.id;

              return (
                <div key={def.id} className="rounded-lg p-3 bg-[#0b1f31] border border-[#1d3e5b] space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                          style={{ backgroundColor: def.color }}
                        />
                        <span className="text-xs font-bold text-slate-100 truncate">{def.name}</span>
                        {unlocked && (
                          <>
                            <span className="font-mono-num text-[11px] text-amber-300 font-bold shrink-0">
                              Nv.{level}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded border text-[9.5px] font-bold ${moodMeta.bgClass} ${moodMeta.borderClass} ${moodMeta.textClass}`}
                            >
                              {moodMeta.shortLabel}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="text-[10px] font-semibold text-amber-300 mt-0.5">
                        {def.role} · Fuerza: {def.strengthLabel}
                      </div>
                      <div className="text-[11px] text-slate-300 mt-0.5">{def.personality}</div>
                      <div className="text-[10px] text-emerald-300 mt-0.5">{def.uniqueSkillDesc}</div>
                    </div>
                    <div className="flex flex-col gap-1.5 shrink-0">
                      <button
                        type="button"
                        disabled={!affordable}
                        onClick={() => onRecruitOrUpgradeSurvivor(def.id)}
                        className="min-h-[38px] px-2.5 py-1 rounded bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-slate-950 text-xs font-bold whitespace-nowrap cursor-pointer"
                      >
                        {unlocked ? 'Mejorar' : 'Reclutar'}
                      </button>
                      {unlocked && (
                        <button
                          type="button"
                          onClick={() => onTalkToNpc(def.id)}
                          className="min-h-[38px] px-2.5 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-400/50 text-cyan-200 text-[11px] font-bold whitespace-nowrap cursor-pointer inline-flex items-center justify-center gap-1"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Hablar</span>
                        </button>
                      )}
                      {history.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setExpandedHistoryNpcId(showHist ? null : def.id)}
                          className="min-h-[32px] px-2 py-0.5 rounded bg-[#071522] border border-[#244c70] text-[10px] font-bold text-amber-200 inline-flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <History className="w-3 h-3" />
                          <span>Historial ({history.length})</span>
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="text-[10px] font-mono-num text-emerald-300">
                    Costo: {formatCost(cost)}
                  </div>
                  {showHist && history.length > 0 && (
                    <div className="rounded bg-[#06131f] border border-[#1a3a57] p-2 max-h-32 overflow-y-auto deck-scroll space-y-1">
                      {history.slice(-10).map((entry, idx) => (
                        <div key={idx} className="text-[10px] text-slate-300">
                          <b className="text-sky-300">{entry.name}:</b> {entry.text}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Discovered World NPCs Directory (Armero, Forjador, Mercader, Alquimista, Cartógrafo, Chatarrero) */}
            <div className="pt-2 border-t border-[#193852] space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                <Compass className="w-4 h-4" />
                <span>NPCs Especialistas del Mundo ({state.discoveredWorldNpcs?.length || 0})</span>
              </div>
              {(!state.discoveredWorldNpcs || state.discoveredWorldNpcs.length === 0) ? (
                <div className="rounded-lg p-2.5 bg-[#071522] border border-[#18344d] text-[11px] text-slate-400">
                  Explora islas o visita el Pontón Forja del Alba en (360, -250) para descubrir Armeros, Forjadores, Mercaderes, Alquimistas, Cartógrafos y Chatarreros.
                </div>
              ) : (
                state.discoveredWorldNpcs.map((npc) => (
                  <div
                    key={npc.id}
                    className="rounded-lg p-2.5 bg-[#0b1f31] border border-[#214769] flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-100 truncate">
                        {npc.name} · <span className="text-amber-300 uppercase text-[10px]">{npc.role}</span>
                      </div>
                      <div className="text-[10px] text-sky-300 font-mono-num">
                        {npc.islandName} · ({Math.round(npc.x)}, {Math.round(npc.y)})
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onTalkToNpc(npc.id)}
                      className="min-h-[36px] px-2.5 py-1 rounded bg-[#102940] hover:bg-[#173b5c] border border-[#2a557c] text-[10px] font-bold text-cyan-200 cursor-pointer shrink-0"
                    >
                      Conversar
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {tab === 'family' && (
          <div className="space-y-3">
            {state.donorUnlocked && (
              <div className="rounded-lg bg-amber-500/10 border border-amber-400/45 p-2.5 flex items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-bold text-amber-300">Aspecto Exclusivo de Mecenas</div>
                  <div className="text-[10px] text-slate-300">Cambia tu apariencia a dorado real.</div>
                </div>
                <button
                  type="button"
                  onClick={onToggleDonorSkin}
                  className={`min-h-[38px] px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer shrink-0 ${
                    state.donorSkinEnabled
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-[#122e47] text-slate-200 border border-[#285378]'
                  }`}
                >
                  {state.donorSkinEnabled ? 'Activo' : 'Activar'}
                </button>
              </div>
            )}

            <div className="space-y-1.5">
              <div className="text-xs font-bold text-amber-300">Títulos Épicos y Legendarios</div>
              {TITLES_CATALOG.map((tt) => {
                const unlocked = state.unlockedTitles.includes(tt.id);
                const active = state.activeTitleId === tt.id;
                return (
                  <div
                    key={tt.id}
                    className={`rounded-lg p-2 border flex items-center justify-between gap-2 ${
                      active
                        ? 'bg-[#172c44] border-amber-400'
                        : unlocked
                          ? 'bg-[#0b1f31] border-[#264b6b]'
                          : 'bg-[#071522] border-[#13293d] opacity-65'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-bold uppercase ${
                            tt.tier === 'legendario'
                              ? 'text-amber-300'
                              : tt.tier === 'epico'
                                ? 'text-purple-300'
                                : 'text-sky-300'
                          }`}
                        >
                          [{tt.tier}]
                        </span>
                        <span className="text-xs font-bold text-slate-100 truncate">{tt.name}</span>
                      </div>
                      <div className="text-[10px] text-emerald-300 mt-0.5">{tt.bonusText}</div>
                      {!unlocked && <div className="text-[10px] text-slate-400">{tt.requirementText}</div>}
                    </div>
                    {unlocked && (
                      <button
                        type="button"
                        onClick={() => onSelectTitle(tt.id)}
                        className={`min-h-[36px] px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer shrink-0 ${
                          active ? 'bg-amber-400 text-slate-950' : 'bg-[#163a57] text-sky-200'
                        }`}
                      >
                        {active ? 'Activo' : 'Usar'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="space-y-2 pt-2 border-t border-[#193852]">
              <div className="text-xs font-bold text-pink-300">
                Pareja Visible en el Cartel / Pueblo e Hijos en Misiones
              </div>

              {state.family.married && state.family.partnerId && (
                <div className="rounded-lg p-2.5 bg-[#1b1b36] border border-pink-400/60">
                  <div className="text-xs font-bold text-pink-200">
                    Casado/a con:{' '}
                    {ROMANCE_CANDIDATES.find((c) => c.id === state.family.partnerId)?.name}
                  </div>
                  <div className="text-[11px] text-slate-300 mt-0.5">
                    Hijos visibles: {state.family.children.length}/4 (+10 HP máx cada hijo)
                  </div>
                  <button
                    type="button"
                    disabled={state.family.children.length >= 4 || r.gui < 1 || r.oro < 4}
                    onClick={onHaveChild}
                    className="mt-2 min-h-[40px] px-3 py-1.5 rounded bg-pink-600 hover:bg-pink-500 disabled:opacity-40 text-xs font-bold text-white cursor-pointer"
                  >
                    Tener Hijo (1 Guiso · 4 Oro)
                  </button>
                </div>
              )}

              {state.family.children.map((child) => {
                const mission = child.activeMission;
                return (
                  <div
                    key={child.id}
                    className="rounded-lg px-3 py-2.5 bg-[#0b1f31] border border-pink-400/40 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-pink-200">
                          {child.name} ({child.stage})
                        </div>
                        <div className="text-[10px] text-slate-300">Rasgo: {child.trait}</div>
                      </div>
                      <span className="text-[10px] text-emerald-300 font-semibold">+10 HP</span>
                    </div>

                    {mission ? (
                      <div className="rounded bg-[#071522] border border-cyan-500/35 px-2.5 py-1.5 text-[10px] text-cyan-200">
                        En misión ({mission.kind}): <b>{mission.targetName}</b> ·{' '}
                        <span className="font-mono-num">{Math.ceil(mission.remainingSec)}s</span>
                      </div>
                    ) : (
                      onSendChildMission && (
                        <div className="grid grid-cols-3 gap-1">
                          <button
                            type="button"
                            onClick={() => onSendChildMission(child.id, 'explore')}
                            className="min-h-[34px] px-2 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-bold cursor-pointer"
                          >
                            Explorar
                          </button>
                          <button
                            type="button"
                            onClick={() => onSendChildMission(child.id, 'trade')}
                            className="min-h-[34px] px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold cursor-pointer"
                          >
                            Comercio
                          </button>
                          <button
                            type="button"
                            onClick={() => onSendChildMission(child.id, 'raid')}
                            className="min-h-[34px] px-2 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold cursor-pointer"
                          >
                            Guerra
                          </button>
                        </div>
                      )
                    )}
                  </div>
                );
              })}

              {ROMANCE_CANDIDATES.map((cand) => {
                const aff = state.family.affection[cand.id] || 0;
                const isPartner = state.family.partnerId === cand.id;
                const canGift = canAfford(r, cand.giftCost);

                return (
                  <div
                    key={cand.id}
                    className="rounded-lg p-2.5 bg-[#0b1f31] border border-[#1d3e5b]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold" style={{ color: cand.color }}>
                        {cand.name}
                      </span>
                      <span className="text-[10px] font-mono-num text-pink-300">
                        Afecto: {aff}/100
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400">{cand.role} · {cand.location}</div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono-num text-emerald-300">
                        Regalo: {formatCost(cand.giftCost)}
                      </span>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          disabled={!canGift}
                          onClick={() => onRomanceAction(cand.id, 'court')}
                          className="min-h-[36px] px-2.5 py-1 rounded bg-pink-600 hover:bg-pink-500 disabled:opacity-40 text-[11px] font-bold text-white cursor-pointer"
                        >
                          Cortejar
                        </button>
                        {aff >= 60 && !state.family.married && (
                          <button
                            type="button"
                            onClick={() => onRomanceAction(cand.id, 'marry')}
                            className="min-h-[36px] px-2.5 py-1 rounded bg-amber-400 hover:bg-amber-300 text-[11px] font-bold text-slate-950 cursor-pointer"
                          >
                            Casarse
                          </button>
                        )}
                        {isPartner && (
                          <span className="text-[11px] font-bold text-amber-300 self-center">
                            Pareja
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'relics' && (
          <div className="space-y-2.5">
            <div className="rounded-lg p-2.5 bg-[#0d2235] border border-[#1f415e] text-xs text-slate-300">
              <b className="text-amber-300">Reliquias del Mundo Antiguo:</b> Equipadas:{' '}
              <b className="font-mono-num text-sky-300">{state.equippedRelics.length}/3</b>
            </div>

            {RELICS_CATALOG.map((rel) => {
              const owned = state.relicsOwned.includes(rel.id);
              const equipped = state.equippedRelics.includes(rel.id);
              const rankCol = getRelicRankColor(rel.rank);

              return (
                <div
                  key={rel.id}
                  className={`rounded-lg p-2.5 border ${
                    equipped
                      ? 'bg-[#172c44] border-amber-400'
                      : owned
                        ? 'bg-[#0b1f31] border-[#264b6b]'
                        : 'bg-[#071522] border-[#13293d] opacity-65'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="font-mono-num text-[11px] font-extrabold px-1.5 py-0.5 rounded bg-[#040d16]"
                          style={{ color: rankCol }}
                        >
                          {rel.rank}
                        </span>
                        <span className="text-xs font-bold text-slate-100 truncate">
                          {owned ? rel.name : 'Reliquia Desconocida'}
                        </span>
                      </div>
                      <div className="text-[11px] text-emerald-300 font-medium mt-1">
                        {owned ? rel.utility : 'Encuéntrala en cofres de islas o jefes abisales.'}
                      </div>
                    </div>

                    {owned && (
                      <button
                        type="button"
                        onClick={() => onToggleRelic(rel.id)}
                        className={`min-h-[38px] px-2.5 py-1.5 rounded text-xs font-bold whitespace-nowrap cursor-pointer shrink-0 ${
                          equipped
                            ? 'bg-amber-400 text-slate-950'
                            : 'bg-[#163a57] hover:bg-[#1e4d73] text-sky-200'
                        }`}
                      >
                        {equipped ? 'Equipada' : 'Equipar'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'achievements' && (
          <div className="space-y-2">
            {ACHIEVEMENTS_CATALOG.map((ach) => {
              const unlocked = state.achievementsUnlocked.includes(ach.id);
              const current =
                ach.statKey === 'weaponsOwned'
                  ? state.ownedWeapons.length
                  : ach.statKey === 'destinyUnlocked'
                    ? state.destinyUnlocked.length
                    : ach.statKey === 'level'
                      ? state.level
                      : ach.statKey === 'dayCount'
                        ? state.dayCount
                        : ach.statKey === 'bountyMillions'
                          ? Math.floor(state.bounty / 1000000)
                          : ach.statKey === 'nuclearShieldReady'
                            ? state.warshipNuclearShield
                              ? 1
                              : 0
                            : state.stats[ach.statKey];

              return (
                <div
                  key={ach.id}
                  className={`rounded-lg p-2.5 border ${
                    unlocked
                      ? 'bg-[#122e2b] border-emerald-500/50'
                      : 'bg-[#0b1f31] border-[#1c3b56]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-amber-300">{ach.title}</span>
                    <span className="font-mono-num text-[11px] text-slate-300">
                      {Math.min(current, ach.target)}/{ach.target}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300 mt-0.5">{ach.description}</div>
                  <div className="text-[10px] font-semibold text-emerald-300 mt-1">
                    {unlocked ? 'Desbloqueado · ' : 'Recompensa: '}
                    {ach.rewardText}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="px-3 py-2 bg-[#0a1d2e] border-t border-[#193852] text-[11px] text-slate-300 flex items-center justify-between">
        <span>En mano:</span>
        <span className="font-semibold text-amber-300 truncate max-w-[200px]">
          {WEAPON_MAP[state.hotbar[state.equippedSlot]]?.name || 'Ninguna'}
        </span>
      </div>
    </aside>
  );
}

function UpgradeRow({
  title,
  desc,
  cost,
  bag,
  forceDisable = false,
  buttonLabel = 'Mejorar',
  onClick,
}: {
  title: string;
  desc: string;
  cost: Partial<ResourceBag>;
  bag: ResourceBag;
  forceDisable?: boolean;
  buttonLabel?: string;
  onClick: () => void;
}) {
  const affordable = !forceDisable && canAfford(bag, cost);
  return (
    <div className="rounded-lg p-2.5 bg-[#0b1f31] border border-[#1c3b56] flex items-center justify-between gap-2">
      <div className="min-w-0">
        <div className="text-xs font-bold text-amber-300">{title}</div>
        <div className="text-[11px] text-slate-300">{desc}</div>
        <div className="text-[10px] font-mono-num text-emerald-300 mt-1">
          {formatCost(cost)}
        </div>
      </div>
      <button
        type="button"
        disabled={!affordable}
        onClick={onClick}
        className="min-h-[40px] px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-slate-950 text-xs font-bold whitespace-nowrap cursor-pointer shrink-0"
      >
        {buttonLabel}
      </button>
    </div>
  );
}

function TradeRow({
  title,
  disabled,
  onClick,
}: {
  title: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <div className="rounded-lg px-3 py-2 bg-[#0b1f31] border border-[#1c3b56] flex items-center justify-between gap-2">
      <span className="text-xs font-semibold text-slate-100">{title}</span>
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className="min-h-[38px] px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white text-xs font-bold cursor-pointer shrink-0"
      >
        Canjear
      </button>
    </div>
  );
}

export type { ResourceKey };
