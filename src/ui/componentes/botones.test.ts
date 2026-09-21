import { describe, expect, it } from 'vitest'
import { tamanosParaElegir } from './BotonesDeDecision'

/*
  Los botones tienen que ofrecer exactamente lo que el motor sabe puntuar: si el
  juego ofreciera una jugada que el motor descarta, estaría puntuando otra cosa
  distinta de la que pulsaste.
*/
describe('los tamaños que ofrece el juego', () => {
  it('con fichas cortas y un bote enorme, ofrece el todo-in', () => {
    const opciones = tamanosParaElegir(1821, 0, 393, 2000)
    expect(opciones).toHaveLength(1)
    expect(opciones[0].esTodoIn).toBe(true)
    expect(opciones[0].pones).toBe(393)
  })

  it('no ofrece calderilla: una ficha suelta por encima del pago', () => {
    expect(tamanosParaElegir(2879, 178, 179, 3000)).toHaveLength(0)
  })

  it('con fichas de sobra ofrece medio bote, tres cuartos y bote', () => {
    expect(tamanosParaElegir(100, 0, 900, 900).map((o) => o.etiqueta)).toEqual(['½ bote', '¾ bote', 'Bote'])
  })

  it('si al rival no le quedan fichas, no hay nada que apostar', () => {
    expect(tamanosParaElegir(500, 0, 900, 0)).toHaveLength(0)
  })

  it('y si ya metiste todas las tuyas, tampoco: ahí solo quedan cartas por salir', () => {
    // Es la señal que usa la mesa para pasar sola y no puntuar una no-decisión.
    expect(tamanosParaElegir(1821, 0, 0, 2000)).toHaveLength(0)
  })
})
