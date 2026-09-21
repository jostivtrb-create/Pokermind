import { describe, expect, it } from 'vitest'
import { crearAleatorio } from '../motor/aleatorio'
import { analizar } from '../motor/decision'
import { LECCIONES, MODULOS_PREVISTOS, TEMARIO } from './temario'
import { GLOSARIO_POR_CLAVE } from './glosario'
import { aSituacion, crearManoDePractica } from '../juego/practica'
import { pasosDeLaLeccion } from '../juego/lecciones'

/**
 * Tests del CONTENIDO, no del código.
 *
 * Una lección que enseña "aquí hay que retirarse" y reparte manos en las que el
 * motor dice "sube" está enseñando mal, y eso no se ve mirando la pantalla un
 * rato: hay que repartir muchas manos y comprobarlo. Esto es lo que evita que el
 * juego se contradiga a sí mismo cuando el temario crezca a cuarenta lecciones.
 */

describe('el temario está bien montado', () => {
  it('no hay dos lecciones con el mismo identificador', () => {
    const ids = LECCIONES.map((l) => l.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('cada lección pertenece a su módulo y va en orden', () => {
    for (const modulo of TEMARIO) {
      for (const leccion of modulo.lecciones) expect(leccion.modulo).toBe(modulo.numero)
    }
    const numeros = TEMARIO.map((m) => m.numero)
    expect(numeros).toEqual([...numeros].sort((a, b) => a - b))
  })

  it('los módulos que faltan están anunciados y no se pierde ninguno', () => {
    for (const modulo of TEMARIO) {
      expect(MODULOS_PREVISTOS.some((m) => m.numero === modulo.numero)).toBe(true)
    }
    expect(MODULOS_PREVISTOS).toHaveLength(9)
  })

  it('toda lección tiene una idea corta y explicación', () => {
    for (const l of LECCIONES) {
      expect(l.idea.length, `${l.id} sin idea`).toBeGreaterThan(20)
      expect(l.idea.length, `${l.id}: la idea es un párrafo, y tiene que ser una frase`).toBeLessThan(180)
      const pasos = pasosDeLaLeccion(l)
      expect(pasos.length, `${l.id} sin explicación`).toBeGreaterThan(0)
      expect(pasos.length, `${l.id}: demasiados pasos para una sola idea`).toBeLessThanOrEqual(8)
      for (const paso of pasos) {
        // Un paso es una pantalla: una frase, no un párrafo. Si no cabe en una
        // frase, es que son dos pasos.
        expect(paso.texto.length, `${l.id}: un paso con un párrafo entero`).toBeLessThan(240)
      }
    }
  })

  /**
   * La regla que salió de la segunda prueba del usuario: *"cualquier pantalla
   * que sea solo texto aburre; tiene que ser muy gráfico todo lo que va
   * explicando (...) si es un reguero de texto, hasta a mí me aburrió"*.
   *
   * Así que esto deja de ser una buena intención y pasa a ser un test.
   */
  it('ninguna lección explica a base de texto suelto', () => {
    const flojas: string[] = []
    for (const l of LECCIONES) {
      const pasos = pasosDeLaLeccion(l)
      const soloTexto = pasos.filter((p) => p.tipo === 'texto').length
      const visuales = pasos.length - soloTexto
      if (soloTexto > 1 || visuales < pasos.length / 2) {
        flojas.push(`${l.id} (${visuales} visuales de ${pasos.length})`)
      }
    }
    expect(flojas, `lecciones con demasiado texto suelto: ${flojas.join(' · ')}`).toHaveLength(0)
  })

  it('todos los términos citados existen en el glosario', () => {
    for (const l of LECCIONES) {
      for (const clave of l.terminos) {
        expect(GLOSARIO_POR_CLAVE.has(clave), `${l.id} cita "${clave}", que no está en el glosario`).toBe(true)
      }
    }
  })
})

describe('las preguntas de test son justas', () => {
  it('cada pregunta tiene una única respuesta correcta y todas explican el porqué', () => {
    for (const leccion of LECCIONES) {
      if (leccion.practica.tipo !== 'test') continue
      for (let i = 0; i < 25; i++) {
        const pregunta = leccion.practica.pregunta(crearAleatorio(i * 31 + 7), i + 1)
        const correctas = pregunta.opciones.filter((o) => o.correcta)
        expect(correctas, `${leccion.id}: pregunta sin una única respuesta correcta`).toHaveLength(1)
        expect(pregunta.opciones.length).toBeGreaterThanOrEqual(2)
        for (const opcion of pregunta.opciones) {
          expect(opcion.porQue.length, `${leccion.id}: una opción sin explicación`).toBeGreaterThan(10)
        }
      }
    }
  })
})

describe('las manos de cada lección enseñan lo que dice la lección', () => {
  for (const leccion of LECCIONES) {
    if (leccion.practica.tipo !== 'decision' || !leccion.accionEsperada) continue

    it(`${leccion.id} (${leccion.titulo}): el motor recomienda "${leccion.accionEsperada}"`, () => {
      const practica = leccion.practica as Extract<typeof leccion.practica, { tipo: 'decision' }>
      let coinciden = 0
      const intentos = 12
      const fallos: string[] = []

      for (let i = 0; i < intentos; i++) {
        const azar = crearAleatorio(i * 977 + 13)
        const mano = crearManoDePractica(azar, practica.mano(azar, i + 1))
        const mejor = analizar(aSituacion(mano)).mejor
        const acierta =
          leccion.accionEsperada === 'seguir'
            ? mejor.accion !== 'retirarse'
            : mejor.accion === leccion.accionEsperada
        if (acierta) coinciden++
        else fallos.push(`${mano.mano.join('/')} en ${mano.mesa.join('/')} → ${mejor.accion}`)
      }

      // No hace falta que salga siempre —el póker no es así—, pero si la lección
      // dice una cosa y el motor otra la mayoría de las veces, la lección miente.
      expect(coinciden / intentos, `falla en: ${fallos.slice(0, 3).join(' · ')}`).toBeGreaterThanOrEqual(0.75)
    })
  }
})
