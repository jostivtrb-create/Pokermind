import type { Carta } from './cartas'
import { TOTAL_CARTAS, paloDe, valorDe } from './cartas'
import type { Combo } from './equity'
import { evaluar } from './evaluador'
import type { Rango } from './rangos'

/**
 * Las cartas que te sirven: los OUTS.
 *
 * Es lo que convierte esto en un entrenador de verdad. Decirle a alguien
 * "ganabas el 13%" no le sirve en una mesa, porque ahí no hay pantalla. Decirle
 * "te faltaba una jota: son 4 cartas, y 4 outs con una por salir son un 8%" sí,
 * porque eso lo puede contar él solo. Es la regla del 2 y el 4 del módulo 2.
 *
 * Se cuentan como se cuentan en la mesa —las cartas que completan el proyecto—,
 * y NO "todas las cartas que me ponen por delante". Esa segunda cuenta es más
 * exacta pero contradice lo que enseña la lección ("cuatro de un palo son 9
 * outs") y nadie la puede hacer de cabeza. Lo que sobra se dice aparte.
 */
export interface Outs {
  /** Cartas que completan el proyecto. 0 si no hay proyecto. */
  cuantas: number
  /** "las jotas", "los corazones": para poder contarlas sin pantalla. */
  comoSeLlaman: string
  /** "proyecto de color", "escalera abierta", "escalera por dentro". */
  proyecto: string
  /** Lo que valen esas cartas por la regla del 2 y el 4. */
  probabilidad: number
  /** Si además hay otras cartas que te ponen por delante (ligar pareja y así). */
  hayMas: boolean
}

const NADA: Outs = { cuantas: 0, comoSeLlaman: '', proyecto: '', probabilidad: 0, hayMas: false }

export function outsContra(
  mano: readonly [Carta, Carta],
  mesa: readonly Carta[],
  rango: Rango,
): Outs {
  // Antes del flop no hay nada que contar; en el river ya no sale ninguna carta.
  if (mesa.length < 3 || mesa.length >= 5 || rango.combos.length === 0) return NADA

  const vistas = new Uint8Array(TOTAL_CARTAS)
  for (const c of [...mano, ...mesa]) vistas[c] = 1

  // Con la mejor mano no se habla de outs: ya no te falta nada.
  if (fraccionALaQueGanas(mano, mesa, rango.combos) > 0.5) return NADA

  const delProyecto = cartasDelProyecto(mano, mesa, vistas)
  const utiles = delProyecto.cartas.filter((c) => tePoneDelante(mano, mesa, c, rango.combos))

  // Otras cartas que también te valen, sin ser el proyecto: ligar pareja y poco más.
  let hayMas = false
  for (let carta = 0; carta < TOTAL_CARTAS && !hayMas; carta++) {
    if (vistas[carta] || delProyecto.cartas.includes(carta)) continue
    if (tePoneDelante(mano, mesa, carta, rango.combos)) hayMas = true
  }

  if (utiles.length === 0) return { ...NADA, hayMas }

  const cartasQueQuedan = 5 - mesa.length
  return {
    cuantas: utiles.length,
    comoSeLlaman: delProyecto.comoSeLlaman,
    proyecto: delProyecto.nombre,
    probabilidad: Math.min(0.95, utiles.length * 0.02 * cartasQueQuedan),
    hayMas,
  }
}

/**
 * El proyecto que tienes, sin mirar lo que puede tener el rival.
 *
 * Sirve para lo que se pinta en la mesa mientras juegas ("y proyecto de
 * escalera por dentro: te sirven 4 cartas, las jotas"), donde todavía no toca
 * hablar de rangos. La explicación del final usa `outsContra`, que además
 * comprueba que esas cartas de verdad te pongan por delante.
 */
export function proyectoDeLaMano(
  mano: readonly [Carta, Carta],
  mesa: readonly Carta[],
): Pick<Outs, 'cuantas' | 'comoSeLlaman' | 'proyecto' | 'probabilidad'> {
  if (mesa.length < 3 || mesa.length >= 5) return NADA
  const vistas = new Uint8Array(TOTAL_CARTAS)
  for (const c of [...mano, ...mesa]) vistas[c] = 1
  const proyecto = cartasDelProyecto(mano, mesa, vistas)
  return {
    cuantas: proyecto.cartas.length,
    comoSeLlaman: proyecto.comoSeLlaman,
    proyecto: proyecto.nombre,
    probabilidad: Math.min(0.95, proyecto.cartas.length * 0.02 * (5 - mesa.length)),
  }
}

/** Las cartas que completan un color o una escalera, con su nombre. */
function cartasDelProyecto(
  mano: readonly [Carta, Carta],
  mesa: readonly Carta[],
  vistas: Uint8Array,
): { cartas: Carta[]; nombre: string; comoSeLlaman: string } {
  const todas = [...mano, ...mesa]

  // ── Color: cuatro de un palo, con al menos una tuya ──────────────────────
  for (let palo = 0; palo < 4; palo++) {
    const mias = mano.filter((c) => paloDe(c) === palo).length
    const total = todas.filter((c) => paloDe(c) === palo).length
    if (total === 4 && mias >= 1) {
      const cartas: Carta[] = []
      for (let c = 0; c < TOTAL_CARTAS; c++) if (!vistas[c] && paloDe(c) === palo) cartas.push(c)
      return { cartas, nombre: 'proyecto de color', comoSeLlaman: `los ${PALOS_EN_PLURAL[palo]}` }
    }
  }

  // ── Escalera: ventanas de cinco con cuatro puestas y una tuya dentro ─────
  const valores = new Set(todas.map(valorDe))
  const mios = mano.map(valorDe)
  const faltan = new Set<number>()
  for (let alto = 12; alto >= 4; alto--) {
    const cinco = [alto, alto - 1, alto - 2, alto - 3, alto - 4]
    const puestas = cinco.filter((v) => valores.has(v))
    if (puestas.length !== 4) continue
    if (!cinco.some((v) => mios.includes(v))) continue
    faltan.add(cinco.find((v) => !valores.has(v))!)
  }
  if (faltan.size > 0) {
    const cartas: Carta[] = []
    for (let c = 0; c < TOTAL_CARTAS; c++) if (!vistas[c] && faltan.has(valorDe(c))) cartas.push(c)
    const nombres = [...faltan].sort((a, b) => b - a).map((v) => VALORES_EN_PLURAL[v])
    return {
      cartas,
      nombre: faltan.size > 1 ? 'escalera abierta' : 'escalera por dentro',
      comoSeLlaman: nombres.length === 1 ? `las ${nombres[0]}` : `las ${nombres[0]} y las ${nombres[1]}`,
    }
  }

  return { cartas: [], nombre: '', comoSeLlaman: '' }
}

/** Qué parte de su rango le ganas AHORA. */
function fraccionALaQueGanas(
  mano: readonly [Carta, Carta],
  mesa: readonly Carta[],
  combos: readonly Combo[],
): number {
  const tuya = evaluar([...mano, ...mesa])
  let ganas = 0
  let total = 0
  for (const combo of combos) {
    if (chocaConTuMano(combo, mano)) continue
    total += combo.peso
    if (tuya > evaluar([combo.a, combo.b, ...mesa])) ganas += combo.peso
  }
  return total === 0 ? 0 : ganas / total
}

/** ¿Con esta carta en la mesa pasas a ganarle a la mayoría de su rango? */
function tePoneDelante(
  mano: readonly [Carta, Carta],
  mesa: readonly Carta[],
  carta: Carta,
  combos: readonly Combo[],
): boolean {
  const conLaCarta = [...mesa, carta]
  const tuya = evaluar([...mano, ...conLaCarta])
  let ganas = 0
  let total = 0
  for (const combo of combos) {
    if (combo.a === carta || combo.b === carta || chocaConTuMano(combo, mano)) continue
    total += combo.peso
    if (tuya > evaluar([combo.a, combo.b, ...conLaCarta])) ganas += combo.peso
  }
  return total > 0 && ganas / total > 0.5
}

function chocaConTuMano(combo: Combo, mano: readonly [Carta, Carta]): boolean {
  return combo.a === mano[0] || combo.a === mano[1] || combo.b === mano[0] || combo.b === mano[1]
}

const PALOS_EN_PLURAL = ['picas', 'corazones', 'diamantes', 'tréboles']

const VALORES_EN_PLURAL: Record<number, string> = {
  0: 'doses', 1: 'treses', 2: 'cuatros', 3: 'cincos', 4: 'seises', 5: 'sietes',
  6: 'ochos', 7: 'nueves', 8: 'dieces', 9: 'jotas', 10: 'reinas', 11: 'reyes', 12: 'ases',
}
