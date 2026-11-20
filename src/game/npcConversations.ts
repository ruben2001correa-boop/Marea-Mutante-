import { SURVIVORS_CATALOG } from './destinyTree';
import { MOOD_META, createInitialVitals, shiftPlayerMood } from './needsAndPsychology';
import type {
  EmotionalMood,
  NpcAnimState,
  NpcAttitudeMood,
  NpcHistoryEntry,
  NpcMoodState,
  PersistentState,
  WeatherType,
  WorldNpcEntity,
} from './types';

export interface PausedDialogueLine {
  id: string;
  speaker: string;
  role?: string;
  mood?: NpcAttitudeMood;
  color: string;
  text: string;
}

export interface NpcDialogueChoice {
  id: string;
  toneLabel: string;
  toneKind: 'empatica' | 'pragmatica' | 'humor' | 'soberbia';
  playerText: string;
  npcReply: string;
  npcNextMood: NpcAttitudeMood;
  affinityDelta: number;
  mentalDelta: number;
  playerNextMood?: EmotionalMood;
  outcomeNote: string;
}

export interface NpcTranscriptEntry {
  speaker: 'npc' | 'player' | 'sistema';
  name: string;
  text: string;
  moodBadge?: string;
  viaAi?: boolean;
}

export interface NpcConversationSession {
  npcId: string;
  npcName: string;
  npcRole: string;
  npcColor: string;
  turn: number;
  stage: 'choosing' | 'reading_reply' | 'finished';
  currentPrompt: string;
  latestReply: string;
  latestOutcomeNote: string;
  choices: NpcDialogueChoice[];
  transcript: NpcTranscriptEntry[];
  finalRewardSummary?: string;
  usedTopicIds: string[];
  milestoneClaimed: boolean;
  aiMode: boolean;
  aiLoading: boolean;
  aiError?: string | null;
  npcAnimState?: NpcAnimState;
  npcActivityLabel?: string;
}

export interface WorldDialogueContext {
  dayCount: number;
  weather: WeatherType;
  dangerousWater: boolean;
  nearLeviathan: boolean;
  missionTitle?: string;
  islandsVisited: number;
  npcAnimState?: NpcAnimState;
  npcActivityLabel?: string;
  npcLiveStatesSummary?: Array<{
    name: string;
    animState: NpcAnimState;
    mood: NpcAttitudeMood;
    activityLabel: string;
  }>;
}

interface TopicTemplate {
  id: string;
  npcLines: Record<NpcAttitudeMood, string[]>;
  buildChoices: (npcName: string, npcMood: NpcAttitudeMood, state: PersistentState) => NpcDialogueChoice[];
}

export function createInitialNpcMoods(): Record<string, NpcMoodState> {
  return {
    vega: {
      mood: 'equilibrio',
      affinity: 25,
      reason: 'Mantiene la disciplina en cubierta pese al colapso.',
      chatsCompleted: 0,
    },
    kiko: {
      mood: 'cansancio',
      affinity: 15,
      reason: 'Lleva horas calibrando calderas y cañones.',
      chatsCompleted: 0,
    },
    nerea: {
      mood: 'orgullo',
      affinity: 18,
      reason: 'Atenta a cada arpón y cardumen en el horizonte.',
      chatsCompleted: 0,
    },
    beto: {
      mood: 'felicidad',
      affinity: 22,
      reason: 'Cocinar algo caliente siempre le devuelve el alma.',
      chatsCompleted: 0,
    },
    pipo: {
      mood: 'tristeza',
      affinity: 14,
      reason: 'Extraña las rutas antiguas que desaparecieron bajo la marea.',
      chatsCompleted: 0,
    },
    morgana: {
      mood: 'soberbia',
      affinity: 10,
      reason: 'Cree que pocos entienden la ciencia verdadera de las reliquias.',
      chatsCompleted: 0,
    },
    aldeano: {
      mood: 'equilibrio',
      affinity: 10,
      reason: 'Sobreviviendo día a día entre el salitre y el comercio.',
      chatsCompleted: 0,
    },
  };
}

export function getNpcMoodState(state: PersistentState, npcId: string): NpcMoodState {
  if (!state.npcMoods) {
    state.npcMoods = createInitialNpcMoods();
  }
  if (!state.npcMoods[npcId]) {
    state.npcMoods[npcId] = {
      mood: 'equilibrio',
      affinity: 10,
      reason: 'Observando el estado de la travesía.',
      chatsCompleted: 0,
    };
  }
  return state.npcMoods[npcId];
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function sanitizeMood(raw: unknown): NpcAttitudeMood {
  const valid: NpcAttitudeMood[] = [
    'equilibrio',
    'felicidad',
    'tristeza',
    'enojo',
    'orgullo',
    'soberbia',
    'cansancio',
    'lokito',
  ];
  return valid.includes(raw as NpcAttitudeMood) ? (raw as NpcAttitudeMood) : 'equilibrio';
}

function sanitizeToneKind(raw: unknown): 'empatica' | 'pragmatica' | 'humor' | 'soberbia' {
  const s = String(raw || '').toLowerCase();
  if (s.includes('empat')) return 'empatica';
  if (s.includes('humor') || s.includes('aliento') || s.includes('broma')) return 'humor';
  if (s.includes('soberb') || s.includes('dura')) return 'soberbia';
  return 'pragmatica';
}

const CHARACTER_SIGNATURE_LINES: Record<string, string[]> = {
  vega: [
    'En la Academia Naval nos enseñaron a leer estrellas; hoy solo quedan cenizas y boyas oxidadas.',
    'Mientras quede una tabla firme bajo nuestros pies, no dejaré que el mar nos borre del mapa.',
    'Capitán, revisé las bitácoras de la flota perdida... demasiados nombres, demasiado silencio.',
    'La gente olvida que los piratas también fueron vecinos nuestros antes de que el hambre los rompiera.',
    'A veces me tiembla el pulso al mirar las aguas negras, pero si yo flaqueo, toda la cubierta cae.',
    'Si logramos fundar un puerto seguro en una isla firme, dormiré tranquila por primera vez en años.',
  ],
  kiko: [
    'Esta caldera protesta como una mula vieja, ¡pero mientras tenga carbón y chatarra la hago rugir!',
    'Le ajusté tres milímetros al cañón de babor; ahora parte mástiles piratas como palillos.',
    'A veces sueño con talleres limpios sin salitre comiéndose cada tornillo en dos días.',
    'Si encuentras tecnología del Viejo Mundo en esas ruinas, tráemela antes de que se oxide más.',
    'Dicen que un búnker nuclear bien armado puede herir incluso a un leviatán... ¡quiero ver eso!',
  ],
  nerea: [
    'El olor del mar cambió tras el hundimiento, pero todavía reconozco dónde se esconde un buen banco de peces.',
    'Llevo mi arpón amarrado a la muñeca; en el agua mutante un descuido cuesta la vida entera.',
    'Vi nadar a un leviatán bajo nosotros hace semanas... su sombra tapó el sol durante un minuto completo.',
    'Pescamos para vivir hoy, pero ojalá algún día pesquemos solo por placer como antes.',
    'Si notas aletas cortando la espuma cerca del casco, avísame antes de que muerdan.',
  ],
  beto: [
    'Un buen guiso caliente puede salvar más corazones que diez escudos de acero, Capitán.',
    'Guardo especias secas del puerto antiguo solo para cuando tengamos motivos reales de celebrar.',
    'Cuando alguien llega llorando o temblando de frío, un plato humeante le recuerda que sigue siendo humano.',
    'Cultivar tomates y maíz marino en la cubierta fue la mejor idea que tuvimos en meses.',
    'A veces me duele ver raciones tan justas, pero mientras yo cocine nadie pasará hambre en silencio.',
  ],
  pipo: [
    'Antes del colapso cartografiaba bahías turísticas; ahora dibujo zonas tóxicas y guaridas piratas.',
    'Mis mapas viejos ya no sirven: las corrientes hundieron ciudades enteras en una sola noche.',
    'Si nos perdemos en la niebla, sigue la brújula y el color del agua... el abismo siempre avisa.',
    'Me gustaría volver a ver a mi hermana en algún archipiélago del sur, si es que sigue en pie.',
    'Cada isla que exploramos merece un nombre nuevo y una esperanza distinta.',
  ],
  morgana: [
    'Estas reliquias vibran con una física que la vieja humanidad apenas comprendía antes de ahogarse.',
    'No subestimes el cristal abisal; dentro late energía capaz de encender un reino entero.',
    'La mayoría ve chatarra flotante; yo veo piezas de la próxima era de la civilización.',
    'Ten cuidado con la soberbia al manipular núcleos nucleares: el océano no perdona errores tontos.',
    'Si mantienes la mente despejada, te enseñaré a combinar reliquias de rango alto.',
  ],
  aldeano: [
    'Aquí en el muelle intercambiamos hasta clavos doblados; cada día sin saqueo pirata es un milagro.',
    'Oímos rumores de un capitán que levanta pueblos y enfrenta a los señores de la chatarra. ¿Eres tú?',
    'A veces las campanas de alarma suenan de noche porque alguien vio brillar ojos gigantes bajo el agua.',
    'Por favor, si comercias con nosotros de forma justa, correremos la voz por todas las islas libres.',
    'Muchos niños aquí nunca han visto una ciudad sin muros ni vigías armados.',
  ],
  armero: [
    'Un filo común se rompe contra el caparazón de un Leviatán; solo la forja con fragmentos resiste.',
    'Trae acero, oro y fragmentos épicos o legendarios: mi yunque convertirá chatarra en gloria.',
  ],
  forjador: [
    'El fuego astral consume a los impacientes. Con fragmentos divinos forjaremos armas eternas.',
    'Si te sobran fragmentos épicos o legendarios, puedo transmutarlos en una esencia superior.',
  ],
  mercader: [
    'Agua limpia, madera seca y comida caliente valen más que diez coronas en el océano mutante.',
    'Compro lo que te sobre y te abastezco para cruzar hasta la Zona de Calamidad.',
  ],
  alquimista: [
    'Un sorbo de elixir correcto limpia hasta la radiación abisal y calma la mente fracturada.',
    'Guarda siempre cristal y agua pura: son la base de toda alquimia marítima.',
  ],
  cartografo: [
    'Ningún capitán sobrevive sin saber dónde hay un yunque seguro o una guarida de bestias.',
    'Tengo cartas actualizadas de forjadores, armeros y leviatanes por unas pocas monedas.',
  ],
  chatarrero: [
    'Entre restos del Viejo Mundo aún laten circuitos intactos para radios y reactores.',
    'El titanio y las piezas tecnológicas son el corazón del buque de guerra moderno.',
  ],
};

const TOPIC_TEMPLATES: TopicTemplate[] = [
  {
    id: 'pasado_puerto',
    npcLines: {
      equilibrio: [
        'A veces miro las olas y me pregunto cuántos muelles siguen enteros allá afuera. ¿Tú en qué piensas cuando calla el viento?',
        'Llevamos días siguiendo estas corrientes saladas. ¿Crees que todavía queda algún lugar que podamos llamar hogar?',
      ],
      felicidad: [
        'Hoy el cielo dejó pasar un rayo limpio de sol. Hacía semanas que no respiraba sin nudos en el pecho, Capitán.',
        'Me alegra compartir cubierta contigo. En un mar tan roto, encontrar buena compañía vale más que un cofre de titanio.',
      ],
      tristeza: [
        'Soñé otra vez con las sirenas de evacuación en tierra firme... No pude salvar a todos los que me pedían la mano.',
        'Cada tabla que cruje me recuerda a alguien que no volvió del último viaje. ¿Cómo cargas tú con tanta pérdida?',
      ],
      enojo: [
        '¡Estoy harto de limpiar salitre y esquivar carroñeros que nos matarían por media lata! ¿Cuándo vamos a golpear primero?',
        'No me pidas calma hoy, Capitán. Si otro pirata o monstruo roza este casco, voy a arrancarle los dientes.',
      ],
      orgullo: [
        'Nuestra estela empieza a respetarse en este océano. Nadie creía que aguantaríamos tanto con vida.',
        'Me enorgullece navegar bajo este estandarte. Hemos demostrado agallas donde otros capitanes se hundieron.',
      ],
      soberbia: [
        'Seamos francos: la mitad de los marineros de este océano no durarían un minuto sin mi talento a bordo.',
        'Cualquiera puede sostener un remo, pero pocos poseen la grandeza para sobrevivir aquí. Espero que estés a la altura.',
      ],
      lokito: [
        '¿Tú también escuchas el zumbido bajo las tablas, Capitán? ¡Juro que las corrientes nos cantan secretos!',
        '¡Jaja! Ayer conté siete lunas en el agua turbia... O tal vez solo eran reflejos de los faroles, ¿verdad?',
      ],
      cansancio: [
        'Los párpados me pesan como anclas oxidadas... Llevo demasiadas guardias mirando la bruma sin dormir bien.',
        'Me duelen hasta los nudillos, Capitán. Un minuto más remando sin agua y me desplomo sobre los barriles.',
      ],
    },
    buildChoices: (npcName, npcMood) => [
      {
        id: 'empatica',
        toneLabel: 'Empatía',
        toneKind: 'empatica',
        playerText:
          npcMood === 'enojo'
            ? 'Entiendo tu rabia, pero nos necesitamos enteros. Respira conmigo un segundo y descarga esa carga.'
            : npcMood === 'cansancio'
              ? 'Descansa un poco, yo cubro tu guardia. Nadie puede sostener el mar solo sin quebrarse.'
              : 'Lo que perdimos duele, pero mientras sigamos vivos honramos su memoria cuidándonos entre nosotros.',
        npcReply:
          npcMood === 'soberbia'
            ? `${npcName} baja un poco la guardia: «Mmm... quizá fui demasiado duro. Se agradece que no me des la espalda.»`
            : `${npcName} exhala hondo con alivio: «Tienes razón, Capitán. Hablarlo contigo me quitó un peso de encima.»`,
        npcNextMood: npcMood === 'tristeza' || npcMood === 'cansancio' ? 'equilibrio' : 'felicidad',
        affinityDelta: 12,
        mentalDelta: 10,
        playerNextMood: 'felicidad',
        outcomeNote: '+10 Salud Mental · Vínculo fortalecido',
      },
      {
        id: 'pragmatica',
        toneLabel: 'Pragmática',
        toneKind: 'pragmatica',
        playerText:
          'Cada tabla y cada ración cuentan. Mantengamos la mente fría y las armas listas para el próximo cruce.',
        npcReply:
          npcMood === 'tristeza'
            ? `${npcName} asiente serio: «Frío como el acero... supongo que es la única forma de seguir a flote hoy.»`
            : `${npcName} cuadra los hombros: «Entendido. Disciplina y rumbo fijo, como debe ser en cubierta.»`,
        npcNextMood: 'equilibrio',
        affinityDelta: 5,
        mentalDelta: 4,
        playerNextMood: 'equilibrio',
        outcomeNote: '+4 Salud Mental · Rumbo estable',
      },
      {
        id: 'humor',
        toneLabel: 'Aliento / Humor',
        toneKind: 'humor',
        playerText:
          'Si sobrevivimos a agua mutante, piratas locos y leviatanes, ¡el fin del mundo ya nos debe una fiesta!',
        npcReply:
          npcMood === 'enojo'
            ? `${npcName} suelta una carcajada seca: «¡Ja! Está bien, tienes un humor endiablado... me hiciste reír a la fuerza.»`
            : `${npcName} sonríe con brillo en los ojos: «¡Eso es verdad! Cuando fundemos un puerto seguro, tú pagas el guiso doble.»`,
        npcNextMood: 'felicidad',
        affinityDelta: 10,
        mentalDelta: 12,
        playerNextMood: 'felicidad',
        outcomeNote: '+12 Salud Mental · Moral alegre',
      },
      {
        id: 'soberbia',
        toneLabel: 'Dura / Soberbia',
        toneKind: 'soberbia',
        playerText:
          'Guárdate las quejas para los débiles. Aquí mando yo y sobrevivimos únicamente por mi genio.',
        npcReply:
          npcMood === 'soberbia'
            ? `${npcName} te mira desafiante: «¿Tu genio? ¡Ja! Ten cuidado con esa arrogancia o la marea te enseñará humildad.»`
            : `${npcName} frunce el ceño molesto: «Si piensas tratarnos como peones desechables, Capitán, la lealtad no durará mucho.»`,
        npcNextMood: 'enojo',
        affinityDelta: -15,
        mentalDelta: -6,
        playerNextMood: 'soberbia',
        outcomeNote: '-6 Salud Mental · NPC molesto (Soberbia)',
      },
    ],
  },
  {
    id: 'raciones_y_descanso',
    npcLines: {
      equilibrio: [
        'Revisé las reservas de agua y raciones. Si racionamos bien hoy, nos alcanzará para cruzar las aguas bravas.',
        'El agua potable es nuestro verdadero oro, Capitán. ¿Cómo sientes el cuerpo tras tantas horas al sol salado?',
      ],
      felicidad: [
        '¡Huele a guiso caliente y madera seca! Hoy hasta los cangrejos mutantes parecen menos feos.',
        'Cuando todos comemos y dormimos bien, el navío se siente casi invencible.',
      ],
      tristeza: [
        'Mirar una ración pequeña me hace pensar en las familias que se quedaron sin nada en los muelles en llamas...',
        'Siento que por más que pesquemos, el hambre siempre vuelve a mordernos los talones.',
      ],
      enojo: [
        '¡Trabajar con el estómago vacío y los ojos ardiendo de sueño me pone de los nervios!',
        '¡Si alguien desperdicia una sola gota de agua dulce hoy, lo tiro por la borda de cabeza!',
      ],
      orgullo: [
        'Hemos levantado suministro donde otros solo ven chatarra. Nuestra supervivencia es obra de carácter.',
        'Mira este almacén: pocos sobrevivientes pueden presumir de mantener a su gente en pie así.',
      ],
      soberbia: [
        'Yo apenas necesito dormir o beber como los novatos; mi resistencia está muy por encima de la media.',
        '¿Tan cansado estás? Qué débil resulta la tripulación cuando no tiene mi temple.',
      ],
      lokito: [
        '¿Crees que si bebemos agua de lluvia al revés escucharemos música del Viejo Mundo? ¡Yo creo que sí!',
        'No sé si tengo sed o si el mar me está bebiendo a mí... ¡Jaja, todo da vueltas en la proa!',
      ],
      cansancio: [
        'Mis brazos tiemblan solo de levantar el cubo... Necesitamos un refugio o un buen descanso pronto.',
        'Si no pegamos ojo aunque sea unas horas, vamos a cometer un error fatal en la tormenta.',
      ],
    },
    buildChoices: (npcName, npcMood, state) => {
      const hasNeeds =
        state.vitals.thirst <= 45 || state.vitals.hunger <= 45 || state.vitals.sleepiness <= 45;
      return [
        {
          id: 'cuidar',
          toneLabel: 'Cuidado Mutuo',
          toneKind: 'empatica',
          playerText: hasNeeds
            ? 'Tienes razón: yo mismo estoy sediento y agotado. Vamos a cuidar agua, comida y descanso juntos.'
            : 'Primero aseguremos que tú y la tripulación estén hidratados y descansados. Sin equipo no hay barco.',
          npcReply: `${npcName} asiente agradecido: «Ese es el capitán al que seguiría hasta el fin del abismo. Cuenta conmigo.»`,
          npcNextMood: 'felicidad',
          affinityDelta: 11,
          mentalDelta: 9,
          playerNextMood: 'equilibrio',
          outcomeNote: '+9 Salud Mental · Confianza mutua',
        },
        {
          id: 'tactica',
          toneLabel: 'Plan de Suministros',
          toneKind: 'pragmatica',
          playerText:
            'Pondremos el destilador a tope, sembraremos en cubierta y buscaremos islas ricas en recursos.',
          npcReply: `${npcName} anota mentalmente: «Plan sólido. Si producimos en cubierta, no dependeremos de la suerte.»`,
          npcNextMood: npcMood === 'cansancio' ? 'equilibrio' : 'orgullo',
          affinityDelta: 7,
          mentalDelta: 5,
          outcomeNote: '+5 Salud Mental · Moral táctica',
        },
        {
          id: 'broma_comida',
          toneLabel: 'Broma de Taberna',
          toneKind: 'humor',
          playerText:
            '¡Cuando todo esto mejore te prometo un banquete sin algas ni pescado mutante por una semana entera!',
          npcReply: `${npcName} se ríe con ganas: «¡Trato hecho! Te cobraré esa promesa en cuanto toquemos puerto firme.»`,
          npcNextMood: 'felicidad',
          affinityDelta: 9,
          mentalDelta: 11,
          playerNextMood: 'felicidad',
          outcomeNote: '+11 Salud Mental · Ánimo elevado',
        },
        {
          id: 'exigir',
          toneLabel: 'Soberbia / Exigencia',
          toneKind: 'soberbia',
          playerText:
            'El hambre y el sueño son excusas. Quien no rinda al cien por ciento sobra en mi cubierta.',
          npcReply: `${npcName} aprieta los dientes: «¡Qué frialdad la tuya! Somos humanos, no motores oxidados.»`,
          npcNextMood: 'enojo',
          affinityDelta: -14,
          mentalDelta: -7,
          playerNextMood: 'enojo',
          outcomeNote: '-7 Salud Mental · Tensión en cubierta',
        },
      ];
    },
  },
  {
    id: 'leviatan_y_destino',
    npcLines: {
      equilibrio: [
        'Los leviatanes son grandes como islas enteras... Solo un búnker o buque nuclear podría herir a uno. ¿Te atreverías?',
        'Entre piratas, reinos e islas peligrosas, cada decisión nos cambia por dentro. ¿Cuál es nuestro límite?',
      ],
      felicidad: [
        'Incluso con monstruos del tamaño de montañas en el abismo, siento que contigo al timón encontraremos salida.',
        'Es curioso: en medio de tanta ruina, seguimos siendo personas capaces de reír y construir pueblos.',
      ],
      tristeza: [
        'A veces siento que somos hormigas flotando sobre astillas frente a bestias imposibles...',
        'Me aterra que un día un leviatán emerja bajo nuestra isla y se trague todo lo que levantamos.',
      ],
      enojo: [
        '¡Un día construiremos un arsenal nuclear y haremos que esas bestias y los reyes piratas paguen cada susto!',
        '¡Estoy cansado de sentir miedo! Quiero acero, cañones y venganza contra quienes destruyeron todo.',
      ],
      orgullo: [
        'Muchos huyen solo de oír el canto de un leviatán; nosotros seguimos trazando rutas y fundando territorios.',
        'Con nuestro equipo y nuestras armas, este océano acabará recordando nuestros nombres.',
      ],
      soberbia: [
        'Hasta los leviatanes deberían apartarse de nuestra ruta. ¡Yo nací para dominar estas aguas, no para temerlas!',
        'El miedo es para náufragos mediocres. Nosotros estamos destinados a imperios.',
      ],
      lokito: [
        '¡Escucha! Si construimos una ciudad encima de un leviatán dormido nadie podrá cobrarnos impuestos... ¡jaja!',
        'Mi cabeza zumba... veo piratas con cara de cangrejo bailando sobre el mástil.',
      ],
      cansancio: [
        'Solo pensar en otro combate contra piratas o bestias gigantes ya me deja sin aliento...',
        'No sé cuánto más aguante mi espalda si seguimos metiéndonos en aguas tan peligrosas.',
      ],
    },
    buildChoices: (npcName, npcMood) => [
      {
        id: 'humilde',
        toneLabel: 'Sabiduría / Humildad',
        toneKind: 'empatica',
        playerText:
          'Sentir miedo ante lo colosal nos mantiene vivos. Construiremos pueblos y defensas con cabeza, paso a paso.',
        npcReply: `${npcName} te mira con respeto: «Palabras sabias. La valentía no es ser ciego al peligro, sino seguir juntos.»`,
        npcNextMood: 'equilibrio',
        affinityDelta: 11,
        mentalDelta: 10,
        playerNextMood: 'equilibrio',
        outcomeNote: '+10 Salud Mental · Serenidad estratégica',
      },
      {
        id: 'ambicion',
        toneLabel: 'Orgullo Heroico',
        toneKind: 'pragmatica',
        playerText:
          'Alzaremos un reino en las islas y forjaremos tecnología nuclear para proteger a los inocentes del abismo.',
        npcReply:
          npcMood === 'tristeza'
            ? `${npcName} recupera chispa en la mirada: «Si levantamos un refugio digno, al fin valdrá la pena luchar.»`
            : `${npcName} golpea la barandilla con entusiasmo: «¡Ese es el espíritu que hace historia en estas cenizas!»`,
        npcNextMood: 'orgullo',
        affinityDelta: 9,
        mentalDelta: 6,
        playerNextMood: 'orgullo',
        outcomeNote: '+6 Salud Mental · Orgullo de equipo',
      },
      {
        id: 'chiste',
        toneLabel: 'Optimismo',
        toneKind: 'humor',
        playerText:
          '¡Tranquilo! Mientras nadie intente pescar un leviatán con caña de madera, tenemos el día controlado.',
        npcReply: `${npcName} suelta una risa sincera: «¡Prometo no lanzar el arpón a ninguna isla que respire!»`,
        npcNextMood: 'felicidad',
        affinityDelta: 10,
        mentalDelta: 12,
        playerNextMood: 'felicidad',
        outcomeNote: '+12 Salud Mental · Humor contagioso',
      },
      {
        id: 'arrogante',
        toneLabel: 'Soberbia Pura',
        toneKind: 'soberbia',
        playerText:
          '¡Nadie en este océano está a mi nivel! Con o sin ayuda, doblegaré islas, piratas y monstruos por igual.',
        npcReply: `${npcName} niega con la cabeza decepcionado: «Cuidado, Capitán. La soberbia hunde más barcos que las tormentas.»`,
        npcNextMood: npcMood === 'soberbia' ? 'enojo' : 'tristeza',
        affinityDelta: -15,
        mentalDelta: -8,
        playerNextMood: 'soberbia',
        outcomeNote: '-8 Salud Mental · Desaprobación',
      },
    ],
  },
  {
    id: 'piratas_y_moral',
    npcLines: {
      equilibrio: [
        'Muchos de esos piratas que nos atacan fueron panaderos, pescadores o padres antes de que el mar envenenara las cosechas.',
        '¿Crees que terminaremos pareciéndonos a los saqueadores si la necesidad aprieta más?',
      ],
      felicidad: [
        'Hoy pudimos ayudar sin robar a nadie. Dormir con la conciencia limpia en este mar es un lujo hermoso.',
      ],
      tristeza: [
        'Cuando abatimos un bote pirata y encuentro dibujos de niños entre su chatarra... se me encoge el alma.',
      ],
      enojo: [
        '¡Me da igual qué fueron antes! Si apuntan un fusil contra nuestra gente, no merecen piedad.',
      ],
      orgullo: [
        'Demostramos que se puede tener fuerza sin convertirse en carroñero sin honor.',
      ],
      soberbia: [
        'Ellos son basura del océano; nosotros somos la nueva aristocracia de las olas.',
      ],
      lokito: [
        '¿Y si todos somos piratas en la historia de otro barco, Capitán? ¡Qué risa tan rara!',
      ],
      cansancio: [
        'Tanta sangre por cuatro tablas y un puñado de chatarra agota hasta el alma.',
      ],
    },
    buildChoices: (npcName) => [
      {
        id: 'humanidad',
        toneLabel: 'Compasión Real',
        toneKind: 'empatica',
        playerText:
          'Nos defenderemos siempre, pero jamás disfrutaremos el dolor ajeno. Sobrevivir no nos quitará la humanidad.',
        npcReply: `${npcName} baja la mirada con respeto: «Gracias por recordármelo cuando las cosas se ponen oscuras.»`,
        npcNextMood: 'equilibrio',
        affinityDelta: 12,
        mentalDelta: 11,
        playerNextMood: 'felicidad',
        outcomeNote: '+11 Salud Mental · Conciencia en paz',
      },
      {
        id: 'realismo',
        toneLabel: 'Realismo Naval',
        toneKind: 'pragmatica',
        playerText:
          'Quien venga en paz tendrá comercio; quien dispare recibirá acero. Reglas simples para un mundo roto.',
        npcReply: `${npcName} asiente con firmeza: «Justo y claro. Así sabe la tripulación dónde está parada.»`,
        npcNextMood: 'orgullo',
        affinityDelta: 7,
        mentalDelta: 5,
        outcomeNote: '+5 Salud Mental · Código claro',
      },
      {
        id: 'ironia',
        toneLabel: 'Ironía',
        toneKind: 'humor',
        playerText:
          'Al menos nuestros enemigos reciclan chatarra con entusiasmo... aunque preferiría que la enviaran por correo.',
        npcReply: `${npcName} suelta un resoplido divertido: «¡Sí, sus entregas a cañonazos son algo bruscas!»`,
        npcNextMood: 'felicidad',
        affinityDelta: 8,
        mentalDelta: 9,
        playerNextMood: 'felicidad',
        outcomeNote: '+9 Salud Mental · Tensión aliviada',
      },
      {
        id: 'crueldad',
        toneLabel: 'Soberbia / Desprecio',
        toneKind: 'soberbia',
        playerText:
          'Los débiles solo existen para alimentar al fuerte. Yo tomaré lo que quiera cuando quiera.',
        npcReply: `${npcName} da un paso atrás inquieto: «Hablas igual que los señores piratas que juramos combatir...»`,
        npcNextMood: 'tristeza',
        affinityDelta: -14,
        mentalDelta: -8,
        playerNextMood: 'soberbia',
        outcomeNote: '-8 Salud Mental · Desconfianza moral',
      },
    ],
  },
  {
    id: 'tormenta_y_casco',
    npcLines: {
      equilibrio: [
        'Cada ola fuerte hace cantar las juntas del casco. Escuchar la madera te dice antes que nadie si aguantará la noche.',
        'La bruma de esta zona tiene un sabor metálico extraño... mantén la lámpara encendida.',
      ],
      felicidad: [
        'El viento fresco en la cara hoy hasta recuerda los días de regata antes del colapso.',
      ],
      tristeza: [
        'Cuando llueve ceniza salada sobre el agua, parece que el cielo mismo estuviera llorando por las ciudades hundidas.',
      ],
      enojo: [
        '¡Maldita tormenta! Nos arranca los clavos del casco y encima atrae a las malditas medusas eléctricas.',
      ],
      orgullo: [
        'Este navío ha soportado golpes que habrían partido cualquier balsa improvisada. Qué gran trabajo hemos hecho.',
      ],
      soberbia: [
        '¡Que caigan rayos si quieren! Ninguna tormenta se atrevería a tragarse una nave dirigida por alguien como yo.',
      ],
      lokito: [
        'Las gotas de lluvia dicen códigos en morse sobre mi sombrero... ¡escucha, escucha!',
      ],
      cansancio: [
        'Achicar agua toda la madrugada me dejó los hombros molidos...',
      ],
    },
    buildChoices: (npcName) => [
      {
        id: 'apoyo',
        toneLabel: 'Cuidar el Casco',
        toneKind: 'empatica',
        playerText:
          'Revisaremos cada tabla juntos antes de que oscurezca. Tu oído en cubierta vale oro para todos nosotros.',
        npcReply: `${npcName} sonríe con gratitud: «Con alguien que escucha así a la nave, ninguna ola nos sorprende.»`,
        npcNextMood: 'felicidad',
        affinityDelta: 11,
        mentalDelta: 9,
        playerNextMood: 'equilibrio',
        outcomeNote: '+9 Salud Mental · Moral marinera',
      },
      {
        id: 'ingenieria',
        toneLabel: 'Refuerzo Técnico',
        toneKind: 'pragmatica',
        playerText:
          'Reforzaremos mamparos con hierro y titanio en la próxima escala. La ingeniería vence al clima.',
        npcReply: `${npcName} coincide: «Eso nos dará margen incluso en mares de rango S.»`,
        npcNextMood: 'equilibrio',
        affinityDelta: 6,
        mentalDelta: 5,
        outcomeNote: '+5 Salud Mental · Seguridad naval',
      },
      {
        id: 'broma_clima',
        toneLabel: 'Desafío Alegre',
        toneKind: 'humor',
        playerText:
          '¡Mira el lado bueno: la lluvia nos lava el salitre gratis y riega los tomates marinos!',
        npcReply: `${npcName} ríe: «¡Vaya optimismo! Casi me convences de abrir el paraguas y tomar el té.»`,
        npcNextMood: 'felicidad',
        affinityDelta: 9,
        mentalDelta: 10,
        playerNextMood: 'felicidad',
        outcomeNote: '+10 Salud Mental · Buen humor',
      },
      {
        id: 'temerario',
        toneLabel: 'Soberbia Temeraria',
        toneKind: 'soberbia',
        playerText:
          'Los marineros llorones temen al oleaje. Yo navego por el ojo del huracán porque puedo.',
        npcReply: `${npcName} resopla molesto: «El océano no aplaude la chulería, Capitán. Solo cobra peaje.»`,
        npcNextMood: 'enojo',
        affinityDelta: -12,
        mentalDelta: -6,
        playerNextMood: 'soberbia',
        outcomeNote: '-6 Salud Mental · Temeridad rechazada',
      },
    ],
  },
  {
    id: 'construir_imperio',
    npcLines: {
      equilibrio: [
        'Cada pueblo, reino o refugio que levantamos en tierra firme cambia la cara de este mundo roto. ¿Qué sueñas construir?',
        'La gente necesita murallas para dormir sin pesadillas y huertos para no pelear por migajas.',
      ],
      felicidad: [
        'Ver banderas propias ondear sobre una isla recuperada me llena de esperanza real.',
      ],
      tristeza: [
        '¿De qué sirve levantar torres si un día otro bando o un leviatán puede reducirlo todo a escombros?',
      ],
      enojo: [
        '¡Fortalezas y búnkeres nucleares! Que los clanes piratas se estrellen contra nuestros muros.',
      ],
      orgullo: [
        'Pronto nuestro nombre resonará como el del único imperio capaz de poner orden en las cenizas.',
      ],
      soberbia: [
        'El mundo entero debería arrodillarse ante el imperio que vamos a alzar. Todos nos necesitarán.',
      ],
      lokito: [
        '¡Vamos a poner coronas de cangrejo en cada ayuntamiento y cobrar impuestos en guiso!',
      ],
      cansancio: [
        'Cargar madera y piedra bajo el sol para levantar asentamientos deja a cualquiera exhausto...',
      ],
    },
    buildChoices: (npcName) => [
      {
        id: 'hogar',
        toneLabel: 'Refugio para Todos',
        toneKind: 'empatica',
        playerText:
          'No construimos para presumir coronas, sino para que las familias tengan escuelas, comida y paz por la noche.',
        npcReply: `${npcName} asiente conmovido: «Por un hogar así vale la pena cargar cien piedras más.»`,
        npcNextMood: 'felicidad',
        affinityDelta: 13,
        mentalDelta: 11,
        playerNextMood: 'felicidad',
        outcomeNote: '+11 Salud Mental · Propósito noble',
      },
      {
        id: 'estrategia',
        toneLabel: 'Red de Islas',
        toneKind: 'pragmatica',
        playerText:
          'Conectaremos almacenes, torretas, granjas y un búnker nuclear en las islas estratégicas.',
        npcReply: `${npcName} aprueba: «Una red autosuficiente es imposible de doblegar.»`,
        npcNextMood: 'orgullo',
        affinityDelta: 8,
        mentalDelta: 6,
        playerNextMood: 'orgullo',
        outcomeNote: '+6 Salud Mental · Visión de reino',
      },
      {
        id: 'broma_rey',
        toneLabel: 'Chiste Real',
        toneKind: 'humor',
        playerText:
          'Si me nombran emperador, mi primer decreto será prohibir madrugar cuando haya niebla.',
        npcReply: `${npcName} se carcajea: «¡Tienes mi voto vitalicio, Su Majestad Dormilona!»`,
        npcNextMood: 'felicidad',
        affinityDelta: 10,
        mentalDelta: 12,
        playerNextMood: 'felicidad',
        outcomeNote: '+12 Salud Mental · Espíritu ligero',
      },
      {
        id: 'tirania',
        toneLabel: 'Soberbia Imperial',
        toneKind: 'soberbia',
        playerText:
          'Los súbditos obedecerán sin chistar. Quien funde un imperio manda y los demás sirven.',
        npcReply: `${npcName} te mira frío: «Si vas a crear otra tiranía, no cuentes con mi entusiasmo.»`,
        npcNextMood: 'enojo',
        affinityDelta: -15,
        mentalDelta: -7,
        playerNextMood: 'soberbia',
        outcomeNote: '-7 Salud Mental · Rechazo a la tiranía',
      },
    ],
  },
  {
    id: 'suenos_y_locura',
    npcLines: {
      equilibrio: [
        'A veces cierro los ojos y casi oigo tráfico lejano y risas de una ciudad que ya no existe. ¿Tú todavía sueñas con tierra firme?',
        'Cuidar la cabeza aquí es tan difícil como cuidar el casco: la soledad y el estrés te comen despacio.',
      ],
      felicidad: [
        'Anoche dormí sin pesadillas por primera vez en meses. ¡Me siento nuevo!',
      ],
      tristeza: [
        'Hay madrugadas en que el silencio del océano pesa tanto que cuesta recordar por qué seguimos remando.',
      ],
      enojo: [
        '¡Las pesadillas me despiertan furioso con todo! Necesito descargar golpeando algo o voy a estallar.',
      ],
      orgullo: [
        'Muchos marineros perdieron la razón al ver caer sus ciudades; nosotros seguimos firmes.',
      ],
      soberbia: [
        'Mi mente es una fortaleza impenetrable; solo los débiles sucumben al pánico del abismo.',
      ],
      lokito: [
        '¡Shhh! ¿No ves que las nubes tienen forma de tenedor gigante? ¡Algo se cuece allá arriba!',
      ],
      cansancio: [
        'Confundo las horas del día... no sé si amaneció hace una hora o si nunca salió el sol.',
      ],
    },
    buildChoices: (npcName) => [
      {
        id: 'escuchar',
        toneLabel: 'Escucha Sincera',
        toneKind: 'empatica',
        playerText:
          'Cuando el peso sea demasiado grande, háblame aunque sea medianoche. Ninguno debería quedarse solo con sus fantasmas.',
        npcReply: `${npcName} respira profundo: «Gracias... saber que alguien escucha de verdad mantiene cuerda a la mente.»`,
        npcNextMood: 'felicidad',
        affinityDelta: 14,
        mentalDelta: 14,
        playerNextMood: 'felicidad',
        outcomeNote: '+14 Salud Mental · Sanación emocional',
      },
      {
        id: 'rutina',
        toneLabel: 'Ancla Mental',
        toneKind: 'pragmatica',
        playerText:
          'Agua limpia, turnos de descanso y tareas claras. La rutina nos protege de perder la cabeza.',
        npcReply: `${npcName} asiente: «Cierto. Paso a paso, hora a hora, sin mirar el abismo más de la cuenta.»`,
        npcNextMood: 'equilibrio',
        affinityDelta: 6,
        mentalDelta: 7,
        outcomeNote: '+7 Salud Mental · Estabilidad',
      },
      {
        id: 'absurdo',
        toneLabel: 'Humor Surreal',
        toneKind: 'humor',
        playerText:
          'Si empezamos a hablar con las gaviotas y ellas nos responden con acento pirata, ahí sí pedimos vacaciones.',
        npcReply: `${npcName} se ríe fuerte: «¡Trato hecho! Mientras las gaviotas no cobren peaje, seguimos cuerdos.»`,
        npcNextMood: 'felicidad',
        affinityDelta: 9,
        mentalDelta: 12,
        playerNextMood: 'felicidad',
        outcomeNote: '+12 Salud Mental · Risa terapéutica',
      },
      {
        id: 'negar',
        toneLabel: 'Soberbia / Negación',
        toneKind: 'soberbia',
        playerText:
          'El trauma y el agotamiento son inventos de gente blanda. Yo soy invulnerable a la locura.',
        npcReply: `${npcName} suspira preocupado: «Negar las heridas mentales es la forma más rápida de volverse lokito, Capitán.»`,
        npcNextMood: 'tristeza',
        affinityDelta: -10,
        mentalDelta: -9,
        playerNextMood: 'soberbia',
        outcomeNote: '-9 Salud Mental · Negación peligrosa',
      },
    ],
  },
  {
    id: 'reliquias_y_viejo_mundo',
    npcLines: {
      equilibrio: [
        'Cada ruina, faro apagado o pecio que exploramos guarda voces y objetos del mundo que perdimos.',
        '¿Qué crees que sentían los científicos que construyeron esos búnkeres antes de que todo se inundara?',
      ],
      felicidad: [
        'Encontrar música vieja o libros secos en un cofre nos recuerda todo lo bonito que aún vale rescatar.',
      ],
      tristeza: [
        'Recoger reliquias de gente que murió buscando salida me deja una mezcla amarga de gratitud y culpa.',
      ],
      enojo: [
        '¡Ellos jugaron con las fallas abisales y nosotros pagamos la factura entre ruinas tóxicas!',
      ],
      orgullo: [
        'Dominar la tecnología antigua nos pone diez pasos por delante de cualquier banda pirata.',
      ],
      soberbia: [
        'Los tesoros del Viejo Mundo pertenecen por derecho al capitán más capaz: es decir, a nosotros.',
      ],
      lokito: [
        '¡Ese cristal me susurró la contraseña del océano! Bueno... o tal vez era mi estómago rugiendo.',
      ],
      cansancio: [
        'Bucear entre fierros oxidados y trampas antiguas te saca hasta la última gota de energía.',
      ],
    },
    buildChoices: (npcName) => [
      {
        id: 'memoria',
        toneLabel: 'Honrar la Memoria',
        toneKind: 'empatica',
        playerText:
          'Aprendamos de sus errores y usemos lo que dejaron para proteger vidas, no para repetir su codicia.',
        npcReply: `${npcName} sonríe sereno: «Una promesa digna de recordar en cada expedición.»`,
        npcNextMood: 'equilibrio',
        affinityDelta: 11,
        mentalDelta: 9,
        playerNextMood: 'equilibrio',
        outcomeNote: '+9 Salud Mental · Sabiduría histórica',
      },
      {
        id: 'ciencia',
        toneLabel: 'Uso Práctico',
        toneKind: 'pragmatica',
        playerText:
          'Convertiremos cada plano, cristal y núcleo en mejores torretas, nanoreparadores y buques.',
        npcReply: `${npcName} asiente entusiasta: «Ciencia aplicada a sobrevivir un año más.»`,
        npcNextMood: 'orgullo',
        affinityDelta: 8,
        mentalDelta: 5,
        outcomeNote: '+5 Salud Mental · Enfoque técnico',
      },
      {
        id: 'broma_reliquia',
        toneLabel: 'Chiste Antiguo',
        toneKind: 'humor',
        playerText:
          'Ojalá en la próxima ruina encontremos una cafetera intacta del Viejo Mundo; pagaría un lingote de oro.',
        npcReply: `${npcName} ríe: «¡Una cafetera de rango SSS valdría más que diez cañones!»`,
        npcNextMood: 'felicidad',
        affinityDelta: 10,
        mentalDelta: 11,
        playerNextMood: 'felicidad',
        outcomeNote: '+11 Salud Mental · Nostalgia alegre',
      },
      {
        id: 'codicia',
        toneLabel: 'Soberbia Codiciosa',
        toneKind: 'soberbia',
        playerText:
          'Que los muertos se queden con sus historias; yo solo quiero poder absoluto y botín para mí.',
        npcReply: `${npcName} frunce el ceño: «Cuando solo buscas poder, acabas igual que los causantes del colapso.»`,
        npcNextMood: 'enojo',
        affinityDelta: -13,
        mentalDelta: -7,
        playerNextMood: 'soberbia',
        outcomeNote: '-7 Salud Mental · Codicia censurada',
      },
    ],
  },
];

function buildContextualGreeting(
  npcId: string,
  npcName: string,
  npcMood: NpcAttitudeMood,
  playerState: PersistentState,
  world?: WorldDialogueContext
): string {
  const v = playerState.vitals || createInitialVitals();
  const moodLabel = MOOD_META[npcMood]?.shortLabel || 'Sereno';

  if (v.mentalHealth <= 28 || v.mood === 'lokito') {
    return `[${moodLabel}] «Capitán... tienes la mirada perdida y murmuras cosas sin sentido. ¡Respira hondo y háblame! Estoy aquí para traerte de vuelta.»`;
  }
  if (v.mood === 'soberbia') {
    return `[${moodLabel}] «Últimamente caminas mirando a todos por encima del hombro, Capitán. ¿Podemos hablar un segundo como iguales?»`;
  }
  if (v.thirst <= 25 || v.hunger <= 25) {
    return `[${moodLabel}] «Te ves pálido y te tiemblan las manos, Capitán. Bebe agua y come algo caliente o vas a desplomarte.»`;
  }
  if (world?.nearLeviathan) {
    return `[${moodLabel}] «¿Sientes esa vibración en el casco? Hay un leviatán gigante cerca... Hablar mantiene los nervios bajo control.»`;
  }
  if (world?.weather === 'tormenta') {
    return `[${moodLabel}] «¡Qué tormenta brutal! Entre relámpagos y olas negras, dime cómo ves el rumbo.»`;
  }
  if (world?.npcAnimState === 'swimming' && Math.random() < 0.72) {
    return `[${moodLabel}] «*Sube del agua sacudiéndose el salitre* Estaba nadando junto al casco (${world.npcActivityLabel || 'revisando la quilla'}). ¿Necesitas algo, Capitán?»`;
  }
  if (world?.npcAnimState === 'interacting' && Math.random() < 0.52) {
    return `[${moodLabel}] «*Hace una pausa en su tarea* Justo estaba ${world.npcActivityLabel?.toLowerCase() || 'interactuando en cubierta'}. Dime qué ocurre.»`;
  }
  if (world?.npcAnimState === 'walking' && Math.random() < 0.44) {
    return `[${moodLabel}] «*Se detiene en mitad de su ronda* Mientras patrullaba la balsa noté el aire distinto... ¿cómo vamos?»`;
  }

  const charLines = CHARACTER_SIGNATURE_LINES[npcId];
  if (charLines && Math.random() < 0.48) {
    return `[${moodLabel}] «${pick(charLines)}»`;
  }

  const t = pick(TOPIC_TEMPLATES);
  const lines = t.npcLines[npcMood] || t.npcLines.equilibrio;
  return `[${moodLabel}] «${pick(lines)}»`;
}

export function getRichNpcAmbientDialogue(
  npcId: string,
  npcMood: NpcAttitudeMood,
  state: PersistentState,
  world: WorldDialogueContext
): string {
  const v = state.vitals || createInitialVitals();
  if (v.mentalHealth <= 28 && Math.random() < 0.4) {
    return pick([
      'Capitán, te ves alterado... ¡respira hondo y come o descansa un poco!',
      'Oye, ¿estás escuchando voces otra vez? ¡Mírame, sigue en cubierta conmigo!',
    ]);
  }
  if (world.nearLeviathan && Math.random() < 0.45) {
    return pick([
      '¡Silencio! Siento un gigante desplazando corrientes allá abajo...',
      'No dispares al leviatán sin un arma nuclear... ¡mira el tamaño de su lomo!',
    ]);
  }
  if (world.weather === 'tormenta' && Math.random() < 0.45) {
    return pick([
      '¡Sujeten los barriles! ¡Viene otra ráfaga eléctrica sobre el mástil!',
      '¡Esta lluvia salada arde en los ojos, vigilen el timón!',
    ]);
  }
  const charLines = CHARACTER_SIGNATURE_LINES[npcId];
  if (charLines && Math.random() < 0.6) {
    return pick(charLines);
  }
  const t = pick(TOPIC_TEMPLATES);
  const lines = t.npcLines[npcMood] || t.npcLines.equilibrio;
  return pick(lines);
}

export function startNpcConversation(
  npcId: string,
  state: PersistentState,
  overrideName?: string,
  world?: WorldDialogueContext & { worldNpc?: WorldNpcEntity | null }
): NpcConversationSession {
  const svDef = SURVIVORS_CATALOG.find((s) => s.id === npcId);
  const wNpc = world?.worldNpc;
  const npcName = overrideName || wNpc?.name || svDef?.name || 'Aldeano Costero';
  const npcRole = wNpc?.title || svDef?.role || 'Habitante de Puerto Libre';
  const npcColor = wNpc?.color || svDef?.color || '#38bdf8';
  const moodKey = wNpc ? wNpc.role : npcId;

  const npcMood = getNpcMoodState(state, npcId);
  const topic = pick(TOPIC_TEMPLATES);
  const greeting =
    wNpc && Math.random() < 0.65
      ? `[${MOOD_META[npcMood.mood]?.shortLabel || 'Sereno'}] «${wNpc.greeting}»`
      : buildContextualGreeting(moodKey, npcName, npcMood.mood, state, world);
  const choices = topic.buildChoices(npcName, npcMood.mood, state);

  return {
    npcId,
    npcName,
    npcRole,
    npcColor,
    turn: 1,
    stage: 'choosing',
    currentPrompt: greeting,
    latestReply: '',
    latestOutcomeNote: '',
    choices,
    transcript: [
      {
        speaker: 'npc',
        name: npcName,
        text: greeting,
        moodBadge: MOOD_META[npcMood.mood].shortLabel,
      },
    ],
    usedTopicIds: [topic.id],
    milestoneClaimed: false,
    aiMode: true,
    aiLoading: false,
    aiError: null,
    npcAnimState: world?.npcAnimState || 'interacting',
    npcActivityLabel: world?.npcActivityLabel || 'Interactuando contigo',
  };
}

export function appendNpcChatHistory(
  state: PersistentState,
  npcId: string,
  entries: NpcTranscriptEntry[]
): void {
  if (!state.npcChatHistory) state.npcChatHistory = {};
  const existing = state.npcChatHistory[npcId] || [];
  const stamped: NpcHistoryEntry[] = entries.map((e, idx) => ({
    speaker: e.speaker,
    name: e.name,
    text: e.text,
    moodBadge: e.moodBadge,
    viaAi: e.viaAi,
    ts: Date.now() + idx,
  }));
  // Avoid duplicating trailing identical messages from reopened/merged sessions
  const combined = [...existing];
  for (const item of stamped) {
    const last = combined[combined.length - 1];
    if (last && last.speaker === item.speaker && last.text === item.text) continue;
    combined.push(item);
  }
  state.npcChatHistory[npcId] = combined.slice(-60);
}

export function chooseNpcDialogueOption(
  session: NpcConversationSession,
  choiceIndex: number,
  state: PersistentState
): NpcConversationSession {
  const choice = session.choices[choiceIndex];
  if (!choice || session.stage !== 'choosing') return session;

  const npcMood = getNpcMoodState(state, session.npcId);
  npcMood.affinity = Math.max(-100, Math.min(100, npcMood.affinity + choice.affinityDelta));
  npcMood.mood = choice.npcNextMood;
  npcMood.reason =
    choice.affinityDelta > 0
      ? 'Tu conversación mejoró su ánimo y confianza.'
      : 'Sintió tensión o arrogancia en tus palabras.';

  const v = state.vitals || createInitialVitals();
  state.vitals = v;
  const targetPlayerMood = choice.playerNextMood || v.mood;
  shiftPlayerMood(state, targetPlayerMood, choice.mentalDelta, 55);
  if (choice.toneKind === 'soberbia') {
    v.pridePoints = Math.min(100, v.pridePoints + 24);
    v.mood = 'soberbia';
  } else if (choice.toneKind === 'empatica') {
    v.pridePoints = Math.max(0, v.pridePoints - 14);
  }

  const nextTranscript: NpcTranscriptEntry[] = [
    ...session.transcript,
    {
      speaker: 'player',
      name: state.playerProfile.name,
      text: choice.playerText,
    },
    {
      speaker: 'npc',
      name: session.npcName,
      text: choice.npcReply,
      moodBadge: MOOD_META[choice.npcNextMood].shortLabel,
    },
  ];

  return {
    ...session,
    stage: 'reading_reply',
    latestReply: choice.npcReply,
    latestOutcomeNote: `${choice.outcomeNote} · ${session.npcName}: ${MOOD_META[choice.npcNextMood].shortLabel}`,
    transcript: nextTranscript,
  };
}

function applyThreeTurnMilestoneIfDue(
  session: NpcConversationSession,
  state: PersistentState,
  npcMood: NpcMoodState
): { claimedNow: boolean; rewardSummary?: string; systemEntry?: NpcTranscriptEntry } {
  if (session.milestoneClaimed || session.turn < 3) {
    return { claimedNow: false };
  }
  npcMood.chatsCompleted += 1;
  const v = state.vitals || createInitialVitals();
  state.vitals = v;
  let rewardSummary = '';

  if (npcMood.mood === 'felicidad' || npcMood.affinity >= 25) {
    v.mentalHealth = Math.min(100, v.mentalHealth + 16);
    v.fatigue = Math.min(100, v.fatigue + 12);
    if (v.mentalHealth > 34 && v.mood === 'lokito') v.mood = 'felicidad';
    state.resources.agu += 1;
    if (npcMood.affinity >= 35) state.resources.gui += 1;
    state.fame += 15;
    rewardSummary =
      npcMood.affinity >= 35
        ? `✨ Charla sanadora (3/3): +16 Salud Mental · +12 Energía · +1 Agua · +1 Guiso · +15 Fama`
        : `✨ Buena charla (3/3): +16 Salud Mental · +12 Energía · +1 Agua · +15 Fama`;
  } else if (npcMood.mood === 'enojo') {
    v.mentalHealth = Math.max(0, v.mentalHealth - 8);
    rewardSummary = `💢 Discusión agria (3/3): -8 Salud Mental · ${session.npcName} quedó enojado contigo.`;
  } else {
    v.mentalHealth = Math.min(100, v.mentalHealth + 10);
    state.fame += 8;
    rewardSummary = `💬 Conversación completada (3/3): +10 Salud Mental · +8 Fama.`;
  }

  return {
    claimedNow: true,
    rewardSummary,
    systemEntry: {
      speaker: 'sistema',
      name: 'Resultado de la charla (3 ocasiones)',
      text: rewardSummary,
    },
  };
}

export function advanceNpcConversationAfterReply(
  session: NpcConversationSession,
  state: PersistentState,
  keepEndlessAfterThree = false
): NpcConversationSession {
  if (session.stage !== 'reading_reply') return session;

  const npcMood = getNpcMoodState(state, session.npcId);

  if (session.turn < 3 || keepEndlessAfterThree) {
    const milestone = applyThreeTurnMilestoneIfDue(session, state, npcMood);
    const nextTurn = session.turn + 1;
    const remaining = TOPIC_TEMPLATES.filter((t) => !session.usedTopicIds.includes(t.id));
    const topic = remaining.length > 0 ? pick(remaining) : pick(TOPIC_TEMPLATES);
    const lines = topic.npcLines[npcMood.mood] || topic.npcLines.equilibrio;
    const prompt = pick(lines);
    const choices = topic.buildChoices(session.npcName, npcMood.mood, state);

    const nextTranscript = [...session.transcript];
    if (milestone.systemEntry) nextTranscript.push(milestone.systemEntry);
    nextTranscript.push({
      speaker: 'npc',
      name: session.npcName,
      text: prompt,
      moodBadge: MOOD_META[npcMood.mood].shortLabel,
    });

    return {
      ...session,
      turn: nextTurn,
      stage: 'choosing',
      currentPrompt: prompt,
      latestReply: '',
      latestOutcomeNote: '',
      choices,
      transcript: nextTranscript,
      usedTopicIds: [...session.usedTopicIds, topic.id],
      milestoneClaimed: session.milestoneClaimed || milestone.claimedNow,
      finalRewardSummary: milestone.rewardSummary || session.finalRewardSummary,
    };
  }

  const milestone = applyThreeTurnMilestoneIfDue(session, state, npcMood);
  const nextTranscript = [...session.transcript];
  if (milestone.systemEntry) nextTranscript.push(milestone.systemEntry);

  return {
    ...session,
    stage: 'finished',
    milestoneClaimed: true,
    finalRewardSummary: milestone.rewardSummary,
    transcript: nextTranscript,
  };
}

interface AiApiChoiceRaw {
  toneKind?: string;
  toneLabel?: string;
  playerText?: string;
  npcReply?: string;
  npcNextMood?: string;
  affinityDelta?: number;
  mentalDelta?: number;
  outcomeNote?: string;
}

interface AiApiResponsePayload {
  ok?: boolean;
  error?: string;
  data?: {
    npcReply?: string;
    npcNextMood?: string;
    npcReason?: string;
    affinityDelta?: number;
    mentalDelta?: number;
    outcomeNote?: string;
    nextChoices?: AiApiChoiceRaw[];
  };
}

function mapAiChoices(rawChoices: AiApiChoiceRaw[] | undefined, fallbackChoices: NpcDialogueChoice[]): NpcDialogueChoice[] {
  if (!Array.isArray(rawChoices) || rawChoices.length === 0) return fallbackChoices;
  return rawChoices.slice(0, 4).map((c, idx) => {
    const toneKind = sanitizeToneKind(c.toneKind);
    const npcNextMood = sanitizeMood(c.npcNextMood);
    const affinityDelta = Math.max(-18, Math.min(18, Math.round(Number(c.affinityDelta) || 0)));
    const mentalDelta = Math.max(-12, Math.min(16, Math.round(Number(c.mentalDelta) || 0)));
    return {
      id: `ai_choice_${Date.now()}_${idx}`,
      toneKind,
      toneLabel: String(c.toneLabel || toneKind).slice(0, 24),
      playerText: String(c.playerText || 'Continuemos hablando.'),
      npcReply: typeof c.npcReply === 'string' ? c.npcReply : '',
      npcNextMood,
      affinityDelta,
      mentalDelta,
      playerNextMood:
        toneKind === 'soberbia'
          ? 'soberbia'
          : toneKind === 'humor' || toneKind === 'empatica'
            ? 'felicidad'
            : 'equilibrio',
      outcomeNote: String(
        c.outcomeNote || `${mentalDelta >= 0 ? `+${mentalDelta}` : mentalDelta} Salud Mental`
      ),
    };
  });
}

export async function requestAiNpcTurn(
  session: NpcConversationSession,
  state: PersistentState,
  worldContext: WorldDialogueContext,
  playerMessage?: string
): Promise<{ ok: boolean; session: NpcConversationSession }> {
  const npcMood = getNpcMoodState(state, session.npcId);
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 7000);
  try {
    const res = await fetch('/api/ai/npc-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        npcId: session.npcId,
        npcName: session.npcName,
        npcRole: session.npcRole,
        npcMood: npcMood.mood,
        npcAffinity: npcMood.affinity,
        npcReason: npcMood.reason,
        npcAnimState: worldContext.npcAnimState || session.npcAnimState || 'interacting',
        npcActivityLabel: worldContext.npcActivityLabel || session.npcActivityLabel || 'Interactuando contigo',
        playerName: state.playerProfile.name,
        playerVitals: state.vitals,
        worldContext,
        transcript: session.transcript.slice(-6),
        turn: session.turn,
        playerMessage: playerMessage || '',
      }),
    });

    const payload: AiApiResponsePayload = await res.json();
    if (!res.ok || !payload.ok || !payload.data) {
      return {
        ok: false,
        session: {
          ...session,
          aiLoading: false,
          aiError: payload.error || `Error del servidor de IA (${res.status})`,
        },
      };
    }

    const d = payload.data;
    const nextMood = sanitizeMood(d.npcNextMood);
    const affDelta = Math.max(-18, Math.min(18, Math.round(Number(d.affinityDelta) || 0)));
    const menDelta = Math.max(-12, Math.min(16, Math.round(Number(d.mentalDelta) || 0)));
    const nextChoices = mapAiChoices(d.nextChoices, session.choices);
    const npcReplyText = String(d.npcReply || '...').trim();

    if (playerMessage) {
      npcMood.affinity = Math.max(-100, Math.min(100, npcMood.affinity + affDelta));
      npcMood.mood = nextMood;
      if (d.npcReason) npcMood.reason = String(d.npcReason).slice(0, 140);
      shiftPlayerMood(state, state.vitals.mood, menDelta, 55);

      const updatedTranscript: NpcTranscriptEntry[] = [
        ...session.transcript,
        {
          speaker: 'player',
          name: state.playerProfile.name,
          text: playerMessage,
        },
        {
          speaker: 'npc',
          name: session.npcName,
          text: npcReplyText,
          moodBadge: MOOD_META[nextMood].shortLabel,
          viaAi: true,
        },
      ];

      const milestone = applyThreeTurnMilestoneIfDue(session, state, npcMood);
      if (milestone.systemEntry) updatedTranscript.push(milestone.systemEntry);

      return {
        ok: true,
        session: {
          ...session,
          aiLoading: false,
          aiError: null,
          stage: 'reading_reply',
          latestReply: npcReplyText,
          latestOutcomeNote: `${d.outcomeNote || 'Respuesta generada por IA'} · ${session.npcName}: ${MOOD_META[nextMood].shortLabel}`,
          choices: nextChoices,
          transcript: updatedTranscript,
          milestoneClaimed: session.milestoneClaimed || milestone.claimedNow,
          finalRewardSummary: milestone.rewardSummary || session.finalRewardSummary,
        },
      };
    }

    // Opening or next-turn AI prompt generation
    const updatedTranscript: NpcTranscriptEntry[] = [
      ...session.transcript,
      {
        speaker: 'npc',
        name: session.npcName,
        text: npcReplyText,
        moodBadge: MOOD_META[nextMood].shortLabel,
        viaAi: true,
      },
    ];

    return {
      ok: true,
      session: {
        ...session,
        aiLoading: false,
        aiError: null,
        stage: 'choosing',
        currentPrompt: npcReplyText,
        choices: nextChoices,
        transcript: updatedTranscript,
      },
    };
  } catch (err) {
    const isAbort = err instanceof Error && err.name === 'AbortError';
    return {
      ok: false,
      session: {
        ...session,
        aiLoading: false,
        aiError: isAbort
          ? 'La IA tardó demasiado (>7s). Puedes continuar con el diálogo narrativo.'
          : err instanceof Error
            ? err.message
            : 'No se pudo conectar con la IA de diálogos.',
      },
    };
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function requestAiAmbientBanter(
  crewNames: string[],
  state: PersistentState,
  worldContext: WorldDialogueContext
): Promise<Array<{ speaker: string; text: string }> | null> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 7000);
  try {
    const res = await fetch('/api/ai/ambient-banter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        crewNames,
        playerVitals: state.vitals,
        worldContext,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.ok && Array.isArray(data.lines)) {
      return data.lines.filter(
        (x: { speaker?: string; text?: string }) =>
          typeof x?.speaker === 'string' && typeof x?.text === 'string'
      );
    }
    return null;
  } catch {
    return null;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export function shiftWorldNpcMoods(
  state: PersistentState,
  eventKind: 'victory' | 'hull_hit' | 'meal' | 'storm' | 'sleep'
): void {
  if (!state.npcMoods) state.npcMoods = createInitialNpcMoods();
  for (const sv of state.survivors) {
    if (!sv.unlocked) continue;
    const m = getNpcMoodState(state, sv.id);
    if (eventKind === 'victory') {
      m.mood = Math.random() < 0.65 ? 'orgullo' : 'felicidad';
      m.reason = 'Animado tras vencer en el mar.';
    } else if (eventKind === 'hull_hit') {
      m.mood = Math.random() < 0.55 ? 'enojo' : 'tristeza';
      m.reason = 'Tenso por los golpes contra el casco.';
    } else if (eventKind === 'meal') {
      m.mood = 'felicidad';
      m.reason = 'Reconfortado tras compartir comida caliente.';
    } else if (eventKind === 'storm') {
      m.mood = Math.random() < 0.5 ? 'cansancio' : 'tristeza';
      m.reason = 'Agotado por el oleaje de la tormenta.';
    } else if (eventKind === 'sleep') {
      m.mood = 'equilibrio';
      m.reason = 'Descansado tras el relevo nocturno.';
    }
  }
}
