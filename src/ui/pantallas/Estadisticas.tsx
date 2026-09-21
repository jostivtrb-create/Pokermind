import type { Calle } from '../../motor/decision'
import { NOMBRES_CALLE } from '../../motor/decision'
import {
  MANOS_DE_LA_NOTA, manosConNota, mediaPorCalle, notaReciente, porcentajeAciertos, tendenciaDeLaNota,
} from '../../juego/progreso'
import { erroresParaRepasar } from '../../juego/progreso'
import { useProgreso } from '../estado'
import { Barra } from '../componentes/BarraProbabilidad'

const CALLES: Calle[] = ['preflop', 'flop', 'turn', 'river']
const COLORES: Record<Calle, string> = {
  preflop: 'var(--verde)',
  flop: 'var(--morado)',
  turn: 'var(--azul)',
  river: 'var(--rojo)',
}

export function Estadisticas() {
  const { progreso } = useProgreso()
  const aciertos = porcentajeAciertos(progreso)
  const nota = notaReciente(progreso)
  const manos = manosConNota(progreso)
  const tendencia = tendenciaDeLaNota(progreso)
  const categorias = Object.entries(progreso.categorias).sort((a, b) => b[1] - a[1]).slice(0, 6)
  const totalCategorias = categorias.reduce((t, [, n]) => t + n, 0) || 1
  const porRepasar = erroresParaRepasar(progreso).length

  if (progreso.decisiones === 0) {
    return (
      <div>
        <h1>Tus estadísticas</h1>
        <div className="tarjeta">
          <p className="suave" style={{ margin: 0 }}>
            Aquí aparecerá tu nota —lo bien que decides, de 0 a 100—, en qué calle flojeas y qué
            manos te salen más. Juega unas cuantas manos y vuelve.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <h1>Tus estadísticas</h1>

      {/*
        La NOTA es el número grande (D63). Los puntos totales están abajo y en
        pequeño: solo suben, así que no dicen si estás jugando mejor o peor.
      */}
      <div className="tarjeta" style={{ display: 'grid', gap: 10 }}>
        <span className="etiqueta">
          Tu nota {manos >= MANOS_DE_LA_NOTA
            ? `(últimas ${MANOS_DE_LA_NOTA} manos)`
            : `(llevas ${manos} ${manos === 1 ? 'mano' : 'manos'} de ${MANOS_DE_LA_NOTA})`}
        </span>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
          <div className="numerote" style={{ color: colorDeNota(nota) }}>{Math.round(nota)}</div>
          <span className="suave" style={{ fontSize: 15 }}>de 100</span>
          {tendencia !== null && Math.abs(tendencia) >= 2 && (
            <span
              className="chip"
              style={{ marginLeft: 'auto', color: tendencia > 0 ? 'var(--verde)' : 'var(--rojo)' }}
            >
              {tendencia > 0 ? '▲' : '▼'} {Math.abs(Math.round(tendencia))} respecto a antes
            </span>
          )}
        </div>
        <div className="progreso-fino"><div style={{ width: `${Math.round(nota)}%` }} /></div>
        <p className="tenue" style={{ fontSize: 13, margin: 0 }}>
          {manos < MANOS_DE_LA_NOTA
            ? `Cada mano que juegas puntúa de 0 a 100 según lo bien que decidiste. Con ${MANOS_DE_LA_NOTA} manos la media ya dice algo.`
            : 'La media de lo bien que has decidido en tus últimas manos. Sube y baja contigo: es lo que dice si estás mejorando.'}
        </p>
      </div>

      <div className="rejilla dos">
        <div className="tarjeta">
          <div className="numerote">{progreso.decisiones}</div>
          <span className="etiqueta">Decisiones</span>
        </div>
        <div className="tarjeta">
          <div className="numerote" style={{ color: 'var(--verde)' }}>{Math.round(aciertos * 100)}%</div>
          <span className="etiqueta">Decisiones correctas</span>
        </div>
      </div>

      <div className="tarjeta">
        <h3>Rendimiento por calle</h3>
        <p className="tenue" style={{ fontSize: 13, marginTop: -6 }}>
          Dónde decides mejor y dónde se te escapan las fichas.
        </p>
        {CALLES.map((calle) => (
          <Barra
            key={calle}
            nombre={NOMBRES_CALLE[calle].replace('antes del flop', 'preflop')}
            valor={mediaPorCalle(progreso, calle)}
            color={COLORES[calle]}
          />
        ))}
      </div>

      {categorias.length > 0 && (
        <div className="tarjeta">
          <h3>Manos más comunes</h3>
          {categorias.map(([nombre, veces]) => (
            <Barra key={nombre} nombre={nombre} valor={veces / totalCategorias} />
          ))}
        </div>
      )}

      <p className="tenue" style={{ fontSize: 13, textAlign: 'center', margin: 0 }}>
        {progreso.puntosTotales.toLocaleString('es')} puntos acumulados desde que empezaste. Suman
        siempre: lo que dice si estás mejorando es la nota.
      </p>

      <div className="aviso info">
        <div className="titulo">💡 Repaso pendiente</div>
        <p className="suave" style={{ margin: 0, fontSize: 14 }}>
          {porRepasar > 0
            ? `Tienes ${porRepasar} ${porRepasar === 1 ? 'mano fallada' : 'manos falladas'} esperando a volver. Las manos que fallas vuelven días después, cambiadas de palo, para que aprendas el motivo y no la respuesta.`
            : 'No tienes manos pendientes de repasar. Lo que falles volverá dentro de unos días, cambiado de palo, para comprobar que lo entendiste de verdad.'}
        </p>
      </div>
    </div>
  )
}

/** Verde, ámbar o rojo según la nota: se lee de un vistazo sin pensar. */
function colorDeNota(nota: number): string {
  if (nota >= 75) return 'var(--verde)'
  if (nota >= 50) return 'var(--ambar)'
  return 'var(--rojo)'
}
