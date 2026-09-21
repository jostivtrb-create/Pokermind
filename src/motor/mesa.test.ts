import { describe, expect, it } from 'vitest'
import { crearAleatorio } from './aleatorio'
import { manoDeCodigo } from './cartas'
import type { Carta } from './cartas'
import {
  aplicar, boteTotal, calcularPartesDelBote, jugadoresEnJuego, opcionesDisponibles, paraPagar, repartirMano,
} from './mesa'
import type { EstadoMesa } from './mesa'

const cuatro = (fichas = 1000) =>
  [0, 1, 2, 3].map((id) => ({ id, nombre: `J${id}`, fichas, esHumano: id === 0 }))

const mesa = (opciones: Partial<Parameters<typeof repartirMano>[0]> = {}): EstadoMesa =>
  repartirMano({
    jugadores: cuatro(), boton: 0, ciegaPequena: 10, ciegaGrande: 20,
    azar: crearAleatorio(42), ...opciones,
  })

describe('empezar la mano', () => {
  it('pone las ciegas y reparte dos cartas a cada uno', () => {
    const e = mesa()
    expect(e.jugadores[1].apostadoEnLaCalle).toBe(10) // ciega pequeña
    expect(e.jugadores[2].apostadoEnLaCalle).toBe(20) // ciega grande
    expect(boteTotal(e)).toBe(30)
    for (const j of e.jugadores) expect(j.cartas).toHaveLength(2)
  })

  it('no le reparte dos veces la misma carta a nadie', () => {
    for (let semilla = 0; semilla < 50; semilla++) {
      const e = mesa({ azar: crearAleatorio(semilla) })
      const repartidas = e.jugadores.flatMap((j) => j.cartas!)
      expect(new Set(repartidas).size).toBe(repartidas.length)
    }
  })

  it('antes del flop habla primero el de después de la ciega grande', () => {
    expect(mesa().turno).toBe(3)
  })

  it('cara a cara, el botón es la ciega pequeña y habla primero', () => {
    const e = repartirMano({
      jugadores: [0, 1].map((id) => ({ id, nombre: `J${id}`, fichas: 1000, esHumano: id === 0 })),
      boton: 0, ciegaPequena: 10, ciegaGrande: 20, azar: crearAleatorio(1),
    })
    expect(e.jugadores[0].apostadoEnLaCalle).toBe(10)
    expect(e.jugadores[1].apostadoEnLaCalle).toBe(20)
    expect(e.turno).toBe(0)
  })
})

describe('opciones del que habla', () => {
  it('con una apuesta delante se puede retirar, pagar o subir', () => {
    const acciones = opcionesDisponibles(mesa()).map((o) => o.accion)
    expect(acciones).toEqual(['retirarse', 'pagar', 'subir'])
  })

  it('sin nada que pagar se pasa, no se retira uno gratis', () => {
    let e = mesa()
    e = aplicar(e, 'pagar') // J3 iguala
    e = aplicar(e, 'pagar') // botón iguala
    e = aplicar(e, 'pagar') // ciega pequeña completa
    // Le toca a la ciega grande, que ya tiene puesto lo que hay que poner.
    expect(paraPagar(e, e.jugadores[2])).toBe(0)
    expect(opcionesDisponibles(e).map((o) => o.accion)).toEqual(['pasar', 'subir'])
  })

  it('la subida mínima es del tamaño de la subida anterior', () => {
    let e = mesa()
    e = aplicar(e, 'subir', 40) // sube 40 por encima de los 20 → apuesta 60
    expect(e.apuestaActual).toBe(60)
    const subir = opcionesDisponibles(e).find((o) => o.accion === 'subir')!
    expect(subir.minimo).toBe(40)
  })
})

describe('el reparto de calles', () => {
  it('cuando todos igualan, sale el flop y habla el de la izquierda del botón', () => {
    let e = mesa()
    e = aplicar(e, 'pagar')
    e = aplicar(e, 'pagar')
    e = aplicar(e, 'pagar')
    e = aplicar(e, 'pasar')
    expect(e.calle).toBe('flop')
    expect(e.comunitarias).toHaveLength(3)
    expect(e.turno).toBe(1)
    expect(e.botePrevio).toBe(80)
  })

  it('llega hasta el river pasando todos', () => {
    let e = mesa()
    for (let i = 0; i < 3; i++) e = aplicar(e, 'pagar')
    e = aplicar(e, 'pasar')
    for (const calle of ['flop', 'turn', 'river'] as const) {
      expect(e.calle).toBe(calle)
      for (let i = 0; i < 4; i++) if (!e.manoTerminada) e = aplicar(e, 'pasar')
    }
    expect(e.manoTerminada).toBe(true)
    expect(e.comunitarias).toHaveLength(5)
  })

  it('si se retiran todos menos uno, se lleva el bote sin enseñar las cartas', () => {
    let e = mesa()
    e = aplicar(e, 'retirarse')
    e = aplicar(e, 'retirarse')
    e = aplicar(e, 'retirarse')
    expect(e.manoTerminada).toBe(true)
    expect(e.ganancias[0].jugador).toBe(2)
    expect(e.ganancias[0].motivo).toBe('se retiraron los demás')
    expect(e.jugadores[2].fichas).toBe(1000 - 20 + 30) // recupera su ciega y se lleva la pequeña
  })
})

describe('el showdown', () => {
  it('gana la mejor mano y se lleva todo el bote', () => {
    let e = repartirMano({
      jugadores: [0, 1].map((id) => ({ id, nombre: `J${id}`, fichas: 1000, esHumano: false })),
      boton: 0, ciegaPequena: 10, ciegaGrande: 20, azar: crearAleatorio(5),
      reparto: {
        jugadores: { 0: manoDeCodigo('As Ah') as [Carta, Carta], 1: manoDeCodigo('7d 2c') as [Carta, Carta] },
        comunitarias: manoDeCodigo('Ad Kh 9s 4c 3d'),
      },
    })
    e = aplicar(e, 'pagar')
    e = aplicar(e, 'pasar')
    while (!e.manoTerminada) e = aplicar(e, 'pasar')
    expect(e.ganancias[0].jugador).toBe(0)
    expect(e.ganancias[0].fichas).toBe(40)
    expect(e.jugadores[0].fichas).toBe(1020)
  })

  it('en un empate se parte el bote', () => {
    let e = repartirMano({
      jugadores: [0, 1].map((id) => ({ id, nombre: `J${id}`, fichas: 1000, esHumano: false })),
      boton: 0, ciegaPequena: 10, ciegaGrande: 20, azar: crearAleatorio(6),
      reparto: {
        jugadores: { 0: manoDeCodigo('2s 3h') as [Carta, Carta], 1: manoDeCodigo('2d 3c') as [Carta, Carta] },
        comunitarias: manoDeCodigo('As Ks Qh Jd Td'),
      },
    })
    e = aplicar(e, 'pagar')
    e = aplicar(e, 'pasar')
    while (!e.manoTerminada) e = aplicar(e, 'pasar')
    expect(e.jugadores[0].fichas).toBe(1000)
    expect(e.jugadores[1].fichas).toBe(1000)
  })
})

describe('botes paralelos', () => {
  it('el que se queda sin fichas solo aspira a la parte que pudo pagar', () => {
    // Tres jugadores con fichas muy distintas que se lo juegan todo.
    const e = mesa({ jugadores: [
      { id: 0, nombre: 'corto', fichas: 100, esHumano: false },
      { id: 1, nombre: 'medio', fichas: 500, esHumano: false },
      { id: 2, nombre: 'grande', fichas: 1000, esHumano: false },
    ] })
    e.jugadores[0].apostadoEnLaMano = 100
    e.jugadores[1].apostadoEnLaMano = 500
    e.jugadores[2].apostadoEnLaMano = 500

    const partes = calcularPartesDelBote(e)
    expect(partes).toHaveLength(2)
    expect(partes[0]).toEqual({ fichas: 300, aspirantes: [0, 1, 2] }) // 100 × 3
    expect(partes[1]).toEqual({ fichas: 800, aspirantes: [1, 2] }) // 400 × 2
    expect(partes[0].fichas + partes[1].fichas).toBe(1100)
  })

  it('el que se retiró deja sus fichas pero no aspira a nada', () => {
    const e = mesa({ jugadores: [
      { id: 0, nombre: 'a', fichas: 500, esHumano: false },
      { id: 1, nombre: 'b', fichas: 500, esHumano: false },
      { id: 2, nombre: 'c', fichas: 500, esHumano: false },
    ] })
    e.jugadores[0].apostadoEnLaMano = 200
    e.jugadores[0].estado = 'retirado'
    e.jugadores[1].apostadoEnLaMano = 200
    e.jugadores[2].apostadoEnLaMano = 200

    const partes = calcularPartesDelBote(e)
    expect(partes[0].fichas).toBe(600)
    expect(partes[0].aspirantes).toEqual([1, 2])
  })

  it('un todo-in por menos de una subida entera no reabre la mano', () => {
    let e = mesa({ jugadores: [
      { id: 0, nombre: 'a', fichas: 1000, esHumano: false },
      { id: 1, nombre: 'b', fichas: 1000, esHumano: false },
      { id: 2, nombre: 'corto', fichas: 25, esHumano: false },
      { id: 3, nombre: 'd', fichas: 1000, esHumano: false },
    ] })
    e = aplicar(e, 'subir', 40) // J3 sube a 60
    e = aplicar(e, 'pagar') // botón paga
    e = aplicar(e, 'pagar') // ciega pequeña paga
    // La ciega grande solo tiene 25 en total y ya puso 20: al pagar se queda sin fichas.
    expect(e.jugadores[2].fichas).toBe(5)
    e = aplicar(e, 'pagar')
    expect(e.jugadores[2].estado).toBe('allin')
    expect(e.jugadores[2].apostadoEnLaMano).toBe(25)
    // Su todo-in de 25 no llega a los 60, así que no reabre la mano: nadie vuelve
    // a hablar y se pasa al flop con un bote paralelo montado.
    expect(e.calle).toBe('flop')
    expect(e.botePrevio).toBe(60 * 3 + 25)
    const partes = calcularPartesDelBote(e)
    expect(partes[0]).toEqual({ fichas: 100, aspirantes: [0, 1, 2, 3] }) // 25 × 4, con el corto dentro
    expect(partes[1]).toEqual({ fichas: 105, aspirantes: [0, 1, 3] }) // 35 × 3, sin él
  })
})

describe('fichas conservadas', () => {
  it('nunca se crean ni se pierden fichas jugando una mano entera', () => {
    for (let semilla = 0; semilla < 30; semilla++) {
      const azar = crearAleatorio(semilla)
      let e = mesa({ azar })
      const antes = e.jugadores.reduce((t, j) => t + j.fichas, 0) + boteTotal(e)
      let vueltas = 0
      while (!e.manoTerminada && vueltas++ < 200) {
        const opciones = opcionesDisponibles(e)
        if (opciones.length === 0) break
        const elegida = opciones[azar.entero(opciones.length)]
        e = aplicar(e, elegida.accion, elegida.minimo ?? 0)
      }
      const despues = e.jugadores.reduce((t, j) => t + j.fichas, 0) + boteTotal(e)
      expect(despues).toBe(antes)
      expect(e.manoTerminada).toBe(true)
      expect(jugadoresEnJuego(e).length).toBeGreaterThan(0)
    }
  })
})
