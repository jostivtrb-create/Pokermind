import { useMemo, useState } from 'react'
import { aleatorioLibre } from '../../motor/aleatorio'
import type { Accion } from '../../motor/decision'
import { NOMBRES_CALLE, analizar } from '../../motor/decision'
import { Categoria, categoriaDe, describirMano, evaluar } from '../../motor/evaluador'
import { GLOSARIO_POR_CLAVE } from '../../contenido/glosario'
import type { Leccion } from '../../juego/lecciones'
import { pasosDeLaLeccion } from '../../juego/lecciones'
import { aSituacion, fraseDeTuMano, usaTusCartas } from '../../juego/practica'
import { anotarDecision, anotarMano } from '../../juego/progreso'
import type { EstadoSesion } from '../../juego/sesion'
import {
  empezarLeccion, empezarPractica, loQueFalta, responder, responderTest, sesionDeUnaMano,
  siguienteMano, terminarEjemplo,
} from '../../juego/sesion'
import type { ManoDePractica } from '../../juego/practica'
import { moduloTerminado, siguienteLeccion } from '../../contenido/temario'
import { useProgreso } from '../estado'
import { sonar } from '../sonido'
import { FilaDeCartas } from '../componentes/Carta'
import { BarrasDeProbabilidad } from '../componentes/BarraProbabilidad'
import { BotonesDeDecision, tamanosParaElegir } from '../componentes/BotonesDeDecision'
import { Pasos } from '../componentes/Pasos'
import { RangoDelRival } from '../componentes/RangoDelRival'
import { Rebobinar } from '../componentes/Rebobinar'
import { parsearRango } from '../../motor/rangos'

/**
 * La pantalla donde se aprende. Sigue el orden del análisis del tutorial:
 * explicación corta → ejemplo resuelto → manos con ayuda → manos sin ayuda, y se
 * corrige al instante (D33), que es lo que hace que el error se entienda cuando
 * todavía te acuerdas de por qué lo cometiste.
 */
export function Entrenador({
  leccion,
  alSalir,
  alSiguienteLeccion,
  manoSuelta,
  alTerminarManoSuelta,
}: {
  leccion: Leccion
  alSalir: () => void
  /** Encadenar con la lección siguiente sin pasar por la lista. */
  alSiguienteLeccion?: (leccion: Leccion) => void
  /** Para el reto diario y el repaso de errores: una mano concreta, sin lección. */
  manoSuelta?: ManoDePractica
  alTerminarManoSuelta?: (acertada: boolean, puntos: number) => void
}) {
  const azar = useMemo(() => aleatorioLibre(), [])
  const [sesion, setSesion] = useState<EstadoSesion>(() =>
    manoSuelta ? sesionDeUnaMano(manoSuelta, leccion) : empezarLeccion(leccion, azar),
  )
  const { actualizar } = useProgreso()

  const decidir = (accion: Accion, tamano?: number) => {
    const siguiente = responder(sesion, accion, tamano)
    setSesion(siguiente)
    if (siguiente.ultimoResultado && siguiente.mano) {
      const resultado = siguiente.ultimoResultado
      sonar(resultado.veredicto === 'mala' ? 'fallo' : 'acierto')
      const mano = siguiente.mano
      // En el entrenador cada mano es una decisión, así que su nota es la de esa
      // decisión. La nota es la medida principal del juego (D63).
      actualizar((p) => anotarMano(anotarDecision(p, resultado, mano), resultado.puntos))
      alTerminarManoSuelta?.(resultado.veredicto !== 'mala', resultado.puntos)
    }
  }

  const contestar = (indice: number) => {
    const siguiente = responderTest(sesion, indice)
    setSesion(siguiente)
    if (siguiente.ultimoResultado) {
      const resultado = siguiente.ultimoResultado
      sonar(resultado.veredicto === 'optima' ? 'acierto' : 'fallo')
      actualizar((p) =>
        anotarMano(
          {
            ...p,
            puntosTotales: p.puntosTotales + resultado.puntos,
            decisiones: p.decisiones + 1,
            aciertos: p.aciertos + (resultado.veredicto === 'optima' ? 1 : 0),
          },
          resultado.puntos,
        ),
      )
    }
  }

  const avanzar = () => {
    if (manoSuelta) {
      alSalir()
      return
    }
    const siguiente = siguienteMano(sesion, azar)
    setSesion(siguiente)
    if (siguiente.fase === 'terminada') {
      actualizar((p) => {
        const conLeccion = {
          ...p,
          lecciones: {
            ...p.lecciones,
            [leccion.id]: {
              terminadaEl: new Date().toISOString(),
              puntos: siguiente.puntos,
              manos: siguiente.manosJugadas,
            },
          },
        }
        // Terminar el módulo 1 es lo que abre el modo libre (D34).
        return {
          ...conLeccion,
          modoLibreDesbloqueado: conLeccion.modoLibreDesbloqueado || moduloTerminado(conLeccion, 1),
        }
      })
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
        <Jugada sesion={sesion} alDecidir={decidir} alSeguir={avanzar} manoSuelta={!!manoSuelta} />
      )}

      {sesion.fase === 'terminada' && (
        <Terminada sesion={sesion} alSalir={alSalir} alSiguienteLeccion={alSiguienteLeccion} />
      )}
    </div>
  )
}

function Cabecera({ sesion, alSalir }: { sesion: EstadoSesion; alSalir: () => void }) {
  const falta = loQueFalta(sesion)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <button className="boton" style={{ padding: '8px 14px' }} onClick={alSalir}>← Salir</button>
      <div style={{ flex: 1, minWidth: 140 }}>
        {sesion.leccion.modulo > 0 && <div className="etiqueta">Módulo {sesion.leccion.modulo}</div>}
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

/**
 * La explicación de la lección: **un paso por pantalla**, no un muro de texto.
 *
 * Las palabras nuevas del glosario se enseñan al final, ya con el concepto
 * visto: dar primero una lista de definiciones es justo lo que aburre.
 */
function Explicacion({ leccion, alEmpezar }: { leccion: Leccion; alEmpezar: () => void }) {
  const [verPalabras, setVerPalabras] = useState(false)
  const terminos = leccion.terminos
    .map((clave) => GLOSARIO_POR_CLAVE.get(clave))
    .filter((t): t is NonNullable<typeof t> => Boolean(t))

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div className="aviso info">
        <div className="titulo">💡 {leccion.idea}</div>
      </div>

      <Pasos pasos={pasosDeLaLeccion(leccion)} alTerminar={alEmpezar} />

      {terminos.length > 0 && (
        <>
          <button className="boton" onClick={() => setVerPalabras((v) => !v)}>
            {verPalabras ? 'Ocultar las palabras nuevas' : `Palabras nuevas de esta lección (${terminos.length})`}
          </button>
          {verPalabras && (
            <div style={{ display: 'grid', gap: 8 }}>
              {terminos.map((termino) => (
                <div key={termino.clave} className="tarjeta tenue" style={{ padding: 12 }}>
                  <strong>{termino.palabra}</strong>
                  {termino.tambien && (
                    <span className="tenue" style={{ fontSize: 13 }}> · también: {termino.tambien.join(', ')}</span>
                  )}
                  <div className="suave" style={{ fontSize: 14 }}>{termino.definicion}</div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
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
              {fraseDeTuMano(mano.mano, mano.mesa)}
              {hayQueAvisarDeLaMesa(mano.mano, mano.mesa) &&
                ' Pero está entera en la mesa: eso lo tiene todo el mundo.'}
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
  manoSuelta,
}: {
  sesion: EstadoSesion
  alDecidir: (accion: Accion, tamano?: number) => void
  alSeguir: () => void
  manoSuelta?: boolean
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

          <BotonesDeDecision
            paraPagar={mano.paraPagar}
            opcionesDeSubida={tamanosParaElegir(mano.bote, mano.paraPagar, mano.tusFichas, mano.fichasRival)}
            alDecidir={alDecidir}
          />
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
            <>
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
              {analisis && <Rebobinar analisis={analisis} elegida={juicio.elegida.accion} />}
              <RangoDelRival
                nombre={mano.perfilRival?.nombre ? `el rival (${mano.perfilRival.nombre})` : 'el rival'}
                rango={parsearRango(mano.rangoRival)}
                mesa={mano.mesa}
                vistas={[...mano.mano, ...mano.mesa]}
              />
            </>
          )}

          <button className="boton principal ancho" onClick={alSeguir}>
            {manoSuelta ? 'Terminar' : 'Siguiente mano'} →
          </button>
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

      {/*
        Al corregir se enseñan LAS CINCO CARTAS que forman cada jugada. Decir
        "gana por la segunda carta" sin enseñar cuál es deja al jugador igual que
        estaba, y eso se vio jugando: dos manos de carta alta al rey y una
        explicación que repetía la misma frase dos veces.
      */}
      {/* Dos cartas sueltas se enfrentan, no se apilan: la pregunta es cuál gana. */}
      {esDuelo(pregunta) ? (
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', justifyContent: 'center', margin: '14px 0' }}>
          <FilaDeCartas cartas={pregunta.mano!} />
          <span className="tenue" style={{ fontSize: 13 }}>contra</span>
          <FilaDeCartas cartas={pregunta.manoB!} />
        </div>
      ) : (
        <>
          {pregunta.mano && (
            <div style={{ marginBottom: 10 }}>
              <span className="etiqueta">
                {pregunta.manoB ? 'Mano de arriba' : 'Tus cartas'}
              </span>
              <div style={{ marginTop: 6 }}>
                <FilaDeCartas cartas={pregunta.mano} destacadas={respondida ? pregunta.cincoA : undefined} />
              </div>
              {respondida && pregunta.cincoA && (
                <JugadaFormada cartas={pregunta.cincoA} nombre={pregunta.manoB ? 'Arriba juega' : 'Tu jugada'} />
              )}
            </div>
          )}
          {pregunta.manoB && (
            <div style={{ marginBottom: 12 }}>
              <span className="etiqueta">Mano de abajo</span>
              <div style={{ marginTop: 6 }}>
                <FilaDeCartas cartas={pregunta.manoB} destacadas={respondida ? pregunta.cincoB : undefined} />
              </div>
              {respondida && pregunta.cincoB && <JugadaFormada cartas={pregunta.cincoB} nombre="Abajo juega" />}
            </div>
          )}
        </>
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

/**
 * Fin de lección.
 *
 * Lo importante es el botón: **la siguiente lección, por su nombre**. Antes
 * devolvía a la lista del curso y el jugador aterrizaba sin saber qué tocaba
 * —lo dijo él probándolo en el móvil—. Aprender se para en seco cada vez que
 * hay que decidir dónde hacer clic.
 */
function Terminada({
  sesion,
  alSalir,
  alSiguienteLeccion,
}: {
  sesion: EstadoSesion
  alSalir: () => void
  alSiguienteLeccion?: (leccion: Leccion) => void
}) {
  const { progreso } = useProgreso()
  const media = sesion.manosJugadas > 0 ? Math.round(sesion.puntos / sesion.manosJugadas) : 0
  const siguiente = siguienteLeccion(progreso)
  const cambiaDeModulo = siguiente && siguiente.modulo !== sesion.leccion.modulo

  return (
    <div className="tarjeta" style={{ textAlign: 'center', padding: 24 }}>
      <div style={{ fontSize: 34 }}>✓</div>
      <h2>Lección dominada</h2>
      <p className="suave" style={{ marginBottom: 4 }}>{sesion.leccion.idea}</p>

      {/* En una fila y pequeñas: apiladas empujaban el botón de seguir fuera de
          la pantalla del móvil, que es justo el botón que hay que ver. */}
      <div
        className="tarjeta tenue"
        style={{ display: 'flex', justifyContent: 'space-around', margin: '16px 0', padding: '12px 8px' }}
      >
        {([
          [sesion.puntos, 'Puntos'],
          [sesion.manosJugadas, 'Manos'],
          [media, 'Media'],
        ] as const).map(([valor, nombre]) => (
          <div key={nombre}>
            <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.1 }}>{valor}</div>
            <span className="etiqueta">{nombre}</span>
          </div>
        ))}
      </div>

      {siguiente && alSiguienteLeccion ? (
        <>
          {cambiaDeModulo && (
            <div className="aviso info" style={{ textAlign: 'left', marginBottom: 12 }}>
              <div className="titulo">🎉 Módulo {sesion.leccion.modulo} terminado</div>
              <p className="suave" style={{ margin: 0, fontSize: 14 }}>
                Empiezas el módulo {siguiente.modulo}.
              </p>
            </div>
          )}
          <button
            className="boton principal ancho"
            style={{ display: 'grid', gap: 2, borderRadius: 16, padding: '14px 18px' }}
            onClick={() => alSiguienteLeccion(siguiente)}
          >
            <span style={{ fontSize: 12, opacity: 0.85, fontWeight: 500 }}>Siguiente lección</span>
            <span>{siguiente.titulo} →</span>
          </button>
          <button className="boton" style={{ marginTop: 9 }} onClick={alSalir}>
            Ver todo el curso
          </button>
        </>
      ) : (
        <button className="boton principal ancho" onClick={alSalir}>
          {siguiente ? 'Seguir con el curso →' : '¡Has terminado el curso!'}
        </button>
      )}
    </div>
  )
}

/**
 * El aviso de "esa jugada está en la mesa" solo tiene sentido con pareja o
 * mejor. Con carta alta no hay nada que avisar: no tienes jugada, y decir que
 * "está en la mesa" confunde en vez de aclarar.
 */
function hayQueAvisarDeLaMesa(mano: readonly number[], mesa: readonly number[]): boolean {
  if (categoriaDe(evaluar([...mano, ...mesa])) < Categoria.Pareja) return false
  return !usaTusCartas(mano, mesa)
}

/** Las cinco cartas con las que juega de verdad esa mano, y cómo se llaman. */
function JugadaFormada({ cartas, nombre }: { cartas: number[]; nombre: string }) {
  return (
    <div style={{ marginTop: 8 }}>
      <span className="etiqueta" style={{ color: 'var(--ambar)' }}>
        {nombre}: {describirMano(cartas)}
      </span>
      <div style={{ marginTop: 5 }}>
        <FilaDeCartas cartas={cartas} pequenas />
      </div>
    </div>
  )
}

/** Dos cartas sueltas frente a frente, sin mesa: la pregunta de "cuál vale más". */
function esDuelo(pregunta: { mano?: unknown[]; manoB?: unknown[]; mesa?: unknown[] }): boolean {
  return !pregunta.mesa && pregunta.mano?.length === 1 && pregunta.manoB?.length === 1
}

function textoVeredicto(veredicto: string): string {
  return {
    optima: '¡La mejor jugada!',
    buena: 'Buena decisión',
    dudosa: 'Decisión discutible',
    mala: 'Mala decisión',
  }[veredicto] ?? ''
}

