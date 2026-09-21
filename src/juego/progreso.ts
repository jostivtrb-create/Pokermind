import type { Aleatorio } from '../motor/aleatorio'
import type { Carta } from '../motor/cartas'
import type { Calle, Veredicto } from '../motor/decision'
import { categoriaDe, evaluar, NOMBRES_CATEGORIA } from '../motor/evaluador'
import type { ManoDePractica } from './practica'

/**
 * Todo lo que el juego recuerda de un jugador. Es JSON plano y con número de
 * versión: se guarda en el aparato primero y se sincroniza con la cuenta cuando
 * hay conexión (D31).
 */

export const VERSION_PROGRESO = 1

export interface ResultadoDeMano {
  leccionId: string | null
  fecha: string
  accion: 'retirarse' | 'pagar' | 'subir'
  veredicto: Veredicto
  puntos: number
  calle: Calle
  /** Categoría de mano que tenías, para las estadísticas de "manos más comunes". */
  categoria: string
  perdidaEnBotes: number
}

export interface ManoFallada {
  mano: ManoDePractica
  leccionId: string | null
  falladaEl: string
  /** Cuándo toca volver a ponerla (repaso espaciado, D15). */
  revisarEl: string
  /** Veces que ya se repasó: cada acierto la aleja más en el tiempo. */
  repasos: number
}

export interface EstadisticasPorCalle {
  decisiones: number
  puntos: number
}

/**
 * Por dónde empieza cada jugador.
 *
 * En la ronda 2 se decidió que nadie se saltaba lecciones. Al probar el juego
 * el usuario cambió de idea — *"yo sé que ahorita te había dicho que no, pero
 * sí, yo creo que es lo mejor"*— y tiene razón: obligar a alguien que ya sabe
 * las reglas a pasar por "qué es una pareja" es la forma más rápida de que
 * cierre el juego.
 *
 * No es un examen: lo elige el jugador. Y lo anterior a su nivel queda abierto
 * por si quiere repasarlo.
 */
export type Nivel = 'cero' | 'reglas' | 'intermedio'

export const MODULO_DE_ENTRADA: Record<Nivel, number> = {
  cero: 1,
  reglas: 2,
  intermedio: 4,
}

export interface Progreso {
  version: number
  /** null mientras no lo haya elegido: entonces se le pregunta. */
  nivel: Nivel | null
  /** Lecciones terminadas, con lo que se sacó en cada una. */
  lecciones: Record<string, { terminadaEl: string; puntos: number; manos: number }>
  puntosTotales: number
  decisiones: number
  aciertos: number
  porCalle: Record<Calle, EstadisticasPorCalle>
  categorias: Record<string, number>
  errores: ManoFallada[]
  logros: Record<string, string>
  retoDiario: { fecha: string; puntos: number } | null
  /** El modo libre se abre al terminar el módulo 1 (D34). */
  modoLibreDesbloqueado: boolean
  torneoGuardado: unknown | null
  ajustes: { sonido: boolean; animaciones: boolean }
  actualizadoEl: string
}

export function progresoNuevo(): Progreso {
  return {
    version: VERSION_PROGRESO,
    nivel: null,
    lecciones: {},
    puntosTotales: 0,
    decisiones: 0,
    aciertos: 0,
    porCalle: {
      preflop: { decisiones: 0, puntos: 0 },
      flop: { decisiones: 0, puntos: 0 },
      turn: { decisiones: 0, puntos: 0 },
      river: { decisiones: 0, puntos: 0 },
    },
    categorias: {},
    errores: [],
    logros: {},
    retoDiario: null,
    modoLibreDesbloqueado: false,
    torneoGuardado: null,
    ajustes: { sonido: true, animaciones: true },
    actualizadoEl: new Date().toISOString(),
  }
}

/** Una decisión se considera acierto si el veredicto no es "mala". */
export function esAcierto(veredicto: Veredicto): boolean {
  return veredicto !== 'mala'
}

export function anotarDecision(
  progreso: Progreso,
  resultado: ResultadoDeMano,
  mano: ManoDePractica,
): Progreso {
  const porCalle = { ...progreso.porCalle }
  porCalle[resultado.calle] = {
    decisiones: porCalle[resultado.calle].decisiones + 1,
    puntos: porCalle[resultado.calle].puntos + resultado.puntos,
  }

  const categorias = { ...progreso.categorias }
  categorias[resultado.categoria] = (categorias[resultado.categoria] ?? 0) + 1

  // Lo que se falla vuelve más adelante (D15). Lo que se acierta, no.
  const errores = esAcierto(resultado.veredicto)
    ? progreso.errores
    : [...progreso.errores, nuevoError(mano, resultado)]

  return {
    ...progreso,
    puntosTotales: progreso.puntosTotales + resultado.puntos,
    decisiones: progreso.decisiones + 1,
    aciertos: progreso.aciertos + (esAcierto(resultado.veredicto) ? 1 : 0),
    porCalle,
    categorias,
    errores,
    actualizadoEl: new Date().toISOString(),
  }
}

function nuevoError(mano: ManoDePractica, resultado: ResultadoDeMano): ManoFallada {
  return {
    mano,
    leccionId: resultado.leccionId,
    falladaEl: resultado.fecha,
    revisarEl: enDias(2),
    repasos: 0,
  }
}

function enDias(dias: number): string {
  const d = new Date()
  d.setDate(d.getDate() + dias)
  return d.toISOString()
}

/** Espaciado: 2 días, luego 5, luego 12, luego 30. Al acertar dos veces, fuera. */
const ESPACIADO = [2, 5, 12, 30]

export function repasarError(progreso: Progreso, indice: number, acertado: boolean): Progreso {
  const errores = [...progreso.errores]
  const error = errores[indice]
  if (!error) return progreso

  if (acertado && error.repasos + 1 >= 2) {
    errores.splice(indice, 1)
  } else if (acertado) {
    errores[indice] = {
      ...error,
      repasos: error.repasos + 1,
      revisarEl: enDias(ESPACIADO[Math.min(error.repasos + 1, ESPACIADO.length - 1)]),
    }
  } else {
    // Fallarla otra vez la devuelve al principio del espaciado.
    errores[indice] = { ...error, repasos: 0, revisarEl: enDias(ESPACIADO[0]) }
  }
  return { ...progreso, errores, actualizadoEl: new Date().toISOString() }
}

/** Las manos falladas a las que ya les toca volver. */
export function erroresParaRepasar(progreso: Progreso, ahora = new Date()): ManoFallada[] {
  return progreso.errores.filter((e) => new Date(e.revisarEl) <= ahora)
}

/**
 * Cambia los palos y la posición de una mano fallada para que vuelva "igual pero
 * distinta". Si volviera idéntica se memorizaría la respuesta en vez del motivo,
 * que es justo lo que no queremos (D15).
 */
export function variarMano(mano: ManoDePractica, azar: Aleatorio): ManoDePractica {
  const permutacion = [0, 1, 2, 3]
  for (let i = 3; i > 0; i--) {
    const j = azar.entero(i + 1)
    const t = permutacion[i]
    permutacion[i] = permutacion[j]
    permutacion[j] = t
  }
  const cambiar = (c: Carta): Carta => ((c >> 2) << 2) | permutacion[c & 3]
  return {
    ...mano,
    mano: [cambiar(mano.mano[0]), cambiar(mano.mano[1])],
    mesa: mano.mesa.map(cambiar),
  }
}

/** Nombre de la mano que tenías, para la tabla de "manos más comunes". */
export function categoriaDeLaMano(mano: ManoDePractica): string {
  if (mano.mesa.length === 0) {
    return (mano.mano[0] >> 2) === (mano.mano[1] >> 2) ? 'pareja servida' : 'carta alta'
  }
  return NOMBRES_CATEGORIA[categoriaDe(evaluar([...mano.mano, ...mano.mesa]))]
}

/** Porcentaje de decisiones correctas, que es el número que más mira el jugador. */
export function porcentajeAciertos(progreso: Progreso): number {
  return progreso.decisiones === 0 ? 0 : progreso.aciertos / progreso.decisiones
}

/** Nota media por calle: dónde flojea. */
export function mediaPorCalle(progreso: Progreso, calle: Calle): number {
  const c = progreso.porCalle[calle]
  return c.decisiones === 0 ? 0 : c.puntos / c.decisiones / 100
}
