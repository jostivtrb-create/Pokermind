import type { Aleatorio } from '../motor/aleatorio'
import { crearAleatorio, semillaDelDia } from '../motor/aleatorio'
import type { Leccion } from './lecciones'
import { leccion } from './lecciones'
import type { ManoDePractica } from './practica'
import { crearManoDePractica, tenerParejaMedia, tenerProyectoDeColor, tenerManoMuyFuerte, alguna } from './practica'

/**
 * El reto diario (D29): una mano difícil al día, LA MISMA para todo el mundo.
 *
 * Por eso el azar del juego lleva semilla: con la fecha como semilla, el reparto
 * sale idéntico en todos los aparatos sin necesidad de preguntarle nada a ningún
 * servidor. Funciona igual sin conexión.
 */

export function fechaDeHoy(fecha = new Date()): string {
  return fecha.toISOString().slice(0, 10)
}

/** Situaciones difíciles de verdad: las que separan a quien piensa de quien va a bulto. */
const SITUACIONES = [
  {
    condicion: alguna(tenerParejaMedia, tenerProyectoDeColor),
    bote: 260, paraPagar: 180,
    contexto: 'El rival ha apostado fuerte en el turn después de pasar en el flop.',
    rango: '77+, ATs+, KJs+, QJs, AQo+',
  },
  {
    condicion: tenerManoMuyFuerte,
    bote: 150, paraPagar: 0,
    contexto: 'Llevas una mano enorme y el rival acaba de pasar. ¿Le cobras o le dejas hacer?',
    rango: 'AKo, AQo, AJo, KQo, AKs, AQs, KQs',
  },
  {
    condicion: tenerParejaMedia,
    bote: 320, paraPagar: 240,
    contexto: 'Tercera apuesta seguida del rival, y esta es la más grande de todas.',
    rango: '99+, AJs+, KQs, AQo+',
  },
] as const

export function manoDelDia(fecha = new Date()): ManoDePractica {
  const azar: Aleatorio = crearAleatorio(semillaDelDia(fecha))
  const situacion = SITUACIONES[azar.entero(SITUACIONES.length)]
  return crearManoDePractica(azar, {
    calle: azar.siguiente() < 0.5 ? 'turn' : 'river',
    condicion: situacion.condicion,
    bote: situacion.bote,
    paraPagar: situacion.paraPagar,
    tusFichas: 800,
    fichasRival: 800,
    contexto: situacion.contexto,
    rangoRival: situacion.rango,
    exigencia: 'intermedia',
  })
}

/** La lección de mentira que envuelve al reto, para poder reutilizar la sesión. */
export const LECCION_RETO: Leccion = leccion({
  id: 'reto-diario',
  modulo: 0,
  titulo: 'Reto del día',
  idea: 'Una mano difícil al día, la misma para todo el mundo. Sin ayudas.',
  explicacion: ['Una sola mano. Decide y mira el porqué.'],
  practica: { tipo: 'decision', mano: () => ({ calle: 'turn', bote: 100, paraPagar: 50, contexto: '' }) },
  dominio: 1,
  minimoManos: 1,
  maximoManos: 1,
  ayuda: 'nunca',
  ejemploResuelto: false,
  exigencia: 'intermedia',
})

/** La lección de mentira del repaso de errores (D15). */
export const LECCION_REPASO: Leccion = leccion({
  id: 'repaso-errores',
  modulo: 0,
  titulo: 'Repaso de errores',
  idea: 'Manos que fallaste hace unos días, cambiadas de palo para que no valga memorizar.',
  explicacion: ['Estas ya las has visto. Vamos a ver si ahora sabes por qué.'],
  practica: { tipo: 'decision', mano: () => ({ calle: 'turn', bote: 100, paraPagar: 50, contexto: '' }) },
  dominio: 1,
  minimoManos: 1,
  maximoManos: 1,
  ayuda: 'nunca',
  ejemploResuelto: false,
  exigencia: 'intermedia',
})
