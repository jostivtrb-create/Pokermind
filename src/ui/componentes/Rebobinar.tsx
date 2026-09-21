import type { Analisis } from '../../motor/decision'
import { etiquetaDeAccion } from '../../motor/decision'

/**
 * Rebobinar la mano (D27): qué habría pasado con cada una de las tres
 * decisiones, **en fichas y a la larga**, no según la carta que salió.
 *
 * Es la diferencia entre "te habría salido bien" y "era mejor jugada". Lo
 * segundo es lo único que se puede aprender.
 */
export function Rebobinar({ analisis, elegida }: { analisis: Analisis; elegida: string }) {
  const mejor = analisis.mejor.valorEsperado

  return (
    <div className="tarjeta">
      <span className="etiqueta">¿Y si hubieras hecho otra cosa?</span>
      <p className="suave" style={{ fontSize: 13.5, margin: '6px 0 12px' }}>
        Lo que gana o pierde cada decisión <strong>de media</strong>, jugando esta misma situación
        muchas veces. No es lo que habría pasado esta vez: es lo que pasa a la larga.
      </p>

      <div style={{ display: 'grid', gap: 8 }}>
        {analisis.acciones.map((accion, i) => {
          const etiqueta = mayuscula(etiquetaDeAccion(accion))
          const esLaTuya = accion.accion === elegida
          const esLaMejor = accion === analisis.mejor
          const diferencia = accion.valorEsperado - mejor
          return (
            <div
              key={i}
              className="silla"
              style={{
                borderColor: esLaMejor ? 'var(--verde)' : esLaTuya ? 'var(--morado)' : undefined,
                alignItems: 'flex-start',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <div style={{ display: 'flex', width: '100%', gap: 8, alignItems: 'center' }}>
                <strong>{etiqueta}</strong>
                {esLaMejor && <span className="chip" style={{ color: 'var(--verde)' }}>la mejor</span>}
                {esLaTuya && <span className="chip morado">la tuya</span>}
                <span style={{ marginLeft: 'auto', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                  {accion.valorEsperado >= 0 ? '+' : '−'}
                  {Math.abs(Math.round(accion.valorEsperado)).toLocaleString('es')}
                </span>
              </div>
              <span className="tenue" style={{ fontSize: 12.5 }}>
                {accion.desglose}
                {!esLaMejor && diferencia < -0.5 && ` Cuesta ${Math.abs(Math.round(diferencia))} fichas respecto a la mejor.`}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function mayuscula(texto: string): string {
  return texto[0].toUpperCase() + texto.slice(1)
}
