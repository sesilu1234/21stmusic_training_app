// app/api/save/route.ts
export async function POST(req: Request) {
  const { timeline, taps } = await req.json();

  console.log(timeline, taps);

  return Response.json({ ok: true });
}
