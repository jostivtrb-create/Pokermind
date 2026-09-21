import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Conexión con el servidor de cuentas.
 *
 * El juego funciona ENTERO sin esto: las probabilidades, los bots y la
 * corrección se calculan en el aparato. El servidor solo guarda el progreso para
 * que puedas cambiar de móvil a portátil (D11).
 *
 * Si no hay claves configuradas, `cliente` es null y el juego se queda en modo
 * local: se puede jugar igual, solo que el progreso vive en este aparato. Así el
 * proyecto se puede desarrollar y probar sin montar nada.
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const clave = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const hayServidor = Boolean(url && clave)

export const cliente: SupabaseClient | null = hayServidor
  ? createClient(url!, clave!, {
      auth: {
        // La sesión se guarda en el aparato y se renueva sola: por eso hace falta
        // internet solo la primera vez (D31).
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null
