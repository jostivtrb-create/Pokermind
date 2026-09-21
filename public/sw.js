/*
  Service worker de PokerMind.

  Está para una sola cosa: que el juego se pueda abrir y jugar SIN CONEXIÓN
  después de la primera visita (D18 y D31). Todo el juego —las probabilidades,
  los bots, la corrección— se calcula en el propio aparato, así que en cuanto los
  archivos están guardados no hace falta internet para nada.

  Estrategia:
   · Navegaciones (abrir la app)  → red primero, y si no hay, lo guardado.
   · Archivos del juego           → lo guardado primero, y se refresca por detrás.
  Nunca se guarda nada que no sea de este mismo sitio.
*/
const CACHE = 'pokermind-v1'
const BASICOS = ['./', './index.html', './manifest.webmanifest', './icono-512.png']

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(BASICOS)).then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((nombres) => Promise.all(nombres.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (evento) => {
  const peticion = evento.request
  if (peticion.method !== 'GET') return
  const url = new URL(peticion.url)
  if (url.origin !== self.location.origin) return

  // Abrir la app: si hay red, la red manda (así se actualiza sola).
  if (peticion.mode === 'navigate') {
    evento.respondWith(
      fetch(peticion)
        .then((respuesta) => {
          const copia = respuesta.clone()
          caches.open(CACHE).then((cache) => cache.put('./index.html', copia))
          return respuesta
        })
        .catch(() => caches.match('./index.html').then((r) => r ?? Response.error())),
    )
    return
  }

  // Lo demás: lo guardado primero, y se actualiza por detrás para la próxima vez.
  evento.respondWith(
    caches.match(peticion).then((guardado) => {
      const desdeLaRed = fetch(peticion)
        .then((respuesta) => {
          if (respuesta && respuesta.status === 200) {
            const copia = respuesta.clone()
            caches.open(CACHE).then((cache) => cache.put(peticion, copia))
          }
          return respuesta
        })
        .catch(() => guardado)
      return guardado ?? desdeLaRed
    }),
  )
})
