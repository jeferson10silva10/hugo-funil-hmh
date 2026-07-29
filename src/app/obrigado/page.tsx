"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Download, Volume2, VolumeX, Sparkles, ShieldCheck, Music } from "lucide-react";
import { track, trackMeta } from "@/lib/analytics";

/** Página de obrigado — bônus "Música Angelical da Frequência da Riqueza"
 *  V1 (teste): usa a trilha genérica em /audio/diagnostico.mp3 como placeholder.
 *  V2: chamada Mureka via webhook do Hotmart (nome do comprador no querystring ?nome=...). */
export default function ObrigadoPage() {
  return (
    <Suspense fallback={null}>
      <ObrigadoInner />
    </Suspense>
  );
}

function ObrigadoInner() {
  const sp = useSearchParams();
  const nomeParam = (sp.get("nome") || "").trim();
  const nome = nomeParam ? nomeParam.split(" ")[0] : "";
  // Hotmart anexa esses params na URL de retorno automaticamente:
  //   ?transaction=HP123... &prod=... &off=z8ho36x1
  const transaction = (sp.get("transaction") || "").trim();
  const valorParam = Number(sp.get("valor") || "77");
  const valor = Number.isFinite(valorParam) && valorParam > 0 ? valorParam : 77;

  // placeholder — quando o Mureka estiver plugado, esse src vira o link do mp3 gerado
  const musicaSrc = "/audio/diagnostico.mp3";

  useEffect(() => {
    track("obrigado_view", { tem_nome: nome.length > 0, tem_transaction: !!transaction });

    // Purchase — dispara UMA VEZ por transaction (dedupe via localStorage).
    // eventID casa com CAPI server-side (Meta deduplica automaticamente).
    if (typeof window === "undefined") return;
    const key = `hmh_purchase_fired_${transaction || "notrans"}`;
    const alreadyFired = transaction && window.localStorage.getItem(key) === "1";
    if (alreadyFired) return;

    trackMeta("Purchase", {
      value: valor,
      currency: "BRL",
      content_ids: ["hmh-imersao-77"],
      content_name: "Imersão HMH",
      content_type: "product",
      eventID: transaction || undefined,
    });

    if (transaction) window.localStorage.setItem(key, "1");
  }, [nome, transaction, valor]);

  return (
    <main className="flex min-h-dvh w-full items-start justify-center bg-background px-4 py-8 sm:items-center">
      <div className="w-full max-w-md">
        <section className="shadow-elevated ring-hairline overflow-hidden rounded-3xl bg-card">
          {/* Header */}
          <div className="bg-navy-grad px-7 py-6 text-center">
            <Image
              src="/images/hms-logo-h.webp"
              alt="Heranças da Mentalidade do Sucesso"
              width={820}
              height={82}
              className="mx-auto h-auto w-full max-w-[220px] opacity-95"
            />
            <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
              <Sparkles className="h-3.5 w-3.5" /> Compra confirmada
            </p>
            <h1 className="font-display mt-2 text-2xl font-semibold leading-tight text-white">
              {nome ? `Bem-vindo(a), ${nome}!` : "Bem-vindo(a)!"}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-white/85">
              Sua vaga na Imersão HMH está garantida.
            </p>
          </div>

          {/* Bônus — a música */}
          <div className="px-7 py-7">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gold">
              🎁 Seu bônus exclusivo
            </p>
            <h2 className="font-display mt-1 text-[1.6rem] font-semibold leading-tight text-foreground">
              Sua Música Angelical da{" "}
              <span className="text-gold-foil">Frequência da Riqueza</span>
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
              Uma música criada exclusivamente {nome ? `para você, ${nome}` : "para você"}, em
              frequência 528Hz — a frequência da abundância. Ouça toda manhã por 21 dias e
              observe o que acontece.
            </p>

            <MusicPlayer src={musicaSrc} nome={nome} />

            <div className="mt-6 rounded-2xl border border-gold/30 bg-gold/8 p-4">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-gold">
                <Music className="h-3.5 w-3.5" /> Como usar
              </p>
              <ul className="mt-2 space-y-1.5 text-[14px] leading-relaxed text-foreground/85">
                <li>· Ouça pela manhã, logo ao acordar</li>
                <li>· Fone de ouvido intensifica o efeito da frequência</li>
                <li>· 21 dias seguidos é o ciclo de reprogramação</li>
              </ul>
            </div>
          </div>

          {/* Próximos passos */}
          <div className="border-t border-border px-7 py-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Próximos passos
            </p>
            <ol className="mt-3 space-y-3 text-[14px] leading-relaxed text-foreground/90">
              <li className="flex gap-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-navy text-[11px] font-bold text-white">
                  1
                </span>
                <span>
                  <strong>Acesse seu email</strong> — enviamos os detalhes de acesso da Imersão
                </span>
              </li>
              <li className="flex gap-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-navy text-[11px] font-bold text-white">
                  2
                </span>
                <span>
                  <strong>Baixe sua música</strong> acima e adicione ao seu app favorito
                </span>
              </li>
              <li className="flex gap-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-navy text-[11px] font-bold text-white">
                  3
                </span>
                <span>
                  <strong>Prepare-se</strong> — nos vemos na Imersão em breve
                </span>
              </li>
            </ol>

            <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5" /> Garantia de 30 dias · Hotmart
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

/* ---------------- Player de música ---------------- */
function MusicPlayer({ src, nome }: { src: string; nome: string }) {
  const [playing, setPlaying] = useState(false);
  const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null);

  const toggle = () => {
    if (!audioEl) return;
    if (audioEl.paused) {
      audioEl.play().then(() => {
        setPlaying(true);
        track("obrigado_musica_play", { nome });
      }).catch(() => {});
    } else {
      audioEl.pause();
      setPlaying(false);
    }
  };

  return (
    <div className="hm-glow mt-5 overflow-hidden rounded-3xl border-2 border-gold/40 bg-navy-grad p-6 text-white">
      <audio ref={setAudioEl} src={src} preload="metadata" />
      <div className="flex items-center gap-4">
        <button
          onClick={toggle}
          aria-label={playing ? "Pausar" : "Tocar"}
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gold text-navy shadow-elevated transition hover:scale-105 active:scale-95"
        >
          {playing ? <VolumeX className="h-7 w-7" /> : <Volume2 className="h-7 w-7 translate-x-0.5" />}
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gold/90">
            🎵 Sua música
          </p>
          <p className="mt-1 font-display text-lg font-semibold leading-tight text-white">
            {nome ? `Frequência de ${nome}` : "Frequência da Riqueza"}
          </p>
          <p className="mt-0.5 text-xs text-white/70">528Hz · Instrumental · Loop</p>
        </div>
      </div>

      <a
        href={src}
        download={nome ? `frequencia-${nome.toLowerCase()}.mp3` : "frequencia-da-riqueza.mp3"}
        onClick={() => track("obrigado_musica_download", { nome })}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-white/12 px-5 py-3 text-sm font-semibold uppercase tracking-wide text-white ring-1 ring-white/20 transition hover:bg-white/20"
      >
        <Download className="h-4 w-4" /> Baixar minha música
      </a>
    </div>
  );
}
