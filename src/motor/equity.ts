import type { Aleatorio } from './aleatorio'
import { aleatorioLibre } from './aleatorio'
import type { Carta } from './cartas'
import { TOTAL_CARTAS } from './cartas'
import { evaluar } from './evaluador'

/**
 * Probabilidades de ganar. Este archivo es el que convierte "tengo A♠K♠ en este
 * flop" en "ganas el 42% de las veces", que es de lo que va el juego entero.
 *
 * Dos formas de calcularlo:
 *  · EXACTA  — se prueban todas las cartas que pueden salir y todas las manos que
 *              el rival puede tener. Da el número de verdad, sin ruido.
 *  · SIMULADA — cuando lo exacto son demasiadas combinaciones (sobre todo antes
 *              del flop), se reparten muchas manos al azar y se cuenta. El error
 *              con 20.000 repeticiones es de unas décimas de punto porcentual.
 *
 * Se elige solo: si lo exacto cabe en el presupuesto, se hace exacto.
 */

/** Una mano concreta del rival: dos cartas y cuánto pesa dentro de su rango. */
export interface Combo {
  a: Carta
  b: Carta
  peso: number
}

export interface Probabilidades {
  /** Porcentaje (0–1) de veces que ganas la mano. */
  victoria: number
  /** Porcentaje (0–1) de veces que empatas y se reparte el bote. */
  empate: number
  /** Porcentaje (0–1) de veces que pierdes. */
  derrota: number
  /**
   * La cifra que de verdad se usa para decidir: victoria + la parte que te toca
   * de los empates. Es "qué porcentaje del bote es tuyo a largo plazo".
   */
  equity: number
  /** Cómo se calculó, para poder decirlo en la explicación. */
  exacto: boolean
  repeticiones: number
}

export interface OpcionesEquity {
  /** Repeticiones de la simulación cuando no se puede ser exacto. */
  repeticiones?: number
  /** Tope de combinaciones para intentar el cálculo exacto. */
  topeExacto?: number
  azar?: Aleatorio
}

const REPETICIONES_POR_DEFECTO = 20000
const TOPE_EXACTO = 600000

/** Cartas que quedan en la baraja, como lista de números. */
function restantes(fuera: Uint8Array): Carta[] {
  const lista: Carta[] = []
  for (let c = 0; c < TOTAL_CARTAS; c++) if (!fuera[c]) lista.push(c)
  return lista
}

function marcar(cartas: readonly Carta[], fuera: Uint8Array): void {
  for (const c of cartas) fuera[c] = 1
}

/** Combinaciones de `k` elementos entre `n`. */
function combinaciones(n: number, k: number): number {
  if (k < 0 || k > n) return 0
  let r = 1
  for (let i = 0; i < k; i++) r = (r * (n - i)) / (i + 1)
  return Math.round(r)
}

/**
 * Probabilidad de que tu mano gane contra el rango del rival.
 *
 * `rango` son las manos que el rival puede tener (con su peso). Contra un rival
 * que puede tener cualquier cosa se le pasa el rango completo; contra uno que ha
 * subido desde la primera posición, solo sus manos buenas. Esa diferencia es
 * justo lo que el juego enseña.
 */
export function equityContraRango(
  mano: readonly [Carta, Carta],
  mesa: readonly Carta[],
  rango: readonly Combo[],
  opciones: OpcionesEquity = {},
): Probabilidades {
  const fuera = new Uint8Array(TOTAL_CARTAS)
  marcar(mano, fuera)
  marcar(mesa, fuera)

  // El rival no puede tener una carta que ya está en tu mano o en la mesa.
  const posibles = rango.filter((c) => !fuera[c.a] && !fuera[c.b] && c.peso > 0)
  if (posibles.length === 0) {
    return { victoria: 0, empate: 0, derrota: 0, equity: 0, exacto: true, repeticiones: 0 }
  }

  const porSalir = 5 - mesa.length
  const baraja = restantes(fuera)
  const coste = posibles.length * combinaciones(baraja.length - 2, porSalir)
  const tope = opciones.topeExacto ?? TOPE_EXACTO

  return coste <= tope
    ? equityExacta(mano, mesa, posibles, porSalir)
    : equitySimulada(mano, mesa, posibles, porSalir, opciones)
}

/** Contra rivales de los que no se sabe nada: cualquier mano es posible. */
export function equityContraAleatorias(
  mano: readonly [Carta, Carta],
  mesa: readonly Carta[],
  rivales = 1,
  opciones: OpcionesEquity = {},
): Probabilidades {
  if (rivales === 1) {
    return equityContraRango(mano, mesa, rangoCompleto(), opciones)
  }
  return equitySimuladaVarios(mano, mesa, rivales, opciones)
}

/** Las 1.326 manos posibles, todas con el mismo peso. */
export function rangoCompleto(): Combo[] {
  const combos: Combo[] = []
  for (let a = 0; a < TOTAL_CARTAS; a++) {
    for (let b = a + 1; b < TOTAL_CARTAS; b++) combos.push({ a, b, peso: 1 })
  }
  return combos
}

function equityExacta(
  mano: readonly [Carta, Carta],
  mesa: readonly Carta[],
  rango: readonly Combo[],
  porSalir: number,
): Probabilidades {
  let victorias = 0
  let empates = 0
  let derrotas = 0
  let puntos = 0
  let peso = 0

  const siete = [mano[0], mano[1], ...mesa, 0, 0]
  const rival = [0, 0, ...mesa, 0, 0]

  for (const combo of rango) {
    const fuera = new Uint8Array(TOTAL_CARTAS)
    marcar(mano, fuera)
    marcar(mesa, fuera)
    fuera[combo.a] = 1
    fuera[combo.b] = 1
    const baraja = restantes(fuera)
    rival[0] = combo.a
    rival[1] = combo.b

    recorrerSalidas(baraja, porSalir, (salidas) => {
      for (let i = 0; i < porSalir; i++) {
        siete[2 + mesa.length + i] = salidas[i]
        rival[2 + mesa.length + i] = salidas[i]
      }
      const mias = evaluar(siete.slice(0, 2 + mesa.length + porSalir))
      const suyas = evaluar(rival.slice(0, 2 + mesa.length + porSalir))
      peso += combo.peso
      if (mias > suyas) {
        victorias += combo.peso
        puntos += combo.peso
      } else if (mias === suyas) {
        empates += combo.peso
        puntos += combo.peso / 2
      } else {
        derrotas += combo.peso
      }
    })
  }

  return {
    victoria: victorias / peso,
    empate: empates / peso,
    derrota: derrotas / peso,
    equity: puntos / peso,
    exacto: true,
    repeticiones: Math.round(peso),
  }
}

/** Recorre todas las formas de que salgan `cuantas` cartas de las que quedan. */
function recorrerSalidas(baraja: readonly Carta[], cuantas: number, visitar: (salidas: Carta[]) => void): void {
  if (cuantas === 0) {
    visitar([])
    return
  }
  const indices = Array.from({ length: cuantas }, (_, i) => i)
  const salidas = new Array<Carta>(cuantas)
  const n = baraja.length
  for (;;) {
    for (let i = 0; i < cuantas; i++) salidas[i] = baraja[indices[i]]
    visitar(salidas)
    let i = cuantas - 1
    while (i >= 0 && indices[i] === n - cuantas + i) i--
    if (i < 0) return
    indices[i]++
    for (let j = i + 1; j < cuantas; j++) indices[j] = indices[j - 1] + 1
  }
}

function equitySimulada(
  mano: readonly [Carta, Carta],
  mesa: readonly Carta[],
  rango: readonly Combo[],
  porSalir: number,
  opciones: OpcionesEquity,
): Probabilidades {
  const azar = opciones.azar ?? aleatorioLibre()
  const repeticiones = opciones.repeticiones ?? REPETICIONES_POR_DEFECTO
  const acumulado = acumularPesos(rango)

  const fueraBase = new Uint8Array(TOTAL_CARTAS)
  marcar(mano, fueraBase)
  marcar(mesa, fueraBase)

  let victorias = 0
  let empates = 0
  let derrotas = 0
  let puntos = 0

  const mias = [mano[0], mano[1], ...mesa, 0, 0]
  const suyas = [0, 0, ...mesa, 0, 0]
  const total = 2 + mesa.length + porSalir

  for (let r = 0; r < repeticiones; r++) {
    const combo = elegirCombo(rango, acumulado, azar)
    if (fueraBase[combo.a] || fueraBase[combo.b]) {
      r--
      continue
    }
    const fuera = fueraBase.slice()
    fuera[combo.a] = 1
    fuera[combo.b] = 1
    suyas[0] = combo.a
    suyas[1] = combo.b

    for (let i = 0; i < porSalir; i++) {
      let carta: Carta
      do {
        carta = azar.entero(TOTAL_CARTAS)
      } while (fuera[carta])
      fuera[carta] = 1
      mias[2 + mesa.length + i] = carta
      suyas[2 + mesa.length + i] = carta
    }

    const va = evaluar(mias.slice(0, total))
    const vb = evaluar(suyas.slice(0, total))
    if (va > vb) {
      victorias++
      puntos++
    } else if (va === vb) {
      empates++
      puntos += 0.5
    } else {
      derrotas++
    }
  }

  return {
    victoria: victorias / repeticiones,
    empate: empates / repeticiones,
    derrota: derrotas / repeticiones,
    equity: puntos / repeticiones,
    exacto: false,
    repeticiones,
  }
}

/** Varios rivales con manos cualesquiera: siempre simulado, porque lo exacto explota. */
function equitySimuladaVarios(
  mano: readonly [Carta, Carta],
  mesa: readonly Carta[],
  rivales: number,
  opciones: OpcionesEquity,
): Probabilidades {
  const azar = opciones.azar ?? aleatorioLibre()
  const repeticiones = opciones.repeticiones ?? REPETICIONES_POR_DEFECTO
  const porSalir = 5 - mesa.length
  const fueraBase = new Uint8Array(TOTAL_CARTAS)
  marcar(mano, fueraBase)
  marcar(mesa, fueraBase)

  let victorias = 0
  let empates = 0
  let derrotas = 0
  let puntos = 0

  for (let r = 0; r < repeticiones; r++) {
    const fuera = fueraBase.slice()
    const sacar = (): Carta => {
      let carta: Carta
      do {
        carta = azar.entero(TOTAL_CARTAS)
      } while (fuera[carta])
      fuera[carta] = 1
      return carta
    }

    const salidas: Carta[] = []
    for (let i = 0; i < porSalir; i++) salidas.push(sacar())
    const comunes = [...mesa, ...salidas]

    const mia = evaluar([mano[0], mano[1], ...comunes])
    let mejorRival = -1
    let empatados = 0
    for (let j = 0; j < rivales; j++) {
      const v = evaluar([sacar(), sacar(), ...comunes])
      if (v > mejorRival) {
        mejorRival = v
        empatados = 1
      } else if (v === mejorRival) {
        empatados++
      }
    }

    if (mia > mejorRival) {
      victorias++
      puntos++
    } else if (mia === mejorRival) {
      empates++
      puntos += 1 / (empatados + 1)
    } else {
      derrotas++
    }
  }

  return {
    victoria: victorias / repeticiones,
    empate: empates / repeticiones,
    derrota: derrotas / repeticiones,
    equity: puntos / repeticiones,
    exacto: false,
    repeticiones,
  }
}

function acumularPesos(rango: readonly Combo[]): Float64Array {
  const acumulado = new Float64Array(rango.length)
  let suma = 0
  for (let i = 0; i < rango.length; i++) {
    suma += rango[i].peso
    acumulado[i] = suma
  }
  return acumulado
}

function elegirCombo(rango: readonly Combo[], acumulado: Float64Array, azar: Aleatorio): Combo {
  const objetivo = azar.siguiente() * acumulado[acumulado.length - 1]
  let bajo = 0
  let alto = acumulado.length - 1
  while (bajo < alto) {
    const medio = (bajo + alto) >> 1
    if (acumulado[medio] < objetivo) bajo = medio + 1
    else alto = medio
  }
  return rango[bajo]
}

/**
 * Los "outs": cartas que todavía no han salido y que, si salen, te dan la mejor
 * mano. Es el primer concepto de probabilidad que se enseña (módulo 2) y hay que
 * poder enseñarlo con las cartas concretas, no solo con un porcentaje.
 */
export function contarOuts(
  mano: readonly [Carta, Carta],
  mesa: readonly Carta[],
  rango: readonly Combo[],
  opciones: OpcionesEquity = {},
): { outs: Carta[]; equityActual: number } {
  const fuera = new Uint8Array(TOTAL_CARTAS)
  marcar(mano, fuera)
  marcar(mesa, fuera)

  const ahora = equityContraRango(mano, mesa, rango, { ...opciones, repeticiones: 4000 })
  const outs: Carta[] = []
  for (const carta of restantes(fuera)) {
    const despues = equityContraRango(mano, [...mesa, carta], rango, { ...opciones, repeticiones: 2000 })
    // Una carta es un "out" si te pone claramente por delante viniendo de detrás.
    if (ahora.equity < 0.5 && despues.equity > 0.7) outs.push(carta)
  }
  return { outs, equityActual: ahora.equity }
}

/**
 * La regla del 2 y el 4 que se enseña en el módulo 2: con outs y cartas por
 * salir, una estimación mental de la probabilidad de mejorar.
 */
export function reglaDel2y4(outs: number, cartasPorSalir: number): number {
  return Math.min(1, (outs * (cartasPorSalir >= 2 ? 4 : 2)) / 100)
}
