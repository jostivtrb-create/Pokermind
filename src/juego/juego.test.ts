import { describe, expect, it } from 'vitest'
import { crearAleatorio } from '../motor/aleatorio'
import { MODULO_1 } from '../contenido/modulo1'
import { LECCIONES } from '../contenido/temario'
import { GLOSARIO, GLOSARIO_POR_CLAVE, buscarTermino } from '../contenido/glosario'
import { fusionar } from '../almacen/sincronizacion'
import { leccionDominada } from './lecciones'
import { crearManoDePractica, tenerProyectoDeColor, tenerParejaServida, usaTusCartas } from './practica'
import { anotarDecision, erroresParaRepasar, progresoNuevo, repasarError, variarMano } from './progreso'
import { empezarLeccion, empezarPractica, responder, responderTest, siguienteMano } from './sesion'
import { manoDeCodigo } from '../motor/cartas'

const azar = () => crearAleatorio(2026)

describe('las manos de práctica salen como pide la lección', () => {
  it('cuando pide proyecto de color, sale proyecto de color', () => {
    for (let i = 0; i < 20; i++) {
      const mano = crearManoDePractica(crearAleatorio(i), {
        calle: 'flop', condicion: tenerProyectoDeColor, bote: 100, paraPagar: 50, contexto: 'x',
      })
      expect(tenerProyectoDeColor.cumple(mano.mano, mano.mesa)).toBe(true)
    }
  })

  it('cuando pide pareja servida, sale pareja servida', () => {
    for (let i = 0; i < 20; i++) {
      const mano = crearManoDePractica(crearAleatorio(i), {
        calle: 'preflop', condicion: tenerParejaServida, bote: 30, paraPagar: 20, contexto: 'x',
      })
      expect(mano.mano[0] >> 2).toBe(mano.mano[1] >> 2)
    }
  })

  it('distingue tu mano de la que está en la mesa', () => {
    // Pareja de nueves en la mesa: no es tuya, la tiene todo el mundo. Que tu
    // 10 entre como acompañante no cuenta: sigues jugando la mesa.
    expect(usaTusCartas(manoDeCodigo('Ts 6h'), manoDeCodigo('9h 3d 9s 2c 4d'))).toBe(false)
    // Emparejar con la mesa, pareja servida, color y escalera sí cuentan.
    expect(usaTusCartas(manoDeCodigo('9c 6h'), manoDeCodigo('9h 3d 2s 7c 4d'))).toBe(true)
    expect(usaTusCartas(manoDeCodigo('Ks Kd'), manoDeCodigo('9h 3d 2s 7c 4d'))).toBe(true)
    expect(usaTusCartas(manoDeCodigo('Ah 2h'), manoDeCodigo('9h 3h 7h Kc 4d'))).toBe(true)
    expect(usaTusCartas(manoDeCodigo('6c 5d'), manoDeCodigo('9h 8d 7s Kc 2d'))).toBe(true)
  })
})

describe('una lección de principio a fin', () => {
  it('se explica, se practica y se domina acertando', () => {
    const leccion = MODULO_1.lecciones[2] // los tres botones (test)
    let sesion = empezarLeccion(leccion, azar())
    expect(sesion.fase).toBe('explicacion')

    sesion = empezarPractica(sesion)
    expect(sesion.fase).toBe('jugando')
    expect(sesion.pregunta).not.toBeNull()

    let vueltas = 0
    while (sesion.fase !== 'terminada' && vueltas++ < 30) {
      const correcta = sesion.pregunta!.opciones.findIndex((o) => o.correcta)
      sesion = responderTest(sesion, correcta)
      expect(sesion.ultimoResultado!.veredicto).toBe('optima')
      sesion = siguienteMano(sesion, azar())
    }
    expect(sesion.fase).toBe('terminada')
    // Acertando siempre se sale en el mínimo de manos (D37).
    expect(sesion.manosJugadas).toBe(leccion.minimoManos)
  })

  it('fallando se alarga, pero no eternamente', () => {
    const leccion = MODULO_1.lecciones[2]
    let sesion = empezarPractica(empezarLeccion(leccion, azar()))
    let vueltas = 0
    while (sesion.fase !== 'terminada' && vueltas++ < 50) {
      const mala = sesion.pregunta!.opciones.findIndex((o) => !o.correcta)
      sesion = responderTest(sesion, mala)
      sesion = siguienteMano(sesion, azar())
    }
    expect(sesion.fase).toBe('terminada')
    expect(sesion.manosJugadas).toBe(leccion.maximoManos)
    expect(sesion.puntos).toBe(0)
  })

  it('una mano de decisión se corrige al instante', () => {
    const leccion = MODULO_1.lecciones[5] // la de decisión
    let sesion = empezarPractica(empezarLeccion(leccion, azar()))
    if (sesion.fase === 'ejemplo') {
      expect(sesion.jugadaDelEjemplo).not.toBeNull()
      sesion = { ...sesion, fase: 'jugando' }
    }
    sesion = responder(sesion, 'retirarse')
    expect(sesion.fase).toBe('resultado')
    expect(sesion.ultimoJuicio).not.toBeNull()
    // Con una mano perdida y una apuesta grande, retirarse es lo correcto.
    expect(sesion.ultimoJuicio!.veredicto).not.toBe('mala')
  })
})

describe('dominio de una lección', () => {
  it('hace falta el mínimo de manos Y los aciertos seguidos', () => {
    const leccion = LECCIONES[0]
    expect(leccionDominada(leccion, leccion.minimoManos - 1, 99)).toBe(false)
    expect(leccionDominada(leccion, leccion.minimoManos, leccion.dominio - 1)).toBe(false)
    expect(leccionDominada(leccion, leccion.minimoManos, leccion.dominio)).toBe(true)
  })
})

describe('repaso espaciado de errores (D15)', () => {
  const manoFallada = crearManoDePractica(azar(), {
    calle: 'flop', bote: 100, paraPagar: 60, contexto: 'x',
  })

  it('lo que se falla se guarda, lo que se acierta no', () => {
    let progreso = progresoNuevo()
    progreso = anotarDecision(progreso, {
      leccionId: 'x', fecha: new Date().toISOString(), accion: 'pagar',
      veredicto: 'mala', puntos: 0, calle: 'flop', categoria: 'carta alta', perdidaEnBotes: 0.9,
    }, manoFallada)
    expect(progreso.errores).toHaveLength(1)

    progreso = anotarDecision(progreso, {
      leccionId: 'x', fecha: new Date().toISOString(), accion: 'retirarse',
      veredicto: 'optima', puntos: 100, calle: 'flop', categoria: 'carta alta', perdidaEnBotes: 0,
    }, manoFallada)
    expect(progreso.errores).toHaveLength(1)
    expect(progreso.aciertos).toBe(1)
    expect(progreso.decisiones).toBe(2)
  })

  it('no vuelve hoy: vuelve dentro de unos días', () => {
    let progreso = progresoNuevo()
    progreso = anotarDecision(progreso, {
      leccionId: 'x', fecha: new Date().toISOString(), accion: 'pagar',
      veredicto: 'mala', puntos: 0, calle: 'flop', categoria: 'carta alta', perdidaEnBotes: 0.9,
    }, manoFallada)
    expect(erroresParaRepasar(progreso)).toHaveLength(0)
    const dentroDeUnaSemana = new Date(Date.now() + 7 * 86400000)
    expect(erroresParaRepasar(progreso, dentroDeUnaSemana)).toHaveLength(1)
  })

  it('acertarla dos veces la quita de la lista', () => {
    let progreso = progresoNuevo()
    progreso = anotarDecision(progreso, {
      leccionId: 'x', fecha: new Date().toISOString(), accion: 'pagar',
      veredicto: 'mala', puntos: 0, calle: 'flop', categoria: 'carta alta', perdidaEnBotes: 0.9,
    }, manoFallada)
    progreso = repasarError(progreso, 0, true)
    expect(progreso.errores).toHaveLength(1)
    expect(progreso.errores[0].repasos).toBe(1)
    progreso = repasarError(progreso, 0, true)
    expect(progreso.errores).toHaveLength(0)
  })

  it('vuelve cambiada de palo para que no se memorice', () => {
    const variada = variarMano(manoFallada, crearAleatorio(3))
    const valores = (m: typeof manoFallada) => [...m.mano, ...m.mesa].map((c) => c >> 2)
    expect(valores(variada)).toEqual(valores(manoFallada))
    const palos = (m: typeof manoFallada) => [...m.mano, ...m.mesa].map((c) => c & 3)
    expect(palos(variada)).not.toEqual(palos(manoFallada))
  })
})

describe('sincronizar entre aparatos', () => {
  it('gana lo más avanzado, no lo más reciente', () => {
    const movil = { ...progresoNuevo(), decisiones: 40, aciertos: 30, puntosTotales: 900,
      lecciones: { 'm1-l1': { terminadaEl: 'x', puntos: 300, manos: 4 } } }
    const portatil = { ...progresoNuevo(), decisiones: 10, aciertos: 8, puntosTotales: 200,
      lecciones: { 'm1-l2': { terminadaEl: 'y', puntos: 100, manos: 4 } } }
    const junto = fusionar(portatil, movil)
    expect(junto.decisiones).toBe(40)
    expect(junto.puntosTotales).toBe(900)
    // No se pierde ninguna lección terminada en ninguno de los dos aparatos.
    expect(Object.keys(junto.lecciones).sort()).toEqual(['m1-l1', 'm1-l2'])
  })
})

describe('el glosario', () => {
  it('todos los términos que citan las lecciones existen', () => {
    for (const leccion of LECCIONES) {
      for (const clave of leccion.terminos) {
        expect(GLOSARIO_POR_CLAVE.has(clave), `falta "${clave}" en el glosario`).toBe(true)
      }
    }
  })

  it('se busca también por como se dice en la mesa', () => {
    expect(buscarTermino('foldear').map((t) => t.clave)).toContain('retirarse')
    expect(buscarTermino('pot odds').map((t) => t.clave)).toContain('precioDelBote')
    expect(GLOSARIO.length).toBeGreaterThan(20)
  })
})
