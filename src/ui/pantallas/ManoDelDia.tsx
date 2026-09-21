import { useMemo, useState } from 'react'
import { crearAleatorio } from '../../motor/aleatorio'
import { LECCION_REPASO, LECCION_RETO, fechaDeHoy, manoDelDia } from '../../juego/retoDiario'
import { erroresParaRepasar, repasarError, variarMano } from '../../juego/progreso'
import { useProgreso } from '../estado'
import { Entrenador } from './Entrenador'

/**
 * Dos cosas que no son el curso pero enseñan tanto como él: el reto del día
 * (D29) y el repaso de las manos que fallaste (D15).
 */
export function RetoDelDia({ alSalir }: { alSalir: () => void }) {
  const { progreso, actualizar } = useProgreso()
  const hoy = fechaDeHoy()
  const mano = useMemo(() => manoDelDia(), [])
  // Se mira UNA vez al entrar. Si se mirara en cada pintada, al responder se
  // anotaría el reto y la pantalla saltaría al "ya jugado" sin enseñar la
  // corrección, que es justo la parte que enseña algo.
  const [yaJugado] = useState(() => progreso.retoDiario?.fecha === hoy)

  if (yaJugado) {
    return (
      <div style={{ display: 'grid', gap: 14 }}>
        <button className="boton" style={{ padding: '8px 14px', justifySelf: 'start' }} onClick={alSalir}>← Volver</button>
        <div className="tarjeta" style={{ textAlign: 'center', padding: 26 }}>
          <div style={{ fontSize: 30 }}>✓</div>
          <h2>Ya jugaste el reto de hoy</h2>
          <p className="suave">Sacaste {progreso.retoDiario?.puntos} puntos. Mañana hay otra mano.</p>
          <p className="tenue" style={{ fontSize: 13 }}>
            Es la misma mano para todo el mundo: sale de la fecha, no del azar.
          </p>
          <button className="boton principal" onClick={alSalir}>Volver</button>
        </div>
      </div>
    )
  }

  return (
    <Entrenador
      leccion={LECCION_RETO}
      manoSuelta={mano}
      alSalir={alSalir}
      alTerminarManoSuelta={(_acertada, puntos) =>
        actualizar((p) => ({ ...p, retoDiario: { fecha: hoy, puntos } }))
      }
    />
  )
}

export function RepasoDeErrores({ alSalir }: { alSalir: () => void }) {
  const { progreso, actualizar } = useProgreso()
  const [indice, setIndice] = useState(0)
  const pendientes = useMemo(() => erroresParaRepasar(progreso), [progreso.errores.length])
  const azar = useMemo(() => crearAleatorio(Date.now() & 0xffff), [])

  if (pendientes.length === 0 || indice >= pendientes.length) {
    return (
      <div style={{ display: 'grid', gap: 14 }}>
        <button className="boton" style={{ padding: '8px 14px', justifySelf: 'start' }} onClick={alSalir}>← Volver</button>
        <div className="tarjeta" style={{ textAlign: 'center', padding: 26 }}>
          <div style={{ fontSize: 30 }}>🔁</div>
          <h2>{indice > 0 ? 'Repaso terminado' : 'No hay nada que repasar'}</h2>
          <p className="suave">
            Las manos que falles volverán dentro de unos días, cambiadas de palo, para comprobar que
            entendiste el motivo y no memorizaste la respuesta.
          </p>
          <button className="boton principal" onClick={alSalir}>Volver</button>
        </div>
      </div>
    )
  }

  const error = pendientes[indice]
  const mano = variarMano(error.mano, azar)

  return (
    <Entrenador
      key={indice}
      leccion={LECCION_REPASO}
      manoSuelta={mano}
      alSalir={() => setIndice((i) => i + 1)}
      alTerminarManoSuelta={(acertada) => {
        const posicionReal = progreso.errores.indexOf(error)
        if (posicionReal >= 0) actualizar((p) => repasarError(p, posicionReal, acertada))
      }}
    />
  )
}
