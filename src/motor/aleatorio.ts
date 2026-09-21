/**
 * Generador de números aleatorios con semilla.
 *
 * Hace falta que sea con semilla, y no `Math.random`, por tres motivos del juego:
 * el reto diario tiene que repartir LA MISMA mano a todo el mundo (D29), una mano
 * fallada tiene que poder volver semanas después (D15), y los tests no pueden
 * depender de la suerte.
 */
export interface Aleatorio {
  /** Número decimal en [0, 1). */
  siguiente(): number
  /** Entero en [0, tope). */
  entero(tope: number): number
  /** Decimal en [min, max). */
  entre(min: number, max: number): number
  /** Un elemento cualquiera de la lista. */
  elegir<T>(lista: readonly T[]): T
}

/** mulberry32: rápido, corto y con estado de 32 bits. De sobra para repartir cartas. */
export function crearAleatorio(semilla: number): Aleatorio {
  let estado = semilla >>> 0
  const siguiente = () => {
    estado = (estado + 0x6d2b79f5) >>> 0
    let t = estado
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return {
    siguiente,
    entero: (tope) => Math.floor(siguiente() * tope),
    entre: (min, max) => min + siguiente() * (max - min),
    elegir: (lista) => lista[Math.floor(siguiente() * lista.length)],
  }
}

/** Semilla a partir de una fecha, para el reto diario: misma fecha, misma mano. */
export function semillaDelDia(fecha: Date = new Date()): number {
  const y = fecha.getFullYear()
  const m = fecha.getMonth() + 1
  const d = fecha.getDate()
  return (y * 10000 + m * 100 + d) >>> 0
}

/** Aleatorio sin semilla fija, para partidas normales. */
export function aleatorioLibre(): Aleatorio {
  return crearAleatorio((Math.random() * 0xffffffff) >>> 0)
}
