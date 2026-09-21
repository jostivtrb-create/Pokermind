import type { Progreso } from '../juego/progreso'
import type { AlmacenRemoto } from './sincronizacion'
import { cliente, hayServidor } from './supabase'

/**
 * Cuentas: registrarse, entrar, salir, recuperar la contraseña y borrarlo todo.
 *
 * Decisión D31: la cuenta es obligatoria, pero solo hace falta internet la
 * primera vez. Después la sesión queda guardada en el aparato y se juega sin
 * conexión; el progreso sube cuando vuelve la red.
 *
 * D30: recuperar contraseña y borrar la cuenta no son opcionales si el juego
 * sale a internet, así que están desde el primer día.
 */

export interface Usuario {
  id: string
  correo: string
}

export interface ResultadoCuenta {
  ok: boolean
  /** Mensaje para enseñar al jugador, en español y sin jerga técnica. */
  mensaje?: string
}

const TABLA = 'progreso'

export async function usuarioActual(): Promise<Usuario | null> {
  if (!cliente) return null
  const { data } = await cliente.auth.getSession()
  const usuario = data.session?.user
  return usuario ? { id: usuario.id, correo: usuario.email ?? '' } : null
}

export async function registrar(correo: string, contrasena: string): Promise<ResultadoCuenta> {
  if (!cliente) return { ok: false, mensaje: 'El servidor de cuentas todavía no está configurado.' }
  const { error } = await cliente.auth.signUp({ email: correo, password: contrasena })
  if (error) return { ok: false, mensaje: traducirError(error.message) }
  return { ok: true, mensaje: 'Cuenta creada. Revisa tu correo si te pedimos confirmarla.' }
}

export async function entrar(correo: string, contrasena: string): Promise<ResultadoCuenta> {
  if (!cliente) return { ok: false, mensaje: 'El servidor de cuentas todavía no está configurado.' }
  const { error } = await cliente.auth.signInWithPassword({ email: correo, password: contrasena })
  if (error) return { ok: false, mensaje: traducirError(error.message) }
  return { ok: true }
}

export async function salir(): Promise<void> {
  await cliente?.auth.signOut()
}

export async function recuperarContrasena(correo: string): Promise<ResultadoCuenta> {
  if (!cliente) return { ok: false, mensaje: 'El servidor de cuentas todavía no está configurado.' }
  const { error } = await cliente.auth.resetPasswordForEmail(correo, {
    redirectTo: `${location.origin}/`,
  })
  if (error) return { ok: false, mensaje: traducirError(error.message) }
  return { ok: true, mensaje: 'Te hemos mandado un correo para poner una contraseña nueva.' }
}

/**
 * Borrar la cuenta. La fila del progreso se borra desde aquí; el usuario en sí
 * lo borra una función del servidor, porque desde el navegador no se puede (y no
 * debe poderse).
 */
export async function borrarCuenta(): Promise<ResultadoCuenta> {
  if (!cliente) return { ok: false, mensaje: 'El servidor de cuentas todavía no está configurado.' }
  const usuario = await usuarioActual()
  if (!usuario) return { ok: false, mensaje: 'No hay ninguna sesión abierta.' }

  const { error } = await cliente.from(TABLA).delete().eq('usuario', usuario.id)
  if (error) return { ok: false, mensaje: traducirError(error.message) }

  const { error: errorFuncion } = await cliente.functions.invoke('borrar-cuenta')
  if (errorFuncion) {
    await salir()
    return {
      ok: true,
      mensaje: 'Tu progreso se ha borrado y se ha cerrado la sesión. La cuenta se eliminará del todo en unos minutos.',
    }
  }
  await salir()
  return { ok: true, mensaje: 'Cuenta y progreso borrados.' }
}

/** El almacén remoto que usa la sincronización (`sincronizacion.ts`). */
export const almacenDeLaCuenta: AlmacenRemoto = {
  async descargar() {
    if (!cliente) return null
    const usuario = await usuarioActual()
    if (!usuario) return null
    const { data, error } = await cliente.from(TABLA).select('datos').eq('usuario', usuario.id).maybeSingle()
    if (error || !data) return null
    return data.datos as Progreso
  },

  async subir(progreso: Progreso) {
    if (!cliente) return
    const usuario = await usuarioActual()
    if (!usuario) return
    const { error } = await cliente
      .from(TABLA)
      .upsert({ usuario: usuario.id, datos: progreso, actualizado: new Date().toISOString() })
    if (error) throw new Error(error.message)
  },
}

export { hayServidor }

/** Los mensajes de error vienen en inglés y de poco sirven tal cual. */
function traducirError(mensaje: string): string {
  const m = mensaje.toLowerCase()
  if (m.includes('invalid login')) return 'El correo o la contraseña no son correctos.'
  if (m.includes('already registered')) return 'Ya hay una cuenta con ese correo. Prueba a entrar.'
  if (m.includes('password') && m.includes('6')) return 'La contraseña tiene que tener al menos 6 caracteres.'
  if (m.includes('email')) return 'Ese correo no parece válido.'
  if (m.includes('failed to fetch') || m.includes('network')) {
    return 'No hay conexión. Si ya habías entrado antes, puedes seguir jugando igual.'
  }
  return 'No se ha podido completar. Inténtalo otra vez en un momento.'
}
