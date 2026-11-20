import { getRemainingLives } from './constants';
import type { DangerRank, PersistentState, PlayerEntity, WeatherType } from './types';

interface MonologueContext {
  state: PersistentState;
  pl: PlayerEntity;
  weather: WeatherType;
  dangerousWater: boolean;
  nearLeviathan: boolean;
  pirateIslandRank?: DangerRank;
}

const DREAMS_LINES: string[] = [
  'Sueño con un puerto sin sirenas de alarma, donde el agua vuelva a ser clara y dulce.',
  'Ojalá algún día volvamos a plantar árboles verdes sin ceniza salada en las raíces.',
  'Mi sueño es trazar un mapa seguro donde ningún náufrago tenga que suplicar por una ración.',
  'A veces cierro los ojos y aún imagino música en los muelles antes del hundimiento.',
];

const FEARS_LINES: string[] = [
  'Mi mayor temor no son las bestias del abismo... es volverme tan cruel como los piratas por sobrevivir.',
  'Temo dormirme escuchando crujir las tablas y despertar en medio de la negrura sin rumbo.',
  'Me aterra que un día olvidemos cómo sonaban las voces de quienes dejamos en tierra firme.',
  'Cada vez que el mar calla demasiado, siento que algo colosal respira justo debajo del casco.',
];

const JOYS_LINES: string[] = [
  'Un plato de guiso caliente y ver viva a mi tripulación vale más que cualquier tesoro.',
  'Cuando el viento limpia las nubes, el horizonte todavía recuerda que vale la pena luchar.',
  'Escuchar a la tripulación bromear en cubierta me devuelve un pedazo de humanidad.',
  'Cada tabla que clavamos juntos me confirma que ya no navegamos completamente solos.',
];

const MISSION_REFLECTIONS: Record<string, string[]> = {
  boya_nombres: [
    'Esa boya sigue repitiendo nombres de civiles... no podemos dejar que el mar los borre.',
    'Aunque el miedo apriete, seguiremos la señal de auxilio hasta el último resto del convoy.',
  ],
  pan_tormenta: [
    'Esos carroñeros no nacieron monstruos; el hambre los quebró antes que las olas.',
    'Disputar migajas en plena tormenta... qué precio tan amargo cobra este océano.',
  ],
  canto_casco: [
    'Siento la vibración bajo las botas... algo gigantesco estudia cada movimiento del casco.',
    'Mantener la calma cuando el abismo te mira de frente es la batalla más dura.',
  ],
  deuda_tierra: [
    'En un mundo sin leyes, perdonar o cobrarse una deuda define quiénes seremos mañana.',
    'Tierra firme cayó hace años, pero sus traiciones todavía nos persiguen sobre las olas.',
  ],
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getPlayerSituationalThought(ctx: MonologueContext): {
  text: string;
  color: string;
} {
  const { state, pl, weather, dangerousWater, nearLeviathan, pirateIslandRank } = ctx;
  const livesLeft = getRemainingLives(state);
  const hpRatio = state.hp / Math.max(1, state.maxHp);
  const stRatio = state.st / Math.max(1, state.maxSt);
  const settlementsCount = state.islandStructures.filter((s) => s.kind === 'settlement').length;
  const imperioCount = state.islandStructures.filter(
    (s) => s.kind === 'settlement' && s.level >= 3
  ).length;

  // High-priority immediate physical or tactical situation (60% chance when triggered, else inner dreams/fears/joys)
  const situationalPool: Array<{ text: string; color: string }> = [];

  const v = state.vitals;
  if (v) {
    if (v.mentalHealth <= 28 || v.mood === 'lokito') {
      situationalPool.push({
        text: '¡Jaja! ¿Las olas siempre tuvieron ojos o me estoy volviendo lokito? Necesito descansar ya.',
        color: '#e879f9',
      });
    }
    if (v.thirst <= 30) {
      situationalPool.push({
        text: 'La garganta me arde como ceniza seca... ¡necesito beber Agua dulce ya!',
        color: '#7dd3fc',
      });
    }
    if (v.hunger <= 30) {
      situationalPool.push({
        text: 'Me tiemblan las manos del hambre... un guiso caliente devolvería fuerzas a mi golpe.',
        color: '#fdba74',
      });
    }
    if (v.sleepiness <= 30) {
      situationalPool.push({
        text: 'Se me cierran los ojos... necesito dormir o buscar refugio antes de errar cada disparo.',
        color: '#a5b4fc',
      });
    }
    if (v.fatigue <= 30) {
      situationalPool.push({
        text: 'Cada músculo protesta por el cansancio... me cuesta recuperar el aliento.',
        color: '#d8b4fe',
      });
    }
    if (v.mood === 'soberbia') {
      situationalPool.push({
        text: 'Nadie en este océano está a mi altura... ¡todo el que se cruce caerá bajo mi acero!',
        color: '#f97316',
      });
    } else if (v.mood === 'enojo') {
      situationalPool.push({
        text: 'Tengo la sangre hirviendo de rabia... que se aparten o pagaré mi furia con ellos.',
        color: '#fb7185',
      });
    } else if (v.mood === 'tristeza') {
      situationalPool.push({
        text: 'La tristeza pesa más que el ancla hoy... solo quiero recordar por qué seguimos luchando.',
        color: '#60a5fa',
      });
    } else if (v.mood === 'orgullo') {
      situationalPool.push({
        text: 'Miro atrás y siento orgullo: seguimos en pie donde el mundo entero se hundió.',
        color: '#fbbf24',
      });
    } else if (v.mood === 'felicidad') {
      situationalPool.push({
        text: '¡Qué alivio sentir alegría en el pecho! Hoy navegamos con fuerza y mente despejada.',
        color: '#34d399',
      });
    }
  }

  if (livesLeft <= 1) {
    situationalPool.push({
      text:
        livesLeft === 1
          ? 'Solo me queda 1 vida gratuita... un paso en falso más y tendré que pagar el rescate.'
          : 'Estoy al límite de mis fuerzas; cada segundo vivo es un milagro.',
      color: '#fda4af',
    });
  }
  if (hpRatio <= 0.35) {
    situationalPool.push({
      text: 'Tengo heridas abiertas y la sal quema... necesito guiso, botiquín o un refugio ya.',
      color: '#fb7185',
    });
  }
  if (stRatio <= 0.25) {
    situationalPool.push({
      text: 'Me pesan los brazos como cadenas oxidadas; necesito recuperar el aliento.',
      color: '#7dd3fc',
    });
  }
  if (state.raft.damagedMode) {
    situationalPool.push({
      text: 'El casco está destrozado... sin reparar esa madera el abismo nos tragará enteros.',
      color: '#f97316',
    });
  }
  if (pl.swimming) {
    situationalPool.push({
      text: '¡El agua tóxica hiela los huesos! Debo subir al navío o alcanzar tierra firme.',
      color: '#38bdf8',
    });
  }
  if (nearLeviathan) {
    situationalPool.push({
      text: 'Un titán del tamaño de una isla vigila las corrientes... solo fuego nuclear podría tumbarlo.',
      color: '#22d3ee',
    });
  }
  if (pirateIslandRank) {
    situationalPool.push({
      text: `Cuartel pirata Rango ${pirateIslandRank}... pólvora, acero oxidado y miradas sin piedad.`,
      color: '#fb7185',
    });
  }
  if (pl.inShelter) {
    situationalPool.push({
      text: 'Al fin algo de resguardo y lumbre... un respiro antes de volver al mar salado.',
      color: '#34d399',
    });
  }
  if (dangerousWater) {
    situationalPool.push({
      text: 'Entramos en aguas mutadas... aquí ni las brújulas confían en el horizonte.',
      color: '#a3e635',
    });
  }
  if (weather === 'tormenta') {
    situationalPool.push({
      text: 'Relámpagos sobre el mástil y lluvia helada... aguanta firme, viejo casco.',
      color: '#93c5fd',
    });
  } else if (weather === 'niebla') {
    situationalPool.push({
      text: 'Esta niebla espesa traga hasta los gritos; cualquiera podría emboscarnos a diez pasos.',
      color: '#cbd5e1',
    });
  } else if (weather === 'brisa') {
    situationalPool.push({
      text: 'Brisa limpia en las velas... por un instante el océano parece habernos perdonado.',
      color: '#67e8f9',
    });
  }
  if (state.activeStoryMissionId && MISSION_REFLECTIONS[state.activeStoryMissionId]) {
    situationalPool.push({
      text: pick(MISSION_REFLECTIONS[state.activeStoryMissionId]),
      color: '#38bdf8',
    });
  }
  if (imperioCount > 0) {
    situationalPool.push({
      text: `Levantamos un imperio sobre ruinas saladas... ahora tenemos algo real que proteger.`,
      color: '#fbbf24',
    });
  } else if (settlementsCount > 0) {
    situationalPool.push({
      text: 'Ver nuestras banderas ondear en tierra firme me da esperanza para mañana.',
      color: '#fde047',
    });
  }

  // Blend current situation with deeper personal reflections (dreams, fears, joys)
  if (situationalPool.length > 0 && Math.random() < 0.62) {
    return pick(situationalPool);
  }

  const moodRoll = Math.random();
  if (moodRoll < 0.34) {
    return { text: `💭 ${pick(DREAMS_LINES)}`, color: '#a5f3fc' };
  }
  if (moodRoll < 0.68) {
    return { text: `🌒 ${pick(FEARS_LINES)}`, color: '#fda4af' };
  }
  return { text: `✨ ${pick(JOYS_LINES)}`, color: '#fde68a' };
}
