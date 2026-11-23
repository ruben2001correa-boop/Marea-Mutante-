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

export interface SeaRankInfo {
  label: 'Rey de los Piratas' | 'Emperador del Mar' | 'Guerrero del Mar' | 'Súper Nova';
  shortLabel: string;
  color: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  icon: string;
}

export function getSeaRankInfo(rank: number | null | undefined): SeaRankInfo {
  if (rank === 1) {
    return {
      label: 'Rey de los Piratas',
      shortLabel: 'Rey Pirata',
      color: '#fde047',
      bgClass: 'bg-amber-400/20',
      borderClass: 'border-amber-300/75',
      textClass: 'text-amber-200',
      icon: '👑',
    };
  }
  if (typeof rank === 'number' && rank >= 2 && rank <= 5) {
    return {
      label: 'Emperador del Mar',
      shortLabel: 'Emperador',
      color: '#f43f5e',
      bgClass: 'bg-rose-500/20',
      borderClass: 'border-rose-400/70',
      textClass: 'text-rose-200',
      icon: '🔱',
    };
  }
  if (typeof rank === 'number' && rank >= 6 && rank <= 12) {
    return {
      label: 'Guerrero del Mar',
      shortLabel: 'Guerrero Mar',
      color: '#c084fc',
      bgClass: 'bg-purple-500/20',
      borderClass: 'border-purple-400/65',
      textClass: 'text-purple-200',
      icon: '⚔️',
    };
  }
  return {
    label: 'Súper Nova',
    shortLabel: 'Súper Nova',
    color: '#38bdf8',
    bgClass: 'bg-sky-500/20',
    borderClass: 'border-sky-400/60',
    textClass: 'text-sky-200',
    icon: '🌟',
  };
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

export const WORLD_GOV_DECREES: string[] = [
  'Decreto I: Patrullas de La Marina autorizadas a interceptar balsas sospechosas',
  'Decreto II: Bloqueo Mundial — Recompensas activan capitanes navales élite',
  'Decreto III: Ley del Siglo Vacío — Agentes del Gobierno custodian monolitos antiguos',
  'Decreto IV: Estado de Calamidad — Fuerza conjunta Marina y Gobierno en alta mar',
];

export function getMarineWantedLevel(state: PersistentState): {
  stars: 1 | 2 | 3 | 4 | 5;
  label: string;
  color: string;
  threat: number;
  agentsActive: boolean;
} {
  const baseThreat = typeof state.marineThreat === 'number' ? state.marineThreat : 10;
  const bountyScore = Math.floor((state.bounty || 0) / 18000000);
  const pillageScore = (state.stats?.villagesPillaged || 0) * 14;
  const threat = Math.max(0, Math.min(100, Math.round(baseThreat + bountyScore * 6 + pillageScore * 0.4)));
  if (threat >= 82 || state.bounty >= 140000000) {
    return { stars: 5, label: 'Objetivo Gobierno Mundial', color: '#f43f5e', threat, agentsActive: true };
  }
  if (threat >= 60 || state.bounty >= 65000000) {
    return { stars: 4, label: 'Alerta Máxima Marina', color: '#fb923c', threat, agentsActive: true };
  }
  if (threat >= 38 || state.bounty >= 25000000) {
    return { stars: 3, label: 'Persecución Naval', color: '#facc15', threat, agentsActive: false };
  }
  if (threat >= 18) {
    return { stars: 2, label: 'Bajo Vigilancia', color: '#38bdf8', threat, agentsActive: false };
  }
  return { stars: 1, label: 'Sin Captura Prioritaria', color: '#94a3b8', threat, agentsActive: false };
}

export function generateDailyNewsArticles(
  state: PersistentState,
  weather: WeatherType,
  day: number,
  activeCultures: string[] = []
): NewsArticle[] {
  const playerTag = state.clan.founded ? `[${state.clan.tag}] ` : '';
  const playerName = state.playerProfile.name || 'Capitán';
  const warKingdom = state.kingdoms.find((k) => k.atWar);
  const conqueredKingdom = state.kingdoms.find((k) => k.conquered);
  const activeBounty = state.pirateBounties.find((b) => !b.claimed);
  const swallowedCount = state.swallowedIslands?.length || 0;
  const discoveredMyst = state.discoveredMysteries?.length || 0;
  const recentLogs = Array.isArray(state.recentEventsLog) ? state.recentEventsLog : [];
  const wanted = getMarineWantedLevel(state);
  const decree = state.worldGovDecree || WORLD_GOV_DECREES[day % WORLD_GOV_DECREES.length];
  const cultureFocus =
    activeCultures.length > 0
      ? activeCultures[day % activeCultures.length]
      : 'Polinesia Maorí, Nórdica Skjald y Mexica Tenochca';

  const latestCombatLog = recentLogs.find((e) => e.kind === 'combat' || e.kind === 'boss' || e.kind === 'marina');
  const latestExploreLog = recentLogs.find((e) => e.kind === 'explore' || e.kind === 'mystery' || e.kind === 'mission');
  const latestForgeLog = recentLogs.find((e) => e.kind === 'forge');

  const portadaHeadline = conqueredKingdom
    ? `🔥 ¡EXTRA! ¡CAÍDA DE UN REINO! ${playerTag}${playerName} conquista ${conqueredKingdom.id.toUpperCase()} frente a La Marina`
    : warKingdom
      ? `⚔️ ¡GUERRA TOTAL EN LOS MARES! ${playerName} desafía a ${warKingdom.id.toUpperCase()} y altera las rutas`
      : latestCombatLog
        ? `📰 ¡ÚLTIMA HORA! ${latestCombatLog.text}`
        : state.raft.level >= 7
          ? `☢️ ¡BUQUE NUCLEAR AVISTADO! El Gobierno Mundial vigila los movimientos de ${playerName}`
          : `📰 ¡BOLETÍN DEL DÍA ${day}! ${playerTag}${playerName} sacude el archipiélago (${state.bounty.toLocaleString()} B)`;

  const recentSummaryText =
    recentLogs.length > 0
      ? `Bitácora verificada: ${recentLogs
          .slice(0, 2)
          .map((x) => x.text)
          .join(' · ')}.`
      : `Registro naval: ${state.stats.banditKills} enemigos batidos, ${state.stats.islandsVisited} islas cartografiadas y ${state.ownedWeapons.length} armas en armería.`;

  const portadaBody = conqueredKingdom
    ? `Con la caída de ${conqueredKingdom.id.toUpperCase()}, el navío "${getShipClassName(state.raft.level, state.warshipNuclearShield)}" obliga al Gobierno Mundial a reescribir sus cartas náuticas. ${recentSummaryText}`
    : `${recentSummaryText} Nivel de búsqueda ante La Marina: ${wanted.label} (${wanted.stars}★).`;

  const govHeadline = wanted.agentsActive
    ? `🏛️ ¡GOBIERNO MUNDIAL ACTIVA AGENTES ÉLITE CONTRA ${playerName.toUpperCase()}!`
    : `⚓ ¡LA MARINA REFUERZA PUESTOS DE CONTROL! ${decree.split(':')[0]}`;

  const govBody = wanted.agentsActive
    ? `${decree}. El Almirantazgo y agentes encubiertos del Gobierno Mundial rastrean tu ${getShipClassName(state.raft.level, state.warshipNuclearShield)} por todo el cuadrante.`
    : `${decree}. Patrullas de La Marina vigilan costas y rutas comerciales mientras persiguen piratas con cartel activo.`;

  const weatherNews: Record<WeatherType, string> = {
    despejado:
      'Visibilidad despejada: patrullas de La Marina inspeccionan veleros en altamar.',
    brisa:
      'Vientos alisios favorecen el comercio entre colonias libres y el despliegue rápido de fragatas.',
    lluvia:
      'Lluvia constante nutre los cultivos isleños mientras reduce el alcance de bengalas corsarias.',
    tormenta:
      '⚡ ¡TORMENTA DEL NUEVO MUNDO! Rayos castigan cubiertas sin blindaje y agitan las aguas abisales.',
    niebla:
      '🌫️ ¡NIEBLA ESPESA! Contrabandistas y agentes del Gobierno maniobran fuera del radar.',
    oleaje:
      '🌊 ¡MAREJADA ALTA! Olas gigantes ponen a prueba cascos y fortificaciones costeras.',
  };

  const articles: NewsArticle[] = [
    {
      id: `news_${day}_1`,
      category: 'PORTADA',
      headline: portadaHeadline,
      body: portadaBody,
      day,
    },
    {
      id: `news_${day}_2`,
      category: 'MUNDO',
      headline: govHeadline,
      body: govBody,
      day,
    },
    {
      id: `news_${day}_3`,
      category: 'CRÓNICA',
      headline: latestExploreLog
        ? `🧭 ¡CRÓNICA DE EXPEDICIÓN! ${latestExploreLog.text}`
        : `🌍 Culturas de ${cultureFocus} fortalecen sus asentamientos`,
      body: latestForgeLog
        ? `En los talleres del archipiélago destacó un hito reciente: ${latestForgeLog.text}. Mientras tanto, ${discoveredMyst}/8 misterios antiguos han sido descifrados.`
        : `Exploradores registran ${state.stats.islandsVisited} islas visitadas y ${discoveredMyst}/8 misterios antiguos desvelados en el océano mutante.`,
      day,
    },
    {
      id: `news_${day}_4`,
      category: 'RECOMPENSA',
      headline: activeBounty
        ? `💰 ¡CARTEL DEL DÍA! ${activeBounty.name} — ${activeBounty.bountyValue.toLocaleString()} B`
        : '👑 ¡TODOS LOS CARTELES HISTÓRICOS CAÍDOS! Recompensas sobre Súper Novas',
      body: activeBounty
        ? `${activeBounty.description} La Marina y el Tribunal Marítimo ofrecen +${activeBounty.rewardOro} Oro y +${activeBounty.rewardFame} Fama por su captura.`
        : `Con los corsarios clásicos derrotados, el Gobierno Mundial apunta directamente a la recompensa actual de ${playerName}: ${state.bounty.toLocaleString()} B.`,
      day,
    },
    {
      id: `news_${day}_5`,
      category: 'PELIGRO',
      headline:
        swallowedCount > 0
          ? `🐋 ¡ALERTA ABISMAL! ${swallowedCount} islas devoradas · Barcos de rescate activos`
          : '🗿 Jefes Abisales custodian sus territorios y Fragmentos de Fruta del Demonio',
      body:
        swallowedCount > 0
          ? `Operativos de rescate evacuan supervivientes hacia islas seguras mientras los Leviatanes Viejos patrullan las fosas profundas.`
          : `Navegantes reportan fragmentos misteriosos de Frutas del Demonio caídos en combate y jefes abisales que defienden feroces sus guaridas.`,
      day,
    },
    {
      id: `news_${day}_6`,
      category: 'CLIMA',
      headline: `⛈️ Parte de Navegación · Día ${day}: ${weather.toUpperCase()}`,
      body: weatherNews[weather],
      day,
    },
  ];

  return articles;
}

const VALID_NEWS_CATEGORIES = new Set<NewsArticle['category']>([
  'PORTADA',
  'MUNDO',
  'RECOMPENSA',
  'CLIMA',
  'ECONOMÍA',
  'CRÓNICA',
  'PELIGRO',
  'GUERRA',
]);

export async function requestAiNewspaperArticles(
  state: PersistentState,
  weather: WeatherType,
  day: number,
  activeCultures: string[]
): Promise<{
  ok: boolean;
  articles?: NewsArticle[];
  aiSummary?: string;
  error?: string;
}> {
  const recentEvents = (state.recentEventsLog || []).slice(0, 12).map((ev) => ({
    day: ev.day,
    kind: ev.kind,
    text: ev.text,
  }));
  const activeBounty = state.pirateBounties.find((b) => !b.claimed);
  const wanted = getMarineWantedLevel(state);
  const completedMissionsCount = (state.storyMissions || []).filter((m) => m.status === 'completed').length;
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 24000);
  try {
    const res = await fetch('/api/ai/newspaper', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        day,
        playerName: state.playerProfile.name,
        difficulty: state.difficulty,
        shipClass: getShipClassName(state.raft.level, state.warshipNuclearShield),
        bounty: state.bounty,
        kills: state.stats.kills,
        islandsVisited: state.stats.islandsVisited,
        weather,
        warActive: state.kingdoms.some((k) => k.atWar),
        swallowedCount: state.swallowedIslands?.length || 0,
        cultures: activeCultures,
        activeBountyName: activeBounty ? `${activeBounty.name} (${activeBounty.bountyValue.toLocaleString()} B)` : '',
        worldEvents: recentEvents,
        recentEvents: recentEvents.map((ev) => `Día ${ev.day}: ${ev.text}`),
        marineThreat: wanted.threat,
        marineLabel: wanted.label,
        worldGovDecree: state.worldGovDecree || WORLD_GOV_DECREES[day % WORLD_GOV_DECREES.length],
        ownedWeaponsCount: state.ownedWeapons?.length || 0,
        completedMissionsCount,
        discoveredMysteriesCount: state.discoveredMysteries?.length || 0,
      }),
    });
    let payload: { ok?: boolean; error?: string; data?: { aiSummary?: string; articles?: Array<{ category?: string; headline?: string; body?: string }> } } | null = null;
    try {
      payload = await res.json();
    } catch {
      payload = null;
    }
    if (!res.ok || !payload?.ok || !payload?.data) {
      return {
        ok: false,
        error: payload?.error || `Error del servidor de noticias IA (${res.status})`,
      };
    }
    const rawList = Array.isArray(payload.data.articles) ? payload.data.articles : [];
    const mapped: NewsArticle[] = rawList
      .filter((a) => Boolean(a?.headline && a?.body))
      .slice(0, 8)
      .map((a, idx) => {
        const upper = String(a.category || 'MUNDO').toUpperCase() as NewsArticle['category'];
        const category = VALID_NEWS_CATEGORIES.has(upper) ? upper : 'MUNDO';
        return {
          id: `ai_news_${day}_${Date.now()}_${idx}`,
          category,
          headline: String(a.headline).trim(),
          body: String(a.body).trim(),
          day,
          viaAi: true,
        };
      });
    if (mapped.length === 0) {
      return { ok: false, error: 'La IA devolvió una edición vacía.' };
    }
    return {
      ok: true,
      articles: mapped,
      aiSummary: typeof payload.data.aiSummary === 'string' ? payload.data.aiSummary : undefined,
    };
  } catch (err) {
    const isAbort = err instanceof Error && err.name === 'AbortError';
    return {
      ok: false,
      error: isAbort
        ? 'La redacción IA tardó demasiado en responder.'
        : err instanceof Error
          ? err.message
          : 'No se pudo conectar con la redacción IA.',
    };
  } finally {
    window.clearTimeout(timeoutId);
  }
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
  {
    id: 'marina',
    name: 'La Marina Naval',
    ruler: 'Almirante de Flota Vaelen',
    specialty: 'Patrullas, Puestos de Control y Caza de Piratas',
    color: '#60a5fa',
    description:
      'Brazo armado del orden marítimo. Vigila costas, levanta puestos de control y persigue capitanes con cartel activo.',
  },
  {
    id: 'gobierno_mundial',
    name: 'El Gobierno Mundial',
    ruler: 'Consejo de los Cinco Mares',
    specialty: 'Decretos Supremos, Zonas Restringidas y Agentes Élite',
    color: '#e2e8f0',
    description:
      'Máxima autoridad planetaria. Dicta leyes marítimas globales, censura el Siglo Vacío y envía agentes élite cuando subes de amenaza.',
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
