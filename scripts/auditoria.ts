/** Reproduce exactamente la mano del reto para comprobar los números uno a uno. */
import { manoDeCodigo } from '../src/motor/cartas'
import type { Carta } from '../src/motor/cartas'
import { analizar } from '../src/motor/decision'
import { RIVAL_TIPICO, fraccionQueContinua } from '../src/motor/perfiles'
import { fraccionQueLiga, fraccionQueLigaFuerte, parsearRango, quitarBloqueadas } from '../src/motor/rangos'
import { equityContraRango } from '../src/motor/equity'

const mano = manoDeCodigo('Kc 3c') as [Carta, Carta]
const mesa = manoDeCodigo('5d 8c 7s 9c')
const bote = 260
const paraPagar = 180
const rango = quitarBloqueadas(parsearRango('77+, ATs+, KJs+, QJs, AQo+'), [...mano, ...mesa])

const eq = equityContraRango(mano, mesa, rango.combos)
console.log(`equity ${(eq.equity * 100).toFixed(2)}%  (victoria ${(eq.victoria*100).toFixed(1)} · empate ${(eq.empate*100).toFixed(1)}) exacto=${eq.exacto}`)
console.log(`combos del rango: ${rango.combos.length}`)
console.log(`liga algo: ${(fraccionQueLiga(rango, mesa) * 100).toFixed(1)}%  ·  liga fuerte: ${(fraccionQueLigaFuerte(rango, mesa) * 100).toFixed(1)}%`)

console.log('\n— ¿cambia el porcentaje de retiradas con el tamaño? —')
for (const t of [220, 330, 440, 700, 1200]) {
  const precio = t / (bote + paraPagar + 2 * t)
  const sigue = fraccionQueContinua(
    RIVAL_TIPICO, precio, fraccionQueLiga(rango, mesa), fraccionQueLigaFuerte(rango, mesa),
  )
  console.log(`  subir ${String(t).padStart(4)}  precio para él ${(precio*100).toFixed(0).padStart(2)}%  → sigue ${(sigue*100).toFixed(1)}%  se retira ${((1-sigue)*100).toFixed(1)}%`)
}

console.log('\n— comprobación del EV de pagar —')
const a = analizar({ mano, mesa, calle: 'turn', bote, paraPagar, tusFichas: 800, fichasRival: 800, rangoRival: parsearRango('77+, ATs+, KJs+, QJs, AQo+') })
const pagar = a.acciones.find((x) => x.accion === 'pagar')!
console.log(`  cuenta directa: ${eq.equity.toFixed(4)} × ${bote + paraPagar} − ${paraPagar} = ${(eq.equity * (bote + paraPagar) - paraPagar).toFixed(1)}`)
console.log(`  lo que enseña la app: ${pagar.valorEsperado.toFixed(1)}`)
console.log(`  diferencia (el término de calles siguientes): ${(pagar.valorEsperado - (eq.equity * (bote + paraPagar) - paraPagar)).toFixed(1)}`)
