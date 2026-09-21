import { describe, expect, it } from 'vitest'
import { manoDeCodigo, barajaCompleta, barajar } from './cartas'
import { crearAleatorio } from './aleatorio'
import { Categoria, categoriaDe, describirMano, evaluar, mejoresCinco } from './evaluador'

const mano = (texto: string) => evaluar(manoDeCodigo(texto))
const categoria = (texto: string) => categoriaDe(mano(texto))

describe('categorías de mano', () => {
  it('reconoce cada categoría', () => {
    expect(categoria('As Ks Qs Js Ts')).toBe(Categoria.EscaleraColor)
    expect(categoria('9h 8h 7h 6h 5h')).toBe(Categoria.EscaleraColor)
    expect(categoria('7s 7h 7d 7c 2s')).toBe(Categoria.Poker)
    expect(categoria('7s 7h 7d 3c 3s')).toBe(Categoria.Full)
    expect(categoria('As Js 9s 5s 2s')).toBe(Categoria.Color)
    expect(categoria('9s 8h 7d 6c 5s')).toBe(Categoria.Escalera)
    expect(categoria('7s 7h 7d Kc 2s')).toBe(Categoria.Trio)
    expect(categoria('7s 7h 3d 3c Ks')).toBe(Categoria.DoblePareja)
    expect(categoria('7s 7h Kd 9c 2s')).toBe(Categoria.Pareja)
    expect(categoria('As Jh 9d 5c 2s')).toBe(Categoria.CartaAlta)
  })

  it('la rueda A-2-3-4-5 es escalera, y es escalera al 5 (no al as)', () => {
    expect(categoria('As 2h 3d 4c 5s')).toBe(Categoria.Escalera)
    // Una escalera al 6 gana a la rueda: es el error clásico de creerla "al as".
    expect(mano('6s 5h 4d 3c 2s')).toBeGreaterThan(mano('As 2h 3d 4c 5s'))
    expect(describirMano(manoDeCodigo('As 2h 3d 4c 5s'))).toBe('escalera al cinco')
  })

  it('la rueda también cuenta como escalera de color', () => {
    expect(categoria('As 2s 3s 4s 5s')).toBe(Categoria.EscaleraColor)
    expect(mano('6s 5s 4s 3s 2s')).toBeGreaterThan(mano('As 2s 3s 4s 5s'))
  })
})

describe('orden entre manos', () => {
  it('respeta la escalera de categorías', () => {
    const orden = [
      'As Jh 9d 5c 2s', '7s 7h Kd 9c 2s', '7s 7h 3d 3c Ks', '7s 7h 7d Kc 2s',
      '9s 8h 7d 6c 5s', 'As Js 9s 5s 2s', '7s 7h 7d 3c 3s', '7s 7h 7d 7c 2s', 'As Ks Qs Js Ts',
    ].map(mano)
    for (let i = 1; i < orden.length; i++) expect(orden[i]).toBeGreaterThan(orden[i - 1])
  })

  it('desempata por pateador', () => {
    expect(mano('As Ah Kd 9c 2s')).toBeGreaterThan(mano('As Ah Qd 9c 2s'))
    expect(mano('Ks Kh 3d 3c As')).toBeGreaterThan(mano('Ks Kh 3d 3c Qs'))
    expect(mano('As Ah Kd Kc 2s')).toBeGreaterThan(mano('As Ah Qd Qc Ks'))
  })

  it('dos manos iguales empatan aunque cambien los palos', () => {
    expect(mano('As Ah Kd 9c 2s')).toBe(mano('Ad Ac Kh 9s 2h'))
  })

  it('la escalera real es la mejor mano posible', () => {
    const real = mano('As Ks Qs Js Ts')
    const azar = crearAleatorio(7)
    for (let i = 0; i < 500; i++) {
      const cartas = barajar(barajaCompleta(), azar).slice(0, 5)
      expect(evaluar(cartas)).toBeLessThanOrEqual(real)
    }
  })
})

describe('siete cartas', () => {
  it('elige la mejor mano de cinco entre las siete', () => {
    // Trío en la mesa + pareja en mano = full, no trío.
    expect(categoria('9s 9h 9d 2c 5s Ks Kh')).toBe(Categoria.Full)
    // Cinco del mismo palo repartidas entre mano y mesa = color.
    expect(categoria('As 2s 7s 9s Kh 3s 4h')).toBe(Categoria.Color)
  })

  it('coincide con probar las 21 combinaciones a mano', () => {
    const azar = crearAleatorio(1234)
    for (let ronda = 0; ronda < 2000; ronda++) {
      const siete = barajar(barajaCompleta(), azar).slice(0, 7)
      let mejorFuerza = -1
      for (let a = 0; a < 3; a++)
        for (let b = a + 1; b < 4; b++)
          for (let c = b + 1; c < 5; c++)
            for (let d = c + 1; d < 6; d++)
              for (let e = d + 1; e < 7; e++) {
                const v = evaluar([siete[a], siete[b], siete[c], siete[d], siete[e]])
                if (v > mejorFuerza) mejorFuerza = v
              }
      expect(evaluar(siete)).toBe(mejorFuerza)
    }
  })

  it('mejoresCinco devuelve las cartas que forman la mano', () => {
    const cinco = mejoresCinco(manoDeCodigo('9s 9h 9d 2c 5s Ks Kh'))
    expect(cinco).toHaveLength(5)
    expect(evaluar(cinco)).toBe(mano('9s 9h 9d Ks Kh'))
  })
})

describe('nombres en español', () => {
  it('describe la mano como la diría una persona', () => {
    expect(describirMano(manoDeCodigo('Ks Kh 7d 3c 2s'))).toBe('pareja de reyes')
    expect(describirMano(manoDeCodigo('Ks Kh 7d 7c 2s'))).toBe('doble pareja de reyes y sietes')
    expect(describirMano(manoDeCodigo('Ks Kh Kd 7c 7s'))).toBe('full de reyes con sietes')
    expect(describirMano(manoDeCodigo('As Ks Qs Js Ts'))).toBe('escalera real')
    expect(describirMano(manoDeCodigo('Ah Kh Qh Jh 9h'))).toBe('color de corazones')
  })
})
