import type { Aleatorio } from '../motor/aleatorio'
import type { Carta } from '../motor/cartas'
import type { Accion, Exigencia } from '../motor/decision'
import type { EspecDeMano } from './practica'

/**
 * Un PASO de la explicación: una sola idea, en una pantalla.
 *
 * Nació de la primera prueba real del usuario: *"siento que de entrada tiene
 * muchísimo texto y aburre; para alguien que no sabe jugar va a entrar y va a
 * haber un reguero de texto"*. Tenía razón. Cuatro párrafos seguidos no se leen,
 * se saltan.
 *
 * Ahora cada idea ocupa su propia pantalla, con **una línea corta y algo que
 * mirar**: cartas de verdad, dos manos comparadas, la escalera de jugadas. Se
 * avanza tocando, como en cualquier app de aprender idiomas.
 */
export type Paso =
  /** Una frase suelta. Es el paso más pobre: se usa solo cuando no hay nada que enseñar. */
  | { tipo: 'texto'; texto: string }
  /** Una frase y unas cartas debajo. El paso que más se usa. */
  | { tipo: 'cartas'; texto: string; cartas: Carta[]; pie?: string; destacar?: Carta[] }
  /** Tus dos cartas y la mesa, como se ven jugando. */
  | { tipo: 'mesa'; texto: string; mano: Carta[]; mesa: Carta[]; pie?: string }
  /** Dos manos enfrentadas, para ver cuál gana. */
  | { tipo: 'comparar'; texto: string; a: Carta[]; b: Carta[]; gana: 'a' | 'b'; pie?: string }
  /** La escalera completa de jugadas, de la peor a la mejor, con cartas. */
  | { tipo: 'escalera'; texto: string; pie?: string }
  /** Los trece valores en fila, de menor a mayor. */
  | { tipo: 'valores'; texto: string; pie?: string }
  /** Los tres botones del juego, con uno resaltado. */
  | { tipo: 'acciones'; texto: string; resaltar?: 'retirarse' | 'pagar' | 'subir'; pie?: string }
  /** Un porcentaje dibujado: barra de victoria/empate/derrota, con o sin cartas. */
  | { tipo: 'porcentaje'; texto: string; victoria: number; empate?: number; mano?: Carta[]; mesa?: Carta[]; pie?: string }
  /** El precio del bote en fichas: lo que pones contra lo que puedes llevarte. */
  | { tipo: 'precio'; texto: string; bote: number; pagar: number; pie?: string }
  /** Las cartas que te sirven, contadas y a la vista. */
  | { tipo: 'outs'; texto: string; mano: Carta[]; mesa: Carta[]; outs: Carta[]; pie?: string }
  /** La mesa vista desde arriba: cuatro sillas, el botón y las ciegas. */
  | { tipo: 'sillas'; texto: string; boton: number; resaltar?: number; nota?: string; pie?: string }
  /** La rejilla de 13×13 con las manos iniciales que entran en un rango. */
  | { tipo: 'rango'; texto: string; rango: string; pie?: string }
  /** Montones de fichas comparados. */
  | { tipo: 'fichas'; texto: string; montones: Array<{ nombre: string; fichas: number; color?: string }>; pie?: string }

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
  /**
   * Las cinco cartas que forman cada jugada. Se enseñan al corregir: decir
   * "gana por la segunda carta" y no enseñar cuál es deja al jugador igual.
   */
  cincoA?: Carta[]
  cincoB?: Carta[]
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
  | {
      tipo: 'test'
      pregunta: (azar: Aleatorio, numero: number) => PreguntaTest
      /** La lista entera, cuando las preguntas están escritas a mano. */
      preguntas?: readonly PreguntaTest[]
    }

/**
 * Reparte las preguntas de un test como se reparten cartas: barajadas, y sin
 * repetir ninguna hasta que se acaban todas.
 *
 * Antes cada pregunta se sacaba al azar de la lista. Con dos preguntas y tres
 * aciertos seguidos para dar la lección por dominada, tocaba la MISMA tres
 * veces seguidas: no enseña nada y parece que la app se ha colgado. Lo cazó un
 * jugador en el módulo 4.
 */
export function testEntre(preguntas: readonly PreguntaTest[]): Practica {
  let baraja: PreguntaTest[] = []
  let ultima: PreguntaTest | null = null

  return {
    tipo: 'test',
    preguntas,
    pregunta: (azar) => {
      if (baraja.length === 0) {
        baraja = [...preguntas]
        for (let i = baraja.length - 1; i > 0; i--) {
          const j = azar.entero(i + 1)
          ;[baraja[i], baraja[j]] = [baraja[j], baraja[i]]
        }
        // Que la primera de la baraja nueva no repita la última de la anterior.
        const arriba = baraja.length - 1
        if (baraja.length > 1 && baraja[arriba] === ultima) {
          const otra = azar.entero(arriba)
          ;[baraja[arriba], baraja[otra]] = [baraja[otra], baraja[arriba]]
        }
      }
      ultima = baraja.pop()!
      return ultima
    },
  }
}

export interface Leccion {
  id: string
  modulo: number
  titulo: string
  /** La idea nueva, en una frase. Es lo que se recuerda al día siguiente. */
  idea: string
  /**
   * Párrafos cortos. Si hace falta más de esto, es que son dos lecciones.
   * Se usa como respaldo cuando la lección no tiene `pasos` escritos a mano.
   */
  explicacion: string[]
  /**
   * La explicación en pasos, uno por pantalla. Es lo preferido: cuando está,
   * manda sobre `explicacion`.
   */
  pasos?: Paso[]
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
  /**
   * Qué debería salir casi siempre en las manos de esta lección.
   *
   * No lo usa el juego: lo usan los tests. Una lección que enseña "aquí hay que
   * retirarse" y reparte manos donde el motor dice "sube" está enseñando mal, y
   * eso es un error de contenido que no se ve mirando la pantalla un rato.
   *
   * `"seguir"` vale para las lecciones de nivel básico, donde lo que se enseña
   * es no soltar la mano y da igual si se paga o se sube (D20).
   */
  accionEsperada?: Accion | 'seguir'
}

export interface Modulo {
  numero: number
  titulo: string
  resumen: string
  lecciones: Leccion[]
}

/** Valores por defecto: una lección normal del curso. */
export function leccion(
  datos: Partial<Leccion> & Pick<Leccion, 'id' | 'modulo' | 'titulo' | 'idea' | 'practica'>,
): Leccion {
  return {
    explicacion: [],
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

/**
 * Los pasos de una lección.
 *
 * Si la lección no los trae escritos a mano, se parte la explicación en uno por
 * párrafo. Así ninguna lección enseña un muro de texto, ni siquiera las que
 * todavía no se han pasado a pasos visuales.
 */
export function pasosDeLaLeccion(leccion: Leccion): Paso[] {
  if (leccion.pasos?.length) return leccion.pasos
  return leccion.explicacion.map((texto) => ({ tipo: 'texto', texto }))
}
