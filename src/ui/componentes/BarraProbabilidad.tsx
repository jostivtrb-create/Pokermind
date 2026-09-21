import type { Probabilidades } from '../../motor/equity'

const pc = (x: number) => `${Math.round(x * 100)}%`

/**
 * Las tres barras de la guía visual: victoria, empate y derrota.
 *
 * Es la pantalla más importante del juego, porque es la que convierte "me da la
 * sensación de que voy bien" en un número.
 */
export function BarrasDeProbabilidad({ probabilidades }: { probabilidades: Probabilidades }) {
  const filas: Array<[string, number, string]> = [
    ['Victoria', probabilidades.victoria, 'var(--verde)'],
    ['Empate', probabilidades.empate, 'var(--azul)'],
    ['Derrota', probabilidades.derrota, 'var(--rojo)'],
  ]
  return (
    <div>
      {filas.map(([nombre, valor, color]) => (
        <div className="barra" key={nombre}>
          <span className="nombre">{nombre}</span>
          <span className="carril">
            <span className="relleno" style={{ width: pc(valor), background: color }} />
          </span>
          <span className="cifra">{pc(valor)}</span>
        </div>
      ))}
    </div>
  )
}

/** Una barra suelta con su etiqueta, para estadísticas y resultados. */
export function Barra({ nombre, valor, color = 'var(--morado)' }: { nombre: string; valor: number; color?: string }) {
  return (
    <div className="barra">
      <span className="nombre">{nombre}</span>
      <span className="carril">
        <span className="relleno" style={{ width: pc(Math.max(0, Math.min(1, valor))), background: color }} />
      </span>
      <span className="cifra">{pc(valor)}</span>
    </div>
  )
}
