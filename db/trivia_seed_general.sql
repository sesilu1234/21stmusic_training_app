-- =====================================================================
-- Preguntas del tema "general" del trivial
-- Ejecutar DESPUES de db/trivia.sql. Se puede repetir sin miedo.
-- =====================================================================
-- El nivel "general" (ver lib/trivia.ts) juega con TODAS las preguntas de la
-- tabla, sin filtrar por tema: para eso no hace falta escribir ninguna
-- pregunta nueva, basta con mandar `null` en `trivia_round`.
--
-- Estas son otra cosa. Son las que no caben en ningun tema porque van de un
-- poco de todo —una mezcla de historia, lenguaje, instrumentos y cultura
-- general de musica—, y en un menu por temas se quedarian sin sitio. Con el
-- nivel general ya lo tienen, y de paso el "de todo un poco" tiene material
-- propio en vez de ser solo un revoltijo de los demas.
--
-- Como el resto: el `on conflict do nothing` se apoya en el indice unico sobre
-- el texto de la pregunta, asi que volver a pasar el archivo no duplica nada.
-- =====================================================================

begin;

insert into trivia_questions (tema, pregunta, opcion_1, opcion_2, opcion_3, opcion_4, correcta) values
  ('general', '¿Cuántas teclas tiene un piano de cola estándar?', '76', '61', '88', '92', 3),
  ('general', '¿Cuántas líneas tiene un pentagrama?', 'Cuatro', 'Cinco', 'Seis', 'Siete', 2),
  ('general', '¿Qué nombre recibe el silencio que dura lo mismo que una negra?', 'Silencio de corchea', 'Silencio de negra', 'Calderón', 'Silencio de blanca', 2),
  ('general', '¿Qué signo indica que una nota se alarga la mitad de su valor?', 'El calderón', 'La ligadura', 'El puntillo', 'El becuadro', 3),
  ('general', '¿Qué significa el término italiano ''forte'' en una partitura?', 'Rápido', 'Fuerte', 'Suave', 'Ligado', 2),
  ('general', '¿Qué indicación de tempo es más lenta?', 'Allegro', 'Andante', 'Presto', 'Largo', 4),
  ('general', '¿Cómo se llama la distancia más pequeña entre dos notas del sistema occidental?', 'El tono', 'El semitono', 'La coma', 'El intervalo', 2),
  ('general', '¿Qué instrumento NO pertenece a la familia de la cuerda frotada?', 'Viola', 'Contrabajo', 'Arpa', 'Violonchelo', 3),
  ('general', '¿En qué clave se escribe habitualmente la parte del contrabajo?', 'Clave de sol', 'Clave de fa en cuarta', 'Clave de do en tercera', 'Clave de fa en tercera', 2),
  ('general', '¿Qué aparato se usa para marcar el tempo mientras se estudia?', 'El afinador', 'El metrónomo', 'El diapasón', 'El compresor', 2),
  ('general', '¿A qué frecuencia se afina habitualmente el La central hoy en día?', '432 Hz', '438 Hz', '440 Hz', '444 Hz', 3),
  ('general', '¿Qué es un ''riff'' en el lenguaje del rock?', 'Un solo improvisado', 'Una frase corta que se repite', 'El estribillo cantado', 'Un cambio de compás', 2),
  ('general', '¿Qué parte de una canción suele repetirse con la misma letra cada vez?', 'La estrofa', 'El puente', 'El estribillo', 'La introducción', 3),
  ('general', '¿Cómo se llama el músico que dirige una orquesta?', 'El concertino', 'El director', 'El maestro de coro', 'El compositor', 2),
  ('general', '¿Qué instrumento toca el concertino de una orquesta sinfónica?', 'El violín', 'El oboe', 'El chelo', 'La flauta', 1),
  ('general', '¿Qué instrumento da la nota de afinación al resto de la orquesta?', 'El primer violín', 'El oboe', 'El piano', 'La trompa', 2),
  ('general', '¿Cuántas cuerdas tiene un bajo eléctrico clásico?', 'Cuatro', 'Cinco', 'Seis', 'Tres', 1),
  ('general', '¿Qué instrumento de cuerda se toca apoyado en el hombro y es más grande que el violín?', 'La viola', 'El violonchelo', 'La mandolina', 'El laúd', 1),
  ('general', 'En un compás de 3/4, ¿qué figura vale un pulso?', 'La blanca', 'La negra', 'La corchea', 'La redonda', 2),
  ('general', '¿Qué significa el término ''a cappella''?', 'Cantar muy agudo', 'Cantar sin acompañamiento instrumental', 'Cantar en latín', 'Cantar en canon', 2),
  ('general', '¿Qué voz femenina es la más aguda?', 'Contralto', 'Mezzosoprano', 'Soprano', 'Tenor', 3),
  ('general', '¿Qué voz masculina es la más grave?', 'Tenor', 'Barítono', 'Contratenor', 'Bajo', 4),
  ('general', '¿Qué familia de instrumentos incluye el saxofón?', 'Metal', 'Viento madera', 'Percusión', 'Cuerda pulsada', 2),
  ('general', '¿De qué material está hecho normalmente el cuerpo de un saxofón?', 'Madera', 'Latón', 'Acero', 'Ébano', 2),
  ('general', '¿Qué instrumento de percusión de una batería marca habitualmente el pulso con el pie derecho?', 'La caja', 'El charles', 'El bombo', 'El crash', 3),
  ('general', '¿Qué se afina cuando se ''afina'' una batería?', 'Los parches', 'Los platos', 'Los soportes', 'Los pedales', 1),
  ('general', '¿Qué género nació en Nueva Orleans a principios del siglo XX?', 'El blues', 'El jazz', 'El country', 'El soul', 2),
  ('general', '¿Qué compositor escribió ''Las cuatro estaciones''?', 'Bach', 'Mozart', 'Vivaldi', 'Haydn', 3),
  ('general', '¿Qué compositor siguió componiendo después de quedarse sordo?', 'Beethoven', 'Chopin', 'Schubert', 'Brahms', 1),
  ('general', '¿Cuántas sinfonías completó Beethoven?', 'Siete', 'Nueve', 'Doce', 'Cuatro', 2),
  ('general', '¿Qué obra de Mozart quedó sin terminar a su muerte?', 'La flauta mágica', 'El Réquiem', 'Don Giovanni', 'Las bodas de Fígaro', 2),
  ('general', '¿Qué ciudad alemana está asociada a la vida y obra de Johann Sebastian Bach?', 'Múnich', 'Leipzig', 'Berlín', 'Hamburgo', 2),
  ('general', '¿Qué instrumento se asocia sobre todo a la obra de Chopin?', 'El violín', 'El piano', 'El órgano', 'El clarinete', 2),
  ('general', '¿Qué banda británica grabó el álbum ''Abbey Road''?', 'The Rolling Stones', 'The Who', 'The Beatles', 'The Kinks', 3),
  ('general', '¿Qué disco de Pink Floyd tiene un prisma en la portada?', 'Wish You Were Here', 'Animals', 'The Wall', 'The Dark Side of the Moon', 4),
  ('general', '¿Quién cantaba en Queen?', 'Robert Plant', 'Freddie Mercury', 'David Bowie', 'Roger Daltrey', 2),
  ('general', '¿Qué instrumento tocaba Miles Davis?', 'El saxofón', 'La trompeta', 'El piano', 'El contrabajo', 2),
  ('general', '¿Qué cantante es conocida como la ''Reina del Soul''?', 'Tina Turner', 'Nina Simone', 'Aretha Franklin', 'Diana Ross', 3),
  ('general', '¿Qué sello discográfico de Detroit definió el sonido soul de los años sesenta?', 'Stax', 'Motown', 'Atlantic', 'Chess', 2),
  ('general', '¿Qué es el ''playback'' en una actuación?', 'Tocar sin amplificar', 'Cantar sobre una grabación ya hecha', 'Repetir el estribillo', 'Grabar en directo', 2),
  ('general', '¿Qué formato de audio comprime el sonido perdiendo calidad a cambio de ocupar menos?', 'WAV', 'AIFF', 'MP3', 'FLAC', 3),
  ('general', '¿Cuántos minutos caben aproximadamente en un CD de audio estándar?', '45', '60', '74', '100', 3),
  ('general', '¿Qué significan las siglas MIDI?', 'Musical Instrument Digital Interface', 'Multi Instrument Direct Input', 'Modular Interface for Digital Instruments', 'Musical Input Data Interchange', 1),
  ('general', '¿Qué es un ''bpm''?', 'Bajos por minuto', 'Pulsos (beats) por minuto', 'Bits por medida', 'Barras por movimiento', 2),
  ('general', '¿Qué hace un capo en una guitarra?', 'Afina las cuerdas', 'Sube la tonalidad acortando las cuerdas', 'Baja el volumen', 'Sujeta la correa', 2),
  ('general', '¿Cómo se llama la afinación estándar de una guitarra de seis cuerdas, de la más grave a la más aguda?', 'Mi La Re Sol Si Mi', 'Mi La Re Sol Do Mi', 'Re La Re Sol Si Mi', 'Mi Re La Sol Si Mi', 1),
  ('general', '¿Qué es un ''arpegio''?', 'Tocar las notas de un acorde una detrás de otra', 'Tocar dos cuerdas a la vez', 'Rasguear muy rápido', 'Doblar una cuerda', 1),
  ('general', '¿Qué significa ''tocar de oído''?', 'Tocar sin partitura, sacando la música al escucharla', 'Tocar con auriculares', 'Tocar muy bajito', 'Tocar de memoria una partitura estudiada', 1),
  ('general', '¿Qué es el ''solfeo''?', 'Afinar el instrumento', 'Leer y entonar la música leyendo el nombre de las notas', 'Improvisar sobre una escala', 'Escribir una partitura al dictado', 2),
  ('general', '¿Qué instrumento tiene teclas blancas y negras, pero suena al soplar?', 'El acordeón', 'La melódica', 'El clavicémbalo', 'El órgano Hammond', 2)
on conflict do nothing;

commit;
