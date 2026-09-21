import type { Carta } from './cartas'
import { NOMBRES_VALOR_PLURAL, TOTAL_CARTAS, paloDe, valorDe } from './cartas'
import type { Combo } from './equity'
import { NOMBRES_CATEGORIA, categoriaDe, evaluar } from './evaluador'
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

/**
 * Las cartas que te salvan cuando no tienes proyecto que contar.
 *
 * Con doble pareja de reyes y reinas en una mesa emparejada, no hay "proyecto"
 * ninguno y sin embargo vas perdiendo: lo que te falta es un rey. Eso también
 * se cuenta, y decirlo es justo lo que enseña que una doble pareja puede ser
 * una mano flojísima según la mesa.
 */
export function cartasQueTeSalvan(
  mano: readonly [Carta, Carta],
  mesa: readonly Carta[],
  rango: Rango,
): Outs {
  if (mesa.length < 3 || mesa.length >= 5 || rango.combos.length === 0) return NADA
  if (fraccionALaQueGanas(mano, mesa, rango.combos) > 0.5) return NADA

  const vistas = new Uint8Array(TOTAL_CARTAS)
  for (const c of [...mano, ...mesa]) vistas[c] = 1

  const cartas: Carta[] = []
  for (let carta = 0; carta < TOTAL_CARTAS; carta++) {
    if (vistas[carta]) continue
    if (tePoneDelante(mano, mesa, carta, rango.combos)) cartas.push(carta)
  }
  if (cartas.length === 0) return NADA

  return {
    cuantas: cartas.length,
    comoSeLlaman: nombrarPorValor(cartas),
    proyecto: '',
    probabilidad: Math.min(0.95, cartas.length * 0.02 * (5 - mesa.length)),
    hayMas: false,
  }
}

/** "los dos reyes que quedan", "las jotas y los seises". Vacío si son un revoltijo. */
function nombrarPorValor(cartas: readonly Carta[]): string {
  const porValor = new Map<number, number>()
  for (const c of cartas) porValor.set(valorDe(c), (porValor.get(valorDe(c)) ?? 0) + 1)
  if (porValor.size > 2) return ''
  const partes = [...porValor.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([valor, cuantas]) => `${cuantas === 1 ? 'el' : `los ${cuantas}`} ${cuantas === 1 ? NOMBRE_SINGULAR[valor] : NOMBRES_VALOR_PLURAL[valor]} que ${cuantas === 1 ? 'queda' : 'quedan'}`)
  return partes.join(' y ')
}

const NOMBRE_SINGULAR: Record<number, string> = {
  0: 'dos', 1: 'tres', 2: 'cuatro', 3: 'cinco', 4: 'seis', 5: 'siete', 6: 'ocho',
  7: 'nueve', 8: 'diez', 9: 'jota', 10: 'reina', 11: 'rey', 12: 'as',
}

/**
 * Qué le gana a tu mano dentro de su rango, agrupado por jugada.
 *
 * "Ganabas el 30%" no enseña nada por sí solo. "Te ganan los tríos de reinas
 * (18 manos) y los reyes con mejor acompañante (9)" sí: es la explicación que
 * hace entender que una doble pareja en una mesa emparejada vale poco.
 */
export function loQueTeGana(
  mano: readonly [Carta, Carta],
  mesa: readonly Carta[],
  rango: Rango,
): Array<{ jugada: string; manos: number }> {
  if (mesa.length < 3) return []
  const tuya = evaluar([...mano, ...mesa])
  const tuCategoria = categoriaDe(tuya)
  const cuenta = new Map<string, number>()
  for (const combo of rango.combos) {
    if (chocaConTuMano(combo, mano)) continue
    const suya = evaluar([combo.a, combo.b, ...mesa])
    if (suya <= tuya) continue
    const categoria = categoriaDe(suya)
    // "Doble pareja" a secas confunde cuando tú TIENES doble pareja: lo que te
    // gana es una mejor, y decirlo así es media lección.
    const nombre =
      categoria === tuCategoria
        ? `${NOMBRES_CATEGORIA[categoria]} mejor que la tuya`
        : NOMBRES_CATEGORIA[categoria]
    cuenta.set(nombre, (cuenta.get(nombre) ?? 0) + combo.peso)
  }
  return [...cuenta.entries()]
    .map(([jugada, manos]) => ({ jugada, manos }))
    .sort((a, b) => b.manos - a.manos)
}
