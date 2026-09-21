import type { Modulo } from '../juego/lecciones'
import { leccion, testEntre } from '../juego/lecciones'
import { manoDeCodigo } from '../motor/cartas'
import type { Carta } from '../motor/cartas'

const m = (texto: string): Carta[] => manoDeCodigo(texto)
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
      pasos: [
        { tipo: 'rango', rango: '40%', texto: 'Antes del flop, su rango es **todo esto**.' },
        { tipo: 'rango', rango: '22+, A2s+, K9s+, Q9s+, J9s+, T9s, ATo+, KJo+',
          texto: 'Apuesta en el flop: fuera casi todo lo que no ligó nada.' },
        { tipo: 'rango', rango: '99+, AJs+, KQs, AQo+',
          texto: 'Apuesta otra vez en el turn. Y otra en el river. Le queda **esto**.',
          pie: 'Con manos flojas casi nadie apuesta tres veces seguidas.' },
        { tipo: 'texto', texto: 'Leer al rival no es adivinar su mano: es **ir tachando** las que ya no puede tener.' },
      ],
      terminos: ['rango'],
      practica: testEntre([
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
        {
          enunciado: 'Apuestas en el flop y el rival paga, sin subir. ¿Qué has aprendido de su rango?',
          opciones: [
            { texto: 'Que tiene algo, pero pocas veces lo mejor de todo', correcta: true, porQue: 'Con lo mejor habría subido muchas veces, y sin nada se habría ido. Pagar deja justo la parte de en medio.' },
            { texto: 'Que no tiene nada y espera a farolear', correcta: false, porQue: 'Pasa a veces, pero pagar cuesta fichas: la mayoría de las manos que pagan llevan algo.' },
            { texto: 'Que tiene la mano máxima', correcta: false, porQue: 'Justo esa es la que menos veces solo paga: con la mano máxima se busca hacer bote.' },
          ],
        },
      ]),
      dominio: 3,
      minimoManos: 3,
      maximoManos: 9,
    }),

    leccion({
      id: 'm6-l2',
      modulo: 6,
      titulo: 'El rango se estrecha calle a calle',
      idea: 'Su rango empieza ancho y se va cerrando. Tu decisión tiene que ir cerrándose con él.',
      pasos: [
        { tipo: 'rango', rango: '40%', texto: 'Antes del flop: puede tener el 40% de las manos.' },
        { tipo: 'rango', rango: '20%', texto: 'Apuesta en el flop: la mitad de su rango desaparece.' },
        { tipo: 'rango', rango: '99+, AJs+, KQs, AQo+', texto: 'Apuesta en el turn y en el river: le queda muy poco, y muy bueno.' },
        { tipo: 'texto', texto: 'Fíjate en lo importante: **tu mano no ha cambiado y la suya sí**. La misma pareja que era buenísima en el flop puede ser basura en el river.' },
      ],
      terminos: ['rango', 'calle'],
      practica: testEntre([
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
        {
          enunciado: 'Tu mano es exactamente la misma en el flop que en el river. ¿Cómo puede haber pasado de buena a mala?',
          opciones: [
            { texto: 'Porque la suya se ha ido estrechando y ahora casi todo lo que le queda me gana', correcta: true, porQue: 'Las manos no valen solas: valen contra lo que puede tener el otro, y eso cambia en cada calle.' },
            { texto: 'No puede: si era buena, sigue siéndolo', correcta: false, porQue: 'Ese es el error que más fichas cuesta después del flop.' },
            { texto: 'Porque han salido más cartas y eso siempre empeora mi mano', correcta: false, porQue: 'Las cartas nuevas también pueden ayudarte. Lo que la empeora es lo que él enseña al apostar.' },
          ],
        },
      ]),
      dominio: 3,
      minimoManos: 3,
      maximoManos: 9,
    }),

    leccion({
      id: 'm6-l3',
      modulo: 6,
      titulo: 'Contra un rango fuerte, se suelta',
      idea: 'Cuando alguien ha apostado en todas las calles, tu pareja media ya no le gana casi a nada.',
      pasos: [
        { tipo: 'mesa', texto: 'Tienes una mano decente y el rival ha apostado en las tres calles.',
          mano: m('9h 8d'), mesa: m('Ks 9c 4d 2s 7h') },
        { tipo: 'rango', rango: '99+, AJs+, KQs, AQo+',
          texto: 'Mira su rango, no tu mano. Después de tres apuestas le queda esto.' },
        { tipo: 'porcentaje', texto: 'Y contra eso, tu pareja media gana:',
          victoria: 0.12, empate: 0.02,
          pie: 'Casi todo lo que le queda te gana.' },
        { tipo: 'texto', texto: 'Pagar aquí es pagar por confirmar lo que ya sabes. **La curiosidad, en el póker, se cobra.**' },
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
      pasos: [
        { tipo: 'mesa', texto: 'El rival no ha subido en ningún momento: solo ha ido pagando.',
          mano: m('9h 8d'), mesa: m('Ks 9c 4d 2s 7h') },
        { tipo: 'rango', rango: '22+, A2s+, K5s+, Q7s+, J7s+, T7s+, 96s+, 85s+, 75s+, 64s+, 54s, A2o+, K8o+, Q8o+, J8o+, T8o+, 98o',
          texto: 'Su rango sigue siendo **ancho**: muchas manos regulares y muchas vacías.' },
        { tipo: 'porcentaje', texto: 'Contra eso, tu pareja media gana la mayoría de las veces.',
          victoria: 0.68, empate: 0.03 },
        { tipo: 'texto', texto: 'Retirarte porque "podría tener algo mejor" es regalarle botes. El póker va de ganar los que te tocan.' },
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
