import { useMemo } from 'react'
import type { Carta } from '../../motor/cartas'
import { textoCartas } from '../../motor/evaluador'
import type { Rango } from '../../motor/rangos'
import { claseDeMano } from '../../motor/clases'
import { quitarBloqueadas, repartirEnTramos } from '../../motor/rangos'

/**
 * Qué podía tener el rival (D26).
 *
 * Si el motor ya calcula contra su rango, enseñarlo al terminar la mano sale
 * gratis — y es justo el salto de "juego mis cartas" a "juego la partida".
 */
export function RangoDelRival({
  nombre,
  rango,
  mesa,
  vistas,
}: {
  /** De quién es el rango: con tres rivales, "su rango" no dice nada. */
  nombre: string
  rango: Rango
  mesa: readonly Carta[]
  vistas: readonly Carta[]
}) {
  const tramos = useMemo(() => {
    const limpio = quitarBloqueadas(rango, vistas)
    const { fuerte, medio, flojo } = repartirEnTramos(limpio, mesa)
    const total = fuerte.length + medio.length + flojo.length || 1

    /*
      Una misma clase puede caer en dos tramos, y es correcto: QQ con un trébol
      en una mesa con dos tréboles vale más que QQ sin él. Pero en los ejemplos
      confunde muchísimo ver "QQ" en fuertes y en medias a la vez, así que cada
      clase se enseña solo donde tiene MÁS manos. Lo detectaron dos personas
      leyendo la misma pantalla, señal de que confundía de verdad.
    */
    const cuenta = new Map<string, [number, number, number]>()
    const contar = (combos: typeof fuerte, tramo: 0 | 1 | 2) => {
      for (const combo of combos) {
        const clase = claseDeMano(combo.a, combo.b)
        const fila = cuenta.get(clase) ?? [0, 0, 0]
        fila[tramo] += 1
        cuenta.set(clase, fila)
      }
    }
    contar(fuerte, 0)
    contar(medio, 1)
    contar(flojo, 2)

    const ejemplos = (tramo: 0 | 1 | 2, orden: typeof fuerte) => {
      const vistos = new Set<string>()
      const salida: string[] = []
      for (const combo of orden) {
        const clase = claseDeMano(combo.a, combo.b)
        if (vistos.has(clase)) continue
        vistos.add(clase)
        const fila = cuenta.get(clase)!
        const suTramo = fila.indexOf(Math.max(...fila))
        if (suTramo === tramo) salida.push(clase)
        if (salida.length >= 6) break
      }
      return salida
    }

    return {
      total,
      fuerte: { n: fuerte.length, ejemplos: ejemplos(0, fuerte), muestra: fuerte.slice(0, 2) },
      medio: { n: medio.length, ejemplos: ejemplos(1, medio) },
      flojo: { n: flojo.length, ejemplos: ejemplos(2, flojo) },
    }
  }, [rango, mesa, vistas])

  const pc = (n: number) => Math.round((n / tramos.total) * 100)

  return (
    <div className="tarjeta">
      <span className="etiqueta">Qué podía tener {nombre}</span>
      <p className="suave" style={{ fontSize: 13.5, margin: '6px 0 12px' }}>
        Por cómo jugó la mano, el rango de {nombre} eran {rango.descripcion}. Repartido por lo bien
        que le viene esta mesa:
      </p>

      {([
        ['Manos fuertes', tramos.fuerte, 'var(--rojo)'],
        ['Manos medias', tramos.medio, 'var(--ambar)'],
        ['Manos flojas', tramos.flojo, 'var(--verde)'],
      ] as const).map(([nombre, tramo, color]) => (
        <div key={nombre} style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', fontSize: 14 }}>
            <strong style={{ color }}>{nombre}</strong>
            <span className="tenue">{pc(tramo.n)}% de su rango</span>
          </div>
          <div className="carril" style={{ height: 6, background: 'rgba(255,255,255,0.07)', borderRadius: 999, margin: '4px 0' }}>
            <div style={{ width: `${pc(tramo.n)}%`, height: '100%', background: color, borderRadius: 999 }} />
          </div>
          {tramo.ejemplos.length > 0 && (
            <span className="tenue" style={{ fontSize: 12.5 }}>
              por ejemplo: {tramo.ejemplos.join(', ')}
            </span>
          )}
        </div>
      ))}

      {tramos.fuerte.muestra.length > 0 && mesa.length > 0 && (
        <p className="tenue" style={{ fontSize: 12.5, margin: '10px 0 0' }}>
          Lo mejor que podía llevar {nombre} aquí era algo como {textoCartas([tramos.fuerte.muestra[0].a, tramos.fuerte.muestra[0].b])}.
        </p>
      )}
    </div>
  )
}
