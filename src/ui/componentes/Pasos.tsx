import { useState } from 'react'
import type { Carta as TipoCarta } from '../../motor/cartas'
import { VALORES, crearCarta, manoDeCodigo } from '../../motor/cartas'
import { describirMano, evaluar } from '../../motor/evaluador'
import type { Paso } from '../../juego/lecciones'
import { Carta, FilaDeCartas } from './Carta'

/**
 * La explicación de una lección, **un paso por pantalla**.
 *
 * Es la respuesta a lo primero que dijo el usuario al probarlo: entrar y
 * encontrarse cuatro párrafos seguidos aburre y se salta. Aquí cada pantalla
 * tiene una frase corta y algo que mirar, y se avanza tocando.
 */
export function Pasos({ pasos, alTerminar }: { pasos: Paso[]; alTerminar: () => void }) {
  const [indice, setIndice] = useState(0)
  const paso = pasos[indice]
  const ultimo = indice === pasos.length - 1

  return (
    <div className="tarjeta" style={{ display: 'grid', gap: 16 }}>
      {pasos.length > 1 && (
        <div style={{ display: 'flex', gap: 5, justifyContent: 'center' }}>
          {pasos.map((_, i) => (
            <span
              key={i}
              style={{
                height: 4, flex: 1, maxWidth: 46, borderRadius: 999,
                background: i <= indice ? 'var(--morado)' : 'rgba(255,255,255,0.12)',
                transition: 'background 0.2s',
              }}
            />
          ))}
        </div>
      )}

      <div style={{ minHeight: 190, display: 'grid', gap: 14, alignContent: 'start' }}>
        <DibujoDelPaso paso={paso} />
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        {indice > 0 && (
          <button className="boton" style={{ padding: '12px 18px' }} onClick={() => setIndice((i) => i - 1)}>
            ←
          </button>
        )}
        <button
          className="boton principal"
          style={{ flex: 1 }}
          onClick={() => (ultimo ? alTerminar() : setIndice((i) => i + 1))}
        >
          {ultimo ? 'Practicar →' : 'Siguiente →'}
        </button>
      </div>
    </div>
  )
}

function Frase({ texto }: { texto: string }) {
  return (
    <p
      style={{ fontSize: 18, lineHeight: 1.45, margin: 0, textWrap: 'balance' }}
      dangerouslySetInnerHTML={{ __html: negritas(texto) }}
    />
  )
}

function Pie({ texto }: { texto?: string }) {
  if (!texto) return null
  return <p className="tenue" style={{ fontSize: 13.5, margin: 0 }}>{texto}</p>
}

function DibujoDelPaso({ paso }: { paso: Paso }) {
  switch (paso.tipo) {
    case 'texto':
      return <Frase texto={paso.texto} />

    case 'cartas':
      return (
        <>
          <Frase texto={paso.texto} />
          <FilaDeCartas cartas={paso.cartas} destacadas={paso.destacar} />
          <Pie texto={paso.pie} />
        </>
      )

    case 'mesa':
      return (
        <>
          <Frase texto={paso.texto} />
          <div>
            <span className="etiqueta">La mesa</span>
            <div style={{ marginTop: 6 }}>
              <FilaDeCartas cartas={paso.mesa} huecos={5 - paso.mesa.length} pequenas />
            </div>
          </div>
          <div>
            <span className="etiqueta">Tus cartas</span>
            <div style={{ marginTop: 6 }}>
              <FilaDeCartas cartas={paso.mano} />
            </div>
          </div>
          <Pie texto={paso.pie} />
        </>
      )

    case 'comparar':
      return (
        <>
          <Frase texto={paso.texto} />
          {([['a', paso.a], ['b', paso.b]] as const).map(([lado, cartas]) => {
            const gana = paso.gana === lado
            return (
              <div
                key={lado}
                style={{
                  border: `1px solid ${gana ? 'var(--verde)' : 'var(--borde)'}`,
                  background: gana ? 'var(--verde-tenue)' : 'transparent',
                  borderRadius: 'var(--radio-s)', padding: 11,
                  display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap',
                }}
              >
                <FilaDeCartas cartas={cartas} pequenas />
                <span style={{ fontSize: 13.5, color: gana ? 'var(--verde)' : 'var(--texto-suave)', fontWeight: 600 }}>
                  {gana ? '✓ gana' : 'pierde'}
                  {cartas.length >= 5 && ` · ${describirMano(cartas)}`}
                </span>
              </div>
            )
          })}
          <Pie texto={paso.pie} />
        </>
      )

    case 'valores':
      return (
        <>
          <Frase texto={paso.texto} />
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
            {VALORES.map((_, i) => (
              <Carta key={i} carta={crearCarta(i, 0)} pequena destacada={i === 12} />
            ))}
          </div>
          <Pie texto={paso.pie} />
        </>
      )

    case 'escalera':
      return (
        <>
          <Frase texto={paso.texto} />
          <EscaleraDeJugadas />
          <Pie texto={paso.pie} />
        </>
      )
  }
}

/** Ejemplos reales de cada jugada, de la más floja a la más fuerte. */
const JUGADAS: Array<[nombre: string, cartas: string]> = [
  ['Carta alta', 'As Jh 9d 5c 2s'],
  ['Pareja', '7s 7h Kd 9c 2s'],
  ['Doble pareja', 'Ks Kh 7d 7c 2s'],
  ['Trío', '9s 9h 9d Kc 2s'],
  ['Escalera', '9s 8h 7d 6c 5s'],
  ['Color', 'As Js 9s 5s 2s'],
  ['Full', 'Qs Qh Qd 4c 4s'],
  ['Póker', '5s 5h 5d 5c Ks'],
  ['Escalera de color', 'As Ks Qs Js Ts'],
]

/**
 * La escalera de jugadas con cartas de verdad.
 *
 * Es la pantalla que pidió el usuario: que no se diga "full, escalera, color"
 * y ya, sino que se **vean**. Dicho con palabras no significa nada para quien
 * nunca ha jugado; con las cartas delante se entiende sin explicar nada.
 */
export function EscaleraDeJugadas({ compacta }: { compacta?: boolean }) {
  return (
    <div style={{ display: 'grid', gap: 7 }}>
      {JUGADAS.map(([nombre, texto], i) => {
        const cartas = manoDeCodigo(texto)
        return (
          <div
            key={nombre}
            style={{
              display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap',
              padding: '7px 10px', borderRadius: 'var(--radio-s)',
              background: i === JUGADAS.length - 1 ? 'var(--morado-tenue)' : 'var(--fondo-2)',
              border: '1px solid var(--borde)',
            }}
          >
            <span
              className="tenue"
              style={{ width: 18, fontSize: 12, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}
            >
              {i + 1}
            </span>
            <span style={{ fontWeight: 600, fontSize: 13.5, width: 108, flexShrink: 0 }}>{nombre}</span>
            {!compacta && <FilaDeCartas cartas={cartas} pequenas />}
          </div>
        )
      })}
      <p className="tenue" style={{ fontSize: 12.5, margin: '2px 0 0' }}>
        De arriba abajo: cuanto más abajo, más difícil es que te salga y más gana.
      </p>
    </div>
  )
}

/** Dos cartas sueltas enfrentadas: la primera lección de todas. */
export function CualCartaGana({ a, b }: { a: TipoCarta; b: TipoCarta }) {
  const ganaA = evaluar([a]) > evaluar([b])
  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
      <Carta carta={a} destacada={ganaA} />
      <span className="tenue">contra</span>
      <Carta carta={b} destacada={!ganaA} />
    </div>
  )
}

function negritas(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
}
