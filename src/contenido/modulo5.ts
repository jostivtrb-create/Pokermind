import type { Aleatorio } from '../motor/aleatorio'
import type { Modulo, PreguntaTest } from '../juego/lecciones'
import { leccion } from '../juego/lecciones'
import { manoPremium, manoSolida } from '../juego/practica'
import { FUERZA_PREFLOP } from '../motor/datos/fuerzaPreflop'

/**
 * MÓDULO 5 · Manos iniciales y rangos.
 *
 * Aquí el jugador deja de pensar "¿qué tengo?" y empieza a pensar "¿qué se juega
 * desde aquí?". Es el puente hacia leer al rival: para entender su rango primero
 * hay que tener uno propio.
 */

/** Compara dos manos iniciales usando la tabla que generó el propio motor. */
function cualManoEsMejor(azar: Aleatorio): PreguntaTest {
  const i = azar.entero(FUERZA_PREFLOP.length)
  let j = azar.entero(FUERZA_PREFLOP.length)
  // Que no estén pegadas en la tabla: si no, la pregunta es una moneda al aire.
  let vueltas = 0
  while (Math.abs(i - j) < 25 && vueltas++ < 50) j = azar.entero(FUERZA_PREFLOP.length)

  const [claseA, equityA] = FUERZA_PREFLOP[i]
  const [claseB, equityB] = FUERZA_PREFLOP[j]
  const ganaA = equityA > equityB
  const nombre = (clase: string) =>
    clase.length === 2
      ? `pareja de ${clase[0]}`
      : `${clase[0]}${clase[1]} ${clase[2] === 's' ? 'del mismo palo' : 'de distinto palo'}`

  return {
    enunciado: '¿Con cuál de estas dos manos preferirías empezar?',
    opciones: [
      {
        texto: nombre(claseA),
        correcta: ganaA,
        porQue: `${nombre(claseA)} gana el ${(equityA * 100).toFixed(0)}% contra una mano cualquiera; ${nombre(claseB)}, el ${(equityB * 100).toFixed(0)}%.`,
      },
      {
        texto: nombre(claseB),
        correcta: !ganaA,
        porQue: `${nombre(claseB)} gana el ${(equityB * 100).toFixed(0)}% contra una mano cualquiera; ${nombre(claseA)}, el ${(equityA * 100).toFixed(0)}%.`,
      },
    ],
  }
}

export const MODULO_5: Modulo = {
  numero: 5,
  titulo: 'Manos iniciales y rangos',
  resumen: 'Qué se juega desde cada silla, y por qué se piensa en conjuntos de manos y no en cartas sueltas.',
  lecciones: [
    leccion({
      id: 'm5-l1',
      modulo: 5,
      titulo: 'Con qué manos merece la pena entrar',
      idea: 'No todas las manos valen: de las 169 posibles, la mayoría pierden fichas si las juegas.',
      pasos: [
        { tipo: 'rango', rango: '100%', texto: 'Estas son las **169 manos** con las que puedes empezar.',
          pie: 'A♠K♠ y A♥K♥ son la misma cosa antes del flop: "AK del mismo palo".' },
        { tipo: 'rango', rango: '5%', texto: 'Esto es el **5% mejor**: las manos con las que cualquiera juega.' },
        { tipo: 'rango', rango: '40%', texto: 'Y esto, el **40%**: lo máximo que se abre, y solo desde el botón.',
          pie: 'Todo lo blanco se tira antes de ver una sola carta de la mesa.' },
        { tipo: 'texto', texto: 'Tirar la mayoría de las manos no es ser cobarde: es que jugarlas cuesta dinero.' },
      ],
      terminos: ['rango', 'parejaServida', 'notacion'],
      practica: { tipo: 'test', pregunta: (azar) => cualManoEsMejor(azar) },
      dominio: 4,
      minimoManos: 4,
      maximoManos: 12,
    }),

    leccion({
      id: 'm5-l2',
      modulo: 5,
      titulo: 'Pensar en rangos, no en cartas',
      idea: 'No adivines qué tiene el rival: piensa qué PUEDE tener, que es un conjunto de manos y se puede calcular.',
      pasos: [
        { tipo: 'rango', rango: '77+, ATs+, KJs+, QJs, AQo+',
          texto: 'El rival sube desde primera posición. **Esto** es lo que puede tener.',
          pie: 'No una mano: un conjunto de manos. Eso es un rango.' },
        { tipo: 'rango', rango: 'AA, KK',
          texto: 'Preguntarse "¿tendrá ases?" no sirve: son solo dos casillas de todas esas.',
          pie: 'Los ases salen una de cada 221 manos.' },
        { tipo: 'porcentaje', texto: 'Contra el rango entero sí se puede calcular. Por ejemplo, tus JJ ganan esto:',
          victoria: 0.43, empate: 0.01 },
        { tipo: 'texto', texto: 'Contra un rango puedes calcular. Contra una corazonada, no. Todo este juego se apoya en esa diferencia.' },
      ],
      terminos: ['rango'],
      practica: {
        tipo: 'test',
        pregunta: (azar) => {
          const preguntas: PreguntaTest[] = [
            {
              enunciado: 'El rival sube desde primera posición. ¿Qué es lo más útil que puedes pensar?',
              opciones: [
                { texto: 'Que tiene una de unas veinte manos fuertes', correcta: true, porQue: 'Eso es un rango, y con un rango se puede calcular tu porcentaje de verdad.' },
                { texto: 'Que tiene ases', porQue: 'Los ases son solo una de las manos posibles, y de las más raras: salen una de cada 221 veces.' },
                { texto: 'Que va de farol', porQue: 'Desde primera posición casi nadie abre de farol. Suponerlo sale carísimo.' },
              ],
            },
            {
              enunciado: '¿Por qué es mejor pensar en rangos que en manos concretas?',
              opciones: [
                { texto: 'Porque contra un conjunto de manos se puede calcular un porcentaje', correcta: true, porQue: 'Y con ese porcentaje ya puedes compararlo con el precio del bote.' },
                { texto: 'Porque así aciertas siempre lo que tiene', porQue: 'Nunca aciertas lo que tiene: aciertas el conjunto, que es lo que hace falta.' },
                { texto: 'Porque los rangos son más fáciles de recordar', porQue: 'No es cuestión de memoria, es que permiten calcular.' },
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
      id: 'm5-l3',
      modulo: 5,
      titulo: 'Con una mano sólida se entra',
      idea: 'Las manos buenas se juegan desde cualquier silla, y se juegan subiendo, no pagando.',
      pasos: [
        { tipo: 'rango', rango: '77+, A9s+, KTs+, QTs+, JTs, AJo+, KQo',
          texto: 'Con una de **estas** manos entras desde cualquier silla.' },
        { tipo: 'acciones', resaltar: 'subir', texto: 'Y se entra **subiendo**, no pagando.',
          pie: 'Al subir echas a las manos regulares, y si te pagan sabes que el que queda tiene algo.' },
        { tipo: 'texto', texto: 'Entrar pagando invita a todos a ver el flop barato, y cuantos más haya, más fácil es que alguno te pase por encima.' },
      ],
      terminos: ['rango', 'subir'],
      practica: {
        tipo: 'decision',
        mano: () => ({
          calle: 'preflop',
          condicion: manoSolida,
          bote: 30,
          paraPagar: 20,
          posicion: 'boton',
          contexto: 'Nadie ha subido todavía y tú tienes una mano de las buenas.',
          rangoRival: '22+, A2s+, K8s+, Q9s+, J9s+, T8s+, A7o+, KTo+, QTo+, JTo',
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
      id: 'm5-l4',
      modulo: 5,
      titulo: 'Con una mano de las grandes se resube',
      idea: 'Con ases, reyes o AK no se paga: se vuelve a subir, para que el bote crezca mientras llevas ventaja.',
      pasos: [
        { tipo: 'rango', rango: 'JJ+, AKs, AKo', texto: 'Te toca una de **las grandes** y alguien ha subido antes.' },
        { tipo: 'porcentaje', texto: 'Contra el rango con el que la gente sube, tus ases ganan esto:',
          victoria: 0.83, empate: 0.01, pie: 'Más de cuatro de cada cinco veces.' },
        { tipo: 'fichas', texto: 'Cuando llevas esa ventaja, quieres que haya **más** fichas en el bote, no menos.',
          montones: [
            { nombre: 'Si pagas', fichas: 70, color: 'var(--azul)' },
            { nombre: 'Si resubes', fichas: 180, color: 'var(--verde)' },
          ],
          pie: 'Cada ficha que entra es tuya cuatro de cada cinco veces.' },
        { tipo: 'texto', texto: 'Y si se retira, tampoco pasa nada: te llevas lo que había. Lo que no puedes es jugar un bote pequeño con la mejor mano.' },
      ],
      terminos: ['valor'],
      practica: {
        tipo: 'decision',
        mano: () => ({
          calle: 'preflop',
          condicion: manoPremium,
          bote: 50,
          paraPagar: 30,
          contexto: 'Un rival ha subido antes que tú y te ha tocado una de las manos gordas.',
          rangoRival: '22+, A2s+, K9s+, Q9s+, J9s+, T9s, A8o+, KTo+, QTo+',
          exigencia: 'intermedia',
        }),
      },
      accionEsperada: 'subir',
      dominio: 3,
      minimoManos: 3,
      maximoManos: 10,
      ayuda: 'alPrincipio',
      exigencia: 'intermedia',
    }),
  ],
}
