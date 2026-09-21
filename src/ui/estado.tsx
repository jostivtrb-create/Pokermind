import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { almacenDeLaCuenta, hayServidor, usuarioActual } from '../almacen/cuenta'
import { guardarProgreso, hayCambiosSinSincronizar, leerProgreso, marcarSincronizado } from '../almacen/local'
import { sincronizar } from '../almacen/sincronizacion'
import type { Progreso } from '../juego/progreso'

/**
 * El progreso del jugador, disponible en toda la aplicación.
 *
 * Se guarda en el aparato en cuanto cambia: si el juego se cierra a mitad de una
 * lección, al volver está todo. La sincronización con la cuenta va aparte
 * (`almacen/sincronizacion.ts`), precisamente para que jugar no dependa de ella.
 */
interface Contexto {
  progreso: Progreso
  actualizar: (cambio: (anterior: Progreso) => Progreso) => void
  /** Sube y baja el progreso de la cuenta. No falla nunca: sin red, no hace nada. */
  sincronizarAhora: () => Promise<void>
  sincronizando: boolean
}

const ContextoProgreso = createContext<Contexto | null>(null)

export function ProveedorDeProgreso({ children }: { children: ReactNode }) {
  const [progreso, setProgreso] = useState<Progreso>(() => leerProgreso())
  const [sincronizando, setSincronizando] = useState(false)

  const actualizar = useCallback((cambio: (anterior: Progreso) => Progreso) => {
    setProgreso((anterior) => {
      const nuevo = cambio(anterior)
      guardarProgreso(nuevo)
      return nuevo
    })
  }, [])

  const sincronizarAhora = useCallback(async () => {
    if (!hayServidor) return
    if (!(await usuarioActual())) return
    setSincronizando(true)
    const actual = leerProgreso()
    const { progreso: fusionado, sincronizado } = await sincronizar(actual, almacenDeLaCuenta)
    if (sincronizado) {
      guardarProgreso(fusionado)
      marcarSincronizado()
      setProgreso(fusionado)
    }
    setSincronizando(false)
  }, [])

  // Al abrir y al recuperar la conexión. Nunca bloquea el juego: si falla, se
  // sigue jugando con lo del aparato y ya se subirá (D31).
  useEffect(() => {
    void sincronizarAhora()
    const alVolverLaRed = () => {
      if (hayCambiosSinSincronizar()) void sincronizarAhora()
    }
    window.addEventListener('online', alVolverLaRed)
    return () => window.removeEventListener('online', alVolverLaRed)
  }, [sincronizarAhora])

  const valor = useMemo(
    () => ({ progreso, actualizar, sincronizarAhora, sincronizando }),
    [progreso, actualizar, sincronizarAhora, sincronizando],
  )
  return <ContextoProgreso.Provider value={valor}>{children}</ContextoProgreso.Provider>
}

export function useProgreso(): Contexto {
  const contexto = useContext(ContextoProgreso)
  if (!contexto) throw new Error('useProgreso fuera del proveedor')
  return contexto
}

/** Guarda el progreso también al cerrar la pestaña, por si acaso. */
export function useGuardadoAlSalir(progreso: Progreso) {
  useEffect(() => {
    const alSalir = () => guardarProgreso(progreso)
    window.addEventListener('pagehide', alSalir)
    return () => window.removeEventListener('pagehide', alSalir)
  }, [progreso])
}
