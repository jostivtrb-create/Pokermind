import type { Aleatorio } from '../motor/aleatorio'
import { barajaCompleta, barajar } from '../motor/cartas'
import type { Carta } from '../motor/cartas'
import type { Modulo, PreguntaTest } from '../juego/lecciones'
import { leccion, testEntre } from '../juego/lecciones'
import { tenerProyectoDeColor, tenerProyectoDeEscalera, alguna } from '../juego/practica'
import { manoDeCodigo } from '../motor/cartas'

const m = (texto: string): Carta[] => manoDeCodigo(texto)

/**
 * MÓDULO 2 · Probabilidad básica.
 *
 * Aquí es donde el juego empieza a ser lo que prometió: los porcentajes dejan de
 * ser una sensación y pasan a ser una cuenta. Todo lo que viene después (el
 * precio del bote, los rangos, el valor esperado) se apoya en esto.
 */

/** Reparte un proyecto de color en el flop y pregunta cuántas cartas le sirven. */
function cuantosOuts(azar: Aleatorio): PreguntaTest {
  for (let intento = 0; intento < 500; intento++) {
    const baraja = barajar(barajaCompleta(), azar)
    const mano = baraja.slice(0, 2)
    const mesa = baraja.slice(2, 5)
    if (!tenerProyectoDeColor.cumple(mano as [Carta, Carta], mesa)) continue

    return {
      enunciado: 'Te falta una carta de este palo para tener color. ¿Cuántas cartas te sirven?',
      mesa,
      mano,
      opciones: [
        { texto: '9 cartas', correcta: true, porQue: 'Hay 13 de cada palo. Ves 4 (dos tuyas y dos de la mesa), así que quedan 9 escondidas que te dan color.' },
        { texto: '4 cartas', porQue: '4 son las de un valor concreto, como los cuatro reyes. De un palo hay muchas más.' },
        { texto: '13 cartas', porQue: '13 son todas las del palo, pero cuatro ya las estás viendo.' },
      ],
    }
  }
  return cuantosOuts(azar)
}

/** Pregunta cuánto vale esa cantidad de outs en porcentaje. */
function cuantoEsEnPorcentaje(azar: Aleatorio): PreguntaTest {
  const casos: Array<[number, number, string]> = [
    [9, 36, 'proyecto de color en el flop'],
    [8, 32, 'escalera abierta en el flop'],
    [4, 16, 'escalera por dentro en el flop'],
    [2, 8, 'buscar un trío con tu pareja servida'],
  ]
  const [outs, porcentaje, nombre] = casos[azar.entero(casos.length)]
  const falsas = [porcentaje / 2, porcentaje * 2].map((n) => Math.round(n))

  const opciones = [
    { texto: `Sobre un ${porcentaje}%`, correcta: true, porQue: `Con ${outs} outs y dos cartas por salir: ${outs} × 4 = ${porcentaje}%. Es la regla del 4.` },
    { texto: `Sobre un ${falsas[0]}%`, porQue: `Ese sería el número si solo quedara UNA carta por salir (${outs} × 2).` },
    { texto: `Sobre un ${falsas[1]}%`, porQue: 'Eso es el doble de lo que te toca: te estarías engañando a tu favor, que es como se pierden fichas.' },
  ]

  return {
    enunciado: `Tienes ${outs} outs (${nombre}) y quedan dos cartas por salir. ¿Cuántas veces de cada cien mejorarás?`,
    opciones: opciones.sort(() => azar.siguiente() - 0.5),
  }
}

export const MODULO_2: Modulo = {
  numero: 2,
  titulo: 'Probabilidad básica',
  resumen: 'Outs, la regla del 2 y el 4, y qué significa de verdad "ganas el 26%".',
  lecciones: [
    leccion({
      id: 'm2-l1',
      modulo: 2,
      titulo: 'Qué significa un porcentaje',
      idea: 'Un 30% no es "voy perdiendo": es que de cada diez veces así, tres las ganas. Y esas tres hay que cobrarlas.',
      pasos: [
        { tipo: 'porcentaje', texto: 'Cuando el juego dice que ganas el **30%**, no está prediciendo esta mano.',
          victoria: 0.3, pie: 'Dice que si esta situación se repitiera mil veces, ganarías unas trescientas.' },
        { tipo: 'porcentaje', texto: 'Por eso con un **70%** todavía pierdes tres de cada diez veces.',
          victoria: 0.7, pie: 'Cuando toca una de esas tres no te equivocaste: te tocó.' },
        { tipo: 'porcentaje', texto: 'Y al revés: puedes pagar con un **15%** y ganar. Eso es suerte, no acierto.',
          victoria: 0.15, pie: 'Ochenta y cinco de cada cien veces, esa jugada pierde fichas.' },
        { tipo: 'texto', texto: 'Por eso aquí **los puntos van por la decisión, no por el resultado**. Si te crees esto, ya juegas mejor que mucha gente que lleva años.' },
      ],
      terminos: ['equity'],
      practica: testEntre([
        {
          enunciado: 'El juego dice que ganas el 70% y pierdes la mano. ¿Qué pasó?',
          opciones: [
            { texto: 'Nada raro: el 30% también pasa', correcta: true, porQue: 'Tres de cada diez veces pierdes. Que toque una de esas no cambia que la decisión era buena.' },
            { texto: 'El cálculo estaba mal', porQue: 'El porcentaje no promete esta mano concreta, dice qué pasa a la larga.' },
            { texto: 'Tendría que haberme retirado', porQue: 'Retirarte con un 70% es regalar fichas. A la larga esa jugada gana mucho.' },
          ],
        },
        {
          enunciado: 'Pagas con un 15% de probabilidad y ganas la mano. ¿Fue buena jugada?',
          opciones: [
            { texto: 'No: tuve suerte', correcta: true, porQue: 'Con un 15% pierdes 85 de cada 100 veces. Ganar una no arregla la cuenta.' },
            { texto: 'Sí: gané, que es lo que cuenta', porQue: 'Si juzgas por el resultado, aprendes justo lo contrario de lo que deberías. Es la trampa que este juego intenta quitarte.' },
            { texto: 'Depende de las cartas que salieran', porQue: 'Las cartas que salieron ya no cambian lo que sabías al decidir.' },
          ],
        },
        {
          enunciado: '¿Cuál de estas frases es la correcta?',
          opciones: [
            { texto: 'Un 26% significa que gano una de cada cuatro veces, más o menos', correcta: true, porQue: 'Eso es exactamente lo que significa.' },
            { texto: 'Un 26% significa que esta mano la voy a perder', porQue: 'La perderás casi siempre, pero "casi siempre" no es "siempre": ese 26% también llega.' },
            { texto: 'Un 26% significa que la mano no vale nada', porQue: 'Un 26% puede valer mucho si pagar cuesta poco. Eso es el módulo siguiente.' },
          ],
        },
      ]),
      dominio: 3,
      minimoManos: 3,
      maximoManos: 9,
    }),

    leccion({
      id: 'm2-l2',
      modulo: 2,
      titulo: 'Los outs: cuántas cartas te sirven',
      idea: 'Los outs son las cartas que todavía pueden salir y te dan la mano ganadora. Se cuentan, no se intuyen.',
      pasos: [
        { tipo: 'outs', texto: 'Tienes cuatro corazones. Te falta **uno más** para el color.',
          mano: m('Ah Kh'), mesa: m('Qh 7h 2c'),
          outs: m('2h 3h 4h 5h 6h 8h 9h Th Jh'),
          pie: 'De cada palo hay 13 y estás viendo 4: quedan 9 que te valen. Eso son 9 outs.' },
        { tipo: 'outs', texto: 'Aquí te falta una carta por **cualquiera de los dos lados** de la escalera.',
          mano: m('9s 8h'), mesa: m('7d 6c 2s'),
          outs: m('Ts Th Td Tc 5s 5h 5d 5c'),
          pie: 'Te sirven los cuatro dieces y los cuatro cincos: 8 outs.' },
        { tipo: 'outs', texto: 'Y si la escalera es **por dentro**, solo vale una carta.',
          mano: m('9s 8h'), mesa: m('7d 5c 2s'),
          outs: m('6s 6h 6d 6c'),
          pie: 'Solo los cuatro seises: 4 outs. La mitad que antes, y por eso vale la mitad.' },
      ],
      terminos: ['outs', 'proyecto'],
      practica: { tipo: 'test', pregunta: (azar) => cuantosOuts(azar) },
      dominio: 3,
      minimoManos: 3,
      maximoManos: 10,
    }),

    leccion({
      id: 'm2-l3',
      modulo: 2,
      titulo: 'La regla del 2 y el 4',
      idea: 'Outs × 4 si quedan dos cartas, outs × 2 si queda una. Con eso tienes el porcentaje de cabeza.',
      pasos: [
        { tipo: 'outs', texto: 'Nueve outs y **dos cartas** por salir. En la mesa no hay calculadora.',
          mano: m('Ah Kh'), mesa: m('Qh 7h 2c'), outs: m('2h 3h 4h 5h 6h 8h 9h Th Jh') },
        { tipo: 'porcentaje', texto: 'Multiplica tus outs por **4**: 9 × 4 = 36.',
          victoria: 0.36, pie: 'El número de verdad es 35%. Para decidir, sobra.' },
        { tipo: 'porcentaje', texto: 'Si ya queda **una sola carta**, multiplica por **2**: 9 × 2 = 18.',
          victoria: 0.18, pie: 'Fíjate: una carta menos, la mitad de posibilidades.' },
        { tipo: 'texto', texto: 'Ese es todo el truco. Outs × 4 en el flop, outs × 2 en el turn.' },
      ],
      terminos: [],
      practica: { tipo: 'test', pregunta: (azar) => cuantoEsEnPorcentaje(azar) },
      dominio: 4,
      minimoManos: 4,
      maximoManos: 12,
    }),

    leccion({
      id: 'm2-l4',
      modulo: 2,
      titulo: 'Un proyecto barato no se suelta',
      idea: 'Con un proyecto bueno y una apuesta pequeña delante, lo único que no puedes hacer es retirarte.',
      pasos: [
        { tipo: 'outs', texto: 'Ahora mismo tu mano **no vale nada**. Pero tienes nueve cartas que te salvan.',
          mano: m('Ah Kh'), mesa: m('Qh 7h 2c'), outs: m('2h 3h 4h 5h 6h 8h 9h Th Jh') },
        { tipo: 'porcentaje', texto: 'Con dos cartas por salir, mejoras **más de un tercio** de las veces.',
          victoria: 0.36 },
        { tipo: 'precio', texto: 'Y seguir te cuesta muy poco comparado con lo que hay en el bote.',
          bote: 240, pagar: 40,
          pie: 'Ganas una de cada tres y te piden una de cada seis: sale a cuenta de sobra.' },
        { tipo: 'texto', texto: 'Aquí **pagar y subir valen las dos**, y muchas veces subir gana más. Lo que no vale es retirarse.' },
      ],
      terminos: ['proyecto', 'outs'],
      practica: {
        tipo: 'decision',
        mano: () => ({
          calle: 'flop',
          condicion: alguna(tenerProyectoDeColor, tenerProyectoDeEscalera),
          bote: 240,
          paraPagar: 40,
          contexto: 'El rival apuesta poco en el flop. Tú no tienes nada hecho, pero sí un buen proyecto.',
          rangoRival: '22+, A2s+, K9s+, Q9s+, J9s+, T9s, A8o+, KTo+, QTo+',
          exigencia: 'basica',
        }),
      },
      accionEsperada: 'seguir',
      dominio: 3,
      minimoManos: 3,
      maximoManos: 10,
      ayuda: 'alPrincipio',
      exigencia: 'basica',
    }),

    leccion({
      id: 'm2-l5',
      modulo: 2,
      titulo: 'Un proyecto caro se suelta',
      idea: 'El mismo proyecto, con una apuesta enorme delante, deja de salir a cuenta. Lo que cambia no es tu mano: es el precio.',
      pasos: [
        { tipo: 'outs', texto: 'Misma mano que antes: los mismos nueve outs.',
          mano: m('Ah Kh'), mesa: m('Qh 7h 2c 3d'), outs: m('2h 4h 5h 6h 8h 9h Th Jh 9d') },
        { tipo: 'porcentaje', texto: 'Pero ya solo queda **una carta**, así que mejoras la mitad de veces.',
          victoria: 0.18 },
        { tipo: 'precio', texto: 'Y ahora te piden **casi el doble del bote** por seguir.',
          bote: 100, pagar: 180,
          pie: 'Necesitarías ganar casi dos de cada tres veces. Tienes una de cada cinco.' },
        { tipo: 'texto', texto: 'Tu mano es idéntica. Lo único que cambió es **el precio**. Y con eso basta para soltarla.' },
      ],
      terminos: ['precioDelBote'],
      practica: {
        tipo: 'decision',
        mano: () => ({
          calle: 'turn',
          condicion: alguna(tenerProyectoDeColor, tenerProyectoDeEscalera),
          bote: 100,
          paraPagar: 180,
          tusFichas: 400,
          fichasRival: 400,
          contexto: 'El rival ha apostado casi el doble del bote en el turn. Sigues sin tener nada hecho.',
          rangoRival: '77+, ATs+, KJs+, QJs, AQo+',
          exigencia: 'basica',
        }),
      },
      accionEsperada: 'retirarse',
      dominio: 3,
      minimoManos: 3,
      maximoManos: 10,
      ayuda: 'alPrincipio',
      exigencia: 'basica',
    }),
  ],
}
