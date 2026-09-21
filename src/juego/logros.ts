import type { Progreso } from './progreso'
import { MANOS_DE_LA_NOTA, manosConNota, notaReciente } from './progreso'
import { LECCIONES, leccionTerminada } from '../contenido/temario'

/**
 * Los logros. Premian lo que queremos que el jugador haga: pensar, volver y
 * mejorar — nunca tener suerte. Ninguno depende de ganar una mano.
 */
export interface Logro {
  id: string
  nombre: string
  descripcion: string
  icono: string
  /** De 0 a 1, para poder enseñar la barra de progreso. */
  avance: (progreso: Progreso) => number
  /** Lo que se enseña como "3/10". */
  marcador?: (progreso: Progreso) => string
  grupo: 'probabilidades' | 'decisiones' | 'constancia'
}

const limitar = (x: number) => Math.max(0, Math.min(1, x))

/**
 * Avance de un logro de nota. Con menos manos de las que hacen falta, la barra
 * enseña lo que llevas jugado: así se ve que el logro existe y qué falta para
 * empezar a medirlo, en vez de una barra a cero sin explicación.
 */
function avanceDeNota(p: Parameters<Logro['avance']>[0], objetivo: number): number {
  if (manosConNota(p) < MANOS_DE_LA_NOTA) return limitar(manosConNota(p) / MANOS_DE_LA_NOTA) * 0.5
  return limitar(notaReciente(p) / objetivo)
}

export const LOGROS: Logro[] = [
  {
    id: 'primeras-manos', nombre: 'Primeras 10 manos', icono: '🃏', grupo: 'decisiones',
    descripcion: 'Juega tus primeras 10 decisiones.',
    avance: (p) => limitar(p.decisiones / 10),
    marcador: (p) => `${Math.min(p.decisiones, 10)}/10`,
  },
  /*
    Los logros de calidad van por NOTA, no por puntos acumulados (D63).

    Acumular puntos solo mide cuánto has jugado: con tiempo suficiente los saca
    cualquiera, aunque juegue fatal. La nota media de las últimas 20 manos sube
    y baja contigo, así que un logro de nota se gana jugando bien AHORA.
  */
  {
    id: 'nota-60', nombre: 'Vas cogiéndolo', icono: '🎯', grupo: 'decisiones',
    descripcion: `Llega a una nota media de 60 en tus últimas ${MANOS_DE_LA_NOTA} manos.`,
    avance: (p) => avanceDeNota(p, 60),
    marcador: (p) => `${Math.round(notaReciente(p))}/60`,
  },
  {
    id: 'mente-fria', nombre: 'Mentalidad fría', icono: '🧊', grupo: 'decisiones',
    descripcion: 'Retírate 10 veces cuando las cuentas no salían. Tirar una mano también se aprende.',
    avance: (p) => limitar((p.categorias['carta alta'] ?? 0) / 10),
    marcador: (p) => `${Math.min(p.categorias['carta alta'] ?? 0, 10)}/10`,
  },
  {
    id: 'modulo-1', nombre: 'Ya sabes jugar', icono: '📘', grupo: 'probabilidades',
    descripcion: 'Termina el módulo 1 y abre el modo libre.',
    avance: (p) => (p.modoLibreDesbloqueado ? 1 : 0),
  },
  {
    id: 'estudiante', nombre: 'Estudiante de póker', icono: '🎓', grupo: 'probabilidades',
    descripcion: 'Termina 10 lecciones.',
    avance: (p) => limitar(Object.keys(p.lecciones).length / 10),
    marcador: (p) => `${Math.min(Object.keys(p.lecciones).length, 10)}/10`,
  },
  {
    id: 'nota-80', nombre: 'Buen criterio', icono: '⭐', grupo: 'decisiones',
    descripcion: `Llega a una nota media de 80 en tus últimas ${MANOS_DE_LA_NOTA} manos.`,
    avance: (p) => avanceDeNota(p, 80),
    marcador: (p) => `${Math.round(notaReciente(p))}/80`,
  },
  {
    id: 'nota-90', nombre: 'Mente afilada', icono: '🧠', grupo: 'constancia',
    descripcion: `Llega a una nota media de 90 en tus últimas ${MANOS_DE_LA_NOTA} manos. Eso ya es jugar muy bien.`,
    avance: (p) => avanceDeNota(p, 90),
    marcador: (p) => `${Math.round(notaReciente(p))}/90`,
  },
  {
    id: 'constante', nombre: 'Constancia', icono: '📅', grupo: 'constancia',
    descripcion: `Juega ${MANOS_DE_LA_NOTA} manos, que es lo que hace falta para que tu nota signifique algo.`,
    avance: (p) => limitar(manosConNota(p) / MANOS_DE_LA_NOTA),
    marcador: (p) => `${Math.min(manosConNota(p), MANOS_DE_LA_NOTA)}/${MANOS_DE_LA_NOTA}`,
  },
  {
    id: 'repaso', nombre: 'Aprender del error', icono: '🔁', grupo: 'constancia',
    descripcion: 'Repasa y corrige una mano que habías fallado.',
    avance: (p) => (p.errores.some((e) => e.repasos > 0) ? 1 : 0),
  },
  {
    id: 'leyenda', nombre: 'Leyenda', icono: '👑', grupo: 'constancia',
    descripcion: 'Termina el curso entero.',
    avance: (p) => limitar(LECCIONES.filter((l) => leccionTerminada(p, l.id)).length / Math.max(1, LECCIONES.length)),
    marcador: (p) => `${LECCIONES.filter((l) => leccionTerminada(p, l.id)).length}/${LECCIONES.length}`,
  },
]

export function logroConseguido(logro: Logro, progreso: Progreso): boolean {
  return logro.avance(progreso) >= 1
}

/** Logros recién conseguidos, para poder avisar en el momento. */
export function nuevosLogros(antes: Progreso, ahora: Progreso): Logro[] {
  return LOGROS.filter((l) => !logroConseguido(l, antes) && logroConseguido(l, ahora))
}
