import { describe, expect, it } from 'vitest'
import { manoDeCodigo } from './cartas'
import type { Carta } from './cartas'
import { outsContra, proyectoDeLaMano } from './proyectos'
import { quitarBloqueadas, rangoApertura } from './rangos'

const par = (t: string) => manoDeCodigo(t) as [Carta, Carta]
const contra = (m: string, b: string) => {
  const mano = par(m)
  const mesa = manoDeCodigo(b)
  return outsContra(mano, mesa, quitarBloqueadas(rangoApertura('boton'), [...mano, ...mesa]))
}

/*
  Los outs son EL concepto que el jugador se puede llevar a una mesa de verdad:
  ahí no hay pantalla que le diga "ganas el 35%", pero sí puede contar cartas.
  Por eso se cuentan como los enseña el módulo 2 —las que completan el proyecto—
  y no "todas las que me ponen por delante", que sería más exacto pero nadie
  puede hacer de cabeza y además contradiría la lección.
*/
describe('contar los outs como se cuentan en una mesa', () => {
  it('cuatro de un palo son nueve outs, como dice el glosario', () => {
    const o = contra('Ah 7h', 'Kh 4h 2c')
    expect(o.cuantas).toBe(9)
    expect(o.proyecto).toBe('proyecto de color')
    expect(o.comoSeLlaman).toBe('los corazones')
  })

  it('una escalera abierta son ocho, por los dos lados', () => {
    const o = contra('Jd Tc', '9h 8s 2d')
    expect(o.cuantas).toBe(8)
    expect(o.proyecto).toBe('escalera abierta')
  })

  it('una escalera por dentro son cuatro, y se dice cuál falta', () => {
    const o = contra('Kd Qc', 'Ah Ts 3d')
    expect(o.cuantas).toBe(4)
    expect(o.proyecto).toBe('escalera por dentro')
    expect(o.comoSeLlaman).toBe('las jotas')
  })

  it('sin proyecto no se inventa ninguno', () => {
    expect(contra('Th 3c', 'Ac 6c Jh').cuantas).toBe(0)
  })

  it('con la mejor mano no se habla de outs: no te falta nada', () => {
    expect(contra('Ac Ad', '7h 4s 2d').cuantas).toBe(0)
  })

  it('antes del flop y en el river no hay outs que contar', () => {
    expect(contra('Ah 7h', '').cuantas).toBe(0)
    expect(contra('Ah 7h', 'Kh 4h 2c 9s 3d').cuantas).toBe(0)
  })

  it('la regla del 2 y el 4: outs por 2 con una carta, por 4 con dos', () => {
    expect(contra('Ah 7h', 'Kh 4h 2c').probabilidad).toBeCloseTo(0.36, 2) // 9 × 4
    expect(contra('Ah 7h', 'Kh 4h 2c 3s').probabilidad).toBeCloseTo(0.18, 2) // 9 × 2
  })

  it('el proyecto suelto no necesita saber lo que tiene el rival', () => {
    const p = proyectoDeLaMano(par('Kd Qc'), manoDeCodigo('Ah Ts 3d'))
    expect(p.cuantas).toBe(4)
    expect(p.comoSeLlaman).toBe('las jotas')
  })
})
