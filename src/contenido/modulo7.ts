import type { Modulo } from '../juego/lecciones'
import { leccion, testEntre } from '../juego/lecciones'
import { manoDeCodigo } from '../motor/cartas'
import type { Carta } from '../motor/cartas'

const m = (texto: string): Carta[] => manoDeCodigo(texto)
import { mesaBaja, mesaSeca, sin, tenerManoMuyFuerte, tenerNada, todas } from '../juego/practica'

/**
 * MÓDULO 7 · Sacar valor y farolear.
 *
 * Este módulo existe por una frase del usuario en la ronda 1:
 *
 *   "no es lo mismo ganar pero ganar poquito sabiendo que desde el comienzo
 *    tenías una mano fuerte y podías ocultarla hasta el final para irlos
 *    exprimiendo"
 *
 * Es el módulo donde el juego deja de decir "tienes buena mano, apuesta" y pasa
 * a decir "tienes buena mano: ¿cómo le sacas el máximo a ESTE rival?".
 */
export const MODULO_7: Modulo = {
  numero: 7,
  titulo: 'Sacar valor y farolear',
  resumen: 'Cuánto apostar, cuándo esconder una mano fuerte para exprimirla y cuándo el farol sale a cuenta.',
  lecciones: [
    leccion({
      id: 'm7-l1',
      modulo: 7,
      titulo: 'Apostar por valor',
      idea: 'Con una mano buena no apuestas para que se retiren: apuestas para que te paguen con una peor.',
      pasos: [
        { tipo: 'mesa', texto: 'Tienes una mano muy buena. La pregunta no es "¿cómo le hago retirarse?".',
          mano: m('9s 9h'), mesa: m('9d 5c 2s') },
        { tipo: 'acciones', resaltar: 'subir', texto: 'La pregunta es: **¿con qué manos peores me va a pagar esto?**',
          pie: 'Si la respuesta es "con ninguna", o apuestas menos, o no apuestas.' },
        { tipo: 'fichas', texto: 'Apostar demasiado echa a quien te paga y solo cobra de quien te gana.',
          montones: [
            { nombre: 'Apuesta justa', fichas: 120, color: 'var(--verde)' },
            { nombre: 'Apuesta de más', fichas: 40, color: 'var(--rojo)' },
          ],
          pie: 'Fichas que acabas ganando de media con cada tamaño.' },
        { tipo: 'texto', texto: 'Esto se llama **apostar por valor**, y de ahí sale casi todo el dinero del póker. Los faroles son la parte llamativa; el valor paga las facturas.' },
      ],
      terminos: ['valor'],
      practica: testEntre([
        {
          enunciado: 'Tienes una mano muy fuerte. ¿Cuál es la pregunta correcta antes de apostar?',
          opciones: [
            { texto: '¿Con qué manos peores me va a pagar?', correcta: true, porQue: 'Si no hay ninguna mano peor que pueda pagarte, esa apuesta no gana nada: solo echa a quien ya iba perdiendo.' },
            { texto: '¿Cómo le hago retirarse?', porQue: 'Eso es lo que quieres cuando vas perdiendo, no cuando vas ganando.' },
            { texto: '¿Cuánto tengo en fichas?', porQue: 'Importa, pero después: primero hay que saber si la apuesta tiene a quién cobrarle.' },
          ],
        },
        {
          enunciado: 'Vas ganando y apuestas tan fuerte que solo te pagan las manos que te ganan. ¿Qué has hecho?',
          opciones: [
            { texto: 'Apostar al revés: echo a quien me paga y cobro solo de quien me gana', correcta: true, porQue: 'Es el error clásico. Con una mano buena pero no imbatible, el tamaño tiene que dejar sitio a que te paguen peores.' },
            { texto: 'Bien: he protegido mi mano', porQue: '"Proteger" suele ser la excusa para apostar de más y ganar menos.' },
            { texto: 'Bien: he ganado el bote', porQue: 'Has ganado el bote que había, sí. Y has perdido el que podías haber hecho.' },
          ],
        },
        {
          enunciado: '¿En qué caso es mejor NO apostar aunque vayas ganando?',
          opciones: [
            { texto: 'Cuando ninguna mano peor que la mía puede pagarme', correcta: true, porQue: 'Si solo te paga lo que te gana, esa apuesta pierde fichas. Pasar deja que te farolee él.' },
            { texto: 'Cuando el bote es pequeño', correcta: false, porQue: 'El bote pequeño se hace grande apostando, que es de lo que va apostar por valor.' },
            { texto: 'Cuando llevo varias manos ganando', correcta: false, porQue: 'Lo que pasó en las manos anteriores no cambia esta cuenta.' },
          ],
        },
      ]),
      dominio: 3,
      minimoManos: 3,
      maximoManos: 9,
    }),

    leccion({
      id: 'm7-l2',
      modulo: 7,
      titulo: 'Al que lo paga todo, se le cobra',
      idea: 'Contra alguien que no suelta la mano, con una mano fuerte se apuesta y se apuesta grande.',
      pasos: [
        { tipo: 'mesa', texto: 'Mano enorme, y enfrente el que lo paga todo "por ver".',
          mano: m('9s 9h'), mesa: m('9d 5c 2s') },
        { tipo: 'porcentaje', texto: 'Ganas casi siempre, y él va a pagar con cualquier pareja.',
          victoria: 0.94, empate: 0.01 },
        { tipo: 'acciones', resaltar: 'subir', texto: 'Contra él no hay trucos: **le cobras**.',
          pie: 'Nada de esconder la mano. Apuesta y déjale pagar.' },
      ],
      terminos: ['valor'],
      practica: {
        tipo: 'decision',
        mano: () => ({
          calle: 'flop',
          // La mesa tiene que darle algo con lo que pagar. En una mesa seca hasta
          // el que lo paga todo se retira, y entonces la lección enseñaría lo
          // contrario de lo que dice su título.
          condicion: todas(tenerManoMuyFuerte, sin(mesaSeca)),
          bote: 120,
          paraPagar: 0,
          contexto: 'Has ligado una mano muy fuerte y la mesa le da cosas con las que pagar. Enfrente, el que lo paga todo por ver.',
          rangoRival: '22+, A2s+, K5s+, Q7s+, J7s+, T7s+, 96s+, 85s+, 75s+, 64s+, 54s, A2o+, K8o+, Q8o+, J8o+, T8o+, 98o',
          perfilRival: { nombre: 'el pegajoso', agresividad: 0.3, disciplina: 0.25, farol: 0.15, tenacidad: 0.85 },
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
      id: 'm7-l3',
      modulo: 7,
      titulo: 'Al que se va a retirar, se le esconde',
      idea: 'Con una mano enorme contra un rival que no puede pagar, apostar es ganar poco. Pasar le deja meterse solo.',
      pasos: [
        { tipo: 'mesa', texto: 'Mano casi imbatible, en una mesa de cartas bajas.',
          mano: m('7s 7h'), mesa: m('7d 4c 2h') },
        { tipo: 'rango', rango: 'AKo, AQo, AJo, AKs, AQs, AJs, KQo, KQs',
          texto: 'Pero el rival juega figuras: **no ha ligado nada y no puede ligar casi nada**.' },
        { tipo: 'acciones', resaltar: 'subir', texto: 'Si apuestas, tira la mano y te llevas un bote pequeño.' },
        { tipo: 'fichas', texto: 'Si pasas, le enseñas debilidad... y un rival agresivo apuesta con nada.',
          montones: [
            { nombre: 'Si apuestas', fichas: 111, color: 'var(--rojo)' },
            { nombre: 'Si pasas', fichas: 193, color: 'var(--verde)' },
          ],
          pie: 'Fichas que ganas de media con cada jugada. No apostar no es dejar de ganar: es dejar que apueste él.' },
        { tipo: 'texto', texto: 'Ojo: esto **no** vale siempre. Contra el de la lección anterior sería un error carísimo. Depende de quién tengas delante.' },
      ],
      terminos: ['farol', 'valor'],
      practica: {
        tipo: 'decision',
        mano: () => ({
          calle: 'flop',
          condicion: todas(tenerManoMuyFuerte, mesaBaja, mesaSeca),
          bote: 120,
          paraPagar: 0,
          contexto: 'Mesa de cartas bajas y tú con una mano enorme. El rival juega figuras y es de los que se lanzan si te ven flojo.',
          rangoRival: 'AKo, AQo, AJo, AKs, AQs, AJs, KQo, KQs',
          perfilRival: { nombre: 'el matón', agresividad: 0.9, disciplina: 0.85, farol: 0.65, tenacidad: 0.5 },
          exigencia: 'seria',
        }),
      },
      accionEsperada: 'pagar',
      dominio: 3,
      minimoManos: 3,
      maximoManos: 12,
      ayuda: 'siempre',
      exigencia: 'seria',
    }),

    leccion({
      id: 'm7-l4',
      modulo: 7,
      titulo: 'Cuándo sale a cuenta un farol',
      idea: 'Un farol no se hace porque te apetezca: se hace cuando el rival casi no puede tener nada.',
      pasos: [
        { tipo: 'precio', texto: 'Farolear no es valentía, es una cuenta. Apuestas 100 para ganar 100.',
          bote: 100, pagar: 100,
          pie: 'Necesitas que se retire más de la mitad de las veces.' },
        { tipo: 'rango', rango: 'AKo, AQo, AJo, AKs, AQs, AJs, KQo, KQs',
          texto: 'Eso solo pasa si su rango **no liga** con esta mesa.' },
        { tipo: 'mesa', texto: 'Con un rango de figuras, en una mesa así casi nunca tiene nada.',
          mano: m('Jc 9d'), mesa: m('7d 4c 2h'),
          pie: 'En una mesa A-K-Q sería justo al revés.' },
        { tipo: 'texto', texto: 'Y una regla que ahorra mucho dinero: **no se farolea a quien no se retira nunca**.' },
      ],
      terminos: ['farol'],
      practica: testEntre([
        {
          enunciado: '¿En cuál de estas situaciones tiene más sentido farolear?',
          opciones: [
            { texto: 'La mesa es 4-7-2 y el rival solo juega figuras', correcta: true, porQue: 'Su rango casi no liga ahí: se va a retirar muchas veces, que es lo único que necesita un farol.' },
            { texto: 'La mesa es A-K-Q y el rival solo juega figuras', porQue: 'Esa mesa es justo la suya: va a tener algo casi siempre.' },
            { texto: 'El rival es de los que paga todo', porQue: 'A quien no se retira nunca no se le farolea. Es la regla que más dinero ahorra.' },
          ],
        },
        {
          enunciado: 'Apuestas 100 a un bote de 100 como farol. ¿Cuántas veces necesitas que se retire?',
          opciones: [
            { texto: 'Más de la mitad', correcta: true, porQue: 'Arriesgas 100 para ganar 100: por encima del 50% de retiradas, el farol gana fichas.' },
            { texto: 'Una de cada cuatro', porQue: 'Con eso perderías fichas a la larga: te retiran poco y pagas mucho.' },
            { texto: 'Siempre', porQue: 'No hace falta que funcione siempre; hace falta que funcione más veces de las que falla.' },
          ],
        },
        {
          enunciado: 'Ahora faroleas 50 a un bote de 100. ¿Cuántas veces necesitas que se retire?',
          opciones: [
            { texto: 'Una de cada tres', correcta: true, porQue: 'Arriesgas 50 para ganar 150: 50 entre 150 es una de cada tres. Cuanto menos apuestas, menos veces tiene que funcionar.' },
            { texto: 'Más de la mitad', correcta: false, porQue: 'Eso era apostando el bote entero. Apostando la mitad, el farol es más barato.' },
            { texto: 'Las mismas que apostando 100: da igual el tamaño', correcta: false, porQue: 'El tamaño lo cambia todo: es lo que arriesgas frente a lo que te llevas.' },
          ],
        },
      ]),
      dominio: 3,
      minimoManos: 3,
      maximoManos: 9,
    }),

    leccion({
      id: 'm7-l5',
      modulo: 7,
      titulo: 'El farol que sí se hace',
      idea: 'Con nada en la mano, en una mesa que al rival no le sirve, apostar gana fichas.',
      pasos: [
        { tipo: 'mesa', texto: 'Tu mano no vale nada y no va a mejorar.',
          mano: m('Jc 9d'), mesa: m('7d 4c 2h') },
        { tipo: 'rango', rango: 'AKo, AQo, AJo, AKs, AQs, AJs, KQo, KQs, ATo, ATs',
          texto: 'Pero mira su rango: figuras. En esta mesa **casi nunca tiene nada**.' },
        { tipo: 'fichas', texto: 'Apostar aquí no es fe: es la jugada que más fichas gana.',
          montones: [
            { nombre: 'Si pasas', fichas: 18, color: 'var(--azul)' },
            { nombre: 'Si apuestas', fichas: 62, color: 'var(--verde)' },
          ] },
        { tipo: 'texto', texto: 'Si solo apuestas cuando tienes algo, eres previsible y nadie te paga nunca.' },
      ],
      terminos: ['farol'],
      practica: {
        tipo: 'decision',
        mano: () => ({
          calle: 'flop',
          condicion: todas(tenerNada, mesaBaja, mesaSeca),
          bote: 100,
          paraPagar: 0,
          contexto: 'No tienes nada. Pero la mesa es de cartas bajas y el rival solo juega figuras.',
          rangoRival: 'AKo, AQo, AJo, AKs, AQs, AJs, KQo, KQs, ATo, ATs',
          perfilRival: { nombre: 'el calculador', agresividad: 0.5, disciplina: 0.9, farol: 0.3, tenacidad: 0.4 },
          exigencia: 'intermedia',
        }),
      },
      accionEsperada: 'subir',
      dominio: 3,
      minimoManos: 3,
      maximoManos: 12,
      ayuda: 'siempre',
      exigencia: 'intermedia',
    }),
  ],
}
