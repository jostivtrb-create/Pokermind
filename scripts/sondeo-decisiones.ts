/** Sondeo rápido para ver qué dice el motor en situaciones conocidas. */
import { manoDeCodigo } from '../src/motor/cartas'
import type { Carta } from '../src/motor/cartas'
import { analizar } from '../src/motor/decision'
import type { Situacion } from '../src/motor/decision'
import { PERFILES_CON_NOMBRE, RIVAL_TIPICO } from '../src/motor/perfiles'
import { parsearRango, rangoApertura, fraccionQueLiga } from '../src/motor/rangos'

const par = (t: string) => manoDeCodigo(t) as [Carta, Carta]
const mostrar = (titulo: string, s: Situacion) => {
  const a = analizar(s)
  console.log(`\n── ${titulo}`)
  console.log(`   equity ${(a.equity.equity * 100).toFixed(1)}% · liga la mesa el ${(fraccionQueLiga(s.rangoRival, s.mesa) * 100).toFixed(0)}% de su rango`)
  for (const acc of a.acciones) {
    const et = acc.accion === 'subir' ? `subir ${acc.tamano}` : acc.accion
    console.log(`   ${et.padEnd(12)} EV ${acc.valorEsperado.toFixed(1).padStart(7)}${acc.seRetiran !== undefined ? `   se retiran ${(acc.seRetiran * 100).toFixed(0)}%` : ''}`)
  }
  console.log(`   → mejor: ${a.mejor.accion}${a.mejor.tamano ? ' ' + a.mejor.tamano : ''}`)
}

const loco = PERFILES_CON_NOMBRE.find((p) => p.nombre === 'el loco')!
const roca = PERFILES_CON_NOMBRE.find((p) => p.nombre === 'la roca')!
const pegajoso = PERFILES_CON_NOMBRE.find((p) => p.nombre === 'el pegajoso')!

mostrar('Trío en una mesa que su rango no toca, rival farolero (debería ser esconderla)', {
  mano: par('7s 7h'), mesa: manoDeCodigo('7d 4c 2h'), calle: 'flop',
  bote: 100, paraPagar: 0, tusFichas: 900, fichasRival: 900,
  rangoRival: parsearRango('AKo, AQo, AJo'),
  perfilRival: { nombre: 'farolero', agresividad: 0.9, disciplina: 0.9, farol: 0.6, tenacidad: 0.5 },
})

mostrar('El mismo trío contra un pegajoso que paga todo (debería ser apostar)', {
  mano: par('7s 7h'), mesa: manoDeCodigo('7d 4c 2h'), calle: 'flop',
  bote: 100, paraPagar: 0, tusFichas: 900, fichasRival: 900,
  rangoRival: rangoApertura('boton'), perfilRival: pegajoso,
})

mostrar('Basura ante una apuesta grande (debería ser retirarse)', {
  mano: par('9s 4h'), mesa: manoDeCodigo('As Kd 7c'), calle: 'flop',
  bote: 150, paraPagar: 100, tusFichas: 900, fichasRival: 900,
  rangoRival: rangoApertura('utg'), perfilRival: roca,
})

mostrar('Proyecto de color con buen precio (debería ser pagar)', {
  mano: par('Jh Th'), mesa: manoDeCodigo('Ah 7h 2c'), calle: 'flop',
  bote: 200, paraPagar: 40, tusFichas: 900, fichasRival: 900,
  rangoRival: rangoApertura('utg'), perfilRival: RIVAL_TIPICO,
})

mostrar('Proyecto de color con mal precio en el river (debería ser retirarse)', {
  mano: par('Jh Th'), mesa: manoDeCodigo('Ah 7h 2c 3d 8s'), calle: 'river',
  bote: 100, paraPagar: 150, tusFichas: 900, fichasRival: 900,
  rangoRival: rangoApertura('utg'), perfilRival: roca,
})

mostrar('Ases antes del flop ante una subida (debería ser resubir)', {
  mano: par('As Ah'), mesa: [], calle: 'preflop',
  bote: 35, paraPagar: 20, tusFichas: 500, fichasRival: 500,
  rangoRival: rangoApertura('boton'), perfilRival: loco,
})
