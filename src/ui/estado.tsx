import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { guardarProgreso, leerProgreso } from '../almacen/local'
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
}

const ContextoProgreso = createContext<Contexto | null>(null)

export function ProveedorDeProgreso({ children }: { children: ReactNode }) {
  const [progreso, setProgreso] = useState<Progreso>(() => leerProgreso())

  const actualizar = useCallback((cambio: (anterior: Progreso) => Progreso) => {
    setProgreso((anterior) => {
      const nuevo = cambio(anterior)
      guardarProgreso(nuevo)
      return nuevo
    })
  }, [])

  const valor = useMemo(() => ({ progreso, actualizar }), [progreso, actualizar])
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
