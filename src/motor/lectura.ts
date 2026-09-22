import type { Calle } from './decision'
import type { EstadoMesa, Jugador } from './mesa'
import type { Posicion } from './rangos'
import { estrecharPorFuerza, quitarBloqueadas, rangoApertura, rangoPago, rangoTotal } from './rangos'
import { RIVAL_TIPICO } from './perfiles'
import type { Rango } from './rangos'

/**
 * Leer al rival: deducir qué manos puede tener por lo que ha ido haciendo.
 *
 * Es el módulo 6 del temario convertido en código, y hace dos trabajos: los bots
 * lo usan para decidir, y el juego lo usa para enseñarte al final de la mano qué
 * podía tener el que tenías enfrente (D26).
 *
 * No es adivinación: se parte de lo que se abre desde su silla y se va
 * estrechando cada vez que pone fichas. Quien apuesta tres veces seguidas casi
 * nunca lleva nada.
 */

/** En qué silla está respecto al botón. */
export function posicionDe(estado: EstadoMesa, indice: number): Posicion {
  const n = estado.jugadores.length
  const desdeBoton = (indice - estado.boton + n) % n
  if (desdeBoton === 0) return 'boton'
  if (desdeBoton === 1) return 'ciegaPequena'
  if (desdeBoton === 2) return 'ciegaGrande'
  return 'utg'
}

/** Cuánto se estrecha el rango con cada acción agresiva, por calle. */
const APRIETA_AL_SUBIR: Record<Calle, number> = {
  preflop: 0.45,
  flop: 0.45,
  turn: 0.4,
  river: 0.35,
}
const APRIETA_AL_PAGAR: Record<Calle, number> = {
  preflop: 0.9,
  flop: 0.7,
  turn: 0.65,
  river: 0.6,
}

/**
 * El rango con el que se le puede estar jugando a alguien ahora mismo.
 * `cartasVistas` son las que quien lee tiene delante: sus propias cartas y la
 * mesa. Ninguna de esas puede estar en la mano del rival.
 */
export function rangoEstimado(
  estado: EstadoMesa,
  jugador: Jugador,
  cartasVistas: readonly number[] = estado.comunitarias,
): Rango {
  const indice = estado.jugadores.indexOf(jugador)
  const posicion = posicionDe(estado, indice)
  const suyas = estado.historial.filter((h) => h.jugador === jugador.id)

  const subioAntesDelFlop = suyas.some((h) => h.calle === 'preflop' && h.accion === 'subir')
  const pagoAntesDelFlop = suyas.some((h) => h.calle === 'preflop' && h.accion === 'pagar')

  let rango: Rango
  if (subioAntesDelFlop) {
    rango = rangoApertura(posicion)
    /*
      El TAMAÑO de la subida dice muchísimo, y antes no se miraba: subir tres
      veces la ciega y subir diez daban el mismo rango. Con eso, el motor creía
      que a una subida enorme se le podía resubir con J-8, porque el rival
      "todavía podía llevar cualquier cosa".
    */
    const suSubida = suyas.find((h) => h.calle === 'preflop' && h.accion === 'subir')
    const veces = suSubida ? (suSubida.cantidad + estado.ciegaGrande) / estado.ciegaGrande : 0
    const quedarse = veces >= 10 ? 0.2 : veces >= 7 ? 0.35 : veces >= 4.5 ? 0.6 : 1
    if (quedarse < 1) rango = estrecharPorFuerza(rango, [], quedarse)
    rango = {
      ...rango,
      descripcion:
        quedarse < 1
          ? `las manos con las que sube ${Math.round(veces)} veces la ciega desde ${textoPosicion(posicion)}`
          : `las manos con las que sube desde ${textoPosicion(posicion)}`,
    }
  } else if (pagoAntesDelFlop) {
    rango = rangoPago(posicion)
  } else if (posicion === 'ciegaGrande') {
    // La ciega grande ve el flop gratis con cualquier cosa: no dice nada de su mano.
    rango = rangoTotal()
    rango.descripcion = 'cualquier mano, porque la ciega grande entra gratis'
  } else {
    rango = rangoApertura(posicion)
  }

  rango = quitarBloqueadas(rango, cartasVistas)

  /*
    Cada vez que pone fichas después del flop, se queda con la mejor parte de lo
    que tenía… y con sus faroles.

    Sin la parte de faroles el rango se convertía en "solo la nuez" a las tres
    apuestas, y con eso el juego llegó a decirle a un jugador con doble pareja
    de reyes y reinas que ganaba el 0%. Cuánto farolea depende de su carácter:
    una roca casi nunca, un loco todo el rato.
  */
  const perfil = jugador.perfil ?? RIVAL_TIPICO
  const faroles = 0.15 + 0.75 * perfil.farol
  let apretado = rango
  const acciones = suyas.filter((h) => h.calle !== 'preflop')
  for (const accion of acciones) {
    if (accion.accion === 'subir') {
      apretado = estrecharPorFuerza(
        apretado, estado.comunitarias, APRIETA_AL_SUBIR[accion.calle], undefined, faroles,
      )
    } else if (accion.accion === 'pagar') {
      // Al pagar no se farolea: se paga con algo, aunque sea flojo.
      apretado = estrecharPorFuerza(apretado, estado.comunitarias, APRIETA_AL_PAGAR[accion.calle])
    }
  }

  const apuestas = acciones.filter((a) => a.accion === 'subir').length
  apretado.descripcion = descripcionDe(rango.descripcion, apuestas, acciones.length)
  return apretado
}

function descripcionDe(base: string, apuestas: number, acciones: number): string {
  if (apuestas >= 3) return `${base}, y después de apostar tres veces casi solo le quedan manos muy fuertes`
  if (apuestas === 2) return `${base}, apretado por sus dos apuestas`
  if (apuestas === 1) return `${base}, apretado por su apuesta`
  if (acciones > 0) return `${base}, apretado por haber seguido en la mano`
  return base
}

function textoPosicion(posicion: Posicion): string {
  return {
    utg: 'primera posición',
    boton: 'el botón',
    ciegaPequena: 'la ciega pequeña',
    ciegaGrande: 'la ciega grande',
  }[posicion]
}

/** El rival más peligroso de los que siguen vivos: el que más fichas ha metido. */
export function rivalPrincipal(estado: EstadoMesa, yo: Jugador): Jugador | null {
  const otros = estado.jugadores.filter(
    (j) => j.id !== yo.id && (j.estado === 'jugando' || j.estado === 'allin'),
  )
  if (otros.length === 0) return null
  return otros.reduce((a, b) => (b.apostadoEnLaMano > a.apostadoEnLaMano ? b : a))
}
