import { useMemo, useState } from 'react'
import { aleatorioLibre } from '../../motor/aleatorio'
import type { Accion } from '../../motor/decision'
import { NOMBRES_CALLE, analizar } from '../../motor/decision'
import { describirMano } from '../../motor/evaluador'
import { GLOSARIO_POR_CLAVE } from '../../contenido/glosario'
import type { Leccion } from '../../juego/lecciones'
import { aSituacion, usaTusCartas } from '../../juego/practica'
import { anotarDecision } from '../../juego/progreso'
import type { EstadoSesion } from '../../juego/sesion'
import {
  empezarLeccion, empezarPractica, loQueFalta, responder, responderTest, siguienteMano, terminarEjemplo,
} from '../../juego/sesion'
import { useProgreso } from '../estado'
import { FilaDeCartas } from '../componentes/Carta'
import { BarrasDeProbabilidad } from '../componentes/BarraProbabilidad'

/**
 * La pantalla donde se aprende. Sigue el orden del análisis del tutorial:
 * explicación corta → ejemplo resuelto → manos con ayuda → manos sin ayuda, y se
 * corrige al instante (D33), que es lo que hace que el error se entienda cuando
 * todavía te acuerdas de por qué lo cometiste.
 */
export function Entrenador({ leccion, alSalir }: { leccion: Leccion; alSalir: () => void }) {
  const azar = useMemo(() => aleatorioLibre(), [])
  const [sesion, setSesion] = useState<EstadoSesion>(() => empezarLeccion(leccion, azar))
  const { actualizar } = useProgreso()

  const decidir = (accion: Accion) => {
    const siguiente = responder(sesion, accion)
    setSesion(siguiente)
    if (siguiente.ultimoResultado && siguiente.mano) {
      const resultado = siguiente.ultimoResultado
      const mano = siguiente.mano
      actualizar((p) => anotarDecision(p, resultado, mano))
    }
  }

  const contestar = (indice: number) => {
    const siguiente = responderTest(sesion, indice)
    setSesion(siguiente)
    if (siguiente.ultimoResultado) {
      const resultado = siguiente.ultimoResultado
      actualizar((p) => ({
        ...p,
        puntosTotales: p.puntosTotales + resultado.puntos,
        decisiones: p.decisiones + 1,
        aciertos: p.aciertos + (resultado.veredicto === 'optima' ? 1 : 0),
      }))
    }
  }

  const avanzar = () => {
    const siguiente = siguienteMano(sesion, azar)
    setSesion(siguiente)
    if (siguiente.fase === 'terminada') {
      actualizar((p) => ({
        ...p,
        lecciones: {
          ...p.lecciones,
          [leccion.id]: {
            terminadaEl: new Date().toISOString(),
            puntos: siguiente.puntos,
            manos: siguiente.manosJugadas,
          },
        },
      }))
    }
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <Cabecera sesion={sesion} alSalir={alSalir} />

      {sesion.fase === 'explicacion' && (
        <Explicacion leccion={leccion} alEmpezar={() => setSesion(empezarPractica(sesion))} />
      )}

      {sesion.fase === 'ejemplo' && sesion.mano && (
        <EjemploResuelto sesion={sesion} alSeguir={() => setSesion(terminarEjemplo(sesion, azar))} />
      )}

      {(sesion.fase === 'jugando' || sesion.fase === 'resultado') && sesion.pregunta && (
        <Test sesion={sesion} alContestar={contestar} alSeguir={avanzar} />
      )}

      {(sesion.fase === 'jugando' || sesion.fase === 'resultado') && sesion.mano && (
        <Jugada sesion={sesion} alDecidir={decidir} alSeguir={avanzar} />
      )}

      {sesion.fase === 'terminada' && <Terminada sesion={sesion} alSalir={alSalir} />}
    </div>
  )
}

function Cabecera({ sesion, alSalir }: { sesion: EstadoSesion; alSalir: () => void }) {
  const falta = loQueFalta(sesion)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <button className="boton" style={{ padding: '8px 14px' }} onClick={alSalir}>← Salir</button>
      <div style={{ flex: 1, minWidth: 140 }}>
        <div className="etiqueta">Módulo {sesion.leccion.modulo}</div>
        <strong>{sesion.leccion.titulo}</strong>
      </div>
      {sesion.fase !== 'explicacion' && sesion.fase !== 'terminada' && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className="chip">Mano {sesion.numeroDeMano}</span>
          <span className="chip morado">★ {sesion.puntos}</span>
          {falta.aciertos > 0 && sesion.manosJugadas > 0 && (
            <span className="chip" title="Aciertos seguidos que te faltan para dominar la lección">
              {falta.aciertos} para dominarla
            </span>
          )}
        </div>
      )}
    </div>
  )
}

function Explicacion({ leccion, alEmpezar }: { leccion: Leccion; alEmpezar: () => void }) {
  return (
    <div className="tarjeta">
      <div className="aviso info" style={{ marginBottom: 14 }}>
        <div className="titulo">💡 La idea</div>
        <p style={{ margin: 0 }}>{leccion.idea}</p>
      </div>

      {leccion.explicacion.map((parrafo, i) => (
        <p key={i} className="suave" dangerouslySetInnerHTML={{ __html: negritas(parrafo) }} />
      ))}

      {leccion.terminos.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <span className="etiqueta">Palabras nuevas</span>
          <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
            {leccion.terminos.map((clave) => {
              const termino = GLOSARIO_POR_CLAVE.get(clave)
              if (!termino) return null
              return (
                <div key={clave} className="tarjeta tenue" style={{ padding: 12 }}>
                  <strong>{termino.palabra}</strong>
                  {termino.tambien && (
                    <span className="tenue" style={{ fontSize: 13 }}> · también: {termino.tambien.join(', ')}</span>
                  )}
                  <div className="suave" style={{ fontSize: 14 }}>{termino.definicion}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <button className="boton principal ancho" style={{ marginTop: 16 }} onClick={alEmpezar}>
        Practicar →
      </button>
    </div>
  )
}

function EjemploResuelto({ sesion, alSeguir }: { sesion: EstadoSesion; alSeguir: () => void }) {
  const mano = sesion.mano!
  const jugada = sesion.jugadaDelEjemplo
  return (
    <div className="tarjeta">
      <span className="etiqueta">Ejemplo resuelto — mira cómo se hace</span>
      <Mesa mano={mano} />
      <div className="aviso info" style={{ marginTop: 14 }}>
        <div className="titulo">Aquí lo mejor es: {jugada?.accion}</div>
        <p className="suave" style={{ margin: 0, fontSize: 14 }}>{jugada?.porQue}</p>
      </div>
      <button className="boton principal ancho" style={{ marginTop: 14 }} onClick={alSeguir}>
        Ahora te toca a ti →
      </button>
    </div>
  )
}

function Mesa({ mano }: { mano: NonNullable<EstadoSesion['mano']> }) {
  return (
    <>
      <p className="suave" style={{ fontSize: 14 }}>{mano.contexto}</p>
      <div style={{ display: 'grid', gap: 14 }}>
        <div>
          <span className="etiqueta">Mesa · {NOMBRES_CALLE[mano.calle]}</span>
          <div style={{ marginTop: 6 }}>
            <FilaDeCartas cartas={mano.mesa} huecos={5 - mano.mesa.length} />
          </div>
        </div>
        <div>
          <span className="etiqueta">Tus cartas</span>
          <div style={{ marginTop: 6 }}>
            <FilaDeCartas cartas={mano.mano} />
          </div>
          {mano.mesa.length > 0 && (
            <p className="tenue" style={{ fontSize: 13, margin: '6px 0 0' }}>
              Ahora mismo tienes {describirMano([...mano.mano, ...mano.mesa])}
              {usaTusCartas(mano.mano, mano.mesa)
                ? '.'
                : ', pero está entera en la mesa: eso lo tiene todo el mundo.'}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <span className="chip">Bote: {mano.bote}</span>
          <span className="chip">{mano.paraPagar > 0 ? `Pagar cuesta: ${mano.paraPagar}` : 'Nadie ha apostado'}</span>
          <span className="chip">Tus fichas: {mano.tusFichas}</span>
        </div>
      </div>
    </>
  )
}

function Jugada({
  sesion,
  alDecidir,
  alSeguir,
}: {
  sesion: EstadoSesion
  alDecidir: (accion: Accion) => void
  alSeguir: () => void
}) {
  const mano = sesion.mano!
  const [verPorQue, setVerPorQue] = useState(false)
  const analisis = useMemo(
    () => (sesion.conAyuda || sesion.fase === 'resultado' ? analizar(aSituacion(mano)) : null),
    [mano, sesion.conAyuda, sesion.fase],
  )
  const juicio = sesion.ultimoJuicio

  return (
    <div className="mesa">
      <Mesa mano={mano} />

      {sesion.fase === 'jugando' && (
        <>
          {sesion.conAyuda && analisis && (
            <div className="tarjeta" style={{ marginTop: 14 }}>
              <span className="etiqueta">Probabilidades ahora mismo</span>
              <div style={{ marginTop: 8 }}>
                <BarrasDeProbabilidad probabilidades={analisis.equity} />
              </div>
              {mano.paraPagar > 0 && (
                <p className="tenue" style={{ fontSize: 13, margin: '8px 0 0' }}>
                  Para que pagar salga a cuenta necesitas ganar al menos el{' '}
                  {Math.round(analisis.equityNecesaria * 100)}% de las veces.
                </p>
              )}
            </div>
          )}
          {!sesion.conAyuda && (
            <p className="tenue" style={{ fontSize: 13, marginTop: 12 }}>
              Esta vez decides sin ver los números. Los verás justo después.
            </p>
          )}

          <div className="acciones">
            <button className="accion retirarse" onClick={() => alDecidir('retirarse')}>
              <span>✕ Retirarse</span>
              <span className="sub">Pierdes la mano</span>
            </button>
            <button className="accion pagar" onClick={() => alDecidir('pagar')}>
              <span>{mano.paraPagar > 0 ? '≡ Pagar' : '≡ Pasar'}</span>
              <span className="sub">{mano.paraPagar > 0 ? `Pones ${mano.paraPagar}` : 'Gratis'}</span>
            </button>
            <button className="accion subir" onClick={() => alDecidir('subir')}>
              <span>↗ Subir</span>
              <span className="sub">Aumentar la apuesta</span>
            </button>
          </div>
        </>
      )}

      {sesion.fase === 'resultado' && juicio && (
        <div style={{ marginTop: 14, display: 'grid', gap: 12 }}>
          <div className={`aviso ${juicio.veredicto === 'mala' ? 'mal' : 'bien'}`}>
            <div className="titulo">
              {juicio.veredicto === 'mala' ? '✕' : '✓'} {textoVeredicto(juicio.veredicto)}
              <span className="chip morado" style={{ marginLeft: 'auto' }}>+{juicio.puntos}</span>
            </div>
            <p style={{ margin: 0 }}>{juicio.porQue}</p>
          </div>

          {analisis && (
            <div className="tarjeta">
              <span className="etiqueta">Cómo iba la mano</span>
              <div style={{ marginTop: 8 }}>
                <BarrasDeProbabilidad probabilidades={analisis.equity} />
              </div>
            </div>
          )}

          <button className="boton" onClick={() => setVerPorQue((v) => !v)}>
            {verPorQue ? 'Ocultar el detalle' : '¿Por qué? Enséñame los números'}
          </button>
          {verPorQue && (
            <div className="tarjeta tenue">
              <pre
                style={{
                  whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: 13.5,
                  color: 'var(--texto-suave)', margin: 0,
                }}
              >
                {juicio.porQueLargo}
              </pre>
            </div>
          )}

          <button className="boton principal ancho" onClick={alSeguir}>Siguiente mano →</button>
        </div>
      )}
    </div>
  )
}

function Test({
  sesion,
  alContestar,
  alSeguir,
}: {
  sesion: EstadoSesion
  alContestar: (indice: number) => void
  alSeguir: () => void
}) {
  const pregunta = sesion.pregunta!
  const respondida = sesion.fase === 'resultado'
  const marcada = sesion.respuestaMarcada

  return (
    <div className="tarjeta">
      <h3>{pregunta.enunciado}</h3>

      {pregunta.mesa && (
        <div style={{ marginBottom: 12 }}>
          <span className="etiqueta">Mesa</span>
          <div style={{ marginTop: 6 }}><FilaDeCartas cartas={pregunta.mesa} /></div>
        </div>
      )}
      {pregunta.mano && (
        <div style={{ marginBottom: 10 }}>
          <span className="etiqueta">{pregunta.manoB ? 'Mano de arriba' : 'Tus cartas'}</span>
          <div style={{ marginTop: 6 }}><FilaDeCartas cartas={pregunta.mano} /></div>
        </div>
      )}
      {pregunta.manoB && (
        <div style={{ marginBottom: 12 }}>
          <span className="etiqueta">Mano de abajo</span>
          <div style={{ marginTop: 6 }}><FilaDeCartas cartas={pregunta.manoB} /></div>
        </div>
      )}

      <div style={{ display: 'grid', gap: 9, marginTop: 8 }}>
        {pregunta.opciones.map((opcion, i) => {
          const esta = marcada === i
          const clase = !respondida
            ? 'boton ancho'
            : opcion.correcta
              ? 'boton ancho'
              : 'boton ancho'
          const estilo = respondida
            ? {
                background: opcion.correcta ? 'var(--verde-tenue)' : esta ? 'var(--rojo-tenue)' : undefined,
                borderColor: opcion.correcta ? 'var(--verde)' : esta ? 'var(--rojo)' : undefined,
                justifyContent: 'flex-start' as const,
                textAlign: 'left' as const,
              }
            : { justifyContent: 'flex-start' as const, textAlign: 'left' as const }
          return (
            <div key={i}>
              <button className={clase} style={estilo} disabled={respondida} onClick={() => alContestar(i)}>
                {respondida && (opcion.correcta ? '✓ ' : esta ? '✕ ' : '　')}
                {opcion.texto}
              </button>
              {respondida && (esta || opcion.correcta) && (
                <p className="suave" style={{ fontSize: 13.5, margin: '5px 4px 0' }}>{opcion.porQue}</p>
              )}
            </div>
          )
        })}
      </div>

      {respondida && (
        <button className="boton principal ancho" style={{ marginTop: 14 }} onClick={alSeguir}>
          Siguiente →
        </button>
      )}
    </div>
  )
}

function Terminada({ sesion, alSalir }: { sesion: EstadoSesion; alSalir: () => void }) {
  const media = sesion.manosJugadas > 0 ? Math.round(sesion.puntos / sesion.manosJugadas) : 0
  return (
    <div className="tarjeta" style={{ textAlign: 'center', padding: 28 }}>
      <div style={{ fontSize: 34 }}>✓</div>
      <h2>Lección dominada</h2>
      <p className="suave">{sesion.leccion.idea}</p>
      <div className="rejilla tres" style={{ margin: '18px 0' }}>
        <div className="tarjeta tenue">
          <div className="numerote">{sesion.puntos}</div>
          <span className="etiqueta">Puntos</span>
        </div>
        <div className="tarjeta tenue">
          <div className="numerote">{sesion.manosJugadas}</div>
          <span className="etiqueta">Manos</span>
        </div>
        <div className="tarjeta tenue">
          <div className="numerote">{media}</div>
          <span className="etiqueta">Media</span>
        </div>
      </div>
      <button className="boton principal" onClick={alSalir}>Seguir con el curso →</button>
    </div>
  )
}

function textoVeredicto(veredicto: string): string {
  return {
    optima: '¡La mejor jugada!',
    buena: 'Buena decisión',
    dudosa: 'Decisión discutible',
    mala: 'Mala decisión',
  }[veredicto] ?? ''
}

/** Convierte **esto** en negrita, que es lo único que se usa en las explicaciones. */
function negritas(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
}
