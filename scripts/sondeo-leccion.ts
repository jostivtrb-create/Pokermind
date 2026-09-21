import { crearAleatorio } from '../src/motor/aleatorio'
import { textoCartas } from '../src/motor/evaluador'
import { analizar } from '../src/motor/decision'
import { buscarLeccion } from '../src/contenido/temario'
import { aSituacion, crearManoDePractica } from '../src/juego/practica'
import { fraccionQueLiga, fraccionQueLigaFuerte, parsearRango } from '../src/motor/rangos'

const id = process.argv[2] ?? 'm2-l4'
const leccion = buscarLeccion(id)!
const practica = leccion.practica as Extract<typeof leccion.practica, { tipo: 'decision' }>

for (let i = 0; i < 4; i++) {
  const azar = crearAleatorio(i * 977 + 13)
  const mano = crearManoDePractica(azar, practica.mano(azar, i + 1))
  const a = analizar(aSituacion(mano))
  const rango = parsearRango(mano.rangoRival)
  console.log(`\n${textoCartas(mano.mano)}  en  ${textoCartas(mano.mesa)}   (bote ${mano.bote}, pagar ${mano.paraPagar})`)
  console.log(`  equity ${(a.equity.equity * 100).toFixed(1)}% · liga el ${(fraccionQueLiga(rango, mano.mesa) * 100).toFixed(0)}% · fuerte el ${(fraccionQueLigaFuerte(rango, mano.mesa) * 100).toFixed(0)}%`)
  for (const acc of a.acciones) {
    console.log(`  ${(acc.accion + (acc.tamano ? ' ' + acc.tamano : '')).padEnd(12)} EV ${acc.valorEsperado.toFixed(1).padStart(7)}${acc.seRetiran !== undefined ? `  se retiran ${(acc.seRetiran * 100).toFixed(0)}%` : ''}`)
  }
  console.log(`  → ${a.mejor.accion}`)
}
