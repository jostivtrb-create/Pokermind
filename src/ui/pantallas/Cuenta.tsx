import { useState } from 'react'
import { Pica } from '../App'
import { entrar, recuperarContrasena, registrar } from '../../almacen/cuenta'

type Modo = 'entrar' | 'registrar' | 'recuperar'

/**
 * La puerta de entrada cuando hay servidor de cuentas configurado.
 *
 * Aparece UNA vez: en cuanto entras, la sesión se queda guardada en el aparato y
 * a partir de ahí se juega sin conexión (D31). Si el servidor no está
 * configurado, esta pantalla no se enseña y el juego va en modo local.
 */
export function Cuenta({ alEntrar }: { alEntrar: () => void }) {
  const [modo, setModo] = useState<Modo>('entrar')
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [aviso, setAviso] = useState<{ texto: string; error: boolean } | null>(null)
  const [enviando, setEnviando] = useState(false)

  const enviar = async (evento: React.FormEvent) => {
    evento.preventDefault()
    setEnviando(true)
    setAviso(null)

    const resultado =
      modo === 'registrar'
        ? await registrar(correo, contrasena)
        : modo === 'entrar'
          ? await entrar(correo, contrasena)
          : await recuperarContrasena(correo)

    setEnviando(false)
    if (resultado.ok && modo === 'entrar') {
      alEntrar()
      return
    }
    setAviso({ texto: resultado.mensaje ?? 'Listo.', error: !resultado.ok })
    if (resultado.ok && modo === 'registrar') setModo('entrar')
  }

  return (
    <div style={{ maxWidth: 420, margin: '6vh auto', display: 'grid', gap: 16 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', alignItems: 'center' }}>
          <Pica tamano={28} />
          <h1 style={{ margin: 0 }}>
            Poker<span className="marca-mente">Mind</span>
          </h1>
        </div>
        <p className="suave" style={{ marginTop: 6 }}>
          {modo === 'registrar'
            ? 'Crea tu cuenta para que tu progreso te siga a cualquier aparato.'
            : modo === 'recuperar'
              ? 'Te mandamos un correo para poner una contraseña nueva.'
              : 'Entra con tu cuenta. Solo hace falta internet esta vez.'}
        </p>
      </div>

      <form className="tarjeta" onSubmit={enviar} style={{ display: 'grid', gap: 10 }}>
        <label className="etiqueta" htmlFor="correo">Correo</label>
        <input
          id="correo" type="email" required autoComplete="email"
          className="boton ancho" style={{ borderRadius: 'var(--radio-s)', textAlign: 'left' }}
          value={correo} onChange={(e) => setCorreo(e.target.value)} placeholder="tucorreo@ejemplo.com"
        />

        {modo !== 'recuperar' && (
          <>
            <label className="etiqueta" htmlFor="contrasena">Contraseña</label>
            <input
              id="contrasena" type="password" required minLength={6}
              autoComplete={modo === 'registrar' ? 'new-password' : 'current-password'}
              className="boton ancho" style={{ borderRadius: 'var(--radio-s)', textAlign: 'left' }}
              value={contrasena} onChange={(e) => setContrasena(e.target.value)} placeholder="Al menos 6 caracteres"
            />
          </>
        )}

        {aviso && (
          <div className={`aviso ${aviso.error ? 'mal' : 'bien'}`} style={{ padding: 12 }}>
            <p style={{ margin: 0, fontSize: 14 }}>{aviso.texto}</p>
          </div>
        )}

        <button className="boton principal ancho" type="submit" disabled={enviando}>
          {enviando ? 'Un momento…' : modo === 'registrar' ? 'Crear cuenta' : modo === 'recuperar' ? 'Enviar correo' : 'Entrar'}
        </button>
      </form>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        {modo !== 'entrar' && (
          <button className="boton" style={{ padding: '8px 14px' }} onClick={() => setModo('entrar')}>Entrar</button>
        )}
        {modo !== 'registrar' && (
          <button className="boton" style={{ padding: '8px 14px' }} onClick={() => setModo('registrar')}>Crear cuenta</button>
        )}
        {modo !== 'recuperar' && (
          <button className="boton" style={{ padding: '8px 14px' }} onClick={() => setModo('recuperar')}>
            Olvidé la contraseña
          </button>
        )}
      </div>

      <p className="tenue" style={{ fontSize: 12.5, textAlign: 'center' }}>
        Solo guardamos tu correo y tu progreso del juego. Nada más, y puedes borrarlo todo cuando
        quieras desde Ajustes.
      </p>
    </div>
  )
}
