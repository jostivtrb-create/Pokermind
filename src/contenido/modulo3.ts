import type { Aleatorio } from '../motor/aleatorio'
import type { Modulo, PreguntaTest } from '../juego/lecciones'
import { leccion } from '../juego/lecciones'
import { alguna, tenerParejaMedia, tenerProyectoDeEscalera } from '../juego/practica'
import { manoDeCodigo } from '../motor/cartas'
import type { Carta } from '../motor/cartas'

const m = (texto: string): Carta[] => manoDeCodigo(texto)

/**
 * MÓDULO 3 · El precio del bote.
 *
 * La primera regla de decisión de verdad, y la que más fichas ahorra: comparar
 * lo que te cuesta seguir con lo que puedes ganar. A partir de aquí el jugador
 * ya no decide por lo que tiene, sino por lo que le están cobrando.
 */

/** Genera una cuenta de precio del bote con números redondos. */
function cuentaDePrecio(azar: Aleatorio): PreguntaTest {
  const casos: Array<[bote: number, pagar: number]> = [
    [100, 50], [150, 50], [200, 40], [90, 30], [120, 60], [300, 100],
  ]
  const [bote, pagar] = casos[azar.entero(casos.length)]
  const necesario = Math.round((pagar / (bote + pagar)) * 100)

  const opciones = [
    { texto: `Un ${necesario}%`, correcta: true, porQue: `Pones ${pagar} para optar a ${bote + pagar}: ${pagar} ÷ ${bote + pagar} = ${necesario}%.` },
    { texto: `Un ${Math.round((pagar / bote) * 100)}%`, porQue: `Ese es el error típico: dividir entre el bote de antes (${bote}) y no entre el bote CON tu pago dentro (${bote + pagar}).` },
    { texto: '50%, siempre', porQue: 'Solo haría falta el 50% si te pidieran lo mismo que hay en el bote. Aquí no es el caso.' },
  ]

  return {
    enunciado: `Hay ${bote} en el bote y te piden ${pagar} para seguir. ¿Cuántas veces de cada cien necesitas ganar para que pagar no pierda fichas?`,
    opciones: opciones.sort(() => azar.siguiente() - 0.5),
  }
}

export const MODULO_3: Modulo = {
  numero: 3,
  titulo: 'El precio del bote',
  resumen: 'Cuánto cuesta pagar comparado con lo que puedes ganar. La primera regla de decisión real.',
  lecciones: [
    leccion({
      id: 'm3-l1',
      modulo: 3,
      titulo: 'Lo que te cobran y lo que puedes ganar',
      idea: 'Nunca se decide mirando solo tus cartas: se decide comparando tu porcentaje con lo que te están cobrando.',
      pasos: [
        { tipo: 'precio', texto: 'Hay **100** en el bote y te piden **50** para seguir.',
          bote: 100, pagar: 50,
          pie: 'Pones 1 para poder llevarte 3: con ganar una de cada tres ya no pierdes fichas.' },
        { tipo: 'porcentaje', texto: 'Si tu mano gana el **45%**, pagar sale a cuenta.',
          victoria: 0.45, pie: 'Necesitabas un 33% y tienes un 45%. Es dinero a la larga.' },
        { tipo: 'precio', texto: 'Pero con la **misma mano**, si te piden 300 a un bote de 100…',
          bote: 100, pagar: 300,
          pie: 'Ahora harían falta tres de cada cuatro veces. Con un 45% es tirar fichas.' },
        { tipo: 'texto', texto: 'Esa es la regla entera: **si tu porcentaje es mayor que el precio, se paga; si es menor, se suelta.**' },
      ],
      terminos: ['precioDelBote', 'bote'],
      practica: {
        tipo: 'test',
        pregunta: (azar) => {
          const preguntas: PreguntaTest[] = [
            {
              enunciado: 'Hay 100 en el bote y te piden 50. Ganas el 45% de las veces. ¿Qué haces?',
              opciones: [
                { texto: 'Pagar: necesito un 33% y tengo un 45%', correcta: true, porQue: 'Pones 50 para optar a 150: te basta con ganar una de cada tres. Con un 45% ganas fichas a la larga.' },
                { texto: 'Retirarme: pierdo más veces de las que gano', porQue: 'Perder más veces de las que ganas no es el criterio. Lo que importa es cuánto cobras cuando ganas.' },
                { texto: 'Depende de mis cartas', porQue: 'Tus cartas ya están dentro del 45%. Lo que falta es compararlo con el precio.' },
              ],
            },
            {
              enunciado: 'Hay 100 en el bote y te piden 300. Ganas el 45% de las veces. ¿Qué haces?',
              opciones: [
                { texto: 'Retirarme: necesito un 75% y solo tengo un 45%', correcta: true, porQue: 'Pones 300 para optar a 400: hace falta ganar tres de cada cuatro veces. Con un 45% es tirar fichas.' },
                { texto: 'Pagar: tengo casi la mitad', porQue: 'La mitad no basta cuando te cobran el triple del bote. Es la misma mano que antes y ahora es un error.' },
                { texto: 'Subir para asustarle', porQue: 'Subir con menos de la mitad y sin plan es cómo se pierden torneos enteros.' },
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
      id: 'm3-l2',
      modulo: 3,
      titulo: 'Calcular el precio de cabeza',
      idea: 'Divide lo que te piden entre el bote total contando tu pago. Ese es tu porcentaje mínimo.',
      pasos: [
        { tipo: 'precio', texto: 'Te piden **40** y en el bote hay **200**.',
          bote: 200, pagar: 40,
          pie: '40 entre 240: te basta con ganar una de cada seis veces.' },
        { tipo: 'precio', texto: 'Te piden **60** y en el bote hay **120**.',
          bote: 120, pagar: 60,
          pie: '60 entre 180: una de cada tres.' },
        { tipo: 'precio', texto: 'Cuanto más te piden, más veces tienes que ganar.',
          bote: 100, pagar: 200,
          pie: 'Aquí ya hacen falta dos de cada tres. Casi ninguna mano llega.' },
        { tipo: 'texto', texto: 'El error de todo el mundo al empezar: dividir entre el bote de antes en vez de entre el bote **con tu pago dentro**.' },
      ],
      terminos: ['precioDelBote'],
      practica: { tipo: 'test', pregunta: (azar) => cuentaDePrecio(azar) },
      dominio: 4,
      minimoManos: 4,
      maximoManos: 12,
    }),

    leccion({
      id: 'm3-l3',
      modulo: 3,
      titulo: 'Cuando el precio es bueno, se sigue',
      idea: 'Con una mano mediana y una apuesta pequeña, seguir sale a cuenta aunque sepas que no siempre vas ganando.',
      pasos: [
        { tipo: 'mesa', texto: 'Tienes pareja, pero **no la más alta** de la mesa.',
          mano: m('9h 8d'), mesa: m('Ks 9c 4d'),
          pie: 'No es una gran mano: pierdes contra bastantes cosas.' },
        { tipo: 'precio', texto: 'Pero el rival ha apostado poco: una quinta parte del bote.',
          bote: 200, pagar: 40 },
        { tipo: 'porcentaje', texto: 'Y tu mano gana mucho más que una de cada seis veces.',
          victoria: 0.42, empate: 0.02,
          pie: 'Retirarte aquí es regalar fichas por miedo.' },
        { tipo: 'texto', texto: 'Aquí es donde más fichas se dejan por el camino: confundir «no tengo la mejor mano» con «tengo que soltarla».' },
      ],
      terminos: ['precioDelBote', 'pareja'],
      practica: {
        tipo: 'decision',
        mano: () => ({
          calle: 'flop',
          condicion: tenerParejaMedia,
          bote: 200,
          paraPagar: 40,
          contexto: 'El rival apuesta poco. Tienes pareja, aunque no la más alta de la mesa.',
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
      id: 'm3-l4',
      modulo: 3,
      titulo: 'Cuando el precio es malo, se suelta',
      idea: 'La misma mano deja de valer en cuanto te piden mucho por ella. Lo que decide no es tu mano, es la cuenta.',
      pasos: [
        { tipo: 'mesa', texto: 'La misma mano regular, y el rival ha apostado en todas las calles.',
          mano: m('9h 8d'), mesa: m('Ks 9c 4d 2s') },
        { tipo: 'precio', texto: 'Ahora te pide **más que el bote entero**.',
          bote: 100, pagar: 150,
          pie: 'Necesitas ganar tres de cada cinco veces.' },
        { tipo: 'porcentaje', texto: 'Y contra alguien que apuesta tres veces, tu pareja media gana esto:',
          victoria: 0.19, empate: 0.02,
          pie: 'No llega ni de lejos.' },
        { tipo: 'texto', texto: 'No has hecho nada mal: te están cobrando un precio que no puedes pagar. Soltarlo sin enfadarte es lo que separa al que gana.' },
      ],
      terminos: [],
      practica: {
        tipo: 'decision',
        mano: () => ({
          calle: 'turn',
          condicion: alguna(tenerParejaMedia, tenerProyectoDeEscalera),
          bote: 100,
          paraPagar: 150,
          tusFichas: 500,
          fichasRival: 500,
          contexto: 'El rival ha apostado más que el bote en el turn, y ha apostado en todas las calles.',
          rangoRival: '77+, ATs+, KJs+, QJs, AQo+',
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

    leccion({
      id: 'm3-l5',
      modulo: 3,
      titulo: 'La misma mano, dos decisiones',
      idea: 'Cambiar el tamaño de la apuesta cambia la respuesta correcta sin tocar una sola carta.',
      pasos: [
        { tipo: 'porcentaje', texto: 'Un proyecto de color gana un **36%**. Ese número no cambia.',
          victoria: 0.36 },
        { tipo: 'precio', texto: 'Con este precio, se paga encantado.', bote: 200, pagar: 40 },
        { tipo: 'precio', texto: 'Con este, se suelta sin pensarlo.', bote: 200, pagar: 400,
          pie: 'La mano es la misma. Lo único que cambió fue lo que te piden.' },
        { tipo: 'texto', texto: 'Por eso, a «¿pagarías con esto?», la respuesta honesta siempre es: **depende de cuánto me pidan**.' },
      ],
      terminos: ['precioDelBote', 'proyecto'],
      practica: {
        tipo: 'test',
        pregunta: (azar) => {
          const preguntas: PreguntaTest[] = [
            {
              enunciado: 'Tienes proyecto de color (36%). Hay 200 en el bote. ¿Con cuál de estas apuestas te sale a cuenta seguir?',
              opciones: [
                { texto: 'Te piden 40', correcta: true, porQue: '40 ÷ 240 = 17%. Con un 36% es pagar con los ojos cerrados.' },
                { texto: 'Te piden 400', porQue: '400 ÷ 600 = 67%. Necesitarías ganar dos de cada tres veces y solo ganas una.' },
                { texto: 'Da igual: el proyecto siempre se paga', porQue: 'Ese es justo el error que arruina a los que empiezan. El proyecto vale lo que cueste seguir.' },
              ],
            },
            {
              enunciado: 'El rival apuesta muy grande. ¿Qué es lo más sensato pensar?',
              opciones: [
                { texto: 'Que me está poniendo un precio que casi ninguna mano puede pagar', correcta: true, porQue: 'Apostar grande no es solo fuerza: también es quitarte el precio. Por eso ante una apuesta enorme se juega mucho más apretado.' },
                { texto: 'Que seguro que va de farol', porQue: 'Puede ir de farol, pero suponerlo siempre es carísimo.' },
                { texto: 'Que seguro que tiene la mejor mano', porQue: 'Suponerlo siempre es el otro extremo, y te convierte en alguien a quien se le echa de cualquier bote.' },
              ],
            },
          ]
          return preguntas[azar.entero(preguntas.length)]
        },
      },
      dominio: 2,
      minimoManos: 2,
      maximoManos: 7,
    }),
  ],
}
