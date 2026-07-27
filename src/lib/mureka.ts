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
      model: args.model ?? "mureka-6",
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

/** Monta a letra da "Música Angelical da Frequência da Riqueza" personalizada.
 *  Estilo: adoração/gospel suave, lenta, tom acolhedor (não ASMR sussurrado — evita ficar "assustador"). */
export function letraFrequenciaRiqueza(nome: string) {
  const n = (nome || "").trim().split(" ")[0] || "Você";
  return `[Spoken intro — soft prayerful female voice, warm and slow, like a blessing before a hymn]
${n}...
${n}, escuta.
Essa mensagem é sua.

[Verse — soft gospel worship voice, slow and gentle]
${n},
a herança que te prendia
hoje se desfaz.

Sua mente é sua,
sua vida é sua.

[Chorus — same voice, a little brighter and rising]
${n}, a frequência da riqueza
já vive em você.
Respire...
você chegou em casa.`;
}

/** Prompt de estilo padrão pra Mureka gerar no timbre certo.
 *  Trocamos ASMR sussurrado por adoração/gospel calmo (mais familiar pro publico 45+ do Hugo). */
export const PROMPT_FREQUENCIA_RIQUEZA =
  "gentle Brazilian gospel worship ballad, soft female vocal warm and prayerful, opens with a spoken/almost-recited prayer intro before singing begins, slow tempo 60 bpm, acoustic piano and light strings, soft rain ambience in the background, peaceful and healing, 528hz feel, no drums, no percussion, no beat, Portuguese lyrics, comforting like a prayer";
