import { useState } from 'react'
import type { Pantalla } from '../App'
import { borrarTodo } from '../../almacen/local'
import { progresoNuevo } from '../../juego/progreso'
import { useProgreso } from '../estado'

export function Configuracion({ ir }: { ir: (p: Pantalla) => void }) {
  const { progreso, actualizar } = useProgreso()
  const [confirmando, setConfirmando] = useState(false)

  const cambiar = (clave: 'sonido' | 'animaciones') =>
    actualizar((p) => ({ ...p, ajustes: { ...p.ajustes, [clave]: !p.ajustes[clave] } }))

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <h1>Configuración</h1>

      <div className="tarjeta">
        <span className="etiqueta">Tu cuenta</span>
        <p className="suave" style={{ fontSize: 14, margin: '8px 0 0' }}>
          Ahora mismo tu progreso se guarda <strong>en este aparato</strong>. Las cuentas con correo
          y contraseña están decididas y se conectarán cuando el servidor esté montado: hará falta
          internet solo la primera vez, y después podrás jugar sin conexión.
        </p>
      </div>

      <div className="tarjeta" style={{ display: 'grid', gap: 4 }}>
        {[
          ['sonido', 'Sonido', 'Efectos al repartir y al decidir.'] as const,
          ['animaciones', 'Animaciones', 'Transiciones suaves. Quítalas si prefieres que vaya seco.'] as const,
        ].map(([clave, nombre, texto]) => (
          <button
            key={clave}
            className="silla"
            style={{ textAlign: 'left' }}
            onClick={() => cambiar(clave)}
            aria-pressed={progreso.ajustes[clave]}
          >
            <span>
              <strong>{nombre}</strong>
              <span className="tenue" style={{ fontSize: 13, display: 'block' }}>{texto}</span>
            </span>
            <span
              style={{
                width: 42, height: 24, borderRadius: 999, flexShrink: 0, position: 'relative',
                background: progreso.ajustes[clave] ? 'var(--morado)' : 'var(--superficie-2)',
                border: '1px solid var(--borde)',
              }}
            >
              <span
                style={{
                  position: 'absolute', top: 2, left: progreso.ajustes[clave] ? 20 : 2,
                  width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.15s',
                }}
              />
            </span>
          </button>
        ))}
      </div>

      <div className="tarjeta">
        <span className="etiqueta">Idioma</span>
        <p className="suave" style={{ fontSize: 14, margin: '6px 0 0' }}>
          Español. El juego está solo en español, tal y como se decidió.
        </p>
      </div>

      <button className="boton ancho" onClick={() => ir('guia')}>📖 Guía y glosario</button>

      <div className="tarjeta">
        <span className="etiqueta">Borrar mi progreso</span>
        <p className="suave" style={{ fontSize: 14, margin: '6px 0 12px' }}>
          Borra las lecciones, los puntos y las estadísticas de este aparato. No se puede deshacer.
        </p>
        {!confirmando ? (
          <button className="boton" onClick={() => setConfirmando(true)}>Borrar mi progreso</button>
        ) : (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              className="boton"
              style={{ background: 'var(--rojo-tenue)', color: 'var(--rojo)', borderColor: 'var(--rojo)' }}
              onClick={() => {
                borrarTodo()
                actualizar(() => progresoNuevo())
                setConfirmando(false)
                ir('inicio')
              }}
            >
              Sí, borrarlo todo
            </button>
            <button className="boton" onClick={() => setConfirmando(false)}>Mejor no</button>
          </div>
        )}
      </div>
    </div>
  )
}
