import type {
  EnemyKind,
  MissionCategory,
  MissionEventKind,
  MissionGoalType,
  ResourceBag,
  StoryMissionId,
  StoryMissionProgress,
} from './types';

export interface NarrativePillarDef {
  id: string;
  title: string;
  subtitle: string;
  text: string;
}

export interface StoryChoiceOutcome {
  id: 'A' | 'B';
  label: string;
  emotionalNote: string;
  cost?: Partial<ResourceBag>;
  hullDelta?: number;
  hpDelta?: number;
  staminaDelta?: number;
  reward?: Partial<ResourceBag>;
  xp: number;
  fame: number;
  bountyDelta?: number;
  coraliaRelationDelta?: number;
  crewSpeaker: string;
  crewLine: string;
  newsHeadline: string;
  newsBody: string;
}

export interface StoryMissionDef {
  id: StoryMissionId;
  chapter: string;
  category: string;
  categoryKey: MissionCategory;
  tier: 1 | 2 | 3 | 4 | 5;
  title: string;
  premise: string;
  emotionalHook: string;
  objectiveText: string;
  goalType: MissionGoalType;
  eventKind: MissionEventKind;
  targetCount: number;
  enemySpawns: EnemyKind[];
  supplyDrops?: Array<{ key: keyof ResourceBag; amount: number }>;
  startDialog: string;
  decisionPrompt: string;
  choices: [StoryChoiceOutcome, StoryChoiceOutcome];
}

export const MISSION_CATEGORY_META: Record<
  MissionCategory,
  { label: string; badge: string; color: string }
> = {
  historia: { label: 'Historia Principal', badge: 'Crónica', color: '#fbbf24' },
  imperio: { label: 'Imperio & Edificios', badge: 'Imperio', color: '#34d399' },
  caza: { label: 'Caza Abisal', badge: 'Caza', color: '#38bdf8' },
  piratas: { label: 'Flotas Piratas', badge: 'Piratas', color: '#fb7185' },
  zombis: { label: 'Plaga Zombi', badge: 'Zombis', color: '#a3e635' },
  hackers: { label: 'Guerra Electrónica', badge: 'Hackers', color: '#22d3ee' },
  rescate: { label: 'Rescate & Radio', badge: 'Rescate', color: '#f472b6' },
  comercio: { label: 'Rutas & Comercio', badge: 'Comercio', color: '#f59e0b' },
};

export const WORLD_STORY_LORE = {
  worldTitle: 'El Océano de las Cenizas Saladas',
  worldBody:
    'Antes del hundimiento, las ciudades costeras creyeron que podían domar el mar y las fallas abisales. Cuando todo colapsó, no llegó un fin rápido: llegó una marea mutante que tragó puertos enteros, envenenó las aguas y despertó a los Leviatanes, bestias antiguas y deformadas por la toxina y la presión que cazan barcos como si fueran astillas. En tierra firme, el orden público se hizo pedazos. Los gobiernos cayeron, las leyes se convirtieron en chistes malos y los Piratas dejaron de ser románticos forajidos para volverse carroñeros organizados, señores de la chatarra y traficantes de lo único que importa cuando el agua mata y el hambre quema: combustible, agua limpia, medicinas y personas útiles.',
  coreTitle: 'El Núcleo Desgarrador: "El Último Rumbo de los Olvidados"',
  coreBody:
    'La tragedia central de esta historia no es solo luchar contra monstruos o bandidos; es darse cuenta de que sobrevivir a veces exige volverte aquello que juraste odiar. Cada tabla de madera del casco, cada ración de guiso o de vegetales, y cada noche intentando dormir mientras el mar golpea el casco recuerda lo que se perdió: familias separadas en muelles en llamas, compañeros que no llegaron al siguiente día y promesas hechas cuando todavía existía un "mañana". El mar ya no pertenece a nadie, pero cobra peaje en sangre, culpa y memoria.',
};

export const NARRATIVE_PILLARS: NarrativePillarDef[] = [
  {
    id: 'hull',
    title: 'El Casco y la Madera',
    subtitle: 'La frontera contra el abismo',
    text: 'Cada golpe de un leviatán o de un abordaje no es solo un número bajando: es el crujido de lo poco que separa a la tripulación de un agua helada y mutada donde nadie dura un minuto.',
  },
  {
    id: 'hunger',
    title: 'Hambre, Guiso y Descanso',
    subtitle: 'Humanidad en medio del caos',
    text: 'Comer un guiso caliente o intentar dormir en medio del caos no es un trámite; es un instante frágil de humanidad antes de volver a enfrentar el horror.',
  },
  {
    id: 'supplies',
    title: 'Corriente de Suministros',
    subtitle: 'Migajas disputadas con sangre',
    text: 'El mar arroja cajas, restos y cargas valiosas... pero casi siempre vienen manchadas. Recogerlas significa disputar migajas en un océano donde otros están dispuestos a matarte por una lata o un trozo de metal.',
  },
  {
    id: 'crew',
    title: 'La Tripulación',
    subtitle: 'Vice-Cap. Vega, náufragos y reclutas',
    text: 'Nadie sube a bordo intacto. Todos cargan una pérdida, una traición o una deuda moral. La confianza es un lujo caro cuando el espacio y los recursos escasean.',
  },
];

const CORE_STORY_MISSIONS: StoryMissionDef[] = [
  {
    id: 'boya_nombres',
    chapter: 'Capítulo I · Rescate y Memoria',
    category: 'Historia / Rescate',
    categoryKey: 'historia',
    tier: 1,
    title: 'La Boya de los Nombres',
    premise:
      'Una señal de auxilio antigua sigue repitiéndose en una zona acechada por criaturas mutantes. Al llegar, no hay héroes que salvar, sino los restos de un convoy civil y el registro de quienes intentaron cruzar cuando el orden colapsó.',
    emotionalHook:
      'Decidir si arriesgar el casco y la tripulación por recuperar recuerdos y suministros de gente muerta, o dejarlos atrás para que los vivos no mueran hoy.',
    objectiveText: 'Navega hasta la Boya del Convoy y despeja las 3 criaturas mutantes que la rodean.',
    goalType: 'kill',
    eventKind: 'convoy_buoy',
    targetCount: 3,
    enemySpawns: ['crab', 'shark', 'crab'],
    supplyDrops: [
      { key: 'mad', amount: 4 },
      { key: 'agu', amount: 2 },
    ],
    startDialog:
      'La boya sigue emitiendo nombres de civiles... Los restos del convoy están rodeados de mutantes.',
    decisionPrompt:
      'Las criaturas han sido repelidas, pero el oleaje tóxico golpea los restos del convoy civil. ¿Qué ordenas hacer con las bitácoras y recuerdos de los caídos?',
    choices: [
      {
        id: 'A',
        label: 'Arriesgar el casco y rescatar las bitácoras y reliquias',
        emotionalNote: 'Cuidas la memoria de los olvidados aunque el casco cruja (-14 Casco).',
        hullDelta: -14,
        reward: { oro: 4, tec: 2, cht: 4 },
        xp: 75,
        fame: 85,
        crewSpeaker: 'Vice-Cap. Vega',
        crewLine:
          'Cada nombre rescatado pesa en el alma... pero nadie olvidará que intentaron cruzar.',
        newsHeadline: 'Rescatan bitácoras del Convoy Civil en La Boya de los Nombres',
        newsBody:
          'Entre aguas tóxicas y maderas partidas, la tripulación recuperó las listas de desaparecidos del último éxodo costero.',
      },
      {
        id: 'B',
        label: 'Priorizar a los vivos, sellar el casco y recoger solo víveres rápidos',
        emotionalNote: 'El barco sobrevive íntegro (+22 Casco, +15 ST), pero las memorias se hunden.',
        hullDelta: 22,
        staminaDelta: 15,
        reward: { veg: 3, agu: 3 },
        xp: 45,
        fame: 35,
        crewSpeaker: 'Vice-Cap. Vega',
        crewLine:
          'Dejamos sus nombres bajo la sal para que nosotros sigamos respirando. Duele, Capitán.',
        newsHeadline: 'Retirada táctica en La Boya de los Nombres',
        newsBody:
          'Una embarcación logró escapar de la zona de auxilio mutada poniendo a salvo a su tripulación viva.',
      },
    ],
  },
  {
    id: 'pan_tormenta',
    chapter: 'Capítulo II · Suministros y Moral',
    category: 'Historia / Moral',
    categoryKey: 'historia',
    tier: 2,
    title: 'Pan en Medio de la Tormenta',
    premise:
      'Una Corriente de Suministros arrastra víveres escasos, pero una facción pirata desesperada —liderada por antiguos civiles que enloquecieron de hambre— intenta tomarlos.',
    emotionalHook:
      'Enfrentarte a gente que no es malvada por naturaleza, sino consumida por la miseria del colapso.',
    objectiveText: 'Detén el asalto de los 3 carroñeros hambrientos en los restos flotantes.',
    goalType: 'kill',
    eventKind: 'wreck_field',
    targetCount: 3,
    enemySpawns: ['bandit_grunt', 'bandit_thief', 'bandit_grunt'],
    supplyDrops: [
      { key: 'veg', amount: 2 },
      { key: 'pez', amount: 2 },
      { key: 'mad', amount: 3 },
    ],
    startDialog:
      'Esos supuestos piratas llevan uniformes rotos de puerto civil... El hambre los volvió fieras.',
    decisionPrompt:
      'Los asaltantes están derrotados y tiritan entre restos flotantes mirando las últimas latas y vegetales. ¿Qué decides hacer con la carga?',
    choices: [
      {
        id: 'A',
        label: 'Compartir raciones para que no mueran de hambre',
        emotionalNote: 'Cedes -2 Veg y -2 Pez, pero conservas tu humanidad y el respeto del mar.',
        cost: { veg: 2, pez: 2 },
        reward: { oro: 3, cri: 1 },
        xp: 65,
        fame: 95,
        coraliaRelationDelta: 12,
        crewSpeaker: 'Nerea',
        crewLine:
          'Nos cuesta comida de nuestra propia mesa, pero hoy no nos convertimos en monstruos.',
        newsHeadline: 'Gesto de humanidad en medio de la tormenta de suministros',
        newsBody:
          'En lugar de ejecutar a carroñeros hambrientos, un capitán compartió víveres en plena disputa.',
      },
      {
        id: 'B',
        label: 'Asegurar toda la carga para tu tripulación sin mirar atrás',
        emotionalNote: 'Llenas la despensa (+3 Guiso, +4 Mad, +3 Oro), aunque el mar te tacha de implacable.',
        reward: { gui: 3, mad: 4, oro: 3 },
        xp: 55,
        fame: 30,
        bountyDelta: 150,
        crewSpeaker: 'Morgana',
        crewLine:
          'Mañana comeremos caliente... aunque esta noche nadie mire hacia la estela de atrás.',
        newsHeadline: 'Disputa sangrienta por cargamento de alimentos a la deriva',
        newsBody:
          'Supervivientes desesperados perdieron los restos flotantes ante un buque decidido a no ceder ni una ración.',
      },
    ],
  },
  {
    id: 'canto_casco',
    chapter: 'Capítulo III · Leviatanes y Tensión',
    category: 'Historia / Leviatanes',
    categoryKey: 'historia',
    tier: 3,
    title: 'El Canto Bajo el Casco',
    premise:
      'Un coloso abisal rodea la ruta. No ataca de inmediato; parece estudiar, empujar las corrientes y probar los nervios de quienes van a bordo.',
    emotionalHook:
      'El terror silencioso de sentir que eres insignificante ante algo colosal, mientras la tripulación empieza a quebrarse por el miedo y el cansancio.',
    objectiveText: 'Navega hasta la Guarida Abisal y derrota al coloso que acecha la ruta.',
    goalType: 'kill',
    eventKind: 'leviathan_lair',
    targetCount: 1,
    enemySpawns: ['kraken'],
    startDialog:
      '¡Escuchen ese zumbido bajo las tablas! Un coloso abisal nos estudia desde la negrura...',
    decisionPrompt:
      'La presión del gigante hace crujir cada viga de madera mientras la tripulación tiembla agotada. ¿Cómo cierras este encuentro?',
    choices: [
      {
        id: 'A',
        label: 'Apagar luces, templar los nervios y atender a la tripulación',
        emotionalNote: 'Gastas -18 ST manteniendo la calma, recuperas +30 HP y fortaleces al equipo.',
        staminaDelta: -18,
        hpDelta: 30,
        reward: { cri: 2, agu: 3 },
        xp: 85,
        fame: 80,
        crewSpeaker: 'Pipo',
        crewLine:
          'Cuando apagamos las linternas y escuchamos el casco respirar... entendimos lo pequeños que somos.',
        newsHeadline: 'Sobreviven al terror silencioso de un coloso acechante',
        newsBody:
          'Una tripulación resistió el empuje abisal sin perder la cordura ni dejar caer su nave al agua helada.',
      },
      {
        id: 'B',
        label: 'Descargar toda la pólvora contra la sombra abisal',
        emotionalNote: 'Extraes valioso botín (+2 Titanio, +5 Oro, +1 Cristal) pero el golpe daña -22 Casco.',
        hullDelta: -22,
        reward: { tit: 2, oro: 5, cri: 1 },
        xp: 105,
        fame: 95,
        crewSpeaker: 'Kiko',
        crewLine:
          '¡Le arrancamos escamas de titanio a esa pesadilla, aunque medio casco casi se parte!',
        newsHeadline: 'Descarga brutal contra monstruo abisal deja restos de titanio',
        newsBody:
          'El estruendo resonó leguas enteras cuando un navío desafió directamente al Canto Bajo el Casco.',
      },
    ],
  },
  {
    id: 'deuda_tierra',
    chapter: 'Capítulo IV · Desorden Público y Venganza',
    category: 'Historia / Venganza',
    categoryKey: 'historia',
    tier: 4,
    title: 'Deuda de Tierra Firme',
    premise:
      'Aparece un superviviente con información valiosa sobre rutas seguras o artefactos, pero tiene un pasado ligado a quienes destruyeron el orden o traicionaron a alguien cercano a la tripulación.',
    emotionalHook:
      'Elegir entre la utilidad pragmática para sobrevivir un día más o el peso de lo que significa perdonar o cobrarse una deuda en un mundo sin justicia.',
    objectiveText: 'Neutraliza a los 3 escoltas del traficante en el Bloqueo Pirata.',
    goalType: 'kill',
    eventKind: 'pirate_blockade',
    targetCount: 3,
    enemySpawns: ['bandit_gunner', 'bandit_thief', 'bandit_gunner'],
    startDialog:
      '¡Ese hombre vendió los códigos de un muelle entero cuando colapsó tierra firme! ¡Sus escoltas abren fuego!',
    decisionPrompt:
      'El informante yace acorralado ofreciendo mapas secretos del Viejo Mundo a cambio de su vida, mientras Vega recuerda a los amigos que murieron por su traición.',
    choices: [
      {
        id: 'A',
        label: 'Aceptar sus mapas y artefactos para asegurar otro mañana',
        emotionalNote: 'Pragmatismo puro (+2 Tec, +5 Oro, +1 Cri), pero la culpa queda en cubierta.',
        reward: { tec: 2, oro: 5, cri: 1 },
        xp: 70,
        fame: 40,
        crewSpeaker: 'Beto',
        crewLine:
          'Estas piezas tech salvarán vidas hoy... pero ¿en qué nos convierte perdonar al verdugo?',
        newsHeadline: 'Pacto amargo por rutas seguras del Viejo Mundo',
        newsBody:
          'Rumores portuarios aseguran que un antiguo traidor compró su libertad entregando tecnología perdida.',
      },
      {
        id: 'B',
        label: 'Negar el trato y saldar la deuda moral por los caídos',
        emotionalNote: 'Rechazas su oro sucio, recuperas chatarra justa (+4 Hierro, +110 Fama) y paz moral.',
        reward: { hie: 4, mad: 4, cel_frag: 1 },
        xp: 95,
        fame: 110,
        crewSpeaker: 'Vice-Cap. Vega',
        crewLine:
          'No hay tribunales en las cenizas saladas... pero hoy los que murieron en los muelles descansan.',
        newsHeadline: 'Ajuste de cuentas por la traición de los antiguos puertos',
        newsBody:
          'El Correo confirma que un responsable del colapso costero fue finalmente juzgado en alta mar.',
      },
    ],
  },
];

interface CategoryBlueprint {
  categoryKey: MissionCategory;
  count: number;
  eventKinds: MissionEventKind[];
  goalTypes: MissionGoalType[];
  adjectives: string[];
  nouns: string[];
  locations: string[];
  spawnsByTier: Record<1 | 2 | 3 | 4 | 5, EnemyKind[]>;
  speakers: string[];
}

const BLUEPRINTS: CategoryBlueprint[] = [
  {
    categoryKey: 'historia',
    count: 24,
    eventKinds: ['convoy_buoy', 'wreck_field', 'pirate_blockade', 'leviathan_lair'],
    goalTypes: ['kill', 'explore', 'visit'],
    adjectives: ['Silencioso', 'Último', 'Olvidado', 'Salado', 'Roto', 'Eterno', 'Oscuro', 'Valiente'],
    nouns: ['Faro', 'Testamento', 'Muelle', 'Pabellón', 'Juramento', 'Diario', 'Sendero', 'Eco'],
    locations: ['del Este', 'de la Ceniza', 'del Canal Viejo', 'del Horizonte', 'de Niebla Roja', 'del Estrecho'],
    spawnsByTier: {
      1: ['crab', 'bandit_grunt'],
      2: ['bandit_grunt', 'shark', 'bandit_thief'],
      3: ['bandit_gunner', 'zombie_walker', 'kraken'],
      4: ['bandit_boss', 'hacker_jammer', 'leviathan_baby'],
      5: ['leviathan_adult', 'bandit_boss', 'hacker_corsair'],
    },
    speakers: ['Vice-Cap. Vega', 'Nerea', 'Beto', 'Morgana'],
  },
  {
    categoryKey: 'imperio',
    count: 30,
    eventKinds: ['siege_village', 'convoy_buoy', 'pirate_blockade'],
    goalTypes: ['build', 'age', 'visit'],
    adjectives: ['Férreo', 'Soberano', 'Imperial', 'Real', 'Dorado', 'Blindado', 'Próspero', 'Invicto'],
    nouns: ['Bastión', 'Ciudadela', 'Muro', 'Molino', 'Cuartel', 'Mercado', 'Astillero', 'Estandarte'],
    locations: ['de Costa Libre', 'del Principado', 'del Reino Norte', 'de Hierro', 'del Santuario', 'de Bruma'],
    spawnsByTier: {
      1: ['crab', 'bandit_grunt'],
      2: ['bandit_grunt', 'bandit_thief'],
      3: ['bandit_gunner', 'bandit_grunt', 'bandit_thief'],
      4: ['bandit_boss', 'bandit_gunner', 'hacker_siphoner'],
      5: ['bandit_boss', 'bandit_boss', 'hacker_corsair'],
    },
    speakers: ['Beto', 'Vice-Cap. Vega', 'Kiko'],
  },
  {
    categoryKey: 'caza',
    count: 30,
    eventKinds: ['leviathan_lair', 'wreck_field'],
    goalTypes: ['kill', 'visit'],
    adjectives: ['Abisal', 'Colosal', 'Hambriento', 'Salino', 'Ancestral', 'Tóxico', 'Feroz', 'Titánico'],
    nouns: ['Depredador', 'Tentáculo', 'Leviatán', 'Escualo', 'Kraken', 'Sombra', 'Fauce', 'Colmillo'],
    locations: ['de la Fosa', 'del Arrecife Negro', 'de Aguas Rojas', 'del Abismo Sur', 'del Remolino', 'del Cráter'],
    spawnsByTier: {
      1: ['crab', 'jelly', 'crab'],
      2: ['shark', 'shark', 'crab'],
      3: ['kraken', 'shark', 'leviathan_baby'],
      4: ['leviathan_adult', 'kraken', 'shark'],
      5: ['leviathan_elder', 'leviathan_adult', 'kraken'],
    },
    speakers: ['Kiko', 'Morgana', 'Pipo'],
  },
  {
    categoryKey: 'piratas',
    count: 32,
    eventKinds: ['pirate_blockade', 'siege_village'],
    goalTypes: ['kill', 'clear_camp'],
    adjectives: ['Escarlata', 'Maldito', 'Corsario', 'Implacable', 'Sanguinario', 'Negro', 'Traicionero', 'Astuto'],
    nouns: ['Blasón', 'Abordaje', 'Bloqueo', 'Garfio', 'Cañón', 'Motín', 'Escuadrón', 'Fuerte'],
    locations: ['de la Hermandad', 'de Cala Roja', 'del Ojo Negro', 'de Pólvora', 'del Paso Sur', 'de Barlovento'],
    spawnsByTier: {
      1: ['bandit_grunt', 'bandit_thief'],
      2: ['bandit_grunt', 'bandit_gunner', 'bandit_thief'],
      3: ['bandit_gunner', 'bandit_boss', 'bandit_thief'],
      4: ['bandit_boss', 'bandit_gunner', 'bandit_gunner', 'bandit_thief'],
      5: ['bandit_boss', 'bandit_boss', 'bandit_gunner', 'hacker_corsair'],
    },
    speakers: ['Morgana', 'Vice-Cap. Vega', 'Kiko'],
  },
  {
    categoryKey: 'zombis',
    count: 28,
    eventKinds: ['zombie_nest', 'siege_village'],
    goalTypes: ['kill', 'visit'],
    adjectives: ['Putrefacto', 'Lázaro', 'Infectado', 'Cadavérico', 'Tóxico', 'Podrido', 'Sombrío', 'Cenizo'],
    nouns: ['Brote', 'Nido', 'Osario', 'Marea', 'Cementerio', 'Peste', 'Clamor', 'Enjambre'],
    locations: ['de Bahía Muerta', 'de Cayo Lázaro', 'de la Necrópolis', 'del Pantano', 'de la Fosa', 'de Salina'],
    spawnsByTier: {
      1: ['zombie_walker', 'zombie_walker'],
      2: ['zombie_walker', 'zombie_spitter', 'zombie_walker'],
      3: ['zombie_brute', 'zombie_walker', 'zombie_spitter'],
      4: ['zombie_brute', 'zombie_brute', 'zombie_spitter', 'zombie_walker'],
      5: ['zombie_brute', 'zombie_brute', 'zombie_spitter', 'leviathan_baby'],
    },
    speakers: ['Nerea', 'Beto', 'Vice-Cap. Vega'],
  },
  {
    categoryKey: 'hackers',
    count: 26,
    eventKinds: ['hacker_relay', 'convoy_buoy'],
    goalTypes: ['kill', 'collect'],
    adjectives: ['Cifrado', 'Interferido', 'Eléctrico', 'Fantasma', 'Pirateado', 'Táctico', 'Binario', 'Oculto'],
    nouns: ['Satélite', 'Repetidor', 'Enlace', 'Radar', 'Protocolo', 'Jammer', 'Núcleo', 'Faro'],
    locations: ['del Antiguo Mundo', 'de Frecuencia Cero', 'de Torre Alta', 'del Sector Delta', 'de Onda Muerta', 'del Búnker'],
    spawnsByTier: {
      1: ['hacker_jammer', 'bandit_thief'],
      2: ['hacker_jammer', 'hacker_siphoner'],
      3: ['hacker_siphoner', 'hacker_corsair', 'hacker_jammer'],
      4: ['hacker_corsair', 'hacker_corsair', 'hacker_siphoner'],
      5: ['hacker_corsair', 'hacker_jammer', 'bandit_boss', 'hacker_siphoner'],
    },
    speakers: ['Pipo', 'Beto', 'Vice-Cap. Vega'],
  },
  {
    categoryKey: 'rescate',
    count: 26,
    eventKinds: ['convoy_buoy', 'wreck_field', 'siege_village'],
    goalTypes: ['visit', 'explore', 'kill'],
    adjectives: ['Urgente', 'Limpio', 'Perdido', 'Esperanzado', 'Brumoso', 'Frágil', 'Solidario', 'Vital'],
    nouns: ['Auxilio', 'Balsa', 'Convoy', 'Faro', 'Botiquín', 'Llamado', 'Refugio', 'Rescate'],
    locations: ['de Coralía', 'de Puerto Brisa', 'del Cabo Blanco', 'de Aguas Claras', 'de Costa Sur', 'del Islote'],
    spawnsByTier: {
      1: ['crab', 'jelly'],
      2: ['shark', 'bandit_thief'],
      3: ['bandit_gunner', 'zombie_spitter', 'shark'],
      4: ['zombie_brute', 'bandit_boss', 'hacker_jammer'],
      5: ['leviathan_adult', 'bandit_boss', 'zombie_brute'],
    },
    speakers: ['Nerea', 'Vice-Cap. Vega', 'Pipo'],
  },
  {
    categoryKey: 'comercio',
    count: 24,
    eventKinds: ['wreck_field', 'convoy_buoy', 'pirate_blockade'],
    goalTypes: ['trade', 'collect', 'visit'],
    adjectives: ['Mercante', 'Dorado', 'Libre', 'Próspero', 'Especiero', 'Naval', 'Pactado', 'Escoltado'],
    nouns: ['Caravana', 'Trueque', 'Carga', 'Puerto', 'Contrato', 'Mercancía', 'Tesoro', 'Flete'],
    locations: ['del Sol Dorado', 'de Puerto Coral', 'de la Liga', 'del Muelle Real', 'de la Ruta Este', 'de Caleta'],
    spawnsByTier: {
      1: ['bandit_thief', 'crab'],
      2: ['bandit_grunt', 'bandit_thief'],
      3: ['bandit_gunner', 'hacker_siphoner'],
      4: ['bandit_boss', 'hacker_corsair'],
      5: ['bandit_boss', 'bandit_boss', 'kraken'],
    },
    speakers: ['Kiko', 'Pipo', 'Nerea'],
  },
];

function buildProceduralMissions(): StoryMissionDef[] {
  const list: StoryMissionDef[] = [];
  const tierRoman: Record<1 | 2 | 3 | 4 | 5, string> = {
    1: 'I',
    2: 'II',
    3: 'III',
    4: 'IV',
    5: 'V',
  };

  for (const bp of BLUEPRINTS) {
    const meta = MISSION_CATEGORY_META[bp.categoryKey];
    for (let i = 0; i < bp.count; i++) {
      const tier = (Math.min(5, Math.floor((i / bp.count) * 5) + 1) as 1 | 2 | 3 | 4 | 5);
      const adj = bp.adjectives[i % bp.adjectives.length];
      const noun = bp.nouns[(i * 3 + Math.floor(i / bp.adjectives.length)) % bp.nouns.length];
      const loc = bp.locations[(i * 5 + 1) % bp.locations.length];
      const eventKind = bp.eventKinds[i % bp.eventKinds.length];
      const goalType = bp.goalTypes[i % bp.goalTypes.length];
      const speaker = bp.speakers[i % bp.speakers.length];
      const enemySpawns = bp.spawnsByTier[tier];

      let targetCount = enemySpawns.length;
      let objectiveText = '';
      if (goalType === 'kill') {
        targetCount = Math.max(2, enemySpawns.length + (tier >= 4 ? 1 : 0));
        objectiveText = `Acude al evento marcado y elimina ${targetCount} hostiles en la zona.`;
      } else if (goalType === 'visit') {
        targetCount = 1;
        objectiveText = 'Navega hasta la baliza del evento en el mapa para inspeccionar el sector.';
      } else if (goalType === 'build') {
        targetCount = Math.min(3, 1 + Math.floor(tier / 2));
        objectiveText = `Construye o mejora ${targetCount} edificio(s) en tus islas (estilo Imperio).`;
      } else if (goalType === 'age') {
        targetCount = Math.min(4, 1 + Math.floor((tier + 1) / 2));
        objectiveText = `Alcanza la Edad ${targetCount} en tu Cuartel de Isla y asegura la ruta.`;
      } else if (goalType === 'collect') {
        targetCount = 3 + tier * 2;
        objectiveText = `Recolecta ${targetCount} unidades de botín o recursos clave en altamar e islas.`;
      } else if (goalType === 'explore') {
        targetCount = 1 + Math.floor(tier / 2);
        objectiveText = `Explora ${targetCount} ruina(s), faro(s) o isla(s) nueva(s) en el cuadrante.`;
      } else if (goalType === 'trade') {
        targetCount = 1 + Math.floor(tier / 3);
        objectiveText = `Completa ${targetCount} intercambio(s) o contrato(s) mercante en aldeas o mercados.`;
      } else {
        targetCount = 1;
        objectiveText = 'Despeja el campamento pirata o fortaleza marcada en la zona del evento.';
      }

      const oroR = 2 + tier * 2;
      const madR = 3 + tier * 2;
      const hieR = tier >= 2 ? 2 + tier : 1;
      const xpBase = 45 + tier * 35;
      const fameBase = 40 + tier * 35;
      const rareDrop: Partial<ResourceBag> =
        tier >= 4
          ? {
              oro: oroR,
              tit: 2 + (tier - 3),
              tec: 2,
              nuc_frag: bp.categoryKey === 'caza' || bp.categoryKey === 'hackers' ? 1 : 0,
              cel_frag: bp.categoryKey === 'historia' || bp.categoryKey === 'rescate' ? 1 : 0,
            }
          : tier >= 2
            ? { oro: oroR, hie: hieR, cri: tier === 3 ? 1 : 0 }
            : { oro: oroR, mad: madR, agu: 2 };

      const id = `mis_${bp.categoryKey}_${String(i + 1).padStart(3, '0')}`;
      const numCode = `${bp.categoryKey.slice(0, 3).toUpperCase()}-${i + 1}`;

      list.push({
        id,
        chapter: `Contrato ${tierRoman[tier]} · ${meta.badge} (${numCode})`,
        category: meta.label,
        categoryKey: bp.categoryKey,
        tier,
        title: `${noun} ${adj} ${loc}`,
        premise: `Inteligencia naval detectó actividad crítica (${eventKind.replace('_', ' ')}) en el sector ${loc}. El consejo espera resultados inmediatos.`,
        emotionalHook: `En aguas de nivel ${tier}, cada contrato resuelto define si eres protector de las costas o un señor implacable de la guerra.`,
        objectiveText,
        goalType,
        eventKind,
        targetCount,
        enemySpawns,
        supplyDrops: [
          { key: 'mad', amount: 2 + tier },
          { key: 'oro', amount: 1 + tier },
        ],
        startDialog: `¡Rumbo fijado a "${noun} ${adj} ${loc}"! Mantengan la guardia en cubierta.`,
        decisionPrompt: `Objetivo cumplido en "${noun} ${adj} ${loc}". ¿Cómo cierras la operación ante la tripulación y los isleños?`,
        choices: [
          {
            id: 'A',
            label: 'Repartir parte del botín y reforzar la moral del buque',
            emotionalNote: `Ganas prestigio (+${fameBase + 25} Fama), +15 HP y suministros equilibrados.`,
            hpDelta: 15,
            reward: rareDrop,
            xp: xpBase,
            fame: fameBase + 25,
            crewSpeaker: speaker,
            crewLine: 'Bien ejecutado, Capitán. La tripulación confía más en tu timón.',
            newsHeadline: `Operación exitosa en ${noun} ${adj} ${loc}`,
            newsBody: `El navío completó el contrato ${numCode} fortaleciendo rutas libres en la región.`,
          },
          {
            id: 'B',
            label: 'Exprimir cada recurso valioso de la zona para tu armería',
            emotionalNote: `Mayor carga bélica (+${oroR + 3} Oro, +${madR} Mad, +${hieR} Hie) con enfoque implacable.`,
            reward: {
              oro: oroR + 3,
              mad: madR,
              hie: hieR,
              ...(tier >= 3 ? { tit: 1, tec: 1 } : {}),
            },
            xp: xpBase + 20,
            fame: fameBase,
            bountyDelta: tier * 120000,
            crewSpeaker: speaker,
            crewLine: 'Bodegas llenas hasta el tope. Con este material forjaremos armas temibles.',
            newsHeadline: `Requisa total tras combate en ${noun} ${adj} ${loc}`,
            newsBody: `Un capitán reclamó todo el botín disponible en la operación ${numCode}.`,
          },
        ],
      });
    }
  }

  return list;
}

export const STORY_MISSIONS_CATALOG: StoryMissionDef[] = [
  ...CORE_STORY_MISSIONS,
  ...buildProceduralMissions(),
];

export const STORY_MISSION_MAP: Record<StoryMissionId, StoryMissionDef> = Object.fromEntries(
  STORY_MISSIONS_CATALOG.map((m) => [m.id, m])
);

export function createInitialStoryMissions(): StoryMissionProgress[] {
  return STORY_MISSIONS_CATALOG.map((m) => ({
    id: m.id,
    status: 'available',
    progress: 0,
    target: m.targetCount,
    eventKind: m.eventKind,
  }));
}
