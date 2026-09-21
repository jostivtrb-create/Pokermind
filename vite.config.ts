import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Rutas relativas: así el juego funciona igual en la raíz de un dominio
  // que colgando de una subcarpeta o de una vista previa.
  base: './',
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
