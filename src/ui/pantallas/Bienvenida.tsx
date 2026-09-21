import { Pica } from '../App'
import { Carta } from '../componentes/Carta'
import { deCodigo } from '../../motor/cartas'
import type { Nivel } from '../../juego/progreso'
import { MODULO_DE_ENTRADA } from '../../juego/progreso'
import { TEMARIO } from '../../contenido/temario'

/**
 * Lo primero que se ve al entrar: por dónde empiezas.
 *
 * Sale del primer contacto real del usuario con el juego: *"me lo imagino más
 * como entrar, iniciar, y ahí ya te dice qué nivel de póker tienes"*. Tres
 * botones y a jugar. Nada de leer antes de tocar.
 */
const OPCIONES: Array<{ nivel: Nivel; titulo: string; detalle: string; icono: string }> = [
  {
    nivel: 'cero',
    icono: '🌱',
    titulo: 'No sé nada de póker',
    detalle: 'Empezamos por las cartas: cuál vale más, qué es una pareja, cómo se juega una mano.',
  },
  {
    nivel: 'reglas',
    icono: '📘',
    titulo: 'Sé las reglas, pero no sé jugar bien',
    detalle: 'Te saltas lo básico y empiezas por lo que de verdad decide: probabilidades y cuándo pagar.',
  },
  {
    nivel: 'intermedio',
    icono: '📈',
    titulo: 'Ya juego y quiero jugar mejor',
    detalle: 'Directo a posición, rangos, leer al rival y sacarle el máximo a cada mano.',
  },
]

export function Bienvenida({ alElegir }: { alElegir: (nivel: Nivel) => void }) {
  return (
    <div style={{ maxWidth: 520, margin: '0 auto', display: 'grid', gap: 18 }}>
      <div style={{ textAlign: 'center', paddingTop: 12 }}>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', alignItems: 'center' }}>
          <Pica tamano={30} />
          <h1 style={{ margin: 0 }}>
            Poker<span className="marca-mente">Mind</span>
          </h1>
        </div>
        <p style={{ color: 'var(--morado-claro)', fontWeight: 600, margin: '4px 0 0' }}>
          Piensa. Decide. Mejora.
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', margin: '16px 0 4px' }}>
          <div style={{ transform: 'rotate(-8deg)' }}><Carta carta={deCodigo('As')} /></div>
          <div style={{ transform: 'rotate(6deg)' }}><Carta carta={deCodigo('Kh')} /></div>
        </div>
      </div>

      <div>
        <h2 style={{ textAlign: 'center', fontSize: 19 }}>¿Cuánto sabes de póker?</h2>
        <p className="suave" style={{ textAlign: 'center', fontSize: 14, marginTop: -4 }}>
          Para no hacerte perder el tiempo con lo que ya sabes.
        </p>
      </div>

      <div style={{ display: 'grid', gap: 10 }}>
        {OPCIONES.map((opcion) => {
          const desde = MODULO_DE_ENTRADA[opcion.nivel]
          const modulo = TEMARIO.find((m) => m.numero === desde)
          return (
            <button
              key={opcion.nivel}
              className="tarjeta"
              style={{ textAlign: 'left', cursor: 'pointer', display: 'grid', gap: 4 }}
              onClick={() => alElegir(opcion.nivel)}
            >
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 20 }}>{opcion.icono}</span>
                <strong style={{ fontSize: 16 }}>{opcion.titulo}</strong>
              </div>
              <span className="suave" style={{ fontSize: 13.5 }}>{opcion.detalle}</span>
              {modulo && (
                <span className="tenue" style={{ fontSize: 12.5 }}>
                  Empiezas en: {modulo.titulo}
                </span>
              )}
            </button>
          )
        })}

        <div className="tarjeta tenue" style={{ opacity: 0.6, display: 'grid', gap: 4 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 20 }}>👑</span>
            <strong style={{ fontSize: 16 }}>Avanzado</strong>
            <span className="chip" style={{ marginLeft: 'auto' }}>Pronto</span>
          </div>
          <span className="suave" style={{ fontSize: 13.5 }}>
            Equilibrio, tamaños de apuesta y juego contra rivales que también piensan.
          </span>
        </div>
      </div>

      <p className="tenue" style={{ fontSize: 12.5, textAlign: 'center' }}>
        Te equivoques o no eligiendo, da igual: puedes cambiarlo cuando quieras desde Ajustes, y lo
        anterior a tu nivel queda abierto por si te apetece repasarlo.
      </p>
    </div>
  )
}
