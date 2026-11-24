import { NextResponse } from "next/server";

import { getCurrentProfile } from "@/lib/auth";
import { getNotifikasi } from "@/lib/data/notifikasi";

export async function GET() {
  const profile = await getCurrentProfile();

  if (!profile?.aktif) {
    return NextResponse.json(
      { error: "Tidak berwenang." },
      { status: 401 },
    );
  }

  const data = await getNotifikasi(profile.id);
  return NextResponse.json(data);
}
