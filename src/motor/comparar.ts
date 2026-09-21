import type { Carta } from './cartas'
import { NOMBRES_VALOR, NOMBRES_VALOR_PLURAL } from './cartas'
import { Categoria, categoriaDe, desglosarValor, evaluar, mejoresCinco } from './evaluador'

/**
 * Explicar POR QUÉ gana una mano y no la otra.
 *
 * Nació de un fallo que se vio jugando: con dos manos que hacían carta alta al
 * rey, el juego decía *"abajo se forma carta alta: rey y arriba carta alta:
 * rey"* — la misma frase dos veces, sin explicar nada. La mano se decidía por la
 * segunda carta (reina contra ocho) y eso no aparecía por ningún lado.
 *
 * Aquí se busca **la primera carta en la que las dos manos se separan** y se
 * nombra, que es exactamente como lo explicaría una persona en la mesa.
 */

export interface Comparacion {
  gana: 'a' | 'b' | 'empate'
  /** Frase que explica la decisión, en español llano. */
  porQue: string
  /** Las cinco cartas que forman cada mano, para poder enseñarlas. */
  cincoA: Carta[]
  cincoB: Carta[]
}

const NOMBRES_CATEGORIA: Record<number, string> = {
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

/**
 * Cómo se llama cada posición dentro de la jugada, para poder decir "decide la
 * pareja pequeña" o "decide la carta que acompaña" en vez de "decide la 3ª".
 */
const PAPELES: Record<number, string[]> = {
  [Categoria.CartaAlta]: ['la carta más alta', 'la segunda carta', 'la tercera carta', 'la cuarta carta', 'la quinta carta'],
  [Categoria.Pareja]: ['la pareja', 'la carta que la acompaña', 'la siguiente carta', 'la última carta'],
  [Categoria.DoblePareja]: ['la pareja grande', 'la pareja pequeña', 'la carta que las acompaña'],
  [Categoria.Trio]: ['el trío', 'la carta que lo acompaña', 'la siguiente carta'],
  [Categoria.Escalera]: ['la carta más alta de la escalera'],
  [Categoria.Color]: ['la carta más alta del color', 'la segunda carta del color', 'la tercera carta del color', 'la cuarta carta', 'la quinta carta'],
  [Categoria.Full]: ['el trío', 'la pareja'],
  [Categoria.Poker]: ['el póker', 'la carta que lo acompaña'],
  [Categoria.EscaleraColor]: ['la carta más alta'],
}

export function compararManos(a: readonly Carta[], b: readonly Carta[]): Comparacion {
  const valorA = evaluar(a)
  const valorB = evaluar(b)
  const cincoA = mejoresCinco(a)
  const cincoB = mejoresCinco(b)

  if (valorA === valorB) {
    return {
      gana: 'empate',
      porQue: `Las dos forman exactamente lo mismo: ${NOMBRES_CATEGORIA[categoriaDe(valorA)]}. El bote se reparte.`,
      cincoA,
      cincoB,
    }
  }

  const gana = valorA > valorB ? 'a' : 'b'
  const catA = categoriaDe(valorA)
  const catB = categoriaDe(valorB)

  // Caso fácil: jugadas distintas.
  if (catA !== catB) {
    const alta = Math.max(catA, catB)
    const baja = Math.min(catA, catB)
    return {
      gana,
      porQue: `${mayuscula(NOMBRES_CATEGORIA[alta])} gana a ${NOMBRES_CATEGORIA[baja]}.`,
      cincoA,
      cincoB,
    }
  }

  // Misma jugada: hay que encontrar la carta que las separa.
  const partesA = desglosarValor(valorA)
  const partesB = desglosarValor(valorB)
  const papeles = PAPELES[catA] ?? []

  for (let i = 0; i < partesA.length; i++) {
    if (partesA[i] === partesB[i]) continue
    const ganadora = partesA[i] > partesB[i] ? partesA[i] : partesB[i]
    const perdedora = partesA[i] > partesB[i] ? partesB[i] : partesA[i]
    const papel = papeles[i] ?? 'la siguiente carta'

    // Si se separan ya en la primera carta, la frase no necesita preámbulo.
    if (i === 0) {
      return {
        gana,
        porQue: usaPlural(catA, i)
          ? `Las dos tienen ${NOMBRES_CATEGORIA[catA]}, pero de ${NOMBRES_VALOR_PLURAL[ganadora]} gana a la de ${NOMBRES_VALOR_PLURAL[perdedora]}.`
          : `${mayuscula(NOMBRES_CATEGORIA[catA])} al ${NOMBRES_VALOR[ganadora]} gana a ${NOMBRES_CATEGORIA[catA]} al ${NOMBRES_VALOR[perdedora]}.`,
        cincoA,
        cincoB,
      }
    }

    return {
      gana,
      porQue:
        `Las dos tienen ${descripcionComun(catA, partesA, i)}, así que decide ${papel}: ` +
        `${NOMBRES_VALOR[ganadora]} gana a ${NOMBRES_VALOR[perdedora]}.`,
      cincoA,
      cincoB,
    }
  }

  return { gana, porQue: 'Gana por la carta más alta.', cincoA, cincoB }
}

/** Lo que las dos manos comparten hasta la carta que las separa. */
function descripcionComun(categoria: number, partes: number[], hasta: number): string {
  switch (categoria) {
    case Categoria.Pareja:
      return `pareja de ${NOMBRES_VALOR_PLURAL[partes[0]]}`
    case Categoria.DoblePareja:
      return hasta === 1
        ? `la pareja grande de ${NOMBRES_VALOR_PLURAL[partes[0]]}`
        : `las mismas dos parejas, de ${NOMBRES_VALOR_PLURAL[partes[0]]} y ${NOMBRES_VALOR_PLURAL[partes[1]]}`
    case Categoria.Trio:
      return `trío de ${NOMBRES_VALOR_PLURAL[partes[0]]}`
    case Categoria.Poker:
      return `póker de ${NOMBRES_VALOR_PLURAL[partes[0]]}`
    case Categoria.Full:
      return `el trío de ${NOMBRES_VALOR_PLURAL[partes[0]]}`
    case Categoria.CartaAlta:
    case Categoria.Color: {
      const iguales = partes.slice(0, hasta).map((v) => NOMBRES_VALOR[v])
      return iguales.length === 1 ? `el ${iguales[0]}` : `el ${iguales.join(' y el ')}`
    }
    default:
      return 'la misma jugada'
  }
}

/** Las jugadas que se nombran "de sietes" y no "al siete". */
function usaPlural(categoria: number, posicion: number): boolean {
  if (posicion !== 0) return false
  return (
    categoria === Categoria.Pareja ||
    categoria === Categoria.DoblePareja ||
    categoria === Categoria.Trio ||
    categoria === Categoria.Poker ||
    categoria === Categoria.Full
  )
}

function mayuscula(texto: string): string {
  return texto[0].toUpperCase() + texto.slice(1)
}
