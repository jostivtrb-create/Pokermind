import { useEffect, useMemo, useRef, useState } from 'react'
import type { Pantalla } from '../App'
import { aleatorioLibre } from '../../motor/aleatorio'
import type { Accion, Juicio } from '../../motor/decision'
import type { Carta } from '../../motor/cartas'
import { juzgar } from '../../motor/decision'
import { Categoria, categoriaDe, describirMano, evaluar } from '../../motor/evaluador'
import { describirTuMano, usaTusCartas } from '../../juego/practica'
import { rangoEstimado, rivalPrincipal } from '../../motor/lectura'
import type { AccionMesa, EstadoMesa } from '../../motor/mesa'
import { aplicar, boteTotal, opcionesDisponibles, paraPagar } from '../../motor/mesa'
import { decidirBot } from '../../motor/bot'
import { describirPerfil } from '../../motor/perfiles'
import type { Torneo } from '../../motor/torneo'
import { cerrarMano, ciegasActuales, crearTorneo, siguienteMano } from '../../motor/torneo'
import { anotarMano } from '../../juego/progreso'
import { useProgreso } from '../estado'
import { sonar } from '../sonido'
import { FilaDeCartas } from '../componentes/Carta'
import { BotonesDeDecision, tamanosParaElegir } from '../componentes/BotonesDeDecision'
import { RangoDelRival } from '../componentes/RangoDelRival'

/**
 * Lo que hiciste en cada decisión, con las fichas y la mesa de ese momento.
 *
 * Antes el repaso decía solo "turn · pagar", y con dos decisiones en la misma
 * calle no había forma de reconstruir la mano: *"no recuerdo que aposté y la
 * info se me hace difusa para ver la línea de tiempo"*. Ahora se guarda la
 * foto del momento: bote, lo que te pedían, lo que pusiste y las cartas que
 * había en la mesa.
 */
interface Apunte {
  juicio: Juicio
  calle: string
  /** Lo que había en el bote ANTES de tu jugada. */
  bote: number
  /** Lo que costaba igualar. */
  paraPagar: number
  /** Lo que acabaste poniendo tú. */
  pusiste: number
  accion: AccionMesa
  mesa: Carta[]
}

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
  const [juicios, setJuicios] = useState<Apunte[]>([])
  const [pensando, setPensando] = useState(false)
  const temporizador = useRef<number | null>(null)

  // Guardar el torneo a medias (D28): se puede cerrar el juego y volver.
  useEffect(() => {
    if (torneo) actualizar((p) => ({ ...p, torneoGuardado: { ...torneo, mesa: null } }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [torneo?.manosJugadas, torneo?.terminado])

  useEffect(() => () => { if (temporizador.current) clearTimeout(temporizador.current) }, [])

  // Retomar un torneo guardado (D28). Lo que se guarda es el torneo, no la mano
  // a medias: al volver se reparte la siguiente. Sin esto, volver a un torneo
  // guardado dejaba una pantalla sin mesa y sin forma de continuar.
  useEffect(() => {
    if (torneo && !torneo.terminado && !mesa && !pensando) repartir(torneo)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  /**
   * Los bots juegan **de uno en uno**, con una pausa entre cada jugada.
   *
   * Antes jugaban los tres de golpe y aparecía el resultado ya hecho: no se veía
   * quién había subido ni quién se había ido, que es justo lo que hay que mirar
   * para aprender a leer a la mesa. La pausa es más corta si el jugador ha
   * quitado las animaciones.
   */
  const avanzarBots = (desde: EstadoMesa) => {
    setPensando(true)
    const pausa = () => (progreso.ajustes.animaciones ? 620 + Math.random() * 420 : 220)

    const paso = (actual: EstadoMesa) => {
      const turno = actual.jugadores[actual.turno]
      const leToca = !actual.manoTerminada && turno && !turno.esHumano && turno.estado === 'jugando'
      if (!leToca) {
        setMesa(copia(actual))
        setPensando(false)
        return
      }
      const decision = decidirBot(actual, azar)
      const siguiente = aplicar(actual, decision.accion, decision.cantidad)
      sonar(decision.accion === 'retirarse' ? 'repartir' : 'ficha')
      setMesa(copia(siguiente))
      temporizador.current = window.setTimeout(() => paso(siguiente), pausa())
    }

    temporizador.current = window.setTimeout(() => paso(desde), pausa())
  }

  const decidir = (accion: Accion, tamanoElegido?: number) => {
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
      tamanoElegido,
    )
    const opciones = opcionesDisponibles(mesa)
    const cuestaSeguir = paraPagar(mesa, humano)
    const traducida: AccionMesa =
      accion === 'retirarse'
        ? cuestaSeguir === 0 ? 'pasar' : 'retirarse'
        : accion === 'pagar'
          ? cuestaSeguir === 0 ? 'pasar' : 'pagar'
          : 'subir'
    const subida = opciones.find((o) => o.accion === 'subir')
    const cantidad =
      traducida === 'subir'
        ? Math.max(subida?.minimo ?? 0, tamanoElegido ?? Math.round((boteTotal(mesa) + cuestaSeguir) * 0.7))
        : 0

    /*
      La foto del momento se saca AQUÍ, no dentro del setJuicios.

      La mesa se modifica sobre sí misma según avanza la mano, y el argumento de
      un `set...` se ejecuta más tarde: leer la calle o el bote ahí dentro daba
      los de dos jugadas después. Por eso el repaso decía "turn" en decisiones
      del flop y llegó a enseñar un bote de 0 en manos ya terminadas.
    */
    const apunte: Apunte = {
      juicio,
      calle: mesa.calle,
      bote: boteTotal(mesa),
      paraPagar: cuestaSeguir,
      pusiste:
        traducida === 'subir'
          ? Math.min(cantidad, subida?.maximo ?? cantidad) + cuestaSeguir
          : traducida === 'pagar'
            ? cuestaSeguir
            : 0,
      accion: traducida,
      mesa: [...mesa.comunitarias],
    }
    setJuicios((lista) => [...lista, apunte])

    sonar(traducida === 'retirarse' ? 'repartir' : 'ficha')
    const siguiente = aplicar(mesa, traducida, Math.min(cantidad, subida?.maximo ?? cantidad))
    setMesa(copia(siguiente))
    if (!siguiente.manoTerminada) avanzarBots(siguiente)
  }

  /*
    Los puntos y la nota se apuntan en cuanto la mano termina, no al pulsar
    "Siguiente mano".

    Antes se hacía al pasar de mano, y el número de arriba se quedaba con el
    valor viejo justo mientras estabas leyendo el repaso de la mano que acababas
    de jugar. La marca evita apuntar dos veces si la pantalla se vuelve a pintar.
  */
  const manoYaApuntada = useRef<number | null>(null)
  useEffect(() => {
    if (!mesa?.manoTerminada || !torneo || juicios.length === 0) return
    if (manoYaApuntada.current === torneo.manosJugadas) return
    manoYaApuntada.current = torneo.manosJugadas

    // Los puntos del modo libre salen de las decisiones, no de si ganaste (D4).
    const puntos = juicios.reduce((t, j) => t + j.juicio.puntos, 0)
    // Una mano con cuatro decisiones no vale más que una con una: cuenta su media.
    const nota = puntos / juicios.length
    actualizar((p) => anotarMano({ ...p, puntosTotales: p.puntosTotales + puntos }, nota))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mesa?.manoTerminada, juicios.length, torneo?.manosJugadas])

  const terminarMano = () => {
    if (!torneo || !mesa) return
    const cerrado = cerrarMano({ ...torneo, mesa })
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
        {mesa && !mesa.manoTerminada && <span className="chip morado">Bote {boteTotal(mesa)}</span>}
        <span className="chip">{torneo.jugadores.filter((j) => j.fichas > 0).length} en pie</span>
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
                  {j.estado === 'retirado' ? (
                    <span className="tenue" style={{ fontSize: 13 }}>se retiró</span>
                  ) : (
                    <span className="tenue" style={{ fontSize: 13 }}>{ultimaJugada(mesa, j.id)}</span>
                  )}
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
                    Tienes {describirTuMano(humano.cartas, mesa.comunitarias)}
                    {categoriaDe(evaluar([...humano.cartas, ...mesa.comunitarias])) >= Categoria.Pareja &&
                    !usaTusCartas(humano.cartas, mesa.comunitarias)
                      ? ', pero está entera en la mesa: eso lo tiene todo el mundo.'
                      : '.'}
                  </p>
                )}
              </div>
            )}

            {pensando && <p className="tenue" style={{ marginTop: 14 }}>Están pensando…</p>}

            {meToca && humano && (
              <BotonesDeDecision
                paraPagar={paraPagar(mesa, humano)}
                opcionesDeSubida={tamanosParaElegir(
                  boteTotal(mesa),
                  paraPagar(mesa, humano),
                  humano.fichas,
                  rivalPrincipal(mesa, humano)?.fichas ?? humano.fichas,
                )}
                alDecidir={decidir}
              />
            )}

            {mesa.manoTerminada && (
              <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
                <div className="aviso info">
                  <div className="titulo">Mano terminada</div>
                  {mesa.ganancias.map((g) => {
                    const jugador = mesa.jugadores.find((j) => j.id === g.jugador)!
                    return (
                      <p key={g.jugador} style={{ margin: 0 }}>
                        {/* "Tú se lleva 224" no lo dice nadie. */}
                        <strong>{jugador.esHumano ? 'Te llevas' : `${jugador.nombre} se lleva`}</strong>{' '}
                        {g.fichas.toLocaleString('es')}
                        {g.motivo === 'showdown' && jugador.cartas
                          ? ` con ${describirMano([...jugador.cartas, ...mesa.comunitarias])}`
                          : ' porque se retiraron los demás'}
                        .
                      </p>
                    )
                  })}
                </div>

                {(() => {
                  const humanoMesa = mesa.jugadores.find((j) => j.esHumano)
                  const rival = humanoMesa ? rivalPrincipal(mesa, humanoMesa) : null
                  if (!rival || !humanoMesa?.cartas) return null
                  return (
                    <RangoDelRival
                      rango={rangoEstimado(mesa, rival, [...humanoMesa.cartas, ...mesa.comunitarias])}
                      mesa={mesa.comunitarias}
                      vistas={[...humanoMesa.cartas, ...mesa.comunitarias]}
                    />
                  )
                })()}

                {juicios.length > 0 && <ComoFueLaMano apuntes={juicios} />}

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

/**
 * Una copia de la mesa para entregársela a React.
 *
 * `aplicar` trabaja sobre la misma mesa y devuelve ese mismo objeto (así es
 * barato y así lo usan los tests del motor). Pero a React hay que darle un
 * objeto NUEVO: si la referencia no cambia, se salta el repintado, y entonces
 * lo que dependa de que la mano haya terminado no llega a enterarse. Por eso la
 * nota y los puntos no se apuntaban hasta pasar de mano.
 */
function copia(mesa: EstadoMesa): EstadoMesa {
  return { ...mesa }
}

/** Lo último que hizo ese jugador en esta calle, para que se vea la mano jugarse. */
function ultimaJugada(mesa: EstadoMesa, jugador: number): string {
  const suyas = mesa.historial.filter((h) => h.jugador === jugador && h.calle === mesa.calle)
  const ultima = suyas[suyas.length - 1]
  if (!ultima) return ''
  if (ultima.accion === 'pasar') return 'pasa'
  if (ultima.accion === 'pagar') return 'paga'
  if (ultima.accion === 'retirarse') return 'se retira'
  // Si nadie había puesto fichas en esta calle, no está subiendo: está apostando.
  const habiaApuesta = suyas.length > 1 || mesa.historial.some(
    (h) => h.calle === mesa.calle && h.accion === 'subir' && h.jugador !== jugador,
  )
  return `${habiaApuesta ? 'sube' : 'apuesta'} ${ultima.cantidad}`
}

const NOMBRE_DE_CALLE: Record<string, string> = {
  preflop: 'Antes del flop',
  flop: 'En el flop',
  turn: 'En el turn',
  river: 'En el river',
}

/** Qué hiciste, en fichas y en cristiano. */
function loQueHiciste(a: Apunte): string {
  const n = (x: number) => x.toLocaleString('es')
  if (a.accion === 'pasar') return 'Pasaste, sin poner nada'
  if (a.accion === 'retirarse') return `Te retiraste y dejaste la mano`
  if (a.accion === 'pagar') return `Pagaste ${n(a.pusiste)}`
  const subida = a.pusiste - a.paraPagar
  return a.paraPagar > 0
    ? `Subiste ${n(subida)} por encima de su apuesta: pusiste ${n(a.pusiste)}`
    : `Apostaste ${n(a.pusiste)}`
}

/**
 * El repaso de la mano como una línea de tiempo.
 *
 * Con dos decisiones en la misma calle, un listado de "turn · pagar" no dice
 * nada. Aquí cada paso enseña la mesa que había, lo que te pedían y lo que
 * pusiste, en orden y con el hilo dibujado: se lee como se jugó.
 */
function ComoFueLaMano({ apuntes }: { apuntes: Apunte[] }) {
  const total = apuntes.reduce((t, a) => t + a.juicio.puntos, 0)
  /*
    Los puntos totales solo suben, así que por sí solos no dicen si estás
    jugando mejor o peor. La nota media de la mano sí: es sobre 100 y se puede
    comparar con la de la mano anterior.
  */
  const media = Math.round(total / apuntes.length)

  return (
    <div className="tarjeta">
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <span className="etiqueta">Cómo fue la mano</span>
        <span className="chip" style={{ marginLeft: 'auto' }}>Nota {media} de 100</span>
        <span className="chip morado">+{total} en total</span>
      </div>

      <div style={{ marginTop: 12 }}>
        {apuntes.map((a, i) => {
          const ultimo = i === apuntes.length - 1
          const mal = a.juicio.veredicto === 'mala'
          return (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '24px 1fr', gap: 12 }}>
              {/* El hilo: el número de la jugada y la línea que une con la siguiente. */}
              <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr', justifyItems: 'center' }}>
                <span
                  style={{
                    width: 24, height: 24, borderRadius: '50%', display: 'grid', placeItems: 'center',
                    fontSize: 12.5, fontWeight: 700,
                    background: mal ? 'var(--rojo-tenue)' : 'var(--verde-tenue)',
                    color: mal ? 'var(--rojo)' : 'var(--verde)',
                  }}
                >
                  {i + 1}
                </span>
                {!ultimo && <span style={{ width: 2, background: 'var(--borde)', borderRadius: 2 }} />}
              </div>

              <div style={{ paddingBottom: ultimo ? 0 : 16, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <strong style={{ fontSize: 14.5 }}>{NOMBRE_DE_CALLE[a.calle] ?? a.calle}</strong>
                  <span className="chip" style={{ fontSize: 11.5 }}>Bote {a.bote.toLocaleString('es')}</span>
                  <span className="chip" style={{ fontSize: 11.5 }}>
                    {a.paraPagar > 0 ? `Te pedían ${a.paraPagar.toLocaleString('es')}` : 'Nadie había apostado'}
                  </span>
                  <span className="chip morado" style={{ marginLeft: 'auto' }}>+{a.juicio.puntos}</span>
                </div>

                {a.mesa.length > 0 && (
                  <div style={{ marginTop: 7 }}>
                    <FilaDeCartas cartas={a.mesa} pequenas />
                  </div>
                )}

                <p style={{ margin: '7px 0 0', fontSize: 14, fontWeight: 600 }}>{loQueHiciste(a)}</p>
                <p className="suave" style={{ margin: '3px 0 0', fontSize: 13.5 }}>{a.juicio.porQue}</p>
              </div>
            </div>
          )
        })}
      </div>

      <p className="tenue" style={{ fontSize: 13, margin: '14px 0 0' }}>
        Los puntos son por cómo decidiste, no por si ganaste la mano.
      </p>
    </div>
  )
}
