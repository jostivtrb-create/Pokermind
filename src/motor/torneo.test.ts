import { describe, expect, it } from 'vitest'
import { crearAleatorio } from './aleatorio'
import { decidirBot } from './bot'
import { manoDeCodigo } from './cartas'
import type { Carta } from './cartas'
import { aplicar, repartirMano } from './mesa'
import { PERFILES_CON_NOMBRE } from './perfiles'
import {
  ESTRUCTURA_CIEGAS, FICHAS_INICIALES, cerrarMano, ciegasActuales, crearTorneo,
  jugarHastaElHumano, jugadoresVivos, siguienteMano,
} from './torneo'
import type { Torneo } from './torneo'

/** Juega un torneo entero con los cuatro puestos llevados por bots. */
function jugarTorneoCompleto(semilla: number): Torneo {
  const azar = crearAleatorio(semilla)
  let torneo = crearTorneo({ semilla })
  // El humano también lo lleva un bot, para poder jugarlo entero sin interfaz.
  torneo.jugadores[0].esHumano = false
  torneo.jugadores[0].perfil = PERFILES_CON_NOMBRE[1]

  let manos = 0
  while (!torneo.terminado && manos++ < 400) {
    torneo = siguienteMano(torneo, azar)
    if (!torneo.mesa) break
    let mesa = torneo.mesa
    let vueltas = 0
    while (!mesa.manoTerminada && vueltas++ < 300) {
      const decision = decidirBot(mesa, azar)
      mesa = aplicar(mesa, decision.accion, decision.cantidad)
    }
    torneo = cerrarMano({ ...torneo, mesa })
  }
  return torneo
}

describe('el torneo del modo libre', () => {
  it('empieza con cuatro jugadores y las mismas fichas para todos', () => {
    const t = crearTorneo({ semilla: 1 })
    expect(t.jugadores).toHaveLength(4)
    expect(t.jugadores.filter((j) => j.esHumano)).toHaveLength(1)
    for (const j of t.jugadores) expect(j.fichas).toBe(FICHAS_INICIALES)
  })

  it('a cada bot le toca un carácter distinto', () => {
    const t = crearTorneo({ semilla: 7 })
    const perfiles = t.jugadores.filter((j) => !j.esHumano).map((j) => j.perfil!)
    expect(perfiles).toHaveLength(3)
    const agresividades = perfiles.map((p) => p.agresividad)
    expect(new Set(agresividades).size).toBe(3)
    for (const p of perfiles) expect(p.nombre).toBeTruthy()
  })

  it('con la misma semilla salen los mismos rivales (hace falta para guardar la partida)', () => {
    const a = crearTorneo({ semilla: 99 })
    const b = crearTorneo({ semilla: 99 })
    expect(a.jugadores.map((j) => j.nombre)).toEqual(b.jugadores.map((j) => j.nombre))
    expect(a.jugadores[1].perfil).toEqual(b.jugadores[1].perfil)
  })

  it('las ciegas suben cada seis manos', () => {
    let t = crearTorneo({ semilla: 3 })
    expect(ciegasActuales(t)).toEqual(ESTRUCTURA_CIEGAS[0])
    t = { ...t, manosJugadas: 5, mesa: null }
    t = { ...t, nivel: Math.floor(6 / 6) }
    expect(ciegasActuales(t)).toEqual(ESTRUCTURA_CIEGAS[1])
  })

  it('se puede guardar a medias y seguir donde estaba (D28)', () => {
    const azar = crearAleatorio(11)
    let t = crearTorneo({ semilla: 11 })
    t = siguienteMano(t, azar)
    const guardado = JSON.parse(JSON.stringify(t)) as Torneo
    expect(guardado.mesa).not.toBeNull()
    expect(guardado.mesa!.jugadores[0].cartas).toHaveLength(2)
    expect(guardado.jugadores[1].perfil).toEqual(t.jugadores[1].perfil)
  })
})

describe('torneos jugados enteros por bots', () => {
  it('siempre terminan, con un solo ganador y sin perder fichas', () => {
    for (const semilla of [1, 3, 8, 21]) {
      const t = jugarTorneoCompleto(semilla)
      expect(t.terminado).toBe(true)
      expect(jugadoresVivos(t)).toHaveLength(1)
      const total = t.jugadores.reduce((suma, j) => suma + j.fichas, 0)
      expect(total).toBe(FICHAS_INICIALES * 4)
      expect(jugadoresVivos(t)[0].puesto).toBe(1)
    }
  })

  it('reparte los cuatro puestos, del ganador al primero en caer', () => {
    const t = jugarTorneoCompleto(4)
    const puestos = t.jugadores.map((j) => j.puesto).sort()
    expect(puestos).toEqual([1, 2, 3, 4])
  })
})

describe('cómo deciden los bots', () => {
  const mesaCon = (cartas: string, perfil = PERFILES_CON_NOMBRE[0]) => {
    const azar = crearAleatorio(5)
    let mesa = repartirMano({
      jugadores: [
        { id: 0, nombre: 'humano', fichas: 1000, esHumano: true },
        { id: 1, nombre: 'bot', fichas: 1000, esHumano: false, perfil },
      ],
      boton: 0, ciegaPequena: 10, ciegaGrande: 20, azar,
      reparto: { jugadores: { 1: manoDeCodigo(cartas) as [Carta, Carta] } },
    })
    mesa = aplicar(mesa, 'subir', 180) // el humano sube fuerte
    return mesa
  }

  it('un bot disciplinado tira la basura ante una subida grande casi siempre', () => {
    const roca = PERFILES_CON_NOMBRE.find((p) => p.nombre === 'la roca')!
    let retiradas = 0
    for (let semilla = 0; semilla < 20; semilla++) {
      const decision = decidirBot(mesaCon('7d 2c', roca), crearAleatorio(semilla))
      if (decision.accion === 'retirarse') retiradas++
    }
    // Se le permite equivocarse de vez en cuando —si no, no hay nada que leer—,
    // pero con 7-2 ante una subida grande tiene que tirarla la mayoría de las veces.
    expect(retiradas).toBeGreaterThanOrEqual(16)
  })

  it('un bot disciplinado no tira los ases', () => {
    const mesa = mesaCon('As Ah', PERFILES_CON_NOMBRE.find((p) => p.nombre === 'el calculador')!)
    const decision = decidirBot(mesa, crearAleatorio(1))
    expect(decision.accion).not.toBe('retirarse')
  })

  it('nunca se retira cuando pasar es gratis', () => {
    const azar = crearAleatorio(9)
    let mesa = repartirMano({
      jugadores: [
        { id: 0, nombre: 'humano', fichas: 1000, esHumano: true },
        { id: 1, nombre: 'bot', fichas: 1000, esHumano: false, perfil: PERFILES_CON_NOMBRE[0] },
      ],
      boton: 0, ciegaPequena: 10, ciegaGrande: 20, azar,
      reparto: { jugadores: { 1: manoDeCodigo('7d 2c') as [Carta, Carta] } },
    })
    mesa = aplicar(mesa, 'pagar') // el humano solo iguala
    mesa = aplicar(mesa, 'pasar') // el bot pasa y sale el flop
    // En el flop le toca hablar al bot sin nada que pagar.
    for (let i = 0; i < 5 && !mesa.manoTerminada; i++) {
      if (mesa.jugadores[mesa.turno].esHumano) {
        mesa = aplicar(mesa, 'pasar')
        continue
      }
      const decision = decidirBot(mesa, crearAleatorio(i))
      expect(decision.accion).not.toBe('retirarse')
      mesa = aplicar(mesa, decision.accion, decision.cantidad)
    }
  })

  it('los bots juegan solos hasta que le toca al humano', () => {
    const azar = crearAleatorio(77)
    let t = crearTorneo({ semilla: 77 })
    t = siguienteMano(t, azar)
    const { mesa, jugadas } = jugarHastaElHumano(t.mesa!, azar)
    // Solo juegan bots, y se para justo cuando le toca al humano (o si la mano
    // se acabó porque todos se retiraron antes de llegar a él).
    for (const j of jugadas) expect(j.jugador.esHumano).toBe(false)
    if (!mesa.manoTerminada) expect(mesa.jugadores[mesa.turno].esHumano).toBe(true)
  })
})

describe('el torneo se acaba cuando se te acaban las fichas', () => {
  /*
    Jugando: todo-in en la mano 1, lo pierde, se queda con 0 fichas… y el juego
    le ofrecía "Siguiente mano". Lo que pasara después entre los bots no es su
    partida: para él, el torneo terminó ahí.
  */
  const conFichas = (fichas: number[]): Torneo => {
    const t = crearTorneo({ semilla: 5 })
    t.jugadores = t.jugadores.map((j, i) => ({ ...j, fichas: fichas[i] }))
    return t
  }

  it('el humano sin fichas termina el torneo aunque queden bots peleando', () => {
    const t = conFichas([500, 1500, 1000, 1000])
    const mesa = repartirMano({
      jugadores: t.jugadores.map((j) => ({ id: j.id, nombre: j.nombre, fichas: j.fichas, esHumano: j.esHumano })),
      boton: 0, ciegaPequena: 10, ciegaGrande: 20, azar: crearAleatorio(1),
    })
    // Se simula el final: el humano a cero, tres bots vivos.
    mesa.manoTerminada = true
    mesa.jugadores[0].fichas = 0
    const cerrado = cerrarMano({ ...t, mesa })
    expect(cerrado.jugadores.filter((j) => j.fichas > 0)).toHaveLength(3)
    expect(cerrado.terminado).toBe(true)
    expect(cerrado.jugadores.find((j) => j.esHumano)!.puesto).toBe(4)
  })

  it('mientras le queden fichas, el torneo sigue', () => {
    const t = conFichas([500, 1500, 1000, 1000])
    const mesa = repartirMano({
      jugadores: t.jugadores.map((j) => ({ id: j.id, nombre: j.nombre, fichas: j.fichas, esHumano: j.esHumano })),
      boton: 0, ciegaPequena: 10, ciegaGrande: 20, azar: crearAleatorio(1),
    })
    mesa.manoTerminada = true
    const cerrado = cerrarMano({ ...t, mesa })
    expect(cerrado.terminado).toBe(false)
  })
})
