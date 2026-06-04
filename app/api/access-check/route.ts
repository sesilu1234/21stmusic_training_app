import { auth } from "@/auth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { normalizeEmail } from "@/lib/studentAuthShared";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  const email = normalizeEmail(session?.user?.email);

  if (!email) {
    return NextResponse.json({ active: false }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("allowed_students")
    .select("email")
    .eq("email", email)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ active: false }, { status: 403 });
  }

  return NextResponse.json({ active: true });
}
