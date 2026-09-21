import type { Carta } from './cartas'
import { NOMBRES_VALOR, NOMBRES_VALOR_PLURAL, PALOS, VALORES, paloDe, valorDe } from './cartas'

/**
 * Evaluador de manos: dadas 5, 6 o 7 cartas, dice cuál es la mejor mano de 5 y
 * devuelve un número con el que dos manos se comparan directamente (mayor gana,
 * igual es empate).
 *
 * Es el trozo de código que más veces se ejecuta de todo el juego: cada
 * simulación de probabilidad lo llama cientos de miles de veces. Por eso trabaja
 * con máscaras de bits y no crea objetos.
 *
 * El número devuelto es:  categoría · 13⁵ + c1 · 13⁴ + c2 · 13³ + c3 · 13² + c4 · 13 + c5
 * donde c1…c5 son los valores que deciden, del más importante al menos.
 */

export const Categoria = {
  CartaAlta: 0,
  Pareja: 1,
  DoblePareja: 2,
  Trio: 3,
  Escalera: 4,
  Color: 5,
  Full: 6,
  Poker: 7,
  EscaleraColor: 8,
} as const
export type Categoria = (typeof Categoria)[keyof typeof Categoria]

export const NOMBRES_CATEGORIA: Record<Categoria, string> = {
  [Categoria.CartaAlta]: 'carta alta',
  [Categoria.Pareja]: 'pareja',
  [Categoria.DoblePareja]: 'doble pareja',
  [Categoria.Trio]: 'trío',
  [Categoria.Escalera]: 'escalera',
  [Categoria.Color]: 'color',
  [Categoria.Full]: 'full',
  [Categoria.Poker]: 'póker',
  [Categoria.EscaleraColor]: 'escalera de color',
}

const BASE = 13
const P1 = BASE * BASE * BASE * BASE // 13⁴
const P_CATEGORIA = P1 * BASE // 13⁵

function componer(categoria: Categoria, c1: number, c2 = 0, c3 = 0, c4 = 0, c5 = 0): number {
  return categoria * P_CATEGORIA + c1 * P1 + c2 * BASE ** 3 + c3 * BASE ** 2 + c4 * BASE + c5
}

/** Categoría de una mano ya evaluada. */
export function categoriaDe(valor: number): Categoria {
  return Math.floor(valor / P_CATEGORIA) as Categoria
}

/**
 * Valor más alto de una escalera dentro de una máscara de 13 bits, o -1.
 * El as vale por arriba (A-K-Q-J-10) y por abajo (A-2-3-4-5, "la rueda"); en la
 * rueda la escalera es "al 5", que es justo el error clásico del principiante.
 */
function escaleraEn(mascara: number): number {
  for (let alto = 12; alto >= 4; alto--) {
    const necesarias = (1 << alto) | (1 << (alto - 1)) | (1 << (alto - 2)) | (1 << (alto - 3)) | (1 << (alto - 4))
    if ((mascara & necesarias) === necesarias) return alto
  }
  // La rueda: A-2-3-4-5, donde el as va por abajo y la escalera es al 5 (valor 3).
  const rueda = (1 << 12) | 0b1111
  if ((mascara & rueda) === rueda) return 3
  return -1
}

/** Los `cuantos` valores más altos de una máscara, saltándose los excluidos. */
function masAltos(mascara: number, cuantos: number, excluir = 0): number[] {
  const salida: number[] = []
  for (let v = 12; v >= 0 && salida.length < cuantos; v--) {
    if (mascara & (1 << v) && !(excluir & (1 << v))) salida.push(v)
  }
  return salida
}

/** Evalúa entre 5 y 7 cartas y devuelve el número comparable. */
export function evaluar(cartas: readonly Carta[]): number {
  const porValor = new Uint8Array(13)
  const porPalo = new Uint8Array(4)
  const mascaraPorPalo = new Int32Array(4)
  let mascara = 0

  for (const carta of cartas) {
    const v = valorDe(carta)
    const p = paloDe(carta)
    porValor[v]++
    porPalo[p]++
    mascaraPorPalo[p] |= 1 << v
    mascara |= 1 << v
  }

  // Color y escalera de color
  for (let p = 0; p < 4; p++) {
    if (porPalo[p] >= 5) {
      const alto = escaleraEn(mascaraPorPalo[p])
      if (alto >= 0) return componer(Categoria.EscaleraColor, alto)
      const cinco = masAltos(mascaraPorPalo[p], 5)
      return componer(Categoria.Color, cinco[0], cinco[1], cinco[2], cinco[3], cinco[4])
    }
  }

  // Escalera
  const altoEscalera = escaleraEn(mascara)

  // Grupos por repetición
  let poker = -1
  const trios: number[] = []
  const parejas: number[] = []
  for (let v = 12; v >= 0; v--) {
    const n = porValor[v]
    if (n === 4 && poker < 0) poker = v
    else if (n === 3) trios.push(v)
    else if (n === 2) parejas.push(v)
  }

  if (poker >= 0) {
    const [pateador] = masAltos(mascara, 1, 1 << poker)
    return componer(Categoria.Poker, poker, pateador ?? 0)
  }
  if (trios.length >= 2) {
    // Dos tríos son un full: el trío más alto manda y el otro hace de pareja.
    return componer(Categoria.Full, trios[0], trios[1])
  }
  if (trios.length === 1 && parejas.length >= 1) {
    return componer(Categoria.Full, trios[0], parejas[0])
  }
  if (altoEscalera >= 0) return componer(Categoria.Escalera, altoEscalera)
  if (trios.length === 1) {
    const pateadores = masAltos(mascara, 2, 1 << trios[0])
    return componer(Categoria.Trio, trios[0], pateadores[0], pateadores[1])
  }
  if (parejas.length >= 2) {
    const [alta, baja] = parejas
    const [pateador] = masAltos(mascara, 1, (1 << alta) | (1 << baja))
    return componer(Categoria.DoblePareja, alta, baja, pateador ?? 0)
  }
  if (parejas.length === 1) {
    const pateadores = masAltos(mascara, 3, 1 << parejas[0])
    return componer(Categoria.Pareja, parejas[0], pateadores[0], pateadores[1], pateadores[2])
  }
  const cinco = masAltos(mascara, 5)
  return componer(Categoria.CartaAlta, cinco[0], cinco[1], cinco[2], cinco[3], cinco[4])
}

/**
 * Los valores que deciden la mano, del más importante al menos.
 * Se exporta porque comparar dos manos iguales de categoría necesita saber
 * exactamente en qué carta se separan.
 */
export function desglosarValor(valor: number): number[] {
  let resto = valor % P_CATEGORIA
  const partes: number[] = []
  for (let potencia = P1; potencia >= 1; potencia /= BASE) {
    partes.push(Math.floor(resto / potencia))
    resto %= potencia
  }
  return partes
}

/**
 * Nombre en español de la mano, del estilo "doble pareja de reyes y sietes".
 * Lo usan el resultado de la mano, las explicaciones y las lecciones.
 */
export function describirMano(cartas: readonly Carta[]): string {
  const valor = evaluar(cartas)
  const categoria = categoriaDe(valor)
  const [c1, c2] = desglosarValor(valor)

  switch (categoria) {
    case Categoria.EscaleraColor:
      return c1 === 12 ? 'escalera real' : `escalera de color al ${NOMBRES_VALOR[c1]}`
    case Categoria.Poker:
      return `póker de ${NOMBRES_VALOR_PLURAL[c1]}`
    case Categoria.Full:
      return `full de ${NOMBRES_VALOR_PLURAL[c1]} con ${NOMBRES_VALOR_PLURAL[c2]}`
    case Categoria.Color: {
      const palo = paloDominante(cartas)
      return `color de ${palo}`
    }
    case Categoria.Escalera:
      return `escalera al ${NOMBRES_VALOR[c1]}`
    case Categoria.Trio:
      return `trío de ${NOMBRES_VALOR_PLURAL[c1]}`
    case Categoria.DoblePareja:
      return `doble pareja de ${NOMBRES_VALOR_PLURAL[c1]} y ${NOMBRES_VALOR_PLURAL[c2]}`
    case Categoria.Pareja:
      return `pareja de ${NOMBRES_VALOR_PLURAL[c1]}`
    default:
      return `carta alta: ${NOMBRES_VALOR[c1]}`
  }
}

function paloDominante(cartas: readonly Carta[]): string {
  const cuenta = [0, 0, 0, 0]
  for (const c of cartas) cuenta[paloDe(c)]++
  const p = cuenta.indexOf(Math.max(...cuenta))
  return ['picas', 'corazones', 'diamantes', 'tréboles'][p]
}

/** Versión corta para las estadísticas: solo la categoría. */
export function nombreCategoria(cartas: readonly Carta[]): string {
  return NOMBRES_CATEGORIA[categoriaDe(evaluar(cartas))]
}

/** Texto de las 5 cartas que de verdad forman la mano, para poder resaltarlas. */
export function mejoresCinco(cartas: readonly Carta[]): Carta[] {
  if (cartas.length <= 5) return [...cartas]
  let mejor = -1
  let mejores: Carta[] = []
  const n = cartas.length
  const indices = [0, 1, 2, 3, 4]
  const avanzar = (): boolean => {
    let i = 4
    while (i >= 0 && indices[i] === n - 5 + i) i--
    if (i < 0) return false
    indices[i]++
    for (let j = i + 1; j < 5; j++) indices[j] = indices[j - 1] + 1
    return true
  }
  do {
    const combo = indices.map((i) => cartas[i])
    const v = evaluar(combo)
    if (v > mejor) {
      mejor = v
      mejores = combo
    }
  } while (avanzar())
  return mejores
}

/** Etiqueta "A♠ K♦" para depurar y para el contenido de las lecciones. */
export function textoCartas(cartas: readonly Carta[]): string {
  return cartas.map((c) => VALORES[valorDe(c)] + PALOS[paloDe(c)]).join(' ')
}
