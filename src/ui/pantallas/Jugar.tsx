import { useState } from 'react'
import type { Pantalla } from '../App'
import { useProgreso } from '../estado'
import {
  MODULOS_PREVISTOS, TEMARIO, avanceDelCurso, leccionDisponible, leccionTerminada,
  leccionesDeSuNivel, moduloDeEntrada, moduloTerminado, siguienteLeccion,
} from '../../contenido/temario'
import type { Leccion } from '../../juego/lecciones'
import { erroresParaRepasar } from '../../juego/progreso'
import { fechaDeHoy } from '../../juego/retoDiario'
import { Entrenador } from './Entrenador'
import { RepasoDeErrores, RetoDelDia } from './ManoDelDia'

/**
 * El curso: los módulos en orden, con las lecciones que se van abriendo.
 *
 * Nadie se salta lecciones (D23), así que solo está abierta la siguiente sin
 * terminar. Las ya hechas se pueden repetir para repasar.
 */
export function Jugar({ ir }: { ir: (p: Pantalla) => void }) {
  const { progreso } = useProgreso()
  const [enCurso, setEnCurso] = useState<Leccion | null>(null)
  const [extra, setExtra] = useState<'reto' | 'repaso' | null>(null)

  if (enCurso) {
    return <Entrenador leccion={enCurso} alSalir={() => setEnCurso(null)} />
  }
  if (extra === 'reto') return <RetoDelDia alSalir={() => setExtra(null)} />
  if (extra === 'repaso') return <RepasoDeErrores alSalir={() => setExtra(null)} />

  const siguiente = siguienteLeccion(progreso)
  const avance = avanceDelCurso(progreso)
  const entrada = moduloDeEntrada(progreso)
  const suyas = leccionesDeSuNivel(progreso)
  const libreAbierto = progreso.modoLibreDesbloqueado || moduloTerminado(progreso, 1)

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div>
        <h1>Entrenador</h1>
        <p className="suave">
          Una idea por lección, y a practicarla enseguida. No se avanza por pulsar «siguiente»:
          se avanza cuando aciertas seguido.
        </p>
        <div className="progreso-fino"><div style={{ width: `${Math.round(avance * 100)}%` }} /></div>
      </div>

      <div className="rejilla dos">
        <button
          className="tarjeta"
          style={{ textAlign: 'left', cursor: 'pointer' }}
          onClick={() => setExtra('reto')}
        >
          <span className="etiqueta">Reto del día</span>
          <h3 style={{ margin: '4px 0' }}>
            {progreso.retoDiario?.fecha === fechaDeHoy() ? '✓ Ya jugado hoy' : 'Una mano difícil'}
          </h3>
          <p className="suave" style={{ fontSize: 13.5, margin: 0 }}>
            La misma para todo el mundo, sin ayudas. Cambia cada día.
          </p>
        </button>

        <button
          className="tarjeta"
          style={{ textAlign: 'left', cursor: 'pointer' }}
          onClick={() => setExtra('repaso')}
        >
          <span className="etiqueta">Repaso de errores</span>
          <h3 style={{ margin: '4px 0' }}>
            {erroresParaRepasar(progreso).length > 0
              ? `${erroresParaRepasar(progreso).length} manos esperando`
              : 'Nada pendiente'}
          </h3>
          <p className="suave" style={{ fontSize: 13.5, margin: 0 }}>
            Manos que fallaste hace días, cambiadas de palo para que no valga memorizar.
          </p>
        </button>
      </div>

      <div className="tarjeta" style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 260px' }}>
          <span className="etiqueta">Modo libre</span>
          <h3 style={{ margin: '4px 0' }}>Torneo contra tres bots</h3>
          <p className="suave" style={{ fontSize: 14, margin: 0 }}>
            {libreAbierto
              ? 'Una partida de verdad, con fichas y ciegas que suben. Los puntos siguen premiando las decisiones, ganes o pierdas.'
              : 'Se abre al terminar el módulo 1. Sentarse en una mesa sin saber qué es una ciega no enseña nada.'}
          </p>
        </div>
        <button
          className={`boton ${libreAbierto ? 'principal' : ''}`}
          disabled={!libreAbierto}
          onClick={() => ir('libre')}
        >
          {libreAbierto ? 'Jugar torneo →' : '🔒 Bloqueado'}
        </button>
      </div>

      {TEMARIO.map((modulo) => (
        <section
          key={modulo.numero}
          className="tarjeta"
          style={modulo.numero < entrada ? { opacity: 0.72 } : undefined}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span className="chip morado">Módulo {modulo.numero}</span>
            <h3 style={{ margin: 0 }}>{modulo.titulo}</h3>
            {moduloTerminado(progreso, modulo.numero) && <span className="chip">✓ Completo</span>}
            {modulo.numero < entrada && !moduloTerminado(progreso, modulo.numero) && (
              <span className="chip" title="Por debajo de tu nivel: está abierto por si quieres repasarlo">
                Repaso opcional
              </span>
            )}
          </div>
          <p className="suave" style={{ fontSize: 14, margin: '8px 0 14px' }}>{modulo.resumen}</p>

          <div style={{ display: 'grid', gap: 8 }}>
            {modulo.lecciones.map((leccion, i) => {
              const hecha = leccionTerminada(progreso, leccion.id)
              const abierta = leccionDisponible(progreso, leccion.id)
              const esSiguiente = siguiente?.id === leccion.id
              return (
                <button
                  key={leccion.id}
                  className="silla"
                  style={{
                    cursor: abierta ? 'pointer' : 'not-allowed',
                    opacity: abierta ? 1 : 0.5,
                    borderColor: esSiguiente ? 'var(--morado)' : undefined,
                    textAlign: 'left',
                  }}
                  disabled={!abierta}
                  onClick={() => setEnCurso(leccion)}
                >
                  <span style={{ display: 'flex', gap: 11, alignItems: 'center', minWidth: 0 }}>
                    <span
                      style={{
                        width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                        display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 700,
                        background: hecha ? 'var(--verde-tenue)' : esSiguiente ? 'var(--morado)' : 'var(--superficie-2)',
                        color: hecha ? 'var(--verde)' : '#fff',
                      }}
                    >
                      {hecha ? '✓' : i + 1}
                    </span>
                    <span style={{ minWidth: 0 }}>
                      <span style={{ fontWeight: 600, display: 'block' }}>{leccion.titulo}</span>
                      <span className="tenue" style={{ fontSize: 13 }}>{leccion.idea}</span>
                    </span>
                  </span>
                  <span className="tenue" style={{ flexShrink: 0 }}>{abierta ? '›' : '🔒'}</span>
                </button>
              )
            })}
          </div>
        </section>
      ))}

      <section className="tarjeta tenue">
        <span className="etiqueta">Lo que viene después</span>
        <p className="suave" style={{ fontSize: 14, margin: '8px 0 12px' }}>
          El curso completo son nueve módulos, de «qué es una ciega» hasta jugar bien de verdad.
          Estos todavía se están escribiendo:
        </p>
        <div style={{ display: 'grid', gap: 7 }}>
          {MODULOS_PREVISTOS.filter((m) => !TEMARIO.some((t) => t.numero === m.numero)).map((m) => (
            <div key={m.numero} className="silla fuera">
              <span>
                <strong>{m.numero}. {m.titulo}</strong>
                <span className="tenue" style={{ fontSize: 13, display: 'block' }}>{m.resumen}</span>
              </span>
              <span className="tenue">En preparación</span>
            </div>
          ))}
        </div>
      </section>

      <p className="tenue" style={{ fontSize: 13, textAlign: 'center' }}>
        {suyas.filter((l) => leccionTerminada(progreso, l.id)).length} de {suyas.length} lecciones de
        tu nivel terminadas
      </p>
    </div>
  )
}
