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
      // 'auto' = pega o modelo mais novo (V9 hoje). mureka-6 estava dando qualidade
      // de voz ruim. Se precisar forcar, pode passar 'mureka-o2' (music reasoning, melhor voz).
      model: args.model ?? "auto",
    }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Mureka generate ${res.status}: ${text.slice(0, 500)}`);
  return JSON.parse(text) as MurekaTask;
}

export async function getBilling(): Promise<Record<string, unknown>> {
  const res = await fetch(`${MUREKA_BASE}/account/billing`, {
    headers: { Authorization: `Bearer ${apiKey()}` },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Mureka billing ${res.status}: ${text.slice(0, 500)}`);
  return JSON.parse(text) as Record<string, unknown>;
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
  // IMPORTANTE: as tags [pt-BR] e "Brazilian Portuguese" nas anotacoes reforcam pro
  // Mureka nao cair em espanhol ou portugues europeu (comum quando o prompt e' em ingles).
  // Letra limpa: SEM meta-tags (o Mureka cantava as instrucoes tecnicas em pt/es/etc).
  // Sotaque/voz/estilo agora vao SO no prompt separado, nunca dentro da letra.
  return `[Spoken intro]
${n}...
respira fundo, e escuta.
Essa mensagem foi feita só pra você.
Tudo o que precisa acontecer,
começa agora.

[Verse]
${n},
a herança que te prendia
hoje se desfaz.

Sua mente é sua,
sua vida é sua,
seu caminho é seu.

[Bridge]
Solta o que já foi.
Recebe o que vem.

[Chorus]
${n}, a frequência da riqueza
já vive em você.
Respire...
chegou a sua vez.`;
}

/** Prompt de estilo padrão pra Mureka gerar no timbre certo.
 *  Trocamos ASMR sussurrado por adoração/gospel calmo (mais familiar pro publico 45+ do Hugo). */
export const PROMPT_FREQUENCIA_RIQUEZA =
  "Brazilian Portuguese male vocal (pt-BR), deep warm mature male voice, whispered/breathy ASMR-like, VERY SLOW tempo around 50 bpm. Solfeggio healing frequency music: 528Hz transformation frequency mixed with 396Hz release-fear frequency, deep sustained drone, Tibetan singing bowls, crystal bowls with long shimmering resonance, emotional swelling ambient pad, delicate piano notes floating, subtle warm string swells that rise and release, soft rain in the background. Meditation and inner-shift vibe, chills-inducing, emotional release, sense of transformation and rebirth, third-eye opening. No drums, no percussion, no beat. Peaceful, cinematic, healing, spiritual, sleep-friendly. Feels like a father's blessing and a spiritual awakening at the same time.";
