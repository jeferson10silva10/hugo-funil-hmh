import { NextResponse } from "next/server";
import { generateSong, letraFrequenciaRiqueza, PROMPT_FREQUENCIA_RIQUEZA } from "@/lib/mureka";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as { nome?: string };
    const nome = (body.nome ?? "").trim();
    if (nome.length < 2) {
      return NextResponse.json({ error: "nome obrigatório (>=2 caracteres)" }, { status: 400 });
    }
    const task = await generateSong({
      lyrics: letraFrequenciaRiqueza(nome),
      prompt: PROMPT_FREQUENCIA_RIQUEZA,
    });
    return NextResponse.json({ taskId: task.id, status: task.status, nome });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "erro desconhecido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
