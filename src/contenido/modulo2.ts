import type { Aleatorio } from '../motor/aleatorio'
import { barajaCompleta, barajar } from '../motor/cartas'
import type { Carta } from '../motor/cartas'
import type { Modulo, PreguntaTest } from '../juego/lecciones'
import { leccion } from '../juego/lecciones'
import { tenerProyectoDeColor, tenerProyectoDeEscalera, alguna } from '../juego/practica'

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
      explicacion: [
        'Cuando el juego dice que ganas el **30%**, no está prediciendo esta mano. Está diciendo que si esta misma situación se repitiera mil veces, ganarías unas trescientas.',
        'Por eso una buena decisión puede terminar en derrota. No te equivocaste: te tocó una de las siete.',
        'Y al revés: puedes pagar fatal y ganar. Eso no lo convierte en una buena jugada, solo en una jugada con suerte. **Aquí los puntos van por la decisión, no por el resultado.**',
        'Todo el juego se apoya en esta idea. Si te la crees, ya juegas mejor que mucha gente que lleva años.',
      ],
      terminos: ['equity'],
      practica: {
        tipo: 'test',
        pregunta: (azar) => {
          const preguntas: PreguntaTest[] = [
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
          ]
          return preguntas[azar.entero(preguntas.length)]
        },
      },
      dominio: 3,
      minimoManos: 3,
      maximoManos: 9,
    }),

    leccion({
      id: 'm2-l2',
      modulo: 2,
      titulo: 'Los outs: cuántas cartas te sirven',
      idea: 'Los outs son las cartas que todavía pueden salir y te dan la mano ganadora. Se cuentan, no se intuyen.',
      explicacion: [
        'Si te faltan cartas para completar tu mano, lo primero es **contar cuántas te valen**. A esas se las llama **outs**.',
        'Ejemplo: tienes cuatro cartas de un palo y te falta la quinta para el color. De cada palo hay 13. Estás viendo 4. Quedan **9 outs**.',
        'Otro: cuatro cartas seguidas abiertas por los dos lados, como 6-7-8-9. Te sirven los 5 y los 10: cuatro de cada uno, **8 outs**.',
        'Si la escalera es por dentro (6-7-_-9-10, te falta el 8), solo te sirven los cuatro ochos: **4 outs**. La mitad, y por eso vale la mitad.',
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
      explicacion: [
        'En la mesa no hay calculadora, así que hay un truco que se usa desde siempre y se acerca muchísimo.',
        'Si quedan **dos cartas** por salir (estás en el flop): multiplica tus outs por **4**. Nueve outs ≈ 36%.',
        'Si queda **una** (estás en el turn): multiplica por **2**. Esos mismos nueve outs ≈ 18%. Fíjate: **la mitad**. Una carta menos, la mitad de posibilidades.',
        'No es exacto, pero se queda a un par de puntos del número de verdad. Para decidir, sobra.',
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
      explicacion: [
        'Tienes cuatro cartas del mismo palo o una escalera a medias: ahora mismo tu mano **no vale nada**. Pero tienes outs, y encima quedan dos cartas por salir.',
        'Si seguir cuesta poco comparado con lo que hay en el bote, esa mano **gana fichas a la larga** aunque hoy la pierdas.',
        'Va a resultarte raro poner fichas con una mano que no vale nada. Es correcto: no pagas por lo que tienes, pagas por lo que puedes tener.',
        'Aquí **pagar y subir valen las dos**, y muchas veces subir gana todavía más, porque además de tus outs puedes llevarte el bote si se retira. Eso lo verás en el módulo 7. Lo que no vale es retirarse.',
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
      explicacion: [
        'Misma mano que en la lección anterior: cuatro cartas del mismo palo, 36% de mejorar.',
        'Pero ahora el rival apuesta **más que el bote entero**. Para ganar 100 tienes que poner 150, y solo lo consigues un tercio de las veces.',
        'Esa cuenta no sale. Y fíjate en lo importante: **tu mano es idéntica**. Lo único que cambió fue lo que te piden por seguir.',
        'Aquí está el error más caro del que empieza: enamorarse del proyecto y pagar cualquier precio por él.',
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
