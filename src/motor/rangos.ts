import type { Carta } from './cartas'
import { TOTAL_CARTAS, deCodigo } from './cartas'
import type { ClasePreflop } from './clases'
import { CLASES_PREFLOP, claseDeMano, combinacionesDeClase, combosDeClase } from './clases'
import type { Combo, Probabilidades } from './equity'
import { equityContraRango } from './equity'
import { evaluar } from './evaluador'
import { FUERZA_PREFLOP, ORDEN_PREFLOP } from './datos/fuerzaPreflop'

/**
 * Un rango es el conjunto de manos que el rival puede tener. Es la idea que
 * separa a quien juega sus cartas de quien juega la partida: no piensas "¿qué
 * tiene?", piensas "¿qué puede tener, y qué parte de eso le gana a lo mío?".
 *
 * Aquí se construyen rangos (por escrito, por porcentaje o por posición) y se
 * estrechan según lo que el rival va haciendo.
 */

export interface Rango {
  combos: Combo[]
  /** De dónde sale, para poder explicárselo al jugador. */
  descripcion: string
}

/** Rango vacío con descripción. */
function rango(combos: Combo[], descripcion: string): Rango {
  return { combos, descripcion }
}

/** Todas las manos posibles: el rival del que no sabemos nada. */
export function rangoTotal(): Rango {
  const combos: Combo[] = []
  for (let a = 0; a < TOTAL_CARTAS; a++)
    for (let b = a + 1; b < TOTAL_CARTAS; b++) combos.push({ a, b, peso: 1 })
  return rango(combos, 'cualquier mano')
}

/** Convierte clases ("AKs", "77") en manos concretas. */
export function rangoDeClases(clases: readonly ClasePreflop[], descripcion = ''): Rango {
  const combos: Combo[] = []
  for (const clase of clases) {
    for (const [a, b] of combosDeClase(clase)) combos.push({ a, b, peso: 1 })
  }
  return rango(combos, descripcion || clases.join(', '))
}

/**
 * Lee la notación de siempre: "77+, AJs+, KQo, AsKd".
 *  · "77+"   → todas las parejas del 7 para arriba
 *  · "AJs+"  → AJs, AQs, AKs
 *  · "A5s-A2s" → el tramo entre las dos
 */
export function parsearRango(texto: string): Rango {
  const clases = new Set<ClasePreflop>()
  const sueltas: Combo[] = []

  for (const trozoBruto of texto.split(',')) {
    const trozo = trozoBruto.trim()
    if (!trozo) continue

    if (/^\d+(\.\d+)?%$/.test(trozo)) {
      for (const c of rangoPorPorcentaje(parseFloat(trozo) / 100).combos) sueltas.push(c)
      continue
    }
    if (/^(10|[2-9TJQKA])[shdc♠♥♦♣](10|[2-9TJQKA])[shdc♠♥♦♣]$/i.test(trozo)) {
      const a = deCodigo(trozo.slice(0, 2))
      const b = deCodigo(trozo.slice(2))
      sueltas.push({ a, b, peso: 1 })
      continue
    }
    if (trozo.includes('-')) {
      const [desde, hasta] = trozo.split('-').map((t) => t.trim())
      for (const clase of tramoEntre(desde, hasta)) clases.add(clase)
      continue
    }
    if (trozo.endsWith('+')) {
      for (const clase of desde(trozo.slice(0, -1))) clases.add(clase)
      continue
    }
    clases.add(normalizar(trozo))
  }

  const base = rangoDeClases([...clases], texto)
  base.combos.push(...sueltas)
  return base
}

function normalizar(clase: string): ClasePreflop {
  const limpio = clase.replace(/10/g, 'T').toUpperCase()
  return limpio.length === 3 ? limpio.slice(0, 2) + limpio[2].toLowerCase() : limpio
}

/** "77+" → 77, 88, …, AA · "AJs+" → AJs, AQs, AKs */
function desde(claseTexto: string): ClasePreflop[] {
  const clase = normalizar(claseTexto)
  const esPareja = clase.length === 2
  const sufijo = esPareja ? '' : clase[2]
  const alto = clase[0]
  const bajo = clase[1]
  const letras = '23456789TJQKA'

  if (esPareja) {
    return letras
      .slice(letras.indexOf(alto))
      .split('')
      .map((l) => l + l)
  }
  const salida: ClasePreflop[] = []
  for (let i = letras.indexOf(bajo); i < letras.indexOf(alto); i++) {
    salida.push(alto + letras[i] + sufijo)
  }
  return salida
}

function tramoEntre(desdeTexto: string, hastaTexto: string): ClasePreflop[] {
  const a = normalizar(desdeTexto)
  const b = normalizar(hastaTexto)
  const ia = ORDEN_PREFLOP.get(a)
  const ib = ORDEN_PREFLOP.get(b)
  if (ia === undefined || ib === undefined) return [a, b]
  const [lo, hi] = ia <= ib ? [ia, ib] : [ib, ia]
  return FUERZA_PREFLOP.slice(lo, hi + 1).map(([clase]) => clase)
}

/**
 * El mejor X% de las manos. Cuenta combinaciones, no clases: AA son 6 manos de
 * las 1.326 (0,45%) y AKo son 12, así que "el 10% mejor" no son "17 clases".
 */
export function rangoPorPorcentaje(porcentaje: number): Rango {
  const objetivo = Math.round(porcentaje * 1326)
  const clases: ClasePreflop[] = []
  let acumulado = 0
  for (const [clase] of FUERZA_PREFLOP) {
    if (acumulado >= objetivo) break
    clases.push(clase)
    acumulado += combinacionesDeClase(clase)
  }
  return rangoDeClases(clases, `el ${(porcentaje * 100).toFixed(0)}% de manos más fuertes`)
}

/** Qué porcentaje de todas las manos ocupa un rango. */
export function porcentajeDeRango(r: Rango): number {
  const suma = r.combos.reduce((t, c) => t + c.peso, 0)
  return suma / 1326
}

/** Quita del rango las manos que usan cartas que ya se ven. */
export function quitarBloqueadas(r: Rango, vistas: readonly Carta[]): Rango {
  const fuera = new Uint8Array(TOTAL_CARTAS)
  for (const c of vistas) fuera[c] = 1
  return rango(
    r.combos.filter((c) => !fuera[c.a] && !fuera[c.b]),
    r.descripcion,
  )
}

/** ¿Está esta mano dentro del rango? */
export function contieneMano(r: Rango, a: Carta, b: Carta): boolean {
  return r.combos.some((c) => (c.a === a && c.b === b) || (c.a === b && c.b === a))
}

/** Las clases que forman el rango, para pintar la rejilla de 13×13. */
export function clasesDelRango(r: Rango): Map<ClasePreflop, number> {
  const cuenta = new Map<ClasePreflop, number>()
  for (const combo of r.combos) {
    const clase = claseDeMano(combo.a, combo.b)
    cuenta.set(clase, (cuenta.get(clase) ?? 0) + combo.peso)
  }
  return cuenta
}

/**
 * Rangos de apertura en una mesa de cuatro (la del modo libre).
 *
 * Cuanto más tarde hablas, más manos puedes jugar: con menos gente detrás, menos
 * probable es que alguien tenga algo mejor. Es el módulo 4 del temario hecho
 * números, y lo que usan los bots disciplinados para abrir.
 */
export const POSICIONES_4 = ['utg', 'boton', 'ciegaPequena', 'ciegaGrande'] as const
export type Posicion = (typeof POSICIONES_4)[number]

export const NOMBRES_POSICION: Record<Posicion, string> = {
  utg: 'primera posición',
  boton: 'el botón',
  ciegaPequena: 'ciega pequeña',
  ciegaGrande: 'ciega grande',
}

const APERTURA: Record<Posicion, string> = {
  utg: '77+, ATs+, KJs+, QJs, AQo+',
  boton: '22+, A2s+, K8s+, Q9s+, J9s+, T8s+, 97s+, 86s+, 75s+, 65s, A8o+, KTo+, QTo+, JTo',
  ciegaPequena: '22+, A2s+, K7s+, Q8s+, J8s+, T8s+, 97s+, 86s+, 76s, A7o+, K9o+, Q9o+, J9o+, T9o',
  ciegaGrande: '22+, A2s+, K5s+, Q7s+, J7s+, T7s+, 96s+, 85s+, 75s+, 64s+, 54s, A2o+, K8o+, Q8o+, J8o+, T8o+, 98o',
}

export function rangoApertura(posicion: Posicion): Rango {
  const r = parsearRango(APERTURA[posicion])
  r.descripcion = `lo que se abre desde ${NOMBRES_POSICION[posicion]}`
  return r
}

/** Manos con las que se paga una subida (más estrecho que abrir). */
export function rangoPago(posicion: Posicion): Rango {
  const base = posicion === 'ciegaGrande' ? '22+, A2s+, K9s+, Q9s+, J9s+, T9s, ATo+, KJo+' : '55+, A9s+, KTs+, QTs+, JTs, AJo+, KQo'
  const r = parsearRango(base)
  r.descripcion = `lo que paga una subida desde ${NOMBRES_POSICION[posicion]}`
  return r
}

/**
 * Estrecha un rango quedándose con la parte que mejor le va en ESTA mesa.
 *
 * Es el mecanismo que hace que el rival "tenga sentido": si apuesta fuerte en un
 * flop de picas, su rango deja de ser "lo que abrió" y pasa a ser "lo que abrió
 * y además le pega a este flop". Sin esto, las probabilidades del juego serían
 * de cartas al azar y enseñarían mal.
 */
export function estrecharPorFuerza(
  r: Rango,
  mesa: readonly Carta[],
  quedarse: number,
  descripcion?: string,
): Rango {
  if (quedarse >= 1 || r.combos.length === 0) return r
  const valorados = ordenarPorFuerza(r, mesa)
  const cuantos = Math.max(1, Math.round(valorados.length * quedarse))
  return rango(
    valorados.slice(0, cuantos).map((v) => v.combo),
    descripcion ?? `${r.descripcion}, quedándose con la mejor parte en esta mesa`,
  )
}

export interface ComboValorado {
  combo: Combo
  fuerza: number
}

/**
 * Ordena las manos del rango de mejor a peor EN ESTA MESA.
 * Con mesa, usa la fuerza de la mano hecha; sin mesa (antes del flop), la tabla
 * de fuerza de manos iniciales.
 */
export function ordenarPorFuerza(r: Rango, mesa: readonly Carta[]): ComboValorado[] {
  const valorados: ComboValorado[] = r.combos.map((combo) => ({
    combo,
    fuerza:
      mesa.length === 0
        ? -(ORDEN_PREFLOP.get(claseDeMano(combo.a, combo.b)) ?? 168)
        : evaluar([combo.a, combo.b, ...mesa]),
  }))
  valorados.sort((x, y) => y.fuerza - x.fuerza)
  return valorados
}

/**
 * Reparte el rango en tres cajones según lo bien que le va en esta mesa.
 * Se usa para explicar al jugador qué podía tener el rival (D26) y para que los
 * bots decidan sin tener que mirar sus propias cartas dos veces.
 */
export function repartirEnTramos(r: Rango, mesa: readonly Carta[]): {
  fuerte: Combo[]
  medio: Combo[]
  flojo: Combo[]
} {
  const orden = ordenarPorFuerza(r, mesa)
  const n = orden.length
  return {
    fuerte: orden.slice(0, Math.round(n * 0.25)).map((v) => v.combo),
    medio: orden.slice(Math.round(n * 0.25), Math.round(n * 0.6)).map((v) => v.combo),
    flojo: orden.slice(Math.round(n * 0.6)).map((v) => v.combo),
  }
}

/** Probabilidad de tu mano contra un rango, con la descripción a cuestas. */
export function equityContra(
  mano: readonly [Carta, Carta],
  mesa: readonly Carta[],
  r: Rango,
  repeticiones?: number,
): Probabilidades {
  return equityContraRango(mano, mesa, r.combos, repeticiones ? { repeticiones } : {})
}

/** Todas las clases, para pintar la rejilla. */
export { CLASES_PREFLOP }
