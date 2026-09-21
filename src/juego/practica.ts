import type { Aleatorio } from '../motor/aleatorio'
import type { Carta } from '../motor/cartas'
import { NOMBRES_VALOR, barajaCompleta, barajar } from '../motor/cartas'
import type { Calle, Exigencia, Situacion } from '../motor/decision'
import { categoriaDe, describirMano, evaluar, Categoria } from '../motor/evaluador'
import type { PerfilRival } from '../motor/perfiles'
import { RIVAL_TIPICO } from '../motor/perfiles'
import type { Posicion } from '../motor/rangos'
import { parsearRango } from '../motor/rangos'
import { proyectoDeLaMano } from '../motor/proyectos'

/**
 * Una mano de práctica del entrenador.
 *
 * Es JSON corriente a propósito: así una mano fallada se puede guardar y volver
 * a poner días después (D15), y el reto diario puede ser la misma mano para todo
 * el mundo (D29).
 *
 * Las manos no se escriben a mano una a una: cada lección dice qué tiene que
 * pasar en ella ("que tengas proyecto de color en el flop") y se reparten cartas
 * hasta que se cumple. Así la práctica es infinita y no se memoriza (S11).
 */
export interface ManoDePractica {
  mano: [Carta, Carta]
  mesa: Carta[]
  calle: Calle
  bote: number
  paraPagar: number
  tusFichas: number
  fichasRival: number
  posicion: Posicion
  /** Rango del rival en notación de texto, para poder guardarlo y releerlo. */
  rangoRival: string
  perfilRival: PerfilRival
  /** Lo que ha pasado hasta aquí, contado en una línea. */
  contexto: string
  /** Cuánto se le exige al jugador en esta mano (D20). */
  exigencia: Exigencia
}

/** Pasa la mano de práctica a lo que entiende el motor de decisiones. */
export function aSituacion(practica: ManoDePractica): Situacion {
  return {
    mano: practica.mano,
    mesa: practica.mesa,
    calle: practica.calle,
    bote: practica.bote,
    paraPagar: practica.paraPagar,
    tusFichas: practica.tusFichas,
    fichasRival: practica.fichasRival,
    rangoRival: parsearRango(practica.rangoRival),
    perfilRival: practica.perfilRival,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Repartir manos que cumplan una condición
// ─────────────────────────────────────────────────────────────────────────────

export interface Condicion {
  /** Nombre para poder explicarlo y para depurar. */
  nombre: string
  cumple: (mano: readonly Carta[], mesa: readonly Carta[]) => boolean
}

const INTENTOS_MAXIMOS = 4000

/**
 * Reparte cartas hasta que se cumpla la condición de la lección.
 *
 * Si tras muchos intentos no sale (una condición demasiado rara), devuelve el
 * último reparto: vale más una mano parecida que un entrenador que se queda
 * colgado. Que esto pase se avisa por consola en desarrollo.
 */
export function repartirQueCumpla(
  azar: Aleatorio,
  cartasDeMesa: number,
  condicion?: Condicion,
): { mano: [Carta, Carta]; mesa: Carta[] } {
  let ultimo: { mano: [Carta, Carta]; mesa: Carta[] } | null = null

  for (let intento = 0; intento < INTENTOS_MAXIMOS; intento++) {
    const baraja = barajar(barajaCompleta(), azar)
    const mano: [Carta, Carta] = [baraja[0], baraja[1]]
    const mesa = baraja.slice(2, 2 + cartasDeMesa)
    ultimo = { mano, mesa }
    if (!condicion || condicion.cumple(mano, mesa)) return ultimo
  }

  if (typeof console !== 'undefined' && condicion) {
    console.warn(`[PokerMind] No salió ninguna mano con "${condicion.nombre}" en ${INTENTOS_MAXIMOS} intentos`)
  }
  return ultimo!
}

// ─── Condiciones que usan las lecciones ──────────────────────────────────────

export const tenerParejaServida: Condicion = {
  nombre: 'pareja servida',
  cumple: (mano) => (mano[0] >> 2) === (mano[1] >> 2),
}

export const tenerProyectoDeColor: Condicion = {
  nombre: 'proyecto de color',
  cumple: (mano, mesa) => {
    if ((mano[0] & 3) !== (mano[1] & 3)) return false
    const palo = mano[0] & 3
    const enMesa = mesa.filter((c) => (c & 3) === palo).length
    return enMesa === 2 // cuatro del palo: falta una
  },
}

export const tenerProyectoDeEscalera: Condicion = {
  nombre: 'proyecto de escalera',
  cumple: (mano, mesa) => {
    const valores = new Set([...mano, ...mesa].map((c) => c >> 2))
    const mias = mano.map((c) => c >> 2)
    for (let alto = 12; alto >= 3; alto--) {
      const cuatro = [alto, alto - 1, alto - 2, alto - 3]
      if (cuatro.every((v) => valores.has(v)) && mias.some((v) => cuatro.includes(v))) {
        // Que sea proyecto y no escalera hecha.
        return !hayEscalera(valores)
      }
    }
    return false
  },
}

function hayEscalera(valores: Set<number>): boolean {
  for (let alto = 12; alto >= 4; alto--) {
    if ([0, 1, 2, 3, 4].every((d) => valores.has(alto - d))) return true
  }
  return false
}

export const tenerManoHecha: Condicion = {
  nombre: 'pareja o mejor con la mesa',
  cumple: (mano, mesa) => {
    if (mesa.length === 0) return false
    const categoria = categoriaDe(evaluar([...mano, ...mesa]))
    if (categoria > Categoria.Pareja) return true
    // Que la pareja la haga con una carta suya, no con la mesa sola.
    const valoresMesa = mesa.map((c) => c >> 2)
    return mano.some((c) => valoresMesa.includes(c >> 2)) || (mano[0] >> 2) === (mano[1] >> 2)
  },
}

export const tenerNada: Condicion = {
  nombre: 'nada de nada',
  cumple: (mano, mesa) => !tenerManoHecha.cumple(mano, mesa) && !tenerProyectoDeColor.cumple(mano, mesa),
}

export const tenerManoMuyFuerte: Condicion = {
  nombre: 'trío o mejor',
  cumple: (mano, mesa) => mesa.length > 0 && categoriaDe(evaluar([...mano, ...mesa])) >= Categoria.Trio,
}

/** Que las dos cartas sean altas: de jota para arriba. */
export const tenerDosCartasAltas: Condicion = {
  nombre: 'dos cartas altas',
  cumple: (mano) => (mano[0] >> 2) >= 9 && (mano[1] >> 2) >= 9,
}

/** Une varias condiciones: tienen que cumplirse todas. */
export function todas(...condiciones: Condicion[]): Condicion {
  return {
    nombre: condiciones.map((c) => c.nombre).join(' + '),
    cumple: (mano, mesa) => condiciones.every((c) => c.cumple(mano, mesa)),
  }
}

/** Cualquiera de ellas vale. */
export function alguna(...condiciones: Condicion[]): Condicion {
  return {
    nombre: condiciones.map((c) => c.nombre).join(' o '),
    cumple: (mano, mesa) => condiciones.some((c) => c.cumple(mano, mesa)),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Construir la mano de práctica
// ─────────────────────────────────────────────────────────────────────────────

export interface EspecDeMano {
  calle: Calle
  condicion?: Condicion
  /** Bote antes de tu decisión. */
  bote: number
  paraPagar: number
  tusFichas?: number
  fichasRival?: number
  posicion?: Posicion
  rangoRival?: string
  perfilRival?: PerfilRival
  contexto: string
  exigencia?: Exigencia
}

const CARTAS_POR_CALLE: Record<Calle, number> = { preflop: 0, flop: 3, turn: 4, river: 5 }

export function crearManoDePractica(azar: Aleatorio, espec: EspecDeMano): ManoDePractica {
  const { mano, mesa } = repartirQueCumpla(azar, CARTAS_POR_CALLE[espec.calle], espec.condicion)
  return {
    mano,
    mesa,
    calle: espec.calle,
    bote: espec.bote,
    paraPagar: espec.paraPagar,
    tusFichas: espec.tusFichas ?? 1000,
    fichasRival: espec.fichasRival ?? 1000,
    posicion: espec.posicion ?? 'boton',
    rangoRival: espec.rangoRival ?? '22+, A2s+, K9s+, Q9s+, J9s+, T9s, A8o+, KTo+, QTo+',
    perfilRival: espec.perfilRival ?? RIVAL_TIPICO,
    contexto: espec.contexto,
    exigencia: espec.exigencia ?? 'intermedia',
  }
}

/**
 * ¿Tu mano aporta algo de verdad, o estás jugando la mesa?
 *
 * No vale con que una de tus cartas aparezca en las cinco finales: un 10 de
 * acompañante sobre una pareja que está en la mesa no es "tener pareja", y
 * decírselo así a alguien que empieza es engañarle. Solo cuenta si tus cartas
 * forman la jugada: pareja servida, emparejas con la mesa, o pones carta para
 * un color o una escalera.
 */
export function usaTusCartas(mano: readonly Carta[], mesa: readonly Carta[]): boolean {
  if (mesa.length === 0) return true
  const [a, b] = mano
  const va = a >> 2
  const vb = b >> 2
  if (va === vb) return true // pareja servida

  const valoresMesa = mesa.map((c) => c >> 2)
  if (valoresMesa.includes(va) || valoresMesa.includes(vb)) return true // emparejas con la mesa

  // Color: cinco del mismo palo contando las tuyas. Con tres en la mesa y dos
  // tuyas también hay color, así que hay que sumar las dos partes y no solo la mesa.
  for (const carta of mano) {
    const palo = carta & 3
    const enMesa = mesa.filter((c) => (c & 3) === palo).length
    const mias = mano.filter((c) => (c & 3) === palo).length
    if (enMesa + mias >= 5 && enMesa >= 3) return true
  }

  // Escalera: cinco valores seguidos usando alguna carta tuya.
  const todos = new Set([...valoresMesa, va, vb])
  for (let alto = 12; alto >= 4; alto--) {
    const cinco = [alto, alto - 1, alto - 2, alto - 3, alto - 4]
    if (cinco.every((v) => todos.has(v)) && (cinco.includes(va) || cinco.includes(vb))) return true
  }
  return false
}

/** Mesa con pareja o más: la que despista al que está aprendiendo. */
export const mesaSinParejas: Condicion = {
  nombre: 'mesa sin parejas',
  cumple: (_mano, mesa) => {
    const valores = mesa.map((c) => c >> 2)
    return new Set(valores).size === valores.length
  },
}

/** Pareja usando una carta tuya, pero NO la carta más alta de la mesa. */
export const tenerParejaMedia: Condicion = {
  nombre: 'pareja que no es la más alta',
  cumple: (mano, mesa) => {
    if (mesa.length === 0) return false
    const valores = mesa.map((c) => c >> 2)
    const masAlta = Math.max(...valores)
    const emparejadas = mano.filter((c) => valores.includes(c >> 2))
    if (emparejadas.length !== 1) return false
    return (emparejadas[0] >> 2) !== masAlta
  },
}

/** Mano floja de las de tirar antes del flop: sin pareja, sin figuras, sin conexión. */
export const manoFloja: Condicion = {
  nombre: 'mano floja antes del flop',
  cumple: (mano) => {
    const [a, b] = mano
    const va = a >> 2
    const vb = b >> 2
    if (va === vb) return false
    if (va >= 9 || vb >= 9) return false // nada de jotas para arriba
    const conectada = Math.abs(va - vb) <= 2
    const mismoPalo = (a & 3) === (b & 3)
    return !(conectada && mismoPalo)
  },
}

/** Mano de las que se abren desde el botón pero no desde primera posición. */
export const manoDeButaca: Condicion = {
  nombre: 'mano media, de las que dependen de la posición',
  cumple: (mano) => {
    const [a, b] = mano
    const va = a >> 2
    const vb = b >> 2
    if (va === vb) return false
    const alta = Math.max(va, vb)
    const baja = Math.min(va, vb)
    const mismoPalo = (a & 3) === (b & 3)
    // Suited de as/rey bajitas, conectores del mismo palo, o figura con carta media.
    if (mismoPalo && (alta >= 10 || alta - baja <= 2)) return alta < 12 || baja < 8
    return alta >= 9 && baja >= 5 && baja <= 8
  },
}

/** Mesa de cartas bajas: la que no le sirve a quien juega figuras. */
export const mesaBaja: Condicion = {
  nombre: 'mesa de cartas bajas',
  cumple: (_mano, mesa) => mesa.length > 0 && mesa.every((c) => (c >> 2) <= 6),
}

/** Mano de las buenas de verdad antes del flop. */
export const manoPremium: Condicion = {
  nombre: 'mano fuerte antes del flop',
  cumple: (mano) => {
    const [a, b] = mano
    const va = a >> 2
    const vb = b >> 2
    if (va === vb) return va >= 8 // parejas de dieces para arriba
    const alta = Math.max(va, vb)
    const baja = Math.min(va, vb)
    return alta === 12 && baja >= 10 // AK, AQ
  },
}

/** Mano que vale para abrir desde cualquier sitio, sin ser premium. */
export const manoSolida: Condicion = {
  nombre: 'mano sólida antes del flop',
  cumple: (mano) => {
    const [a, b] = mano
    const va = a >> 2
    const vb = b >> 2
    if (va === vb) return va >= 5 // parejas de sietes para arriba
    const alta = Math.max(va, vb)
    const baja = Math.min(va, vb)
    const mismoPalo = (a & 3) === (b & 3)
    if (alta === 12) return baja >= (mismoPalo ? 8 : 10)
    if (alta === 11) return baja >= (mismoPalo ? 9 : 10)
    return false
  },
}

/**
 * Mesa seca: sin tres cartas del mismo palo ni tres seguidas.
 *
 * Importa más de lo que parece. En una mesa con tres cartas del mismo palo, el
 * rival que juega figuras del mismo palo SÍ tiene con qué seguir, y entonces
 * esconder una mano fuerte deja de ser lo mejor. Una lección sobre "su rango no
 * liga nada" tiene que repartir mesas donde de verdad no ligue nada.
 */
export const mesaSeca: Condicion = {
  nombre: 'mesa seca',
  cumple: (_mano, mesa) => {
    if (mesa.length === 0) return false
    const porPalo = [0, 0, 0, 0]
    for (const c of mesa) porPalo[c & 3]++
    if (porPalo.some((n) => n >= 3)) return false

    const valores = [...new Set(mesa.map((c) => c >> 2))].sort((a, b) => a - b)
    for (let i = 0; i + 2 < valores.length; i++) {
      if (valores[i + 2] - valores[i] <= 4) return false // tres cartas cerca: hay escaleras
    }
    return true
  },
}

/**
 * Lo que tienes AHORA, contando también lo que puedes llegar a tener.
 *
 * Decir "carta alta: rey" cuando llevas cuatro cartas del mismo palo es cierto
 * y engaña: toda la mano depende de ese proyecto, y el propio juego enseña a
 * contarlo dos módulos antes. Lo detectaron dos personas mirando la misma
 * pantalla.
 */
export function proyectosDe(mano: readonly Carta[], mesa: readonly Carta[]): string[] {
  if (mesa.length === 0 || mesa.length >= 5 || mano.length < 2) return []
  // El mismo contador que usa la explicación, para que no digan cosas distintas:
  // nombra las cartas que te faltan, no solo "tienes un proyecto".
  const outs = proyectoDeLaMano(mano as [Carta, Carta], mesa)
  if (outs.cuantas === 0) return []
  return [`${outs.proyecto}: te sirven ${outs.cuantas} cartas (${outs.comoSeLlaman})`]
}

/**
 * "Carta alta: rey, y proyecto de color". Lo que se enseña encima de la mesa.
 *
 * Con la mesa A-6-J-8 y un 10-3 en la mano, decir "tienes carta alta: as"
 * confunde: ese as no es tuyo, está en la mesa y lo tiene todo el mundo. Cuando
 * tus dos cartas no pintan nada se dice así, que es como se dice en una mesa.
 */
export function describirTuMano(mano: readonly Carta[], mesa: readonly Carta[]): string {
  const proyectos = proyectosDe(mano, mesa)
  const hecha = describirLoHecho(mano, mesa)
  if (proyectos.length === 0) return hecha
  const une = hecha.startsWith('no tienes') ? ', pero tienes ' : ', y '
  return `${hecha}${une}${proyectos.join(' y ')}`
}

/** La jugada hecha, diciendo la verdad sobre de quién es la carta alta. */
function describirLoHecho(mano: readonly Carta[], mesa: readonly Carta[]): string {
  if (mesa.length === 0) return describirMano([...mano, ...mesa])
  const categoria = categoriaDe(evaluar([...mano, ...mesa]))
  if (categoria > Categoria.CartaAlta) return describirMano([...mano, ...mesa])

  // "Carta alta: as" cuando el as está en la mesa es mentira piadosa y confunde:
  // ese as lo tiene todo el que siga en la mano.
  const masAlta = Math.max(...[...mano, ...mesa].map((c) => c >> 2))
  const esTuya = mano.some((c) => (c >> 2) === masAlta)
  // "la jota" y "la reina" llevan artículo femenino; el resto, masculino.
  const articulo = masAlta === 9 || masAlta === 10 ? 'la' : 'el'
  return esTuya
    ? `no tienes pareja: tu carta alta es ${articulo} ${NOMBRES_VALOR[masAlta]}`
    : 'no tienes pareja: la carta más alta está en la mesa y la tiene todo el mundo'
}

/** Lo contrario de una condición. */
export function sin(condicion: Condicion): Condicion {
  return { nombre: `sin ${condicion.nombre}`, cumple: (mano, mesa) => !condicion.cumple(mano, mesa) }
}
