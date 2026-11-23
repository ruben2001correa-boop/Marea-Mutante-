import type { Rarity, WeaponDef } from './types';

export const WEAPONS: WeaponDef[] = [
  // LANZAS
  {
    id: 'lanza_madera',
    name: 'Lanza de Deriva',
    category: 'lanza',
    rarity: 'comun',
    tier: 1,
    damage: 13,
    range: 74,
    cooldown: 0.38,
    staminaCost: 4,
    description: 'Lanza básica de buen alcance para repeler tiburones y bandidos.',
  },
  {
    id: 'arpon_electrico',
    name: 'Arpón Eléctrico',
    category: 'lanza',
    rarity: 'raro',
    tier: 2,
    prereqWeaponId: 'lanza_madera',
    damage: 26,
    range: 90,
    cooldown: 0.33,
    staminaCost: 6,
    projSpeed: 430,
    description: 'Estocada larga y disparo de arpón cargado contra monstruos marinos.',
    craftCost: { mad: 14, cht: 16, hie: 6, tit: 3 },
  },
  {
    id: 'tridente_abisal',
    name: 'Tridente del Abismo',
    category: 'lanza',
    rarity: 'legendario',
    tier: 3,
    prereqWeaponId: 'arpon_electrico',
    damage: 64,
    range: 108,
    cooldown: 0.28,
    staminaCost: 7,
    projSpeed: 540,
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
    tier: 1,
    damage: 12,
    range: 56,
    cooldown: 0.34,
    staminaCost: 4,
    description: 'Hoja vieja y oxidada de emergencia para el inicio; pronto se queda corta.',
    craftCost: { mad: 4, cht: 5 },
  },
  {
    id: 'sable_corsario',
    name: 'Sable Corsario',
    category: 'espada',
    rarity: 'raro',
    tier: 2,
    prereqWeaponId: 'machete_oxidado',
    damage: 28,
    range: 74,
    cooldown: 0.27,
    staminaCost: 5,
    description: 'Espada pirata de acero templado ideal para duelos contra bandidos.',
    craftCost: { cht: 14, hie: 8, oro: 8, tit: 3 },
  },
  {
    id: 'katana_titanio',
    name: 'Filo de Titanio',
    category: 'espada',
    rarity: 'epico',
    tier: 3,
    prereqWeaponId: 'sable_corsario',
    damage: 46,
    range: 84,
    cooldown: 0.22,
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
    tier: 4,
    prereqWeaponId: 'katana_titanio',
    damage: 78,
    range: 94,
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
    tier: 5,
    prereqWeaponId: 'espada_solar',
    damage: 135,
    range: 112,
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
    tier: 4,
    prereqWeaponId: 'tridente_abisal',
    damage: 145,
    range: 128,
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
    tier: 1,
    damage: 16,
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
    tier: 2,
    prereqWeaponId: 'arco_bambu',
    damage: 34,
    range: 430,
    cooldown: 0.3,
    staminaCost: 6,
    pellets: 2,
    spread: 0.12,
    projSpeed: 560,
    craftedByNpc: 'both',
    description: 'Dispara dos virotes simultáneos con alta penetración (Forja Armero/Forjador).',
    craftCost: { frag_epico: 4, mad: 18, cht: 18, hie: 10, tit: 6, tec: 2 },
  },
  {
    id: 'arco_astral',
    name: 'Arco Astral Celestial',
    category: 'arco',
    rarity: 'divino',
    tier: 3,
    prereqWeaponId: 'ballesta_repeticion',
    damage: 76,
    range: 550,
    cooldown: 0.24,
    staminaCost: 7,
    pellets: 3,
    spread: 0.14,
    projSpeed: 710,
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
    tier: 1,
    damage: 36,
    range: 390,
    cooldown: 0.42,
    staminaCost: 6,
    projSpeed: 560,
    description: 'Arma clásica de saqueadores. Golpe seco de pólvora a distancia.',
    craftCost: { cht: 16, hie: 6, oro: 8 },
  },
  {
    id: 'escopeta_chatarra',
    name: 'Escopeta de Chatarra',
    category: 'fuego',
    rarity: 'epico',
    tier: 2,
    prereqWeaponId: 'pistola_chispas',
    damage: 24,
    range: 280,
    cooldown: 0.6,
    staminaCost: 10,
    pellets: 5,
    spread: 0.4,
    projSpeed: 530,
    craftedByNpc: 'armero',
    description: 'Desata 5 perdigones devastadores en abanico (120 daño total de cerca).',
    craftCost: { frag_epico: 4, cht: 26, hie: 12, tit: 8, tec: 3, oro: 12 },
  },
  {
    id: 'canon_tesla',
    name: 'Rifle Tesla Abisal',
    category: 'fuego',
    rarity: 'legendario',
    tier: 3,
    prereqWeaponId: 'escopeta_chatarra',
    damage: 74,
    range: 470,
    cooldown: 0.33,
    staminaCost: 8,
    projSpeed: 650,
    craftedByNpc: 'both',
    description: 'Arma experimental que dispara descargas de cristal abisal (Forja Armero/Forjador).',
    craftCost: { frag_legendario: 5, tec: 10, hie: 14, tit: 8, cri: 5, oro: 18 },
  },
  {
    id: 'canon_divino',
    name: 'Cañón Astral Divino',
    category: 'fuego',
    rarity: 'divino',
    tier: 5,
    prereqWeaponId: 'torpedo_termonuclear',
    damage: 108,
    range: 570,
    cooldown: 0.3,
    staminaCost: 9,
    pellets: 2,
    spread: 0.08,
    projSpeed: 750,
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
    tier: 1,
    damage: 52,
    range: 430,
    cooldown: 0.32,
    staminaCost: 6,
    projSpeed: 530,
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
    tier: 2,
    prereqWeaponId: 'baculo_marea',
    damage: 62,
    range: 460,
    cooldown: 0.38,
    staminaCost: 8,
    pellets: 3,
    spread: 0.24,
    projSpeed: 570,
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
    tier: 3,
    prereqWeaponId: 'orbe_tormenta',
    damage: 132,
    range: 550,
    cooldown: 0.28,
    staminaCost: 9,
    aoeRadius: 128,
    projSpeed: 640,
    isMagic: true,
    isCelestial: true,
    craftedByNpc: 'forjador',
    description: 'Reliquia Divina de Fragmentos Celestiales y Magia Antigua con detonación arcana en área.',
    craftCost: { frag_divino: 6, cel_frag: 12, cri: 9, tec: 8, tit: 10, oro: 34 },
  },

  // BOMBAS Y ARMAS NUCLEARES (Uso estricto desde Buque de Guerra Nuclear Blindado)
  {
    id: 'bomba_polvora',
    name: 'Bomba de Pólvora',
    category: 'bomba',
    rarity: 'raro',
    tier: 1,
    damage: 115,
    range: 285,
    cooldown: 0.85,
    staminaCost: 12,
    aoeRadius: 108,
    projSpeed: 300,
    description: 'Explosivo pesado de área que destroza grupos de enemigos, muros y flotas.',
    craftCost: { mad: 10, cht: 14, car: 6, oro: 4 },
  },
  {
    id: 'bomba_abisal',
    name: 'Mina de Cristal',
    category: 'bomba',
    rarity: 'legendario',
    tier: 2,
    prereqWeaponId: 'bomba_polvora',
    damage: 245,
    range: 325,
    cooldown: 0.9,
    staminaCost: 14,
    aoeRadius: 152,
    projSpeed: 320,
    craftedByNpc: 'both',
    description: 'Detonación masiva con energía de cristal abisal (Forja Armero/Forjador).',
    craftCost: { frag_legendario: 4, cht: 18, hie: 10, tit: 7, cri: 5, tec: 4 },
  },
  {
    id: 'torpedo_termonuclear',
    name: 'Torpedo Termonuclear',
    category: 'fuego',
    rarity: 'legendario',
    tier: 4,
    prereqWeaponId: 'canon_tesla',
    damage: 820,
    range: 640,
    cooldown: 1.0,
    staminaCost: 14,
    aoeRadius: 210,
    projSpeed: 570,
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
    tier: 3,
    prereqWeaponId: 'bomba_abisal',
    damage: 1450,
    range: 620,
    cooldown: 1.25,
    staminaCost: 18,
    aoeRadius: 295,
    projSpeed: 440,
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
    tier: 1,
    damage: 11,
    range: 56,
    cooldown: 0.38,
    staminaCost: 4,
    harvestBonus: 2,
    description: 'Corta palmeras en islas (+2 Madera extra); uso básico de defensa.',
    craftCost: { mad: 5, cht: 4 },
  },
  {
    id: 'pico_minero',
    name: 'Pico de Prospección',
    category: 'herramienta',
    rarity: 'raro',
    tier: 2,
    prereqWeaponId: 'hacha_tala',
    damage: 14,
    range: 58,
    cooldown: 0.38,
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
    tier: 3,
    prereqWeaponId: 'pico_minero',
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

export function getWeaponUnlockStatus(
  weaponId: string,
  ownedWeapons: string[]
): { unlocked: boolean; tier: number; prereqId?: string; prereqName?: string } {
  const w = WEAPON_MAP[weaponId];
  if (!w) return { unlocked: false, tier: 1 };
  const tier = w.tier || 1;
  if (!w.prereqWeaponId) {
    return { unlocked: true, tier };
  }
  const prereq = WEAPON_MAP[w.prereqWeaponId];
  const hasPrereq = ownedWeapons.includes(w.prereqWeaponId);
  return {
    unlocked: hasPrereq,
    tier,
    prereqId: w.prereqWeaponId,
    prereqName: prereq?.name || w.prereqWeaponId,
  };
}

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
  _distanceMult = 1
): Array<{ key: 'frag_epico' | 'frag_legendario' | 'frag_divino'; amount: number }> {
  // Rebalance estricto de escasez: máximo 1 fragmento por fuente, sin inflación por distancia.
  // Jefes/Leviatanes/Cofres Abisales: 35% Épico, 15% Legendario, 1% Divino.
  // Élites/Semi-Bosses: 15% Épico, 5% Legendario. Normales/Cofres: 5% Épico (y 1% Leg en cofres).
  const table: Record<
    FragmentDropSource,
    { epico: number; legendario: number; divino: number }
  > = {
    normal: { epico: 0.05, legendario: 0, divino: 0 },
    elite: { epico: 0.15, legendario: 0.05, divino: 0 },
    boss: { epico: 0.35, legendario: 0.15, divino: 0.01 },
    leviathan_adult: { epico: 0.35, legendario: 0.15, divino: 0.01 },
    leviathan_elder: { epico: 0.35, legendario: 0.15, divino: 0.01 },
    chest: { epico: 0.05, legendario: 0.01, divino: 0 },
    abyssal_chest: { epico: 0.35, legendario: 0.15, divino: 0.01 },
  };

  const odds = table[sourceTier];
  const roll = Math.random();
  if (odds.divino > 0 && roll < odds.divino) {
    return [{ key: 'frag_divino', amount: 1 }];
  }
  if (odds.legendario > 0 && roll < odds.divino + odds.legendario) {
    return [{ key: 'frag_legendario', amount: 1 }];
  }
  if (odds.epico > 0 && roll < odds.divino + odds.legendario + odds.epico) {
    return [{ key: 'frag_epico', amount: 1 }];
  }
  return [];
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
