/**
 * Registro del service worker: lo que hace que el juego se pueda instalar en el
 * móvil y abrirse sin conexión (D18).
 *
 * Si algo falla aquí no pasa nada: el juego funciona igual con internet. Por eso
 * ni se avisa del error ni se reintenta.
 */
export function prepararInstalacion(): void {
  if (!('serviceWorker' in navigator)) return
  if (location.protocol !== 'https:' && location.hostname !== 'localhost') return
  // Solo cuando el juego vive en la raíz del sitio. En una vista previa que
  // cuelga de una subcarpeta no hay service worker que valga, y no pasa nada:
  // lo único que se pierde es poder jugar sin conexión.
  const ruta = location.pathname
  if (ruta !== '/' && !ruta.endsWith('/index.html')) return

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* sin funcionamiento sin conexión, pero el juego sigue */
    })
  })
}
