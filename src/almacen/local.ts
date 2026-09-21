import type { Progreso } from '../juego/progreso'
import { VERSION_PROGRESO, progresoNuevo } from '../juego/progreso'

/**
 * Guardado en el aparato. Es la fuente de la verdad mientras se juega, porque el
 * juego tiene que funcionar sin conexión (D18/D31): se guarda aquí siempre y se
 * sincroniza con la cuenta cuando hay internet.
 *
 * Tocar `localStorage` puede lanzar excepción (ventana privada, permisos, visor
 * dentro de otra app). Si falla, el juego sigue: se pierde el guardado, no la
 * partida.
 */

const CLAVE = 'pokermind.progreso.v1'
const CLAVE_PENDIENTE = 'pokermind.pendiente-de-sincronizar'

export function leerProgreso(): Progreso {
  try {
    const crudo = localStorage.getItem(CLAVE)
    if (!crudo) return progresoNuevo()
    const datos = JSON.parse(crudo) as Progreso
    return migrar(datos)
  } catch {
    return progresoNuevo()
  }
}

export function guardarProgreso(progreso: Progreso): void {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(progreso))
    localStorage.setItem(CLAVE_PENDIENTE, '1')
  } catch {
    /* sin guardado: el juego sigue funcionando igual */
  }
}

export function hayCambiosSinSincronizar(): boolean {
  try {
    return localStorage.getItem(CLAVE_PENDIENTE) === '1'
  } catch {
    return false
  }
}

export function marcarSincronizado(): void {
  try {
    localStorage.removeItem(CLAVE_PENDIENTE)
  } catch {
    /* da igual */
  }
}

export function borrarTodo(): void {
  try {
    localStorage.removeItem(CLAVE)
    localStorage.removeItem(CLAVE_PENDIENTE)
  } catch {
    /* da igual */
  }
}

/**
 * Sube el progreso guardado a la versión actual. Existe desde el primer día a
 * propósito: el día que cambie el formato, nadie pierde su progreso.
 */
function migrar(datos: Progreso): Progreso {
  const base = progresoNuevo()
  if (!datos || typeof datos !== 'object') return base
  return {
    ...base,
    ...datos,
    version: VERSION_PROGRESO,
    porCalle: { ...base.porCalle, ...(datos.porCalle ?? {}) },
    ajustes: { ...base.ajustes, ...(datos.ajustes ?? {}) },
    errores: Array.isArray(datos.errores) ? datos.errores : [],
    logros: datos.logros ?? {},
  }
}
