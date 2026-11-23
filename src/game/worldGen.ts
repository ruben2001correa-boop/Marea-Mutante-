import type {
  AnimalEntity,
  AnimalKind,
  DangerRank,
  IslandBiome,
  IslandEntity,
  IslandFactionControl,
  IslandNode,
  WorldNpcEntity,
  WorldNpcRole,
} from './types';

// Large Chunk Size so vast islands and full villages feel truly epic & proportional!
export const CHUNK_SIZE = 1850;

export const DANGER_RANKS: DangerRank[] = ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS'];

export interface DistanceTierInfo {
  tier: number;
  label: string;
  emoji: string;
  mult: number;
  color: string;
  dangerNote: string;
}

export function getDistanceDifficultyMult(x: number, y: number): number {
  const dist = Math.hypot(x, y);
  return 1 + Math.min(3.8, Math.max(0, (dist - 900) / 2100));
}

export function getDistanceTierInfo(x: number, y: number): DistanceTierInfo {
  const dist = Math.hypot(x, y);
  const mult = getDistanceDifficultyMult(x, y);
  if (dist >= 6500) {
    return {
      tier: 5,
      label: 'CALAMIDAD',
      emoji: '🔥',
      mult,
      color: '#f43f5e',
      dangerNote: 'Zona de Calamidad extrema: Leviatanes Ancianos, hordas y tormenta letal.',
    };
  }
  if (dist >= 4400) {
    return {
      tier: 4,
      label: 'Zona Crítica',
      emoji: '☠️',
      mult,
      color: '#fb923c',
      dangerNote: 'Aguas letales con corsarios pesados, hackers y brotes zombi.',
    };
  }
  if (dist >= 2700) {
    return {
      tier: 3,
      label: 'Abismo Mutado',
      emoji: '☣️',
      mult,
      color: '#c084fc',
      dangerNote: 'Peligro alto: fauna mutada, fragmentos nucleares y bestias marinas.',
    };
  }
  if (dist >= 1300) {
    return {
      tier: 2,
      label: 'Mar Abierto',
      emoji: '🌊',
      mult,
      color: '#38bdf8',
      dangerNote: 'Patrullas piratas dispersas y primeras islas salvajes.',
    };
  }
  return {
    tier: 1,
    label: 'Aguas Cunas',
    emoji: '⚓',
    mult,
    color: '#34d399',
    dangerNote: 'Aguas cercanas al punto de aparición; oleaje moderado.',
  };
}

export function getPirateRankInfo(rank: DangerRank): {
  hp: number;
  color: string;
  guards: number;
  hasBoss: boolean;
  statMult: number;
  oro: number;
  tit: number;
  cri: number;
  tec: number;
  xp: number;
  fame: number;
} {
  const table: Record<
    DangerRank,
    {
      hp: number;
      color: string;
      guards: number;
      hasBoss: boolean;
      statMult: number;
      oro: number;
      tit: number;
      cri: number;
      tec: number;
      xp: number;
      fame: number;
    }
  > = {
    F: { hp: 120, color: '#94a3b8', guards: 1, hasBoss: false, statMult: 0.85, oro: 5, tit: 0, cri: 0, tec: 0, xp: 35, fame: 45 },
    E: { hp: 180, color: '#6ee7b7', guards: 2, hasBoss: false, statMult: 0.95, oro: 7, tit: 1, cri: 0, tec: 0, xp: 50, fame: 65 },
    D: { hp: 250, color: '#38bdf8', guards: 2, hasBoss: false, statMult: 1.05, oro: 10, tit: 1, cri: 0, tec: 0, xp: 65, fame: 85 },
    C: { hp: 340, color: '#fbbf24', guards: 3, hasBoss: false, statMult: 1.2, oro: 14, tit: 2, cri: 0, tec: 0, xp: 85, fame: 110 },
    B: { hp: 460, color: '#fb923c', guards: 3, hasBoss: true, statMult: 1.35, oro: 18, tit: 2, cri: 1, tec: 0, xp: 110, fame: 140 },
    A: { hp: 620, color: '#f43f5e', guards: 4, hasBoss: true, statMult: 1.55, oro: 24, tit: 3, cri: 1, tec: 1, xp: 140, fame: 185 },
    S: { hp: 850, color: '#e879f9', guards: 4, hasBoss: true, statMult: 1.85, oro: 32, tit: 4, cri: 2, tec: 1, xp: 185, fame: 240 },
    SS: { hp: 1150, color: '#c084fc', guards: 5, hasBoss: true, statMult: 2.2, oro: 45, tit: 5, cri: 2, tec: 2, xp: 240, fame: 320 },
    SSS: { hp: 1600, color: '#fde047', guards: 6, hasBoss: true, statMult: 2.65, oro: 65, tit: 7, cri: 3, tec: 2, xp: 320, fame: 450 },
  };
  return table[rank];
}

const BIOME_NAMES: Record<IslandBiome, string[]> = {
  tropical: ['Cayo Palmera', 'Isla Brisa', 'Arrecife Esmeralda', 'Bahía Coco'],
  desierto: ['Dunas Doradas', 'Desierto del Sol', 'Cayo Oasis', 'Costa Esfinge'],
  volcanica: ['Pico Ceniza', 'Monte Magma', 'Isla Obsidiana', 'Cráter Rojo'],
  minera: ['Sierra Carbón', 'Monte Hierro', 'Veta Dorada', 'Cordillera Mineral'],
  chatarra: ['Atolón Hierro', 'Muelle Oxidado', 'Cementerio Naval', 'Astilleros Viejos'],
  pirata: ['Guarida Roja', 'Cala Bandido', 'Bastión Ojo Negro', 'Fuerte Pólvora'],
  pradera: ['Pradera Verde', 'Valle Manso', 'Colina Trigo', 'Campos del Sur'],
  abisal: ['Santuario Abisal', 'Altar Cristal', 'Fosa Celeste', 'Ruina Tecnológica'],
  zombie: ['Isla Putrefacta', 'Cayo Lázaro', 'Bahía Muerta', 'Necrópolis Salada'],
};

const SAFE_ZONE_NAMES = [
  'Cayo Santuario',
  'Bahía de la Calma',
  'Puerto Serenidad',
  'Refugio del Horizonte',
];

const VILLAGE_NAMES: string[] = [
  'Puerto Coral',
  'Villa Brisa',
  'Muelle Dorado',
  'Aldea Tuerca',
  'Caleta Esperanza',
  'Fondeadero Real',
];

export interface IslandCultureDef {
  id: string;
  name: string;
  emblem: string;
  color: string;
  tradition: string;
  greeting: string;
}

export const WORLD_CULTURES_CATALOG: IslandCultureDef[] = [
  {
    id: 'polinesia',
    name: 'Polinesia Maorí',
    emblem: '🌺',
    color: '#2dd4bf',
    tradition: 'Canoas dobles, tatuajes de marea y pescado al coco',
    greeting: '¡Kia ora, navegante de las estrellas!',
  },
  {
    id: 'nordica',
    name: 'Nórdica Skjald',
    emblem: '🛡️',
    color: '#60a5fa',
    tradition: 'Drakkars tallados, runas de hierro y arenque curado',
    greeting: '¡Skål, viajero de los mares bravos!',
  },
  {
    id: 'caribena',
    name: 'Caribeña Antillana',
    emblem: '🌴',
    color: '#fbbf24',
    tradition: 'Tambores de coral, especias marinas y ron de caña',
    greeting: '¡Bienvenida sea tu vela a este puerto!',
  },
  {
    id: 'nipona',
    name: 'Nipona del Sol',
    emblem: '⛩️',
    color: '#f472b6',
    tradition: 'Puentes carmesí, forja fina y té de algas',
    greeting: '¡Irasshaimase, capitán de las olas!',
  },
  {
    id: 'mediterranea',
    name: 'Mediterránea Helénica',
    emblem: '🏛️',
    color: '#38bdf8',
    tradition: 'Columnatas blancas, ánforas de aceite y olivos',
    greeting: '¡Kalos orisate a nuestras costas!',
  },
  {
    id: 'andina',
    name: 'Andina del Altiplano',
    emblem: '☀️',
    color: '#f59e0b',
    tradition: 'Terrazas de piedra, textiles dorados y quínoa marina',
    greeting: '¡Allinllachu, caminante del mar!',
  },
  {
    id: 'africana',
    name: 'Costera Swahili',
    emblem: '⚓',
    color: '#34d399',
    tradition: 'Velas latinas dhow, especias y talla en madera',
    greeting: '¡Jambo, señor de las mareas!',
  },
  {
    id: 'arabe',
    name: 'Árabe de las Dunas',
    emblem: '🌙',
    color: '#fcd34d',
    tradition: 'Astrolabios estelares, especias y dátiles dulces',
    greeting: '¡Salam alaykum, marino del horizonte!',
  },
  {
    id: 'celta',
    name: 'Celta de la Bruma',
    emblem: '🍀',
    color: '#a3e635',
    tradition: 'Menhires musgosos, arpas de hueso e hidromiel',
    greeting: '¡Fáilte a nuestras rocas sagradas!',
  },
  {
    id: 'mexica',
    name: 'Mexica Tenochca',
    emblem: '🦅',
    color: '#fb7185',
    tradition: 'Chinampas flotantes, obsidiana y cacao ancestral',
    greeting: '¡Niltze! ¡Que el sol proteja tu quilla!',
  },
  {
    id: 'eslava',
    name: 'Eslava del Volga',
    emblem: '🏰',
    color: '#a78bfa',
    tradition: 'Cúpulas de madera tallada, pieles y caldos calientes',
    greeting: '¡Dobro pozhalovat al muelle!',
  },
  {
    id: 'atlante',
    name: 'Atlante Abisal',
    emblem: '🔱',
    color: '#22d3ee',
    tradition: 'Cristales bioluminiscentes y forjas del Viejo Mundo',
    greeting: '¡Salve, heredero de los mares profundos!',
  },
];

export interface WorldMysteryDef {
  id: string;
  kind: 'mystery_monolith' | 'easter_egg';
  title: string;
  shortTag: string;
  lore: string;
  rewardOro: number;
  rewardFame: number;
  bonusKey?: 'cri' | 'tec' | 'frag_epico' | 'oro' | 'gui';
  bonusAmount?: number;
  color: string;
}

export const WORLD_MYSTERIES_CATALOG: WorldMysteryDef[] = [
  {
    id: 'myst_monolito_vacio',
    kind: 'mystery_monolith',
    title: 'Monolito del Siglo Vacío',
    shortTag: 'Glifo Antiguo',
    lore: 'Estela negra indestructible que narra cómo diez reyes hundieron el mundo antiguo antes de la Gran Marea.',
    rewardOro: 4,
    rewardFame: 85,
    bonusKey: 'tec',
    bonusAmount: 2,
    color: '#22d3ee',
  },
  {
    id: 'myst_sombrero_rey',
    kind: 'easter_egg',
    title: 'Sombrero de Paja del Primer Rey',
    shortTag: 'Reliquia Secreta',
    lore: 'Un sombrero tejido dorado reposa intacto sobre un timón petrificado: "La voluntad de navegar libre nunca muere".',
    rewardOro: 5,
    rewardFame: 110,
    bonusKey: 'oro',
    bonusAmount: 3,
    color: '#fde047',
  },
  {
    id: 'myst_caracol_dorado',
    kind: 'easter_egg',
    title: 'Caracol Dorado Transmisor',
    shortTag: 'Huevo de Pascua',
    lore: 'Un extraño caracol marino dormido que todavía murmura frecuencias cifradas de la vieja marina: "¡Puru-puru-puru!".',
    rewardOro: 3,
    rewardFame: 75,
    bonusKey: 'tec',
    bonusAmount: 2,
    color: '#fbbf24',
  },
  {
    id: 'myst_brujula_corazon',
    kind: 'mystery_monolith',
    title: 'Brújula que Apunta al Corazón',
    shortTag: 'Altar Astral',
    lore: 'No señala al norte sino al tesoro más cercano de tus sueños. Sus runas aún tibias vibran bajo tus dedos.',
    rewardOro: 4,
    rewardFame: 90,
    bonusKey: 'cri',
    bonusAmount: 1,
    color: '#c084fc',
  },
  {
    id: 'myst_bitacora_404',
    kind: 'easter_egg',
    title: 'Bitácora del Barco Fantasma 404',
    shortTag: 'Error del Mar',
    lore: 'Un diario sellado en botella dice: "Día 404: isla no encontrada en los mapas oficiales... pero juro que acampamos aquí".',
    rewardOro: 4,
    rewardFame: 80,
    bonusKey: 'frag_epico',
    bonusAmount: 1,
    color: '#38bdf8',
  },
  {
    id: 'myst_caliz_sal',
    kind: 'mystery_monolith',
    title: 'Cáliz de Sal Eterna',
    shortTag: 'Estela Abisal',
    lore: 'Columnata sumergida con coordenadas de un tesoro abisal perdido entre Leviatanes Ancianos.',
    rewardOro: 4,
    rewardFame: 95,
    bonusKey: 'cri',
    bonusAmount: 1,
    color: '#34d399',
  },
  {
    id: 'myst_calavera_rie',
    kind: 'easter_egg',
    title: 'La Calavera que Ríe',
    shortTag: 'Jolly Roger Oculto',
    lore: 'Una bandera pirata tallada en coral que suelta una carcajada metálica con la brisa: "¡El tesoro estuvo en la aventura!".',
    rewardOro: 5,
    rewardFame: 100,
    bonusKey: 'gui',
    bonusAmount: 2,
    color: '#fb7185',
  },
  {
    id: 'myst_pluma_morgana',
    kind: 'mystery_monolith',
    title: 'Crónica Prohibida de Morgana',
    shortTag: 'Archivo Secreto',
    lore: 'Páginas grabadas en bronce que predicen la guerra de los Cuatro Emperadores del Mar.',
    rewardOro: 4,
    rewardFame: 90,
    bonusKey: 'frag_epico',
    bonusAmount: 1,
    color: '#a78bfa',
  },
];

export const MYSTERY_MAP: Record<string, WorldMysteryDef> = Object.fromEntries(
  WORLD_MYSTERIES_CATALOG.map((m) => [m.id, m])
);

function hash2D(cx: number, cy: number, salt = 0): number {
  let h = (cx * 374761393 + cy * 668265263 + salt * 1442695041) | 0;
  h = (h ^ (h >> 13)) * 1274126177;
  return ((h ^ (h >> 16)) >>> 0) / 4294967295;
}

export function getChunkCoords(x: number, y: number): { cx: number; cy: number } {
  return {
    cx: Math.floor(x / CHUNK_SIZE),
    cy: Math.floor(y / CHUNK_SIZE),
  };
}

/**
 * Determines whether an ocean coordinate is in "Aguas Peligrosas" (☣️) where
 * big monsters & Leviathans roam, vs safe/coastal waters!
 */
export function isDangerousOceanAt(x: number, y: number): boolean {
  const dist = Math.hypot(x, y);
  if (dist < 1400) return false;
  const pocket = Math.sin(x * 0.00095) * Math.cos(y * 0.00095);
  return dist > 3200 || pocket > 0.36;
}

export function generateChunkIsland(
  cx: number,
  cy: number,
  nextEid: () => number
): { island: IslandEntity; animals: AnimalEntity[] } | null {
  if (cx === 0 && cy === 0) return null;

  const isGuaranteedStarter =
    (cx === 1 && cy === 0) ||
    (cx === -1 && cy === 0) ||
    (cx === 0 && cy === -1) ||
    (cx === 0 && cy === 1);
  const spawnRoll = hash2D(cx, cy, 11);
  if (!isGuaranteedStarter && spawnRoll > 0.62) return null;

  const distFromOrigin = Math.hypot(cx, cy);
  const biomeRoll = hash2D(cx, cy, 23);

  // Periodic calm Sanctuary Safe Zones (clearly visible across all oceans, even for the Pirate King!)
  const isSafeZone =
    (cx === 1 && cy === 0) ||
    (!isGuaranteedStarter &&
      Math.abs(cx * 3 + cy * 5) % 4 === 0 &&
      hash2D(cx, cy, 991) > 0.34);

  let biome: IslandBiome = 'tropical';
  if (cx === 1 && cy === 0) biome = 'pradera';
  else if (cx === 0 && cy === -1) biome = 'minera';
  else if (cx === -1 && cy === 0) biome = 'desierto';
  else if (cx === 0 && cy === 1) biome = 'chatarra';
  else if (isSafeZone) biome = biomeRoll > 0.45 ? 'tropical' : 'pradera';
  else if (distFromOrigin >= 2.2 && biomeRoll > 0.84) biome = 'zombie';
  else if (distFromOrigin >= 3.2 && biomeRoll > 0.75) biome = 'abisal';
  else if (biomeRoll > 0.66) biome = 'volcanica';
  else if (biomeRoll > 0.51) biome = 'pirata';
  else if (biomeRoll > 0.40) biome = 'minera';
  else if (biomeRoll > 0.30) biome = 'desierto';
  else if (biomeRoll > 0.20) biome = 'chatarra';
  else if (biomeRoll > 0.10) biome = 'pradera';

  const hasPirateHq =
    !isGuaranteedStarter &&
    !isSafeZone &&
    biome !== 'zombie' &&
    (biome === 'pirata' ||
      ((biome === 'volcanica' || biome === 'abisal') && hash2D(cx, cy, 881) > 0.42));

  let pirateRank: DangerRank | undefined;
  if (hasPirateHq) {
    const distFactor = Math.min(6, Math.floor(distFromOrigin * 1.15));
    const variance = Math.floor(hash2D(cx, cy, 887) * 4);
    const rankIdx = Math.min(DANGER_RANKS.length - 1, Math.max(0, distFactor + variance - 1));
    pirateRank = DANGER_RANKS[rankIdx];
  }

  const dangerous =
    !isSafeZone &&
    (biome === 'pirata' ||
      biome === 'abisal' ||
      biome === 'volcanica' ||
      biome === 'zombie' ||
      Boolean(pirateRank));
  const hasVolcano = biome === 'volcanica';
  const kingdomId =
    biome === 'tropical' || biome === 'pradera'
      ? hash2D(cx, cy, 31) > 0.45
        ? 'coralia'
        : 'dorado'
      : biome === 'desierto'
        ? 'dorado'
        : biome === 'chatarra' || biome === 'minera'
          ? 'hierro'
          : biome === 'pirata'
            ? 'escarlata'
            : undefined;

  const names = BIOME_NAMES[biome];
  const name = isSafeZone
    ? SAFE_ZONE_NAMES[Math.floor(hash2D(cx, cy, 997) * SAFE_ZONE_NAMES.length)]
    : names[Math.floor(hash2D(cx, cy, 37) * names.length)];

  // Every island receives a distinct world culture spawned uniformly across ALL cultures regardless of biome
  const culture =
    WORLD_CULTURES_CATALOG[
      Math.floor(hash2D(cx, cy, 313) * WORLD_CULTURES_CATALOG.length)
    ];

  // Islander personality: hostile, foolish ("mensos"), or friendly
  const pRoll = hash2D(cx, cy, 733);
  const villagerPersonality: 'hostile' | 'foolish' | 'friendly' = isSafeZone
    ? 'friendly'
    : biome === 'pirata' || biome === 'volcanica' || (distFromOrigin > 3 && pRoll > 0.55)
      ? 'hostile'
      : pRoll > 0.35
        ? 'foolish'
        : 'friendly';

  const margin = 520;
  const x = cx * CHUNK_SIZE + margin + hash2D(cx, cy, 41) * (CHUNK_SIZE - margin * 2);
  const y = cy * CHUNK_SIZE + margin + hash2D(cx, cy, 53) * (CHUNK_SIZE - margin * 2);
  const radius = 440 + hash2D(cx, cy, 67) * 220;

  const points: Array<{ angle: number; r: number }> = [];
  const verts = 16;
  for (let i = 0; i < verts; i++) {
    const angle = (i / verts) * Math.PI * 2;
    const wobble = 0.85 + hash2D(cx, cy, 100 + i) * 0.28;
    points.push({ angle, r: radius * wobble });
  }

  const hasVillage =
    cx === 1 && cy === 0
      ? true
      : isSafeZone ||
        ((biome === 'pradera' || biome === 'tropical' || biome === 'desierto' || biome === 'chatarra') &&
          hash2D(cx, cy, 71) > 0.32);

  const nodes: IslandNode[] = [];
  const nodeCount = 18 + Math.floor(hash2D(cx, cy, 79) * 8);
  for (let i = 0; i < nodeCount; i++) {
    const a = hash2D(cx, cy, 200 + i) * Math.PI * 2;
    let d = (0.2 + hash2D(cx, cy, 300 + i) * 0.62) * radius;

    let kind: IslandNode['kind'] = 'tree';
    const kr = hash2D(cx, cy, 400 + i);
    let mysteryId: string | undefined;
    if (i === 5 && (isGuaranteedStarter || hash2D(cx, cy, 777) > 0.42)) {
      const mIdx = Math.abs(cx * 31 + cy * 17 + (cx === 1 && cy === 0 ? 1 : 0)) % WORLD_MYSTERIES_CATALOG.length;
      const mDef = WORLD_MYSTERIES_CATALOG[mIdx];
      kind = mDef.kind;
      mysteryId = mDef.id;
      d = (0.48 + hash2D(cx, cy, 779) * 0.24) * radius;
    } else if (pirateRank && i === 0) {
      kind = 'pirate_camp';
    } else if (hasVillage && i === 0) {
      kind = 'village';
    } else if (i === 1 && (biome === 'pirata' || biome === 'abisal' || biome === 'zombie' || biome === 'desierto' || kr > 0.45)) {
      kind = 'chest';
    } else if (i === 2) {
      const landRoll = hash2D(cx, cy, 431);
      if (biome === 'zombie') kind = 'zombie_grave';
      else if (biome === 'chatarra' || biome === 'minera') kind = 'abandoned_bunker';
      else if (biome === 'abisal' || biome === 'desierto') kind = 'abandoned_ruin';
      else if (landRoll > 0.5) {
        kind = 'abandoned_lighthouse';
        d = 0.72 * radius;
      } else {
        kind = 'shipwreck';
        d = 0.78 * radius;
      }
    } else if (i === 3) {
      if (biome === 'zombie') {
        kind = 'zombie_grave';
      } else if (hasVillage || biome === 'tropical' || biome === 'pradera') {
        kind = hash2D(cx, cy, 443) > 0.4 ? 'fishing_post' : 'abandoned_ruin';
        if (kind === 'fishing_post') d = 0.75 * radius;
      } else {
        kind = hash2D(cx, cy, 449) > 0.5 ? 'shipwreck' : 'abandoned_bunker';
        if (kind === 'shipwreck') d = 0.78 * radius;
      }
    } else if (
      i === 4 &&
      !isSafeZone &&
      !pirateRank &&
      biome !== 'pirata' &&
      biome !== 'zombie' &&
      !(cx === 0 && cy === 0) &&
      hash2D(cx, cy, 459) > 0.56
    ) {
      kind = 'marine_checkpoint';
      d = 0.74 * radius;
    } else if (i === 4 && hash2D(cx, cy, 461) > 0.36) {
      kind = biome === 'pirata' ? 'pirate_camp' : hash2D(cx, cy, 467) > 0.55 ? 'radio_tower' : 'abandoned_ruin';
    } else if ((biome === 'chatarra' || biome === 'abisal' || biome === 'zombie') && kr > 0.52) {
      kind = biome === 'zombie' && kr > 0.76 ? 'zombie_grave' : 'tech_wreck';
    } else if (biome === 'minera' || biome === 'volcanica') {
      if (kr > 0.78) kind = 'gold_vein';
      else if (kr > 0.52) kind = 'iron';
      else if (kr > 0.28) kind = 'coal';
      else if (kr > 0.14) kind = 'titanium';
      else kind = 'rock';
    } else if (biome === 'desierto') {
      if (kr > 0.72) kind = 'gold_vein';
      else if (kr > 0.45) kind = 'coal';
      else kind = 'tree';
    } else if (biome === 'abisal' && kr > 0.4) {
      kind = 'crystal';
    } else if (biome === 'chatarra') {
      kind = kr > 0.45 ? 'iron' : 'rock';
    } else if (kr > 0.72) {
      kind = 'iron';
    } else if (kr > 0.55) {
      kind = 'coal';
    }

    const nx = x + Math.cos(a) * d;
    const ny = y + Math.sin(a) * d;

    const hp =
      kind === 'chest' || kind === 'mystery_monolith' || kind === 'easter_egg'
        ? 1
        : kind === 'village'
          ? 240
          : kind === 'marine_checkpoint'
            ? 260
            : kind === 'fishing_post'
            ? 120
            : kind === 'pirate_camp'
              ? getPirateRankInfo(pirateRank || 'F').hp
              : kind === 'abandoned_ruin' ||
                  kind === 'abandoned_lighthouse' ||
                  kind === 'shipwreck' ||
                  kind === 'abandoned_bunker' ||
                  kind === 'radio_tower' ||
                  kind === 'zombie_grave'
                ? 80
                : kind === 'crystal'
                  ? 75
                  : kind === 'tech_wreck'
                    ? 55
                    : kind === 'gold_vein' || kind === 'titanium'
                      ? 60
                      : kind === 'iron' || kind === 'coal'
                        ? 45
                        : 36;

    nodes.push({
      id: `${cx}_${cy}_${i}`,
      kind,
      x: nx,
      y: ny,
      hp,
      maxHp: hp,
      depleted: false,
      villageName:
        kind === 'village'
          ? VILLAGE_NAMES[Math.floor(hash2D(cx, cy, 501) * VILLAGE_NAMES.length)]
          : kind === 'marine_checkpoint'
            ? 'Puesto de Control Marina'
            : kind === 'fishing_post'
              ? 'Puesto Pesquero'
              : undefined,
      kingdomId:
        kind === 'marine_checkpoint'
          ? 'marina'
          : kind === 'village' || kind === 'fishing_post'
            ? kingdomId || 'coralia'
            : undefined,
      pirateRank: kind === 'pirate_camp' ? pirateRank || 'F' : undefined,
      mysteryId,
    });
  }

  const islandId = `isl_${cx}_${cy}`;
  const animals: AnimalEntity[] = [];
  const animalCount = 5 + Math.floor(hash2D(cx, cy, 610) * 5);
  for (let a = 0; a < animalCount; a++) {
    const ang = hash2D(cx, cy, 650 + a) * Math.PI * 2;
    const dist = (0.18 + hash2D(cx, cy, 700 + a) * 0.5) * radius;
    let kind: AnimalKind = 'chicken';
    const roll = hash2D(cx, cy, 750 + a);

    if (isSafeZone || biome === 'pradera' || hasVillage) {
      kind = roll > 0.65 ? 'goat' : roll > 0.32 ? 'pig' : 'chicken';
    } else if (biome === 'desierto') {
      kind = roll > 0.4 ? 'scorpion' : 'goat';
    } else if (biome === 'volcanica' || biome === 'pirata' || biome === 'minera' || biome === 'zombie') {
      kind = roll > 0.48 ? 'boar' : 'wolf';
    } else {
      kind = roll > 0.5 ? 'boar' : 'chicken';
    }

    const stats: Record<
      AnimalKind,
      { name: string; isWild: boolean; capturable: boolean; hp: number; dmg: number; r: number }
    > = {
      chicken: { name: 'Gallina Isleña', isWild: false, capturable: true, hp: 18, dmg: 0, r: 8 },
      pig: { name: 'Cerdo de Granja', isWild: false, capturable: true, hp: 32, dmg: 0, r: 11 },
      goat: { name: 'Cabra Montesa', isWild: false, capturable: true, hp: 30, dmg: 4, r: 11 },
      boar: { name: 'Jabalí Salvaje', isWild: true, capturable: true, hp: 48, dmg: 9, r: 13 },
      scorpion: { name: 'Escorpión Gigante', isWild: true, capturable: false, hp: 42, dmg: 11, r: 12 },
      wolf: { name: 'Lobo de Costa', isWild: true, capturable: false, hp: 44, dmg: 10, r: 12 },
    };
    const st = stats[kind];
    animals.push({
      id: nextEid(),
      kind,
      name: st.name,
      islandId,
      isWild: st.isWild,
      capturable: st.capturable,
      x: x + Math.cos(ang) * dist,
      y: y + Math.sin(ang) * dist,
      vx: 0,
      vy: 0,
      hp: st.hp,
      maxHp: st.hp,
      dmg: st.dmg,
      radius: st.r,
      hitT: 0,
      cd: 0,
      wanderT: Math.random() * 3,
      gaitPhase: Math.random() * 6,
    });
  }

  const hasMarineCheckpointNode = nodes.some((n) => n.kind === 'marine_checkpoint');
  const islandFactionControl: IslandFactionControl | undefined = isSafeZone
    ? 'neutral_safe'
    : pirateRank || biome === 'pirata'
      ? 'pirate'
      : hasMarineCheckpointNode
        ? 'marina_gov'
        : (biome === 'pradera' || biome === 'tropical') && villagerPersonality === 'friendly' && !dangerous
          ? 'neutral_safe'
          : undefined;

  return {
    island: {
      id: islandId,
      chunkKey: `${cx},${cy}`,
      name,
      biome,
      cultureId: culture.id,
      cultureName: culture.name,
      cultureColor: culture.color,
      cultureEmblem: culture.emblem,
      cultureTradition: culture.tradition,
      cultureGreeting: culture.greeting,
      regenTimer: 0,
      dangerous,
      isSafeZone: isSafeZone || islandFactionControl === 'neutral_safe',
      factionControl: islandFactionControl,
      villagerPersonality,
      pirateRank,
      hasVolcano,
      kingdomId: islandFactionControl === 'marina_gov' ? 'marina' : kingdomId,
      x,
      y,
      radius,
      points,
      nodes,
      discovered: false,
    },
    animals,
  };
}

export function getIslandFactionControl(
  isl: IslandEntity
): IslandFactionControl | 'wild' {
  if (isl.factionControl) return isl.factionControl;
  if (isl.isSafeZone) return 'neutral_safe';
  if (isl.pirateRank || isl.biome === 'pirata') return 'pirate';
  if (isl.nodes.some((n) => n.kind === 'marine_checkpoint' && !n.depleted)) return 'marina_gov';
  return 'wild';
}

export function isPointInSafeZoneIsland(
  px: number,
  py: number,
  islands: IslandEntity[]
): IslandEntity | null {
  for (const isl of islands) {
    if (getIslandFactionControl(isl) === 'neutral_safe' && pointInIsland(px, py, isl)) {
      return isl;
    }
  }
  return null;
}

export function getIslandRadiusAtAngle(isl: IslandEntity, dx: number, dy: number): number {
  let angle = Math.atan2(dy, dx);
  if (angle < 0) angle += Math.PI * 2;
  const n = isl.points.length;
  const idxF = (angle / (Math.PI * 2)) * n;
  const i0 = Math.floor(idxF) % n;
  const i1 = (i0 + 1) % n;
  const t = idxF - Math.floor(idxF);
  return isl.points[i0].r * (1 - t) + isl.points[i1].r * t;
}

export function pointInIsland(px: number, py: number, isl: IslandEntity): boolean {
  const dx = px - isl.x;
  const dy = py - isl.y;
  const dist = Math.hypot(dx, dy);
  if (dist > isl.radius * 1.15) return false;
  if (dist < isl.radius * 0.72) return true;
  return dist <= getIslandRadiusAtAngle(isl, dx, dy);
}

/**
 * Keeps boats, rafts, and aquatic sea monsters outside island landmasses.
 */
export function resolveIslandBoundary(
  x: number,
  y: number,
  entityRadius: number,
  islands: IslandEntity[]
): { x: number; y: number; collided: boolean } {
  let nx = x;
  let ny = y;
  let collided = false;
  for (const isl of islands) {
    const dx = nx - isl.x;
    const dy = ny - isl.y;
    const dist = Math.hypot(dx, dy);
    if (dist > isl.radius * 1.3 + entityRadius) continue;
    const edgeR = getIslandRadiusAtAngle(isl, dx, dy) + entityRadius;
    if (dist < edgeR) {
      collided = true;
      const safeDist = Math.max(0.001, dist);
      nx = isl.x + (dx / safeDist) * edgeR;
      ny = isl.y + (dy / safeDist) * edgeR;
    }
  }
  return { x: nx, y: ny, collided };
}

/**
 * Prevents player raft/warship and enemy pirate boats/sea monsters from overlapping the hull!
 */
export function resolveRaftBoatCollision(
  entityX: number,
  entityY: number,
  entityRadius: number,
  raftX: number,
  raftY: number,
  raftHalfSize: number
): { x: number; y: number; collided: boolean } {
  const minDist = raftHalfSize * 0.98 + entityRadius;
  const dx = entityX - raftX;
  const dy = entityY - raftY;
  const dist = Math.hypot(dx, dy);
  if (dist < minDist) {
    const safe = Math.max(0.001, dist);
    return {
      x: raftX + (dx / safe) * minDist,
      y: raftY + (dy / safe) * minDist,
      collided: true,
    };
  }
  return { x: entityX, y: entityY, collided: false };
}

const WORLD_NPC_CATALOG: Record<
  WorldNpcRole,
  {
    names: string[];
    title: string;
    color: string;
    hatColor: string;
    specialty: string;
    greeting: string;
  }
> = {
  armero: {
    names: ['Maestro Torren', 'Herrero Varro', 'Yunque Bruno', 'Maestra Kira'],
    title: 'Armero de Guerra',
    color: '#f97316',
    hatColor: '#7c2d12',
    specialty: 'Forja armas Épicas y Legendarias con fragmentos · Repara casco y vende hierro',
    greeting:
      '¡Trae fragmentos épicos o legendarios y acero! Solo un buen yunque despierta armas verdaderas.',
  },
  forjador: {
    names: ['Forjador Solís', 'Maestro Astral Orin', 'Artesana Selene', 'Forjador Kael'],
    title: 'Forjador Celestial y Divino',
    color: '#38f8e2',
    hatColor: '#0f172a',
    specialty: 'Forja armas Épicas, Legendarias y Divinas · Transmuta fragmentos raros',
    greeting:
      'Mis brasas funden fragmentos divinos y celestiales. Si buscas poder de los dioses antiguos, habla conmigo.',
  },
  mercader: {
    names: ['Mercader Lucho', 'Comerciante Mireya', 'Buhonero Tadeo', 'Capitana Rina'],
    title: 'Mercader Naval',
    color: '#fbbf24',
    hatColor: '#78350f',
    specialty: 'Vende víveres, agua, madera y compra excedentes en Oro',
    greeting:
      '¡Oro contante o víveres frescos! Nada navega mucho tiempo sin despensa llena.',
  },
  alquimista: {
    names: ['Alquimista Lyra', 'Boticario Darío', 'Sabia Isolde', 'Místico Fen'],
    title: 'Alquimista y Curandera',
    color: '#c084fc',
    hatColor: '#4c1d95',
    specialty: 'Cura radiación y resaca · Vende cristal abisal, tónicos mentales e incienso',
    greeting:
      'Los mares mutados envenenan cuerpo y mente. Mis elixires te devolverán al combate.',
  },
  cartografo: {
    names: ['Cartógrafo Mateo', 'Vigía Lucía', 'Navegante Silvano', 'Oteador Paz'],
    title: 'Cartógrafo de Abismos',
    color: '#38bdf8',
    hatColor: '#1e3a8a',
    specialty: 'Vende coordenadas exactas de Armeros, Forjadores, Leviatanes y Cacerías',
    greeting:
      'Mis cartas señalan dónde esperan los maestros forjadores y las guaridas más ricas del océano.',
  },
  chatarrero: {
    names: ['Chatarrero Tino', 'Ingeniera Vera', 'Soldador Rocco', 'Chispa Nilo'],
    title: 'Chatarrero Tecnológico',
    color: '#94a3b8',
    hatColor: '#334155',
    specialty: 'Vende tecnología del Viejo Mundo, titanio, chatarra y kits de radio',
    greeting:
      'Lo que otros llaman basura es oro puro para blindar tu navío o construir reactores.',
  },
};

export function getStarterDawnforgeGatePos(starterIsland?: IslandEntity): {
  x: number;
  y: number;
  islandId: string;
  islandName: string;
} {
  if (starterIsland) {
    return {
      x: starterIsland.x - starterIsland.radius * 0.34,
      y: starterIsland.y + starterIsland.radius * 0.12,
      islandId: starterIsland.id,
      islandName: starterIsland.name,
    };
  }
  const margin = 520;
  const cx = 1;
  const cy = 0;
  const ix = cx * CHUNK_SIZE + margin + hash2D(cx, cy, 41) * (CHUNK_SIZE - margin * 2);
  const iy = cy * CHUNK_SIZE + margin + hash2D(cx, cy, 53) * (CHUNK_SIZE - margin * 2);
  const radius = 440 + hash2D(cx, cy, 67) * 220;
  return {
    x: ix - radius * 0.34,
    y: iy + radius * 0.12,
    islandId: 'isl_1_0',
    islandName: SAFE_ZONE_NAMES[Math.floor(hash2D(cx, cy, 997) * SAFE_ZONE_NAMES.length)],
  };
}

export function getStarterBargeWorldNpc(starterIsland?: IslandEntity): WorldNpcEntity {
  const cfg = WORLD_NPC_CATALOG.armero;
  const pos = getStarterDawnforgeGatePos(starterIsland);
  return {
    id: 'wnpc_barge_armero',
    role: 'armero',
    name: 'Maestro Torren',
    title: 'Armero · Portón Forja del Alba',
    islandId: pos.islandId,
    islandName: pos.islandName,
    x: pos.x + 28,
    y: pos.y + 8,
    color: cfg.color,
    hatColor: cfg.hatColor,
    specialty: cfg.specialty,
    greeting: cfg.greeting,
    discovered: Boolean(starterIsland?.discovered),
    lastQuote: '¡Los Portones Forja del Alba están en tierra firme! Ven a mi yunque en la isla.',
  };
}

export function generateIslandWorldNpcs(isl: IslandEntity, cx: number, cy: number): WorldNpcEntity[] {
  if (isl.biome === 'pirata' && !isl.isSafeZone) {
    // Even dangerous pirate islands sometimes harbor a black-market scrapper or cartographer near the coast
    if (hash2D(cx, cy, 911) < 0.65) return [];
  }
  const roles: WorldNpcRole[] = [];
  if (cx === 1 && cy === 0) {
    roles.push('mercader', 'armero');
  } else if (cx === 0 && cy === -1) {
    roles.push('forjador', 'chatarrero');
  } else if (cx === -1 && cy === 0) {
    roles.push('cartografo', 'mercader');
  } else if (cx === 0 && cy === 1) {
    roles.push('chatarrero', 'alquimista');
  } else if (isl.isSafeZone) {
    roles.push('armero', hash2D(cx, cy, 919) > 0.42 ? 'forjador' : 'mercader', 'alquimista');
  } else if (isl.biome === 'abisal' || isl.biome === 'volcanica') {
    if (hash2D(cx, cy, 929) > 0.35) roles.push('forjador');
    if (hash2D(cx, cy, 937) > 0.55) roles.push('alquimista');
  } else if (isl.biome === 'minera' || isl.biome === 'chatarra') {
    if (hash2D(cx, cy, 941) > 0.38) roles.push('armero');
    if (hash2D(cx, cy, 947) > 0.45) roles.push('chatarrero');
  } else if (isl.biome === 'zombie') {
    if (hash2D(cx, cy, 953) > 0.5) roles.push('alquimista');
  } else {
    const roll = hash2D(cx, cy, 967);
    if (roll > 0.72) roles.push('forjador');
    else if (roll > 0.48) roles.push('armero');
    else if (roll > 0.25) roles.push('mercader');
    else roles.push('cartografo');
  }

  return roles.map((role, idx) => {
    const cfg = WORLD_NPC_CATALOG[role];
    const nameIdx = Math.floor(hash2D(cx, cy, 971 + idx * 13) * cfg.names.length);
    const angle = hash2D(cx, cy, 983 + idx * 17) * Math.PI * 2;
    const dist = isl.radius * (0.34 + idx * 0.18);
    return {
      id: `wnpc_${isl.id}_${role}`,
      role,
      name: cfg.names[nameIdx],
      title: cfg.title,
      islandId: isl.id,
      islandName: isl.name,
      x: isl.x + Math.cos(angle) * dist,
      y: isl.y + Math.sin(angle) * dist,
      color: cfg.color,
      hatColor: cfg.hatColor,
      specialty: cfg.specialty,
      greeting: cfg.greeting,
      discovered: Boolean(isl.discovered),
    };
  });
}
