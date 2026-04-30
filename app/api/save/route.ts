// export async function POST(req: Request) {
//   const { timeline, taps } = await req.json();

//   const diff = timeline.map((t: number, i: number) => t - taps[i]);

//   console.log(
//     timeline.map((t: number, i: number) => ({
//       expected: t,
//       actual: taps[i].time,
//       diff: taps[i].time - t,
//     })),
//   );
//   return Response.json({ ok: true });
// }

export async function POST(req: Request) {
  const { timeline, taps, dateTimeBase, startTimeRef } = await req.json();

  console.log(
    "dateTime Native: ",
    taps.map((t: number, i: number) => ({
      actual: (taps[i].dateTime - dateTimeBase) / 1000,
    })),
  );

  console.log(
    "audio engine ctx: ",
    taps.map((t: number, i: number) => ({
      actual: taps[i].time - startTimeRef + 0.5,
    })),
  );
  return Response.json({ ok: true });
}
