import type { Aleatorio } from './aleatorio'

/**
 * Cómo juega un rival. Son las "barras" de la idea del usuario (ronda 1, S3): en
 * vez de programar tres bots a mano, hay unos pocos números que se sortean al
 * empezar la partida y de ahí sale un rival distinto cada vez.
 *
 * Los mismos números sirven para dos cosas: para que los bots decidan, y para
 * que el motor de decisiones sepa cómo va a reaccionar el rival cuando calcula
 * si te conviene subir o esconder la mano.
 */
export interface PerfilRival {
  nombre: string
  /** Cuánto apuesta y sube por iniciativa propia. 0 = solo apuesta con la nuez. */
  agresividad: number
  /** Cuánto respeta las probabilidades. 1 = se retira siempre que las cuentas no le salen. */
  disciplina: number
  /** Cuánto apuesta sin tener nada. */
  farol: number
  /** Cuánto dinero sigue metiendo en las calles siguientes. Es lo que hace rentable esconder una mano fuerte. */
  tenacidad: number
}

/** Rival de referencia: ni bueno ni malo. Es el que usa el entrenador salvo que la lección diga otra cosa. */
export const RIVAL_TIPICO: PerfilRival = {
  nombre: 'rival corriente',
  agresividad: 0.45,
  disciplina: 0.55,
  farol: 0.25,
  tenacidad: 0.45,
}

/** Perfiles con nombre, para explicárselos al jugador al terminar la partida (D24). */
export const PERFILES_CON_NOMBRE: readonly PerfilRival[] = [
  { nombre: 'la roca', agresividad: 0.2, disciplina: 0.85, farol: 0.08, tenacidad: 0.25 },
  { nombre: 'el calculador', agresividad: 0.5, disciplina: 0.9, farol: 0.3, tenacidad: 0.45 },
  { nombre: 'el pegajoso', agresividad: 0.3, disciplina: 0.25, farol: 0.15, tenacidad: 0.85 },
  { nombre: 'el loco', agresividad: 0.85, disciplina: 0.2, farol: 0.7, tenacidad: 0.7 },
  { nombre: 'el matón', agresividad: 0.8, disciplina: 0.55, farol: 0.55, tenacidad: 0.5 },
  { nombre: 'el pasivo', agresividad: 0.12, disciplina: 0.45, farol: 0.05, tenacidad: 0.6 },
]

/**
 * Sortea un rival. Como pedía el usuario: las barras se ponen al azar, y si sale
 * 0 en agresividad sale un pasivo. Se le pega el nombre del perfil conocido más
 * parecido para poder decir al final "este era un matón" (D24).
 */
export function sortearPerfil(azar: Aleatorio, dificultad = 0.5): PerfilRival {
  const sorteado = {
    // La dificultad solo empuja la disciplina: un bot difícil es uno que se
    // equivoca poco, no uno que apuesta mucho.
    agresividad: azar.entre(0.1, 0.9),
    disciplina: Math.min(0.95, azar.entre(0.15, 0.8) + dificultad * 0.25),
    farol: azar.entre(0.05, 0.7),
    tenacidad: azar.entre(0.2, 0.85),
  }
  return { ...sorteado, nombre: nombreMasParecido(sorteado) }
}

function nombreMasParecido(p: Omit<PerfilRival, 'nombre'>): string {
  let mejor = PERFILES_CON_NOMBRE[0]
  let mejorDistancia = Infinity
  for (const candidato of PERFILES_CON_NOMBRE) {
    const d =
      (candidato.agresividad - p.agresividad) ** 2 +
      (candidato.disciplina - p.disciplina) ** 2 +
      (candidato.farol - p.farol) ** 2 +
      (candidato.tenacidad - p.tenacidad) ** 2
    if (d < mejorDistancia) {
      mejorDistancia = d
      mejor = candidato
    }
  }
  return mejor.nombre
}

/** Cómo se le describe al jugador cuando se revela al final de la partida. */
export function describirPerfil(p: PerfilRival): string {
  const partes: string[] = []
  partes.push(p.agresividad > 0.65 ? 'apuesta mucho' : p.agresividad < 0.3 ? 'apuesta poco' : 'apuesta lo normal')
  partes.push(p.disciplina > 0.7 ? 'y se retira cuando las cuentas no le salen' : p.disciplina < 0.35 ? 'y paga casi siempre aunque no le convenga' : 'y acierta más o menos con sus retiradas')
  if (p.farol > 0.5) partes.push('se marca bastantes faroles')
  if (p.tenacidad > 0.7) partes.push('y una vez dentro de la mano ya no suelta')
  return partes.join(', ')
}

/**
 * Qué parte de su rango sigue en la mano si le apuestas.
 *
 * Es la pieza que hace que el juego entienda lo de "esconder una mano fuerte
 * para exprimirla": si subes, la parte floja de su rango se va — y esa parte
 * floja era justo la que te iba a pagar en las calles siguientes.
 *
 * Dependen de tres cosas:
 *  · el PRECIO — apostar 75 a un bote de 100 le pide poner 75 para ganar 175,
 *    o sea necesita acertar el 43% de las veces;
 *  · si LIGÓ ALGO con la mesa — por barato que sea, con nada no se paga;
 *  · quién es — el disciplinado se retira cuando las cuentas no le salen, el
 *    pegajoso paga igual.
 */
export function fraccionQueContinua(
  perfil: PerfilRival,
  /** Lo que le cuesta seguir respecto al bote que se llevaría si paga (0 a 1). */
  precio: number,
  /** Parte de su rango que ha ligado algo con esta mesa. 1 antes del flop. */
  conexionConLaMesa = 1,
  /** Parte de su rango con una mano de verdad (pareja alta o mejor). Esas no se tiran. */
  fraccionFuerte = 0,
): number {
  if (precio <= 0) return 1
  // El exponente inclina la cuenta hacia lo que pasa de verdad en la mesa: ante
  // una apuesta del tamaño del bote no sigue la mitad de la gente, sigue bastante menos.
  const porLasCuentas = (1 - precio) ** 1.15 * (0.7 + 0.6 * perfil.tenacidad)
  const porNoSaberRetirarse = (1 - perfil.disciplina) * 0.2

  // Nadie paga con la mano vacía, por bueno que sea el precio. Este tope es el
  // que hace que en una mesa que no le sirve a nadie, apostar se lleve el bote
  // sin más... y que, por lo mismo, a veces convenga no apostar y dejarle farolear.
  const tope = conexionConLaMesa * (0.75 + 0.5 * (1 - perfil.disciplina)) + perfil.farol * 0.08

  // Suelo: con pareja alta o mejor nadie se retira ante una apuesta normal, por
  // muy disciplinado que sea. Sin este suelo el motor creía que puede echar de la
  // mano a un rival que ya tiene algo, y eso convierte cualquier farol en oro.
  const suelo = Math.min(0.9, fraccionFuerte * (0.75 + 0.2 * perfil.tenacidad))
  const porPrecioYCabeza = Math.min(porLasCuentas + porNoSaberRetirarse, tope)
  return Math.min(0.97, Math.max(0.03, suelo, porPrecioYCabeza))
}

/**
 * Cuánto se anima a apostar si le enseñas debilidad (pasas o solo pagas).
 * Es la otra mitad de esconder una mano fuerte: contra uno que se marca faroles,
 * no apostar no es dejar de ganar, es dejar que apueste él.
 */
export function multiplicadorDeFarol(perfil: PerfilRival): number {
  return 1 + perfil.agresividad * perfil.farol * 1.6
}
