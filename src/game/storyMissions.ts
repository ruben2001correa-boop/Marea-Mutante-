import type {
  EnemyKind,
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
  title: string;
  premise: string;
  emotionalHook: string;
  objectiveText: string;
  targetCount: number;
  enemySpawns: EnemyKind[];
  supplyDrops?: Array<{ key: keyof ResourceBag; amount: number }>;
  startDialog: string;
  decisionPrompt: string;
  choices: [StoryChoiceOutcome, StoryChoiceOutcome];
}

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

export const STORY_MISSIONS_CATALOG: StoryMissionDef[] = [
  {
    id: 'boya_nombres',
    chapter: 'Capítulo I · Rescate y Memoria',
    category: 'Rescate / Exploración',
    title: 'La Boya de los Nombres',
    premise:
      'Una señal de auxilio antigua sigue repitiéndose en una zona acechada por criaturas mutantes. Al llegar, no hay héroes que salvar, sino los restos de un convoy civil y el registro de quienes intentaron cruzar cuando el orden colapsó.',
    emotionalHook:
      'Decidir si arriesgar el casco y la tripulación por recuperar recuerdos y suministros de gente muerta, o dejarlos atrás para que los vivos no mueran hoy.',
    objectiveText: 'Despeja a las 3 criaturas mutantes que acechan la boya del convoy civil.',
    targetCount: 3,
    enemySpawns: ['crab', 'shark', 'crab'],
    supplyDrops: [
      { key: 'mad', amount: 3 },
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
    category: 'Suministros / Moral',
    title: 'Pan en Medio de la Tormenta',
    premise:
      'Una Corriente de Suministros arrastra víveres escasos, pero una facción pirata desesperada —liderada por antiguos civiles que enloquecieron de hambre— intenta tomarlos.',
    emotionalHook:
      'Enfrentarte a gente que no es malvada por naturaleza, sino consumida por la miseria del colapso.',
    objectiveText: 'Detén el asalto de los 3 carroñeros hambrientos sobre las cajas de víveres.',
    targetCount: 3,
    enemySpawns: ['bandit_grunt', 'bandit_thief', 'bandit_grunt'],
    supplyDrops: [
      { key: 'veg', amount: 2 },
      { key: 'pez', amount: 2 },
      { key: 'mad', amount: 2 },
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
        reward: { oro: 2 },
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
    category: 'Leviatanes / Tensión',
    title: 'El Canto Bajo el Casco',
    premise:
      'Un leviatán rodea la ruta. No ataca de inmediato; parece estudiar, empujar las corrientes y probar los nervios de quienes van a bordo.',
    emotionalHook:
      'El terror silencioso de sentir que eres insignificante ante algo colosal, mientras la tripulación empieza a quebrarse por el miedo y el cansancio.',
    objectiveText: 'Sobrevive al acecho y derrota al coloso abisal que rodea el casco.',
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
        reward: { cri: 1, agu: 3 },
        xp: 85,
        fame: 80,
        crewSpeaker: 'Pipo',
        crewLine:
          'Cuando apagamos las linternas y escuchamos el casco respirar... entendimos lo pequeños que somos.',
        newsHeadline: 'Sobreviven al terror silencioso de un Leviatán acechante',
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
    category: 'Desorden Público / Venganza',
    title: 'Deuda de Tierra Firme',
    premise:
      'Aparece un superviviente con información valiosa sobre rutas seguras o artefactos, pero tiene un pasado ligado a quienes destruyeron el orden o traicionaron a alguien cercano a la tripulación.',
    emotionalHook:
      'Elegir entre la utilidad pragmática para sobrevivir un día más o el peso de lo que significa perdonar o cobrarse una deuda en un mundo sin justicia.',
    objectiveText: 'Neutraliza a los 3 escoltas del traficante para interrogarlo cara a cara.',
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
        reward: { hie: 4, mad: 4 },
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

export const STORY_MISSION_MAP: Record<StoryMissionId, StoryMissionDef> = Object.fromEntries(
  STORY_MISSIONS_CATALOG.map((m) => [m.id, m])
) as Record<StoryMissionId, StoryMissionDef>;

export function createInitialStoryMissions(): StoryMissionProgress[] {
  return STORY_MISSIONS_CATALOG.map((m) => ({
    id: m.id,
    status: 'available',
    progress: 0,
    target: m.targetCount,
  }));
}
