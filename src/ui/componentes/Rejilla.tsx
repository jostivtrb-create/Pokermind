import { useMemo } from 'react'
import { CLASES_PREFLOP } from '../../motor/clases'
import { clasesDelRango, parsearRango, porcentajeDeRango } from '../../motor/rangos'

/**
 * La rejilla de 13×13 con las 169 manos iniciales, con las del rango pintadas.
 *
 * Es la forma en que se miran los rangos en el póker de verdad, y de un vistazo
 * dice lo que tres párrafos no consiguen: cuántas manos son, cuáles y qué forma
 * tiene el conjunto. En la diagonal van las parejas, arriba las del mismo palo
 * y abajo las de distinto.
 */
export function RejillaDeRango({ rango }: { rango: string }) {
  const { dentro, porcentaje } = useMemo(() => {
    const r = parsearRango(rango)
    return { dentro: clasesDelRango(r), porcentaje: porcentajeDeRango(r) }
  }, [rango])

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(13, 1fr)',
          gap: 2,
          maxWidth: 380,
        }}
      >
        {CLASES_PREFLOP.map((clase) => {
          const entra = dentro.has(clase)
          const pareja = clase.length === 2
          return (
            <div
              key={clase}
              title={clase}
              style={{
                aspectRatio: '1', display: 'grid', placeItems: 'center',
                fontSize: 8.5, fontWeight: 600, borderRadius: 3,
                background: entra
                  ? pareja
                    ? 'var(--morado)'
                    : 'var(--morado-oscuro)'
                  : 'rgba(255,255,255,0.05)',
                color: entra ? '#fff' : 'var(--texto-tenue)',
                border: pareja ? '1px solid rgba(255,255,255,0.22)' : '1px solid transparent',
              }}
            >
              {clase}
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <span className="chip morado">{Math.round(porcentaje * 100)}% de las manos</span>
        <span className="tenue" style={{ fontSize: 12 }}>
          Diagonal: parejas · arriba: mismo palo · abajo: distinto palo
        </span>
      </div>
    </div>
  )
}
