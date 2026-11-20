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
    craftCost: { mad: 8, cht: 10, tit: 2 },
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
    description: 'Reliquia rara de islas abisales. Perfora armaduras y lanza tridentes de energía.',
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
    craftCost: { cht: 10, oro: 6, tit: 2 },
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
    description: 'Hoja ultrarrápida forjada con titanio de islas inexploradas.',
    craftCost: { tit: 8, cht: 12, oro: 8 },
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
    description: 'Arma legendaria de cofres antiguos que barre oleadas enteras.',
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
    craftCost: { mad: 8, cht: 3 },
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
    description: 'Dispara dos virotes simultáneos con alta penetración.',
    craftCost: { mad: 12, cht: 12, tit: 4 },
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
    craftCost: { cht: 12, oro: 5 },
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
    description: 'Desata 5 perdigones en abanico. Devastadora de cerca.',
    craftCost: { cht: 18, tit: 5, oro: 6 },
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
    description: 'Arma experimental que dispara descargas de cristal abisal y tecnología antigua.',
    craftCost: { tec: 4, hie: 6, cri: 2 },
  },

  // BOMBAS
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
    craftCost: { mad: 6, cht: 8, oro: 2 },
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
    description: 'Detonación masiva con energía de cristal abisal.',
    craftCost: { cht: 10, tit: 3, cri: 2 },
  },
  {
    id: 'torpedo_termonuclear',
    name: 'Torpedo Termonuclear',
    category: 'fuego',
    rarity: 'legendario',
    damage: 540,
    range: 560,
    cooldown: 1.05,
    staminaCost: 14,
    aoeRadius: 170,
    projSpeed: 540,
    isNuclear: true,
    description: 'Arma nuclear de Buque/Búnker de Guerra: única capaz de perforar y abatir Leviatanes.',
    craftCost: { tit: 6, cri: 3, tec: 3, oro: 8 },
  },
  {
    id: 'misil_nuclear',
    name: 'Ojiva Nuclear de Búnker',
    category: 'bomba',
    rarity: 'legendario',
    damage: 780,
    range: 520,
    cooldown: 1.35,
    staminaCost: 18,
    aoeRadius: 230,
    projSpeed: 400,
    isNuclear: true,
    description: 'Ojiva táctica nuclear para Buque o Búnker de Guerra; devasta Leviatanes gigantes.',
    craftCost: { tit: 8, cri: 4, tec: 4, oro: 12 },
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
];

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
  }
}
