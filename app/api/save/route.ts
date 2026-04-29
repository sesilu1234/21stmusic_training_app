export async function POST(req: Request) {
  const { timeline, taps } = await req.json();

  const diff = timeline.map((t: number, i: number) => t - taps[i]);

  console.log(
    timeline.map((t: number, i: number) => ({
      expected: t,
      actual: taps[i].time,
      diff: taps[i].time - t,
    })),
  );
  return Response.json({ ok: true });
}
