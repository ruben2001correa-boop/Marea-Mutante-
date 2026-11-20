import type {
  AcquaintanceState,
  AnimalKind,
  CropDef,
  KingdomDef,
  NewsArticle,
  PersistentState,
  PirateBounty,
  RivalClanState,
  RomanceCandidateDef,
  TechPieceDef,
  TitleDef,
  WeatherType,
} from './types';

export function getShipClassName(raftLevel: number, warshipNuclearShield = false): string {
  if (raftLevel >= 7 && warshipNuclearShield) return 'Buque de Guerra Nuclear Blindado';
  if (raftLevel >= 7) return 'Buque de Guerra Nuclear';
  if (raftLevel >= 6) return 'Navío de Línea';
  if (raftLevel >= 5) return 'Fragata Blindada';
  if (raftLevel >= 4) return 'Bergantín Explorador';
  if (raftLevel >= 3) return 'Goleta Corsaria';
  if (raftLevel >= 2) return 'Balandra Armada';
  return 'Balsa de Náufrago';
}

export const COUNTRY_OPTIONS: Array<{ code: string; name: string }> = [
  { code: 'CO', name: 'Colombia' },
  { code: 'MX', name: 'México' },
  { code: 'ES', name: 'España' },
  { code: 'AR', name: 'Argentina' },
  { code: 'CL', name: 'Chile' },
  { code: 'PE', name: 'Perú' },
  { code: 'VE', name: 'Venezuela' },
  { code: 'EC', name: 'Ecuador' },
  { code: 'US', name: 'Estados Unidos' },
  { code: 'BR', name: 'Brasil' },
  { code: 'JP', name: 'Japón' },
  { code: 'INT', name: 'Siete Mares' },
];

export const INITIAL_PIRATE_BOUNTIES: PirateBounty[] = [
  {
    id: 'bounty_vane',
    name: 'Vane "Diente de Tiburón"',
    epithet: 'Saqueador de Arrecifes',
    dangerLevel: 2,
    rewardOro: 12,
    rewardFame: 140,
    bountyValue: 22000000,
    description: 'Asalta barcos mercantes con su flotilla en los arrecifes del este.',
    claimed: false,
    active: false,
  },
  {
    id: 'bounty_calico',
    name: 'Calico "La Viuda"',
    epithet: 'Corsaria del Humo',
    dangerLevel: 3,
    rewardOro: 16,
    rewardFame: 190,
    bountyValue: 48000000,
    description: 'Navega con tripulación de abordaje oculta entre bancos de niebla.',
    claimed: false,
    active: false,
  },
  {
    id: 'bounty_barbarroja',
    name: 'Capitán Barbarroja',
    epithet: 'Martillo Escarlata',
    dangerLevel: 4,
    rewardOro: 22,
    rewardFame: 260,
    bountyValue: 95000000,
    description: 'Comandante de flotillas rojas escoltado por artilleros de élite.',
    claimed: false,
    active: false,
  },
  {
    id: 'bounty_malak',
    name: 'Malak "Barba de Hierro"',
    epithet: 'Señor de la Hermandad',
    dangerLevel: 5,
    rewardOro: 30,
    rewardFame: 380,
    bountyValue: 185000000,
    description: 'Temido jefe pirata blindado. Siempre viaja rodeado de 4 corsarios.',
    claimed: false,
    active: false,
  },
  {
    id: 'bounty_kuro',
    name: 'Kuro "Sombra Abisal"',
    epithet: 'Rey de Aguas Peligrosas',
    dangerLevel: 6,
    rewardOro: 44,
    rewardFame: 560,
    bountyValue: 360000000,
    description: 'Navega en aguas profundas junto a hackers corsarios y leviatanes.',
    claimed: false,
    active: false,
  },
];

export function generateDailyNewsArticles(
  state: PersistentState,
  weather: WeatherType,
  day: number
): NewsArticle[] {
  const playerTag = state.clan.founded ? `[${state.clan.tag}] ` : '';
  const playerName = state.playerProfile.name || 'Capitán';
  const warKingdom = state.kingdoms.find((k) => k.atWar);
  const conqueredKingdom = state.kingdoms.find((k) => k.conquered);
  const activeBounty = state.pirateBounties.find((b) => !b.claimed);

  const portadaHeadline = conqueredKingdom
    ? `¡${playerTag}${playerName} conquista territorios del reino!`
    : warKingdom
      ? `¡Tambores de guerra en los Siete Mares contra ${playerName}!`
      : state.raft.level >= 7
        ? `¡Avistan un colosal ${getShipClassName(state.raft.level, state.warshipNuclearShield)} capitaneado por ${playerName}!`
        : state.stats.villagesPillaged > 0
          ? `¡Alerta marítima! La recompensa por ${playerTag}${playerName} sube a ${state.bounty.toLocaleString()} B`
          : `¡Nuevo navegante ${playerTag}${playerName} surca el horizonte en el Día ${day}!`;

  const portadaBody = conqueredKingdom
    ? `Fuentes del Correo del Horizonte confirman que la flota de ${playerName} dominó la última Guerra de Islas. Las rutas comerciales cambian de manos.`
    : state.bounty >= 50000000
      ? `Con ${state.stats.banditKills} piratas abatidos y ${state.stats.islandsVisited} islas cartografiadas, ${playerName} ya figura entre los capitanes más temidos del océano.`
      : `La Marina del Mundo Antiguo mantiene vigilancia sobre ${playerTag}${playerName} (${getShipClassName(state.raft.level, state.warshipNuclearShield)} Nv.${state.raft.level}).`;

  const weatherNews: Record<WeatherType, string> = {
    despejado: 'Cielos despejados favorecen expediciones hacia islas mineras, zonas zombis y santuarios.',
    brisa: 'Vientos alisios impulsan las velas un +18% más rápido en todo el cuadrante.',
    lluvia: 'Lluvias cálidas riegan cultivos en balsas e islas acelerando cosechas.',
    tormenta: '¡Precaución! Tormenta eléctrica en curso; busca una Zona Segura si el casco cruje.',
    niebla: 'Banco de niebla espesa reduce la visibilidad; hackers y corsarios aprovechan para emboscar.',
    oleaje: 'Fuerte marejada frena la navegación; refuerza el casco y los muros de tu isla.',
  };

  return [
    {
      id: `news_${day}_1`,
      category: 'PORTADA',
      headline: portadaHeadline,
      body: portadaBody,
      day,
    },
    {
      id: `news_${day}_2`,
      category: 'RECOMPENSA',
      headline: activeBounty
        ? `SE BUSCA: ${activeBounty.name} — ${activeBounty.bountyValue.toLocaleString()} B`
        : '¡Todos los grandes piratas del sector han sido capturados!',
      body: activeBounty
        ? `${activeBounty.description} Recompensa oficial: +${activeBounty.rewardOro} Oro y +${activeBounty.rewardFame} Fama.`
        : 'La paz temporal reina en los muelles principales, aunque los Leviatanes Viejos siguen acechando.',
      day,
    },
    {
      id: `news_${day}_3`,
      category: 'MUNDO',
      headline: 'Señales de radio, fragmentos celestiales y brotes zombi en altamar',
      body: `Antenas detectan Fragmentos Nucleares y Celestiales en islas lejanas, mientras hackers marinos sabotean barcos sin defensa. Islas visitadas: ${state.stats.islandsVisited}.`,
      day,
    },
    {
      id: `news_${day}_4`,
      category: 'CLIMA',
      headline: `Boletín Meteorológico · Día ${day}: ${weather.toUpperCase()}`,
      body: weatherNews[weather],
      day,
    },
  ];
}

export const CROPS_CATALOG: CropDef[] = [
  {
    id: 'algas',
    name: 'Alga Nutritiva',
    growSeconds: 18,
    yieldVeg: 2,
    yieldBonusKey: 'agu',
    yieldBonusAmount: 1,
    seedCost: { mad: 1, agu: 1 },
    color: '#22c55e',
    description: 'Crece rápido en balsas o costas; aporta Cultivos y Agua dulce.',
  },
  {
    id: 'maiz_mar',
    name: 'Maíz de Marea',
    growSeconds: 26,
    yieldVeg: 3,
    seedCost: { mad: 2, agu: 1 },
    color: '#facc15',
    description: 'Cereal resistente a la salinidad; gran rendimiento pasivo de comida.',
  },
  {
    id: 'tomate_coral',
    name: 'Tomate Coralino',
    growSeconds: 32,
    yieldVeg: 3,
    yieldBonusKey: 'gui',
    yieldBonusAmount: 1,
    seedCost: { veg: 1, agu: 2 },
    color: '#ef4444',
    description: 'Fruto jugoso comestible que también produce Guiso listo.',
  },
  {
    id: 'calabaza_sal',
    name: 'Calabaza Abisal',
    growSeconds: 42,
    yieldVeg: 5,
    yieldBonusKey: 'oro',
    yieldBonusAmount: 1,
    seedCost: { veg: 2, agu: 2, car: 1 },
    color: '#f97316',
    description: 'Planta gigante muy nutritiva y cotizada por mercaderes.',
  },
];

export const ANIMAL_RANCH_INFO: Record<
  AnimalKind,
  { interval: number; yieldKey: 'pez' | 'veg' | 'gui'; yieldAmt: number; bonusOroChance: number; role: string }
> = {
  chicken: { interval: 18, yieldKey: 'veg', yieldAmt: 1, bonusOroChance: 0.1, role: 'Pone huevos nutritivos' },
  pig: { interval: 22, yieldKey: 'pez', yieldAmt: 2, bonusOroChance: 0.15, role: 'Produce carne constante' },
  goat: { interval: 20, yieldKey: 'gui', yieldAmt: 1, bonusOroChance: 0.12, role: 'Da leche y queso de granja' },
  boar: { interval: 24, yieldKey: 'pez', yieldAmt: 3, bonusOroChance: 0.25, role: 'Salvaje domesticado: carne y trufas' },
  scorpion: { interval: 26, yieldKey: 'gui', yieldAmt: 1, bonusOroChance: 0.45, role: 'Extracto medicinal y defensa' },
  wolf: { interval: 24, yieldKey: 'pez', yieldAmt: 3, bonusOroChance: 0.2, role: 'Cazador fiel que trae presas' },
};

export const TECH_PIECES_CATALOG: TechPieceDef[] = [
  {
    id: 'tech_radar',
    name: 'Radar de Peligros y Botín',
    description: 'Módulo electrónico que amplía tu minimapa y detecta tesoros y leviatanes.',
    bonusText: '+25% alcance de minimapa · +20% botín raro',
    cost: { tec: 3, hie: 4, car: 3 },
  },
  {
    id: 'tech_escudo',
    name: 'Escudo Deflector de Casco',
    description: 'Proyector de ondas que protege tu balsa o buque contra monstruos grandes y leviatanes.',
    bonusText: '-40% daño al casco del navío',
    cost: { tec: 4, hie: 6, tit: 2 },
  },
  {
    id: 'tech_ionico',
    name: 'Propulsor Iónico Naval',
    description: 'Turbina tecnológica alimentada por cristales y carbón comprimido.',
    bonusText: '+30% velocidad de navegación',
    cost: { tec: 5, car: 6, cri: 1 },
  },
  {
    id: 'tech_nanorep',
    name: 'Módulo de Nano-Reparación',
    description: 'Drones diminutos que sueldan grietas de la cubierta automáticamente.',
    bonusText: 'Repara +2.5 HP/s del navío automáticamente',
    cost: { tec: 6, hie: 6, tit: 3, cri: 1 },
  },
];

export const RIVAL_CLANS_CATALOG: RivalClanState[] = [
  {
    id: 'clan_acero',
    name: 'Clan Marea de Acero',
    tag: 'MACE',
    color: '#94a3b8',
    power: 35,
    relation: 10,
    atWar: false,
    conquered: false,
    specialty: 'Blindaje naval e intercambio de hierro y carbón.',
  },
  {
    id: 'clan_trueno',
    name: 'Cofradía del Trueno',
    tag: 'TRN',
    color: '#38bdf8',
    power: 55,
    relation: -15,
    atWar: false,
    conquered: false,
    specialty: 'Torretas eléctricas, antenas de radio y piezas tecnológicas.',
  },
  {
    id: 'clan_ceniza',
    name: 'Hijos del Volcán',
    tag: 'VOLC',
    color: '#f97316',
    power: 75,
    relation: -35,
    atWar: false,
    conquered: false,
    specialty: 'Abordajes agresivos y pólvora pesada.',
  },
];

export const CLAN_PERKS_CATALOG = [
  {
    id: 'perk_oro',
    name: 'Tributo del Clan',
    desc: '+2 Oro extra al vencer flotas o guerras.',
    cost: { oro: 8, mad: 10 },
  },
  {
    id: 'perk_casco',
    name: 'Estandarte Blindado',
    desc: '+80 HP máximo para tu balsa o buque de guerra.',
    cost: { hie: 10, mad: 12 },
  },
  {
    id: 'perk_furia',
    name: 'Grito de Abordaje',
    desc: '+15% daño de tu tripulación y armas.',
    cost: { oro: 10, hie: 8, tec: 2 },
  },
];

export const TITLES_CATALOG: TitleDef[] = [
  {
    id: 'title_naufrago',
    name: 'Náufrago Sobreviviente',
    tier: 'raro',
    requirementText: 'Título inicial de partida.',
    bonusText: '+5 HP máx.',
    hpBonus: 5,
  },
  {
    id: 'title_capitan_guerra',
    name: 'Almirante del Buque Nuclear',
    tier: 'epico',
    requirementText: 'Transforma tu balsa en Buque de Guerra Nuclear (Nivel 7+).',
    bonusText: '+14% velocidad naval · +40 HP',
    raftSpeedBonus: 0.14,
    hpBonus: 40,
  },
  {
    id: 'title_azote_corsarios',
    name: 'Verdugo de la Hermandad Roja',
    tier: 'epico',
    requirementText: 'Derrota a 120 piratas, hackers y corsarios.',
    bonusText: '+18% daño cuerpo a cuerpo · +25 HP',
    meleeBonus: 0.18,
    hpBonus: 25,
  },
  {
    id: 'title_conquistador_islas',
    name: 'Emperador Demencial de Reinos',
    tier: 'legendario',
    requirementText: 'Gana 10 Guerras de Flota o de Islas.',
    bonusText: '+24% daño total · +55 HP',
    meleeBonus: 0.24,
    rangedBonus: 0.24,
    hpBonus: 55,
  },
  {
    id: 'title_matador_ancianos',
    name: 'Cazador de Leviatanes Viejos',
    tier: 'legendario',
    requirementText: 'Abate 3 Leviatanes Viejos colosales con tu Buque Nuclear.',
    bonusText: '+35% daño total · +90 HP · +15% vel.',
    meleeBonus: 0.35,
    rangedBonus: 0.35,
    hpBonus: 90,
    raftSpeedBonus: 0.15,
  },
  {
    id: 'title_forjador_celestial',
    name: 'Portador de la Forja Celestial',
    tier: 'legendario',
    requirementText: 'Forja 2 armas Celestiales con Fragmentos Celestiales.',
    bonusText: '+28% daño total · +45 HP',
    meleeBonus: 0.28,
    rangedBonus: 0.28,
    hpBonus: 45,
  },
  {
    id: 'title_leyenda_szs',
    name: 'Portador del Milagro SZS',
    tier: 'legendario',
    requirementText: 'Encuentra una reliquia Rango SZS.',
    bonusText: '+30% daño total · +60 HP · +15% vel.',
    meleeBonus: 0.3,
    rangedBonus: 0.3,
    hpBonus: 60,
    raftSpeedBonus: 0.15,
  },
  {
    id: 'title_patriarca_mar',
    name: 'Patriarca de los Siete Mares',
    tier: 'legendario',
    requirementText: 'Forma una familia y ten al menos 1 hijo.',
    bonusText: '+35 HP · +10% velocidad naval',
    hpBonus: 35,
    raftSpeedBonus: 0.1,
  },
  {
    id: 'title_mecenas_cenizas',
    name: 'Mecenas del Horizonte',
    tier: 'legendario',
    requirementText: 'Exclusivo para donadores vía Bre-B / Nequi (@3155552964).',
    bonusText: '+25 HP · +12% daño total · +12% vel. naval · Skins Doradas',
    hpBonus: 25,
    meleeBonus: 0.12,
    rangedBonus: 0.12,
    raftSpeedBonus: 0.12,
  },
  {
    id: 'title_testigo_cenizas',
    name: 'Testigo de las Cenizas',
    tier: 'legendario',
    requirementText: 'Completa las 4 misiones dramáticas de El Último Rumbo.',
    bonusText: '+30 HP · +15% daño total',
    hpBonus: 30,
    meleeBonus: 0.15,
    rangedBonus: 0.15,
  },
];

export const TITLE_MAP: Record<string, TitleDef> = Object.fromEntries(
  TITLES_CATALOG.map((t) => [t.id, t])
);

export const KINGDOMS_CATALOG: KingdomDef[] = [
  {
    id: 'coralia',
    name: 'Reino de Coralía',
    ruler: 'Reina Marisol III',
    specialty: 'Pescado, Granja y Comercio Pacífico',
    color: '#38bdf8',
    description: 'Aldeas pesqueras y granjas costeñas; grandes socios comerciales o presa fácil.',
  },
  {
    id: 'hierro',
    name: 'Liga de Hierro',
    ruler: 'Maestre Tuerca',
    specialty: 'Hierro, Carbón y Piezas Tech',
    color: '#94a3b8',
    description: 'Astilleros mineros con tecnología del mundo antiguo. Defienden con fuerza.',
  },
  {
    id: 'dorado',
    name: 'Principado del Sol Dorado',
    ruler: 'Príncipe Aurelio',
    specialty: 'Oro, Desiertos y Reliquias',
    color: '#fbbf24',
    description: 'Mercaderes adinerados en islas tropicales y desiertos llenos de oro.',
  },
  {
    id: 'escarlata',
    name: 'Hermandad Escarlata',
    ruler: 'Gran Corsario Malak',
    specialty: 'Abordajes, Pólvora y Guerra de Islas',
    color: '#fb7185',
    description: 'Corsarios agresivos que abordan barcos desprevenidos.',
  },
];

export const INITIAL_ACQUAINTANCES: AcquaintanceState[] = [
  {
    id: 'acq_valeria',
    name: 'Valeria la Mercader',
    role: 'Comerciante Libre',
    status: 'amigo',
    affinity: 35,
    bio: 'Te respeta por sobrevivir al colapso. Regala suministros si comercias en aldeas.',
  },
  {
    id: 'acq_drake',
    name: 'Capitán Drake "El Tuerto"',
    role: 'Corsario Independiente',
    status: 'neutral',
    affinity: 0,
    bio: 'Respeta la fuerza naval. Puede hacerse tu amigo de copas o tu enemigo.',
  },
  {
    id: 'acq_malak',
    name: 'Malak "Barba de Hierro"',
    role: 'Señor de Isla Pirata',
    status: 'enemigo',
    affinity: -60,
    bio: 'Odia tu navío y sueña con abordar tu Buque de Guerra.',
  },
  {
    id: 'acq_aurelio',
    name: 'Príncipe Aurelio',
    role: 'Noble del Sol Dorado',
    status: 'neutral',
    affinity: 10,
    bio: 'Si respetas sus aldeas te colma de oro; si las saqueas pone precio a tu cabeza.',
  },
];

export const ROMANCE_CANDIDATES: RomanceCandidateDef[] = [
  {
    id: 'lucia',
    name: 'Lucía la Cantinera',
    role: 'Anfitriona de Puerto Coral',
    location: 'Aldeas de Coralía',
    personality: 'Ocurrente, valiente y experta preparando ron de coco.',
    color: '#f472b6',
    giftCost: { oro: 3, pez: 2 },
    quotes: [
      '¿Volviste entero, Capitán? ¡Te guardé el mejor pescado!',
      'Dicen que en tu buque de guerra hay más acción que en la taberna.',
    ],
  },
  {
    id: 'carmen',
    name: 'Corsaria Carmen',
    role: 'Navegante Rebelde',
    location: 'Muelles de la Liga',
    personality: 'Orgullosa, brava con el sable y romántica en secreto.',
    color: '#fb7185',
    giftCost: { oro: 4, hie: 3 },
    quotes: [
      'Tu puntería con el timón me tiene impresionada, Capitán.',
      'Si me invitas a saquear otro fuerte, digo que sí.',
    ],
  },
  {
    id: 'beatriz',
    name: 'Lady Beatriz',
    role: 'Cronista del Antiguo Mundo',
    location: 'Principado Dorado',
    personality: 'Elegante, bromista y coleccionista de reliquias y tecnología.',
    color: '#c084fc',
    giftCost: { oro: 5, tec: 1 },
    quotes: [
      'Eres más interesante que todos los nobles aburridos del principado.',
      'En el antiguo mundo escribían poemas; nosotros hacemos historia en el mar.',
    ],
  },
  {
    id: 'julian',
    name: 'Julián "Brisa Fuerte"',
    role: 'Maestro Velero',
    location: 'Astilleros del Sur',
    personality: 'Caballero de altamar, alegre y experto en nudos marineros.',
    color: '#38bdf8',
    giftCost: { oro: 3, mad: 5 },
    quotes: [
      'Ninguna tormenta me asusta si navego a tu lado.',
      'Ya cosí un velamen nuevo solo para verte sonreír.',
    ],
  },
];

export const CHILD_NAMES: string[] = [
  'Mateo',
  'Sofía',
  'Leo',
  'Valeria',
  'Iker',
  'Coral',
  'Bruno',
  'Alma',
];

export const CHILD_TRAITS: string[] = [
  'Ojo de Águila',
  'Corazón Valiente',
  'Manos de Carpintero',
  'Risa Contagiosa',
  'Alma de Corsario',
];

export const CHILD_QUOTES: string[] = [
  '¡Papá/Mamá, pesqué una bota pirata del tamaño de mi cabeza!',
  '¡Cuando crezca quiero mandar el Buque de Guerra Nuclear!',
  '¡El tío Kiko casi incendia la vela otra vez, jeje!',
  '¡Hoy aprendí a hacer nudos marineros sin enredarme los dedos!',
];
