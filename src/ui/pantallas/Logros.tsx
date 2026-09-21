import { useState } from 'react'
import { LOGROS, logroConseguido } from '../../juego/logros'
import { useProgreso } from '../estado'

const GRUPOS = [
  { id: 'todos', nombre: 'Todos' },
  { id: 'probabilidades', nombre: 'Curso' },
  { id: 'decisiones', nombre: 'Decisiones' },
  { id: 'constancia', nombre: 'Constancia' },
] as const

export function Logros() {
  const { progreso } = useProgreso()
  const [grupo, setGrupo] = useState<(typeof GRUPOS)[number]['id']>('todos')
  const lista = LOGROS.filter((l) => grupo === 'todos' || l.grupo === grupo)
  const conseguidos = LOGROS.filter((l) => logroConseguido(l, progreso)).length

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div>
        <h1>Logros</h1>
        <p className="suave">{conseguidos} de {LOGROS.length} conseguidos. Ninguno se consigue teniendo suerte.</p>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {GRUPOS.map((g) => (
          <button
            key={g.id}
            className="chip"
            style={grupo === g.id ? { background: 'var(--morado)', color: '#fff', borderColor: 'transparent' } : undefined}
            onClick={() => setGrupo(g.id)}
          >
            {g.nombre}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gap: 10 }}>
        {lista.map((logro) => {
          const avance = logro.avance(progreso)
          const hecho = avance >= 1
          return (
            <div key={logro.id} className="tarjeta" style={{ opacity: hecho ? 1 : 0.85 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: 40, height: 40, borderRadius: 12, display: 'grid', placeItems: 'center',
                    fontSize: 19, flexShrink: 0,
                    background: hecho ? 'var(--verde-tenue)' : 'var(--superficie-2)',
                  }}
                >
                  {hecho ? logro.icono : '🔒'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <strong>{logro.nombre}</strong>
                    {hecho && <span className="chip" style={{ color: 'var(--verde)' }}>✓</span>}
                    {logro.marcador && (
                      <span className="tenue" style={{ marginLeft: 'auto', fontSize: 13 }}>
                        {logro.marcador(progreso)}
                      </span>
                    )}
                  </div>
                  <p className="suave" style={{ fontSize: 13.5, margin: '2px 0 8px' }}>{logro.descripcion}</p>
                  <div className="progreso-fino"><div style={{ width: `${Math.round(avance * 100)}%` }} /></div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
