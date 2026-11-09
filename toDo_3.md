## 1. Cuadro de honor (/honor)

- Ranking de medallas totales desde siempre.
- Top 10 aaaunque puedes darle aa mostrar mas
-
- Debajo del ranking, un segundo bloque "Reto de hoy" con el top 10 del reto diario (ver punto 2).
- Solo lo ven usuarios con sesión.
- Todos aparecen por defecto. Migración: students.show_in_honor boolean default true y students.honor_notice_seen_at timestamptz.
- Interruptor "Aparecer en el cuadro de honor" en el menú de usuario. Quien lo desactiva no aparece en ningún ranking.

- Home: una línea "🏆 Vas 14º · ver cuadro" que enlaza a /honor.

## 2. Reto diario "Eco" (/reto)

Juego tipo Simon con sonido:

- Pentágono dividido en 5 quesitos de colores, uno por nota de do pentatónica (do re mi sol la). Que sean fáciles de tocar en móvil.
- Ronda 1 suena 1 nota, ronda 2 suenan 2, y así sucesivamente. El alumno las repite tocando los quesitos. El tempo sube un poco cada ronda.
- Hasta la ronda 6 se ilumina el quesito de la nota que suena. Desde la ronda 7 solo suena (mostrar "🔇 Solo oído").
- Una sola vida: al primer fallo se acaba.
- La secuencia es la misma para todos ese día: se genera con un PRNG con semilla (por ejemplo mulberry32) a partir de la fecha en Europe/Madrid.
- Un intento al día. El reto cambia a medianoche hora de Madrid. Nº de reto = días desde el lanzamiento.
- Botón "Empezar" que desbloquea el AudioContext (iOS). Programa las notas con ctx.currentTime, no con setTimeout.

Validación en servidor:

no se como hacerlo paara que sea facail y simple sin complicarase demasiado

Pantallas:

- Al acabar: "11 notas · 5º de hoy", botón de compartir con navigator.share ("🎵 Eco #47 · 11 notas ⬠"), top 10 de hoy y cuenta atrás hasta el siguiente reto.
- Si ya jugó hoy, entra directamente a esa pantalla.

- Tarjeta "Reto diario" arriba del todo en el hub, con el estado de hoy.

## 3. Exámenes

Cualquier usuario con sesión puede crear y hacer exámenes. No hay roles.

- /examenes/crear: título y bloques (modo + nivel + nº de preguntas) Al publicar se genera un código de 12 caracteres sin 0/O/1/I y con botones Copiar y WhatsApp. Los exámenes no se editan.
- Todos reciben las mismas preguntas (semilla del examen), pero el orden de las preguntas y de las opciones se baraja por alumno (semilla del examen + id del alumno).
- /e/[code]: portada (título, "Creado por Javi M.", nº de preguntas, botón Empezar). Luego una pregunta cada vez con "7/20" y 15 s por pregunta medidos en servidor. Sin corrección durante el examen. Si se acaba el tiempo de una pregunta, cuenta como fallo. Un intento por persona. Si recarga, sigue donde iba. Al terminar, ve su nota sobre 10.
- El servidor manda las preguntas de una en una y nunca envía la respuesta correcta al alumno.
- /examenes: "Creados por mí" (abiertos primero con "🟢 Abierto · N entregas", luego cerrados, del más reciente al más antiguo) y "Hechos por mí" (título y nota).
- /examenes/[id], solo el creador: botón Cerrar, lista de resultados (nombre, nota, fecha) y, al pulsar en uno, sus respuestas pregunta a pregunta en verde/rojo. Además, el examen con el % de acierto de cada pregunta.

Tablas:
las que quieras. las necesaraias paraa hacerlo simple pero facil y resiliente , y no caotico ni mezclado con otraas cosas, supongo

Si algo de esto choca con cómo está hecho el código ahora, pregúntame antes de decidir. O culquier duda que tengas
