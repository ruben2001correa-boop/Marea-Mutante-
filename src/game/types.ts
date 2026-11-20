export type GameMode = 'TITLE_MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

export type DrawerTab =
  | 'arsenal'
  | 'raft'
  | 'islands'
  | 'kingdoms'
  | 'clans'
  | 'farm'
  | 'trade'
  | 'crew'
  | 'family'
  | 'relics'
  | 'achievements';

export type Rarity = 'comun' | 'raro' | 'epico' | 'legendario';

export type RelicRank = 'F' | 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'SS' | 'SZS';

export type WeatherType = 'despejado' | 'brisa' | 'lluvia' | 'tormenta' | 'niebla' | 'oleaje';

export type DangerRank = 'F' | 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'SS' | 'SSS';

export type IntroCutscenePhase = 'adrift' | 'spot_raft' | 'swim_to_raft' | 'meet_vega';

export interface IntroCutsceneState {
  active: boolean;
  phase: IntroCutscenePhase;
  elapsed: number;
  phaseElapsed: number;
  captionTitle: string;
  captionText: string;
}

export type RandomEventKind = 'pirate_hunt' | 'fish_frenzy' | 'guerrilla_war' | 'salvage_surge';

export type StoryMissionId = 'boya_nombres' | 'pan_tormenta' | 'canto_casco' | 'deuda_tierra';

export type StoryMissionStatus =
  | 'available'
  | 'active'
  | 'decision_pending'
  | 'completed';

export interface StoryMissionProgress {
  id: StoryMissionId;
  status: StoryMissionStatus;
  progress: number;
  target: number;
  choice?: 'A' | 'B';
  choiceLabel?: string;
  markerX?: number;
  markerY?: number;
}

export type WeaponCategory =
  | 'lanza'
  | 'espada'
  | 'arco'
  | 'fuego'
  | 'bomba'
  | 'herramienta';

export interface ResourceBag {
  mad: number;
  cht: number;
  agu: number;
  pez: number;
  veg: number;
  gui: number;
  oro: number;
  car: number;
  hie: number;
  tit: number;
  cri: number;
  tec: number;
}

export type ResourceKey = keyof ResourceBag;

export interface WeaponDef {
  id: string;
  name: string;
  category: WeaponCategory;
  rarity: Rarity;
  damage: number;
  range: number;
  cooldown: number;
  staminaCost: number;
  pellets?: number;
  spread?: number;
  aoeRadius?: number;
  projSpeed?: number;
  harvestBonus?: number;
  mineBonus?: number;
  healAmount?: number;
  isNuclear?: boolean;
  description: string;
  craftCost?: Partial<ResourceBag>;
}

export interface TechPieceDef {
  id: string;
  name: string;
  description: string;
  bonusText: string;
  cost: Partial<ResourceBag>;
}

export interface RelicDef {
  id: string;
  name: string;
  rank: RelicRank;
  utility: string;
  description: string;
  hpBonus?: number;
  staminaBonus?: number;
  meleeBonus?: number;
  rangedBonus?: number;
  damageReduction?: number;
  hpRegen?: number;
  speedBonus?: number;
  raftSpeedBonus?: number;
  gatherBonus?: number;
  turretBonus?: number;
  healBonus?: number;
}

export type SurvivorId = 'vega' | 'kiko' | 'nerea' | 'beto' | 'pipo' | 'morgana';

export interface SurvivorDef {
  id: SurvivorId;
  name: string;
  role: string;
  personality: string;
  strengthRank: 1 | 2 | 3 | 4 | 5;
  strengthLabel: string;
  attackDmg: number;
  attackCd: number;
  attackRange: number;
  isRanged: boolean;
  uniqueSkillName: string;
  uniqueSkillDesc: string;
  color: string;
  hatColor: string;
  recruitCost: Partial<ResourceBag>;
  quotes: string[];
}

export interface SurvivorState {
  id: SurvivorId;
  unlocked: boolean;
  level: number;
}

export interface DestinyNodeDef {
  id: string;
  name: string;
  branch: 'centro' | 'abordaje' | 'balistica' | 'naval' | 'alquimia';
  tier: 1 | 2 | 3 | 4 | 5;
  x: number;
  y: number;
  requires: string[];
  fameCost: number;
  minLevel: number;
  resourceCost: Partial<ResourceBag>;
  bonusLabel: string;
  description: string;
}

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  rewardText: string;
  target: number;
  statKey:
    | 'kills'
    | 'banditKills'
    | 'islandsVisited'
    | 'chestsOpened'
    | 'weaponsOwned'
    | 'warsWon'
    | 'destinyUnlocked'
    | 'level';
}

export interface TitleDef {
  id: string;
  name: string;
  tier: 'raro' | 'epico' | 'legendario';
  requirementText: string;
  bonusText: string;
  meleeBonus?: number;
  rangedBonus?: number;
  hpBonus?: number;
  raftSpeedBonus?: number;
}

export interface KingdomDef {
  id: string;
  name: string;
  ruler: string;
  specialty: string;
  color: string;
  description: string;
}

export interface KingdomState {
  id: string;
  relation: number;
  atWar: boolean;
  conquered: boolean;
}

export interface RivalClanState {
  id: string;
  name: string;
  tag: string;
  color: string;
  power: number;
  relation: number;
  atWar: boolean;
  conquered: boolean;
  specialty: string;
}

export interface ClanState {
  founded: boolean;
  name: string;
  tag: string;
  level: number;
  members: number;
  perks: string[];
  rivals: RivalClanState[];
}

export interface AcquaintanceState {
  id: string;
  name: string;
  role: string;
  status: 'amigo' | 'neutral' | 'enemigo';
  affinity: number;
  bio: string;
}

export interface RomanceCandidateDef {
  id: string;
  name: string;
  role: string;
  location: string;
  personality: string;
  color: string;
  giftCost: Partial<ResourceBag>;
  quotes: string[];
}

export interface ChildState {
  id: string;
  name: string;
  stage: 'bebé' | 'grumete' | 'oficial';
  bornDay: number;
  trait: string;
}

export interface FamilyState {
  affection: Record<string, number>;
  partnerId: string | null;
  married: boolean;
  children: ChildState[];
}

export type IslandBiome =
  | 'tropical'
  | 'desierto'
  | 'volcanica'
  | 'minera'
  | 'chatarra'
  | 'pirata'
  | 'pradera'
  | 'abisal';

export interface IslandNode {
  id: string;
  kind:
    | 'tree'
    | 'rock'
    | 'coal'
    | 'iron'
    | 'gold_vein'
    | 'titanium'
    | 'crystal'
    | 'tech_wreck'
    | 'chest'
    | 'pirate_camp'
    | 'village'
    | 'fishing_post'
    | 'abandoned_ruin'
    | 'abandoned_lighthouse'
    | 'shipwreck'
    | 'abandoned_bunker';
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  depleted: boolean;
  villageName?: string;
  kingdomId?: string;
  pirateRank?: DangerRank;
}

export interface IslandStructure {
  id: string;
  islandId: string;
  kind:
    | 'shelter'
    | 'turret'
    | 'extractor'
    | 'hq'
    | 'warehouse'
    | 'nuclear_bunker'
    | 'settlement';
  x: number;
  y: number;
  level: number;
  timer: number;
  customName?: string;
  styleBanner?: string;
}

export interface IslandEntity {
  id: string;
  chunkKey: string;
  name: string;
  biome: IslandBiome;
  dangerous: boolean;
  pirateRank?: DangerRank;
  hasVolcano?: boolean;
  kingdomId?: string;
  x: number;
  y: number;
  radius: number;
  points: Array<{ angle: number; r: number }>;
  nodes: IslandNode[];
  discovered: boolean;
}

export type AnimalKind = 'chicken' | 'pig' | 'goat' | 'boar' | 'scorpion' | 'wolf';

export interface AnimalEntity {
  id: number;
  kind: AnimalKind;
  name: string;
  islandId: string;
  isWild: boolean;
  capturable: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  dmg: number;
  radius: number;
  hitT: number;
  cd: number;
  wanderT: number;
  gaitPhase: number;
  aiState?: 'graze' | 'stalk' | 'charge' | 'flee';
  aiTimer?: number;
}

export type CropKind = 'algas' | 'maiz_mar' | 'tomate_coral' | 'calabaza_sal';

export interface CropDef {
  id: CropKind;
  name: string;
  growSeconds: number;
  yieldVeg: number;
  yieldBonusKey?: ResourceKey;
  yieldBonusAmount?: number;
  seedCost: Partial<ResourceBag>;
  color: string;
  description: string;
}

export interface FarmPlot {
  id: string;
  location: 'raft' | 'island';
  islandId: string | null;
  x: number;
  y: number;
  crop: CropKind | null;
  growth: number;
  watered: boolean;
}

export interface CaptiveAnimal {
  id: string;
  kind: AnimalKind;
  name: string;
  location: 'raft' | 'island';
  islandId: string | null;
  level: number;
  prodTimer: number;
  prodInterval: number;
}

export interface PlayerEntity {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  speed: number;
  onRaft: boolean;
  piloting: boolean;
  swimming: boolean;
  onIsland: boolean;
  inShelter: boolean;
  atkT: number;
  cd: number;
  dashT: number;
  invT: number;
  animT: number;
  gaitPhase: number;
}

export interface RaftEntity {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  level: number;
  turretLevel: number;
  distillerLevel: number;
  solarLevel: number;
  engineLevel: number;
  hp: number;
  maxHp: number;
  damagedMode: boolean;
}

export type EnemyKind =
  | 'bandit_grunt'
  | 'bandit_thief'
  | 'bandit_gunner'
  | 'bandit_boss'
  | 'crab'
  | 'jelly'
  | 'shark'
  | 'kraken'
  | 'leviathan';

export interface EnemyEntity {
  id: number;
  kind: EnemyKind;
  name: string;
  isBandit: boolean;
  isThief: boolean;
  isBoss: boolean;
  isAquatic: boolean;
  isLargeMonster: boolean;
  isLeviathan: boolean;
  provoked: boolean;
  onLand: boolean;
  boardedRaft: boolean;
  parkedBoat?: { x: number; y: number; angle: number } | null;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  dmg: number;
  speed: number;
  radius: number;
  color: string;
  cd: number;
  hitT: number;
  gaitPhase: number;
  stealProgress: number;
  stolenBag?: { key: ResourceKey; amount: number } | null;
  fameReward: number;
  bountyId?: string | null;
  storyMissionId?: StoryMissionId | null;
  swallowTargetIslandId?: string | null;
  swallowTimer?: number;
  aiState?: 'patrol' | 'stalk' | 'flank' | 'lunge' | 'flee' | 'board' | 'swallow';
  aiTimer?: number;
  aiBarkCd?: number;
  strafeDir?: number;
}

export interface ProjectileEntity {
  id: number;
  fromPlayer: boolean;
  kind: 'arrow' | 'bullet' | 'harpoon' | 'plasma' | 'bomb' | 'nuke' | 'enemy_shot';
  x: number;
  y: number;
  vx: number;
  vy: number;
  dmg: number;
  aoeRadius?: number;
  isNuclear?: boolean;
  life: number;
  color: string;
}

export interface FloatingDrop {
  id: number;
  kind: 'resource' | 'weapon';
  resourceKey?: ResourceKey;
  amount?: number;
  weaponId?: string;
  label: string;
  color: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  bob: number;
}

export interface ExplosionFx {
  x: number;
  y: number;
  radius: number;
  life: number;
  maxLife: number;
  color: string;
}

export interface SplashFx {
  x: number;
  y: number;
  life: number;
  maxLife: number;
  maxRadius: number;
}

export interface SlashFx {
  x: number;
  y: number;
  angle: number;
  reach: number;
  life: number;
  maxLife: number;
  color: string;
}

export interface FloatingPopup {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
}

export interface ComicBubble {
  id: number;
  speaker: string;
  text: string;
  x: number;
  y: number;
  life: number;
  color: string;
}

export interface WarEventState {
  active: boolean;
  title: string;
  wave: number;
  remaining: number;
  total: number;
  cooldown: number;
  targetKingdomId?: string | null;
  targetClanId?: string | null;
  isIslandWar?: boolean;
}

export interface RandomEventState {
  active: boolean;
  kind: RandomEventKind | null;
  title: string;
  timer: number;
  targetCount: number;
  progress: number;
}

export interface CheckpointState {
  x: number;
  y: number;
  raftX: number;
  raftY: number;
  islandId: string | null;
  label: string;
  savedDay: number;
}

export interface NewsArticle {
  id: string;
  category: 'PORTADA' | 'MUNDO' | 'RECOMPENSA' | 'CLIMA' | 'ECONOMÍA';
  headline: string;
  body: string;
  day: number;
}

export interface PirateBounty {
  id: string;
  name: string;
  epithet: string;
  dangerLevel: number;
  rewardOro: number;
  rewardFame: number;
  bountyValue: number;
  description: string;
  claimed: boolean;
  active: boolean;
  targetX?: number;
  targetY?: number;
}

export interface NewspaperState {
  edition: number;
  unread: boolean;
  lastDayPublished: number;
  articles: NewsArticle[];
}

export interface PlayerProfile {
  id: string;
  name: string;
  country: string;
  maxScore: number;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  country: string;
  maxScore: number;
  currentScore: number;
  dayCount: number;
  level: number;
  bounty: number;
  clanTag: string;
  titleName?: string;
  shipClass?: string;
  kills?: number;
  islandsVisited?: number;
  donorUnlocked?: boolean;
  lastSeen: number;
  activeNow: boolean;
}

export type EmotionalMood =
  | 'equilibrio'
  | 'felicidad'
  | 'tristeza'
  | 'enojo'
  | 'orgullo'
  | 'soberbia'
  | 'lokito';

export type NpcAttitudeMood = EmotionalMood | 'cansancio';

export interface PlayerVitalsState {
  thirst: number;
  hunger: number;
  sleepiness: number;
  fatigue: number;
  mentalHealth: number;
  mood: EmotionalMood;
  moodTimer: number;
  pridePoints: number;
}

export interface NpcMoodState {
  mood: NpcAttitudeMood;
  affinity: number;
  reason: string;
  chatsCompleted: number;
}

export type NpcAnimState = 'walking' | 'swimming' | 'interacting' | 'idle';

export interface NpcLiveVisualState {
  animState: NpcAnimState;
  mood: NpcAttitudeMood;
  activityLabel: string;
  speakingUntil: number;
  viaAi: boolean;
  lastSpeech?: string;
  x: number;
  y: number;
}

export interface ActiveNpcChatRenderInfo {
  npcId: string;
  npcName: string;
  aiMode: boolean;
  aiLoading: boolean;
  stage: 'choosing' | 'reading_reply' | 'finished';
}

export interface PersistentState {
  hp: number;
  maxHp: number;
  st: number;
  maxSt: number;
  level: number;
  xp: number;
  nextXp: number;
  fame: number;
  bounty: number;
  dayCount: number;
  elapsedSeconds: number;
  stealthTimer: number;
  sound: boolean;
  playerProfile: PlayerProfile;
  checkpoint: CheckpointState | null;
  newspaper: NewspaperState;
  pirateBounties: PirateBounty[];
  resources: ResourceBag;
  consumables: {
    repelente: number;
    hamaca: number;
  };
  ownedWeapons: string[];
  hotbar: string[];
  equippedSlot: number;
  craftedTech: string[];
  farmPlots: FarmPlot[];
  captiveAnimals: CaptiveAnimal[];
  relicsOwned: string[];
  equippedRelics: string[];
  islandStructures: IslandStructure[];
  hqIslandId: string | null;
  hqIslandName: string | null;
  activeTitleId: string;
  unlockedTitles: string[];
  donorUnlocked: boolean;
  donorSkinEnabled: boolean;
  storyMissions: StoryMissionProgress[];
  activeStoryMissionId: StoryMissionId | null;
  kingdoms: KingdomState[];
  clan: ClanState;
  acquaintances: AcquaintanceState[];
  family: FamilyState;
  pillagedVillages: string[];
  raft: {
    level: number;
    turretLevel: number;
    distillerLevel: number;
    solarLevel: number;
    engineLevel: number;
    hp: number;
    maxHp: number;
    damagedMode: boolean;
  };
  survivors: SurvivorState[];
  destinyUnlocked: string[];
  achievementsUnlocked: string[];
  stats: {
    kills: number;
    banditKills: number;
    islandsVisited: number;
    chestsOpened: number;
    warsWon: number;
    islandWarsWon: number;
    villagesPillaged: number;
    villagesTraded: number;
    stolenRecovered: number;
    bountiesClaimed: number;
    ruinsExplored: number;
  };
  discoveredIslands: string[];
  swallowedIslands: string[];
  deathsUsed: number;
  extraLivesPurchased: number;
  tutorialStep: number;
  tutorialDismissed: boolean;
  vitals: PlayerVitalsState;
  npcMoods: Record<string, NpcMoodState>;
}
