// metronome.ts
let audioCtx: AudioContext | null = null;

export const getCtx = () => {
  if (!audioCtx) {
    audioCtx = new (
      window.AudioContext || (window as any).webkitAudioContext
    )();
  }
  return audioCtx;
};

export function createMetronome(bpm: number) {
  let nextClickTime = 0;
  let schedulerTimer: number | null = null;

  const SCHEDULE_AHEAD = 0.1;
  const INTERVAL_MS = 25;

  // const SCHEDULE_AHEAD = 0.45;
  // const INTERVAL_MS = 400;

  const scheduleClick = (time: number) => {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.value = 800;

    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(0.5, time + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.06);

    osc.start(time);
    osc.stop(time + 0.07);
  };

  const scheduler = () => {
    const ctx = getCtx();
    const interval = 60 / bpm;

    if (nextClickTime < ctx.currentTime + SCHEDULE_AHEAD) {
      scheduleClick(nextClickTime);
      nextClickTime += interval;
    }
  };

  return {
    start(startAt?: number) {
      const ctx = getCtx();

      // Resume por si el contexto estaba suspendido
      if (ctx.state === "suspended") ctx.resume();

      if (schedulerTimer) return;

      nextClickTime = startAt ?? ctx.currentTime;
      schedulerTimer = window.setInterval(scheduler, INTERVAL_MS);
    },

    stop() {
      if (schedulerTimer) {
        clearInterval(schedulerTimer);
        schedulerTimer = null;
      }
    },
  };
}
