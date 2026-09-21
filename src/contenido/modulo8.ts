import type { Modulo } from '../juego/lecciones'
import { leccion, testEntre } from '../juego/lecciones'
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
      pasos: [
        { tipo: 'fichas', texto: 'Empiezas el torneo con fichas de sobra para esperar.',
          montones: [
            { nombre: 'Tus fichas', fichas: 1000, color: 'var(--verde)' },
            { nombre: 'Ciega grande', fichas: 20, color: 'var(--morado)' },
          ],
          pie: 'Cincuenta veces la ciega: puedes tirar manos toda la tarde.' },
        { tipo: 'fichas', texto: 'Pero las ciegas **suben**, y tus fichas no.',
          montones: [
            { nombre: 'Tus fichas', fichas: 800, color: 'var(--ambar)' },
            { nombre: 'Ciega grande', fichas: 120, color: 'var(--morado)' },
          ],
          pie: 'Ahora cada vuelta de mesa te cuesta una parte seria de lo que tienes.' },
        { tipo: 'fichas', texto: 'Y llega un momento en que esperar ya no es una opción.',
          montones: [
            { nombre: 'Tus fichas', fichas: 240, color: 'var(--rojo)' },
            { nombre: 'Ciega grande', fichas: 120, color: 'var(--morado)' },
          ],
          pie: 'Dos vueltas más y te quedas sin nada que apostar.' },
        { tipo: 'texto', texto: 'Por eso con fichas cortas se juegan **más** manos, no menos. Es lo contrario de lo que pide el instinto.' },
      ],
      terminos: ['ciegas', 'todoIn'],
      practica: testEntre([
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
        {
          enunciado: 'Con 50 veces la ciega grande puedes esperar y con 8 no. ¿Por qué?',
          opciones: [
            { texto: 'Porque cada vuelta cuesta lo mismo y con 8 eso ya es una parte enorme de lo que tengo', correcta: true, porQue: 'Las ciegas no suben ni bajan por lo que tú tengas: lo que cambia es cuánto pesan sobre tu montón.' },
            { texto: 'Porque con pocas fichas te reparten peores cartas', correcta: false, porQue: 'Las cartas no saben cuántas fichas tienes.' },
            { texto: 'Porque con pocas fichas hay que jugar más apretado todavía', correcta: false, porQue: 'Es justo al revés, y es lo que más cuesta creerse: con pocas fichas se juegan más manos.' },
          ],
        },
      ]),
      dominio: 3,
      minimoManos: 3,
      maximoManos: 9,
    }),

    leccion({
      id: 'm8-l2',
      modulo: 8,
      titulo: 'Todo-in y botes paralelos',
      idea: 'Si te quedas sin fichas sigues en la mano, pero solo puedes ganar la parte del bote a la que llegaste a poner.',
      pasos: [
        { tipo: 'fichas', texto: 'Vas **todo-in** con 100. Otros dos siguen apostando 500 cada uno.',
          montones: [
            { nombre: 'Tú', fichas: 100, color: 'var(--ambar)' },
            { nombre: 'Rival 1', fichas: 500, color: 'var(--azul)' },
            { nombre: 'Rival 2', fichas: 500, color: 'var(--azul)' },
          ] },
        { tipo: 'fichas', texto: 'El bote se parte: tú solo puedes aspirar a lo que llegaste a poner.',
          montones: [
            { nombre: 'Bote principal', fichas: 300, color: 'var(--verde)' },
            { nombre: 'Bote paralelo', fichas: 800, color: 'var(--texto-tenue)' },
          ],
          pie: 'El paralelo se lo juegan los otros dos. No es injusto: solo se gana lo que se arriesgó.' },
        { tipo: 'acciones', texto: 'Y con todas tus fichas dentro, ya no decides nada más.',
          pie: 'Se reparten las cartas que falten y se ve quién gana. Por eso esa decisión hay que pensarla antes.' },
      ],
      terminos: ['todoIn', 'botePartido'],
      practica: testEntre([
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
        {
          enunciado: 'Vas todo-in con 100, ganas la mano, y los otros dos habían metido 400 más cada uno. ¿Quién se lleva esos 800?',
          opciones: [
            { texto: 'El mejor de esos dos: ese bote se lo juegan entre ellos', correcta: true, porQue: 'Tú te llevas el bote principal, que es hasta donde llegaste a poner. El paralelo no era tuyo.' },
            { texto: 'Yo, porque tenía la mejor mano de los tres', correcta: false, porQue: 'La mejor mano gana el bote en el que estaba. Al paralelo no llegaste a entrar.' },
            { texto: 'Se reparte entre los tres', correcta: false, porQue: 'No se reparte: cada bote tiene su ganador entre los que lo pusieron.' },
          ],
        },
      ]),
      dominio: 3,
      minimoManos: 3,
      maximoManos: 9,
    }),

    leccion({
      id: 'm8-l3',
      modulo: 8,
      titulo: 'Con fichas cortas, se empuja',
      idea: 'Con pocas fichas y una mano decente, meterlas todas gana más que pagar y jugar a ciegas.',
      pasos: [
        { tipo: 'fichas', texto: 'Te quedan pocas fichas y alguien ha subido.',
          montones: [
            { nombre: 'Tus fichas', fichas: 220, color: 'var(--ambar)' },
            { nombre: 'Su subida', fichas: 60, color: 'var(--azul)' },
          ] },
        { tipo: 'porcentaje', texto: 'Con una mano razonable, si te pagan sigues teniendo tu parte.',
          victoria: 0.45, empate: 0.02 },
        { tipo: 'acciones', resaltar: 'subir', texto: 'Y si se retira, te llevas las ciegas **sin ver una carta**.',
          pie: 'Esa suma —lo que ganas cuando se van más lo que ganas cuando pagan— es lo que hace que empujar sea lo mejor.' },
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
      pasos: [
        { tipo: 'fichas', texto: 'En una partida normal, perder 100 y ganar 100 se compensan.',
          montones: [
            { nombre: 'Pierdes', fichas: 100, color: 'var(--rojo)' },
            { nombre: 'Ganas', fichas: 100, color: 'var(--verde)' },
          ] },
        { tipo: 'fichas', texto: 'En un torneo no: si pierdes **las últimas**, te vas a casa.',
          montones: [
            { nombre: 'Te quedan', fichas: 100, color: 'var(--rojo)' },
            { nombre: 'Si las pierdes', fichas: 0, color: 'var(--texto-tenue)' },
          ],
          pie: 'No hay forma de recuperarlas.' },
        { tipo: 'sillas', boton: 0, resaltar: 0, texto: 'Y al revés: con muchas fichas puedes apretar a los que van cortos.',
          nota: 'Para ellos cada mano es su torneo. Para ti, no.' },
        { tipo: 'texto', texto: 'Es la única parte del juego donde la cuenta de fichas no manda sola. Lo vas a notar en el modo libre cuando queden dos.' },
      ],
      terminos: [],
      practica: testEntre([
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
        {
          enunciado: '¿Por qué en un torneo las últimas fichas valen más que las primeras?',
          opciones: [
            { texto: 'Porque sin ellas te vas, y no hay forma de volver', correcta: true, porQue: 'Ganar fichas te acerca al premio poco a poco; perder las últimas te saca del todo. No es simétrico.' },
            { texto: 'Porque al final las ciegas son más altas', correcta: false, porQue: 'Las ciegas altas te obligan a jugar antes, pero el motivo de fondo es que quedarte a cero es definitivo.' },
            { texto: 'No valen más: una ficha es una ficha', correcta: false, porQue: 'En dinero sí sería así. En un torneo, la que te deja dentro vale más que la que te da ventaja.' },
          ],
        },
      ]),
      dominio: 3,
      minimoManos: 3,
      maximoManos: 9,
    }),
  ],
}
