"use client";

import React, {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";

import { createMetronome, getCtx } from "./metronome";
import {
  createRhythmScore,
  TPQ,
  type NoteValue,
  type RhythmLevel,
  type ScoreItem,
} from "@/lib/rhythm";

const BRAVURA_URL = "/assets/bravura.woff2";

const G = {
  noteWhole: "\uE1D2",
  noteHalfUp: "\uE1D3",
  noteQuarterUp: "\uE1D5",
  note8thUp: "\uE1D7",
  note16thUp: "\uE1D9",
  noteheadBlack: "\uE0A4",
  augmentationDot: "\uE1E7",
  restWhole: "\uE4E3",
  restHalf: "\uE4E4",
  restQuarter: "\uE4E5",
  rest8th: "\uE4E6",
  rest16th: "\uE4E7",
  barline: "\uE030",
  barlineFinal: "\uE032",
  time4: "\uE084",
  tuplet3: "\uE883",
};

/** Figura suelta: la fuente ya trae cabeza, plica y corchete en un solo signo. */
const NOTE_GLYPH: Record<NoteValue, string> = {
  w: G.noteWhole,
  h: G.noteHalfUp,
  q: G.noteQuarterUp,
  "8": G.note8thUp,
  "16": G.note16thUp,
};

const REST_GLYPH: Record<NoteValue, string> = {
  w: G.restWhole,
  h: G.restHalf,
  q: G.restQuarter,
  "8": G.rest8th,
  "16": G.rest16th,
};

export interface MusicRef {
  handleStart: (isPlaying: boolean) => void;
  handleBPMChange: (bpm: number) => void;
  handleMeasuresChange: () => void;
}

interface SimpleMovingScoreProps {
  level: RhythmLevel;
  BPM: React.MutableRefObject<number>;
  measures: React.MutableRefObject<number>;
  onComplete?: (endType: string, data: Record<string, number>) => void;
  setBeat?: (beat: number) => void;
}

// Ventana de acierto. Antes eran dos constantes fijas en segundos, así que a
// tempo rápido la ventana se comía la figura siguiente y a tempo lento era
// absurdamente estrecha por delante. Ahora cada nota reparte con sus vecinas.
const HIT_MAX = 0.13;
const HIT_MIN = 0.04;
const HIT_SHARE = 0.45;

const SimpleMovingScore = forwardRef<MusicRef, SimpleMovingScoreProps>(
  ({ level, BPM, measures, onComplete, setBeat }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [fontLoaded, setFontLoaded] = useState(false);

    const speedRef = useRef(0);
    const startTimeRef = useRef<number>(0);
    const beforeStart = useRef<number>(0.5);
    const requestRef = useRef<number>(0);

    const ctxCanvasRef = useRef<CanvasRenderingContext2D | null>(null);

    const metronomeRef = useRef<ReturnType<typeof createMetronome> | null>(
      null,
    );

    const gameRef = useRef<ReturnType<typeof createGameState> | null>(null);

    const TAP_RUN_TIMES = useRef<number[]>([]);

    const notFirstTime = useRef<boolean>(false);

    const scrollX = useRef(0);
    const scrollXBase = useRef(0);
    const timeBase = useRef(0);
    const posIndex = useRef(0);

    const currentNoteIndex = useRef(0);

    // Medidas de dibujo
    const BEAT_WIDTH = 100;
    // Un poco más alto que antes: hacen falta dos alturas de barra, el "3" del
    // tresillo y la fila de aciertos, todo encima de la línea.
    const HEIGHT = 170;
    const pixels = 50;
    const LEFT_PAD = 25;
    /** Ninguna figura se dibuja más estrecha que esto, o las semicorcheas se pisan. */
    const MIN_STEP = 27;

    const w = typeof window !== "undefined" ? window.innerWidth : 0;

    /**
     * Ancho util para dibujar: el de la caja blanca de la partitura, no el de
     * la ventana.
     *
     * El canvas se dimensionaba a `window.innerWidth`, pero su contenedor es
     * mas estrecho (`max-w-[95%]`) y ademas va centrado, asi que recortaba lo
     * que sobraba por los dos lados a la vez. En una pantalla grande esos pocos
     * pixeles no se notan; en un movil se comen un trozo de los dos extremos
     * justo cuando ya no sobra sitio, y por eso las notas no se veian bien.
     *
     * Se mide `[data-score-frame]` y no `canvas.parentElement` a proposito. El
     * padre directo es un `div` sin ancho propio dentro de una cadena de flex:
     * lo que mida depende de la caja de fuera, y midiendolo a el el canvas se
     * quedaba sin ancho y la partitura salia en blanco. La caja marcada tiene
     * su ancho puesto por CSS (`w-full max-w-[95%]`), que no puede depender de
     * lo que haya dentro, asi que la medida ni se cae a cero ni se realimenta.
     */
    const viewWidth = () => {
      const canvas = canvasRef.current;
      const frame = canvas?.closest("[data-score-frame]") ?? canvas?.parentElement;
      const measured = frame?.clientWidth ?? 0;
      // Por debajo de esto no hay partitura que valga: si la medida sale rara
      // (aun sin maquetar, contenedor oculto) es mejor la ventana que un canvas
      // en blanco.
      if (measured >= 120) return measured;
      return typeof window !== "undefined" ? window.innerWidth : 0;
    };

    /**
     * Donde se planta el cursor verde, contando desde la izquierda del canvas.
     *
     * En pantallas grandes se pone bien adentro para que se vea lo que ya has
     * tocado. En el movil eso es un lujo que no cabe: lo que hace falta ahi es
     * ver las figuras que vienen con tiempo de reaccionar, y cada pixel a la
     * izquierda del cursor es un pixel que se le quita a eso. Asi que en movil
     * el cursor se va al principio del pentagrama y la pantalla entera queda
     * para lo que esta por llegar.
     *
     * El tope del 45% es lo que impedia el fallo gordo que tenia esto: el valor
     * se calculaba UNA vez, al montar, y no se volvia a mirar. Si abrias la
     * pagina con la ventana ancha te tocaba 470, y si luego la estrechabas —
     * abrir las DevTools acopladas al lado ya vale — el cursor se quedaba en
     * 470 dentro de un canvas de 458: TODO se dibujaba pasado el borde derecho
     * y la partitura desaparecia entera. Caja blanca y vacia, sin ningun error
     * por ningun lado. Ahora se recalcula en cada `resize` y ademas no puede
     * pasar de la mitad del ancho, asi que quede como quede siempre hay
     * partitura a la vista.
     */
    const cursorOffsetFor = (width: number) => {
      const wanted = width < 710 ? 8 : width < 1070 ? 100 : width < 1400 ? 250 : 470;
      return Math.max(8, Math.min(wanted, width * 0.45));
    };

    const translatedRef = useRef(cursorOffsetFor(w));

    // Métricas de grabado, en proporción al cuerpo de la fuente.
    // En SMuFL un espacio de pentagrama es 1/4 del em.
    const SP = pixels / 4;
    const STEM_W = Math.max(1, 0.12 * SP);
    const STEM_LEN = 3.5 * SP;
    const BEAM_H = 0.5 * SP;
    const BEAM_GAP = 0.25 * SP;
    const STUB_LEN = 1.1 * SP;
    const headWidthRef = useRef(1.18 * SP);

    const stepFor = (item: ScoreItem) =>
      item.ticks > 0
        ? Math.max(MIN_STEP, (item.beats * BEAT_WIDTH) ** 0.9)
        : 15;

    /** Tiempos de cada evento, y la ventana de acierto de cada nota. */
    function computeTimeline(score: ScoreItem[], bpm: number) {
      const secondsPerTick = 60 / bpm / TPQ;

      let acc = 0;
      const TIME_LINE: number[] = [];
      const notes: { index: number; time: number }[] = [];

      score.forEach((item, i) => {
        if (item.ticks === 0) return;
        const time = acc * secondsPerTick;
        TIME_LINE.push(time);
        if (item.kind === "note") notes.push({ index: i, time });
        acc += item.ticks;
      });

      TIME_LINE.push(acc * secondsPerTick);

      const clamp = (v: number) => Math.min(HIT_MAX, Math.max(HIT_MIN, v));
      const TIME_LINE_NOTES = notes.map((note, k) => ({
        index: note.index,
        time: note.time,
        early:
          k === 0 ? HIT_MAX : clamp(HIT_SHARE * (note.time - notes[k - 1].time)),
        late:
          k === notes.length - 1
            ? HIT_MAX
            : clamp(HIT_SHARE * (notes[k + 1].time - note.time)),
      }));

      return { TIME_LINE, TIME_LINE_NOTES };
    }

    function createGameState(bpm: number) {
      const score = createRhythmScore(level, measures.current);

      let xi = 0;
      score.forEach((item) => {
        item.xi = xi;
        item.status = 2;
        xi += stepFor(item);
      });

      // Índices de cada grupo barrado y de cada tresillo, para no recorrer la
      // partitura entera en cada fotograma.
      const beamGroups = new Map<number, number[]>();
      const tupletGroups = new Map<number, number[]>();
      score.forEach((item, i) => {
        if (item.beamGroup >= 0) {
          const g = beamGroups.get(item.beamGroup) ?? [];
          g.push(i);
          beamGroups.set(item.beamGroup, g);
        }
        if (item.tupletGroup >= 0) {
          const g = tupletGroups.get(item.tupletGroup) ?? [];
          g.push(i);
          tupletGroups.set(item.tupletGroup, g);
        }
      });

      const LENGTH_LINE = score
        .filter(
          (item, index) =>
            item.kind !== "barline" || index === score.length - 1,
        )
        .map((item) => item.xi);

      const { TIME_LINE, TIME_LINE_NOTES } = computeTimeline(score, bpm);

      return {
        score,
        beamGroups,
        tupletGroups,
        TIME_LINE,
        TIME_LINE_NOTES,
        LENGTH_LINE,
      };
    }

    function initGame() {
      gameRef.current = createGameState(BPM.current);

      currentNoteIndex.current = 0;
      posIndex.current = 0;

      scrollX.current = 0;
      scrollXBase.current = 0;
      timeBase.current = 0;
      speedRef.current = 0;

      TAP_RUN_TIMES.current = [];
    }

    if (!gameRef.current) {
      initGame();
    }

    // ---------------------------------------------------------------------
    // Grabado
    // ---------------------------------------------------------------------

    const stemLeftOf = (item: ScoreItem) =>
      item.xi + LEFT_PAD + headWidthRef.current - STEM_W;
    const stemRightOf = (item: ScoreItem) =>
      item.xi + LEFT_PAD + headWidthRef.current;

    /** Barra principal, secundarias y barras cortas de un grupo. */
    const drawBeams = (
      ctx: CanvasRenderingContext2D,
      score: ScoreItem[],
      indices: number[],
      midY: number,
    ) => {
      if (indices.length < 2) return;

      const top = midY - STEM_LEN;
      const first = score[indices[0]];
      const last = score[indices[indices.length - 1]];

      ctx.fillRect(
        stemLeftOf(first),
        top,
        stemRightOf(last) - stemLeftOf(first),
        BEAM_H,
      );

      const maxBeams = Math.max(...indices.map((i) => score[i].beams));

      for (let levelIdx = 2; levelIdx <= maxBeams; levelIdx++) {
        const y = top + (levelIdx - 1) * (BEAM_H + BEAM_GAP);
        let k = 0;

        while (k < indices.length) {
          if (score[indices[k]].beams < levelIdx) {
            k++;
            continue;
          }

          let end = k;
          while (
            end + 1 < indices.length &&
            score[indices[end + 1]].beams >= levelIdx
          ) {
            end++;
          }

          if (end > k) {
            const from = stemLeftOf(score[indices[k]]);
            ctx.fillRect(from, y, stemRightOf(score[indices[end]]) - from, BEAM_H);
          } else {
            // Una sola figura con esa barra: se dibuja media barra apuntando
            // hacia dentro del grupo (corchea con puntillo + semicorchea).
            const item = score[indices[k]];
            if (k === 0) {
              ctx.fillRect(stemLeftOf(item), y, STUB_LEN, BEAM_H);
            } else {
              ctx.fillRect(stemRightOf(item) - STUB_LEN, y, STUB_LEN, BEAM_H);
            }
          }

          k = end + 1;
        }
      }
    };

    const drawTupletNumber = (
      ctx: CanvasRenderingContext2D,
      score: ScoreItem[],
      indices: number[],
      midY: number,
    ) => {
      const first = score[indices[0]];
      const last = score[indices[indices.length - 1]];
      const centerX =
        (first.xi + LEFT_PAD + stemRightOf(last)) / 2;

      ctx.save();
      ctx.font = `${pixels * 0.72}px Bravura`;
      ctx.textAlign = "center";
      ctx.fillText(G.tuplet3, centerX, midY - STEM_LEN - 0.35 * SP);
      ctx.restore();
    };

    const draw = (
      ctx: CanvasRenderingContext2D,
      scrollXValue: number,
      width: number,
    ) => {
      ctx.clearRect(0, 0, width * 2, HEIGHT * 2);
      ctx.save();
      ctx.translate(-scrollXValue + translatedRef.current, 0);

      const game = gameRef.current!;
      const score = game.score;
      const midY = HEIGHT / 2;
      const markY = midY - STEM_LEN - 30;

      // Línea del pentagrama (una sola: aquí no hay alturas, sólo ritmo)
      ctx.beginPath();
      ctx.moveTo(LEFT_PAD, midY);
      ctx.lineTo(score[score.length - 1].xi + LEFT_PAD, midY);
      ctx.strokeStyle = "#222";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.font = `${pixels}px Bravura`;
      ctx.fillStyle = "#111";
      headWidthRef.current = ctx.measureText(G.noteheadBlack).width;

      // Compás. Las cifras de SMuFL miden 2 espacios y van centradas en su
      // línea de base, así que separándolas un espacio se apilan justas y se
      // tocan en la línea del pentagrama.
      ctx.fillText(G.time4, 0, midY - SP);
      ctx.fillText(G.time4, 0, midY + SP);

      score.forEach((item) => {
        const x = item.xi + LEFT_PAD;

        if (item.kind === "barline") {
          ctx.fillText(
            item.final ? G.barlineFinal : G.barline,
            x,
            midY + pixels / 2,
          );
          return;
        }

        if (item.kind === "rest") {
          ctx.fillText(REST_GLYPH[item.value], x, midY);
        } else if (item.beamGroup >= 0) {
          // Va unida a otras: cabeza y plica a mano, la barra va aparte.
          ctx.fillText(G.noteheadBlack, x, midY);
          ctx.fillRect(stemLeftOf(item), midY - STEM_LEN, STEM_W, STEM_LEN);
        } else {
          ctx.fillText(NOTE_GLYPH[item.value], x, midY);
        }

        // Puntillo: a la derecha de la cabeza y en el espacio de encima.
        for (let d = 0; d < item.dots; d++) {
          ctx.fillText(
            G.augmentationDot,
            x + headWidthRef.current + (0.4 + d * 0.5) * SP,
            midY - SP / 2,
          );
        }
      });

      game.beamGroups.forEach((indices) => drawBeams(ctx, score, indices, midY));
      game.tupletGroups.forEach((indices) =>
        drawTupletNumber(ctx, score, indices, midY),
      );

      // Aciertos y fallos, todos a la misma altura por encima de la música.
      score.forEach((item) => {
        if (item.kind !== "note" || item.status === 2) return;

        const cx = item.xi + LEFT_PAD + headWidthRef.current / 2;
        ctx.lineWidth = 2;
        ctx.beginPath();

        if (item.status === 0) {
          ctx.strokeStyle = "green";
          ctx.moveTo(cx - 6, markY);
          ctx.lineTo(cx - 1, markY + 5);
          ctx.lineTo(cx + 6, markY - 5);
        } else {
          ctx.strokeStyle = "red";
          ctx.moveTo(cx - 5, markY - 5);
          ctx.lineTo(cx + 5, markY + 5);
          ctx.moveTo(cx + 5, markY - 5);
          ctx.lineTo(cx - 5, markY + 5);
        }

        ctx.stroke();
      });

      TAP_RUN_TIMES.current.forEach((tapX) => {
        ctx.beginPath();
        ctx.arc(tapX, midY + 30, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#7a6e33";
        ctx.fill();
      });
      ctx.fillStyle = "#111";

      ctx.restore();

      // Cursor fijo
      const x = LEFT_PAD + 1 + translatedRef.current;
      const top = 10;
      const size = 7;
      const lineHeight = HEIGHT - 50;

      ctx.beginPath();
      ctx.moveTo(x, top);
      ctx.lineTo(x - 4, top + size);
      ctx.lineTo(x + 4, top + size);
      ctx.closePath();
      ctx.fillStyle = "#239c4f";
      ctx.fill();
      ctx.fillRect(x - 1, top + size, 2, lineHeight);
    };

    // ---------------------------------------------------------------------
    // Animación
    // ---------------------------------------------------------------------

    const animate = () => {
      const ctx = ctxCanvasRef.current;
      if (!ctx) return;

      const game = gameRef.current!;
      const score = game.score;
      const TIME_LINE = game.TIME_LINE;
      const TIME_LINE_NOTES = game.TIME_LINE_NOTES;
      const LENGTH_LINE = game.LENGTH_LINE;

      const timecurrent = getCtx().currentTime;

      const secondsPerBeat = 60 / BPM.current;
      const beatFloat = (timecurrent - startTimeRef.current) / secondsPerBeat;
      setBeat?.((Math.floor(beatFloat) % 4) + 1);

      const pending = TIME_LINE_NOTES[currentNoteIndex.current];
      if (
        pending &&
        timecurrent > startTimeRef.current + pending.time + pending.late
      ) {
        score[pending.index].status = 1;
        currentNoteIndex.current++;
      }

      if (timecurrent > startTimeRef.current + TIME_LINE[posIndex.current]) {
        scrollXBase.current = scrollX.current;
        timeBase.current = timecurrent;

        posIndex.current++;

        if (posIndex.current >= TIME_LINE.length) {
          scrollX.current = LENGTH_LINE[LENGTH_LINE.length - 1];

          cancelAnimationFrame(requestRef.current);
          draw(ctx, scrollX.current, viewWidth());
          metronomeRef.current?.stop();
          setShowReset(false);
          setShowDrag(true);

          if (onComplete) {
            const bag: ScoreItem[][] = [];
            let bag_aux: ScoreItem[] = [];

            let correct_notes = 0;
            let failed_notes = 0;

            for (const ele of score) {
              if (ele.kind === "note") {
                if (ele.status === 0) correct_notes++;
                if (ele.status === 1) failed_notes++;
              }

              if (ele.kind === "barline") {
                bag.push([...bag_aux]);
                bag_aux = [];
              } else if (ele.kind === "note") {
                bag_aux.push(ele);
              }
            }

            if (bag_aux.length > 0) bag.push(bag_aux);

            const measures_scores = bag.filter((group) => group.length > 0);

            let correct_measures = 0;
            let failed_measures = 0;

            for (const measure of measures_scores) {
              if (measure.every((item) => item.status === 0)) correct_measures++;
              else failed_measures++;
            }

            onComplete("end", {
              correct_notes,
              failed_notes,
              correct_measures,
              failed_measures,
            });
          }
          return;
        }

        speedRef.current =
          (LENGTH_LINE[posIndex.current] - scrollXBase.current) /
          (startTimeRef.current +
            TIME_LINE[posIndex.current] -
            timeBase.current);
      }

      scrollX.current =
        scrollXBase.current +
        speedRef.current * (timecurrent - timeBase.current);

      draw(ctx, scrollX.current, viewWidth());

      requestRef.current = requestAnimationFrame(animate);
    };

    useImperativeHandle(ref, () => ({
      handleStart: (isPlaying: boolean) => {
        if (!isPlaying) {
          if (!fontLoaded) {
            onComplete?.("reset", {});
            return;
          }

          if (notFirstTime.current) initGame();
          notFirstTime.current = true;

          const canvas = canvasRef.current;
          if (!canvas) return;

          ctxCanvasRef.current = canvas.getContext("2d");

          if (!metronomeRef.current) {
            metronomeRef.current = createMetronome(BPM.current);
          }

          speedRef.current = 0;
          startTimeRef.current = getCtx().currentTime + beforeStart.current;

          metronomeRef.current.start(startTimeRef.current);
          setShowReset(true);
          setShowDrag(false);

          requestAnimationFrame(animate);
        } else {
          const game = gameRef.current!;
          const note = game.TIME_LINE_NOTES[currentNoteIndex.current];
          const currentTapTime = getCtx().currentTime - startTimeRef.current;

          if (
            note &&
            currentTapTime >= note.time - note.early &&
            currentTapTime <= note.time + note.late
          ) {
            game.score[note.index].status = 0;
            currentNoteIndex.current++;
          }

          TAP_RUN_TIMES.current.push(scrollX.current + LEFT_PAD);
        }
      },
      handleBPMChange: (bpm: number) => {
        metronomeRef.current?.stop();
        metronomeRef.current = createMetronome(bpm);

        const game = gameRef.current!;
        const { TIME_LINE, TIME_LINE_NOTES } = computeTimeline(game.score, bpm);
        game.TIME_LINE = TIME_LINE;
        game.TIME_LINE_NOTES = TIME_LINE_NOTES;
      },
      handleMeasuresChange: () => {
        initGame();
        const ctx = ctxCanvasRef.current;
        if (ctx) draw(ctx, 0, viewWidth());
      },
    }));

    useEffect(() => {
      return () => {
        metronomeRef.current?.stop();
        cancelAnimationFrame(requestRef.current);
      };
    }, []);

    useEffect(() => {
      const font = new FontFace("Bravura", `url(${BRAVURA_URL})`);
      font.load().then((f) => {
        document.fonts.add(f);
        setFontLoaded(true);
      });
    }, []);

    useEffect(() => {
      if (!fontLoaded) return;

      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;
      const dpr = window.devicePixelRatio || 1;

      // Se guarda ya, no sólo al empezar a jugar: así cambiar de compases o de
      // tempo repinta la partitura aunque todavía no se haya pulsado nada.
      ctxCanvasRef.current = ctx;

      const resize = () => {
        const width = viewWidth();
        // Antes que nada: el cursor se recoloca para el ancho que hay ahora. Si
        // esto no se hace aqui, un cambio de tamano puede dejarlo fuera del
        // canvas y no se dibuja nada (ver `cursorOffsetFor`).
        translatedRef.current = cursorOffsetFor(width);
        canvas.width = width * dpr;
        canvas.height = HEIGHT * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${HEIGHT}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        draw(ctx, 0, width);
      };

      window.addEventListener("resize", resize);

      // Ahora el canvas se mide por su contenedor, y ese puede cambiar de ancho
      // sin que cambie el de la ventana: girar el movil, la barra del navegador
      // que se recoge, el teclado que sube. Con solo el `resize` de la ventana
      // el canvas se quedaba con el ancho viejo y volvia a recortarse.
      const frame = canvas.closest("[data-score-frame]") ?? canvas.parentElement;
      const observer =
        typeof ResizeObserver === "undefined"
          ? null
          : new ResizeObserver(() => resize());
      if (observer && frame) observer.observe(frame);

      resize();

      return () => {
        window.removeEventListener("resize", resize);
        observer?.disconnect();
        cancelAnimationFrame(requestRef.current);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fontLoaded]);

    const isDragging = useRef(false);
    const lastMouseX = useRef(0);

    useEffect(() => {
      if (!fontLoaded) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const updateByPointer = (clientX: number) => {
        const dx = clientX - lastMouseX.current;
        scrollX.current -= dx;
        lastMouseX.current = clientX;

        if (scrollX.current < 0) scrollX.current = 0;

        const ctx = canvas.getContext("2d");
        if (ctx) draw(ctx, scrollX.current, viewWidth());
      };

      const onPointerDown = (e: PointerEvent) => {
        isDragging.current = true;
        lastMouseX.current = e.clientX;
        canvas.style.cursor = 'url("/assets/grabi.cur"), grabbing';
      };

      const onPointerMove = (e: PointerEvent) => {
        if (!isDragging.current) return;
        updateByPointer(e.clientX);
      };

      const onPointerUp = () => {
        isDragging.current = false;
        canvas.style.cursor = "pointer";
      };

      canvas.addEventListener("pointerdown", onPointerDown);
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
      window.addEventListener("pointercancel", onPointerUp);

      return () => {
        canvas.removeEventListener("pointerdown", onPointerDown);
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
        window.removeEventListener("pointercancel", onPointerUp);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fontLoaded]);

    const [showDrag, setShowDrag] = useState(false);
    const [showReset, setShowReset] = useState(false);

    const handleReset = () => {
      initGame();
      notFirstTime.current = false;

      cancelAnimationFrame(requestRef.current);
      metronomeRef.current?.stop();
      startTimeRef.current = 0;

      onComplete?.("reset", {});
      setBeat?.(1);

      const ctx = ctxCanvasRef.current;
      if (ctx) draw(ctx, 0, viewWidth());

      setShowReset(false);
    };

    return (
      <div className="w-full min-w-0" style={{ background: "transparent" }}>
        {!fontLoaded ? null : (
          <div className="relative group w-full min-w-0">
            <canvas
              ref={canvasRef}
              className="cursor-pointer"
              style={{ touchAction: "none" }}
            />

            {showDrag && (
              <div className="absolute lg:-top-5 right-5 flex items-center justify-center pointer-events-none animate-pulse">
                <div className="bg-black/35 px-2 py-1 rounded-lg text-white text-xs backdrop-blur-sm">
                  Drag for review
                </div>
              </div>
            )}
            {showReset && (
              <div
                className="absolute -top-5 right-5 flex items-center justify-center cursor-pointer"
                onClick={handleReset}
              >
                <div className="bg-black/40 px-2 py-1 rounded-lg text-white text-xs backdrop-blur-sm hover:bg-black/60">
                  Reset
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  },
);

SimpleMovingScore.displayName = "SimpleMovingScore";
export default React.memo(SimpleMovingScore);
