import type { Modulo } from '../juego/lecciones'
import { leccion, testEntre } from '../juego/lecciones'
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
      pasos: [
        { tipo: 'sillas', boton: 0, resaltar: 3, texto: 'Este habla **el primero**. Decide sin saber nada de los demás.',
          nota: 'A ciegas' },
        { tipo: 'sillas', boton: 0, resaltar: 0, texto: 'Y este habla **el último**: decide viendo lo que han hecho los otros tres.',
          nota: 'Con toda la información' },
        { tipo: 'sillas', boton: 0, texto: 'Las mismas cartas valen **más** en la segunda silla que en la primera.',
          nota: 'No cambian las cartas: cambia lo que sabes' },
        { tipo: 'texto', texto: 'En el póker, saber es lo único que se paga. Por eso la posición es el concepto que más dinero mueve.' },
      ],
      terminos: ['posicion', 'boton'],
      practica: testEntre([
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
      ]),
      dominio: 3,
      minimoManos: 3,
      maximoManos: 9,
    }),

    leccion({
      id: 'm4-l2',
      modulo: 4,
      titulo: 'Las sillas de la mesa',
      idea: 'Cuanta más gente hable después de ti, más apretado tienes que jugar.',
      pasos: [
        { tipo: 'sillas', boton: 0, resaltar: 3, texto: '**Primera posición**: hablas antes que todos y te quedan tres por detrás.',
          nota: 'Pocas manos y buenas' },
        { tipo: 'sillas', boton: 0, resaltar: 0, texto: '**El botón**: ya han hablado casi todos y tú decides el último.',
          nota: 'Aquí se pueden jugar muchas más manos' },
        { tipo: 'sillas', boton: 0, resaltar: 1, texto: 'Las **ciegas** son incómodas: ya has puesto fichas y hablas pronto.',
          nota: 'Se juegan con cuidado' },
        { tipo: 'texto', texto: 'La regla es sencilla: **cuanta más gente hable después de ti, más apretado tienes que jugar**.' },
      ],
      terminos: ['posicion', 'ciegas'],
      practica: testEntre([
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
        {
          enunciado: 'Estás en la ciega grande, donde ya has puesto fichas. ¿Por qué es una silla incómoda?',
          opciones: [
            { texto: 'Porque después del flop hablo de los primeros el resto de la mano', correcta: true, porQue: 'Las fichas puestas no las recuperas jugando mal: lo caro es decidir siempre sin información.' },
            { texto: 'Porque me reparten peores cartas', correcta: false, porQue: 'Las cartas salen igual en todas las sillas. Lo que cambia es cuándo te toca decidir.' },
            { texto: 'No es incómoda: ya tengo fichas dentro y entro más barato', correcta: false, porQue: 'Entrar barato tienta, y por eso se pierden fichas ahí: entras con manos flojas y luego juegas toda la mano a ciegas.' },
          ],
        },
      ]),
      dominio: 3,
      minimoManos: 3,
      maximoManos: 9,
    }),

    leccion({
      id: 'm4-l3',
      modulo: 4,
      titulo: 'Desde el botón se abre más',
      idea: 'Con casi nadie detrás y la última palabra en todas las calles, una mano mediana ya es jugable.',
      pasos: [
        { tipo: 'sillas', boton: 0, resaltar: 0, texto: 'Estás en el botón: solo quedan las dos ciegas por hablar.',
          nota: 'Y a partir del flop decides siempre el último' },
        { tipo: 'rango', rango: '22+, A2s+, K8s+, Q9s+, J9s+, T8s+, 97s+, 86s+, 75s+, 65s, A8o+, KTo+, QTo+, JTo',
          texto: 'Desde aquí se pueden abrir **todas estas manos**.',
          pie: 'Manos que desde primera posición serían basura, aquí ganan fichas.' },
        { tipo: 'texto', texto: 'No porque vayan a ligar más, sino porque cuando no liguen las sueltas baratas, y cuando liguen sabrás cuánto cobrar.' },
      ],
      terminos: ['posicion', 'notacion'],
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
      pasos: [
        { tipo: 'sillas', boton: 0, resaltar: 3, texto: 'Misma mesa, otra silla: hablas el primero y quedan **tres detrás**.' },
        { tipo: 'rango', rango: '77+, ATs+, KJs+, QJs, AQo+',
          texto: 'Desde aquí solo se abre **esto**.',
          pie: 'Aburre un poco, y es exactamente lo que hay que hacer.' },
        { tipo: 'rango', rango: '22+, A2s+, K8s+, Q9s+, J9s+, T8s+, 97s+, 86s+, 75s+, 65s, A8o+, KTo+, QTo+, JTo',
          texto: 'Compáralo con lo que abrías desde el botón.',
          pie: 'Las mismas cartas, media mesa de diferencia.' },
        { tipo: 'texto', texto: 'No es tu mano lo que decide: es tu mano **en esta situación**.' },
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
