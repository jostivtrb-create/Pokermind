import type { Aleatorio } from './aleatorio'

/**
 * Una carta es un número de 0 a 51. Con números en vez de objetos, repartir y
 * simular miles de manos por segundo sale gratis: el motor de probabilidades
 * (que es el corazón del juego) hace justamente eso.
 *
 *   valor = carta >> 2   → 0 es el 2 y 12 es el as
 *   palo  = carta & 3    → 0 ♠ · 1 ♥ · 2 ♦ · 3 ♣
 */
export type Carta = number

export const VALORES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'] as const
export const PALOS = ['♠', '♥', '♦', '♣'] as const
/** Letras internas (las de siempre en póker), para escribir manos de forma corta: "As", "Kh". */
const LETRAS_PALO = ['s', 'h', 'd', 'c'] as const
const LETRAS_VALOR = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'] as const

/** Nombres en español, para que el juego pueda decir "pareja de reyes" y no "pareja de K". */
export const NOMBRES_VALOR = [
  'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez',
  'jota', 'reina', 'rey', 'as',
] as const
export const NOMBRES_VALOR_PLURAL = [
  'doses', 'treses', 'cuatros', 'cincos', 'seises', 'sietes', 'ochos', 'nueves', 'dieces',
  'jotas', 'reinas', 'reyes', 'ases',
] as const

export const TOTAL_CARTAS = 52

export function crearCarta(valor: number, palo: number): Carta {
  return (valor << 2) | palo
}
export function valorDe(carta: Carta): number {
  return carta >> 2
}
export function paloDe(carta: Carta): number {
  return carta & 3
}
/** ¿Son del mismo palo? (la pregunta que más se hace en póker) */
export function mismoPalo(a: Carta, b: Carta): boolean {
  return (a & 3) === (b & 3)
}

/** "A♠" para enseñar en pantalla. */
export function aTexto(carta: Carta): string {
  return VALORES[valorDe(carta)] + PALOS[paloDe(carta)]
}
/** "As" para escribir manos en el código y en el contenido de las lecciones. */
export function aCodigo(carta: Carta): string {
  return LETRAS_VALOR[valorDe(carta)] + LETRAS_PALO[paloDe(carta)]
}

/** Lee "As", "Th", "10♠", "A♠"… y devuelve la carta. Lanza si no se entiende. */
export function deCodigo(texto: string): Carta {
  const limpio = texto.trim()
  const palo = limpio.slice(-1)
  const valor = limpio.slice(0, -1).toUpperCase()

  let iPalo = LETRAS_PALO.indexOf(palo.toLowerCase() as (typeof LETRAS_PALO)[number])
  if (iPalo < 0) iPalo = PALOS.indexOf(palo as (typeof PALOS)[number])
  if (iPalo < 0) throw new Error(`Palo desconocido en "${texto}"`)

  let iValor = LETRAS_VALOR.indexOf(valor as (typeof LETRAS_VALOR)[number])
  if (iValor < 0) iValor = VALORES.indexOf(valor as (typeof VALORES)[number])
  if (iValor < 0) throw new Error(`Valor desconocido en "${texto}"`)

  return crearCarta(iValor, iPalo)
}

/** Varias cartas de una vez: "As Kd 7h" o "AsKd7h". */
export function manoDeCodigo(texto: string): Carta[] {
  const trozos = texto.trim().includes(' ')
    ? texto.trim().split(/\s+/)
    : (texto.trim().match(/(10|[2-9TJQKA])[shdc♠♥♦♣]/gi) ?? [])
  return trozos.map(deCodigo)
}

export function barajaCompleta(): Carta[] {
  return Array.from({ length: TOTAL_CARTAS }, (_, i) => i)
}

/** Baraja en el sitio (Fisher-Yates) y devuelve la misma lista. */
export function barajar(cartas: Carta[], azar: Aleatorio): Carta[] {
  for (let i = cartas.length - 1; i > 0; i--) {
    const j = azar.entero(i + 1)
    const t = cartas[i]
    cartas[i] = cartas[j]
    cartas[j] = t
  }
  return cartas
}

/**
 * Las cartas que quedan por salir. El motor de probabilidades la usa
 * constantemente: lo que puede pasar es siempre "lo que no se ha visto".
 */
export function barajaSin(usadas: readonly Carta[]): Carta[] {
  const fuera = new Uint8Array(TOTAL_CARTAS)
  for (const c of usadas) fuera[c] = 1
  const resto: Carta[] = []
  for (let c = 0; c < TOTAL_CARTAS; c++) if (!fuera[c]) resto.push(c)
  return resto
}

/** Nombre en español de una carta suelta: "as de picas". */
export function nombreLargo(carta: Carta): string {
  const palos = ['picas', 'corazones', 'diamantes', 'tréboles']
  return `${NOMBRES_VALOR[valorDe(carta)]} de ${palos[paloDe(carta)]}`
}
