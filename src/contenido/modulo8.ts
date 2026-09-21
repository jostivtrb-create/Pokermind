import type { Modulo, PreguntaTest } from '../juego/lecciones'
import { leccion } from '../juego/lecciones'
import { manoSolida } from '../juego/practica'

/**
 * MÓDULO 8 · Fichas cortas y torneo.
 *
 * Lo que cambia cuando las ciegas empiezan a comerte: con pocas fichas ya no se
 * juega igual, y esperar la mano perfecta es la forma más común de quedar el
 * último. Es el módulo que conecta el curso con el modo libre.
 */
export const MODULO_8: Modulo = {
  numero: 8,
  titulo: 'Fichas cortas y torneo',
  resumen: 'Qué cambia cuando las ciegas te comen, el todo-in y la presión de la eliminación.',
  lecciones: [
    leccion({
      id: 'm8-l1',
      modulo: 8,
      titulo: 'Cuando las ciegas te comen',
      idea: 'Con pocas fichas el tiempo juega en tu contra: esperar una mano mejor cuesta fichas cada vuelta.',
      explicacion: [
        'En un torneo las ciegas **suben**. Lo que al principio era una apuesta pequeña, más tarde es un mordisco a tu montón.',
        'Cuando te quedan pocas fichas —digamos, menos de diez veces la ciega grande— cada vuelta de mesa te cuesta una parte importante de lo que tienes.',
        'Por eso, con fichas cortas se juegan **más** manos, no menos. Esperar a que te toquen ases es cómodo... y te deja sin fichas antes de que lleguen.',
        'Es lo contrario de lo que pide el instinto, y por eso hay que practicarlo.',
      ],
      terminos: ['ciegas', 'todoIn'],
      practica: {
        tipo: 'test',
        pregunta: (azar) => {
          const preguntas: PreguntaTest[] = [
            {
              enunciado: 'Te quedan 8 veces la ciega grande. ¿Qué haces?',
              opciones: [
                { texto: 'Jugar más manos, buscando meter mis fichas con algo decente', correcta: true, porQue: 'Cada vuelta te come fichas. Con pocas, hay que elegir un buen momento pronto, no el momento perfecto tarde.' },
                { texto: 'Esperar a una mano muy buena', porQue: 'Mientras esperas, las ciegas te dejan sin nada que apostar cuando por fin llegue.' },
                { texto: 'Pagar muchas manos baratas para ver flops', porQue: 'Con fichas cortas no hay "barato": pagar y soltar es la forma más rápida de desaparecer.' },
              ],
            },
            {
              enunciado: '¿Por qué con fichas cortas se prefiere subir a todo-in antes que pagar?',
              opciones: [
                { texto: 'Porque así puedo ganar el bote sin ver más cartas', correcta: true, porQue: 'Con pocas fichas, que se retiren ya es una victoria: recuperas las ciegas sin jugarte nada más.' },
                { texto: 'Porque es más emocionante', porQue: 'La emoción no es un criterio; el valor esperado sí.' },
                { texto: 'Porque pagando nunca se gana', porQue: 'Pagar está bien en muchas situaciones, pero con fichas cortas te deja jugando a ciegas el resto de la mano.' },
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
      id: 'm8-l2',
      modulo: 8,
      titulo: 'Todo-in y botes paralelos',
      idea: 'Si te quedas sin fichas sigues en la mano, pero solo puedes ganar la parte del bote a la que llegaste a poner.',
      explicacion: [
        'Ir **todo-in** es apostar todo lo que te queda. A partir de ahí ya no decides nada: se reparten las cartas que falten y se ve quién gana.',
        'Si otros dos siguen apostando después de tu todo-in, esas fichas van a un **bote paralelo** al que tú no puedes aspirar: no llegaste a poner tanto.',
        'O sea: puedes ganar tu parte y que otro se lleve el resto. No es injusto, es lo justo — solo se gana lo que se arriesgó.',
        'Saber esto evita un susto muy típico: ganar la mano y ver que el montón que te llevas es más pequeño de lo que había en la mesa.',
      ],
      terminos: ['todoIn', 'botePartido'],
      practica: {
        tipo: 'test',
        pregunta: (azar) => {
          const preguntas: PreguntaTest[] = [
            {
              enunciado: 'Vas todo-in con 100. Otros dos siguen apostando y meten 400 más cada uno. ¿A cuánto puedes aspirar?',
              opciones: [
                { texto: 'A 300: mis 100 y 100 de cada uno de ellos', correcta: true, porQue: 'Solo se gana lo que se arriesgó. El resto va a un bote paralelo entre los dos que sí lo pusieron.' },
                { texto: 'A todo el bote, porque tengo la mejor mano', porQue: 'La mejor mano gana lo que haya en tu parte, no lo que apostaron otros después de que te quedaras sin fichas.' },
                { texto: 'A nada: quedarse sin fichas es quedar eliminado', porQue: 'No: sigues en la mano hasta el final. Lo que no puedes es apostar más.' },
              ],
            },
            {
              enunciado: 'Estás todo-in y quedan dos calles por salir. ¿Qué decisiones te quedan?',
              opciones: [
                { texto: 'Ninguna: solo se reparten las cartas', correcta: true, porQue: 'Con todas tus fichas dentro ya no hay nada que decidir. Por eso la decisión de ir todo-in hay que pensarla bien antes.' },
                { texto: 'Puedo retirarme si sale mal el turn', porQue: 'No se puede retirar lo ya apostado: esas fichas están en el bote.' },
                { texto: 'Puedo pedir más fichas', porQue: 'En un torneo no se recompra a mitad de mano.' },
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
      id: 'm8-l3',
      modulo: 8,
      titulo: 'Con fichas cortas, se empuja',
      idea: 'Con pocas fichas y una mano decente, meterlas todas gana más que pagar y jugar a ciegas.',
      explicacion: [
        'Te quedan pocas fichas y tienes una mano razonable. Pagar te deja con casi nada y tendrás que decidir a ciegas en el flop.',
        'Meterlas todas hace dos cosas a la vez: puedes llevarte las ciegas sin ver una carta, y si te pagan, sigues teniendo tu porcentaje.',
        'Esa suma —lo que ganas cuando se retiran **más** lo que ganas cuando te pagan— es lo que hace que empujar sea la mejor jugada con fichas cortas.',
      ],
      terminos: ['todoIn'],
      practica: {
        tipo: 'decision',
        mano: () => ({
          calle: 'preflop',
          condicion: manoSolida,
          bote: 90,
          paraPagar: 40,
          tusFichas: 220,
          fichasRival: 900,
          contexto: 'Ciegas altas y a ti te quedan pocas fichas. Alguien ha subido y tienes una mano razonable.',
          rangoRival: '22+, A2s+, K8s+, Q9s+, J9s+, T8s+, A7o+, KTo+, QTo+, JTo',
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

    leccion({
      id: 'm8-l4',
      modulo: 8,
      titulo: 'La presión de quedar fuera',
      idea: 'En un torneo no todas las fichas valen lo mismo: las últimas valen mucho más que las primeras.',
      explicacion: [
        'En una partida normal, perder 100 fichas y ganar 100 fichas se compensan. En un torneo **no**.',
        'Si pierdes las últimas, te vas a casa. No hay forma de recuperarlas. Por eso arriesgar tu montón entero con una ventaja pequeña suele ser peor de lo que dice la cuenta a secas.',
        'Al revés, cuando tienes muchas fichas puedes apretar a los que van cortos: para ellos cada mano es su vida, y para ti no.',
        'Es la única parte del juego donde la cuenta de fichas no manda sola. Y es justo lo que vas a notar en el modo libre cuando queden dos.',
      ],
      terminos: [],
      practica: {
        tipo: 'test',
        pregunta: (azar) => {
          const preguntas: PreguntaTest[] = [
            {
              enunciado: 'Quedan tres jugadores y tú eres el que más fichas tiene. ¿Cómo cambia eso tu juego?',
              opciones: [
                { texto: 'Puedo presionar más: para ellos cada mano es su torneo, para mí no', correcta: true, porQue: 'Tus fichas aguantan un error; las suyas no. Esa diferencia vale dinero.' },
                { texto: 'Debo jugar muy apretado para conservar la ventaja', porQue: 'Jugar a no perder con la mayor pila es la forma de acabar siendo el que va corto.' },
                { texto: 'Da igual: las fichas son fichas', porQue: 'En un torneo no: las últimas valen mucho más que las primeras, porque con ellas te vas.' },
              ],
            },
            {
              enunciado: 'Vas segundo en fichas y te ofrecen jugarte todo con una ventaja mínima. ¿Qué es lo sensato?',
              opciones: [
                { texto: 'Pensármelo: una ventaja mínima no compensa arriesgar el torneo entero', correcta: true, porQue: 'Es lo único del póker donde la cuenta de fichas no decide sola: perder todas tiene un coste extra.' },
                { texto: 'Siempre sí: si tengo ventaja, adelante', porQue: 'A la larga sí, pero en un torneo no hay larga: si te vas, se acabó.' },
                { texto: 'Siempre no: nunca arriesgar todo', porQue: 'Nunca arriesgar también pierde, porque las ciegas te comen igual.' },
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
  ],
}
