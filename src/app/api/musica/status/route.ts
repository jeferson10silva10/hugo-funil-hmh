import { NextResponse } from "next/server";
import { querySong } from "@/lib/mureka";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });
    const task = await querySong(id);
    const first = task.choices?.[0];
    return NextResponse.json({
      taskId: task.id,
      status: task.status,
      url: first?.url ?? null,
      duration: first?.duration ?? null,
      failed_reason: task.failed_reason ?? null,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "erro desconhecido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
