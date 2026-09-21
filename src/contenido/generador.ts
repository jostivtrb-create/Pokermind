import type { Aleatorio } from '../motor/aleatorio'
import type { Carta } from '../motor/cartas'
import { crearCarta } from '../motor/cartas'
import { Categoria, categoriaDe, evaluar } from '../motor/evaluador'

/**
 * Construye manos de cinco cartas de una jugada concreta.
 *
 * Hace falta para las primeras lecciones: para preguntar "¿qué jugada gana?"
 * hay que poder repartir un color y un full a voluntad. Repartiendo al azar
 * saldrían parejas el 90% de las veces y la lección no enseñaría nada.
 *
 * Todas las manos salen distintas cada vez, así que no hay nada que memorizar.
 */

const NOMBRES: Record<number, string> = {
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

export function nombreDeJugada(categoria: number): string {
  return NOMBRES[categoria] ?? 'carta alta'
}

/** Valores distintos al azar, de mayor a menor. */
function valoresSueltos(azar: Aleatorio, cuantos: number, excluir: number[] = []): number[] {
  const libres = [...Array(13).keys()].filter((v) => !excluir.includes(v))
  const elegidos: number[] = []
  while (elegidos.length < cuantos && libres.length > 0) {
    const i = azar.entero(libres.length)
    elegidos.push(libres.splice(i, 1)[0])
  }
  return elegidos.sort((a, b) => b - a)
}

function palosDistintos(azar: Aleatorio, cuantos: number): number[] {
  const libres = [0, 1, 2, 3]
  const elegidos: number[] = []
  while (elegidos.length < cuantos && libres.length > 0) {
    elegidos.push(libres.splice(azar.entero(libres.length), 1)[0])
  }
  return elegidos
}

/**
 * Construye una mano de cinco cartas de la jugada pedida.
 * Comprueba el resultado con el evaluador del juego: si por casualidad sale otra
 * cosa (una escalera donde se quería carta alta), vuelve a intentarlo.
 */
export function construirJugada(categoria: number, azar: Aleatorio): Carta[] {
  for (let intento = 0; intento < 300; intento++) {
    const mano = intentarConstruir(categoria, azar)
    if (mano && categoriaDe(evaluar(mano)) === categoria) return mano
  }
  // Salida de emergencia: una mano cualquiera antes que quedarse colgado.
  return valoresSueltos(azar, 5).map((v, i) => crearCarta(v, i % 4))
}

function intentarConstruir(categoria: number, azar: Aleatorio): Carta[] | null {
  switch (categoria) {
    case Categoria.CartaAlta: {
      const valores = valoresSueltos(azar, 5)
      const palos = [0, 1, 2, 3, azar.entero(4)]
      return valores.map((v, i) => crearCarta(v, palos[i]))
    }
    case Categoria.Pareja: {
      const [pareja] = valoresSueltos(azar, 1)
      const resto = valoresSueltos(azar, 3, [pareja])
      const dos = palosDistintos(azar, 2)
      return [
        crearCarta(pareja, dos[0]), crearCarta(pareja, dos[1]),
        ...resto.map((v, i) => crearCarta(v, i % 4)),
      ]
    }
    case Categoria.DoblePareja: {
      const [alta, baja] = valoresSueltos(azar, 2)
      const [pateador] = valoresSueltos(azar, 1, [alta, baja])
      const p1 = palosDistintos(azar, 2)
      const p2 = palosDistintos(azar, 2)
      return [
        crearCarta(alta, p1[0]), crearCarta(alta, p1[1]),
        crearCarta(baja, p2[0]), crearCarta(baja, p2[1]),
        crearCarta(pateador, azar.entero(4)),
      ]
    }
    case Categoria.Trio: {
      const [trio] = valoresSueltos(azar, 1)
      const resto = valoresSueltos(azar, 2, [trio])
      const tres = palosDistintos(azar, 3)
      return [
        ...tres.map((p) => crearCarta(trio, p)),
        ...resto.map((v, i) => crearCarta(v, i)),
      ]
    }
    case Categoria.Escalera: {
      const alto = 4 + azar.entero(9) // del 6 al as
      const valores = [alto, alto - 1, alto - 2, alto - 3, alto - 4]
      // Que no salgan todas del mismo palo, o sería escalera de color.
      const palos = [0, 1, 0, 2, 3]
      return valores.map((v, i) => crearCarta(v, palos[i]))
    }
    case Categoria.Color: {
      const palo = azar.entero(4)
      const valores = valoresSueltos(azar, 5)
      return valores.map((v) => crearCarta(v, palo))
    }
    case Categoria.Full: {
      const [trio, pareja] = valoresSueltos(azar, 2)
      const tres = palosDistintos(azar, 3)
      const dos = palosDistintos(azar, 2)
      return [
        ...tres.map((p) => crearCarta(trio, p)),
        ...dos.map((p) => crearCarta(pareja, p)),
      ]
    }
    case Categoria.Poker: {
      const [cuatro] = valoresSueltos(azar, 1)
      const [pateador] = valoresSueltos(azar, 1, [cuatro])
      return [
        ...[0, 1, 2, 3].map((p) => crearCarta(cuatro, p)),
        crearCarta(pateador, azar.entero(4)),
      ]
    }
    case Categoria.EscaleraColor: {
      const palo = azar.entero(4)
      const alto = 4 + azar.entero(9)
      return [alto, alto - 1, alto - 2, alto - 3, alto - 4].map((v) => crearCarta(v, palo))
    }
    default:
      return null
  }
}

/** Dos jugadas distintas, para preguntar cuál gana. */
export function dosJugadasDistintas(
  azar: Aleatorio,
  desde = Categoria.CartaAlta,
  hasta = Categoria.EscaleraColor,
): { a: Carta[]; b: Carta[]; catA: number; catB: number } {
  const rango = hasta - desde + 1
  let catA = desde + azar.entero(rango)
  let catB = desde + azar.entero(rango)
  let vueltas = 0
  while (catA === catB && vueltas++ < 30) catB = desde + azar.entero(rango)
  if (catA === catB) catB = catA === hasta ? catA - 1 : catA + 1

  // Que no compartan cartas: dos manos en la mesa a la vez tienen que ser posibles.
  for (let intento = 0; intento < 60; intento++) {
    const a = construirJugada(catA, azar)
    const b = construirJugada(catB, azar)
    if (!a.some((c) => b.includes(c))) return { a, b, catA, catB }
  }
  return { a: construirJugada(catA, azar), b: construirJugada(catB, azar), catA, catB }
}
