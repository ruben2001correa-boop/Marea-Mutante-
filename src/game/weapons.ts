import type { Rarity, WeaponDef } from './types';

export const WEAPONS: WeaponDef[] = [
  // LANZAS
  {
    id: 'lanza_madera',
    name: 'Lanza de Deriva',
    category: 'lanza',
    rarity: 'comun',
    damage: 16,
    range: 74,
    cooldown: 0.34,
    staminaCost: 4,
    description: 'Lanza básica de buen alcance para repeler tiburones y bandidos.',
  },
  {
    id: 'arpon_electrico',
    name: 'Arpón Eléctrico',
    category: 'lanza',
    rarity: 'raro',
    damage: 28,
    range: 88,
    cooldown: 0.32,
    staminaCost: 6,
    projSpeed: 420,
    description: 'Estocada larga y disparo de arpón cargado contra monstruos marinos.',
    craftCost: { mad: 14, cht: 16, hie: 6, tit: 3 },
  },
  {
    id: 'tridente_abisal',
    name: 'Tridente del Abismo',
    category: 'lanza',
    rarity: 'legendario',
    damage: 48,
    range: 105,
    cooldown: 0.28,
    staminaCost: 7,
    projSpeed: 520,
    craftedByNpc: 'both',
    description: 'Reliquia legendaria abisal. Perforador oceánico forjable solo por Armero o Forjador.',
    craftCost: { frag_legendario: 4, tit: 10, cri: 4, hie: 12, oro: 18 },
  },

  // ESPADAS Y HACHAS DE COMBATE
  {
    id: 'machete_oxidado',
    name: 'Machete Oxidado',
    category: 'espada',
    rarity: 'comun',
    damage: 20,
    range: 62,
    cooldown: 0.26,
    staminaCost: 4,
    description: 'Corte rápido de corto alcance para combates frenéticos cuerpo a cuerpo.',
    craftCost: { mad: 4, cht: 5 },
  },
  {
    id: 'sable_corsario',
    name: 'Sable Corsario',
    category: 'espada',
    rarity: 'raro',
    damage: 34,
    range: 74,
    cooldown: 0.25,
    staminaCost: 5,
    description: 'Espada pirata equilibrada ideal para duelos contra bandidos.',
    craftCost: { cht: 14, hie: 8, oro: 8, tit: 3 },
  },
  {
    id: 'katana_titanio',
    name: 'Filo de Titanio',
    category: 'espada',
    rarity: 'epico',
    damage: 46,
    range: 82,
    cooldown: 0.21,
    staminaCost: 5,
    craftedByNpc: 'both',
    description: 'Hoja ultrarrápida forjada con fragmentos épicos y titanio por un Armero o Forjador.',
    craftCost: { frag_epico: 4, tit: 12, hie: 10, cht: 18, oro: 12 },
  },
  {
    id: 'espada_solar',
    name: 'Espada Plasma Solar',
    category: 'espada',
    rarity: 'legendario',
    damage: 64,
    range: 92,
    cooldown: 0.22,
    staminaCost: 6,
    craftedByNpc: 'both',
    description: 'Arma legendaria de plasma que barre oleadas enteras; requiere Armero o Forjador.',
    craftCost: { frag_legendario: 4, tit: 14, cri: 5, tec: 5, oro: 22 },
  },
  {
    id: 'espada_celestial',
    name: 'Espada Celestial del Alba',
    category: 'espada',
    rarity: 'divino',
    damage: 118,
    range: 110,
    cooldown: 0.19,
    staminaCost: 6,
    isCelestial: true,
    craftedByNpc: 'forjador',
    description: 'Hoja Divina forjada con Fragmentos Divinos y Celestiales solo por un Maestro Forjador.',
    craftCost: { frag_divino: 5, cel_frag: 9, tit: 14, cri: 8, tec: 6, oro: 28 },
  },
  {
    id: 'guja_divina',
    name: 'Guja Solar Divina',
    category: 'lanza',
    rarity: 'divino',
    damage: 132,
    range: 126,
    cooldown: 0.22,
    staminaCost: 7,
    projSpeed: 640,
    isCelestial: true,
    craftedByNpc: 'both',
    description: 'Lanza sagrada de los antiguos mares; emite ráfagas solares penetrantes.',
    craftCost: { frag_divino: 5, cel_frag: 8, tit: 16, cri: 7, tec: 6, oro: 30 },
  },

  // ARCOS
  {
    id: 'arco_bambu',
    name: 'Arco de Caña',
    category: 'arco',
    rarity: 'comun',
    damage: 18,
    range: 340,
    cooldown: 0.42,
    staminaCost: 5,
    projSpeed: 460,
    description: 'Dispara flechas ligeras a distancia sin arriesgar tu pellejo.',
    craftCost: { mad: 10, cht: 4 },
  },
  {
    id: 'ballesta_repeticion',
    name: 'Ballesta Táctica',
    category: 'arco',
    rarity: 'epico',
    damage: 32,
    range: 420,
    cooldown: 0.28,
    staminaCost: 6,
    pellets: 2,
    spread: 0.12,
    projSpeed: 540,
    craftedByNpc: 'both',
    description: 'Dispara dos virotes simultáneos con alta penetración (Forja Armero/Forjador).',
    craftCost: { frag_epico: 4, mad: 18, cht: 18, hie: 10, tit: 6, tec: 2 },
  },
  {
    id: 'arco_astral',
    name: 'Arco Astral Celestial',
    category: 'arco',
    rarity: 'divino',
    damage: 68,
    range: 540,
    cooldown: 0.23,
    staminaCost: 7,
    pellets: 3,
    spread: 0.14,
    projSpeed: 700,
    isCelestial: true,
    craftedByNpc: 'forjador',
    description: 'Arco Divino forjado con Fragmentos Divinos y Celestiales; desata ráfagas triples.',
    craftCost: { frag_divino: 5, cel_frag: 10, cri: 8, tit: 12, tec: 6, oro: 28 },
  },

  // ARMAS DE FUEGO
  {
    id: 'pistola_chispas',
    name: 'Pistola Pirata',
    category: 'fuego',
    rarity: 'raro',
    damage: 30,
    range: 380,
    cooldown: 0.4,
    staminaCost: 6,
    projSpeed: 560,
    description: 'Arma clásica de saqueadores. Golpe seco y rápido.',
    craftCost: { cht: 16, hie: 6, oro: 8 },
  },
  {
    id: 'escopeta_chatarra',
    name: 'Escopeta de Chatarra',
    category: 'fuego',
    rarity: 'epico',
    damage: 17,
    range: 270,
    cooldown: 0.62,
    staminaCost: 10,
    pellets: 5,
    spread: 0.42,
    projSpeed: 520,
    craftedByNpc: 'armero',
    description: 'Desata 5 perdigones en abanico. Requiere Armero/Forjador para ensamblar.',
    craftCost: { frag_epico: 4, cht: 26, hie: 12, tit: 8, tec: 3, oro: 12 },
  },
  {
    id: 'canon_tesla',
    name: 'Rifle Tesla Abisal',
    category: 'fuego',
    rarity: 'legendario',
    damage: 56,
    range: 460,
    cooldown: 0.34,
    staminaCost: 8,
    projSpeed: 640,
    craftedByNpc: 'both',
    description: 'Arma experimental que dispara descargas de cristal abisal (Forja Armero/Forjador).',
    craftCost: { frag_legendario: 5, tec: 10, hie: 14, tit: 8, cri: 5, oro: 18 },
  },
  {
    id: 'canon_divino',
    name: 'Cañón Astral Divino',
    category: 'fuego',
    rarity: 'divino',
    damage: 94,
    range: 560,
    cooldown: 0.3,
    staminaCost: 9,
    pellets: 2,
    spread: 0.08,
    projSpeed: 740,
    isCelestial: true,
    craftedByNpc: 'both',
    description: 'Cañón portátil de rango Divino forjado por Armero o Forjador con núcleos estelares.',
    craftCost: { frag_divino: 6, cel_frag: 8, tec: 10, tit: 16, cri: 9, oro: 34 },
  },

  // MAGIA (Se desbloquea a mitad de la trama en el Capítulo II)
  {
    id: 'baculo_marea',
    name: 'Báculo de la Marea Arcana',
    category: 'magia',
    rarity: 'epico',
    damage: 44,
    range: 420,
    cooldown: 0.32,
    staminaCost: 6,
    projSpeed: 520,
    isMagic: true,
    craftedByNpc: 'both',
    description: 'Magia antigua despertada a mitad de la trama (Forja Armero/Forjador).',
    craftCost: { frag_epico: 4, cri: 5, agu: 10, tec: 3, oro: 14 },
  },
  {
    id: 'orbe_tormenta',
    name: 'Orbe de Tormenta Salada',
    category: 'magia',
    rarity: 'legendario',
    damage: 58,
    range: 450,
    cooldown: 0.38,
    staminaCost: 8,
    pellets: 3,
    spread: 0.24,
    projSpeed: 560,
    isMagic: true,
    craftedByNpc: 'both',
    description: 'Hechizo triple de rayos oceánicos capaz de barrer hordas zombis y hackers.',
    craftCost: { frag_legendario: 5, cri: 8, tec: 7, tit: 6, oro: 22 },
  },
  {
    id: 'cetro_estelar',
    name: 'Cetro Celestial del Abismo',
    category: 'magia',
    rarity: 'divino',
    damage: 108,
    range: 540,
    cooldown: 0.27,
    staminaCost: 9,
    aoeRadius: 118,
    projSpeed: 640,
    isMagic: true,
    isCelestial: true,
    craftedByNpc: 'forjador',
    description: 'Reliquia Divina de Fragmentos Celestiales y Magia Antigua con detonación arcana.',
    craftCost: { frag_divino: 6, cel_frag: 12, cri: 9, tec: 8, tit: 10, oro: 34 },
  },

  // BOMBAS Y ARMAS NUCLEARES (Uso estricto desde Buque de Guerra Nuclear Blindado)
  {
    id: 'bomba_polvora',
    name: 'Bomba de Pólvora',
    category: 'bomba',
    rarity: 'raro',
    damage: 58,
    range: 260,
    cooldown: 0.75,
    staminaCost: 12,
    aoeRadius: 92,
    projSpeed: 290,
    description: 'Explosivo de área ideal contra flotas de bandidos y cangrejos.',
    craftCost: { mad: 10, cht: 14, car: 6, oro: 4 },
  },
  {
    id: 'bomba_abisal',
    name: 'Mina de Cristal',
    category: 'bomba',
    rarity: 'legendario',
    damage: 105,
    range: 300,
    cooldown: 0.85,
    staminaCost: 14,
    aoeRadius: 135,
    projSpeed: 310,
    craftedByNpc: 'both',
    description: 'Detonación masiva con energía de cristal abisal (Forja Armero/Forjador).',
    craftCost: { frag_legendario: 4, cht: 18, hie: 10, tit: 7, cri: 5, tec: 4 },
  },
  {
    id: 'torpedo_termonuclear',
    name: 'Torpedo Termonuclear',
    category: 'fuego',
    rarity: 'legendario',
    damage: 760,
    range: 620,
    cooldown: 1.05,
    staminaCost: 14,
    aoeRadius: 195,
    projSpeed: 560,
    isNuclear: true,
    craftedByNpc: 'both',
    description:
      'Solo utilizable a bordo del Buque de Guerra Nuclear blindado. Forjado por Armero o Forjador.',
    craftCost: { frag_legendario: 6, nuc_frag: 10, tit: 18, hie: 16, cri: 8, tec: 10, oro: 30 },
  },
  {
    id: 'misil_nuclear',
    name: 'Ojiva Termonuclear Naval',
    category: 'bomba',
    rarity: 'divino',
    damage: 1250,
    range: 600,
    cooldown: 1.3,
    staminaCost: 18,
    aoeRadius: 280,
    projSpeed: 430,
    isNuclear: true,
    craftedByNpc: 'both',
    description:
      'Armamento Divino exclusivo de Buque de Guerra Nuclear blindado. Devasta Leviatanes Ancianos.',
    craftCost: { frag_divino: 6, nuc_frag: 15, tit: 24, hie: 22, cri: 12, tec: 14, oro: 45 },
  },

  // HERRAMIENTAS DE SUPERVIVENCIA
  {
    id: 'hacha_tala',
    name: 'Hacha de Leñador',
    category: 'herramienta',
    rarity: 'comun',
    damage: 19,
    range: 60,
    cooldown: 0.32,
    staminaCost: 4,
    harvestBonus: 2,
    description: 'Corta palmeras en islas (+2 Madera extra) y sirve en defensa.',
    craftCost: { mad: 5, cht: 4 },
  },
  {
    id: 'pico_minero',
    name: 'Pico de Prospección',
    category: 'herramienta',
    rarity: 'raro',
    damage: 22,
    range: 62,
    cooldown: 0.34,
    staminaCost: 4,
    mineBonus: 2,
    description: 'Extrae Titanio, Chatarra y Cristal Abisal en vetas de islas (+2).',
    craftCost: { mad: 6, cht: 8 },
  },
  {
    id: 'botiquin_marino',
    name: 'Botiquín Táctico',
    category: 'herramienta',
    rarity: 'raro',
    damage: 0,
    range: 0,
    cooldown: 1.2,
    staminaCost: 10,
    healAmount: 45,
    description: 'Herramienta médica portátil: úsala para curarte +45 HP al instante.',
    craftCost: { agu: 4, pez: 2, cht: 4 },
  },
];

export const WEAPON_MAP: Record<string, WeaponDef> = Object.fromEntries(
  WEAPONS.map((w) => [w.id, w])
);

export const RARE_ISLAND_WEAPONS: string[] = [
  'arpon_electrico',
  'sable_corsario',
  'katana_titanio',
  'ballesta_repeticion',
  'escopeta_chatarra',
  'tridente_abisal',
  'espada_solar',
  'canon_tesla',
  'bomba_abisal',
  'guja_divina',
  'canon_divino',
];

export function isNpcForgedRarity(rarity: Rarity): boolean {
  return rarity === 'epico' || rarity === 'legendario' || rarity === 'divino';
}

export type FragmentDropSource =
  | 'normal'
  | 'elite'
  | 'boss'
  | 'leviathan_adult'
  | 'leviathan_elder'
  | 'chest'
  | 'abyssal_chest';

export function rollWeaponFragmentDrop(
  sourceTier: FragmentDropSource,
  distanceMult = 1
): Array<{ key: 'frag_epico' | 'frag_legendario' | 'frag_divino'; amount: number }> {
  const distBoost = Math.min(2.1, 1 + Math.max(0, distanceMult - 1) * 0.35);
  const drops: Array<{ key: 'frag_epico' | 'frag_legendario' | 'frag_divino'; amount: number }> = [];

  const table: Record<
    FragmentDropSource,
    { epico: number; legendario: number; divino: number; maxAmt: number }
  > = {
    normal: { epico: 0.08, legendario: 0.012, divino: 0, maxAmt: 1 },
    elite: { epico: 0.24, legendario: 0.07, divino: 0.015, maxAmt: 2 },
    boss: { epico: 0.45, legendario: 0.26, divino: 0.09, maxAmt: 2 },
    leviathan_adult: { epico: 0.52, legendario: 0.34, divino: 0.14, maxAmt: 2 },
    leviathan_elder: { epico: 0.65, legendario: 0.62, divino: 0.48, maxAmt: 3 },
    chest: { epico: 0.22, legendario: 0.08, divino: 0.02, maxAmt: 2 },
    abyssal_chest: { epico: 0.48, legendario: 0.3, divino: 0.14, maxAmt: 2 },
  };

  const odds = table[sourceTier];
  if (Math.random() < Math.min(0.9, odds.epico * distBoost)) {
    drops.push({ key: 'frag_epico', amount: 1 + (Math.random() < 0.32 ? 1 : 0) });
  }
  if (Math.random() < Math.min(0.85, odds.legendario * distBoost)) {
    drops.push({
      key: 'frag_legendario',
      amount: 1 + (odds.maxAmt >= 2 && Math.random() < 0.35 ? 1 : 0),
    });
  }
  if (odds.divino > 0 && Math.random() < Math.min(0.82, odds.divino * distBoost)) {
    drops.push({
      key: 'frag_divino',
      amount: 1 + (odds.maxAmt >= 3 && Math.random() < 0.4 ? 1 : 0),
    });
  }
  return drops;
}

export function getRarityColor(rarity: Rarity): string {
  switch (rarity) {
    case 'comun':
      return '#cbd5e1';
    case 'raro':
      return '#38bdf8';
    case 'epico':
      return '#c084fc';
    case 'legendario':
      return '#fbbf24';
    case 'divino':
      return '#38f8e2';
  }
}

export function getRarityLabel(rarity: Rarity): string {
  switch (rarity) {
    case 'comun':
      return 'Común';
    case 'raro':
      return 'Raro';
    case 'epico':
      return 'Épico';
    case 'legendario':
      return 'Legendario';
    case 'divino':
      return 'Divino';
  }
}
