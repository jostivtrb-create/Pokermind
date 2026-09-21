import type { Aleatorio } from '../motor/aleatorio'
import type { Carta } from '../motor/cartas'
import type { Exigencia } from '../motor/decision'
import type { EspecDeMano } from './practica'

/**
 * El formato de una lección del entrenador.
 *
 * Sale directo del análisis de qué hace bueno a un tutorial (sección 2 de la
 * guía) y de las decisiones D9, D32, D33 y D37:
 *
 *  · UNA IDEA por lección, nunca dos.
 *  · Se explica en dos minutos y se practica esa misma idea inmediatamente.
 *  · Primero un ejemplo resuelto, luego con ayuda, luego sin ella (`ayuda`).
 *  · No se avanza por pulsar "siguiente", sino por acertar seguido (`dominio`).
 *  · El que acierta a la primera termina antes (D37), pero pasa por la lección.
 */

/**
 * Una pregunta de test. Hace falta porque con tres botones no se puede enseñar
 * qué gana a qué, ni cómo se llama cada cosa: el módulo 1 es vocabulario y
 * reglas, y eso se practica reconociendo, no apostando.
 */
export interface PreguntaTest {
  enunciado: string
  /** Cartas que acompañan a la pregunta, si las hay. */
  mano?: Carta[]
  mesa?: Carta[]
  /** Segunda mano, para las preguntas de "cuál de las dos gana". */
  manoB?: Carta[]
  opciones: OpcionTest[]
}

export interface OpcionTest {
  texto: string
  correcta?: boolean
  /** Por qué está bien o mal. Se enseña siempre, se acierte o no. */
  porQue: string
}

/** Cómo se practica una lección: decidiendo en una mano, o respondiendo. */
export type Practica =
  | { tipo: 'decision'; mano: (azar: Aleatorio, numero: number) => EspecDeMano }
  | { tipo: 'test'; pregunta: (azar: Aleatorio, numero: number) => PreguntaTest }

export interface Leccion {
  id: string
  modulo: number
  titulo: string
  /** La idea nueva, en una frase. Es lo que se recuerda al día siguiente. */
  idea: string
  /** Párrafos cortos. Si hace falta más de esto, es que son dos lecciones. */
  explicacion: string[]
  /** Términos del glosario que esta lección introduce (D5). */
  terminos: string[]
  /** Cómo se practica. Cambia en cada repetición para que no se memorice. */
  practica: Practica
  /** Aciertos seguidos para darla por dominada. */
  dominio: number
  /** Manos mínimas aunque acierte todas (D37: acertando se termina antes). */
  minimoManos: number
  /** Manos como mucho, para que nadie se atasque eternamente. */
  maximoManos: number
  exigencia: Exigencia
  /** Cuándo se ven las probabilidades: la guía que se va quitando. */
  ayuda: 'siempre' | 'alPrincipio' | 'nunca'
  /** Si la primera mano la juega el propio juego, explicándola (ejemplo resuelto). */
  ejemploResuelto: boolean
}

export interface Modulo {
  numero: number
  titulo: string
  resumen: string
  lecciones: Leccion[]
}

/** Valores por defecto: una lección normal del curso. */
export function leccion(
  datos: Partial<Leccion> & Pick<Leccion, 'id' | 'modulo' | 'titulo' | 'idea' | 'explicacion' | 'practica'>,
): Leccion {
  return {
    terminos: [],
    dominio: 4,
    minimoManos: 4,
    maximoManos: 14,
    exigencia: 'basica',
    ayuda: 'siempre',
    ejemploResuelto: datos.practica.tipo === 'decision',
    ...datos,
  }
}

/** ¿Se ven las probabilidades en esta mano? La guía se va quitando sola. */
export function hayAyuda(leccion: Leccion, numeroDeMano: number): boolean {
  if (leccion.ayuda === 'siempre') return true
  if (leccion.ayuda === 'nunca') return false
  return numeroDeMano <= 3
}

/** ¿Ya domina la lección? (D37: acertando seguido se termina antes) */
export function leccionDominada(
  leccion: Leccion,
  manosJugadas: number,
  aciertosSeguidos: number,
): boolean {
  if (manosJugadas >= leccion.maximoManos) return true
  return manosJugadas >= leccion.minimoManos && aciertosSeguidos >= leccion.dominio
}
