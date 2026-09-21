import type { Pantalla } from '../App'
import { Pica } from '../App'
import { Carta } from '../componentes/Carta'
import { deCodigo } from '../../motor/cartas'
import { useProgreso } from '../estado'
import {
  TEMARIO, avanceDelCurso, leccionTerminada, leccionesDeSuNivel, moduloTerminado, siguienteLeccion,
} from '../../contenido/temario'

export function Inicio({ ir }: { ir: (p: Pantalla) => void }) {
  const { progreso } = useProgreso()
  const siguiente = siguienteLeccion(progreso)
  const avance = avanceDelCurso(progreso)
  const suyas = leccionesDeSuNivel(progreso)
  const hechas = suyas.filter((l) => leccionTerminada(progreso, l.id)).length
  const libreAbierto = progreso.modoLibreDesbloqueado || moduloTerminado(progreso, 1)
  const moduloUno = TEMARIO.find((m) => m.numero === 1)
  const faltanParaLibre = moduloUno
    ? moduloUno.lecciones.filter((l) => !leccionTerminada(progreso, l.id)).length
    : 0
  const empezado = progreso.decisiones > 0

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <section className="tarjeta" style={{ padding: 26, background: 'linear-gradient(135deg, #171d3a, #12162c)' }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 320px' }}>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Pica tamano={30} />
              <span>
                Poker<span className="marca-mente">Mind</span>
              </span>
            </h1>
            <p style={{ color: 'var(--morado-claro)', fontWeight: 600, marginTop: -6 }}>
              Piensa. Decide. Mejora.
            </p>
            <p className="suave" style={{ maxWidth: 440 }}>
              Un juego para aprender a tomar buenas decisiones en el póker usando probabilidades.
              Sin dinero. Sin suerte. Solo tú y tu mente.
            </p>
            <button className="boton principal" onClick={() => ir('jugar')}>
              {empezado ? 'Seguir donde lo dejaste' : 'Jugar ahora'} →
            </button>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ transform: 'rotate(-8deg)' }}><Carta carta={deCodigo('As')} /></div>
            <div style={{ transform: 'rotate(6deg)' }}><Carta carta={deCodigo('Kh')} /></div>
          </div>
        </div>
      </section>

      {siguiente && (
        <section className="tarjeta">
          <span className="etiqueta">{empezado ? 'Vas por aquí' : 'Empiezas por aquí'}</span>
          <h3 style={{ marginTop: 6 }}>
            Módulo {siguiente.modulo} · {siguiente.titulo}
          </h3>
          <p className="suave" style={{ marginBottom: 12 }}>{siguiente.idea}</p>
          <div className="progreso-fino" style={{ marginBottom: 10 }}>
            <div style={{ width: `${Math.round(avance * 100)}%` }} />
          </div>
          <p className="tenue" style={{ fontSize: 13, margin: 0 }}>
            {hechas} de {suyas.length} lecciones terminadas
          </p>
        </section>
      )}

      {/*
        El modo libre también desde la portada. Estaba solo al final de la
        pantalla del curso y el propio usuario no lo encontraba: "¿dónde puedo
        jugar normal, sin el modo entrenador?".
      */}
      <section className="tarjeta" style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 240px' }}>
          <span className="etiqueta">Jugar sin entrenador</span>
          <h3 style={{ margin: '4px 0' }}>Torneo contra tres bots</h3>
          <p className="suave" style={{ fontSize: 13.5, margin: 0 }}>
            {libreAbierto
              ? 'Una partida de verdad: fichas, ciegas que suben y eliminación. Los puntos siguen siendo por decidir bien.'
              : `Te ${faltanParaLibre === 1 ? 'falta 1 lección' : `faltan ${faltanParaLibre} lecciones`} del módulo 1 para abrirlo.`}
          </p>
        </div>
        <button
          className={`boton ${libreAbierto ? 'principal' : ''}`}
          disabled={!libreAbierto}
          onClick={() => ir('libre')}
        >
          {libreAbierto ? 'Jugar →' : '🔒 Bloqueado'}
        </button>
      </section>

      <section className="rejilla tres">
        {[
          ['🧠', 'Aprende probabilidades', 'Ves el porcentaje real de cada mano, no una corazonada.'],
          ['◎', 'Toma mejores decisiones', 'El juego te dice si acertaste aunque la carta final no ayudara.'],
          ['▥', 'Mide tu progreso', 'Tus aciertos por calle, para saber dónde flojeas.'],
        ].map(([icono, titulo, texto]) => (
          <div className="tarjeta" key={titulo}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{icono}</div>
            <h3 style={{ fontSize: 15, marginBottom: 4 }}>{titulo}</h3>
            <p className="suave" style={{ fontSize: 13.5, margin: 0 }}>{texto}</p>
          </div>
        ))}
      </section>

      <section className="aviso info">
        <div className="titulo">Aquí no importa la suerte, importa lo que decides</div>
        <p className="suave" style={{ margin: 0, fontSize: 14 }}>
          Puedes jugar perfecto y perder la mano: eso es el póker. Por eso los puntos de este juego
          se los lleva la decisión, no el resultado.
        </p>
      </section>
    </div>
  )
}
