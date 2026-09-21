import type { Aleatorio } from '../motor/aleatorio'
import { barajaCompleta, barajar, manoDeCodigo } from '../motor/cartas'
import type { Carta } from '../motor/cartas'
import { describirMano, evaluar, mejoresCinco } from '../motor/evaluador'
import type { Modulo, PreguntaTest } from '../juego/lecciones'
import { leccion } from '../juego/lecciones'

/**
 * MÓDULO 1 · Las reglas y la mesa.
 *
 * El que entra aquí no ha jugado nunca. Sale sabiendo qué gana a qué, cómo se
 * llama cada cosa y qué significan los tres botones. Es el único módulo que se
 * practica respondiendo en vez de apostando: no se puede pedir una decisión a
 * quien todavía no sabe qué es una ciega.
 *
 * Terminar este módulo es lo que abre el modo libre (D34).
 */

/** Reparte dos manos al azar y pregunta cuál gana. Nunca sale la misma pregunta. */
function cualGana(azar: Aleatorio): PreguntaTest {
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
      enunciado: 'Con estas cinco cartas en la mesa, ¿quién gana?',
      mesa,
      mano: manoA,
      manoB,
      opciones: [
        {
          texto: 'Gana la mano de arriba',
          correcta: ganaA,
          porQue: `Arriba hay ${describirMano([...manoA, ...mesa])} y abajo ${describirMano([...manoB, ...mesa])}.`,
        },
        {
          texto: 'Gana la mano de abajo',
          correcta: !ganaA,
          porQue: `Abajo hay ${describirMano([...manoB, ...mesa])} y arriba ${describirMano([...manoA, ...mesa])}.`,
        },
      ],
    }
  }
  return cualGana(azar)
}

/**
 * Pregunta cómo se llama la mano que se ha formado.
 *
 * Solo vale si en la mano final entra al menos una de SUS cartas. Si la mejor
 * mano está entera en la mesa, la respuesta correcta suena a trampa para alguien
 * que acaba de empezar ("pareja" cuando la pareja no es suya), y confundir en la
 * lección 1 es la mejor forma de que alguien se vaya.
 */
function comoSeLlama(azar: Aleatorio): PreguntaTest {
  let mesa: Carta[] = []
  let mano: Carta[] = []
  for (let intento = 0; intento < 300; intento++) {
    const baraja = barajar(barajaCompleta(), azar)
    mesa = baraja.slice(0, 5)
    mano = baraja.slice(5, 7)
    const cinco = mejoresCinco([...mano, ...mesa])
    if (cinco.some((c) => mano.includes(c))) break
  }
  const nombre = describirMano([...mano, ...mesa])
  const categoria = nombre.split(' de ')[0].split(' al ')[0]

  const todas = ['carta alta', 'pareja', 'doble pareja', 'trío', 'escalera', 'color', 'full', 'póker']
  const otras = todas.filter((c) => c !== categoria).sort(() => azar.siguiente() - 0.5).slice(0, 2)
  const opciones = [categoria, ...otras]
    .sort(() => azar.siguiente() - 0.5)
    .map((texto) => ({
      texto: texto[0].toUpperCase() + texto.slice(1),
      correcta: texto === categoria,
      porQue: texto === categoria ? `Exacto: es ${nombre}.` : `No: lo que hay aquí es ${nombre}.`,
    }))

  return { enunciado: '¿Qué mano tienes aquí, juntando tus cartas con las de la mesa?', mesa, mano, opciones }
}

const m = (texto: string): Carta[] => manoDeCodigo(texto)

export const MODULO_1: Modulo = {
  numero: 1,
  titulo: 'Las reglas y la mesa',
  resumen: 'De no haber tocado una carta a entender una mano entera y saber cómo se llama cada cosa.',
  lecciones: [
    leccion({
      id: 'm1-l1',
      modulo: 1,
      titulo: 'De qué va una mano de póker',
      idea: 'Tienes dos cartas tuyas y hay cinco en la mesa para todos: tu mano son las cinco mejores de esas siete.',
      explicacion: [
        'En el póker que vas a aprender —Texas Hold\'em, el que se juega en todas partes— te dan **dos cartas tapadas** que solo ves tú.',
        'En el centro de la mesa van saliendo **cinco cartas boca arriba** que sirven para todos.',
        'Tu mano final son las **cinco mejores** que puedas formar juntando las tuyas con las de la mesa. Puedes usar las dos, una o ninguna.',
        'Gana quien tenga la mejor mano de cinco... o quien consiga que los demás se retiren antes. Las dos formas valen, y la segunda es la que más se usa.',
      ],
      terminos: ['flop', 'showdown', 'bote'],
      practica: {
        tipo: 'test',
        pregunta: (azar, numero) => (numero % 2 === 1 ? comoSeLlama(azar) : cualGana(azar)),
      },
      dominio: 3,
      minimoManos: 3,
      maximoManos: 8,
    }),

    leccion({
      id: 'm1-l2',
      modulo: 1,
      titulo: 'Qué gana a qué',
      idea: 'El orden de las manos es siempre el mismo: cuanto más difícil es que te salga, más gana.',
      explicacion: [
        'De menos a más: **carta alta**, **pareja**, **doble pareja**, **trío**, **escalera**, **color**, **full**, **póker** y **escalera de color**.',
        'No hay que aprendérselo de memoria hoy: tiene una lógica. Cuanto más raro es que te salga, más gana. Es más difícil juntar cinco del mismo palo (color) que dos cartas iguales (pareja), y por eso el color gana.',
        'Cuando dos tienen lo mismo, decide la carta más alta: pareja de reyes gana a pareja de sietes.',
        'Ojo con la escalera A-2-3-4-5: el as vale por abajo y es la **escalera más baja**, no la más alta. Es el error clásico del principiante.',
      ],
      terminos: ['pareja', 'trio', 'color', 'escalera', 'full', 'poker'],
      practica: { tipo: 'test', pregunta: (azar) => cualGana(azar) },
      dominio: 4,
      minimoManos: 4,
      maximoManos: 12,
    }),

    leccion({
      id: 'm1-l3',
      modulo: 1,
      titulo: 'Los tres botones',
      idea: 'En cada turno solo hay tres cosas que puedes hacer: retirarte, pagar o subir.',
      explicacion: [
        '**Retirarte** (también se dice *foldear*) es soltar las cartas y salirte de la mano. Pierdes lo que ya hubieras puesto, pero ni una ficha más.',
        '**Pagar** (o *igualar*, o *callear*) es poner las mismas fichas que ha puesto el rival para seguir viendo cartas. Si nadie ha apostado, pagar no cuesta nada y se llama **pasar**.',
        '**Subir** es poner más de lo que hay que poner. Con eso obligas a los demás a pagar más o a retirarse.',
        'Todo el juego se reduce a elegir bien entre estas tres cosas, una y otra vez. Eso es exactamente lo que vas a entrenar aquí.',
      ],
      terminos: ['retirarse', 'pagar', 'pasar', 'subir'],
      practica: {
        tipo: 'test',
        pregunta: (azar) => {
          const preguntas: PreguntaTest[] = [
            {
              enunciado: 'El rival apuesta 50 y tú crees que tu mano no vale nada. ¿Qué haces?',
              opciones: [
                { texto: 'Retirarme', correcta: true, porQue: 'Bien: sueltas la mano y no pones ni una ficha más.' },
                { texto: 'Pagar', porQue: 'Pagar sería poner 50 para seguir en una mano que crees perdida.' },
                { texto: 'Subir', porQue: 'Subir con una mano que no vale nada es farolear, y eso se aprende mucho más adelante.' },
              ],
            },
            {
              enunciado: 'Nadie ha apostado y tú tampoco quieres apostar. ¿Cómo se llama seguir en la mano sin poner nada?',
              opciones: [
                { texto: 'Pasar', correcta: true, porQue: 'Eso es: pasar (o *check*). Sigues dentro y gratis.' },
                { texto: 'Retirarme', porQue: 'Retirarte sería irte de la mano... ¡y podías seguir gratis! Es el error más caro de los principiantes.' },
                { texto: 'Pagar', porQue: 'Pagar es igualar una apuesta, y aquí no hay ninguna que igualar.' },
              ],
            },
            {
              enunciado: 'Tienes la mejor mano posible y quieres que el rival ponga más fichas. ¿Qué haces?',
              opciones: [
                { texto: 'Subir', correcta: true, porQue: 'Subes para que el bote crezca mientras vas ganando.' },
                { texto: 'Retirarme', porQue: 'Retirarte con la mejor mano es regalar el bote.' },
                { texto: 'Pasar siempre', porQue: 'A veces pasar es lo mejor (ya lo verás), pero por norma con la mejor mano se apuesta.' },
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
      idea: 'Dos jugadores ponen fichas antes de ver las cartas, y ese turno rota en cada mano para que sea justo.',
      explicacion: [
        'Si nadie pusiera nada, lo listo sería esperar sentado a que te tocaran ases. Para que eso no pase, en cada mano hay dos apuestas obligatorias: la **ciega pequeña** y la **ciega grande**.',
        'Se ponen **antes de ver las cartas**. Por eso siempre hay algo que ganar, y por eso hay que jugar.',
        'El **botón** es la ficha que marca quién reparte. Rota una silla a la izquierda en cada mano, y con ella rotan las ciegas: así todos pasan por todos los sitios.',
        'El del botón es el que **habla el último** después del flop, y ese es el mejor sitio de la mesa. Verás por qué en el módulo 4.',
      ],
      terminos: ['ciegas', 'boton', 'posicion'],
      practica: {
        tipo: 'test',
        pregunta: (azar) => {
          const preguntas: PreguntaTest[] = [
            {
              enunciado: '¿Cuándo se ponen las ciegas?',
              opciones: [
                { texto: 'Antes de repartir las cartas', correcta: true, porQue: 'Eso es: son a ciegas, de ahí el nombre. Se pone sin saber qué te van a dar.' },
                { texto: 'Después de ver tus dos cartas', porQue: 'No: si se pusieran después, nadie las pondría nunca con una mano mala.' },
                { texto: 'Solo cuando alguien apuesta', porQue: 'Las ciegas son obligatorias, no dependen de nadie.' },
              ],
            },
            {
              enunciado: 'El botón está en tu silla. En la mano siguiente, ¿dónde estará?',
              opciones: [
                { texto: 'En la silla de tu izquierda', correcta: true, porQue: 'Rota una silla a la izquierda en cada mano, y las ciegas van con él.' },
                { texto: 'Se queda donde está', porQue: 'Si se quedara, el mismo jugador tendría siempre la mejor posición.' },
                { texto: 'Va a quien ganó la mano', porQue: 'El botón no premia a nadie: solo marca el turno y rota siempre igual.' },
              ],
            },
            {
              enunciado: '¿Por qué es bueno hablar el último?',
              opciones: [
                { texto: 'Porque decides sabiendo lo que han hecho los demás', correcta: true, porQue: 'Información gratis en cada decisión. Es la ventaja más grande del póker.' },
                { texto: 'Porque te dan mejores cartas', porQue: 'Las cartas son las mismas en todas las sillas: lo que cambia es la información.' },
                { texto: 'Porque pagas menos ciegas', porQue: 'Todos pagan las mismas ciegas a lo largo de la vuelta.' },
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
      explicacion: [
        '**Antes del flop**: solo ves tus dos cartas. Primera ronda de apuestas.',
        '**El flop**: salen tres cartas comunes de golpe. Segunda ronda.',
        '**El turn**: sale la cuarta. Tercera ronda.',
        '**El river**: sale la quinta y última. Cuarta ronda, y después se enseñan las cartas.',
        'Cada carta nueva cambia quién va ganando. Por eso una decisión que era buena en el flop puede ser malísima en el river: no es la misma situación.',
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
                { texto: 'El turn', porQue: 'El turn es la cuarta carta: habría cuatro en la mesa.' },
                { texto: 'El river', porQue: 'El river es la quinta y última: habría cinco.' },
              ],
            },
            {
              enunciado: 'Hay cinco cartas en la mesa y ya se ha apostado. ¿Qué viene ahora?',
              mesa: m('As 7h 2d Kc 9s'),
              opciones: [
                { texto: 'Se enseñan las cartas y se decide quién gana', correcta: true, porQue: 'Después del river viene el showdown: ya no sale ninguna carta más.' },
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
      titulo: 'Tu primera decisión de verdad',
      idea: 'Con una mano perdida y una apuesta delante, retirarse no es rendirse: es ahorrar fichas.',
      explicacion: [
        'Ya sabes lo suficiente para decidir. Vamos con lo más importante y lo que más cuesta al principio: **tirar una mano mala**.',
        'Cuando tus cartas no ligan con nada de la mesa y el rival apuesta, pagar es tirar fichas a un bote que casi nunca vas a ganar.',
        'Aquí no pierdes dinero de verdad, así que aprovecha para equivocarte: es gratis y es justo para lo que está esto.',
      ],
      terminos: ['proyecto'],
      practica: {
        tipo: 'decision',
        mano: () => ({
          calle: 'flop',
          condicion: { nombre: 'nada de nada, y que se note', cumple: (mano, mesa) => {
            const valores = [...mesa].map((c) => c >> 2)
            const palos = [...mesa].map((c) => c & 3)
            // Mesa sin parejas: si la mesa lleva pareja, el juego anunciaría "tienes
            // pareja" y la lección diría "no has ligado nada". Las dos cosas serían
            // ciertas y aun así confundirían a quien acaba de empezar.
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
      dominio: 3,
      minimoManos: 3,
      maximoManos: 8,
      ayuda: 'siempre',
      exigencia: 'basica',
    }),
  ],
}
