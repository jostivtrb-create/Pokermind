import type { Aleatorio } from './aleatorio'
import type { Carta } from './cartas'
import { analizar } from './decision'
import type { Analisis, Situacion, ValorDeAccion } from './decision'
import { rangoEstimado, rivalPrincipal } from './lectura'
import type { AccionMesa, EstadoMesa } from './mesa'
import { boteTotal, jugadoresEnJuego, opcionesDisponibles, paraPagar } from './mesa'
import { RIVAL_TIPICO } from './perfiles'
import type { PerfilRival } from './perfiles'
import { rangoTotal } from './rangos'

/**
 * Los bots del modo libre.
 *
 * Idea del usuario (ronda 1, S3): no se programan tres bots a mano, se usa el
 * MISMO motor que juzga al jugador y a cada bot se le dan unas barras
 * (agresividad, disciplina, farol, tenacidad) que se sortean al empezar. Así
 * ninguno se siente limitado y cada partida trae rivales distintos.
 *
 * Un bot con disciplina 1 jugaría siempre la jugada de mayor valor esperado —o
 * sea, perfecto y aburrido—. Lo que le da carácter es en qué se desvía:
 *  · poca disciplina → se equivoca, sobre todo pagando de más;
 *  · mucho farol     → apuesta sin nada cuando huele debilidad;
 *  · mucha agresividad → cuando dos jugadas valen parecido, elige la de apostar.
 */

export interface DecisionBot {
  accion: AccionMesa
  /** Para subir: fichas por encima de la apuesta actual. */
  cantidad: number
  /** Por qué lo hizo, para poder enseñarlo al repasar la mano. */
  motivo: string
}

export function decidirBot(estado: EstadoMesa, azar: Aleatorio): DecisionBot {
  const jugador = estado.jugadores[estado.turno]
  const opciones = opcionesDisponibles(estado)
  if (opciones.length === 0 || !jugador.cartas) return { accion: 'retirarse', cantidad: 0, motivo: 'no puede jugar' }

  const perfil = jugador.perfil ?? RIVAL_TIPICO
  const rival = rivalPrincipal(estado, jugador)
  const vistas: Carta[] = [...jugador.cartas, ...estado.comunitarias]
  const rangoRival = rival ? rangoEstimado(estado, rival, vistas) : rangoTotal()

  const situacion: Situacion = {
    mano: jugador.cartas,
    mesa: estado.comunitarias,
    calle: estado.calle,
    bote: boteTotal(estado),
    paraPagar: paraPagar(estado, jugador),
    tusFichas: jugador.fichas,
    fichasRival: rival?.fichas ?? jugador.fichas,
    rangoRival,
    perfilRival: rival?.perfil ?? RIVAL_TIPICO,
    precision: 'rapida',
  }

  const analisis = analizar(situacion)
  const rivalesVivos = jugadoresEnJuego(estado).length - 1
  const elegida = elegirConCaracter(analisis, perfil, azar, rivalesVivos, situacion.bote)

  return traducirAMesa(estado, elegida, perfil, azar)
}

/**
 * De los valores esperados a una jugada con personalidad.
 *
 * Con varios rivales vivos hay que apretar: ganarle a uno es fácil, ganarle a
 * tres a la vez no. Se penaliza seguir en la mano en proporción a cuánta gente queda.
 */
function elegirConCaracter(
  analisis: Analisis,
  perfil: PerfilRival,
  azar: Aleatorio,
  rivalesVivos: number,
  bote: number,
): ValorDeAccion {
  const castigoPorGente = rivalesVivos > 1 ? 0.75 ** (rivalesVivos - 1) : 1

  /*
    Para subir sin mano hay que atreverse: el margen que exige cada uno por
    encima de retirarse sale de lo farolero que sea. La roca casi nunca se lanza;
    el loco, con que le salgan las cuentas por poco, ya va.

    El margen se mide sobre EL BOTE. Antes se estimaba a partir del valor de
    pagar, y cuando pagar salía casi a cero —que es lo normal antes del flop— el
    margen se quedaba en dos fichas: con eso, un resubidón con 7-2 que ganaba
    3 fichas de media pasaba el filtro. El bot resubía con CUALQUIER mano desde
    la ciega grande, que es justo lo que cazó un jugador de póker probándolo.
  */
  const margenParaFarolear = (1 - perfil.farol) * 0.25 * Math.max(1, bote)

  const puntuadas = analisis.acciones.map((accion) => {
    let valor = accion.accion === 'retirarse' ? 0 : accion.valorEsperado * castigoPorGente

    // El agresivo prefiere apostar cuando la cosa está igualada; el pasivo, no.
    if (accion.accion === 'subir') valor *= 0.8 + perfil.agresividad * 0.45
    // El pegajoso paga de más.
    if (accion.accion === 'pagar' && valor < 0) valor += Math.abs(valor) * perfil.tenacidad * 0.5

    // Subir con una mano que casi nunca gana es farolear. Solo cuenta como jugada
    // si le saca al farol bastante más que retirarse; si no, ni se lo plantea.
    const esFarol = accion.accion === 'subir' && (accion.equitySiSigue ?? 1) < 0.35
    if (esFarol && valor < margenParaFarolear) valor = -1

    return { accion, valor }
  })

  /*
    Antes de ordenar, se filtran las subidas por CARÁCTER. Es lo que separa a un
    jugador de una calculadora, y es donde estaba el problema que cazó un
    jugador de póker probando el juego ("pagan Q6 en bb"):

     · Si subir gana bastante más que no subir, es una jugada y se queda.
     · Si la diferencia cabe en el ruido, es una decisión de carácter: el farol
       se lanza a su frecuencia, no siempre. Antes se cogía siempre el máximo, y
       con eso el bot resubía con 165 de las 169 manos ante una subida pequeña.
     · Si subir pierde claramente, no es un farol: es tirar fichas. Fuera, por
       muy loco que sea el bot.

    El margen se mide contra el bote Y contra lo que arriesga la subida:
    resubir 105 fichas para ganar tres de media no lo hace nadie.
  */
  const mejorSinSubir = puntuadas
    .filter((p) => p.accion.accion !== 'subir')
    .reduce((a, b) => (b.valor > a.valor ? b : a), { valor: 0 } as { valor: number })

  for (const p of puntuadas) {
    if (p.accion.accion !== 'subir') continue
    const ruido = Math.max(0.03 * Math.max(1, bote), 0.12 * (p.accion.pones ?? 0))
    const ventaja = p.valor - mejorSinSubir.valor
    if (ventaja >= ruido) continue
    if (ventaja < -ruido) {
      p.valor = -Infinity
      continue
    }
    const conMano = (p.accion.equitySiSigue ?? 1) >= 0.5
    const seAtreve = conMano ? 0.35 + perfil.agresividad * 0.5 : perfil.farol
    if (azar.siguiente() > seAtreve) p.valor = -Infinity
  }

  const ordenadas = [...puntuadas].sort((a, b) => b.valor - a.valor)
  const mejor = ordenadas[0]


  // La disciplina decide cuánto se separa de la mejor jugada. Sin este ruido los
  // cuatro bots jugarían idénticos y no habría nada que leer en el modo libre.
  const seEquivoca = azar.siguiente() > 0.45 + perfil.disciplina * 0.55
  if (!seEquivoca) return mejor.accion

  // Pero un error tiene que ser creíble. Un jugador disciplinado se pasa de
  // prudente o paga una de más; no paga una subida enorme con la peor mano de la
  // baraja. Por eso el error es "la segunda mejor jugada", y solo el que no tiene
  // ni idea se permite las de verdad malas.
  const desastroso = (valor: number) => valor < -0.6 * Math.max(1, analisis.acciones[1]?.valorEsperado ?? 1)
  const alternativas = ordenadas
    .slice(1)
    .filter((p) => perfil.disciplina < 0.3 || !desastroso(p.valor))
  if (alternativas.length === 0) return mejor.accion
  // Casi siempre la segunda mejor; de vez en cuando, cualquier otra.
  const indice = azar.siguiente() < 0.75 ? 0 : azar.entero(alternativas.length)
  return alternativas[indice].accion
}

/** Pasa la acción del motor a una acción de la mesa, con su tamaño. */
function traducirAMesa(
  estado: EstadoMesa,
  elegida: ValorDeAccion,
  perfil: PerfilRival,
  azar: Aleatorio,
): DecisionBot {
  const jugador = estado.jugadores[estado.turno]
  const opciones = opcionesDisponibles(estado)
  const falta = paraPagar(estado, jugador)
  const puede = (accion: AccionMesa) => opciones.some((o) => o.accion === accion)

  if (elegida.accion === 'retirarse') {
    // Retirarse cuando no cuesta nada es tirar una mano gratis: eso no lo hace nadie.
    if (falta === 0) return { accion: 'pasar', cantidad: 0, motivo: 'no le cuesta nada ver otra carta' }
    return { accion: 'retirarse', cantidad: 0, motivo: 'las cuentas no le salen' }
  }

  if (elegida.accion === 'subir' && puede('subir')) {
    const opcion = opciones.find((o) => o.accion === 'subir')!
    const bote = boteTotal(estado)
    // El tamaño sale de su agresividad, con una pizca de azar para no ser previsible.
    const proporcion = 0.45 + perfil.agresividad * 0.55 + azar.entre(-0.1, 0.1)
    const deseado = Math.round((bote + falta) * proporcion)
    const cantidad = Math.max(opcion.minimo!, Math.min(deseado, opcion.maximo!))
    return { accion: 'subir', cantidad, motivo: 'cree que apostar le sale a cuenta' }
  }

  if (falta === 0) return { accion: 'pasar', cantidad: 0, motivo: 'pasa a ver qué hace el rival' }
  if (puede('pagar')) return { accion: 'pagar', cantidad: 0, motivo: 'le compensa pagar' }
  return { accion: 'retirarse', cantidad: 0, motivo: 'no puede hacer otra cosa' }
}
