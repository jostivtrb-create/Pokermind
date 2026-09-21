import type { Modulo, PreguntaTest } from '../juego/lecciones'
import { leccion } from '../juego/lecciones'
import { mesaBaja, mesaSeca, tenerManoMuyFuerte, tenerNada, todas } from '../juego/practica'

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
      explicacion: [
        'Suena obvio y casi nadie lo hace bien. Cuando tienes la mejor mano, **lo que quieres es que el rival ponga fichas**.',
        'Por eso el tamaño importa: si apuestas tan fuerte que solo te paga lo que te gana, estás apostando al revés.',
        'La pregunta antes de apostar con una mano buena es siempre la misma: **¿con qué manos peores me va a pagar esto?** Si la respuesta es "con ninguna", o apuestas menos, o no apuestas.',
        'Eso se llama **apostar por valor**, y es de donde sale casi todo el dinero del póker. Los faroles son la parte llamativa; el valor es la que paga las facturas.',
      ],
      terminos: ['valor'],
      practica: {
        tipo: 'test',
        pregunta: (azar) => {
          const preguntas: PreguntaTest[] = [
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
          ]
          return preguntas[azar.entero(preguntas.length)]
        },
      },
      dominio: 3,
      minimoManos: 3,
      maximoManos: 9,
    }),

    leccion({
      id: 'm7-l2',
      modulo: 7,
      titulo: 'Al que lo paga todo, se le cobra',
      idea: 'Contra alguien que no suelta la mano, con una mano fuerte se apuesta y se apuesta grande.',
      explicacion: [
        'Hay un tipo de rival que paga casi cualquier cosa "por ver". Contra él, el póker es muy fácil: **le cobras**.',
        'Nada de esconder la mano ni de trucos. Si va a pagar con una pareja cualquiera, apuesta y déjale pagar.',
        'Este es el caso en el que apostar es claramente lo mejor, y conviene tenerlo claro antes de la lección siguiente, que es justo la contraria.',
      ],
      terminos: ['valor'],
      practica: {
        tipo: 'decision',
        mano: () => ({
          calle: 'flop',
          condicion: tenerManoMuyFuerte,
          bote: 120,
          paraPagar: 0,
          contexto: 'Has ligado una mano muy fuerte. Enfrente tienes al que lo paga todo por ver.',
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
      explicacion: [
        'Esta es la lección que hace distinto a este juego, y la más difícil de tragar.',
        'Tienes una mano casi imbatible. La mesa es de cartas bajas, sin colores ni escaleras a la vista, y el rival juega figuras: **no ha ligado nada y no tiene ni con qué soñar**.',
        'Si apuestas, tira la mano y te llevas un bote pequeño. Pero si **pasas**, le estás enseñando debilidad... y un rival agresivo apuesta con nada en cuanto huele debilidad.',
        'Es decir: no apostar no es dejar de ganar. Es **dejar que apueste él**. Esconder la mano no es un truco de película, es una cuenta: contra este rival concreto, pasar gana más fichas que apostar.',
        'Ojo: esto **no** vale siempre. Contra el de la lección anterior sería un error carísimo. Depende de quién tengas delante, y por eso el juego te enseña a mirarlo.',
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
      explicacion: [
        'Farolear no es valentía, es una cuenta. Apuestas 100 para ganar los 100 que hay en el bote: necesitas que se retire **más de la mitad de las veces**.',
        'Eso solo pasa cuando su rango **no liga con esta mesa**. Si él juega figuras y la mesa es de cartas bajas, casi nunca tiene nada.',
        'Al revés: en una mesa que encaja con lo que él juega, farolear es regalar fichas por muy convincente que te parezca tu historia.',
        'Y hay una regla que ahorra mucho dinero: **no se farolea a quien no se retira nunca**. Da igual lo bonita que sea la jugada.',
      ],
      terminos: ['farol'],
      practica: {
        tipo: 'test',
        pregunta: (azar) => {
          const preguntas: PreguntaTest[] = [
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
          ]
          return preguntas[azar.entero(preguntas.length)]
        },
      },
      dominio: 3,
      minimoManos: 3,
      maximoManos: 9,
    }),

    leccion({
      id: 'm7-l5',
      modulo: 7,
      titulo: 'El farol que sí se hace',
      idea: 'Con nada en la mano, en una mesa que al rival no le sirve, apostar gana fichas.',
      explicacion: [
        'Tu mano no vale nada y no va a mejorar. Hasta aquí, malo.',
        'Pero mira la mesa: cartas bajas. Y mira su rango: figuras. **Casi nunca tiene nada.**',
        'Apostar aquí no es un acto de fe, es la jugada de mayor valor esperado: se va a retirar la mayoría de las veces y te vas a llevar el bote.',
        'Esta es la otra mitad del póker. Si solo apuestas cuando tienes algo, eres previsible y nadie te paga nunca.',
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
