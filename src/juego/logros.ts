import type { Progreso } from './progreso'
import { porcentajeAciertos } from './progreso'
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

export const LOGROS: Logro[] = [
  {
    id: 'primeras-manos', nombre: 'Primeras 10 manos', icono: '🃏', grupo: 'decisiones',
    descripcion: 'Juega tus primeras 10 decisiones.',
    avance: (p) => limitar(p.decisiones / 10),
    marcador: (p) => `${Math.min(p.decisiones, 10)}/10`,
  },
  {
    id: 'racha-5', nombre: 'Decisión correcta', icono: '🎯', grupo: 'decisiones',
    descripcion: 'Acierta el 80% de tus decisiones con al menos 20 jugadas.',
    avance: (p) => (p.decisiones < 20 ? limitar(p.decisiones / 20) * 0.5 : limitar(porcentajeAciertos(p) / 0.8)),
    marcador: (p) => `${Math.round(porcentajeAciertos(p) * 100)}%`,
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
    id: 'mil-puntos', nombre: 'Mil puntos', icono: '⭐', grupo: 'constancia',
    descripcion: 'Acumula 1.000 puntos pensando bien.',
    avance: (p) => limitar(p.puntosTotales / 1000),
    marcador: (p) => `${Math.min(p.puntosTotales, 1000)}/1000`,
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
