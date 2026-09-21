/**
 * El glosario. Cada término se explica CUANDO APARECE por primera vez, no en una
 * lista al principio (es el principio de "vocabulario justo a tiempo" del
 * análisis), pero además se puede consultar entero desde la pantalla de Guía.
 *
 * Decisión D5: que entre alguien sin saber nada de póker y salga sabiendo hablar
 * como se habla en una mesa.
 */
export interface Termino {
  clave: string
  palabra: string
  /** Cómo se dice también, porque en la mesa se mezcla el español y el inglés. */
  tambien?: string[]
  definicion: string
  /** Ejemplo de uso, que es lo que hace que se entienda de verdad. */
  ejemplo?: string
}

export const GLOSARIO: Termino[] = [
  { clave: 'retirarse', palabra: 'Retirarse', tambien: ['foldear', 'fold', 'tirar la mano'],
    definicion: 'Abandonar la mano. Pierdes lo que ya habías puesto, pero no pones ni una ficha más.',
    ejemplo: '"Me retiro" o "foldeo": sueltas las cartas y esperas a la siguiente mano.' },
  { clave: 'pagar', palabra: 'Pagar', tambien: ['igualar', 'call', 'callear'],
    definicion: 'Poner las mismas fichas que ha puesto el rival para seguir en la mano.',
    ejemplo: 'Si él apuesta 50, pagar es poner tus 50 y ver la carta siguiente.' },
  { clave: 'pasar', palabra: 'Pasar', tambien: ['check', 'checkear'],
    definicion: 'Seguir en la mano sin poner fichas, cuando nadie ha apostado antes que tú.',
    ejemplo: 'Pasar no es retirarse: sigues dentro, y gratis.' },
  { clave: 'subir', palabra: 'Subir', tambien: ['raise', 'resubir', 'apostar'],
    definicion: 'Poner más fichas de las que hay que poner, obligando a los demás a pagar más o retirarse.',
    ejemplo: 'Él apuesta 50 y tú subes a 150: ahora le toca a él decidir.' },
  { clave: 'ciegas', palabra: 'Las ciegas', tambien: ['blinds', 'ciega pequeña', 'ciega grande'],
    definicion: 'Dos apuestas obligatorias que ponen dos jugadores antes de ver las cartas, para que siempre haya algo que ganar.',
    ejemplo: 'Si las ciegas son 10 y 20, uno pone 10 y el siguiente 20 sin haber visto nada.' },
  { clave: 'boton', palabra: 'El botón', tambien: ['dealer', 'la posición'],
    definicion: 'La ficha que marca quién reparte. Rota una silla a la izquierda en cada mano, para que todos pasen por todas las posiciones.',
    ejemplo: 'El del botón habla el último después del flop: es la mejor silla de la mesa.' },
  { clave: 'bote', palabra: 'El bote', tambien: ['pot'],
    definicion: 'Todas las fichas apostadas en la mano. Se las lleva quien gana.',
    ejemplo: 'Hay 200 en el bote y te piden 50 para seguir.' },
  { clave: 'flop', palabra: 'El flop',
    definicion: 'Las tres primeras cartas comunes que se ponen boca arriba en la mesa. Las usan todos.',
    ejemplo: 'Antes del flop solo ves tus dos cartas; con el flop ya tienes cinco para formar tu mano.' },
  { clave: 'turn', palabra: 'El turn', tambien: ['la cuarta calle'],
    definicion: 'La cuarta carta común.' },
  { clave: 'river', palabra: 'El river', tambien: ['la quinta calle'],
    definicion: 'La quinta y última carta común. Después de ella ya no mejora nadie.' },
  { clave: 'calle', palabra: 'Calle', tambien: ['street', 'ronda de apuestas'],
    definicion: 'Cada una de las cuatro fases de apuestas de una mano: antes del flop, flop, turn y river.' },
  { clave: 'outs', palabra: 'Outs',
    definicion: 'Las cartas que todavía pueden salir y que te dan la mano ganadora.',
    ejemplo: 'Con cuatro cartas de un palo te faltan 9 del mismo palo: tienes 9 outs.' },
  { clave: 'proyecto', palabra: 'Proyecto', tambien: ['draw'],
    definicion: 'Una mano que todavía no vale nada pero que se convierte en muy buena si sale la carta que necesitas.',
    ejemplo: 'Cuatro cartas de corazones es un proyecto de color.' },
  { clave: 'precioDelBote', palabra: 'El precio del bote', tambien: ['pot odds'],
    definicion: 'Lo que te cuesta pagar comparado con lo que puedes ganar. Dice cuántas veces de cada cien necesitas ganar para que pagar salga a cuenta.',
    ejemplo: 'Pagar 50 para ganar 250 sale a cuenta si ganas más de 1 de cada 5 veces.' },
  { clave: 'equity', palabra: 'Tu porcentaje', tambien: ['equity'],
    definicion: 'Qué parte del bote es tuya a largo plazo: cuántas veces de cada cien ganarías esta mano si se jugara hasta el final muchas veces.',
    ejemplo: 'Con 40% de equity en un bote de 200, "te pertenecen" 80.' },
  { clave: 'rango', palabra: 'Rango',
    definicion: 'Todas las manos que el rival puede tener en ese momento. No se juega contra unas cartas concretas, se juega contra un rango.',
    ejemplo: 'Si sube desde la primera posición, su rango son manos fuertes, no cualquier cosa.' },
  { clave: 'notacion', palabra: 'La s, la o y el +', tambien: ['suited', 'offsuit'],
    definicion: 'La forma corta de escribir manos. La s (de "suited") quiere decir del mismo palo: AKs. La o (de "offsuit"), de distinto palo: AKo. Y el + quiere decir "esa y todas las mejores".',
    ejemplo: '"A9s+" son A9, AT, AJ, AQ y AK, las cinco del mismo palo. "77+" son las parejas del siete para arriba.' },
  { clave: 'valor', palabra: 'Apostar por valor', tambien: ['value bet'],
    definicion: 'Apostar con una mano buena esperando que te paguen con una peor.',
    ejemplo: 'Con trío apuestas para que te pague el que tiene pareja.' },
  { clave: 'farol', palabra: 'Farol', tambien: ['bluff', 'farolear'],
    definicion: 'Apostar con una mano que casi seguro pierde, para que el rival se retire.',
    ejemplo: 'Si su rango no liga con esta mesa, un farol se lleva el bote.' },
  { clave: 'todoIn', palabra: 'Todo-in', tambien: ['all-in'],
    definicion: 'Apostar todas tus fichas. A partir de ahí ya no puedes apostar más en esa mano.' },
  { clave: 'showdown', palabra: 'Showdown', tambien: ['enseñar las cartas'],
    definicion: 'El momento final en el que los que siguen enseñan las cartas y se decide quién gana.' },
  { clave: 'botePartido', palabra: 'Bote paralelo', tambien: ['side pot'],
    definicion: 'Cuando alguien se queda sin fichas, se separa la parte del bote a la que puede aspirar de la que no.' },
  { clave: 'posicion', palabra: 'Posición',
    definicion: 'Tu sitio en el orden de hablar. Hablar el último es una ventaja enorme, porque decides sabiendo qué han hecho los demás.' },
  { clave: 'pareja', palabra: 'Pareja',
    definicion: 'Dos cartas del mismo valor.', ejemplo: 'Dos reyes son pareja de reyes.' },
  { clave: 'parejaServida', palabra: 'Pareja servida', tambien: ['pocket pair'],
    definicion: 'Cuando tus dos cartas tapadas ya forman pareja, antes de ver la mesa.' },
  { clave: 'trio', palabra: 'Trío', tambien: ['set', 'trips'],
    definicion: 'Tres cartas del mismo valor.' },
  { clave: 'color', palabra: 'Color', tambien: ['flush'],
    definicion: 'Cinco cartas del mismo palo.' },
  { clave: 'escalera', palabra: 'Escalera', tambien: ['straight'],
    definicion: 'Cinco cartas seguidas, de cualquier palo.', ejemplo: '5-6-7-8-9 es escalera al nueve.' },
  { clave: 'full', palabra: 'Full', tambien: ['full house'],
    definicion: 'Un trío y una pareja a la vez.' },
  { clave: 'poker', palabra: 'Póker', tambien: ['four of a kind'],
    definicion: 'Cuatro cartas del mismo valor.' },
]

export const GLOSARIO_POR_CLAVE = new Map(GLOSARIO.map((t) => [t.clave, t]))

/** Busca por palabra o por cualquiera de sus sinónimos. */
export function buscarTermino(texto: string): Termino[] {
  const q = texto.trim().toLowerCase()
  if (!q) return GLOSARIO
  return GLOSARIO.filter(
    (t) =>
      t.palabra.toLowerCase().includes(q) ||
      t.definicion.toLowerCase().includes(q) ||
      (t.tambien ?? []).some((s) => s.toLowerCase().includes(q)),
  )
}
