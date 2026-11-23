import { DESTINY_MAP, SURVIVORS_CATALOG } from './destinyTree';
import { createInitialVitals } from './needsAndPsychology';
import { createInitialNpcMoods } from './npcConversations';
import { RELIC_MAP } from './relics';
import {
  INITIAL_ACQUAINTANCES,
  INITIAL_PIRATE_BOUNTIES,
  KINGDOMS_CATALOG,
  RIVAL_CLANS_CATALOG,
  TITLE_MAP,
  generateDailyNewsArticles,
} from './socialAndKingdoms';
import { createInitialStoryMissions } from './storyMissions';
import type {
  DeathCauseRecord,
  DifficultyLevel,
  GameSettings,
  PersistentState,
  PlayerEntity,
  PlayerProfile,
  ResourceBag,
  ResourceKey,
  SurvivorId,
  WarshipPassiveDef,
  WeaponDef,
  WorldEventLogItem,
} from './types';

export const SAVE_KEY = 'marea_mutante_v6_save';
export const PROFILE_KEY = 'marea_mutante_profile_v1';
export const DONOR_PERK_KEY = 'marea_mutante_donor_v1';
export const MAX_FREE_DEATHS = 5;

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  hudScale: 1,
  joystickScale: 1,
  joystickOpacity: 0.72,
  actionBtnScale: 1,
  orientationPref: 'auto',
  twinStickMobile: false,
  autoFullscreen: true,
};

export interface DifficultyDef {
  id: DifficultyLevel;
  label: string;
  badgeColor: string;
  enemyHpMult: number;
  enemyDmgMult: number;
  enemySpeedMult: number;
  spawnRateMult: number;
  maxConcurrentBonus: number;
  resourceMult: number;
  xpFameMult: number;
  fragLuckBonus: number;
  graceDays: number;
  description: string;
}

export const DIFFICULTY_CATALOG: DifficultyDef[] = [
  {
    id: 'calma',
    label: 'Calma',
    badgeColor: '#34d399',
    enemyHpMult: 0.72,
    enemyDmgMult: 0.65,
    enemySpeedMult: 0.9,
    spawnRateMult: 0.72,
    maxConcurrentBonus: -2,
    resourceMult: 1.35,
    xpFameMult: 0.85,
    fragLuckBonus: 0,
    graceDays: 3,
    description: 'Marea dócil, 3 días de tregua inicial y abundancia de recursos.',
  },
  {
    id: 'superviviente',
    label: 'Superviviente',
    badgeColor: '#38bdf8',
    enemyHpMult: 1.0,
    enemyDmgMult: 1.0,
    enemySpeedMult: 1.0,
    spawnRateMult: 1.0,
    maxConcurrentBonus: 0,
    resourceMult: 1.0,
    xpFameMult: 1.0,
    fragLuckBonus: 0.02,
    graceDays: 2,
    description: 'Balance clásico de Marea Mutante: 2 días de tregua y progresión estándar.',
  },
  {
    id: 'pesadilla',
    label: 'Pesadilla',
    badgeColor: '#f59e0b',
    enemyHpMult: 1.35,
    enemyDmgMult: 1.28,
    enemySpeedMult: 1.08,
    spawnRateMult: 1.25,
    maxConcurrentBonus: 2,
    resourceMult: 0.95,
    xpFameMult: 1.25,
    fragLuckBonus: 0.06,
    graceDays: 2,
    description: 'Semi-Bosses abisales frecuentes, olas hostiles y +25% XP/Fama.',
  },
  {
    id: 'abismo',
    label: 'Abismo',
    badgeColor: '#a855f7',
    enemyHpMult: 1.75,
    enemyDmgMult: 1.55,
    enemySpeedMult: 1.15,
    spawnRateMult: 1.48,
    maxConcurrentBonus: 4,
    resourceMult: 0.9,
    xpFameMult: 1.55,
    fragLuckBonus: 0.12,
    graceDays: 1,
    description: 'Solo 1 día de tregua, Bosses Abismales constantes y mayor botín de fragmentos.',
  },
  {
    id: 'infernal',
    label: 'Infernal',
    badgeColor: '#f43f5e',
    enemyHpMult: 2.35,
    enemyDmgMult: 2.0,
    enemySpeedMult: 1.22,
    spawnRateMult: 1.75,
    maxConcurrentBonus: 6,
    resourceMult: 0.85,
    xpFameMult: 2.1,
    fragLuckBonus: 0.22,
    graceDays: 1,
    description: 'Modo extremo: hordas letales, jefes abisales implacables y x2.1 XP/Fama.',
  },
];

export function getDifficultyModifiers(diff?: DifficultyLevel): DifficultyDef {
  return DIFFICULTY_CATALOG.find((d) => d.id === diff) || DIFFICULTY_CATALOG[1];
}

export const WARSHIP_PASSIVES_CATALOG: WarshipPassiveDef[] = [
  {
    id: 'wp_blindaje_titanio',
    name: 'Casco Reactivo de Titanio',
    description: 'Placas dobles que amortiguan embestidas de flotas y monstruos gigantes.',
    bonusText: '+180 HP máx del Buque · -25% daño al casco',
    minRaftLevel: 7,
    cost: { hie: 10, tit: 6, mad: 14 },
  },
  {
    id: 'wp_torretas_dobles',
    name: 'Matriz Automática de Artillería',
    description: 'Sincroniza las torretas del Buque para disparar con mayor cadencia y daño.',
    bonusText: '+30% cadencia y daño de torretas navales',
    minRaftLevel: 7,
    cost: { tec: 4, hie: 8, oro: 10 },
  },
  {
    id: 'wp_cubierta_tripulacion',
    name: 'Cubierta Táctica de Tripulación',
    description: 'Estaciones blindadas de fuego para que toda la tripulación ataque más rápido.',
    bonusText: '+22% daño y velocidad de ataque de la tripulación',
    minRaftLevel: 7,
    cost: { mad: 16, oro: 12, alc: 4 },
  },
  {
    id: 'wp_turbina_hidro',
    name: 'Turbinas Hidrodinámicas',
    description: 'Hélice reforzada de buque pesado para surcar tormentas a máxima velocidad.',
    bonusText: '+24% velocidad del Buque de Guerra',
    minRaftLevel: 7,
    cost: { tec: 5, car: 10, tit: 4 },
  },
  {
    id: 'wp_anti_radiacion',
    name: 'Purificador de Núcleo',
    description: 'Filtros internos que disipan radiación ambiental y reparan grietas lentamente.',
    bonusText: '-50% radiación recibida · +1.5 HP/s reparación de casco',
    minRaftLevel: 7,
    cost: { tec: 6, cri: 3, nuc_frag: 2 },
  },
];

export function hasWarshipPassive(state: PersistentState, id: string): boolean {
  return state.raft.level >= 7 && Array.isArray(state.warshipPassives) && state.warshipPassives.includes(id);
}

export interface AoeAgeDef {
  tier: 1 | 2 | 3 | 4;
  name: string;
  subtitle: string;
  cost: Partial<ResourceBag>;
  bonusText: string;
}

export const AOE_AGES_CATALOG: AoeAgeDef[] = [
  {
    tier: 1,
    name: 'Edad I · Madera y Refugio',
    subtitle: 'Asentamientos básicos, casas y recolección inicial.',
    cost: {},
    bonusText: 'Desbloquea Casas, Molinos y Empalizadas.',
  },
  {
    tier: 2,
    name: 'Edad II · Hierro y Pólvora',
    subtitle: 'Forjas militares, cuarteles y torres de vigilancia.',
    cost: { mad: 18, hie: 10, oro: 8 },
    bonusText: '+20% HP a muros/edificios · Desbloquea Cuartel y Herrería.',
  },
  {
    tier: 3,
    name: 'Edad III · Era Imperial',
    subtitle: 'Mercados navales, muelles de patrulla y tropas blindadas.',
    cost: { mad: 24, hie: 16, tit: 6, oro: 18 },
    bonusText: '+30% ataque de guardias · Desbloquea Muelle Patrulla y Mercado.',
  },
  {
    tier: 4,
    name: 'Edad IV · Era Nuclear',
    subtitle: 'Complejos atómicos, reactores y armamento supremo.',
    cost: { hie: 22, tit: 14, tec: 10, cri: 6, oro: 28 },
    bonusText: 'Habilita Laboratorio/Reactor Nuclear y máxima capacidad poblacional.',
  },
];

export interface AoeBuildingDef {
  kind: PersistentState['islandStructures'][number]['kind'];
  name: string;
  minAge: 1 | 2 | 3 | 4;
  maxHp: number;
  popBonus?: number;
  cost: Partial<ResourceBag>;
  description: string;
}

export const AOE_BUILDINGS_CATALOG: AoeBuildingDef[] = [
  {
    kind: 'house',
    name: 'Casa Isleña',
    minAge: 1,
    maxHp: 220,
    popBonus: 4,
    cost: { mad: 8, cht: 3 },
    description: '+4 Población máxima para entrenar aldeanos y guardias.',
  },
  {
    kind: 'mill',
    name: 'Molino de Víveres',
    minAge: 1,
    maxHp: 260,
    cost: { mad: 10, cht: 4, veg: 2 },
    description: 'Produce Cultivos y Agua automáticamente cada ciclo.',
  },
  {
    kind: 'wall',
    name: 'Muralla Fortificada',
    minAge: 1,
    maxHp: 560,
    cost: { mad: 8, hie: 6 },
    description: 'Bloquea y daña enemigos terrestres; alta resistencia.',
  },
  {
    kind: 'barracks',
    name: 'Cuartel Militar',
    minAge: 2,
    maxHp: 380,
    cost: { mad: 14, hie: 8, oro: 4 },
    description: 'Entrena Guardias armados que patrullan y defienden la isla.',
  },
  {
    kind: 'blacksmith',
    name: 'Herrería de Guerra',
    minAge: 2,
    maxHp: 340,
    cost: { mad: 10, hie: 10, car: 4 },
    description: 'Investiga tecnologías de acero, murallas y pólvora.',
  },
  {
    kind: 'watchtower',
    name: 'Atalaya de Artillería',
    minAge: 2,
    maxHp: 360,
    cost: { mad: 12, hie: 8, cht: 6 },
    description: 'Torre alta de largo alcance contra piratas y zombis.',
  },
  {
    kind: 'market',
    name: 'Mercado Real',
    minAge: 3,
    maxHp: 320,
    cost: { mad: 14, oro: 10, hie: 6 },
    description: 'Genera Oro pasivo y mejora los trueques mercantes.',
  },
  {
    kind: 'patrol_dock',
    name: 'Muelle de Patrulla',
    minAge: 3,
    maxHp: 400,
    cost: { mad: 16, hie: 10, tit: 4 },
    description: 'Despliega Barcos Patrulla aliados alrededor de tu isla.',
  },
  {
    kind: 'forge_gate',
    name: 'Portón Forja del Alba',
    minAge: 1,
    maxHp: 520,
    cost: { mad: 14, hie: 8, cht: 6, oro: 3 },
    description: 'Se alza sobre tu posición en la isla con yunque rúnico y Forjador residente para crear armas épicas, legendarias y divinas.',
  },
];

export interface AoeTechDef {
  id: string;
  name: string;
  minAge: 1 | 2 | 3 | 4;
  cost: Partial<ResourceBag>;
  bonusText: string;
}

export const AOE_TECHS_CATALOG: AoeTechDef[] = [
  {
    id: 'forja_hierro',
    name: 'Forja de Acero Templado',
    minAge: 2,
    cost: { hie: 8, car: 6, oro: 6 },
    bonusText: '+30% daño de Guardias y Aldeanos defensores.',
  },
  {
    id: 'ingenieria_muralla',
    name: 'Albañilería Reforzada',
    minAge: 2,
    cost: { mad: 14, hie: 10 },
    bonusText: '+45% resistencia máxima de Murallas, Refugios y Torres.',
  },
  {
    id: 'tactica_patrulla',
    name: 'Doctrina de Flota Isleña',
    minAge: 3,
    cost: { tit: 6, tec: 4, oro: 12 },
    bonusText: '+35% velocidad y cadencia de Barcos Patrulla y Torretas.',
  },
  {
    id: 'cosecha_imperial',
    name: 'Rotación Agrícola',
    minAge: 3,
    cost: { veg: 8, agu: 8, oro: 8 },
    bonusText: '+50% recolección de Aldeanos y Molinos.',
  },
];

export function getPopulationStats(state: PersistentState): {
  pop: number;
  popCap: number;
  villagers: number;
  farmers: number;
  guards: number;
  patrolShips: number;
} {
  const units = Array.isArray(state.islandUnits) ? state.islandUnits : [];
  const villagers = units.filter((u) => u.kind === 'villager').length;
  const farmers = units.filter((u) => u.kind === 'farmer').length;
  const guards = units.filter((u) => u.kind === 'guard').length;
  const patrolShips = units.filter((u) => u.kind === 'patrol_ship').length;
  const houses = state.islandStructures.filter((s) => s.kind === 'house').length;
  const hqs = state.islandStructures.filter((s) => s.kind === 'hq' || s.kind === 'settlement').length;
  const popCap = Math.min(36, 4 + houses * 4 + hqs * 3 + ((state.ageTier || 1) - 1) * 3);
  return {
    pop: units.length,
    popCap,
    villagers,
    farmers,
    guards,
    patrolShips,
  };
}

export function canFireNuclearWeapon(
  state: PersistentState,
  player: PlayerEntity,
  weapon: WeaponDef | null | undefined
): { allowed: boolean; reason?: string } {
  if (!weapon?.isNuclear) return { allowed: true };
  if (!player.onRaft) {
    return {
      allowed: false,
      reason: 'Las armas nucleares SOLO pueden dispararse a bordo del Buque de Guerra Nuclear.',
    };
  }
  if (state.raft.level < 7) {
    return {
      allowed: false,
      reason: 'Mejora tu balsa hasta Buque de Guerra Nuclear (Nv.7) para usar armamento nuclear.',
    };
  }
  if (!state.nuclearLabBuilt || !state.nuclearReactorBuilt || !state.radiationSuitCrafted || !state.warshipNuclearShield) {
    return {
      allowed: false,
      reason:
        'Requiere cadena nuclear completa: Laboratorio → Reactor Nuclear → Traje Antirradiación → Blindaje Nuclear del Buque.',
    };
  }
  return { allowed: true };
}

export function getRemainingLives(state: PersistentState): number {
  return Math.max(
    0,
    MAX_FREE_DEATHS + (state.extraLivesPurchased || 0) - (state.deathsUsed || 0)
  );
}

export function loadDonorUnlocked(): boolean {
  try {
    return localStorage.getItem(DONOR_PERK_KEY) === '1';
  } catch {
    return false;
  }
}

export function saveDonorUnlocked(unlocked: boolean): void {
  try {
    localStorage.setItem(DONOR_PERK_KEY, unlocked ? '1' : '0');
  } catch {
    // Ignore storage errors
  }
}

export function getRaftHalfSize(raftLevel: number): number {
  return Math.min(205, 72 + (Math.max(1, raftLevel) - 1) * 15);
}

export function getRaftCorralLimit(raftLevel: number): number {
  return Math.min(6, 1 + Math.max(1, raftLevel));
}

export function getIslandCorralLimit(state: PersistentState, islandId: string | null): number {
  if (!islandId) return 6;
  const bases = state.islandStructures.filter(
    (s) => s.islandId === islandId && (s.kind === 'hq' || s.kind === 'shelter' || s.kind === 'warehouse')
  ).length;
  return Math.min(12, 6 + bases * 2);
}

export function loadOrCreateProfile(): PlayerProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (p && typeof p.id === 'string') {
        return {
          id: p.id,
          name: typeof p.name === 'string' && p.name.trim() ? p.name : 'Capitán Náufrago',
          country: typeof p.country === 'string' && p.country ? p.country : 'CO',
          maxScore: typeof p.maxScore === 'number' ? p.maxScore : 0,
        };
      }
    }
  } catch {
    // Ignore
  }
  const hex = Math.random().toString(16).slice(2, 8).toUpperCase();
  const created: PlayerProfile = {
    id: `MM-${hex}`,
    name: 'Capitán Náufrago',
    country: 'CO',
    maxScore: 0,
  };
  saveProfile(created);
  return created;
}

export function saveProfile(profile: PlayerProfile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // Ignore
  }
}

export function computeSurvivalScore(state: PersistentState): number {
  return Math.round(
    state.dayCount * 180 +
      state.level * 140 +
      state.fame +
      state.stats.kills * 25 +
      state.stats.islandsVisited * 90 +
      state.stats.warsWon * 320 +
      (state.stats.bountiesClaimed || 0) * 350 +
      (state.stats.ruinsExplored || 0) * 110 +
      (state.stats.elderLeviathansKilled || 0) * 1800 +
      state.raft.level * 160
  );
}

export function computePlayerBounty(state: PersistentState): number {
  return (
    1500000 +
    state.fame * 85000 +
    state.stats.banditKills * 1200000 +
    state.stats.villagesPillaged * 6500000 +
    state.stats.warsWon * 8000000 +
    (state.stats.bountiesClaimed || 0) * 12000000 +
    (state.stats.elderLeviathansKilled || 0) * 35000000
  );
}

export const RESOURCE_LABELS: Record<ResourceKey, string> = {
  mad: 'Madera',
  cht: 'Chatarra',
  agu: 'Agua',
  pez: 'Pez',
  veg: 'Cultivos',
  gui: 'Guiso',
  oro: 'Oro',
  car: 'Carbón',
  hie: 'Hierro',
  tit: 'Titanio',
  cri: 'Cristal',
  tec: 'Tecnología',
  nuc_frag: 'Frag. Nuclear',
  cel_frag: 'Frag. Celestial',
  alc: 'Alcohol',
  frag_epico: 'Frag. Épico',
  frag_legendario: 'Frag. Legendario',
  frag_divino: 'Frag. Divino',
};

export function logWorldEvent(
  state: PersistentState,
  kind: WorldEventLogItem['kind'],
  text: string
): void {
  if (!Array.isArray(state.recentEventsLog)) {
    state.recentEventsLog = [];
  }
  const trimmed = text.trim();
  if (!trimmed) return;
  const last = state.recentEventsLog[0];
  if (last && last.text === trimmed && last.day === state.dayCount) return;
  state.recentEventsLog.unshift({
    id: `${state.dayCount}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    day: state.dayCount,
    kind,
    text: trimmed,
  });
  if (state.recentEventsLog.length > 26) {
    state.recentEventsLog = state.recentEventsLog.slice(0, 26);
  }
}

export function buildDeathCauseRecord(
  causeKey: 'radiation' | 'needs' | 'animal' | 'leviathan' | 'pirate' | 'enemy' | 'projectile' | 'unknown',
  attackerName?: string,
  day = 1,
  facts?: string[]
): DeathCauseRecord {
  const who = (attackerName || '').trim();
  const baseFacts = facts && facts.length > 0 ? facts : undefined;
  switch (causeKey) {
    case 'radiation':
      return {
        causeKey,
        headline: '☢️ Envenenamiento por Radiación Nuclear',
        causeDetail: 'Tu cuerpo absorbió dosis letales de radiación sin traje antirradiación.',
        sarcasm:
          '¡Brillante jugada abrazar un reactor nuclear en camiseta, manco! Mira el lado positivo: ahora brillas en la oscuridad como faro gratis para los cangrejos.',
        facts: baseFacts,
        aiLoading: true,
        day,
      };
    case 'needs':
      return {
        causeKey,
        headline: '🥀 Colapso Orgánico por Estados Críticos Acumulados',
        causeDetail:
          'Hambre, deshidratación, insomnio y agotamiento mental acumulados terminaron venciendo tu organismo.',
        sarcasm:
          'Tenías océano, destiladores y mochilas, manco... pero elegiste ayuno extremo en pleno apocalipsis. Qué elegancia.',
        facts: baseFacts,
        aiLoading: true,
        day,
      };
    case 'animal':
      return {
        causeKey,
        headline: `🐾 Devorado por ${who || 'Fauna Salvaje'}`,
        causeDetail: `${who || 'Una bestia costeña'} te emboscó en tierra firme y te convirtió en su almuerzo.`,
        sarcasm: `Sobreviviste a tormentas eléctricas para terminar siendo botana gourmet de ${who || 'un bicho isleño'}. Puro nivel de manco legendario.`,
        facts: baseFacts,
        aiLoading: true,
        day,
      };
    case 'leviathan':
      return {
        causeKey,
        headline: `🐋 Triturado por ${who || 'Leviatán Colosal'}`,
        causeDetail: `Un coloso abismal (${who || 'Leviatán'}) aplastó tu posición con fuerza catastrófica.`,
        sarcasm:
          'Intentaste tanquear un monstruo del tamaño de una isla con puro optimismo. Spoiler: los Leviatanes no perdonan mancos.',
        facts: baseFacts,
        aiLoading: true,
        day,
      };
    case 'projectile':
      return {
        causeKey,
        headline: `💥 Impactado por Fuego de ${who || 'Artillería Enemiga'}`,
        causeDetail: `Un disparo directo de ${who || 'un cañón pirata'} perforó tus últimas defensas.`,
        sarcasm:
          'Atrapaste ese proyectil con la cara como todo un profesional. Medalla de oro olímpica en reflejos de tortuga, manco.',
        facts: baseFacts,
        aiLoading: true,
        day,
      };
    case 'pirate':
    case 'enemy':
      return {
        causeKey,
        headline: `⚔️ Abatido en combate por ${who || 'Enemigo Abismal'}`,
        causeDetail: `${who || 'Un adversario marino'} superó tu guardia y acabó con tu racha de supervivencia.`,
        sarcasm: `${who || 'Tu verdugo'} acaba de colgar tu sombrero como trofeo. Ánimo manco: la próxima intenta esquivar con la pantalla encendida.`,
        facts: baseFacts,
        aiLoading: true,
        day,
      };
    default:
      return {
        causeKey: 'unknown',
        headline: '💀 Tragado por la Marea Mutante',
        causeDetail: 'El océano reclamó tu vida tras acumular heridas mortales.',
        sarcasm:
          'Bueno, al menos moriste haciendo lo que amabas: ignorar el peligro y pasearte como manco en medio del fin del mundo.',
        facts: baseFacts,
        aiLoading: true,
        day,
      };
  }
}

export function initState(): PersistentState {
  const profile = loadOrCreateProfile();
  const state: PersistentState = {
    hp: 120,
    maxHp: 120,
    st: 100,
    maxSt: 100,
    level: 1,
    xp: 0,
    nextXp: 85,
    fame: 35,
    bounty: 4500000,
    dayCount: 1,
    elapsedSeconds: 0,
    stealthTimer: 0,
    sound: true,
    language: 'es',
    difficulty: 'superviviente',
    settings: { ...DEFAULT_GAME_SETTINGS },
    magicUnlocked: false,
    nuclearLabBuilt: false,
    nuclearReactorBuilt: false,
    radiationSuitCrafted: false,
    warshipNuclearShield: false,
    shipRadioBuilt: false,
    warshipPassives: [],
    radiationExposure: 0,
    hangoverTimer: 0,
    jammedTimer: 0,
    playerProfile: profile,
    checkpoint: {
      x: 0,
      y: 0,
      raftX: 0,
      raftY: 0,
      islandId: null,
      label: 'Fondeadero Inicial',
      savedDay: 1,
    },
    newspaper: {
      edition: 1,
      unread: true,
      lastDayPublished: 1,
      articles: [],
    },
    pirateBounties: INITIAL_PIRATE_BOUNTIES.map((b) => ({ ...b })),
    resources: {
      mad: 12,
      cht: 6,
      agu: 5,
      pez: 2,
      veg: 3,
      gui: 1,
      oro: 4,
      car: 2,
      hie: 2,
      tit: 0,
      cri: 0,
      tec: 0,
      nuc_frag: 0,
      cel_frag: 0,
      alc: 1,
      frag_epico: 0,
      frag_legendario: 0,
      frag_divino: 0,
    },
    consumables: {
      repelente: 1,
      hamaca: 1,
    },
    ownedWeapons: ['lanza_madera', 'machete_oxidado'],
    hotbar: ['lanza_madera', 'machete_oxidado', '', '', ''],
    equippedSlot: 0,
    craftedTech: [],
    farmPlots: [],
    captiveAnimals: [],
    relicsOwned: [],
    equippedRelics: [],
    islandStructures: [],
    ageTier: 1,
    islandUnits: [],
    aoeUpgrades: [],
    hqIslandId: null,
    hqIslandName: null,
    activeTitleId: loadDonorUnlocked() ? 'title_mecenas_cenizas' : 'title_naufrago',
    unlockedTitles: loadDonorUnlocked()
      ? ['title_naufrago', 'title_mecenas_cenizas']
      : ['title_naufrago'],
    donorUnlocked: loadDonorUnlocked(),
    donorSkinEnabled: loadDonorUnlocked(),
    storyMissions: createInitialStoryMissions(),
    activeStoryMissionId: null,
    kingdoms: KINGDOMS_CATALOG.map((k) => ({
      id: k.id,
      relation: k.id === 'escarlata' ? -60 : k.id === 'coralia' ? 25 : 10,
      atWar: false,
      conquered: false,
    })),
    clan: {
      founded: false,
      name: 'Clan Marea Libre',
      tag: 'MAREA',
      level: 1,
      members: 1,
      perks: [],
      rivals: RIVAL_CLANS_CATALOG.map((c) => ({ ...c })),
    },
    acquaintances: INITIAL_ACQUAINTANCES.map((a) => ({ ...a })),
    family: {
      affection: {},
      partnerId: null,
      married: false,
      children: [],
    },
    pillagedVillages: [],
    raft: {
      level: 1,
      turretLevel: 0,
      distillerLevel: 1,
      solarLevel: 1,
      engineLevel: 1,
      missileLevel: 0,
      shieldLevel: 0,
      droneLevel: 0,
      hp: 200,
      maxHp: 200,
      damagedMode: false,
    },
    survivors: SURVIVORS_CATALOG.map((s) => ({
      id: s.id,
      unlocked: s.id === 'vega',
      level: 1,
    })),
    destinyUnlocked: ['aprendiz_mar'],
    achievementsUnlocked: [],
    stats: {
      kills: 0,
      banditKills: 0,
      islandsVisited: 0,
      chestsOpened: 0,
      warsWon: 0,
      islandWarsWon: 0,
      villagesPillaged: 0,
      villagesTraded: 0,
      stolenRecovered: 0,
      bountiesClaimed: 0,
      ruinsExplored: 0,
      elderLeviathansKilled: 0,
      celestialForged: 0,
      radiosBuilt: 0,
    },
    discoveredIslands: [],
    swallowedIslands: [],
    deathsUsed: 0,
    discoveredMysteries: [],
    customWaypoint: null,
    extraLivesPurchased: 0,
    tutorialStep: 0,
    tutorialDismissed: false,
    vitals: createInitialVitals(),
    npcMoods: createInitialNpcMoods(),
    npcChatHistory: {},
    discoveredWorldNpcs: [],
    lastDeathCause: null,
    recentEventsLog: [],
    vegaMarried: false,
    marineThreat: 10,
    worldGovDecree: 'Decreto I: Control Costero de la Marina',
  };
  state.newspaper.articles = generateDailyNewsArticles(state, 'despejado', 1);
  return state;
}

export function hasSavedProgress(): boolean {
  try {
    return Boolean(localStorage.getItem(SAVE_KEY));
  } catch {
    return false;
  }
}

export function loadState(): PersistentState {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return initState();
    const d = JSON.parse(raw);
    return mergeLoadedState(d);
  } catch {
    return initState();
  }
}

export function mergeLoadedState(d: Record<string, any>): PersistentState {
  const base = initState();
  const profile = loadOrCreateProfile();
  const merged: PersistentState = {
    ...base,
    ...d,
    hp: typeof d.hp === 'number' && d.hp > 0 ? d.hp : base.hp,
    bounty: typeof d.bounty === 'number' ? d.bounty : base.bounty,
    language: d.language === 'en' ? 'en' : 'es',
    difficulty:
      d.difficulty === 'calma' ||
      d.difficulty === 'superviviente' ||
      d.difficulty === 'pesadilla' ||
      d.difficulty === 'abismo' ||
      d.difficulty === 'infernal'
        ? d.difficulty
        : 'superviviente',
    settings: { ...DEFAULT_GAME_SETTINGS, ...(d.settings || {}) },
    magicUnlocked: Boolean(d.magicUnlocked),
    nuclearLabBuilt: Boolean(d.nuclearLabBuilt),
    nuclearReactorBuilt: Boolean(d.nuclearReactorBuilt),
    radiationSuitCrafted: Boolean(d.radiationSuitCrafted),
    warshipNuclearShield: Boolean(d.warshipNuclearShield),
    shipRadioBuilt: Boolean(d.shipRadioBuilt),
    warshipPassives: Array.isArray(d.warshipPassives) ? d.warshipPassives : [],
    radiationExposure: typeof d.radiationExposure === 'number' ? d.radiationExposure : 0,
    hangoverTimer: typeof d.hangoverTimer === 'number' ? d.hangoverTimer : 0,
    jammedTimer: typeof d.jammedTimer === 'number' ? d.jammedTimer : 0,
    playerProfile: {
      ...profile,
      ...(d.playerProfile || {}),
      id: d.playerProfile?.id || profile.id,
      maxScore: Math.max(profile.maxScore, d.playerProfile?.maxScore || 0),
    },
    checkpoint: d.checkpoint || base.checkpoint,
    newspaper: d.newspaper && Array.isArray(d.newspaper.articles) ? d.newspaper : base.newspaper,
    pirateBounties: Array.isArray(d.pirateBounties)
      ? base.pirateBounties.map((pb) => {
          const found = d.pirateBounties.find((x: { id: string }) => x.id === pb.id);
          return found ? { ...pb, ...found } : pb;
        })
      : base.pirateBounties,
    resources: { ...base.resources, ...(d.resources || {}) },
    consumables: { ...base.consumables, ...(d.consumables || {}) },
    raft: { ...base.raft, ...(d.raft || {}) },
    stats: { ...base.stats, ...(d.stats || {}) },
    craftedTech: Array.isArray(d.craftedTech) ? d.craftedTech : [],
    farmPlots: Array.isArray(d.farmPlots) ? d.farmPlots : [],
    captiveAnimals: Array.isArray(d.captiveAnimals) ? d.captiveAnimals : [],
    relicsOwned: Array.isArray(d.relicsOwned) ? d.relicsOwned : [],
    equippedRelics: Array.isArray(d.equippedRelics) ? d.equippedRelics.slice(0, 3) : [],
    islandStructures: Array.isArray(d.islandStructures) ? d.islandStructures : [],
    ageTier:
      d.ageTier === 2 || d.ageTier === 3 || d.ageTier === 4 ? d.ageTier : 1,
    islandUnits: Array.isArray(d.islandUnits) ? d.islandUnits : [],
    aoeUpgrades: Array.isArray(d.aoeUpgrades) ? d.aoeUpgrades : [],
    hqIslandId: typeof d.hqIslandId === 'string' ? d.hqIslandId : null,
    hqIslandName: typeof d.hqIslandName === 'string' ? d.hqIslandName : null,
    donorUnlocked: Boolean(d.donorUnlocked) || loadDonorUnlocked(),
    donorSkinEnabled:
      typeof d.donorSkinEnabled === 'boolean'
        ? d.donorSkinEnabled
        : Boolean(d.donorUnlocked) || loadDonorUnlocked(),
    activeTitleId: typeof d.activeTitleId === 'string' ? d.activeTitleId : base.activeTitleId,
    unlockedTitles: Array.from(
      new Set([
        'title_naufrago',
        ...(Array.isArray(d.unlockedTitles) ? d.unlockedTitles : []),
        ...(Boolean(d.donorUnlocked) || loadDonorUnlocked() ? ['title_mecenas_cenizas'] : []),
      ])
    ),
    storyMissions: Array.isArray(d.storyMissions)
      ? base.storyMissions.map((bm) => {
          const found = d.storyMissions.find((x: { id: string }) => x.id === bm.id);
          return found ? { ...bm, ...found } : bm;
        })
      : base.storyMissions,
    activeStoryMissionId:
      typeof d.activeStoryMissionId === 'string' ? d.activeStoryMissionId : null,
    kingdoms: Array.isArray(d.kingdoms)
      ? base.kingdoms.map((bk) => {
          const found = d.kingdoms.find((x: { id: string }) => x.id === bk.id);
          return found ? { ...bk, ...found } : bk;
        })
      : base.kingdoms,
    clan: d.clan
      ? {
          ...base.clan,
          ...d.clan,
          perks: Array.isArray(d.clan.perks) ? d.clan.perks : [],
          rivals: Array.isArray(d.clan.rivals)
            ? base.clan.rivals.map((rc) => {
                const found = d.clan.rivals.find((x: { id: string }) => x.id === rc.id);
                return found ? { ...rc, ...found } : rc;
              })
            : base.clan.rivals,
        }
      : base.clan,
    acquaintances: Array.isArray(d.acquaintances)
      ? base.acquaintances.map((ba) => {
          const found = d.acquaintances.find((x: { id: string }) => x.id === ba.id);
          return found ? { ...ba, ...found } : ba;
        })
      : base.acquaintances,
    family: d.family
      ? {
          affection: d.family.affection || {},
          partnerId: d.family.partnerId || null,
          married: Boolean(d.family.married),
          children: Array.isArray(d.family.children) ? d.family.children : [],
        }
      : base.family,
    pillagedVillages: Array.isArray(d.pillagedVillages) ? d.pillagedVillages : [],
    survivors: Array.isArray(d.survivors)
      ? base.survivors.map((bs) => {
          const found = d.survivors.find((x: { id: string }) => x.id === bs.id);
          return found ? { ...bs, ...found } : bs;
        })
      : base.survivors,
    ownedWeapons:
      Array.isArray(d.ownedWeapons) && d.ownedWeapons.length > 0
        ? d.ownedWeapons
        : base.ownedWeapons,
    hotbar: Array.isArray(d.hotbar) && d.hotbar.length === 5 ? d.hotbar : base.hotbar,
    destinyUnlocked: Array.isArray(d.destinyUnlocked)
      ? Array.from(new Set(['aprendiz_mar', ...d.destinyUnlocked]))
      : base.destinyUnlocked,
    achievementsUnlocked: Array.isArray(d.achievementsUnlocked) ? d.achievementsUnlocked : [],
    discoveredIslands: Array.isArray(d.discoveredIslands) ? d.discoveredIslands : [],
    swallowedIslands: Array.isArray(d.swallowedIslands) ? d.swallowedIslands : [],
    discoveredMysteries: Array.isArray(d.discoveredMysteries) ? d.discoveredMysteries : [],
    customWaypoint:
      d.customWaypoint &&
      typeof d.customWaypoint.x === 'number' &&
      typeof d.customWaypoint.y === 'number'
        ? {
            x: d.customWaypoint.x,
            y: d.customWaypoint.y,
            label: String(d.customWaypoint.label || 'Marca Personal').slice(0, 48),
          }
        : null,
    deathsUsed: typeof d.deathsUsed === 'number' ? Math.max(0, d.deathsUsed) : 0,
    extraLivesPurchased:
      typeof d.extraLivesPurchased === 'number' ? Math.max(0, d.extraLivesPurchased) : 0,
    tutorialStep: typeof d.tutorialStep === 'number' ? Math.max(0, d.tutorialStep) : 0,
    tutorialDismissed: Boolean(d.tutorialDismissed),
    vitals: d.vitals ? { ...base.vitals, ...d.vitals } : base.vitals,
    npcMoods: d.npcMoods ? { ...base.npcMoods, ...d.npcMoods } : base.npcMoods,
    npcChatHistory:
      d.npcChatHistory && typeof d.npcChatHistory === 'object' ? d.npcChatHistory : {},
    discoveredWorldNpcs: Array.isArray(d.discoveredWorldNpcs) ? d.discoveredWorldNpcs : [],
    lastDeathCause: d.lastDeathCause || null,
    recentEventsLog: Array.isArray(d.recentEventsLog) ? d.recentEventsLog : [],
    vegaMarried: Boolean(d.vegaMarried),
    marineThreat: typeof d.marineThreat === 'number' ? Math.max(0, Math.min(100, d.marineThreat)) : 10,
    worldGovDecree:
      typeof d.worldGovDecree === 'string' && d.worldGovDecree
        ? d.worldGovDecree
        : base.worldGovDecree,
  };
  return merged;
}

export function saveState(state: PersistentState): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors
  }
}

export function clearSavedState(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // Ignore
  }
}

export function canAfford(bag: ResourceBag, cost?: Partial<ResourceBag>): boolean {
  if (!cost) return true;
  return (Object.keys(cost) as ResourceKey[]).every((k) => (bag[k] || 0) >= (cost[k] || 0));
}

export function spendResources(bag: ResourceBag, cost?: Partial<ResourceBag>): void {
  if (!cost) return;
  for (const k of Object.keys(cost) as ResourceKey[]) {
    bag[k] = Math.max(0, (bag[k] || 0) - (cost[k] || 0));
  }
}

export function hasDestiny(state: PersistentState, id: string): boolean {
  return state.destinyUnlocked.includes(id);
}

export function getSurvivorLevel(state: PersistentState, id: SurvivorId): number {
  const found = state.survivors.find((s) => s.id === id);
  return found && found.unlocked ? found.level : 0;
}

export function getTitleTotals(state: PersistentState) {
  const t = TITLE_MAP[state.activeTitleId];
  return {
    hpBonus: t?.hpBonus || 0,
    meleeBonus: t?.meleeBonus || 0,
    rangedBonus: t?.rangedBonus || 0,
    raftSpeedBonus: t?.raftSpeedBonus || 0,
  };
}

export function getRelicTotals(state: PersistentState) {
  let hpBonus = 0;
  let staminaBonus = 0;
  let meleeBonus = 0;
  let rangedBonus = 0;
  let damageReduction = 0;
  let hpRegen = 0;
  let speedBonus = 0;
  let raftSpeedBonus = 0;
  let gatherBonus = 0;
  let turretBonus = 0;
  let healBonus = 0;
  let hasSZS = false;

  for (const id of state.equippedRelics) {
    const r = RELIC_MAP[id];
    if (!r) continue;
    if (r.rank === 'SZS') hasSZS = true;
    hpBonus += r.hpBonus || 0;
    staminaBonus += r.staminaBonus || 0;
    meleeBonus += r.meleeBonus || 0;
    rangedBonus += r.rangedBonus || 0;
    damageReduction += r.damageReduction || 0;
    hpRegen += r.hpRegen || 0;
    speedBonus += r.speedBonus || 0;
    raftSpeedBonus += r.raftSpeedBonus || 0;
    gatherBonus += r.gatherBonus || 0;
    turretBonus += r.turretBonus || 0;
    healBonus += r.healBonus || 0;
  }

  return {
    hpBonus,
    staminaBonus,
    meleeBonus,
    rangedBonus,
    damageReduction,
    hpRegen,
    speedBonus,
    raftSpeedBonus,
    gatherBonus,
    turretBonus,
    healBonus,
    hasSZS,
  };
}

export function computeRaftMaxHp(state: PersistentState): number {
  let maxHp = 200 + (state.raft.level - 1) * 95;
  if (state.raft.level >= 7) maxHp += 260; // Warship conversion bonus
  if ((state.raft.shieldLevel || 0) > 0) maxHp += (state.raft.shieldLevel || 0) * 75;
  if (hasDestiny(state, 'naval_t2')) maxHp += 50;
  if (hasDestiny(state, 'naval_master')) maxHp += 150;
  if (state.clan.founded && state.clan.perks.includes('perk_casco')) maxHp += 80;
  if (hasWarshipPassive(state, 'wp_blindaje_titanio')) maxHp += 180;
  if (state.warshipNuclearShield) maxHp += 220;
  return maxHp;
}

export function computeEffectiveMaxHp(state: PersistentState): number {
  let bonus = (state.level - 1) * 10;
  if (hasDestiny(state, 'abordaje_t2')) bonus += 20;
  if (hasDestiny(state, 'abordaje_t3')) bonus += 30;
  if (hasDestiny(state, 'abordaje_master')) bonus += 80;
  bonus += getRelicTotals(state).hpBonus;
  bonus += getTitleTotals(state).hpBonus;
  bonus += (state.family?.children.length || 0) * 10;
  return 120 + bonus;
}

export function computeEffectiveMaxStamina(state: PersistentState): number {
  let bonus = (state.level - 1) * 4;
  if (hasDestiny(state, 'alquimia_t2')) bonus += 25;
  bonus += getRelicTotals(state).staminaBonus;
  return 100 + bonus;
}

export function computeMeleeMultiplier(state: PersistentState): number {
  let mult = 1 + (state.level - 1) * 0.05;
  mult += getSurvivorLevel(state, 'vega') * 0.08;
  if (hasDestiny(state, 'abordaje_t2')) mult += 0.15;
  if (hasDestiny(state, 'abordaje_t4')) mult += 0.3;
  if (hasDestiny(state, 'abordaje_master')) mult += 0.45;
  if (state.clan.founded && state.clan.perks.includes('perk_furia')) mult += 0.15;
  mult += getRelicTotals(state).meleeBonus;
  mult += getTitleTotals(state).meleeBonus;
  return mult;
}

export function computeRangedMultiplier(state: PersistentState): number {
  let mult = 1 + (state.level - 1) * 0.05;
  mult += getSurvivorLevel(state, 'vega') * 0.08;
  if (hasDestiny(state, 'balistica_t2')) mult += 0.15;
  if (hasDestiny(state, 'balistica_t4')) mult += 0.35;
  if (hasDestiny(state, 'balistica_master')) mult += 0.5;
  if (state.clan.founded && state.clan.perks.includes('perk_furia')) mult += 0.15;
  mult += getRelicTotals(state).rangedBonus;
  mult += getTitleTotals(state).rangedBonus;
  return mult;
}

export function computeRaftSpeed(state: PersistentState): number {
  let spd = 145 + (state.raft.engineLevel - 1) * 24;
  if (state.raft.level >= 7) spd *= 1.18;
  spd *= 1 + getSurvivorLevel(state, 'vega') * 0.1;
  if (hasDestiny(state, 'naval_t2')) spd *= 1.2;
  if (state.craftedTech.includes('tech_ionico')) spd *= 1.3;
  if (hasWarshipPassive(state, 'wp_turbina_hidro')) spd *= 1.24;
  spd *= 1 + getRelicTotals(state).raftSpeedBonus + getTitleTotals(state).raftSpeedBonus;
  if (state.raft.damagedMode) spd *= 0.35;
  return spd;
}

export function canUnlockDestinyNode(state: PersistentState, nodeId: string): boolean {
  const node = DESTINY_MAP[nodeId];
  if (!node) return false;
  if (hasDestiny(state, nodeId)) return false;
  if (state.level < node.minLevel) return false;
  if (state.fame < node.fameCost) return false;
  if (!node.requires.every((req) => hasDestiny(state, req))) return false;
  return canAfford(state.resources, node.resourceCost);
}
