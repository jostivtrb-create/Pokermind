import type { Modulo, PreguntaTest } from '../juego/lecciones'
import { leccion } from '../juego/lecciones'
import { tenerManoMuyFuerte } from '../juego/practica'

/**
 * MÓDULO 9 · Equilibrio.
 *
 * El último y el más abstracto: por qué a veces hay que jugar la misma mano de
 * dos formas distintas. No es teoría por teoría — es lo que impide que un rival
 * atento te lea la mano solo por cómo apuestas.
 *
 * Se explica sin fórmulas a propósito: quien acabe el curso tiene que entender
 * la IDEA de equilibrio, no calcular una estrategia de solver.
 */
export const MODULO_9: Modulo = {
  numero: 9,
  titulo: 'Equilibrio',
  resumen: 'Por qué a veces hay que jugar la misma mano de dos formas, y por qué ser previsible se paga caro.',
  lecciones: [
    leccion({
      id: 'm9-l1',
      modulo: 9,
      titulo: 'Ser previsible se paga caro',
      idea: 'Si solo apuestas cuando tienes algo, todo el mundo se retira cuando apuestas. Y entonces no ganas nada.',
      explicacion: [
        'Imagina a alguien que apuesta **solo** con manos muy buenas. Es fácil jugar contra él: cuando apuesta, te retiras; cuando pasa, le apuestas tú.',
        'Ese jugador tiene un problema que no se ve en una mano suelta: **nadie le paga nunca**. Sus manos buenas ganan botes minúsculos.',
        'Por eso hay que apostar a veces sin nada (farol) y pasar a veces con algo bueno. No para hacerse el listo: para que **apostar siga significando poco**.',
        'Esa es toda la idea del equilibrio. Lo demás son matices.',
      ],
      terminos: ['farol', 'valor'],
      practica: {
        tipo: 'test',
        pregunta: (azar) => {
          const preguntas: PreguntaTest[] = [
            {
              enunciado: 'Un rival apuesta SOLO cuando tiene una mano muy buena. ¿Cómo se le gana?',
              opciones: [
                { texto: 'Retirándome cuando apuesta y apostándole yo cuando pasa', correcta: true, porQue: 'Sus manos buenas ganan botes minúsculos y sus manos flojas pierden todos los botes. No hace falta más.' },
                { texto: 'Pagándole siempre para pillarle un farol', porQue: 'Si nunca farolea, pagarle es regalarle fichas.' },
                { texto: 'No se le puede ganar: siempre tiene buena mano cuando apuesta', porQue: 'Precisamente por eso se le gana: porque lo sabes de antemano.' },
              ],
            },
            {
              enunciado: '¿Para qué sirve farolear de vez en cuando aunque a veces pierda fichas?',
              opciones: [
                { texto: 'Para que mis apuestas buenas también me las paguen', correcta: true, porQue: 'Un farol que falla a veces es lo que hace que tus manos buenas cobren el resto de las veces.' },
                { texto: 'Para divertirme', porQue: 'Divierte, pero el motivo de verdad es que hace ganar dinero a tus manos buenas.' },
                { texto: 'Para que el rival se enfade', porQue: 'Eso es un efecto secundario, no una estrategia.' },
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
      id: 'm9-l2',
      modulo: 9,
      titulo: 'La proporción entre valor y farol',
      idea: 'Por cada mano fuerte con la que apuestas, hay un número de faroles que puedes permitirte. Ni más ni menos.',
      explicacion: [
        'Cuando apuestas el tamaño del bote, el rival necesita acertar una de cada tres veces para pagarte. Eso te dice cuántos faroles caben en tus apuestas: **uno por cada dos manos buenas**, más o menos.',
        'Con esa proporción, al rival le da **exactamente igual** pagar o retirarse: haga lo que haga, no gana nada contra ti. Eso es estar equilibrado.',
        'Si faroleas más de la cuenta, le sale rentable pagarte siempre. Si faroleas menos, le sale rentable retirarse siempre.',
        'En la práctica nadie lleva la cuenta exacta en la mesa. Basta con la idea: **si apuestas mucho, que no sea todo humo; si apuestas poco, que no sea todo oro**.',
      ],
      terminos: ['farol', 'valor'],
      practica: {
        tipo: 'test',
        pregunta: (azar) => {
          const preguntas: PreguntaTest[] = [
            {
              enunciado: 'Faroleas mucho más de lo que apuestas con manos buenas. ¿Qué hará un rival que se dé cuenta?',
              opciones: [
                { texto: 'Pagarme siempre', correcta: true, porQue: 'Si la mayoría de tus apuestas son humo, pagarte le sale rentable, y entonces pierdes cada farol.' },
                { texto: 'Retirarse siempre', porQue: 'Retirarse le saldría bien contra quien NO farolea nunca, no contra quien farolea de más.' },
                { texto: 'Nada: no se puede saber', porQue: 'Se nota en pocas manos, y en cuanto se nota, se aprovecha.' },
              ],
            },
            {
              enunciado: '¿Qué significa que una estrategia esté "equilibrada"?',
              opciones: [
                { texto: 'Que al rival le da igual pagar o retirarse: no gana con ninguna de las dos', correcta: true, porQue: 'Esa es la definición útil. No es que juegues perfecto: es que no se te puede explotar.' },
                { texto: 'Que gano el mismo número de manos que pierdo', porQue: 'El número de manos ganadas no dice nada: importa cuánto se gana en cada una.' },
                { texto: 'Que apuesto siempre la misma cantidad', porQue: 'Apostar siempre igual es justo lo contrario: es previsible.' },
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
      id: 'm9-l3',
      modulo: 9,
      titulo: 'Equilibrio o explotación',
      idea: 'Contra un rival malo no hace falta equilibrio: hace falta aprovechar su error. El equilibrio es para cuando no sabes con quién juegas.',
      explicacion: [
        'Jugar equilibrado te hace **imposible de explotar**. Pero también renuncia a ganar dinero extra.',
        'Contra alguien que se retira demasiado, lo rentable no es equilibrarse: es farolearle más. Contra alguien que paga todo, es no farolearle nunca y cobrarle las buenas.',
        'La regla práctica: **si has detectado un error, aprovéchalo; si no sabes nada del rival, juega equilibrado**.',
        'Y con esto terminas el curso. A partir de aquí, lo que más te va a enseñar es el modo libre: rivales distintos cada partida, y tú decidiendo con todo esto en la cabeza.',
      ],
      terminos: ['rango'],
      practica: {
        tipo: 'test',
        pregunta: (azar) => {
          const preguntas: PreguntaTest[] = [
            {
              enunciado: 'Has visto que un rival se retira casi siempre que le apuestas. ¿Qué haces?',
              opciones: [
                { texto: 'Farolearle más a menudo', correcta: true, porQue: 'Cuando alguien comete un error concreto, lo rentable es apretar justo ahí, no jugar "correcto".' },
                { texto: 'Jugar equilibrado por si acaso', porQue: 'El equilibrio protege, pero renuncia a lo que te está regalando.' },
                { texto: 'Apostar solo con manos buenas', porQue: 'Contra alguien que se retira mucho, eso es dejar de ganar los botes que suelta.' },
              ],
            },
            {
              enunciado: 'Te sientas con tres desconocidos y no sabes nada de ellos. ¿Cómo empiezas?',
              opciones: [
                { texto: 'Equilibrado, y voy ajustando según lo que vea', correcta: true, porQue: 'Sin información, el equilibrio te protege mientras recoges datos. Después ya explotas.' },
                { texto: 'Faroleando mucho desde el principio', porQue: 'Sin saber quién se retira y quién no, es tirar fichas al aire.' },
                { texto: 'Esperando ases', porQue: 'Mientras esperas, las ciegas te comen y todos aprenden a leerte.' },
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
      id: 'm9-l4',
      modulo: 9,
      titulo: 'Todo junto',
      idea: 'Última lección: una mano cualquiera, sin ayudas, con todo lo que has aprendido.',
      explicacion: [
        'Se acabaron las explicaciones. Aquí tienes manos fuertes en mesas normales, sin ver los porcentajes hasta después de decidir.',
        'Piensa en orden: qué tienes, qué puede tener él, qué te cuesta seguir y qué acción saca más fichas.',
        'Si aciertas estas, estás jugando mejor que la mayoría de la gente que se sienta en una mesa. Y el modo libre te está esperando.',
      ],
      terminos: [],
      practica: {
        tipo: 'decision',
        mano: () => ({
          calle: 'turn',
          condicion: tenerManoMuyFuerte,
          bote: 220,
          paraPagar: 0,
          contexto: 'Llevas una mano muy fuerte y el rival acaba de pasar. Te toca decidir a ti, sin ayudas.',
          rangoRival: '22+, A2s+, K8s+, Q9s+, J9s+, T8s+, A7o+, KTo+, QTo+, JTo',
          exigencia: 'seria',
        }),
      },
      accionEsperada: 'subir',
      dominio: 4,
      minimoManos: 4,
      maximoManos: 14,
      ayuda: 'nunca',
      exigencia: 'seria',
    }),
  ],
}
