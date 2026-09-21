import { useState } from 'react'
import { ProveedorDeProgreso, useProgreso } from './estado'
import { Inicio } from './pantallas/Inicio'
import { Jugar } from './pantallas/Jugar'
import { Libre } from './pantallas/Libre'
import { Estadisticas } from './pantallas/Estadisticas'
import { Logros } from './pantallas/Logros'
import { Configuracion } from './pantallas/Configuracion'
import { Guia } from './pantallas/Guia'

export type Pantalla = 'inicio' | 'jugar' | 'libre' | 'estadisticas' | 'logros' | 'configuracion' | 'guia'

const NAVEGACION: Array<{ id: Pantalla; nombre: string; icono: string }> = [
  { id: 'inicio', nombre: 'Inicio', icono: '⌂' },
  { id: 'jugar', nombre: 'Jugar', icono: '▶' },
  { id: 'estadisticas', nombre: 'Estadísticas', icono: '▥' },
  { id: 'logros', nombre: 'Logros', icono: '♛' },
  { id: 'configuracion', nombre: 'Ajustes', icono: '⚙' },
]

export function App() {
  return (
    <ProveedorDeProgreso>
      <Marco />
    </ProveedorDeProgreso>
  )
}

function Marco() {
  const [pantalla, setPantalla] = useState<Pantalla>('inicio')
  const { progreso } = useProgreso()

  return (
    <div className="app">
      <nav className="lateral" aria-label="Navegación">
        <div className="marca">
          <Pica />
          <span>
            Poker<span className="marca-mente">Mind</span>
          </span>
        </div>
        {NAVEGACION.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${pantalla === item.id ? 'activa' : ''}`}
            onClick={() => setPantalla(item.id)}
            aria-current={pantalla === item.id ? 'page' : undefined}
          >
            <span className="icono" aria-hidden>{item.icono}</span>
            <span>{item.nombre}</span>
          </button>
        ))}
        <div style={{ marginTop: 'auto' }}>
          <div className="tarjeta tenue" style={{ textAlign: 'center', padding: 16 }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>🧠</div>
            <div style={{ fontSize: 13, color: 'var(--texto-suave)' }}>
              Mejores decisiones.<br />Mejores resultados.
            </div>
          </div>
        </div>
      </nav>

      <main className="contenido">
        <div className="cabecera-movil">
          <div className="marca" style={{ margin: 0, padding: 0, fontSize: 17 }}>
            <Pica />
            <span>
              Poker<span className="marca-mente">Mind</span>
            </span>
          </div>
          {progreso.puntosTotales > 0 && (
            <span className="chip morado">★ {progreso.puntosTotales.toLocaleString('es')}</span>
          )}
        </div>

        {pantalla === 'inicio' && <Inicio ir={setPantalla} />}
        {pantalla === 'jugar' && <Jugar ir={setPantalla} />}
        {pantalla === 'libre' && <Libre ir={setPantalla} />}
        {pantalla === 'estadisticas' && <Estadisticas />}
        {pantalla === 'logros' && <Logros />}
        {pantalla === 'configuracion' && <Configuracion ir={setPantalla} />}
        {pantalla === 'guia' && <Guia />}
      </main>

      <nav className="inferior" aria-label="Navegación">
        {NAVEGACION.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${pantalla === item.id ? 'activa' : ''}`}
            style={{ flex: 1 }}
            onClick={() => setPantalla(item.id)}
          >
            <span className="icono" aria-hidden>{item.icono}</span>
            <span>{item.nombre}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

/** La pica del logo, dibujada para que no dependa de ninguna imagen. */
export function Pica({ tamano = 22 }: { tamano?: number }) {
  return (
    <svg width={tamano} height={tamano} viewBox="0 0 24 24" aria-hidden focusable="false">
      <path
        d="M12 2C9.5 6 3.5 9 3.5 13.6 3.5 16.6 5.8 18.6 8.4 18.6c1.3 0 2.5-.5 3.1-1.3-.3 2.2-1.2 3.6-2.6 4.4h6.2c-1.4-.8-2.3-2.2-2.6-4.4.6.8 1.8 1.3 3.1 1.3 2.6 0 4.9-2 4.9-5C20.5 9 14.5 6 12 2z"
        fill="var(--morado-claro)"
      />
    </svg>
  )
}
