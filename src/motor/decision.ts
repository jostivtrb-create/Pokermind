import type { Carta } from './cartas'
import type { Probabilidades } from './equity'
import { equityContraRango } from './equity'
import type { PerfilRival } from './perfiles'
import { RIVAL_TIPICO, fraccionQueContinua, multiplicadorDeFarol } from './perfiles'
import type { Rango } from './rangos'
import { estrecharPorFuerza, fraccionQueLiga, fraccionQueLigaFuerte, quitarBloqueadas } from './rangos'
import { cartasQueTeSalvan, loQueTeGana, outsContra } from './proyectos'

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

/**
 * Hasta cuántas veces "el bote más lo que cuesta igualar" puede valer tu montón
 * para que el todo-in siga siendo una jugada normal y no un disparate.
 */
export const TOPE_PARA_TODO_IN = 2.5

/**
 * Pérdida (medida en botes) con la que la nota llega a cero, según el nivel.
 *
 * La escala se recalibró jugando: perder 17 fichas de media en un bote de 139
 * —menos de una ciega grande— bajaba la nota a 55, casi lo mismo que perder 23.
 * Un descuido de ese tamaño no puede puntuar como un error caro: con la curva
 * de abajo da 90, y solo se baja de 50 cuando te dejas más de un tercio del
 * bote, que ya es una equivocación de las que cuestan torneos.
 */
const PERDIDA_QUE_DEJA_A_CERO: Record<Exigencia, number> = {
  basica: 0.8,
  intermedia: 0.5,
  seria: 0.3,
}

/**
 * Exponente de la curva de la nota. Por debajo de 1 la curva bajaría en picado
 * desde el primer fallo; por encima de 2 casi todo puntuaría 90 y la nota no
 * distinguiría nada. 1,6 deja un descuido leve en 85-90 y un error caro por
 * debajo de 50, que es lo que se pidió.
 */
const CURVA_DE_LA_NOTA = 1.6

export interface Situacion {
  mano: readonly [Carta, Carta]
  /**
   * Cuántos rivales siguen en la mano. El motor calcula contra UNO —el rival
   * principal—, así que con más gente viva tu porcentaje real es menor y hay
   * que decirlo: 9♦2♠ gana el 28% contra un rango, el 17% contra dos manos de
   * ese rango y el 12% contra tres (medido, D79).
   */
  rivalesVivos?: number
  /** Nombre del rival contra el que se calcula, para poder decirlo. */
  nombreDelRival?: string
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
  /** Tamaño de la subida POR ENCIMA de lo que cuesta igualar. */
  tamano?: number
  /** Fichas que pones en total con esta acción. "Subir 220" pone 400 si igualar costaba 180. */
  pones?: number
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
  //
  // Pero solo es una jugada cuando hay algo que pagar. Si seguir es gratis, en
  // la mesa no existe retirarse: se pasa. Ofrecerlo hacía que el juego llegara a
  // decir "pasaste gratis, pero retirarte habría sacado algo más", que es falso
  // y además enseña un reflejo pésimo: tirar manos que no cuestan nada.
  if (paraPagar > 0) {
    acciones.push({
      accion: 'retirarse',
      valorEsperado: 0,
      desglose: 'Retirarse no gana ni pierde nada desde este momento: las fichas que ya pusiste ya no son tuyas.',
    })
  }

  // ── Pagar (o pasar, si no hay nada que pagar) ────────────────────────────
  // Al pagar o pasar no se espanta a nadie: sigue vivo todo su rango, faroles
  // incluidos. Eso es lo que hace rentable esconder una mano fuerte.
  //
  // Salvo que pagar te deje sin fichas: si vas todo-in al pagar, ya no queda
  // nada que apostar en las calles siguientes.
  const pagarEsTodoIn = paraPagar >= situacion.tusFichas
  const futuroPagando = pagarEsTodoIn
    ? 0
    : valorDeLasCallesSiguientes(equity.equity, bote + paraPagar * 2, perfil, callesQueQuedan, 1, true)
  const valorAhoraPagando = equity.equity * (bote + paraPagar) - paraPagar
  /*
    Pasar gratis no puede valer menos que cero.

    El término de las calles siguientes puede ser negativo —sale caro seguir con
    una mano floja—, pero eso solo pasa si SIGUES pagando más adelante, y eso ya
    no estás obligado a hacerlo: cuando te apuesten, podrás soltar. La opción de
    retirarte después es un suelo, así que ver una carta gratis nunca es un
    error. Sin este suelo, el juego recomendaba tirar manos que no costaban nada.
  */
  const valorPagar =
    paraPagar === 0
      ? Math.max(0, valorAhoraPagando + futuroPagando)
      : valorAhoraPagando + futuroPagando

  // La explicación desglosa las DOS partes y el total. Antes enseñaba el total
  // y luego el término de calles siguientes por separado, y parecía que uno
  // contradecía al otro: cualquiera que hiciera la cuenta a mano no llegaba al
  // número de la pantalla.
  const trozos: string[] = []
  trozos.push(
    paraPagar > 0
      ? `Ganas el ${pc(equity.equity)} de las veces un bote de ${redondear(bote + paraPagar)} y pagas ${redondear(paraPagar)}: ${conSigno(valorAhoraPagando)} de media.`
      : `Pasas sin pagar nada y ganas el ${pc(equity.equity)} de un bote de ${redondear(bote)}: ${conSigno(valorAhoraPagando)} de media.`,
  )
  if (Math.abs(futuroPagando) >= 1) {
    trozos.push(
      `${conSigno(futuroPagando)} más por lo que todavía se apuesta en las calles siguientes.`,
    )
    trozos.push(`En total: ${conSigno(valorPagar)}.`)
  }

  acciones.push({
    accion: 'pagar',
    valorEsperado: valorPagar,
    pones: paraPagar,
    equitySiSigue: equity.equity,
    desglose: trozos.join(' '),
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
  /*
    Subiendo, el que sigue lo hace con algo de verdad: ya no va a farolear, pero
    lo que pague pagará más porque el bote es mayor.

    EXCEPCIÓN IMPORTANTE: si la subida es un todo-in —tuyo o suyo— **no hay
    calles siguientes**. Ya está todo el dinero dentro y solo quedan cartas por
    salir. Sin esta excepción el motor se inventaba un montón de fichas futuras
    detrás de cada todo-in y lo recomendaba casi siempre. Salió a la luz el día
    que el jugador pudo elegir el tamaño de la subida.
  */
  const esTodoIn = inversion >= situacion.tusFichas || tamano >= situacion.fichasRival
  const futuro = esTodoIn
    ? 0
    : valorDeLasCallesSiguientes(equitySiSigue, botePagado, perfil, callesQueQuedan, continua, false)

  const valorEsperado =
    seRetiran * bote + continua * (equitySiSigue * botePagado - inversion + futuro)

  return {
    accion: 'subir',
    tamano,
    pones: inversion,
    seRetiran,
    equitySiSigue,
    valorEsperado,
    desglose:
      (paraPagar > 0
        ? `Subes ${redondear(tamano)} por encima de su apuesta: pones ${redondear(inversion)} en total. `
        : `Apuestas ${redondear(tamano)}. `) +
      `El ${pc(seRetiran)} de sus manos se retira y te llevas ${redondear(bote)} sin ver más cartas. ` +
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
  const bruto = total * (ventajaFutura - (1 - ventajaFutura) * 0.75)
  if (bruto >= 0) return bruto

  /*
    Ir por detrás NO obliga a pagar las calles siguientes.

    Si vas perdiendo, en el river pasas y sueltas: no pones ni una ficha más. Lo
    único que se pierde de verdad ahí es lo que uno paga por error, y eso solo
    pasa cuando tienes algo con lo que dudar. Con una mano muerta no hay duda
    ninguna, así que no se pierde nada.

    Sin esto, el motor cobraba dinero del river a manos que ganan el 0%: en una
    mano de verdad decía que subir costaba 128 fichas cuando la cuenta honrada
    —lo que se retira por lo que se pierde— daba 99. Es el mismo fallo que hacía
    recomendar retirarse gratis (D60), visto desde el otro lado.
  */
  return bruto * Math.min(1, equity * 2)
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
  /*
    Una subida tiene que ser una subida.

    En la mesa, subir obliga a poner al menos lo que puso el último que apostó;
    y sin nadie que haya apostado, una apuesta de calderilla no hace nada. Sin
    este mínimo salían consejos como "lo mejor era subir 1 (pones 179)" cuando
    al jugador le quedaba una ficha suelta por encima de lo que costaba pagar.
    Si no llega a eso, sus jugadas de verdad son pagar o soltar.
  */
  const minimaDeVerdad = Math.max(1, paraPagar, Math.round(referencia * 0.25))
  const candidatos = [referencia * 0.5, referencia * 0.75, referencia].map((t) =>
    Math.round(Math.max(1, Math.min(t, tope))),
  )
  // El todo-in solo entra cuando de verdad es una opción: con fichas cortas.
  //
  // No es pereza, es honestidad sobre lo que este motor sabe hacer. Calcula muy
  // bien una calle, pero no sabe valorar "apuesto dos tercios ahora y otra vez
  // en el river": aproxima ese dinero futuro. Con fichas cortas la aproximación
  // da igual porque no hay futuro que valorar. Con 900 fichas en un bote de 100
  // sí importa, y entonces el motor sobrevalora el todo-in frente a apostar tres
  // veces seguidas, que es lo que haría un buen jugador. Ofrecer una jugada que
  // el motor juzga peor de lo que la juzgaría un experto sería enseñar mal.
  /*
    El todo-in no pasa por el mínimo: en una mesa, meter lo que te queda SIEMPRE
    es legal, aunque sea menos que la última apuesta. Lo único que se descarta
    es la calderilla —quedarte con una ficha suelta por encima del pago—, que no
    mueve nada y en la práctica es pagar.

    Sin esto, con 393 fichas en un bote de 1821 el juego no te dejaba apostar
    NADA y ponía "Subir: sin fichas" teniendo fichas.
  */
  const esUnTodoInDeVerdad = tope > 0 && tope >= referencia * 0.1
  if (tope > 0 && tope <= TOPE_PARA_TODO_IN * referencia) candidatos.push(Math.round(tope))
  return [...new Set(candidatos)]
    .filter((t) => t >= minimaDeVerdad || (esUnTodoInDeVerdad && t === Math.round(tope)))
    .sort((a, b) => a - b)
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
  const cero = PERDIDA_QUE_DEJA_A_CERO[exigencia]

  const veredicto: Veredicto =
    perdidaEnBotes <= cero * 0.04
      ? 'optima'
      : perdidaEnBotes <= cero * 0.35
        ? 'buena'
        : perdidaEnBotes <= cero * 0.7
          ? 'dudosa'
          : 'mala'

  /*
    La nota: 100 si clavaste la jugada, 0 cuando te dejas el bote entero.

    La forma de la curva importa tanto como el límite. Es plana cerca de cero
    —los descuidos de una ficha no se castigan— y se hunde deprisa cuando el
    error ya cuesta dinero de verdad. Perder un 12% del bote da 90; un tercio
    del bote, 44 (D65).
  */
  const puntos = Math.round(
    100 * Math.max(0, 1 - Math.pow(Math.min(1, perdidaEnBotes / cero), CURVA_DE_LA_NOTA)),
  )

  return {
    analisis,
    elegida,
    mejor: analisis.mejor,
    perdida,
    perdidaEnBotes,
    veredicto,
    puntos,
    exigencia,
    porQue: explicacionCorta(analisis, elegida, veredicto, perdida, perdidaEnBotes, situacion.paraPagar === 0),
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
  // Un "subir" que no llega al mínimo de una subida de verdad es, en la
  // práctica, pagar: se juzga como tal y no como retirarse.
  if (candidatas.length === 0)
    return analisis.acciones.find((a) => a.accion === 'pagar') ?? analisis.acciones[0]
  if (accion !== 'subir' || tamano === undefined) {
    // Sin tamaño concreto, se le da al jugador el beneficio de la duda: se juzga
    // su intención con el mejor tamaño posible, no con el peor.
    return candidatas.reduce((a, b) => (b.valorEsperado > a.valorEsperado ? b : a))
  }
  return candidatas.reduce((a, b) =>
    Math.abs((b.tamano ?? 0) - tamano) < Math.abs((a.tamano ?? 0) - tamano) ? b : a,
  )
}

/**
 * Por debajo de esta diferencia —medida en botes— dos jugadas son la misma.
 *
 * Sin un margen así salían frases que se contradicen: 100 puntos, "apostar gana
 * fichas" y a continuación "aun así, pasar habría sacado algo más". Si la
 * diferencia son tres fichas en un bote de ciento veinte, no hay nada que
 * corregir: las dos jugadas están bien y eso es lo que hay que decir (D78).
 */
const EMPATE_TECNICO = 0.03

function explicacionCorta(
  analisis: Analisis,
  elegida: ValorDeAccion,
  veredicto: Veredicto,
  perdida: number,
  perdidaEnBotes: number,
  gratis: boolean,
): string {
  const eq = pc(analisis.equity.equity)
  const mejor = etiquetaDeAccion(analisis.mejor, gratis)
  const casiIguales = elegida !== analisis.mejor && perdidaEnBotes <= EMPATE_TECNICO

  // Cuando la jugada es buena pero había otra mejor, se dice: si no, el jugador
  // se queda con "hice lo correcto" y no aprende la jugada que sí tocaba.
  // "Aun así" solo cabe cuando lo que hiciste ganaba fichas y había algo mejor.
  // Si tu jugada pierde, no es un "aun así": es un "por eso".
  const matiz = casiIguales
    ? ` ${mayuscula(mejor)} habría dado casi lo mismo: las dos están bien.`
    : elegida !== analisis.mejor && perdida > 0.5
      ? elegida.valorEsperado > 0
        ? ` Aun así, ${mejor} habría sacado algo más.`
        : ` Por eso lo mejor era ${mejor}.`
      : ''

  if (veredicto === 'optima' || veredicto === 'buena') {
    if (elegida.accion === 'retirarse') {
      /*
        Esta frase defiende la jugada, así que solo se dice cuando retirarse ERA
        lo mejor. Antes salía siempre, y quedaba "retirarte te ahorra fichas a la
        larga. Por eso lo mejor era pagar", que se contradice sola.
      */
      if (elegida === analisis.mejor) {
        return `Ganabas solo el ${eq} de las veces y seguir costaba demasiado: retirarte te ahorra fichas a la larga.`
      }
      if (casiIguales) {
        return `Ganabas el ${eq} de las veces: retirarte y ${mejor} daban casi lo mismo, las dos están bien.`
      }
      return `Ganabas el ${eq} de las veces: retirarte no es ningún desastre, pero ${mejor} sacaba algo más.`
    }
    if (elegida.accion === 'subir') {
      if (elegida.valorEsperado <= 0) {
        return casiIguales || elegida === analisis.mejor
          ? `Con el ${eq} de probabilidad, ${gratis ? 'apostar' : 'subir'} pierde ${redondear(-elegida.valorEsperado)} fichas de media.${matiz}`
          : `Con el ${eq} de probabilidad, ${gratis ? 'apostar' : 'subir'} pierde ${redondear(-elegida.valorEsperado)} fichas de media. Es un error pequeño, pero lo mejor era ${mejor}.`
      }
      return (
        `Con el ${eq} de probabilidad de ganar, ${gratis ? 'apostar' : 'subir'} gana fichas: ` +
        `las manos peores que la tuya te pagan, y las que se retiran te dejan el bote.${matiz}`
      )
    }
    // Pasar cuando no cuesta nada no se explica con la cuenta del precio: no hay
    // precio. Lo que se explica es qué ganas mirando otra carta gratis.
    if (gratis) {
      return `Seguir no costaba nada, así que ves la carta siguiente gratis con tu ${eq} de probabilidad.${matiz}`
    }
    /*
      "Sale a cuenta" solo se dice cuando de verdad gana fichas.

      Antes se decía siempre que la jugada era aceptable, y salían frases que se
      contradicen solas: "pagar sale a cuenta. Aun así, retirarse habría sacado
      algo más". Si retirarse —que vale cero— saca más, pagar pierde.
    */
    if (elegida.valorEsperado <= 0) {
      return casiIguales || elegida === analisis.mejor
        ? `Con el ${eq} de probabilidad, pagar pierde ${redondear(-elegida.valorEsperado)} fichas de media.${matiz}`
        : `Con el ${eq} de probabilidad, pagar pierde ${redondear(-elegida.valorEsperado)} fichas de media. Es un error pequeño, pero lo mejor era ${mejor}.`
    }
    return `Con el ${eq} de probabilidad, pagar sale a cuenta${analisis.mejor.accion === 'pagar' ? ' y es mejor que subir: subiendo espantas justo a las manos que te iban a pagar' : ''}.${matiz}`
  }
  const mejorTexto = etiquetaDeAccion(analisis.mejor, gratis)
  return `Ganabas el ${eq} de las veces. Lo mejor era ${mejorTexto}: eligiendo ${etiquetaDeAccion(elegida, gratis)} dejas ${redondear(perdida)} fichas por el camino de media.`
}

function explicacionLarga(situacion: Situacion, analisis: Analisis, elegida: ValorDeAccion): string {
  const lineas: string[] = []
  lineas.push(
    `Tu mano gana el ${pc(analisis.equity.equity)} de las veces contra ${situacion.nombreDelRival ? `${situacion.nombreDelRival}, con ` : ''}${situacion.rangoRival.descripcion}` +
      (analisis.equity.exacto ? ' (calculado exacto, sin simular).' : ` (simulado ${analisis.equity.repeticiones.toLocaleString('es')} veces).`),
  )
  /*
    De dónde sale ese porcentaje, en cartas que se pueden contar.

    Un número suelto no enseña nada: en una mesa de verdad no hay pantalla. Lo
    que se lleva uno puesto es "me falta una jota, son cuatro cartas, y cuatro
    outs con una carta por salir son un 8%". Eso es la regla del 2 y el 4 del
    módulo 2, y es lo que convierte el juego en un entrenador.
  */
  const rivales = situacion.rivalesVivos ?? 1
  if (rivales > 1) {
    lineas.push(
      `Ojo: ese porcentaje es contra ${situacion.nombreDelRival ?? 'un rival'}. Quedabais ` +
        `${rivales + 1} en la mano, y contra ${rivales} rivales a la vez hay que ganarles a todos: ` +
        'tu porcentaje real es bastante menor.',
    )
  }

  const outs = outsContra(situacion.mano, situacion.mesa, situacion.rangoRival)
  if (outs.cuantas > 0) {
    const porSalir = 5 - situacion.mesa.length
    lineas.push(
      `Tienes ${outs.proyecto}: te sirven ${outs.cuantas} cartas (${outs.comoSeLlaman}). ` +
        (porSalir === 1
          ? `Queda una carta, así que son tus outs por 2: un ${pc(outs.probabilidad)}.`
          : `Quedan dos cartas, así que son tus outs por 4: un ${pc(outs.probabilidad)}.`) +
        (outs.hayMas && analisis.equity.equity > outs.probabilidad
          ? ` Tu ${pc(analisis.equity.equity)} es algo más alto porque a veces también ganas ligando pareja.`
          : analisis.equity.equity < outs.probabilidad
            ? ` Tu ${pc(analisis.equity.equity)} es más bajo porque ligarlo no siempre basta: él también puede mejorar.`
            : ''),
    )
  } else {
    /*
      Sin proyecto que contar, lo que enseña es lo contrario: QUÉ te gana y qué
      poquito te salva. Es el mejor momento de la mano para aprender algo — una
      doble pareja en una mesa emparejada vale mucho menos de lo que parece— y
      antes se desperdiciaba enseñando un porcentaje a secas.
    */
    const gana = loQueTeGana(situacion.mano, situacion.mesa, situacion.rangoRival)
    if (gana.length > 0 && analisis.equity.equity < 0.5) {
      const lista = gana
        .slice(0, 2)
        .map((g) => `${g.manos} ${g.manos === 1 ? 'mano' : 'manos'} con ${g.jugada}`)
        .join(' y ')
      const salvan = cartasQueTeSalvan(situacion.mano, situacion.mesa, situacion.rangoRival)
      lineas.push(
        `Lo que te gana de su rango: ${lista}.` +
          (salvan.cuantas > 0
            ? ` Te salvan ${salvan.comoSeLlaman || `${salvan.cuantas} cartas`}: un ${pc(salvan.probabilidad)}.`
            : ' No queda ninguna carta que te ponga por delante.'),
      )
    }
  }

  if (situacion.paraPagar > 0) {
    /*
      El caso que más confunde: tu probabilidad supera lo que exige el bote y
      aun así pagar pierde fichas. Pasa porque quedan calles y te van a seguir
      apostando. Si no se dice, el jugador que acaba de aprender "pago si mi
      probabilidad supera el precio" cree que el juego está roto — y con razón.
    */
    const pagar = analisis.acciones.find((a) => a.accion === 'pagar')
    const elPrecioSaleYAunAsiPierde =
      !!pagar && pagar.valorEsperado < 0 && analisis.equity.equity >= analisis.equityNecesaria
    lineas.push(
      `Pagar te cuesta ${redondear(situacion.paraPagar)} para optar a un bote de ${redondear(situacion.bote + situacion.paraPagar)}: ` +
        `necesitas ganar al menos el ${pc(analisis.equityNecesaria)} de las veces para que pagar no pierda fichas.` +
        (elPrecioSaleYAunAsiPierde
          ? ` Tu ${pc(analisis.equity.equity)} pasa ese listón, pero pagar aquí no termina la mano: quedan calles y te va a seguir apostando, y ahí pierdes más de lo que ganas ahora. Por eso sale mejor soltarla ya.`
          : '') +
        (outs.cuantas > 0
          ? outs.probabilidad >= analisis.equityNecesaria
            ? ` Solo con tus ${outs.cuantas} outs ya tienes un ${pc(outs.probabilidad)}: el precio te sale sin contar nada más.`
            : ` Solo con tus ${outs.cuantas} outs (un ${pc(outs.probabilidad)}) no llegarías, pero contándolo todo ganas el ${pc(analisis.equity.equity)}${analisis.equity.equity >= analisis.equityNecesaria ? ', así que sí te sale' : ', y tampoco llega'}.`
          : ''),
    )
  }
  for (const accion of analisis.acciones) {
    lineas.push(`· ${etiquetaDeAccion(accion)}: ${conSigno(accion.valorEsperado)} fichas de media. ${accion.desglose}`)
  }
  if (analisis.mejor.accion === 'pagar' && elegida.accion === 'subir') {
    lineas.push(
      'Fíjate en lo que pasa al subir: las manos flojas del rival se van, y esas eran justo las que te habrían pagado más adelante. ' +
        'Por eso aquí vale más esconder la mano y dejarle seguir.',
    )
  }
  return lineas.join('\n')
}

/**
 * Cómo se nombra una acción.
 *
 * "Subir 220" es ambiguo: en una mesa, decir 220 puede entenderse como subir
 * HASTA 220 o subir 220 MÁS. Se dice siempre lo que pones en total, que es lo
 * único que no se malinterpreta.
 */
export function etiquetaDeAccion(accion: ValorDeAccion, gratis = false): string {
  // Cuando seguir no cuesta nada, en la mesa no se dice "pagar", se dice "pasar";
  // y lo que se pone no es "subir", es "apostar": no hay nada que subir todavía.
  if (accion.accion === 'pagar') return gratis ? 'pasar' : 'pagar'
  if (accion.accion !== 'subir') return NOMBRES_ACCION[accion.accion]
  if (gratis) return `apostar ${redondear(accion.tamano ?? 0)}`
  return `subir ${redondear(accion.tamano ?? 0)} (pones ${redondear(accion.pones ?? 0)})`
}

const mayuscula = (t: string) => `${t[0].toUpperCase()}${t.slice(1)}`

// Ayudas de formato, en español y sin decimales inútiles.
const pc = (x: number) => `${Math.round(x * 100)}%`
const redondear = (x: number) => Math.round(x).toLocaleString('es')
const conSigno = (x: number) => (x >= 0 ? '+' : '−') + Math.round(Math.abs(x)).toLocaleString('es')
