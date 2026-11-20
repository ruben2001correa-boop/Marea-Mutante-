import type {
  EmotionalMood,
  NpcAttitudeMood,
  PersistentState,
  PlayerEntity,
  PlayerVitalsState,
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

  // 1. Thirst (Sed)
  if (v.thirst <= 12) {
    speedMult *= 0.58;
    staminaRegenMult *= 0.35;
    staminaCostMult *= 1.5;
    meleeMult *= 0.75;
    activeStatuses.push({
      id: 'deshidratado',
      label: 'Deshidratación Crítica',
      effectText: '-42% Vel · -65% Reg. ST · -25% CaC · Pierdes HP',
      severity: 'critical',
      color: '#38bdf8',
    });
  } else if (v.thirst <= 32) {
    speedMult *= 0.78;
    staminaRegenMult *= 0.62;
    staminaCostMult *= 1.28;
    activeStatuses.push({
      id: 'sed',
      label: 'Sedienta / Sed',
      effectText: '-22% Vel · -38% Reg. ST · +28% Gasto ST',
      severity: 'warn',
      color: '#7dd3fc',
    });
  }

  // 2. Hunger (Hambre)
  if (v.hunger <= 12) {
    meleeMult *= 0.52;
    rangedMult *= 0.65;
    defenseMult *= 1.45;
    speedMult *= 0.8;
    activeStatuses.push({
      id: 'hambruna',
      label: 'Inanición Extrema',
      effectText: '-48% CaC · -35% Dist · +45% Daño recibido · Pierdes HP',
      severity: 'critical',
      color: '#fb923c',
    });
  } else if (v.hunger <= 32) {
    meleeMult *= 0.72;
    rangedMult *= 0.82;
    defenseMult *= 1.24;
    activeStatuses.push({
      id: 'hambre',
      label: 'Hambriento',
      effectText: '-28% CaC · -18% Dist · +24% Daño recibido',
      severity: 'warn',
      color: '#fdba74',
    });
  }

  // 3. Sleepiness (Sueño)
  if (v.sleepiness <= 12) {
    rangedMult *= 0.52;
    speedMult *= 0.66;
    defenseMult *= 1.35;
    staminaCostMult *= 1.35;
    activeStatuses.push({
      id: 'sueno_extremo',
      label: 'Sueño Extremo',
      effectText: '-48% Puntería · -34% Vel · +35% Daño recibido',
      severity: 'critical',
      color: '#818cf8',
    });
  } else if (v.sleepiness <= 32) {
    rangedMult *= 0.75;
    speedMult *= 0.84;
    staminaCostMult *= 1.25;
    activeStatuses.push({
      id: 'sueno',
      label: 'Con Sueño',
      effectText: '-25% Dist · -16% Vel · +25% Gasto ST',
      severity: 'warn',
      color: '#a5b4fc',
    });
  }

  // 4. Fatigue (Cansancio)
  if (v.fatigue <= 12) {
    staminaRegenMult *= 0.3;
    meleeMult *= 0.56;
    speedMult *= 0.65;
    staminaCostMult *= 1.55;
    activeStatuses.push({
      id: 'agotado',
      label: 'Agotamiento Total',
      effectText: '-70% Reg. ST · -44% CaC · -35% Vel',
      severity: 'critical',
      color: '#c084fc',
    });
  } else if (v.fatigue <= 32) {
    staminaRegenMult *= 0.56;
    meleeMult *= 0.76;
    speedMult *= 0.82;
    activeStatuses.push({
      id: 'cansancio',
      label: 'Cansado',
      effectText: '-44% Reg. ST · -24% CaC · -18% Vel',
      severity: 'warn',
      color: '#d8b4fe',
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

  return {
    speedMult: Math.max(0.35, Math.min(1.85, speedMult)),
    meleeMult: Math.max(0.38, Math.min(2.2, meleeMult)),
    rangedMult: Math.max(0.38, Math.min(2.0, rangedMult)),
    defenseMult: Math.max(0.65, Math.min(1.9, defenseMult)),
    staminaRegenMult: Math.max(0.2, Math.min(1.8, staminaRegenMult)),
    staminaCostMult: Math.max(0.75, Math.min(1.9, staminaCostMult)),
    activeStatuses,
  };
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

  // Base drain rates (calibrated for meaningful survival difficulty)
  const hotWeatherMult = ctx.weather === 'despejado' ? 1.15 : ctx.weather === 'lluvia' ? 0.65 : 1.0;
  const exertionMult = ctx.pl.swimming ? 1.85 : ctx.isMoving ? 1.25 : 0.72;

  if (ctx.pl.inShelter) {
    // Shelter calms exhaustion and restores sanity & sleepiness slowly
    v.thirst = Math.max(0, v.thirst - 0.18 * dt);
    v.hunger = Math.max(0, v.hunger - 0.14 * dt);
    v.sleepiness = Math.min(100, v.sleepiness + 2.6 * dt);
    v.fatigue = Math.min(100, v.fatigue + 3.4 * dt);
    v.mentalHealth = Math.min(100, v.mentalHealth + 1.8 * dt);
  } else {
    v.thirst = Math.max(0, v.thirst - 0.56 * hotWeatherMult * exertionMult * dt);
    v.hunger = Math.max(0, v.hunger - 0.42 * exertionMult * dt);
    v.sleepiness = Math.max(0, v.sleepiness - 0.34 * dt);
    v.fatigue = Math.max(
      0,
      v.fatigue - (ctx.pl.swimming ? 1.05 : ctx.isMoving ? 0.58 : 0.12) * dt
    );

    // Mental pressure from unmet needs, storm, dangerous waters, or Leviathan
    let mentalDeltaPerSec = 0.08;
    if (v.thirst <= 30) mentalDeltaPerSec -= 0.45;
    if (v.hunger <= 30) mentalDeltaPerSec -= 0.4;
    if (v.sleepiness <= 30) mentalDeltaPerSec -= 0.55;
    if (v.fatigue <= 25) mentalDeltaPerSec -= 0.35;
    if (ctx.weather === 'tormenta') mentalDeltaPerSec -= 0.4;
    if (ctx.dangerousWater) mentalDeltaPerSec -= 0.45;
    if (ctx.nearLeviathan) mentalDeltaPerSec -= 0.95;
    if (v.mood === 'felicidad') mentalDeltaPerSec += 0.45;
    if (ctx.pl.onRaft && !state.raft.damagedMode && !ctx.dangerousWater) {
      mentalDeltaPerSec += 0.16;
    }

    v.mentalHealth = Math.max(0, Math.min(100, v.mentalHealth + mentalDeltaPerSec * dt));
  }

  // Pride gradually cools down
  v.pridePoints = Math.max(0, v.pridePoints - 0.35 * dt);

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

  // Threshold Crossing Notifications
  if (prevThirst > 32 && v.thirst <= 32) {
    alerts.push({
      key: 'thirst_warn',
      message: '💧 Tienes SED: bebe Agua pronto (-22% Vel, -38% Reg. ST)',
      color: '#7dd3fc',
      isCritical: false,
    });
  } else if (prevThirst > 12 && v.thirst <= 12) {
    alerts.push({
      key: 'thirst_crit',
      message: '🚨 ¡DESHIDRATACIÓN CRÍTICA! Pierdes vida y velocidad drásticamente',
      color: '#38bdf8',
      isCritical: true,
    });
  }

  if (prevHunger > 32 && v.hunger <= 32) {
    alerts.push({
      key: 'hunger_warn',
      message: '🍲 Tienes HAMBRE: come Guiso o Vegetales (-28% Daño CaC)',
      color: '#fdba74',
      isCritical: false,
    });
  } else if (prevHunger > 12 && v.hunger <= 12) {
    alerts.push({
      key: 'hunger_crit',
      message: '🚨 ¡HAMBRUNA EXTREMA! Pierdes HP y recibes +45% daño',
      color: '#fb923c',
      isCritical: true,
    });
  }

  if (prevSleep > 32 && v.sleepiness <= 32) {
    alerts.push({
      key: 'sleep_warn',
      message: '😴 Tienes SUEÑO: duerme o descansa en Refugio (-25% puntería)',
      color: '#a5b4fc',
      isCritical: false,
    });
  } else if (prevSleep > 12 && v.sleepiness <= 12) {
    alerts.push({
      key: 'sleep_crit',
      message: '🚨 ¡SUEÑO EXTREMO! Tu salud mental cae en picado',
      color: '#818cf8',
      isCritical: true,
    });
  }

  if (prevFatigue > 32 && v.fatigue <= 32) {
    alerts.push({
      key: 'fatigue_warn',
      message: '😮‍💨 Estás CANSADO: refúgiate o bebe agua (-44% Reg. ST)',
      color: '#d8b4fe',
      isCritical: false,
    });
  } else if (prevFatigue > 12 && v.fatigue <= 12) {
    alerts.push({
      key: 'fatigue_crit',
      message: '🚨 ¡AGOTAMIENTO TOTAL! Apenas puedes correr o blandir armas',
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

  // Gradual HP Drain on critical neglect
  let hpDrain = 0;
  if (v.thirst <= 5) hpDrain += 2.2 * dt;
  if (v.hunger <= 5) hpDrain += 1.8 * dt;
  if (v.mentalHealth <= 10) hpDrain += 1.2 * dt;

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
  if (v.thirst >= 98 && v.fatigue >= 95) {
    return { ok: false, message: 'Ya estás completamente hidratado' };
  }
  state.resources.agu -= 1;
  v.thirst = Math.min(100, v.thirst + 52);
  v.fatigue = Math.min(100, v.fatigue + 14);
  v.mentalHealth = Math.min(100, v.mentalHealth + 6);
  state.st = Math.min(state.maxSt, state.st + 18);
  if (v.mentalHealth > 34 && v.mood === 'lokito') {
    v.mood = 'equilibrio';
  }
  return { ok: true, message: '+52 Sed · +18 ST · +6 Mente' };
}

export function applyEatStewToVitals(state: PersistentState): void {
  if (!state.vitals) state.vitals = createInitialVitals();
  const v = state.vitals;
  v.hunger = Math.min(100, v.hunger + 60);
  v.thirst = Math.min(100, v.thirst + 14);
  v.fatigue = Math.min(100, v.fatigue + 18);
  v.mentalHealth = Math.min(100, v.mentalHealth + 14);
  if (v.mentalHealth >= 55 && (v.mood === 'tristeza' || v.mood === 'lokito' || v.mood === 'equilibrio')) {
    v.mood = 'felicidad';
    v.moodTimer = 50;
  }
}

export function applyEatVegToVitals(state: PersistentState): void {
  if (!state.vitals) state.vitals = createInitialVitals();
  const v = state.vitals;
  v.hunger = Math.min(100, v.hunger + 34);
  v.thirst = Math.min(100, v.thirst + 12);
  v.mentalHealth = Math.min(100, v.mentalHealth + 5);
  if (v.mentalHealth > 34 && v.mood === 'lokito') {
    v.mood = 'equilibrio';
  }
}

export function applySleepToVitals(state: PersistentState): void {
  if (!state.vitals) state.vitals = createInitialVitals();
  const v = state.vitals;
  v.sleepiness = 100;
  v.fatigue = 100;
  v.thirst = Math.max(20, v.thirst - 8);
  v.hunger = Math.max(20, v.hunger - 10);
  v.mentalHealth = Math.min(100, v.mentalHealth + 28);
  v.pridePoints = Math.max(0, v.pridePoints - 15);
  if (v.mood === 'lokito' || v.mood === 'enojo' || v.mood === 'tristeza' || v.mood === 'soberbia') {
    v.mood = v.mentalHealth >= 72 ? 'felicidad' : 'equilibrio';
    v.moodTimer = v.mood === 'felicidad' ? 45 : 0;
  }
}
