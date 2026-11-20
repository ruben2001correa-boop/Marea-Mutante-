import { DESTINY_MAP, SURVIVORS_CATALOG } from './destinyTree';
import { createInitialVitals } from './needsAndPsychology';
import { createInitialNpcMoods } from './npcConversations';
import { RELIC_MAP } from './relics';
import {
  INITIAL_ACQUAINTANCES,
  INITIAL_PIRATE_BOUNTIES,
  KINGDOMS_CATALOG,
  RIVAL_CLANS_CATALOG,
  TITLE_MAP,
  generateDailyNewsArticles,
} from './socialAndKingdoms';
import { createInitialStoryMissions } from './storyMissions';
import type { PersistentState, PlayerProfile, ResourceBag, ResourceKey, SurvivorId } from './types';

export const SAVE_KEY = 'marea_mutante_v6_save';
export const PROFILE_KEY = 'marea_mutante_profile_v1';
export const DONOR_PERK_KEY = 'marea_mutante_donor_v1';
export const MAX_FREE_DEATHS = 5;

export function getRemainingLives(state: PersistentState): number {
  return Math.max(
    0,
    MAX_FREE_DEATHS + (state.extraLivesPurchased || 0) - (state.deathsUsed || 0)
  );
}

export function loadDonorUnlocked(): boolean {
  try {
    return localStorage.getItem(DONOR_PERK_KEY) === '1';
  } catch {
    return false;
  }
}

export function saveDonorUnlocked(unlocked: boolean): void {
  try {
    localStorage.setItem(DONOR_PERK_KEY, unlocked ? '1' : '0');
  } catch {
    // Ignore storage errors
  }
}

export function getRaftHalfSize(raftLevel: number): number {
  return Math.min(176, 72 + (Math.max(1, raftLevel) - 1) * 14);
}

export function getRaftCorralLimit(raftLevel: number): number {
  return Math.min(6, 1 + Math.max(1, raftLevel));
}

export function getIslandCorralLimit(state: PersistentState, islandId: string | null): number {
  if (!islandId) return 6;
  const bases = state.islandStructures.filter(
    (s) => s.islandId === islandId && (s.kind === 'hq' || s.kind === 'shelter' || s.kind === 'warehouse')
  ).length;
  return Math.min(12, 6 + bases * 2);
}

export function loadOrCreateProfile(): PlayerProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (p && typeof p.id === 'string') {
        return {
          id: p.id,
          name: typeof p.name === 'string' && p.name.trim() ? p.name : 'Capitán Náufrago',
          country: typeof p.country === 'string' && p.country ? p.country : 'MX',
          maxScore: typeof p.maxScore === 'number' ? p.maxScore : 0,
        };
      }
    }
  } catch {
    // Ignore
  }
  const hex = Math.random().toString(16).slice(2, 8).toUpperCase();
  const created: PlayerProfile = {
    id: `MM-${hex}`,
    name: 'Capitán Náufrago',
    country: 'MX',
    maxScore: 0,
  };
  saveProfile(created);
  return created;
}

export function saveProfile(profile: PlayerProfile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // Ignore
  }
}

export function computeSurvivalScore(state: PersistentState): number {
  return Math.round(
    state.dayCount * 180 +
      state.level * 140 +
      state.fame +
      state.stats.kills * 25 +
      state.stats.islandsVisited * 90 +
      state.stats.warsWon * 320 +
      (state.stats.bountiesClaimed || 0) * 350 +
      (state.stats.ruinsExplored || 0) * 110 +
      state.raft.level * 160
  );
}

export function computePlayerBounty(state: PersistentState): number {
  return (
    1500000 +
    state.fame * 85000 +
    state.stats.banditKills * 1200000 +
    state.stats.villagesPillaged * 6500000 +
    state.stats.warsWon * 8000000 +
    (state.stats.bountiesClaimed || 0) * 12000000
  );
}

export const RESOURCE_LABELS: Record<ResourceKey, string> = {
  mad: 'Madera',
  cht: 'Chatarra',
  agu: 'Agua',
  pez: 'Pez',
  veg: 'Cultivos',
  gui: 'Guiso',
  oro: 'Oro',
  car: 'Carbón',
  hie: 'Hierro',
  tit: 'Titanio',
  cri: 'Cristal',
  tec: 'Tecnología',
};

export function initState(): PersistentState {
  const profile = loadOrCreateProfile();
  const state: PersistentState = {
    hp: 120,
    maxHp: 120,
    st: 100,
    maxSt: 100,
    level: 1,
    xp: 0,
    nextXp: 85,
    fame: 35,
    bounty: 4500000,
    dayCount: 1,
    elapsedSeconds: 0,
    stealthTimer: 0,
    sound: true,
    playerProfile: profile,
    checkpoint: {
      x: 0,
      y: 0,
      raftX: 0,
      raftY: 0,
      islandId: null,
      label: 'Fondeadero Inicial',
      savedDay: 1,
    },
    newspaper: {
      edition: 1,
      unread: true,
      lastDayPublished: 1,
      articles: [],
    },
    pirateBounties: INITIAL_PIRATE_BOUNTIES.map((b) => ({ ...b })),
    resources: {
      mad: 12,
      cht: 6,
      agu: 5,
      pez: 2,
      veg: 3,
      gui: 1,
      oro: 4,
      car: 2,
      hie: 2,
      tit: 0,
      cri: 0,
      tec: 0,
    },
    consumables: {
      repelente: 1,
      hamaca: 1,
    },
    ownedWeapons: ['lanza_madera', 'machete_oxidado'],
    hotbar: ['lanza_madera', 'machete_oxidado', '', '', ''],
    equippedSlot: 0,
    craftedTech: [],
    farmPlots: [],
    captiveAnimals: [],
    relicsOwned: [],
    equippedRelics: [],
    islandStructures: [],
    hqIslandId: null,
    hqIslandName: null,
    activeTitleId: loadDonorUnlocked() ? 'title_mecenas_cenizas' : 'title_naufrago',
    unlockedTitles: loadDonorUnlocked()
      ? ['title_naufrago', 'title_mecenas_cenizas']
      : ['title_naufrago'],
    donorUnlocked: loadDonorUnlocked(),
    donorSkinEnabled: loadDonorUnlocked(),
    storyMissions: createInitialStoryMissions(),
    activeStoryMissionId: null,
    kingdoms: KINGDOMS_CATALOG.map((k) => ({
      id: k.id,
      relation: k.id === 'escarlata' ? -60 : k.id === 'coralia' ? 25 : 10,
      atWar: false,
      conquered: false,
    })),
    clan: {
      founded: false,
      name: 'Clan Marea Libre',
      tag: 'MAREA',
      level: 1,
      members: 1,
      perks: [],
      rivals: RIVAL_CLANS_CATALOG.map((c) => ({ ...c })),
    },
    acquaintances: INITIAL_ACQUAINTANCES.map((a) => ({ ...a })),
    family: {
      affection: {},
      partnerId: null,
      married: false,
      children: [],
    },
    pillagedVillages: [],
    raft: {
      level: 1,
      turretLevel: 0,
      distillerLevel: 1,
      solarLevel: 1,
      engineLevel: 1,
      hp: 200,
      maxHp: 200,
      damagedMode: false,
    },
    survivors: SURVIVORS_CATALOG.map((s) => ({
      id: s.id,
      unlocked: s.id === 'vega',
      level: 1,
    })),
    destinyUnlocked: ['aprendiz_mar'],
    achievementsUnlocked: [],
    stats: {
      kills: 0,
      banditKills: 0,
      islandsVisited: 0,
      chestsOpened: 0,
      warsWon: 0,
      islandWarsWon: 0,
      villagesPillaged: 0,
      villagesTraded: 0,
      stolenRecovered: 0,
      bountiesClaimed: 0,
      ruinsExplored: 0,
    },
    discoveredIslands: [],
    swallowedIslands: [],
    deathsUsed: 0,
    extraLivesPurchased: 0,
    tutorialStep: 0,
    tutorialDismissed: false,
    vitals: createInitialVitals(),
    npcMoods: createInitialNpcMoods(),
  };
  state.newspaper.articles = generateDailyNewsArticles(state, 'despejado', 1);
  return state;
}

export function hasSavedProgress(): boolean {
  try {
    return Boolean(localStorage.getItem(SAVE_KEY));
  } catch {
    return false;
  }
}

export function loadState(): PersistentState {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return initState();
    const d = JSON.parse(raw);
    const base = initState();
    const profile = loadOrCreateProfile();
    const merged: PersistentState = {
      ...base,
      ...d,
      hp: typeof d.hp === 'number' && d.hp > 0 ? d.hp : base.hp,
      bounty: typeof d.bounty === 'number' ? d.bounty : base.bounty,
      playerProfile: {
        ...profile,
        ...(d.playerProfile || {}),
        id: profile.id,
        maxScore: Math.max(profile.maxScore, d.playerProfile?.maxScore || 0),
      },
      checkpoint: d.checkpoint || base.checkpoint,
      newspaper: d.newspaper && Array.isArray(d.newspaper.articles) ? d.newspaper : base.newspaper,
      pirateBounties: Array.isArray(d.pirateBounties)
        ? base.pirateBounties.map((pb) => {
            const found = d.pirateBounties.find((x: { id: string }) => x.id === pb.id);
            return found ? { ...pb, ...found } : pb;
          })
        : base.pirateBounties,
      resources: { ...base.resources, ...(d.resources || {}) },
      consumables: { ...base.consumables, ...(d.consumables || {}) },
      raft: { ...base.raft, ...(d.raft || {}) },
      stats: { ...base.stats, ...(d.stats || {}) },
      craftedTech: Array.isArray(d.craftedTech) ? d.craftedTech : [],
      farmPlots: Array.isArray(d.farmPlots) ? d.farmPlots : [],
      captiveAnimals: Array.isArray(d.captiveAnimals) ? d.captiveAnimals : [],
      relicsOwned: Array.isArray(d.relicsOwned) ? d.relicsOwned : [],
      equippedRelics: Array.isArray(d.equippedRelics) ? d.equippedRelics.slice(0, 3) : [],
      islandStructures: Array.isArray(d.islandStructures) ? d.islandStructures : [],
      hqIslandId: typeof d.hqIslandId === 'string' ? d.hqIslandId : null,
      hqIslandName: typeof d.hqIslandName === 'string' ? d.hqIslandName : null,
      donorUnlocked: Boolean(d.donorUnlocked) || loadDonorUnlocked(),
      donorSkinEnabled:
        typeof d.donorSkinEnabled === 'boolean'
          ? d.donorSkinEnabled
          : Boolean(d.donorUnlocked) || loadDonorUnlocked(),
      activeTitleId: typeof d.activeTitleId === 'string' ? d.activeTitleId : base.activeTitleId,
      unlockedTitles: Array.from(
        new Set([
          'title_naufrago',
          ...(Array.isArray(d.unlockedTitles) ? d.unlockedTitles : []),
          ...(Boolean(d.donorUnlocked) || loadDonorUnlocked() ? ['title_mecenas_cenizas'] : []),
        ])
      ),
      storyMissions: Array.isArray(d.storyMissions)
        ? base.storyMissions.map((bm) => {
            const found = d.storyMissions.find((x: { id: string }) => x.id === bm.id);
            return found ? { ...bm, ...found } : bm;
          })
        : base.storyMissions,
      activeStoryMissionId:
        typeof d.activeStoryMissionId === 'string' ? d.activeStoryMissionId : null,
      kingdoms: Array.isArray(d.kingdoms)
        ? base.kingdoms.map((bk) => {
            const found = d.kingdoms.find((x: { id: string }) => x.id === bk.id);
            return found ? { ...bk, ...found } : bk;
          })
        : base.kingdoms,
      clan: d.clan
        ? {
            ...base.clan,
            ...d.clan,
            perks: Array.isArray(d.clan.perks) ? d.clan.perks : [],
            rivals: Array.isArray(d.clan.rivals)
              ? base.clan.rivals.map((rc) => {
                  const found = d.clan.rivals.find((x: { id: string }) => x.id === rc.id);
                  return found ? { ...rc, ...found } : rc;
                })
              : base.clan.rivals,
          }
        : base.clan,
      acquaintances: Array.isArray(d.acquaintances)
        ? base.acquaintances.map((ba) => {
            const found = d.acquaintances.find((x: { id: string }) => x.id === ba.id);
            return found ? { ...ba, ...found } : ba;
          })
        : base.acquaintances,
      family: d.family
        ? {
            affection: d.family.affection || {},
            partnerId: d.family.partnerId || null,
            married: Boolean(d.family.married),
            children: Array.isArray(d.family.children) ? d.family.children : [],
          }
        : base.family,
      pillagedVillages: Array.isArray(d.pillagedVillages) ? d.pillagedVillages : [],
      survivors: Array.isArray(d.survivors)
        ? base.survivors.map((bs) => {
            const found = d.survivors.find((x: { id: string }) => x.id === bs.id);
            return found ? { ...bs, ...found } : bs;
          })
        : base.survivors,
      ownedWeapons:
        Array.isArray(d.ownedWeapons) && d.ownedWeapons.length > 0
          ? d.ownedWeapons
          : base.ownedWeapons,
      hotbar: Array.isArray(d.hotbar) && d.hotbar.length === 5 ? d.hotbar : base.hotbar,
      destinyUnlocked: Array.isArray(d.destinyUnlocked)
        ? Array.from(new Set(['aprendiz_mar', ...d.destinyUnlocked]))
        : base.destinyUnlocked,
      achievementsUnlocked: Array.isArray(d.achievementsUnlocked) ? d.achievementsUnlocked : [],
      discoveredIslands: Array.isArray(d.discoveredIslands) ? d.discoveredIslands : [],
      swallowedIslands: Array.isArray(d.swallowedIslands) ? d.swallowedIslands : [],
      deathsUsed: typeof d.deathsUsed === 'number' ? Math.max(0, d.deathsUsed) : 0,
      extraLivesPurchased:
        typeof d.extraLivesPurchased === 'number' ? Math.max(0, d.extraLivesPurchased) : 0,
      tutorialStep: typeof d.tutorialStep === 'number' ? Math.max(0, d.tutorialStep) : 0,
      tutorialDismissed: Boolean(d.tutorialDismissed),
      vitals: d.vitals ? { ...base.vitals, ...d.vitals } : base.vitals,
      npcMoods: d.npcMoods ? { ...base.npcMoods, ...d.npcMoods } : base.npcMoods,
    };
    return merged;
  } catch {
    return initState();
  }
}

export function saveState(state: PersistentState): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors
  }
}

export function clearSavedState(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // Ignore
  }
}

export function canAfford(bag: ResourceBag, cost?: Partial<ResourceBag>): boolean {
  if (!cost) return true;
  return (Object.keys(cost) as ResourceKey[]).every((k) => (bag[k] || 0) >= (cost[k] || 0));
}

export function spendResources(bag: ResourceBag, cost?: Partial<ResourceBag>): void {
  if (!cost) return;
  for (const k of Object.keys(cost) as ResourceKey[]) {
    bag[k] = Math.max(0, (bag[k] || 0) - (cost[k] || 0));
  }
}

export function hasDestiny(state: PersistentState, id: string): boolean {
  return state.destinyUnlocked.includes(id);
}

export function getSurvivorLevel(state: PersistentState, id: SurvivorId): number {
  const found = state.survivors.find((s) => s.id === id);
  return found && found.unlocked ? found.level : 0;
}

export function getTitleTotals(state: PersistentState) {
  const t = TITLE_MAP[state.activeTitleId];
  return {
    hpBonus: t?.hpBonus || 0,
    meleeBonus: t?.meleeBonus || 0,
    rangedBonus: t?.rangedBonus || 0,
    raftSpeedBonus: t?.raftSpeedBonus || 0,
  };
}

export function getRelicTotals(state: PersistentState) {
  let hpBonus = 0;
  let staminaBonus = 0;
  let meleeBonus = 0;
  let rangedBonus = 0;
  let damageReduction = 0;
  let hpRegen = 0;
  let speedBonus = 0;
  let raftSpeedBonus = 0;
  let gatherBonus = 0;
  let turretBonus = 0;
  let healBonus = 0;
  let hasSZS = false;

  for (const id of state.equippedRelics) {
    const r = RELIC_MAP[id];
    if (!r) continue;
    if (r.rank === 'SZS') hasSZS = true;
    hpBonus += r.hpBonus || 0;
    staminaBonus += r.staminaBonus || 0;
    meleeBonus += r.meleeBonus || 0;
    rangedBonus += r.rangedBonus || 0;
    damageReduction += r.damageReduction || 0;
    hpRegen += r.hpRegen || 0;
    speedBonus += r.speedBonus || 0;
    raftSpeedBonus += r.raftSpeedBonus || 0;
    gatherBonus += r.gatherBonus || 0;
    turretBonus += r.turretBonus || 0;
    healBonus += r.healBonus || 0;
  }

  return {
    hpBonus,
    staminaBonus,
    meleeBonus,
    rangedBonus,
    damageReduction,
    hpRegen,
    speedBonus,
    raftSpeedBonus,
    gatherBonus,
    turretBonus,
    healBonus,
    hasSZS,
  };
}

export function computeRaftMaxHp(state: PersistentState): number {
  let maxHp = 200 + (state.raft.level - 1) * 90;
  if (hasDestiny(state, 'naval_t2')) maxHp += 50;
  if (hasDestiny(state, 'naval_master')) maxHp += 150;
  if (state.clan.founded && state.clan.perks.includes('perk_casco')) maxHp += 80;
  return maxHp;
}

export function computeEffectiveMaxHp(state: PersistentState): number {
  let bonus = (state.level - 1) * 10;
  if (hasDestiny(state, 'abordaje_t2')) bonus += 20;
  if (hasDestiny(state, 'abordaje_t3')) bonus += 30;
  if (hasDestiny(state, 'abordaje_master')) bonus += 80;
  bonus += getRelicTotals(state).hpBonus;
  bonus += getTitleTotals(state).hpBonus;
  bonus += (state.family?.children.length || 0) * 10;
  return 120 + bonus;
}

export function computeEffectiveMaxStamina(state: PersistentState): number {
  let bonus = (state.level - 1) * 4;
  if (hasDestiny(state, 'alquimia_t2')) bonus += 25;
  bonus += getRelicTotals(state).staminaBonus;
  return 100 + bonus;
}

export function computeMeleeMultiplier(state: PersistentState): number {
  let mult = 1 + (state.level - 1) * 0.05;
  mult += getSurvivorLevel(state, 'vega') * 0.08;
  if (hasDestiny(state, 'abordaje_t2')) mult += 0.15;
  if (hasDestiny(state, 'abordaje_t4')) mult += 0.3;
  if (hasDestiny(state, 'abordaje_master')) mult += 0.45;
  if (state.clan.founded && state.clan.perks.includes('perk_furia')) mult += 0.15;
  mult += getRelicTotals(state).meleeBonus;
  mult += getTitleTotals(state).meleeBonus;
  return mult;
}

export function computeRangedMultiplier(state: PersistentState): number {
  let mult = 1 + (state.level - 1) * 0.05;
  mult += getSurvivorLevel(state, 'vega') * 0.08;
  if (hasDestiny(state, 'balistica_t2')) mult += 0.15;
  if (hasDestiny(state, 'balistica_t4')) mult += 0.35;
  if (hasDestiny(state, 'balistica_master')) mult += 0.5;
  if (state.clan.founded && state.clan.perks.includes('perk_furia')) mult += 0.15;
  mult += getRelicTotals(state).rangedBonus;
  mult += getTitleTotals(state).rangedBonus;
  return mult;
}

export function computeRaftSpeed(state: PersistentState): number {
  let spd = 145 + (state.raft.engineLevel - 1) * 24;
  spd *= 1 + getSurvivorLevel(state, 'vega') * 0.1;
  if (hasDestiny(state, 'naval_t2')) spd *= 1.2;
  if (state.craftedTech.includes('tech_ionico')) spd *= 1.3;
  spd *= 1 + getRelicTotals(state).raftSpeedBonus + getTitleTotals(state).raftSpeedBonus;
  if (state.raft.damagedMode) spd *= 0.35;
  return spd;
}

export function canUnlockDestinyNode(state: PersistentState, nodeId: string): boolean {
  const node = DESTINY_MAP[nodeId];
  if (!node) return false;
  if (hasDestiny(state, nodeId)) return false;
  if (state.level < node.minLevel) return false;
  if (state.fame < node.fameCost) return false;
  if (!node.requires.every((req) => hasDestiny(state, req))) return false;
  return canAfford(state.resources, node.resourceCost);
}
