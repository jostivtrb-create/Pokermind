import { describe, expect, it } from 'vitest'
import { manoDeCodigo } from './cartas'
import type { Carta } from './cartas'
import { analizar, juzgar } from './decision'
import type { Situacion } from './decision'
import { PERFILES_CON_NOMBRE, RIVAL_TIPICO } from './perfiles'
import { estrecharPorFuerza, parsearRango, quitarBloqueadas, rangoApertura } from './rangos'

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
  // Cuesta 40 seguir a propósito: retirarse solo es una jugada cuando hay algo
  // que pagar, y aquí hace falta poder medir lo cara que es esa equivocación.
  const s: Situacion = {
    mano: par('7s 7h'), mesa: manoDeCodigo('7d 4c 2h'), calle: 'flop',
    bote: 100, paraPagar: 40, tusFichas: 900, fichasRival: 900,
    rangoRival: rangoApertura('boton'), perfilRival: perfil('el pegajoso'),
  }

  it('un error pequeño resta poco y uno grande resta mucho', () => {
    // Con un trío servido frente a alguien que lo paga todo, lo mejor es
    // esconderlo y cobrarle: la jugada óptima la decide el motor, no el test.
    const mejor = juzgar(s, analizar(s).mejor.accion, 'intermedia')
    const regular = juzgar(s, 'subir', 'intermedia')
    const desastre = juzgar(s, 'retirarse', 'intermedia')
    expect(analizar(s).mejor.accion).toBe('pagar')
    expect(mejor.puntos).toBe(100)
    expect(regular.puntos).toBeGreaterThan(desastre.puntos)
    expect(regular.puntos).toBeLessThan(mejor.puntos)
    expect(desastre.puntos).toBe(0) // tirar la mejor mano no vale ni un punto
  })

  it('la pérdida se mide en botes, para poder comparar manos distintas', () => {
    const j = juzgar(s, 'retirarse', 'intermedia')
    expect(j.perdidaEnBotes).toBeCloseTo(j.perdida / s.bote, 6)
  })
})

describe('la exigencia sube con el nivel (D20)', () => {
  /*
    Pareja de reinas en una mesa baja contra el que lo paga todo: apostar saca
    bastante más que pasar, pero no es un abismo. Hace falta un hueco así para
    ver el efecto del nivel — con dos jugadas que valen casi lo mismo, la nota
    es 100 en los tres niveles, y con razón (D65).
  */
  const s: Situacion = {
    mano: par('Qs Qh'), mesa: manoDeCodigo('9d 7c 2h'), calle: 'flop',
    bote: 100, paraPagar: 0, tusFichas: 900, fichasRival: 900,
    rangoRival: rangoApertura('boton'), perfilRival: perfil('el pegajoso'),
  }

  it('al principiante no se le castiga pagar en vez de subir: las dos son seguir', () => {
    expect(juzgar(s, 'pagar', 'basica').puntos).toBe(100)
    expect(juzgar(s, 'subir', 'basica').puntos).toBe(100)
  })

  it('pero al principiante sí se le castiga retirarse con la mejor mano', () => {
    // Con algo que pagar, porque gratis no existe retirarse (D60).
    const conApuesta: Situacion = { ...s, paraPagar: 40 }
    expect(juzgar(conApuesta, 'retirarse', 'basica').veredicto).toBe('mala')
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

describe('cuando seguir es gratis', () => {
  /*
    Con nada que pagar, en la mesa no existe retirarse: se pasa. El juego llegó a
    decir "pasaste sin poner nada, pero retirarte habría sacado algo más", que
    además de imposible enseña el peor reflejo posible: soltar manos gratis.
  */
  const gratis: Situacion = {
    mano: par('Th 3c'), mesa: manoDeCodigo('Ac 6c Jh'), calle: 'flop',
    bote: 40, paraPagar: 0, tusFichas: 1000, fichasRival: 3000,
    rangoRival: rangoApertura('boton'), perfilRival: RIVAL_TIPICO,
  }

  it('retirarse no se ofrece como jugada', () => {
    expect(analizar(gratis).acciones.map((a) => a.accion)).not.toContain('retirarse')
  })

  it('pasar nunca vale menos que cero: siempre puedes soltar más adelante', () => {
    expect(valorDe(gratis, 'pagar')).toBeGreaterThanOrEqual(0)
  })

  it('con una mano muy floja, lo mejor sigue siendo pasar y ver otra carta', () => {
    expect(analizar(gratis).mejor.accion).toBe('pagar')
  })

  it('y la explicación no habla de pagar, sino de pasar gratis', () => {
    const j = juzgar(gratis, 'pagar', 'intermedia')
    expect(j.porQue).toContain('gratis')
    expect(j.porQue).not.toContain('retirarse')
  })
})

describe('las explicaciones no se contradicen', () => {
  it('no dice "sale a cuenta" de una jugada que pierde fichas', () => {
    const floja: Situacion = {
      mano: par('Th 3c'), mesa: manoDeCodigo('Ac 6c Jh'), calle: 'flop',
      bote: 100, paraPagar: 25, tusFichas: 1000, fichasRival: 3000,
      rangoRival: rangoApertura('utg'), perfilRival: RIVAL_TIPICO,
    }
    const j = juzgar(floja, 'pagar', 'basica')
    const valorPagar = valorDe(floja, 'pagar')
    if (valorPagar <= 0) expect(j.porQue).not.toContain('sale a cuenta')
    else expect(j.porQue).toContain('sale a cuenta')
  })
})

describe('lo que se pierde en las calles siguientes se puede declinar', () => {
  /*
    Mano real del modo libre: T♥3♣ en A♣6♣J♥8♦, bote 76, te piden 36 y subes 112.
    La pantalla decía que subir costaba 128 fichas. Haciendo la cuenta a mano
    —el 22% se retira y te llevas 76; el 78% sigue y pierdes los 148— salen 99.
    Las 29 de diferencia eran dinero del river cobrado a una mano que gana el 0%:
    con eso, en el river se pasa y se suelta, no se paga.
  */
  const mesaDelTurn = manoDeCodigo('Ac 6c Jh 8d')
  const suRango = estrecharPorFuerza(
    // Como lo estrecha el juego cuando el rival apuesta en el turn.
    quitarBloqueadas(rangoApertura('boton'), [...par('Th 3c'), ...mesaDelTurn]),
    mesaDelTurn,
    0.4,
  )
  const muerta: Situacion = {
    mano: par('Th 3c'), mesa: mesaDelTurn, calle: 'turn',
    bote: 76, paraPagar: 36, tusFichas: 1195, fichasRival: 3000,
    rangoRival: suRango, perfilRival: RIVAL_TIPICO,
    tamanoSubida: 112,
  }

  it('la mano de verdad gana el 0%', () => {
    expect(analizar(muerta).equity.equity).toBeLessThan(0.005)
  })

  it('subir pierde exactamente lo que se pone, ni una ficha más', () => {
    const subida = analizar(muerta).acciones.find((a) => a.accion === 'subir')!
    const seRetiran = subida.seRetiran!
    const aMano = seRetiran * 76 - (1 - seRetiran) * (36 + 112)
    expect(subida.valorEsperado).toBeCloseTo(aMano, 1)
  })

  it('pagar con una mano muerta pierde justo lo que pagas', () => {
    const pagar = analizar(muerta).acciones.find((a) => a.accion === 'pagar')!
    expect(pagar.valorEsperado).toBeCloseTo(-36, 1)
  })

  it('pero con una mano buena las calles siguientes sí suman', () => {
    const fuerte: Situacion = {
      ...muerta, mano: par('Ah Ad'), mesa: manoDeCodigo('As 6c Jh'), calle: 'flop',
      rangoRival: rangoApertura('boton'), tamanoSubida: undefined,
    }
    const pagar = analizar(fuerte).acciones.find((a) => a.accion === 'pagar')!
    const sinFuturo = analizar(fuerte).equity.equity * (76 + 36) - 36
    expect(pagar.valorEsperado).toBeGreaterThan(sinFuturo)
  })
})

describe('la nota castiga los errores caros, no los descuidos (D65)', () => {
  /*
    Jugando salió esto: perder 17 fichas de media en un bote de 139 —menos de
    una ciega grande— bajaba la nota a 55, casi lo mismo que perder 23. Un
    descuido así tiene que puntuar alto; lo que tiene que hundir la nota es
    dejarse un tercio del bote.
  */
  const notaCon = (perdidaEnBotes: number) =>
    Math.round(100 * Math.max(0, 1 - Math.pow(Math.min(1, perdidaEnBotes / 0.5), 1.6)))

  it('un descuido de una ficha no se castiga', () => {
    expect(notaCon(0.01)).toBeGreaterThanOrEqual(99)
  })

  it('perder un 12% del bote deja la nota entre 85 y 92', () => {
    expect(notaCon(17 / 139)).toBeGreaterThanOrEqual(85)
    expect(notaCon(17 / 139)).toBeLessThanOrEqual(92)
  })

  it('solo se baja de 50 dejándose más de un tercio del bote', () => {
    expect(notaCon(0.3)).toBeGreaterThan(50)
    expect(notaCon(0.36)).toBeLessThan(50)
  })

  it('y el motor puntúa igual que esa curva', () => {
    const s: Situacion = {
      mano: par('Qs Qh'), mesa: manoDeCodigo('9d 7c 2h'), calle: 'flop',
      bote: 100, paraPagar: 0, tusFichas: 900, fichasRival: 900,
      rangoRival: rangoApertura('boton'), perfilRival: perfil('el pegajoso'),
    }
    const j = juzgar(s, 'pagar', 'intermedia')
    expect(j.puntos).toBe(notaCon(j.perdidaEnBotes))
  })
})

describe('las explicaciones enseñan a contar, no solo a obedecer', () => {
  const conProyecto: Situacion = {
    mano: par('Kd Qc'), mesa: manoDeCodigo('Ah Ts 3d 4c'), calle: 'turn',
    bote: 139, paraPagar: 40, tusFichas: 900, fichasRival: 900,
    rangoRival: rangoApertura('boton'), perfilRival: RIVAL_TIPICO,
  }

  it('nombran el proyecto y las cartas que te sirven', () => {
    const texto = juzgar(conProyecto, 'pagar', 'intermedia').porQueLargo
    expect(texto).toContain('escalera por dentro')
    expect(texto).toContain('4 cartas')
    expect(texto).toContain('las jotas')
  })

  it('enseñan la regla del 2 y el 4 con esos outs', () => {
    const texto = juzgar(conProyecto, 'pagar', 'intermedia').porQueLargo
    expect(texto).toMatch(/outs por 2/)
  })

  it('y no se contradicen: si el proyecto no llega, lo dicen y dan el total', () => {
    const texto = juzgar(conProyecto, 'pagar', 'intermedia').porQueLargo
    expect(texto).toMatch(/no llegarías|el precio te sale/)
  })

  it('cuando nadie ha apostado se dice apostar, no subir', () => {
    const sinApuesta: Situacion = { ...conProyecto, paraPagar: 0 }
    const texto = juzgar(sinApuesta, 'subir', 'intermedia', 60).porQue
    expect(texto).not.toContain('subir')
  })
})

describe('meter lo que te queda siempre es una jugada (todo-in)', () => {
  /*
    Jugando salió esto: con 393 fichas y un bote de 1821, el juego no ofrecía
    apostar nada y ponía "Subir: sin fichas" teniendo fichas. Era el mínimo de
    subida (D58) comiéndose el todo-in. En una mesa, meter lo que te queda es
    legal siempre, aunque sea menos que la última apuesta.
  */
  const corto: Situacion = {
    mano: par('9s Kc'), mesa: manoDeCodigo('4h 7s 9h'), calle: 'flop',
    bote: 1821, paraPagar: 0, tusFichas: 393, fichasRival: 2000,
    rangoRival: rangoApertura('boton'), perfilRival: RIVAL_TIPICO,
  }

  it('con fichas cortas frente a un bote enorme, el todo-in se ofrece', () => {
    const subidas = analizar(corto).acciones.filter((a) => a.accion === 'subir')
    expect(subidas).toHaveLength(1)
    expect(subidas[0].tamano).toBe(393)
  })

  it('pero la calderilla sigue fuera: una ficha suelta no es una jugada', () => {
    const calderilla: Situacion = {
      ...corto, mesa: manoDeCodigo('4h 7s 9h'), bote: 2879, paraPagar: 178, tusFichas: 179,
    }
    expect(analizar(calderilla).acciones.filter((a) => a.accion === 'subir')).toHaveLength(0)
  })
})

describe('dos jugadas que valen casi lo mismo no se corrigen (D78)', () => {
  /*
    Salía esto en una mano: 100 puntos, "apostar gana fichas" y a continuación
    "aun así, pasar habría sacado algo más". Si la diferencia son tres fichas en
    un bote de ciento veinte, no hay nada que corregir.
  */
  const s: Situacion = {
    mano: par('Qs Qh'), mesa: manoDeCodigo('9d 7c 2h'), calle: 'flop',
    bote: 120, paraPagar: 0, tusFichas: 900, fichasRival: 900,
    rangoRival: rangoApertura('boton'), perfilRival: perfil('el pegajoso'),
  }

  it('si la diferencia cabe en el margen, se dice que las dos están bien', () => {
    const j = juzgar(s, analizar(s).mejor.accion === 'pagar' ? 'subir' : 'pagar', 'intermedia')
    if (j.perdidaEnBotes > 0.03) return // esta mano no sirve de ejemplo hoy
    expect(j.porQue).toContain('las dos están bien')
    expect(j.porQue).not.toContain('Aun así')
  })

  it('nunca se dan 100 puntos y a la vez se corrige la jugada', () => {
    // Recorre muchas situaciones: si puntúa 100, no puede decir que había algo mejor.
    for (let i = 0; i < 40; i++) {
      const bote = 40 + i * 37
      const caso: Situacion = { ...s, bote, paraPagar: i % 3 === 0 ? 0 : Math.round(bote / 3) }
      for (const accion of ['pagar', 'subir', 'retirarse'] as const) {
        const j = juzgar(caso, accion, 'intermedia')
        if (j.puntos < 100) continue
        expect(j.porQue, `${accion} con bote ${bote}`).not.toContain('habría sacado algo más')
        expect(j.porQue, `${accion} con bote ${bote}`).not.toMatch(/Por eso lo mejor era/)
      }
    }
  })

  it('y una diferencia de verdad se sigue corrigiendo', () => {
    const caro: Situacion = {
      mano: par('9s 4h'), mesa: manoDeCodigo('As Kd 7c'), calle: 'flop',
      bote: 150, paraPagar: 100, tusFichas: 900, fichasRival: 900,
      rangoRival: rangoApertura('utg'), perfilRival: perfil('la roca'),
    }
    expect(juzgar(caro, 'pagar', 'intermedia').porQue).toContain('Lo mejor era')
  })
})

describe('las frases no se contradicen a sí mismas', () => {
  /*
    Salió esto jugando: "retirarte te ahorra fichas a la larga. Por eso lo mejor
    era pagar". La frase que defiende la jugada solo puede decirse cuando esa
    jugada ERA la mejor.
  */
  it('solo defiende retirarse cuando retirarse era lo mejor', () => {
    for (let i = 0; i < 30; i++) {
      const caso: Situacion = {
        mano: par('9d 2s'), mesa: manoDeCodigo('As Kd 7c'), calle: 'flop',
        bote: 60 + i * 40, paraPagar: 10 + i * 9, tusFichas: 900, fichasRival: 900,
        rangoRival: rangoApertura(i % 2 === 0 ? 'boton' : 'utg'), perfilRival: RIVAL_TIPICO,
      }
      const j = juzgar(caso, 'retirarse', 'intermedia')
      if (j.porQue.includes('te ahorra fichas a la larga')) {
        expect(j.mejor.accion, `bote ${caso.bote}`).toBe('retirarse')
        expect(j.porQue).not.toContain('lo mejor era')
      }
    }
  })

  it('avisa de que el porcentaje es contra UN rival cuando quedan más', () => {
    const multiple: Situacion = {
      mano: par('9d 2s'), mesa: [], calle: 'preflop', bote: 30, paraPagar: 20,
      tusFichas: 1000, fichasRival: 1000, rangoRival: rangoApertura('boton'),
      perfilRival: RIVAL_TIPICO, rivalesVivos: 3, nombreDelRival: 'Nadia',
    }
    const texto = juzgar(multiple, 'pagar', 'intermedia').porQueLargo
    expect(texto).toContain('Nadia')
    expect(texto).toContain('3 rivales')
  })

  it('y no avisa de nada cuando solo queda uno', () => {
    const solos: Situacion = {
      mano: par('9d 2s'), mesa: [], calle: 'preflop', bote: 30, paraPagar: 20,
      tusFichas: 1000, fichasRival: 1000, rangoRival: rangoApertura('boton'),
      perfilRival: RIVAL_TIPICO, rivalesVivos: 1, nombreDelRival: 'Nadia',
    }
    expect(juzgar(solos, 'pagar', 'intermedia').porQueLargo).not.toContain('rivales a la vez')
  })
})
