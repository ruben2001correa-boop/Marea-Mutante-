import type {
  AnimalEntity,
  AnimalKind,
  DangerRank,
  IslandBiome,
  IslandEntity,
  IslandNode,
} from './types';

// Large Chunk Size so vast islands and full villages feel truly epic & proportional!
export const CHUNK_SIZE = 1850;

export const DANGER_RANKS: DangerRank[] = ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS'];

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
};

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
  if (!isGuaranteedStarter && spawnRoll > 0.6) return null;

  const distFromOrigin = Math.hypot(cx, cy);
  const biomeRoll = hash2D(cx, cy, 23);

  let biome: IslandBiome = 'tropical';
  if (cx === 1 && cy === 0) biome = 'pradera';
  else if (cx === 0 && cy === -1) biome = 'minera';
  else if (cx === -1 && cy === 0) biome = 'desierto';
  else if (cx === 0 && cy === 1) biome = 'chatarra';
  else if (distFromOrigin >= 3.5 && biomeRoll > 0.82) biome = 'abisal';
  else if (biomeRoll > 0.74) biome = 'volcanica';
  else if (biomeRoll > 0.56) biome = 'pirata';
  else if (biomeRoll > 0.45) biome = 'minera';
  else if (biomeRoll > 0.34) biome = 'desierto';
  else if (biomeRoll > 0.23) biome = 'chatarra';
  else if (biomeRoll > 0.12) biome = 'pradera';

  const hasPirateHq =
    !isGuaranteedStarter &&
    (biome === 'pirata' ||
      ((biome === 'volcanica' || biome === 'abisal') && hash2D(cx, cy, 881) > 0.45));

  let pirateRank: DangerRank | undefined;
  if (hasPirateHq) {
    const distFactor = Math.min(6, Math.floor(distFromOrigin * 1.15));
    const variance = Math.floor(hash2D(cx, cy, 887) * 4);
    const rankIdx = Math.min(DANGER_RANKS.length - 1, Math.max(0, distFactor + variance - 1));
    pirateRank = DANGER_RANKS[rankIdx];
  }

  const dangerous =
    biome === 'pirata' || biome === 'abisal' || biome === 'volcanica' || Boolean(pirateRank);
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
  const name = names[Math.floor(hash2D(cx, cy, 37) * names.length)];

  const margin = 520;
  const x = cx * CHUNK_SIZE + margin + hash2D(cx, cy, 41) * (CHUNK_SIZE - margin * 2);
  const y = cy * CHUNK_SIZE + margin + hash2D(cx, cy, 53) * (CHUNK_SIZE - margin * 2);
  // Vast proportional island radius: 440 - 660px (880 - 1320px across!)
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
      : (biome === 'pradera' || biome === 'tropical' || biome === 'desierto' || biome === 'chatarra') &&
        hash2D(cx, cy, 71) > 0.32;

  const nodes: IslandNode[] = [];
  const nodeCount = 17 + Math.floor(hash2D(cx, cy, 79) * 8);
  for (let i = 0; i < nodeCount; i++) {
    const a = hash2D(cx, cy, 200 + i) * Math.PI * 2;
    let d = (0.2 + hash2D(cx, cy, 300 + i) * 0.62) * radius;

    let kind: IslandNode['kind'] = 'tree';
    const kr = hash2D(cx, cy, 400 + i);
    if (pirateRank && i === 0) {
      kind = 'pirate_camp';
    } else if (hasVillage && i === 0) {
      kind = 'village';
    } else if (i === 1 && (biome === 'pirata' || biome === 'abisal' || biome === 'desierto' || kr > 0.5)) {
      kind = 'chest';
    } else if (i === 2) {
      // Abandoned coastal/interior landmark on every island!
      const landRoll = hash2D(cx, cy, 431);
      if (biome === 'chatarra' || biome === 'minera') kind = 'abandoned_bunker';
      else if (biome === 'abisal' || biome === 'desierto') kind = 'abandoned_ruin';
      else if (landRoll > 0.5) {
        kind = 'abandoned_lighthouse';
        d = 0.72 * radius;
      } else {
        kind = 'shipwreck';
        d = 0.78 * radius;
      }
    } else if (i === 3) {
      // Second structure: either inhabited fishing post or extra ruin/shipwreck!
      if (hasVillage || biome === 'tropical' || biome === 'pradera') {
        kind = hash2D(cx, cy, 443) > 0.4 ? 'fishing_post' : 'abandoned_ruin';
        if (kind === 'fishing_post') d = 0.75 * radius;
      } else {
        kind = hash2D(cx, cy, 449) > 0.5 ? 'shipwreck' : 'abandoned_bunker';
        if (kind === 'shipwreck') d = 0.78 * radius;
      }
    } else if (i === 4 && hash2D(cx, cy, 461) > 0.38) {
      kind = biome === 'pirata' ? 'pirate_camp' : 'abandoned_ruin';
    } else if ((biome === 'chatarra' || biome === 'abisal') && kr > 0.52) {
      kind = 'tech_wreck';
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
    } else if (biome === 'abisal' && kr > 0.42) {
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
              : kind === 'abandoned_ruin' || kind === 'abandoned_lighthouse' || kind === 'shipwreck' || kind === 'abandoned_bunker'
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

    if (biome === 'pradera' || hasVillage) {
      kind = roll > 0.65 ? 'goat' : roll > 0.32 ? 'pig' : 'chicken';
    } else if (biome === 'desierto') {
      kind = roll > 0.4 ? 'scorpion' : 'goat';
    } else if (biome === 'volcanica' || biome === 'pirata' || biome === 'minera') {
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
