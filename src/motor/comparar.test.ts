import { describe, expect, it } from 'vitest'
import { manoDeCodigo } from './cartas'
import { compararManos } from './comparar'

const comparar = (a: string, b: string) => compararManos(manoDeCodigo(a), manoDeCodigo(b))

describe('explicar quién gana', () => {
  it('cuando las jugadas son distintas, lo dice y ya', () => {
    const r = comparar('7s 7h Kd 9c 2s', 'As Jh 9d 5c 2s')
    expect(r.gana).toBe('a')
    expect(r.porQue).toBe('Pareja gana a carta alta.')
  })

  it('EL CASO QUE FALLABA: dos cartas altas al rey, decide la segunda carta', () => {
    // La mano del usuario: mesa 6♠ J♠ 3♠ 7♣ K♥ con 4♥8♠ contra Q♦5♥.
    const arriba = '4h 8s 6s Js 3s 7c Kh'
    const abajo = 'Qd 5h 6s Js 3s 7c Kh'
    const r = comparar(arriba, abajo)
    expect(r.gana).toBe('b')
    // Las dos hacen K-alta. Se separan en la SEGUNDA carta: reina contra jota
    // (el ocho de arriba ni siquiera entra en las cinco mejores).
    // Antes el juego decía "carta alta: rey" en los dos lados y no explicaba nada.
    expect(r.porQue).toBe('Las dos tienen el rey, así que decide la segunda carta: reina gana a jota.')
  })

  it('dos parejas iguales: decide la carta que las acompaña', () => {
    const r = comparar('7s 7h Ad 9c 2s', '7d 7c Kd 9h 2h')
    expect(r.gana).toBe('a')
    expect(r.porQue).toContain('pareja de sietes')
    expect(r.porQue).toContain('as')
    expect(r.porQue).toContain('rey')
  })

  it('parejas distintas: gana la más alta, dicho en plural', () => {
    const r = comparar('Ks Kh 7d 9c 2s', '7s 7c Ad 9h 3h')
    expect(r.gana).toBe('a')
    expect(r.porQue).toBe('Las dos tienen pareja, pero de reyes gana a la de sietes.')
  })

  it('dobles parejas con la grande igual: decide la pequeña', () => {
    const r = comparar('As Ah 9d 9c 2s', 'Ad Ac 5d 5h 2h')
    expect(r.gana).toBe('a')
    expect(r.porQue).toContain('pareja grande')
    expect(r.porQue).toContain('nueve')
  })

  it('escaleras: gana la más alta', () => {
    const r = comparar('9s 8h 7d 6c 5s', '8s 7h 6d 5c 4s')
    expect(r.gana).toBe('a')
    expect(r.porQue).toBe('Escalera al nueve gana a escalera al ocho.')
  })

  it('empate: lo dice y explica que se reparte', () => {
    const r = comparar('2c 3d As Ks Qs Js Ts', '4h 5h As Ks Qs Js Ts')
    expect(r.gana).toBe('empate')
    expect(r.porQue).toContain('se reparte')
  })

  it('siempre devuelve las cinco cartas de cada mano', () => {
    const r = comparar('4h 8s 6s Js 3s 7c Kh', 'Qd 5h 6s Js 3s 7c Kh')
    expect(r.cincoA).toHaveLength(5)
    expect(r.cincoB).toHaveLength(5)
  })
})
