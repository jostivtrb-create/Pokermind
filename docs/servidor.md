# Montar el servidor de cuentas

El juego **funciona entero sin esto**. Las probabilidades, los bots y la corrección se calculan en
el propio aparato; el servidor solo guarda tu progreso para que puedas cambiar de móvil a portátil.

Mientras no haya servidor configurado, PokerMind arranca en **modo local**: se juega igual y el
progreso vive en el navegador.

Cuando quieras activar las cuentas, son unos diez minutos.

---

## 1 · Crear el proyecto (gratis)

1. Entra en <https://supabase.com> y crea una cuenta.
2. **New project**. Elige la región más cercana y apunta la contraseña de la base de datos.
3. Cuando termine: **Project Settings → API**. Copia dos cosas:
   - **Project URL**
   - **anon public** (la clave pública)

> La clave `anon` es **pública a propósito**: va en el navegador y no es un secreto. Lo que protege
> los datos son las políticas de abajo, no ocultar la clave. La otra clave (`service_role`) **nunca**
> se pone en el navegador.

## 2 · Crear la tabla

En Supabase, **SQL Editor** → pega esto y ejecuta:

```sql
-- Una fila por jugador con todo su progreso en JSON.
create table if not exists public.progreso (
  usuario      uuid primary key references auth.users (id) on delete cascade,
  datos        jsonb not null,
  actualizado  timestamptz not null default now()
);

-- Sin esto, cualquiera con la clave pública podría leer el progreso de los demás.
alter table public.progreso enable row level security;

create policy "cada uno ve lo suyo"
  on public.progreso for select
  using (auth.uid() = usuario);

create policy "cada uno escribe lo suyo"
  on public.progreso for insert
  with check (auth.uid() = usuario);

create policy "cada uno actualiza lo suyo"
  on public.progreso for update
  using (auth.uid() = usuario)
  with check (auth.uid() = usuario);

create policy "cada uno borra lo suyo"
  on public.progreso for delete
  using (auth.uid() = usuario);
```

Las cuatro políticas dicen lo mismo: **cada jugador solo toca su propia fila**. El `on delete
cascade` hace que borrar la cuenta borre el progreso automáticamente.

## 3 · Poner las claves en el proyecto

```bash
cp .env.example .env
```

Y rellena:

```
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

Arranca (`npm run dev`) y verás la pantalla de entrar/crear cuenta. Al publicar, las mismas dos
variables van en la configuración del hosting (en Vercel: *Settings → Environment Variables*).

## 4 · Borrar la cuenta del todo (opcional pero recomendable)

Desde el navegador se puede borrar el **progreso**, pero no el usuario: eso necesita una función en
el servidor. En Supabase, **Edge Functions → New function**, llámala `borrar-cuenta` y usa:

```ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (peticion) => {
  const autorizacion = peticion.headers.get('Authorization') ?? ''
  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data, error } = await admin.auth.getUser(autorizacion.replace('Bearer ', ''))
  if (error || !data.user) return new Response('No autorizado', { status: 401 })

  await admin.auth.admin.deleteUser(data.user.id)
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

Si no la creas, el botón de borrar cuenta borra el progreso y cierra la sesión, y avisa al jugador
de que la cuenta se elimina poco después.

## 5 · Publicar

Cualquier hosting estático gratuito vale. Con Vercel:

```bash
npm i -g vercel
vercel        # la primera vez
vercel --prod
```

Acuérdate de añadir allí las dos variables de entorno, o el juego se publicará en modo local.

---

## Cómo funciona por dentro (por si hay que tocarlo)

- `src/almacen/local.ts` — guardado en el aparato. **Es la fuente de la verdad mientras se juega**,
  para que el juego funcione sin conexión (D18/D31).
- `src/almacen/sincronizacion.ts` — junta lo del aparato con lo de la nube. Regla: **gana lo más
  avanzado, no lo más reciente**. Quien juega en el móvil sin conexión y luego abre el portátil no
  puede perder lecciones terminadas.
- `src/almacen/cuenta.ts` — registrarse, entrar, recuperar contraseña, borrar cuenta, y el almacén
  remoto que usa la sincronización.
- `src/almacen/supabase.ts` — si no hay claves, `cliente` es `null` y todo lo demás se adapta solo.

Cambiar de Supabase a otro servicio es tocar `supabase.ts` y `cuenta.ts`: el resto del juego no sabe
quién guarda los datos.

---

## Publicar en un dominio propio

Lo de arriba sirve para las cuentas. Para que el juego viva en una dirección tuya (por ejemplo
`pokermind.app`) y se pueda **instalar en el móvil**, hace falta un hosting estático. Con Vercel es
gratis y son dos comandos:

```bash
npm i -g vercel
vercel          # la primera vez: te pide entrar y te hace unas preguntas
vercel --prod
```

Vercel detecta Vite solo. Si has configurado las cuentas, añade allí las dos variables
(`VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`) en *Settings → Environment Variables*, o el juego
se publicará en modo local.

**Importante para que se pueda instalar y jugar sin conexión:** el service worker solo se registra
cuando el juego está en la **raíz** del sitio. En una vista previa que cuelgue de una subcarpeta el
juego funciona igual, pero sin modo sin conexión.
