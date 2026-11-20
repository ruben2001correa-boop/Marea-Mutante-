import type {
  AnimalEntity,
  AnimalKind,
  DangerRank,
  IslandBiome,
  IslandEntity,
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

  // Periodic calm Sanctuary Safe Zones (even far into stormy seas!)
  const isSafeZone =
    (cx === 1 && cy === 0) ||
    (!isGuaranteedStarter && Math.abs(cx + cy * 2) % 5 === 0 && hash2D(cx, cy, 991) > 0.62);

  let biome: IslandBiome = 'tropical';
  if (cx === 1 && cy === 0) biome = 'pradera';
  else if (cx === 0 && cy === -1) biome = 'minera';
  else if (cx === -1 && cy === 0) biome = 'desierto';
  else if (cx === 0 && cy === 1) biome = 'chatarra';
  else if (isSafeZone) biome = biomeRoll > 0.5 ? 'tropical' : 'pradera';
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
    if (pirateRank && i === 0) {
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
      kind === 'chest'
        ? 1
        : kind === 'village'
          ? 240
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
          : kind === 'fishing_post'
            ? 'Puesto Pesquero'
            : undefined,
      kingdomId: kind === 'village' || kind === 'fishing_post' ? kingdomId || 'coralia' : undefined,
      pirateRank: kind === 'pirate_camp' ? pirateRank || 'F' : undefined,
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

  return {
    island: {
      id: islandId,
      chunkKey: `${cx},${cy}`,
      name,
      biome,
      dangerous,
      isSafeZone,
      villagerPersonality,
      pirateRank,
      hasVolcano,
      kingdomId,
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

export function getStarterBargeWorldNpc(): WorldNpcEntity {
  const cfg = WORLD_NPC_CATALOG.armero;
  return {
    id: 'wnpc_barge_armero',
    role: 'armero',
    name: 'Maestro Torren',
    title: 'Armero del Pontón Libre',
    islandId: 'barge_origin',
    islandName: 'Pontón Forja del Alba',
    x: 360,
    y: -250,
    color: cfg.color,
    hatColor: cfg.hatColor,
    specialty: cfg.specialty,
    greeting: cfg.greeting,
    discovered: true,
    lastQuote: '¡Cuando juntes fragmentos épicos, ven a mi yunque en el Pontón!',
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
