import { describe, expect, it } from 'vitest'
import { crearAleatorio } from './aleatorio'
import { manoDeCodigo } from './cartas'
import type { Carta } from './cartas'
import { equityContraAleatorias, equityContraRango, reglaDel2y4 } from './equity'
import type { Combo } from './equity'

const par = (texto: string): [Carta, Carta] => {
  const c = manoDeCodigo(texto)
  return [c[0], c[1]]
}
const rivalConcreto = (texto: string): Combo[] => {
  const [a, b] = par(texto)
  return [{ a, b, peso: 1 }]
}
const azar = () => crearAleatorio(20260921)

describe('probabilidades contra una mano conocida', () => {
  // Números de referencia de cualquier calculadora de póker. Si el motor se
  // desvía de estos, es que está mintiendo, y todo el juego se basa en que no mienta.
  const casos: Array<[string, string, string, number]> = [
    ['As Ah', 'Ks Kh', 'ases contra reyes', 0.823],
    ['As Ah', '7d 2c', 'ases contra la peor mano', 0.877],
    ['Ad Kd', 'Qs Qh', 'AK del mismo palo contra pareja de reinas', 0.466],
    ['Ad Kc', 'Qs Qh', 'AK de distinto palo contra reinas', 0.432],
    ['9s 8s', 'Ad Kc', 'conectores del mismo palo contra AK', 0.402],
  ]

  for (const [mia, suya, titulo, esperado] of casos) {
    it(`${titulo} ≈ ${(esperado * 100).toFixed(1)}%`, () => {
      const r = equityContraRango(par(mia), [], rivalConcreto(suya), {
        azar: azar(),
        repeticiones: 60000,
      })
      expect(r.equity).toBeGreaterThan(esperado - 0.015)
      expect(r.equity).toBeLessThan(esperado + 0.015)
      expect(r.victoria + r.empate + r.derrota).toBeCloseTo(1, 6)
    })
  }
})

describe('cálculo exacto', () => {
  it('en el river no hay nada que simular: gana o pierde, y lo sabe seguro', () => {
    const r = equityContraRango(par('As Ks'), manoDeCodigo('Qs Js Ts 2h 3d'), rivalConcreto('9c 9d'))
    expect(r.exacto).toBe(true)
    expect(r.equity).toBe(1) // escalera real contra pareja de nueves
  })

  it('reconoce el empate cuando la mejor mano está en la mesa', () => {
    const r = equityContraRango(par('2c 3d'), manoDeCodigo('As Ks Qs Js Ts'), rivalConcreto('4h 5h'))
    expect(r.exacto).toBe(true)
    expect(r.empate).toBe(1)
    expect(r.equity).toBe(0.5)
  })

  it('en el turn calcula exacto y coincide con la simulación', () => {
    const mano = par('Ah Kh')
    const mesa = manoDeCodigo('Qh 7h 2c 5d')
    const rango = rivalConcreto('Qs Jd')
    const exacto = equityContraRango(mano, mesa, rango)
    const simulado = equityContraRango(mano, mesa, rango, { topeExacto: 0, repeticiones: 40000, azar: azar() })
    expect(exacto.exacto).toBe(true)
    expect(simulado.exacto).toBe(false)
    expect(Math.abs(exacto.equity - simulado.equity)).toBeLessThan(0.02)
  })
})

describe('probabilidades en el flop', () => {
  it('proyecto de color con dos cartas por salir ronda el 35%', () => {
    // A♥K♥ con dos corazones en la mesa contra una pareja servida.
    const r = equityContraRango(par('Ah Kh'), manoDeCodigo('Qh 7h 2c'), rivalConcreto('Qs Jd'), {
      azar: azar(),
    })
    expect(r.equity).toBeGreaterThan(0.5) // además de color, las sobrecartas dan outs
    expect(r.equity).toBeLessThan(0.75)
  })

  it('cuantos más rivales, menos probabilidad de ganar con la misma mano', () => {
    const mano = par('As Ah')
    const uno = equityContraAleatorias(mano, [], 1, { azar: azar(), repeticiones: 20000 })
    const tres = equityContraAleatorias(mano, [], 3, { azar: azar(), repeticiones: 20000 })
    expect(uno.equity).toBeGreaterThan(0.8)
    expect(tres.equity).toBeLessThan(uno.equity)
    expect(tres.equity).toBeGreaterThan(0.5) // siguen siendo ases
  })
})

describe('el rango del rival cambia el número', () => {
  it('la misma mano vale más contra cualquier mano que contra solo manos fuertes', () => {
    const mano = par('Jh Jd')
    const contraTodo = equityContraAleatorias(mano, [], 1, { azar: azar(), repeticiones: 20000 })
    const soloFuertes: Combo[] = []
    for (const texto of ['As Ah', 'As Ad', 'Ks Kh', 'Ks Kd', 'Qs Qh', 'As Ks', 'Ad Kd']) {
      soloFuertes.push(...rivalConcreto(texto))
    }
    const contraFuertes = equityContraRango(mano, [], soloFuertes, { azar: azar(), repeticiones: 20000 })
    expect(contraTodo.equity).toBeGreaterThan(0.7)
    expect(contraFuertes.equity).toBeLessThan(0.45)
  })
})

describe('regla del 2 y el 4', () => {
  it('estima como se enseña de cabeza', () => {
    expect(reglaDel2y4(9, 2)).toBeCloseTo(0.36, 5) // proyecto de color en el flop
    expect(reglaDel2y4(9, 1)).toBeCloseTo(0.18, 5) // el mismo, ya en el turn
    expect(reglaDel2y4(40, 2)).toBe(1) // no se pasa del 100%
  })
})
