import { useEffect, useMemo, useRef, useState } from 'react'
import type { Pantalla } from '../App'
import { aleatorioLibre } from '../../motor/aleatorio'
import type { Accion, Juicio } from '../../motor/decision'
import { juzgar } from '../../motor/decision'
import { describirMano } from '../../motor/evaluador'
import { usaTusCartas } from '../../juego/practica'
import { rangoEstimado, rivalPrincipal } from '../../motor/lectura'
import type { AccionMesa, EstadoMesa } from '../../motor/mesa'
import { aplicar, boteTotal, opcionesDisponibles, paraPagar } from '../../motor/mesa'
import { describirPerfil } from '../../motor/perfiles'
import type { Torneo } from '../../motor/torneo'
import { cerrarMano, ciegasActuales, crearTorneo, jugarHastaElHumano, siguienteMano } from '../../motor/torneo'
import { useProgreso } from '../estado'
import { FilaDeCartas } from '../componentes/Carta'

/**
 * El modo libre: torneo corto contra tres bots (D21).
 *
 * La diferencia con el entrenador es cuándo se corrige: aquí nada interrumpe la
 * partida y el repaso llega al terminar la mano (D33). Los puntos siguen
 * premiando las decisiones, se gane o se pierda la mano, que es la idea del juego.
 */
export function Libre({ ir }: { ir: (p: Pantalla) => void }) {
  const { progreso, actualizar } = useProgreso()
  const azar = useMemo(() => aleatorioLibre(), [])
  const [torneo, setTorneo] = useState<Torneo | null>(() => (progreso.torneoGuardado as Torneo) ?? null)
  const [mesa, setMesa] = useState<EstadoMesa | null>(null)
  const [juicios, setJuicios] = useState<Array<{ juicio: Juicio; calle: string }>>([])
  const [pensando, setPensando] = useState(false)
  const temporizador = useRef<number | null>(null)

  // Guardar el torneo a medias (D28): se puede cerrar el juego y volver.
  useEffect(() => {
    if (torneo) actualizar((p) => ({ ...p, torneoGuardado: { ...torneo, mesa: null } }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [torneo?.manosJugadas, torneo?.terminado])

  useEffect(() => () => { if (temporizador.current) clearTimeout(temporizador.current) }, [])

  const empezar = () => {
    const nuevo = crearTorneo({ dificultad: 0.5 })
    setTorneo(nuevo)
    setJuicios([])
    repartir(nuevo)
  }

  const repartir = (base: Torneo) => {
    const conMano = siguienteMano(base, azar)
    setTorneo(conMano)
    setJuicios([])
    if (conMano.mesa) avanzarBots(conMano.mesa)
  }

  const avanzarBots = (desde: EstadoMesa) => {
    setPensando(true)
    // Una pausa corta para que se vea jugar a los bots en vez de aparecer todo hecho.
    temporizador.current = window.setTimeout(() => {
      const { mesa: resultado } = jugarHastaElHumano(desde, azar)
      setMesa(resultado)
      setPensando(false)
    }, 550)
  }

  const decidir = (accion: Accion) => {
    if (!mesa) return
    const humano = mesa.jugadores[mesa.turno]
    if (!humano?.cartas) return

    // Se juzga la decisión con el mismo motor del entrenador, pero el jugador no
    // lo ve hasta que la mano termina: en una partida, corregir a mitad rompe el juego.
    const rival = rivalPrincipal(mesa, humano)
    const juicio = juzgar(
      {
        mano: humano.cartas,
        mesa: mesa.comunitarias,
        calle: mesa.calle,
        bote: boteTotal(mesa),
        paraPagar: paraPagar(mesa, humano),
        tusFichas: humano.fichas,
        fichasRival: rival?.fichas ?? humano.fichas,
        rangoRival: rival ? rangoEstimado(mesa, rival, [...humano.cartas, ...mesa.comunitarias]) : rangoEstimado(mesa, humano),
        perfilRival: rival?.perfil,
      },
      accion,
      'intermedia',
    )
    setJuicios((lista) => [...lista, { juicio, calle: mesa.calle }])

    const opciones = opcionesDisponibles(mesa)
    const traducida: AccionMesa =
      accion === 'retirarse'
        ? paraPagar(mesa, humano) === 0 ? 'pasar' : 'retirarse'
        : accion === 'pagar'
          ? paraPagar(mesa, humano) === 0 ? 'pasar' : 'pagar'
          : 'subir'
    const subida = opciones.find((o) => o.accion === 'subir')
    const cantidad = traducida === 'subir'
      ? Math.max(subida?.minimo ?? 0, Math.round((boteTotal(mesa) + paraPagar(mesa, humano)) * 0.7))
      : 0

    const siguiente = aplicar(mesa, traducida, Math.min(cantidad, subida?.maximo ?? cantidad))
    setMesa(siguiente)
    if (!siguiente.manoTerminada) avanzarBots(siguiente)
  }

  const terminarMano = () => {
    if (!torneo || !mesa) return
    const cerrado = cerrarMano({ ...torneo, mesa })
    // Los puntos del modo libre salen de las decisiones, no de si ganaste (D4).
    const puntos = juicios.reduce((t, j) => t + j.juicio.puntos, 0)
    actualizar((p) => ({ ...p, puntosTotales: p.puntosTotales + puntos }))
    setTorneo(cerrado)
    setMesa(null)
    if (!cerrado.terminado) repartir(cerrado)
  }

  if (!torneo || (torneo.terminado && !mesa)) {
    return <Portada torneo={torneo} alEmpezar={empezar} ir={ir} />
  }

  const humano = mesa?.jugadores.find((j) => j.esHumano)
  const meToca = !!mesa && !mesa.manoTerminada && mesa.jugadores[mesa.turno]?.esHumano && !pensando
  const ciegas = ciegasActuales(torneo)

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <button className="boton" style={{ padding: '8px 14px' }} onClick={() => ir('jugar')}>← Salir</button>
        <span className="chip">Mano {torneo.manosJugadas + 1}</span>
        <span className="chip">Ciegas {ciegas.ciegaPequena}/{ciegas.ciegaGrande}</span>
        {mesa && <span className="chip morado">Bote {boteTotal(mesa)}</span>}
      </div>

      {mesa && (
        <>
          <div style={{ display: 'grid', gap: 8 }}>
            {mesa.jugadores.map((j, i) => (
              <div
                key={j.id}
                className={`silla ${mesa.turno === i && !mesa.manoTerminada ? 'turno' : ''} ${j.estado === 'retirado' || j.estado === 'eliminado' ? 'fuera' : ''}`}
              >
                <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {mesa.boton === i && <span className="chip" title="El botón">D</span>}
                  <strong>{j.nombre}</strong>
                  {j.estado === 'retirado' && <span className="tenue" style={{ fontSize: 13 }}>se retiró</span>}
                  {j.estado === 'allin' && <span className="chip">todo-in</span>}
                </span>
                <span style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  {j.apostadoEnLaCalle > 0 && <span className="tenue">puso {j.apostadoEnLaCalle}</span>}
                  <strong>{j.fichas}</strong>
                </span>
              </div>
            ))}
          </div>

          <div className="mesa">
            <span className="etiqueta">Mesa</span>
            <div style={{ marginTop: 6 }}>
              <FilaDeCartas cartas={mesa.comunitarias} huecos={5 - mesa.comunitarias.length} />
            </div>

            {humano?.cartas && (
              <div style={{ marginTop: 16 }}>
                <span className="etiqueta">Tus cartas</span>
                <div style={{ marginTop: 6 }}><FilaDeCartas cartas={humano.cartas} /></div>
                {mesa.comunitarias.length > 0 && (
                  <p className="tenue" style={{ fontSize: 13, margin: '6px 0 0' }}>
                    Tienes {describirMano([...humano.cartas, ...mesa.comunitarias])}
                    {usaTusCartas(humano.cartas, mesa.comunitarias)
                      ? '.'
                      : ', pero está entera en la mesa: eso lo tiene todo el mundo.'}
                  </p>
                )}
              </div>
            )}

            {pensando && <p className="tenue" style={{ marginTop: 14 }}>Están pensando…</p>}

            {meToca && humano && (
              <div className="acciones">
                <button className="accion retirarse" onClick={() => decidir('retirarse')}>
                  <span>✕ {paraPagar(mesa, humano) === 0 ? 'Pasar' : 'Retirarse'}</span>
                  <span className="sub">{paraPagar(mesa, humano) === 0 ? 'Sin poner nada' : 'Sales de la mano'}</span>
                </button>
                <button className="accion pagar" onClick={() => decidir('pagar')}>
                  <span>≡ {paraPagar(mesa, humano) === 0 ? 'Pasar' : 'Pagar'}</span>
                  <span className="sub">{paraPagar(mesa, humano) > 0 ? `Pones ${paraPagar(mesa, humano)}` : 'Gratis'}</span>
                </button>
                <button className="accion subir" onClick={() => decidir('subir')}>
                  <span>↗ Subir</span>
                  <span className="sub">Aprietas el bote</span>
                </button>
              </div>
            )}

            {mesa.manoTerminada && (
              <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
                <div className="aviso info">
                  <div className="titulo">Mano terminada</div>
                  {mesa.ganancias.map((g) => {
                    const jugador = mesa.jugadores.find((j) => j.id === g.jugador)!
                    return (
                      <p key={g.jugador} style={{ margin: 0 }}>
                        <strong>{jugador.nombre}</strong> se lleva {g.fichas}
                        {g.motivo === 'showdown' && jugador.cartas
                          ? ` con ${describirMano([...jugador.cartas, ...mesa.comunitarias])}`
                          : ' porque se retiraron los demás'}
                        .
                      </p>
                    )
                  })}
                </div>

                {juicios.length > 0 && (
                  <div className="tarjeta">
                    <span className="etiqueta">Tus decisiones en esta mano</span>
                    <div style={{ display: 'grid', gap: 9, marginTop: 8 }}>
                      {juicios.map(({ juicio, calle }, i) => (
                        <div key={i} className={`aviso ${juicio.veredicto === 'mala' ? 'mal' : 'bien'}`} style={{ padding: 11 }}>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14 }}>
                            <strong>{calle}</strong>
                            <span>{juicio.elegida.accion}</span>
                            <span className="chip morado" style={{ marginLeft: 'auto' }}>+{juicio.puntos}</span>
                          </div>
                          <p className="suave" style={{ margin: '4px 0 0', fontSize: 13.5 }}>{juicio.porQue}</p>
                        </div>
                      ))}
                    </div>
                    <p className="tenue" style={{ fontSize: 13, marginTop: 10, marginBottom: 0 }}>
                      Los puntos son por cómo decidiste, no por si ganaste la mano.
                    </p>
                  </div>
                )}

                <button className="boton principal ancho" onClick={terminarMano}>Siguiente mano →</button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function Portada({ torneo, alEmpezar, ir }: { torneo: Torneo | null; alEmpezar: () => void; ir: (p: Pantalla) => void }) {
  const terminado = torneo?.terminado
  const humano = torneo?.jugadores.find((j) => j.esHumano)

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <button className="boton" style={{ padding: '8px 14px', justifySelf: 'start' }} onClick={() => ir('jugar')}>
        ← Volver
      </button>

      {terminado && humano && (
        <div className="tarjeta">
          <span className="etiqueta">Torneo terminado</span>
          <h2 style={{ marginTop: 6 }}>
            {humano.puesto === 1 ? '¡Ganaste el torneo!' : `Quedaste ${humano.puesto}º de 4`}
          </h2>
          {/* Los estilos de los bots se revelan al final, nunca durante la partida (D24). */}
          <span className="etiqueta">Cómo jugaba cada uno</span>
          <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
            {torneo!.jugadores.filter((j) => !j.esHumano).map((j) => (
              <div key={j.id} className="tarjeta tenue" style={{ padding: 12 }}>
                <strong>{j.nombre}</strong> <span className="chip">{j.perfil?.nombre}</span>
                <div className="suave" style={{ fontSize: 13.5, marginTop: 3 }}>
                  {j.perfil && describirPerfil(j.perfil)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="tarjeta">
        <h1>Modo libre</h1>
        <p className="suave">
          Torneo de cuatro: tú y tres bots. Las ciegas suben cada pocas manos y se juega hasta que
          queda uno. Cada bot tiene un carácter distinto que se sortea al empezar — y no te lo digo
          hasta el final, porque leer al rival es parte del juego.
        </p>
        <p className="suave">
          Ganes o pierdas, los puntos son por decidir bien. Puedes quedar último habiendo jugado
          estupendamente: eso también es póker.
        </p>
        <button className="boton principal ancho" onClick={alEmpezar}>
          {terminado ? 'Otro torneo' : 'Empezar torneo'} →
        </button>
      </div>
    </div>
  )
}
