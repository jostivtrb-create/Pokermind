import type { Aleatorio } from './aleatorio'
import type { Carta } from './cartas'
import { barajaCompleta, barajar } from './cartas'
import type { Calle } from './decision'
import { evaluar, mejoresCinco } from './evaluador'
import type { PerfilRival } from './perfiles'

/**
 * La mesa de póker: quién habla, cuánto hay en el bote, cuándo se reparte el
 * flop y quién se lleva las fichas.
 *
 * Es Texas Hold'em sin límite completo, incluidos los casos que casi siempre se
 * hacen mal: el botón que rota, la subida mínima, el todo-in por menos de una
 * subida entera, y los botes paralelos cuando alguien se queda sin fichas.
 *
 * No sabe nada de lecciones, de puntos ni de pantallas: solo reglas. Así lo
 * pueden usar igual el entrenador, el modo libre y —el día que toque— el
 * multijugador (D14).
 */

export type AccionMesa = 'retirarse' | 'pasar' | 'pagar' | 'subir'

export type EstadoJugador = 'jugando' | 'retirado' | 'allin' | 'eliminado'

export interface Jugador {
  id: number
  nombre: string
  fichas: number
  cartas: [Carta, Carta] | null
  /** Lo que lleva puesto en esta calle. */
  apostadoEnLaCalle: number
  /** Lo que lleva puesto en toda la mano (hace falta para los botes paralelos). */
  apostadoEnLaMano: number
  estado: EstadoJugador
  esHumano: boolean
  perfil?: PerfilRival
  /** Si ya habló en esta calle. La ciega grande habla aunque nadie haya subido. */
  haHablado: boolean
}

export interface Evento {
  jugador: number
  calle: Calle
  accion: AccionMesa
  cantidad: number
  /** Bote en el momento de la acción, para poder reconstruir la mano después (D27). */
  boteAntes: number
}

export interface ParteDelBote {
  fichas: number
  /** Ids de los que se lo pueden llevar. */
  aspirantes: number[]
}

export interface Ganancia {
  jugador: number
  fichas: number
  /** Las cinco cartas con las que ganó, para poder resaltarlas. */
  mejorMano?: Carta[]
  motivo: 'showdown' | 'se retiraron los demás'
}

export interface EstadoMesa {
  jugadores: Jugador[]
  boton: number
  calle: Calle
  comunitarias: Carta[]
  /** Fichas ya recogidas de calles anteriores. */
  botePrevio: number
  apuestaActual: number
  /** Lo mínimo que hay que subir por encima de la apuesta actual. */
  subidaMinima: number
  turno: number
  ciegaPequena: number
  ciegaGrande: number
  baraja: Carta[]
  historial: Evento[]
  manoTerminada: boolean
  ganancias: Ganancia[]
  /** Los botes, con el principal el primero. Se calcula al terminar. */
  partesDelBote: ParteDelBote[]
}

const ORDEN_CALLES: Calle[] = ['preflop', 'flop', 'turn', 'river']

/** Fichas en juego ahora mismo, contando lo de esta calle. */
export function boteTotal(estado: EstadoMesa): number {
  return estado.botePrevio + estado.jugadores.reduce((t, j) => t + j.apostadoEnLaCalle, 0)
}

/** Lo que le falta poner a un jugador para seguir. */
export function paraPagar(estado: EstadoMesa, jugador: Jugador): number {
  return Math.min(estado.apuestaActual - jugador.apostadoEnLaCalle, jugador.fichas)
}

export function jugadoresEnJuego(estado: EstadoMesa): Jugador[] {
  return estado.jugadores.filter((j) => j.estado === 'jugando' || j.estado === 'allin')
}

/** Los que todavía pueden apostar (los de todo-in ya no deciden nada). */
export function jugadoresQuePuedenHablar(estado: EstadoMesa): Jugador[] {
  return estado.jugadores.filter((j) => j.estado === 'jugando')
}

export interface OpcionesReparto {
  jugadores: Array<Pick<Jugador, 'id' | 'nombre' | 'fichas' | 'esHumano'> & { perfil?: PerfilRival }>
  boton: number
  ciegaPequena: number
  ciegaGrande: number
  azar: Aleatorio
  /** Para el entrenador: cartas fijadas de antemano. */
  reparto?: { jugadores?: Record<number, [Carta, Carta]>; comunitarias?: Carta[] }
}

/** Empieza una mano: pone las ciegas, reparte y deja el turno en quien habla primero. */
export function repartirMano(opciones: OpcionesReparto): EstadoMesa {
  const { boton, ciegaPequena, ciegaGrande, azar } = opciones
  const baraja = barajar(barajaCompleta(), azar)
  const fijadas = opciones.reparto?.jugadores ?? {}
  const usadas = new Set<Carta>()
  for (const cartas of Object.values(fijadas)) for (const c of cartas) usadas.add(c)
  for (const c of opciones.reparto?.comunitarias ?? []) usadas.add(c)
  const libres = baraja.filter((c) => !usadas.has(c))

  const jugadores: Jugador[] = opciones.jugadores.map((j) => ({
    ...j,
    cartas: j.fichas > 0 ? (fijadas[j.id] ?? [libres.pop()!, libres.pop()!]) : null,
    apostadoEnLaCalle: 0,
    apostadoEnLaMano: 0,
    estado: j.fichas > 0 ? 'jugando' : 'eliminado',
    haHablado: false,
  }))

  const estado: EstadoMesa = {
    jugadores,
    boton,
    calle: 'preflop',
    comunitarias: [],
    botePrevio: 0,
    apuestaActual: 0,
    subidaMinima: ciegaGrande,
    turno: 0,
    ciegaPequena,
    ciegaGrande,
    baraja: libres,
    historial: [],
    manoTerminada: false,
    ganancias: [],
    partesDelBote: [],
  }

  // Las ciegas son obligatorias: se ponen antes de que nadie decida nada.
  const activos = jugadores.filter((j) => j.estado === 'jugando')
  const caraACara = activos.length === 2
  const indiceCiegaPequena = caraACara ? boton : siguienteActivo(estado, boton)
  const indiceCiegaGrande = siguienteActivo(estado, indiceCiegaPequena)

  poner(estado.jugadores[indiceCiegaPequena], ciegaPequena)
  poner(estado.jugadores[indiceCiegaGrande], ciegaGrande)
  estado.apuestaActual = ciegaGrande
  estado.comunitarias = opciones.reparto?.comunitarias?.slice(0, 0) ?? []

  // Antes del flop habla el de después de la ciega grande; cara a cara, el botón.
  estado.turno = caraACara ? boton : siguienteActivo(estado, indiceCiegaGrande)
  // La ciega grande tiene derecho a hablar aunque nadie suba.
  estado.jugadores[indiceCiegaGrande].haHablado = false

  // Cartas comunitarias fijadas por una lección: se guardan para ir sacándolas.
  if (opciones.reparto?.comunitarias?.length) {
    estado.baraja.push(...[...opciones.reparto.comunitarias].reverse())
  }
  return estado
}

function siguienteActivo(estado: EstadoMesa, desde: number): number {
  const n = estado.jugadores.length
  for (let paso = 1; paso <= n; paso++) {
    const i = (desde + paso) % n
    if (estado.jugadores[i].estado === 'jugando') return i
  }
  return desde
}

function poner(jugador: Jugador, cantidad: number): number {
  const puesto = Math.min(cantidad, jugador.fichas)
  jugador.fichas -= puesto
  jugador.apostadoEnLaCalle += puesto
  jugador.apostadoEnLaMano += puesto
  if (jugador.fichas === 0) jugador.estado = 'allin'
  return puesto
}

export interface OpcionDisponible {
  accion: AccionMesa
  /** Para subir: lo mínimo y lo máximo que se puede poner por encima de la apuesta actual. */
  minimo?: number
  maximo?: number
  /** Cuánto cuesta (lo que se pone ahora). */
  coste: number
}

/** Qué puede hacer el que tiene el turno. */
export function opcionesDisponibles(estado: EstadoMesa): OpcionDisponible[] {
  const jugador = estado.jugadores[estado.turno]
  if (!jugador || jugador.estado !== 'jugando' || estado.manoTerminada) return []

  const falta = paraPagar(estado, jugador)
  const opciones: OpcionDisponible[] = []

  if (falta > 0) {
    opciones.push({ accion: 'retirarse', coste: 0 })
    opciones.push({ accion: 'pagar', coste: falta })
  } else {
    opciones.push({ accion: 'pasar', coste: 0 })
  }

  // Subir: hace falta tener fichas por encima de lo que cuesta igualar.
  const fichasTrasIgualar = jugador.fichas - falta
  if (fichasTrasIgualar > 0) {
    const minimo = Math.min(estado.subidaMinima, fichasTrasIgualar)
    opciones.push({ accion: 'subir', minimo, maximo: fichasTrasIgualar, coste: falta + minimo })
  }
  return opciones
}

/**
 * Aplica una acción y deja la mesa lista para el siguiente. `cantidad` es lo que
 * se sube POR ENCIMA de la apuesta actual (para subir); en lo demás se ignora.
 */
export function aplicar(estado: EstadoMesa, accion: AccionMesa, cantidad = 0): EstadoMesa {
  const jugador = estado.jugadores[estado.turno]
  if (!jugador || estado.manoTerminada) return estado

  const boteAntes = boteTotal(estado)
  const falta = paraPagar(estado, jugador)

  switch (accion) {
    case 'retirarse':
      jugador.estado = 'retirado'
      break
    case 'pasar':
      break
    case 'pagar':
      poner(jugador, falta)
      break
    case 'subir': {
      const subida = Math.max(0, Math.min(cantidad, jugador.fichas - falta))
      poner(jugador, falta + subida)
      const nuevaApuesta = jugador.apostadoEnLaCalle
      // Una subida entera reabre la mano: los que ya habían hablado vuelven a
      // tener que decidir. Un todo-in por menos de una subida entera NO la reabre.
      const esSubidaEntera = nuevaApuesta - estado.apuestaActual >= estado.subidaMinima
      if (nuevaApuesta > estado.apuestaActual) {
        if (esSubidaEntera) {
          estado.subidaMinima = nuevaApuesta - estado.apuestaActual
          for (const otro of estado.jugadores) {
            if (otro.id !== jugador.id && otro.estado === 'jugando') otro.haHablado = false
          }
        }
        estado.apuestaActual = nuevaApuesta
      }
      break
    }
  }

  jugador.haHablado = true
  estado.historial.push({ jugador: jugador.id, calle: estado.calle, accion, cantidad, boteAntes })

  return avanzar(estado)
}

/** Mueve el turno, cambia de calle o termina la mano, según toque. */
function avanzar(estado: EstadoMesa): EstadoMesa {
  const enJuego = jugadoresEnJuego(estado)

  // Si solo queda uno, se lleva el bote sin enseñar las cartas.
  if (enJuego.length <= 1) return terminarSinShowdown(estado)

  if (!calleTerminada(estado)) {
    estado.turno = siguienteActivo(estado, estado.turno)
    return estado
  }

  recogerApuestas(estado)

  // Si ya nadie puede apostar (todos en todo-in), se sacan las cartas que falten.
  const puedenHablar = jugadoresQuePuedenHablar(estado)
  if (puedenHablar.length <= 1 && calleSiguiente(estado.calle) !== null) {
    // Todos en todo-in: no queda nada que decidir, se sacan las cartas que falten.
    while (calleSiguiente(estado.calle) !== null) pasarDeCalle(estado)
    return resolver(estado)
  }

  if (calleSiguiente(estado.calle) === null) return resolver(estado)

  pasarDeCalle(estado)
  return estado
}

function calleTerminada(estado: EstadoMesa): boolean {
  const pueden = jugadoresQuePuedenHablar(estado)
  if (pueden.length === 0) return true
  return pueden.every((j) => j.haHablado && j.apostadoEnLaCalle === estado.apuestaActual)
}

function recogerApuestas(estado: EstadoMesa): void {
  for (const j of estado.jugadores) {
    estado.botePrevio += j.apostadoEnLaCalle
    j.apostadoEnLaCalle = 0
    j.haHablado = false
  }
  estado.apuestaActual = 0
  estado.subidaMinima = estado.ciegaGrande
}

function pasarDeCalle(estado: EstadoMesa): void {
  const siguiente = ORDEN_CALLES[ORDEN_CALLES.indexOf(estado.calle) + 1]
  estado.calle = siguiente
  // Se quema una carta antes de cada reparto, como en la mesa de verdad.
  if (siguiente === 'flop') {
    estado.baraja.pop()
    estado.comunitarias.push(estado.baraja.pop()!, estado.baraja.pop()!, estado.baraja.pop()!)
  } else {
    estado.baraja.pop()
    estado.comunitarias.push(estado.baraja.pop()!)
  }
  // Después del flop habla primero el de la izquierda del botón.
  estado.turno = siguienteActivo(estado, estado.boton)
}

function terminarSinShowdown(estado: EstadoMesa): EstadoMesa {
  recogerApuestas(estado)
  const ganador = jugadoresEnJuego(estado)[0]
  if (ganador) {
    ganador.fichas += estado.botePrevio
    estado.ganancias = [
      { jugador: ganador.id, fichas: estado.botePrevio, motivo: 'se retiraron los demás' },
    ]
  }
  estado.partesDelBote = [{ fichas: estado.botePrevio, aspirantes: ganador ? [ganador.id] : [] }]
  estado.botePrevio = 0
  estado.manoTerminada = true
  return estado
}

/**
 * Reparte el bote al final. Aquí viven los botes paralelos: si alguien se quedó
 * sin fichas a mitad, solo puede llevarse la parte a la que llegó a poner.
 */
function resolver(estado: EstadoMesa): EstadoMesa {
  estado.partesDelBote = calcularPartesDelBote(estado)
  const ganancias = new Map<number, Ganancia>()

  for (const parte of estado.partesDelBote) {
    const candidatos = parte.aspirantes
      .map((id) => estado.jugadores.find((j) => j.id === id)!)
      .filter((j) => j.cartas && (j.estado === 'jugando' || j.estado === 'allin'))
    if (candidatos.length === 0) continue

    let mejorValor = -1
    let ganadores: Jugador[] = []
    for (const j of candidatos) {
      const valor = evaluar([...j.cartas!, ...estado.comunitarias])
      if (valor > mejorValor) {
        mejorValor = valor
        ganadores = [j]
      } else if (valor === mejorValor) {
        ganadores.push(j)
      }
    }

    // Reparto con resto: las fichas sueltas van al primero a la izquierda del botón.
    const porCabeza = Math.floor(parte.fichas / ganadores.length)
    let resto = parte.fichas - porCabeza * ganadores.length
    for (const g of ordenarDesdeBoton(estado, ganadores)) {
      const extra = resto > 0 ? 1 : 0
      resto -= extra
      const total = porCabeza + extra
      g.fichas += total
      const previa = ganancias.get(g.id)
      if (previa) previa.fichas += total
      else
        ganancias.set(g.id, {
          jugador: g.id,
          fichas: total,
          mejorMano: mejoresCinco([...g.cartas!, ...estado.comunitarias]),
          motivo: 'showdown',
        })
    }
  }

  estado.ganancias = [...ganancias.values()]
  estado.botePrevio = 0
  estado.manoTerminada = true
  return estado
}

function ordenarDesdeBoton(estado: EstadoMesa, jugadores: Jugador[]): Jugador[] {
  const n = estado.jugadores.length
  const posicion = (j: Jugador) => {
    const i = estado.jugadores.indexOf(j)
    return (i - estado.boton - 1 + n * 2) % n
  }
  return [...jugadores].sort((a, b) => posicion(a) - posicion(b))
}

/**
 * Divide el bote en partes. Cada escalón de todo-in abre una parte nueva a la
 * que solo pueden aspirar los que llegaron a poner esa cantidad.
 */
export function calcularPartesDelBote(estado: EstadoMesa): ParteDelBote[] {
  const puestos = estado.jugadores
    .filter((j) => j.apostadoEnLaMano > 0)
    .map((j) => ({ id: j.id, puesto: j.apostadoEnLaMano, sigueVivo: j.estado !== 'retirado' }))

  const escalones = [...new Set(puestos.map((p) => p.puesto))].sort((a, b) => a - b)
  const partes: ParteDelBote[] = []
  let anterior = 0

  for (const escalon of escalones) {
    const tramo = escalon - anterior
    let fichas = 0
    const aspirantes: number[] = []
    for (const p of puestos) {
      if (p.puesto >= escalon) {
        fichas += tramo
        if (p.sigueVivo) aspirantes.push(p.id)
      } else if (p.puesto > anterior) {
        fichas += p.puesto - anterior
      }
    }
    if (fichas > 0) partes.push({ fichas, aspirantes })
    anterior = escalon
  }

  // Partes consecutivas con los mismos aspirantes se juntan: es el mismo bote.
  const juntadas: ParteDelBote[] = []
  for (const parte of partes) {
    const ultima = juntadas[juntadas.length - 1]
    if (ultima && mismosAspirantes(ultima.aspirantes, parte.aspirantes)) ultima.fichas += parte.fichas
    else juntadas.push({ ...parte })
  }
  return juntadas
}

function mismosAspirantes(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((x) => b.includes(x))
}

/** Calle siguiente, para las lecciones que van saltando de calle. */
export function calleSiguiente(calle: Calle): Calle | null {
  const i = ORDEN_CALLES.indexOf(calle)
  return i < ORDEN_CALLES.length - 1 ? ORDEN_CALLES[i + 1] : null
}
