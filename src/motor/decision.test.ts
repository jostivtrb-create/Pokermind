import { describe, expect, it } from 'vitest'
import { manoDeCodigo } from './cartas'
import type { Carta } from './cartas'
import { analizar, juzgar } from './decision'
import type { Situacion } from './decision'
import { PERFILES_CON_NOMBRE, RIVAL_TIPICO } from './perfiles'
import { parsearRango, rangoApertura } from './rangos'

const par = (t: string) => manoDeCodigo(t) as [Carta, Carta]
const perfil = (nombre: string) => PERFILES_CON_NOMBRE.find((p) => p.nombre === nombre)!
const valorDe = (s: Situacion, accion: 'retirarse' | 'pagar' | 'subir') => {
  const a = analizar(s)
  return a.acciones.filter((x) => x.accion === accion).reduce((m, x) => Math.max(m, x.valorEsperado), -Infinity)
}

const basura: Situacion = {
  mano: par('9s 4h'), mesa: manoDeCodigo('As Kd 7c'), calle: 'flop',
  bote: 150, paraPagar: 100, tusFichas: 900, fichasRival: 900,
  rangoRival: rangoApertura('utg'), perfilRival: perfil('la roca'),
}

describe('lo básico: retirarse cuando no hay nada que hacer', () => {
  it('con una mano perdida y una apuesta grande, lo mejor es retirarse', () => {
    expect(analizar(basura).mejor.accion).toBe('retirarse')
  })

  it('retirarse siempre vale cero: lo que ya está en el bote ya no es tuyo', () => {
    expect(valorDe(basura, 'retirarse')).toBe(0)
  })

  it('retirarse ahí puntúa 100 y pagar puntúa 0', () => {
    expect(juzgar(basura, 'retirarse', 'seria').puntos).toBe(100)
    expect(juzgar(basura, 'pagar', 'seria').puntos).toBe(0)
    expect(juzgar(basura, 'pagar', 'seria').veredicto).toBe('mala')
  })

  it('sin probabilidad ninguna en el river, pagar pierde justo lo que pagas', () => {
    const river: Situacion = {
      mano: par('Jh Th'), mesa: manoDeCodigo('Ah 7h 2c 3d 8s'), calle: 'river',
      bote: 100, paraPagar: 150, tusFichas: 900, fichasRival: 900,
      rangoRival: rangoApertura('utg'), perfilRival: perfil('la roca'),
    }
    expect(analizar(river).mejor.accion).toBe('retirarse')
    expect(valorDe(river, 'pagar')).toBeCloseTo(-150, 0)
  })
})

describe('el corazón del juego: esconder una mano fuerte (D20)', () => {
  // Trío en una mesa que el rango del rival no toca, contra alguien disciplinado
  // pero farolero. Apostar solo consigue que tire su mano; pasar le deja meterse
  // solo. Es exactamente lo que el usuario pidió que el juego entendiera.
  const escondida: Situacion = {
    mano: par('7s 7h'), mesa: manoDeCodigo('7d 4c 2h'), calle: 'flop',
    bote: 100, paraPagar: 0, tusFichas: 900, fichasRival: 900,
    rangoRival: parsearRango('AKo, AQo, AJo'),
    perfilRival: { nombre: 'farolero', agresividad: 0.9, disciplina: 0.9, farol: 0.6, tenacidad: 0.5 },
  }

  it('contra un rival que se va a retirar, esconder la mano vale más que subir', () => {
    expect(analizar(escondida).mejor.accion).toBe('pagar')
    expect(valorDe(escondida, 'pagar')).toBeGreaterThan(valorDe(escondida, 'subir') * 1.3)
  })

  it('la misma mano contra uno que lo paga todo: hay que apostar', () => {
    const contraPegajoso: Situacion = {
      ...escondida, rangoRival: rangoApertura('boton'), perfilRival: perfil('el pegajoso'),
    }
    expect(analizar(contraPegajoso).mejor.accion).toBe('subir')
  })

  it('lo explica en palabras, no solo con el número', () => {
    const j = juzgar(escondida, 'subir', 'seria')
    expect(j.veredicto).toBe('mala')
    expect(j.porQueLargo).toContain('esconder la mano')
  })
})

describe('antes del flop', () => {
  it('con ases y una subida delante, hay que resubir', () => {
    const ases: Situacion = {
      mano: par('As Ah'), mesa: [], calle: 'preflop',
      bote: 35, paraPagar: 20, tusFichas: 500, fichasRival: 500,
      rangoRival: rangoApertura('boton'), perfilRival: perfil('el loco'),
    }
    expect(analizar(ases).mejor.accion).toBe('subir')
    expect(juzgar(ases, 'subir', 'seria').veredicto).toBe('optima')
    expect(juzgar(ases, 'retirarse', 'seria').veredicto).toBe('mala')
  })
})

describe('el precio del bote (módulo 3 del temario)', () => {
  it('calcula qué porcentaje necesitas para que pagar salga a cuenta', () => {
    const s: Situacion = {
      mano: par('Jh Th'), mesa: manoDeCodigo('Ah 7h 2c'), calle: 'flop',
      bote: 200, paraPagar: 40, tusFichas: 900, fichasRival: 900,
      rangoRival: rangoApertura('utg'), perfilRival: RIVAL_TIPICO,
    }
    const a = analizar(s)
    // Pagar 40 para optar a 240 → necesitas ganar 1 de cada 6 veces (16,7%).
    expect(a.equityNecesaria).toBeCloseTo(40 / 240, 3)
    expect(a.equity.equity).toBeGreaterThan(a.equityNecesaria)
    expect(valorDe(s, 'pagar')).toBeGreaterThan(0)
  })
})

describe('puntuación graduada (D22)', () => {
  const s: Situacion = {
    mano: par('7s 7h'), mesa: manoDeCodigo('7d 4c 2h'), calle: 'flop',
    bote: 100, paraPagar: 0, tusFichas: 900, fichasRival: 900,
    rangoRival: rangoApertura('boton'), perfilRival: perfil('el pegajoso'),
  }

  it('un error pequeño resta poco y uno grande resta mucho', () => {
    const buena = juzgar(s, 'subir', 'intermedia')
    const regular = juzgar(s, 'pagar', 'intermedia')
    const desastre = juzgar(s, 'retirarse', 'intermedia')
    expect(buena.puntos).toBe(100)
    expect(regular.puntos).toBeGreaterThan(desastre.puntos)
    expect(regular.puntos).toBeLessThan(buena.puntos)
    expect(desastre.puntos).toBe(0) // tirar la mejor mano no vale ni un punto
  })

  it('la pérdida se mide en botes, para poder comparar manos distintas', () => {
    const j = juzgar(s, 'retirarse', 'intermedia')
    expect(j.perdidaEnBotes).toBeCloseTo(j.perdida / s.bote, 6)
  })
})

describe('la exigencia sube con el nivel (D20)', () => {
  const s: Situacion = {
    mano: par('7s 7h'), mesa: manoDeCodigo('7d 4c 2h'), calle: 'flop',
    bote: 100, paraPagar: 0, tusFichas: 900, fichasRival: 900,
    rangoRival: rangoApertura('boton'), perfilRival: perfil('el pegajoso'),
  }

  it('al principiante no se le castiga pagar en vez de subir: las dos son seguir', () => {
    expect(juzgar(s, 'pagar', 'basica').puntos).toBe(100)
    expect(juzgar(s, 'subir', 'basica').puntos).toBe(100)
  })

  it('pero al principiante sí se le castiga retirarse con la mejor mano', () => {
    expect(juzgar(s, 'retirarse', 'basica').veredicto).toBe('mala')
  })

  it('a nivel serio, pagar en vez de subir ya cuesta puntos', () => {
    const basica = juzgar(s, 'pagar', 'basica')
    const intermedia = juzgar(s, 'pagar', 'intermedia')
    const seria = juzgar(s, 'pagar', 'seria')
    expect(basica.puntos).toBe(100)
    expect(intermedia.puntos).toBeLessThan(basica.puntos)
    expect(seria.puntos).toBeLessThan(intermedia.puntos)
    // La mano no cambia: lo que cambia es cuánto se le exige al jugador.
    expect(seria.perdida).toBeCloseTo(intermedia.perdida, 5)
  })
})

describe('las explicaciones', () => {
  it('dicen el porcentaje y qué había que hacer, en español', () => {
    const j = juzgar(basura, 'pagar', 'intermedia')
    expect(j.porQue).toMatch(/%/)
    expect(j.porQue).toContain('retirarse')
    expect(j.porQueLargo).toContain('necesitas ganar al menos')
  })
})

describe('una subida tiene que ser una subida', () => {
  /*
    Jugando en el modo libre salió el consejo "lo mejor era subir 1 (pones 179)":
    al jugador le quedaba una ficha suelta por encima de lo que costaba pagar y
    el motor la ofrecía como jugada. Subir menos que la última apuesta no es
    legal en una mesa, y apostar calderilla no hace nada.
  */
  const casiSinFichas: Situacion = {
    mano: par('Ah Kh'), mesa: manoDeCodigo('Kd 7c 2s'), calle: 'flop',
    bote: 2879, paraPagar: 178, tusFichas: 179, fichasRival: 3000,
    rangoRival: rangoApertura('boton'), perfilRival: RIVAL_TIPICO,
  }

  it('no se ofrecen subidas por debajo del mínimo de verdad', () => {
    for (const a of analizar(casiSinFichas).acciones) {
      if (a.accion !== 'subir') continue
      expect(a.tamano, 'subida ridícula ofrecida como jugada').toBeGreaterThanOrEqual(178)
    }
  })

  it('con fichas para pagar y poco más, las jugadas son pagar o soltar', () => {
    const acciones = analizar(casiSinFichas).acciones.map((a) => a.accion)
    expect(acciones).toContain('pagar')
    expect(acciones).toContain('retirarse')
    expect(acciones).not.toContain('subir')
  })

  it('si aun así sube, se le juzga como si hubiera pagado, no como si se retirara', () => {
    const j = juzgar(casiSinFichas, 'subir', 'intermedia', 1)
    expect(j.elegida.accion).toBe('pagar')
  })

  it('con fichas de sobra sí se prueban medio bote, tres cuartos y bote', () => {
    const holgado: Situacion = { ...casiSinFichas, tusFichas: 4000 }
    const tamanos = analizar(holgado).acciones.filter((a) => a.accion === 'subir').map((a) => a.tamano!)
    expect(tamanos.length).toBeGreaterThanOrEqual(3)
    for (const t of tamanos) expect(t).toBeGreaterThanOrEqual(178)
  })
})
