# Guía para PokerMind

> Documento vivo. Aquí queda **todo lo decidido**, para no depender de la memoria del chat.
> Si se cierra la sesión, se retoma leyendo este archivo.

- **Tarea:** Crear PokerMind, un juego que enseña a tomar buenas decisiones en póker usando probabilidades, con tutorial desde cero y modo libre contra bots.
- **Inicio:** 21 de septiembre de 2026
- **Estado:** 🔵 Publicado en Vercel y en pruebas reales · corrigiendo con lo que sale al jugarlo
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

### De la ronda 2

| # | Decisión | Por qué |
|---|----------|---------|
| D20 | **El motor evalúa siempre por valor esperado contra el rango del rival**, pero la **exigencia sube por nivel**: en las primeras lecciones solo se puntúa lo grueso (retirarse/pagar bien) y a partir de nivel intermedio también se exige sacarle el máximo a la mano | Respuesta 1. Un solo motor, varias varas de medir: el novato no se agobia y el avanzado no se aburre |
| D21 | Modo libre = **torneo corto**: 4 jugadores, ciegas que suben cada pocas manos, 15–20 minutos | Respuesta 2. Las decisiones difíciles (fichas cortas) llegan pronto, así que se aprende más rápido |
| D22 | **Puntuación graduada**: cuanto más cerca de la mejor jugada, más puntos; un fallo leve resta poco y uno grave resta mucho | Respuesta 4. Permite decir "tus errores graves son en el river" |
| D23 | **No se salta ninguna lección**: todos empiezan en la 1, sin prueba de nivel | Respuesta 5 |
| D24 | El **estilo de cada bot va oculto durante la partida y se revela al terminar**, con acierto o fallo de tu lectura | Respuesta 6 |
| D25 | Servidor en **servicios con plan gratuito**, cero euros al mes mientras haya poca gente | Respuesta 7 |
| D26 | Al terminar la mano se enseña **qué manos podía tener el rival** y con qué probabilidad | S1 → Sí |
| D27 | **Rebobinar la mano** y ver qué habría pasado con otra decisión, con los números y no con la carta que salió | S2 → Sí |
| D28 | **El torneo a medias se guarda** y se puede retomar | S3 → Sí |
| D29 | **Reto diario**: una mano difícil al día, la misma para todos, con su explicación | S4 → Sí |
| D30 | Se construyen las pantallas de **recuperar contraseña, borrar cuenta y política de privacidad** | S5 → Sí. No son opcionales si el juego sale a internet |

### De la primera prueba real (21/09/2026)

El usuario publicó el juego, lo probó y trajo dos cosas. Las dos cambian decisiones anteriores.

| # | Decisión | Por qué |
|---|----------|---------|
| D39 | **Se elige nivel al entrar** y se empieza por el módulo que toca: «no sé nada» → módulo 1, «sé las reglas» → módulo 2, «ya juego» → módulo 4. Lo anterior queda abierto para repasar | **Cambia D23** («no se salta nada»), y lo cambia él: *"yo sé que ahorita te había dicho que no, pero sí, yo creo que es lo mejor"*. Tiene razón: obligar a quien ya sabe las reglas a pasar por «qué es una pareja» es la forma más rápida de que cierre el juego |
| D40 | **La explicación va en pasos de una frase con cartas a la vista**, uno por pantalla, en vez de párrafos seguidos | *"siento que de entrada tiene muchísimo texto y aburre"*. Cuatro párrafos no se leen, se saltan |
| D41 | El módulo 1 empieza por **las cartas** (trece valores, el as manda) y sigue por **las jugadas** (pareja, trío, escalera, color, full… con cartas delante), cada una con su pregunta, antes de enseñar una mano de siete cartas | *"empieza como que muy de golpe, ya directo un montón de texto y luego listo, que tienes en la mesa, que gana… falta una transición ahí"*. Faltaban dos escalones enteros |
| D42 | Quien elige un nivel distinto de «no sé nada» **tiene el modo libre abierto desde el principio** | Se le está creyendo que sabe las reglas; pedirle que lo demuestre para poder sentarse a una mesa sobra |

### De la ronda 3

| # | Decisión | Por qué |
|---|----------|---------|
| D31 | **Choque resuelto: manda jugar sin conexión.** Cuenta obligatoria, pero internet solo hace falta la primera vez; después se juega sin conexión y se sincroniza al volver | Respuesta 1. D18 (jugable sin conexión) sigue en pie; D11 se matiza: la cuenta es obligatoria, la conexión permanente no |
| D32 | Cada lección decide su formato: las primeras son **decisiones sueltas**, las avanzadas **manos completas** hasta el river | Respuesta 2. El entrenador acompaña al contenido en vez de forzarlo |
| D33 | **Entrenador corrige al instante; modo libre, al terminar la mano** | Respuesta 3. Cada modo hace lo que mejor sabe |
| D34 | El **modo libre se desbloquea al terminar el módulo 1** (reglas y palabras del póker) | Respuesta 4. Nadie se sienta en una mesa sin saber qué es una ciega |
| D35 | **Temario aprobado tal cual**: los 9 módulos en el orden propuesto | Respuesta 5 |
| D36 | El jugador objetivo **también es él**: jugador casual que quiere aprender bien, no solo el que no ha visto una carta | Respuesta 5. Refuerza D37: el que ya sabe algo no puede aburrirse |
| D37 | **Avanzar rápido acertando**: sin saltarse lecciones, pero quien acierta seguido termina la lección con menos manos | S2 → Sí |
| D38 | **Botón de "¿por qué?" permanente** durante la mano, con la explicación larga a demanda | S3 → Sí |

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
- **S10 · Stack técnico** — Web con **React + TypeScript** (Vite), instalable como app;
  **Supabase** para cuentas y base de datos, y despliegue en un plan gratuito tipo Vercel. Todo con
  plan gratuito, todo mudable después. *(deducida de: D11 + D25; no se pregunta porque es fontanería,
  no producto — si tienes preferencia, dilo y cambio)*
- **S11** — Las manos del entrenador se **generan con condiciones por lección** (la lección de
  proyectos de color reparte manos con proyecto de color), no se escriben a mano una a una. Así hay
  práctica infinita sin memorizar. *(deducida de: D9 + D15)*
- **S12** — Los parámetros de cada bot son **agresividad, disciplina (cuánto respeta las
  probabilidades), farol y capacidad de leerte**; se sortean al empezar la partida dentro de un
  rango, como propusiste. *(deducida de: D17)*
- **S13** — No hay reloj para decidir: el entrenador no mete prisa. En el torneo tampoco, porque
  jugarías peor por correr. *(deducida de: el juego premia pensar)*

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
- **Ronda 2 — CÓMO FUNCIONA POR DENTRO** ✅ respondida · `Cuestionario-2-Como-Funciona.html`
- **Ronda 3 — ÚLTIMOS CABOS** ✅ respondida · `Cuestionario-3-Ultimos-Cabos.html`
- **Ronda 4** ❌ **no se hace.** Con la ronda 3 respondida puedo escribirlo todo sin inventarme nada.
  Una ronda más "por si acaso" sería justo el relleno que esta skill prohíbe.

---

## 7. Incógnitas abiertas

**Ninguna.** El choque de las cuentas quedó resuelto en D31 y el temario aprobado en D35.
Lo que aparezca a partir de aquí se decide sobre la marcha y se anota en la bitácora (sección 9).

## 8. Plan de implementación

Orden pensado para que lo de abajo sostenga lo de arriba: primero el motor (lo usan los cuatro
modos y los bots), luego la mesa, luego la pantalla, y el contenido al final porque es lo único
que se puede escribir sin bloquear nada.

**Motor y base**

- [x] 1 · Andamiaje: React + TypeScript + Vite, tests con Vitest, formato y lint
- [x] 2 · Cartas y manos: baraja, evaluador de la mejor mano de 5 entre 7, comparación y empates
- [x] 3 · Probabilidades: equity exacta cuando es barata, simulación cuando no; outs y regla del 2 y el 4
- [x] 4 · Rangos: representar un rango de manos, estrecharlo calle a calle según cómo apuesta el rival
- [x] 5 · Evaluación de decisiones: valor esperado de retirarse / pagar / subir contra el rango, puntuación graduada y exigencia por nivel (D20)
- [x] 6 · Mesa: turnos, ciegas, botón que rota, apuestas, todo-in, botes paralelos, reparto
- [x] 7 · Torneo corto: 4 jugadores, ciegas que suben, eliminación, guardar a medias
- [x] 8 · Bots: parámetros sorteados (agresividad, disciplina, farol, lectura) sobre el mismo motor

**Datos y cuentas**

- [x] 9 · Guardado local primero (juega sin conexión) y sincronización con el servidor al volver
- [x] 10 · Cuentas: registro, entrar, recuperar contraseña, borrar cuenta, página de privacidad

**Pantalla**

- [x] 11 · Esqueleto visual: tema oscuro, acento morado, navegación (Inicio · Jugar · Estadísticas · Logros · Configuración · Guía) según `docs/identidad/`
- [x] 12 · La mesa en pantalla: cartas, bote, fichas, los tres botones, barras de probabilidad
- [x] 13 · Entrenador: lecciones, manos generadas con condiciones, corrección al instante, dominio y avance rápido acertando
- [x] 14 · Modo libre: torneo, corrección al terminar la mano, revelación de los estilos de los bots
- [x] 15 · Rebobinar la mano · botón "¿por qué?" · rango del rival al terminar

**Contenido y vueltas de tuerca**

- [x] 16 · Los 9 módulos del temario, lección a lección — **41 lecciones**, todas validadas contra el motor
- [x] 17 · Estadísticas, logros, reto diario y repaso espaciado de errores
- [x] 18 · Instalable y sin conexión (PWA), pulido visual y repaso final

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
- **21/09/2026** — Ronda 2 respondida. Se cierran 11 decisiones (D20–D30) y se añaden 4 suposiciones
  (stack, generación de manos por lección, parámetros de bots, sin reloj). Aparece un **choque con
  una decisión ya cerrada**: pidió cuenta obligatoria con internet, pero jugar sin conexión estaba
  cerrado en la ronda 1 (D18). Me paro y se lo devuelvo en vez de decidirlo yo. Entregada la ronda 3
  (ÚLTIMOS CABOS, 5 preguntas + 3 sugerencias), que es la última: después se construye.
- **21/09/2026** — Ronda 3 respondida: el choque se resuelve a favor de jugar sin conexión (D31), el
  temario se aprueba tal cual (D35) y se confirma que él mismo es jugador objetivo (D36). **Se
  cierran las preguntas**: no hay ronda 4. Escrito el plan de 18 pasos y empieza la construcción.
- **21/09/2026** — Pasos 1–4 hechos. Motor de cartas, evaluador de manos, probabilidades y rangos,
  con 35 tests en verde. Dos cosas que decidí sobre la marcha: (a) el evaluador se comprueba contra
  fuerza bruta (las 21 combinaciones de 5 cartas entre 7) en 2.000 manos al azar, porque si el
  evaluador miente miente todo el juego; (b) la tabla de fuerza de las 169 manos iniciales se
  **genera** con el propio motor (`scripts/generar-fuerza-preflop.ts`) en vez de copiarse de una
  lista de internet, para que la tabla y el juego nunca se contradigan. Los números salen clavados
  a las calculadoras de referencia (AA 85,0% · KK 82,2% · 22 50,5% · 32o 32,5%).
- **21/09/2026** — Paso 5 hecho: el motor de decisiones (D20), 50 tests en verde. Cuatro cosas que
  hubo que resolver sobre la marcha, todas descubiertas porque el motor daba consejos malos y se
  notó al probarlo (`scripts/sondeo-decisiones.ts`):
  1. **Con una mano monstruosa decía "sube" siempre.** Faltaban dos piezas: que pasar *invita al
     rival a farolear* (y eso vale dinero contra un rival agresivo) y que en una mesa que no le
     sirve a nadie apostar solo consigue llevarse el bote pequeño. Con las dos, el motor ya
     recomienda esconder la mano justo cuando toca — que es lo que pidió el usuario en la ronda 1.
  2. **Con ases antes del flop recomendaba pagar en vez de resubir.** Dos errores: los tamaños de
     subida se medían sobre el bote *antes* de igualar (salían subidas ridículas), y el valor de las
     calles siguientes usaba la ventaja de hoy como si durara hasta el river. Ahora la ventaja se
     acerca al 50% por cada calle que falta, que es lo que pasa de verdad: el rival mete dinero
     cuando le ha mejorado algo, no al azar.
  3. **El motor creía que podía echar de la mano a alguien que ya tiene pareja alta.** Se añadió un
     suelo: con una mano de verdad nadie se retira ante una apuesta normal.
  4. **La puntuación se aplastaba a 0 demasiado pronto** y todos los errores parecían iguales. Curva
     nueva: 100 si clavas la jugada, 50 en el límite de lo aceptable para tu nivel, 0 a partir de
     cuatro veces ese límite.
- **21/09/2026** — Pasos 6, 7 y 8: mesa completa (ciegas, botón que rota, subida mínima, todo-in y
  botes paralelos), torneo corto con eliminación y bots. 77 tests. Lo que salió mal y hubo que
  arreglar: **el precio que le sale al rival cuando le subes estaba mal calculado** — se medía sobre
  el bote de antes en vez de sobre el que se llevaría si paga, y con eso el motor creía que la gente
  se retira mucho más de lo que se retira; cualquier farol parecía rentable y hasta un bot prudente
  se lanzaba con 7-2. Corregido, los seis casos de referencia del sondeo dan la respuesta de manual.
  También: los errores de los bots ahora son creíbles (se van a la segunda mejor jugada, no a una
  cualquiera) y farolear les exige un margen que sale de su barra de farol; y dos eliminados en la
  misma mano ya no empatan de puesto — queda por delante el que llegaba con más fichas.
- **21/09/2026** — Capa de juego e interfaz. Ya es jugable de punta a punta: curso con lecciones que
  se desbloquean, corrección al instante, modo libre con torneo, estadísticas, logros, ajustes y
  glosario. 91 tests. Decisiones tomadas sobre la marcha:
  1. **Las lecciones admiten preguntas de test, no solo decisiones.** Con tres botones no se puede
     enseñar qué gana a qué ni cómo se llama cada cosa, y el módulo 1 es justo eso. Las preguntas se
     generan (dos manos al azar → "¿cuál gana?"), así que no se memorizan.
  2. Probándolo en el navegador salieron **dos errores que engañaban al que aprende**: una pregunta
     cuya respuesta era "pareja" cuando la pareja estaba en la mesa, y una lección que decía "no has
     ligado nada" mientras el juego anunciaba "tienes pareja de nueves" (también de la mesa). Ahora
     el juego avisa cuando la jugada **está entera en la mesa**, y esa pregunta solo sale con manos
     donde tus cartas pintan algo.
  3. El progreso se guarda en el aparato desde ya, con **migración por versión** desde el primer día
     y una capa de sincronización aparte que fusiona **quedándose con lo más avanzado, no con lo más
     reciente**: quien juega en el móvil sin conexión y luego abre el portátil no puede perder
     lecciones terminadas.
- **21/09/2026** — Temario completo: los **9 módulos aprobados, 41 lecciones**. Lo más útil que salió
  de aquí fue una idea de test: cada lección de decisión declara qué debería recomendar el motor
  (`accionEsperada`), y un test reparte doce manos y comprueba que coinciden. Pilló dos lecciones
  que **enseñaban mal**, y en los dos casos tenía razón el motor y no yo:
  · «Un proyecto barato se paga» repartía manos con 42–50% (proyecto *más* cartas altas) contra un
    rival que se retira casi la mitad de las veces: ahí subir gana más que pagar. Se reescribió como
    «Un proyecto barato **no se suelta**», que es lo que de verdad se enseña en nivel básico.
  · «Al que se va a retirar, se le esconde» fallaba en mesas con tres cartas del mismo palo, porque
    entonces el rival sí tiene con qué seguir. Ahora exige **mesa seca**.
  Sin ese test, las dos habrían llegado al jugador contradiciendo a la corrección del propio juego.
- **21/09/2026** — Rebobinar la mano (D27), rango del rival al terminar (D26), reto diario (D29),
  repaso de errores (D15) e instalable sin conexión (D18, con tu logo de icono). Tres fallos que
  solo salieron jugando de verdad en el navegador: **el reto del día se cerraba en cuanto
  respondías** —se anotaba el resultado y la pantalla saltaba al "ya jugado" sin enseñar la
  corrección, que es la parte que enseña—; ponía "Módulo 0" en el reto y en el repaso, que no son
  del curso; y el aviso de "esa jugada está entera en la mesa" salía también con carta alta, donde
  no significa nada. Los tres corregidos.
- **21/09/2026** — Cuentas hechas (D11, D30, D31): registrarse, entrar, recuperar contraseña, cerrar
  sesión, borrar la cuenta y página de «qué guardamos de ti», más sincronización al abrir y al
  recuperar la conexión. **Queda pendiente algo que no puedo hacer yo**: crear el proyecto gratuito
  de Supabase y poner sus dos claves en `.env`. Mientras no estén, el juego arranca en modo local y
  se juega igual — eso es a propósito, para que nada dependa de tener el servidor montado.
  Instrucciones completas en `docs/servidor.md`, con el SQL de la tabla y las cuatro políticas que
  impiden que nadie lea el progreso de otro.
- **21/09/2026** — Repaso final jugando de verdad en móvil: 25 acciones y 13 manos seguidas del
  torneo sin un solo error de consola. Apareció **un fallo que no daba la cara en los tests**: al
  salir de un torneo a medias y volver, la pantalla se quedaba sin mesa y sin forma de continuar,
  porque lo que se guarda es el torneo y no la mano, y nadie repartía la siguiente. Corregido: al
  volver se reparte mano nueva.

---

## 10. Estado final de la primera versión

**Hecho y funcionando** (18 pasos del plan, 112 tests):

- Motor completo: evaluador de manos, probabilidades exactas y simuladas, rangos, lectura del rival
  y evaluación de decisiones por valor esperado (D20).
- Mesa de Hold'em sin límite con botes paralelos, torneo corto con eliminación y bots con carácter.
- Entrenador con 9 módulos y 41 lecciones, corrección al instante, ayuda que se va quitando, dominio
  por aciertos y avance rápido para el que ya sabe.
- Modo libre con puntuación por decisiones, estilos revelados al final y torneo guardable.
- Reto diario, repaso espaciado de errores, rebobinar la mano, rango del rival, estadísticas, logros,
  glosario de 29 términos, ajustes y página de privacidad.
- Cuentas completas y sincronización que no bloquea el juego.
- Instalable en el móvil y jugable sin conexión.

**Lo único pendiente, y no lo puedo hacer yo:** crear el proyecto gratuito de Supabase y poner sus
dos claves en `.env` (instrucciones en `docs/servidor.md`). Hasta entonces el juego arranca en modo
local y se juega igual.

**Lo que se dejó fuera a propósito**, por decisión suya: multijugador con amigos (D14, el motor está
preparado), otros idiomas (D12) y el mazo de cuatro colores.
- **21/09/2026 (tarde)** — Primera prueba real del usuario y primer rediseño con datos de verdad.
  Tres cambios: pantalla de nivel al entrar (D39), explicación en pasos visuales (D40) y módulo 1
  rehecho con la transición que faltaba (D41). Dos piezas nuevas de código que hacían falta para
  esto: un **constructor de jugadas** (`contenido/generador.ts`) que sabe repartir un color o un
  full a voluntad —repartiendo al azar saldrían parejas el 90% de las veces y la lección no
  enseñaría nada— y un componente de **pasos** que enseña una frase y unas cartas por pantalla.
  El formato de pasos se aplica a TODAS las lecciones, no solo a las rehechas: las que aún no
  tienen pasos escritos a mano parten su explicación en un paso por párrafo, así que ninguna
  lección enseña ya un muro de texto.
