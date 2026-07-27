/**
 * Cliente do Mureka API — geração de música com letra.
 * Docs: https://platform.mureka.ai/docs/api/operations/post-v1-song-generate.html
 *
 * Env var necessária: MUREKA_API_KEY (na Vercel, server-side only).
 */

const MUREKA_BASE = "https://api.mureka.ai/v1";

type GenerateArgs = {
  lyrics: string;
  prompt: string;       // estilo/gênero — ex: "ambient meditation, female whispered vocal, rain, piano, 528hz, slow"
  model?: string;       // default "auto"
};

export type MurekaTask = {
  id: string;
  status: "preparing" | "queued" | "running" | "succeeded" | "failed" | "cancelled";
  created_at?: number;
  finished_at?: number;
  model?: string;
  trace_id?: string;
  failed_reason?: string;
  choices?: Array<{
    url?: string;         // link do mp3 final
    duration?: number;
    flac_url?: string;
    stream_url?: string;
    lyrics_sections?: unknown;
  }>;
};

function apiKey() {
  const k = process.env.MUREKA_API_KEY;
  if (!k) throw new Error("MUREKA_API_KEY não configurada no ambiente");
  return k;
}

export async function generateSong(args: GenerateArgs): Promise<MurekaTask> {
  const res = await fetch(`${MUREKA_BASE}/song/generate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      lyrics: args.lyrics,
      prompt: args.prompt,
      model: args.model ?? "auto",
    }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Mureka generate ${res.status}: ${text.slice(0, 500)}`);
  return JSON.parse(text) as MurekaTask;
}

export async function querySong(taskId: string): Promise<MurekaTask> {
  const res = await fetch(`${MUREKA_BASE}/song/query/${encodeURIComponent(taskId)}`, {
    headers: { Authorization: `Bearer ${apiKey()}` },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Mureka query ${res.status}: ${text.slice(0, 500)}`);
  return JSON.parse(text) as MurekaTask;
}

/** Monta a letra da "Música Angelical da Frequência da Riqueza" personalizada. */
export function letraFrequenciaRiqueza(nome: string) {
  const n = (nome || "").trim().split(" ")[0] || "Você";
  return `[Intro — soft rain and slow piano, no vocals]

[Verse — female voice, very slow, whispered, ASMR-like]
${n}...

A herança que te prendia...
hoje se desfaz.

${n}...

Sua mente é sua.
Sua vida é sua.

[Verse 2 — same voice, even softer]
A frequência da riqueza...
já vive em você.

${n}...

Respire.
Você chegou em casa.

[Outro — rain and piano fade out slowly]`;
}

/** Prompt de estilo padrão pra Mureka gerar no timbre certo. */
export const PROMPT_FREQUENCIA_RIQUEZA =
  "ambient meditation, soft rain sound effect, gentle piano pad, female voice very slow whispered spoken ASMR, healing, peaceful, 528hz feel, no drums, no percussion, sleep-friendly, Portuguese lyrics";
