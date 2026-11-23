import type {
  EmotionalMood,
  NpcAttitudeMood,
  PersistentState,
  PlayerEntity,
  PlayerVitalsState,
  SituationalState,
  WeatherType,
} from './types';

export interface MoodMeta {
  id: NpcAttitudeMood;
  label: string;
  shortLabel: string;
  color: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  description: string;
}

export const MOOD_META: Record<NpcAttitudeMood, MoodMeta> = {
  equilibrio: {
    id: 'equilibrio',
    label: 'Equilibrio',
    shortLabel: 'Sereno',
    color: '#94a3b8',
    bgClass: 'bg-slate-500/15',
    borderClass: 'border-slate-400/40',
    textClass: 'text-slate-200',
    description: 'Mente serena y estable. Rendimiento base equilibrado.',
  },
  felicidad: {
    id: 'felicidad',
    label: 'Felicidad',
    shortLabel: 'Feliz',
    color: '#34d399',
    bgClass: 'bg-emerald-500/20',
    borderClass: 'border-emerald-400/55',
    textClass: 'text-emerald-200',
    description: '+18% Velocidad, +15% Daño, +35% Reg. ST, -12% Daño recibido.',
  },
  tristeza: {
    id: 'tristeza',
    label: 'Tristeza',
    shortLabel: 'Triste',
    color: '#60a5fa',
    bgClass: 'bg-blue-500/20',
    borderClass: 'border-blue-400/55',
    textClass: 'text-blue-200',
    description: '-22% Velocidad, -25% Daño CaC, -18% Daño Dist, -30% Reg. ST.',
  },
  enojo: {
    id: 'enojo',
    label: 'Enojo',
    shortLabel: 'Enojado',
    color: '#fb7185',
    bgClass: 'bg-rose-500/20',
    borderClass: 'border-rose-400/55',
    textClass: 'text-rose-200',
    description: '+42% Daño CaC, +18% Daño Dist, pero +35% Daño recibido y +35% gasto ST.',
  },
  orgullo: {
    id: 'orgullo',
    label: 'Orgullo',
    shortLabel: 'Orgulloso',
    color: '#fbbf24',
    bgClass: 'bg-amber-500/20',
    borderClass: 'border-amber-400/55',
    textClass: 'text-amber-200',
    description: '+24% Daño CaC, +22% Daño Dist, +8% Velocidad, -10% Daño recibido.',
  },
  soberbia: {
    id: 'soberbia',
    label: 'Soberbia',
    shortLabel: 'Soberbio',
    color: '#f97316',
    bgClass: 'bg-orange-500/25',
    borderClass: 'border-orange-400/65',
    textClass: 'text-orange-200',
    description: '¡Arrogancia extrema! +48% Daño CaC, +32% Dist, pero +45% Daño recibido y molesta a NPCs.',
  },
  lokito: {
    id: 'lokito',
    label: '¡Lokito! (Crisis Mental)',
    shortLabel: 'Lokito',
    color: '#e879f9',
    bgClass: 'bg-fuchsia-500/25',
    borderClass: 'border-fuchsia-400/75',
    textClass: 'text-fuchsia-200',
    description: 'Salud mental quebrada: +28% Vel, +35% CaC, -38% Puntería Dist, +55% Daño recibido y alucinaciones.',
  },
  cansancio: {
    id: 'cansancio',
    label: 'Cansancio',
    shortLabel: 'Cansado',
    color: '#a78bfa',
    bgClass: 'bg-violet-500/20',
    borderClass: 'border-violet-400/50',
    textClass: 'text-violet-200',
    description: 'Cansancio acumulado por las guardias y el mar.',
  },
};

export interface SituationalMeta {
  id: SituationalState;
  label: string;
  shortLabel: string;
  icon: string;
  color: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  description: string;
}

export const SITUATIONAL_META: Record<SituationalState, SituationalMeta> = {
  normal: {
    id: 'normal',
    label: 'Normal',
    shortLabel: 'Normal',
    icon: '🧭',
    color: '#94a3b8',
    bgClass: 'bg-slate-500/15',
    borderClass: 'border-slate-400/40',
    textClass: 'text-slate-200',
    description: 'Sin presión extrema de combate.',
  },
  adrenalina: {
    id: 'adrenalina',
    label: 'Adrenalina de Combate',
    shortLabel: 'Adrenalina',
    icon: '⚡',
    color: '#f59e0b',
    bgClass: 'bg-amber-500/20',
    borderClass: 'border-amber-400/65',
    textClass: 'text-amber-200',
    description: 'Combate activo: +22% Vel, +20% Daño, -15% Daño recibido y +25% Reg. ST.',
  },
  berserker: {
    id: 'berserker',
    label: '¡Furia Berserker!',
    shortLabel: 'Berserker',
    icon: '🔥',
    color: '#f43f5e',
    bgClass: 'bg-rose-500/25',
    borderClass: 'border-rose-400/80',
    textClass: 'text-rose-100',
    description: '¡Lucha intensa! +35% Vel, +55% CaC, +30% Dist, -30% Daño recibido y +40% Reg. ST.',
  },
  enfoque: {
    id: 'enfoque',
    label: 'Enfoque Letal',
    shortLabel: 'Enfoque',
    icon: '🎯',
    color: '#22d3ee',
    bgClass: 'bg-cyan-500/20',
    borderClass: 'border-cyan-400/65',
    textClass: 'text-cyan-100',
    description: 'Pulso firme y mente clara: +12% Vel, +15% CaC, +32% Dist y -15% Daño recibido.',
  },
  determinacion: {
    id: 'determinacion',
    label: 'Determinación Férrea',
    shortLabel: 'Determinación',
    icon: '🛡️',
    color: '#fbbf24',
    bgClass: 'bg-yellow-500/25',
    borderClass: 'border-yellow-400/80',
    textClass: 'text-yellow-100',
    description: '¡Al límite sin rendirse! +20% Vel, +38% Daño, -35% Daño recibido y +30% Reg. ST.',
  },
  panico: {
    id: 'panico',
    label: 'Pánico de Huida',
    shortLabel: 'Pánico',
    icon: '😰',
    color: '#c084fc',
    bgClass: 'bg-purple-500/20',
    borderClass: 'border-purple-400/65',
    textClass: 'text-purple-100',
    description: 'Presión abrumadora: +26% Vel (huida), -20% Daño y +25% Gasto ST.',
  },
};

export interface ActiveVitalStatus {
  id: string;
  label: string;
  effectText: string;
  severity: 'good' | 'warn' | 'critical';
  color: string;
}

export interface VitalPerformanceModifiers {
  speedMult: number;
  meleeMult: number;
  rangedMult: number;
  defenseMult: number; // >1 means taking MORE damage, <1 means taking LESS damage
  staminaRegenMult: number;
  staminaCostMult: number;
  activeStatuses: ActiveVitalStatus[];
}

export function createInitialVitals(): PlayerVitalsState {
  return {
    thirst: 92,
    hunger: 92,
    sleepiness: 95,
    fatigue: 95,
    mentalHealth: 90,
    mood: 'equilibrio',
    moodTimer: 0,
    pridePoints: 10,
    situationalState: 'normal',
    combatIntensity: 0,
    situationalTimer: 0,
    satietyTimer: 0,
    hydrationTimer: 0,
  };
}

export function computeVitalPerformanceModifiers(
  state: PersistentState
): VitalPerformanceModifiers {
  const v = state.vitals || createInitialVitals();
  let speedMult = 1;
  let meleeMult = 1;
  let rangedMult = 1;
  let defenseMult = 1;
  let staminaRegenMult = 1;
  let staminaCostMult = 1;
  const activeStatuses: ActiveVitalStatus[] = [];

  // 1. Thirst (Sed — No mata, pero frena mucho y corta la regeneración de estamina)
  if (v.thirst <= 12) {
    speedMult *= 0.52;
    staminaRegenMult *= 0.25;
    staminaCostMult *= 1.55;
    meleeMult *= 0.8;
    activeStatuses.push({
      id: 'deshidratado',
      label: 'Deshidratación Severa',
      effectText: '-48% Vel · -75% Reg. ST · +55% Gasto ST (No quita HP)',
      severity: 'critical',
      color: '#38bdf8',
    });
  } else if (v.thirst <= 32) {
    speedMult *= 0.74;
    staminaRegenMult *= 0.54;
    staminaCostMult *= 1.3;
    activeStatuses.push({
      id: 'sed',
      label: 'Con Sed',
      effectText: '-26% Vel · -46% Reg. ST · +30% Gasto ST',
      severity: 'warn',
      color: '#7dd3fc',
    });
  }

  // 2. Hunger (Hambre — No mata, pero debilita movimiento, fuerza y estamina)
  if (v.hunger <= 12) {
    speedMult *= 0.66;
    staminaRegenMult *= 0.4;
    staminaCostMult *= 1.38;
    meleeMult *= 0.65;
    rangedMult *= 0.78;
    activeStatuses.push({
      id: 'hambruna',
      label: 'Hambre Extrema',
      effectText: '-34% Vel · -60% Reg. ST · -35% CaC (No quita HP)',
      severity: 'critical',
      color: '#fb923c',
    });
  } else if (v.hunger <= 32) {
    speedMult *= 0.85;
    staminaRegenMult *= 0.68;
    meleeMult *= 0.82;
    activeStatuses.push({
      id: 'hambre',
      label: 'Hambriento',
      effectText: '-15% Vel · -32% Reg. ST · -18% CaC',
      severity: 'warn',
      color: '#fdba74',
    });
  }

  // 3. Sleepiness (Sueño)
  if (v.sleepiness <= 12) {
    rangedMult *= 0.55;
    speedMult *= 0.66;
    staminaRegenMult *= 0.52;
    staminaCostMult *= 1.35;
    activeStatuses.push({
      id: 'sueno_extremo',
      label: 'Sueño Extremo',
      effectText: '-45% Puntería · -34% Vel · -48% Reg. ST',
      severity: 'critical',
      color: '#818cf8',
    });
  } else if (v.sleepiness <= 32) {
    rangedMult *= 0.78;
    speedMult *= 0.84;
    staminaCostMult *= 1.25;
    activeStatuses.push({
      id: 'sueno',
      label: 'Con Sueño',
      effectText: '-22% Dist · -16% Vel · +25% Gasto ST',
      severity: 'warn',
      color: '#a5b4fc',
    });
  }

  // 4. Fatigue (Cansancio)
  if (v.fatigue <= 12) {
    staminaRegenMult *= 0.25;
    meleeMult *= 0.62;
    speedMult *= 0.62;
    staminaCostMult *= 1.55;
    activeStatuses.push({
      id: 'agotado',
      label: 'Agotamiento Total',
      effectText: '-75% Reg. ST · -38% Vel · -38% CaC',
      severity: 'critical',
      color: '#c084fc',
    });
  } else if (v.fatigue <= 32) {
    staminaRegenMult *= 0.54;
    meleeMult *= 0.8;
    speedMult *= 0.82;
    activeStatuses.push({
      id: 'cansancio',
      label: 'Cansado',
      effectText: '-46% Reg. ST · -18% Vel · -20% CaC',
      severity: 'warn',
      color: '#d8b4fe',
    });
  }

  // Good food & water saturation states
  if ((v.satietyTimer || 0) > 0) {
    staminaRegenMult *= 1.15;
    activeStatuses.push({
      id: 'saciado',
      label: `🍲 Saciado (${Math.ceil(v.satietyTimer || 0)}s)`,
      effectText: '-68% pérdida de Hambre · +15% Reg. ST',
      severity: 'good',
      color: '#86efac',
    });
  }
  if ((v.hydrationTimer || 0) > 0) {
    staminaRegenMult *= 1.15;
    activeStatuses.push({
      id: 'hidratado',
      label: `💧 Hidratado (${Math.ceil(v.hydrationTimer || 0)}s)`,
      effectText: '-68% pérdida de Sed · +15% Reg. ST',
      severity: 'good',
      color: '#67e8f9',
    });
  }

  // Physical Prime bonus when well-tended
  if (v.thirst >= 75 && v.hunger >= 75 && v.sleepiness >= 75 && v.fatigue >= 75) {
    speedMult *= 1.1;
    staminaRegenMult *= 1.22;
    activeStatuses.push({
      id: 'plena_forma',
      label: 'Plena Forma Física',
      effectText: '+10% Vel · +22% Reg. ST',
      severity: 'good',
      color: '#34d399',
    });
  }

  // 5. Mental Health & Emotional State
  const effectiveMood: EmotionalMood = v.mentalHealth <= 28 ? 'lokito' : v.mood;
  const meta = MOOD_META[effectiveMood];

  if (effectiveMood === 'felicidad') {
    speedMult *= 1.18;
    meleeMult *= 1.15;
    rangedMult *= 1.15;
    staminaRegenMult *= 1.35;
    defenseMult *= 0.88;
  } else if (effectiveMood === 'tristeza') {
    speedMult *= 0.78;
    meleeMult *= 0.75;
    rangedMult *= 0.82;
    staminaRegenMult *= 0.7;
  } else if (effectiveMood === 'enojo') {
    meleeMult *= 1.42;
    rangedMult *= 1.18;
    defenseMult *= 1.35;
    staminaCostMult *= 1.35;
  } else if (effectiveMood === 'orgullo') {
    meleeMult *= 1.24;
    rangedMult *= 1.22;
    speedMult *= 1.08;
    defenseMult *= 0.9;
  } else if (effectiveMood === 'soberbia') {
    meleeMult *= 1.48;
    rangedMult *= 1.32;
    defenseMult *= 1.45;
    staminaCostMult *= 1.25;
  } else if (effectiveMood === 'lokito') {
    speedMult *= 1.28;
    meleeMult *= 1.35;
    rangedMult *= 0.62;
    defenseMult *= 1.55;
    staminaCostMult *= 1.45;
  }

  if (effectiveMood !== 'equilibrio') {
    activeStatuses.push({
      id: `mood_${effectiveMood}`,
      label: meta.label,
      effectText: meta.description,
      severity:
        effectiveMood === 'felicidad' || effectiveMood === 'orgullo'
          ? 'good'
          : effectiveMood === 'lokito' || effectiveMood === 'soberbia'
            ? 'critical'
            : 'warn',
      color: meta.color,
    });
  }

  // 6. Situational Combat & Survival State (Berserker, Adrenalina, Enfoque, Determinación, Pánico)
  const sitState: SituationalState = v.situationalState || 'normal';
  const sitMeta = SITUATIONAL_META[sitState];
  if (sitState === 'berserker') {
    speedMult *= 1.35;
    meleeMult *= 1.55;
    rangedMult *= 1.3;
    defenseMult *= 0.7;
    staminaRegenMult *= 1.4;
    staminaCostMult *= 0.75;
  } else if (sitState === 'adrenalina') {
    speedMult *= 1.22;
    meleeMult *= 1.2;
    rangedMult *= 1.2;
    defenseMult *= 0.85;
    staminaRegenMult *= 1.25;
  } else if (sitState === 'enfoque') {
    speedMult *= 1.12;
    meleeMult *= 1.15;
    rangedMult *= 1.32;
    defenseMult *= 0.85;
  } else if (sitState === 'determinacion') {
    speedMult *= 1.2;
    meleeMult *= 1.38;
    rangedMult *= 1.38;
    defenseMult *= 0.65;
    staminaRegenMult *= 1.3;
  } else if (sitState === 'panico') {
    speedMult *= 1.26;
    meleeMult *= 0.8;
    rangedMult *= 0.8;
    staminaCostMult *= 1.25;
  }

  if (sitState !== 'normal') {
    activeStatuses.push({
      id: `sit_${sitState}`,
      label: `${sitMeta.icon} ${sitMeta.label}`,
      effectText: sitMeta.description,
      severity:
        sitState === 'panico' ? 'warn' : sitState === 'berserker' ? 'critical' : 'good',
      color: sitMeta.color,
    });
  }

  return {
    speedMult: Math.max(0.35, Math.min(2.05, speedMult)),
    meleeMult: Math.max(0.38, Math.min(2.6, meleeMult)),
    rangedMult: Math.max(0.38, Math.min(2.3, rangedMult)),
    defenseMult: Math.max(0.5, Math.min(1.95, defenseMult)),
    staminaRegenMult: Math.max(0.2, Math.min(2.2, staminaRegenMult)),
    staminaCostMult: Math.max(0.6, Math.min(1.9, staminaCostMult)),
    activeStatuses,
  };
}

function resolveSituationalCandidate(
  state: PersistentState,
  opts?: {
    nearbyEnemiesCount?: number;
    nearBoss?: boolean;
    nearLeviathan?: boolean;
    dangerousWater?: boolean;
    weather?: WeatherType;
  }
): SituationalState {
  const v = state.vitals || createInitialVitals();
  const intensity = v.combatIntensity || 0;
  const hpRatio = state.hp / Math.max(1, state.maxHp);
  const enemiesNear = opts?.nearbyEnemiesCount ?? 0;

  if (
    hpRatio <= 0.3 &&
    v.mentalHealth <= 42 &&
    (opts?.nearLeviathan || (opts?.weather === 'tormenta' && opts?.dangerousWater) || enemiesNear >= 2)
  ) {
    return 'panico';
  }
  if (intensity >= 62 || (intensity >= 44 && (v.mood === 'enojo' || hpRatio <= 0.45))) {
    return 'berserker';
  }
  if (hpRatio <= 0.28 && v.mentalHealth >= 40 && (intensity >= 22 || enemiesNear >= 1 || opts?.nearBoss)) {
    return 'determinacion';
  }
  if (intensity >= 28 || enemiesNear >= 2 || (opts?.nearBoss && intensity >= 16)) {
    return 'adrenalina';
  }
  if (intensity >= 16 && hpRatio >= 0.72 && v.mentalHealth >= 68) {
    return 'enfoque';
  }
  return 'normal';
}

export function registerCombatActionIntensity(
  state: PersistentState,
  opts: {
    hitEnemy?: boolean;
    killedEnemy?: boolean;
    tookDamageRatio?: number;
    isMajor?: boolean;
  }
): { enteredState?: SituationalState; alert?: string; color?: string } {
  if (!state.vitals) state.vitals = createInitialVitals();
  const v = state.vitals;
  const prev = v.situationalState || 'normal';

  let gain = 0;
  if (opts.hitEnemy) gain += 11;
  if (opts.killedEnemy) gain += opts.isMajor ? 34 : 20;
  if (opts.tookDamageRatio && opts.tookDamageRatio > 0) {
    gain += Math.min(28, 12 + opts.tookDamageRatio * 55);
  }

  v.combatIntensity = Math.min(100, (v.combatIntensity || 0) + gain);
  if (gain > 0) {
    v.situationalTimer = Math.max(v.situationalTimer || 0, 12);
  }

  const next = resolveSituationalCandidate(state);
  if (next !== 'normal') {
    // Keep higher-tier berserker/determinacion sticky while timer is active
    const rank: Record<SituationalState, number> = {
      normal: 0,
      enfoque: 1,
      adrenalina: 2,
      determinacion: 3,
      panico: 3,
      berserker: 4,
    };
    if (rank[next] >= rank[prev] || (v.situationalTimer || 0) <= 0) {
      v.situationalState = next;
      v.situationalTimer = next === 'berserker' ? 14 : 11;
    }
  }

  const active = v.situationalState || 'normal';
  if (active !== prev && active !== 'normal') {
    const meta = SITUATIONAL_META[active];
    return {
      enteredState: active,
      alert: `${meta.icon} ¡${meta.label}! ${meta.description}`,
      color: meta.color,
    };
  }
  return {};
}

export function shiftPlayerMood(
  state: PersistentState,
  nextMood: EmotionalMood,
  mentalDelta = 0,
  durationSec = 55
): void {
  if (!state.vitals) state.vitals = createInitialVitals();
  const v = state.vitals;
  v.mentalHealth = Math.max(0, Math.min(100, v.mentalHealth + mentalDelta));

  if (v.mentalHealth <= 28) {
    v.mood = 'lokito';
    v.moodTimer = 30;
    return;
  }
  v.mood = nextMood;
  v.moodTimer = nextMood === 'equilibrio' ? 0 : durationSec;
}

export function registerCombatVictoryMood(
  state: PersistentState,
  isMajor: boolean
): { newMoodAlert?: string } {
  if (!state.vitals) state.vitals = createInitialVitals();
  const v = state.vitals;
  v.pridePoints = Math.min(100, v.pridePoints + (isMajor ? 22 : 8));
  v.mentalHealth = Math.min(100, v.mentalHealth + (isMajor ? 6 : 2));

  if (v.mentalHealth <= 28) {
    v.mood = 'lokito';
    return {};
  }

  const prev = v.mood;
  if (v.pridePoints >= 80) {
    v.mood = 'soberbia';
    v.moodTimer = 60;
    if (prev !== 'soberbia') {
      return {
        newMoodAlert:
          '👑 ¡Soberbia! Tu racha de victorias te ciega: +48% CaC pero +45% Daño recibido y molestas a tu equipo',
      };
    }
  } else if (v.pridePoints >= 44 && prev !== 'felicidad') {
    v.mood = 'orgullo';
    v.moodTimer = 50;
    if (prev !== 'orgullo') {
      return {
        newMoodAlert: '🦁 ¡Orgullo! Te sientes invencible en el mar (+24% Daño y -10% Daño recibido)',
      };
    }
  }
  return {};
}

export function registerPlayerDamageMood(
  state: PersistentState,
  dmgRatioToMaxHp: number
): { newMoodAlert?: string } {
  if (!state.vitals) state.vitals = createInitialVitals();
  const v = state.vitals;
  v.mentalHealth = Math.max(0, v.mentalHealth - Math.max(1.5, dmgRatioToMaxHp * 22));
  v.pridePoints = Math.max(0, v.pridePoints - 10);

  if (v.mentalHealth <= 28) {
    const prev = v.mood;
    v.mood = 'lokito';
    if (prev !== 'lokito') {
      return {
        newMoodAlert: '🌀 ¡Crisis Mental (Lokito)! Los golpes y el horror quebraron tu cordura',
      };
    }
    return {};
  }

  if (dmgRatioToMaxHp >= 0.16) {
    const prev = v.mood;
    v.mood = Math.random() < 0.62 ? 'enojo' : 'tristeza';
    v.moodTimer = 45;
    if (prev !== v.mood) {
      return {
        newMoodAlert:
          v.mood === 'enojo'
            ? '💢 ¡Enojo! La rabia dispara tu daño (+42% CaC) pero descuidas la guardia'
            : '💧 ¡Tristeza! El dolor te aplasta (-22% Vel y -25% Daño)',
      };
    }
  }
  return {};
}

export interface NeedTickAlert {
  key: string;
  message: string;
  color: string;
  isCritical: boolean;
}

export function tickPlayerNeeds(
  state: PersistentState,
  dt: number,
  ctx: {
    pl: PlayerEntity;
    weather: WeatherType;
    dangerousWater: boolean;
    nearLeviathan: boolean;
    isMoving: boolean;
    nearbyEnemiesCount?: number;
    nearBoss?: boolean;
    warActive?: boolean;
  }
): {
  alerts: NeedTickAlert[];
  hpDrain: number;
  triggeredHallucination?: string;
} {
  if (!state.vitals) state.vitals = createInitialVitals();
  const v = state.vitals;
  const alerts: NeedTickAlert[] = [];

  const prevThirst = v.thirst;
  const prevHunger = v.hunger;
  const prevSleep = v.sleepiness;
  const prevFatigue = v.fatigue;
  const prevMental = v.mentalHealth;
  const prevMood = v.mood;
  const prevSit: SituationalState = v.situationalState || 'normal';

  // Saturation timers slow hunger & thirst decay by 68%
  v.satietyTimer = Math.max(0, (v.satietyTimer || 0) - dt);
  v.hydrationTimer = Math.max(0, (v.hydrationTimer || 0) - dt);
  const satietyDrainMult = (v.satietyTimer || 0) > 0 ? 0.32 : 1.0;
  const hydrationDrainMult = (v.hydrationTimer || 0) > 0 ? 0.32 : 1.0;

  // Base drain rates
  const hotWeatherMult = ctx.weather === 'despejado' ? 1.15 : ctx.weather === 'lluvia' ? 0.65 : 1.0;
  const exertionMult = ctx.pl.swimming ? 1.75 : ctx.isMoving ? 1.2 : 0.7;

  if (ctx.pl.inShelter) {
    // Shelter calms exhaustion and restores sanity & sleepiness slowly
    v.thirst = Math.max(0, v.thirst - 0.05 * hydrationDrainMult * dt);
    v.hunger = Math.max(0, v.hunger - 0.04 * satietyDrainMult * dt);
    v.sleepiness = Math.min(100, v.sleepiness + 3.2 * dt);
    v.fatigue = Math.min(100, v.fatigue + 4.0 * dt);
    v.mentalHealth = Math.min(100, v.mentalHealth + 2.2 * dt);
  } else {
    // Desgaste drásticamente reducido durante exploración y combate para mayor fluidez
    v.thirst = Math.max(0, v.thirst - 0.16 * hotWeatherMult * exertionMult * hydrationDrainMult * dt);
    v.hunger = Math.max(0, v.hunger - 0.12 * exertionMult * satietyDrainMult * dt);
    v.sleepiness = Math.max(0, v.sleepiness - 0.09 * dt);
    v.fatigue = Math.max(
      0,
      v.fatigue - (ctx.pl.swimming ? 0.34 : ctx.isMoving ? 0.18 : 0.04) * dt
    );

    // Mental pressure from unmet needs, storm, dangerous waters, or Leviathan
    let mentalDeltaPerSec = 0.08;
    if (v.thirst <= 30) mentalDeltaPerSec -= 0.42;
    if (v.hunger <= 30) mentalDeltaPerSec -= 0.38;
    if (v.sleepiness <= 30) mentalDeltaPerSec -= 0.52;
    if (v.fatigue <= 25) mentalDeltaPerSec -= 0.32;
    if (ctx.weather === 'tormenta') mentalDeltaPerSec -= 0.38;
    if (ctx.dangerousWater) mentalDeltaPerSec -= 0.42;
    if (ctx.nearLeviathan) mentalDeltaPerSec -= 0.92;
    if (v.mood === 'felicidad') mentalDeltaPerSec += 0.45;
    if (ctx.pl.onRaft && !state.raft.damagedMode && !ctx.dangerousWater) {
      mentalDeltaPerSec += 0.18;
    }

    v.mentalHealth = Math.max(0, Math.min(100, v.mentalHealth + mentalDeltaPerSec * dt));
  }

  // Pride gradually cools down
  v.pridePoints = Math.max(0, v.pridePoints - 0.35 * dt);

  // Situational Combat Intensity & State updates
  const enemiesNear = ctx.nearbyEnemiesCount || 0;
  const activeCombatThreat = enemiesNear > 0 || Boolean(ctx.nearBoss) || Boolean(ctx.warActive);
  if (activeCombatThreat && (enemiesNear >= 2 || ctx.nearBoss)) {
    const threatGain = (enemiesNear >= 3 ? 4.5 : 2.4) + (ctx.nearBoss ? 3.0 : 0);
    v.combatIntensity = Math.min(100, (v.combatIntensity || 0) + threatGain * dt);
    v.situationalTimer = Math.max(v.situationalTimer || 0, 4);
  } else {
    const coolRate = ctx.pl.inShelter ? 16 : activeCombatThreat ? 3.2 : 9.5;
    v.combatIntensity = Math.max(0, (v.combatIntensity || 0) - coolRate * dt);
  }

  if ((v.situationalTimer || 0) > 0) {
    v.situationalTimer = Math.max(0, (v.situationalTimer || 0) - dt);
  }

  const candidateSit = resolveSituationalCandidate(state, {
    nearbyEnemiesCount: enemiesNear,
    nearBoss: ctx.nearBoss,
    nearLeviathan: ctx.nearLeviathan,
    dangerousWater: ctx.dangerousWater,
    weather: ctx.weather,
  });

  if (candidateSit !== 'normal') {
    const rank: Record<SituationalState, number> = {
      normal: 0,
      enfoque: 1,
      adrenalina: 2,
      determinacion: 3,
      panico: 3,
      berserker: 4,
    };
    if (rank[candidateSit] > rank[prevSit] || (v.situationalTimer || 0) <= 0) {
      v.situationalState = candidateSit;
      v.situationalTimer = Math.max(v.situationalTimer || 0, 8);
    }
  } else if ((v.situationalTimer || 0) <= 0 || (v.combatIntensity || 0) <= 8) {
    v.situationalState = 'normal';
    v.situationalTimer = 0;
  }

  const currSit: SituationalState = v.situationalState || 'normal';
  if (currSit !== prevSit && currSit !== 'normal') {
    const sitMeta = SITUATIONAL_META[currSit];
    alerts.push({
      key: `sit_${currSit}`,
      message: `${sitMeta.icon} ¡${sitMeta.label}! ${sitMeta.description}`,
      color: sitMeta.color,
      isCritical: currSit === 'berserker' || currSit === 'determinacion',
    });
  }

  // Mood transitions
  if (v.mentalHealth <= 28) {
    v.mood = 'lokito';
  } else {
    if (prevMood === 'lokito' && v.mentalHealth >= 38) {
      v.mood = 'equilibrio';
      v.moodTimer = 0;
      alerts.push({
        key: 'recovered_sanity',
        message: '🧠 Recuperaste la lucidez. Sales del estado Lokito.',
        color: '#34d399',
        isCritical: false,
      });
    } else if (v.moodTimer > 0) {
      v.moodTimer = Math.max(0, v.moodTimer - dt);
      if (v.moodTimer === 0) {
        v.mood = 'equilibrio';
      }
    } else if (v.mood === 'equilibrio') {
      if (
        v.thirst >= 76 &&
        v.hunger >= 76 &&
        v.sleepiness >= 76 &&
        v.mentalHealth >= 78 &&
        !ctx.dangerousWater &&
        Math.random() < 0.04 * dt
      ) {
        v.mood = 'felicidad';
        v.moodTimer = 45;
      } else if (
        (v.thirst <= 22 || v.hunger <= 22 || v.sleepiness <= 22) &&
        Math.random() < 0.12 * dt
      ) {
        v.mood = Math.random() < 0.55 ? 'tristeza' : 'enojo';
        v.moodTimer = 40;
      }
    }
  }

  // Threshold Crossing Notifications (penalties are slow & stamina only, NEVER lethal HP drain)
  if (prevThirst > 32 && v.thirst <= 32) {
    alerts.push({
      key: 'thirst_warn',
      message: '💧 Tienes SED: bebe Agua pronto (-26% Vel, -46% Reg. ST)',
      color: '#7dd3fc',
      isCritical: false,
    });
  } else if (prevThirst > 12 && v.thirst <= 12) {
    alerts.push({
      key: 'thirst_crit',
      message: '💧 ¡SED SEVERA! Estás muy lento y casi sin recuperación de estamina',
      color: '#38bdf8',
      isCritical: true,
    });
  }

  if (prevHunger > 32 && v.hunger <= 32) {
    alerts.push({
      key: 'hunger_warn',
      message: '🍲 Tienes HAMBRE: come Guiso o Vegetales (-15% Vel, -32% Reg. ST)',
      color: '#fdba74',
      isCritical: false,
    });
  } else if (prevHunger > 12 && v.hunger <= 12) {
    alerts.push({
      key: 'hunger_crit',
      message: '🍲 ¡HAMBRE EXTREMA! Avanzas muy lento y te cansas rápido (-34% Vel, -60% ST)',
      color: '#fb923c',
      isCritical: true,
    });
  }

  if (prevSleep > 32 && v.sleepiness <= 32) {
    alerts.push({
      key: 'sleep_warn',
      message: '😴 Tienes SUEÑO: duerme o descansa en Refugio (-22% puntería, -16% Vel)',
      color: '#a5b4fc',
      isCritical: false,
    });
  } else if (prevSleep > 12 && v.sleepiness <= 12) {
    alerts.push({
      key: 'sleep_crit',
      message: '😴 ¡SUEÑO EXTREMO! Tu puntería, velocidad y estamina están por el suelo',
      color: '#818cf8',
      isCritical: true,
    });
  }

  if (prevFatigue > 32 && v.fatigue <= 32) {
    alerts.push({
      key: 'fatigue_warn',
      message: '😮‍💨 Estás CANSADO: refúgiate o bebe agua (-46% Reg. ST, -18% Vel)',
      color: '#d8b4fe',
      isCritical: false,
    });
  } else if (prevFatigue > 12 && v.fatigue <= 12) {
    alerts.push({
      key: 'fatigue_crit',
      message: '😮‍💨 ¡AGOTAMIENTO TOTAL! Apenas recuperas estamina y caminas muy lento',
      color: '#c084fc',
      isCritical: true,
    });
  }

  if (prevMental > 28 && v.mentalHealth <= 28) {
    alerts.push({
      key: 'lokito_enter',
      message: '🌀 ¡SALUD MENTAL CRÍTICA: ESTADO LOKITO! Habla con tu tripulación, come o duerme',
      color: '#e879f9',
      isCritical: true,
    });
  } else if (prevMood !== v.mood && v.mood !== 'equilibrio' && v.mood !== 'lokito') {
    const meta = MOOD_META[v.mood];
    alerts.push({
      key: `mood_${v.mood}`,
      message: `🎭 Estado Emocional: ${meta.label} — ${meta.description}`,
      color: meta.color,
      isCritical: v.mood === 'soberbia',
    });
  }

  // Hunger, thirst, sleepiness & fatigue do NOT kill or drain HP; they severely slow speed and cripple stamina!
  const criticalCount =
    (v.hunger <= 12 ? 1 : 0) +
    (v.thirst <= 12 ? 1 : 0) +
    (v.sleepiness <= 12 ? 1 : 0) +
    (v.fatigue <= 12 ? 1 : 0) +
    (v.mentalHealth <= 15 ? 1 : 0);
  const prevCriticalCount =
    (prevHunger <= 12 ? 1 : 0) +
    (prevThirst <= 12 ? 1 : 0) +
    (prevSleep <= 12 ? 1 : 0) +
    (prevFatigue <= 12 ? 1 : 0) +
    (prevMental <= 15 ? 1 : 0);

  if (prevCriticalCount < 2 && criticalCount >= 2) {
    alerts.push({
      key: 'stacked_collapse',
      message: `⚠️ ¡${criticalCount} ESTADOS DE DESGASTE! Te mueves muy lento y casi sin estamina`,
      color: '#fbbf24',
      isCritical: false,
    });
  }

  const hpDrain = 0;

  // Occasional Lokito hallucination phrase
  let triggeredHallucination: string | undefined;
  if (v.mood === 'lokito' && Math.random() < 0.14 * dt) {
    const phrases = [
      '¿Oyeron eso? ¡Las tablas del casco están susurrando mi nombre!',
      '¡Jajaja! El agua salada brilla como oro líquido... ¡todo da vueltas!',
      'No me miren así... sé que los peces nos están espiando para los piratas.',
      '¡Necesito dormir, comer y hablar con alguien cuerdo antes de volverme loco del todo!',
    ];
    triggeredHallucination = phrases[Math.floor(Math.random() * phrases.length)];
  }

  return { alerts, hpDrain, triggeredHallucination };
}

export function applyDrinkWater(state: PersistentState): {
  ok: boolean;
  message: string;
} {
  if (!state.vitals) state.vitals = createInitialVitals();
  const v = state.vitals;
  if (state.resources.agu <= 0) {
    return { ok: false, message: 'No tienes Agua dulce disponible' };
  }
  if (v.thirst >= 98 && v.fatigue >= 95 && (v.hydrationTimer || 0) >= 85) {
    return { ok: false, message: 'Ya estás completamente hidratado' };
  }
  state.resources.agu -= 1;
  v.thirst = Math.min(100, v.thirst + 75);
  v.fatigue = Math.min(100, v.fatigue + 32);
  v.mentalHealth = Math.min(100, v.mentalHealth + 8);
  v.hydrationTimer = 140;
  state.st = Math.min(state.maxSt, state.st + 32);
  if (v.mentalHealth > 34 && v.mood === 'lokito') {
    v.mood = 'equilibrio';
  }
  return { ok: true, message: '+75 Sed · Hidratado 140s · +32 ST' };
}

export function applyEatStewToVitals(state: PersistentState): void {
  if (!state.vitals) state.vitals = createInitialVitals();
  const v = state.vitals;
  v.hunger = Math.min(100, v.hunger + 80);
  v.thirst = Math.min(100, v.thirst + 28);
  v.fatigue = Math.min(100, v.fatigue + 35);
  v.mentalHealth = Math.min(100, v.mentalHealth + 18);
  v.satietyTimer = 150;
  v.hydrationTimer = Math.max(v.hydrationTimer || 0, 50);
  if (v.mentalHealth >= 55 && (v.mood === 'tristeza' || v.mood === 'lokito' || v.mood === 'equilibrio')) {
    v.mood = 'felicidad';
    v.moodTimer = 55;
  }
}

export function applyEatVegToVitals(state: PersistentState): void {
  if (!state.vitals) state.vitals = createInitialVitals();
  const v = state.vitals;
  v.hunger = Math.min(100, v.hunger + 50);
  v.thirst = Math.min(100, v.thirst + 22);
  v.fatigue = Math.min(100, v.fatigue + 16);
  v.mentalHealth = Math.min(100, v.mentalHealth + 9);
  v.satietyTimer = Math.max(v.satietyTimer || 0, 85);
  if (v.mentalHealth > 34 && v.mood === 'lokito') {
    v.mood = 'equilibrio';
  }
}

export function applySleepToVitals(state: PersistentState): void {
  if (!state.vitals) state.vitals = createInitialVitals();
  const v = state.vitals;
  v.sleepiness = 100;
  v.fatigue = 100;
  v.thirst = Math.max(30, v.thirst - 3);
  v.hunger = Math.max(30, v.hunger - 4);
  v.satietyTimer = Math.max(v.satietyTimer || 0, 45);
  v.mentalHealth = Math.min(100, v.mentalHealth + 35);
  v.pridePoints = Math.max(0, v.pridePoints - 15);
  if (v.mood === 'lokito' || v.mood === 'enojo' || v.mood === 'tristeza' || v.mood === 'soberbia') {
    v.mood = v.mentalHealth >= 72 ? 'felicidad' : 'equilibrio';
    v.moodTimer = v.mood === 'felicidad' ? 50 : 0;
  }
}

export function tryAutoConsumeVitals(
  state: PersistentState
): Array<{ kind: 'hunger' | 'thirst'; message: string; color: string }> {
  if (!state.vitals) state.vitals = createInitialVitals();
  const v = state.vitals;
  const events: Array<{ kind: 'hunger' | 'thirst'; message: string; color: string }> = [];

  if (v.hunger <= 25) {
    if (state.resources.gui > 0) {
      state.resources.gui -= 1;
      applyEatStewToVitals(state);
      state.hp = Math.min(state.maxHp, state.hp + 16);
      events.push({
        kind: 'hunger',
        message: '🍲 Auto-consumo: 1 Guiso (+80 Hambre · Saciado 150s · +16 HP)',
        color: '#86efac',
      });
    } else if (state.resources.veg > 0) {
      state.resources.veg -= 1;
      applyEatVegToVitals(state);
      state.hp = Math.min(state.maxHp, state.hp + 6);
      events.push({
        kind: 'hunger',
        message: '🥬 Auto-consumo: 1 Cultivo (+50 Hambre · Saciado 85s)',
        color: '#bef264',
      });
    } else if (state.resources.pez > 0) {
      state.resources.pez -= 1;
      v.hunger = Math.min(100, v.hunger + 44);
      v.satietyTimer = Math.max(v.satietyTimer || 0, 70);
      v.fatigue = Math.min(100, v.fatigue + 12);
      state.hp = Math.min(state.maxHp, state.hp + 8);
      events.push({
        kind: 'hunger',
        message: '🐟 Auto-consumo: 1 Pez (+44 Hambre · Saciado 70s)',
        color: '#93c5fd',
      });
    }
  }

  if (v.thirst <= 25 && state.resources.agu > 0) {
    const res = applyDrinkWater(state);
    if (res.ok) {
      events.push({
        kind: 'thirst',
        message: `💧 Auto-consumo: 1 Agua (${res.message})`,
        color: '#67e8f9',
      });
    }
  }

  return events;
}
