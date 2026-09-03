<h1 align="center">21st Century Music</h1>

<p align="center">
  Entrenamiento musical para los alumnos de la<br>
  <a href="https://escuelademusicamoderna.com/">Escuela de Música Moderna</a>.
</p>

<p align="center">
  <a href="https://21stcenturymusic.app">21stcenturymusic.app</a>
</p>

---

Veintidós ejercicios que se juegan desde el navegador, sin instalar nada: oído,
lectura, ritmo, mástil de guitarra y teclado. Cada partida son 24 preguntas.

Se puede jugar sin cuenta. Con cuenta de alumno, además, se guarda el progreso:
partidas, medallas, racha de días y un panel donde el profesorado ve por dónde
va cada uno.

## Arrancar

```bash
pnpm install
pnpm dev
```

Y abrir <http://localhost:3000>.

Hace falta un archivo `.env` en la raíz con tres claves:

```bash
SUPABASE_URL=...              # el proyecto de Supabase
SUPABASE_SERVICE_ROLE_KEY=... # solo servidor, nunca en el navegador
AUTH_SECRET=...               # cualquier cadena larga: firma las sesiones
```

## Cómo está hecho

| | |
|---|---|
| **Next.js 16** | App Router y Turbopack |
| **React 19** + **TypeScript** | |
| **Tailwind 4** | los estilos, sin más capas |
| **Supabase** | Postgres. Alumnos, partidas y apuntes |
| **Auth.js v5** | usuario y contraseña, sesión en cookie |
| **VexFlow 5** | el pentagrama |
| **Web Audio** | el sonido, a mano y sin librerías |
| **Vercel** | donde vive |

## Por dónde empezar a leer

```
app/play/      los ejercicios, uno por carpeta
lib/games.ts   el catálogo: qué modos hay y dónde están
lib/progress.ts qué se guarda de cada partida y cómo se calcula el progreso
db/            las migraciones, en SQL, que se pasan a mano
```

Para lo demás — decisiones, trampas y todo lo que conviene saber antes de tocar
nada — está [NOTES.md](NOTES.md).

---

<p align="center">
  <sub><em>Al nostre pare.</em></sub>
</p>
