import type { Aleatorio } from '../motor/aleatorio'
import { barajaCompleta, barajar, crearCarta, manoDeCodigo, VALORES } from '../motor/cartas'
import type { Carta } from '../motor/cartas'
import { categoriaDe, describirMano, evaluar, mejoresCinco } from '../motor/evaluador'
import type { Modulo, PreguntaTest } from '../juego/lecciones'
import { leccion } from '../juego/lecciones'
import { dosJugadasDistintas, nombreDeJugada } from './generador'

/**
 * MÓDULO 1 · Las reglas y la mesa.
 *
 * Rehecho después de la primera prueba real del usuario. Lo que dijo:
 *
 *   "siento que de entrada tiene muchísimo texto y aburre (...) ahorita empieza
 *    como que muy de golpe, ya directo un montón de texto y luego listo, que
 *    tienes en la mesa, que gana... falta una transición ahí"
 *
 * Tenía razón. Antes se saltaban dos escalones enteros: se daba por sabido qué
 * carta vale más y qué es un full antes de preguntar quién gana una mano de
 * siete cartas. Ahora la escalera es:
 *
 *   las cartas → ¿qué carta gana? → las jugadas → ¿qué jugada gana? → una mano
 *   de verdad → ¿quién gana?
 *
 * Y la explicación va en **pasos de una frase con cartas a la vista**, no en
 * párrafos.
 */

const m = (texto: string): Carta[] => manoDeCodigo(texto)

// ─── Preguntas ───────────────────────────────────────────────────────────────

/** ¿Qué carta vale más? La primera pregunta del juego. */
function queCartaEsMasAlta(azar: Aleatorio): PreguntaTest {
  const a = azar.entero(13)
  let b = azar.entero(13)
  while (b === a) b = azar.entero(13)
  const cartaA = crearCarta(a, azar.entero(4))
  const cartaB = crearCarta(b, azar.entero(4))
  const ganaA = a > b

  const explicar = (alto: number, bajo: number) =>
    `El ${VALORES[alto]} vale más que el ${VALORES[bajo]}.` +
    (alto === 12 ? ' El as es la carta más alta de todas.' : '')

  return {
    enunciado: '¿Cuál de estas dos cartas vale más?',
    opciones: [
      { texto: `${VALORES[a]}`, correcta: ganaA, porQue: ganaA ? explicar(a, b) : explicar(b, a) },
      { texto: `${VALORES[b]}`, correcta: !ganaA, porQue: ganaA ? explicar(a, b) : explicar(b, a) },
    ],
    mano: [cartaA],
    manoB: [cartaB],
  }
}

/** ¿Qué jugada gana? Dos manos de cinco cartas, ya formadas. */
function queJugadaGana(azar: Aleatorio): PreguntaTest {
  const { a, b, catA, catB } = dosJugadasDistintas(azar)
  const ganaA = catA > catB
  const porQue = `${mayuscula(nombreDeJugada(Math.max(catA, catB)))} gana a ${nombreDeJugada(Math.min(catA, catB))}.`

  return {
    enunciado: '¿Cuál de estas dos jugadas gana?',
    mano: a,
    manoB: b,
    opciones: [
      { texto: `La de arriba: ${nombreDeJugada(catA)}`, correcta: ganaA, porQue },
      { texto: `La de abajo: ${nombreDeJugada(catB)}`, correcta: !ganaA, porQue },
    ],
  }
}

/** Con cinco cartas en la mesa y dos manos, ¿quién gana? */
function quienGanaLaMano(azar: Aleatorio): PreguntaTest {
  for (let intento = 0; intento < 200; intento++) {
    const baraja = barajar(barajaCompleta(), azar)
    const mesa = baraja.slice(0, 5)
    const manoA = baraja.slice(5, 7)
    const manoB = baraja.slice(7, 9)
    const valorA = evaluar([...manoA, ...mesa])
    const valorB = evaluar([...manoB, ...mesa])
    if (valorA === valorB) continue

    const ganaA = valorA > valorB
    return {
      enunciado: 'Las cinco cartas de la mesa son de los dos. ¿Quién gana?',
      mesa,
      mano: manoA,
      manoB,
      opciones: [
        {
          texto: 'El de arriba',
          correcta: ganaA,
          porQue: `Arriba se forma ${describirMano([...manoA, ...mesa])} y abajo ${describirMano([...manoB, ...mesa])}.`,
        },
        {
          texto: 'El de abajo',
          correcta: !ganaA,
          porQue: `Abajo se forma ${describirMano([...manoB, ...mesa])} y arriba ${describirMano([...manoA, ...mesa])}.`,
        },
      ],
    }
  }
  return quienGanaLaMano(azar)
}

/** ¿Cómo se llama la jugada que tienes? Solo con manos donde tus cartas pintan algo. */
function comoSeLlama(azar: Aleatorio): PreguntaTest {
  let mesa: Carta[] = []
  let mano: Carta[] = []
  for (let intento = 0; intento < 300; intento++) {
    const baraja = barajar(barajaCompleta(), azar)
    mesa = baraja.slice(0, 5)
    mano = baraja.slice(5, 7)
    if (mejoresCinco([...mano, ...mesa]).some((c) => mano.includes(c))) break
  }
  const completa = [...mano, ...mesa]
  const nombre = describirMano(completa)
  const categoria = categoriaDe(evaluar(completa))
  const correcta = nombreDeJugada(categoria)

  const otras = [0, 1, 2, 3, 4, 5, 6, 7]
    .filter((c) => c !== categoria)
    .sort(() => azar.siguiente() - 0.5)
    .slice(0, 2)
    .map(nombreDeJugada)

  const opciones = [correcta, ...otras]
    .sort(() => azar.siguiente() - 0.5)
    .map((texto) => ({
      texto: mayuscula(texto),
      correcta: texto === correcta,
      porQue: texto === correcta ? `Eso es: ${nombre}.` : `No: lo que hay aquí es ${nombre}.`,
    }))

  return { enunciado: 'Juntando tus cartas con la mesa, ¿qué jugada tienes?', mesa, mano, opciones }
}

function mayuscula(texto: string): string {
  return texto[0].toUpperCase() + texto.slice(1)
}

// ─── El módulo ───────────────────────────────────────────────────────────────

export const MODULO_1: Modulo = {
  numero: 1,
  titulo: 'Las reglas y la mesa',
  resumen: 'De no haber tocado una carta a entender una mano entera.',
  lecciones: [
    leccion({
      id: 'm1-cartas',
      modulo: 1,
      titulo: 'Las cartas',
      idea: 'Hay trece valores y cuatro palos. El as es la carta más alta.',
      pasos: [
        { tipo: 'valores', texto: 'Una baraja de póker tiene **trece valores**, del 2 al as.',
          pie: 'Ordenados de menor a mayor. El as es el más alto.' },
        { tipo: 'cartas', texto: 'El **as** gana a todas. El **2** es la más baja.',
          cartas: m('As 2h'), destacar: m('As') },
        { tipo: 'cartas', texto: 'Después del as van el **rey**, la **reina** y la **jota**.',
          cartas: m('Ks Qh Jd'), pie: 'En las cartas verás K, Q y J.' },
        { tipo: 'cartas', texto: 'Y hay **cuatro palos**: picas, corazones, diamantes y tréboles.',
          cartas: m('As Ah Ad Ac'),
          pie: 'Ningún palo vale más que otro: estos cuatro ases valen exactamente lo mismo.' },
      ],
      terminos: [],
      practica: { tipo: 'test', pregunta: (azar) => queCartaEsMasAlta(azar) },
      dominio: 4,
      minimoManos: 4,
      maximoManos: 10,
    }),

    leccion({
      id: 'm1-jugadas',
      modulo: 1,
      titulo: 'Las jugadas del póker',
      idea: 'Con cinco cartas se forman jugadas, y cuanto más raras, más ganan.',
      pasos: [
        { tipo: 'cartas', texto: 'Dos cartas del mismo valor son una **pareja**.',
          cartas: m('7s 7h'), pie: 'Pareja de sietes.' },
        { tipo: 'cartas', texto: 'Tres del mismo valor son un **trío**. Cuatro, un **póker**.',
          cartas: m('9s 9h 9d') },
        { tipo: 'cartas', texto: 'Cinco seguidas son una **escalera**, aunque sean de palos distintos.',
          cartas: m('9s 8h 7d 6c 5s') },
        { tipo: 'cartas', texto: 'Cinco del mismo palo son un **color**, aunque no sean seguidas.',
          cartas: m('As Js 9s 5s 2s') },
        { tipo: 'cartas', texto: 'Un trío y una pareja a la vez son un **full**.',
          cartas: m('Qs Qh Qd 4c 4s') },
        { tipo: 'escalera', texto: 'Esta es la escalera completa, de la jugada más floja a la más fuerte.',
          pie: 'No hay que aprendérsela hoy: la vas a ver tantas veces que se te va a quedar sola.' },
      ],
      terminos: ['pareja', 'trio', 'color', 'escalera', 'full', 'poker'],
      practica: { tipo: 'test', pregunta: (azar) => queJugadaGana(azar) },
      dominio: 4,
      minimoManos: 4,
      maximoManos: 12,
    }),

    leccion({
      id: 'm1-l1',
      modulo: 1,
      titulo: 'Tu mano son cinco de siete',
      idea: 'Tienes dos cartas tuyas y hay cinco en la mesa: juegas con las cinco mejores de esas siete.',
      pasos: [
        { tipo: 'cartas', texto: 'Te dan **dos cartas tapadas** que solo ves tú.', cartas: m('As Kh') },
        { tipo: 'mesa', texto: 'Y en el centro salen **cinco cartas** que sirven para todos.',
          mano: m('As Kh'), mesa: m('Ad 7c 2s 9h 4d') },
        { tipo: 'mesa', texto: 'Tu jugada son las **cinco mejores** entre tus dos y las cinco de la mesa.',
          mano: m('As Kh'), mesa: m('Ad 7c 2s 9h 4d'),
          pie: 'Aquí, el as de tu mano con el de la mesa: pareja de ases.' },
        { tipo: 'texto', texto: 'Gana quien tenga la mejor jugada... **o quien consiga que los demás se retiren**. Las dos formas valen.' },
      ],
      terminos: ['flop', 'bote'],
      practica: { tipo: 'test', pregunta: (azar) => comoSeLlama(azar) },
      dominio: 3,
      minimoManos: 3,
      maximoManos: 9,
    }),

    leccion({
      id: 'm1-l2',
      modulo: 1,
      titulo: 'Quién gana la mano',
      idea: 'Los dos usan las mismas cinco cartas de la mesa: gana quien las combine mejor con las suyas.',
      pasos: [
        { tipo: 'comparar', texto: 'Las mismas cinco cartas de la mesa pueden valerle mucho a uno y nada a otro.',
          a: m('As Ah Kd Kh 9s'), b: m('As Ah Kd Kh 2c'), gana: 'a',
          pie: 'Cuando la jugada es la misma, decide la carta más alta que quede.' },
        { tipo: 'texto', texto: 'Ojo con esta: **A-2-3-4-5 es la escalera más baja**, no la más alta. El as también vale por abajo.' },
        { tipo: 'comparar', texto: 'Por eso una escalera al seis le gana a la del as.',
          a: m('6s 5h 4d 3c 2s'), b: m('As 2h 3d 4c 5s'), gana: 'a' },
      ],
      terminos: ['showdown'],
      practica: { tipo: 'test', pregunta: (azar) => quienGanaLaMano(azar) },
      dominio: 4,
      minimoManos: 4,
      maximoManos: 12,
    }),

    leccion({
      id: 'm1-l3',
      modulo: 1,
      titulo: 'Los tres botones',
      idea: 'En cada turno solo hay tres cosas que puedes hacer: retirarte, pagar o subir.',
      pasos: [
        { tipo: 'acciones', texto: 'En tu turno solo hay **tres botones**. Siempre los mismos.' },
        { tipo: 'acciones', resaltar: 'retirarse', texto: '**Retirarte**: sueltas las cartas y te sales.',
          pie: 'Pierdes lo que ya habías puesto, pero ni una ficha más.' },
        { tipo: 'acciones', resaltar: 'pagar', texto: '**Pagar**: pones lo mismo que el rival y sigues viendo cartas.',
          pie: 'Si nadie ha apostado no cuesta nada, y entonces se llama pasar.' },
        { tipo: 'acciones', resaltar: 'subir', texto: '**Subir**: pones más de lo que hay que poner.',
          pie: 'Los demás tendrán que pagar más o retirarse.' },
        { tipo: 'acciones', texto: 'Todo el póker es elegir bien entre estos tres, una y otra vez.',
          pie: 'Eso es exactamente lo que vas a entrenar aquí.' },
      ],
      terminos: ['retirarse', 'pagar', 'pasar', 'subir'],
      practica: {
        tipo: 'test',
        pregunta: (azar) => {
          const preguntas: PreguntaTest[] = [
            {
              enunciado: 'El rival apuesta 50 y tú no tienes nada. ¿Qué haces?',
              opciones: [
                { texto: 'Retirarme', correcta: true, porQue: 'Sueltas la mano y no pones ni una ficha más.' },
                { texto: 'Pagar', porQue: 'Sería poner 50 para seguir en una mano que crees perdida.' },
                { texto: 'Subir', porQue: 'Subir sin nada es farolear, y eso se aprende mucho más adelante.' },
              ],
            },
            {
              enunciado: 'Nadie ha apostado y tú tampoco quieres. ¿Cómo se llama seguir sin poner nada?',
              opciones: [
                { texto: 'Pasar', correcta: true, porQue: 'Eso es. Sigues dentro y gratis.' },
                { texto: 'Retirarme', porQue: '¡Podías seguir gratis! Es el error más caro de los principiantes.' },
                { texto: 'Pagar', porQue: 'Pagar es igualar una apuesta, y aquí no hay ninguna.' },
              ],
            },
            {
              enunciado: 'Tienes la mejor mano y quieres que el rival ponga más fichas. ¿Qué haces?',
              opciones: [
                { texto: 'Subir', correcta: true, porQue: 'Subes para que el bote crezca mientras vas ganando.' },
                { texto: 'Retirarme', porQue: 'Retirarte con la mejor mano es regalar el bote.' },
                { texto: 'Pasar siempre', porQue: 'A veces pasar es lo mejor, pero por norma con la mejor mano se apuesta.' },
              ],
            },
          ]
          return preguntas[azar.entero(preguntas.length)]
        },
      },
      dominio: 3,
      minimoManos: 3,
      maximoManos: 9,
    }),

    leccion({
      id: 'm1-l4',
      modulo: 1,
      titulo: 'Las ciegas y el botón',
      idea: 'Dos jugadores ponen fichas antes de ver las cartas, y ese turno rota en cada mano.',
      pasos: [
        { tipo: 'sillas', boton: 0, texto: 'Esta es la mesa vista desde arriba. Cuatro jugadores.',
          nota: 'Si nadie pusiera fichas, lo listo sería esperar sentado a que te tocaran ases.' },
        { tipo: 'sillas', boton: 0, resaltar: 1, texto: 'Por eso dos jugadores ponen fichas obligatorias: las **ciegas**.',
          pie: 'La pequeña y, justo detrás, la grande.' },
        { tipo: 'fichas', texto: 'Se ponen **antes de ver las cartas**. Por eso siempre hay algo que ganar.',
          montones: [
            { nombre: 'Ciega pequeña', fichas: 10, color: 'var(--azul)' },
            { nombre: 'Ciega grande', fichas: 20, color: 'var(--morado)' },
          ] },
        { tipo: 'sillas', boton: 1, texto: 'El **botón** marca quién reparte y rota una silla en cada mano.',
          nota: 'Mano siguiente: el botón se ha movido, y las ciegas con él.' },
        { tipo: 'sillas', boton: 0, resaltar: 0, texto: 'El del botón habla el **último** después del flop.',
          pie: 'Es la mejor silla de la mesa, y en el módulo 4 verás por qué.' },
      ],
      terminos: ['ciegas', 'boton', 'posicion'],
      practica: {
        tipo: 'test',
        pregunta: (azar) => {
          const preguntas: PreguntaTest[] = [
            {
              enunciado: '¿Cuándo se ponen las ciegas?',
              opciones: [
                { texto: 'Antes de repartir las cartas', correcta: true, porQue: 'Son a ciegas, de ahí el nombre: se pone sin saber qué te van a dar.' },
                { texto: 'Después de ver tus dos cartas', porQue: 'Si fuera así, nadie las pondría nunca con una mano mala.' },
                { texto: 'Solo cuando alguien apuesta', porQue: 'Son obligatorias, no dependen de nadie.' },
              ],
            },
            {
              enunciado: 'El botón está en tu silla. En la mano siguiente, ¿dónde estará?',
              opciones: [
                { texto: 'En la silla de tu izquierda', correcta: true, porQue: 'Rota una silla en cada mano, y las ciegas van con él.' },
                { texto: 'Se queda donde está', porQue: 'Entonces el mismo jugador tendría siempre la mejor posición.' },
                { texto: 'Va a quien ganó la mano', porQue: 'El botón no premia a nadie: solo marca el turno.' },
              ],
            },
            {
              enunciado: '¿Por qué es bueno hablar el último?',
              opciones: [
                { texto: 'Porque decides sabiendo lo que han hecho los demás', correcta: true, porQue: 'Información gratis en cada decisión. Es la ventaja más grande del póker.' },
                { texto: 'Porque te dan mejores cartas', porQue: 'Las cartas son las mismas en todas las sillas.' },
                { texto: 'Porque pagas menos ciegas', porQue: 'Todos pagan las mismas a lo largo de la vuelta.' },
              ],
            },
          ]
          return preguntas[azar.entero(preguntas.length)]
        },
      },
      dominio: 3,
      minimoManos: 3,
      maximoManos: 9,
    }),

    leccion({
      id: 'm1-l5',
      modulo: 1,
      titulo: 'Las cuatro calles',
      idea: 'Una mano tiene cuatro rondas de apuestas, y en cada una sale más información.',
      pasos: [
        { tipo: 'mesa', texto: '**Antes del flop**: solo ves tus dos cartas. Primera ronda de apuestas.',
          mano: m('As Kh'), mesa: [] },
        { tipo: 'mesa', texto: 'El **flop**: salen tres cartas de golpe. Segunda ronda.',
          mano: m('As Kh'), mesa: m('Ad 7c 2s') },
        { tipo: 'mesa', texto: 'El **turn**: sale la cuarta. Tercera ronda.',
          mano: m('As Kh'), mesa: m('Ad 7c 2s 9h') },
        { tipo: 'mesa', texto: 'El **river**: la quinta y última. Cuarta ronda, y se enseñan las cartas.',
          mano: m('As Kh'), mesa: m('Ad 7c 2s 9h 4d') },
        { tipo: 'texto', texto: 'Cada carta nueva cambia quién va ganando. Una decisión buena en el flop puede ser malísima en el river.' },
      ],
      terminos: ['calle', 'flop', 'turn', 'river'],
      practica: {
        tipo: 'test',
        pregunta: (azar) => {
          const preguntas: PreguntaTest[] = [
            {
              enunciado: 'Hay tres cartas en la mesa. ¿En qué calle estás?',
              mesa: m('As 7h 2d'),
              opciones: [
                { texto: 'El flop', correcta: true, porQue: 'El flop son las tres primeras cartas comunes, que salen a la vez.' },
                { texto: 'El turn', porQue: 'El turn es la cuarta: habría cuatro en la mesa.' },
                { texto: 'El river', porQue: 'El river es la quinta y última.' },
              ],
            },
            {
              enunciado: 'Hay cinco cartas en la mesa y ya se ha apostado. ¿Qué viene ahora?',
              mesa: m('As 7h 2d Kc 9s'),
              opciones: [
                { texto: 'Se enseñan las cartas y se ve quién gana', correcta: true, porQue: 'Después del river ya no sale ninguna carta más.' },
                { texto: 'Sale una sexta carta', porQue: 'Nunca hay más de cinco cartas comunes.' },
                { texto: 'Se reparte otra vez', porQue: 'La mano se resuelve antes de repartir la siguiente.' },
              ],
            },
          ]
          return preguntas[azar.entero(preguntas.length)]
        },
      },
      dominio: 2,
      minimoManos: 2,
      maximoManos: 6,
    }),

    leccion({
      id: 'm1-l6',
      modulo: 1,
      titulo: 'Tu primera decisión',
      idea: 'Con una mano perdida y una apuesta delante, retirarse no es rendirse: es ahorrar fichas.',
      pasos: [
        { tipo: 'mesa', texto: 'Lo que más cuesta al principio: **tirar una mano mala**.',
          mano: m('8d 3c'), mesa: m('As Kh 9s'),
          pie: 'Tus cartas no ligan con nada, y lo que salga no lo va a arreglar.' },
        { tipo: 'porcentaje', texto: 'Contra alguien que apuesta fuerte en esta mesa, ganas esto:',
          mano: m('8d 3c'), mesa: m('As Kh 9s'), victoria: 0.09, empate: 0.01,
          pie: 'Nueve de cada cien. Pagar es regalar fichas.' },
        { tipo: 'acciones', resaltar: 'retirarse', texto: 'Así que aquí se suelta y ya está.',
          pie: 'Retirarse no es rendirse: es ahorrar.' },
        { tipo: 'texto', texto: 'Aquí no se pierde dinero de verdad, así que aprovecha para equivocarte: es gratis.' },
      ],
      terminos: ['proyecto'],
      practica: {
        tipo: 'decision',
        mano: () => ({
          calle: 'flop',
          condicion: { nombre: 'nada de nada, y que se note', cumple: (mano, mesa) => {
            const valores = [...mesa].map((c) => c >> 2)
            const palos = [...mesa].map((c) => c & 3)
            const mesaLimpia = new Set(valores).size === valores.length
            const sinPareja = !mano.some((c) => valores.includes(c >> 2)) && (mano[0] >> 2) !== (mano[1] >> 2)
            const sinColor = !((mano[0] & 3) === (mano[1] & 3) && palos.filter((p) => p === (mano[0] & 3)).length >= 2)
            const bajas = (mano[0] >> 2) < 9 && (mano[1] >> 2) < 9
            return mesaLimpia && sinPareja && sinColor && bajas
          } },
          bote: 120,
          paraPagar: 90,
          contexto: 'El rival ha apostado fuerte en el flop y tú no has ligado nada.',
          exigencia: 'basica',
        }),
      },
      accionEsperada: 'retirarse',
      dominio: 3,
      minimoManos: 3,
      maximoManos: 8,
      ayuda: 'siempre',
      exigencia: 'basica',
    }),
  ],
}
