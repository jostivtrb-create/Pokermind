/**
 * La mesa vista desde arriba: cuatro sillas, el botón y las ciegas.
 *
 * La posición es el concepto que peor entra por escrito — "el que habla el
 * último gana más" no significa nada hasta que ves la mesa y el orden. Aquí se
 * ve de un golpe quién reparte, quién pone las ciegas y por dónde empieza.
 */
export function Sillas({
  boton,
  resaltar,
  nota,
}: {
  boton: number
  resaltar?: number
  nota?: string
}) {
  const sillas = [0, 1, 2, 3]
  const ciegaPequena = (boton + 1) % 4
  const ciegaGrande = (boton + 2) % 4
  const etiqueta = (i: number) => {
    if (i === boton) return 'Botón'
    if (i === ciegaPequena) return 'Ciega pequeña'
    if (i === ciegaGrande) return 'Ciega grande'
    return 'Primera posición'
  }

  // Colocación alrededor de una mesa ovalada: arriba, derecha, abajo, izquierda.
  const sitios = [
    { top: '2%', left: '50%', transform: 'translateX(-50%)' },
    { top: '50%', right: '2%', transform: 'translateY(-50%)' },
    { bottom: '2%', left: '50%', transform: 'translateX(-50%)' },
    { top: '50%', left: '2%', transform: 'translateY(-50%)' },
  ]

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <div
        style={{
          position: 'relative', width: '100%', maxWidth: 320, aspectRatio: '1.25',
          margin: '0 auto',
        }}
      >
        {/* El fieltro va vacío a propósito: el texto dentro del óvalo lo tapaban
            las sillas de los lados. La nota va debajo, donde se lee. */}
        <div
          style={{
            position: 'absolute', inset: '19% 16%', borderRadius: 999,
            background: 'radial-gradient(circle at 50% 30%, #1d2a52, #131834)',
            border: '1px solid var(--borde-fuerte)',
          }}
        />

        {sillas.map((i) => {
          const esTurno = resaltar === i
          return (
            <div
              key={i}
              style={{
                position: 'absolute', ...sitios[i], textAlign: 'center',
                padding: '6px 9px', borderRadius: 10, minWidth: 86,
                background: esTurno ? 'var(--morado)' : 'var(--superficie)',
                border: `1px solid ${esTurno ? 'var(--morado-claro)' : 'var(--borde)'}`,
              }}
            >
              <div style={{ fontSize: 11.5, fontWeight: 700 }}>
                {i === 0 ? 'Tú' : `Jugador ${i + 1}`}
              </div>
              <div style={{ fontSize: 10, color: esTurno ? 'rgba(255,255,255,0.85)' : 'var(--texto-tenue)' }}>
                {etiqueta(i)}
              </div>
              {i === boton && (
                <div
                  style={{
                    position: 'absolute', top: -7, right: -7, width: 19, height: 19,
                    borderRadius: '50%', background: '#fff', color: '#12151f',
                    fontSize: 10.5, fontWeight: 800, display: 'grid', placeItems: 'center',
                  }}
                >
                  D
                </div>
              )}
            </div>
          )
        })}
      </div>
      {nota && (
        <p
          style={{
            fontSize: 13, textAlign: 'center', margin: 0, color: 'var(--morado-claro)',
            fontWeight: 600,
          }}
        >
          {nota}
        </p>
      )}
      <p className="tenue" style={{ fontSize: 12, textAlign: 'center', margin: 0 }}>
        Antes del flop habla primero el de primera posición; después del flop, el primero a la
        izquierda del botón.
      </p>
    </div>
  )
}
