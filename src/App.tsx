import {
  Anchor,
  ArrowRight,
  Backpack,
  ChevronDown,
  ChevronUp,
  Compass,
  Droplets,
  EyeOff,
  Flame,
  Hand,
  Leaf,
  MessageCircle,
  Moon,
  Newspaper,
  Shield,
  Sprout,
  Store,
  Swords,
  Users,
  Utensils,
  Wrench,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccountModal } from './components/AccountModal';
import { CreditsModal } from './components/CreditsModal';
import { DestinyTreeModal } from './components/DestinyTreeModal';
import { DonationModal } from './components/DonationModal';
import { GameOverlay } from './components/GameOverlay';
import { HudBar, type HudLayoutMode } from './components/HudBar';
import { InstallAppModal } from './components/InstallAppModal';
import { NewspaperModal } from './components/NewspaperModal';
import { NpcChatModal } from './components/NpcChatModal';
import { NpcMerchantModal, type WorldNpcTradeAction } from './components/NpcMerchantModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PausedDialogueOverlay } from './components/PausedDialogueOverlay';
import { ProfileLeaderboardModal } from './components/ProfileLeaderboardModal';
import { SettingsModal } from './components/SettingsModal';
import { SlideDrawer, type TradeAction } from './components/SlideDrawer';
import { StoryDilemmaPopup, StoryMissionsModal } from './components/StoryMissionsModal';
import { TutorialGuideCard } from './components/TutorialGuideCard';
import { VirtualJoystick } from './components/VirtualJoystick';
import { WeaponIcon } from './components/WeaponIcon';
import { WorldMapModal } from './components/WorldMapModal';
import { useBackStack } from './hooks/useBackStack';
import { useFullscreen } from './hooks/useFullscreen';
import { sfx } from './game/audio';
import {
  AOE_AGES_CATALOG,
  AOE_BUILDINGS_CATALOG,
  AOE_TECHS_CATALOG,
  DEFAULT_GAME_SETTINGS,
  WARSHIP_PASSIVES_CATALOG,
  buildDeathCauseRecord,
  canAfford,
  canFireNuclearWeapon,
  canUnlockDestinyNode,
  clearSavedState,
  computeEffectiveMaxHp,
  computeEffectiveMaxStamina,
  computeMeleeMultiplier,
  computePlayerBounty,
  computeRaftMaxHp,
  computeRaftSpeed,
  computeRangedMultiplier,
  computeSurvivalScore,
  getDifficultyModifiers,
  getIslandCorralLimit,
  getPopulationStats,
  getRaftCorralLimit,
  getRaftHalfSize,
  getRelicTotals,
  getRemainingLives,
  getSurvivorLevel,
  hasDestiny,
  hasSavedProgress,
  hasWarshipPassive,
  initState,
  loadState,
  logWorldEvent,
  mergeLoadedState,
  saveDonorUnlocked,
  saveProfile,
  saveState,
  spendResources,
} from './game/constants';
import { t } from './game/i18n';
import { useGamepad } from './game/useGamepad';
import {
  areFactionsHostile,
  computePirateHumanAi,
  computeSeaMonsterAi,
  computeWildlifeMonsterAi,
  evaluateCrewHumanAi,
  findHostileFactionEnemyTarget,
  getEnemyFaction,
  resolveIslandFactionAccessForEnemy,
} from './game/entityAi';
import {
  MOOD_META,
  applyDrinkWater,
  applyEatStewToVitals,
  applyEatVegToVitals,
  applySleepToVitals,
  computeVitalPerformanceModifiers,
  registerCombatActionIntensity,
  registerCombatVictoryMood,
  registerPlayerDamageMood,
  tickPlayerNeeds,
  tryAutoConsumeVitals,
} from './game/needsAndPsychology';
import {
  advanceNpcConversationAfterReply,
  appendNpcChatHistory,
  chooseNpcDialogueOption,
  getNpcMoodState,
  getRichNpcAmbientDialogue,
  requestAiAmbientBanter,
  requestAiDeathRoast,
  requestAiNpcTurn,
  shiftWorldNpcMoods,
  startNpcConversation,
  type NpcConversationSession,
  type PausedDialogueLine,
  type WorldDialogueContext,
} from './game/npcConversations';
import { getPlayerSituationalThought } from './game/playerMonologues';
import { STORY_MISSIONS_CATALOG, STORY_MISSION_MAP } from './game/storyMissions';
import {
  ACHIEVEMENTS_CATALOG,
  BANDIT_COMIC_LINES,
  COMIC_EVENT_LINES,
  DESTINY_MAP,
  OLD_WORLD_FACTS,
  SURVIVORS_CATALOG,
} from './game/destinyTree';
import { getRelicRankColor, rollOldWorldRelic } from './game/relics';
import { renderTopDownWorld } from './game/renderer';
import {
  ANIMAL_RANCH_INFO,
  CHILD_NAMES,
  CHILD_QUOTES,
  CHILD_TRAITS,
  CLAN_PERKS_CATALOG,
  CROPS_CATALOG,
  KINGDOMS_CATALOG,
  ROMANCE_CANDIDATES,
  TECH_PIECES_CATALOG,
  TITLE_MAP,
  WORLD_GOV_DECREES,
  generateDailyNewsArticles,
  getMarineWantedLevel,
  getShipClassName,
  requestAiNewspaperArticles,
} from './game/socialAndKingdoms';
import type {
  AnimalEntity,
  ComicBubble,
  CompoundWallSegment,
  CropKind,
  DevilFruitKind,
  DifficultyLevel,
  DrawerTab,
  EnemyEntity,
  EnemyKind,
  ExplosionFx,
  FloatingDrop,
  FloatingPopup,
  GameMode,
  GameSettings,
  IntroCutsceneState,
  IslandEntity,
  IslandNode,
  IslandStructure,
  IslandUnit,
  LeaderboardEntry,
  PersistentState,
  PlayerEntity,
  ProjectileEntity,
  RaftEntity,
  RandomEventKind,
  RandomEventState,
  RescueBoatEntity,
  ResourceBag,
  ResourceKey,
  SlashFx,
  SplashFx,
  StoryMissionId,
  SurvivorId,
  WarEventState,
  WeaponDef,
  WeatherType,
  WorldNpcEntity,
} from './game/types';
import { RARE_ISLAND_WEAPONS, WEAPON_MAP, getRarityColor, getWeaponUnlockStatus, isNpcForgedRarity, rollWeaponFragmentDrop } from './game/weapons';
import {
  CHUNK_SIZE,
  MYSTERY_MAP,
  WORLD_MYSTERIES_CATALOG,
  generateChunkIsland,
  generateIslandWorldNpcs,
  getChunkCoords,
  getDistanceTierInfo,
  getIslandFactionControl,
  getPirateRankInfo,
  getStarterBargeWorldNpc,
  getStarterDawnforgeGatePos,
  isDangerousOceanAt,
  isPointInSafeZoneIsland,
  pointInIsland,
  resolveIslandBoundary,
  resolveRaftBoatCollision,
} from './game/worldGen';

let eid = 1;

function resolveSolidStructureCollision(
  entityX: number,
  entityY: number,
  entityRadius: number,
  structures: IslandStructure[],
  ageTier: number
): { x: number; y: number; collided: boolean; hitStructure?: IslandStructure } {
  let x = entityX;
  let y = entityY;
  let collided = false;
  let hitStructure: IslandStructure | undefined;

  for (const st of structures) {
    if ((st.hp ?? 100) <= 0) continue;
    let hw = 0;
    let hh = 0;
    let hasSouthDoor = false;

    if (st.kind === 'shelter') {
      hw = 32;
      hh = 24;
      hasSouthDoor = true;
    } else if (st.kind === 'hq') {
      hw = 38;
      hh = 28;
      hasSouthDoor = true;
    } else if (st.kind === 'nuclear_bunker') {
      hw = 44;
      hh = 32;
      hasSouthDoor = true;
    } else if (st.kind === 'settlement') {
      const lv = Math.max(1, st.level || 1);
      hw = lv >= 3 ? 42 : lv === 2 ? 32 : 24;
      hh = lv >= 3 ? 32 : lv === 2 ? 24 : 20;
      hasSouthDoor = true;
    } else if (st.kind === 'wall') {
      hw = 28;
      hh = 14;
    } else if (st.kind === 'house') {
      hw = 22;
      hh = 18;
    } else if (st.kind === 'barracks') {
      hw = 30;
      hh = 24;
    } else if (st.kind === 'blacksmith') {
      hw = 26;
      hh = 20;
    } else if (st.kind === 'watchtower') {
      hw = 18;
      hh = 18;
    } else if (st.kind === 'market') {
      hw = 28;
      hh = 22;
    } else if (st.kind === 'patrol_dock') {
      hw = 28;
      hh = 20;
    } else if (st.kind === 'nuclear_lab' || st.kind === 'nuclear_reactor') {
      hw = 32;
      hh = 24;
    } else if (st.kind === 'distillery') {
      hw = 20;
      hh = 18;
    } else if (st.kind === 'forge_gate') {
      hw = 38;
      hh = 24;
      hasSouthDoor = true;
    } else {
      continue;
    }

    if (ageTier >= 3 && st.kind === 'settlement' && (st.level || 1) >= 2) {
      hw += 2;
    }

    // Allow passing cleanly through the South doorway on enterable buildings
    const inDoorCorridor =
      hasSouthDoor &&
      Math.abs(x - st.x) <= 15 &&
      y >= st.y - 6 &&
      y <= st.y + hh + entityRadius + 18;
    if (inDoorCorridor) continue;

    const minX = st.x - hw - entityRadius;
    const maxX = st.x + hw + entityRadius;
    const minY = st.y - hh - entityRadius;
    const maxY = st.y + hh + entityRadius;

    if (x > minX && x < maxX && y > minY && y < maxY) {
      const penLeft = x - minX;
      const penRight = maxX - x;
      const penTop = y - minY;
      const penBottom = maxY - y;
      const minPen = Math.min(penLeft, penRight, penTop, penBottom);
      if (minPen === penLeft) x = minX;
      else if (minPen === penRight) x = maxX;
      else if (minPen === penTop) y = minY;
      else y = maxY;
      collided = true;
      hitStructure = st;
    }
  }

  return { x, y, collided, hitStructure };
}

function buildIslandCompoundWalls(isl: IslandEntity): CompoundWallSegment[] {
  const walls: CompoundWallSegment[] = [];
  for (const node of isl.nodes) {
    if (node.kind !== 'village' && node.kind !== 'pirate_camp') continue;
    const isPirate = node.kind === 'pirate_camp';
    const boxR = isPirate ? 64 : 58;
    const hp = isPirate ? 380 + getPirateRankInfo(node.pirateRank || isl.pirateRank || 'F').hp * 0.45 : 320;
    const segLen = boxR * 2 - 12;

    walls.push(
      {
        id: `cw_${node.id}_n`,
        nodeId: node.id,
        islandId: isl.id,
        kind: node.kind,
        x: node.x,
        y: node.y - boxR,
        width: segLen,
        height: 14,
        angle: 0,
        isGate: false,
        hp: Math.round(hp),
        maxHp: Math.round(hp),
        destroyed: false,
      },
      {
        id: `cw_${node.id}_w`,
        nodeId: node.id,
        islandId: isl.id,
        kind: node.kind,
        x: node.x - boxR,
        y: node.y,
        width: segLen,
        height: 14,
        angle: Math.PI / 2,
        isGate: false,
        hp: Math.round(hp),
        maxHp: Math.round(hp),
        destroyed: false,
      },
      {
        id: `cw_${node.id}_e`,
        nodeId: node.id,
        islandId: isl.id,
        kind: node.kind,
        x: node.x + boxR,
        y: node.y,
        width: segLen,
        height: 14,
        angle: Math.PI / 2,
        isGate: false,
        hp: Math.round(hp),
        maxHp: Math.round(hp),
        destroyed: false,
      },
      {
        id: `cw_${node.id}_s`,
        nodeId: node.id,
        islandId: isl.id,
        kind: node.kind,
        x: node.x,
        y: node.y + boxR,
        width: segLen * 0.72,
        height: 16,
        angle: 0,
        isGate: true,
        hp: Math.round(hp * 0.8),
        maxHp: Math.round(hp * 0.8),
        destroyed: false,
      }
    );
  }
  return walls;
}

function isCompoundGatePassable(
  wall: CompoundWallSegment,
  islands: IslandEntity[],
  state: PersistentState
): boolean {
  if (wall.destroyed) return true;
  if (!wall.isGate || wall.kind !== 'village') return false;
  const isl = islands.find((i) => i.id === wall.islandId);
  const k = isl?.kingdomId ? state.kingdoms.find((kg) => kg.id === isl.kingdomId) : undefined;
  return (
    isl?.villagerPersonality !== 'hostile' &&
    !k?.atWar &&
    (k?.relation ?? 0) > -25
  );
}

function resolveCompoundWallCollision(
  entityX: number,
  entityY: number,
  entityRadius: number,
  walls: CompoundWallSegment[],
  islands: IslandEntity[],
  state: PersistentState
): { x: number; y: number; collided: boolean; hitWall?: CompoundWallSegment } {
  let x = entityX;
  let y = entityY;
  let collided = false;
  let hitWall: CompoundWallSegment | undefined;

  for (const wall of walls) {
    if (isCompoundGatePassable(wall, islands, state)) continue;
    const isVert = Math.abs(Math.sin(wall.angle)) > 0.7;
    const hw = (isVert ? wall.height : wall.width) * 0.5;
    const hh = (isVert ? wall.width : wall.height) * 0.5;
    const minX = wall.x - hw - entityRadius;
    const maxX = wall.x + hw + entityRadius;
    const minY = wall.y - hh - entityRadius;
    const maxY = wall.y + hh + entityRadius;

    if (x > minX && x < maxX && y > minY && y < maxY) {
      const penLeft = x - minX;
      const penRight = maxX - x;
      const penTop = y - minY;
      const penBottom = maxY - y;
      const minPen = Math.min(penLeft, penRight, penTop, penBottom);
      if (minPen === penLeft) x = minX;
      else if (minPen === penRight) x = maxX;
      else if (minPen === penTop) y = minY;
      else y = maxY;
      collided = true;
      hitWall = wall;
    }
  }

  return { x, y, collided, hitWall };
}

function applyDailyStructureIncome(s: PersistentState): void {
  const warehouses = s.islandStructures.filter((x) => x.kind === 'warehouse').length;
  if (warehouses > 0) s.resources.oro += warehouses;

  for (const st of s.islandStructures) {
    if (st.kind !== 'settlement') continue;
    if (st.level >= 3) {
      s.resources.oro += 6;
      s.resources.hie += 3;
      s.resources.tit += 1;
    } else if (st.level === 2) {
      s.resources.oro += 3;
      s.resources.mad += 2;
      s.resources.veg += 2;
    } else {
      s.resources.veg += 2;
      s.resources.oro += 1;
    }
  }
}

const PIRATE_HUNT_DIALOGUES: string[] = [
  '¡Velas negras a estribor! ¡Caza de Piratas en marcha, a las armas!',
  '¡Corsarios a la vista! Quien hunda al último se queda con su oro.',
  '¡Estos piratas buscan pleito, Capitán! Vamos por sus recompensas.',
  '¡Cañones listos! Tres barcos corsarios acaban de cruzar nuestra estela.',
  '¡Atención cubierta! ¡Caza de Piratas: no dejen escapar ni a un grumete!',
];

const FISH_FRENZY_DIALOGUES: string[] = [
  '¡El mar está hirviendo de cardúmenes! ¡Pesca a Torrentes, saquen las redes!',
  '¡Miren esos saltos en el agua! ¡Hay pesca a torrentes por toda la proa!',
  '¡Lluvia de peces plateados! Atrapen todos los que puedan antes que se hundan.',
  '¡Cardumen gigante bajo la quilla! ¡Hoy cenamos banquete de mar!',
  '¡Aguas llenas de vida! ¡Rápido, Capitán, recojamos esta pesca a torrentes!',
];

const GUERRILLA_DIALOGUES: string[] = [
  '¡Emboscada mixta! ¡Piratas y bestias atacan juntos desde la bruma!',
  '¡Todos a sus puestos! ¡Guerra de guerrillas por babor y estribor!',
  '¡Cuidado con el agua y la cubierta, vienen corsarios y monstruos!',
];

const SALVAGE_DIALOGUES: string[] = [
  '¡Corriente de suministros! ¡Cajas y chatarra flotando directo hacia nosotros!',
  '¡Un naufragio antiguo soltó su carga! ¡A recoger madera, hierro y piezas!',
  '¡Marea generosa a la vista! ¡Atrapemos los cajones antes que deriven!',
];

export type CrewStatusTone = 'combat' | 'swim' | 'repair' | 'patrol';

export interface CrewHudProps {
  survivors: PersistentState['survivors'];
  npcMoods: PersistentState['npcMoods'];
  crewStatuses: Partial<Record<SurvivorId, { label: string; tone: CrewStatusTone }>>;
  topPx: number;
  leftPx: number;
  maxHeightPx: number;
  compactByDefault: boolean;
  onOpenCrewTab: () => void;
  onTalkToNpc: (npcId: string) => void;
}

export function CrewHud({
  survivors,
  npcMoods,
  crewStatuses,
  topPx,
  leftPx,
  maxHeightPx,
  compactByDefault,
  onOpenCrewTab,
  onTalkToNpc,
}: CrewHudProps) {
  const [collapsed, setCollapsed] = useState<boolean>(compactByDefault);
  const activeCrew = survivors.filter((sv) => sv.unlocked);

  if (activeCrew.length === 0) return null;

  const toneBadge: Record<CrewStatusTone, string> = {
    combat: 'text-rose-300 bg-rose-500/20 border-rose-400/40',
    swim: 'text-sky-200 bg-sky-500/20 border-sky-400/40',
    repair: 'text-amber-200 bg-amber-500/20 border-amber-400/40',
    patrol: 'text-emerald-200 bg-emerald-500/15 border-emerald-400/30',
  };

  const toneDot: Record<CrewStatusTone, string> = {
    combat: 'bg-rose-400 animate-pulse',
    swim: 'bg-sky-400 animate-pulse',
    repair: 'bg-amber-400 animate-pulse',
    patrol: 'bg-emerald-400',
  };

  return (
    <aside
      aria-label="Estado de la tripulación activa"
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        top: `${topPx}px`,
        left: `${leftPx}px`,
        maxHeight: `${Math.max(54, maxHeightPx)}px`,
      }}
      className="absolute z-20 w-[144px] bg-[#061522]/35 hover:bg-[#061522]/85 focus-within:bg-[#061522]/85 backdrop-blur-[2px] border border-[#224766]/50 rounded-lg p-1 shadow-md opacity-60 hover:opacity-100 focus-within:opacity-100 transition-all flex flex-col overflow-hidden"
    >
      <div className="flex items-center justify-between gap-1 px-1 pb-0.5">
        <button
          type="button"
          onClick={onOpenCrewTab}
          className="flex items-center gap-1 text-[10px] font-bold text-amber-200 hover:text-amber-100 cursor-pointer truncate"
          title="Gestionar tripulación"
        >
          <Users className="w-3 h-3 text-amber-300 shrink-0" />
          <span>Trip. ({activeCrew.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setCollapsed((p) => !p)}
          className="p-0.5 rounded bg-[#0c2438]/60 hover:bg-[#12334f] text-slate-300 cursor-pointer shrink-0"
          aria-label={collapsed ? 'Expandir tripulación' : 'Recoger tripulación'}
          title={collapsed ? 'Ver miembros de la tripulación' : 'Recoger panel'}
        >
          {collapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
        </button>
      </div>

      {!collapsed && (
        <div className="flex flex-col gap-1 overflow-y-auto pr-0.5">
          {activeCrew.map((sv) => {
            const def = SURVIVORS_CATALOG.find((c) => c.id === sv.id);
            if (!def) return null;
            const status = crewStatuses[sv.id] || { label: 'Patrulla', tone: 'patrol' as const };
            const shortName = sv.id === 'vega' ? 'Vega' : def.name.split(' ')[0];
            const npcMoodKey = npcMoods?.[sv.id]?.mood || 'equilibrio';
            const moodMeta = MOOD_META[npcMoodKey] || MOOD_META.equilibrio;

            return (
              <div
                key={sv.id}
                className="w-full px-1.5 py-1 rounded bg-[#0a1d2d]/65 hover:bg-[#12304a]/90 border border-[#1d3d59]/65 flex items-center gap-1 transition-colors"
              >
                <button
                  type="button"
                  onClick={onOpenCrewTab}
                  title={`${def.name} (Nv.${sv.level}) · ${status.label} · Actitud: ${moodMeta.label}`}
                  className="min-w-0 flex-1 text-left flex items-center gap-1.5 cursor-pointer"
                >
                  <div
                    className="relative w-5 h-5 rounded-full shrink-0 border border-slate-900 flex items-center justify-center shadow-xs"
                    style={{ backgroundColor: def.color }}
                  >
                    <span
                      className="w-3 h-1.5 rounded-t-full border border-black/30 -mt-1.5"
                      style={{ backgroundColor: def.hatColor }}
                    />
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#061522] ${toneDot[status.tone]}`}
                    />
                  </div>

                  <div className="min-w-0 flex-1 flex flex-col">
                    <div className="flex items-center justify-between gap-1 leading-none">
                      <span className="text-[10px] font-bold text-slate-100 truncate">
                        {shortName}
                      </span>
                      <span className="text-[9px] font-mono-num font-extrabold text-amber-300 shrink-0">
                        Nv.{sv.level}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                      <span
                        className={`inline-block px-1 py-[1px] rounded border text-[8px] font-semibold leading-none ${toneBadge[status.tone]}`}
                      >
                        {status.label}
                      </span>
                      <span
                        className={`inline-block px-1 py-[1px] rounded border text-[8px] font-semibold leading-none ${moodMeta.bgClass} ${moodMeta.borderClass} ${moodMeta.textClass}`}
                      >
                        {moodMeta.shortLabel}
                      </span>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => onTalkToNpc(sv.id)}
                  title={`Hablar con ${def.name} (3 ocasiones)`}
                  aria-label={`Hablar con ${def.name}`}
                  className="p-1 rounded bg-cyan-500/20 hover:bg-cyan-400/35 border border-cyan-400/45 text-cyan-200 cursor-pointer shrink-0"
                >
                  <MessageCircle className="w-2.5 h-2.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </aside>
  );
}

export default function App() {
  const [hasSave, setHasSave] = useState<boolean>(() => hasSavedProgress());
  const [mode, setMode] = useState<GameMode>('TITLE_MENU');
  const [uiState, setUiState] = useState<PersistentState>(() => loadState());
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [drawerTab, setDrawerTab] = useState<DrawerTab>('arsenal');
  const [hudPanelOpen, setHudPanelOpen] = useState<boolean>(false);
  const [hotbarExpanded, setHotbarExpanded] = useState<boolean>(false);
  const [consumablesCollapsed, setConsumablesCollapsed] = useState<boolean>(false);
  const [viewport, setViewport] = useState<{
    width: number;
    height: number;
    orientation: 'portrait' | 'landscape';
  }>(() => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const h = typeof window !== 'undefined' ? window.innerHeight : 768;
    return {
      width: w,
      height: h,
      orientation: w >= h ? 'landscape' : 'portrait',
    };
  });
  const [destinyModalOpen, setDestinyModalOpen] = useState<boolean>(false);
  const [newspaperOpen, setNewspaperOpen] = useState<boolean>(false);
  const [newsAiLoading, setNewsAiLoading] = useState<boolean>(false);
  const [newsAiError, setNewsAiError] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState<boolean>(false);
  const [donationOpen, setDonationOpen] = useState<boolean>(false);
  const [donationPurpose, setDonationPurpose] = useState<'donation' | 'extra_life'>('donation');
  const [creditsOpen, setCreditsOpen] = useState<boolean>(false);
  const [installOpen, setInstallOpen] = useState<boolean>(false);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [accountOpen, setAccountOpen] = useState<boolean>(false);
  const [storyOpen, setStoryOpen] = useState<boolean>(false);
  const [worldMapOpen, setWorldMapOpen] = useState<boolean>(false);
  const [pendingDilemmaId, setPendingDilemmaId] = useState<StoryMissionId | null>(null);
  const [npcChatSession, setNpcChatSession] = useState<NpcConversationSession | null>(null);
  const npcChatSessionRef = useRef<NpcConversationSession | null>(null);
  const updateNpcChatSession = useCallback(
    (
      updater:
        | NpcConversationSession
        | null
        | ((prev: NpcConversationSession | null) => NpcConversationSession | null)
    ): NpcConversationSession | null => {
      const next =
        typeof updater === 'function' ? updater(npcChatSessionRef.current) : updater;
      npcChatSessionRef.current = next;
      setNpcChatSession(next);
      return next;
    },
    []
  );
  const [activeMerchantNpc, setActiveMerchantNpc] = useState<WorldNpcEntity | null>(null);
  const [nearbyWorldNpc, setNearbyWorldNpc] = useState<WorldNpcEntity | null>(null);
  const [dialogueQueue, setDialogueQueue] = useState<PausedDialogueLine[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [pendingSync, setPendingSync] = useState<boolean>(() => {
    try {
      return localStorage.getItem('marea_mutante_pending_sync') === '1';
    } catch {
      return false;
    }
  });
  const aiBanterQueueRef = useRef<Array<{ speaker: string; text: string }>>([]);
  const [locationLabel, setLocationLabel] = useState<string>('Sobre Navío');
  const [currentIslandId, setCurrentIslandId] = useState<string | null>(null);
  const [currentIslandName, setCurrentIslandName] = useState<string | null>(null);
  const [nearbyVillage, setNearbyVillage] = useState<IslandNode | null>(null);
  const [nearbyAnimal, setNearbyAnimal] = useState<AnimalEntity | null>(null);
  const [dangerousWater, setDangerousWater] = useState<boolean>(false);
  const [inShelter, setInShelter] = useState<boolean>(false);
  const [interactHint, setInteractHint] = useState<{ label: string; active: boolean }>({
    label: 'Interactuar',
    active: false,
  });

  const gamepad = useGamepad();
  const gamepadPollRef = useRef(gamepad.pollSnapshot);
  gamepadPollRef.current = gamepad.pollSnapshot;
  const fullscreen = useFullscreen(uiState.settings?.orientationPref || 'auto');

  useBackStack([
    { id: 'paused', open: mode === 'PAUSED', onClose: () => setMode('PLAYING') },
    { id: 'drawer', open: drawerOpen, onClose: () => setDrawerOpen(false) },
    { id: 'destiny', open: destinyModalOpen, onClose: () => setDestinyModalOpen(false) },
    { id: 'newspaper', open: newspaperOpen, onClose: () => setNewspaperOpen(false) },
    { id: 'profile', open: profileOpen, onClose: () => setProfileOpen(false) },
    { id: 'donation', open: donationOpen, onClose: () => setDonationOpen(false) },
    { id: 'credits', open: creditsOpen, onClose: () => setCreditsOpen(false) },
    { id: 'install', open: installOpen, onClose: () => setInstallOpen(false) },
    { id: 'story', open: storyOpen, onClose: () => setStoryOpen(false) },
    { id: 'settings', open: settingsOpen, onClose: () => setSettingsOpen(false) },
    { id: 'account', open: accountOpen, onClose: () => setAccountOpen(false) },
    { id: 'worldmap', open: worldMapOpen, onClose: () => setWorldMapOpen(false) },
    { id: 'merchant', open: Boolean(activeMerchantNpc), onClose: () => setActiveMerchantNpc(null) },
    { id: 'npc_chat', open: Boolean(npcChatSession), onClose: () => updateNpcChatSession(null) },
    { id: 'dilemma', open: Boolean(pendingDilemmaId), onClose: () => setPendingDilemmaId(null) },
    { id: 'hotbar', open: hotbarExpanded, onClose: () => setHotbarExpanded(false) },
  ]);
  const [crewStatuses, setCrewStatuses] = useState<
    Partial<Record<SurvivorId, { label: string; tone: CrewStatusTone }>>
  >({});
  const [weather, setWeather] = useState<WeatherType>('despejado');
  const [toast, setToast] = useState<string | null>(null);
  const [warState, setWarState] = useState<WarEventState>({
    active: false,
    title: '',
    wave: 0,
    remaining: 0,
    total: 0,
    cooldown: 110,
    targetKingdomId: null,
    targetClanId: null,
    isIslandWar: false,
  });
  const [randomEventState, setRandomEventState] = useState<RandomEventState>({
    active: false,
    kind: null,
    title: '',
    timer: 0,
    targetCount: 0,
    progress: 0,
  });

  const [introUi, setIntroUi] = useState<IntroCutsceneState>({
    active: false,
    phase: 'adrift',
    elapsed: 0,
    phaseElapsed: 0,
    captionTitle: '',
    captionText: '',
  });
  const introRef = useRef<IntroCutsceneState>({
    active: false,
    phase: 'adrift',
    elapsed: 0,
    phaseElapsed: 0,
    captionTitle: '',
    captionText: '',
  });
  const introCueRef = useRef<{
    spotBubble: boolean;
    swimSplashT: number;
    vegaLine1: boolean;
    vegaLine2: boolean;
  }>({
    spotBubble: false,
    swimSplashT: 0,
    vegaLine1: false,
    vegaLine2: false,
  });

  const uiPaused =
    mode === 'PLAYING' &&
    (drawerOpen ||
      hudPanelOpen ||
      hotbarExpanded ||
      destinyModalOpen ||
      newspaperOpen ||
      profileOpen ||
      donationOpen ||
      creditsOpen ||
      installOpen ||
      settingsOpen ||
      accountOpen ||
      storyOpen ||
      worldMapOpen ||
      Boolean(pendingDilemmaId) ||
      Boolean(npcChatSession) ||
      Boolean(activeMerchantNpc) ||
      dialogueQueue.length > 0);
  const uiPausedRef = useRef<boolean>(uiPaused);
  uiPausedRef.current = uiPaused;

  const isGamePaused = mode !== 'PLAYING' || uiPaused;
  const isGamePausedRef = useRef<boolean>(isGamePaused);
  isGamePausedRef.current = isGamePaused;

  const stageRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const modeRef = useRef<GameMode>(mode);
  modeRef.current = mode;

  const stateRef = useRef<PersistentState>(uiState);
  const warRef = useRef<WarEventState>(warState);
  const randomEventRef = useRef<RandomEventState>(randomEventState);
  const weatherRef = useRef<WeatherType>(weather);
  const sizeRef = useRef<{ width: number; height: number }>({ width: 1080, height: 600 });
  const pointerWorldRef = useRef<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false,
  });

  const raftRef = useRef<RaftEntity>({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    angle: 0,
    level: uiState.raft.level,
    turretLevel: uiState.raft.turretLevel,
    distillerLevel: uiState.raft.distillerLevel,
    solarLevel: uiState.raft.solarLevel,
    engineLevel: uiState.raft.engineLevel,
    missileLevel: uiState.raft.missileLevel || 0,
    shieldLevel: uiState.raft.shieldLevel || 0,
    droneLevel: uiState.raft.droneLevel || 0,
    hp: uiState.raft.hp,
    maxHp: uiState.raft.maxHp,
    damagedMode: uiState.raft.damagedMode,
  });

  const playerRef = useRef<PlayerEntity>({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    angle: 0,
    speed: 175,
    onRaft: true,
    piloting: false,
    swimming: false,
    onIsland: false,
    inShelter: false,
    atkT: 0,
    cd: 0,
    dashT: 0,
    invT: 0,
    animT: 0,
    gaitPhase: 0,
  });

  const camRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const keyInputRef = useRef<{ up: boolean; down: boolean; left: boolean; right: boolean }>({
    up: false,
    down: false,
    left: false,
    right: false,
  });
  const joyInputRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const aimJoyInputRef = useRef<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false });

  const loadedChunksRef = useRef<Set<string>>(new Set());
  const islandsRef = useRef<IslandEntity[]>([]);
  const worldNpcsRef = useRef<WorldNpcEntity[]>([]);
  const compoundWallsRef = useRef<CompoundWallSegment[]>([]);
  const rescueBoatsRef = useRef<RescueBoatEntity[]>([]);
  const animalsRef = useRef<AnimalEntity[]>([]);
  const enemiesRef = useRef<EnemyEntity[]>([]);
  const projectilesRef = useRef<ProjectileEntity[]>([]);
  const dropsRef = useRef<FloatingDrop[]>([]);
  const explosionsRef = useRef<ExplosionFx[]>([]);
  const splashesRef = useRef<SplashFx[]>([]);
  const slashesRef = useRef<SlashFx[]>([]);
  const popsRef = useRef<FloatingPopup[]>([]);
  const comicsRef = useRef<ComicBubble[]>([]);
  const crewCooldownsRef = useRef<Record<string, number>>({});

  const timersRef = useRef({
    world: 0,
    drop: 0,
    enemy: 15,
    turret: 0,
    missileCd: 0,
    droneCd: 0,
    shieldRegenCd: 0,
    distiller: 0,
    beto: 0,
    comic: 9,
    playerThought: 8,
    weather: 38,
    lightning: 0,
    lightningCd: 8,
    randomEventCd: 26,
    fishBurst: 0,
    leviathanSwallowCd: 85,
    save: 0,
    leaderboardSync: 0,
    uiSync: 0,
    shake: 0,
    calmNotified: false,
    vegaProtectCd: 10,
    marinePatrolCd: 24,
    factionSkirmishLogCd: 0,
    islandDefenseCd: 0,
  });
  const govWaveRef = useRef({
    active: false,
    waveNumber: 0,
    waveCap: 2,
    spawnedInWave: 0,
    cooldown: 18,
  });
  const lastAiNewsSigRef = useRef<string>('');
  const prevSafeZoneIdRef = useRef<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 2600);
  }, []);

  const pushPop = useCallback((x: number, y: number, text: string, color = '#fbbf24') => {
    popsRef.current.push({ x, y, text, color, life: 1.0 });
  }, []);

  const pushComic = useCallback(
    (speaker: string, text: string, x: number, y: number, color = '#38bdf8') => {
      if (comicsRef.current.length >= 3) comicsRef.current.shift();
      comicsRef.current.push({ id: eid++, speaker, text, x, y, life: 3.4, color });
    },
    []
  );

  const syncUi = useCallback(() => {
    const s = stateRef.current;
    s.maxHp = computeEffectiveMaxHp(s);
    s.maxSt = computeEffectiveMaxStamina(s);
    s.raft.maxHp = computeRaftMaxHp(s);
    if (s.hp > s.maxHp) s.hp = s.maxHp;
    if (s.raft.hp > s.raft.maxHp) s.raft.hp = s.raft.maxHp;

    s.bounty = computePlayerBounty(s);
    const liveScore = computeSurvivalScore(s);
    if (liveScore > s.playerProfile.maxScore) {
      s.playerProfile.maxScore = liveScore;
      saveProfile(s.playerProfile);
    }

    setUiState({
      ...s,
      playerProfile: { ...s.playerProfile },
      checkpoint: s.checkpoint ? { ...s.checkpoint } : null,
      newspaper: {
        ...s.newspaper,
        articles: s.newspaper.articles.map((a) => ({ ...a })),
      },
      pirateBounties: s.pirateBounties.map((b) => ({ ...b })),
      resources: { ...s.resources },
      consumables: { ...s.consumables },
      raft: { ...s.raft },
      stats: { ...s.stats },
      hotbar: [...s.hotbar],
      ownedWeapons: [...s.ownedWeapons],
      settings: { ...DEFAULT_GAME_SETTINGS, ...(s.settings || {}) },
      warshipPassives: [...(s.warshipPassives || [])],
      islandUnits: (s.islandUnits || []).map((u) => ({ ...u })),
      aoeUpgrades: [...(s.aoeUpgrades || [])],
      discoveredWorldNpcs: [...(s.discoveredWorldNpcs || [])],
      craftedTech: [...s.craftedTech],
      farmPlots: s.farmPlots.map((p) => ({ ...p })),
      captiveAnimals: s.captiveAnimals.map((a) => ({ ...a })),
      relicsOwned: [...s.relicsOwned],
      equippedRelics: [...s.equippedRelics],
      islandStructures: s.islandStructures.map((x) => ({ ...x })),
      unlockedTitles: [...s.unlockedTitles],
      storyMissions: s.storyMissions.map((m) => ({ ...m })),
      kingdoms: s.kingdoms.map((k) => ({ ...k })),
      clan: {
        ...s.clan,
        perks: [...s.clan.perks],
        rivals: s.clan.rivals.map((rc) => ({ ...rc })),
      },
      acquaintances: s.acquaintances.map((a) => ({ ...a })),
      family: {
        affection: { ...s.family.affection },
        partnerId: s.family.partnerId,
        married: s.family.married,
        children: s.family.children.map((c) => ({ ...c })),
      },
      pillagedVillages: [...s.pillagedVillages],
      survivors: s.survivors.map((sv) => ({ ...sv })),
      destinyUnlocked: [...s.destinyUnlocked],
      achievementsUnlocked: [...s.achievementsUnlocked],
      discoveredIslands: [...s.discoveredIslands],
      vitals: { ...s.vitals },
      npcMoods: Object.fromEntries(
        Object.entries(s.npcMoods || {}).map(([k, v]) => [k, { ...v }])
      ),
    });
    setWarState({ ...warRef.current });
    setRandomEventState({ ...randomEventRef.current });
  }, []);

  const getWorldDialogueCtx = useCallback((): WorldDialogueContext => {
    const s = stateRef.current;
    const pl = playerRef.current;
    const activeMission = s.activeStoryMissionId
      ? STORY_MISSION_MAP[s.activeStoryMissionId]?.title
      : undefined;
    const currIsl = islandsRef.current.find((x) => pointInIsland(pl.x, pl.y, x));
    return {
      dayCount: s.dayCount,
      weather: weatherRef.current,
      dangerousWater: isDangerousOceanAt(pl.x, pl.y),
      nearLeviathan: enemiesRef.current.some(
        (e) => e.isLeviathan && Math.hypot(e.x - pl.x, e.y - pl.y) < 900
      ),
      missionTitle: activeMission,
      islandsVisited: s.stats.islandsVisited,
      islandName: currIsl?.name,
      islandCulture: currIsl?.cultureName
        ? `${currIsl.cultureName}${currIsl.cultureTradition ? ` (${currIsl.cultureTradition})` : ''}`
        : undefined,
    };
  }, []);

  const enqueuePausedDialogues = useCallback((lines: PausedDialogueLine[]) => {
    if (lines.length === 0) return;
    setDialogueQueue((prev) => [...prev, ...lines]);
  }, []);

  const handleOpenNpcChat = useCallback(
    (npcId: string, overrideName?: string) => {
      const s = stateRef.current;
      const worldCtx = getWorldDialogueCtx();
      const nearWnpc = worldNpcsRef.current.find((n) => n.id === npcId || n.name === overrideName);
      const session = startNpcConversation(npcId, s, overrideName, {
        ...worldCtx,
        worldNpc: nearWnpc || null,
      });
      setDrawerOpen(false);
      updateNpcChatSession(session);
    },
    [getWorldDialogueCtx, updateNpcChatSession]
  );

  const handleToggleNpcAiMode = useCallback(() => {
    updateNpcChatSession((prev) =>
      prev ? { ...prev, aiMode: !prev.aiMode, aiError: null } : null
    );
  }, [updateNpcChatSession]);

  const handleSendFreeNpcMessage = useCallback(
    async (text: string) => {
      const s = stateRef.current;
      const prev = npcChatSessionRef.current;
      if (!prev || prev.stage !== 'choosing') return;
      const wasMarried = Boolean(s.vegaMarried);
      const snapshot: NpcConversationSession = { ...prev, aiLoading: true, aiError: null };
      updateNpcChatSession(snapshot);

      const worldCtx = getWorldDialogueCtx();
      const result = await requestAiNpcTurn(snapshot, s, worldCtx, text);
      if (result.ok) {
        appendNpcChatHistory(s, result.session.npcId, result.session.transcript.slice(-2));
      }
      if (!wasMarried && s.vegaMarried) {
        sfx.levelUp(s.sound);
        logWorldEvent(s, 'mission', 'La Vice-Capitana Vega y tú se casaron en secreto');
        showToast('💍 ¡Vega aceptó! Ahora te llamará "Amorcito Hermoso" y te protegerá cada 10s');
      } else {
        sfx.pickup(s.sound);
      }
      saveState(s);
      syncUi();
      updateNpcChatSession((curr) => (curr ? result.session : null));
    },
    [getWorldDialogueCtx, showToast, syncUi, updateNpcChatSession]
  );

  const handleSelectNpcChoice = useCallback(
    async (choiceIndex: number) => {
      const s = stateRef.current;
      const prev = npcChatSessionRef.current;
      if (!prev || prev.stage !== 'choosing') return;
      const choice = prev.choices[choiceIndex];
      if (!choice) return;
      const wasMarried = Boolean(s.vegaMarried);
      const online = typeof navigator === 'undefined' ? true : navigator.onLine;

      if (prev.aiMode && online) {
        const snapshot: NpcConversationSession = { ...prev, aiLoading: true, aiError: null };
        updateNpcChatSession(snapshot);
        sfx.pickup(s.sound);
        saveState(s);
        syncUi();

        const result = await requestAiNpcTurn(snapshot, s, getWorldDialogueCtx(), choice.playerText);
        if (result.ok) {
          appendNpcChatHistory(s, result.session.npcId, result.session.transcript.slice(-2));
          if (!wasMarried && s.vegaMarried) {
            sfx.levelUp(s.sound);
            logWorldEvent(s, 'mission', 'La Vice-Capitana Vega y tú se casaron en secreto');
            showToast('💍 ¡Vega aceptó! Ahora te llamará "Amorcito Hermoso" y te protegerá cada 10s');
          }
          saveState(s);
          syncUi();
          updateNpcChatSession((curr) => (curr ? result.session : null));
        } else if (choice.npcReply) {
          const fallback = chooseNpcDialogueOption(snapshot, choiceIndex, s);
          fallback.aiLoading = false;
          fallback.aiError = result.session.aiError;
          appendNpcChatHistory(s, fallback.npcId, fallback.transcript.slice(-2));
          if (!wasMarried && s.vegaMarried) {
            sfx.levelUp(s.sound);
            logWorldEvent(s, 'mission', 'La Vice-Capitana Vega y tú se casaron en secreto');
            showToast('💍 ¡Vega aceptó! Ahora te llamará "Amorcito Hermoso" y te protegerá cada 10s');
          }
          saveState(s);
          syncUi();
          updateNpcChatSession((curr) => (curr ? fallback : null));
        } else {
          updateNpcChatSession((curr) => (curr ? result.session : null));
        }
        return;
      }

      if (!choice.npcReply) {
        updateNpcChatSession({
          ...prev,
          aiError: 'Sin conexión para esta opción generada por IA. Usa otra opción o reconecta.',
        });
        return;
      }

      const nextLocal = chooseNpcDialogueOption(prev, choiceIndex, s);
      appendNpcChatHistory(s, nextLocal.npcId, nextLocal.transcript.slice(-2));
      updateNpcChatSession(nextLocal);
      if (!wasMarried && s.vegaMarried) {
        sfx.levelUp(s.sound);
        logWorldEvent(s, 'mission', 'La Vice-Capitana Vega y tú se casaron en secreto');
        showToast('💍 ¡Vega aceptó! Ahora te llamará "Amorcito Hermoso" y te protegerá cada 10s');
      } else {
        sfx.pickup(s.sound);
      }
      saveState(s);
      syncUi();
    },
    [getWorldDialogueCtx, showToast, syncUi, updateNpcChatSession]
  );

  const handleNextNpcStep = useCallback(
    async (keepTalking = false) => {
      const s = stateRef.current;
      const prev = npcChatSessionRef.current;
      if (!prev) return;
      const wasMarried = Boolean(s.vegaMarried);

      const reopened: NpcConversationSession =
        prev.stage === 'finished' && keepTalking ? { ...prev, stage: 'reading_reply' } : prev;
      const advancedSession = advanceNpcConversationAfterReply(reopened, s, keepTalking);
      const shouldFetchAi =
        advancedSession.stage === 'choosing' &&
        advancedSession.aiMode &&
        (typeof navigator === 'undefined' ? true : navigator.onLine);

      updateNpcChatSession(
        shouldFetchAi ? { ...advancedSession, aiLoading: true, aiError: null } : advancedSession
      );
      if (!wasMarried && s.vegaMarried) {
        sfx.levelUp(s.sound);
        logWorldEvent(s, 'mission', 'La Vice-Capitana Vega y tú se casaron en secreto');
        showToast('💍 ¡Vega aceptó! Ahora te llamará "Amorcito Hermoso" y te protegerá cada 10s');
      } else {
        sfx.pickup(s.sound);
      }
      saveState(s);
      syncUi();

      if (shouldFetchAi) {
        const withoutFallbackPrompt: NpcConversationSession = {
          ...advancedSession,
          transcript: advancedSession.transcript.slice(0, -1),
        };
        const aiResult = await requestAiNpcTurn(
          withoutFallbackPrompt,
          s,
          getWorldDialogueCtx()
        );
        if (aiResult.ok) {
          updateNpcChatSession((curr) => (curr ? aiResult.session : null));
        } else {
          updateNpcChatSession((curr) =>
            curr
              ? {
                  ...advancedSession,
                  aiLoading: false,
                  aiError: aiResult.session.aiError,
                }
              : null
          );
        }
      }
    },
    [getWorldDialogueCtx, showToast, syncUi, updateNpcChatSession]
  );

  const handleNextPausedDialogue = useCallback(() => {
    setDialogueQueue((prev) => prev.slice(1));
  }, []);

  const syncLeaderboard = useCallback(
    async (showFeedback = false) => {
      const s = stateRef.current;
      const currentScore = computeSurvivalScore(s);
      const maxScore = Math.max(s.playerProfile.maxScore, currentScore);
      if (maxScore !== s.playerProfile.maxScore) {
        s.playerProfile.maxScore = maxScore;
        saveProfile(s.playerProfile);
      }

      const titleName = TITLE_MAP[s.activeTitleId]?.name || 'Náufrago';
      const shipClass = getShipClassName(s.raft.level);

      setLeaderboardLoading(true);
      try {
        const res = await fetch('/api/leaderboard/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: s.playerProfile.id,
            name: s.playerProfile.name,
            country: s.playerProfile.country,
            maxScore,
            currentScore,
            dayCount: s.dayCount,
            level: s.level,
            bounty: computePlayerBounty(s),
            clanTag: s.clan.founded ? s.clan.tag : '',
            titleName,
            shipClass,
            kills: s.stats.kills,
            islandsVisited: s.stats.islandsVisited,
            donorUnlocked: s.donorUnlocked,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.players)) {
            setLeaderboard(data.players);
          }
          setIsOnline(true);
          setLastSyncedAt(Date.now());
          setPendingSync(false);
          try {
            localStorage.removeItem('marea_mutante_pending_sync');
          } catch {
            // ignore storage errors
          }
          if (showFeedback) {
            showToast('🌐 Clasificación mundial al día · Puntuación subida');
          }
        } else {
          throw new Error(`HTTP ${res.status}`);
        }
      } catch {
        setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : false);
        setPendingSync(true);
        try {
          localStorage.setItem('marea_mutante_pending_sync', '1');
        } catch {
          // ignore storage errors
        }
        setLeaderboard((prev) => {
          const selfEntry: LeaderboardEntry = {
            id: s.playerProfile.id,
            name: s.playerProfile.name,
            country: s.playerProfile.country,
            maxScore,
            currentScore,
            dayCount: s.dayCount,
            level: s.level,
            bounty: computePlayerBounty(s),
            clanTag: s.clan.founded ? s.clan.tag : '',
            titleName,
            shipClass,
            kills: s.stats.kills,
            islandsVisited: s.stats.islandsVisited,
            donorUnlocked: s.donorUnlocked,
            lastSeen: Date.now(),
            activeNow: true,
          };
          const others = prev.filter((p) => p.id !== selfEntry.id);
          return [selfEntry, ...others].sort((a, b) => b.maxScore - a.maxScore);
        });
        if (showFeedback) {
          showToast('Sin internet: progreso guardado y se subirá al reconectar');
        }
      } finally {
        setLeaderboardLoading(false);
      }
    },
    [showToast]
  );

  const getActiveCulturesList = useCallback((): string[] => {
    const pl = playerRef.current;
    return Array.from(
      new Set(
        islandsRef.current
          .filter((isl) => isl.discovered || Math.hypot(isl.x - pl.x, isl.y - pl.y) < 1800)
          .map((isl) => `${isl.cultureEmblem || ''} ${isl.cultureName || ''}`.trim())
          .filter(Boolean)
      )
    );
  }, []);

  const generateAiNewspaperForDay = useCallback(
    async (dayOverride?: number) => {
      const s = stateRef.current;
      const day = dayOverride ?? s.dayCount;
      const activeCultures = getActiveCulturesList();
      const eventSig = `${day}:${(s.recentEventsLog || []).slice(0, 3).map((e) => e.id).join(',')}`;
      setNewsAiLoading(true);
      setNewsAiError(null);
      const res = await requestAiNewspaperArticles(
        s,
        weatherRef.current,
        day,
        activeCultures
      );
      setNewsAiLoading(false);
      if (res.ok && res.articles && res.articles.length > 0) {
        lastAiNewsSigRef.current = eventSig;
        s.newspaper = {
          ...s.newspaper,
          lastDayPublished: day,
          articles: res.articles,
          aiSummary: res.aiSummary || s.newspaper.aiSummary,
        };
        saveState(s);
        syncUi();
      } else {
        const fallbackArticles = generateDailyNewsArticles(s, weatherRef.current, day, activeCultures);
        s.newspaper = {
          ...s.newspaper,
          lastDayPublished: day,
          articles: fallbackArticles,
          aiSummary: 'Edición local generada con los eventos reales recientes del mundo.',
        };
        setNewsAiError(res.error || 'No se pudo generar la edición IA.');
        saveState(s);
        syncUi();
      }
    },
    [getActiveCulturesList, syncUi]
  );

  const publishDailyNewspaper = useCallback(
    (day: number) => {
      const s = stateRef.current;
      if (s.newspaper.lastDayPublished >= day && s.newspaper.articles.length > 0) return;
      const activeCultures = getActiveCulturesList();
      s.newspaper = {
        edition: (s.newspaper.edition || 1) + 1,
        unread: true,
        lastDayPublished: day,
        articles: generateDailyNewsArticles(s, weatherRef.current, day, activeCultures),
      };
      if (typeof navigator === 'undefined' || navigator.onLine) {
        void generateAiNewspaperForDay(day);
      }
    },
    [generateAiNewspaperForDay, getActiveCulturesList]
  );

  const openNewspaperModal = useCallback(() => {
    const s = stateRef.current;
    const activeCultures = getActiveCulturesList();
    s.newspaper.unread = false;
    const eventSig = `${s.dayCount}:${(s.recentEventsLog || []).slice(0, 3).map((e) => e.id).join(',')}`;
    const hasAiForSig =
      s.newspaper.articles.some((a) => a.viaAi) && lastAiNewsSigRef.current === eventSig;
    if (!hasAiForSig || s.newspaper.articles.length === 0) {
      s.newspaper = {
        ...s.newspaper,
        lastDayPublished: s.dayCount,
        articles: generateDailyNewsArticles(s, weatherRef.current, s.dayCount, activeCultures),
      };
    }
    saveState(s);
    syncUi();
    setNewspaperOpen(true);
    if (!hasAiForSig && (typeof navigator === 'undefined' || navigator.onLine)) {
      void generateAiNewspaperForDay(s.dayCount);
    }
  }, [generateAiNewspaperForDay, getActiveCulturesList, syncUi]);

  const saveCheckpoint = useCallback(
    (labelOverride?: string) => {
      const s = stateRef.current;
      const pl = playerRef.current;
      const raft = raftRef.current;
      const isl = islandsRef.current.find((x) => pointInIsland(pl.x, pl.y, x));
      const label =
        labelOverride ||
        (isl ? isl.name : getShipClassName(raft.level));

      s.checkpoint = {
        x: pl.x,
        y: pl.y,
        raftX: raft.x,
        raftY: raft.y,
        islandId: isl?.id || null,
        label,
        savedDay: s.dayCount,
      };
      saveState(s);
      syncUi();
      showToast(`Punto de control guardado: ${label}`);
    },
    [showToast, syncUi]
  );

  const unlockTitle = useCallback(
    (titleId: string) => {
      const s = stateRef.current;
      if (s.unlockedTitles.includes(titleId)) return;
      s.unlockedTitles.push(titleId);
      s.activeTitleId = titleId;
      const t = TITLE_MAP[titleId];
      if (t) {
        showToast(`¡Nuevo Título [${t.tier.toUpperCase()}]: ${t.name}!`);
        sfx.levelUp(s.sound);
      }
    },
    [showToast]
  );

  const checkTitlesAndAchievements = useCallback(() => {
    const s = stateRef.current;

    if (s.raft.level >= 5) unlockTitle('title_capitan_guerra');
    if (s.stats.banditKills >= 15) unlockTitle('title_azote_corsarios');
    if (s.stats.islandWarsWon >= 1) unlockTitle('title_conquistador_islas');
    if (s.family.children.length >= 1) unlockTitle('title_patriarca_mar');
    if (getRelicTotals(s).hasSZS) unlockTitle('title_leyenda_szs');

    for (const ach of ACHIEVEMENTS_CATALOG) {
      if (s.achievementsUnlocked.includes(ach.id)) continue;
      const val =
        ach.statKey === 'weaponsOwned'
          ? s.ownedWeapons.length
          : ach.statKey === 'destinyUnlocked'
            ? s.destinyUnlocked.length
            : ach.statKey === 'level'
              ? s.level
              : ach.statKey === 'dayCount'
                ? s.dayCount
                : ach.statKey === 'bountyMillions'
                  ? Math.floor(s.bounty / 1_000_000)
                  : ach.statKey === 'nuclearShieldReady'
                    ? s.warshipNuclearShield
                      ? 1
                      : 0
                    : s.stats[ach.statKey] || 0;
      if (val >= ach.target) {
        s.achievementsUnlocked.push(ach.id);
        s.fame += 90;
        s.resources.oro += 4;
        if (ach.statKey === 'warsWon' || ach.statKey === 'destinyUnlocked') {
          s.resources.cri += 1;
        }
        showToast(`Logro desbloqueado: ${ach.title}`);
        sfx.chest(s.sound);
      }
    }
  }, [showToast, unlockTitle]);

  const grantXpAndFame = useCallback(
    (xpGain: number, fameGain: number) => {
      const s = stateRef.current;
      const fameMult = hasDestiny(s, 'alquimia_master')
        ? 1.5
        : hasDestiny(s, 'alquimia_t4')
          ? 1.25
          : 1;
      s.xp += xpGain;
      s.fame += Math.round(fameGain * fameMult);
      while (s.xp >= s.nextXp) {
        s.xp -= s.nextXp;
        s.level += 1;
        s.nextXp = Math.round(s.nextXp * 1.35);
        s.maxHp = computeEffectiveMaxHp(s);
        s.hp = s.maxHp;
        s.fame += 45;
        showToast(`¡Subiste a Nivel ${s.level}! (+45 Fama)`);
        sfx.levelUp(s.sound);
      }
      checkTitlesAndAchievements();
    },
    [checkTitlesAndAchievements, showToast]
  );

  const tryAwardRelic = useCallback(
    (isAbyssalOrBoss: boolean, x: number, y: number) => {
      const s = stateRef.current;
      const luck =
        (hasDestiny(s, 'alquimia_t4') ? 0.45 : 0) +
        (s.craftedTech.includes('tech_radar') ? 0.2 : 0);
      const relic = rollOldWorldRelic(luck, isAbyssalOrBoss);
      if (!relic) return;

      if (!s.relicsOwned.includes(relic.id)) {
        s.relicsOwned.push(relic.id);
        if (s.equippedRelics.length < 3) {
          s.equippedRelics.push(relic.id);
        }
        const prefix = relic.rank === 'SZS' ? '¡MILAGRO SZS!' : `Reliquia [${relic.rank}]`;
        showToast(`${prefix}: ${relic.name}`);
        pushPop(x, y - 34, `[${relic.rank}] ${relic.name}`, getRelicRankColor(relic.rank));
        sfx.levelUp(s.sound);
        checkTitlesAndAchievements();
      } else {
        s.fame += 35;
        s.resources.oro += 2;
        pushPop(x, y - 28, 'Reliquia repetida → +2 Oro', '#fbbf24');
      }
    },
    [checkTitlesAndAchievements, pushPop, showToast]
  );

  const spawnFloatingDrop = useCallback((x: number, y: number, key: ResourceKey, amount: number) => {
    const meta: Record<ResourceKey, { label: string; color: string }> = {
      mad: { label: 'MAD', color: '#e09f3e' },
      cht: { label: 'CHT', color: '#90e0ef' },
      agu: { label: 'AGU', color: '#38bdf8' },
      pez: { label: 'PEZ', color: '#facc15' },
      veg: { label: 'VEG', color: '#4ade80' },
      gui: { label: 'GUI', color: '#34d399' },
      oro: { label: 'ORO', color: '#fbbf24' },
      car: { label: 'CAR', color: '#a8a29e' },
      hie: { label: 'HIE', color: '#e2e8f0' },
      tit: { label: 'TIT', color: '#60a5fa' },
      cri: { label: 'CRI', color: '#c084fc' },
      tec: { label: 'TEC', color: '#22d3ee' },
      nuc_frag: { label: 'F.NUC', color: '#a3e635' },
      cel_frag: { label: 'F.CEL', color: '#38f8e2' },
      alc: { label: 'ALC', color: '#f59e0b' },
      frag_epico: { label: 'F.EPICO', color: '#c084fc' },
      frag_legendario: { label: 'F.LEG', color: '#fbbf24' },
      frag_divino: { label: 'F.DIV', color: '#38f8e2' },
    };
    const m = meta[key];
    dropsRef.current.push({
      id: eid++,
      kind: 'resource',
      resourceKey: key,
      amount,
      label: `+${amount} ${m.label}`,
      color: m.color,
      x,
      y,
      vx: (Math.random() - 0.5) * 16,
      vy: (Math.random() - 0.5) * 16,
      bob: Math.random() * 6,
    });
  }, []);

  const spawnEnemyNear = useCallback(
    (
      kind: EnemyKind,
      spawnX?: number,
      spawnY?: number,
      storyMissionId?: StoryMissionId,
      rankMult = 1,
      territoryOpts?: { homeX?: number; homeY?: number; territoryRadius?: number; noTerritory?: boolean }
    ) => {
      const s = stateRef.current;
      const diff = getDifficultyModifiers(s.difficulty);
      const timeScale = 1 + Math.min(2.2, Math.max(0, s.elapsedSeconds - 150) / 180);
      const distScale = 1 + Math.min(2.4, Math.hypot(raftRef.current.x, raftRef.current.y) / 3000);
      const scale = Math.max(timeScale, distScale) * rankMult;
      const hpScale = scale * diff.enemyHpMult;
      const dmgScale = scale * diff.enemyDmgMult;
      const spdMult = diff.enemySpeedMult;

      const angle = Math.random() * Math.PI * 2;
      const isLevi =
        kind === 'leviathan' ||
        kind === 'leviathan_baby' ||
        kind === 'leviathan_adult' ||
        kind === 'leviathan_elder';
      const isBigBossKind =
        kind === 'bandit_boss' || kind === 'kraken' || kind === 'hacker_corsair' || kind.startsWith('abysmal_');
      const dist = isLevi ? 540 + Math.random() * 150 : isBigBossKind ? 480 + Math.random() * 130 : 390 + Math.random() * 140;
      const x = spawnX ?? playerRef.current.x + Math.cos(angle) * dist;
      const y = spawnY ?? playerRef.current.y + Math.sin(angle) * dist;

      const templates: Record<
        EnemyKind,
        Omit<
          EnemyEntity,
          | 'id'
          | 'x'
          | 'y'
          | 'vx'
          | 'vy'
          | 'cd'
          | 'hitT'
          | 'gaitPhase'
          | 'onLand'
          | 'boardedRaft'
          | 'parkedBoat'
          | 'stealProgress'
          | 'stolenBag'
        >
      > = {
        bandit_grunt: {
          kind: 'bandit_grunt',
          name: 'Corsario Raso',
          isBandit: true,
          isThief: false,
          isBoss: false,
          isAquatic: false,
          isLargeMonster: false,
          isLeviathan: false,
          provoked: true,
          hp: Math.round(48 * hpScale),
          maxHp: Math.round(48 * hpScale),
          dmg: Math.round(10 * dmgScale),
          speed: 96 * spdMult,
          radius: 14,
          color: '#fb7185',
          fameReward: 22,
        },
        bandit_thief: {
          kind: 'bandit_thief',
          name: 'Bandido Ladrón',
          isBandit: true,
          isThief: true,
          isBoss: false,
          isAquatic: false,
          isLargeMonster: false,
          isLeviathan: false,
          provoked: true,
          hp: Math.round(42 * hpScale),
          maxHp: Math.round(42 * hpScale),
          dmg: Math.round(7 * dmgScale),
          speed: 112 * spdMult,
          radius: 13,
          color: '#f59e0b',
          fameReward: 28,
        },
        bandit_gunner: {
          kind: 'bandit_gunner',
          name: 'Mosquetero Pirata',
          isBandit: true,
          isThief: false,
          isBoss: false,
          isAquatic: false,
          isLargeMonster: false,
          isLeviathan: false,
          provoked: true,
          hp: Math.round(54 * hpScale),
          maxHp: Math.round(54 * hpScale),
          dmg: Math.round(13 * dmgScale),
          speed: 82 * spdMult,
          radius: 14,
          color: '#e11d48',
          fameReward: 30,
        },
        bandit_boss: {
          kind: 'bandit_boss',
          name: 'Capitán Barbarroja',
          isBandit: true,
          isThief: false,
          isBoss: true,
          isAquatic: false,
          isLargeMonster: false,
          isLeviathan: false,
          provoked: true,
          hp: Math.round(215 * hpScale),
          maxHp: Math.round(215 * hpScale),
          dmg: Math.round(22 * dmgScale),
          speed: 90 * spdMult,
          radius: 22,
          color: '#be123c',
          fameReward: 115,
        },
        crab: {
          kind: 'crab',
          name: 'Cangrejo Mutante',
          isBandit: false,
          isThief: false,
          isBoss: false,
          isAquatic: true,
          isLargeMonster: false,
          isLeviathan: false,
          provoked: true,
          hp: Math.round(44 * hpScale),
          maxHp: Math.round(44 * hpScale),
          dmg: Math.round(9 * dmgScale),
          speed: 84 * spdMult,
          radius: 14,
          color: '#ef4444',
          fameReward: 18,
        },
        jelly: {
          kind: 'jelly',
          name: 'Medusa Eléctrica',
          isBandit: false,
          isThief: false,
          isBoss: false,
          isAquatic: true,
          isLargeMonster: false,
          isLeviathan: false,
          provoked: true,
          hp: Math.round(38 * hpScale),
          maxHp: Math.round(38 * hpScale),
          dmg: Math.round(11 * dmgScale),
          speed: 90 * spdMult,
          radius: 13,
          color: '#c084fc',
          fameReward: 20,
        },
        shark: {
          kind: 'shark',
          name: 'Tiburón Abisal',
          isBandit: false,
          isThief: false,
          isBoss: false,
          isAquatic: true,
          isLargeMonster: true,
          isLeviathan: false,
          provoked: true,
          hp: Math.round(85 * hpScale),
          maxHp: Math.round(85 * hpScale),
          dmg: Math.round(16 * dmgScale),
          speed: 118 * spdMult,
          radius: 17,
          color: '#38bdf8',
          fameReward: 34,
        },
        kraken: {
          kind: 'kraken',
          name: 'Kraken de Guerra',
          isBandit: false,
          isThief: false,
          isBoss: true,
          isAquatic: true,
          isLargeMonster: true,
          isLeviathan: false,
          provoked: true,
          hp: Math.round(250 * hpScale),
          maxHp: Math.round(250 * hpScale),
          dmg: Math.round(24 * dmgScale),
          speed: 82 * spdMult,
          radius: 24,
          color: '#f97316',
          fameReward: 140,
        },
        leviathan: {
          kind: 'leviathan',
          name: 'Leviatán Abisal',
          isBandit: false,
          isThief: false,
          isBoss: true,
          isAquatic: true,
          isLargeMonster: true,
          isLeviathan: true,
          leviathanStage: 'adult',
          provoked: false,
          hp: Math.round(2400 * hpScale),
          maxHp: Math.round(2400 * hpScale),
          dmg: Math.round(48 * dmgScale),
          speed: 62 * spdMult,
          radius: 210,
          color: '#0e7490',
          fameReward: 600,
        },
        leviathan_baby: {
          kind: 'leviathan_baby',
          name: 'Cría de Leviatán',
          isBandit: false,
          isThief: false,
          isBoss: false,
          isAquatic: true,
          isLargeMonster: true,
          isLeviathan: true,
          leviathanStage: 'baby',
          provoked: false,
          hp: Math.round(420 * hpScale),
          maxHp: Math.round(420 * hpScale),
          dmg: Math.round(16 * dmgScale),
          speed: 78 * spdMult,
          radius: 76,
          color: '#22d3ee',
          fameReward: 140,
        },
        leviathan_adult: {
          kind: 'leviathan_adult',
          name: 'Leviatán Adulto',
          isBandit: false,
          isThief: false,
          isBoss: true,
          isAquatic: true,
          isLargeMonster: true,
          isLeviathan: true,
          leviathanStage: 'adult',
          provoked: false,
          hp: Math.round(2400 * hpScale),
          maxHp: Math.round(2400 * hpScale),
          dmg: Math.round(46 * dmgScale),
          speed: 64 * spdMult,
          radius: 215,
          color: '#0e7490',
          fameReward: 620,
        },
        leviathan_elder: {
          kind: 'leviathan_elder',
          name: 'Leviatán Anciano Horror',
          isBandit: false,
          isThief: false,
          isBoss: true,
          isAquatic: true,
          isLargeMonster: true,
          isLeviathan: true,
          leviathanStage: 'elder',
          provoked: false,
          hp: Math.round(6200 * hpScale),
          maxHp: Math.round(6200 * hpScale),
          dmg: Math.round(78 * dmgScale),
          speed: 54 * spdMult,
          radius: 365,
          color: '#312e81',
          fameReward: 1600,
        },
        zombie_walker: {
          kind: 'zombie_walker',
          name: 'Ahogado Putrefacto',
          isBandit: false,
          isThief: false,
          isBoss: false,
          isAquatic: false,
          isLargeMonster: false,
          isLeviathan: false,
          isZombie: true,
          provoked: true,
          hp: Math.round(52 * hpScale),
          maxHp: Math.round(52 * hpScale),
          dmg: Math.round(11 * dmgScale),
          speed: 74 * spdMult,
          radius: 14,
          color: '#65a30d',
          fameReward: 20,
        },
        zombie_brute: {
          kind: 'zombie_brute',
          name: 'Bruto Necrótico',
          isBandit: false,
          isThief: false,
          isBoss: false,
          isAquatic: false,
          isLargeMonster: true,
          isLeviathan: false,
          isZombie: true,
          provoked: true,
          hp: Math.round(115 * hpScale),
          maxHp: Math.round(115 * hpScale),
          dmg: Math.round(19 * dmgScale),
          speed: 66 * spdMult,
          radius: 19,
          color: '#4d7c0f',
          fameReward: 42,
        },
        zombie_spitter: {
          kind: 'zombie_spitter',
          name: 'Escupidor Tóxico',
          isBandit: false,
          isThief: false,
          isBoss: false,
          isAquatic: false,
          isLargeMonster: false,
          isLeviathan: false,
          isZombie: true,
          provoked: true,
          hp: Math.round(46 * hpScale),
          maxHp: Math.round(46 * hpScale),
          dmg: Math.round(13 * dmgScale),
          speed: 80 * spdMult,
          radius: 13,
          color: '#a3e635',
          fameReward: 28,
        },
        hacker_jammer: {
          kind: 'hacker_jammer',
          name: 'Hacker Saboteador',
          isBandit: true,
          isThief: true,
          isBoss: false,
          isAquatic: false,
          isLargeMonster: false,
          isLeviathan: false,
          isHacker: true,
          rangedShotKind: 'shock',
          provoked: true,
          hp: Math.round(62 * hpScale),
          maxHp: Math.round(62 * hpScale),
          dmg: Math.round(14 * dmgScale),
          speed: 105 * spdMult,
          radius: 14,
          color: '#22d3ee',
          fameReward: 40,
        },
        hacker_siphoner: {
          kind: 'hacker_siphoner',
          name: 'Dron Sifón EMP',
          isBandit: false,
          isThief: false,
          isBoss: false,
          isAquatic: false,
          isLargeMonster: false,
          isLeviathan: false,
          isHacker: true,
          rangedShotKind: 'shock',
          provoked: true,
          hp: Math.round(48 * hpScale),
          maxHp: Math.round(48 * hpScale),
          dmg: Math.round(12 * dmgScale),
          speed: 122 * spdMult,
          radius: 13,
          color: '#38bdf8',
          fameReward: 34,
        },
        hacker_corsair: {
          kind: 'hacker_corsair',
          name: 'Corsario Ciber-Pirata',
          isBandit: true,
          isThief: false,
          isBoss: true,
          isSemiBoss: true,
          isAquatic: false,
          isLargeMonster: false,
          isLeviathan: false,
          isHacker: true,
          rangedShotKind: 'shock',
          provoked: true,
          hp: Math.round(280 * hpScale),
          maxHp: Math.round(280 * hpScale),
          dmg: Math.round(24 * dmgScale),
          speed: 96 * spdMult,
          radius: 22,
          color: '#06b6d4',
          fameReward: 185,
        },
        abysmal_eel: {
          kind: 'abysmal_eel',
          name: 'Anguila Voltáica Abisal',
          isBandit: false,
          isThief: false,
          isBoss: false,
          isSemiBoss: true,
          isAquatic: true,
          isLargeMonster: true,
          isLeviathan: false,
          rangedShotKind: 'shock',
          provoked: true,
          hp: Math.round(240 * hpScale),
          maxHp: Math.round(240 * hpScale),
          dmg: Math.round(20 * dmgScale),
          speed: 112 * spdMult,
          radius: 21,
          color: '#22d3ee',
          fameReward: 120,
        },
        abysmal_knight: {
          kind: 'abysmal_knight',
          name: 'Caballero del Coral Negro',
          isBandit: false,
          isThief: false,
          isBoss: false,
          isSemiBoss: true,
          isAquatic: false,
          isLargeMonster: true,
          isLeviathan: false,
          provoked: true,
          hp: Math.round(285 * hpScale),
          maxHp: Math.round(285 * hpScale),
          dmg: Math.round(22 * dmgScale),
          speed: 106 * spdMult,
          radius: 22,
          color: '#6d28d9',
          fameReward: 135,
        },
        abysmal_siren: {
          kind: 'abysmal_siren',
          name: 'Sirena Espectral',
          isBandit: false,
          isThief: false,
          isBoss: false,
          isSemiBoss: true,
          isAquatic: true,
          isLargeMonster: false,
          isLeviathan: false,
          rangedShotKind: 'sonic',
          provoked: true,
          hp: Math.round(260 * hpScale),
          maxHp: Math.round(260 * hpScale),
          dmg: Math.round(21 * dmgScale),
          speed: 108 * spdMult,
          radius: 20,
          color: '#a855f7',
          fameReward: 130,
        },
        abysmal_warden: {
          kind: 'abysmal_warden',
          name: 'Guardián del Abismo',
          isBandit: false,
          isThief: false,
          isBoss: true,
          isAquatic: true,
          isLargeMonster: true,
          isLeviathan: false,
          provoked: true,
          hp: Math.round(620 * hpScale),
          maxHp: Math.round(620 * hpScale),
          dmg: Math.round(32 * dmgScale),
          speed: 78 * spdMult,
          radius: 32,
          color: '#4338ca',
          fameReward: 270,
        },
        abysmal_angler: {
          kind: 'abysmal_angler',
          name: 'Rape Abismal',
          isBandit: false,
          isThief: false,
          isBoss: false,
          isSemiBoss: true,
          isAquatic: true,
          isLargeMonster: true,
          isLeviathan: false,
          provoked: true,
          hp: Math.round(310 * hpScale),
          maxHp: Math.round(310 * hpScale),
          dmg: Math.round(23 * dmgScale),
          speed: 94 * spdMult,
          radius: 24,
          color: '#7c3aed',
          fameReward: 145,
        },
        abysmal_golem: {
          kind: 'abysmal_golem',
          name: 'Gólem Basáltico Abisal',
          isBandit: false,
          isThief: false,
          isBoss: false,
          isSemiBoss: true,
          isAquatic: true,
          isLargeMonster: true,
          isLeviathan: false,
          provoked: true,
          hp: Math.round(420 * hpScale),
          maxHp: Math.round(420 * hpScale),
          dmg: Math.round(27 * dmgScale),
          speed: 70 * spdMult,
          radius: 28,
          color: '#1e1b4b',
          fameReward: 175,
        },
        abysmal_empress: {
          kind: 'abysmal_empress',
          name: 'Emperatriz del Vacío',
          isBandit: false,
          isThief: false,
          isBoss: true,
          isAquatic: true,
          isLargeMonster: true,
          isLeviathan: false,
          rangedShotKind: 'sonic',
          provoked: true,
          hp: Math.round(980 * hpScale),
          maxHp: Math.round(980 * hpScale),
          dmg: Math.round(42 * dmgScale),
          speed: 90 * spdMult,
          radius: 34,
          color: '#c026d3',
          fameReward: 480,
        },
        abysmal_behemoth: {
          kind: 'abysmal_behemoth',
          name: 'Behemot Abisal',
          isBandit: false,
          isThief: false,
          isBoss: true,
          isAquatic: true,
          isLargeMonster: true,
          isLeviathan: false,
          provoked: true,
          hp: Math.round(840 * hpScale),
          maxHp: Math.round(840 * hpScale),
          dmg: Math.round(38 * dmgScale),
          speed: 72 * spdMult,
          radius: 36,
          color: '#be185d',
          fameReward: 380,
        },
        abysmal_necromancer: {
          kind: 'abysmal_necromancer',
          name: 'Nigromante de la Fosa',
          isBandit: false,
          isThief: false,
          isBoss: true,
          isAquatic: false,
          isLargeMonster: true,
          isLeviathan: false,
          rangedShotKind: 'necrotic',
          provoked: true,
          hp: Math.round(680 * hpScale),
          maxHp: Math.round(680 * hpScale),
          dmg: Math.round(33 * dmgScale),
          speed: 82 * spdMult,
          radius: 28,
          color: '#4c1d95',
          fameReward: 320,
        },
        abysmal_hydra: {
          kind: 'abysmal_hydra',
          name: 'Hidra de la Fosa',
          isBandit: false,
          isThief: false,
          isBoss: true,
          isAquatic: true,
          isLargeMonster: true,
          isLeviathan: false,
          provoked: true,
          hp: Math.round(720 * hpScale),
          maxHp: Math.round(720 * hpScale),
          dmg: Math.round(34 * dmgScale),
          speed: 84 * spdMult,
          radius: 32,
          color: '#9333ea',
          fameReward: 340,
        },
        abysmal_sovereign: {
          kind: 'abysmal_sovereign',
          name: 'Soberano del Abismo Eterno',
          isBandit: false,
          isThief: false,
          isBoss: true,
          isAquatic: true,
          isLargeMonster: true,
          isLeviathan: false,
          rangedShotKind: 'void',
          provoked: true,
          hp: Math.round(1250 * hpScale),
          maxHp: Math.round(1250 * hpScale),
          dmg: Math.round(48 * dmgScale),
          speed: 86 * spdMult,
          radius: 40,
          color: '#3b0764',
          fameReward: 650,
        },
        marine_patrol: {
          kind: 'marine_patrol',
          name: 'Patrullero de La Marina',
          isBandit: true,
          isThief: false,
          isBoss: false,
          isAquatic: false,
          isLargeMonster: false,
          isLeviathan: false,
          rangedShotKind: 'shock',
          provoked: true,
          hp: Math.round(92 * hpScale),
          maxHp: Math.round(92 * hpScale),
          dmg: Math.round(15 * dmgScale),
          speed: 98 * spdMult,
          radius: 15,
          color: '#3b82f6',
          fameReward: 55,
        },
        marine_captain: {
          kind: 'marine_captain',
          name: 'Capitán de La Marina',
          isBandit: true,
          isThief: false,
          isBoss: false,
          isSemiBoss: true,
          isAquatic: false,
          isLargeMonster: false,
          isLeviathan: false,
          rangedShotKind: 'shock',
          provoked: true,
          hp: Math.round(245 * hpScale),
          maxHp: Math.round(245 * hpScale),
          dmg: Math.round(24 * dmgScale),
          speed: 92 * spdMult,
          radius: 20,
          color: '#1d4ed8',
          fameReward: 165,
        },
        gov_agent: {
          kind: 'gov_agent',
          name: 'Agente del Gobierno Mundial',
          isBandit: true,
          isThief: false,
          isBoss: true,
          isSemiBoss: true,
          isAquatic: false,
          isLargeMonster: false,
          isLeviathan: false,
          rangedShotKind: 'void',
          provoked: true,
          hp: Math.round(390 * hpScale),
          maxHp: Math.round(390 * hpScale),
          dmg: Math.round(32 * dmgScale),
          speed: 112 * spdMult,
          radius: 21,
          color: '#f8fafc',
          fameReward: 310,
        },
      };

      const t = templates[kind];
      const useTerritory =
        !territoryOpts?.noTerritory &&
        !storyMissionId &&
        !warRef.current.active &&
        (Boolean(territoryOpts?.homeX !== undefined) ||
          t.isBoss ||
          t.isSemiBoss ||
          kind.startsWith('abysmal_'));

      enemiesRef.current.push({
        id: eid++,
        ...t,
        x,
        y,
        vx: 0,
        vy: 0,
        cd: 0.7,
        hitT: 0,
        gaitPhase: Math.random() * 6,
        onLand: false,
        boardedRaft: false,
        parkedBoat: null,
        stealProgress: 0,
        stolenBag: null,
        storyMissionId: storyMissionId || null,
        swallowTargetIslandId: null,
        swallowTimer: 0,
        ...(useTerritory
          ? {
              homeX: territoryOpts?.homeX ?? x,
              homeY: territoryOpts?.homeY ?? y,
              territoryRadius: territoryOpts?.territoryRadius ?? (t.isBoss ? 480 : 390),
            }
          : {}),
      });

      if (t.isLeviathan) {
        showToast(
          t.leviathanStage === 'baby'
            ? '🐋 Cría de Leviatán avistada: pacífica si no la provocas'
            : t.leviathanStage === 'elder'
              ? '☣️ ¡HORROR ANCESTRAL! Un Leviatán más grande que dos islas emerge del abismo'
              : '☣️ ¡Un coloso Leviatán del tamaño de una isla emerge! Pacífico si no atacas (Solo Arma Nuclear)'
        );
      } else if (t.kind.startsWith('abysmal_')) {
        showToast(`👁️ ¡${t.name} emerge de las profundidades!`);
      } else if (t.isBandit && Math.random() < 0.35) {
        const line = BANDIT_COMIC_LINES[Math.floor(Math.random() * BANDIT_COMIC_LINES.length)];
        pushComic(t.name, line, x, y, '#fb7185');
      }
    },
    [pushComic, showToast]
  );

  const ensureChunksAround = useCallback(
    (wx: number, wy: number) => {
      const { cx, cy } = getChunkCoords(wx, wy);
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const key = `${cx + dx},${cy + dy}`;
          if (loadedChunksRef.current.has(key)) continue;
          loadedChunksRef.current.add(key);
          const gen = generateChunkIsland(cx + dx, cy + dy, () => eid++);
          if (gen) {
            const { island: isl, animals } = gen;
            if (stateRef.current.swallowedIslands.includes(isl.id)) {
              continue;
            }
            if (stateRef.current.discoveredIslands.includes(isl.id)) {
              isl.discovered = true;
            }
            const usedMysteryIds = new Set<string>(stateRef.current.discoveredMysteries || []);
            for (const existingIsl of islandsRef.current) {
              for (const existingNode of existingIsl.nodes) {
                if (
                  (existingNode.kind === 'mystery_monolith' || existingNode.kind === 'easter_egg') &&
                  !existingNode.depleted &&
                  existingNode.mysteryId
                ) {
                  usedMysteryIds.add(existingNode.mysteryId);
                }
              }
            }
            for (const n of isl.nodes) {
              if (n.kind === 'village' && stateRef.current.pillagedVillages.includes(n.id)) {
                n.depleted = true;
              }
              if (n.kind === 'mystery_monolith' || n.kind === 'easter_egg') {
                if (!n.mysteryId || usedMysteryIds.has(n.mysteryId)) {
                  const wantEgg = n.kind === 'easter_egg';
                  const replacement = WORLD_MYSTERIES_CATALOG.find((m) => {
                    const isEgg = m.id.startsWith('egg_');
                    return isEgg === wantEgg && !usedMysteryIds.has(m.id);
                  });
                  if (replacement) {
                    n.mysteryId = replacement.id;
                    usedMysteryIds.add(replacement.id);
                  } else {
                    n.depleted = true;
                  }
                } else {
                  usedMysteryIds.add(n.mysteryId);
                }
              }
            }
            islandsRef.current.push(isl);
            animalsRef.current.push(...animals);
            compoundWallsRef.current.push(...buildIslandCompoundWalls(isl));

            const islNpcs = generateIslandWorldNpcs(isl, cx + dx, cy + dy);
            for (const wNpc of islNpcs) {
              if (!worldNpcsRef.current.some((x) => x.id === wNpc.id)) {
                worldNpcsRef.current.push(wNpc);
              }
            }
            if (isl.id === 'isl_1_0') {
              const starterNpc = getStarterBargeWorldNpc(isl);
              const existingIdx = worldNpcsRef.current.findIndex((x) => x.id === starterNpc.id);
              if (existingIdx >= 0) worldNpcsRef.current[existingIdx] = starterNpc;
              else worldNpcsRef.current.push(starterNpc);
            }

            if (isl.biome === 'zombie') {
              spawnEnemyNear('zombie_walker', isl.x + 28, isl.y - 24);
              spawnEnemyNear('zombie_spitter', isl.x - 32, isl.y + 20);
              if (Math.random() < 0.45) spawnEnemyNear('zombie_brute', isl.x + 12, isl.y + 34);
            } else if (isl.biome === 'chatarra' && stateRef.current.elapsedSeconds > 60) {
              spawnEnemyNear('hacker_jammer', isl.x + 36, isl.y - 18);
              spawnEnemyNear('hacker_siphoner', isl.x - 28, isl.y + 26);
            } else if (isl.pirateRank) {
              const rm = getPirateRankInfo(isl.pirateRank);
              const hqNode = isl.nodes.find((n) => n.kind === 'pirate_camp');
              const hx = hqNode ? hqNode.x : isl.x;
              const hy = hqNode ? hqNode.y : isl.y;
              const pirateTerrR = Math.max(310, isl.radius * 0.72);
              for (let g = 0; g < rm.guards; g++) {
                const ga = (g / Math.max(1, rm.guards)) * Math.PI * 2;
                const gKind: EnemyKind =
                  g % 3 === 1 ? 'bandit_gunner' : g % 3 === 2 ? 'bandit_thief' : 'bandit_grunt';
                spawnEnemyNear(
                  gKind,
                  hx + Math.cos(ga) * 44,
                  hy + Math.sin(ga) * 44,
                  undefined,
                  rm.statMult,
                  { homeX: hx, homeY: hy, territoryRadius: pirateTerrR }
                );
              }
              if (rm.hasBoss) {
                spawnEnemyNear('bandit_boss', hx + 18, hy - 22, undefined, rm.statMult, {
                  homeX: hx,
                  homeY: hy,
                  territoryRadius: pirateTerrR,
                });
              }
            } else if (isl.biome === 'pirata' && stateRef.current.elapsedSeconds > 75) {
              spawnEnemyNear('bandit_grunt', isl.x + 38, isl.y - 24);
              spawnEnemyNear('bandit_gunner', isl.x + isl.radius + 40, isl.y + 22);
            }
          }
        }
      }
    },
    [spawnEnemyNear]
  );

  const triggerRandomEvent = useCallback(() => {
    if (randomEventRef.current.active || warRef.current.active) return;
    if (stateRef.current.stealthTimer > 0 || playerRef.current.inShelter) return;

    const s = stateRef.current;
    const pl = playerRef.current;
    const raft = raftRef.current;
    const isCalm = s.elapsedSeconds < 150;
    const kinds: RandomEventKind[] = isCalm
      ? ['fish_frenzy', 'fish_frenzy', 'salvage_surge']
      : ['pirate_hunt', 'fish_frenzy', 'pirate_hunt', 'fish_frenzy', 'guerrilla_war', 'salvage_surge'];
    const kind = kinds[Math.floor(Math.random() * kinds.length)];

    const activeCrew = s.survivors.filter((sv) => sv.unlocked);
    const speaker =
      activeCrew.length > 0 ? activeCrew[Math.floor(Math.random() * activeCrew.length)] : null;
    const speakerDef = speaker ? SURVIVORS_CATALOG.find((c) => c.id === speaker.id) : null;
    const speakerName = speakerDef?.name || 'Vigía de Cubierta';
    const speakerColor = speakerDef?.color || '#38bdf8';

    if (kind === 'pirate_hunt') {
      randomEventRef.current = {
        active: true,
        kind,
        title: 'Caza de Piratas',
        timer: 45,
        targetCount: 3,
        progress: 0,
      };
      spawnEnemyNear('bandit_grunt');
      spawnEnemyNear('bandit_thief');
      spawnEnemyNear('bandit_gunner');
      showToast('¡Evento: Caza de Piratas! Elimina 3 corsarios');
      sfx.warHorn(s.sound);
      const crewLine =
        PIRATE_HUNT_DIALOGUES[Math.floor(Math.random() * PIRATE_HUNT_DIALOGUES.length)];
      const pirateTaunt =
        BANDIT_COMIC_LINES[Math.floor(Math.random() * BANDIT_COMIC_LINES.length)];
      const spMood = speaker ? getNpcMoodState(s, speaker.id).mood : 'enojo';
      enqueuePausedDialogues([
        {
          id: `ev_ph_crew_${Date.now()}`,
          speaker: speakerName,
          role: speakerDef?.role || 'Tripulación',
          mood: spMood,
          color: speakerColor,
          text: crewLine,
        },
        {
          id: `ev_ph_pir_${Date.now()}`,
          speaker: 'Capitán Corsario',
          role: 'Asaltante Pirata',
          mood: 'enojo',
          color: '#fb7185',
          text: pirateTaunt,
        },
      ]);
    } else if (kind === 'fish_frenzy') {
      randomEventRef.current = {
        active: true,
        kind,
        title: 'Pesca a Torrentes',
        timer: 28,
        targetCount: 6,
        progress: 0,
      };
      timersRef.current.fishBurst = 1.9;
      for (let k = 0; k < 3; k++) {
        const ang = (Math.PI * 2 * k) / 3 + Math.random() * 0.6;
        const dist = 68 + Math.random() * 88;
        const fx = pl.x + Math.cos(ang) * dist;
        const fy = pl.y + Math.sin(ang) * dist;
        spawnFloatingDrop(fx, fy, 'pez', 1);
        splashesRef.current.push({
          x: fx,
          y: fy,
          life: 0.55,
          maxLife: 0.55,
          maxRadius: 26,
        });
      }
      showToast('¡Evento: Pesca a Torrentes! Atrapa 6 peces en el mar');
      sfx.pickup(s.sound);
      const crewLine =
        FISH_FRENZY_DIALOGUES[Math.floor(Math.random() * FISH_FRENZY_DIALOGUES.length)];
      const spMood = speaker ? getNpcMoodState(s, speaker.id).mood : 'felicidad';
      enqueuePausedDialogues([
        {
          id: `ev_ff_${Date.now()}`,
          speaker: speakerName,
          role: speakerDef?.role || 'Tripulación',
          mood: spMood,
          color: '#22d3ee',
          text: crewLine,
        },
      ]);
    } else if (kind === 'guerrilla_war') {
      randomEventRef.current = {
        active: true,
        kind,
        title: 'Guerra de Guerrillas',
        timer: 44,
        targetCount: 4,
        progress: 0,
      };
      spawnEnemyNear('bandit_thief');
      spawnEnemyNear('bandit_gunner');
      spawnEnemyNear('crab');
      spawnEnemyNear('shark');
      showToast('¡Evento: Guerra de Guerrillas! Emboscada mixta');
      sfx.warHorn(s.sound);
      const crewLine =
        GUERRILLA_DIALOGUES[Math.floor(Math.random() * GUERRILLA_DIALOGUES.length)];
      pushComic(speakerName, crewLine, raft.x, raft.y, speakerColor);
    } else {
      randomEventRef.current = {
        active: true,
        kind,
        title: 'Corriente de Suministros',
        timer: 24,
        targetCount: 0,
        progress: 0,
      };
      showToast('¡Evento: Corriente de Suministros! Recoge cajas y piezas');
      sfx.chest(s.sound);
      const crewLine =
        SALVAGE_DIALOGUES[Math.floor(Math.random() * SALVAGE_DIALOGUES.length)];
      pushComic(speakerName, crewLine, raft.x, raft.y, '#fbbf24');
    }
    syncUi();
  }, [enqueuePausedDialogues, pushComic, showToast, spawnEnemyNear, spawnFloatingDrop, syncUi]);

  const startWarEvent = useCallback(
    (targetKingdomId?: string, targetClanId?: string) => {
      if (warRef.current.active) return;
      if (
        !targetKingdomId &&
        !targetClanId &&
        (stateRef.current.stealthTimer > 0 || playerRef.current.inShelter)
      ) {
        warRef.current.cooldown = 30;
        return;
      }

      const waveNum = stateRef.current.stats.warsWon + 1;
      const isIslandWar = Boolean(targetKingdomId || targetClanId);
      const kd = KINGDOMS_CATALOG.find((k) => k.id === targetKingdomId);
      const rc = stateRef.current.clan.rivals.find((c) => c.id === targetClanId);
      const isPirateWar = isIslandWar || waveNum % 2 === 1;
      const total = isIslandWar ? 6 : 5 + Math.min(7, waveNum * 2);

      warRef.current = {
        active: true,
        title: targetClanId
          ? `Guerra de Clanes: [${rc?.tag || 'CLAN'}] ${rc?.name || ''}`
          : targetKingdomId
            ? `Guerra de Islas: ${kd?.name || 'Reino Rival'}`
            : isPirateWar
              ? 'Guerra Naval: Flota Pirata'
              : 'Guerra Abisal: Marea Kraken',
        wave: waveNum,
        remaining: total,
        total,
        cooldown: 80,
        targetKingdomId: targetKingdomId || null,
        targetClanId: targetClanId || null,
        isIslandWar,
      };

      sfx.warHorn(stateRef.current.sound);
      showToast(`¡${warRef.current.title}!`);

      const activeCrew = stateRef.current.survivors.filter((sv) => sv.unlocked);
      const speaker = activeCrew[Math.floor(Math.random() * activeCrew.length)];
      const def = SURVIVORS_CATALOG.find((c) => c.id === speaker?.id);
      if (def) {
        pushComic(
          def.name,
          def.quotes[Math.floor(Math.random() * def.quotes.length)],
          raftRef.current.x,
          raftRef.current.y,
          def.color
        );
      }

      for (let i = 0; i < total; i++) {
        if (isPirateWar) {
          const kind: EnemyKind =
            i === total - 1
              ? 'bandit_boss'
              : i % 3 === 0
                ? 'bandit_thief'
                : i % 2 === 0
                  ? 'bandit_gunner'
                  : 'bandit_grunt';
          spawnEnemyNear(kind);
        } else {
          const kind: EnemyKind =
            i === total - 1 ? 'kraken' : i % 2 === 0 ? 'shark' : 'crab';
          spawnEnemyNear(kind);
        }
      }
      syncUi();
    },
    [pushComic, showToast, spawnEnemyNear, syncUi]
  );

  const handleAnimalDefeated = useCallback(
    (idx: number) => {
      const a = animalsRef.current[idx];
      if (!a) return;
      animalsRef.current.splice(idx, 1);
      const s = stateRef.current;

      if (a.isWild) {
        spawnFloatingDrop(a.x, a.y, 'pez', 2);
        if (Math.random() < 0.5) spawnFloatingDrop(a.x + 8, a.y - 6, 'hie', 1);
        grantXpAndFame(20, 18);
      } else {
        spawnFloatingDrop(a.x, a.y, 'pez', 1);
        spawnFloatingDrop(a.x + 6, a.y + 6, 'veg', 1);
        grantXpAndFame(10, 8);
      }
      sfx.hit(s.sound);
      syncUi();
    },
    [grantXpAndFame, spawnFloatingDrop, syncUi]
  );

  const handleEnemyDefeated = useCallback(
    (enemyIdx: number) => {
      const e = enemiesRef.current[enemyIdx];
      if (!e) return;
      enemiesRef.current.splice(enemyIdx, 1);

      const s = stateRef.current;
      s.stats.kills += 1;
      if (e.isBandit) s.stats.banditKills += 1;
      if (e.kind === 'leviathan_elder') {
        s.stats.elderLeviathansKilled = (s.stats.elderLeviathansKilled || 0) + 1;
      }

      const nereaLv = getSurvivorLevel(s, 'nerea');
      const bonusLoot =
        (nereaLv > 0 && Math.random() < 0.25 + nereaLv * 0.1 ? 1 : 0) +
        (hasDestiny(s, 'naval_master') ? 1 : 0);

      if (e.isBandit) {
        spawnFloatingDrop(e.x, e.y, 'oro', 1 + (bonusLoot > 0 && Math.random() < 0.4 ? 1 : 0));
        if (Math.random() < 0.45) spawnFloatingDrop(e.x + 10, e.y - 6, 'cht', 1);
      } else {
        if (Math.random() < 0.68 || bonusLoot > 0) spawnFloatingDrop(e.x, e.y, 'pez', 1);
        if (e.isLargeMonster && Math.random() < 0.45) spawnFloatingDrop(e.x - 10, e.y + 8, 'hie', 1);
      }

      const isAbyssalEnemy = e.kind.startsWith('abysmal_');
      if (e.isBoss || e.isSemiBoss || e.isLeviathan || isAbyssalEnemy) {
        if (e.isLeviathan) {
          spawnFloatingDrop(e.x, e.y + 12, 'tit', 2);
          spawnFloatingDrop(e.x + 12, e.y + 12, 'cri', 1);
          spawnFloatingDrop(e.x - 12, e.y - 8, 'tec', 1);
          spawnFloatingDrop(e.x + 18, e.y - 10, 'nuc_frag', 1);
          if (e.leviathanStage === 'elder' || Math.random() < 0.25) {
            spawnFloatingDrop(e.x - 16, e.y + 14, 'cel_frag', 1);
          }
        } else if (e.isBoss) {
          if (Math.random() < 0.55) spawnFloatingDrop(e.x, e.y + 12, 'tit', 1);
          if (Math.random() < 0.35) spawnFloatingDrop(e.x + 12, e.y + 12, 'cri', 1);
          if (isAbyssalEnemy && Math.random() < 0.08) {
            spawnFloatingDrop(e.x + 14, e.y - 8, 'cel_frag', 1);
          }
        } else if (Math.random() < 0.3) {
          spawnFloatingDrop(e.x, e.y + 10, 'tit', 1);
        }
        if (e.isBoss || e.isLeviathan) {
          tryAwardRelic(true, e.x, e.y);
        }
      }

      const distTier = getDistanceTierInfo(e.x, e.y);
      const fragDrops = rollWeaponFragmentDrop(
        e.isLeviathan
          ? e.leviathanStage === 'elder'
            ? 'leviathan_elder'
            : 'leviathan_adult'
          : isAbyssalEnemy || e.isBoss
            ? 'boss'
            : e.isSemiBoss
              ? 'elite'
              : 'normal',
        distTier.mult
      );
      fragDrops.forEach((fd, idx) => {
        spawnFloatingDrop(e.x - 8 + idx * 10, e.y - 14, fd.key, fd.amount);
      });

      const isMarinaUnit = e.kind === 'marine_patrol' || e.kind === 'marine_captain' || e.kind === 'gov_agent';
      if (isMarinaUnit) {
        const threatGain = e.kind === 'gov_agent' ? 14 : e.kind === 'marine_captain' ? 10 : 5;
        s.marineThreat = Math.min(100, (s.marineThreat || 0) + threatGain);
        const marinaK = s.kingdoms.find((k) => k.id === 'marina');
        if (marinaK) marinaK.relation = Math.max(-100, marinaK.relation - 8);
        if (e.kind === 'gov_agent') {
          const govK = s.kingdoms.find((k) => k.id === 'gobierno_mundial');
          if (govK) govK.relation = Math.max(-100, govK.relation - 12);
        }
        logWorldEvent(
          s,
          'marina',
          `Derrotaste a ${e.name} (${e.kind === 'gov_agent' ? 'Gobierno Mundial' : 'La Marina'})`
        );
      } else if (e.isBoss || e.isLeviathan || isAbyssalEnemy) {
        logWorldEvent(s, 'combat', `Venciste a ${e.name} en combate`);
      }

      const dfChance =
        e.isLeviathan || e.isBoss ? 0.38 : e.isSemiBoss || isAbyssalEnemy ? 0.25 : 0.12;
      if (Math.random() < dfChance) {
        const fruitRoll = Math.random();
        const dfKind: DevilFruitKind =
          fruitRoll < 0.34 ? 'onda' : fruitRoll < 0.67 ? 'hielo' : 'gravedad';
        const dfMeta =
          dfKind === 'hielo'
            ? { label: '❄️ Fruta Hielo (Congela)', color: '#38bdf8' }
            : dfKind === 'gravedad'
              ? { label: '🌀 Fruta Gravedad (Vórtice)', color: '#c084fc' }
              : { label: '🍊 Fruta Onda (Empuje)', color: '#fb923c' };
        dropsRef.current.push({
          id: eid++,
          kind: 'devil_fruit',
          devilFruitKind: dfKind,
          label: dfMeta.label,
          color: dfMeta.color,
          x: e.x + (Math.random() - 0.5) * 18,
          y: e.y + (Math.random() - 0.5) * 18,
          vx: (Math.random() - 0.5) * 28,
          vy: (Math.random() - 0.5) * 28,
          bob: Math.random() * 6,
        });
      }

      if (e.stolenBag) {
        s.stats.stolenRecovered += 1;
        spawnFloatingDrop(e.x, e.y - 12, e.stolenBag.key, e.stolenBag.amount * 2);
        showToast('¡Botín recuperado al doble!');
      }

      if (e.bountyId) {
        const pb = s.pirateBounties.find((b) => b.id === e.bountyId);
        if (pb && !pb.claimed) {
          pb.claimed = true;
          pb.active = false;
          pb.targetX = undefined;
          pb.targetY = undefined;
          s.resources.oro += pb.rewardOro;
          s.stats.bountiesClaimed += 1;
          s.newspaper.articles.unshift({
            id: `news_bounty_${pb.id}_${s.dayCount}`,
            category: 'RECOMPENSA',
            headline: `¡${s.playerProfile.name} cobra la cabeza de ${pb.name}!`,
            body: `El Correo del Horizonte confirma la derrota de ${pb.name} (${pb.bountyValue.toLocaleString()} B). Recompensa pagada: +${pb.rewardOro} Oro y +${pb.rewardFame} Fama.`,
            day: s.dayCount,
          });
          s.newspaper.articles = s.newspaper.articles.slice(0, 6);
          s.newspaper.unread = true;
          sfx.levelUp(s.sound);
          showToast(`¡Recompensa cobrada por ${pb.name}! +${pb.rewardOro} Oro`);
          syncLeaderboard(false);
        }
      }

      grantXpAndFame(e.isLeviathan ? 140 : e.isBoss ? 75 : 22, e.fameReward);
      const vicMood = registerCombatVictoryMood(s, Boolean(e.isBoss || e.isLeviathan));
      if (vicMood.newMoodAlert) showToast(vicMood.newMoodAlert);
      const sitKill = registerCombatActionIntensity(s, {
        killedEnemy: true,
        isMajor: Boolean(e.isBoss || e.isSemiBoss || e.isLeviathan),
      });
      if (sitKill.alert) {
        showToast(sitKill.alert);
        pushPop(playerRef.current.x, playerRef.current.y - 30, sitKill.alert.split('!')[0] + '!', sitKill.color || '#f43f5e');
      }
      if (e.isBoss || e.isLeviathan) shiftWorldNpcMoods(s, 'victory');

      if (
        randomEventRef.current.active &&
        randomEventRef.current.targetCount > 0 &&
        (randomEventRef.current.kind === 'guerrilla_war' ||
          (randomEventRef.current.kind === 'pirate_hunt' && e.isBandit))
      ) {
        randomEventRef.current.progress += 1;
        if (randomEventRef.current.progress >= randomEventRef.current.targetCount) {
          const evTitle = randomEventRef.current.title;
          const wasPirateHunt = randomEventRef.current.kind === 'pirate_hunt';
          randomEventRef.current.active = false;
          s.resources.oro += wasPirateHunt ? 8 : 7;
          s.resources.tit += wasPirateHunt ? 2 : 1;
          grantXpAndFame(wasPirateHunt ? 75 : 65, wasPirateHunt ? 95 : 85);
          sfx.chest(s.sound);
          showToast(
            `¡${evTitle} completado! +${wasPirateHunt ? 8 : 7} Oro · +${wasPirateHunt ? 2 : 1} Titanio`
          );
          const crew = s.survivors.filter((sv) => sv.unlocked);
          const sp = crew.length > 0 ? crew[Math.floor(Math.random() * crew.length)] : null;
          const spDef = sp ? SURVIVORS_CATALOG.find((c) => c.id === sp.id) : null;
          pushComic(
            spDef?.name || 'Tripulación',
            wasPirateHunt
              ? '¡Corsarios vencidos! El horizonte vuelve a ser nuestro.'
              : '¡Emboscada despejada! Gran combate en cubierta.',
            raftRef.current.x,
            raftRef.current.y,
            spDef?.color || '#fbbf24'
          );
        }
      }

      if (e.storyMissionId) {
        const sm = s.storyMissions.find((m) => m.id === e.storyMissionId);
        if (sm && sm.status === 'active') {
          sm.progress = Math.min(sm.target, sm.progress + 1);
          if (sm.progress >= sm.target) {
            sm.status = 'decision_pending';
            sm.markerX = undefined;
            sm.markerY = undefined;
            s.activeStoryMissionId = null;
            setPendingDilemmaId(sm.id);
            sfx.chest(s.sound);
            showToast(`¡${STORY_MISSION_MAP[sm.id].title}: decisión moral lista!`);
          }
        }
      }

      if (warRef.current.active) {
        warRef.current.remaining = Math.max(0, warRef.current.remaining - 1);
        if (warRef.current.remaining === 0) {
          const wasIslandWar = warRef.current.isIslandWar;
          const targetKId = warRef.current.targetKingdomId;
          const targetCId = warRef.current.targetClanId;
          warRef.current.active = false;
          warRef.current.isIslandWar = false;
          warRef.current.targetKingdomId = null;
          warRef.current.targetClanId = null;

          const clanOro = s.clan.founded && s.clan.perks.includes('perk_oro') ? 2 : 0;
          s.stats.warsWon += 1;

          if (targetCId) {
            s.stats.islandWarsWon += 1;
            const rc = s.clan.rivals.find((c) => c.id === targetCId);
            if (rc) {
              rc.atWar = false;
              rc.conquered = true;
            }
            s.resources.oro += 10 + clanOro;
            s.resources.hie += 5;
            s.resources.tec += 2;
            grantXpAndFame(140, 175);
            showToast('¡Guerra de Clanes ganada! Clan rival sometido (+10 Oro · +5 Hie · +2 Tec)');
          } else if (wasIslandWar && targetKId) {
            s.stats.islandWarsWon += 1;
            const kState = s.kingdoms.find((k) => k.id === targetKId);
            if (kState) {
              kState.atWar = false;
              kState.conquered = true;
            }
            s.resources.oro += 12 + clanOro;
            s.resources.tit += 2;
            s.resources.cri += 1;
            grantXpAndFame(140, 180);
            showToast('¡Guerra de Islas ganada! Reino conquistado (+12 Oro · +2 Tit · +1 Cri)');
          } else {
            s.resources.oro += 5 + clanOro;
            s.resources.tit += 1;
            grantXpAndFame(90, 120);
            showToast('¡Victoria en Guerra Naval! +5 Oro · +1 Titanio');
          }
          sfx.chest(s.sound);
        }
      }

      checkTitlesAndAchievements();
      syncUi();
    },
    [checkTitlesAndAchievements, grantXpAndFame, pushComic, showToast, spawnFloatingDrop, syncLeaderboard, syncUi, tryAwardRelic]
  );

  const detonateExplosion = useCallback(
    (x: number, y: number, radius: number, dmg: number, isNuclear = false) => {
      const s = stateRef.current;
      const kikoLv = getSurvivorLevel(s, 'kiko');
      const finalDmg = Math.round(dmg * (1 + kikoLv * 0.12));
      const finalRadius = hasDestiny(s, 'balistica_t3') ? radius * 1.25 : radius;

      explosionsRef.current.push({
        x,
        y,
        radius: finalRadius,
        life: isNuclear ? 0.52 : 0.35,
        maxLife: isNuclear ? 0.52 : 0.35,
        color: isNuclear ? 'rgba(163, 230, 53, 0.62)' : 'rgba(249, 115, 22, 0.55)',
      });
      timersRef.current.shake = 1.0;
      sfx.explosion(s.sound);

      let hitAnyEnemy = false;
      for (let i = enemiesRef.current.length - 1; i >= 0; i--) {
        const e = enemiesRef.current[i];
        if (Math.hypot(e.x - x, e.y - y) <= finalRadius + e.radius) {
          if (isPointInSafeZoneIsland(e.x, e.y, islandsRef.current)) continue;
          if (e.isLeviathan && !isNuclear) {
            pushPop(e.x, e.y - e.radius * 0.4, '🛡️ Inmune (Solo Nuclear)', '#38bdf8');
            continue;
          }
          hitAnyEnemy = true;
          e.hp -= finalDmg;
          e.hitT = 0.14;
          e.provoked = true;
          pushPop(
            e.x,
            e.y - (e.isLeviathan ? e.radius * 0.35 : 18),
            isNuclear ? `☢ -${finalDmg}` : `-${finalDmg}`,
            isNuclear ? '#a3e635' : '#f97316'
          );
          if (e.hp <= 0) handleEnemyDefeated(i);
        }
      }
      if (hitAnyEnemy) {
        const sitHit = registerCombatActionIntensity(s, { hitEnemy: true });
        if (sitHit.alert) showToast(sitHit.alert);
      }
    },
    [handleEnemyDefeated, pushPop, showToast]
  );

  const openChestNode = useCallback(
    (isl: IslandEntity, nodeId: string) => {
      const node = isl.nodes.find((n) => n.id === nodeId);
      if (!node || node.depleted) return;
      node.depleted = true;

      const s = stateRef.current;
      s.stats.chestsOpened += 1;
      s.resources.oro += 2 + Math.floor(Math.random() * 3);
      if (isl.biome === 'abisal' || Math.random() < 0.42) s.resources.tit += 1;
      if ((isl.biome === 'chatarra' || isl.biome === 'abisal') && Math.random() < 0.55) s.resources.tec += 1;
      if (isl.biome === 'abisal' ? Math.random() < 0.45 : Math.random() < 0.14) s.resources.cri += 1;

      const unownedRares = RARE_ISLAND_WEAPONS.filter((id) => !s.ownedWeapons.includes(id));
      const rareChance = hasDestiny(s, 'alquimia_t4') ? 0.24 : 0.12;
      if (unownedRares.length > 0 && Math.random() < rareChance) {
        const pickedId = unownedRares[Math.floor(Math.random() * unownedRares.length)];
        const wDef = WEAPON_MAP[pickedId];
        s.ownedWeapons.push(pickedId);
        const emptyIdx = s.hotbar.indexOf('');
        if (emptyIdx >= 0) s.hotbar[emptyIdx] = pickedId;
        showToast(`¡Arma rara hallada: ${wDef.name}!`);
        pushPop(node.x, node.y - 24, wDef.name, getRarityColor(wDef.rarity));
      } else {
        showToast('¡Cofre abierto! +Suministros');
        pushPop(node.x, node.y - 24, '+ORO', '#fbbf24');
      }

      if (isl.biome === 'abisal' || isl.biome === 'pirata') {
        tryAwardRelic(isl.biome === 'abisal', node.x, node.y);
      }

      const chestDistMult = getDistanceTierInfo(node.x, node.y).mult;
      const chestFrags = rollWeaponFragmentDrop(
        isl.biome === 'abisal' ? 'abyssal_chest' : 'chest',
        chestDistMult
      );
      chestFrags.forEach((cf, idx) => {
        s.resources[cf.key] = (s.resources[cf.key] || 0) + cf.amount;
        pushPop(
          node.x + 10,
          node.y - 36 - idx * 12,
          `+${cf.amount} ${cf.key.replace('frag_', 'F.').toUpperCase()}`,
          '#c084fc'
        );
      });
      if (Math.random() < 0.06) {
        s.resources.nuc_frag += 1;
      }
      if (isl.biome === 'abisal' && Math.random() < 0.08) {
        s.resources.cel_frag += 1;
      }

      sfx.chest(s.sound);
      grantXpAndFame(45, 55);
      checkTitlesAndAchievements();
      saveState(s);
      syncUi();
    },
    [checkTitlesAndAchievements, grantXpAndFame, pushPop, showToast, syncUi, tryAwardRelic]
  );

  const discoverMysteryNode = useCallback(
    (_isl: IslandEntity, node: IslandNode) => {
      if (node.depleted) return;
      const s = stateRef.current;
      if (node.mysteryId && s.discoveredMysteries?.includes(node.mysteryId)) {
        node.depleted = true;
        showToast('✨ Este monolito/huevo de pascua ya fue descubierto anteriormente');
        return;
      }
      node.depleted = true;
      const mDef = node.mysteryId ? MYSTERY_MAP[node.mysteryId] : undefined;
      if (node.mysteryId) {
        if (!s.discoveredMysteries) s.discoveredMysteries = [];
        if (!s.discoveredMysteries.includes(node.mysteryId)) {
          s.discoveredMysteries.push(node.mysteryId);
        }
        // Mark any duplicate pre-loaded nodes across the map as depleted
        for (const otherIsl of islandsRef.current) {
          for (const otherNode of otherIsl.nodes) {
            if (otherNode.mysteryId === node.mysteryId) {
              otherNode.depleted = true;
            }
          }
        }
      }
      logWorldEvent(s, 'mystery', `Descubriste ${mDef?.title || 'un misterio antiguo'}`);
      const rewardOro = mDef?.rewardOro ?? 3;
      const rewardFame = mDef?.rewardFame ?? 75;
      s.resources.oro += rewardOro;
      if (mDef?.bonusKey && mDef?.bonusAmount) {
        s.resources[mDef.bonusKey] = (s.resources[mDef.bonusKey] || 0) + mDef.bonusAmount;
      }
      grantXpAndFame(55, rewardFame);
      sfx.levelUp(s.sound);
      const count = s.discoveredMysteries?.length || 1;
      const totalMyst = WORLD_MYSTERIES_CATALOG.length;
      const title = mDef?.title || 'Misterio del Océano';
      const lore = mDef?.lore || 'Has descifrado un vestigio antiguo del mar.';
      pushPop(node.x, node.y - 26, `✨ ${title}`, mDef?.color || '#fde047');
      showToast(`✨ Descubierto (${count}/${totalMyst}): ${title} · +${rewardOro} Oro`);
      enqueuePausedDialogues([
        {
          id: `mystery_${node.id}_${Date.now()}`,
          speaker: node.kind === 'easter_egg' ? '🥚 Huevo de Pascua' : '🗿 Misterio Antiguo',
          role: `Registro ${count}/${totalMyst}`,
          mood: 'orgullo',
          color: mDef?.color || '#22d3ee',
          text: `${title}: ${lore}`,
        },
      ]);
      checkTitlesAndAchievements();
      saveState(s);
      syncUi();
    },
    [checkTitlesAndAchievements, enqueuePausedDialogues, grantXpAndFame, pushPop, showToast, syncUi]
  );

  const handleVillageAction = useCallback(
    (villageNode: IslandNode, action: 'trade' | 'pillage') => {
      if (villageNode.depleted) return;
      const s = stateRef.current;
      const kd = s.kingdoms.find((k) => k.id === (villageNode.kingdomId || 'coralia'));

      if (action === 'trade') {
        s.stats.villagesTraded += 1;
        s.resources.oro += 4;
        s.resources.agu += 2;
        s.resources.veg += 2;
        if (kd) kd.relation = Math.min(100, kd.relation + 15);
        const valeria = s.acquaintances.find((a) => a.id === 'acq_valeria');
        if (valeria) {
          valeria.affinity += 10;
          valeria.status = 'amigo';
        }
        grantXpAndFame(30, 35);
        sfx.pickup(s.sound);
        showToast(`Comercio amistoso en ${villageNode.villageName}: +4 Oro · +2 Veg`);
        pushComic(
          villageNode.villageName || 'Aldeano',
          '¡Gracias por comerciar en paz, Capitán!',
          villageNode.x,
          villageNode.y,
          '#34d399'
        );
      } else {
        villageNode.depleted = true;
        s.pillagedVillages.push(villageNode.id);
        s.stats.villagesPillaged += 1;
        s.resources.oro += 12;
        s.resources.mad += 10;
        s.resources.hie += 3;
        s.resources.tit += 1;
        if (kd) {
          kd.relation = Math.max(-100, kd.relation - 65);
          kd.atWar = true;
        }
        const aurelio = s.acquaintances.find((a) => a.id === 'acq_aurelio');
        if (aurelio) {
          aurelio.affinity -= 40;
          aurelio.status = 'enemigo';
        }
        const drake = s.acquaintances.find((a) => a.id === 'acq_drake');
        if (drake) {
          drake.affinity += 20;
          if (drake.affinity >= 20) drake.status = 'amigo';
        }
        spawnEnemyNear('bandit_grunt', villageNode.x + 34, villageNode.y + 20);
        spawnEnemyNear('bandit_gunner', villageNode.x - 34, villageNode.y - 20);
        tryAwardRelic(true, villageNode.x, villageNode.y);
        grantXpAndFame(75, 95);
        sfx.explosion(s.sound);
        showToast(`¡Saqueaste ${villageNode.villageName}! +12 Oro · El reino te declara enemigo`);
      }
      saveState(s);
      syncUi();
    },
    [grantXpAndFame, pushComic, showToast, spawnEnemyNear, syncUi, tryAwardRelic]
  );

  const doPrimaryAction = useCallback(
    (aimAngle?: number) => {
      if (modeRef.current !== 'PLAYING' || uiPausedRef.current) return;
      const pl = playerRef.current;
      const s = stateRef.current;
      if (pl.cd > 0) return;

      const weapon = WEAPON_MAP[s.hotbar[s.equippedSlot]] || WEAPON_MAP.lanza_madera;
      if (aimAngle !== undefined) {
        pl.angle = aimAngle;
      } else if (aimJoyInputRef.current.active) {
        pl.angle = Math.atan2(aimJoyInputRef.current.y, aimJoyInputRef.current.x);
      } else if (pointerWorldRef.current.active) {
        pl.angle = Math.atan2(pointerWorldRef.current.y - pl.y, pointerWorldRef.current.x - pl.x);
      } else {
        const joyMag = Math.hypot(joyInputRef.current.x, joyInputRef.current.y);
        if (joyMag > 0.1) {
          // Moving with joystick: face joystick angle; only micro-assist onto targets in the forward cone
          const joyAngle = Math.atan2(joyInputRef.current.y, joyInputRef.current.x);
          pl.angle = joyAngle;
          const coneRange = Math.max(weapon.range + 75, 220);
          let forwardTarget: EnemyEntity | null = null;
          let bestDist = coneRange;
          for (const en of enemiesRef.current) {
            const d = Math.hypot(en.x - pl.x, en.y - pl.y);
            if (d >= bestDist) continue;
            const angToEn = Math.atan2(en.y - pl.y, en.x - pl.x);
            let diff = Math.abs(angToEn - joyAngle);
            if (diff > Math.PI) diff = Math.PI * 2 - diff;
            if (diff <= 1.05 || d <= 62) {
              bestDist = d;
              forwardTarget = en;
            }
          }
          if (forwardTarget) {
            pl.angle = Math.atan2(forwardTarget.y - pl.y, forwardTarget.x - pl.x);
          }
        } else {
          // Standing idle: auto-face closest threat within strike radius
          const detectRange = Math.max(weapon.range + 95, 250);
          let nearestEnemy: EnemyEntity | null = null;
          let bestDist = detectRange;
          for (const en of enemiesRef.current) {
            const d = Math.hypot(en.x - pl.x, en.y - pl.y);
            if (d < bestDist) {
              bestDist = d;
              nearestEnemy = en;
            }
          }
          if (nearestEnemy) {
            pl.angle = Math.atan2(nearestEnemy.y - pl.y, nearestEnemy.x - pl.x);
          }
        }
      }

      if (weapon.healAmount) {
        if (s.hp >= s.maxHp || s.st < weapon.staminaCost) return;
        pl.cd = weapon.cooldown;
        s.st -= weapon.staminaCost;
        const mult = (hasDestiny(s, 'alquimia_t3') ? 1.35 : 1) + (getRelicTotals(s).healBonus || 0);
        const heal = Math.round(weapon.healAmount * mult);
        s.hp = Math.min(s.maxHp, s.hp + heal);
        sfx.eat(s.sound);
        pushPop(pl.x, pl.y - 20, `+${heal} HP`, '#34d399');
        syncUi();
        return;
      }

      const nucCheck = canFireNuclearWeapon(s, pl, weapon);
      if (weapon.isNuclear && !nucCheck.allowed) {
        pl.cd = 0.45;
        sfx.hurt(s.sound);
        showToast(`☢ ${nucCheck.reason || 'Requiere cadena nuclear completa en Buque Nv.7'}`);
        pushPop(pl.x, pl.y - 22, '☢ Cadena Nuclear Incompleta', '#fbbf24');
        return;
      }

      const fearLeviathan = enemiesRef.current.find((e) => {
        if (!e.isLeviathan) return false;
        const d = Math.hypot(e.x - pl.x, e.y - pl.y);
        if (d > Math.max(weapon.range + e.radius + 95, 440)) return false;
        const angToLev = Math.atan2(e.y - pl.y, e.x - pl.x);
        let diff = Math.abs(angToLev - pl.angle);
        if (diff > Math.PI) diff = Math.PI * 2 - diff;
        const closerNormalEnemy = enemiesRef.current.some(
          (other) =>
            !other.isLeviathan &&
            Math.hypot(other.x - pl.x, other.y - pl.y) < d - e.radius * 0.5
        );
        return (diff <= 1.1 || d <= e.radius + 170) && !closerNormalEnemy;
      });
      const leviathanCheck = canFireNuclearWeapon(s, pl, { ...weapon, isNuclear: true });
      if (fearLeviathan && (!weapon.isNuclear || !leviathanCheck.allowed)) {
        pl.cd = 0.55;
        sfx.hurt(s.sound);
        pushPop(pl.x, pl.y - 24, '😨 ¡Miedo instintivo!', '#67e8f9');
        pushComic(
          s.playerProfile.name,
          'Mi instinto me paraliza ante ese coloso... ¡Solo un Buque Nuclear con cadena nuclear completa puede herirlo!',
          pl.x,
          pl.y,
          '#67e8f9'
        );
        return;
      }

      const perf = computeVitalPerformanceModifiers(s);
      pl.cd =
        weapon.category === 'espada' || weapon.category === 'lanza'
          ? weapon.cooldown * (hasDestiny(s, 'abordaje_t3') ? 0.8 : 1)
          : weapon.cooldown * (hasDestiny(s, 'balistica_t3') ? 0.85 : 1);
      pl.atkT = 0.16;
      const stCost = Math.round(weapon.staminaCost * perf.staminaCostMult);
      if (s.st >= stCost) s.st -= stCost;
      else s.st = 0;

      if (weapon.projSpeed) {
        const rangedMult = computeRangedMultiplier(s) * perf.rangedMult;
        const dmg = Math.max(1, Math.round(weapon.damage * rangedMult));
        const pellets = weapon.pellets || 1;
        const spread = weapon.spread || 0;

        if (weapon.category === 'fuego') sfx.gun(s.sound);
        else if (weapon.category === 'bomba') sfx.slash(s.sound);
        else sfx.bow(s.sound);

        for (let p = 0; p < pellets; p++) {
          const offset = pellets > 1 ? (p / (pellets - 1) - 0.5) * spread : 0;
          const ang = pl.angle + offset;
          projectilesRef.current.push({
            id: eid++,
            fromPlayer: true,
            kind: weapon.isNuclear
              ? 'nuke'
              : weapon.category === 'bomba'
                ? 'bomb'
                : weapon.isMagic
                  ? 'magic'
                  : weapon.category === 'fuego'
                    ? weapon.id === 'canon_tesla'
                      ? 'plasma'
                      : 'bullet'
                    : weapon.category === 'lanza'
                      ? 'harpoon'
                      : 'arrow',
            x: pl.x + Math.cos(ang) * 16,
            y: pl.y + Math.sin(ang) * 16,
            vx: Math.cos(ang) * weapon.projSpeed,
            vy: Math.sin(ang) * weapon.projSpeed,
            dmg,
            aoeRadius: weapon.aoeRadius,
            isNuclear: Boolean(weapon.isNuclear),
            isMagic: Boolean(weapon.isMagic),
            life: weapon.range / weapon.projSpeed,
            color: weapon.isNuclear ? '#a3e635' : getRarityColor(weapon.rarity),
          });
        }
        if (weapon.category !== 'lanza') {
          syncUi();
          return;
        }
      }

      const meleeMult = computeMeleeMultiplier(s) * perf.meleeMult;
      const dmg = Math.max(1, Math.round(weapon.damage * meleeMult));
      const reach = weapon.range;
      slashesRef.current.push({
        x: pl.x,
        y: pl.y,
        angle: pl.angle,
        reach,
        life: 0.16,
        maxLife: 0.16,
        color: getRarityColor(weapon.rarity),
      });
      sfx.slash(s.sound);

      const hitX = pl.x + Math.cos(pl.angle) * (reach * 0.55);
      const hitY = pl.y + Math.sin(pl.angle) * (reach * 0.55);

      const playerInSafeZone = isPointInSafeZoneIsland(pl.x, pl.y, islandsRef.current);

      let meleeHitEnemy = false;
      for (let i = enemiesRef.current.length - 1; i >= 0; i--) {
        const e = enemiesRef.current[i];
        if (Math.hypot(e.x - hitX, e.y - hitY) <= reach * 0.65 + e.radius) {
          if (playerInSafeZone || isPointInSafeZoneIsland(e.x, e.y, islandsRef.current)) {
            pushPop(pl.x, pl.y - 24, '🕊 Zona de Paz', '#34d399');
            continue;
          }
          if (e.isLeviathan && !weapon.isNuclear) {
            pushPop(e.x, e.y - e.radius * 0.4, '🛡️ Inmune (Solo Nuclear)', '#38bdf8');
            continue;
          }
          meleeHitEnemy = true;
          e.hp -= dmg;
          e.hitT = 0.12;
          e.provoked = true;
          e.stealProgress = Math.max(0, e.stealProgress - 1.2);
          e.x += Math.cos(pl.angle) * 20;
          e.y += Math.sin(pl.angle) * 20;
          sfx.hit(s.sound);
          pushPop(e.x, e.y - 18, `-${dmg}`, '#fbbf24');
          if (e.hp <= 0) handleEnemyDefeated(i);
        }
      }
      if (meleeHitEnemy) {
        const sitMelee = registerCombatActionIntensity(s, { hitEnemy: true });
        if (sitMelee.alert) {
          showToast(sitMelee.alert);
          pushPop(pl.x, pl.y - 28, sitMelee.alert.split('!')[0] + '!', sitMelee.color || '#f43f5e');
        }
      }

      // Hit Wild / Farm Animals on islands
      for (let i = animalsRef.current.length - 1; i >= 0; i--) {
        const a = animalsRef.current[i];
        if (Math.hypot(a.x - hitX, a.y - hitY) <= reach * 0.65 + a.radius) {
          a.hp -= dmg;
          a.hitT = 0.15;
          sfx.hit(s.sound);
          pushPop(a.x, a.y - 14, `-${dmg}`, '#fca5a5');
          if (a.hp <= 0) handleAnimalDefeated(i);
        }
      }

      // Hit solid fortified Compound Walls / Sealed Gates so player can breach & pillage
      for (const wall of compoundWallsRef.current) {
        if (wall.destroyed || isCompoundGatePassable(wall, islandsRef.current, s)) continue;
        if (Math.hypot(wall.x - hitX, wall.y - hitY) <= reach * 0.72 + Math.max(wall.width, wall.height) * 0.45) {
          wall.hp = Math.max(0, wall.hp - dmg);
          sfx.hit(s.sound);
          pushPop(wall.x, wall.y - 16, `-${dmg} Muro`, '#fca5a5');
          if (wall.hp <= 0) {
            wall.destroyed = true;
            explosionsRef.current.push({
              x: wall.x,
              y: wall.y,
              radius: 34,
              life: 0.3,
              maxLife: 0.3,
              color: 'rgba(251, 146, 60, 0.55)',
            });
            sfx.explosion(s.sound);
            showToast('⚔ ¡Muro fortificado derribado! Paso abierto para saquear');
          }
          break;
        }
      }

      const extraGather =
        (hasDestiny(s, 'naval_t3') ? 1 : 0) + getRelicTotals(s).gatherBonus;

      for (const isl of islandsRef.current) {
        if (Math.hypot(isl.x - pl.x, isl.y - pl.y) > isl.radius + 95) continue;
        for (const node of isl.nodes) {
          if (node.depleted) continue;
          if (Math.hypot(node.x - hitX, node.y - hitY) <= reach * 0.72 + 28) {
            if (node.kind === 'chest') {
              openChestNode(isl, node.id);
            } else if (node.kind === 'mystery_monolith' || node.kind === 'easter_egg') {
              discoverMysteryNode(isl, node);
            } else if (node.kind === 'village') {
              handleVillageAction(node, 'pillage');
            } else if (node.kind === 'fishing_post') {
              node.depleted = true;
              s.resources.pez += 3;
              s.resources.agu += 2;
              s.resources.oro += 2;
              sfx.pickup(s.sound);
              pushPop(node.x, node.y - 20, '+3 Pez · +2 Agu · +2 Oro', '#38bdf8');
              showToast('Puesto Pesquero: intercambio rápido (+3 Pez · +2 Agua · +2 Oro)');
              grantXpAndFame(20, 20);
            } else if (
              node.kind === 'abandoned_ruin' ||
              node.kind === 'abandoned_lighthouse' ||
              node.kind === 'shipwreck' ||
              node.kind === 'abandoned_bunker'
            ) {
              node.hp -= dmg + (weapon.mineBonus || 0) * 8;
              sfx.mine(s.sound);
              pushPop(node.x, node.y - 18, `-${dmg} Explorando`, '#38bdf8');
              if (node.hp <= 0) {
                node.depleted = true;
                s.stats.ruinsExplored += 1;
                if (node.kind === 'abandoned_lighthouse') {
                  s.resources.cri += 2;
                  s.resources.oro += 3;
                  s.resources.tec += 1;
                  showToast('¡Faro Abandonado explorado! +2 Cristal · +3 Oro · +1 Tec');
                } else if (node.kind === 'shipwreck') {
                  s.resources.mad += 5;
                  s.resources.cht += 4;
                  s.resources.oro += 3;
                  s.resources.tec += 1;
                  showToast('¡Barco Encallado saqueado! +5 Mad · +4 Cht · +3 Oro · +1 Tec');
                } else if (node.kind === 'abandoned_bunker') {
                  s.resources.tec += 3;
                  s.resources.hie += 3;
                  s.resources.tit += 2;
                  showToast('¡Búnker Antiguo abierto! +3 Tec · +3 Hierro · +2 Titanio');
                } else {
                  s.resources.oro += 4;
                  s.resources.hie += 2;
                  s.resources.cri += 1;
                  s.resources.tec += 1;
                  showToast('¡Ruina Antigua explorada! +4 Oro · +2 Hierro · +1 Cri · +1 Tec');
                }
                tryAwardRelic(
                  node.kind === 'abandoned_bunker' || node.kind === 'abandoned_ruin',
                  node.x,
                  node.y
                );
                grantXpAndFame(45, 50);
                sfx.chest(s.sound);
              }
            } else if (node.kind === 'pirate_camp') {
              node.hp -= dmg;
              sfx.hit(s.sound);
              const rankLabel = node.pirateRank || isl.pirateRank || 'F';
              pushPop(node.x, node.y - 20, `-${dmg} Cuartel ${rankLabel}`, '#fb7185');
              if (node.hp <= 0) {
                node.depleted = true;
                const rm = getPirateRankInfo(rankLabel);
                s.resources.oro += rm.oro;
                s.resources.tit += rm.tit;
                s.resources.cri += rm.cri;
                s.resources.tec += rm.tec;
                grantXpAndFame(rm.xp, rm.fame);
                if (['C', 'B', 'A', 'S', 'SS', 'SSS'].includes(rankLabel)) {
                  tryAwardRelic(['A', 'S', 'SS', 'SSS'].includes(rankLabel), node.x, node.y);
                }
                if (['A', 'S', 'SS', 'SSS'].includes(rankLabel)) {
                  s.newspaper.articles.unshift({
                    id: `hq_${Date.now()}`,
                    category: 'PORTADA',
                    headline: `¡${s.playerProfile.name} arrasa Cuartel Pirata Rango ${rankLabel}!`,
                    body: `El bastión pirata en ${isl.name} cayó bajo la ofensiva de ${s.playerProfile.name}, liberando ${rm.oro} Oro y reliquias del Viejo Mundo.`,
                    day: s.dayCount,
                  });
                  s.newspaper.unread = true;
                }
                showToast(
                  `🏴‍☠️ ¡Cuartel Pirata Rango ${rankLabel} destruido! +${rm.oro} Oro${
                    rm.tit > 0 ? ` · +${rm.tit} Tit` : ''
                  }${rm.cri > 0 ? ` · +${rm.cri} Cri` : ''}${rm.tec > 0 ? ` · +${rm.tec} Tec` : ''}`
                );
                sfx.explosion(s.sound);
              }
            } else if (node.kind === 'marine_checkpoint') {
              node.hp -= dmg;
              sfx.hit(s.sound);
              pushPop(node.x, node.y - 20, `-${dmg} Puesto Marina`, '#60a5fa');
              if (node.hp <= 0) {
                node.depleted = true;
                s.resources.oro += 6;
                s.resources.hie += 4;
                s.resources.tit += 1;
                s.marineThreat = Math.min(100, (s.marineThreat || 0) + 16);
                const mk = s.kingdoms.find((k) => k.id === 'marina');
                if (mk) mk.relation = Math.max(-100, mk.relation - 18);
                logWorldEvent(s, 'marina', `Asaltaste el puesto de control de La Marina en ${isl.name}`);
                grantXpAndFame(75, 95);
                showToast(`⚓ ¡Puesto de Control de La Marina en ${isl.name} derribado! +6 Oro · +4 Hie · +1 Tit`);
                sfx.explosion(s.sound);
              }
            } else {
              const toolBonus =
                node.kind === 'tree'
                  ? (weapon.harvestBonus || 0) * 10
                  : (weapon.mineBonus || 0) * 10;
              node.hp -= dmg + toolBonus;
              sfx.mine(s.sound);
              pushPop(node.x, node.y - 14, node.kind === 'tree' ? 'Tala' : 'Minando', '#93c5fd');
              if (node.hp <= 0) {
                node.depleted = true;
                if (node.kind === 'tree') {
                  const amt = 2 + (weapon.harvestBonus || 0) + extraGather;
                  s.resources.mad += amt;
                  pushPop(node.x, node.y - 22, `+${amt} Mad`, '#e09f3e');
                } else if (node.kind === 'rock') {
                  const amt = 2 + (weapon.mineBonus || 0) + extraGather;
                  s.resources.cht += amt;
                  pushPop(node.x, node.y - 22, `+${amt} Cht`, '#90e0ef');
                } else if (node.kind === 'coal') {
                  const amt = 2 + (weapon.mineBonus || 0) + extraGather;
                  s.resources.car += amt;
                  pushPop(node.x, node.y - 22, `+${amt} Car`, '#a8a29e');
                } else if (node.kind === 'iron') {
                  const amt = 2 + (weapon.mineBonus || 0) + extraGather;
                  s.resources.hie += amt;
                  pushPop(node.x, node.y - 22, `+${amt} Hie`, '#e2e8f0');
                } else if (node.kind === 'gold_vein') {
                  const amt = 2 + (weapon.mineBonus ? 1 : 0);
                  s.resources.oro += amt;
                  pushPop(node.x, node.y - 22, `+${amt} Oro`, '#fbbf24');
                } else if (node.kind === 'tech_wreck') {
                  const tecAmt = 1 + (weapon.mineBonus ? 1 : 0);
                  s.resources.tec += tecAmt;
                  s.resources.cht += 2;
                  pushPop(node.x, node.y - 22, `+${tecAmt} Tec · +2 Cht`, '#22d3ee');
                } else if (node.kind === 'titanium') {
                  const amt = 1 + (weapon.mineBonus ? 1 : 0) + extraGather;
                  s.resources.tit += amt;
                  pushPop(node.x, node.y - 22, `+${amt} Tit`, '#60a5fa');
                } else if (node.kind === 'crystal') {
                  const amt = 1 + (weapon.mineBonus ? 1 : 0);
                  s.resources.cri += amt;
                  pushPop(node.x, node.y - 22, `+${amt} Cri`, '#c084fc');
                }
                grantXpAndFame(15, 14);
              }
            }
          }
        }
      }

      syncUi();
    },
    [
      discoverMysteryNode,
      grantXpAndFame,
      handleAnimalDefeated,
      handleEnemyDefeated,
      handleVillageAction,
      openChestNode,
      pushPop,
      showToast,
      syncUi,
      tryAwardRelic,
    ]
  );

  const doDash = useCallback(() => {
    if (modeRef.current !== 'PLAYING' || uiPausedRef.current) return;
    const s = stateRef.current;
    const pl = playerRef.current;
    const perf = computeVitalPerformanceModifiers(s);
    const dashCost = Math.round(18 * perf.staminaCostMult);
    if (s.st < dashCost || pl.dashT > 0 || pl.piloting) return;
    s.st -= dashCost;
    pl.dashT = 0.18;
    pl.invT = 0.38;
    pl.x += Math.cos(pl.angle) * (78 * Math.min(1.2, Math.max(0.65, perf.speedMult)));
    pl.y += Math.sin(pl.angle) * (78 * Math.min(1.2, Math.max(0.65, perf.speedMult)));
    sfx.dash(s.sound);
    pushPop(pl.x, pl.y - 18, 'Esquive', '#72efdd');
    syncUi();
  }, [pushPop, syncUi]);

  const doEat = useCallback(() => {
    if (modeRef.current !== 'PLAYING' || uiPausedRef.current) return;
    const s = stateRef.current;
    if (
      s.resources.gui <= 0 ||
      (s.hp >= s.maxHp && s.vitals.hunger >= 95 && s.vitals.mentalHealth >= 95)
    )
      return;
    s.resources.gui -= 1;
    const mult = (hasDestiny(s, 'alquimia_t3') ? 1.35 : 1) + getRelicTotals(s).healBonus;
    const heal = Math.round(40 * mult);
    s.hp = Math.min(s.maxHp, s.hp + heal);
    applyEatStewToVitals(s);
    shiftWorldNpcMoods(s, 'meal');
    sfx.eat(s.sound);
    pushPop(playerRef.current.x, playerRef.current.y - 20, `+${heal} HP · +Hambre · +Mente`, '#34d399');
    saveState(s);
    syncUi();
  }, [pushPop, syncUi]);

  const handleEatVeg = useCallback(() => {
    const s = stateRef.current;
    if (s.resources.veg <= 0) return;
    if (s.hp >= s.maxHp && s.st >= s.maxSt && s.vitals.hunger >= 95) return;
    s.resources.veg -= 1;
    s.hp = Math.min(s.maxHp, s.hp + 22);
    s.st = Math.min(s.maxSt, s.st + 20);
    applyEatVegToVitals(s);
    sfx.eat(s.sound);
    pushPop(playerRef.current.x, playerRef.current.y - 20, '+22 HP · +34 Hambre', '#4ade80');
    saveState(s);
    syncUi();
  }, [pushPop, syncUi]);

  const handleDrinkWater = useCallback(() => {
    if (modeRef.current !== 'PLAYING' || uiPausedRef.current) return;
    const s = stateRef.current;
    const res = applyDrinkWater(s);
    if (!res.ok) {
      showToast(res.message);
      return;
    }
    sfx.eat(s.sound);
    pushPop(playerRef.current.x, playerRef.current.y - 22, res.message, '#38bdf8');
    saveState(s);
    syncUi();
  }, [pushPop, showToast, syncUi]);

  const handleCookGreenStew = useCallback(() => {
    const s = stateRef.current;
    if (s.resources.veg < 2 || s.resources.pez < 1) return;
    s.resources.veg -= 2;
    s.resources.pez -= 1;
    s.resources.gui += 1;
    sfx.eat(s.sound);
    showToast('Guiso Verde cocinado (+1 Guiso)');
    saveState(s);
    syncUi();
  }, [showToast, syncUi]);

  const handleBuildFarmPlot = useCallback(
    (location: 'raft' | 'island') => {
      const s = stateRef.current;
      const pl = playerRef.current;
      if (s.resources.mad < 4 || s.resources.agu < 2) return;

      if (location === 'raft') {
        const count = s.farmPlots.filter((p) => p.location === 'raft').length;
        if (count >= 4) {
          showToast('Máximo 4 huertos en la cubierta del navío');
          return;
        }
        spendResources(s.resources, { mad: 4, agu: 2 });
        s.farmPlots.push({
          id: `plot_${eid++}`,
          location: 'raft',
          islandId: null,
          x: 0,
          y: 0,
          crop: null,
          growth: 0,
          watered: false,
        });
        showToast('¡Huerto construido en tu navío! Siembra plantas en Granja');
      } else {
        const isl = islandsRef.current.find((x) => pointInIsland(pl.x, pl.y, x));
        if (!isl) {
          showToast('Debes pisar una isla para construir un huerto isleño');
          return;
        }
        spendResources(s.resources, { mad: 4, agu: 2 });
        s.farmPlots.push({
          id: `plot_${eid++}`,
          location: 'island',
          islandId: isl.id,
          x: pl.x,
          y: pl.y,
          crop: null,
          growth: 0,
          watered: false,
        });
        showToast(`¡Huerto construido en ${isl.name}!`);
      }

      sfx.build(s.sound);
      saveState(s);
      syncUi();
    },
    [showToast, syncUi]
  );

  const handlePlantCrop = useCallback(
    (plotId: string, crop: CropKind) => {
      const s = stateRef.current;
      const plot = s.farmPlots.find((p) => p.id === plotId);
      const def = CROPS_CATALOG.find((c) => c.id === crop);
      if (!plot || !def || plot.crop) return;
      if (!canAfford(s.resources, def.seedCost)) return;
      spendResources(s.resources, def.seedCost);
      plot.crop = crop;
      plot.growth = 0;
      plot.watered = false;
      sfx.pickup(s.sound);
      showToast(`Sembraste ${def.name} (cosechará comida pasivamente)`);
      saveState(s);
      syncUi();
    },
    [showToast, syncUi]
  );

  const handleWaterPlot = useCallback(
    (plotId: string) => {
      const s = stateRef.current;
      const plot = s.farmPlots.find((p) => p.id === plotId);
      if (!plot || !plot.crop || plot.watered || s.resources.agu < 1) return;
      s.resources.agu -= 1;
      plot.watered = true;
      sfx.pickup(s.sound);
      showToast('Parcela regada (crecimiento 2x)');
      saveState(s);
      syncUi();
    },
    [showToast, syncUi]
  );

  const handleCaptureAnimal = useCallback(
    (animal: AnimalEntity) => {
      if (!animal.capturable) {
        showToast(`${animal.name} es un animal salvaje indomable (no capturable)`);
        return;
      }
      const s = stateRef.current;
      const pl = playerRef.current;
      const onIsl = islandsRef.current.find((x) => pointInIsland(pl.x, pl.y, x));
      const targetIslandId = onIsl?.id || animal.islandId;

      const raftCount = s.captiveAnimals.filter((c) => c.location === 'raft').length;
      const raftLimit = getRaftCorralLimit(s.raft.level);
      const islandCount = s.captiveAnimals.filter(
        (c) => c.location === 'island' && c.islandId === targetIslandId
      ).length;
      const islandLimit = getIslandCorralLimit(s, targetIslandId);

      const canPutRaft = raftCount < raftLimit;
      const canPutIsland = Boolean(targetIslandId) && islandCount < islandLimit;

      if (!canPutRaft && !canPutIsland) {
        showToast(
          `Corrales llenos (Navío ${raftCount}/${raftLimit} · Isla ${islandCount}/${islandLimit}). Mejora el navío o construye base.`
        );
        return;
      }
      if (s.resources.agu < 1 && s.resources.veg < 1) {
        showToast('Necesitas 1 Agua o 1 Cultivo para domar y capturar');
        return;
      }
      if (s.resources.veg >= 1) s.resources.veg -= 1;
      else s.resources.agu -= 1;

      const idx = animalsRef.current.findIndex((a) => a.id === animal.id);
      if (idx >= 0) animalsRef.current.splice(idx, 1);

      const info = ANIMAL_RANCH_INFO[animal.kind];
      const putOnRaft = canPutRaft;

      s.captiveAnimals.push({
        id: `cap_${eid++}`,
        kind: animal.kind,
        name: animal.name,
        location: putOnRaft ? 'raft' : 'island',
        islandId: putOnRaft ? null : targetIslandId,
        level: 1,
        prodTimer: 0,
        prodInterval: info.interval,
      });

      setNearbyAnimal(null);
      sfx.chest(s.sound);
      grantXpAndFame(25, 22);
      showToast(
        `¡Capturaste a ${animal.name}! Guardado en el corral ${putOnRaft ? 'del navío' : 'de la isla'}`
      );
      pushPop(animal.x, animal.y - 18, '¡Capturado!', '#4ade80');
      saveState(s);
      syncUi();
    },
    [grantXpAndFame, pushPop, showToast, syncUi]
  );

  const handleFeedCaptiveAnimal = useCallback(
    (animalId: string) => {
      const s = stateRef.current;
      const cap = s.captiveAnimals.find((a) => a.id === animalId);
      if (!cap || s.resources.veg < 1) return;
      s.resources.veg -= 1;
      cap.level += 1;
      cap.prodInterval = Math.max(10, cap.prodInterval - 1);
      sfx.eat(s.sound);
      showToast(`${cap.name} subió a Nv.${cap.level} (+producción)`);
      saveState(s);
      syncUi();
    },
    [showToast, syncUi]
  );

  const handleBreedCaptiveAnimal = useCallback(
    (animalId: string) => {
      const s = stateRef.current;
      const cap = s.captiveAnimals.find((a) => a.id === animalId);
      if (!cap) return;
      const locCount =
        cap.location === 'raft'
          ? s.captiveAnimals.filter((a) => a.location === 'raft').length
          : s.captiveAnimals.filter(
              (a) => a.location === 'island' && a.islandId === cap.islandId
            ).length;
      const locLimit =
        cap.location === 'raft'
          ? getRaftCorralLimit(s.raft.level)
          : getIslandCorralLimit(s, cap.islandId);

      if (locCount >= locLimit) {
        showToast(`Corral ${cap.location === 'raft' ? 'del navío' : 'de la isla'} lleno (${locCount}/${locLimit})`);
        return;
      }
      if (s.resources.veg < 2 || s.resources.agu < 2) return;
      s.resources.veg -= 2;
      s.resources.agu -= 2;

      const info = ANIMAL_RANCH_INFO[cap.kind];
      s.captiveAnimals.push({
        id: `cap_${eid++}`,
        kind: cap.kind,
        name: `${cap.name} (Cría)`,
        location: cap.location,
        islandId: cap.islandId,
        level: 1,
        prodTimer: 0,
        prodInterval: info.interval,
      });

      sfx.levelUp(s.sound);
      grantXpAndFame(20, 18);
      showToast(`¡Nació una cría de ${cap.name}! Mayor producción pasiva`);
      saveState(s);
      syncUi();
    },
    [grantXpAndFame, showToast, syncUi]
  );

  const doUseStealth = useCallback(() => {
    if (modeRef.current !== 'PLAYING' || uiPausedRef.current) return;
    const s = stateRef.current;
    if (s.consumables.repelente <= 0) return;
    s.consumables.repelente -= 1;
    s.stealthTimer = 45;
    sfx.dash(s.sound);
    showToast('Incienso de Sigilo activo: 45s sin ataques');
    pushPop(playerRef.current.x, playerRef.current.y - 22, 'Sigilo 45s', '#c084fc');
    saveState(s);
    syncUi();
  }, [pushPop, showToast, syncUi]);

  const doSleep = useCallback(() => {
    if (modeRef.current !== 'PLAYING' || uiPausedRef.current) return;
    const s = stateRef.current;
    if (warRef.current.active) {
      showToast('No puedes dormir durante una Guerra');
      return;
    }
    if (!playerRef.current.onRaft && !playerRef.current.inShelter) {
      showToast('Debes estar en tu Navío o en un Refugio para dormir');
      return;
    }
    if (s.consumables.hamaca <= 0 && !playerRef.current.inShelter) {
      showToast('Necesitas un Saco de Descanso o un Refugio');
      return;
    }
    if (!playerRef.current.inShelter) {
      s.consumables.hamaca -= 1;
    }
    s.dayCount += 1;
    s.worldGovDecree = WORLD_GOV_DECREES[s.dayCount % WORLD_GOV_DECREES.length];
    s.marineThreat = Math.max(0, (s.marineThreat || 0) - 3);
    s.hp = s.maxHp;
    s.st = s.maxSt;
    applySleepToVitals(s);
    shiftWorldNpcMoods(s, 'sleep');

    applyDailyStructureIncome(s);
    for (const child of s.family.children) {
      const age = s.dayCount - child.bornDay;
      if (age >= 4) child.stage = 'oficial';
      else if (age >= 2) child.stage = 'grumete';
    }

    enemiesRef.current = enemiesRef.current.filter((e) => e.isBoss || e.isLeviathan);
    timersRef.current.enemy = 12;
    warRef.current.cooldown = Math.max(40, warRef.current.cooldown);
    publishDailyNewspaper(s.dayCount);
    saveCheckpoint();
    sfx.chest(s.sound);
    showToast(`Amanecer del Día ${s.dayCount} · Punto de control guardado`);
    saveState(s);
    syncUi();
    syncLeaderboard(false);
  }, [publishDailyNewspaper, saveCheckpoint, showToast, syncLeaderboard, syncUi]);

  const togglePiloting = useCallback(() => {
    if (modeRef.current !== 'PLAYING' || uiPausedRef.current) return;
    const pl = playerRef.current;
    const raft = raftRef.current;
    const s = stateRef.current;
    const halfRaft = getRaftHalfSize(raft.level);

    if (pl.piloting) {
      pl.piloting = false;
      showToast('Soltaste el timón');
      return;
    }

    if (s.raft.damagedMode && s.raft.level < 7) {
      showToast('¡Tu balsa está hundida/averiada! Repara el casco primero');
      return;
    }

    if (Math.hypot(pl.x - raft.x, pl.y - raft.y) <= halfRaft + 44) {
      pl.piloting = true;
      pl.x = raft.x + Math.cos(raft.angle) * (halfRaft - 20);
      pl.y = raft.y + Math.sin(raft.angle) * (halfRaft - 20);
      showToast(`Pilotando ${getShipClassName(raft.level)} · Usa el joystick`);
    } else {
      showToast('Acércate al navío para tomar el timón');
    }
  }, [showToast]);

  const handleRepairRaft = useCallback(() => {
    const s = stateRef.current;
    if (s.raft.hp >= s.raft.maxHp && !s.raft.damagedMode) return;
    if (s.resources.mad < 4) {
      showToast('Necesitas 4 de Madera para reparar el casco');
      return;
    }
    if (!s.raft.damagedMode && s.resources.cht < 2) {
      showToast('Necesitas 4 Madera y 2 Chatarra');
      return;
    }
    s.resources.mad -= 4;
    if (!s.raft.damagedMode) s.resources.cht -= 2;

    s.raft.hp = Math.min(s.raft.maxHp, s.raft.hp + 130);
    s.raft.damagedMode = false;
    raftRef.current.hp = s.raft.hp;
    raftRef.current.damagedMode = false;

    sfx.build(s.sound);
    showToast('¡Casco del navío reparado!');
    pushPop(raftRef.current.x, raftRef.current.y - 24, '+130 Casco', '#34d399');
    saveState(s);
    syncUi();
  }, [pushPop, showToast, syncUi]);

  const handleEquipWeapon = useCallback(
    (weaponId: string) => {
      const s = stateRef.current;
      let idx = s.hotbar.indexOf(weaponId);
      if (idx === -1) {
        const emptyIdx = s.hotbar.indexOf('');
        idx = emptyIdx >= 0 ? emptyIdx : s.equippedSlot;
        s.hotbar[idx] = weaponId;
      }
      s.equippedSlot = idx;
      saveState(s);
      syncUi();
    },
    [syncUi]
  );

  const handleCraftWeapon = useCallback(
    (weaponId: string) => {
      const def = WEAPON_MAP[weaponId];
      const s = stateRef.current;
      if (!def?.craftCost || s.ownedWeapons.includes(weaponId)) return;
      const tierCheck = getWeaponUnlockStatus(weaponId, s.ownedWeapons);
      if (!tierCheck.unlocked) {
        showToast(`🔒 Bloqueada: debes forjar primero ${tierCheck.prereqName || 'el nivel anterior'}`);
        return;
      }
      if (!canAfford(s.resources, def.craftCost)) return;

      spendResources(s.resources, def.craftCost);
      s.ownedWeapons.push(weaponId);
      handleEquipWeapon(weaponId);
      logWorldEvent(s, 'forge', `Forjaste el arma ${def.name} (Tier ${tierCheck.tier})`);
      sfx.build(s.sound);
      showToast(`Forjado: ${def.name}`);
      checkTitlesAndAchievements();
      saveState(s);
      syncUi();
    },
    [checkTitlesAndAchievements, handleEquipWeapon, showToast, syncUi]
  );

  const handleCraftTechPiece = useCallback(
    (techId: string) => {
      const s = stateRef.current;
      const def = TECH_PIECES_CATALOG.find((t) => t.id === techId);
      if (!def || s.craftedTech.includes(techId)) return;
      if (!canAfford(s.resources, def.cost)) return;
      spendResources(s.resources, def.cost);
      s.craftedTech.push(techId);
      sfx.levelUp(s.sound);
      showToast(`¡Tecnología ensamblada: ${def.name}!`);
      saveState(s);
      syncUi();
    },
    [showToast, syncUi]
  );

  const handleCookStew = useCallback(() => {
    const s = stateRef.current;
    if (s.resources.pez < 2 || s.resources.agu < 2) return;
    s.resources.pez -= 2;
    s.resources.agu -= 2;
    s.resources.gui += 1;
    sfx.eat(s.sound);
    showToast('Guiso cocinado (+1)');
    saveState(s);
    syncUi();
  }, [showToast, syncUi]);

  const handleCraftConsumable = useCallback(
    (kind: 'repelente' | 'hamaca') => {
      const s = stateRef.current;
      if (kind === 'repelente') {
        if (!canAfford(s.resources, { mad: 3, agu: 2, oro: 1 })) return;
        spendResources(s.resources, { mad: 3, agu: 2, oro: 1 });
        s.consumables.repelente += 1;
        showToast('Incienso de Sigilo fabricado (+1)');
      } else {
        if (!canAfford(s.resources, { mad: 5, cht: 2 })) return;
        spendResources(s.resources, { mad: 5, cht: 2 });
        s.consumables.hamaca += 1;
        showToast('Saco de Descanso fabricado (+1)');
      }
      sfx.build(s.sound);
      saveState(s);
      syncUi();
    },
    [showToast, syncUi]
  );

  const handleBuildOnIsland = useCallback(
    (kind: IslandStructure['kind']) => {
      const pl = playerRef.current;
      const s = stateRef.current;
      const isl = islandsRef.current.find((x) => pointInIsland(pl.x, pl.y, x));
      if (!isl) {
        showToast(
          kind === 'forge_gate'
            ? 'Los Portones Forja del Alba SOLO pueden construirse sobre una isla (no en mar abierto)'
            : 'Debes pisar una isla para construir'
        );
        return;
      }

      const aoeDef = AOE_BUILDINGS_CATALOG.find((b) => b.kind === kind);
      if (aoeDef && (s.ageTier || 1) < aoeDef.minAge) {
        showToast(`Requiere Edad ${aoeDef.minAge} para construir ${aoeDef.name}`);
        return;
      }

      if (kind === 'nuclear_reactor' && !s.nuclearLabBuilt) {
        showToast('Primero construye el Laboratorio Nuclear');
        return;
      }

      const extraCosts: Record<string, Partial<Record<ResourceKey, number>>> = {
        shelter: { mad: 12, cht: 6, hie: 4 },
        turret: { mad: 8, cht: 10, oro: 2 },
        extractor: { mad: 10, cht: 12, tit: 1 },
        hq: { mad: 16, cht: 12, oro: 4 },
        warehouse: { mad: 14, cht: 8 },
        nuclear_bunker: { mad: 20, hie: 10, tit: 6, tec: 3 },
        radio_antenna: { mad: 10, hie: 8, tec: 4 },
        distillery: { mad: 12, cht: 6, veg: 4 },
        nuclear_lab: { hie: 16, tit: 8, tec: 6, cri: 3 },
        nuclear_reactor: { hie: 20, tit: 12, tec: 8, cri: 5, nuc_frag: 3 },
        settlement: { mad: 14, cht: 8, veg: 3 },
      };

      const costs = aoeDef?.cost || extraCosts[kind] || { mad: 10, cht: 6 };
      if (!canAfford(s.resources, costs)) {
        showToast('Recursos insuficientes para construir');
        return;
      }
      spendResources(s.resources, costs);

      const wallMult = s.aoeUpgrades?.includes('ingenieria_muralla') ? 1.45 : 1;
      const baseHp =
        aoeDef?.maxHp ||
        (kind === 'nuclear_bunker'
          ? 650
          : kind === 'hq'
            ? 520
            : kind === 'shelter'
              ? 420
              : kind === 'nuclear_reactor' || kind === 'nuclear_lab'
                ? 440
                : 260);
      const finalHp = Math.round(baseHp * wallMult);

      // Keep placement safely inside the island surface at the player's chosen spot
      const dxI = pl.x - isl.x;
      const dyI = pl.y - isl.y;
      const dI = Math.hypot(dxI, dyI);
      const maxLandR = isl.radius * 0.82;
      const buildX = dI > maxLandR ? isl.x + (dxI / dI) * maxLandR : pl.x;
      const buildY = dI > maxLandR ? isl.y + (dyI / dI) * maxLandR : pl.y;

      const stId = `st_${eid++}`;
      s.islandStructures.push({
        id: stId,
        islandId: isl.id,
        kind,
        x: buildX,
        y: buildY,
        level: 1,
        timer: 0,
        hp: finalHp,
        maxHp: finalHp,
        customName: kind === 'forge_gate' ? '⚒ PORTÓN FORJA DEL ALBA' : undefined,
      });

      if (kind === 'hq') {
        s.hqIslandId = isl.id;
        s.hqIslandName = isl.name;
        saveCheckpoint(`Cuartel: ${isl.name}`);
      } else if (kind === 'shelter' || kind === 'nuclear_bunker') {
        saveCheckpoint(
          kind === 'nuclear_bunker' ? `Búnker Nuclear: ${isl.name}` : `Refugio: ${isl.name}`
        );
      } else if (kind === 'nuclear_lab') {
        s.nuclearLabBuilt = true;
      } else if (kind === 'nuclear_reactor') {
        s.nuclearReactorBuilt = true;
      } else if (kind === 'radio_antenna') {
        s.stats.radiosBuilt = (s.stats.radiosBuilt || 0) + 1;
        s.shipRadioBuilt = true;
      } else if (kind === 'forge_gate') {
        // Station a dedicated Master Forjador at the player's newly built Portón Forja del Alba on this island
        const hasNearbyForger = worldNpcsRef.current.some(
          (w) =>
            (w.role === 'forjador' || w.role === 'armero') &&
            Math.hypot(w.x - buildX, w.y - buildY) <= 95
        );
        if (!hasNearbyForger) {
          const newForger: WorldNpcEntity = {
            id: `wnpc_custom_forjador_${stId}`,
            role: 'forjador',
            name: 'Forjador del Alba',
            title: 'Maestro del Portón Propio',
            islandId: isl.id,
            islandName: isl.name,
            x: buildX + 26,
            y: buildY + 10,
            color: '#38f8e2',
            hatColor: '#0f172a',
            specialty: 'Forja armas Épicas, Legendarias y Divinas en tu propio Portón Forja del Alba',
            greeting: '¡Has alzado tu propio Portón Forja del Alba en esta isla! El yunque astral es tuyo.',
            discovered: true,
          };
          worldNpcsRef.current.push(newForger);
          if (!s.discoveredWorldNpcs.some((d) => d.id === newForger.id)) {
            s.discoveredWorldNpcs.push({ ...newForger });
          }
        }
      }

      sfx.build(s.sound);
      showToast(
        kind === 'forge_gate'
          ? `⚒ ¡Portón Forja del Alba construido en ${isl.name} con Forjador residente!`
          : aoeDef
            ? `🏛️ ¡${aoeDef.name} construido en ${isl.name}! (${finalHp} HP)`
            : kind === 'hq'
              ? `¡Cuartel General y Punto de Control establecidos en ${isl.name}!`
              : kind === 'nuclear_bunker'
                ? `☢ Búnker Nuclear construido en ${isl.name}!`
                : kind === 'nuclear_lab'
                  ? `⚛ ¡Laboratorio Nuclear construido en ${isl.name}! (Paso 1/4 completo)`
                  : kind === 'nuclear_reactor'
                    ? `☢ ¡Reactor Nuclear operativo en ${isl.name}! Usa Traje Antirradiación`
                    : kind === 'radio_antenna'
                      ? `📡 ¡Antena de Radio erigida en ${isl.name}! Reduce interferencias de Hackers`
                      : kind === 'distillery'
                        ? `🍺 ¡Destilería instalada en ${isl.name}! Producirá Ron/Alcohol`
                        : kind === 'warehouse'
                          ? 'Almacén Seguro construido (+1 Oro diario y protege botín)'
                          : kind === 'shelter'
                            ? `Refugio Seguro y Punto de Control creados en ${isl.name}`
                            : kind === 'turret'
                              ? 'Torreta instalada en isla'
                              : 'Extractor instalado en isla'
      );
      checkTitlesAndAchievements();
      saveState(s);
      syncUi();
    },
    [checkTitlesAndAchievements, saveCheckpoint, showToast, syncUi]
  );

  const handleUpgradeAge = useCallback(() => {
    const s = stateRef.current;
    const nextAge = (s.ageTier || 1) + 1;
    const def = AOE_AGES_CATALOG.find((a) => a.tier === nextAge);
    if (!def) return;
    if (!canAfford(s.resources, def.cost)) {
      showToast('Recursos insuficientes para avanzar de Edad');
      return;
    }
    spendResources(s.resources, def.cost);
    s.ageTier = def.tier;
    for (const st of s.islandStructures) {
      if (st.maxHp) {
        st.maxHp = Math.round(st.maxHp * 1.15);
        st.hp = Math.min(st.maxHp, (st.hp || st.maxHp) + 60);
      }
    }
    grantXpAndFame(120, 150);
    sfx.levelUp(s.sound);
    showToast(`🏛️ ¡Has avanzado a ${def.name}! Nuevos edificios y tecnologías desbloqueados`);
    saveState(s);
    syncUi();
  }, [grantXpAndFame, showToast, syncUi]);

  const handleTrainIslandUnit = useCallback(
    (kind: 'villager' | 'farmer' | 'guard' | 'patrol_ship') => {
      const pl = playerRef.current;
      const s = stateRef.current;
      const isl = islandsRef.current.find((x) => pointInIsland(pl.x, pl.y, x));
      if (!isl) {
        showToast('Debes estar sobre una isla para entrenar unidades');
        return;
      }
      const popStats = getPopulationStats(s);
      if (popStats.pop >= popStats.popCap) {
        showToast('Población al máximo: construye más Casas Isleñas');
        return;
      }
      const costs: Record<typeof kind, Partial<Record<ResourceKey, number>>> = {
        villager: { mad: 4, gui: 3 },
        farmer: { mad: 4, veg: 2, agu: 1 },
        guard: { hie: 6, oro: 4 },
        patrol_ship: { mad: 10, hie: 6, oro: 6 },
      };
      if (!canAfford(s.resources, costs[kind])) return;
      spendResources(s.resources, costs[kind]);

      const ux = kind === 'patrol_ship' ? isl.x + isl.radius + 45 : pl.x + (Math.random() - 0.5) * 32;
      const uy = kind === 'patrol_ship' ? isl.y : pl.y + (Math.random() - 0.5) * 32;
      const hp = kind === 'patrol_ship' ? 220 : kind === 'guard' ? 140 : kind === 'farmer' ? 90 : 85;
      const role =
        kind === 'villager'
          ? 'Recolector'
          : kind === 'farmer'
            ? 'Granjero Cultivador'
            : kind === 'guard'
              ? 'Centinela'
              : 'Patrulla Naval';
      const unit: IslandUnit = {
        id: `unit_${eid++}`,
        islandId: isl.id,
        kind,
        role,
        x: ux,
        y: uy,
        vx: 0,
        vy: 0,
        hp,
        maxHp: hp,
        targetX: ux,
        targetY: uy,
        gaitPhase: 0,
        cd: 0.4,
      };
      s.islandUnits.push(unit);
      sfx.build(s.sound);
      showToast(
        kind === 'villager'
          ? `🧑‍🌾 Aldeano entrenado en ${isl.name}`
          : kind === 'farmer'
            ? `🌾 Granjero reclutado en ${isl.name}: cuidará y acelerará tus cultivos`
            : kind === 'guard'
              ? `⚔️ Guardia armado desplegado en ${isl.name}`
              : `⛵ Barco Patrulla botado en ${isl.name}`
      );
      saveState(s);
      syncUi();
    },
    [showToast, syncUi]
  );

  const handleResearchAoeTech = useCallback(
    (techId: string) => {
      const s = stateRef.current;
      if (s.aoeUpgrades?.includes(techId)) return;
      const tech = AOE_TECHS_CATALOG.find((x) => x.id === techId);
      if (!tech || (s.ageTier || 1) < tech.minAge) return;
      if (!canAfford(s.resources, tech.cost)) return;
      spendResources(s.resources, tech.cost);
      s.aoeUpgrades.push(techId);
      if (techId === 'ingenieria_muralla') {
        for (const st of s.islandStructures) {
          if (st.maxHp) {
            st.maxHp = Math.round(st.maxHp * 1.45);
            st.hp = st.maxHp;
          }
        }
      }
      sfx.levelUp(s.sound);
      showToast(`⚒️ Tecnología Imperial investigada: ${tech.name}`);
      saveState(s);
      syncUi();
    },
    [showToast, syncUi]
  );

  const handleRepairStructures = useCallback(() => {
    const s = stateRef.current;
    if (s.resources.mad < 4) return;
    const damaged = s.islandStructures.filter((st) => st.maxHp && (st.hp ?? st.maxHp) < st.maxHp);
    if (damaged.length === 0) return;
    s.resources.mad -= 4;
    for (const st of damaged) {
      st.hp = st.maxHp;
    }
    sfx.build(s.sound);
    showToast(`🔧 ${damaged.length} estructura(s) reparadas al 100%`);
    saveState(s);
    syncUi();
  }, [showToast, syncUi]);

  const handleUnlockWarshipPassive = useCallback(
    (passiveId: string) => {
      const s = stateRef.current;
      if (hasWarshipPassive(s, passiveId)) return;
      const wp = WARSHIP_PASSIVES_CATALOG.find((x) => x.id === passiveId);
      if (!wp || s.raft.level < wp.minRaftLevel || !canAfford(s.resources, wp.cost)) return;
      spendResources(s.resources, wp.cost);
      s.warshipPassives.push(passiveId);
      s.raft.maxHp = computeRaftMaxHp(s);
      sfx.levelUp(s.sound);
      showToast(`⚙️ Pasiva de Buque activada: ${wp.name}`);
      saveState(s);
      syncUi();
    },
    [showToast, syncUi]
  );

  const handleUnlockNuclearShield = useCallback(() => {
    const s = stateRef.current;
    const cost = { hie: 18, tit: 10, tec: 8, nuc_frag: 4 };
    if (s.warshipNuclearShield || s.raft.level < 7 || !canAfford(s.resources, cost)) return;
    spendResources(s.resources, cost);
    s.warshipNuclearShield = true;
    s.raft.maxHp = computeRaftMaxHp(s);
    s.raft.hp = Math.min(s.raft.maxHp, s.raft.hp + 220);
    sfx.levelUp(s.sound);
    showToast('☢️ ¡Blindaje Nuclear de Buque activado! Cadena nuclear lista para ojivas');
    checkTitlesAndAchievements();
    saveState(s);
    syncUi();
  }, [checkTitlesAndAchievements, showToast, syncUi]);

  const handleCraftRadiationSuit = useCallback(() => {
    const s = stateRef.current;
    const cost = { tit: 6, cri: 4, tec: 4, cht: 6 };
    if (s.radiationSuitCrafted || !s.nuclearLabBuilt || !canAfford(s.resources, cost)) return;
    spendResources(s.resources, cost);
    s.radiationSuitCrafted = true;
    s.radiationExposure = Math.max(0, (s.radiationExposure || 0) - 50);
    sfx.levelUp(s.sound);
    showToast('🦺 Traje Antirradiación equipado (bloquea 90% de radiación)');
    saveState(s);
    syncUi();
  }, [showToast, syncUi]);

  const handleBuildShipRadio = useCallback(() => {
    const s = stateRef.current;
    const cost = { tec: 4, hie: 6, cht: 6 };
    if (s.shipRadioBuilt || !canAfford(s.resources, cost)) return;
    spendResources(s.resources, cost);
    s.shipRadioBuilt = true;
    s.stats.radiosBuilt = (s.stats.radiosBuilt || 0) + 1;
    s.jammedTimer = 0;
    sfx.levelUp(s.sound);
    showToast('📻 ¡Radio Transmisor Naval instalado! Inmunidad contra interferencias de hackers');
    checkTitlesAndAchievements();
    saveState(s);
    syncUi();
  }, [checkTitlesAndAchievements, showToast, syncUi]);

  const handleBrewAlcohol = useCallback(() => {
    const s = stateRef.current;
    if (s.resources.veg < 3 || s.resources.agu < 2) return;
    s.resources.veg -= 3;
    s.resources.agu -= 2;
    s.resources.alc = (s.resources.alc || 0) + 1;
    sfx.eat(s.sound);
    showToast('🍺 Ron destilado (+1 Alcohol)');
    saveState(s);
    syncUi();
  }, [showToast, syncUi]);

  const handleDrinkAlcohol = useCallback(() => {
    const s = stateRef.current;
    if ((s.resources.alc || 0) <= 0) return;
    s.resources.alc -= 1;
    s.hp = Math.min(s.maxHp, s.hp + 20);
    s.vitals.mentalHealth = Math.min(100, s.vitals.mentalHealth + 25);
    s.hangoverTimer = Math.min(60, (s.hangoverTimer || 0) + 22);
    sfx.eat(s.sound);
    pushPop(playerRef.current.x, playerRef.current.y - 22, '+25 Mente · +20 HP (Resaca luego)', '#fbbf24');
    showToast('🍺 Bebiste Ron (+25 Mente, +20 HP · cuidado con la resaca)');
    saveState(s);
    syncUi();
  }, [pushPop, showToast, syncUi]);

  const handleSendChildMission = useCallback(
    (childId: string, kind: 'explore' | 'trade' | 'raid') => {
      const s = stateRef.current;
      const child = s.family.children.find((c) => c.id === childId);
      if (!child || child.activeMission) return;
      const raft = raftRef.current;
      const knownIsl = islandsRef.current.find((i) => i.discovered) || islandsRef.current[0];
      const ang = Math.random() * Math.PI * 2;
      const targetX = knownIsl ? knownIsl.x : raft.x + Math.cos(ang) * 900;
      const targetY = knownIsl ? knownIsl.y : raft.y + Math.sin(ang) * 900;
      const totalSec = kind === 'explore' ? 28 : kind === 'trade' ? 35 : 42;
      child.activeMission = {
        targetIslandId: knownIsl?.id,
        targetX,
        targetY,
        targetName: knownIsl ? knownIsl.name : 'Horizonte Norte',
        kind,
        remainingSec: totalSec,
        totalSec,
      };
      sfx.dash(s.sound);
      showToast(`⛵ ${child.name} zarpó en misión de ${kind} hacia ${child.activeMission.targetName}`);
      saveState(s);
      syncUi();
    },
    [showToast, syncUi]
  );

  const handleNpcForgeWeapon = useCallback(
    (weaponId: string) => {
      const s = stateRef.current;
      const def = WEAPON_MAP[weaponId];
      if (!def?.craftCost || s.ownedWeapons.includes(weaponId)) return;
      const tierCheck = getWeaponUnlockStatus(weaponId, s.ownedWeapons);
      if (!tierCheck.unlocked) {
        showToast(`🔒 Bloqueada: debes forjar primero ${tierCheck.prereqName || 'el arma anterior'}`);
        return;
      }
      if (!canAfford(s.resources, def.craftCost)) return;
      spendResources(s.resources, def.craftCost);
      s.ownedWeapons.push(weaponId);
      if (isNpcForgedRarity(def.rarity)) {
        s.stats.celestialForged = (s.stats.celestialForged || 0) + 1;
      }
      logWorldEvent(s, 'forge', `Forjaste ${def.name} (${def.rarity}) en herrería`);
      const emptyIdx = s.hotbar.indexOf('');
      const slot = emptyIdx >= 0 ? emptyIdx : s.equippedSlot;
      s.hotbar[slot] = weaponId;
      s.equippedSlot = slot;
      sfx.levelUp(s.sound);
      showToast(`⚒️ ¡${def.name} (${def.rarity.toUpperCase()}) forjada y equipada!`);
      pushPop(playerRef.current.x, playerRef.current.y - 26, `⚒ ${def.name}`, getRarityColor(def.rarity));
      checkTitlesAndAchievements();
      saveState(s);
      syncUi();
    },
    [checkTitlesAndAchievements, pushPop, showToast, syncUi]
  );

  const handleNpcTradeAction = useCallback(
    (action: WorldNpcTradeAction) => {
      const s = stateRef.current;
      const r = s.resources;
      if (action === 'buy_mad' && r.oro >= 2) { r.oro -= 2; r.mad += 6; }
      else if (action === 'buy_cht' && r.oro >= 2) { r.oro -= 2; r.cht += 5; }
      else if (action === 'buy_agu' && r.oro >= 2) { r.oro -= 2; r.agu += 5; }
      else if (action === 'buy_pez' && r.oro >= 2) { r.oro -= 2; r.pez += 4; }
      else if (action === 'buy_gui' && r.oro >= 3) { r.oro -= 3; r.gui += 2; }
      else if (action === 'buy_hie' && r.oro >= 4) { r.oro -= 4; r.hie += 4; }
      else if (action === 'buy_tit' && r.oro >= 6) { r.oro -= 6; r.tit += 2; }
      else if (action === 'buy_cri' && r.oro >= 7) { r.oro -= 7; r.cri += 2; }
      else if (action === 'buy_tec' && r.oro >= 6) { r.oro -= 6; r.tec += 2; }
      else if (action === 'buy_repelente' && r.oro >= 4) { r.oro -= 4; s.consumables.repelente += 1; }
      else if (action === 'buy_hamaca' && r.oro >= 4) { r.oro -= 4; s.consumables.hamaca += 1; }
      else if (action === 'buy_alc' && r.oro >= 3) { r.oro -= 3; r.alc += 2; }
      else if (action === 'sell_mad' && r.mad >= 6) { r.mad -= 6; r.oro += 3; }
      else if (action === 'sell_pez' && r.pez >= 4) { r.pez -= 4; r.oro += 3; }
      else if (action === 'sell_cht' && r.cht >= 6) { r.cht -= 6; r.oro += 3; }
      else if (action === 'sell_car' && r.car >= 5) { r.car -= 5; r.oro += 4; }
      else if (action === 'repair_hull_npc' && r.oro >= 4) {
        r.oro -= 4;
        s.raft.hp = s.raft.maxHp;
        s.raft.damagedMode = false;
        raftRef.current.hp = s.raft.hp;
        raftRef.current.damagedMode = false;
      } else if (action === 'cure_ailments_npc' && r.oro >= 5) {
        r.oro -= 5;
        s.hp = s.maxHp;
        s.radiationExposure = 0;
        s.hangoverTimer = 0;
        s.vitals.mentalHealth = Math.min(100, s.vitals.mentalHealth + 35);
      } else if ((action === 'map_forjador' || action === 'map_armero') && r.oro >= (action === 'map_forjador' ? 5 : 4)) {
        const role = action === 'map_forjador' ? 'forjador' : 'armero';
        r.oro -= action === 'map_forjador' ? 5 : 4;
        const found = worldNpcsRef.current.find((n) => n.role === role);
        if (found) {
          if (!s.discoveredWorldNpcs.some((d) => d.id === found.id)) {
            s.discoveredWorldNpcs.push({
              id: found.id,
              role: found.role,
              name: found.name,
              islandName: found.islandName,
              x: found.x,
              y: found.y,
            });
          }
          showToast(`🗺️ Coordenadas de ${found.name} (${found.islandName}): (${Math.round(found.x)}, ${Math.round(found.y)})`);
        } else {
          showToast('🗺️ Navega a las islas del cuadrante Noreste para hallar un Portón Forja del Alba');
        }
      } else if (action === 'map_leviathan' && r.oro >= 6) {
        r.oro -= 6;
        const lev = enemiesRef.current.find((e) => e.isLeviathan);
        showToast(
          lev
            ? `🐋 Leviatán detectado en (${Math.round(lev.x)}, ${Math.round(lev.y)})`
            : '🐋 Aguas Calmas: los Leviatanes Ancianos rondan más allá de 2700m'
        );
      } else if (action === 'map_bounty' && r.oro >= 4) {
        r.oro -= 4;
        const pb = s.pirateBounties.find((b) => !b.claimed);
        showToast(pb ? `☠️ Cartel marcado: ${pb.name} (Recompensa ${pb.rewardOro} Oro)` : 'Todos los carteles cobrados');
      } else if (action === 'transmute_epic_to_leg' && r.frag_epico >= 3 && r.oro >= 6) {
        r.frag_epico -= 3;
        r.oro -= 6;
        r.frag_legendario += 1;
      } else if (action === 'transmute_leg_to_div' && r.frag_legendario >= 3 && r.cri >= 2 && r.oro >= 10) {
        r.frag_legendario -= 3;
        r.cri -= 2;
        r.oro -= 10;
        r.frag_divino += 1;
      } else {
        return;
      }
      sfx.pickup(s.sound);
      showToast('Operación completada');
      saveState(s);
      syncUi();
    },
    [showToast, syncUi]
  );

  const handleChangeSettings = useCallback(
    (next: Partial<GameSettings>) => {
      const s = stateRef.current;
      s.settings = { ...DEFAULT_GAME_SETTINGS, ...(s.settings || {}), ...next };
      saveState(s);
      syncUi();
    },
    [syncUi]
  );

  const handleResetSettings = useCallback(() => {
    const s = stateRef.current;
    s.settings = { ...DEFAULT_GAME_SETTINGS };
    saveState(s);
    syncUi();
    showToast('Configuración restaurada por defecto');
  }, [showToast, syncUi]);

  const handleChangeLanguage = useCallback(
    (lang: 'es' | 'en') => {
      const s = stateRef.current;
      s.language = lang;
      saveState(s);
      syncUi();
    },
    [syncUi]
  );

  const handleChangeDifficulty = useCallback(
    (diff: DifficultyLevel) => {
      const s = stateRef.current;
      s.difficulty = diff;
      saveState(s);
      syncUi();
      showToast(`Dificultad ajustada: ${getDifficultyModifiers(diff).label}`);
    },
    [showToast, syncUi]
  );

  const handleSaveGame = useCallback(() => {
    saveState(stateRef.current);
    setHasSave(true);
    sfx.pickup(stateRef.current.sound);
    showToast('💾 Partida guardada correctamente');
    syncUi();
  }, [showToast, syncUi]);

  const handleFoundSettlement = useCallback(
    (name: string, banner: string) => {
      const pl = playerRef.current;
      const s = stateRef.current;
      const isl = islandsRef.current.find((x) => pointInIsland(pl.x, pl.y, x));
      if (!isl) {
        showToast('Debes pisar una isla para fundar un Pueblo');
        return;
      }
      const cost = { mad: 14, cht: 8, veg: 3 };
      if (!canAfford(s.resources, cost)) {
        showToast('Necesitas 14 Mad, 8 Cht y 3 Veg para fundar un Pueblo');
        return;
      }
      spendResources(s.resources, cost);
      const cleanName = name.trim().slice(0, 24) || 'Puerto Ceniza';
      s.islandStructures.push({
        id: `st_${eid++}`,
        islandId: isl.id,
        kind: 'settlement',
        x: pl.x,
        y: pl.y,
        level: 1,
        timer: 0,
        customName: cleanName,
        styleBanner: banner || 'dorado',
      });
      grantXpAndFame(30, 40);
      saveCheckpoint(`Pueblo ${cleanName}`);
      sfx.build(s.sound);
      showToast(`🏘️ ¡Pueblo "${cleanName}" fundado en ${isl.name}! (+2 Veg · +1 Oro al día)`);
      saveState(s);
      syncUi();
    },
    [grantXpAndFame, saveCheckpoint, showToast, syncUi]
  );

  const handleUpgradeSettlement = useCallback(
    (structureId: string) => {
      const s = stateRef.current;
      const st = s.islandStructures.find(
        (item) => item.id === structureId && item.kind === 'settlement'
      );
      if (!st || st.level >= 3) return;

      const nextCost =
        st.level === 1
          ? { mad: 18, hie: 6, oro: 6 }
          : { hie: 12, tit: 4, cri: 2, oro: 12 };
      if (!canAfford(s.resources, nextCost)) {
        showToast('Recursos insuficientes para elevar el asentamiento');
        return;
      }
      spendResources(s.resources, nextCost);
      st.level += 1;
      const sName = st.customName || 'Sin Nombre';

      if (st.level === 2) {
        grantXpAndFame(80, 100);
        sfx.levelUp(s.sound);
        showToast(`👑 ¡"${sName}" ahora es un Reino (Nv.2)! Defiende la isla y suma +3 Oro/+2 Mad/+2 Veg diarios`);
      } else {
        grantXpAndFame(160, 220);
        sfx.levelUp(s.sound);
        showToast(`🏛️ ¡Imperio "${sName}" proclamado! (+6 Oro/+3 Hie/+1 Tit diarios y escudo anti-Leviatán)`);
        s.newspaper.articles.unshift({
          id: `emp_${Date.now()}`,
          category: 'PORTADA',
          headline: `¡Nace el Imperio de ${sName} en las Cenizas Saladas!`,
          body: `${s.playerProfile.name} alzó las murallas imperiales de ${sName}, consolidando un bastión soberano capaz de frenar a piratas y proteger su isla.`,
          day: s.dayCount,
        });
        s.newspaper.unread = true;
      }
      saveState(s);
      syncUi();
    },
    [grantXpAndFame, showToast, syncUi]
  );

  const handleDesignateHqIsland = useCallback(
    (islandId: string) => {
      const s = stateRef.current;
      const isl = islandsRef.current.find((x) => x.id === islandId);
      if (!isl) {
        showToast('Navega más cerca de esa isla para establecer tu Cuartel allí');
        return;
      }

      const existingHq = s.islandStructures.find((st) => st.kind === 'hq');
      const pl = playerRef.current;
      const plOnTarget = pointInIsland(pl.x, pl.y, isl);
      const targetX = plOnTarget ? pl.x : isl.x + 26;
      const targetY = plOnTarget ? pl.y : isl.y - 22;

      if (!existingHq && !s.hqIslandId) {
        const hqCost = { mad: 16, cht: 12, oro: 4 };
        if (!canAfford(s.resources, hqCost)) {
          showToast('Necesitas 16 Mad, 12 Cht y 4 Oro para fundar tu primer Cuartel');
          return;
        }
        spendResources(s.resources, hqCost);
        s.islandStructures.push({
          id: `st_${eid++}`,
          islandId: isl.id,
          kind: 'hq',
          x: targetX,
          y: targetY,
          level: 1,
          timer: 0,
        });
      } else if (existingHq) {
        existingHq.islandId = isl.id;
        existingHq.x = targetX;
        existingHq.y = targetY;
      } else {
        s.islandStructures.push({
          id: `st_${eid++}`,
          islandId: isl.id,
          kind: 'hq',
          x: targetX,
          y: targetY,
          level: 1,
          timer: 0,
        });
      }

      s.hqIslandId = isl.id;
      s.hqIslandName = isl.name;
      saveCheckpoint(`Cuartel: ${isl.name}`);
      sfx.build(s.sound);
      showToast(
        existingHq || s.hqIslandId === isl.id
          ? `¡Isla Cuartel establecida en ${isl.name}!`
          : `¡Cuartel General fundado en ${isl.name}!`
      );
      saveState(s);
      syncUi();
    },
    [saveCheckpoint, showToast, syncUi]
  );

  const computeInteractTarget = useCallback(() => {
    const s = stateRef.current;
    const pl = playerRef.current;
    const raft = raftRef.current;

    if (pl.piloting) {
      return { kind: 'helm' as const, label: 'Soltar Timón', active: true };
    }

    const isl = islandsRef.current.find((x) => pointInIsland(pl.x, pl.y, x));
    if (isl) {
      const mysteryNode = isl.nodes.find(
        (n) =>
          (n.kind === 'mystery_monolith' || n.kind === 'easter_egg') &&
          !n.depleted &&
          Math.hypot(n.x - pl.x, n.y - pl.y) <= 78
      );
      if (mysteryNode) {
        return {
          kind: 'mystery' as const,
          isl,
          node: mysteryNode,
          label: mysteryNode.kind === 'easter_egg' ? 'Recoger Secreto' : 'Descifrar Misterio',
          active: true,
        };
      }

      const chest = isl.nodes.find(
        (n) => n.kind === 'chest' && !n.depleted && Math.hypot(n.x - pl.x, n.y - pl.y) <= 72
      );
      if (chest) return { kind: 'chest' as const, isl, node: chest, label: 'Abrir Cofre', active: true };
    }

    const nearAnimal = animalsRef.current.find(
      (a) => a.capturable && Math.hypot(a.x - pl.x, a.y - pl.y) <= 72
    );
    if (nearAnimal) {
      return {
        kind: 'animal' as const,
        animal: nearAnimal,
        label: `Capturar ${nearAnimal.name.split(' ')[0]}`,
        active: true,
      };
    }

    if (isl) {
      const fishPost = isl.nodes.find(
        (n) => n.kind === 'fishing_post' && !n.depleted && Math.hypot(n.x - pl.x, n.y - pl.y) <= 72
      );
      if (fishPost) {
        return { kind: 'fishing_post' as const, isl, node: fishPost, label: 'Pescar', active: true };
      }

      const village = isl.nodes.find(
        (n) => n.kind === 'village' && !n.depleted && Math.hypot(n.x - pl.x, n.y - pl.y) <= 105
      );
      if (village) {
        return { kind: 'village' as const, node: village, label: 'Comerciar', active: true };
      }

      const exploreNode = isl.nodes.find(
        (n) =>
          !n.depleted &&
          (n.kind === 'abandoned_ruin' ||
            n.kind === 'abandoned_lighthouse' ||
            n.kind === 'shipwreck' ||
            n.kind === 'abandoned_bunker') &&
          Math.hypot(n.x - pl.x, n.y - pl.y) <= 76
      );
      if (exploreNode) {
        return { kind: 'explore' as const, isl, node: exploreNode, label: 'Explorar', active: true };
      }

      const gatherNode = isl.nodes.find(
        (n) =>
          !n.depleted &&
          n.kind !== 'pirate_camp' &&
          n.kind !== 'marine_checkpoint' &&
          n.kind !== 'chest' &&
          n.kind !== 'village' &&
          n.kind !== 'fishing_post' &&
          n.kind !== 'mystery_monolith' &&
          n.kind !== 'easter_egg' &&
          Math.hypot(n.x - pl.x, n.y - pl.y) <= 68
      );
      if (gatherNode) {
        const lbl =
          gatherNode.kind === 'tree'
            ? 'Talar'
            : gatherNode.kind === 'tech_wreck'
              ? 'Reciclar'
              : 'Minar';
        return { kind: 'gather' as const, isl, node: gatherNode, label: lbl, active: true };
      }
    }

    // Check Farm Plots (Watering or Opening Farm Drawer)
    const raftCos = Math.cos(raft.angle);
    const raftSin = Math.sin(raft.angle);
    const halfSize = getRaftHalfSize(raft.level);
    let raftPlotIdx = 0;
    for (const plot of s.farmPlots) {
      let px = plot.x;
      let py = plot.y;
      if (plot.location === 'raft') {
        const lx = 4 + (raftPlotIdx % 2) * 28;
        const ly = -halfSize + 24 + Math.floor(raftPlotIdx / 2) * 22;
        px = raft.x + lx * raftCos - ly * raftSin;
        py = raft.y + lx * raftSin + ly * raftCos;
        raftPlotIdx += 1;
      }
      if (Math.hypot(px - pl.x, py - pl.y) <= 62) {
        if (plot.crop && !plot.watered) {
          return { kind: 'water_plot' as const, plot, label: 'Regar', active: true };
        }
        if (!plot.crop) {
          return { kind: 'plant_plot' as const, label: 'Plantar', active: true };
        }
      }
    }

    if (pl.inShelter) {
      return { kind: 'shelter' as const, isl, label: 'Guardar Punto', active: true };
    }

    const nearNpc = worldNpcsRef.current.find(
      (n) => Math.hypot(n.x - pl.x, n.y - pl.y) <= 74
    );
    if (nearNpc) {
      return {
        kind: 'world_npc' as const,
        npc: nearNpc,
        label: `Hablar: ${nearNpc.name.split(' ')[0]}`,
        active: true,
      };
    }

    const nearForgeGate = s.islandStructures.find(
      (st) => st.kind === 'forge_gate' && Math.hypot(st.x - pl.x, st.y - pl.y) <= 74
    );
    if (nearForgeGate) {
      const gateNpc =
        worldNpcsRef.current.find((n) => (n.role === 'forjador' || n.role === 'armero') && n.islandId === nearForgeGate.islandId) ||
        worldNpcsRef.current.find((n) => n.role === 'armero');
      if (gateNpc) {
        return { kind: 'world_npc' as const, npc: gateNpc, label: 'Usar Portón Forja', active: true };
      }
    }

    if (pl.onRaft || Math.hypot(pl.x - raft.x, pl.y - raft.y) <= halfSize + 30) {
      return { kind: 'helm' as const, label: 'Tomar Timón', active: true };
    }

    return { kind: 'none' as const, label: 'Interactuar', active: false };
  }, []);

  const handleInteract = useCallback(() => {
    if (modeRef.current !== 'PLAYING' || uiPausedRef.current) return;
    const s = stateRef.current;
    const pl = playerRef.current;
    const target = computeInteractTarget();

    if (target.kind === 'helm') {
      togglePiloting();
      return;
    }
    if (target.kind === 'world_npc') {
      const npc = target.npc;
      npc.discovered = true;
      if (!s.discoveredWorldNpcs.some((x) => x.id === npc.id)) {
        s.discoveredWorldNpcs.push({
          id: npc.id,
          role: npc.role,
          name: npc.name,
          islandName: npc.islandName,
          x: npc.x,
          y: npc.y,
        });
        saveState(s);
        syncUi();
      }
      setActiveMerchantNpc({ ...npc, discovered: true });
      return;
    }
    if (target.kind === 'mystery') {
      discoverMysteryNode(target.isl, target.node);
      return;
    }
    if (target.kind === 'chest') {
      openChestNode(target.isl, target.node.id);
      return;
    }
    if (target.kind === 'animal') {
      handleCaptureAnimal(target.animal);
      return;
    }
    if (target.kind === 'fishing_post') {
      const node = target.node;
      node.depleted = true;
      s.resources.pez += 3;
      s.resources.agu += 2;
      s.resources.oro += 2;
      sfx.pickup(s.sound);
      pushPop(node.x, node.y - 20, '+3 Pez · +2 Agu · +2 Oro', '#38bdf8');
      showToast('Puesto Pesquero: +3 Pez · +2 Agua · +2 Oro');
      grantXpAndFame(20, 20);
      saveState(s);
      syncUi();
      return;
    }
    if (target.kind === 'village') {
      handleVillageAction(target.node, 'trade');
      return;
    }
    if (target.kind === 'explore' || target.kind === 'gather') {
      pl.angle = Math.atan2(target.node.y - pl.y, target.node.x - pl.x);
      doPrimaryAction(pl.angle);
      return;
    }
    if (target.kind === 'water_plot') {
      handleWaterPlot(target.plot.id);
      return;
    }
    if (target.kind === 'plant_plot') {
      setDrawerTab('farm');
      setDrawerOpen(true);
      return;
    }
    if (target.kind === 'shelter') {
      s.st = Math.min(s.maxSt, s.st + 16);
      saveCheckpoint(target.isl ? `Refugio: ${target.isl.name}` : undefined);
      sfx.chest(s.sound);
      syncUi();
      return;
    }

    showToast('Acércate a un cofre, misterio, NPC, Portón de Forja, aldea, recurso o al timón');
  }, [
    computeInteractTarget,
    discoverMysteryNode,
    doPrimaryAction,
    handleCaptureAnimal,
    handleVillageAction,
    handleWaterPlot,
    openChestNode,
    pushPop,
    saveCheckpoint,
    showToast,
    syncUi,
    togglePiloting,
  ]);

  const handleDeclareIslandWar = useCallback(
    (kingdomId: string) => {
      const s = stateRef.current;
      if (!s.hqIslandId) {
        showToast('Construye un Cuartel General en una isla primero');
        return;
      }
      if (warRef.current.active) {
        showToast('Ya hay una guerra activa en curso');
        return;
      }
      const kState = s.kingdoms.find((k) => k.id === kingdomId);
      if (kState) {
        kState.atWar = true;
        kState.relation = Math.max(-100, kState.relation - 50);
      }
      setDrawerOpen(false);
      startWarEvent(kingdomId);
    },
    [showToast, startWarEvent]
  );

  const handleKingdomAction = useCallback(
    (kingdomId: string, action: 'gift' | 'peace') => {
      const s = stateRef.current;
      const kState = s.kingdoms.find((k) => k.id === kingdomId);
      if (!kState) return;
      if (action === 'gift' && s.resources.oro >= 3) {
        s.resources.oro -= 3;
        kState.relation = Math.min(100, kState.relation + 22);
        showToast('Regalo diplomático enviado (+22 Relación)');
      } else if (action === 'peace' && s.resources.oro >= 8) {
        s.resources.oro -= 8;
        kState.atWar = false;
        kState.relation = Math.max(0, kState.relation + 35);
        showToast('Tratado de paz firmado con el reino');
      } else {
        return;
      }
      sfx.pickup(s.sound);
      saveState(s);
      syncUi();
    },
    [showToast, syncUi]
  );

  const handleFoundOrUpgradeClan = useCallback(
    (name?: string, tag?: string) => {
      const s = stateRef.current;
      if (!s.clan.founded) {
        if (!canAfford(s.resources, { mad: 6, oro: 4, hie: 2 })) return;
        spendResources(s.resources, { mad: 6, oro: 4, hie: 2 });
        s.clan.founded = true;
        s.clan.name = (name || 'Marea Libre').trim() || 'Marea Libre';
        s.clan.tag = (tag || 'MAREA').trim().toUpperCase().slice(0, 5) || 'MAREA';
        s.clan.level = 1;
        sfx.levelUp(s.sound);
        showToast(`¡Clan fundado: [${s.clan.tag}] ${s.clan.name}!`);
      } else {
        const oroCost = 6 + s.clan.level * 3;
        if (!canAfford(s.resources, { oro: oroCost, hie: 4 })) return;
        spendResources(s.resources, { oro: oroCost, hie: 4 });
        s.clan.level += 1;
        s.clan.members += 2;
        sfx.levelUp(s.sound);
        showToast(`Clan subió a Rango Nv.${s.clan.level}`);
      }
      saveState(s);
      syncUi();
    },
    [showToast, syncUi]
  );

  const handleUnlockClanPerk = useCallback(
    (perkId: string) => {
      const s = stateRef.current;
      if (!s.clan.founded || s.clan.perks.includes(perkId)) return;
      const pk = CLAN_PERKS_CATALOG.find((p) => p.id === perkId);
      if (!pk || !canAfford(s.resources, pk.cost)) return;
      spendResources(s.resources, pk.cost);
      s.clan.perks.push(perkId);
      s.raft.maxHp = computeRaftMaxHp(s);
      if (perkId === 'perk_casco') s.raft.hp = Math.min(s.raft.maxHp, s.raft.hp + 80);
      sfx.levelUp(s.sound);
      showToast(`Ventaja de Clan activada: ${pk.name}`);
      saveState(s);
      syncUi();
    },
    [showToast, syncUi]
  );

  const handleClanAction = useCallback(
    (clanId: string, action: 'gift' | 'peace' | 'war') => {
      const s = stateRef.current;
      const rc = s.clan.rivals.find((c) => c.id === clanId);
      if (!rc) return;

      if (action === 'gift' && s.resources.oro >= 3) {
        s.resources.oro -= 3;
        rc.relation = Math.min(100, rc.relation + 25);
        showToast(`Tributo enviado a [${rc.tag}] ${rc.name}`);
      } else if (action === 'peace' && s.resources.oro >= 7) {
        s.resources.oro -= 7;
        rc.atWar = false;
        rc.relation = Math.max(0, rc.relation + 30);
        showToast(`Tregua firmada con [${rc.tag}]`);
      } else if (action === 'war') {
        if (!s.clan.founded) {
          showToast('Funda tu propio Clan primero');
          return;
        }
        if (warRef.current.active) {
          showToast('Ya hay una guerra activa');
          return;
        }
        rc.atWar = true;
        rc.relation = Math.max(-100, rc.relation - 55);
        setDrawerOpen(false);
        startWarEvent(undefined, clanId);
        return;
      } else {
        return;
      }
      sfx.pickup(s.sound);
      saveState(s);
      syncUi();
    },
    [showToast, startWarEvent, syncUi]
  );

  const handleTrade = useCallback(
    (action: TradeAction) => {
      const s = stateRef.current;
      const r = s.resources;
      if (action === 'sell_mad' && r.mad >= 6) {
        r.mad -= 6;
        r.oro += 3;
      } else if (action === 'sell_pez' && r.pez >= 4) {
        r.pez -= 4;
        r.oro += 3;
      } else if (action === 'sell_car' && r.car >= 5) {
        r.car -= 5;
        r.oro += 4;
      } else if (action === 'buy_mad' && r.oro >= 3) {
        r.oro -= 3;
        r.mad += 5;
      } else if (action === 'buy_cht' && r.oro >= 3) {
        r.oro -= 3;
        r.cht += 4;
      } else if (action === 'buy_agu' && r.oro >= 2) {
        r.oro -= 2;
        r.agu += 4;
      } else if (action === 'buy_hie' && r.oro >= 4) {
        r.oro -= 4;
        r.hie += 4;
      } else if (action === 'buy_tit' && r.oro >= 7) {
        r.oro -= 7;
        r.tit += 2;
      } else if (action === 'buy_tec' && r.oro >= 6) {
        r.oro -= 6;
        r.tec += 1;
      } else if (action === 'buy_repelente' && r.oro >= 4) {
        r.oro -= 4;
        s.consumables.repelente += 1;
      } else if (action === 'buy_hamaca' && r.oro >= 5) {
        r.oro -= 5;
        s.consumables.hamaca += 1;
      } else {
        return;
      }
      sfx.pickup(s.sound);
      showToast('Intercambio completado');
      saveState(s);
      syncUi();
    },
    [showToast, syncUi]
  );

  const handleToggleRelic = useCallback(
    (relicId: string) => {
      const s = stateRef.current;
      if (!s.relicsOwned.includes(relicId)) return;
      const idx = s.equippedRelics.indexOf(relicId);
      if (idx >= 0) {
        s.equippedRelics.splice(idx, 1);
      } else {
        if (s.equippedRelics.length >= 3) {
          s.equippedRelics.shift();
        }
        s.equippedRelics.push(relicId);
      }
      s.maxHp = computeEffectiveMaxHp(s);
      s.maxSt = computeEffectiveMaxStamina(s);
      if (s.hp > s.maxHp) s.hp = s.maxHp;
      sfx.pickup(s.sound);
      saveState(s);
      syncUi();
    },
    [syncUi]
  );

  const handleSelectTitle = useCallback(
    (titleId: string) => {
      const s = stateRef.current;
      if (!s.unlockedTitles.includes(titleId)) return;
      s.activeTitleId = titleId;
      s.maxHp = computeEffectiveMaxHp(s);
      sfx.pickup(s.sound);
      showToast(`Título equipado: ${TITLE_MAP[titleId]?.name || ''}`);
      saveState(s);
      syncUi();
    },
    [showToast, syncUi]
  );

  const handleToggleDonorSkin = useCallback(() => {
    const s = stateRef.current;
    if (!s.donorUnlocked) return;
    s.donorSkinEnabled = !s.donorSkinEnabled;
    sfx.pickup(s.sound);
    showToast(
      s.donorSkinEnabled
        ? 'Apariencia exclusiva de Mecenas activada en personaje y refugio'
        : 'Apariencia clásica restaurada'
    );
    saveState(s);
    syncUi();
  }, [showToast, syncUi]);

  const activateStoryMission = useCallback(
    (missionId: StoryMissionId, silentIntro = false) => {
      const s = stateRef.current;
      const def = STORY_MISSION_MAP[missionId];
      const prog = s.storyMissions.find((m) => m.id === missionId);
      if (!def || !prog || prog.status !== 'available' || s.activeStoryMissionId) return false;

      const pl = playerRef.current;
      const ang = silentIntro ? -0.45 : Math.random() * Math.PI * 2;
      const mx = pl.x + Math.cos(ang) * 260;
      const my = pl.y + Math.sin(ang) * 260;

      prog.status = 'active';
      prog.progress = 0;
      prog.target = def.targetCount;
      prog.markerX = mx;
      prog.markerY = my;
      s.activeStoryMissionId = missionId;

      def.enemySpawns.forEach((enemyKind, idx) => {
        const ea = ang + (idx - 1) * 0.45;
        const dist = 250 + idx * 45;
        spawnEnemyNear(enemyKind, pl.x + Math.cos(ea) * dist, pl.y + Math.sin(ea) * dist, missionId);
      });

      if (def.supplyDrops) {
        def.supplyDrops.forEach((drop, idx) => {
          spawnFloatingDrop(mx + (idx - 1) * 28, my + (idx % 2 === 0 ? -18 : 18), drop.key, drop.amount);
        });
      }

      if (!silentIntro) {
        setStoryOpen(false);
        setMode('PLAYING');
        sfx.warHorn(s.sound);
        showToast(`Misión iniciada: ${def.title}`);
        enqueuePausedDialogues([
          {
            id: `story_start_${missionId}_${Date.now()}`,
            speaker: 'Vice-Cap. Vega',
            role: 'Vice-Capitana',
            mood: getNpcMoodState(s, 'vega').mood,
            color: '#38bdf8',
            text: def.startDialog,
          },
        ]);
      }
      saveState(s);
      syncUi();
      return true;
    },
    [enqueuePausedDialogues, showToast, spawnEnemyNear, spawnFloatingDrop, syncUi]
  );

  const handleStartStoryMission = useCallback(
    (missionId: StoryMissionId) => {
      const s = stateRef.current;
      if (s.activeStoryMissionId) {
        showToast('Ya tienes una misión de historia activa');
        return;
      }
      activateStoryMission(missionId, false);
    },
    [activateStoryMission, showToast]
  );

  const handleResolveStoryChoice = useCallback(
    (missionId: StoryMissionId, choiceId: 'A' | 'B') => {
      const s = stateRef.current;
      const def = STORY_MISSION_MAP[missionId];
      const prog = s.storyMissions.find((m) => m.id === missionId);
      if (!def || !prog) return;
      const choice = def.choices.find((c) => c.id === choiceId);
      if (!choice) return;

      if (choice.cost) {
        for (const [k, v] of Object.entries(choice.cost)) {
          const rk = k as ResourceKey;
          s.resources[rk] = Math.max(0, s.resources[rk] - (v || 0));
        }
      }
      if (choice.reward) {
        for (const [k, v] of Object.entries(choice.reward)) {
          const rk = k as ResourceKey;
          s.resources[rk] += v || 0;
        }
      }
      if (typeof choice.hullDelta === 'number') {
        s.raft.hp = Math.max(25, Math.min(s.raft.maxHp, s.raft.hp + choice.hullDelta));
      }
      if (typeof choice.hpDelta === 'number') {
        s.hp = Math.max(15, Math.min(s.maxHp, s.hp + choice.hpDelta));
      }
      if (typeof choice.staminaDelta === 'number') {
        s.st = Math.max(0, Math.min(s.maxSt, s.st + choice.staminaDelta));
      }
      if (typeof choice.bountyDelta === 'number') {
        s.bounty += choice.bountyDelta;
      }
      if (typeof choice.coraliaRelationDelta === 'number') {
        const coralia = s.kingdoms.find((k) => k.id === 'coralia');
        if (coralia) coralia.relation = Math.min(100, coralia.relation + choice.coraliaRelationDelta);
      }

      grantXpAndFame(choice.xp, choice.fame);

      prog.status = 'completed';
      prog.choice = choice.id;
      prog.choiceLabel = choice.label;
      prog.markerX = undefined;
      prog.markerY = undefined;
      if (s.activeStoryMissionId === missionId) s.activeStoryMissionId = null;
      logWorldEvent(s, 'mission', `Completaste la misión "${def.title}"`);

      s.newspaper.articles.unshift({
        id: `story_${missionId}_${s.dayCount}`,
        category: 'MUNDO',
        headline: choice.newsHeadline,
        body: choice.newsBody,
        day: s.dayCount,
      });
      s.newspaper.articles = s.newspaper.articles.slice(0, 6);
      s.newspaper.unread = true;

      const allDone = STORY_MISSIONS_CATALOG.every((m) =>
        s.storyMissions.some((sm) => sm.id === m.id && sm.status === 'completed')
      );
      if (allDone && !s.unlockedTitles.includes('title_testigo_cenizas')) {
        s.unlockedTitles.push('title_testigo_cenizas');
        s.activeTitleId = 'title_testigo_cenizas';
        showToast('¡Has completado todas las misiones! Título desbloqueado: Testigo de las Cenizas');
      } else {
        showToast(`Misión "${def.title}" completada (+${choice.xp} XP · +${choice.fame} Fama)`);
      }

      pushComic(choice.crewSpeaker, choice.crewLine, raftRef.current.x, raftRef.current.y, '#fde047');
      sfx.levelUp(s.sound);
      setPendingDilemmaId(null);
      saveState(s);
      syncUi();
    },
    [grantXpAndFame, pushComic, showToast, syncUi]
  );

  const handleRomanceAction = useCallback(
    (candidateId: string, action: 'court' | 'marry') => {
      const s = stateRef.current;
      const cand = ROMANCE_CANDIDATES.find((c) => c.id === candidateId);
      if (!cand) return;

      if (action === 'court') {
        if (!canAfford(s.resources, cand.giftCost)) return;
        spendResources(s.resources, cand.giftCost);
        s.family.affection[candidateId] = Math.min(
          100,
          (s.family.affection[candidateId] || 0) + 25
        );
        sfx.pickup(s.sound);
        showToast(`${cand.name}: "${cand.quotes[Math.floor(Math.random() * cand.quotes.length)]}"`);
      } else {
        if ((s.family.affection[candidateId] || 0) < 60 || s.family.married) return;
        s.family.married = true;
        s.family.partnerId = candidateId;
        s.fame += 80;
        sfx.levelUp(s.sound);
        showToast(`¡Te casaste con ${cand.name}! (+80 Fama)`);
      }
      saveState(s);
      syncUi();
    },
    [showToast, syncUi]
  );

  const handleHaveChild = useCallback(() => {
    const s = stateRef.current;
    if (!s.family.married || s.family.children.length >= 4) return;
    if (s.resources.gui < 1 || s.resources.oro < 4) return;
    s.resources.gui -= 1;
    s.resources.oro -= 4;

    const name = CHILD_NAMES[s.family.children.length % CHILD_NAMES.length];
    const trait = CHILD_TRAITS[Math.floor(Math.random() * CHILD_TRAITS.length)];
    s.family.children.push({
      id: `child_${eid++}`,
      name,
      stage: 'bebé',
      bornDay: s.dayCount,
      trait,
    });
    sfx.levelUp(s.sound);
    showToast(`¡Nació ${name} (${trait})! Toda la tripulación celebra`);
    checkTitlesAndAchievements();
    saveState(s);
    syncUi();
  }, [checkTitlesAndAchievements, showToast, syncUi]);

  const handleUpgradeRaft = useCallback(
    (
      part:
        | 'level'
        | 'engineLevel'
        | 'turretLevel'
        | 'distillerLevel'
        | 'solarLevel'
        | 'missileLevel'
        | 'shieldLevel'
        | 'droneLevel'
    ) => {
      const s = stateRef.current;
      const r = s.raft;
      const maxCaps: Partial<Record<typeof part, number>> = {
        level: 10,
        turretLevel: 8,
        missileLevel: 4,
        shieldLevel: 4,
        droneLevel: 3,
      };
      const curLv = r[part] || 0;
      const cap = maxCaps[part];
      if (cap && curLv >= cap) {
        showToast('Este sistema naval ya alcanzó su nivel máximo');
        return;
      }

      const costs: Partial<ResourceBag> = {
        level: {
          mad: 12 + r.level * 5,
          cht: 6 + r.level * 3,
          hie: r.level >= 3 ? r.level : 0,
        },
        engineLevel: {
          mad: 9 + r.engineLevel * 4,
          cht: 8 + r.engineLevel * 4,
          oro: r.engineLevel + 1,
        },
        turretLevel: {
          cht: 14 + r.turretLevel * 6,
          mad: 8,
          hie: 2 + r.turretLevel,
          tit: r.turretLevel >= 1 ? 2 : 0,
        },
        missileLevel: {
          cht: 14 + (r.missileLevel || 0) * 6,
          hie: 6 + (r.missileLevel || 0) * 3,
          tit: 2 + (r.missileLevel || 0) * 2,
          car: 6,
        },
        shieldLevel: {
          tit: 3 + (r.shieldLevel || 0) * 2,
          tec: 2 + (r.shieldLevel || 0) * 2,
          cri: 1 + (r.shieldLevel || 0),
        },
        droneLevel: {
          tec: 4 + (r.droneLevel || 0) * 3,
          tit: 3 + (r.droneLevel || 0) * 2,
          cri: 2,
        },
        distillerLevel: { mad: 8 + r.distillerLevel * 3, cht: 7 + r.distillerLevel * 3 },
        solarLevel: { cht: 10 + r.solarLevel * 4, tit: r.solarLevel >= 2 ? 1 : 0 },
      }[part];

      if (!canAfford(s.resources, costs)) return;
      spendResources(s.resources, costs);
      const nextLv = curLv + 1;
      r[part] = nextLv;
      raftRef.current[part] = nextLv;

      if (part === 'level' || part === 'shieldLevel') {
        r.maxHp = computeRaftMaxHp(s);
        r.hp = Math.min(r.maxHp, r.hp + (part === 'level' ? 90 : 75));
        r.damagedMode = false;
        raftRef.current.maxHp = r.maxHp;
        raftRef.current.hp = r.hp;
        raftRef.current.damagedMode = false;
      }

      sfx.build(s.sound);
      showToast(
        part === 'level'
          ? `¡Navío mejorado a ${getShipClassName(r.level)}!`
          : part === 'turretLevel'
            ? `¡Torreta naval #${nextLv} instalada!`
            : part === 'missileLevel'
              ? `🚀 ¡Batería de Misiles VLS Nv.${nextLv} equipada!`
              : part === 'shieldLevel'
                ? `🛡️ ¡Escudo Deflector Naval Nv.${nextLv} en línea!`
                : part === 'droneLevel'
                  ? `🛸 ¡Dron de Defensa Orbital #${nextLv} desplegado!`
                  : 'Mejora naval instalada'
      );
      checkTitlesAndAchievements();
      saveState(s);
      syncUi();
    },
    [checkTitlesAndAchievements, showToast, syncUi]
  );

  const handleRecruitOrUpgradeSurvivor = useCallback(
    (id: SurvivorId) => {
      const s = stateRef.current;
      const def = SURVIVORS_CATALOG.find((c) => c.id === id);
      const sv = s.survivors.find((x) => x.id === id);
      if (!def || !sv) return;

      const cost = sv.unlocked
        ? { mad: 10 + sv.level * 5, oro: 4 + sv.level * 2, tit: sv.level >= 3 ? 2 : 0 }
        : def.recruitCost;
      if (!canAfford(s.resources, cost)) return;
      spendResources(s.resources, cost);

      if (!sv.unlocked) {
        sv.unlocked = true;
        showToast(`¡${def.name} se unió a defender tu navío!`);
        pushComic(def.name, def.quotes[0], raftRef.current.x, raftRef.current.y, def.color);
      } else {
        sv.level += 1;
        showToast(`${def.name} mejorado a Nv.${sv.level}`);
      }
      sfx.levelUp(s.sound);
      saveState(s);
      syncUi();
    },
    [pushComic, showToast, syncUi]
  );

  const handleUnlockDestinyNode = useCallback(
    (nodeId: string) => {
      const s = stateRef.current;
      if (!canUnlockDestinyNode(s, nodeId)) return;
      const node = DESTINY_MAP[nodeId];
      s.fame -= node.fameCost;
      spendResources(s.resources, node.resourceCost);
      s.destinyUnlocked.push(nodeId);
      s.maxHp = computeEffectiveMaxHp(s);
      s.hp = Math.min(s.maxHp, s.hp + 20);
      sfx.levelUp(s.sound);
      showToast(`Nodo desbloqueado: ${node.name}`);
      checkTitlesAndAchievements();
      saveState(s);
      syncUi();
    },
    [checkTitlesAndAchievements, showToast, syncUi]
  );

  const resetWorldEntities = useCallback(() => {
    loadedChunksRef.current.clear();
    islandsRef.current = [];
    worldNpcsRef.current = [];
    compoundWallsRef.current = [];
    rescueBoatsRef.current = [];
    animalsRef.current = [];
    enemiesRef.current = [];
    projectilesRef.current = [];
    dropsRef.current = [];
    explosionsRef.current = [];
    splashesRef.current = [];
    slashesRef.current = [];
    popsRef.current = [];
    comicsRef.current = [];
    crewCooldownsRef.current = {};

    raftRef.current = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      angle: 0,
      level: stateRef.current.raft.level,
      turretLevel: stateRef.current.raft.turretLevel,
      distillerLevel: stateRef.current.raft.distillerLevel,
      solarLevel: stateRef.current.raft.solarLevel,
      engineLevel: stateRef.current.raft.engineLevel,
      missileLevel: stateRef.current.raft.missileLevel || 0,
      shieldLevel: stateRef.current.raft.shieldLevel || 0,
      droneLevel: stateRef.current.raft.droneLevel || 0,
      hp: stateRef.current.raft.hp,
      maxHp: computeRaftMaxHp(stateRef.current),
      damagedMode: stateRef.current.raft.damagedMode,
    };
    playerRef.current = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      angle: 0,
      speed: 175,
      onRaft: true,
      piloting: false,
      swimming: false,
      onIsland: false,
      inShelter: false,
      atkT: 0,
      cd: 0,
      dashT: 0,
      invT: 0,
      animT: 0,
      gaitPhase: 0,
    };
    camRef.current = { x: 0, y: 0 };
    ensureChunksAround(0, 0);

    // Ensure starter Dawnforge Gate + Maestro Torren is anchored ON starter island isl_1_0 (never in open ocean)
    const starterIsl = islandsRef.current.find((i) => i.id === 'isl_1_0');
    const starterNpc = getStarterBargeWorldNpc(starterIsl);
    const starterIdx = worldNpcsRef.current.findIndex((x) => x.id === starterNpc.id);
    if (starterIdx >= 0) worldNpcsRef.current[starterIdx] = starterNpc;
    else worldNpcsRef.current.push(starterNpc);

    for (let i = 0; i < 6; i++) {
      const a = Math.random() * Math.PI * 2;
      const d = 120 + Math.random() * 210;
      const pool: ResourceKey[] = ['mad', 'cht', 'agu', 'pez', 'veg'];
      spawnFloatingDrop(Math.cos(a) * d, Math.sin(a) * d, pool[i % pool.length], 1);
    }
  }, [ensureChunksAround, spawnFloatingDrop]);

  const finishIntroCutscene = useCallback(() => {
    const s = stateRef.current;
    const raft = raftRef.current;
    const pl = playerRef.current;

    introRef.current.active = false;
    setIntroUi({ ...introRef.current });

    pl.x = raft.x - 10;
    pl.y = raft.y + 6;
    pl.vx = 0;
    pl.vy = 0;
    pl.angle = 0;
    pl.swimming = false;
    pl.onRaft = true;
    pl.onIsland = false;
    pl.piloting = false;
    camRef.current = { x: raft.x, y: raft.y };

    if (!s.activeStoryMissionId) {
      activateStoryMission('boya_nombres', true);
    }

    pushComic(
      'Vice-Cap. Vega',
      '¡Toma el Timón [F] y sigue la flecha cian! Vamos hacia La Boya de los Nombres.',
      raft.x,
      raft.y - 14,
      '#38bdf8'
    );
    showToast('📖 Historia · Misión 1: La Boya de los Nombres (Toma el Timón [F])');
    saveState(s);
    syncUi();
  }, [activateStoryMission, pushComic, showToast, syncUi]);

  const advanceIntroStep = useCallback(() => {
    const ic = introRef.current;
    if (!ic.active) return;
    const s = stateRef.current;
    const pl = playerRef.current;
    const raft = raftRef.current;

    if (ic.phase === 'adrift') {
      ic.phase = 'spot_raft';
      ic.phaseElapsed = 0;
      ic.captionTitle = 'Una Balsa en la Bruma · Tu Salvación';
      ic.captionText =
        'Entre las olas tóxicas distingues tablas amarradas y un farol encendido... ¡Es tu única esperanza de vivir!';
      setIntroUi({ ...ic });
      pushComic(
        s.playerProfile.name,
        '¡Una balsa! ¡Alguien sobrevivió! ¡Tengo que nadar hacia ella!',
        pl.x,
        pl.y - 14,
        '#fde047'
      );
      sfx.pickup(s.sound);
    } else if (ic.phase === 'spot_raft') {
      ic.phase = 'swim_to_raft';
      ic.phaseElapsed = 0;
      ic.captionTitle = 'Nadando Hacia la Salvación';
      ic.captionText =
        'Cada brazada arde en el agua salada, pero la esperanza te empuja hacia la cubierta...';
      setIntroUi({ ...ic });
    } else if (ic.phase === 'swim_to_raft') {
      pl.x = raft.x - 16;
      pl.y = raft.y + 8;
      pl.vx = 0;
      pl.vy = 0;
      pl.swimming = false;
      pl.onRaft = true;
      pl.angle = 0;
      ic.phase = 'meet_vega';
      ic.phaseElapsed = 0;
      ic.captionTitle = 'Acontecimientos de la Historia · Vice-Capitana Vega';
      ic.captionText =
        '«¡Agarra mi mano, náufrago! El océano ya no pertenece a nadie, pero juntos aún podemos seguir un último rumbo.»';
      setIntroUi({ ...ic });
      pushComic(
        'Vice-Cap. Vega',
        '¡Bienvenido a bordo! Soy Vega, vice-capitana. Los piratas y los leviatanes acechan todo el mar.',
        raft.x,
        raft.y - 16,
        '#38bdf8'
      );
      sfx.dash(s.sound);
    } else if (ic.phase === 'meet_vega') {
      if (!introCueRef.current.vegaLine2) {
        introCueRef.current.vegaLine2 = true;
        ic.captionTitle = 'Misión 1 · La Boya de los Nombres';
        ic.captionText =
          '«Una vieja boya repite nombres de civiles perdidos. Toma el Timón [F] y sígueme hacia La Boya de los Nombres.»';
        setIntroUi({ ...ic });
        pushComic(
          'Vice-Cap. Vega',
          'Toma el Timón [F] y sigue la señal cian: ¡comencemos La Boya de los Nombres!',
          raft.x,
          raft.y - 16,
          '#fde047'
        );
        sfx.pickup(s.sound);
      } else {
        finishIntroCutscene();
      }
    }
  }, [finishIntroCutscene, pushComic]);

  const startNewGame = useCallback(() => {
    clearSavedState();
    const prev = stateRef.current;
    const fresh = initState();
    fresh.sound = prev.sound;
    fresh.difficulty = prev.difficulty || 'superviviente';
    fresh.language = prev.language || 'es';
    fresh.settings = { ...DEFAULT_GAME_SETTINGS, ...(prev.settings || {}) };
    stateRef.current = fresh;
    if (fresh.settings.autoFullscreen) {
      void fullscreen.enter();
    }
    setHasSave(false);
    weatherRef.current = 'despejado';
    setWeather('despejado');
    timersRef.current.calmNotified = false;
    timersRef.current.leviathanSwallowCd = 85;
    timersRef.current.playerThought = 6;
    timersRef.current.vegaProtectCd = 10;
    timersRef.current.marinePatrolCd = 24;
    timersRef.current.factionSkirmishLogCd = 0;
    timersRef.current.islandDefenseCd = 0;
    govWaveRef.current = { active: false, waveNumber: 0, waveCap: 2, spawnedInWave: 0, cooldown: 18 };
    lastAiNewsSigRef.current = '';
    prevSafeZoneIdRef.current = null;
    warRef.current = {
      active: false,
      title: '',
      wave: 0,
      remaining: 0,
      total: 0,
      cooldown: 130,
      targetKingdomId: null,
      targetClanId: null,
      isIslandWar: false,
    };
    randomEventRef.current = {
      active: false,
      kind: null,
      title: '',
      timer: 0,
      targetCount: 0,
      progress: 0,
    };
    resetWorldEntities();
    activateStoryMission('boya_nombres', true);

    // Start new adventure adrift in the ocean, spotting the raft and swimming toward salvation
    playerRef.current.x = -235;
    playerRef.current.y = 105;
    playerRef.current.vx = 8;
    playerRef.current.vy = -3;
    playerRef.current.angle = -0.35;
    playerRef.current.onRaft = false;
    playerRef.current.piloting = false;
    playerRef.current.swimming = true;
    playerRef.current.onIsland = false;
    camRef.current = { x: -235, y: 105 };

    introRef.current = {
      active: true,
      phase: 'adrift',
      elapsed: 0,
      phaseElapsed: 0,
      captionTitle: 'El Océano de las Cenizas Saladas · A la Deriva',
      captionText:
        'Las ciudades costeras cayeron bajo la marea mutante. Flotas agotado entre restos salados, sin barco ni refugio...',
    };
    introCueRef.current = {
      spotBubble: false,
      swimSplashT: 0,
      vegaLine1: false,
      vegaLine2: false,
    };
    setIntroUi({ ...introRef.current });

    setMode('PLAYING');
    pushComic(
      fresh.playerProfile.name,
      'El agua helada quema los huesos... ¿queda alguien vivo allá afuera?',
      -235,
      92,
      '#7dd3fc'
    );
    syncUi();
  }, [activateStoryMission, fullscreen, pushComic, resetWorldEntities, syncUi]);

  const handleHuntBounty = useCallback(
    (bountyId: string) => {
      const s = stateRef.current;
      const pb = s.pirateBounties.find((b) => b.id === bountyId);
      if (!pb || pb.claimed) return;

      pb.active = true;
      const existing = enemiesRef.current.find((e) => e.bountyId === bountyId);
      if (existing) {
        pb.targetX = existing.x;
        pb.targetY = existing.y;
      } else {
        const ang = Math.random() * Math.PI * 2;
        const dist = 540 + Math.random() * 140;
        let tx = playerRef.current.x + Math.cos(ang) * dist;
        let ty = playerRef.current.y + Math.sin(ang) * dist;
        const bounded = resolveIslandBoundary(tx, ty, 30, islandsRef.current);
        tx = bounded.x;
        ty = bounded.y;
        pb.targetX = tx;
        pb.targetY = ty;

        const maxHp = Math.round(180 + pb.dangerLevel * 95);
        enemiesRef.current.push({
          id: eid++,
          kind: 'bandit_boss',
          name: pb.name,
          isBandit: true,
          isThief: false,
          isBoss: true,
          isAquatic: false,
          isLargeMonster: false,
          isLeviathan: false,
          provoked: true,
          onLand: false,
          boardedRaft: false,
          parkedBoat: null,
          x: tx,
          y: ty,
          vx: 0,
          vy: 0,
          hp: maxHp,
          maxHp,
          dmg: Math.round(14 + pb.dangerLevel * 5),
          speed: 88 + pb.dangerLevel * 3,
          radius: 22,
          color: '#fbbf24',
          cd: 0.8,
          hitT: 0,
          gaitPhase: 0,
          stealProgress: 0,
          stolenBag: null,
          fameReward: pb.rewardFame,
          bountyId: pb.id,
        });
      }

      setNewspaperOpen(false);
      sfx.warHorn(s.sound);
      showToast(`¡Objetivo marcado en el minimapa: ${pb.name}!`);
      saveState(s);
      syncUi();
    },
    [showToast, syncUi]
  );

  const handleSaveProfile = useCallback(
    (name: string, country: string) => {
      const s = stateRef.current;
      s.playerProfile.name = name.trim().slice(0, 22) || 'Capitán Náufrago';
      s.playerProfile.country = country || 'MX';
      saveProfile(s.playerProfile);
      saveState(s);
      syncUi();
      syncLeaderboard(true);
    },
    [syncLeaderboard, syncUi]
  );

  const triggerPlayerDeath = useCallback(
    (
      causeKey:
        | 'radiation'
        | 'needs'
        | 'animal'
        | 'leviathan'
        | 'pirate'
        | 'enemy'
        | 'projectile'
        | 'unknown' = 'unknown',
      attackerName?: string
    ) => {
      const s = stateRef.current;
      const pl = playerRef.current;
      const weaponDef = WEAPON_MAP[s.hotbar[s.equippedSlot]] || WEAPON_MAP.lanza_madera;
      const unusedGui = s.resources.gui || 0;
      const unusedVeg = s.resources.veg || 0;
      const unusedPez = s.resources.pez || 0;
      const unusedAgu = s.resources.agu || 0;
      const nearbyCount = enemiesRef.current.filter(
        (e) => Math.hypot(e.x - pl.x, e.y - pl.y) < 380
      ).length;
      const hunger = Math.round(s.vitals?.hunger ?? 100);
      const thirst = Math.round(s.vitals?.thirst ?? 100);
      const killerLabel = attackerName || causeKey;

      const instantFacts: string[] = [
        `Te despachó: ${killerLabel} (con ${nearbyCount} enemigos cerca).`,
        `Tenías ${unusedGui} guiso(s), ${unusedVeg} veg y ${unusedAgu} agua guardados sin usar.`,
        `Tu arma equipada era "${weaponDef.name}" · Hambre ${hunger}% · Sed ${thirst}%.`,
      ];

      s.deathsUsed = (s.deathsUsed || 0) + 1;
      s.lastDeathCause = buildDeathCauseRecord(causeKey, attackerName, s.dayCount, instantFacts);
      sfx.gameOver(s.sound);
      saveState(s);
      syncUi();
      setMode('GAME_OVER');

      if (typeof navigator === 'undefined' || navigator.onLine) {
        const deathDay = s.dayCount;
        void requestAiDeathRoast({
          playerName: s.playerProfile?.name || 'Capitán',
          causeKey,
          attackerName: killerLabel,
          day: deathDay,
          difficulty: s.difficulty,
          equippedWeapon: weaponDef.name,
          unusedGui,
          unusedVeg,
          unusedPez,
          unusedAgu,
          nearbyEnemiesCount: nearbyCount,
          hunger,
          thirst,
          stamina: Math.round(s.st),
          onRaft: pl.onRaft,
          bounty: s.bounty || 0,
        }).then((roast) => {
          const cur = stateRef.current.lastDeathCause;
          if (!cur) return;
          if (roast) {
            stateRef.current.lastDeathCause = {
              ...cur,
              headline: roast.headline,
              sarcasm: roast.roast,
              facts: roast.facts,
              retryTaunt: roast.retryTaunt,
              aiLoading: false,
              aiRoast: true,
            };
          } else {
            stateRef.current.lastDeathCause = {
              ...cur,
              aiLoading: false,
            };
          }
          saveState(stateRef.current);
          syncUi();
        });
      } else {
        s.lastDeathCause.aiLoading = false;
        saveState(s);
        syncUi();
      }
    },
    [syncUi]
  );

  const handleRespawnAtCheckpoint = useCallback(() => {
    const s = stateRef.current;
    if (getRemainingLives(s) <= 0) {
      showToast('💀 Límite de 5 muertes alcanzado. Paga una Vida Extra vía Bre-B o inicia Nueva Partida.');
      return;
    }
    const cp = s.checkpoint || {
      x: 0,
      y: 0,
      raftX: 0,
      raftY: 0,
      islandId: null,
      label: 'Fondeadero Inicial',
      savedDay: 1,
    };

    const hasWarehouse = s.islandStructures.some((st) => st.kind === 'warehouse');
    const lossRate = hasWarehouse ? 0.2 : 0.35;

    s.level = Math.max(1, s.level - 1);
    s.xp = 0;
    s.nextXp = Math.round(85 * Math.pow(1.35, s.level - 1));

    for (const k of Object.keys(s.resources) as ResourceKey[]) {
      const loss = Math.floor((s.resources[k] || 0) * lossRate);
      s.resources[k] = Math.max(0, (s.resources[k] || 0) - loss);
    }

    s.maxHp = computeEffectiveMaxHp(s);
    s.maxSt = computeEffectiveMaxStamina(s);
    s.hp = s.maxHp;
    s.st = s.maxSt;
    s.raft.maxHp = computeRaftMaxHp(s);
    s.raft.damagedMode = false;
    s.raft.hp = Math.max(Math.round(s.raft.maxHp * 0.65), s.raft.hp);

    raftRef.current.x = cp.raftX;
    raftRef.current.y = cp.raftY;
    raftRef.current.vx = 0;
    raftRef.current.vy = 0;
    raftRef.current.hp = s.raft.hp;
    raftRef.current.maxHp = s.raft.maxHp;
    raftRef.current.damagedMode = false;

    playerRef.current.x = cp.x;
    playerRef.current.y = cp.y;
    playerRef.current.vx = 0;
    playerRef.current.vy = 0;
    playerRef.current.piloting = false;
    playerRef.current.invT = 2.0;

    camRef.current = { x: cp.x, y: cp.y };
    enemiesRef.current = enemiesRef.current.filter(
      (e) => e.bountyId || Math.hypot(e.x - cp.x, e.y - cp.y) > 540
    );
    ensureChunksAround(cp.x, cp.y);

    setMode('PLAYING');
    sfx.chest(s.sound);
    showToast(`Reapareciste en ${cp.label} (-1 Nv, XP → 0, -${Math.round(lossRate * 100)}% recursos)`);
    saveState(s);
    syncUi();
  }, [ensureChunksAround, showToast, syncUi]);

  const continueGame = useCallback(() => {
    const loaded = loadState();
    stateRef.current = loaded;
    if (loaded.settings?.autoFullscreen) {
      void fullscreen.enter();
    }
    introRef.current.active = false;
    setIntroUi({ ...introRef.current });
    timersRef.current.calmNotified = loaded.elapsedSeconds >= 180;
    timersRef.current.playerThought = 7;
    timersRef.current.vegaProtectCd = 10;
    timersRef.current.marinePatrolCd = 24;
    timersRef.current.factionSkirmishLogCd = 0;
    timersRef.current.islandDefenseCd = 0;
    govWaveRef.current = { active: false, waveNumber: 0, waveCap: 2, spawnedInWave: 0, cooldown: 18 };
    lastAiNewsSigRef.current = '';
    prevSafeZoneIdRef.current = null;
    resetWorldEntities();
    if (loaded.checkpoint) {
      raftRef.current.x = loaded.checkpoint.raftX;
      raftRef.current.y = loaded.checkpoint.raftY;
      playerRef.current.x = loaded.checkpoint.x;
      playerRef.current.y = loaded.checkpoint.y;
      camRef.current = { x: loaded.checkpoint.x, y: loaded.checkpoint.y };
      ensureChunksAround(loaded.checkpoint.x, loaded.checkpoint.y);
    }
    if (loaded.elapsedSeconds < 2 && !loaded.activeStoryMissionId) {
      activateStoryMission('boya_nombres', true);
    }
    setMode('PLAYING');
    showToast(`Día ${loaded.dayCount} reanudado · Vidas restantes: ${getRemainingLives(loaded)}`);
    syncUi();
    syncLeaderboard(false);
  }, [activateStoryMission, ensureChunksAround, fullscreen, resetWorldEntities, showToast, syncLeaderboard, syncUi]);

  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;

    const updateSize = () => {
      const rect = stage.getBoundingClientRect();
      const w = Math.max(320, Math.floor(rect.width));
      const h = Math.max(240, Math.floor(rect.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sizeRef.current = { width: w, height: h };

      const vw = window.innerWidth || w;
      const vh = window.innerHeight || h;
      const nextOrientation: 'portrait' | 'landscape' = vw >= vh ? 'landscape' : 'portrait';
      setViewport((prev) =>
        prev.width === vw && prev.height === vh && prev.orientation === nextOrientation
          ? prev
          : { width: vw, height: vh, orientation: nextOrientation }
      );
    };

    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(stage);
    window.addEventListener('resize', updateSize);
    window.addEventListener('orientationchange', updateSize);

    if (islandsRef.current.length === 0) {
      resetWorldEntities();
    }

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateSize);
      window.removeEventListener('orientationchange', updateSize);
    };
  }, [resetWorldEntities]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') return;
      const k = e.key.toLowerCase();
      if (dialogueQueue.length > 0) {
        if (k === ' ' || k === 'enter') {
          e.preventDefault();
          handleNextPausedDialogue();
        } else if (k === 'escape') {
          setDialogueQueue([]);
        }
        return;
      }
      if (npcChatSessionRef.current) {
        if ((k === ' ' || k === 'enter') && npcChatSessionRef.current.stage === 'reading_reply') {
          e.preventDefault();
          handleNextNpcStep();
        } else if ((k === ' ' || k === 'enter') && npcChatSessionRef.current.stage === 'finished') {
          e.preventDefault();
          updateNpcChatSession(null);
        } else if (k === 'escape') {
          updateNpcChatSession(null);
        }
        return;
      }
      if (introRef.current.active && modeRef.current === 'PLAYING' && !uiPausedRef.current) {
        if (k === ' ' || k === 'enter') {
          e.preventDefault();
          advanceIntroStep();
        } else if (k === 'p' || k === 'escape') {
          if (creditsOpen) setCreditsOpen(false);
          else setMode('PAUSED');
        }
        return;
      }
      if (k === 'w' || k === 'arrowup') keyInputRef.current.up = true;
      else if (k === 's' || k === 'arrowdown') keyInputRef.current.down = true;
      else if (k === 'a' || k === 'arrowleft') keyInputRef.current.left = true;
      else if (k === 'd' || k === 'arrowright') keyInputRef.current.right = true;
      else if (k === ' ' || k === 'j') {
        if (modeRef.current === 'PLAYING' && !uiPausedRef.current) {
          e.preventDefault();
          doPrimaryAction();
        }
      } else if (k === 'f') {
        if (modeRef.current === 'PLAYING' && !uiPausedRef.current) {
          e.preventDefault();
          togglePiloting();
        }
      } else if (k === 'g') {
        if (modeRef.current === 'PLAYING' && !uiPausedRef.current) {
          e.preventDefault();
          handleInteract();
        }
      } else if (k === 'm') {
        if (modeRef.current === 'PLAYING' && !introRef.current.active) {
          e.preventDefault();
          setWorldMapOpen((p) => !p);
        }
      } else if (k === 'shift' || k === 'k') {
        if (modeRef.current === 'PLAYING' && !uiPausedRef.current) {
          e.preventDefault();
          doDash();
        }
      } else if (k === 'e') {
        if (modeRef.current === 'PLAYING' && !uiPausedRef.current) {
          e.preventDefault();
          doEat();
        }
      } else if (k === 'tab') {
        e.preventDefault();
        setDrawerOpen((p) => !p);
      } else if (k === 'p' || k === 'escape') {
        if (pendingDilemmaId) {
          setPendingDilemmaId(null);
        } else if (worldMapOpen) {
          setWorldMapOpen(false);
        } else if (activeMerchantNpc) {
          setActiveMerchantNpc(null);
        } else if (settingsOpen) {
          setSettingsOpen(false);
        } else if (accountOpen) {
          setAccountOpen(false);
        } else if (storyOpen) {
          setStoryOpen(false);
        } else if (creditsOpen) {
          setCreditsOpen(false);
        } else if (donationOpen) {
          setDonationOpen(false);
        } else if (newspaperOpen) {
          setNewspaperOpen(false);
        } else if (profileOpen) {
          setProfileOpen(false);
        } else if (destinyModalOpen) {
          setDestinyModalOpen(false);
        } else if (drawerOpen) {
          setDrawerOpen(false);
        } else if (modeRef.current === 'PLAYING' || modeRef.current === 'PAUSED') {
          setMode((p) => (p === 'PLAYING' ? 'PAUSED' : 'PLAYING'));
        }
      } else if (['1', '2', '3', '4', '5'].includes(k)) {
        const slot = Number(k) - 1;
        if (stateRef.current.hotbar[slot]) {
          stateRef.current.equippedSlot = slot;
          syncUi();
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || k === 'arrowup') keyInputRef.current.up = false;
      else if (k === 's' || k === 'arrowdown') keyInputRef.current.down = false;
      else if (k === 'a' || k === 'arrowleft') keyInputRef.current.left = false;
      else if (k === 'd' || k === 'arrowright') keyInputRef.current.right = false;
    };

    const onBlur = () => {
      keyInputRef.current = { up: false, down: false, left: false, right: false };
      joyInputRef.current = { x: 0, y: 0 };
      aimJoyInputRef.current = { x: 0, y: 0, active: false };
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [
    accountOpen,
    activeMerchantNpc,
    advanceIntroStep,
    creditsOpen,
    destinyModalOpen,
    dialogueQueue.length,
    donationOpen,
    drawerOpen,
    handleNextNpcStep,
    handleNextPausedDialogue,
    newspaperOpen,
    npcChatSession,
    pendingDilemmaId,
    profileOpen,
    settingsOpen,
    storyOpen,
    doDash,
    doEat,
    doPrimaryAction,
    handleInteract,
    syncUi,
    togglePiloting,
  ]);

  useEffect(() => {
    syncLeaderboard(false);

    const handleOnline = () => {
      setIsOnline(true);
      const hadPending = localStorage.getItem('marea_mutante_pending_sync') === '1';
      syncLeaderboard(hadPending);
      if (!hadPending) {
        showToast('🌐 Internet conectado · Clasificación mundial al día');
      }
    };
    const handleOffline = () => {
      setIsOnline(false);
      setPendingSync(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const syncInterval = window.setInterval(() => {
      if (navigator.onLine) {
        syncLeaderboard(false);
      }
    }, 25000);

    const banterInterval = window.setInterval(async () => {
      if (!navigator.onLine || isGamePausedRef.current) return;
      if (aiBanterQueueRef.current.length >= 3) return;
      const s = stateRef.current;
      const crewNames = s.survivors
        .filter((sv) => sv.unlocked)
        .map((sv) => SURVIVORS_CATALOG.find((c) => c.id === sv.id)?.name || sv.id);
      if (crewNames.length === 0) return;
      const lines = await requestAiAmbientBanter(crewNames, s, getWorldDialogueCtx());
      if (lines && lines.length > 0) {
        aiBanterQueueRef.current.push(...lines);
      }
    }, 48000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.clearInterval(syncInterval);
      window.clearInterval(banterInterval);
    };
  }, [getWorldDialogueCtx, showToast, syncLeaderboard]);

  // Main 60FPS Simulation Loop
  useEffect(() => {
    let rafId = 0;
    let lastTs = performance.now();

    const step = (now: number) => {
      const rawDt = Math.min(0.05, Math.max(0.001, (now - lastTs) / 1000));
      lastTs = now;
      const dt = isGamePausedRef.current ? 0 : rawDt;

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      const { width, height } = sizeRef.current;
      const t = timersRef.current;
      const s = stateRef.current;
      const pl = playerRef.current;
      const raft = raftRef.current;
      const inDangerousWater = isDangerousOceanAt(pl.x, pl.y);

      if (!isGamePausedRef.current && introRef.current.active) {
        const ic = introRef.current;
        ic.elapsed += dt;
        ic.phaseElapsed += dt;
        t.world += dt;

        for (let i = splashesRef.current.length - 1; i >= 0; i--) {
          splashesRef.current[i].life -= dt;
          if (splashesRef.current[i].life <= 0) splashesRef.current.splice(i, 1);
        }
        for (let i = comicsRef.current.length - 1; i >= 0; i--) {
          comicsRef.current[i].life -= dt;
          if (comicsRef.current[i].life <= 0) comicsRef.current.splice(i, 1);
        }

        if (ic.phase === 'adrift') {
          pl.swimming = true;
          pl.onRaft = false;
          pl.vx = 0;
          pl.vy = 0;
          pl.gaitPhase += dt * 3.8;
          pl.angle = -0.4 + Math.sin(t.world * 1.4) * 0.45;
          camRef.current.x += (pl.x - camRef.current.x) * Math.min(1, dt * 4);
          camRef.current.y += (pl.y - camRef.current.y) * Math.min(1, dt * 4);
        } else if (ic.phase === 'spot_raft') {
          pl.vx = 0;
          pl.vy = 0;
          pl.angle = Math.atan2(raft.y - pl.y, raft.x - pl.x);
          pl.gaitPhase += dt * 3;
          const midX = (pl.x + raft.x) * 0.45;
          const midY = (pl.y + raft.y) * 0.45;
          camRef.current.x += (midX - camRef.current.x) * Math.min(1, dt * 3);
          camRef.current.y += (midY - camRef.current.y) * Math.min(1, dt * 3);

          if (!introCueRef.current.spotBubble && ic.phaseElapsed >= 0.35) {
            introCueRef.current.spotBubble = true;
            pushComic(
              s.playerProfile.name,
              '¡Una balsa! ¡Alguien sobrevivió! ¡Tengo que nadar hacia ella!',
              pl.x,
              pl.y - 14,
              '#fde047'
            );
            sfx.pickup(s.sound);
          }
        } else if (ic.phase === 'swim_to_raft') {
          const targetX = raft.x - 16;
          const targetY = raft.y + 8;
          const dxR = targetX - pl.x;
          const dyR = targetY - pl.y;
          const distR = Math.hypot(dxR, dyR);
          pl.angle = Math.atan2(dyR, dxR);
          const swimSpd = 88;
          if (distR > 8) {
            pl.vx = (dxR / distR) * swimSpd;
            pl.vy = (dyR / distR) * swimSpd;
            pl.x += pl.vx * dt;
            pl.y += pl.vy * dt;
            pl.gaitPhase += dt * 14;
            introCueRef.current.swimSplashT -= dt;
            if (introCueRef.current.swimSplashT <= 0) {
              introCueRef.current.swimSplashT = 0.28;
              splashesRef.current.push({
                x: pl.x,
                y: pl.y,
                life: 0.45,
                maxLife: 0.45,
                maxRadius: 22,
              });
            }
          }
          camRef.current.x += (pl.x - camRef.current.x) * Math.min(1, dt * 5);
          camRef.current.y += (pl.y - camRef.current.y) * Math.min(1, dt * 5);

          if (distR <= 14 || ic.phaseElapsed >= 4.0) {
            pl.x = targetX;
            pl.y = targetY;
            pl.vx = 0;
            pl.vy = 0;
            pl.swimming = false;
            pl.onRaft = true;
            pl.angle = 0;
            sfx.dash(s.sound);
            splashesRef.current.push({
              x: pl.x,
              y: pl.y,
              life: 0.55,
              maxLife: 0.55,
              maxRadius: 30,
            });
            ic.phase = 'meet_vega';
            ic.phaseElapsed = 0;
            ic.captionTitle = 'Acontecimientos de la Historia · Vice-Capitana Vega';
            ic.captionText =
              '«¡Agarra mi mano, náufrago! El océano ya no pertenece a nadie, pero juntos aún podemos seguir un último rumbo.»';
            setIntroUi({ ...ic });
            if (!introCueRef.current.vegaLine1) {
              introCueRef.current.vegaLine1 = true;
              pushComic(
                'Vice-Cap. Vega',
                '¡Bienvenido a bordo! Soy Vega, vice-capitana. Los piratas y los leviatanes acechan todo el mar.',
                raft.x,
                raft.y - 16,
                '#38bdf8'
              );
            }
          }
        } else if (ic.phase === 'meet_vega') {
          camRef.current.x += (raft.x - camRef.current.x) * Math.min(1, dt * 5);
          camRef.current.y += (raft.y - camRef.current.y) * Math.min(1, dt * 5);

          if (!introCueRef.current.vegaLine1 && ic.phaseElapsed >= 0.2) {
            introCueRef.current.vegaLine1 = true;
            pushComic(
              'Vice-Cap. Vega',
              '¡Bienvenido a bordo! Soy Vega, vice-capitana. Los piratas y los leviatanes acechan todo el mar.',
              raft.x,
              raft.y - 16,
              '#38bdf8'
            );
          }
        }
      } else if (!isGamePausedRef.current) {
        t.world += dt;
        s.elapsedSeconds += dt;
        if (Math.floor(s.elapsedSeconds / 90) + 1 > s.dayCount) {
          s.dayCount = Math.floor(s.elapsedSeconds / 90) + 1;
          s.worldGovDecree = WORLD_GOV_DECREES[s.dayCount % WORLD_GOV_DECREES.length];
          s.marineThreat = Math.max(0, (s.marineThreat || 0) - 2);
          applyDailyStructureIncome(s);
          for (const child of s.family.children) {
            const age = s.dayCount - child.bornDay;
            if (age >= 4) child.stage = 'oficial';
            else if (age >= 2) child.stage = 'grumete';
          }
          publishDailyNewspaper(s.dayCount);
          showToast(`Día ${s.dayCount}: ¡Nueva edición de El Correo del Horizonte!`);
        }
        if (s.elapsedSeconds >= 180 && !t.calmNotified) {
          t.calmNotified = true;
          showToast('¡Fin de Aguas Tranquilas! Cuidado en ☣️ Aguas Peligrosas');
          sfx.warHorn(s.sound);
        }

        if (s.stealthTimer > 0) {
          s.stealthTimer = Math.max(0, s.stealthTimer - dt);
        }
        t.shake = Math.max(0, t.shake - dt * 2.8);

        // Dynamic 6-state Weather Cycle
        t.weather -= dt;
        if (t.weather <= 0) {
          t.weather = 34 + Math.random() * 24;
          const options: WeatherType[] = [
            'despejado',
            'brisa',
            'lluvia',
            'tormenta',
            'niebla',
            'oleaje',
          ];
          const nextW = options[Math.floor(Math.random() * options.length)];
          weatherRef.current = nextW;
          setWeather(nextW);
          showToast(`Clima: ${nextW.toUpperCase()}`);
        }
        if (weatherRef.current === 'tormenta') {
          t.lightningCd -= dt;
          if (t.lightningCd <= 0) {
            t.lightningCd = 5 + Math.random() * 9;
            t.lightning = 0.45;
            sfx.explosion(s.sound);
          }
        }
        t.lightning = Math.max(0, t.lightning - dt * 1.4);

        // Nano-repair Tech Module & Warship Purifier hull repair
        const hullRepairRate =
          (s.craftedTech.includes('tech_nanorep') ? 2.5 : 0) +
          (hasWarshipPassive(s, 'wp_anti_radiacion') ? 1.5 : 0);
        if (hullRepairRate > 0 && s.raft.hp < s.raft.maxHp) {
          s.raft.hp = Math.min(s.raft.maxHp, s.raft.hp + hullRepairRate * dt);
          if (s.raft.hp >= 25 && s.raft.damagedMode) {
            s.raft.damagedMode = false;
            raft.damagedMode = false;
          }
          raft.hp = s.raft.hp;
        }

        // Timers for hangover, EMP jamming, nuclear radiation, and child missions
        if ((s.hangoverTimer || 0) > 0) {
          s.hangoverTimer = Math.max(0, (s.hangoverTimer || 0) - dt);
        }
        if ((s.jammedTimer || 0) > 0) {
          s.jammedTimer = s.shipRadioBuilt ? 0 : Math.max(0, (s.jammedTimer || 0) - dt);
        }
        const nearReactor = s.islandStructures.some(
          (st) => st.kind === 'nuclear_reactor' && Math.hypot(st.x - pl.x, st.y - pl.y) < 250
        );
        const radResist =
          (s.radiationSuitCrafted ? 0.9 : 0) +
          (hasWarshipPassive(s, 'wp_anti_radiacion') ? 0.5 : 0);
        if (nearReactor && radResist < 0.85) {
          s.radiationExposure = Math.min(100, (s.radiationExposure || 0) + dt * 5.2 * (1 - radResist));
        } else if ((s.radiationExposure || 0) > 0) {
          const decay = s.radiationSuitCrafted ? 4.2 : 1.5;
          s.radiationExposure = Math.max(0, (s.radiationExposure || 0) - dt * decay);
        }
        if ((s.radiationExposure || 0) >= 70 && !s.radiationSuitCrafted) {
          s.hp = Math.max(0, s.hp - dt * 1.4);
          if (s.hp <= 0) {
            triggerPlayerDeath('radiation');
          }
        }
        for (const child of s.family.children) {
          if (!child.activeMission) continue;
          child.activeMission.remainingSec -= dt;
          if (child.activeMission.remainingSec <= 0) {
            const mKind = child.activeMission.kind;
            const mTarget = child.activeMission.targetName;
            child.activeMission = null;
            if (mKind === 'explore') {
              s.resources.mad += 4;
              s.resources.cri += 1;
              grantXpAndFame(45, 55);
              showToast(`🧭 ${child.name} regresó de explorar ${mTarget}: +4 Mad · +1 Cristal`);
            } else if (mKind === 'trade') {
              s.resources.oro += 6;
              s.resources.veg += 3;
              s.resources.agu += 3;
              grantXpAndFame(35, 45);
              showToast(`⛵ ${child.name} completó comercio en ${mTarget}: +6 Oro · +3 Veg · +3 Agu`);
            } else {
              s.resources.oro += 6;
              s.resources.hie += 3;
              if (Math.random() < 0.05) s.resources.frag_epico += 1;
              grantXpAndFame(70, 90);
              showToast(`⚔️ ${child.name} volvió del saqueo a ${mTarget}: +6 Oro · +3 Hierro`);
            }
            sfx.pickup(s.sound);
          }
        }

        // Passive Farm Plots Growth & Auto-Harvest (boosted by island Farmers)
        for (const plot of s.farmPlots) {
          if (!plot.crop) continue;
          const cropDef = CROPS_CATALOG.find((c) => c.id === plot.crop);
          if (!cropDef) continue;
          const weatherMult = weatherRef.current === 'lluvia' ? 1.35 : 1;
          const waterMult = plot.watered ? 2.0 : 1;
          const farmerCount =
            plot.location === 'island' && plot.islandId
              ? (s.islandUnits || []).filter(
                  (u) => u.kind === 'farmer' && u.islandId === plot.islandId
                ).length
              : 0;
          const farmerMult = farmerCount > 0 ? 1 + Math.min(1.5, farmerCount * 0.65) : 1;
          plot.growth += (dt * 100 * waterMult * weatherMult * farmerMult) / cropDef.growSeconds;
          if (plot.growth >= 100) {
            plot.growth = 0;
            plot.watered = false;
            s.resources.veg += cropDef.yieldVeg;
            if (cropDef.yieldBonusKey && cropDef.yieldBonusAmount) {
              s.resources[cropDef.yieldBonusKey] += cropDef.yieldBonusAmount;
            }
            const popX = plot.location === 'raft' ? raft.x : plot.x;
            const popY = plot.location === 'raft' ? raft.y - 28 : plot.y - 18;
            pushPop(popX, popY, `+${cropDef.yieldVeg} Veg (${cropDef.name.split(' ')[0]})`, '#4ade80');
          }
        }

        // Passive Captive Animal Production
        for (const cap of s.captiveAnimals) {
          cap.prodTimer += dt;
          if (cap.prodTimer >= cap.prodInterval) {
            cap.prodTimer = 0;
            const info = ANIMAL_RANCH_INFO[cap.kind];
            const amt = info.yieldAmt + (cap.level - 1);
            s.resources[info.yieldKey] += amt;
            if (Math.random() < info.bonusOroChance) {
              s.resources.oro += 1;
            }
            const popX = cap.location === 'raft' ? raft.x : pl.x;
            const popY = cap.location === 'raft' ? raft.y + 24 : pl.y - 24;
            pushPop(popX, popY, `+${amt} ${info.yieldKey.toUpperCase()} (${cap.name.split(' ')[0]})`, '#fde047');
          }
        }

        pl.cd = Math.max(0, pl.cd - dt);
        pl.atkT = Math.max(0, pl.atkT - dt);
        pl.dashT = Math.max(0, pl.dashT - dt);
        pl.invT = Math.max(0, pl.invT - dt);

        ensureChunksAround(pl.x, pl.y);

        const gp = gamepadPollRef.current();
        if (gp.connected) {
          if (gp.pausePressed) setMode((p) => (p === 'PLAYING' ? 'PAUSED' : 'PLAYING'));
          if (gp.drawerPressed) setDrawerOpen((p) => !p);
          if (gp.dashPressed) doDash();
          if (gp.interactPressed) handleInteract();
          if (gp.helmPressed) togglePiloting();
          if (gp.nextSlotPressed || gp.prevSlotPressed) {
            const stepDir = gp.nextSlotPressed ? 1 : -1;
            s.equippedSlot = (s.equippedSlot + stepDir + s.hotbar.length) % s.hotbar.length;
            syncUi();
          }
        }

        let ix = joyInputRef.current.x;
        let iy = joyInputRef.current.y;
        if (Math.hypot(ix, iy) > 0.05) {
          pointerWorldRef.current.active = false;
        }
        if (gp.connected && Math.hypot(gp.moveX, gp.moveY) > 0.1) {
          ix += gp.moveX;
          iy += gp.moveY;
          pointerWorldRef.current.active = false;
        }
        if (keyInputRef.current.left) ix -= 1;
        if (keyInputRef.current.right) ix += 1;
        if (keyInputRef.current.up) iy -= 1;
        if (keyInputRef.current.down) iy += 1;
        const mag = Math.hypot(ix, iy);
        if (mag > 1) {
          ix /= mag;
          iy /= mag;
        }

        const halfRaft = getRaftHalfSize(raft.level);
        const relicStats = getRelicTotals(s);
        const perf = computeVitalPerformanceModifiers(s);
        const wasSwimming = pl.swimming;

        const weatherSpdMult =
          weatherRef.current === 'brisa'
            ? 1.18
            : weatherRef.current === 'oleaje'
              ? 0.85
              : weatherRef.current === 'tormenta'
                ? 0.9
                : 1;

        if (pl.piloting) {
          const raftSpd = computeRaftSpeed(s) * weatherSpdMult * perf.speedMult;
          raft.vx = raft.vx * 0.88 + ix * raftSpd * 0.12;
          raft.vy = raft.vy * 0.88 + iy * raftSpd * 0.12;
          raft.x += raft.vx * dt;
          raft.y += raft.vy * dt;

          const bounded = resolveIslandBoundary(raft.x, raft.y, halfRaft * 0.85, islandsRef.current);
          if (bounded.collided) {
            raft.x = bounded.x;
            raft.y = bounded.y;
            raft.vx *= 0.2;
            raft.vy *= 0.2;
          }

          if (Math.hypot(raft.vx, raft.vy) > 10) {
            raft.angle = Math.atan2(raft.vy, raft.vx);
            pl.angle = raft.angle;
          }
          pl.x = raft.x + Math.cos(raft.angle) * (halfRaft - 20);
          pl.y = raft.y + Math.sin(raft.angle) * (halfRaft - 20);
          pl.vx = raft.vx;
          pl.vy = raft.vy;
          pl.onRaft = true;
          pl.swimming = false;
          pl.onIsland = false;
          pl.inShelter = false;
        } else {
          raft.vx *= 0.92;
          raft.vy *= 0.92;
          raft.x += raft.vx * dt;
          raft.y += raft.vy * dt;
          const boundedRaft = resolveIslandBoundary(
            raft.x,
            raft.y,
            halfRaft * 0.85,
            islandsRef.current
          );
          raft.x = boundedRaft.x;
          raft.y = boundedRaft.y;

          const onRaftNow =
            !(s.raft.damagedMode && s.raft.level < 7) &&
            Math.abs(pl.x - raft.x) <= halfRaft &&
            Math.abs(pl.y - raft.y) <= halfRaft;
          let currentIsland: IslandEntity | null = null;
          for (const isl of islandsRef.current) {
            if (pointInIsland(pl.x, pl.y, isl)) {
              currentIsland = isl;
              break;
            }
          }

          pl.onRaft = onRaftNow;
          pl.onIsland = Boolean(currentIsland && !onRaftNow);
          pl.swimming = !onRaftNow && !pl.onIsland;

          if (!wasSwimming && pl.swimming) {
            splashesRef.current.push({
              x: pl.x,
              y: pl.y,
              life: 0.45,
              maxLife: 0.45,
              maxRadius: 28,
            });
            pushPop(pl.x, pl.y - 18, '🥽 Nadando', '#7dd3fc');
            sfx.dash(s.sound);
          }

          pl.inShelter = s.islandStructures.some(
            (st) =>
              (st.kind === 'shelter' ||
                st.kind === 'hq' ||
                st.kind === 'nuclear_bunker' ||
                (st.kind === 'settlement' && st.level >= 2)) &&
              Math.hypot(st.x - pl.x, st.y - pl.y) <= 85
          );

          if (currentIsland && !currentIsland.discovered) {
            currentIsland.discovered = true;
            if (!s.discoveredIslands.includes(currentIsland.id)) {
              s.discoveredIslands.push(currentIsland.id);
              s.stats.islandsVisited += 1;
              logWorldEvent(
                s,
                'explore',
                `Exploraste ${currentIsland.name}${currentIsland.cultureName ? ` (${currentIsland.cultureName})` : ''}`
              );
              grantXpAndFame(35, 35);
              showToast(
                currentIsland.dangerous
                  ? `¡Isla Peligrosa: ${currentIsland.name}!`
                  : `¡Isla descubierta: ${currentIsland.name}!`
              );
              sfx.chest(s.sound);
              checkTitlesAndAchievements();
            }
          }

          const currentControl = currentIsland ? getIslandFactionControl(currentIsland) : null;
          if (currentIsland && currentControl === 'neutral_safe') {
            if (prevSafeZoneIdRef.current !== currentIsland.id) {
              prevSafeZoneIdRef.current = currentIsland.id;
              pushPop(pl.x, pl.y - 26, '🕊 Zona Segura Neutral', '#34d399');
              showToast(`🕊 ${currentIsland.name} es Zona Segura Neutral: nadie arma problemas aquí`);
            }
          } else {
            prevSafeZoneIdRef.current = null;
          }

          const baseSpd = pl.swimming ? 124 : pl.speed;
          const hangoverMult = (s.hangoverTimer || 0) > 0 ? 0.88 : 1;
          const moveSpd = baseSpd * (1 + relicStats.speedBonus) * perf.speedMult * hangoverMult;
          pl.vx = ix * moveSpd;
          pl.vy = iy * moveSpd;
          pl.x += pl.vx * dt;
          pl.y += pl.vy * dt;

          // Island Access Control: Marina/Gov islands block interior entry & trigger immediate coastal defense if checkpoint is active
          if (currentIsland && currentControl === 'marina_gov') {
            const marinaRel = s.kingdoms.find((k) => k.id === 'marina')?.relation ?? 0;
            const activeCheckpoint = currentIsland.nodes.find(
              (n) => n.kind === 'marine_checkpoint' && !n.depleted
            );
            if (activeCheckpoint && marinaRel < 25) {
              const dxIsl = pl.x - currentIsland.x;
              const dyIsl = pl.y - currentIsland.y;
              const distIsl = Math.hypot(dxIsl, dyIsl) || 1;
              const restrictR = currentIsland.radius * 0.66;
              if (distIsl < restrictR) {
                pl.x = currentIsland.x + (dxIsl / distIsl) * restrictR;
                pl.y = currentIsland.y + (dyIsl / distIsl) * restrictR;
                if (t.islandDefenseCd <= 0) {
                  t.islandDefenseCd = 3.5;
                  pushPop(pl.x, pl.y - 26, '⚓ ¡Acceso Denegado!', '#60a5fa');
                  showToast('⚓ Isla controlada por La Marina: destruye el Puesto de Control costero para entrar');
                }
              }
              if (t.islandDefenseCd <= 0) {
                t.islandDefenseCd = 7.5;
                const nearbyMarina = enemiesRef.current.filter(
                  (en) =>
                    getEnemyFaction(en) === 'marina_gov' &&
                    Math.hypot(en.x - activeCheckpoint.x, en.y - activeCheckpoint.y) < 320
                ).length;
                if (nearbyMarina < 2) {
                  spawnEnemyNear('marine_patrol', activeCheckpoint.x + 26, activeCheckpoint.y + 18, undefined, 1, { noTerritory: true });
                }
                const angShot = Math.atan2(pl.y - activeCheckpoint.y, pl.x - activeCheckpoint.x);
                projectilesRef.current.push({
                  id: eid++,
                  fromPlayer: false,
                  faction: 'marina_gov',
                  kind: 'enemy_shot',
                  x: activeCheckpoint.x,
                  y: activeCheckpoint.y,
                  vx: Math.cos(angShot) * 280,
                  vy: Math.sin(angShot) * 280,
                  dmg: 14,
                  life: 1.4,
                  color: '#60a5fa',
                });
                logWorldEvent(s, 'marina', `Defensas de La Marina repelieron tu intento de entrada en ${currentIsland.name}`);
              }
            }
          }

          // Solid Island Structures (can enter through South doorway; walls block cleanly)
          const stHit = resolveSolidStructureCollision(
            pl.x,
            pl.y,
            13,
            s.islandStructures,
            s.ageTier || 1
          );
          if (stHit.collided) {
            pl.x = stHit.x;
            pl.y = stHit.y;
          }

          // Solid Perimeter Compound Walls & Friendly vs Hostile Gates
          const wallHit = resolveCompoundWallCollision(
            pl.x,
            pl.y,
            13,
            compoundWallsRef.current,
            islandsRef.current,
            s
          );
          if (wallHit.collided) {
            pl.x = wallHit.x;
            pl.y = wallHit.y;
          }

          if (Math.hypot(pl.vx, pl.vy) > 10) {
            pl.gaitPhase += dt * (pl.swimming ? 9 : 13);
          }

          if (aimJoyInputRef.current.active) {
            pl.angle = Math.atan2(aimJoyInputRef.current.y, aimJoyInputRef.current.x);
            if (pl.cd <= 0) doPrimaryAction(pl.angle);
          } else if (gp.aimActive) {
            pl.angle = Math.atan2(gp.aimY, gp.aimX);
          } else if (pointerWorldRef.current.active && Math.hypot(ix, iy) <= 0.08) {
            pl.angle = Math.atan2(pointerWorldRef.current.y - pl.y, pointerWorldRef.current.x - pl.x);
          } else if (Math.hypot(ix, iy) > 0.08) {
            pl.angle = Math.atan2(iy, ix);
          } else if (pointerWorldRef.current.active) {
            pl.angle = Math.atan2(pointerWorldRef.current.y - pl.y, pointerWorldRef.current.x - pl.x);
          }
          if (gp.attackHeld && pl.cd <= 0) {
            doPrimaryAction(pl.angle);
          }
        }

        camRef.current.x += (pl.x - camRef.current.x) * Math.min(1, dt * 8);
        camRef.current.y += (pl.y - camRef.current.y) * Math.min(1, dt * 8);

        const stRegen =
          (pl.onRaft || pl.inShelter ? 24 : 12) *
          (hasDestiny(s, 'alquimia_t2') ? 1.3 : 1) *
          perf.staminaRegenMult;
        if (s.st < s.maxSt) s.st = Math.min(s.maxSt, s.st + stRegen * dt);

        const passiveHpRegen =
          (hasDestiny(s, 'alquimia_master') ? 2.2 : 0) +
          relicStats.hpRegen +
          (pl.inShelter ? 4.5 : 0);
        if (passiveHpRegen > 0 && s.hp < s.maxHp) {
          s.hp = Math.min(s.maxHp, s.hp + passiveHpRegen * dt);
        }

        // Tick Player Vital Needs, Situational Combat States & Psychological State
        let nearLeviathan = false;
        let nearBoss = false;
        let nearbyEnemiesCount = 0;
        for (const e of enemiesRef.current) {
          const distPl = Math.hypot(e.x - pl.x, e.y - pl.y);
          if (e.isLeviathan && distPl < 880) nearLeviathan = true;
          if ((e.isBoss || e.isSemiBoss || e.kind.startsWith('abysmal_')) && distPl < 560) nearBoss = true;
          if (distPl < 420) nearbyEnemiesCount += 1;
        }
        const needsOutcome = tickPlayerNeeds(s, dt, {
          pl,
          weather: weatherRef.current,
          dangerousWater: inDangerousWater,
          nearLeviathan,
          isMoving: Math.hypot(ix, iy) > 0.1,
          nearbyEnemiesCount,
          nearBoss,
          warActive: warRef.current.active,
        });
        for (const alert of needsOutcome.alerts) {
          showToast(alert.message);
          pushPop(pl.x, pl.y - 26, alert.message.split(':')[0], alert.color);
          if (alert.isCritical) sfx.hurt(s.sound);
        }
        if (needsOutcome.triggeredHallucination) {
          pushComic(
            s.playerProfile.name,
            needsOutcome.triggeredHallucination,
            pl.x,
            pl.y - 14,
            '#e879f9'
          );
        }
        if (needsOutcome.hpDrain > 0) {
          s.hp = Math.max(0, s.hp - needsOutcome.hpDrain);
          if (s.hp <= 0) {
            triggerPlayerDeath('needs');
          }
        }

        const autoConsumeEvents = tryAutoConsumeVitals(s);
        for (const ev of autoConsumeEvents) {
          sfx.eat(s.sound);
          showToast(ev.message);
          pushPop(
            pl.x,
            pl.y - 24,
            ev.kind === 'thirst' ? '💧 Auto-Agua' : '🍲 Auto-Comida',
            ev.kind === 'thirst' ? '#38bdf8' : '#4ade80'
          );
        }

        // Vega Secret Spouse 10-Second Exact Map-Wide Protection Strike
        if (s.vegaMarried) {
          t.vegaProtectCd -= dt;
          if (t.vegaProtectCd <= 0) {
            t.vegaProtectCd = 10.0;
            const vegaDmg = 180 + s.level * 26;
            const vegaRange = 1150;
            let hitByVega = 0;
            for (let ei = enemiesRef.current.length - 1; ei >= 0; ei--) {
              const en = enemiesRef.current[ei];
              if (Math.hypot(en.x - pl.x, en.y - pl.y) > vegaRange) continue;
              const dmgDealt = en.isLeviathan ? Math.round(vegaDmg * 0.35) : vegaDmg;
              en.hp -= dmgDealt;
              en.hitT = 0.28;
              en.provoked = true;
              hitByVega += 1;
              pushPop(en.x, en.y - 22, `💖 -${dmgDealt}`, '#f472b6');
              if (en.hp <= 0) handleEnemyDefeated(ei);
            }
            explosionsRef.current.push({
              x: pl.x,
              y: pl.y,
              radius: 520,
              life: 0.55,
              maxLife: 0.55,
              color: 'rgba(244, 114, 182, 0.42)',
            });
            explosionsRef.current.push({
              x: pl.x,
              y: pl.y,
              radius: 260,
              life: 0.4,
              maxLife: 0.4,
              color: 'rgba(56, 189, 248, 0.55)',
            });
            sfx.explosion(s.sound);
            if (hitByVega > 0) {
              timersRef.current.shake = 0.65;
              pushComic(
                'Vice-Cap. Vega',
                `¡Nadie toca a mi Amorcito Hermoso! (${hitByVega} enemigos barridos)`,
                pl.x,
                pl.y - 28,
                '#f472b6'
              );
              showToast(`💖 Vega protegió a su Amorcito Hermoso (${hitByVega} objetivos dañados)`);
            } else {
              pushPop(pl.x, pl.y - 28, '💖 Aura de Vega activa', '#f472b6');
            }
          }
        }

        // Island Structures (Extractors, AoE Mills, Markets, Watchtowers, Turrets)
        const harvestBonusMult = s.aoeUpgrades?.includes('cosecha_imperial') ? 1.5 : 1;
        for (const st of s.islandStructures) {
          if (st.hp !== undefined && st.hp <= 0) continue;
          st.timer += dt;
          if (st.kind === 'extractor' && st.timer >= 14) {
            st.timer = 0;
            const isl = islandsRef.current.find((x) => x.id === st.islandId);
            const resKey: ResourceKey =
              isl?.biome === 'volcanica' || isl?.biome === 'minera'
                ? Math.random() < 0.45
                  ? 'hie'
                  : 'car'
                : isl?.biome === 'chatarra' || isl?.biome === 'abisal'
                  ? Math.random() < 0.35
                    ? 'tec'
                    : 'cht'
                  : Math.random() < 0.5
                    ? 'mad'
                    : 'cht';
            s.resources[resKey] += 1;
            pushPop(st.x, st.y - 18, `+1 ${resKey.toUpperCase()}`, '#38bdf8');
          } else if (st.kind === 'mill' && st.timer >= 16) {
            st.timer = 0;
            const vegAmt = Math.round(2 * harvestBonusMult);
            s.resources.veg += vegAmt;
            s.resources.agu += 1;
            pushPop(st.x, st.y - 18, `+${vegAmt} Veg · +1 Agu`, '#4ade80');
          } else if (st.kind === 'market' && st.timer >= 20) {
            st.timer = 0;
            s.resources.oro += 1;
            pushPop(st.x, st.y - 18, '+1 Oro (Mercado)', '#fbbf24');
          } else if (st.kind === 'distillery' && st.timer >= 26) {
            st.timer = 0;
            s.resources.alc = (s.resources.alc || 0) + 1;
            pushPop(st.x, st.y - 18, '+1 Ron', '#f59e0b');
          } else if (
            (st.kind === 'turret' ||
              st.kind === 'watchtower' ||
              (st.kind === 'settlement' && st.level >= 2)) &&
            st.timer >= (st.kind === 'watchtower' ? 0.92 : st.kind === 'settlement' && st.level >= 3 ? 0.9 : 1.15) &&
            enemiesRef.current.length > 0
          ) {
            const towerRange = st.kind === 'watchtower' ? 450 : 390;
            const target = enemiesRef.current.find(
              (e) => !e.isLeviathan && Math.hypot(e.x - st.x, e.y - st.y) < towerRange
            );
            if (target) {
              st.timer = 0;
              const ang = Math.atan2(target.y - st.y, target.x - st.x);
              projectilesRef.current.push({
                id: eid++,
                fromPlayer: true,
                kind: 'bullet',
                x: st.x,
                y: st.y,
                vx: Math.cos(ang) * 510,
                vy: Math.sin(ang) * 510,
                dmg: st.kind === 'watchtower' ? 23 : st.kind === 'settlement' ? (st.level >= 3 ? 26 : 18) : 16,
                life: 0.95,
                color: st.kind === 'watchtower' ? '#38bdf8' : st.kind === 'settlement' && st.level >= 3 ? '#fde047' : '#fbbf24',
              });
            }
          }
        }

        // Balanced Island Renewal: each island periodically regrows at most 1 depleted wood/iron/coal node
        for (const isl of islandsRef.current) {
          isl.regenTimer = (isl.regenTimer || 0) + dt;
          if (isl.regenTimer >= 45) {
            isl.regenTimer = 0;
            const renewable = isl.nodes.filter(
              (n) =>
                n.depleted &&
                (n.kind === 'tree' || n.kind === 'iron' || n.kind === 'coal')
            );
            if (renewable.length > 0) {
              const pickNode = renewable[Math.floor(Math.random() * renewable.length)];
              pickNode.depleted = false;
              pickNode.hp = pickNode.maxHp;
              if (Math.hypot(pickNode.x - pl.x, pickNode.y - pl.y) < 900) {
                const label =
                  pickNode.kind === 'tree'
                    ? '🌱 +1 Árbol renovado'
                    : pickNode.kind === 'iron'
                      ? '⛏️ +1 Hierro renovado'
                      : '🪨 +1 Carbón renovado';
                pushPop(pickNode.x, pickNode.y - 18, label, '#34d399');
              }
            }
          }
        }

        // AoE Island Units AI (Villagers gather resources, Guards defend island, Patrol Ships guard coast)
        const guardDmgBoost =
          (s.aoeUpgrades?.includes('forja_hierro') ? 1.3 : 1) *
          ((s.ageTier || 1) >= 3 ? 1.3 : 1);
        const patrolBoost = s.aoeUpgrades?.includes('tactica_patrulla') ? 1.35 : 1;
        for (let ui = s.islandUnits.length - 1; ui >= 0; ui--) {
          const u = s.islandUnits[ui];
          const isl = islandsRef.current.find((x) => x.id === u.islandId);
          if (!isl) continue;
          u.cd = Math.max(0, u.cd - dt);

          if (u.kind === 'patrol_ship') {
            // Detect approaching pirates/raiders within 580px of protected island or 520px of patrol boat
            const threats = enemiesRef.current
              .filter(
                (en) =>
                  !en.isLeviathan &&
                  (Math.hypot(en.x - isl.x, en.y - isl.y) <= 580 ||
                    Math.hypot(en.x - u.x, en.y - u.y) <= 520)
              )
              .sort((a, b) => {
                const pa = a.isBandit || a.isThief || a.isHacker ? 0 : 1;
                const pb = b.isBandit || b.isThief || b.isHacker ? 0 : 1;
                if (pa !== pb) return pa - pb;
                return Math.hypot(a.x - isl.x, a.y - isl.y) - Math.hypot(b.x - isl.x, b.y - isl.y);
              });
            const interceptTarget = threats[0];

            if (interceptTarget) {
              // Steer actively to intercept raider outside the island shoreline, holding optimal broadside range (185-250px)
              const dxT = interceptTarget.x - u.x;
              const dyT = interceptTarget.y - u.y;
              const distT = Math.hypot(dxT, dyT) || 1;
              let desiredX = interceptTarget.x;
              let desiredY = interceptTarget.y;
              if (distT < 175) {
                const strafeAng = Math.atan2(dyT, dxT) + Math.PI * 0.65;
                desiredX = u.x + Math.cos(strafeAng) * 90;
                desiredY = u.y + Math.sin(strafeAng) * 90;
              }
              const toIslX = desiredX - isl.x;
              const toIslY = desiredY - isl.y;
              const dIsl = Math.hypot(toIslX, toIslY) || 1;
              if (dIsl < isl.radius + 20) {
                desiredX = isl.x + (toIslX / dIsl) * (isl.radius + 24);
                desiredY = isl.y + (toIslY / dIsl) * (isl.radius + 24);
              }
              const mx = desiredX - u.x;
              const my = desiredY - u.y;
              const md = Math.hypot(mx, my) || 1;
              const spd = 138 * patrolBoost;
              u.vx = (mx / md) * spd;
              u.vy = (my / md) * spd;
              u.x += u.vx * dt;
              u.y += u.vy * dt;
              u.gaitPhase += dt * 9;

              if (u.cd <= 0 && distT <= 385) {
                u.cd = Math.max(0.5, 1.15 / patrolBoost);
                const ang = Math.atan2(interceptTarget.y - u.y, interceptTarget.x - u.x);
                projectilesRef.current.push({
                  id: eid++,
                  fromPlayer: true,
                  kind: 'bullet',
                  x: u.x,
                  y: u.y,
                  vx: Math.cos(ang) * 485,
                  vy: Math.sin(ang) * 485,
                  dmg: Math.round(20 * patrolBoost),
                  life: 0.95,
                  color: '#38bdf8',
                });
              }
            } else {
              // Calm coastal patrol orbit
              const orbitAng = t.world * 0.42 * patrolBoost + ui * 1.7;
              const targetOrbitX = isl.x + Math.cos(orbitAng) * (isl.radius + 54);
              const targetOrbitY = isl.y + Math.sin(orbitAng) * (isl.radius + 54);
              u.vx = (targetOrbitX - u.x) * 2.2;
              u.vy = (targetOrbitY - u.y) * 2.2;
              u.x += u.vx * dt;
              u.y += u.vy * dt;
              u.gaitPhase += dt * 7;
            }
          } else if (u.kind === 'guard') {
            const nearEnemy = enemiesRef.current.find(
              (en) => !en.isLeviathan && Math.hypot(en.x - u.x, en.y - u.y) <= 300
            );
            if (nearEnemy) {
              const dxU = nearEnemy.x - u.x;
              const dyU = nearEnemy.y - u.y;
              const dU = Math.hypot(dxU, dyU) || 1;
              if (dU > 38) {
                u.vx = (dxU / dU) * 98;
                u.vy = (dyU / dU) * 98;
                u.x += u.vx * dt;
                u.y += u.vy * dt;
                u.gaitPhase += dt * 10;
              } else if (u.cd <= 0) {
                u.cd = 1.0;
                const eIdx = enemiesRef.current.indexOf(nearEnemy);
                const dmg = Math.round(16 * guardDmgBoost);
                nearEnemy.hp -= dmg;
                nearEnemy.hitT = 0.12;
                pushPop(nearEnemy.x, nearEnemy.y - 16, `-${dmg} Guardia`, '#60a5fa');
                if (nearEnemy.hp <= 0 && eIdx >= 0) handleEnemyDefeated(eIdx);
              }
            } else {
              const patAng = t.world * 0.5 + ui * 2.1;
              const px = isl.x + Math.cos(patAng) * isl.radius * 0.48;
              const py = isl.y + Math.sin(patAng) * isl.radius * 0.48;
              const dxP = px - u.x;
              const dyP = py - u.y;
              const dP = Math.hypot(dxP, dyP) || 1;
              if (dP > 12) {
                u.x += (dxP / dP) * 60 * dt;
                u.y += (dyP / dP) * 60 * dt;
                u.gaitPhase += dt * 7;
              }
            }
          } else if (u.kind === 'farmer') {
            // Farmer unit tends island farmPlots: auto-waters, auto-plants, and yields fresh crops
            const islPlots = s.farmPlots.filter((p) => p.location === 'island' && p.islandId === u.islandId);
            const targetPlot =
              islPlots.find((p) => p.crop && !p.watered) ||
              islPlots.find((p) => !p.crop) ||
              islPlots[ui % Math.max(1, islPlots.length)];
            const destX = targetPlot ? targetPlot.x : isl.x + Math.cos(t.world * 0.3 + ui * 1.6) * isl.radius * 0.38;
            const destY = targetPlot ? targetPlot.y : isl.y + Math.sin(t.world * 0.3 + ui * 1.6) * isl.radius * 0.38;
            const dxF = destX - u.x;
            const dyF = destY - u.y;
            const dF = Math.hypot(dxF, dyF) || 1;
            if (dF > 18) {
              u.vx = (dxF / dF) * 62;
              u.vy = (dyF / dF) * 62;
              u.x += u.vx * dt;
              u.y += u.vy * dt;
              u.gaitPhase += dt * 8;
            } else {
              u.vx = 0;
              u.vy = 0;
              if (targetPlot) {
                if (targetPlot.crop && !targetPlot.watered) {
                  targetPlot.watered = true;
                  pushPop(targetPlot.x, targetPlot.y - 16, '💧 Regado', '#38bdf8');
                } else if (!targetPlot.crop && s.resources.mad >= 1) {
                  s.resources.mad -= 1;
                  targetPlot.crop = 'algas';
                  targetPlot.growth = 5;
                  targetPlot.watered = true;
                  pushPop(targetPlot.x, targetPlot.y - 16, '🌱 Sembrado', '#4ade80');
                }
              }
            }
            if (u.cd <= 0) {
              u.cd = Math.max(6.5, 11.5 / harvestBonusMult);
              s.resources.veg += 1;
              if (Math.random() < 0.28) s.resources.agu += 1;
              pushPop(u.x, u.y - 14, '+1 VEG', '#10b981');
            }
          } else {
            // Villager gathers wood/stone/gold from island nodes periodically
            const gAng = t.world * 0.35 + ui * 1.4;
            const gx = isl.x + Math.cos(gAng) * isl.radius * 0.42;
            const gy = isl.y + Math.sin(gAng) * isl.radius * 0.42;
            const dxG = gx - u.x;
            const dyG = gy - u.y;
            const dG = Math.hypot(dxG, dyG) || 1;
            if (dG > 14) {
              u.x += (dxG / dG) * 52 * dt;
              u.y += (dyG / dG) * 52 * dt;
              u.gaitPhase += dt * 7;
            }
            if (u.cd <= 0) {
              u.cd = Math.max(5.5, 10 / harvestBonusMult);
              const pool: ResourceKey[] =
                isl.biome === 'minera' || isl.biome === 'volcanica'
                  ? ['hie', 'car', 'cht']
                  : ['mad', 'cht', 'veg'];
              const rk = pool[ui % pool.length];
              s.resources[rk] += 1;
              pushPop(u.x, u.y - 14, `+1 ${rk.toUpperCase()}`, '#34d399');
            }
          }
        }

        // Distiller passive water
        t.distiller += dt;
        if (t.distiller >= Math.max(7, 16 - s.raft.distillerLevel * 1.6)) {
          t.distiller = 0;
          s.resources.agu += 1;
          pushPop(raft.x, raft.y - 26, '+1 Agua', '#38bdf8');
        }

        // Beto passive stew
        const betoLv = getSurvivorLevel(s, 'beto');
        if (betoLv > 0) {
          t.beto += dt;
          if (t.beto >= Math.max(14, 28 - betoLv * 2)) {
            t.beto = 0;
            s.resources.gui += 1;
            if (s.hp < s.maxHp) s.hp = Math.min(s.maxHp, s.hp + 8 + betoLv * 3);
            pushComic('Beto', '¡Salió guiso fresco de la olla!', raft.x, raft.y, '#34d399');
          }
        }

        // Island Wildlife & Monster AI (pack wolves, charging boars, skittish farm fauna)
        for (const a of animalsRef.current) {
          a.hitT = Math.max(0, a.hitT - dt);
          a.cd = Math.max(0, a.cd - dt);
          const isl = islandsRef.current.find((x) => x.id === a.islandId);
          if (!isl || Math.abs(a.x - pl.x) > 1200 || Math.abs(a.y - pl.y) > 1200) continue;

          const steer = computeWildlifeMonsterAi(a, isl, dt, {
            pl,
            allAnimals: animalsRef.current,
            stealthActive: s.stealthTimer > 0,
          });
          a.vx = steer.vx;
          a.vy = steer.vy;

          const distPl = Math.hypot(pl.x - a.x, pl.y - a.y);
          if (
            a.isWild &&
            distPl <= a.radius + 14 &&
            !pl.inShelter &&
            s.stealthTimer <= 0 &&
            a.cd <= 0 &&
            pl.invT <= 0 &&
            !isPointInSafeZoneIsland(pl.x, pl.y, islandsRef.current)
          ) {
            a.cd = 1.25;
            pl.invT = 0.45;
            const wildDmg = Math.max(1, Math.round(a.dmg * perf.defenseMult));
            s.hp = Math.max(0, s.hp - wildDmg);
            const wildRatio = wildDmg / Math.max(1, s.maxHp);
            const dmgMood = registerPlayerDamageMood(s, wildRatio);
            if (dmgMood.newMoodAlert) showToast(dmgMood.newMoodAlert);
            const sitDmgWild = registerCombatActionIntensity(s, { tookDamageRatio: wildRatio });
            if (sitDmgWild.alert) showToast(sitDmgWild.alert);
            sfx.hurt(s.sound);
            pushPop(pl.x, pl.y - 18, `-${wildDmg} (${a.name.split(' ')[0]})`, '#fb7185');
            if (s.hp <= 0) {
              triggerPlayerDeath('animal', a.name);
              break;
            }
          }

          a.x += a.vx * dt;
          a.y += a.vy * dt;
          if (Math.hypot(a.vx, a.vy) > 5) a.gaitPhase += dt * 8 * steer.gaitMult;
          const dxI = a.x - isl.x;
          const dyI = a.y - isl.y;
          const dI = Math.hypot(dxI, dyI);
          const maxR = isl.radius * 0.8;
          if (dI > maxR) {
            a.x = isl.x + (dxI / dI) * maxR;
            a.y = isl.y + (dyI / dI) * maxR;
            a.vx *= -1;
            a.vy *= -1;
          }
        }

        // Human Crew AI (mood-driven fire cadence, smart threat priority, tactical callouts)
        const crewPassiveMult = hasWarshipPassive(s, 'wp_cubierta_tripulacion') ? 1.22 : 1;
        for (const sv of s.survivors) {
          if (!sv.unlocked) continue;
          const def = SURVIVORS_CATALOG.find((c) => c.id === sv.id);
          if (!def) continue;

          crewCooldownsRef.current[sv.id] = Math.max(0, (crewCooldownsRef.current[sv.id] || 0) - dt);
          if (crewCooldownsRef.current[sv.id] <= 0 && enemiesRef.current.length > 0) {
            const npcMood = getNpcMoodState(s, sv.id);
            const aiDecision = evaluateCrewHumanAi(
              sv,
              def,
              npcMood,
              enemiesRef.current,
              raft,
              halfRaft
            );
            if (aiDecision.targetIndex >= 0) {
              const target = enemiesRef.current[aiDecision.targetIndex];
              crewCooldownsRef.current[sv.id] = Math.max(
                0.35,
                ((def.attackCd - sv.level * 0.06) * aiDecision.cdMult) / crewPassiveMult
              );
              const dmg = Math.round(
                def.attackDmg * (1 + (sv.level - 1) * 0.25) * aiDecision.dmgMult * crewPassiveMult
              );
              const ang = Math.atan2(target.y - raft.y, target.x - raft.x);

              if (aiDecision.tacticalCallout) {
                pushComic(def.name, aiDecision.tacticalCallout, raft.x, raft.y - 12, def.color);
              }

              if (def.isRanged) {
                projectilesRef.current.push({
                  id: eid++,
                  fromPlayer: true,
                  kind: sv.id === 'nerea' ? 'harpoon' : 'bullet',
                  x: raft.x + Math.cos(ang) * 16,
                  y: raft.y + Math.sin(ang) * 16,
                  vx: Math.cos(ang) * 500,
                  vy: Math.sin(ang) * 500,
                  dmg,
                  life: 0.95,
                  color: def.color,
                });
              } else {
                slashesRef.current.push({
                  x: raft.x + Math.cos(ang) * (halfRaft * 0.6),
                  y: raft.y + Math.sin(ang) * (halfRaft * 0.6),
                  angle: ang,
                  reach: 45,
                  life: 0.16,
                  maxLife: 0.16,
                  color: def.color,
                });
                target.hp -= dmg;
                target.hitT = 0.12;
                target.provoked = true;
                target.stealProgress = Math.max(0, target.stealProgress - 1.5);
                target.x += Math.cos(ang) * 26;
                target.y += Math.sin(ang) * 26;
                sfx.hit(s.sound);
                pushPop(target.x, target.y - 16, `-${dmg} (${def.name.split(' ')[0]})`, def.color);
                if (target.hp <= 0) handleEnemyDefeated(aiDecision.targetIndex);
              }
            }
          }
        }

        // Raft Auto-Turrets (up to 8 railgun/cannon turrets)
        const solarBoost = 1 + (s.raft.solarLevel - 1) * 0.14;
        const warshipTurretMult = hasWarshipPassive(s, 'wp_torretas_dobles') ? 1.3 : 1;
        const navalBoost = ((hasDestiny(s, 'naval_t4') ? 1.35 : 1) + relicStats.turretBonus) * warshipTurretMult;
        const kikoLv = getSurvivorLevel(s, 'kiko');

        if (s.raft.turretLevel > 0 && enemiesRef.current.length > 0) {
          t.turret += dt;
          const cd = Math.max(0.24, 1.35 / (solarBoost * navalBoost));
          if (t.turret >= cd) {
            t.turret = 0;
            const inRange = enemiesRef.current
              .filter((e) => !e.isLeviathan && Math.hypot(e.x - raft.x, e.y - raft.y) <= 500)
              .sort((a, b) => Math.hypot(a.x - raft.x, a.y - raft.y) - Math.hypot(b.x - raft.x, b.y - raft.y));
            const turCap = Math.min(8, s.raft.turretLevel);
            const shotsCount = inRange.length > 0 ? Math.min(turCap, Math.max(inRange.length, Math.ceil(turCap / 2))) : 0;
            for (let k = 0; k < shotsCount; k++) {
              const target = inRange[k % inRange.length];
              const ang = Math.atan2(target.y - raft.y, target.x - raft.x) + (k >= inRange.length ? (Math.random() - 0.5) * 0.08 : 0);
              projectilesRef.current.push({
                id: eid++,
                fromPlayer: true,
                kind: 'bullet',
                x: raft.x,
                y: raft.y,
                vx: Math.cos(ang) * 540,
                vy: Math.sin(ang) * 540,
                dmg: Math.round((13 + s.raft.turretLevel * 4) * (1 + kikoLv * 0.12) * warshipTurretMult),
                life: 1.0,
                color: s.raft.level >= 7 ? '#38bdf8' : '#fde047',
              });
            }
            if (shotsCount > 0) sfx.turret(s.sound);
          }
        }

        // VLS Naval Missile Salvos
        const missileLv = s.raft.missileLevel || 0;
        if (missileLv > 0 && enemiesRef.current.length > 0) {
          t.missileCd -= dt;
          if (t.missileCd <= 0) {
            t.missileCd = Math.max(2.0, (5.0 - missileLv * 0.65) / solarBoost);
            const targets = enemiesRef.current
              .filter((e) => !e.isLeviathan && Math.hypot(e.x - raft.x, e.y - raft.y) <= 580)
              .sort((a, b) => Math.hypot(a.x - raft.x, a.y - raft.y) - Math.hypot(b.x - raft.x, b.y - raft.y));
            if (targets.length > 0) {
              const salvoCount = Math.min(missileLv, 4);
              for (let m = 0; m < salvoCount; m++) {
                const target = targets[m % targets.length];
                const ang = Math.atan2(target.y - raft.y, target.x - raft.x) + (m - (salvoCount - 1) / 2) * 0.08;
                projectilesRef.current.push({
                  id: eid++,
                  fromPlayer: true,
                  kind: 'missile',
                  x: raft.x + Math.cos(raft.angle) * (halfRaft * 0.45),
                  y: raft.y + Math.sin(raft.angle) * (halfRaft * 0.45),
                  vx: Math.cos(ang) * 410,
                  vy: Math.sin(ang) * 410,
                  dmg: Math.round((32 + missileLv * 14) * (1 + kikoLv * 0.12)),
                  aoeRadius: 68 + missileLv * 12,
                  life: 1.5,
                  color: '#fb923c',
                });
              }
              sfx.gun(s.sound);
            }
          }
        }

        // Orbiting Defense Drones Laser Pulses
        const droneLv = s.raft.droneLevel || 0;
        if (droneLv > 0 && enemiesRef.current.length > 0) {
          t.droneCd -= dt;
          if (t.droneCd <= 0) {
            t.droneCd = Math.max(0.45, (1.35 - droneLv * 0.24) / solarBoost);
            const nearDrones = enemiesRef.current
              .filter((e) => !e.isLeviathan && Math.hypot(e.x - raft.x, e.y - raft.y) <= 440)
              .sort((a, b) => Math.hypot(a.x - raft.x, a.y - raft.y) - Math.hypot(b.x - raft.x, b.y - raft.y));
            if (nearDrones.length > 0) {
              for (let d = 0; d < Math.min(3, droneLv); d++) {
                const target = nearDrones[d % nearDrones.length];
                const da = t.world * 2.1 + (d * Math.PI * 2) / droneLv;
                const orbitR = halfRaft + (s.raft.level >= 7 ? 48 : 30);
                const dx = raft.x + Math.cos(da) * orbitR;
                const dy = raft.y + Math.sin(da) * orbitR;
                const ang = Math.atan2(target.y - dy, target.x - dx);
                projectilesRef.current.push({
                  id: eid++,
                  fromPlayer: true,
                  kind: 'plasma',
                  x: dx,
                  y: dy,
                  vx: Math.cos(ang) * 560,
                  vy: Math.sin(ang) * 560,
                  dmg: Math.round(14 + droneLv * 5),
                  life: 0.85,
                  color: '#22d3ee',
                });
              }
            }
          }
        }

        // Deflector Shield Passive Slow Hull Regeneration
        const shieldLv = s.raft.shieldLevel || 0;
        if (shieldLv > 0 && !s.raft.damagedMode && s.raft.hp < s.raft.maxHp) {
          s.raft.hp = Math.min(s.raft.maxHp, s.raft.hp + (1.2 + shieldLv * 0.9) * dt);
          raft.hp = s.raft.hp;
        }

        // Living NPC Dialogues, AI Ambient Banter & Old World Facts
        t.comic -= dt;
        if (t.comic <= 0) {
          t.comic = 9 + Math.random() * 6;
          const aiLine = aiBanterQueueRef.current.shift();
          if (aiLine) {
            const matched = SURVIVORS_CATALOG.find(
              (c) => c.name.toLowerCase().includes(aiLine.speaker.toLowerCase()) ||
                aiLine.speaker.toLowerCase().includes(c.id)
            );
            pushComic(aiLine.speaker, aiLine.text, raft.x, raft.y, matched?.color || '#38bdf8');
          } else if (s.family.children.length > 0 && Math.random() < 0.2) {
            const c = s.family.children[Math.floor(Math.random() * s.family.children.length)];
            const q = CHILD_QUOTES[Math.floor(Math.random() * CHILD_QUOTES.length)];
            pushComic(c.name, q, raft.x, raft.y, '#f472b6');
          } else {
            const unlockedCrew = s.survivors.filter((sv) => sv.unlocked);
            const pickCrew = unlockedCrew[Math.floor(Math.random() * unlockedCrew.length)];
            const crewDef = SURVIVORS_CATALOG.find((c) => c.id === pickCrew?.id);
            if (Math.random() < 0.28) {
              const fact = OLD_WORLD_FACTS[Math.floor(Math.random() * OLD_WORLD_FACTS.length)];
              pushComic(crewDef?.name || 'Tripulación', fact, raft.x, raft.y, crewDef?.color || '#fbbf24');
            } else if (crewDef) {
              const npcMood = getNpcMoodState(s, crewDef.id);
              const worldCtx: WorldDialogueContext = {
                dayCount: s.dayCount,
                weather: weatherRef.current,
                dangerousWater: inDangerousWater,
                nearLeviathan,
                islandsVisited: s.stats.islandsVisited,
              };
              const line = getRichNpcAmbientDialogue(crewDef.id, npcMood.mood, s, worldCtx);
              pushComic(crewDef.name, line, raft.x, raft.y, crewDef.color);
            } else {
              const line = COMIC_EVENT_LINES[Math.floor(Math.random() * COMIC_EVENT_LINES.length)];
              pushComic('Tripulación', line, raft.x, raft.y, '#38bdf8');
            }
          }
        }

        // Player Character Situational Comments, Dreams, Fears & Joys
        t.playerThought -= dt;
        if (t.playerThought <= 0) {
          t.playerThought = 13 + Math.random() * 7;
          const nearLeviathan = enemiesRef.current.some(
            (e) => e.isLeviathan && Math.hypot(e.x - pl.x, e.y - pl.y) < 900
          );
          const standingIsland = islandsRef.current.find((x) => pointInIsland(pl.x, pl.y, x));
          const thought = getPlayerSituationalThought({
            state: s,
            pl,
            weather: weatherRef.current,
            dangerousWater: inDangerousWater,
            nearLeviathan,
            pirateIslandRank: standingIsland?.pirateRank,
          });
          pushComic(s.playerProfile.name, thought.text, pl.x, pl.y - 12, thought.color);
        }

        // Onboarding Tutorial Step Auto-Progression
        if (!s.tutorialDismissed && s.tutorialStep < 3) {
          const m1 = s.storyMissions.find((m) => m.id === 'boya_nombres');
          if (s.tutorialStep === 0 && (pl.piloting || Math.hypot(pl.x, pl.y) > 130)) {
            s.tutorialStep = 1;
          } else if (
            s.tutorialStep === 1 &&
            m1 &&
            (m1.status === 'decision_pending' || m1.status === 'completed')
          ) {
            s.tutorialStep = 2;
          } else if (
            s.tutorialStep === 2 &&
            s.stats.islandsVisited >= 1 &&
            (s.islandStructures.length >= 1 || s.elapsedSeconds > 180)
          ) {
            s.tutorialStep = 3;
          }
        }

        // Random Events Manager
        if (randomEventRef.current.active) {
          randomEventRef.current.timer -= dt;
          if (randomEventRef.current.kind === 'fish_frenzy') {
            t.fishBurst -= dt;
            if (t.fishBurst <= 0) {
              t.fishBurst = 1.9;
              const ang = Math.random() * Math.PI * 2;
              const dist = 70 + Math.random() * 130;
              const fx = pl.x + Math.cos(ang) * dist;
              const fy = pl.y + Math.sin(ang) * dist;
              spawnFloatingDrop(fx, fy, 'pez', 1);
              splashesRef.current.push({
                x: fx,
                y: fy,
                life: 0.5,
                maxLife: 0.5,
                maxRadius: 24,
              });
            }
          } else if (randomEventRef.current.kind === 'salvage_surge') {
            t.fishBurst -= dt;
            if (t.fishBurst <= 0) {
              t.fishBurst = 2.8;
              const ang = Math.random() * Math.PI * 2;
              const dist = 90 + Math.random() * 160;
              const pool: ResourceKey[] = ['mad', 'cht', 'hie', 'tec'];
              spawnFloatingDrop(
                pl.x + Math.cos(ang) * dist,
                pl.y + Math.sin(ang) * dist,
                pool[Math.floor(Math.random() * pool.length)],
                1
              );
            }
          }
          if (randomEventRef.current.timer <= 0) {
            randomEventRef.current.active = false;
            showToast('El evento del horizonte ha concluido');
          }
        } else {
          t.randomEventCd -= dt;
          if (t.randomEventCd <= 0) {
            t.randomEventCd = 38 + Math.random() * 18;
            triggerRandomEvent();
          }
        }

        // Scarce ambient ocean drops
        t.drop += dt;
        if (t.drop >= 8.5 && dropsRef.current.length < 8) {
          t.drop = 0;
          const ang = Math.random() * Math.PI * 2;
          const dist = 170 + Math.random() * 220;
          const pool: ResourceKey[] = ['mad', 'cht', 'agu', 'pez', 'veg'];
          spawnFloatingDrop(
            pl.x + Math.cos(ang) * dist,
            pl.y + Math.sin(ang) * dist,
            pool[Math.floor(Math.random() * pool.length)],
            1
          );
        }

        // Collect drops (with magnetic attraction for Devil Fruit fragments + auto-blast wave clear)
        for (let i = dropsRef.current.length - 1; i >= 0; i--) {
          const d = dropsRef.current[i];
          if (d.kind === 'devil_fruit') {
            const dxP = pl.x - d.x;
            const dyP = pl.y - d.y;
            const distP = Math.hypot(dxP, dyP);
            if (distP > 8 && distP < 145) {
              d.x += (dxP / distP) * 235 * dt;
              d.y += (dyP / distP) * 235 * dt;
            }
          }
          d.x += d.vx * dt;
          d.y += d.vy * dt;
          d.vx *= 0.96;
          d.vy *= 0.96;
          if (Math.hypot(d.x - pl.x, d.y - pl.y) < 34) {
            if (d.kind === 'devil_fruit') {
              const dfKind = d.devilFruitKind || 'onda';
              const dfRadius = dfKind === 'gravedad' ? 355 : 330;
              // Minimal direct damage: Devil Fruits are tactical mass Crowd-Control (CC) tools!
              const dfDmg =
                dfKind === 'gravedad'
                  ? 16 + Math.floor(s.level * 1.4)
                  : dfKind === 'onda'
                    ? 14 + Math.floor(s.level * 1.2)
                    : 10 + s.level;
              s.st = Math.min(s.maxSt, s.st + 24);
              s.hp = Math.min(s.maxHp, s.hp + 10);

              if (dfKind === 'hielo') {
                explosionsRef.current.push({
                  x: pl.x,
                  y: pl.y,
                  radius: dfRadius,
                  life: 0.65,
                  maxLife: 0.65,
                  color: 'rgba(56, 189, 248, 0.56)',
                });
                explosionsRef.current.push({
                  x: pl.x,
                  y: pl.y,
                  radius: 190,
                  life: 0.45,
                  maxLife: 0.45,
                  color: 'rgba(224, 242, 254, 0.6)',
                });
                timersRef.current.shake = 0.7;
                sfx.hit(s.sound);
                pushPop(pl.x, pl.y - 32, '❄️ ¡FRUTA HIELO!', '#38bdf8');
                showToast('❄️ ¡Fruta del Demonio Hielo! Oleada congelada y ralentizada en masa');
              } else if (dfKind === 'gravedad') {
                explosionsRef.current.push({
                  x: pl.x,
                  y: pl.y,
                  radius: dfRadius,
                  life: 0.6,
                  maxLife: 0.6,
                  color: 'rgba(168, 85, 247, 0.56)',
                });
                explosionsRef.current.push({
                  x: pl.x,
                  y: pl.y,
                  radius: 165,
                  life: 0.42,
                  maxLife: 0.42,
                  color: 'rgba(216, 180, 254, 0.55)',
                });
                timersRef.current.shake = 0.85;
                sfx.explosion(s.sound);
                pushPop(pl.x, pl.y - 32, '🌀 ¡FRUTA GRAVEDAD!', '#c084fc');
                showToast('🌀 ¡Fruta del Demonio Gravedad! Enemigos agrupados al centro y aplastados');
              } else {
                explosionsRef.current.push({
                  x: pl.x,
                  y: pl.y,
                  radius: dfRadius,
                  life: 0.55,
                  maxLife: 0.55,
                  color: 'rgba(251, 146, 60, 0.6)',
                });
                explosionsRef.current.push({
                  x: pl.x,
                  y: pl.y,
                  radius: 175,
                  life: 0.4,
                  maxLife: 0.4,
                  color: 'rgba(250, 204, 21, 0.55)',
                });
                // Clear hostile enemy projectiles near player!
                for (let pi = projectilesRef.current.length - 1; pi >= 0; pi--) {
                  const pr = projectilesRef.current[pi];
                  if (!pr.fromPlayer && Math.hypot(pr.x - pl.x, pr.y - pl.y) <= dfRadius) {
                    projectilesRef.current.splice(pi, 1);
                  }
                }
                timersRef.current.shake = 0.9;
                sfx.explosion(s.sound);
                pushPop(pl.x, pl.y - 32, '🍊 ¡FRUTA ONDA!', '#fb923c');
                showToast('🍊 ¡Fruta del Demonio Onda! Mega empuje radial y aturdimiento masivo');
              }

              const vortexCenterX = pl.x + Math.cos(pl.angle) * 95;
              const vortexCenterY = pl.y + Math.sin(pl.angle) * 95;

              for (let ei = enemiesRef.current.length - 1; ei >= 0; ei--) {
                const en = enemiesRef.current[ei];
                const distEn = Math.hypot(en.x - pl.x, en.y - pl.y);
                if (distEn <= dfRadius + en.radius) {
                  if (dfKind === 'hielo') {
                    en.freezeTimer = Math.max(en.freezeTimer || 0, en.isBoss || en.isLeviathan ? 1.8 : 3.8);
                    en.slowTimer = Math.max(en.slowTimer || 0, 5.5);
                    if (!en.isLeviathan) {
                      en.hp -= dfDmg;
                      en.hitT = 0.24;
                      en.provoked = true;
                      pushPop(en.x, en.y - 20, `❄️ Congelado -${dfDmg}`, '#67e8f9');
                      if (en.hp <= 0) handleEnemyDefeated(ei);
                    } else {
                      pushPop(en.x, en.y - en.radius * 0.4, '❄️ Escarcha', '#67e8f9');
                    }
                  } else if (dfKind === 'gravedad') {
                    if (!en.isLeviathan) {
                      const pullAng = Math.atan2(vortexCenterY - en.y, vortexCenterX - en.x);
                      const dVortex = Math.hypot(vortexCenterX - en.x, vortexCenterY - en.y);
                      const pullStep = Math.max(0, dVortex - 34) * 0.72;
                      en.x += Math.cos(pullAng) * pullStep;
                      en.y += Math.sin(pullAng) * pullStep;
                      en.stunTimer = Math.max(en.stunTimer || 0, en.isBoss ? 0.9 : 1.7);
                      en.slowTimer = Math.max(en.slowTimer || 0, 6.2);
                      en.hp -= dfDmg;
                      en.hitT = 0.24;
                      en.provoked = true;
                      pushPop(en.x, en.y - 20, `🌀 Vórtice -${dfDmg}`, '#d8b4fe');
                      if (en.hp <= 0) handleEnemyDefeated(ei);
                    } else {
                      en.slowTimer = Math.max(en.slowTimer || 0, 4.0);
                      pushPop(en.x, en.y - en.radius * 0.4, '🌀 Gravedad', '#c084fc');
                    }
                  } else {
                    const pushAng = Math.atan2(en.y - pl.y, en.x - pl.x);
                    const pushDist = en.isLeviathan ? 50 : 175;
                    en.x += Math.cos(pushAng) * pushDist;
                    en.y += Math.sin(pushAng) * pushDist;
                    en.stunTimer = Math.max(en.stunTimer || 0, en.isLeviathan || en.isBoss ? 1.1 : 2.4);
                    if (!en.isLeviathan) {
                      en.hp -= dfDmg;
                      en.hitT = 0.24;
                      en.provoked = true;
                      pushPop(en.x, en.y - 20, `🍊 Aturdido -${dfDmg}`, '#fdba74');
                      if (en.hp <= 0) handleEnemyDefeated(ei);
                    } else {
                      pushPop(en.x, en.y - en.radius * 0.4, '💨 Repelido', '#fb923c');
                    }
                  }
                }
              }
            } else if (d.kind === 'resource' && d.resourceKey && d.amount) {
              s.resources[d.resourceKey] += d.amount;
              pushPop(d.x, d.y - 12, d.label, d.color);
              sfx.pickup(s.sound);
              if (
                d.resourceKey === 'pez' &&
                randomEventRef.current.active &&
                randomEventRef.current.kind === 'fish_frenzy' &&
                randomEventRef.current.targetCount > 0
              ) {
                randomEventRef.current.progress += d.amount;
                if (randomEventRef.current.progress >= randomEventRef.current.targetCount) {
                  randomEventRef.current.active = false;
                  s.resources.oro += 4;
                  s.resources.veg += 2;
                  grantXpAndFame(45, 55);
                  sfx.chest(s.sound);
                  showToast('¡Pesca a Torrentes completada! +4 Oro · +2 Veg');
                  const crew = s.survivors.filter((sv) => sv.unlocked);
                  const sp =
                    crew.length > 0 ? crew[Math.floor(Math.random() * crew.length)] : null;
                  const spDef = sp ? SURVIVORS_CATALOG.find((c) => c.id === sp.id) : null;
                  pushComic(
                    spDef?.name || 'Tripulación',
                    '¡Bodega repleta de pescado fresco! ¡Excelente pesca, Capitán!',
                    raft.x,
                    raft.y,
                    '#22d3ee'
                  );
                }
              }
            }
            dropsRef.current.splice(i, 1);
            syncUi();
          }
        }

        // Non-Constant Zone & Difficulty-Scaled Spawning:
        // Safe Islands protect EVERY player regardless of rank (even #1 Rey de los Piratas!) or wanted stars
        const diffMod = getDifficultyModifiers(s.difficulty);
        const distTierInfo = getDistanceTierInfo(pl.x, pl.y);
        const playerInSafeZone = Boolean(isPointInSafeZoneIsland(pl.x, pl.y, islandsRef.current));
        const protectedNow = s.stealthTimer > 0 || pl.inShelter || playerInSafeZone;
        const earlyGracePhase = s.dayCount <= diffMod.graceDays && s.elapsedSeconds < Math.max(70, diffMod.graceDays * 55);
        const anyKingdomOrClanWar =
          s.kingdoms.some((k) => k.atWar) || s.clan.rivals.some((c) => c.atWar);

        if (!warRef.current.active && !protectedNow && !earlyGracePhase) {
          if (inDangerousWater || anyKingdomOrClanWar || distTierInfo.tier >= 3) {
            warRef.current.cooldown -= dt * 0.85 * diffMod.spawnRateMult;
          }
          if (warRef.current.cooldown <= 0 && (inDangerousWater || anyKingdomOrClanWar)) {
            startWarEvent();
          } else {
            t.enemy -= dt;
            const maxConcurrent = Math.max(
              1,
              (inDangerousWater ? 5 : anyKingdomOrClanWar ? 3 : 2) + diffMod.maxConcurrentBonus + Math.floor(distTierInfo.tier / 2)
            );
            const spawnInterval = Math.max(
              2.6,
              (inDangerousWater ? 6.5 : anyKingdomOrClanWar ? 11 : 18) / diffMod.spawnRateMult
            );

            if (t.enemy <= 0 && enemiesRef.current.length < maxConcurrent) {
              t.enemy = spawnInterval;
              if (inDangerousWater || distTierInfo.tier >= 3) {
                const hasLeviathan = enemiesRef.current.some((e) => e.isLeviathan);
                const roll = Math.random();
                let kind: EnemyKind = 'shark';
                if (!hasLeviathan && roll > 0.88) {
                  kind =
                    distTierInfo.tier >= 5
                      ? 'leviathan_elder'
                      : distTierInfo.tier >= 4
                        ? 'leviathan_adult'
                        : 'leviathan_baby';
                } else if (distTierInfo.tier >= 5 && roll > 0.62) {
                  const elderAbyssPool: EnemyKind[] = [
                    'abysmal_sovereign',
                    'abysmal_empress',
                    'abysmal_behemoth',
                    'abysmal_hydra',
                    'abysmal_necromancer',
                  ];
                  kind = elderAbyssPool[Math.floor(Math.random() * elderAbyssPool.length)];
                } else if (distTierInfo.tier >= 4 && roll > 0.56) {
                  const deepAbyssPool: EnemyKind[] = [
                    'abysmal_warden',
                    'abysmal_golem',
                    'abysmal_angler',
                    'abysmal_knight',
                    'hacker_corsair',
                  ];
                  kind = deepAbyssPool[Math.floor(Math.random() * deepAbyssPool.length)];
                } else if (distTierInfo.tier >= 3 && roll > 0.54) {
                  const midAbyssPool: EnemyKind[] = [
                    'abysmal_eel',
                    'abysmal_siren',
                    'hacker_jammer',
                    'hacker_siphoner',
                    'kraken',
                  ];
                  kind = midAbyssPool[Math.floor(Math.random() * midAbyssPool.length)];
                } else {
                  kind = roll > 0.42 ? 'shark' : roll > 0.2 ? 'crab' : 'jelly';
                }
                spawnEnemyNear(kind);
              } else if (anyKingdomOrClanWar) {
                spawnEnemyNear(Math.random() < 0.5 ? 'bandit_grunt' : 'bandit_gunner');
              } else if (Math.random() < 0.55) {
                spawnEnemyNear(Math.random() < 0.5 ? 'crab' : 'jelly');
              }
            }
          }
        }

        // La Marina Naval & El Gobierno Mundial Pursuit Spawning (with Gov Agent Wave Cap)
        t.factionSkirmishLogCd = Math.max(0, t.factionSkirmishLogCd - dt);
        t.islandDefenseCd = Math.max(0, t.islandDefenseCd - dt);
        t.marinePatrolCd -= dt;
        const wanted = getMarineWantedLevel(s);
        const marinaWar = Boolean(s.kingdoms.find((k) => k.id === 'marina')?.atWar);
        const govWar = Boolean(s.kingdoms.find((k) => k.id === 'gobierno_mundial')?.atWar);
        const activeGovAgents = enemiesRef.current.filter((e) => e.kind === 'gov_agent').length;
        const gw = govWaveRef.current;

        if (gw.active && gw.spawnedInWave >= gw.waveCap && activeGovAgents === 0) {
          gw.active = false;
          gw.cooldown = 52;
          grantXpAndFame(65, 85);
          logWorldEvent(
            s,
            'marina',
            `Repeliste la Oleada #${gw.waveNumber} del Gobierno Mundial (${gw.waveCap} agentes élite)`
          );
          showToast(`🕶️ ¡Oleada #${gw.waveNumber} del Gobierno Mundial repelida! Reagrupando fuerzas`);
        } else if (!gw.active && (wanted.agentsActive || govWar) && !protectedNow && !earlyGracePhase && s.elapsedSeconds > 115) {
          gw.cooldown -= dt;
          if (gw.cooldown <= 0) {
            gw.active = true;
            gw.waveNumber += 1;
            gw.waveCap = Math.min(5, 2 + (wanted.stars >= 5 ? 2 : wanted.stars >= 4 ? 1 : 0) + (govWar ? 1 : 0));
            gw.spawnedInWave = 0;
            logWorldEvent(
              s,
              'marina',
              `El Gobierno Mundial lanzó la Oleada #${gw.waveNumber} de Agentes Élite (límite ${gw.waveCap})`
            );
            showToast(`🕶️ ¡Oleada #${gw.waveNumber} del Gobierno Mundial! (Máx. ${gw.waveCap} agentes)`);
          }
        }

        if (t.marinePatrolCd <= 0 && !protectedNow && !earlyGracePhase && s.elapsedSeconds > 105) {
          t.marinePatrolCd = Math.max(12, 34 - wanted.stars * 4);
          if ((wanted.stars >= 1 || marinaWar || govWar) && enemiesRef.current.length < 8) {
            if (
              gw.active &&
              gw.spawnedInWave < gw.waveCap &&
              activeGovAgents < gw.waveCap &&
              (wanted.agentsActive || govWar)
            ) {
              gw.spawnedInWave += 1;
              spawnEnemyNear('gov_agent', undefined, undefined, undefined, 1, { noTerritory: true });
              showToast(`🕶️ ¡Agente del Gobierno Mundial (${gw.spawnedInWave}/${gw.waveCap}) en intercepción!`);
            } else if ((wanted.stars >= 3 || marinaWar) && Math.random() < 0.48) {
              spawnEnemyNear('marine_captain', undefined, undefined, undefined, 1, { noTerritory: true });
              showToast('⚓ ¡Capitán de La Marina lidera cacería en tu sector!');
            } else {
              spawnEnemyNear('marine_patrol', undefined, undefined, undefined, 1, { noTerritory: true });
              showToast('⚓ ¡Patrullero de La Marina interceptando tu navío!');
            }
          }
        }

        // Occasional Leviathan Island-Swallowing Hunger Trigger
        t.leviathanSwallowCd -= dt;
        if (t.leviathanSwallowCd <= 0) {
          t.leviathanSwallowCd = 90 + Math.random() * 45;
          const hungryLev = enemiesRef.current.find(
            (e) => e.isLeviathan && !e.provoked && !e.swallowTargetIslandId
          );
          if (hungryLev) {
            const candidate = islandsRef.current
              .filter((isl) => {
                if (isl.chunkKey === '0,0' || isl.id === s.hqIslandId || isl.isSafeZone || getIslandFactionControl(isl) === 'neutral_safe') return false;
                const hasShield = s.islandStructures.some(
                  (st) =>
                    st.islandId === isl.id &&
                    (st.kind === 'nuclear_bunker' || (st.kind === 'settlement' && st.level >= 3))
                );
                if (hasShield) return false;
                return Math.hypot(isl.x - hungryLev.x, isl.y - hungryLev.y) < 1950;
              })
              .sort(
                (a, b) =>
                  Math.hypot(a.x - hungryLev.x, a.y - hungryLev.y) -
                  Math.hypot(b.x - hungryLev.x, b.y - hungryLev.y)
              )[0];
            if (candidate) {
              hungryLev.swallowTargetIslandId = candidate.id;
              hungryLev.swallowTimer = 15;
              showToast(`🌋 ¡Alerta abisal! Un Leviatán se acerca para tragarse ${candidate.name}`);
              pushComic(
                'Vice-Cap. Vega',
                `¡Ese coloso va a devorar ${candidate.name}! ¡Solo un Buque o Búnker Nuclear lo detendrá!`,
                raft.x,
                raft.y,
                '#22d3ee'
              );
            }
          }
        }

        // Enemy AI: Cross-Faction Combat (Pirates vs Marina/Gov vs Monsters), Island Control & Safe Zones!
        const factionEffectiveProtected = protectedNow || playerInSafeZone;
        for (let i = enemiesRef.current.length - 1; i >= 0; i--) {
          const e = enemiesRef.current[i];
          if (e.hp <= 0) continue;
          e.freezeTimer = Math.max(0, (e.freezeTimer || 0) - dt);
          e.stunTimer = Math.max(0, (e.stunTimer || 0) - dt);
          e.slowTimer = Math.max(0, (e.slowTimer || 0) - dt);
          e.cd = Math.max(0, e.cd - dt);
          e.hitT = Math.max(0, e.hitT - dt);
          const ccLocked = (e.freezeTimer || 0) > 0 || (e.stunTimer || 0) > 0;
          if (!ccLocked) {
            e.gaitPhase += dt * 9 * ((e.slowTimer || 0) > 0 ? 0.45 : 1);
          }

          const myFaction = getEnemyFaction(e);
          const enemyInSafeZone = Boolean(isPointInSafeZoneIsland(e.x, e.y, islandsRef.current));
          const rivalTarget = enemyInSafeZone
            ? null
            : findHostileFactionEnemyTarget(e, enemiesRef.current, islandsRef.current, 430);
          const distToPlNow = Math.hypot(pl.x - e.x, pl.y - e.y);
          const distToRival = rivalTarget ? Math.hypot(rivalTarget.x - e.x, rivalTarget.y - e.y) : Infinity;
          const combatTargetEnemy =
            rivalTarget && (factionEffectiveProtected || distToRival < Math.min(280, distToPlNow * 1.15))
              ? rivalTarget
              : null;

          let targetX = combatTargetEnemy ? combatTargetEnemy.x : pl.x;
          let targetY = combatTargetEnemy ? combatTargetEnemy.y : pl.y;
          let swallowedNow = false;

          // Dual AI Steering: IA Humana (Piratas/Bandidos/Marina/Gob) vs IA de Monstruos (Depredadores y Leviatanes)
          let aiSpeedMult = 1;
          if (e.isLeviathan && !e.provoked) {
            // Leviathan patrols deep waters away from islands unless swallowing an unshielded one
            if (e.swallowTargetIslandId) {
              const targetIsl = islandsRef.current.find((x) => x.id === e.swallowTargetIslandId);
              const shielded = targetIsl
                ? s.islandStructures.some(
                    (st) =>
                      st.islandId === targetIsl.id &&
                      (st.kind === 'nuclear_bunker' || (st.kind === 'settlement' && st.level >= 3))
                  )
                : true;
              if (!targetIsl || shielded) {
                e.swallowTargetIslandId = null;
              } else {
                e.aiState = 'swallow';
                targetX = targetIsl.x;
                targetY = targetIsl.y;
                e.swallowTimer = Math.max(0, (e.swallowTimer || 0) - dt);
                const distToIsl = Math.hypot(targetIsl.x - e.x, targetIsl.y - e.y);
                if (distToIsl <= Math.max(85, targetIsl.radius * 0.45) || e.swallowTimer <= 0) {
                  swallowedNow = true;
                  e.swallowTargetIslandId = null;
                  if (!s.swallowedIslands.includes(targetIsl.id)) {
                    s.swallowedIslands.push(targetIsl.id);
                  }
                  const strandedNpcs = worldNpcsRef.current.filter(
                    (wn) => wn.islandId === targetIsl.id
                  );
                  if (strandedNpcs.length > 0) {
                    worldNpcsRef.current = worldNpcsRef.current.filter(
                      (wn) => wn.islandId !== targetIsl.id
                    );
                  }
                  const hadVillage = targetIsl.nodes.some(
                    (n) => n.kind === 'village' || n.kind === 'fishing_post'
                  );
                  islandsRef.current = islandsRef.current.filter((x) => x.id !== targetIsl.id);
                  s.islandStructures = s.islandStructures.filter(
                    (st) => st.islandId !== targetIsl.id
                  );
                  s.farmPlots = s.farmPlots.filter((fp) => fp.islandId !== targetIsl.id);
                  animalsRef.current = animalsRef.current.filter(
                    (an) => an.islandId !== targetIsl.id
                  );

                  // Spawn Rescue Lifeboat (Barco Salvavidas) carrying NPCs & villagers to nearest intact island
                  const destIsl = [...islandsRef.current].sort(
                    (a, b) =>
                      Math.hypot(a.x - targetIsl.x, a.y - targetIsl.y) -
                      Math.hypot(b.x - targetIsl.x, b.y - targetIsl.y)
                  )[0];
                  let rescueLine = '';
                  if (destIsl) {
                    const passengers: RescueBoatEntity['passengers'] = strandedNpcs.map((wn) => ({
                      id: wn.id,
                      name: wn.name,
                      color: wn.color,
                      hatColor: wn.hatColor,
                      role: wn.role,
                      title: wn.title,
                      specialty: wn.specialty,
                      greeting: wn.greeting,
                    }));
                    if (hadVillage || passengers.length === 0) {
                      passengers.push({
                        name: `Colono de ${targetIsl.name}`,
                        color: targetIsl.cultureColor || '#38bdf8',
                        hatColor: '#fde047',
                      });
                    }
                    if (passengers.length < 2) {
                      passengers.push({
                        name: `Vigía de ${targetIsl.name}`,
                        color: '#fb923c',
                        hatColor: '#f8fafc',
                      });
                    }
                    const angToDest = Math.atan2(
                      destIsl.y - targetIsl.y,
                      destIsl.x - targetIsl.x
                    );
                    const dropX =
                      destIsl.x + Math.cos(angToDest + Math.PI) * Math.max(30, destIsl.radius * 0.65);
                    const dropY =
                      destIsl.y + Math.sin(angToDest + Math.PI) * Math.max(30, destIsl.radius * 0.65);
                    rescueBoatsRef.current.push({
                      id: eid++,
                      sourceIslandId: targetIsl.id,
                      sourceIslandName: targetIsl.name,
                      targetIslandId: destIsl.id,
                      targetIslandName: destIsl.name,
                      x: targetIsl.x + Math.cos(angToDest) * (targetIsl.radius * 0.55),
                      y: targetIsl.y + Math.sin(angToDest) * (targetIsl.radius * 0.55),
                      targetX: dropX,
                      targetY: dropY,
                      angle: angToDest,
                      passengers,
                      life: 90,
                    });
                    rescueLine = ` Un Barco Salvavidas zarpó con ${passengers.length} sobrevivientes rumbo a ${destIsl.name}.`;
                    pushPop(
                      targetIsl.x,
                      targetIsl.y - 34,
                      `🛟 Salvavidas → ${destIsl.name}`,
                      '#fb923c'
                    );
                  }

                  if (pointInIsland(pl.x, pl.y, targetIsl)) {
                    pl.onIsland = false;
                    pl.inShelter = false;
                    pl.swimming = !pl.onRaft;
                    pushPop(pl.x, pl.y - 26, '🌊 ¡Isla devorada!', '#22d3ee');
                  }
                  for (let k = 0; k < 4; k++) {
                    splashesRef.current.push({
                      x: targetIsl.x + (Math.random() - 0.5) * targetIsl.radius * 0.6,
                      y: targetIsl.y + (Math.random() - 0.5) * targetIsl.radius * 0.6,
                      life: 0.9,
                      maxLife: 0.9,
                      maxRadius: targetIsl.radius * 0.8,
                    });
                  }
                  t.shake = 1.0;
                  sfx.explosion(s.sound);
                  showToast(
                    destIsl
                      ? `🕳️ ¡El Leviatán tragó ${targetIsl.name}! 🛟 Barco Salvavidas rumbo a ${destIsl.name}`
                      : `🕳️ ¡El Leviatán se tragó por completo la isla ${targetIsl.name}!`
                  );
                  s.newspaper.articles.unshift({
                    id: `swallow_${Date.now()}`,
                    category: 'PORTADA',
                    headline: `¡Leviatán colosal devora la isla ${targetIsl.name}!`,
                    body: `Testigos vieron emerger un titán del tamaño de una isla que hundió ${targetIsl.name} bajo las cenizas saladas.${rescueLine} Solo un Búnker o Buque Nuclear puede hacerles frente.`,
                    day: s.dayCount,
                  });
                  s.newspaper.unread = true;
                  saveState(s);
                  syncUi();
                }
              }
            }
            if (!e.swallowTargetIslandId && !swallowedNow) {
              e.aiState = 'patrol';
              const orbitAng = t.world * 0.25 + e.id;
              let avoidX = 0;
              let avoidY = 0;
              for (const isl of islandsRef.current) {
                const dxI = e.x - isl.x;
                const dyI = e.y - isl.y;
                const dI = Math.hypot(dxI, dyI) || 1;
                const safeR = isl.radius + e.radius + 115;
                if (dI < safeR) {
                  const strength = (safeR - dI) / safeR;
                  avoidX += (dxI / dI) * 260 * strength;
                  avoidY += (dyI / dI) * 260 * strength;
                }
              }
              targetX = e.x + Math.cos(orbitAng) * 90 + avoidX;
              targetY = e.y + Math.sin(orbitAng) * 90 + avoidY;
            }
          } else if (e.isBandit) {
            if (!combatTargetEnemy && e.isThief && !e.stolenBag && !factionEffectiveProtected) {
              const distToRaft = Math.hypot(raft.x - e.x, raft.y - e.y);
              if (distToRaft <= halfRaft + e.radius + 16) {
                if (e.stealProgress === 0) {
                  sfx.stealAlert(s.sound);
                  pushPop(e.x, e.y - 24, '¡Intentando robar!', '#fde047');
                }
                e.stealProgress += dt;
                if (e.stealProgress >= 3.0) {
                  e.stealProgress = 0;
                  const stealOptions: ResourceKey[] = ['mad', 'cht', 'oro'];
                  const chosen = stealOptions.find((k) => s.resources[k] >= 2) || 'mad';
                  const amt = Math.min(3, Math.max(1, s.resources[chosen]));
                  s.resources[chosen] = Math.max(0, s.resources[chosen] - amt);
                  e.stolenBag = { key: chosen, amount: amt };
                  sfx.stealAlert(s.sound);
                  pushComic(e.name, '¡Gracias por el botín, pringao!', e.x, e.y, '#fbbf24');
                  showToast(`¡Un bandido robó ${amt} ${chosen.toUpperCase()} de tu navío!`);
                }
              } else {
                e.stealProgress = Math.max(0, e.stealProgress - dt * 1.5);
              }
            }

            const pirateSteer = computePirateHumanAi(e, dt, {
              pl,
              targetPos: combatTargetEnemy ? { x: combatTargetEnemy.x, y: combatTargetEnemy.y } : null,
              raft,
              halfRaft,
              protectedNow: factionEffectiveProtected,
              allEnemies: enemiesRef.current,
              state: s,
              worldTime: t.world,
            });
            targetX = pirateSteer.targetX;
            targetY = pirateSteer.targetY;
            aiSpeedMult = pirateSteer.speedMult;
            if (pirateSteer.barkText) {
              pushComic(e.name, pirateSteer.barkText, e.x, e.y - 10, pirateSteer.barkColor || '#fca5a5');
            }
          } else {
            const monsterSteer = computeSeaMonsterAi(e, dt, {
              pl,
              targetPos: combatTargetEnemy ? { x: combatTargetEnemy.x, y: combatTargetEnemy.y } : null,
              raft,
              protectedNow: factionEffectiveProtected,
              state: s,
              worldTime: t.world,
            });
            targetX = monsterSteer.targetX;
            targetY = monsterSteer.targetY;
            aiSpeedMult = monsterSteer.speedMult;
          }

          if ((e.slowTimer || 0) > 0) aiSpeedMult *= 0.42;

          const dxE = targetX - e.x;
          const dyE = targetY - e.y;
          const dist = Math.hypot(dxE, dyE) || 1;
          const stopDist =
            e.kind === 'bandit_gunner' && !factionEffectiveProtected && e.aiState !== 'flank' && e.aiState !== 'flee'
              ? 185
              : e.radius + 10;

          if (ccLocked) {
            e.vx = 0;
            e.vy = 0;
          } else if (dist > stopDist) {
            const leviSpd = e.swallowTargetIslandId ? 76 : 42;
            const spd = (e.isLeviathan && !e.provoked ? leviSpd : e.speed) * aiSpeedMult;
            e.vx = (dxE / dist) * spd;
            e.vy = (dyE / dist) * spd;
            e.x += e.vx * dt;
            e.y += e.vy * dt;
          }

          if (e.bountyId) {
            const pb = s.pirateBounties.find((b) => b.id === e.bountyId);
            if (pb) {
              pb.targetX = e.x;
              pb.targetY = e.y;
            }
          }

          if (e.isAquatic) {
            if (!(e.isLeviathan && e.swallowTargetIslandId)) {
              const pad = e.isLeviathan && !e.provoked ? e.radius + 65 : e.radius + 4;
              const boundedMonster = resolveIslandBoundary(e.x, e.y, pad, islandsRef.current);
              e.x = boundedMonster.x;
              e.y = boundedMonster.y;
            }
            e.onLand = false;

            // Collide sea monsters with Player Raft/Warship hull!
            if (!(s.raft.damagedMode && s.raft.level < 7)) {
              const hullHit = resolveRaftBoatCollision(
                e.x,
                e.y,
                e.radius + 2,
                raft.x,
                raft.y,
                halfRaft
              );
              e.x = hullHit.x;
              e.y = hullHit.y;

              if (!ccLocked && hullHit.collided && e.isLargeMonster && e.cd <= 0 && !factionEffectiveProtected) {
                if (!e.isLeviathan || e.provoked) {
                  e.cd = e.isLeviathan ? 1.5 : 1.8;
                  const shieldMult =
                    (s.craftedTech.includes('tech_escudo') ? 0.6 : 1) *
                    (hasWarshipPassive(s, 'wp_blindaje_titanio') ? 0.75 : 1) *
                    (1 - Math.min(0.48, (s.raft.shieldLevel || 0) * 0.12));
                  const hullDmg = Math.max(4, Math.round(e.dmg * 1.15 * shieldMult));
                  s.raft.hp = Math.max(0, s.raft.hp - hullDmg);
                  raft.hp = s.raft.hp;
                  t.shake = 0.85;
                  sfx.hurt(s.sound);
                  pushPop(raft.x, raft.y - 26, `-${hullDmg} Casco`, '#f97316');
                  if (Math.random() < 0.35) {
                    shiftWorldNpcMoods(s, 'hull_hit');
                  }

                  if (s.raft.hp <= 0) {
                    s.raft.damagedMode = true;
                    raft.damagedMode = true;
                    if (s.raft.level >= 7) {
                      showToast('¡Buque de Guerra averiado! No se hunde, pero debes reparar el casco');
                    } else {
                      pl.piloting = false;
                      pl.x = raft.x + halfRaft + 28;
                      showToast('¡El monstruo destruyó tu balsa! Nada y repárala');
                    }
                  }
                }
              }
            }
          } else {
            // Island Faction Access Enforcement for AI units (Marina/Gov cannot enter Pirate islands; Pirates cannot enter Marina/Gov islands; Nobody fights inside Neutral Safe Zones)
            const accessRes = resolveIslandFactionAccessForEnemy(e, islandsRef.current);
            if (accessRes.blocked && accessRes.island && e.cd <= 0) {
              if (accessRes.blockedByControl === 'marina_gov' && myFaction === 'pirate') {
                e.cd = 1.6;
                e.hp -= 18;
                e.hitT = 0.14;
                pushPop(e.x, e.y - 18, '⚓ Defensa Marina -18', '#60a5fa');
                if (t.factionSkirmishLogCd <= 0) {
                  t.factionSkirmishLogCd = 24;
                  logWorldEvent(s, 'marina', `Defensas de La Marina rechazaron piratas en ${accessRes.island.name}`);
                }
              } else if (accessRes.blockedByControl === 'pirate' && myFaction === 'marina_gov') {
                e.cd = 1.6;
                e.hp -= 18;
                e.hitT = 0.14;
                pushPop(e.x, e.y - 18, '🏴‍☠️ Defensa Pirata -18', '#fb7185');
                if (t.factionSkirmishLogCd <= 0) {
                  t.factionSkirmishLogCd = 24;
                  logWorldEvent(s, 'combat', `Piratas de ${accessRes.island.name} repelieron a fuerzas de ${e.kind === 'gov_agent' ? 'Gobierno Mundial' : 'La Marina'}`);
                }
              }
            }

            e.onLand = islandsRef.current.some((isl) => pointInIsland(e.x, e.y, isl));
            if (e.isBandit && !combatTargetEnemy) {
              if (!e.onLand && !e.boardedRaft) {
                const distToHull = Math.hypot(e.x - raft.x, e.y - raft.y);
                if (distToHull <= halfRaft + e.radius + 14 && !s.raft.damagedMode && !playerInSafeZone) {
                  // Realistic Pirate Boarding: Anchor boat alongside hull and step onto deck!
                  const ang = Math.atan2(raft.y - e.y, raft.x - e.x);
                  e.parkedBoat = { x: e.x, y: e.y, angle: ang };
                  e.boardedRaft = true;
                  e.x = raft.x + Math.cos(ang + Math.PI) * (halfRaft * 0.72);
                  e.y = raft.y + Math.sin(ang + Math.PI) * (halfRaft * 0.72);
                  pushPop(e.x, e.y - 20, '¡Abordaje!', '#fb7185');
                } else {
                  const boatBound = resolveRaftBoatCollision(
                    e.x,
                    e.y,
                    e.radius + 6,
                    raft.x,
                    raft.y,
                    halfRaft
                  );
                  e.x = boatBound.x;
                  e.y = boatBound.y;
                }
              } else if (e.boardedRaft) {
                // If player moves far off the raft onto land, unboard cleanly
                if (Math.hypot(e.x - raft.x, e.y - raft.y) > halfRaft + 70) {
                  e.boardedRaft = false;
                  e.parkedBoat = null;
                }
              }
            }

            // Solid island structures & fortified compound walls block ground enemies; enemies attack walls/buildings blocking them
            const eStHit = resolveSolidStructureCollision(
              e.x,
              e.y,
              e.radius,
              s.islandStructures,
              s.ageTier || 1
            );
            if (eStHit.collided && eStHit.hitStructure) {
              e.x = eStHit.x;
              e.y = eStHit.y;
              if (e.cd <= 0 && !enemyInSafeZone) {
                e.cd = 1.25;
                const stTarget = eStHit.hitStructure;
                stTarget.hp = Math.max(0, (stTarget.hp ?? 240) - e.dmg);
                pushPop(stTarget.x, stTarget.y - 18, `-${e.dmg} Estructura`, '#fb7185');
                if (stTarget.hp <= 0) {
                  showToast('⚠️ ¡Una estructura de tu isla ha caído! Repárala desde el menú');
                }
              }
            }
            const eWallHit = resolveCompoundWallCollision(
              e.x,
              e.y,
              e.radius,
              compoundWallsRef.current,
              islandsRef.current,
              s
            );
            if (eWallHit.collided) {
              e.x = eWallHit.x;
              e.y = eWallHit.y;
            }
          }

          // Enforce boss/semi-boss territorial tether (never leave home territory)
          let playerInsideBossTerritory = true;
          if (
            typeof e.homeX === 'number' &&
            typeof e.homeY === 'number' &&
            typeof e.territoryRadius === 'number' &&
            !e.bountyId &&
            !e.storyMissionId
          ) {
            const dxHome = e.x - e.homeX;
            const dyHome = e.y - e.homeY;
            const dHome = Math.hypot(dxHome, dyHome);
            if (dHome > e.territoryRadius) {
              e.x = e.homeX + (dxHome / dHome) * e.territoryRadius;
              e.y = e.homeY + (dyHome / dHome) * e.territoryRadius;
            }
            playerInsideBossTerritory =
              Math.hypot(pl.x - e.homeX, pl.y - e.homeY) <= e.territoryRadius;
          }

          const stillInSafe = enemyInSafeZone || Boolean(isPointInSafeZoneIsland(e.x, e.y, islandsRef.current));

          // Ranged Attacks (vs hostile faction enemy OR vs player)
          if (
            !ccLocked &&
            !stillInSafe &&
            (combatTargetEnemy || (!factionEffectiveProtected && playerInsideBossTerritory)) &&
            (e.kind === 'bandit_gunner' || e.rangedShotKind) &&
            dist < 340 &&
            e.cd <= 0
          ) {
            e.cd = e.rangedShotKind ? 2.1 : 1.65;
            const tx = combatTargetEnemy ? combatTargetEnemy.x : pl.x;
            const ty = combatTargetEnemy ? combatTargetEnemy.y : pl.y;
            const ang = Math.atan2(ty - e.y, tx - e.x);
            const shotColor =
              e.rangedShotKind === 'shock'
                ? '#22d3ee'
                : e.rangedShotKind === 'sonic'
                  ? '#e879f9'
                  : e.rangedShotKind === 'void'
                    ? '#a855f7'
                    : e.rangedShotKind === 'necrotic'
                      ? '#a3e635'
                      : '#fb7185';
            projectilesRef.current.push({
              id: eid++,
              fromPlayer: false,
              faction: myFaction,
              sourceEnemyId: e.id,
              kind: 'enemy_shot',
              x: e.x,
              y: e.y,
              vx: Math.cos(ang) * 290,
              vy: Math.sin(ang) * 290,
              dmg: e.dmg,
              life: 1.5,
              color: shotColor,
            });
          }

          // Cross-Faction Melee Combat (Pirates <-> Marina/Gov <-> Monsters)
          if (
            !ccLocked &&
            !stillInSafe &&
            combatTargetEnemy &&
            combatTargetEnemy.hp > 0 &&
            Math.hypot(combatTargetEnemy.x - e.x, combatTargetEnemy.y - e.y) <= e.radius + combatTargetEnemy.radius + 16 &&
            e.cd <= 0
          ) {
            e.cd = 1.05;
            combatTargetEnemy.hp -= e.dmg;
            combatTargetEnemy.hitT = 0.14;
            combatTargetEnemy.provoked = true;
            pushPop(
              combatTargetEnemy.x,
              combatTargetEnemy.y - 18,
              `-${e.dmg}`,
              myFaction === 'marina_gov' ? '#60a5fa' : myFaction === 'pirate' ? '#fb7185' : '#a855f7'
            );
            if (Math.hypot(e.x - pl.x, e.y - pl.y) < 520) sfx.hit(s.sound);
            if (t.factionSkirmishLogCd <= 0) {
              t.factionSkirmishLogCd = 24;
              logWorldEvent(
                s,
                myFaction === 'marina_gov' || getEnemyFaction(combatTargetEnemy) === 'marina_gov' ? 'marina' : 'combat',
                `Choque entre facciones: ${e.name} combatió contra ${combatTargetEnemy.name}`
              );
            }
          }

          // Small monsters CANNOT hurt player while player is standing aboard the raft!
          const blockedByRaftDeck = e.isAquatic && !e.isLargeMonster && pl.onRaft;
          const distToPl = Math.hypot(pl.x - e.x, pl.y - e.y);
          if (
            !ccLocked &&
            !stillInSafe &&
            !combatTargetEnemy &&
            !factionEffectiveProtected &&
            !blockedByRaftDeck &&
            (!e.isLeviathan || e.provoked) &&
            distToPl <= e.radius + 15 &&
            e.cd <= 0 &&
            pl.invT <= 0
          ) {
            e.cd = 1.05;
            pl.invT = 0.55;
            const totalRed = Math.min(
              0.65,
              (hasDestiny(s, 'abordaje_t4') ? 0.15 : 0) + relicStats.damageReduction
            );
            const dmgTaken = Math.max(1, Math.round(e.dmg * (1 - totalRed) * perf.defenseMult));
            s.hp = Math.max(0, s.hp - dmgTaken);
            const dmgRatio = dmgTaken / Math.max(1, s.maxHp);
            const dmgMood = registerPlayerDamageMood(s, dmgRatio);
            if (dmgMood.newMoodAlert) showToast(dmgMood.newMoodAlert);
            const sitDmgEnemy = registerCombatActionIntensity(s, { tookDamageRatio: dmgRatio });
            if (sitDmgEnemy.alert) {
              showToast(sitDmgEnemy.alert);
              pushPop(pl.x, pl.y - 30, sitDmgEnemy.alert.split('!')[0] + '!', sitDmgEnemy.color || '#f43f5e');
            }
            t.shake = 0.75;
            sfx.hurt(s.sound);
            pushPop(pl.x, pl.y - 20, `-${dmgTaken} HP`, '#fb7185');
            if (s.hp <= 0) {
              triggerPlayerDeath(
                e.isLeviathan ? 'leviathan' : e.isBandit ? 'pirate' : 'enemy',
                e.name
              );
              break;
            }
            syncUi();
          }
        }

        // Sweep any enemies defeated by cross-faction combat or island defenses
        for (let di = enemiesRef.current.length - 1; di >= 0; di--) {
          if (enemiesRef.current[di].hp <= 0) {
            handleEnemyDefeated(di);
          }
        }

        // Rescue Lifeboats (Barcos Salvavidas): evacuate NPCs from swallowed islands to safe shores
        for (let bi = rescueBoatsRef.current.length - 1; bi >= 0; bi--) {
          const boat = rescueBoatsRef.current[bi];
          boat.life -= dt;
          let destIsl = islandsRef.current.find((x) => x.id === boat.targetIslandId);
          if (!destIsl && islandsRef.current.length > 0) {
            destIsl = [...islandsRef.current].sort(
              (a, b) =>
                Math.hypot(a.x - boat.x, a.y - boat.y) -
                Math.hypot(b.x - boat.x, b.y - boat.y)
            )[0];
            if (destIsl) {
              boat.targetIslandId = destIsl.id;
              boat.targetIslandName = destIsl.name;
              const angNew = Math.atan2(destIsl.y - boat.y, destIsl.x - boat.x);
              boat.targetX =
                destIsl.x + Math.cos(angNew + Math.PI) * Math.max(30, destIsl.radius * 0.65);
              boat.targetY =
                destIsl.y + Math.sin(angNew + Math.PI) * Math.max(30, destIsl.radius * 0.65);
            }
          }
          const dxB = boat.targetX - boat.x;
          const dyB = boat.targetY - boat.y;
          const distB = Math.hypot(dxB, dyB);
          if (distB > 24 && boat.life > 0) {
            boat.angle = Math.atan2(dyB, dxB);
            const boatSpd = 98;
            boat.x += (dxB / distB) * boatSpd * dt;
            boat.y += (dyB / distB) * boatSpd * dt;
          } else {
            if (destIsl) {
              boat.passengers.forEach((p, idx) => {
                if (!p.role) return;
                const offsetAng = (idx * 1.3) % (Math.PI * 2);
                const nx = boat.targetX + Math.cos(offsetAng) * 26;
                const ny = boat.targetY + Math.sin(offsetAng) * 26;
                const npcId = p.id || `rescued_${boat.id}_${idx}`;
                worldNpcsRef.current.push({
                  id: npcId,
                  role: p.role,
                  name: p.name,
                  title: p.title || 'Sobreviviente Rescatado',
                  islandId: destIsl!.id,
                  islandName: destIsl!.name,
                  x: nx,
                  y: ny,
                  color: p.color,
                  hatColor: p.hatColor || '#f8fafc',
                  specialty: p.specialty || 'Evacuado en barco salvavidas',
                  greeting:
                    p.greeting ||
                    `¡Gracias al cielo por el barco salvavidas! Apenas escapamos de ${boat.sourceIslandName}.`,
                  discovered: s.discoveredWorldNpcs.some((d) => d.id === npcId),
                });
                const discEntry = s.discoveredWorldNpcs.find((d) => d.id === npcId);
                if (discEntry) {
                  discEntry.islandName = destIsl!.name;
                  discEntry.x = nx;
                  discEntry.y = ny;
                }
              });
              pushPop(
                boat.targetX,
                boat.targetY - 24,
                `🛟 ¡${boat.passengers.length} rescatados en ${destIsl.name}!`,
                '#fb923c'
              );
              showToast(
                `🛟 Barco Salvavidas atracó en ${destIsl.name}: sobrevivientes de ${boat.sourceIslandName} a salvo.`
              );
            }
            rescueBoatsRef.current.splice(bi, 1);
          }
        }

        // Soft separation between enemies
        for (let i = 0; i < enemiesRef.current.length; i++) {
          for (let j = i + 1; j < enemiesRef.current.length; j++) {
            const a = enemiesRef.current[i];
            const b = enemiesRef.current[j];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const d = Math.hypot(dx, dy);
            const minD = a.radius + b.radius + 6;
            if (d > 0.001 && d < minD) {
              const push = (minD - d) * 0.5;
              const nx = (dx / d) * push;
              const ny = (dy / d) * push;
              a.x -= nx;
              a.y -= ny;
              b.x += nx;
              b.y += ny;
            }
          }
        }

        // Update Projectiles
        for (let i = projectilesRef.current.length - 1; i >= 0; i--) {
          const p = projectilesRef.current[i];
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.life -= dt;

          let consumed = false;
          if (isPointInSafeZoneIsland(p.x, p.y, islandsRef.current)) {
            consumed = true;
          } else if (p.fromPlayer) {
            for (let j = enemiesRef.current.length - 1; j >= 0; j--) {
              const e = enemiesRef.current[j];
              if (Math.hypot(e.x - p.x, e.y - p.y) <= e.radius + 10) {
                if (isPointInSafeZoneIsland(e.x, e.y, islandsRef.current)) {
                  consumed = true;
                  break;
                }
                if (e.isLeviathan && !p.isNuclear) {
                  pushPop(e.x, e.y - e.radius * 0.4, '🛡️ Inmune (Solo Nuclear)', '#38bdf8');
                  consumed = true;
                  break;
                }
                if ((p.kind === 'bomb' || p.kind === 'nuke' || p.kind === 'magic' || p.kind === 'missile') && p.aoeRadius) {
                  detonateExplosion(p.x, p.y, p.aoeRadius, p.dmg, Boolean(p.isNuclear));
                } else {
                  e.hp -= p.dmg;
                  e.hitT = 0.1;
                  e.provoked = true;
                  e.stealProgress = Math.max(0, e.stealProgress - 0.6);
                  sfx.hit(s.sound);
                  pushPop(
                    e.x,
                    e.y - (e.isLeviathan ? e.radius * 0.35 : 16),
                    p.isNuclear ? `☢ -${p.dmg}` : `-${p.dmg}`,
                    p.isNuclear ? '#a3e635' : '#fde047'
                  );
                  const sitProjHit = registerCombatActionIntensity(s, { hitEnemy: true });
                  if (sitProjHit.alert) showToast(sitProjHit.alert);
                  if (e.hp <= 0) handleEnemyDefeated(j);
                }
                consumed = true;
                break;
              }
            }
            if (!consumed) {
              for (const wall of compoundWallsRef.current) {
                if (wall.destroyed || isCompoundGatePassable(wall, islandsRef.current, s)) continue;
                const isVert = Math.abs(Math.sin(wall.angle)) > 0.7;
                const hw = (isVert ? wall.height : wall.width) * 0.5;
                const hh = (isVert ? wall.width : wall.height) * 0.5;
                if (
                  Math.abs(p.x - wall.x) <= hw + 8 &&
                  Math.abs(p.y - wall.y) <= hh + 8
                ) {
                  wall.hp = Math.max(0, wall.hp - p.dmg);
                  sfx.hit(s.sound);
                  pushPop(wall.x, wall.y - 16, `-${p.dmg} Muro`, '#fca5a5');
                  if (wall.hp <= 0) {
                    wall.destroyed = true;
                    explosionsRef.current.push({
                      x: wall.x,
                      y: wall.y,
                      radius: 34,
                      life: 0.3,
                      maxLife: 0.3,
                      color: 'rgba(251, 146, 60, 0.55)',
                    });
                    sfx.explosion(s.sound);
                    showToast('⚔ ¡Muro derribado! Paso abierto para saquear');
                  }
                  consumed = true;
                  break;
                }
              }
            }
            if (!consumed) {
              for (let j = animalsRef.current.length - 1; j >= 0; j--) {
                const a = animalsRef.current[j];
                if (Math.hypot(a.x - p.x, a.y - p.y) <= a.radius + 7) {
                  a.hp -= p.dmg;
                  a.hitT = 0.12;
                  sfx.hit(s.sound);
                  pushPop(a.x, a.y - 14, `-${p.dmg}`, '#fca5a5');
                  if (a.hp <= 0) handleAnimalDefeated(j);
                  consumed = true;
                  break;
                }
              }
            }
            if (!consumed && p.life <= 0 && (p.kind === 'bomb' || p.kind === 'nuke' || p.kind === 'magic' || p.kind === 'missile') && p.aoeRadius) {
              detonateExplosion(p.x, p.y, p.aoeRadius, p.dmg, Boolean(p.isNuclear));
              consumed = true;
            }
          } else {
            for (let j = enemiesRef.current.length - 1; j >= 0; j--) {
              const e = enemiesRef.current[j];
              if (e.id === p.sourceEnemyId || e.hp <= 0) continue;
              if (!areFactionsHostile(p.faction || 'pirate', getEnemyFaction(e), undefined, e.kind)) continue;
              if (isPointInSafeZoneIsland(e.x, e.y, islandsRef.current)) continue;
              if (Math.hypot(e.x - p.x, e.y - p.y) <= e.radius + 10) {
                e.hp -= p.dmg;
                e.hitT = 0.12;
                e.provoked = true;
                pushPop(e.x, e.y - 16, `-${p.dmg}`, p.color);
                if (e.hp <= 0) handleEnemyDefeated(j);
                consumed = true;
                break;
              }
            }
            if (!consumed && !protectedNow && !playerInSafeZone && Math.hypot(pl.x - p.x, pl.y - p.y) <= 16 && pl.invT <= 0) {
              pl.invT = 0.45;
              const projDmg = Math.max(1, Math.round(p.dmg * perf.defenseMult));
              s.hp = Math.max(0, s.hp - projDmg);
              const projRatio = projDmg / Math.max(1, s.maxHp);
              const dmgMood = registerPlayerDamageMood(s, projRatio);
              if (dmgMood.newMoodAlert) showToast(dmgMood.newMoodAlert);
              const sitProjDmg = registerCombatActionIntensity(s, { tookDamageRatio: projRatio });
              if (sitProjDmg.alert) showToast(sitProjDmg.alert);
              sfx.hurt(s.sound);
              pushPop(pl.x, pl.y - 20, `-${projDmg} HP`, '#fb7185');
              consumed = true;
              if (s.hp <= 0) {
                triggerPlayerDeath(
                  'projectile',
                  p.kind === 'enemy_shot' ? 'Artillería Hostil' : 'Proyectil Abismal'
                );
              }
            }
          }

          if (consumed || p.life <= 0) {
            projectilesRef.current.splice(i, 1);
          }
        }

        for (let i = slashesRef.current.length - 1; i >= 0; i--) {
          slashesRef.current[i].life -= dt;
          if (slashesRef.current[i].life <= 0) slashesRef.current.splice(i, 1);
        }
        for (let i = explosionsRef.current.length - 1; i >= 0; i--) {
          explosionsRef.current[i].life -= dt;
          if (explosionsRef.current[i].life <= 0) explosionsRef.current.splice(i, 1);
        }
        for (let i = splashesRef.current.length - 1; i >= 0; i--) {
          splashesRef.current[i].life -= dt;
          if (splashesRef.current[i].life <= 0) splashesRef.current.splice(i, 1);
        }
        for (let i = popsRef.current.length - 1; i >= 0; i--) {
          popsRef.current[i].y -= 24 * dt;
          popsRef.current[i].life -= dt * 1.1;
          if (popsRef.current[i].life <= 0) popsRef.current.splice(i, 1);
        }
        for (let i = comicsRef.current.length - 1; i >= 0; i--) {
          comicsRef.current[i].life -= dt;
          if (comicsRef.current[i].life <= 0) comicsRef.current.splice(i, 1);
        }

        t.uiSync += dt;
        if (t.uiSync >= 0.14) {
          t.uiSync = 0;
          const isl = islandsRef.current.find((x) => pointInIsland(pl.x, pl.y, x));
          setCurrentIslandId(isl ? isl.id : null);
          setCurrentIslandName(isl ? isl.name : null);
          const vNode =
            isl?.nodes.find(
              (n) => n.kind === 'village' && !n.depleted && Math.hypot(n.x - pl.x, n.y - pl.y) <= 105
            ) || null;
          setNearbyVillage(vNode);
          const nearAn =
            animalsRef.current.find((a) => Math.hypot(a.x - pl.x, a.y - pl.y) <= 68) || null;
          setNearbyAnimal(nearAn);
          const nearWnpc =
            worldNpcsRef.current.find((n) => Math.hypot(n.x - pl.x, n.y - pl.y) <= 78) || null;
          if (nearWnpc) {
            nearWnpc.discovered = true;
            if (!s.discoveredWorldNpcs.some((d) => d.id === nearWnpc.id)) {
              s.discoveredWorldNpcs.push({
                id: nearWnpc.id,
                role: nearWnpc.role,
                name: nearWnpc.name,
                islandName: nearWnpc.islandName,
                x: nearWnpc.x,
                y: nearWnpc.y,
              });
            }
          }
          setNearbyWorldNpc(nearWnpc);
          setDangerousWater(inDangerousWater);
          setInShelter(pl.inShelter);
          const nextInteract = computeInteractTarget();
          setInteractHint((prev) =>
            prev.label === nextInteract.label && prev.active === nextInteract.active
              ? prev
              : { label: nextInteract.label, active: nextInteract.active }
          );

          const nextCrewStatuses: Partial<
            Record<SurvivorId, { label: string; tone: CrewStatusTone }>
          > = {};
          const activeSv = s.survivors.filter((sv) => sv.unlocked);
          activeSv.forEach((sv, idx) => {
            if (raft.damagedMode && idx === 0) {
              nextCrewStatuses[sv.id] = { label: 'Nadando', tone: 'swim' };
            } else if ((crewCooldownsRef.current[sv.id] || 0) > 0.12) {
              nextCrewStatuses[sv.id] = { label: 'Combate', tone: 'combat' };
            } else if (raft.hp < raft.maxHp && (sv.id === 'kiko' || sv.id === 'beto')) {
              nextCrewStatuses[sv.id] = { label: 'Reparando', tone: 'repair' };
            } else {
              const idleLabel =
                sv.id === 'vega'
                  ? 'Mando'
                  : sv.id === 'pipo'
                    ? 'Vigía'
                    : sv.id === 'nerea'
                      ? 'Alerta'
                      : 'Patrulla';
              nextCrewStatuses[sv.id] = { label: idleLabel, tone: 'patrol' };
            }
          });
          setCrewStatuses((prev) => {
            const keys = Object.keys(nextCrewStatuses) as SurvivorId[];
            if (
              keys.length === Object.keys(prev).length &&
              keys.every(
                (k) =>
                  prev[k]?.label === nextCrewStatuses[k]?.label &&
                  prev[k]?.tone === nextCrewStatuses[k]?.tone
              )
            ) {
              return prev;
            }
            return nextCrewStatuses;
          });

          if (pl.piloting) setLocationLabel(`Timón · ${getShipClassName(raft.level)}`);
          else if (pl.inShelter) setLocationLabel(`Refugio · ${isl?.name || 'Isla'}`);
          else if (pl.onRaft) setLocationLabel(`Sobre ${getShipClassName(raft.level)}`);
          else if (pl.onIsland)
            setLocationLabel(
              isl && getIslandFactionControl(isl) === 'neutral_safe'
                ? `🕊 Zona Segura · ${isl.name}`
                : `Isla: ${isl?.name || 'Tierra'}${isl?.cultureName ? ` (${isl.cultureEmblem || ''} ${isl.cultureName})` : ''}`
            );
          else setLocationLabel('🥽 Nadando');

          syncUi();
        }

        t.save += dt;
        if (t.save >= 4) {
          t.save = 0;
          saveState(s);
          setHasSave(true);
        }

        t.leaderboardSync += dt;
        if (t.leaderboardSync >= 28) {
          t.leaderboardSync = 0;
          syncLeaderboard(false);
        }
      } else {
        if (modeRef.current !== 'PLAYING') t.world += rawDt * 0.4;
      }

      if (ctx) {
        renderTopDownWorld({
          ctx,
          width,
          height,
          camX: camRef.current.x,
          camY: camRef.current.y,
          time: t.world,
          shake: t.shake,
          weather: weatherRef.current,
          lightningAlpha: t.lightning,
          dangerousWater: inDangerousWater,
          randomEvent: randomEventRef.current,
          uiPaused: uiPausedRef.current,
          state: s,
          raft,
          player: pl,
          islands: islandsRef.current,
          worldNpcs: worldNpcsRef.current,
          nearbyWorldNpcId: nearbyWorldNpc?.id || null,
          compoundWalls: compoundWallsRef.current,
          rescueBoats: rescueBoatsRef.current,
          animals: animalsRef.current,
          enemies: enemiesRef.current,
          projectiles: projectilesRef.current,
          drops: dropsRef.current,
          explosions: explosionsRef.current,
          splashes: splashesRef.current,
          slashes: slashesRef.current,
          pops: popsRef.current,
          comics: comicsRef.current,
          introCutscene: introRef.current,
        });
      }

      rafId = window.requestAnimationFrame(step);
    };

    rafId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(rafId);
  }, [
    checkTitlesAndAchievements,
    computeInteractTarget,
    detonateExplosion,
    doDash,
    doPrimaryAction,
    ensureChunksAround,
    finishIntroCutscene,
    grantXpAndFame,
    handleAnimalDefeated,
    handleEnemyDefeated,
    handleInteract,
    publishDailyNewspaper,
    pushComic,
    pushPop,
    showToast,
    spawnEnemyNear,
    spawnFloatingDrop,
    startWarEvent,
    syncLeaderboard,
    syncUi,
    togglePiloting,
    triggerPlayerDeath,
    triggerRandomEvent,
  ]);

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType !== 'mouse') return;
    if (Math.hypot(joyInputRef.current.x, joyInputRef.current.y) > 0.05) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    pointerWorldRef.current = {
      x: camRef.current.x + (sx - sizeRef.current.width * 0.5),
      y: camRef.current.y + (sy - sizeRef.current.height * 0.5),
      active: true,
    };
  };

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (hotbarExpanded) {
      setHotbarExpanded(false);
      return;
    }
    if (isGamePausedRef.current || introRef.current.active) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const canvasW = rect.width || sizeRef.current.width;
    if (sx >= canvasW - 114 && sy <= 114) {
      setWorldMapOpen(true);
      return;
    }
    const wx = camRef.current.x + (sx - sizeRef.current.width * 0.5);
    const wy = camRef.current.y + (sy - sizeRef.current.height * 0.5);
    const ang = Math.atan2(wy - playerRef.current.y, wx - playerRef.current.x);
    if (e.pointerType !== 'mouse') {
      pointerWorldRef.current.active = false;
    }
    doPrimaryAction(ang);
  };

  const needsHullRepair = uiState.raft.hp < uiState.raft.maxHp || uiState.raft.damagedMode;
  const equippedWeapon =
    WEAPON_MAP[uiState.hotbar[uiState.equippedSlot] || ''] || WEAPON_MAP.lanza_madera;
  const discoveredIslandsList = islandsRef.current
    .filter((isl) => uiState.discoveredIslands.includes(isl.id) || isl.id === currentIslandId)
    .map((isl) => ({
      id: isl.id,
      name: isl.name,
      biome: isl.biome,
      cultureName: isl.cultureName,
      cultureEmblem: isl.cultureEmblem,
      cultureColor: isl.cultureColor,
      cultureTradition: isl.cultureTradition,
    }));

  const layoutPlan = useMemo(() => {
    const isPortrait = viewport.orientation === 'portrait';
    const isCompactHeight = viewport.height < 520;
    const hudLayoutMode: HudLayoutMode = isPortrait
      ? 'portrait'
      : isCompactHeight || viewport.width < 1180
        ? 'landscape-compact'
        : 'landscape-wide';

    // Keep top-left consumables clear of the 98x98 top-right minimap (x = width - 108..width - 10)
    const consumablesHorizontal = !isPortrait && viewport.width >= 540;
    const consumablesMaxW = Math.max(152, viewport.width - 126);

    // Compact horizontal action bar in landscape reduces bottom height to maximize vertical sea area
    const useHorizontalActions = !isPortrait && viewport.width >= 560;
    const edgePad = isCompactHeight ? 10 : 12;
    const joystickW = 80;
    const leftEdge = edgePad + joystickW + 10;
    const rightClusterW = useHorizontalActions ? 268 : 156;
    const rightClusterH = useHorizontalActions ? 74 : 112;
    const rightEdge = viewport.width - rightClusterW - edgePad - 10;
    const freeBottomGap = rightEdge - leftEdge;

    const neededHotbarW = hotbarExpanded ? 336 : 136;
    const hotbarFitsAtBottom = freeBottomGap >= neededHotbarW;
    const hotbarBottomPx = hotbarFitsAtBottom ? edgePad : rightClusterH + edgePad + 8;
    const hotbarLeftPx = hotbarFitsAtBottom
      ? Math.round(leftEdge + freeBottomGap / 2)
      : Math.round(viewport.width / 2);

    // Banners (toast / village / animal) automatically clear top-left consumables & minimap
    const topNeedsClearance = isPortrait || viewport.width < 640;
    const toastTopPx = topNeedsClearance ? (consumablesCollapsed ? 48 : 116) : 52;
    const stripTopPx = topNeedsClearance ? (consumablesCollapsed ? 80 : 146) : 84;
    const drawerBtnTopPx = isCompactHeight ? 116 : 138;

    // Left-edge CrewHud sits below consumables panel and safely above the bottom-left joystick
    const consumablesHeightPx = consumablesCollapsed
      ? 32
      : consumablesHorizontal
        ? 34
        : warState.active
          ? 92
          : 122;
    const crewHudTopPx = 10 + consumablesHeightPx + 8;
    const stageApproxH = Math.max(240, viewport.height - (isPortrait ? 86 : 44));
    const joystickReservePx = edgePad + 88;
    const crewHudMaxHeightPx = Math.max(58, stageApproxH - crewHudTopPx - joystickReservePx);

    return {
      isPortrait,
      isCompactHeight,
      hudLayoutMode,
      consumablesHorizontal,
      consumablesMaxW,
      useHorizontalActions,
      edgePad,
      hotbarBottomPx,
      hotbarLeftPx,
      toastTopPx,
      stripTopPx,
      drawerBtnTopPx,
      crewHudTopPx,
      crewHudMaxHeightPx,
    };
  }, [consumablesCollapsed, hotbarExpanded, viewport, warState.active]);

  const currentDistanceTier = getDistanceTierInfo(playerRef.current.x, playerRef.current.y);

  return (
    <div className="h-[100dvh] h-dvh w-screen overflow-hidden flex flex-col bg-[#04111d] select-none">
      <HudBar
        state={uiState}
        mode={mode}
        uiPaused={uiPaused}
        layoutMode={layoutPlan.hudLayoutMode}
        locationLabel={locationLabel}
        weather={weather}
        dangerousWater={dangerousWater}
        inShelter={inShelter}
        distanceTier={currentDistanceTier}
        gamepadConnected={gamepad.connected}
        war={warState}
        randomEvent={randomEventState}
        drawerOpen={drawerOpen}
        onToggleDrawer={() => setDrawerOpen((o) => !o)}
        onOpenDestiny={() => setDestinyModalOpen(true)}
        onOpenNewspaper={openNewspaperModal}
        onOpenProfile={() => setProfileOpen(true)}
        onOpenDonations={() => {
          setDonationPurpose('donation');
          setDonationOpen(true);
        }}
        onOpenStory={() => setStoryOpen(true)}
        onOpenMap={() => setWorldMapOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenInstall={() => setInstallOpen(true)}
        onPanelOpenChange={setHudPanelOpen}
        onToggleSound={() => {
          stateRef.current.sound = !stateRef.current.sound;
          saveState(stateRef.current);
          syncUi();
        }}
        onTogglePause={() => setMode((p) => (p === 'PLAYING' ? 'PAUSED' : 'PLAYING'))}
        isFullscreen={fullscreen.isFullscreen}
        fullscreenSupported={fullscreen.supported}
        onToggleFullscreen={() => void fullscreen.toggle()}
        isOnline={isOnline}
        myRank={(() => {
          const idx = leaderboard.findIndex((p) => p.id === uiState.playerProfile.id);
          return idx >= 0 ? idx + 1 : null;
        })()}
        activePlayersCount={leaderboard.filter((p) => p.activeNow).length}
      />

      <main ref={stageRef} className="relative flex-1 min-h-0 w-full overflow-hidden">
        <canvas
          ref={canvasRef}
          onPointerMove={handleCanvasPointerMove}
          onPointerDown={handleCanvasPointerDown}
          className="absolute inset-0 w-full h-full block cursor-crosshair"
        />

        {/* Orientation-Adaptive Consumables Panel (Top-Left, guaranteed clear of Minimap & Bottom Actions) */}
        {mode === 'PLAYING' && !drawerOpen && !introUi.active && (
          <div
            onPointerDown={(e) => e.stopPropagation()}
            style={{ maxWidth: `${layoutPlan.consumablesMaxW}px` }}
            className="absolute top-2.5 left-2.5 z-20 bg-[#061522]/40 hover:bg-[#061522]/80 focus-within:bg-[#061522]/80 backdrop-blur-[2px] border border-[#224766]/50 rounded-lg p-1 shadow-md opacity-60 hover:opacity-100 focus-within:opacity-100 transition-all"
          >
            {consumablesCollapsed ? (
              <button
                type="button"
                onClick={() => setConsumablesCollapsed(false)}
                className="px-2 py-1 rounded bg-[#0c2438]/70 hover:bg-[#12334f]/90 text-sky-100 text-[10px] font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                title="Mostrar menú de consumibles"
              >
                <Backpack className="w-3 h-3 text-amber-300 shrink-0" />
                <span>
                  Bolsa ({uiState.resources.gui}G · {uiState.resources.veg}V ·{' '}
                  {uiState.resources.agu}A)
                </span>
                <ChevronDown className="w-3 h-3 text-slate-300 shrink-0" />
              </button>
            ) : (
              <div
                className={`flex gap-1 ${
                  layoutPlan.consumablesHorizontal ? 'items-center' : 'items-start'
                }`}
              >
                <div
                  className={
                    layoutPlan.consumablesHorizontal
                      ? 'flex items-center gap-1'
                      : 'grid grid-cols-2 gap-1'
                  }
                >
                  <button
                    type="button"
                    disabled={
                      uiState.resources.gui <= 0 ||
                      (uiState.hp >= uiState.maxHp &&
                        uiState.vitals.hunger >= 95 &&
                        uiState.vitals.mentalHealth >= 95)
                    }
                    onClick={doEat}
                    className="min-w-[74px] px-1.5 py-1 rounded bg-emerald-600/65 hover:bg-emerald-500/90 disabled:opacity-35 text-white text-[10px] font-bold inline-flex items-center justify-between gap-1 cursor-pointer whitespace-nowrap"
                    title="Comer Guiso (+40 HP, +60 Hambre, +14 Mente, Tecla E)"
                  >
                    <span className="inline-flex items-center gap-1">
                      <Utensils className="w-3 h-3 shrink-0" />
                      <span>Guiso</span>
                    </span>
                    <span className="font-mono-num text-[9px] px-1 rounded bg-black/25">
                      {uiState.resources.gui}
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={
                      uiState.resources.veg <= 0 ||
                      (uiState.hp >= uiState.maxHp &&
                        uiState.st >= uiState.maxSt &&
                        uiState.vitals.hunger >= 95)
                    }
                    onClick={handleEatVeg}
                    className="min-w-[74px] px-1.5 py-1 rounded bg-lime-700/65 hover:bg-lime-600/90 disabled:opacity-35 text-white text-[10px] font-bold inline-flex items-center justify-between gap-1 cursor-pointer whitespace-nowrap"
                    title="Comer cultivo (+22 HP, +20 ST, +34 Hambre, +12 Sed)"
                  >
                    <span className="inline-flex items-center gap-1">
                      <Leaf className="w-3 h-3 shrink-0" />
                      <span>Veg</span>
                    </span>
                    <span className="font-mono-num text-[9px] px-1 rounded bg-black/25">
                      {uiState.resources.veg}
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={
                      uiState.resources.agu <= 0 ||
                      (uiState.vitals.thirst >= 98 && uiState.vitals.fatigue >= 95)
                    }
                    onClick={handleDrinkWater}
                    className="min-w-[74px] px-1.5 py-1 rounded bg-cyan-700/65 hover:bg-cyan-600/90 disabled:opacity-35 text-white text-[10px] font-bold inline-flex items-center justify-between gap-1 cursor-pointer whitespace-nowrap"
                    title="Beber Agua dulce (+52 Sed, +14 Fatiga, +18 ST, +6 Mente)"
                  >
                    <span className="inline-flex items-center gap-1">
                      <Droplets className="w-3 h-3 shrink-0" />
                      <span>Agua</span>
                    </span>
                    <span className="font-mono-num text-[9px] px-1 rounded bg-black/25">
                      {uiState.resources.agu}
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={uiState.consumables.repelente <= 0 || uiState.stealthTimer > 0}
                    onClick={doUseStealth}
                    className="min-w-[74px] px-1.5 py-1 rounded bg-[#142a42]/65 hover:bg-[#1b3a5c]/90 disabled:opacity-35 border border-purple-400/40 text-purple-100 text-[10px] font-bold inline-flex items-center justify-between gap-1 cursor-pointer whitespace-nowrap"
                    title="Evitar ataques por 45 segundos"
                  >
                    <span className="inline-flex items-center gap-1">
                      <EyeOff className="w-3 h-3 shrink-0" />
                      <span>Sigilo</span>
                    </span>
                    <span className="font-mono-num text-[9px] px-1 rounded bg-black/25">
                      {uiState.consumables.repelente}
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={warState.active}
                    onClick={doSleep}
                    className="min-w-[74px] px-1.5 py-1 rounded bg-[#142a42]/65 hover:bg-[#1b3a5c]/90 disabled:opacity-35 border border-sky-400/40 text-sky-100 text-[10px] font-bold inline-flex items-center justify-between gap-1 cursor-pointer whitespace-nowrap"
                    title="Dormir: restaura 100% Sueño y Cansancio, +28% Mente y guarda Punto de Control"
                  >
                    <span className="inline-flex items-center gap-1">
                      <Moon className="w-3 h-3 shrink-0" />
                      <span>Dormir</span>
                    </span>
                    <span className="font-mono-num text-[9px] px-1 rounded bg-black/25">
                      {uiState.consumables.hamaca}
                    </span>
                  </button>

                  {!warState.active && (
                    <button
                      type="button"
                      onClick={() => startWarEvent()}
                      className="min-w-[74px] px-1.5 py-1 rounded bg-rose-700/60 hover:bg-rose-600/90 text-white text-[10px] font-bold inline-flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap"
                      title="Iniciar evento de guerra"
                    >
                      <Flame className="w-3 h-3 shrink-0" />
                      <span>Guerra</span>
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setConsumablesCollapsed(true)}
                  className="p-1 rounded bg-[#0c2438]/60 hover:bg-[#12334f] text-slate-300 cursor-pointer shrink-0 self-stretch flex items-center"
                  title="Recoger menú de consumibles"
                  aria-label="Recoger consumibles"
                >
                  <ChevronUp className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Compact Left-Edge Active Crew HUD (non-blocking, below consumables & above joystick) */}
        {mode === 'PLAYING' && !drawerOpen && !introUi.active && (
          <CrewHud
            survivors={uiState.survivors}
            npcMoods={uiState.npcMoods}
            crewStatuses={crewStatuses}
            topPx={layoutPlan.crewHudTopPx}
            leftPx={10}
            maxHeightPx={layoutPlan.crewHudMaxHeightPx}
            compactByDefault={viewport.height < 410}
            onOpenCrewTab={() => {
              setDrawerTab('crew');
              setDrawerOpen(true);
            }}
            onTalkToNpc={handleOpenNpcChat}
          />
        )}

        {mode === 'PLAYING' && !drawerOpen && !introUi.active && !uiState.tutorialDismissed && (
          <TutorialGuideCard
            state={uiState}
            bottomPx={
              layoutPlan.hotbarBottomPx + (hotbarExpanded ? 66 : 44) + (needsHullRepair ? 26 : 0)
            }
            onOpenStory={() => setStoryOpen(true)}
            onOpenDrawerIslands={() => {
              setDrawerTab('islands');
              setDrawerOpen(true);
            }}
            onDismiss={() => {
              stateRef.current.tutorialDismissed = true;
              saveState(stateRef.current);
              syncUi();
            }}
          />
        )}

        {/* Second-0 Intro Cutscene Narrative Caption Overlay (Paused step-by-step with Siguiente 💬) */}
        {mode === 'PLAYING' && introUi.active && !uiPaused && (
          <div
            onPointerDown={(e) => e.stopPropagation()}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-[min(660px,calc(100vw-24px))] rounded-xl bg-[#051320]/95 border-2 border-amber-400/70 px-4 py-3.5 shadow-2xl backdrop-blur-xs"
          >
            <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
              <div className="flex items-center gap-2 min-w-0">
                <span className="px-2 py-0.5 rounded bg-amber-400/20 border border-amber-400/45 text-[10px] font-bold uppercase tracking-wider text-amber-300 shrink-0">
                  Prólogo · Desde 0
                </span>
                <h3 className="text-xs sm:text-sm font-extrabold text-sky-200 truncate">
                  {introUi.captionTitle}
                </h3>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={finishIntroCutscene}
                  className="px-2 py-1 rounded-lg bg-[#0d2840] hover:bg-[#153c5e] text-slate-300 text-[10px] font-semibold cursor-pointer whitespace-nowrap"
                >
                  Saltar todo
                </button>
                <button
                  type="button"
                  onClick={advanceIntroStep}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 text-xs font-extrabold cursor-pointer inline-flex items-center gap-1 whitespace-nowrap shadow-lg"
                >
                  <span>
                    {introUi.phase === 'spot_raft'
                      ? '¡Nadar a la balsa! 💬'
                      : introUi.phase === 'meet_vega' &&
                          introUi.captionTitle.includes('Misión 1')
                        ? 'Comenzar Misión 1 💬'
                        : 'Siguiente 💬'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-100 leading-relaxed">
              {introUi.captionText}
            </p>
            <div className="mt-1.5 text-[10px] text-slate-400">
              ⏸️ Lee con calma y pulsa [Siguiente 💬] o [Espacio] para avanzar el prólogo.
            </div>
          </div>
        )}

        {toast && (
          <div
            role="status"
            aria-live="polite"
            style={{ top: `${layoutPlan.toastTopPx}px` }}
            className="pointer-events-none absolute left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-md bg-[#071828]/90 border border-amber-400/75 text-amber-300 text-[11px] font-bold whitespace-nowrap shadow-lg max-w-[calc(100vw-24px)] truncate"
          >
            {toast}
          </div>
        )}

        {/* Quick Village Interaction Strip */}
        {nearbyVillage && !nearbyVillage.depleted && !drawerOpen && (
          <div
            style={{ top: `${layoutPlan.stripTopPx}px` }}
            className="absolute left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-[#071828]/88 backdrop-blur-xs border border-amber-400/70 rounded-lg px-2.5 py-1 shadow-xl"
          >
            <Store className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span className="text-xs font-bold text-slate-100 whitespace-nowrap">
              {nearbyVillage.villageName}
            </span>
            <button
              type="button"
              onClick={() => handleOpenNpcChat('aldeano', nearbyVillage.villageName)}
              className="px-2 py-0.5 rounded bg-cyan-600 hover:bg-cyan-500 text-[11px] font-bold text-white inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <MessageCircle className="w-3 h-3" />
              <span>Hablar</span>
            </button>
            <button
              type="button"
              onClick={() => handleVillageAction(nearbyVillage, 'trade')}
              className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-[11px] font-bold text-white cursor-pointer whitespace-nowrap"
            >
              Comerciar
            </button>
            <button
              type="button"
              onClick={() => handleVillageAction(nearbyVillage, 'pillage')}
              className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-[11px] font-bold text-white cursor-pointer whitespace-nowrap"
            >
              Saquear
            </button>
          </div>
        )}

        {/* Quick Wild/Farm Animal Capture Strip when standing near an island animal */}
        {nearbyAnimal && !drawerOpen && mode === 'PLAYING' && (
          <div
            style={{
              top: `${
                nearbyVillage && !nearbyVillage.depleted
                  ? layoutPlan.stripTopPx + 38
                  : layoutPlan.stripTopPx
              }px`,
            }}
            className="absolute left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-[#071828]/88 backdrop-blur-xs border border-emerald-400/80 rounded-lg px-2.5 py-1 shadow-xl"
          >
            <Sprout
              className={`w-3.5 h-3.5 shrink-0 ${
                nearbyAnimal.capturable ? 'text-emerald-300' : 'text-rose-400'
              }`}
            />
            <span className="text-xs font-bold text-slate-100 whitespace-nowrap">
              {nearbyAnimal.name}
            </span>
            {nearbyAnimal.capturable ? (
              <button
                type="button"
                onClick={() => handleCaptureAnimal(nearbyAnimal)}
                className="px-2.5 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-[11px] font-bold text-white cursor-pointer whitespace-nowrap"
              >
                Capturar (1 Veg/Agu)
              </button>
            ) : (
              <span className="px-2 py-0.5 rounded bg-rose-950/90 border border-rose-500/50 text-[10px] font-bold text-rose-200 whitespace-nowrap">
                Salvaje indomable (No capturable)
              </span>
            )}
          </div>
        )}

        {/* Quick World NPC Interaction Strip (Armero, Forjador, Mercader, etc.) */}
        {nearbyWorldNpc && !drawerOpen && mode === 'PLAYING' && (
          <div
            style={{
              top: `${
                layoutPlan.stripTopPx +
                (nearbyVillage && !nearbyVillage.depleted ? 38 : 0) +
                (nearbyAnimal ? 38 : 0)
              }px`,
            }}
            className="absolute left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-[#071828]/92 backdrop-blur-xs border border-cyan-400/80 rounded-lg px-2.5 py-1 shadow-xl"
          >
            <Store className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
            <span className="text-xs font-bold text-slate-100 whitespace-nowrap">
              {nearbyWorldNpc.name} · {nearbyWorldNpc.title.split(' ')[0]}
            </span>
            <button
              type="button"
              onClick={() => setActiveMerchantNpc(nearbyWorldNpc)}
              className="px-2.5 py-0.5 rounded bg-cyan-600 hover:bg-cyan-500 text-[11px] font-bold text-white cursor-pointer whitespace-nowrap"
            >
              {nearbyWorldNpc.role === 'armero' || nearbyWorldNpc.role === 'forjador'
                ? 'Forjar / Comerciar'
                : 'Abrir Puesto'}
            </button>
          </div>
        )}

        {/* Orientation-Adaptive Collision-Free Bottom Controls Layer */}
        <div
          className={`pointer-events-none absolute inset-x-0 bottom-0 z-20 transition-all duration-200 ${
            drawerOpen || introUi.active ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          {/* Left: Compact Analog Joystick */}
          <div
            onPointerDown={(e) => e.stopPropagation()}
            style={{
              bottom: `${layoutPlan.edgePad}px`,
              left: `${layoutPlan.edgePad}px`,
            }}
            className="pointer-events-auto absolute z-20"
          >
            <VirtualJoystick
              scale={uiState.settings.joystickScale}
              opacity={uiState.settings.joystickOpacity}
              label="Mover"
              variant="move"
              onVector={(vx, vy) => {
                joyInputRef.current.x = vx;
                joyInputRef.current.y = vy;
                if (Math.hypot(vx, vy) > 0.05) {
                  pointerWorldRef.current.active = false;
                }
              }}
            />
          </div>

          {uiState.settings.twinStickMobile && (
            <div
              onPointerDown={(e) => e.stopPropagation()}
              style={{
                bottom: `${layoutPlan.edgePad + (layoutPlan.useHorizontalActions ? 76 : 114)}px`,
                right: `${layoutPlan.edgePad}px`,
              }}
              className="pointer-events-auto absolute z-20"
            >
              <VirtualJoystick
                scale={Math.max(0.75, uiState.settings.joystickScale * 0.9)}
                opacity={uiState.settings.joystickOpacity}
                label="Apuntar"
                variant="aim"
                onVector={(vx, vy) => {
                  aimJoyInputRef.current = {
                    x: vx,
                    y: vy,
                    active: Math.hypot(vx, vy) > 0.22,
                  };
                  if (aimJoyInputRef.current.active) {
                    pointerWorldRef.current.active = false;
                  }
                }}
              />
            </div>
          )}

          {/* Center/Adaptive: Collapsible & Translucent Weapon Hotbar */}
          <div
            onPointerDown={(e) => e.stopPropagation()}
            style={{
              bottom: `${layoutPlan.hotbarBottomPx}px`,
              left: `${layoutPlan.hotbarLeftPx}px`,
            }}
            className="pointer-events-auto absolute -translate-x-1/2 z-20 flex flex-col items-center gap-1.5 transition-[bottom,left] duration-200"
          >
            {needsHullRepair && (
              <button
                type="button"
                onClick={handleRepairRaft}
                className="px-2.5 py-0.5 rounded bg-amber-500/75 hover:bg-amber-400 text-slate-950 text-[10px] font-extrabold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap animate-pulse shadow-md backdrop-blur-[2px]"
              >
                <Wrench className="w-3 h-3" />
                <span>Reparar Casco</span>
              </button>
            )}

            {!hotbarExpanded ? (
              <button
                type="button"
                onClick={() => setHotbarExpanded(true)}
                title="Desplegar casillas de armas [1-5]"
                aria-label={`Arma equipada [${uiState.equippedSlot + 1}] ${equippedWeapon.name}. Toca para cambiar de arma`}
                className="px-2.5 py-1.5 rounded-xl bg-[#061522]/30 hover:bg-[#0b2338]/85 border border-[#2a567a]/45 text-slate-200 backdrop-blur-[2px] opacity-40 hover:opacity-95 transition-all cursor-pointer flex items-center gap-2 shadow-md"
              >
                <div className="w-5 h-5 rounded bg-[#05101b]/70 border border-[#2a567a]/50 flex items-center justify-center shrink-0">
                  <WeaponIcon
                    weaponId={equippedWeapon.id}
                    category={equippedWeapon.category}
                    className="w-4 h-4"
                  />
                </div>
                <span className="text-[10px] font-mono-num text-amber-300 font-extrabold">
                  [{uiState.equippedSlot + 1}]
                </span>
                <span className="text-[11px] font-bold truncate max-w-[82px]">
                  {equippedWeapon.name.split(' ')[0]}
                </span>
                <ChevronUp className="w-3.5 h-3.5 text-sky-300 shrink-0" />
              </button>
            ) : (
              <div className="flex items-center gap-1 bg-[#061522]/80 backdrop-blur-xs border border-[#2a567a]/80 rounded-xl p-1.5 shadow-2xl">
                {uiState.hotbar.map((wId, idx) => {
                  const wDef = wId ? WEAPON_MAP[wId] : null;
                  const active = uiState.equippedSlot === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      aria-label={`Arma ranura ${idx + 1}: ${wDef ? wDef.name : 'Vacío'}`}
                      onClick={() => {
                        stateRef.current.equippedSlot = idx;
                        syncUi();
                        setHotbarExpanded(false);
                        if (!wId) {
                          setDrawerTab('arsenal');
                          setDrawerOpen(true);
                        }
                      }}
                      className={`min-w-[52px] sm:min-w-[62px] h-10 px-1.5 py-1 rounded-lg border text-left transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                        active
                          ? 'bg-[#173e5e]/90 border-amber-400 text-amber-200 ring-1 ring-amber-400/60 shadow-inner'
                          : 'bg-[#0a1d2d]/75 border-[#1d3d59] text-slate-300 hover:bg-[#102940] hover:border-[#2c5c85]'
                      }`}
                    >
                      <div className="shrink-0 w-5 h-5 rounded bg-[#05101b] border border-[#1d3d59] flex items-center justify-center">
                        <WeaponIcon
                          weaponId={wDef?.id}
                          category={wDef?.category}
                          className="w-4 h-4"
                        />
                      </div>
                      <div className="min-w-0 flex flex-col">
                        <span
                          className={`text-[9px] font-mono-num leading-none ${
                            active ? 'text-amber-300 font-extrabold' : 'text-slate-400'
                          }`}
                        >
                          [{idx + 1}]
                        </span>
                        <span className="text-[10px] font-bold truncate max-w-[36px] sm:max-w-[44px] leading-tight mt-0.5">
                          {wDef ? wDef.name.split(' ')[0] : 'Vacío'}
                        </span>
                      </div>
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setHotbarExpanded(false)}
                  aria-label="Recoger casillas de armas"
                  title="Recoger barra de armas"
                  className="p-1.5 rounded-lg bg-[#0a1d2d]/75 hover:bg-[#143450] border border-[#1d3d59] text-slate-300 cursor-pointer shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Right: Orientation-Adaptive Translucent Interaction + Action Cluster */}
          <div
            onPointerDown={(e) => e.stopPropagation()}
            style={{
              bottom: `${layoutPlan.edgePad}px`,
              right: `${layoutPlan.edgePad}px`,
            }}
            className="pointer-events-auto absolute z-20 flex flex-col items-end gap-1.5 opacity-50 hover:opacity-95 focus-within:opacity-95 active:opacity-100 transition-opacity"
          >
            <button
              type="button"
              onClick={handleInteract}
              title="Botón de Interacción contextual: abrir cofres, capturar animales, comerciar, recolectar, regar o usar timón (Tecla G)"
              className={`min-h-[32px] px-2.5 py-1 rounded-lg text-[11px] font-extrabold shadow-md backdrop-blur-[2px] cursor-pointer inline-flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-95 transition-all ${
                layoutPlan.useHorizontalActions ? 'min-w-[140px]' : 'w-full'
              } ${
                interactHint.active
                  ? 'bg-emerald-500/75 hover:bg-emerald-400/95 text-slate-950 ring-1 ring-emerald-300/60'
                  : 'bg-[#0e2a42]/55 hover:bg-[#153a59]/90 border border-[#2c5c85]/60 text-slate-200'
              }`}
            >
              <Hand className="w-3.5 h-3.5 shrink-0" />
              <span>{interactHint.label}</span>
            </button>

            <div
              className={
                layoutPlan.useHorizontalActions
                  ? 'flex items-center gap-1'
                  : 'grid grid-cols-2 gap-1.5'
              }
            >
              <button
                type="button"
                onClick={() => doPrimaryAction()}
                className="min-h-[32px] px-2.5 py-1 rounded-lg bg-rose-600/65 hover:bg-rose-500/95 active:scale-95 text-white text-[11px] font-bold shadow-md backdrop-blur-[2px] cursor-pointer inline-flex items-center justify-center gap-1 whitespace-nowrap"
              >
                <Swords className="w-3.5 h-3.5" />
                <span>Atacar</span>
              </button>

              <button
                type="button"
                onClick={togglePiloting}
                className={`min-h-[32px] px-2.5 py-1 rounded-lg active:scale-95 text-[11px] font-bold shadow-md backdrop-blur-[2px] cursor-pointer inline-flex items-center justify-center gap-1 whitespace-nowrap ${
                  playerRef.current.piloting
                    ? 'bg-amber-400/80 text-slate-950'
                    : 'bg-[#12334f]/55 hover:bg-[#19456b]/90 border border-[#2c5c85]/60 text-sky-100'
                }`}
              >
                <Anchor className="w-3.5 h-3.5" />
                <span>{playerRef.current.piloting ? 'Soltar' : 'Timón'}</span>
              </button>

              <button
                type="button"
                onClick={doDash}
                disabled={uiState.st < 18}
                className="min-h-[32px] px-2.5 py-1 rounded-lg bg-sky-600/65 hover:bg-sky-500/95 disabled:opacity-35 active:scale-95 text-white text-[11px] font-bold shadow-md backdrop-blur-[2px] cursor-pointer inline-flex items-center justify-center gap-1 whitespace-nowrap"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Esquivar</span>
              </button>

              <button
                type="button"
                onClick={openNewspaperModal}
                className="min-h-[32px] px-2.5 py-1 rounded-lg bg-[#12334f]/55 hover:bg-[#19456b]/90 border border-[#2c5c85]/60 active:scale-95 text-amber-200 text-[11px] font-bold shadow-md backdrop-blur-[2px] cursor-pointer inline-flex items-center justify-center gap-1 whitespace-nowrap"
              >
                <Newspaper className="w-3.5 h-3.5" />
                <span>Noticias</span>
              </button>
            </div>
          </div>
        </div>

        {/* Slideable / Collapsible Drawer (Auto-pauses world while open!) */}
        <SlideDrawer
          open={drawerOpen}
          tab={drawerTab}
          state={uiState}
          currentIslandId={currentIslandId}
          currentIslandName={currentIslandName}
          discoveredIslands={discoveredIslandsList}
          inShelter={inShelter}
          nearbyVillage={nearbyVillage}
          nearbyWorldNpc={nearbyWorldNpc}
          onClose={() => setDrawerOpen(false)}
          onTabChange={setDrawerTab}
          onEquipWeapon={handleEquipWeapon}
          onCraftWeapon={handleCraftWeapon}
          onCraftTechPiece={handleCraftTechPiece}
          onRepairRaft={handleRepairRaft}
          onCookStew={handleCookStew}
          onCraftConsumable={handleCraftConsumable}
          onUpgradeRaft={handleUpgradeRaft}
          onUnlockWarshipPassive={handleUnlockWarshipPassive}
          onUnlockNuclearShield={handleUnlockNuclearShield}
          onCraftRadiationSuit={handleCraftRadiationSuit}
          onBuildShipRadio={handleBuildShipRadio}
          onBrewAlcohol={handleBrewAlcohol}
          onDrinkAlcohol={handleDrinkAlcohol}
          onBuildOnIsland={handleBuildOnIsland}
          onUpgradeAge={handleUpgradeAge}
          onTrainIslandUnit={handleTrainIslandUnit}
          onResearchAoeTech={handleResearchAoeTech}
          onRepairStructures={handleRepairStructures}
          onFoundSettlement={handleFoundSettlement}
          onUpgradeSettlement={handleUpgradeSettlement}
          onDesignateHqIsland={handleDesignateHqIsland}
          onSaveCheckpoint={() => saveCheckpoint()}
          onDeclareIslandWar={handleDeclareIslandWar}
          onKingdomAction={handleKingdomAction}
          onFoundOrUpgradeClan={handleFoundOrUpgradeClan}
          onUnlockClanPerk={handleUnlockClanPerk}
          onClanAction={handleClanAction}
          onVillageAction={handleVillageAction}
          onTrade={handleTrade}
          onRecruitOrUpgradeSurvivor={handleRecruitOrUpgradeSurvivor}
          onToggleRelic={handleToggleRelic}
          onSelectTitle={handleSelectTitle}
          onToggleDonorSkin={handleToggleDonorSkin}
          onRomanceAction={handleRomanceAction}
          onHaveChild={handleHaveChild}
          onSendChildMission={handleSendChildMission}
          onBuildFarmPlot={handleBuildFarmPlot}
          onPlantCrop={handlePlantCrop}
          onWaterPlot={handleWaterPlot}
          onEatVeg={handleEatVeg}
          onCookGreenStew={handleCookGreenStew}
          onFeedCaptiveAnimal={handleFeedCaptiveAnimal}
          onBreedCaptiveAnimal={handleBreedCaptiveAnimal}
          onTalkToNpc={handleOpenNpcChat}
          onOpenWorldNpc={(npc) => {
            setDrawerOpen(false);
            setActiveMerchantNpc(npc);
          }}
        />

        {!drawerOpen && !introUi.active && mode === 'PLAYING' && (
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            style={{ top: `${layoutPlan.drawerBtnTopPx}px` }}
            className="absolute right-0 z-20 px-2 py-2.5 rounded-l-lg bg-[#081a2b]/45 hover:bg-[#102d47]/90 border border-r-0 border-[#285175]/60 text-amber-300 text-xs font-bold shadow-md backdrop-blur-[2px] opacity-45 hover:opacity-95 transition-opacity cursor-pointer flex items-center gap-1"
            title="Desplegar menú lateral (Tab)"
          >
            <Shield className="w-3.5 h-3.5" />
          </button>
        )}

        <GameOverlay
          mode={mode}
          state={uiState}
          hasSave={hasSave}
          onStartNew={startNewGame}
          onContinue={continueGame}
          onResume={() => setMode('PLAYING')}
          onRestart={startNewGame}
          onSaveGame={handleSaveGame}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenAccount={() => setAccountOpen(true)}
          onChangeDifficulty={handleChangeDifficulty}
          onToggleSound={() => {
            stateRef.current.sound = !stateRef.current.sound;
            saveState(stateRef.current);
            syncUi();
          }}
          onChangeLanguage={(lang) => handleChangeLanguage(lang)}
          onRespawnCheckpoint={handleRespawnAtCheckpoint}
          onBuyExtraLifeBreB={() => {
            setDonationPurpose('extra_life');
            setDonationOpen(true);
          }}
          onOpenDonations={() => {
            setDonationPurpose('donation');
            setDonationOpen(true);
          }}
          onOpenCredits={() => setCreditsOpen(true)}
          onOpenInstall={() => setInstallOpen(true)}
          isFullscreen={fullscreen.isFullscreen}
          fullscreenSupported={fullscreen.supported}
          onToggleFullscreen={() => void fullscreen.toggle()}
        />
      </main>

      <DestinyTreeModal
        open={destinyModalOpen}
        state={uiState}
        onClose={() => setDestinyModalOpen(false)}
        onUnlockNode={handleUnlockDestinyNode}
      />

      <NewspaperModal
        open={newspaperOpen}
        state={uiState}
        aiLoading={newsAiLoading}
        aiError={newsAiError}
        onGenerateAiEdition={() => void generateAiNewspaperForDay(stateRef.current.dayCount)}
        onClose={() => setNewspaperOpen(false)}
        onHuntBounty={handleHuntBounty}
      />

      <ProfileLeaderboardModal
        open={profileOpen}
        state={uiState}
        leaderboard={leaderboard}
        loading={leaderboardLoading}
        isOnline={isOnline}
        lastSyncedAt={lastSyncedAt}
        pendingSync={pendingSync}
        onClose={() => setProfileOpen(false)}
        onSaveProfile={handleSaveProfile}
        onRefreshLeaderboard={() => syncLeaderboard(true)}
        onOpenCredits={() => setCreditsOpen(true)}
      />

      <CreditsModal
        open={creditsOpen}
        onClose={() => setCreditsOpen(false)}
        onOpenDonations={() => {
          setDonationPurpose('donation');
          setDonationOpen(true);
        }}
      />

      <DonationModal
        open={donationOpen}
        purpose={donationPurpose}
        defaultDonorName={uiState.playerProfile.name}
        donorUnlocked={uiState.donorUnlocked}
        donorSkinEnabled={uiState.donorSkinEnabled}
        onToggleDonorSkin={handleToggleDonorSkin}
        onClose={() => setDonationOpen(false)}
        onDonationRecorded={(amountCop, donorName) => {
          const s = stateRef.current;
          s.donorUnlocked = true;
          s.donorSkinEnabled = true;
          saveDonorUnlocked(true);
          if (!s.unlockedTitles.includes('title_mecenas_cenizas')) {
            s.unlockedTitles.push('title_mecenas_cenizas');
          }
          s.activeTitleId = 'title_mecenas_cenizas';
          s.maxHp = computeEffectiveMaxHp(s);
          s.hp = Math.min(s.maxHp, s.hp + 25);

          if (donationPurpose === 'extra_life') {
            s.extraLivesPurchased = (s.extraLivesPurchased || 0) + 1;
            saveState(s);
            syncUi();
            syncLeaderboard(false);
            sfx.levelUp(s.sound);
            setDonationOpen(false);
            showToast(
              `❤️ ¡+1 Vida Extra activada (${getRemainingLives(s)} disponible) y Apariencia de Mecenas desbloqueada!`
            );
            return;
          }

          saveState(s);
          syncUi();
          syncLeaderboard(false);
          sfx.levelUp(s.sound);
          showToast(
            `¡Gracias ${donorName} ($${amountCop.toLocaleString('es-CO')} COP)! Desbloqueaste Apariencia de Mecenas y Título Exclusivo`
          );
        }}
      />

      <StoryMissionsModal
        open={storyOpen}
        canStartMissions={mode === 'PLAYING' || mode === 'PAUSED'}
        state={uiState}
        onClose={() => setStoryOpen(false)}
        onStartMission={handleStartStoryMission}
        onResolveChoice={handleResolveStoryChoice}
      />

      <StoryDilemmaPopup
        missionId={pendingDilemmaId}
        onResolveChoice={handleResolveStoryChoice}
        onDefer={() => setPendingDilemmaId(null)}
      />

      <PausedDialogueOverlay
        queue={dialogueQueue}
        onNext={handleNextPausedDialogue}
        onSkipAll={() => setDialogueQueue([])}
      />

      <NpcChatModal
        session={npcChatSession}
        state={uiState}
        onSelectChoice={handleSelectNpcChoice}
        onSendFreeMessage={handleSendFreeNpcMessage}
        onToggleAiMode={handleToggleNpcAiMode}
        onNextStep={handleNextNpcStep}
        onClose={() => updateNpcChatSession(null)}
      />

      <WorldMapModal
        open={worldMapOpen}
        state={uiState}
        player={playerRef.current}
        raft={raftRef.current}
        islands={islandsRef.current}
        enemies={enemiesRef.current}
        worldNpcs={worldNpcsRef.current}
        onSetWaypoint={(wp) => {
          stateRef.current.customWaypoint = wp;
          saveState(stateRef.current);
          syncUi();
          showToast(wp ? `📍 Ruta fijada: ${wp.label}` : 'Marca de ruta eliminada');
        }}
        onClose={() => setWorldMapOpen(false)}
      />

      <SettingsModal
        open={settingsOpen}
        sound={uiState.sound}
        language={uiState.language || 'es'}
        settings={uiState.settings}
        gamepadConnected={gamepad.connected}
        isFullscreen={fullscreen.isFullscreen}
        fullscreenSupported={fullscreen.supported}
        onToggleFullscreen={() => void fullscreen.toggle()}
        onClose={() => setSettingsOpen(false)}
        onToggleSound={() => {
          stateRef.current.sound = !stateRef.current.sound;
          saveState(stateRef.current);
          syncUi();
        }}
        onChangeLanguage={(lang) => {
          if (lang === 'es' || lang === 'en') handleChangeLanguage(lang);
        }}
        onChangeSettings={handleChangeSettings}
        onResetSettings={handleResetSettings}
      />

      <AccountModal
        open={accountOpen}
        state={uiState}
        onClose={() => setAccountOpen(false)}
        onSyncAccountProfile={(captainName, country, profileId) => {
          const s = stateRef.current;
          s.playerProfile.name = captainName;
          s.playerProfile.country = country;
          if (profileId) s.playerProfile.id = profileId;
          saveProfile(s.playerProfile);
          saveState(s);
          syncUi();
          syncLeaderboard(true);
        }}
        onLoadCloudSave={(saveData) => {
          const merged = mergeLoadedState(saveData as Partial<PersistentState>);
          stateRef.current = merged;
          saveState(merged);
          resetWorldEntities();
          syncUi();
          setHasSave(true);
          showToast('☁️ Partida cargada desde la nube');
        }}
        onNotify={(text) => showToast(text)}
      />

      <NpcMerchantModal
        npc={activeMerchantNpc}
        state={uiState}
        player={playerRef.current}
        onClose={() => setActiveMerchantNpc(null)}
        onForgeWeapon={handleNpcForgeWeapon}
        onTradeAction={handleNpcTradeAction}
        onOpenChat={(npc) => {
          setActiveMerchantNpc(null);
          handleOpenNpcChat(npc.id, npc.name);
        }}
      />

      <InstallAppModal open={installOpen} onClose={() => setInstallOpen(false)} />
      <OfflineIndicator />
    </div>
  );
}
