import { useState } from 'react'
import type { Carta as TipoCarta } from '../../motor/cartas'
import { VALORES, crearCarta, manoDeCodigo } from '../../motor/cartas'
import { describirMano, evaluar } from '../../motor/evaluador'
import type { Paso } from '../../juego/lecciones'
import { Carta, FilaDeCartas } from './Carta'
import { RejillaDeRango } from './Rejilla'
import { Sillas } from './Sillas'

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

    case 'acciones':
      return (
        <>
          <Frase texto={paso.texto} />
          <div className="acciones" style={{ marginTop: 0 }}>
            {([
              ['retirarse', '✕ Retirarse', 'Sales de la mano'],
              ['pagar', '≡ Pagar', 'Sigues viendo cartas'],
              ['subir', '↗ Subir', 'Aprietas el bote'],
            ] as const).map(([clave, titulo, sub]) => (
              <div
                key={clave}
                className={`accion ${clave}`}
                style={{
                  opacity: !paso.resaltar || paso.resaltar === clave ? 1 : 0.32,
                  cursor: 'default',
                }}
              >
                <span>{titulo}</span>
                <span className="sub">{sub}</span>
              </div>
            ))}
          </div>
          <Pie texto={paso.pie} />
        </>
      )

    case 'porcentaje':
      return (
        <>
          <Frase texto={paso.texto} />
          {paso.mesa && paso.mano && (
            <div style={{ display: 'grid', gap: 8 }}>
              <FilaDeCartas cartas={paso.mesa} huecos={5 - paso.mesa.length} pequenas />
              <FilaDeCartas cartas={paso.mano} />
            </div>
          )}
          <Tarta victoria={paso.victoria} empate={paso.empate ?? 0} />
          <Pie texto={paso.pie} />
        </>
      )

    case 'precio':
      return (
        <>
          <Frase texto={paso.texto} />
          <PrecioDelBote bote={paso.bote} pagar={paso.pagar} />
          <Pie texto={paso.pie} />
        </>
      )

    case 'outs':
      return (
        <>
          <Frase texto={paso.texto} />
          <div style={{ display: 'grid', gap: 8 }}>
            <FilaDeCartas cartas={paso.mesa} huecos={5 - paso.mesa.length} pequenas />
            <FilaDeCartas cartas={paso.mano} />
          </div>
          <div>
            <span className="etiqueta" style={{ color: 'var(--verde)' }}>
              Te sirven estas {paso.outs.length}
            </span>
            <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 6 }}>
              {paso.outs.map((c, i) => (
                <Carta key={`${c}-${i}`} carta={c} pequena destacada />
              ))}
            </div>
          </div>
          <Pie texto={paso.pie} />
        </>
      )

    case 'sillas':
      return (
        <>
          <Frase texto={paso.texto} />
          <Sillas boton={paso.boton} resaltar={paso.resaltar} nota={paso.nota} />
          <Pie texto={paso.pie} />
        </>
      )

    case 'rango':
      return (
        <>
          <Frase texto={paso.texto} />
          <RejillaDeRango rango={paso.rango} />
          <Pie texto={paso.pie} />
        </>
      )

    case 'fichas':
      return (
        <>
          <Frase texto={paso.texto} />
          <MontonesDeFichas montones={paso.montones} />
          <Pie texto={paso.pie} />
        </>
      )
  }
}

/** La probabilidad, dibujada en una barra de tres tramos. */
function Tarta({ victoria, empate }: { victoria: number; empate: number }) {
  const derrota = Math.max(0, 1 - victoria - empate)
  const tramos: Array<[string, number, string]> = [
    ['Ganas', victoria, 'var(--verde)'],
    ['Empate', empate, 'var(--azul)'],
    ['Pierdes', derrota, 'var(--rojo)'],
  ]
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <div style={{ display: 'flex', height: 28, borderRadius: 8, overflow: 'hidden' }}>
        {tramos.map(([nombre, valor, color]) =>
          valor <= 0 ? null : (
            <div
              key={nombre}
              style={{
                width: `${valor * 100}%`, background: color, display: 'grid', placeItems: 'center',
                color: '#0b0e1a', fontSize: 12, fontWeight: 800,
              }}
            >
              {valor >= 0.12 ? `${Math.round(valor * 100)}%` : ''}
            </div>
          ),
        )}
      </div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        {tramos.map(([nombre, valor, color]) => (
          <span key={nombre} style={{ fontSize: 12.5, display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ width: 9, height: 9, borderRadius: 3, background: color }} />
            <span className="suave">{nombre} {Math.round(valor * 100)}%</span>
          </span>
        ))}
      </div>
    </div>
  )
}

/**
 * El precio del bote, en fichas y en veces.
 *
 * "Pagas 50 para optar a 150" se entiende mucho mejor viendo los dos montones y
 * las casillas de "una de cada tres" que leyendo la división.
 */
function PrecioDelBote({ bote, pagar }: { bote: number; pagar: number }) {
  const total = bote + pagar
  const necesario = pagar / total
  const deCada = Math.max(2, Math.round(1 / Math.max(necesario, 0.01)))

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
        <MontonesDeFichas
          montones={[
            { nombre: 'Pones', fichas: pagar, color: 'var(--rojo)' },
            { nombre: 'Puedes llevarte', fichas: total, color: 'var(--verde)' },
          ]}
        />
      </div>
      <div>
        <span className="etiqueta">Necesitas ganar</span>
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 6 }}>
          {Array.from({ length: Math.min(deCada, 12) }, (_, i) => (
            <span
              key={i}
              style={{
                width: 22, height: 22, borderRadius: 6,
                background: i === 0 ? 'var(--verde)' : 'rgba(255,255,255,0.08)',
                border: '1px solid var(--borde)',
              }}
            />
          ))}
        </div>
        <p className="suave" style={{ fontSize: 13.5, margin: '7px 0 0' }}>
          <strong>1 de cada {deCada}</strong> veces ({Math.round(necesario * 100)}%) para no perder fichas.
        </p>
      </div>
    </div>
  )
}

/** Montones de fichas comparados, para que las cantidades se vean y no se lean. */
function MontonesDeFichas({
  montones,
}: {
  montones: Array<{ nombre: string; fichas: number; color?: string }>
}) {
  const mayor = Math.max(...montones.map((m) => m.fichas), 1)
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
      {montones.map((monton) => (
        <div key={monton.nombre} style={{ textAlign: 'center', flex: '0 0 auto' }}>
          <div
            style={{
              width: 54,
              height: Math.max(12, Math.round((monton.fichas / mayor) * 92)),
              background: monton.color ?? 'var(--morado)',
              borderRadius: '7px 7px 4px 4px',
              boxShadow: 'inset 0 -6px 0 rgba(0,0,0,0.18), inset 0 6px 0 rgba(255,255,255,0.14)',
            }}
          />
          <div style={{ fontWeight: 700, fontSize: 14, marginTop: 5 }}>{monton.fichas}</div>
          <div className="tenue" style={{ fontSize: 11.5 }}>{monton.nombre}</div>
        </div>
      ))}
    </div>
  )
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
