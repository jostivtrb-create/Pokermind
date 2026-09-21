/**
 * Sonidos del juego.
 *
 * Sintetizados, no grabados: cuatro tonos cortos pesan cero y no hay que
 * descargar nada, que importa porque el juego tiene que funcionar sin conexión.
 *
 * Todo va envuelto en try/catch y sale sin hacer nada si el navegador no deja
 * crear audio (y algunos no dejan hasta que el usuario toca la pantalla). Un
 * juego que se rompe por no poder hacer "clic" sería ridículo.
 */
export type Efecto = 'acierto' | 'fallo' | 'repartir' | 'ficha'

let contexto: AudioContext | null = null
let activado = true

export function ajustarSonido(encendido: boolean): void {
  activado = encendido
}

function contextoDeAudio(): AudioContext | null {
  if (contexto) return contexto
  try {
    const Clase = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Clase) return null
    contexto = new Clase()
    return contexto
  } catch {
    return null
  }
}

/** Una nota corta con entrada y salida suaves, para que no chasquee. */
function nota(ctx: AudioContext, frecuencia: number, empieza: number, dura: number, volumen: number): void {
  const oscilador = ctx.createOscillator()
  const ganancia = ctx.createGain()
  oscilador.type = 'sine'
  oscilador.frequency.value = frecuencia
  ganancia.gain.setValueAtTime(0, empieza)
  ganancia.gain.linearRampToValueAtTime(volumen, empieza + 0.012)
  ganancia.gain.exponentialRampToValueAtTime(0.0001, empieza + dura)
  oscilador.connect(ganancia).connect(ctx.destination)
  oscilador.start(empieza)
  oscilador.stop(empieza + dura + 0.02)
}

const EFECTOS: Record<Efecto, (ctx: AudioContext, t: number) => void> = {
  // Dos notas hacia arriba: suena a "bien".
  acierto: (ctx, t) => {
    nota(ctx, 660, t, 0.1, 0.13)
    nota(ctx, 880, t + 0.085, 0.16, 0.12)
  },
  // Una nota grave y corta. Ni estridente ni de castigo: aquí equivocarse es gratis.
  fallo: (ctx, t) => {
    nota(ctx, 300, t, 0.14, 0.11)
    nota(ctx, 220, t + 0.1, 0.18, 0.09)
  },
  repartir: (ctx, t) => nota(ctx, 520, t, 0.05, 0.06),
  ficha: (ctx, t) => nota(ctx, 780, t, 0.04, 0.05),
}

export function sonar(efecto: Efecto): void {
  if (!activado) return
  try {
    const ctx = contextoDeAudio()
    if (!ctx) return
    if (ctx.state === 'suspended') void ctx.resume()
    EFECTOS[efecto](ctx, ctx.currentTime)
  } catch {
    /* sin sonido, pero el juego sigue */
  }
}
