import type { Calle } from '../../motor/decision'
import { NOMBRES_CALLE } from '../../motor/decision'
import { mediaPorCalle, porcentajeAciertos } from '../../juego/progreso'
import { erroresParaRepasar } from '../../juego/progreso'
import { useProgreso } from '../estado'
import { Barra } from '../componentes/BarraProbabilidad'

const CALLES: Calle[] = ['preflop', 'flop', 'turn', 'river']
const COLORES: Record<Calle, string> = {
  preflop: 'var(--verde)',
  flop: 'var(--morado)',
  turn: 'var(--azul)',
  river: 'var(--rojo)',
}

export function Estadisticas() {
  const { progreso } = useProgreso()
  const aciertos = porcentajeAciertos(progreso)
  const categorias = Object.entries(progreso.categorias).sort((a, b) => b[1] - a[1]).slice(0, 6)
  const totalCategorias = categorias.reduce((t, [, n]) => t + n, 0) || 1
  const porRepasar = erroresParaRepasar(progreso).length

  if (progreso.decisiones === 0) {
    return (
      <div>
        <h1>Tus estadísticas</h1>
        <div className="tarjeta">
          <p className="suave" style={{ margin: 0 }}>
            Aquí aparecerá tu porcentaje de aciertos, en qué calle flojeas y qué manos te salen más.
            Juega unas cuantas decisiones y vuelve.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <h1>Tus estadísticas</h1>

      <div className="rejilla tres">
        <div className="tarjeta">
          <div className="numerote">{progreso.decisiones}</div>
          <span className="etiqueta">Decisiones</span>
        </div>
        <div className="tarjeta">
          <div className="numerote" style={{ color: 'var(--verde)' }}>{Math.round(aciertos * 100)}%</div>
          <span className="etiqueta">Decisiones correctas</span>
        </div>
        <div className="tarjeta">
          <div className="numerote" style={{ color: 'var(--morado-claro)' }}>
            {progreso.puntosTotales.toLocaleString('es')}
          </div>
          <span className="etiqueta">Puntos totales</span>
        </div>
      </div>

      <div className="tarjeta">
        <h3>Rendimiento por calle</h3>
        <p className="tenue" style={{ fontSize: 13, marginTop: -6 }}>
          Dónde decides mejor y dónde se te escapan las fichas.
        </p>
        {CALLES.map((calle) => (
          <Barra
            key={calle}
            nombre={NOMBRES_CALLE[calle].replace('antes del flop', 'preflop')}
            valor={mediaPorCalle(progreso, calle)}
            color={COLORES[calle]}
          />
        ))}
      </div>

      {categorias.length > 0 && (
        <div className="tarjeta">
          <h3>Manos más comunes</h3>
          {categorias.map(([nombre, veces]) => (
            <Barra key={nombre} nombre={nombre} valor={veces / totalCategorias} />
          ))}
        </div>
      )}

      <div className="aviso info">
        <div className="titulo">💡 Repaso pendiente</div>
        <p className="suave" style={{ margin: 0, fontSize: 14 }}>
          {porRepasar > 0
            ? `Tienes ${porRepasar} ${porRepasar === 1 ? 'mano fallada' : 'manos falladas'} esperando a volver. Las manos que fallas vuelven días después, cambiadas de palo, para que aprendas el motivo y no la respuesta.`
            : 'No tienes manos pendientes de repasar. Lo que falles volverá dentro de unos días, cambiado de palo, para comprobar que lo entendiste de verdad.'}
        </p>
      </div>
    </div>
  )
}
