"use client";

import { useEffect, useRef, useState } from "react";

type StatusResp = {
  taskId?: string;
  status?: string;
  url?: string | null;
  duration?: number | null;
  failed_reason?: string | null;
  error?: string;
};

export default function TesteMusicaPage() {
  const [nome, setNome] = useState("Jeferson");
  const [taskId, setTaskId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");
  const [mp3, setMp3] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [tempo, setTempo] = useState(0);
  const startRef = useRef<number>(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const gerar = async () => {
    setErro(null);
    setMp3(null);
    setTaskId(null);
    setStatus("enviando…");
    setTempo(0);
    startRef.current = Date.now();
    try {
      const r = await fetch("/api/musica/gerar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome }),
      });
      const j: StatusResp = await r.json();
      if (!r.ok) {
        setErro(j.error || `erro ${r.status}`);
        setStatus("falhou");
        return;
      }
      setTaskId(j.taskId!);
      setStatus(j.status || "preparing");
      // inicia polling a cada 5s
      pollRef.current = setInterval(async () => {
        setTempo(Math.round((Date.now() - startRef.current) / 1000));
        try {
          const rr = await fetch(`/api/musica/status?id=${j.taskId}`);
          const jj: StatusResp = await rr.json();
          setStatus(jj.status || "");
          if (jj.url) {
            setMp3(jj.url);
            if (pollRef.current) clearInterval(pollRef.current);
          } else if (jj.status === "failed" || jj.status === "cancelled") {
            setErro(jj.failed_reason || jj.status);
            if (pollRef.current) clearInterval(pollRef.current);
          }
        } catch {
          /* ignora erro pontual de polling */
        }
      }, 5000);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "erro desconhecido");
      setStatus("falhou");
    }
  };

  return (
    <main className="mx-auto min-h-dvh max-w-md p-6 text-sm text-foreground">
      <h1 className="font-display text-2xl font-semibold">🎵 Teste — geração de música (Mureka)</h1>
      <p className="mt-1 text-xs text-muted-foreground">
        Rota debug. Não publicar. Dispara /api/musica/gerar + polling em /api/musica/status.
      </p>

      <label className="mt-6 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Nome
      </label>
      <input
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        className="mt-1 w-full rounded-xl border border-border bg-card px-4 py-3 text-base outline-none focus:border-navy/50"
      />

      <button
        onClick={gerar}
        disabled={status !== "" && !mp3 && !erro}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-navy-grad px-5 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-elevated disabled:opacity-60"
      >
        {status && !mp3 && !erro ? `Gerando… (${tempo}s)` : "Gerar música do " + (nome || "?")}
      </button>

      {taskId && (
        <div className="mt-6 rounded-2xl border border-border bg-secondary/40 p-4 text-[13px]">
          <p><strong>taskId:</strong> <code className="break-all">{taskId}</code></p>
          <p className="mt-1"><strong>status:</strong> {status} {tempo > 0 ? `· ${tempo}s` : ""}</p>
        </div>
      )}

      {erro && (
        <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-[13px] text-destructive">
          <p><strong>Erro:</strong> {erro}</p>
        </div>
      )}

      {mp3 && (
        <div className="mt-6 rounded-2xl border border-gold/40 bg-gold/10 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold">✅ Pronto!</p>
          <audio controls src={mp3} className="mt-3 w-full" />
          <a
            href={mp3}
            target="_blank"
            rel="noreferrer"
            download={`frequencia-${nome.toLowerCase()}.mp3`}
            className="mt-3 inline-block text-xs text-navy underline"
          >
            Abrir/baixar mp3
          </a>
          <p className="mt-2 break-all text-[11px] text-muted-foreground">{mp3}</p>
        </div>
      )}

      <p className="mt-8 text-[11px] text-muted-foreground/70">
        Custo: 1 música do teu pacote Mureka por geração.
      </p>
    </main>
  );
}
