import type { Modulo, PreguntaTest } from '../juego/lecciones'
import { leccion } from '../juego/lecciones'
import { manoDeButaca, manoFloja } from '../juego/practica'

/**
 * MÓDULO 4 · La posición.
 *
 * El concepto que más separa a quien juega sus cartas de quien juega la partida.
 * Es también el primero que suena raro: las mismas cartas valen más o menos
 * según en qué silla estés, y eso hay que verlo con manos para creérselo.
 */
export const MODULO_4: Modulo = {
  numero: 4,
  titulo: 'La posición',
  resumen: 'Por qué el que habla el último gana más dinero con las mismas cartas.',
  lecciones: [
    leccion({
      id: 'm4-l1',
      modulo: 4,
      titulo: 'Hablar el último es información gratis',
      idea: 'El que decide el último decide sabiendo lo que han hecho los demás. Esa información vale dinero.',
      explicacion: [
        'Imagina dos personas con las mismas cartas. Una tiene que decidir **primero**, a oscuras. La otra decide **después de ver** lo que hizo la primera.',
        'La segunda sabe algo que la primera no sabía. Y en el póker, saber es lo único que se paga.',
        'Por eso la misma mano vale más desde el botón que desde la primera silla: no porque las cartas cambien, sino porque cambia lo que sabes cuando decides.',
        'Todo lo que viene en los módulos siguientes —leer al rival, apostar por valor, farolear— es mucho más fácil desde la última posición.',
      ],
      terminos: ['posicion', 'boton'],
      practica: {
        tipo: 'test',
        pregunta: (azar) => {
          const preguntas: PreguntaTest[] = [
            {
              enunciado: 'Tienes la misma mano desde el botón y desde primera posición. ¿Vale lo mismo?',
              opciones: [
                { texto: 'Vale más desde el botón', correcta: true, porQue: 'Las cartas son iguales; lo que cambia es que desde el botón decides con toda la información de la mano.' },
                { texto: 'Vale lo mismo: son las mismas cartas', porQue: 'Es lo que parece, y es el error que hace perder dinero a casi todo el mundo al empezar.' },
                { texto: 'Vale más desde primera posición', porQue: 'Al revés: hablar primero es decidir a ciegas.' },
              ],
            },
            {
              enunciado: 'Después del flop, ¿quién habla el último?',
              opciones: [
                { texto: 'El que está en el botón', correcta: true, porQue: 'El botón habla el último en todas las calles menos antes del flop. Por eso es la mejor silla.' },
                { texto: 'La ciega grande', porQue: 'La ciega grande habla la última ANTES del flop, pero de las primeras después.' },
                { texto: 'El que repartió las cartas anteriores', porQue: 'El orden no depende de la mano anterior, depende de dónde esté el botón ahora.' },
              ],
            },
            {
              enunciado: '¿Por qué desde el botón se pueden jugar más manos?',
              opciones: [
                { texto: 'Porque en las calles siguientes decidiré con más información', correcta: true, porQue: 'Con manos regulares, esa información de más es lo que las convierte en jugables.' },
                { texto: 'Porque el botón reparte y elige mejores cartas', porQue: 'Nadie elige cartas: el botón solo marca el orden.' },
                { texto: 'Porque el botón no paga ciegas nunca', porQue: 'Las paga igual, solo que en otras manos.' },
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
      id: 'm4-l2',
      modulo: 4,
      titulo: 'Las sillas de la mesa',
      idea: 'Cuanta más gente hable después de ti, más apretado tienes que jugar.',
      explicacion: [
        'En una mesa de cuatro hay cuatro sitios: **primera posición**, **el botón**, **la ciega pequeña** y **la ciega grande**.',
        'Desde primera posición hablas antes que todos y te quedan **tres personas** que pueden tener algo mejor. Hay que jugar pocas manos y buenas.',
        'Desde el botón ya han hablado casi todos y encima decidirás el último el resto de la mano. Ahí se pueden abrir muchas más manos.',
        'Las ciegas son incómodas: ya has puesto fichas, pero después del flop hablas de los primeros. Se juegan con cuidado.',
      ],
      terminos: ['posicion', 'ciegas'],
      practica: {
        tipo: 'test',
        pregunta: (azar) => {
          const preguntas: PreguntaTest[] = [
            {
              enunciado: '¿Desde qué silla se pueden jugar MÁS manos distintas?',
              opciones: [
                { texto: 'El botón', correcta: true, porQue: 'Poca gente detrás y última palabra el resto de la mano: es donde más manos son rentables.' },
                { texto: 'Primera posición', porQue: 'Es donde menos: quedan tres jugadores que pueden tener algo mejor.' },
                { texto: 'La ciega pequeña', porQue: 'Es de las peores sillas: pones fichas y encima hablas pronto después del flop.' },
              ],
            },
            {
              enunciado: 'Estás en primera posición con una mano regular, como 9♦8♣. ¿Qué haces?',
              opciones: [
                { texto: 'Tirarla', correcta: true, porQue: 'Quedan tres jugadores por hablar y encima decidirás a ciegas toda la mano. Esa mano no da para tanto.' },
                { texto: 'Subir para que se retiren', porQue: 'Con tres detrás es muy probable que alguien tenga algo de verdad.' },
                { texto: 'Pagar y ver el flop', porQue: 'Pagar a ciegas con una mano regular y mala posición es exactamente cómo se sangran fichas.' },
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
      id: 'm4-l3',
      modulo: 4,
      titulo: 'Desde el botón se abre más',
      idea: 'Con casi nadie detrás y la última palabra en todas las calles, una mano mediana ya es jugable.',
      explicacion: [
        'Estás en el botón. Solo quedan las dos ciegas por hablar, y a partir del flop decidirás **siempre el último**.',
        'Manos que desde primera posición son basura —una figura con carta media, dos cartas seguidas del mismo palo— desde aquí ganan fichas.',
        'No porque vayan a ligar más, sino porque cuando no liguen podrás soltarlas baratas, y cuando liguen sabrás mejor cuánto cobrar.',
      ],
      terminos: ['posicion'],
      practica: {
        tipo: 'decision',
        mano: () => ({
          calle: 'preflop',
          condicion: manoDeButaca,
          bote: 30,
          paraPagar: 20,
          posicion: 'boton',
          contexto: 'Estás en el botón y nadie ha subido. Solo quedan las dos ciegas por hablar.',
          rangoRival: '22+, A2s+, K5s+, Q7s+, J7s+, T7s+, 96s+, 85s+, 75s+, 64s+, 54s, A2o+, K8o+, Q8o+, J8o+, T8o+, 98o',
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
      id: 'm4-l4',
      modulo: 4,
      titulo: 'Desde primera posición se aprieta',
      idea: 'Con tres jugadores que pueden tener algo mejor, las manos regulares se tiran sin pensarlo.',
      explicacion: [
        'Misma mesa, otra silla. Hablas el primero y quedan tres detrás.',
        'Cada uno de esos tres puede tener una mano mejor que la tuya. Y si alguno sube, tendrás que jugar toda la mano a ciegas.',
        'Por eso desde aquí se juegan pocas manos y buenas. Aburre un poco, y es exactamente lo que hay que hacer.',
        'Si te fijas, es la misma idea de siempre: no es tu mano lo que decide, es tu mano **en esta situación**.',
      ],
      terminos: [],
      practica: {
        tipo: 'decision',
        mano: () => ({
          calle: 'preflop',
          condicion: manoFloja,
          bote: 30,
          paraPagar: 20,
          posicion: 'utg',
          contexto: 'Hablas el primero, con tres jugadores esperando detrás de ti.',
          rangoRival: '55+, A9s+, KTs+, QTs+, JTs, AJo+, KQo',
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
