# Notas de la app



## Herramientas

| Qué | Para qué | Dónde se ve |
|---|---|---|
| **Next.js 16** (App Router, Turbopack) | todo el armazón | `app/` |
| **React 19** | | |
| **TypeScript** | | `tsconfig.json` |
| **Tailwind 4** | los estilos. No hay CSS-in-JS ni librería de componentes | `app/globals.css`, `postcss.config.mjs` |
| **Supabase** (Postgres) | alumnos, partidas, apuntes, mensajes de contacto | `lib/supabaseAdmin.ts`, `db/` |
| **Auth.js v5** (next-auth beta) | entrar con usuario y contraseña | `auth.ts` |
| **VexFlow 5** | dibujar pentagramas | `app/components/Staff.tsx`, `lib/staff.ts` |
| **Web Audio API** | todo el sonido, escrito a mano | `lib/audioContext.ts`, `freeSynth`, `pluckedString`, `reverb` |
| **lucide-react** | los iconos | `app/components/gameIcons.tsx` |
| **Vercel** | alojamiento y analítica de visitas | |
| **pnpm** | el gestor de paquetes | |


---



## El mapa

```
app/
  page.tsx            el menú, construido desde lib/games.ts
  play/               un ejercicio por carpeta
  progreso/           el panel del alumno
  alumnario/          el panel del profesorado (roles admin y profesor)
  muestrario/         página de taller, solo admin
  guia/               teoría musical, solo para alumnos con cuenta
  notas/              apuntes privados del alumno
  api/abandon/        recibe las partidas que se dejan a medias
  components/         lo compartido entre ejercicios
lib/
  games.ts            EL catálogo. Qué modos hay, dónde y quién puede entrar
  gameLevels.ts       los niveles de cada modo (denominador del "dominado")
  progress.ts         guardar partidas y calcular todo lo demás
  students.ts         alumnos y roles
  roles.ts            quién ve qué
  seo.ts              metadatos y dirección del sitio
  roundLength.ts      24 preguntas por partida, para todos los modos
  trivia.ts           los diez temas del trivial (son sus niveles)
  triviaQuestions.ts  pedir las 24 preguntas a Supabase
db/                   las migraciones, por orden histórico
```

---



## El trivial

Las preguntas están en Supabase (`trivia_questions`), no en el código. Se
sacaron de ahí porque el archivo se descargaba entero al navegador —con sus
respuestas— para usar 24 preguntas, y porque así se pueden añadir desde el panel
de Supabase importando un CSV, sin desplegar nada.

Para añadir más: copiar el formato de `db/trivia_plantilla.csv`, rellenar en una
hoja de cálculo, exportar a CSV e importar en la tabla desde Supabase. El
`tema` tiene que ser uno de los slugs de `lib/trivia.ts`, y `correcta` es el
número (1-4) de la opción buena. Hay un índice único sobre la pregunta, así que
importar dos veces lo mismo no duplica nada.

Los temas son **niveles** del modo, como en cualquier otro: cada uno tiene su
URL, sus partidas y su medalla. Las opciones se barajan al servirlas, para que
no se aprenda la posición de la respuesta.

`db/trivia_seed.sql` está **generado**: no se edita a mano.

---

## Números que se tocan en un solo sitio

| Constante | Valor | Dónde |
|---|---|---|
| Preguntas por partida | 24 | `lib/roundLength.ts` |
| Mínimo para que un pleno dé medalla | 24 | `lib/progress.ts` |
| Partidas que miran las medias ("forma") | 10 | `lib/progress.ts` |
| Zona horaria (decide qué día es hoy) | Europe/Madrid | `lib/progress.ts` |

---

## Antes de desplegar

1. Pasar en Supabase las migraciones nuevas de `db/` (el trivial son dos, y en
   orden: `trivia.sql` y luego `trivia_seed.sql`).
2. `pnpm build` en local si has tocado algo gordo.
3. Comprobar que lo instalado está en `pnpm-lock.yaml`.
