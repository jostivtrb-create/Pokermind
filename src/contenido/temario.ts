import type { Leccion, Modulo } from '../juego/lecciones'
import type { Progreso } from '../juego/progreso'
import { MODULO_1 } from './modulo1'
import { MODULO_2 } from './modulo2'
import { MODULO_3 } from './modulo3'
import { MODULO_4 } from './modulo4'
import { MODULO_5 } from './modulo5'
import { MODULO_6 } from './modulo6'
import { MODULO_7 } from './modulo7'
import { MODULO_8 } from './modulo8'
import { MODULO_9 } from './modulo9'

/**
 * El temario completo: los 9 módulos aprobados en la ronda 3 (D35), en orden.
 *
 * El orden importa y no es negociable sobre la marcha: cada módulo se apoya en
 * el anterior. Nadie se salta lecciones (D23), pero el que acierta seguido pasa
 * por ellas más deprisa (D37).
 */
export const TEMARIO: Modulo[] = [MODULO_1, MODULO_2, MODULO_3, MODULO_4, MODULO_5, MODULO_6, MODULO_7, MODULO_8, MODULO_9]

/** Todos los módulos previstos, incluidos los que todavía no tienen lecciones. */
export const MODULOS_PREVISTOS = [
  { numero: 1, titulo: 'Las reglas y la mesa', resumen: 'Qué gana a qué, los tres botones, las ciegas y el botón.' },
  { numero: 2, titulo: 'Probabilidad básica', resumen: 'Outs, cuántas cartas te sirven y qué significa de verdad "26%".' },
  { numero: 3, titulo: 'El precio del bote', resumen: 'Cuánto cuesta pagar comparado con lo que puedes ganar.' },
  { numero: 4, titulo: 'La posición', resumen: 'Por qué el que habla último gana más con las mismas cartas.' },
  { numero: 5, titulo: 'Manos iniciales y rangos', resumen: 'Qué se juega desde cada silla y por qué.' },
  { numero: 6, titulo: 'Leer al rival', resumen: 'Qué dice su apuesta sobre sus cartas.' },
  { numero: 7, titulo: 'Sacar valor y farolear', resumen: 'Cuándo esconder una mano fuerte y cuándo el farol sale a cuenta.' },
  { numero: 8, titulo: 'Fichas cortas y torneo', resumen: 'Qué cambia cuando las ciegas te comen.' },
  { numero: 9, titulo: 'Equilibrio', resumen: 'Por qué a veces hay que jugar la misma mano de dos formas.' },
]

export const LECCIONES: Leccion[] = TEMARIO.flatMap((m) => m.lecciones)

export function buscarLeccion(id: string): Leccion | undefined {
  return LECCIONES.find((l) => l.id === id)
}

export function leccionTerminada(progreso: Progreso, id: string): boolean {
  return progreso.lecciones[id] !== undefined
}

/**
 * La siguiente lección por hacer. Como no se salta nada, es simplemente la
 * primera que no esté terminada.
 */
export function siguienteLeccion(progreso: Progreso): Leccion | null {
  return LECCIONES.find((l) => !leccionTerminada(progreso, l.id)) ?? null
}

/** Una lección está abierta si es la siguiente o si ya se hizo (para repasar). */
export function leccionDisponible(progreso: Progreso, id: string): boolean {
  if (leccionTerminada(progreso, id)) return true
  return siguienteLeccion(progreso)?.id === id
}

export function moduloTerminado(progreso: Progreso, numero: number): boolean {
  const modulo = TEMARIO.find((m) => m.numero === numero)
  if (!modulo || modulo.lecciones.length === 0) return false
  return modulo.lecciones.every((l) => leccionTerminada(progreso, l.id))
}

/** Cuánto llevas del curso, de 0 a 1. */
export function avanceDelCurso(progreso: Progreso): number {
  if (LECCIONES.length === 0) return 0
  const hechas = LECCIONES.filter((l) => leccionTerminada(progreso, l.id)).length
  return hechas / LECCIONES.length
}
