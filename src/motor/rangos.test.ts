import { describe, expect, it } from 'vitest'
import { deCodigo, manoDeCodigo } from './cartas'
import { CLASES_PREFLOP, claseDeMano, combinacionesDeClase } from './clases'
import {
  clasesDelRango, contieneMano, estrecharPorFuerza, parsearRango, porcentajeDeRango,
  quitarBloqueadas, rangoApertura, rangoPorPorcentaje, rangoTotal, repartirEnTramos,
} from './rangos'

describe('clases de mano inicial', () => {
  it('hay exactamente 169 y suman las 1.326 manos posibles', () => {
    expect(CLASES_PREFLOP).toHaveLength(169)
    const total = CLASES_PREFLOP.reduce((t, c) => t + combinacionesDeClase(c), 0)
    expect(total).toBe(1326)
  })

  it('agrupa las manos como lo hace el póker', () => {
    expect(claseDeMano(deCodigo('As'), deCodigo('Ks'))).toBe('AKs')
    expect(claseDeMano(deCodigo('Ks'), deCodigo('Ah'))).toBe('AKo')
    expect(claseDeMano(deCodigo('7s'), deCodigo('7h'))).toBe('77')
  })
})

describe('escribir rangos', () => {
  it('entiende "77+" como las parejas del siete para arriba', () => {
    const r = parsearRango('77+')
    const clases = [...clasesDelRango(r).keys()].sort()
    expect(clases).toEqual(['77', '88', '99', 'AA', 'JJ', 'KK', 'QQ', 'TT'].sort())
    expect(r.combos).toHaveLength(8 * 6)
  })

  it('entiende "AJs+" como AJs, AQs y AKs', () => {
    expect([...clasesDelRango(parsearRango('AJs+')).keys()].sort()).toEqual(['AJs', 'AKs', 'AQs'])
  })

  it('entiende manos sueltas y listas mezcladas', () => {
    const r = parsearRango('AsKd, QQ')
    expect(r.combos).toHaveLength(1 + 6)
    expect(contieneMano(r, deCodigo('As'), deCodigo('Kd'))).toBe(true)
    expect(contieneMano(r, deCodigo('As'), deCodigo('Kh'))).toBe(false)
  })
})

describe('rangos por porcentaje', () => {
  it('el 5% mejor empieza por los ases y no llega a manos flojas', () => {
    const r = rangoPorPorcentaje(0.05)
    expect(contieneMano(r, deCodigo('As'), deCodigo('Ah'))).toBe(true)
    expect(contieneMano(r, deCodigo('7s'), deCodigo('2h'))).toBe(false)
    expect(porcentajeDeRango(r)).toBeGreaterThan(0.03)
    expect(porcentajeDeRango(r)).toBeLessThan(0.07)
  })

  it('cuanto mayor el porcentaje, más manos caben', () => {
    expect(rangoPorPorcentaje(0.3).combos.length).toBeGreaterThan(rangoPorPorcentaje(0.1).combos.length)
  })
})

describe('rangos por posición', () => {
  it('desde el botón se abren muchas más manos que en primera posición', () => {
    const primera = porcentajeDeRango(rangoApertura('utg'))
    const boton = porcentajeDeRango(rangoApertura('boton'))
    expect(boton).toBeGreaterThan(primera * 2)
  })

  it('en primera posición no se abre basura pero sí manos fuertes', () => {
    const r = rangoApertura('utg')
    expect(contieneMano(r, deCodigo('As'), deCodigo('Ah'))).toBe(true)
    expect(contieneMano(r, deCodigo('7s'), deCodigo('2h'))).toBe(false)
    expect(contieneMano(r, deCodigo('9s'), deCodigo('6s'))).toBe(false)
  })
})

describe('estrechar el rango con la mesa', () => {
  it('quita las manos que no le pegan a la mesa', () => {
    const mesa = manoDeCodigo('As Kd 7h')
    const amplio = parsearRango('22+, AJo+, KQo, 65s')
    const estrecho = estrecharPorFuerza(quitarBloqueadas(amplio, mesa), mesa, 0.25)
    // Con as y rey en la mesa, la parte fuerte tiene que llevar as o rey (o pareja servida alta).
    expect(estrecho.combos.length).toBeLessThan(amplio.combos.length)
    expect(contieneMano(estrecho, deCodigo('6s'), deCodigo('5s'))).toBe(false)
  })

  it('reparte el rango en fuerte, medio y flojo sin perder manos', () => {
    const mesa = manoDeCodigo('As Kd 7h')
    const r = quitarBloqueadas(rangoApertura('boton'), mesa)
    const { fuerte, medio, flojo } = repartirEnTramos(r, mesa)
    expect(fuerte.length + medio.length + flojo.length).toBe(r.combos.length)
    expect(fuerte.length).toBeGreaterThan(0)
  })
})

describe('cartas bloqueadas', () => {
  it('el rival no puede tener una carta que tú ya tienes', () => {
    const r = quitarBloqueadas(rangoTotal(), manoDeCodigo('As Ah'))
    expect(contieneMano(r, deCodigo('As'), deCodigo('Kd'))).toBe(false)
    expect(r.combos).toHaveLength((50 * 49) / 2)
  })
})
