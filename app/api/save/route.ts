export async function POST(req: Request) {
  const { timeline, taps } = await req.json();

  // console.log(
  //   timeline.map((t: number, i: number) => ({
  //     expected: t,
  //     actual: taps[i].time,
  //     diff: taps[i].time - t,
  //   })),
  // );

  console.log(
    taps.map((t: number, i: number) => ({
      actual: taps[i].time,
    })),
  );

  return Response.json({ ok: true });
}
