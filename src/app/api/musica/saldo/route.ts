import { NextResponse } from "next/server";
import { getBilling } from "@/lib/mureka";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const raw = await getBilling();
    return NextResponse.json(raw);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "erro desconhecido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
