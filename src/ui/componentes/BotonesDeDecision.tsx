import { useState } from 'react'
import type { Accion } from '../../motor/decision'
import { TOPE_PARA_TODO_IN } from '../../motor/decision'

/**
 * Los tres botones, con el tamaño de la subida elegido por el jugador.
 *
 * Antes el juego ponía un tamaño por ti. En el entrenador se aguantaba, pero en
 * una partida **el tamaño ES la decisión**: no es lo mismo apostar un cuarto del
 * bote que ir con todo, y el motor lo juzga distinto. Al pulsar "Subir" se abre
 * el abanico de tamaños, con las fichas de verdad y no porcentajes abstractos.
 */
export interface OpcionDeSubida {
  etiqueta: string
  /** Fichas por encima de lo que cuesta igualar. */
  cantidad: number
  /** Fichas que pones en total. */
  pones: number
  esTodoIn?: boolean
}

/** Los tamaños de siempre: medio bote, tres cuartos, bote entero y todo-in. */
export function tamanosParaElegir(
  bote: number,
  paraPagar: number,
  tusFichas: number,
  fichasRival: number,
): OpcionDeSubida[] {
  const tope = Math.max(0, Math.min(tusFichas - paraPagar, fichasRival))
  if (tope <= 0) return []
  const referencia = bote + paraPagar

  const crudas: Array<[string, number]> = [
    ['½ bote', referencia * 0.5],
    ['¾ bote', referencia * 0.75],
    ['Bote', referencia],
  ]

  // El todo-in solo se ofrece cuando es una jugada de verdad —fichas cortas—,
  // igual que hace el motor al juzgar. Si el juego ofreciera un botón que luego
  // no sabe puntuar bien, estaría enseñando mal.
  const todoInTieneSentido = tope <= TOPE_PARA_TODO_IN * referencia

  const opciones: OpcionDeSubida[] = []
  for (const [etiqueta, cruda] of crudas) {
    const cantidad = Math.round(Math.min(cruda, tope))
    if (cantidad <= 0) continue
    if (cantidad >= tope && todoInTieneSentido) continue
    if (opciones.some((o) => o.cantidad === cantidad)) continue
    opciones.push({ etiqueta, cantidad, pones: cantidad + paraPagar })
  }
  if (todoInTieneSentido) {
    opciones.push({
      etiqueta: 'Todo-in',
      cantidad: Math.round(tope),
      pones: Math.round(tope) + paraPagar,
      esTodoIn: true,
    })
  }
  return opciones
}

export function BotonesDeDecision({
  paraPagar,
  opcionesDeSubida,
  alDecidir,
}: {
  paraPagar: number
  opcionesDeSubida: OpcionDeSubida[]
  alDecidir: (accion: Accion, tamano?: number) => void
}) {
  const [eligiendoTamano, setEligiendoTamano] = useState(false)

  if (eligiendoTamano && opcionesDeSubida.length > 0) {
    return (
      <div style={{ marginTop: 16, display: 'grid', gap: 9 }}>
        <span className="etiqueta">¿Cuánto subes?</span>
        {opcionesDeSubida.map((opcion) => (
          <button
            key={opcion.etiqueta}
            className="accion subir"
            style={{ flexDirection: 'row', justifyContent: 'space-between', padding: '13px 16px' }}
            onClick={() => {
              setEligiendoTamano(false)
              alDecidir('subir', opcion.cantidad)
            }}
          >
            <span>{opcion.esTodoIn ? '⚡ Todo-in' : `↗ ${opcion.etiqueta}`}</span>
            <span className="sub" style={{ fontSize: 13 }}>
              pones {opcion.pones.toLocaleString('es')}
            </span>
          </button>
        ))}
        <button className="boton" onClick={() => setEligiendoTamano(false)}>
          ← Volver
        </button>
      </div>
    )
  }

  return (
    <div className="acciones">
      <button className="accion retirarse" onClick={() => alDecidir('retirarse')}>
        <span>✕ {paraPagar === 0 ? 'Pasar' : 'Retirarse'}</span>
        <span className="sub">{paraPagar === 0 ? 'Sin poner nada' : 'Sales de la mano'}</span>
      </button>
      <button className="accion pagar" onClick={() => alDecidir('pagar')}>
        <span>≡ {paraPagar === 0 ? 'Pasar' : 'Pagar'}</span>
        <span className="sub">{paraPagar > 0 ? `Pones ${paraPagar.toLocaleString('es')}` : 'Gratis'}</span>
      </button>
      <button
        className="accion subir"
        disabled={opcionesDeSubida.length === 0}
        onClick={() => setEligiendoTamano(true)}
      >
        <span>↗ Subir</span>
        <span className="sub">{opcionesDeSubida.length > 0 ? 'Eliges cuánto' : 'Sin fichas'}</span>
      </button>
    </div>
  )
}
