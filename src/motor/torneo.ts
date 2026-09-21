import type { Aleatorio } from './aleatorio'
import { crearAleatorio } from './aleatorio'
import { decidirBot } from './bot'
import type { EstadoMesa, Jugador } from './mesa'
import { aplicar, repartirMano } from './mesa'
import { sortearPerfil } from './perfiles'
import type { PerfilRival } from './perfiles'

/**
 * El torneo del modo libre (D21): cuatro jugadores, las ciegas suben cada pocas
 * manos y se juega hasta que queda uno. Dura 15–20 minutos, que es lo que se
 * eligió para que las decisiones difíciles —las de fichas cortas— lleguen pronto
 * y se aprenda más rápido.
 *
 * Todo el estado es JSON corriente para poder guardar el torneo a medias y
 * retomarlo (D28).
 */

export interface NivelDeCiegas {
  ciegaPequena: number
  ciegaGrande: number
}

/** Sube deprisa a propósito: un torneo largo se hace pesado y enseña menos. */
export const ESTRUCTURA_CIEGAS: readonly NivelDeCiegas[] = [
  { ciegaPequena: 10, ciegaGrande: 20 },
  { ciegaPequena: 15, ciegaGrande: 30 },
  { ciegaPequena: 25, ciegaGrande: 50 },
  { ciegaPequena: 40, ciegaGrande: 80 },
  { ciegaPequena: 60, ciegaGrande: 120 },
  { ciegaPequena: 100, ciegaGrande: 200 },
  { ciegaPequena: 150, ciegaGrande: 300 },
  { ciegaPequena: 250, ciegaGrande: 500 },
  { ciegaPequena: 400, ciegaGrande: 800 },
]

export const MANOS_POR_NIVEL = 6
export const FICHAS_INICIALES = 1000

export interface JugadorTorneo {
  id: number
  nombre: string
  fichas: number
  esHumano: boolean
  perfil?: PerfilRival
  /** Posición final: 4 el primero en caer, 1 el ganador. */
  puesto?: number
}

export interface Torneo {
  jugadores: JugadorTorneo[]
  boton: number
  nivel: number
  manosJugadas: number
  mesa: EstadoMesa | null
  terminado: boolean
  semilla: number
  /** Cuántas manos lleva jugadas el humano, para las estadísticas. */
  iniciado: string
}

export interface OpcionesTorneo {
  nombreHumano?: string
  semilla?: number
  /** 0 fácil, 1 difícil. Solo mueve la disciplina de los bots. */
  dificultad?: number
}

const NOMBRES_BOT = ['Nadia', 'Bruno', 'Celia', 'Dimas', 'Elsa', 'Fito']

export function crearTorneo(opciones: OpcionesTorneo = {}): Torneo {
  const semilla = opciones.semilla ?? Math.floor(Math.random() * 0xffffffff)
  const azar = crearAleatorio(semilla)
  const nombres = [...NOMBRES_BOT].sort(() => azar.siguiente() - 0.5).slice(0, 3)

  const jugadores: JugadorTorneo[] = [
    { id: 0, nombre: opciones.nombreHumano ?? 'Tú', fichas: FICHAS_INICIALES, esHumano: true },
    ...nombres.map((nombre, i) => ({
      id: i + 1,
      nombre,
      fichas: FICHAS_INICIALES,
      esHumano: false,
      // Las barras se sortean por bot y por partida: nunca te enfrentas a los mismos.
      perfil: sortearPerfil(azar, opciones.dificultad ?? 0.5),
    })),
  ]

  return {
    jugadores,
    boton: azar.entero(4),
    nivel: 0,
    manosJugadas: 0,
    mesa: null,
    terminado: false,
    semilla,
    iniciado: new Date().toISOString(),
  }
}

export function ciegasActuales(torneo: Torneo): NivelDeCiegas {
  return ESTRUCTURA_CIEGAS[Math.min(torneo.nivel, ESTRUCTURA_CIEGAS.length - 1)]
}

export function jugadoresVivos(torneo: Torneo): JugadorTorneo[] {
  return torneo.jugadores.filter((j) => j.fichas > 0)
}

/** ¿Sigue teniendo sentido repartir? Con el jugador fuera, no. */
export function elTorneoSigue(torneo: Torneo): boolean {
  const humano = torneo.jugadores.find((j) => j.esHumano)
  return jugadoresVivos(torneo).length > 1 && (!humano || humano.fichas > 0)
}

/** Reparte la siguiente mano del torneo. */
export function siguienteMano(torneo: Torneo, azar: Aleatorio): Torneo {
  /*
    Nunca se reparte una mano que el jugador no puede jugar.

    Sin esto, un torneo guardado con el humano a cero se seguía repartiendo al
    volver: se quedaba mirando a dos bots jugar entre ellos, sin cartas, sin
    botones y sin manera de salir de ahí.
  */
  if (!elTorneoSigue(torneo)) {
    return { ...torneo, terminado: true, mesa: null }
  }

  const ciegas = ciegasActuales(torneo)
  const mesa = repartirMano({
    jugadores: torneo.jugadores.map((j) => ({
      id: j.id,
      nombre: j.nombre,
      fichas: j.fichas,
      esHumano: j.esHumano,
      perfil: j.perfil,
    })),
    boton: torneo.boton,
    ciegaPequena: ciegas.ciegaPequena,
    ciegaGrande: ciegas.ciegaGrande,
    azar,
  })

  return { ...torneo, mesa }
}

/**
 * Cierra la mano: devuelve las fichas a los jugadores del torneo, elimina a los
 * que se quedaron sin nada, mueve el botón y sube las ciegas si toca.
 */
export function cerrarMano(torneo: Torneo): Torneo {
  if (!torneo.mesa || !torneo.mesa.manoTerminada) return torneo

  const jugadores = torneo.jugadores.map((j) => {
    const enMesa = torneo.mesa!.jugadores.find((m) => m.id === j.id)
    return { ...j, fichas: enMesa ? enMesa.fichas : j.fichas }
  })

  const seguianVivos = torneo.jugadores.filter((j) => j.fichas > 0).length
  const vivosAhora = jugadores.filter((j) => j.fichas > 0)

  // Los que se quedan sin fichas en esta mano. Si caen dos a la vez, queda por
  // delante el que llegaba con más fichas, como en cualquier torneo de verdad.
  const caidos = jugadores
    .filter((j) => j.fichas === 0 && j.puesto === undefined)
    .sort((a, b) => {
      const antesA = torneo.jugadores.find((x) => x.id === a.id)!.fichas
      const antesB = torneo.jugadores.find((x) => x.id === b.id)!.fichas
      return antesA - antesB
    })
  let puesto = seguianVivos
  for (const j of caidos) {
    j.puesto = puesto
    puesto--
  }
  if (vivosAhora.length === 1 && vivosAhora[0].puesto === undefined) {
    vivosAhora[0].puesto = 1
  }

  const manosJugadas = torneo.manosJugadas + 1
  const nivel = Math.min(
    Math.floor(manosJugadas / MANOS_POR_NIVEL),
    ESTRUCTURA_CIEGAS.length - 1,
  )

  /*
    Para el jugador, el torneo se acaba cuando se acaban SUS fichas.

    Antes solo terminaba al quedar uno vivo, así que quien se iba a todo-in y lo
    perdía se quedaba con 0 fichas y un botón de "Siguiente mano" que no llevaba
    a ninguna parte. Lo que pasara después entre los bots no es su partida.
  */
  const humanoSinFichas = jugadores.some((j) => j.esHumano && j.fichas === 0)

  return {
    ...torneo,
    jugadores,
    manosJugadas,
    nivel,
    boton: siguienteBoton(jugadores, torneo.boton),
    mesa: null,
    terminado: vivosAhora.length <= 1 || humanoSinFichas,
  }
}

function siguienteBoton(jugadores: JugadorTorneo[], boton: number): number {
  const n = jugadores.length
  for (let paso = 1; paso <= n; paso++) {
    const i = (boton + paso) % n
    if (jugadores[i].fichas > 0) return i
  }
  return boton
}

/**
 * Deja que jueguen los bots hasta que le toque al humano o se acabe la mano.
 * Devuelve las decisiones que tomaron, para poder contarlas en el repaso.
 */
export function jugarHastaElHumano(
  mesa: EstadoMesa,
  azar: Aleatorio,
  limite = 200,
): { mesa: EstadoMesa; jugadas: Array<{ jugador: Jugador; motivo: string }> } {
  const jugadas: Array<{ jugador: Jugador; motivo: string }> = []
  let actual = mesa
  let vueltas = 0

  while (!actual.manoTerminada && vueltas++ < limite) {
    const turno = actual.jugadores[actual.turno]
    if (!turno || turno.esHumano || turno.estado !== 'jugando') break
    const decision = decidirBot(actual, azar)
    jugadas.push({ jugador: turno, motivo: decision.motivo })
    actual = aplicar(actual, decision.accion, decision.cantidad)
  }
  return { mesa: actual, jugadas }
}

/** El puesto en el que quedó el humano, cuando el torneo ya terminó. */
export function puestoDelHumano(torneo: Torneo): number | null {
  const humano = torneo.jugadores.find((j) => j.esHumano)
  return humano?.puesto ?? null
}
