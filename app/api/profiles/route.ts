import { auth } from "@/auth";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const profilesFilePath = path.join(process.cwd(), "data", "student-profiles.json");

const readProfiles = async () => {
  try {
    return JSON.parse(await readFile(profilesFilePath, "utf8"));
  } catch {
    return {};
  }
};

const writeProfiles = async (profiles: Record<string, unknown>) => {
  await mkdir(path.dirname(profilesFilePath), { recursive: true });
  await writeFile(profilesFilePath, JSON.stringify(profiles, null, 2));
};

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ profiles: {} }, { status: 401 });
  }

  return Response.json({ profiles: await readProfiles() });
}

export async function POST(req: Request) {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  if (!email) {
    return Response.json({ ok: false }, { status: 401 });
  }

  const body = await req.json();
  const profile = body?.profile;
  if (!profile || profile.email?.toLowerCase() !== email) {
    return Response.json({ ok: false }, { status: 400 });
  }

  const profiles = await readProfiles();
  profiles[email] = profile;
  await writeProfiles(profiles);

  return Response.json({ ok: true });
}
