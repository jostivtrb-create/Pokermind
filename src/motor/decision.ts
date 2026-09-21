import type { Carta } from './cartas'
import type { Probabilidades } from './equity'
import { equityContraRango } from './equity'
import type { PerfilRival } from './perfiles'
import { RIVAL_TIPICO, fraccionQueContinua, multiplicadorDeFarol } from './perfiles'
import type { Rango } from './rangos'
import { estrecharPorFuerza, fraccionQueLiga, fraccionQueLigaFuerte, quitarBloqueadas } from './rangos'

/**
 * EL CORAZÓN DEL JUEGO (decisión D20).
 *
 * Aquí se responde la única pregunta que importa: de retirarse, pagar o subir,
 * ¿cuál era la mejor jugada, y cuánto se perdió eligiendo otra?
 *
 * No se mide por si la mano se ganó —eso es suerte—, sino por **valor esperado**:
 * cuántas fichas gana o pierde cada acción de media, a la larga, contra las manos
 * que el rival puede tener.
 *
 * Por qué así y no con "probabilidad contra precio", que es lo fácil:
 * el usuario lo dijo en la ronda 1 — *"no es lo mismo ganar poquito sabiendo que
 * tenías una mano fuerte y podías ocultarla hasta el final para irlos
 * exprimiendo"*. Un cálculo de probabilidad contra precio siempre diría "sube"
 * con una mano monstruosa. Este mira también lo que el rival dejará de pagar si
 * le espantas, y por eso puede decir "aquí lo mejor era pagar y esconderla".
 */

export const ACCIONES = ['retirarse', 'pagar', 'subir'] as const
export type Accion = (typeof ACCIONES)[number]

export const NOMBRES_ACCION: Record<Accion, string> = {
  retirarse: 'retirarse',
  pagar: 'pagar',
  subir: 'subir',
}

export type Calle = 'preflop' | 'flop' | 'turn' | 'river'

export const NOMBRES_CALLE: Record<Calle, string> = {
  preflop: 'antes del flop',
  flop: 'el flop',
  turn: 'el turn',
  river: 'el river',
}

/** Cuánto aprieta el juego al corregir. Sube con el nivel del jugador (D20). */
export type Exigencia = 'basica' | 'intermedia' | 'seria'

/** Cuánta pérdida (en botes) se perdona antes de llamarlo error, según el nivel. */
const TOLERANCIA: Record<Exigencia, number> = {
  basica: 0.35,
  intermedia: 0.15,
  seria: 0.06,
}

export interface Situacion {
  mano: readonly [Carta, Carta]
  mesa: readonly Carta[]
  calle: Calle
  /** Fichas que ya hay en el bote, incluida la apuesta del rival. */
  bote: number
  /** Lo que tienes que poner para seguir. 0 si nadie ha apostado. */
  paraPagar: number
  /** Tus fichas detrás. */
  tusFichas: number
  fichasRival: number
  /** Lo que el rival puede tener en este momento. */
  rangoRival: Rango
  perfilRival?: PerfilRival
  /** Tamaño de subida que se está juzgando. Si no se dice, se prueban varios. */
  tamanoSubida?: number
  /**
   * "rapida" simula menos manos. Los bots la usan: para decidir les sobra con
   * un punto porcentual de margen, y así una mesa de cuatro no tarda medio
   * segundo por jugada. Al corregir al jugador se usa siempre la normal.
   */
  precision?: 'rapida' | 'normal'
}

export interface ValorDeAccion {
  accion: Accion
  /** Fichas que gana o pierde de media, contando desde ahora. */
  valorEsperado: number
  /** Tamaño de la subida, cuando la acción es subir. */
  tamano?: number
  /** Parte del rango del rival que se retira ante esa subida. */
  seRetiran?: number
  /** Probabilidad de ganar contra las manos que seguirían en la mano. */
  equitySiSigue?: number
  /** Explicación de dónde sale el número. */
  desglose: string
}

export interface Analisis {
  equity: Probabilidades
  /** Lo que te cuesta pagar respecto al bote: el "precio" del módulo 3. */
  precioDelBote: number
  /** Probabilidad mínima de ganar que necesitas para que pagar salga a cuenta. */
  equityNecesaria: number
  acciones: ValorDeAccion[]
  mejor: ValorDeAccion
  calle: Calle
}

/** Analiza la situación y devuelve el valor de cada acción. */
export function analizar(situacion: Situacion): Analisis {
  const { mano, mesa, bote, paraPagar, rangoRival } = situacion
  const perfil = situacion.perfilRival ?? RIVAL_TIPICO
  const rango = quitarBloqueadas(rangoRival, [...mano, ...mesa])

  const rapida = situacion.precision === 'rapida'
  const equity = equityContraRango(mano, mesa, rango.combos, { repeticiones: rapida ? 2500 : 12000 })
  const precioDelBote = paraPagar > 0 ? paraPagar / (bote + paraPagar) : 0
  const callesQueQuedan = calculoCallesRestantes(situacion.calle)
  const conexion = fraccionQueLiga(rango, mesa)
  const conexionFuerte = fraccionQueLigaFuerte(rango, mesa)

  const acciones: ValorDeAccion[] = []

  // ── Retirarse ────────────────────────────────────────────────────────────
  // Vale 0 por definición: lo que ya metiste en el bote ya no es tuyo, así que
  // retirarse no gana ni pierde nada desde ahora. Todo lo demás se compara con esto.
  acciones.push({
    accion: 'retirarse',
    valorEsperado: 0,
    desglose: 'Retirarse no gana ni pierde nada desde este momento: las fichas que ya pusiste ya no son tuyas.',
  })

  // ── Pagar (o pasar, si no hay nada que pagar) ────────────────────────────
  // Al pagar o pasar no se espanta a nadie: sigue vivo todo su rango, faroles
  // incluidos. Eso es lo que hace rentable esconder una mano fuerte.
  const futuroPagando = valorDeLasCallesSiguientes(
    equity.equity, bote + paraPagar * 2, perfil, callesQueQuedan, 1, true,
  )
  const valorPagar = equity.equity * (bote + paraPagar) - paraPagar + futuroPagando
  acciones.push({
    accion: 'pagar',
    valorEsperado: valorPagar,
    equitySiSigue: equity.equity,
    desglose:
      paraPagar > 0
        ? `Ganas el ${pc(equity.equity)} de las veces un bote de ${redondear(bote + paraPagar)} y pagas ${redondear(paraPagar)}.` +
          (futuroPagando !== 0 ? ` Contando lo que el rival aún pondrá en las calles siguientes: ${conSigno(futuroPagando)}.` : '')
        : `Pasas sin pagar nada y ganas el ${pc(equity.equity)} de un bote de ${redondear(bote)}.` +
          (futuroPagando !== 0 ? ` Dejar al rival dentro vale ${conSigno(futuroPagando)} en las calles siguientes.` : ''),
  })

  // ── Subir ────────────────────────────────────────────────────────────────
  const tamanos = situacion.tamanoSubida
    ? [situacion.tamanoSubida]
    : tamanosHabituales(bote, paraPagar, situacion.tusFichas, situacion.fichasRival)

  for (const tamano of tamanos) {
    acciones.push(valorDeSubir(situacion, rango, perfil, tamano, callesQueQuedan, conexion, conexionFuerte, rapida))
  }

  const mejor = acciones.reduce((a, b) => (b.valorEsperado > a.valorEsperado ? b : a))
  return {
    equity,
    precioDelBote,
    equityNecesaria: precioDelBote,
    acciones,
    mejor,
    calle: situacion.calle,
  }
}

function valorDeSubir(
  situacion: Situacion,
  rango: Rango,
  perfil: PerfilRival,
  tamano: number,
  callesQueQuedan: number,
  conexion: number,
  conexionFuerte: number,
  rapida: boolean,
): ValorDeAccion {
  const { mano, mesa, bote, paraPagar } = situacion

  // El precio que le sale a ÉL: para seguir tiene que poner `tamano` y optaría a
  // todo lo que habrá en el bote si lo hace. Calcularlo sobre el bote de antes
  // —el error que tenía esto— hacía que el motor creyera que la gente se retira
  // mucho más de lo que se retira, y con eso cualquier farol parecía rentable.
  const precioParaElRival = tamano / (bote + paraPagar + 2 * tamano)
  const continua = fraccionQueContinua(perfil, precioParaElRival, conexion, conexionFuerte)
  const seRetiran = 1 - continua

  // Las manos que aguantan una subida son las mejores de su rango en esta mesa.
  const rangoQueSigue = estrecharPorFuerza(rango, mesa, continua)
  const equitySiSigue = equityContraRango(mano, mesa, rangoQueSigue.combos, { repeticiones: rapida ? 1800 : 8000 }).equity

  const inversion = paraPagar + tamano
  const botePagado = bote + paraPagar + 2 * tamano
  // Subiendo, el que sigue lo hace con algo de verdad: ya no va a farolear,
  // pero lo que pague pagará más porque el bote es mayor.
  const futuro = valorDeLasCallesSiguientes(
    equitySiSigue, botePagado, perfil, callesQueQuedan, continua, false,
  )

  const valorEsperado =
    seRetiran * bote + continua * (equitySiSigue * botePagado - inversion + futuro)

  return {
    accion: 'subir',
    tamano,
    seRetiran,
    equitySiSigue,
    valorEsperado,
    desglose:
      `Subiendo ${redondear(tamano)}, el ${pc(seRetiran)} de sus manos se retira y te llevas ${redondear(bote)} sin ver más cartas. ` +
      `El ${pc(continua)} restante sigue, y contra esa parte —que es la fuerte— ganas el ${pc(equitySiSigue)}.`,
  }
}

/**
 * Lo que todavía se puede ganar (o perder) en las calles que faltan.
 *
 * Este término es el que distingue a este motor de una calculadora de
 * probabilidades: si el rival es de los que no sueltan la mano, dejarle dentro
 * vale dinero, y por eso a veces conviene no subir. Es una aproximación
 * declarada, no una verdad exacta: supone que en cada calle que queda se mueve
 * una fracción del bote proporcional a lo pegajoso que sea el rival.
 */
function valorDeLasCallesSiguientes(
  equity: number,
  bote: number,
  perfil: PerfilRival,
  callesQueQuedan: number,
  fraccionQueSigueViva: number,
  /** true si acabas de enseñar debilidad (pasar o solo pagar). */
  invitaAFarolear: boolean,
): number {
  if (callesQueQuedan <= 0 || fraccionQueSigueViva <= 0) return 0
  const dineroPorCalle =
    bote * 0.32 * (0.35 + perfil.tenacidad) * (invitaAFarolear ? multiplicadorDeFarol(perfil) : 1)
  const total = dineroPorCalle * callesQueQuedan

  // La ventaja de hoy no es la de dentro de tres cartas: el dinero de las calles
  // siguientes lo mete el rival cuando ALGO le ha mejorado, no al azar. Por eso
  // la ventaja se acerca al 50% por cada calle que falta. Sin esta corrección el
  // motor se enamoraba de pagar con manos fuertes, que es un error clásico caro.
  const ventajaFutura = 0.5 + (equity - 0.5) * 0.75 ** callesQueQuedan

  // Ese dinero lo ganas cuando vas por delante y lo pagas cuando vas por detrás.
  return total * (ventajaFutura - (1 - ventajaFutura) * 0.75)
}

function calculoCallesRestantes(calle: Calle): number {
  return { preflop: 3, flop: 2, turn: 1, river: 0 }[calle]
}

/**
 * Tamaños de subida que se prueban: medio bote, tres cuartos y bote entero.
 *
 * Se miden sobre el bote DESPUÉS de igualar, que es como se mide de verdad: si
 * hay 35 y te toca poner 20, el bote con el que juegas es 55 y no 35. Medirlo
 * mal hacía que antes del flop el motor solo considerase subidas ridículas y
 * acabara recomendando pagar con ases, que es justo lo que no hay que hacer.
 */
function tamanosHabituales(bote: number, paraPagar: number, tusFichas: number, fichasRival: number): number[] {
  const tope = Math.max(0, Math.min(tusFichas - paraPagar, fichasRival))
  const referencia = bote + paraPagar
  const candidatos = [referencia * 0.5, referencia * 0.75, referencia].map((t) =>
    Math.round(Math.max(1, Math.min(t, tope))),
  )
  return [...new Set(candidatos)].filter((t) => t > 0)
}

// ─────────────────────────────────────────────────────────────────────────────
//  Puntuación de la decisión del jugador (D22: graduada, no acierto/fallo)
// ─────────────────────────────────────────────────────────────────────────────

export type Veredicto = 'optima' | 'buena' | 'dudosa' | 'mala'

export const NOMBRES_VEREDICTO: Record<Veredicto, string> = {
  optima: '¡La mejor jugada!',
  buena: 'Buena decisión',
  dudosa: 'Decisión discutible',
  mala: 'Mala decisión',
}

export interface Juicio {
  analisis: Analisis
  elegida: ValorDeAccion
  mejor: ValorDeAccion
  /** Fichas que se pierden de media por no haber elegido la mejor. */
  perdida: number
  /** La pérdida medida en botes, que es como se compara entre manos distintas. */
  perdidaEnBotes: number
  veredicto: Veredicto
  /** 0–100, graduado (D22). */
  puntos: number
  exigencia: Exigencia
  /** Explicación corta, la que se enseña siempre. */
  porQue: string
  /** Explicación larga, la del botón "¿por qué?" (D38). */
  porQueLargo: string
}

/**
 * Juzga la decisión del jugador.
 *
 * La exigencia hace lo que se decidió en D20: en nivel básico solo se mira lo
 * gordo (seguir en la mano cuando no tocaba, o tirar una mano que había que
 * jugar); a partir de intermedio también se exige elegir bien entre pagar y
 * subir, que es donde está lo de exprimir una mano fuerte.
 */
export function juzgar(
  situacion: Situacion,
  accionElegida: Accion,
  exigencia: Exigencia = 'intermedia',
  tamanoElegido?: number,
): Juicio {
  const analisis = analizar(situacion)
  const elegida = elegirAccionComparable(analisis, accionElegida, tamanoElegido)
  const bote = Math.max(1, situacion.bote)

  // En nivel básico solo se mira lo gordo: seguir en la mano o no seguir. Elegir
  // pagar cuando lo óptimo era subir no se castiga todavía, porque eso —sacarle
  // el máximo a la mano— es lo que se enseña a partir de intermedio (D20).
  const perdida =
    exigencia === 'basica'
      ? perdidaPorFamilia(analisis, accionElegida)
      : Math.max(0, analisis.mejor.valorEsperado - elegida.valorEsperado)

  const perdidaEnBotes = perdida / bote
  const tolerancia = TOLERANCIA[exigencia]

  const veredicto: Veredicto =
    perdidaEnBotes <= tolerancia * 0.12
      ? 'optima'
      : perdidaEnBotes <= tolerancia * 0.5
        ? 'buena'
        : perdidaEnBotes <= tolerancia
          ? 'dudosa'
          : 'mala'

  // Curva de puntos: 100 si clavaste la jugada, 50 justo en el límite de lo
  // aceptable para tu nivel, y 0 a partir de cuatro veces ese límite. Con una
  // recta, casi todos los errores daban 0 y el número dejaba de decir nada; así
  // se distingue "te pasaste un poco" de "eso no se hace nunca" (D22).
  const vecesLaTolerancia = perdidaEnBotes / tolerancia
  const puntos = Math.round(100 * Math.max(0, 1 - Math.sqrt(vecesLaTolerancia / 4)))

  return {
    analisis,
    elegida,
    mejor: analisis.mejor,
    perdida,
    perdidaEnBotes,
    veredicto,
    puntos,
    exigencia,
    porQue: explicacionCorta(analisis, elegida, veredicto, perdida),
    porQueLargo: explicacionLarga(situacion, analisis, elegida),
  }
}

/**
 * Pérdida contando solo dos familias: retirarse, o seguir en la mano (pagar y
 * subir juntos). Es la vara de medir del principiante.
 */
function perdidaPorFamilia(analisis: Analisis, accion: Accion): number {
  const valorSeguir = analisis.acciones
    .filter((a) => a.accion !== 'retirarse')
    .reduce((mejor, a) => Math.max(mejor, a.valorEsperado), -Infinity)
  const valorRetirarse = 0
  const eligioSeguir = accion !== 'retirarse'
  const convieneSeguir = valorSeguir > valorRetirarse
  if (eligioSeguir === convieneSeguir) return 0
  return Math.abs(valorSeguir - valorRetirarse)
}

function elegirAccionComparable(analisis: Analisis, accion: Accion, tamano?: number): ValorDeAccion {
  const candidatas = analisis.acciones.filter((a) => a.accion === accion)
  if (candidatas.length === 0) return analisis.acciones[0]
  if (accion !== 'subir' || tamano === undefined) {
    // Sin tamaño concreto, se le da al jugador el beneficio de la duda: se juzga
    // su intención con el mejor tamaño posible, no con el peor.
    return candidatas.reduce((a, b) => (b.valorEsperado > a.valorEsperado ? b : a))
  }
  return candidatas.reduce((a, b) =>
    Math.abs((b.tamano ?? 0) - tamano) < Math.abs((a.tamano ?? 0) - tamano) ? b : a,
  )
}

function explicacionCorta(analisis: Analisis, elegida: ValorDeAccion, veredicto: Veredicto, perdida: number): string {
  const eq = pc(analisis.equity.equity)
  // Cuando la jugada es buena pero había otra mejor, se dice: si no, el jugador
  // se queda con "hice lo correcto" y no aprende la jugada que sí tocaba.
  const matiz =
    elegida !== analisis.mejor && perdida > 0.5
      ? ` Aun así, ${analisis.mejor.accion === 'subir' ? `subir ${redondear(analisis.mejor.tamano ?? 0)}` : NOMBRES_ACCION[analisis.mejor.accion]} habría sacado algo más.`
      : ''

  if (veredicto === 'optima' || veredicto === 'buena') {
    if (elegida.accion === 'retirarse') {
      return `Ganabas solo el ${eq} de las veces y seguir costaba demasiado: retirarte te ahorra fichas a la larga.${matiz}`
    }
    if (elegida.accion === 'subir') {
      return `Con el ${eq} de probabilidad de ganar, subir te hace ganar fichas: le cobras a sus manos peores y las mejores tuyas se pagan solas.${matiz}`
    }
    return `Con el ${eq} de probabilidad, pagar sale a cuenta${analisis.mejor.accion === 'pagar' ? ' y es mejor que subir: subiendo espantas justo a las manos que te iban a pagar' : ''}.${matiz}`
  }
  const mejorTexto =
    analisis.mejor.accion === 'subir'
      ? `subir ${redondear(analisis.mejor.tamano ?? 0)}`
      : NOMBRES_ACCION[analisis.mejor.accion]
  return `Ganabas el ${eq} de las veces. Lo mejor era ${mejorTexto}: eligiendo ${NOMBRES_ACCION[elegida.accion]} dejas ${redondear(perdida)} fichas por el camino de media.`
}

function explicacionLarga(situacion: Situacion, analisis: Analisis, elegida: ValorDeAccion): string {
  const lineas: string[] = []
  lineas.push(
    `Tu mano gana el ${pc(analisis.equity.equity)} de las veces contra ${situacion.rangoRival.descripcion}` +
      (analisis.equity.exacto ? ' (calculado exacto, sin simular).' : ` (simulado ${analisis.equity.repeticiones.toLocaleString('es')} veces).`),
  )
  if (situacion.paraPagar > 0) {
    lineas.push(
      `Pagar te cuesta ${redondear(situacion.paraPagar)} para optar a un bote de ${redondear(situacion.bote + situacion.paraPagar)}: ` +
        `necesitas ganar al menos el ${pc(analisis.equityNecesaria)} de las veces para que pagar no pierda fichas.`,
    )
  }
  for (const accion of analisis.acciones) {
    const etiqueta = accion.accion === 'subir' ? `subir ${redondear(accion.tamano ?? 0)}` : NOMBRES_ACCION[accion.accion]
    lineas.push(`· ${etiqueta}: ${conSigno(accion.valorEsperado)} fichas de media. ${accion.desglose}`)
  }
  if (analisis.mejor.accion === 'pagar' && elegida.accion === 'subir') {
    lineas.push(
      'Fíjate en lo que pasa al subir: las manos flojas del rival se van, y esas eran justo las que te habrían pagado más adelante. ' +
        'Por eso aquí vale más esconder la mano y dejarle seguir.',
    )
  }
  return lineas.join('\n')
}

// Ayudas de formato, en español y sin decimales inútiles.
const pc = (x: number) => `${Math.round(x * 100)}%`
const redondear = (x: number) => Math.round(x).toLocaleString('es')
const conSigno = (x: number) => (x >= 0 ? '+' : '−') + Math.round(Math.abs(x)).toLocaleString('es')
