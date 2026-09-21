# Guía para PokerMind

> Documento vivo. Aquí queda **todo lo decidido**, para no depender de la memoria del chat.
> Si se cierra la sesión, se retoma leyendo este archivo.

- **Tarea:** Crear PokerMind, un juego que enseña a tomar buenas decisiones en póker usando probabilidades, con tutorial desde cero y modo libre contra bots.
- **Inicio:** 21 de septiembre de 2026
- **Estado:** 🟡 Ronda 2 entregada, esperando respuestas
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

### De la ronda 1

| # | Decisión | Por qué |
|---|----------|---------|
| D8 | El contenido llega hasta **nivel serio**: equity contra rangos, tamaños de apuesta, nociones de GTO | Respuesta 2. Implica mucho más contenido y un motor de cálculo potente |
| D9 | El entrenador es un **curso por lecciones cortas que se desbloquean**: una idea nueva + manos de práctica de esa idea, y no se avanza sin demostrar dominio | Respuesta 3 |
| D10 | El modo libre es una **partida completa con eliminación**: fichas, ciegas que suben, todo-in, hasta que queda uno | Respuesta 4 |
| D11 | Hay **cuentas con correo y contraseña** desde el principio, con progreso en la nube | Respuesta 5. Obliga a servidor y base de datos desde el día uno |
| D12 | **Solo español**, sin preparar traducciones | Respuesta 6 |
| D13 | **No hay versión intermedia**: se entrega el juego completo de una vez | Respuesta 7 |
| D14 | El **multijugador con amigos queda fuera de esta tarea**, pero el motor de póker se escribe aparte de la pantalla y sin depender del navegador, para que después pueda correr en un servidor sin rehacerlo | Propuesta suya en la respuesta 7 ("primero creamos bien las bases"); lo confirmo |
| D15 | Se **repasan los errores días después**, con la mano cambiada de palo y posición para que no se memorice | S1 → Sí |
| D16 | El juego **avisa también cuando ganas con una mala decisión** | S2 → Sí |
| D17 | Los **bots usan el mismo motor de probabilidades que el juego**, con parámetros propios (agresividad, nivel de acierto, etc.) que se sortean al empezar la partida; así cada bot sale distinto sin programar tres bots a mano | S3, idea suya. Los parámetros concretos los propongo yo en la ronda 2 |
| D18 | **Instalable en el móvil y jugable sin conexión** | S4 → Sí |
| D19 | **Nada comprable con dinero, nunca** | S5 → Sí |

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
- **S6** — ~~El juego no necesita servidor~~ **DESMENTIDA por la respuesta 5**: con cuentas hay
  servidor y base de datos. Lo que sí se mantiene es que **una mano se juega entera en el
  dispositivo**, sin pedirle nada al servidor; el servidor solo guarda el progreso.
- **S7** — En el entrenador **hay fichas y bote en pantalla** aunque no se pierda nada: sin saber
  cuánto cuesta pagar y cuánto hay en el bote, las probabilidades no se pueden enseñar. *(deducida
  de: el criterio de decisión es matemático)*
- **S8** — El torneo del modo libre es de **4 jugadores (tú + 3 bots)**, no de mesa llena.
  *(deducida de: "contra tres bots")*
- **S9** — El motor de póker (cartas, reglas, cálculo de probabilidades y evaluación de decisiones)
  se escribe **separado de la interfaz**, para que lo usen igual el entrenador, el modo libre, los
  bots y, más adelante, el multijugador. *(deducida de: D14)*

---

## 5. Descartado (no volver a proponer)

- **Mazo de 4 colores para daltónicos** → descartado por él: *"la idea es enseñarlos a jugar bien
  si luego van a jugar en la vida real y los palos no son de colores"*. El juego usa el rojo y
  negro de siempre.
- **Versión intermedia / entrega por partes** → prefiere esperar y recibirlo todo junto.
- **Traducciones a otros idiomas** → solo español.
- **Multijugador con amigos** → no ahora; primero las bases. No se descarta para siempre (D14).

---

## 6. Estado de las rondas

- **Ronda 1 — VISIÓN GENERAL** ✅ respondida · `Cuestionario-1-Vision-General.html`
- **Ronda 2 — CÓMO FUNCIONA POR DENTRO** 🟡 entregada, esperando · `Cuestionario-2-Como-Funciona.html`

---

## 7. Incógnitas abiertas

Lo que todavía me haría **adivinar**. Cuando esta lista queda vacía → se construye.

1. **Criterio exacto de decisión buena** — contestó "decide tú", pero es el corazón del juego y su
   observación añade un matiz importante (ver abajo). Vuelve a preguntarse **una sola vez**, con mi
   recomendación marcada *(ronda 2, P1)*
2. Formato del torneo del modo libre: duración, subida de ciegas *(ronda 2, P2)*
3. Si la cuenta es **obligatoria** para jugar — choca con jugar sin conexión *(ronda 2, P3)*
4. Cómo se puntúa: acierto/fallo o puntuación graduada *(ronda 2, P4)*
5. Si el que ya sabe póker puede saltarse lecciones *(ronda 2, P5)*
6. Si el jugador ve el estilo de cada bot o tiene que deducirlo *(ronda 2, P6)*
7. Dónde vive el servidor y con qué presupuesto *(ronda 2, P7)*
8. Contenido concreto del curso (lista de lecciones en orden) y textos *(ronda 3, depende de 1 y 5)*
9. Logros concretos y reglas de la dificultad adaptativa *(ronda 3, depende de 4)*

### El matiz de la respuesta 1 (importante, no perderlo)

Contestó "decide tú" pero escribió algo que cambia el diseño del motor:

> *"no es lo mismo ganar pero ganar poquito sabiendo que desde el comienzo tenías una mano fuerte y
> podías ocultarla hasta el final para irlos exprimiendo"*

Es decir: **una decisión buena no es solo "no perder fichas", es sacarle el máximo a la mano**. Un
motor que solo compare "mi probabilidad de ganar contra lo que cuesta pagar" nunca entiende eso:
con una mano monstruosa siempre diría "sube", aunque subir espante al rival y gane menos que pagar.
Para que el juego juzgue como él quiere, hay que comparar el **valor esperado de cada acción contra
las manos que el rival puede tener** — eso es exactamente lo que hace que jugar lento con una mano
fuerte salga puntuado como la mejor jugada cuando lo es. Va como recomendación marcada en la P1 de
la ronda 2.

### El choque que hay que resolver (respuesta 5 vs. S4)

Pidió **cuenta con correo y contraseña desde el principio** y también **poder jugar sin conexión**.
No son incompatibles, pero chocan en el primer arranque: si la cuenta es obligatoria, el que abre
el juego sin internet no puede ni empezar. Lo pregunto en la P3 de la ronda 2 en vez de decidirlo
yo, porque afecta a cuánta gente llega a jugar.

## 8. Plan de implementación

*(se escribe al cerrar las rondas, antes de tocar código)*

---

## 9. Bitácora

- **21/09/2026** — Tarea abierta. Repo vacío, sin commits: se crea la rama
  `claude/poker-learning-game-xh7r22`. Se guardan las 4 imágenes de identidad visual en
  `docs/identidad/`. Se escribe el análisis de "qué hace bueno a un tutorial" (sección 2) y de ahí
  salen las opciones de la ronda 1. Entregada la ronda 1 (VISIÓN GENERAL, 7 preguntas + 6
  sugerencias). Entorno en la nube: el HTML se entrega como archivo, no con `xdg-open`.
- **21/09/2026** — Ronda 1 respondida. Se cierran 12 decisiones (D8–D19), se desmiente S6 (ahora hay
  servidor), se descartan el mazo de 4 colores, la entrega por partes, los idiomas y —por ahora— el
  multijugador. Dos cosas no quedan cerradas: el criterio de decisión (contestó "decide tú" sobre lo
  más crítico del juego, así que se repregunta **una vez** con recomendación) y la tensión entre
  cuenta obligatoria y jugar sin conexión. Entregada la ronda 2 (CÓMO FUNCIONA POR DENTRO, 7
  preguntas + 5 sugerencias).
