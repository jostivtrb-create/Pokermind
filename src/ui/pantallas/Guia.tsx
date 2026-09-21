import { useState } from 'react'
import { GLOSARIO, buscarTermino } from '../../contenido/glosario'

/**
 * La guía: cómo decidir, y el glosario entero.
 *
 * El vocabulario se explica cuando aparece por primera vez en cada lección, pero
 * tiene que poder consultarse en cualquier momento: a nadie se le quedan veinte
 * palabras nuevas a la primera.
 */
export function Guia() {
  const [busqueda, setBusqueda] = useState('')
  const terminos = buscarTermino(busqueda)

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div>
        <h1>¿Cómo decidir?</h1>
        <p className="suave">No se trata de adivinar, se trata de calcular.</p>
      </div>

      <div className="rejilla tres">
        {[
          ['Retirarse', 'var(--rojo)', 'Cuando tu mano tiene pocas probabilidades de ganar y seguir cuesta caro.', 'Ejemplo: 20% o menos.'],
          ['Pagar', 'var(--morado-claro)', 'Cuando tienes una mano con buen potencial de mejora, o el precio es barato.', 'Ejemplo: 20% - 40%.'],
          ['Subir', 'var(--verde)', 'Cuando llevas ventaja y quieres que el bote crezca mientras la tienes.', 'Ejemplo: 40% o más.'],
        ].map(([titulo, color, texto, ejemplo]) => (
          <div className="tarjeta" key={titulo}>
            <h3 style={{ color }}>{titulo}</h3>
            <p className="suave" style={{ fontSize: 14 }}>{texto}</p>
            <p className="tenue" style={{ fontSize: 13, margin: 0 }}>{ejemplo}</p>
          </div>
        ))}
      </div>

      <div className="aviso info">
        <div className="titulo">Recuerda</div>
        <ul className="suave" style={{ margin: 0, paddingLeft: 20, fontSize: 14 }}>
          <li>Los porcentajes dicen qué tan probable es ganar, no qué va a pasar.</li>
          <li>Tu decisión se juzga por la información que tenías, no por la carta que salió.</li>
          <li>No es solo la fuerza de tu mano: también la posición, el precio y quién tienes enfrente.</li>
          <li>Esos porcentajes de arriba son una guía de principiante: en cuanto sepas leer al rival, mandan sus manos posibles y no una tabla.</li>
        </ul>
      </div>

      <div>
        <h2>Glosario</h2>
        <input
          className="boton ancho"
          style={{ borderRadius: 'var(--radio-s)', textAlign: 'left', marginBottom: 12 }}
          placeholder="Buscar una palabra… (foldear, ciegas, outs…)"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <div style={{ display: 'grid', gap: 9 }}>
          {terminos.map((t) => (
            <div key={t.clave} className="tarjeta">
              <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
                <strong>{t.palabra}</strong>
                {t.tambien && <span className="tenue" style={{ fontSize: 13 }}>{t.tambien.join(' · ')}</span>}
              </div>
              <p className="suave" style={{ fontSize: 14, margin: '4px 0 0' }}>{t.definicion}</p>
              {t.ejemplo && <p className="tenue" style={{ fontSize: 13, margin: '5px 0 0' }}>{t.ejemplo}</p>}
            </div>
          ))}
          {terminos.length === 0 && (
            <p className="tenue">No hay ninguna palabra con eso. Prueba con «bote», «outs» o «farol».</p>
          )}
        </div>
        <p className="tenue" style={{ fontSize: 13, marginTop: 10 }}>{GLOSARIO.length} palabras.</p>
      </div>
    </div>
  )
}
