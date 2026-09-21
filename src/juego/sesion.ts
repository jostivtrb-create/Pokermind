import type { Aleatorio } from '../motor/aleatorio'
import type { Accion, Juicio } from '../motor/decision'
import { analizar, juzgar } from '../motor/decision'
import type { Leccion, PreguntaTest } from './lecciones'
import { hayAyuda, leccionDominada } from './lecciones'
import type { ManoDePractica } from './practica'
import { aSituacion, crearManoDePractica } from './practica'
import type { ResultadoDeMano } from './progreso'
import { categoriaDeLaMano, esAcierto } from './progreso'

/**
 * Una sesión de lección del entrenador: la máquina que lleva al jugador desde
 * "no sabe qué es esto" hasta "lo domina".
 *
 * El orden sale del análisis del tutorial (sección 2 de la guía):
 *   explicación corta → ejemplo resuelto → manos con ayuda → manos sin ayuda
 * y no se sale de la lección por pulsar "siguiente", sino por acertar seguido.
 */

export type FaseSesion = 'explicacion' | 'ejemplo' | 'jugando' | 'resultado' | 'terminada'

export interface EstadoSesion {
  leccion: Leccion
  fase: FaseSesion
  /** La mano que se juega, cuando la lección es de decisión. */
  mano: ManoDePractica | null
  /** La pregunta, cuando la lección es de test. */
  pregunta: PreguntaTest | null
  /** Opción marcada en una pregunta de test. */
  respuestaMarcada: number | null
  /** Número de la mano dentro de la lección, empezando en 1. */
  numeroDeMano: number
  manosJugadas: number
  aciertosSeguidos: number
  puntos: number
  /** Si en esta mano se ven las probabilidades (la ayuda que se va quitando). */
  conAyuda: boolean
  ultimoJuicio: Juicio | null
  ultimoResultado: ResultadoDeMano | null
  /** Lo que el juego habría hecho, para el ejemplo resuelto. */
  jugadaDelEjemplo: { accion: Accion; porQue: string } | null
}

export function empezarLeccion(leccion: Leccion, azar: Aleatorio): EstadoSesion {
  const { mano, pregunta } = prepararPractica(leccion, azar, 1)
  return {
    leccion,
    fase: 'explicacion',
    mano,
    pregunta,
    respuestaMarcada: null,
    numeroDeMano: 1,
    manosJugadas: 0,
    aciertosSeguidos: 0,
    puntos: 0,
    conAyuda: hayAyuda(leccion, 1),
    ultimoJuicio: null,
    ultimoResultado: null,
    jugadaDelEjemplo: null,
  }
}

function prepararPractica(
  leccion: Leccion,
  azar: Aleatorio,
  numero: number,
): { mano: ManoDePractica | null; pregunta: PreguntaTest | null } {
  if (leccion.practica.tipo === 'test') {
    return { mano: null, pregunta: leccion.practica.pregunta(azar, numero) }
  }
  return { mano: crearManoDePractica(azar, leccion.practica.mano(azar, numero)), pregunta: null }
}

/** De la explicación se pasa al ejemplo resuelto (si lo hay) o a practicar. */
export function empezarPractica(estado: EstadoSesion): EstadoSesion {
  if (!estado.leccion.ejemploResuelto || !estado.mano) return { ...estado, fase: 'jugando' }

  const analisis = analizar(aSituacion(estado.mano))
  return {
    ...estado,
    fase: 'ejemplo',
    jugadaDelEjemplo: {
      accion: analisis.mejor.accion,
      porQue: analisis.mejor.desglose,
    },
  }
}

/** Del ejemplo resuelto se pasa a la primera mano de verdad. */
export function terminarEjemplo(estado: EstadoSesion, azar: Aleatorio): EstadoSesion {
  const { mano, pregunta } = prepararPractica(estado.leccion, azar, estado.numeroDeMano)
  return { ...estado, fase: 'jugando', mano, pregunta, jugadaDelEjemplo: null }
}

/** El jugador decide. Aquí es donde se corrige, al instante (D33). */
export function responder(estado: EstadoSesion, accion: Accion): EstadoSesion {
  if (!estado.mano) return estado
  const juicio = juzgar(aSituacion(estado.mano), accion, estado.mano.exigencia)
  const resultado: ResultadoDeMano = {
    leccionId: estado.leccion.id,
    fecha: new Date().toISOString(),
    accion,
    veredicto: juicio.veredicto,
    puntos: juicio.puntos,
    calle: estado.mano.calle,
    categoria: categoriaDeLaMano(estado.mano),
    perdidaEnBotes: juicio.perdidaEnBotes,
  }

  const acertada = esAcierto(juicio.veredicto)
  return {
    ...estado,
    fase: 'resultado',
    ultimoJuicio: juicio,
    ultimoResultado: resultado,
    manosJugadas: estado.manosJugadas + 1,
    aciertosSeguidos: acertada ? estado.aciertosSeguidos + 1 : 0,
    puntos: estado.puntos + juicio.puntos,
  }
}

/**
 * Responder una pregunta de test. Se corrige al instante igual que una mano, y
 * se explica el porqué de la opción marcada, se haya acertado o no.
 */
export function responderTest(estado: EstadoSesion, indice: number): EstadoSesion {
  if (!estado.pregunta) return estado
  const opcion = estado.pregunta.opciones[indice]
  const acertada = opcion?.correcta === true
  const puntos = acertada ? 100 : 0

  const resultado: ResultadoDeMano = {
    leccionId: estado.leccion.id,
    fecha: new Date().toISOString(),
    accion: 'pagar',
    veredicto: acertada ? 'optima' : 'mala',
    puntos,
    calle: 'preflop',
    categoria: 'pregunta',
    perdidaEnBotes: acertada ? 0 : 1,
  }

  return {
    ...estado,
    fase: 'resultado',
    respuestaMarcada: indice,
    ultimoJuicio: null,
    ultimoResultado: resultado,
    manosJugadas: estado.manosJugadas + 1,
    aciertosSeguidos: acertada ? estado.aciertosSeguidos + 1 : 0,
    puntos: estado.puntos + puntos,
  }
}

/** Siguiente mano, o fin de la lección si ya la domina. */
export function siguienteMano(estado: EstadoSesion, azar: Aleatorio): EstadoSesion {
  if (leccionDominada(estado.leccion, estado.manosJugadas, estado.aciertosSeguidos)) {
    return { ...estado, fase: 'terminada' }
  }
  const numero = estado.numeroDeMano + 1
  const { mano, pregunta } = prepararPractica(estado.leccion, azar, numero)
  return {
    ...estado,
    fase: 'jugando',
    numeroDeMano: numero,
    mano,
    pregunta,
    respuestaMarcada: null,
    conAyuda: hayAyuda(estado.leccion, numero),
    ultimoJuicio: null,
    ultimoResultado: null,
  }
}

/** Cuántas manos le faltan para dominarla, para poder enseñar el progreso. */
export function loQueFalta(estado: EstadoSesion): { manos: number; aciertos: number } {
  const { leccion } = estado
  return {
    manos: Math.max(0, leccion.minimoManos - estado.manosJugadas),
    aciertos: Math.max(0, leccion.dominio - estado.aciertosSeguidos),
  }
}

/** Jugar una mano suelta fuera de una lección (repaso de errores o reto diario). */
export function sesionDeUnaMano(mano: ManoDePractica, leccion: Leccion): EstadoSesion {
  return {
    leccion,
    fase: 'jugando',
    mano,
    pregunta: null,
    respuestaMarcada: null,
    numeroDeMano: 1,
    manosJugadas: 0,
    aciertosSeguidos: 0,
    puntos: 0,
    conAyuda: false,
    ultimoJuicio: null,
    ultimoResultado: null,
    jugadaDelEjemplo: null,
  }
}
