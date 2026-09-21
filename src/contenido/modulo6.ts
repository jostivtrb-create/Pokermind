import type { Modulo, PreguntaTest } from '../juego/lecciones'
import { leccion } from '../juego/lecciones'
import { tenerParejaMedia } from '../juego/practica'

/**
 * MÓDULO 6 · Leer al rival.
 *
 * El salto de "juego mis cartas" a "juego la partida". La clave: el rango del
 * rival no es fijo, se estrecha cada vez que pone fichas. Quien apuesta tres
 * veces seguidas casi nunca lleva nada, y quien nunca apuesta casi nunca lleva
 * algo grande.
 */
export const MODULO_6: Modulo = {
  numero: 6,
  titulo: 'Leer al rival',
  resumen: 'Qué dice su apuesta sobre sus cartas, y cómo se estrecha su rango calle a calle.',
  lecciones: [
    leccion({
      id: 'm6-l1',
      modulo: 6,
      titulo: 'Cada apuesta cuenta algo',
      idea: 'El rival te está diciendo qué tiene cada vez que pone fichas. No con palabras, pero te lo está diciendo.',
      explicacion: [
        'Cuando alguien apuesta, está diciendo: *"mi mano aguanta que pongas más fichas"*. No siempre es verdad, pero la mayoría de las veces lo es.',
        'Cuando pasa, está diciendo lo contrario: *"prefiero ver la carta siguiente gratis"*.',
        'Lo importante no es acertar su mano exacta, es **quitar manos de su rango**. Si en una mesa con tres cartas bajas apuesta fuerte tres veces, casi todas sus manos flojas ya no están ahí.',
        'Eso es leer al rival: no adivinar, ir tachando.',
      ],
      terminos: ['rango'],
      practica: {
        tipo: 'test',
        pregunta: (azar) => {
          const preguntas: PreguntaTest[] = [
            {
              enunciado: 'Un rival ha apostado fuerte en el flop, el turn y el river. ¿Qué es lo más probable?',
              opciones: [
                { texto: 'Que su rango sea ya muy pequeño y muy fuerte', correcta: true, porQue: 'Con manos flojas casi nadie apuesta tres veces seguidas: se van quedando por el camino.' },
                { texto: 'Que vaya de farol, porque ha apostado mucho', porQue: 'Haberlo apostado todo también puede ser un farol, pero apostar tres veces con nada es raro y caro.' },
                { texto: 'No se puede saber nada', porQue: 'Sí se puede: cada apuesta quita manos flojas de su rango. Eso ya es información.' },
              ],
            },
            {
              enunciado: 'Un rival subió antes del flop pero después ha pasado en todas las calles. ¿Qué dice eso?',
              opciones: [
                { texto: 'Que probablemente la mesa no le sirvió', correcta: true, porQue: 'Subió con cartas altas y la mesa no le ligó nada. Su rango ahora es sobre todo mano vacía.' },
                { texto: 'Que tiene una mano enorme y la esconde', porQue: 'Pasa a veces, pero suponerlo siempre te hace soltar manos ganadoras.' },
                { texto: 'Que se ha despistado', porQue: 'Un jugador que pasa está eligiendo, no despistándose.' },
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
      id: 'm6-l2',
      modulo: 6,
      titulo: 'El rango se estrecha calle a calle',
      idea: 'Su rango empieza ancho y se va cerrando. Tu decisión tiene que ir cerrándose con él.',
      explicacion: [
        'Antes del flop su rango es lo que abre desde su silla: puede ser el 40% de las manos.',
        'Apuesta en el flop: fuera casi todo lo que no ligó nada. Queda puede que el 20%.',
        'Apuesta otra vez en el turn: queda el 10%. Y en el river, quizá el 5%.',
        'Fíjate en lo que significa: **la misma pareja que era buenísima en el flop puede ser basura en el river**, sin que hayas hecho nada mal. Su rango cambió, y el tuyo no.',
      ],
      terminos: ['rango', 'calle'],
      practica: {
        tipo: 'test',
        pregunta: (azar) => {
          const preguntas: PreguntaTest[] = [
            {
              enunciado: 'Tienes pareja media. Era buena en el flop y el rival ha apostado en flop, turn y river. ¿Qué haces?',
              opciones: [
                { texto: 'Soltarla: su rango ya casi no tiene manos que pierdan contra la mía', correcta: true, porQue: 'Tu mano no ha cambiado, pero la suya se ha ido haciendo más fuerte con cada apuesta.' },
                { texto: 'Pagar: sigue siendo la misma mano que en el flop', porQue: 'Ese es el error. La mano es la misma, la situación no.' },
                { texto: 'Subir para que se retire', porQue: 'Subir contra un rango muy fuerte es la forma más rápida de perder todas tus fichas.' },
              ],
            },
            {
              enunciado: 'El rival pasa en el flop y en el turn, y apuesta pequeño en el river. ¿Qué es lo más probable?',
              opciones: [
                { texto: 'Que haya ligado algo justo al final, o que intente robar barato', correcta: true, porQue: 'Con una mano grande desde el principio habría apostado antes para hacer bote.' },
                { texto: 'Que tenga la mejor mano posible desde el flop', porQue: 'Es posible, pero raro: nadie con la nuez desde el flop pasa dos veces y luego apuesta poco.' },
                { texto: 'Que esté cansado', porQue: 'Las apuestas cuentan una historia; esta cuenta una mano floja que mejoró tarde o un intento de robo.' },
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
      id: 'm6-l3',
      modulo: 6,
      titulo: 'Contra un rango fuerte, se suelta',
      idea: 'Cuando alguien ha apostado en todas las calles, tu pareja media ya no le gana casi a nada.',
      explicacion: [
        'Esta es la situación donde más fichas se pierden en el póker, y casi nunca duele en el momento: duele en el resultado del mes.',
        'Tienes una mano decente. El rival ha apostado en el flop, en el turn y ahora en el river.',
        'Mira su rango, no tu mano: después de tres apuestas, casi todo lo que le queda te gana.',
        'Pagar aquí es pagar por confirmar lo que ya sabes. **La curiosidad, en el póker, se cobra.**',
      ],
      terminos: ['rango'],
      practica: {
        tipo: 'decision',
        mano: () => ({
          calle: 'river',
          condicion: tenerParejaMedia,
          bote: 300,
          paraPagar: 220,
          tusFichas: 600,
          fichasRival: 600,
          contexto: 'El rival subió antes del flop y ha apostado fuerte en las tres calles. Ahora apuesta otra vez.',
          rangoRival: '99+, AJs+, KQs, AQo+',
          exigencia: 'intermedia',
        }),
      },
      accionEsperada: 'retirarse',
      dominio: 3,
      minimoManos: 3,
      maximoManos: 10,
      ayuda: 'alPrincipio',
      exigencia: 'intermedia',
    }),

    leccion({
      id: 'm6-l4',
      modulo: 6,
      titulo: 'Contra un rango flojo, se paga',
      idea: 'Si nadie ha enseñado fuerza en toda la mano, una pareja media suele ser la mejor mano.',
      explicacion: [
        'La otra cara de la lección anterior, y la que cuesta más de aplicar: **no soltar de más**.',
        'Si el rival no ha subido antes del flop y solo ha ido pagando, su rango sigue siendo ancho: muchas manos regulares y muchas manos vacías.',
        'Contra eso, tu pareja media gana la mayoría de las veces. Retirarte porque "podría tener algo mejor" es regalarle botes.',
        'El póker no va de esperar la mano perfecta: va de ganar los botes que te tocan.',
      ],
      terminos: [],
      practica: {
        tipo: 'decision',
        mano: () => ({
          calle: 'river',
          condicion: tenerParejaMedia,
          bote: 200,
          paraPagar: 50,
          contexto: 'El rival no ha subido en ningún momento y ahora apuesta poco en el river.',
          rangoRival: '22+, A2s+, K5s+, Q7s+, J7s+, T7s+, 96s+, 85s+, 75s+, 64s+, 54s, A2o+, K8o+, Q8o+, J8o+, T8o+, 98o',
          exigencia: 'intermedia',
        }),
      },
      accionEsperada: 'seguir',
      dominio: 3,
      minimoManos: 3,
      maximoManos: 10,
      ayuda: 'alPrincipio',
      exigencia: 'intermedia',
    }),
  ],
}
