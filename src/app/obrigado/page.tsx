"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  Download,
  Volume2,
  VolumeX,
  Sparkles,
  ShieldCheck,
  Music,
  Users,
  GraduationCap,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { track, trackMeta } from "@/lib/analytics";

const GRUPO_VIP_URL = "https://www.redirectmais.com/sun/gruposvip";
const HOTMART_PLATAFORMA_URL = "https://hotmart.com/pt-br/purchase";

/**
 * Página de obrigado — hierarquia:
 * 1. PASSO 1 (CRÍTICO): Grupo VIP — é onde acontece a Imersão
 * 2. PASSO 2: Cursos gravados na plataforma Hotmart
 * 3. PASSO 3: Bônus Música da Frequência da Riqueza
 *
 * Também dispara Meta Pixel Purchase com dedupe por transaction do Hotmart.
 */
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
  const transaction = (sp.get("transaction") || "").trim();
  const valorParam = Number(sp.get("valor") || "77");
  const valor = Number.isFinite(valorParam) && valorParam > 0 ? valorParam : 77;

  const musicaSrc = "/audio/diagnostico.mp3";

  useEffect(() => {
    track("obrigado_view", { tem_nome: nome.length > 0, tem_transaction: !!transaction });

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
    <main className="min-h-dvh w-full bg-background pb-16">
      <div className="mx-auto w-full max-w-xl px-4 pt-6 sm:pt-10">
        {/* Header — confirmação */}
        <section className="text-center">
          <Image
            src="/images/hms-logo-h.webp"
            alt="Heranças da Mentalidade do Sucesso"
            width={820}
            height={82}
            className="mx-auto h-auto w-full max-w-[220px] opacity-95"
          />
          <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700">
            <Sparkles className="h-3.5 w-3.5" /> Compra confirmada
          </p>
          <h1 className="font-display mt-3 text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
            {nome ? `Bem-vindo(a), ${nome}!` : "Bem-vindo(a) à Imersão HMH!"}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Sua vaga está garantida. Agora siga os 3 passos abaixo — nessa ordem.
          </p>
        </section>

        {/* PASSO 1 — GRUPO VIP (o mais importante) */}
        <section className="shadow-elevated mt-8 overflow-hidden rounded-3xl border-2 border-emerald-500/50 bg-emerald-500/5">
          <div className="bg-emerald-600 px-6 py-4 text-white">
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em]">
              <AlertTriangle className="h-4 w-4" /> Passo 1 · Faça isso AGORA
            </p>
          </div>

          <div className="px-6 py-6 sm:px-7">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600/15">
                <Users className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h2 className="font-display text-xl font-semibold leading-tight text-foreground sm:text-2xl">
                  Entre no Grupo VIP da Imersão
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  É onde a Imersão acontece. <strong className="text-foreground">Sem ele, você
                  perde o evento.</strong>
                </p>
              </div>
            </div>

            <ul className="mt-5 space-y-2 text-[13.5px] leading-relaxed text-foreground/85">
              <li className="flex gap-2">
                <span className="mt-0.5 text-emerald-600">✓</span>
                <span>Data e horário do evento AO VIVO</span>
              </li>
              <li className="flex gap-2">
                <span className="mt-0.5 text-emerald-600">✓</span>
                <span>Link direto de acesso à sala</span>
              </li>
              <li className="flex gap-2">
                <span className="mt-0.5 text-emerald-600">✓</span>
                <span>Instruções de última hora e avisos</span>
              </li>
              <li className="flex gap-2">
                <span className="mt-0.5 text-emerald-600">✓</span>
                <span>Suporte direto antes, durante e depois</span>
              </li>
            </ul>

            <a
              href={GRUPO_VIP_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                track("obrigado_grupo_vip_click", { nome, tem_transaction: !!transaction })
              }
              className="hm-pulse mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 text-center text-base font-bold uppercase tracking-wide text-white shadow-elevated hover:bg-emerald-700 active:scale-[.99]"
            >
              → Entrar no Grupo VIP agora
              <ExternalLink className="h-4 w-4" />
            </a>

            <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-red-600">
              <AlertTriangle className="h-3.5 w-3.5" />
              Sem o grupo, você não recebe o link do evento
            </p>
          </div>
        </section>

        {/* PASSO 2 — CURSOS GRAVADOS */}
        <section className="shadow-elevated ring-hairline mt-6 overflow-hidden rounded-3xl bg-card">
          <div className="bg-navy px-6 py-4 text-white">
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-gold">
              <GraduationCap className="h-4 w-4" /> Passo 2 · Enquanto o evento não começa
            </p>
          </div>

          <div className="px-6 py-6 sm:px-7">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gold/15">
                <GraduationCap className="h-6 w-6 text-gold" />
              </div>
              <div>
                <h2 className="font-display text-xl font-semibold leading-tight text-foreground sm:text-2xl">
                  Cursos gravados na plataforma
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  Você tem <strong className="text-foreground">acesso vitalício</strong> a todo
                  o material gravado do Hugo — pra começar a mudar de mentalidade{" "}
                  <strong className="text-foreground">hoje mesmo</strong>, sem esperar o evento.
                </p>
              </div>
            </div>

            <ul className="mt-5 space-y-2 text-[13.5px] leading-relaxed text-foreground/85">
              <li className="flex gap-2">
                <span className="mt-0.5 text-gold">◆</span>
                <span>
                  <strong>Método Heranças da Mentalidade do Sucesso</strong> — o curso base
                  completo
                </span>
              </li>
              <li className="flex gap-2">
                <span className="mt-0.5 text-gold">◆</span>
                <span>Material de apoio e exercícios práticos</span>
              </li>
              <li className="flex gap-2">
                <span className="mt-0.5 text-gold">◆</span>
                <span>Aulas bônus liberadas ao longo do tempo</span>
              </li>
            </ul>

            <a
              href={HOTMART_PLATAFORMA_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track("obrigado_plataforma_click", { nome })}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-navy px-6 py-3.5 text-center text-sm font-bold uppercase tracking-wide text-white ring-1 ring-gold/40 hover:bg-navy/90 active:scale-[.99]"
            >
              Acessar meus cursos na plataforma
              <ExternalLink className="h-4 w-4" />
            </a>

            <p className="mt-3 text-center text-[11px] text-muted-foreground">
              Login: use o mesmo e-mail da compra. Se não recebeu o acesso ainda,
              chegará em até 15 minutos.
            </p>
          </div>
        </section>

        {/* PASSO 3 — MÚSICA BÔNUS */}
        <section className="shadow-elevated ring-hairline mt-6 overflow-hidden rounded-3xl bg-card">
          <div className="bg-navy-grad px-6 py-4 text-center text-white">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold">
              🎁 Passo 3 · Bônus exclusivo
            </p>
            <h2 className="font-display mt-1 text-xl font-semibold leading-tight sm:text-2xl">
              Sua Música da{" "}
              <span className="text-gold-foil">Frequência da Riqueza</span>
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-white/85">
              Criada {nome ? `pra você, ${nome}` : "pra você"}, em frequência 528Hz — a
              frequência da abundância. Ouça toda manhã por 21 dias.
            </p>
          </div>

          <div className="px-6 py-6 sm:px-7">
            <MusicPlayer src={musicaSrc} nome={nome} />

            <div className="mt-5 rounded-2xl border border-gold/30 bg-gold/5 p-4">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-gold">
                <Music className="h-3.5 w-3.5" /> Como usar
              </p>
              <ul className="mt-2 space-y-1.5 text-[13px] leading-relaxed text-foreground/85">
                <li>· Ouça pela manhã, logo ao acordar</li>
                <li>· Fone de ouvido intensifica o efeito</li>
                <li>· 21 dias seguidos = ciclo de reprogramação</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Rodapé — garantia */}
        <section className="mt-8 text-center">
          <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" />
            Garantia de 30 dias · Hotmart
          </p>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Precisa de ajuda? Escreva pra suporte pelo grupo VIP.
          </p>
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
      audioEl
        .play()
        .then(() => {
          setPlaying(true);
          track("obrigado_musica_play", { nome });
        })
        .catch(() => {});
    } else {
      audioEl.pause();
      setPlaying(false);
    }
  };

  return (
    <div className="hm-glow overflow-hidden rounded-3xl border-2 border-gold/40 bg-navy-grad p-5 text-white">
      <audio ref={setAudioEl} src={src} preload="metadata" />
      <div className="flex items-center gap-4">
        <button
          onClick={toggle}
          aria-label={playing ? "Pausar" : "Tocar"}
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gold text-navy shadow-elevated transition hover:scale-105 active:scale-95"
        >
          {playing ? (
            <VolumeX className="h-6 w-6" />
          ) : (
            <Volume2 className="h-6 w-6 translate-x-0.5" />
          )}
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gold/90">
            🎵 Sua música
          </p>
          <p className="mt-0.5 font-display text-base font-semibold leading-tight text-white">
            {nome ? `Frequência de ${nome}` : "Frequência da Riqueza"}
          </p>
          <p className="mt-0.5 text-xs text-white/70">528Hz · Instrumental · Loop</p>
        </div>
      </div>

      <a
        href={src}
        download={
          nome ? `frequencia-${nome.toLowerCase()}.mp3` : "frequencia-da-riqueza.mp3"
        }
        onClick={() => track("obrigado_musica_download", { nome })}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-white/12 px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-white ring-1 ring-white/20 transition hover:bg-white/20"
      >
        <Download className="h-4 w-4" /> Baixar minha música
      </a>
    </div>
  );
}
