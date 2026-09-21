import type { Carta } from './cartas'
import { crearCarta, mismoPalo, paloDe, valorDe } from './cartas'

/**
 * Las 169 "clases" de mano inicial. A♠K♠ y A♥K♥ son la misma cosa antes de que
 * salga la mesa: las dos son "AK del mismo palo". Por eso el póker habla de 169
 * manos y no de 1.326: lo que cambia entre ellas no cambia nada.
 *
 *   "AA"  pareja        ·  6 combinaciones
 *   "AKs" mismo palo    ·  4 combinaciones  (s de "suited")
 *   "AKo" distinto palo · 12 combinaciones  (o de "offsuit")
 */

const LETRAS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'] as const

export type ClasePreflop = string

/** Clase a la que pertenece una mano concreta. */
export function claseDeMano(a: Carta, b: Carta): ClasePreflop {
  const va = valorDe(a)
  const vb = valorDe(b)
  const alto = Math.max(va, vb)
  const bajo = Math.min(va, vb)
  if (va === vb) return LETRAS[alto] + LETRAS[bajo]
  return LETRAS[alto] + LETRAS[bajo] + (mismoPalo(a, b) ? 's' : 'o')
}

/** Las 169 clases, en orden de lectura de la rejilla de siempre. */
export const CLASES_PREFLOP: ClasePreflop[] = (() => {
  const clases: ClasePreflop[] = []
  for (let alto = 12; alto >= 0; alto--) {
    for (let bajo = 12; bajo >= 0; bajo--) {
      if (alto === bajo) clases.push(LETRAS[alto] + LETRAS[bajo])
      else if (alto > bajo) clases.push(LETRAS[alto] + LETRAS[bajo] + 's')
      else clases.push(LETRAS[bajo] + LETRAS[alto] + 'o')
    }
  }
  return [...new Set(clases)]
})()

/** Cuántas manos concretas hay dentro de una clase: 6 parejas, 4 del mismo palo, 12 del otro. */
export function combinacionesDeClase(clase: ClasePreflop): number {
  if (clase.length === 2) return 6
  return clase.endsWith('s') ? 4 : 12
}

/** Una mano concreta cualquiera de esa clase (para calcular, no para repartir). */
export function comboEjemploDeClase(clase: ClasePreflop): [Carta, Carta] {
  const alto = LETRAS.indexOf(clase[0] as (typeof LETRAS)[number])
  const bajo = LETRAS.indexOf(clase[1] as (typeof LETRAS)[number])
  if (clase.length === 2) return [crearCarta(alto, 0), crearCarta(bajo, 1)]
  return clase.endsWith('s')
    ? [crearCarta(alto, 0), crearCarta(bajo, 0)]
    : [crearCarta(alto, 0), crearCarta(bajo, 1)]
}

/** Todas las manos concretas de una clase. */
export function combosDeClase(clase: ClasePreflop): Array<[Carta, Carta]> {
  const alto = LETRAS.indexOf(clase[0] as (typeof LETRAS)[number])
  const bajo = LETRAS.indexOf(clase[1] as (typeof LETRAS)[number])
  const salida: Array<[Carta, Carta]> = []

  if (clase.length === 2) {
    for (let p1 = 0; p1 < 4; p1++)
      for (let p2 = p1 + 1; p2 < 4; p2++) salida.push([crearCarta(alto, p1), crearCarta(bajo, p2)])
    return salida
  }
  if (clase.endsWith('s')) {
    for (let p = 0; p < 4; p++) salida.push([crearCarta(alto, p), crearCarta(bajo, p)])
    return salida
  }
  for (let p1 = 0; p1 < 4; p1++)
    for (let p2 = 0; p2 < 4; p2++) if (p1 !== p2) salida.push([crearCarta(alto, p1), crearCarta(bajo, p2)])
  return salida
}

/** Cómo se escribe una mano concreta en la rejilla: "A♠K♠" → "AKs". */
export function textoClase(a: Carta, b: Carta): string {
  const clase = claseDeMano(a, b)
  return clase.length === 2 ? clase : clase.slice(0, 2) + (paloDe(a) === paloDe(b) ? ' del mismo palo' : ' de distinto palo')
}
