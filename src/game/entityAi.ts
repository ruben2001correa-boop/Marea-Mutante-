import type {
  AnimalEntity,
  CombatFaction,
  EnemyEntity,
  EnemyKind,
  IslandEntity,
  NpcMoodState,
  PersistentState,
  PlayerEntity,
  RaftEntity,
  SurvivorDef,
  SurvivorState,
} from './types';
import { hasWarshipPassive } from './constants';
import { getIslandFactionControl, getIslandRadiusAtAngle, pointInIsland } from './worldGen';

export function getEnemyFaction(e: EnemyEntity): CombatFaction {
  if (e.kind === 'marine_patrol' || e.kind === 'marine_captain' || e.kind === 'gov_agent') {
    return 'marina_gov';
  }
  if (e.isBandit || e.isHacker) {
    return 'pirate';
  }
  return 'monster';
}

export function areFactionsHostile(
  a: CombatFaction,
  b: CombatFaction,
  _kindA?: EnemyKind,
  _kindB?: EnemyKind
): boolean {
  if (a === 'neutral' || b === 'neutral') return false;
  if (a === 'pirate' && b === 'marina_gov') return true;
  if (a === 'marina_gov' && b === 'pirate') return true;
  if (a === 'monster' && b !== 'monster') return true;
  if (b === 'monster' && a !== 'monster') return true;
  return false;
}

export function resolveIslandFactionAccessForEnemy(
  e: EnemyEntity,
  islands: IslandEntity[]
): { blocked: boolean; blockedByControl?: 'marina_gov' | 'pirate' | 'neutral_safe'; island?: IslandEntity } {
  const faction = getEnemyFaction(e);
  if (e.isLeviathan && e.swallowTargetIslandId) {
    return { blocked: false };
  }
  for (const isl of islands) {
    const dx = e.x - isl.x;
    const dy = e.y - isl.y;
    const dist = Math.hypot(dx, dy);
    if (dist > isl.radius * 1.25 + e.radius + 14) continue;
    const control = getIslandFactionControl(isl);
    if (control === 'wild') continue;

    // Neutral safe zones deter all hostile entities from entering or fighting inside
    const shouldBlock =
      control === 'neutral_safe' ||
      (control === 'marina_gov' && faction === 'pirate') ||
      (control === 'pirate' && faction === 'marina_gov');

    if (!shouldBlock) continue;
    const edgeR = getIslandRadiusAtAngle(isl, dx, dy) + e.radius + 10;
    if (dist < edgeR) {
      const safeDist = Math.max(0.001, dist);
      e.x = isl.x + (dx / safeDist) * edgeR;
      e.y = isl.y + (dy / safeDist) * edgeR;
      return { blocked: true, blockedByControl: control, island: isl };
    }
  }
  return { blocked: false };
}

export function findHostileFactionEnemyTarget(
  e: EnemyEntity,
  allEnemies: EnemyEntity[],
  islands: IslandEntity[],
  maxRange = 420
): EnemyEntity | null {
  const myFaction = getEnemyFaction(e);
  if (myFaction === 'neutral') return null;
  if (e.isLeviathan && !e.provoked) return null;

  let best: EnemyEntity | null = null;
  let bestDist = maxRange;

  for (const other of allEnemies) {
    if (other.id === e.id || other.hp <= 0) continue;
    if (other.isLeviathan && !other.provoked) continue;
    const otherFaction = getEnemyFaction(other);
    if (!areFactionsHostile(myFaction, otherFaction, e.kind, other.kind)) continue;

    // Respect territorial tether if enemy has one
    if (
      typeof e.homeX === 'number' &&
      typeof e.homeY === 'number' &&
      typeof e.territoryRadius === 'number' &&
      Math.hypot(other.x - e.homeX, other.y - e.homeY) > e.territoryRadius
    ) {
      continue;
    }

    // Never target entities standing inside a neutral safe zone island
    const otherInSafe = islands.some(
      (isl) => getIslandFactionControl(isl) === 'neutral_safe' && pointInIsland(other.x, other.y, isl)
    );
    if (otherInSafe) continue;

    const d = Math.hypot(other.x - e.x, other.y - e.y);
    if (d < bestDist) {
      bestDist = d;
      best = other;
    }
  }
  return best;
}

export interface CrewHumanAiDecision {
  targetIndex: number;
  dmgMult: number;
  cdMult: number;
  tacticalCallout?: string;
}

export interface EnemySteeringOutput {
  targetX: number;
  targetY: number;
  speedMult: number;
  barkText?: string;
  barkColor?: string;
}

export interface WildlifeSteeringOutput {
  vx: number;
  vy: number;
  gaitMult: number;
}

const PIRATE_BARKS = {
  engage: [
    '¡Abran fuego sobre esa balsa!',
    '¡Nada personal, capitán: necesitamos comida y madera!',
    '¡Rodeen el casco por ambos flancos!',
    '¡Si no te hundes hoy, nos darás tu chatarra!',
    '¡Cuidado, ese loco viene armado!',
  ],
  flank: [
    '¡Cúbreme mientras flanqueo la cubierta!',
    '¡No te quedes quieto, muévete en zigzag!',
    '¡Lo tengo en la mira desde estribor!',
  ],
  flee: [
    '¡Retirada! ¡Este capitán está completamente loco!',
    '¡Demasiado daño, retrocedan!',
    '¡No vale la pena morir por unas tablas!',
  ],
  thiefFlee: [
    '¡Ya tengo el botín, nos vemos en la bruma!',
    '¡Corre, corre antes de que dispare el cañón!',
  ],
  boss: [
    '¡Soy el azote de estas cenizas! ¡Nadie cruza mi sector sin pagar!',
    '¡Mis hombres tienen hambre y tu navío será nuestra cena!',
    '¡Fuego a discreción! ¡Partan ese timón en dos!',
  ],
  hacker: [
    '¡Inyectando virus en tus torretas y radio naval!',
    '¡Tu energía y oro ahora pasan a mi servidor pirata!',
    '¡Firewall roto! ¡Apagando sistemas del buque!',
  ],
  zombie: [
    'Grrrhh... ¡carne fresca!',
    '¡Braaaains... sal y sangre!',
    'Raaagh... ¡no huyas del muelle maldito!',
  ],
  abyssal: [
    '¡Las fosas profundas reclaman tu casco!',
    '¡Ningún mortal regresa de la penumbra abisal!',
    '¡Siente el peso de diez mil brazas!',
  ],
  marina: [
    '¡Alto en nombre de La Marina! ¡Muestra tu bandera y ríndete!',
    '¡Tu recompensa está confirmada! ¡Fuego de intercepción!',
    '¡Puesto de control activado! ¡No pasarás este estrecho!',
  ],
  gobierno: [
    '¡Orden directa del Gobierno Mundial: eliminar objetivo prioritario!',
    '¡Violaste los decretos del Consejo! ¡Nadie escapa de nuestra sombra!',
    '¡Agentes de élite desplegados! ¡Confisquen todo rastro antiguo!',
  ],
};

const CREW_CALLOUTS = {
  thief: [
    '¡Ojo, un ladrón intenta llevarse nuestros suministros!',
    '¡Intercepten a ese saqueador antes de que salte al agua!',
  ],
  gunner: [
    '¡Tirador pirata flanqueando! ¡Lo tengo fijado!',
    '¡Cuidado con las balas desde estribor!',
  ],
  boarder: [
    '¡Piratas intentando abordar la cubierta!',
    '¡Defiendan el timón, vienen encima!',
  ],
  hacker: [
    '¡Alerta! ¡Un Hacker enemigo intenta sabotear nuestras torretas!',
    '¡Bajen a ese cibercorsario antes de que drene el oro!',
  ],
  zombie: [
    '¡Zombis mutantes saliendo de la costa! ¡Disparen!',
    '¡No dejen que esos muertos vivientes suban a bordo!',
  ],
  monster: [
    '¡Bestia mutante en el agua! ¡Apuntando!',
    '¡Fuego sobre ese depredador antes de que golpee el casco!',
  ],
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * IA HUMANA (Tripulación): Evalúa prioridad táctica de blancos, moral emocional y avisos de combate.
 */
export function evaluateCrewHumanAi(
  _sv: SurvivorState,
  def: SurvivorDef,
  npcMood: NpcMoodState | undefined,
  enemies: EnemyEntity[],
  raft: RaftEntity,
  halfRaft: number,
  state?: PersistentState
): CrewHumanAiDecision {
  const mood = npcMood?.mood || 'equilibrio';
  let dmgMult = 1;
  let cdMult = 1;

  if (mood === 'enojo') {
    dmgMult = 1.24;
    cdMult = 0.84;
  } else if (mood === 'orgullo') {
    dmgMult = 1.18;
    cdMult = 0.9;
  } else if (mood === 'felicidad') {
    dmgMult = 1.12;
    cdMult = 0.92;
  } else if (mood === 'soberbia') {
    dmgMult = 1.22;
    cdMult = 0.95;
  } else if (mood === 'tristeza') {
    dmgMult = 0.86;
    cdMult = 1.15;
  } else if (mood === 'cansancio') {
    dmgMult = 0.82;
    cdMult = 1.22;
  }

  const affinityBonus = Math.max(-0.08, Math.min(0.16, (npcMood?.affinity || 0) * 0.002));
  dmgMult += affinityBonus;

  if (state && hasWarshipPassive(state, 'wp_cubierta_tripulacion')) {
    dmgMult *= 1.22;
    cdMult *= 0.82;
  }

  const reach = def.attackRange + halfRaft * 0.45;
  let bestIdx = -1;
  let bestScore = -Infinity;
  let calloutKind: keyof typeof CREW_CALLOUTS | null = null;

  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    if (e.isLeviathan && !e.provoked) continue;
    const dist = Math.hypot(e.x - raft.x, e.y - raft.y);
    if (dist > reach) continue;

    let priority = 200 - dist * 0.45;
    if (e.isThief && (e.stolenBag || e.stealProgress > 0)) {
      priority += 280;
    } else if (e.isHacker) {
      priority += 245;
    } else if (e.boardedRaft) {
      priority += 210;
    } else if (e.kind === 'bandit_gunner') {
      priority += 140;
    } else if (e.isBoss) {
      priority += 175;
    } else if (e.isSemiBoss) {
      priority += 155;
    } else if (e.isZombie) {
      priority += 120;
    } else if (e.isLargeMonster) {
      priority += 110;
    }
    if (e.hp / Math.max(1, e.maxHp) < 0.35) {
      priority += 60;
    }

    if (priority > bestScore) {
      bestScore = priority;
      bestIdx = i;
      if (e.isThief) calloutKind = 'thief';
      else if (e.isHacker) calloutKind = 'hacker';
      else if (e.isZombie) calloutKind = 'zombie';
      else if (e.kind === 'bandit_gunner') calloutKind = 'gunner';
      else if (e.boardedRaft || e.isBandit) calloutKind = 'boarder';
      else calloutKind = 'monster';
    }
  }

  const tacticalCallout =
    bestIdx >= 0 && calloutKind && Math.random() < 0.14 ? pick(CREW_CALLOUTS[calloutKind]) : undefined;

  return {
    targetIndex: bestIdx,
    dmgMult,
    cdMult,
    tacticalCallout,
  };
}

/**
 * IA HUMANA (Piratas, Bandidos, Hackers & Zombis)
 */
export function computePirateHumanAi(
  e: EnemyEntity,
  dt: number,
  ctx: {
    pl: PlayerEntity;
    targetPos?: { x: number; y: number } | null;
    raft: RaftEntity;
    halfRaft: number;
    protectedNow: boolean;
    allEnemies: EnemyEntity[];
    state: PersistentState;
    worldTime: number;
  }
): EnemySteeringOutput {
  e.aiTimer = Math.max(0, (e.aiTimer || 0) - dt);
  e.aiBarkCd = Math.max(0, (e.aiBarkCd || 0) - dt);
  if (!e.strafeDir) {
    e.strafeDir = e.id % 2 === 0 ? 1 : -1;
  }
  if (e.aiTimer <= 0) {
    e.aiTimer = 1.6 + Math.random() * 1.8;
    if (Math.random() < 0.55) e.strafeDir *= -1;
  }

  const { pl, targetPos, raft, halfRaft, protectedNow, allEnemies, state } = ctx;
  const focusX = targetPos ? targetPos.x : pl.x;
  const focusY = targetPos ? targetPos.y : pl.y;
  const distToPl = Math.hypot(focusX - e.x, focusY - e.y) || 1;
  const hpRatio = e.hp / Math.max(1, e.maxHp);
  const nearbyAllies = allEnemies.filter(
    (other) => other.id !== e.id && (other.isBandit || other.isZombie || other.isHacker) && Math.hypot(other.x - e.x, other.y - e.y) < 260
  ).length;

  let barkText: string | undefined;
  let barkColor = '#fca5a5';

  // Territorial boundary check for bosses/semi-bosses: never pursue outside home territory
  if (
    typeof e.homeX === 'number' &&
    typeof e.homeY === 'number' &&
    typeof e.territoryRadius === 'number' &&
    !e.bountyId &&
    !e.storyMissionId
  ) {
    const plDistHome = Math.hypot(focusX - e.homeX, focusY - e.homeY);
    if (plDistHome > e.territoryRadius) {
      e.aiState = 'patrol';
      const patAng = ctx.worldTime * 0.55 + e.id * 1.1;
      const patR = e.territoryRadius * 0.42;
      return {
        targetX: e.homeX + Math.cos(patAng) * patR,
        targetY: e.homeY + Math.sin(patAng) * patR,
        speedMult: 0.62,
      };
    }
  }

  // 1. Stealth/Shelter/SafeZone deterrence (applies when pursuing hidden player, not enemy faction targets)
  if (!targetPos && protectedNow && !e.isBoss) {
    e.aiState = 'flee';
    e.stealProgress = 0;
    return {
      targetX: e.x + (e.x - pl.x),
      targetY: e.y + (e.y - pl.y),
      speedMult: 0.95,
    };
  }

  // Marina & Gobierno Mundial AI: tactical intercept, flank and decree pursuit
  if (e.kind === 'marine_patrol' || e.kind === 'marine_captain' || e.kind === 'gov_agent') {
    const isGov = e.kind === 'gov_agent';
    if (e.aiBarkCd <= 0 && distToPl < 360 && Math.random() < 0.24) {
      e.aiBarkCd = 10;
      barkText = pick(isGov ? PIRATE_BARKS.gobierno : PIRATE_BARKS.marina);
      barkColor = isGov ? '#e2e8f0' : '#60a5fa';
    }
    const ang = Math.atan2(focusY - e.y, focusX - e.x);
    const tangent = ang + (Math.PI / 2) * e.strafeDir;
    if (isGov) {
      const weave = distToPl > 120 ? Math.sin(ctx.worldTime * 4.1 + e.id) * 65 : 0;
      return {
        targetX: focusX + Math.cos(tangent) * weave,
        targetY: focusY + Math.sin(tangent) * weave,
        speedMult: 1.24,
        barkText,
        barkColor,
      };
    }
    if (distToPl < 220) {
      return {
        targetX: e.x + Math.cos(tangent) * 120 + Math.cos(ang) * 45,
        targetY: e.y + Math.sin(tangent) * 120 + Math.sin(ang) * 45,
        speedMult: e.kind === 'marine_captain' ? 1.12 : 1.0,
        barkText,
        barkColor,
      };
    }
    return {
      targetX: focusX + Math.cos(tangent) * 60,
      targetY: focusY + Math.sin(tangent) * 60,
      speedMult: 1.06,
      barkText,
      barkColor,
    };
  }

  // Abyssal Knights, Wardens & Arch-Necromancers: relentless pressure + flanking + ranged magic/bones
  if (
    e.kind === 'abysmal_knight' ||
    e.kind === 'abysmal_warden' ||
    e.kind === 'abysmal_necromancer'
  ) {
    if (e.aiBarkCd <= 0 && distToPl < 360 && Math.random() < 0.25) {
      e.aiBarkCd = 10;
      barkText = pick(PIRATE_BARKS.abyssal);
      barkColor = e.kind === 'abysmal_necromancer' ? '#c084fc' : '#22d3ee';
    }
    const ang = Math.atan2(pl.y - e.y, pl.x - e.x);
    const tangent = ang + (Math.PI / 2) * e.strafeDir;
    if (e.kind === 'abysmal_necromancer' && distToPl < 250) {
      return {
        targetX: e.x + Math.cos(tangent) * 140 - Math.cos(ang) * 40,
        targetY: e.y + Math.sin(tangent) * 140 - Math.sin(ang) * 40,
        speedMult: 0.96,
        barkText,
        barkColor,
      };
    }
    const weave = distToPl > 85 ? Math.sin(ctx.worldTime * 3.4 + e.id) * 55 : 0;
    return {
      targetX: pl.x + Math.cos(ang + Math.PI / 2) * weave,
      targetY: pl.y + Math.sin(ang + Math.PI / 2) * weave,
      speedMult: e.kind === 'abysmal_knight' ? 1.16 : 1.04,
      barkText,
      barkColor,
    };
  }

  // Zombie AI: Relentless horde shambling or charging (spitters keep mid distance)
  if (e.isZombie) {
    if (e.aiBarkCd <= 0 && distToPl < 300 && Math.random() < 0.18) {
      e.aiBarkCd = 11;
      barkText = pick(PIRATE_BARKS.zombie);
      barkColor = '#84cc16';
    }
    if (e.kind === 'zombie_spitter' && distToPl > 130 && distToPl < 280) {
      const ang = Math.atan2(pl.y - e.y, pl.x - e.x);
      const tang = ang + (Math.PI / 2) * e.strafeDir;
      return {
        targetX: e.x + Math.cos(tang) * 100,
        targetY: e.y + Math.sin(tang) * 100,
        speedMult: 0.85,
        barkText,
        barkColor,
      };
    }
    return {
      targetX: pl.x,
      targetY: pl.y,
      speedMult: e.kind === 'zombie_brute' ? 0.92 : 1.08,
      barkText,
      barkColor,
    };
  }

  // Hacker AI: Jammer & Siphoner kite around the ship at mid-range to disrupt turrets/drain resources
  if (e.isHacker) {
    if (e.aiBarkCd <= 0 && distToPl < 360 && Math.random() < 0.25) {
      e.aiBarkCd = 10;
      barkText = pick(PIRATE_BARKS.hacker);
      barkColor = '#22d3ee';
    }
    const angToRaft = Math.atan2(raft.y - e.y, raft.x - e.x);
    const tang = angToRaft + (Math.PI / 2) * e.strafeDir;
    const distRaft = Math.hypot(raft.x - e.x, raft.y - e.y);
    if (e.kind === 'hacker_siphoner' && distRaft > 180) {
      return {
        targetX: raft.x + Math.cos(tang) * 70,
        targetY: raft.y + Math.sin(tang) * 70,
        speedMult: 1.15,
        barkText,
        barkColor,
      };
    }
    if (distToPl < 250) {
      return {
        targetX: e.x + Math.cos(tang) * 135 - Math.cos(angToRaft) * 50,
        targetY: e.y + Math.sin(tang) * 135 - Math.sin(angToRaft) * 50,
        speedMult: 1.05,
        barkText,
        barkColor,
      };
    }
    return {
      targetX: pl.x + Math.cos(tang) * 90,
      targetY: pl.y + Math.sin(tang) * 90,
      speedMult: 1.06,
      barkText,
      barkColor,
    };
  }

  // 2. Thief carrying stolen goods sprints away
  if (e.isThief && e.stolenBag) {
    e.aiState = 'flee';
    if (e.aiBarkCd <= 0 && distToPl < 380) {
      e.aiBarkCd = 8;
      barkText = pick(PIRATE_BARKS.thiefFlee);
      barkColor = '#fbbf24';
    }
    return {
      targetX: e.x + (e.x - pl.x),
      targetY: e.y + (e.y - pl.y),
      speedMult: 1.32,
      barkText,
      barkColor,
    };
  }

  // 3. Low-HP human self-preservation retreat
  const captainScary = state.vitals?.mood === 'lokito' || state.vitals?.mood === 'soberbia';
  if (!e.isBoss && hpRatio < (captainScary ? 0.3 : 0.2) && nearbyAllies === 0 && distToPl < 240) {
    e.aiState = 'flee';
    if (e.aiBarkCd <= 0) {
      e.aiBarkCd = 9;
      barkText = pick(PIRATE_BARKS.flee);
      barkColor = '#fb923c';
    }
    return {
      targetX: e.x + (e.x - pl.x),
      targetY: e.y + (e.y - pl.y),
      speedMult: 1.15,
      barkText,
      barkColor,
    };
  }

  // 4. Ranged Gunner Human AI
  if (e.kind === 'bandit_gunner') {
    const angToPl = Math.atan2(focusY - e.y, focusX - e.x);
    const tangentAng = angToPl + (Math.PI / 2) * e.strafeDir;
    e.aiState = 'flank';

    if (e.aiBarkCd <= 0 && distToPl < 360 && Math.random() < 0.28) {
      e.aiBarkCd = 11;
      barkText = pick(PIRATE_BARKS.flank);
    }

    if (distToPl < 145) {
      return {
        targetX: e.x - Math.cos(angToPl) * 140 + Math.cos(tangentAng) * 75,
        targetY: e.y - Math.sin(angToPl) * 140 + Math.sin(tangentAng) * 75,
        speedMult: 1.08,
        barkText,
        barkColor,
      };
    }
    if (distToPl <= 275) {
      return {
        targetX: e.x + Math.cos(tangentAng) * 120,
        targetY: e.y + Math.sin(tangentAng) * 120,
        speedMult: 0.92,
        barkText,
        barkColor,
      };
    }
    return {
      targetX: focusX + Math.cos(tangentAng) * 85,
      targetY: focusY + Math.sin(tangentAng) * 85,
      speedMult: 1.04,
      barkText,
      barkColor,
    };
  }

  // 5. Thief approaching raft cargo
  if (e.isThief && !targetPos) {
    e.aiState = 'board';
    return {
      targetX: raft.x,
      targetY: raft.y,
      speedMult: 1.12,
    };
  }

  // 6. Melee Grunt & Pirate Boss
  e.aiState = distToPl < halfRaft + 80 ? 'board' : 'flank';
  const ang = Math.atan2(focusY - e.y, focusX - e.x);
  const weave = distToPl > 90 ? Math.sin(ctx.worldTime * 3.1 + e.id) * 58 : 0;
  const perp = ang + Math.PI / 2;
  const packBoost = 1 + Math.min(0.22, nearbyAllies * 0.08);

  if (e.aiBarkCd <= 0 && distToPl < 320 && Math.random() < 0.25) {
    e.aiBarkCd = 10 + Math.random() * 5;
    barkText = e.isBoss ? pick(PIRATE_BARKS.boss) : pick(PIRATE_BARKS.engage);
    barkColor = e.isBoss ? '#fbbf24' : '#fca5a5';
  }

  return {
    targetX: focusX + Math.cos(perp) * weave,
    targetY: focusY + Math.sin(perp) * weave,
    speedMult: packBoost,
    barkText,
    barkColor,
  };
}

/**
 * IA DE MONSTRUOS (Depredadores Marinos)
 */
export function computeSeaMonsterAi(
  e: EnemyEntity,
  dt: number,
  ctx: {
    pl: PlayerEntity;
    targetPos?: { x: number; y: number } | null;
    raft: RaftEntity;
    protectedNow: boolean;
    state: PersistentState;
    worldTime: number;
  }
): EnemySteeringOutput {
  e.aiTimer = Math.max(0, (e.aiTimer || 0) - dt);
  if (!e.strafeDir) {
    e.strafeDir = e.id % 2 === 0 ? 1 : -1;
  }

  const { pl, targetPos, raft, protectedNow, state, worldTime } = ctx;
  const focusX = targetPos ? targetPos.x : pl.x;
  const focusY = targetPos ? targetPos.y : pl.y;
  const distToPl = Math.hypot(focusX - e.x, focusY - e.y) || 1;
  const ang = Math.atan2(focusY - e.y, focusX - e.x);
  const tangent = ang + (Math.PI / 2) * e.strafeDir;

  // Territorial boundary check for abyssal bosses & semi-bosses: stay home and only attack trespassers
  if (
    typeof e.homeX === 'number' &&
    typeof e.homeY === 'number' &&
    typeof e.territoryRadius === 'number' &&
    !e.bountyId &&
    !e.storyMissionId
  ) {
    const plDistHome = Math.hypot(focusX - e.homeX, focusY - e.homeY);
    if (plDistHome > e.territoryRadius) {
      e.aiState = 'patrol';
      const patAng = worldTime * 0.48 + e.id * 1.3;
      const patR = e.territoryRadius * 0.45;
      return {
        targetX: e.homeX + Math.cos(patAng) * patR,
        targetY: e.homeY + Math.sin(patAng) * patR,
        speedMult: 0.58,
      };
    }
  }

  if (!targetPos && protectedNow && !e.isLeviathan) {
    e.aiState = 'flee';
    return {
      targetX: e.x + (e.x - pl.x),
      targetY: e.y + (e.y - pl.y),
      speedMult: 0.95,
    };
  }

  if (e.kind === 'shark') {
    const bloodFrenzy = state.hp / Math.max(1, state.maxHp) < 0.55 || raft.hp / Math.max(1, raft.maxHp) < 0.5;
    if (e.aiTimer <= 0) {
      if (e.aiState === 'lunge') {
        e.aiState = 'stalk';
        e.aiTimer = bloodFrenzy ? 1.2 : 2.1;
        e.strafeDir *= -1;
      } else if (distToPl < 280) {
        e.aiState = 'lunge';
        e.aiTimer = bloodFrenzy ? 1.75 : 1.35;
      } else {
        e.aiState = 'stalk';
        e.aiTimer = 1.6;
      }
    }

    if (e.aiState === 'lunge') {
      return {
        targetX: focusX,
        targetY: focusY,
        speedMult: bloodFrenzy ? 1.65 : 1.48,
      };
    }

    const orbitDist = 175;
    return {
      targetX: focusX - Math.cos(ang) * orbitDist + Math.cos(tangent) * 140,
      targetY: focusY - Math.sin(ang) * orbitDist + Math.sin(tangent) * 140,
      speedMult: bloodFrenzy ? 1.15 : 0.96,
    };
  }

  if (e.kind === 'kraken') {
    if (e.aiTimer <= 0) {
      e.aiState = e.aiState === 'lunge' ? 'flank' : 'lunge';
      e.aiTimer = e.aiState === 'lunge' ? 2.0 : 2.4;
    }
    if (e.aiState === 'lunge') {
      return {
        targetX: focusX,
        targetY: focusY,
        speedMult: 1.28,
      };
    }
    return {
      targetX: (targetPos ? focusX : raft.x) + Math.cos(tangent) * 145,
      targetY: (targetPos ? focusY : raft.y) + Math.sin(tangent) * 145,
      speedMult: 0.92,
    };
  }

  // Abyssal Semi-Bosses & Bosses steering patterns
  if (e.kind.startsWith('abysmal_')) {
    if (e.aiTimer <= 0) {
      e.aiState = e.aiState === 'lunge' ? 'flank' : 'lunge';
      e.aiTimer = e.aiState === 'lunge' ? 1.9 : 2.1;
      if (Math.random() < 0.5) e.strafeDir *= -1;
    }
    if (e.kind === 'abysmal_siren' || e.kind === 'abysmal_empress') {
      const orbitDist = e.kind === 'abysmal_empress' ? 235 : 185;
      return {
        targetX: focusX - Math.cos(ang) * orbitDist + Math.cos(tangent) * 150,
        targetY: focusY - Math.sin(ang) * orbitDist + Math.sin(tangent) * 150,
        speedMult: 1.06,
      };
    }
    if (e.kind === 'abysmal_eel' || e.kind === 'abysmal_angler') {
      const lunge = e.aiState === 'lunge';
      return {
        targetX: lunge ? focusX : focusX + Math.cos(tangent) * 165,
        targetY: lunge ? focusY : focusY + Math.sin(tangent) * 165,
        speedMult: lunge ? 1.48 : 1.05,
      };
    }
    if (e.kind === 'abysmal_behemoth' || e.kind === 'abysmal_golem') {
      return {
        targetX: focusX,
        targetY: focusY,
        speedMult: e.aiState === 'lunge' ? 1.25 : 0.92,
      };
    }
    // Hydra & Sovereign: multi-angle encirclement + aggressive surge
    return {
      targetX: focusX + Math.cos(tangent) * (e.aiState === 'lunge' ? 35 : 155),
      targetY: focusY + Math.sin(tangent) * (e.aiState === 'lunge' ? 35 : 155),
      speedMult: e.aiState === 'lunge' ? 1.32 : 1.04,
    };
  }

  e.aiState = Math.sin(worldTime * 2.4 + e.id) > 0.35 ? 'lunge' : 'stalk';
  const pulseMult = e.aiState === 'lunge' ? 1.24 : 0.84;
  const sway = Math.sin(worldTime * 3.0 + e.id) * 44;
  return {
    targetX: focusX + Math.cos(tangent) * sway,
    targetY: focusY + Math.sin(tangent) * sway,
    speedMult: pulseMult,
  };
}

/**
 * IA DE MONSTRUOS / FAUNA DE ISLA
 */
export function computeWildlifeMonsterAi(
  a: AnimalEntity,
  _isl: IslandEntity,
  dt: number,
  ctx: {
    pl: PlayerEntity;
    allAnimals: AnimalEntity[];
    stealthActive: boolean;
  }
): WildlifeSteeringOutput {
  a.aiTimer = Math.max(0, (a.aiTimer || 0) - dt);
  const { pl, allAnimals, stealthActive } = ctx;
  const distPl = Math.hypot(pl.x - a.x, pl.y - a.y) || 1;
  const ang = Math.atan2(pl.y - a.y, pl.x - a.x);

  if (!a.isWild) {
    if (!stealthActive && distPl < 72 && Math.hypot(pl.vx, pl.vy) > 95) {
      a.aiState = 'flee';
      return {
        vx: -Math.cos(ang) * 42,
        vy: -Math.sin(ang) * 42,
        gaitMult: 1.3,
      };
    }
    a.aiState = 'graze';
    a.wanderT -= dt;
    if (a.wanderT <= 0) {
      a.wanderT = 2 + Math.random() * 3.2;
      const wAng = Math.random() * Math.PI * 2;
      const spd = Math.random() < 0.62 ? 24 : 0;
      return {
        vx: Math.cos(wAng) * spd,
        vy: Math.sin(wAng) * spd,
        gaitMult: 1,
      };
    }
    return { vx: a.vx, vy: a.vy, gaitMult: 1 };
  }

  if (distPl < 155 && !pl.inShelter && !stealthActive) {
    if (a.kind === 'boar') {
      if (a.aiTimer <= 0) {
        a.aiState = a.aiState === 'charge' ? 'stalk' : 'charge';
        a.aiTimer = a.aiState === 'charge' ? 1.15 : 1.0;
      }
      const spd = a.aiState === 'charge' ? 116 : 48;
      return {
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        gaitMult: a.aiState === 'charge' ? 1.7 : 0.85,
      };
    }

    if (a.kind === 'wolf') {
      const packMate = allAnimals.some(
        (other) =>
          other.id !== a.id &&
          other.kind === 'wolf' &&
          Math.hypot(other.x - a.x, other.y - a.y) < 170
      );
      const flankSign = a.id % 2 === 0 ? 1 : -1;
      const flankAng = distPl > 55 ? ang + flankSign * 0.42 : ang;
      const spd = packMate ? 96 : 80;
      a.aiState = 'charge';
      return {
        vx: Math.cos(flankAng) * spd,
        vy: Math.sin(flankAng) * spd,
        gaitMult: 1.4,
      };
    }

    a.aiState = 'stalk';
    return {
      vx: Math.cos(ang) * 78,
      vy: Math.sin(ang) * 78,
      gaitMult: 1.2,
    };
  }

  a.aiState = 'graze';
  a.wanderT -= dt;
  if (a.wanderT <= 0) {
    a.wanderT = 2 + Math.random() * 3;
    const wAng = Math.random() * Math.PI * 2;
    const spd = Math.random() < 0.65 ? 28 : 0;
    return {
      vx: Math.cos(wAng) * spd,
      vy: Math.sin(wAng) * spd,
      gaitMult: 1,
    };
  }
  return { vx: a.vx, vy: a.vy, gaitMult: 1 };
}
