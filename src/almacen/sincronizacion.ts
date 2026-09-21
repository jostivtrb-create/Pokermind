import type { Progreso } from '../juego/progreso'

/**
 * Sincronizar el progreso con la cuenta.
 *
 * Decisión D31: la cuenta es obligatoria, pero solo hace falta internet la
 * primera vez. Después se juega en el aparato y se sube cuando hay conexión.
 *
 * Esta capa no sabe QUIÉN guarda: recibe un "almacén remoto" y lo usa. Así el
 * juego entero se puede probar sin servidor, y el día que se cambie de servicio
 * no hay que tocar nada más que esto.
 */

export interface AlmacenRemoto {
  descargar(): Promise<Progreso | null>
  subir(progreso: Progreso): Promise<void>
}

/**
 * Junta lo del aparato con lo de la nube. Regla: gana lo más avanzado, no lo más
 * reciente. Si alguien juega en el móvil sin conexión y luego abre el portátil,
 * lo que no puede pasar es que pierda lecciones terminadas.
 */
export function fusionar(local: Progreso, remoto: Progreso): Progreso {
  const lecciones = { ...remoto.lecciones }
  for (const [id, datos] of Object.entries(local.lecciones)) {
    const otra = lecciones[id]
    if (!otra || datos.puntos > otra.puntos) lecciones[id] = datos
  }

  const porCalle = { ...local.porCalle }
  for (const calle of Object.keys(porCalle) as Array<keyof typeof porCalle>) {
    const a = local.porCalle[calle]
    const b = remoto.porCalle[calle]
    porCalle[calle] = a.decisiones >= b.decisiones ? a : b
  }

  const masAvanzado = local.decisiones >= remoto.decisiones ? local : remoto

  // Las notas son un historial corto: se queda el del aparato que más ha jugado,
  // porque mezclarlas inventaría un orden de manos que nunca existió.
  const notas = (local.notas ?? []).length >= (remoto.notas ?? []).length ? local.notas : remoto.notas

  return {
    ...masAvanzado,
    lecciones,
    porCalle,
    notas: notas ?? [],
    puntosTotales: Math.max(local.puntosTotales, remoto.puntosTotales),
    decisiones: Math.max(local.decisiones, remoto.decisiones),
    aciertos: Math.max(local.aciertos, remoto.aciertos),
    logros: { ...remoto.logros, ...local.logros },
    modoLibreDesbloqueado: local.modoLibreDesbloqueado || remoto.modoLibreDesbloqueado,
    // Los errores pendientes de repasar se juntan sin duplicar.
    errores: juntarErrores(local, remoto),
    actualizadoEl: new Date().toISOString(),
  }
}

function juntarErrores(local: Progreso, remoto: Progreso): Progreso['errores'] {
  const vistos = new Set<string>()
  const salida: Progreso['errores'] = []
  for (const error of [...local.errores, ...remoto.errores]) {
    const huella = `${error.leccionId}|${error.mano.mano.join(',')}|${error.mano.mesa.join(',')}`
    if (vistos.has(huella)) continue
    vistos.add(huella)
    salida.push(error)
  }
  return salida
}

export async function sincronizar(
  local: Progreso,
  almacen: AlmacenRemoto,
): Promise<{ progreso: Progreso; sincronizado: boolean }> {
  try {
    const remoto = await almacen.descargar()
    const fusionado = remoto ? fusionar(local, remoto) : local
    await almacen.subir(fusionado)
    return { progreso: fusionado, sincronizado: true }
  } catch {
    // Sin conexión no pasa nada: se sigue jugando con lo del aparato.
    return { progreso: local, sincronizado: false }
  }
}
