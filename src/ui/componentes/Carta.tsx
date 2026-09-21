import type { Carta as TipoCarta } from '../../motor/cartas'
import { PALOS, VALORES, paloDe, valorDe } from '../../motor/cartas'

/**
 * Una carta en pantalla. Los palos van en rojo y negro de toda la vida: se
 * descartó el mazo de cuatro colores a propósito, porque la idea es que quien
 * aprenda aquí sepa jugar en una mesa de verdad.
 */
export function Carta({
  carta,
  pequena,
  tapada,
  apagada,
  destacada,
}: {
  carta?: TipoCarta
  pequena?: boolean
  tapada?: boolean
  apagada?: boolean
  destacada?: boolean
}) {
  const clases = ['carta']
  if (pequena) clases.push('pequena')
  if (apagada) clases.push('apagada')
  if (destacada) clases.push('destacada')

  if (tapada || carta === undefined) {
    clases.push('tapada')
    return (
      <div className={clases.join(' ')} aria-label="carta tapada">
        <span className="palo">♠</span>
      </div>
    )
  }

  const palo = paloDe(carta)
  if (palo === 1 || palo === 2) clases.push('roja')
  const nombre = `${VALORES[valorDe(carta)]} de ${['picas', 'corazones', 'diamantes', 'tréboles'][palo]}`

  return (
    <div className={clases.join(' ')} aria-label={nombre} title={nombre}>
      <span className="valor">{VALORES[valorDe(carta)]}</span>
      <span className="palo">{PALOS[palo]}</span>
    </div>
  )
}

export function FilaDeCartas({
  cartas,
  huecos = 0,
  pequenas,
  destacadas,
}: {
  cartas: readonly TipoCarta[]
  /** Cartas por salir, que se pintan tapadas. */
  huecos?: number
  pequenas?: boolean
  destacadas?: readonly TipoCarta[]
}) {
  return (
    <div className="fila-cartas">
      {cartas.map((c, i) => (
        <Carta key={`${c}-${i}`} carta={c} pequena={pequenas} destacada={destacadas?.includes(c)} />
      ))}
      {Array.from({ length: huecos }, (_, i) => (
        <Carta key={`hueco-${i}`} tapada pequena={pequenas} />
      ))}
    </div>
  )
}
