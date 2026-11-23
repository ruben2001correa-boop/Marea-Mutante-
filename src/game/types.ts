export type GameMode = 'TITLE_MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

export type DifficultyLevel =
  | 'calma'
  | 'superviviente'
  | 'pesadilla'
  | 'abismo'
  | 'infernal';

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

export type Rarity = 'comun' | 'raro' | 'epico' | 'legendario' | 'divino';

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

export type StoryMissionId = string;

export type MissionCategory =
  | 'historia'
  | 'imperio'
  | 'caza'
  | 'piratas'
  | 'zombis'
  | 'hackers'
  | 'rescate'
  | 'comercio';

export type MissionEventKind =
  | 'convoy_buoy'
  | 'pirate_blockade'
  | 'zombie_nest'
  | 'hacker_relay'
  | 'siege_village'
  | 'leviathan_lair'
  | 'wreck_field';

export type MissionGoalType =
  | 'kill'
  | 'visit'
  | 'build'
  | 'collect'
  | 'explore'
  | 'trade'
  | 'clear_camp'
  | 'age';

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
  eventKind?: MissionEventKind;
}

export type WeaponCategory =
  | 'lanza'
  | 'espada'
  | 'arco'
  | 'fuego'
  | 'bomba'
  | 'magia'
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
  nuc_frag: number;
  cel_frag: number;
  alc: number;
  frag_epico: number;
  frag_legendario: number;
  frag_divino: number;
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
  isCelestial?: boolean;
  isMagic?: boolean;
  craftedByNpc?: 'armero' | 'forjador' | 'both';
  tier?: number;
  prereqWeaponId?: string;
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

export interface WarshipPassiveDef {
  id: string;
  name: string;
  description: string;
  bonusText: string;
  minRaftLevel: number;
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

export type AchievementStatKey =
  | 'kills'
  | 'banditKills'
  | 'islandsVisited'
  | 'chestsOpened'
  | 'weaponsOwned'
  | 'warsWon'
  | 'destinyUnlocked'
  | 'level'
  | 'elderLeviathansKilled'
  | 'celestialForged'
  | 'nuclearShieldReady'
  | 'dayCount'
  | 'bountyMillions'
  | 'radiosBuilt';

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  rewardText: string;
  target: number;
  statKey: AchievementStatKey;
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

export interface ChildMissionState {
  targetIslandId?: string;
  targetX: number;
  targetY: number;
  targetName: string;
  kind: 'explore' | 'trade' | 'raid';
  remainingSec: number;
  totalSec: number;
}

export interface ChildState {
  id: string;
  name: string;
  stage: 'bebé' | 'grumete' | 'oficial';
  bornDay: number;
  trait: string;
  activeMission?: ChildMissionState | null;
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
  | 'abisal'
  | 'zombie';

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
    | 'abandoned_bunker'
    | 'radio_tower'
    | 'zombie_grave'
    | 'mystery_monolith'
    | 'easter_egg'
    | 'marine_checkpoint';
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  depleted: boolean;
  villageName?: string;
  kingdomId?: string;
  pirateRank?: DangerRank;
  mysteryId?: string;
}

export type AgeTier = 1 | 2 | 3 | 4;

export interface IslandUnit {
  id: string;
  islandId: string;
  kind: 'villager' | 'farmer' | 'guard' | 'patrol_ship';
  role: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  targetX: number;
  targetY: number;
  gatherKind?: ResourceKey;
  carry?: number;
  gaitPhase: number;
  cd: number;
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
    | 'settlement'
    | 'wall'
    | 'radio_antenna'
    | 'nuclear_lab'
    | 'nuclear_reactor'
    | 'distillery'
    | 'patrol_dock'
    | 'house'
    | 'barracks'
    | 'mill'
    | 'blacksmith'
    | 'market'
    | 'watchtower'
    | 'forge_gate';
  x: number;
  y: number;
  level: number;
  timer: number;
  hp?: number;
  maxHp?: number;
  buildProgress?: number;
  customName?: string;
  styleBanner?: string;
}

export interface CompoundWallSegment {
  id: string;
  nodeId: string;
  islandId: string;
  kind: 'village' | 'pirate_camp';
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  isGate: boolean;
  hp: number;
  maxHp: number;
  destroyed: boolean;
}

export type IslandFactionControl = 'marina_gov' | 'pirate' | 'neutral_safe';

export type CombatFaction = 'pirate' | 'marina_gov' | 'monster' | 'neutral';

export interface IslandEntity {
  id: string;
  chunkKey: string;
  name: string;
  biome: IslandBiome;
  cultureId?: string;
  cultureName?: string;
  cultureColor?: string;
  cultureEmblem?: string;
  cultureTradition?: string;
  cultureGreeting?: string;
  regenTimer?: number;
  dangerous: boolean;
  isSafeZone?: boolean;
  factionControl?: IslandFactionControl;
  villagerPersonality?: 'hostile' | 'foolish' | 'friendly';
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
  missileLevel?: number;
  shieldLevel?: number;
  droneLevel?: number;
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
  | 'leviathan'
  | 'leviathan_baby'
  | 'leviathan_adult'
  | 'leviathan_elder'
  | 'zombie_walker'
  | 'zombie_brute'
  | 'zombie_spitter'
  | 'hacker_jammer'
  | 'hacker_siphoner'
  | 'hacker_corsair'
  | 'abysmal_eel'
  | 'abysmal_knight'
  | 'abysmal_siren'
  | 'abysmal_warden'
  | 'abysmal_angler'
  | 'abysmal_golem'
  | 'abysmal_empress'
  | 'abysmal_behemoth'
  | 'abysmal_necromancer'
  | 'abysmal_hydra'
  | 'abysmal_sovereign'
  | 'marine_patrol'
  | 'marine_captain'
  | 'gov_agent';

export interface EnemyEntity {
  id: number;
  kind: EnemyKind;
  name: string;
  isBandit: boolean;
  isThief: boolean;
  isBoss: boolean;
  isSemiBoss?: boolean;
  rangedShotKind?: 'shock' | 'sonic' | 'bone' | 'necrotic' | 'void';
  isAquatic: boolean;
  isLargeMonster: boolean;
  isLeviathan: boolean;
  leviathanStage?: 'baby' | 'adult' | 'elder';
  isZombie?: boolean;
  isHacker?: boolean;
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
  homeX?: number;
  homeY?: number;
  territoryRadius?: number;
  aiState?: 'patrol' | 'stalk' | 'flank' | 'lunge' | 'flee' | 'board' | 'swallow';
  aiTimer?: number;
  aiBarkCd?: number;
  strafeDir?: number;
  freezeTimer?: number;
  stunTimer?: number;
  slowTimer?: number;
}

export interface ProjectileEntity {
  id: number;
  fromPlayer: boolean;
  faction?: CombatFaction;
  sourceEnemyId?: number;
  kind: 'arrow' | 'bullet' | 'harpoon' | 'plasma' | 'bomb' | 'nuke' | 'magic' | 'missile' | 'enemy_shot';
  x: number;
  y: number;
  vx: number;
  vy: number;
  dmg: number;
  aoeRadius?: number;
  isNuclear?: boolean;
  isMagic?: boolean;
  life: number;
  color: string;
}

export type DevilFruitKind = 'onda' | 'hielo' | 'gravedad';

export interface FloatingDrop {
  id: number;
  kind: 'resource' | 'weapon' | 'devil_fruit';
  devilFruitKind?: DevilFruitKind;
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
  category:
    | 'PORTADA'
    | 'MUNDO'
    | 'RECOMPENSA'
    | 'CLIMA'
    | 'ECONOMÍA'
    | 'CRÓNICA'
    | 'PELIGRO'
    | 'GUERRA';
  headline: string;
  body: string;
  day: number;
  viaAi?: boolean;
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
  aiSummary?: string;
}

export interface WorldEventLogItem {
  id: string;
  day: number;
  kind: 'explore' | 'combat' | 'marina' | 'forge' | 'mission' | 'mystery' | 'boss';
  text: string;
}

export interface DeathCauseRecord {
  causeKey: string;
  headline: string;
  causeDetail: string;
  sarcasm: string;
  retryTaunt?: string;
  facts?: string[];
  aiLoading?: boolean;
  aiRoast?: boolean;
  day: number;
}

export interface RescueBoatEntity {
  id: number;
  sourceIslandId: string;
  sourceIslandName: string;
  targetIslandId: string;
  targetIslandName: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  angle: number;
  passengers: Array<{
    id?: string;
    name: string;
    color: string;
    hatColor?: string;
    role?: WorldNpcRole;
    title?: string;
    specialty?: string;
    greeting?: string;
  }>;
  life: number;
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
  achievementsCount?: number;
  titlesCount?: number;
  unlockedAchievementsPreview?: string[];
  flameTier?: number;
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

export type SituationalState =
  | 'normal'
  | 'adrenalina'
  | 'berserker'
  | 'enfoque'
  | 'determinacion'
  | 'panico';

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
  situationalState?: SituationalState;
  combatIntensity?: number;
  situationalTimer?: number;
  satietyTimer?: number;
  hydrationTimer?: number;
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
  foragingIsland?: boolean;
}

export interface ActiveNpcChatRenderInfo {
  npcId: string;
  npcName: string;
  aiMode: boolean;
  aiLoading: boolean;
  stage: 'choosing' | 'reading_reply' | 'finished';
}

export type WorldNpcRole =
  | 'armero'
  | 'forjador'
  | 'mercader'
  | 'alquimista'
  | 'cartografo'
  | 'chatarrero';

export interface WorldNpcEntity {
  id: string;
  role: WorldNpcRole;
  name: string;
  title: string;
  islandId: string;
  islandName: string;
  x: number;
  y: number;
  color: string;
  hatColor: string;
  specialty: string;
  greeting: string;
  discovered: boolean;
  lastQuote?: string;
}

export interface NpcHistoryEntry {
  speaker: 'player' | 'npc' | 'sistema';
  name: string;
  text: string;
  moodBadge?: string;
  viaAi?: boolean;
  ts: number;
}

export interface GameSettings {
  hudScale: number;
  joystickScale: number;
  joystickOpacity: number;
  actionBtnScale: number;
  orientationPref: 'auto' | 'landscape' | 'portrait';
  twinStickMobile: boolean;
  autoFullscreen: boolean;
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
  language: 'es' | 'en';
  difficulty: DifficultyLevel;
  settings: GameSettings;
  magicUnlocked: boolean;
  nuclearLabBuilt: boolean;
  nuclearReactorBuilt: boolean;
  radiationSuitCrafted: boolean;
  warshipNuclearShield: boolean;
  shipRadioBuilt: boolean;
  warshipPassives: string[];
  radiationExposure: number;
  hangoverTimer: number;
  jammedTimer: number;
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
  ageTier: AgeTier;
  islandUnits: IslandUnit[];
  aoeUpgrades: string[];
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
    missileLevel?: number;
    shieldLevel?: number;
    droneLevel?: number;
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
    elderLeviathansKilled: number;
    celestialForged: number;
    radiosBuilt: number;
  };
  discoveredIslands: string[];
  swallowedIslands: string[];
  discoveredMysteries?: string[];
  customWaypoint?: { x: number; y: number; label: string } | null;
  deathsUsed: number;
  extraLivesPurchased: number;
  tutorialStep: number;
  tutorialDismissed: boolean;
  vitals: PlayerVitalsState;
  npcMoods: Record<string, NpcMoodState>;
  npcChatHistory: Record<string, NpcHistoryEntry[]>;
  discoveredWorldNpcs: Array<{
    id: string;
    role: WorldNpcRole;
    name: string;
    islandName: string;
    x: number;
    y: number;
  }>;
  lastDeathCause?: DeathCauseRecord | null;
  recentEventsLog?: WorldEventLogItem[];
  vegaMarried?: boolean;
  marineThreat?: number;
  worldGovDecree?: string;
}
