import type { Pantalla } from '../App'
import { hayServidor } from '../../almacen/cuenta'

/**
 * Qué guardamos de ti (D30).
 *
 * No es un adorno legal: si el juego sale a internet con cuentas, esta página y
 * los botones de recuperar contraseña y borrar cuenta son obligatorios. Está
 * escrita en español normal a propósito.
 */
export function Privacidad({ ir }: { ir: (p: Pantalla) => void }) {
  return (
    <div style={{ display: 'grid', gap: 16, maxWidth: 680 }}>
      <button className="boton" style={{ padding: '8px 14px', justifySelf: 'start' }} onClick={() => ir('configuracion')}>
        ← Volver
      </button>

      <div>
        <h1>Qué guardamos de ti</h1>
        <p className="suave">Poco, y te lo contamos claro.</p>
      </div>

      <div className="tarjeta">
        <h3>En tu aparato</h3>
        <p className="suave" style={{ fontSize: 14 }}>
          Tu progreso: lecciones terminadas, puntos, estadísticas, manos que fallaste y los ajustes.
          Vive en el navegador de este aparato y no sale de aquí salvo para tu propia cuenta.
        </p>
      </div>

      <div className="tarjeta">
        <h3>En el servidor</h3>
        {hayServidor ? (
          <p className="suave" style={{ fontSize: 14 }}>
            Tu <strong>correo</strong> (para poder entrar y recuperar la contraseña) y una copia de
            tu progreso, para que puedas jugar en otro aparato. Nada más: ni nombre, ni teléfono, ni
            forma de pago — en este juego no hay nada que pagar.
          </p>
        ) : (
          <p className="suave" style={{ fontSize: 14 }}>
            Nada. Ahora mismo no hay servidor configurado: todo se queda en tu aparato.
          </p>
        )}
      </div>

      <div className="tarjeta">
        <h3>Lo que NO hacemos</h3>
        <ul className="suave" style={{ fontSize: 14, paddingLeft: 20, margin: 0 }}>
          <li>No vendemos ni compartimos tus datos con nadie.</li>
          <li>No hay publicidad ni rastreadores de terceros.</li>
          <li>No se puede comprar nada: no hay dinero real en ninguna parte del juego.</li>
        </ul>
      </div>

      <div className="tarjeta">
        <h3>Borrarlo todo</h3>
        <p className="suave" style={{ fontSize: 14 }}>
          Desde <strong>Ajustes</strong> puedes borrar tu progreso de este aparato y, si tienes
          cuenta, borrar la cuenta entera con todo lo guardado. Sin preguntas y sin trámites.
        </p>
      </div>
    </div>
  )
}
