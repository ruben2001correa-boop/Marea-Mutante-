import type { RelicDef, RelicRank } from './types';

export const RELIC_RANKS: RelicRank[] = ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SZS'];

export const RELICS_CATALOG: RelicDef[] = [
  {
    id: 'rel_brujula_rota',
    name: 'Brújula Grietada',
    rank: 'F',
    utility: '+6% velocidad al nadar y caminar',
    description: 'Vestigio oxidado del antiguo mundo. Apenas marca el norte, pero aligera el paso.',
    speedBonus: 0.06,
  },
  {
    id: 'rel_llave_lata',
    name: 'Llave Maestra Torcida',
    rank: 'E',
    utility: '+10 HP máximo · +1 Chatarra extra al minar',
    description: 'Herramienta industrial pre-diluvio que aún encaja en cerraduras viejas.',
    hpBonus: 10,
    gatherBonus: 1,
  },
  {
    id: 'rel_termo_antiguo',
    name: 'Termo Presurizado',
    rank: 'D',
    utility: '+20 Estamina máxima · +15% curación de guisos',
    description: 'Mantiene la temperatura del caldo intacta durante semanas en alta mar.',
    staminaBonus: 20,
    healBonus: 0.15,
  },
  {
    id: 'rel_lente_vigia',
    name: 'Monóculo de Francotirador',
    rank: 'C',
    utility: '+14% daño a distancia y arcos',
    description: 'Óptica militar de cristal tallado que corrige la bruma oceánica.',
    rangedBonus: 0.14,
  },
  {
    id: 'rel_escudo_titanio',
    name: 'Placa Reactora Compacta',
    rank: 'B',
    utility: '-14% daño recibido · +25 HP máximo',
    description: 'Blindaje aeroespacial que absorbe mordeduras y disparos pirata.',
    damageReduction: 0.14,
    hpBonus: 25,
  },
  {
    id: 'rel_turbina_hidro',
    name: 'Turbina Hidrodinámica',
    rank: 'A',
    utility: '+35% velocidad de balsa · +20% cadencia de torretas',
    description: 'Propulsor silencioso del mundo antiguo codiciado por todos los capitanes.',
    raftSpeedBonus: 0.35,
    turretBonus: 0.2,
  },
  {
    id: 'rel_nucleo_solar',
    name: 'Núcleo Solar Eterno',
    rank: 'S',
    utility: '+35% daño total · Regenera 2 HP/s · +1 botín raro',
    description: 'Batería de fusión en miniatura que arde con luz dorada interminable.',
    meleeBonus: 0.35,
    rangedBonus: 0.35,
    hpRegen: 2,
    gatherBonus: 1,
  },
  {
    id: 'rel_corazon_poseidon',
    name: 'Corazón de la Fosa',
    rank: 'SS',
    utility: '+75 HP · -25% daño recibido · +45% daño · +30 Estamina',
    description: 'Artefacto biomecánico legendario rescatado de las fosas abisales.',
    hpBonus: 75,
    staminaBonus: 30,
    damageReduction: 0.25,
    meleeBonus: 0.45,
    rangedBonus: 0.45,
  },
  {
    id: 'rel_corona_antiguo_mundo',
    name: 'Códice Omega del Antiguo Mundo',
    rank: 'SZS',
    utility: 'MILAGRO: Daño x2 · +160 HP · +4 HP/s · -35% daño · +3 recursos · Aura Dorada',
    description:
      'Reliquia imposible de rango SZS. Su mera existencia altera las leyes del océano mutante.',
    hpBonus: 160,
    staminaBonus: 60,
    meleeBonus: 1.0,
    rangedBonus: 1.0,
    damageReduction: 0.35,
    hpRegen: 4,
    speedBonus: 0.25,
    raftSpeedBonus: 0.45,
    gatherBonus: 3,
    turretBonus: 0.5,
  },
];

export const RELIC_MAP: Record<string, RelicDef> = Object.fromEntries(
  RELICS_CATALOG.map((r) => [r.id, r])
);

export function getRelicRankColor(rank: RelicRank): string {
  switch (rank) {
    case 'F':
      return '#94a3b8';
    case 'E':
      return '#a8a29e';
    case 'D':
      return '#86efac';
    case 'C':
      return '#38bdf8';
    case 'B':
      return '#818cf8';
    case 'A':
      return '#c084fc';
    case 'S':
      return '#f472b6';
    case 'SS':
      return '#fb923c';
    case 'SZS':
      return '#fde047';
  }
}

/**
 * Rolls an extremely scarce relic drop from chests or bosses.
 * SZS is a genuine miracle (~0.25% on abyssal/bosses).
 */
export function rollOldWorldRelic(luckBonus = 0, isAbyssalOrBoss = false): RelicDef | null {
  const dropChance = (isAbyssalOrBoss ? 0.55 : 0.28) + luckBonus * 0.15;
  if (Math.random() > dropChance) return null;

  const r = Math.random();
  let targetRank: RelicRank = 'F';

  if (isAbyssalOrBoss && r < 0.004 + luckBonus * 0.004) targetRank = 'SZS';
  else if (!isAbyssalOrBoss && r < 0.0015) targetRank = 'SZS';
  else if (r < 0.025 + luckBonus * 0.02) targetRank = 'SS';
  else if (r < 0.075 + luckBonus * 0.03) targetRank = 'S';
  else if (r < 0.16) targetRank = 'A';
  else if (r < 0.28) targetRank = 'B';
  else if (r < 0.45) targetRank = 'C';
  else if (r < 0.65) targetRank = 'D';
  else if (r < 0.84) targetRank = 'E';
  else targetRank = 'F';

  return RELICS_CATALOG.find((x) => x.rank === targetRank) || RELICS_CATALOG[0];
}
