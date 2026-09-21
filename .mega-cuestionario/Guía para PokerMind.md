# Guía para PokerMind

> Documento vivo. Aquí queda **todo lo decidido**, para no depender de la memoria del chat.
> Si se cierra la sesión, se retoma leyendo este archivo.

- **Tarea:** Crear PokerMind, un juego que enseña a tomar buenas decisiones en póker usando probabilidades, con tutorial desde cero y modo libre contra bots.
- **Inicio:** 21 de septiembre de 2026
- **Estado:** 🟡 Ronda 1 entregada, esperando respuestas
- **Proyecto:** `/home/user/Pokermind` · rama `claude/poker-learning-game-xh7r22`

---

## 1. Objetivo

Un juego donde la suerte no decide si aprendiste. Te sale una mano, ves tus cartas y la mesa, y
eliges **retirarte / pagar / subir**. El juego te dice al instante si esa decisión era buena
**según las probabilidades reales** y te explica por qué. Los puntos premian pensar bien, no ganar.

Dos modos:

- **Entrenador** (el principal): tutorial desde cero para alguien que no sabe nada de póker. Enseña
  las reglas, la terminología (foldear, call, subir, el botón, las ciegas, posición…) y sobre todo
  **cuándo pagar, cuándo retirarse y cuándo subir según los porcentajes**.
- **Libre**: partida contra 3 bots, con un sistema de puntos que premia aplicar bien las reglas
  aunque la mano se pierda.

En palabras del usuario: *"Es como un entrenador de póker que no te deja engañarte con la suerte:
te muestra si tu jugada era inteligente, aunque la carta final no te haya ayudado."*

---

## 2. Qué hace bueno a un tutorial (análisis previo, pedido por el usuario)

Esto **no se pregunta**: es trabajo mío y marca cómo se diseña el modo entrenador. Lo dejo escrito
porque de aquí salen las opciones de la ronda 1 y las decisiones de diseño posteriores.

**El tutorial malo** —el que hay que evitar— es: pantallas de texto con botón "Siguiente", todo
explicado antes de dejarte tocar nada, y una sola pasada sin vuelta atrás. Falla porque el que lee
no está decidiendo, y lo que no se decide no se aprende.

Lo que sí funciona, con nombre y con cómo se aplica aquí:

| Principio | Qué significa | Cómo se aplica en PokerMind |
|---|---|---|
| **Hacer antes que leer** | Se aprende decidiendo, no escuchando | La primera mano se juega en los primeros 30 segundos, con solo 2 botones y una pista |
| **Vocabulario justo a tiempo** | El término se explica **cuando aparece**, no en una lista al principio | "Foldear" se explica la primera vez que la opción correcta es retirarse, en una burbuja sobre el botón |
| **Una idea nueva por vez** | La memoria de trabajo aguanta poco; dos conceptos nuevos juntos = ninguno aprendido | Cada lección introduce **un** concepto y las manos de práctica solo varían ese concepto |
| **Ejemplo resuelto → práctica con ayuda → práctica sola** (*faded guidance*) | Primero te lo enseño hecho, luego decides con pista, luego sin pista | Mano 1 de cada lección: el juego decide y explica. Manos 2-4: decides con los porcentajes visibles. Manos 5+: decides con los porcentajes ocultos y se revelan después |
| **Retroalimentación inmediata y sobre el proceso** | Corregir al instante, y corregir **el razonamiento**, no el resultado | "Fue buena decisión aunque perdiste: tenías 26%, pagar costaba el 40% del bote" |
| **Separar decisión de resultado** | El núcleo del juego: la suerte no puede validar ni invalidar la decisión | Los puntos salen del acierto de la decisión; el resultado de la mano se muestra aparte, nunca como nota |
| **Dificultad que se adapta** | Ni aburrido ni imposible; siempre al borde de lo que ya sabes | Si aciertas seguido, suben los casos límite; si fallas, vuelven los casos claros |
| **Repetición espaciada de los errores** | El error olvidado se repite; el error repasado a los días se corrige | Las manos falladas vuelven a aparecer más adelante, cambiadas de palo/posición para que no se memorice |
| **Puerta de dominio, no de asistencia** | No se avanza por pulsar "siguiente", sino por demostrar que lo entendiste | Para desbloquear la lección siguiente hacen falta N decisiones correctas seguidas del concepto |
| **Poder equivocarse sin castigo** | El miedo a perder bloquea el aprendizaje | No hay dinero ni fichas que perder en el entrenador: el error es información, no pérdida |
| **Decir por qué importa, no solo qué hacer** | La regla memorizada no se traslada a situaciones nuevas | Cada regla viene con el porqué numérico, para que el jugador la recalcule solo cuando cambie la situación |
| **Progreso visible y honesto** | Ver la mejora sostiene la constancia | Estadísticas por calle (preflop/flop/turn/river) y % de decisiones correctas, como en la guía visual |

**Consecuencia de diseño que ya doy por buena:** el modo entrenador **no** es una pantalla de ayuda
con texto; es una secuencia de manos jugables donde la explicación aparece pegada a la decisión que
acabas de tomar.

---

## 3. Decisiones CERRADAS

No se vuelven a preguntar. Cada una con su **porqué**.

### Del enunciado del usuario (antes de la ronda 1)

| # | Decisión | Por qué |
|---|----------|---------|
| D1 | Sin dinero real, sin apuestas reales, sin compras | Lo dijo explícitamente: *"Sin dinero. Sin suerte."* |
| D2 | Los puntos premian la **calidad de la decisión**, no el resultado de la mano | Es la idea central del juego |
| D3 | Dos modos: Entrenador (principal) y Libre contra 3 bots | Pedido explícito |
| D4 | En el modo Libre también se puntúa por jugar bien, incluso perdiendo la mano | Pedido explícito |
| D5 | El entrenador enseña terminología y mecánica de mesa (foldear, call, subir, botón del dealer y su rotación, ciegas, posición) | Pedido explícito: *"que entre alguien sin saber nada de póker y termine sabiendo terminologías"* |
| D6 | Estética: tema oscuro, acento morado, tipografía limpia, sin animaciones complejas, según las 4 imágenes de `docs/identidad/` | Guía visual entregada por el usuario. Es **guía de estética, no de funcionalidad** |
| D7 | Idioma de la interfaz: español | Toda la guía visual está en español |

---

## 4. Suposiciones del agente

Cosas que decidí yo porque las deduje del material entregado. **Válidas mientras no las desmienta.**

- **S1** — La variante es **Texas Hold'em** (2 cartas propias + 5 comunitarias). *(deducida de: las
  maquetas muestran 2 cartas del jugador y 5 en la mesa)*
- **S2** — Es una **aplicación web responsive** que se ve igual en navegador de escritorio y en
  móvil. *(deducida de: las maquetas muestran navegador con `pokermind.app` y vista móvil)*
- **S3** — **No hay multijugador con personas reales**: los rivales son bots. *(deducida de: el
  usuario solo menciona bots)*
- **S4** — Las probabilidades se calculan **de verdad** (enumeración exacta cuando es barato,
  simulación cuando no), no con una tabla aproximada. *(deducida de: "según las probabilidades
  reales")*
- **S5** — Las pantallas que aparecen en la guía visual (Inicio, Jugar, Estadísticas, Logros,
  Configuración, Guía/Ayuda) son el mapa de navegación de la app. *(deducida de: el menú lateral y
  la barra inferior de las maquetas)*
- **S6** — El juego es **de un jugador y offline-friendly**: no hace falta servidor para jugar una
  mano. *(deducida de: no se menciona nada en línea)*

---

## 5. Descartado (no volver a proponer)

- *(vacío por ahora)*

---

## 6. Estado de las rondas

- **Ronda 1 — VISIÓN GENERAL** 🟡 entregada, esperando · `Cuestionario-1-Vision-General.html`

---

## 7. Incógnitas abiertas

Lo que todavía me haría **adivinar**. Cuando esta lista queda vacía → se construye.

1. Qué criterio define exactamente una decisión "buena" (matemática pura, + rangos preflop, reglas simplificadas, o equity contra el rango del rival) *(ronda 1)*
2. Hasta qué nivel de póker tiene que llevar el contenido *(ronda 1)*
3. Forma del modo entrenador: curso por lecciones, práctica continua, mesas por nivel, o mixto *(ronda 1)*
4. Alcance del modo libre: partida completa con fichas y ciegas, o manos sueltas *(ronda 1)*
5. Progreso local o con cuenta en la nube *(ronda 1)*
6. Solo español o preparado para inglés *(ronda 1)*
7. Qué tiene que existir sí o sí en la primera versión jugable *(ronda 1)*
8. Stack técnico concreto y forma del contenido de las lecciones *(ronda 2, depende de 3 y 5)*
9. Reglas de puntuación exactas, dificultad y logros *(ronda 2-3, depende de 1 y 2)*

---

## 8. Plan de implementación

*(se escribe al cerrar las rondas, antes de tocar código)*

---

## 9. Bitácora

- **21/09/2026** — Tarea abierta. Repo vacío, sin commits: se crea la rama
  `claude/poker-learning-game-xh7r22`. Se guardan las 4 imágenes de identidad visual en
  `docs/identidad/`. Se escribe el análisis de "qué hace bueno a un tutorial" (sección 2) y de ahí
  salen las opciones de la ronda 1. Entregada la ronda 1 (VISIÓN GENERAL, 7 preguntas + 6
  sugerencias). Entorno en la nube: el HTML se entrega como archivo, no con `xdg-open`.
