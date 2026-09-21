/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL del proyecto de Supabase. Sin esto, el juego funciona en modo local. */
  readonly VITE_SUPABASE_URL?: string
  /** Clave pública (anon) de Supabase. Es pública a propósito: la seguridad la dan las políticas RLS. */
  readonly VITE_SUPABASE_ANON_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
