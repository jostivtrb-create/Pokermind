/**
 * Genera la tabla de fuerza de las 169 manos iniciales midiendo, con el propio
 * motor del juego, cuánto gana cada una contra una mano cualquiera.
 *
 * Se genera en vez de copiarse de una lista de internet para que la tabla y el
 * juego digan siempre lo mismo. Se ejecuta a mano cuando haga falta:
 *   npx tsx scripts/generar-fuerza-preflop.ts
 */
import { writeFileSync } from 'node:fs'
import { crearAleatorio } from '../src/motor/aleatorio'
import { crearCarta } from '../src/motor/cartas'
import { equityContraAleatorias } from '../src/motor/equity'
import { CLASES_PREFLOP, comboEjemploDeClase } from '../src/motor/clases'

const REPETICIONES = 30000
const filas: Array<{ clase: string; equity: number }> = []

for (const clase of CLASES_PREFLOP) {
  const [a, b] = comboEjemploDeClase(clase)
  const r = equityContraAleatorias([a, b], [], 1, {
    repeticiones: REPETICIONES,
    azar: crearAleatorio(20260921),
  })
  filas.push({ clase, equity: r.equity })
  process.stdout.write(`${clase} ${(r.equity * 100).toFixed(1)}%  `)
}

filas.sort((x, y) => y.equity - x.equity)

const contenido = `/**
 * Fuerza de las 169 manos iniciales, de la mejor a la peor, medida como
 * "porcentaje del bote que te llevas contra una mano cualquiera" con ${REPETICIONES.toLocaleString('es')}
 * repeticiones del motor del juego.
 *
 * GENERADO por scripts/generar-fuerza-preflop.ts — no se edita a mano.
 */
export const FUERZA_PREFLOP: ReadonlyArray<readonly [clase: string, equity: number]> = [
${filas.map((f) => `  ['${f.clase}', ${f.equity.toFixed(4)}],`).join('\n')}
]

/** Posición de cada mano en la lista (0 = la mejor). */
export const ORDEN_PREFLOP: ReadonlyMap<string, number> = new Map(
  FUERZA_PREFLOP.map(([clase], i) => [clase, i]),
)
`
writeFileSync(new URL('../src/motor/datos/fuerzaPreflop.ts', import.meta.url), contenido)
console.log(`\n\nEscritas ${filas.length} manos. La mejor: ${filas[0].clase}. La peor: ${filas[filas.length - 1].clase}.`)
