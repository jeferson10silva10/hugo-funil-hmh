"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import confetti from "canvas-confetti";
import {
  Award,
  ArrowRight,
  Gift,
  Lock,
  Check,
  CheckCircle2,
  X,
  Sparkles,
  ShieldCheck,
  Medal,
  Crown,
  Clock,
} from "lucide-react";
import { PANDA_VSL_SRC, CHECKOUT_IMERSAO } from "@/data/quiz";
import { track, trackMeta } from "@/lib/analytics";

/* ⌛ Liberação por tempo (em segundos) — a página abre com presentes/oferta bloqueados */
const T_GIFT_1 = 60;        // 1 min → libera Presente 1 + confete pequeno
const T_OFFER  = 60 * 7;    // 7 min → libera Presente 2 + toda a oferta + confete grande

/* Confete dourado (paleta do funil) */
function fireConfetti(intensity: "small" | "big" = "small") {
  const colors = ["#d9a94a", "#bd8728", "#9a6c1e", "#faf6ec"];
  const count = intensity === "big" ? 220 : 90;
  const defaults = { origin: { y: 0.35 }, colors };
  confetti({ ...defaults, particleCount: Math.round(count * 0.55), spread: 70, startVelocity: 45 });
  confetti({ ...defaults, particleCount: Math.round(count * 0.35), spread: 100, startVelocity: 55, scalar: 0.9 });
  if (intensity === "big") {
    setTimeout(() => confetti({ ...defaults, particleCount: 120, spread: 130, startVelocity: 60, origin: { y: 0.2 } }), 220);
    setTimeout(() => confetti({ ...defaults, particleCount: 80, spread: 160, startVelocity: 40, origin: { x: 0.2, y: 0.4 } }), 420);
    setTimeout(() => confetti({ ...defaults, particleCount: 80, spread: 160, startVelocity: 40, origin: { x: 0.8, y: 0.4 } }), 520);
  }
}

/* CTA verde da oferta */
function GreenCTA({ children, position }: { children: React.ReactNode; position: string }) {
  const handleClick = () => {
    track("funnel_offer_cta_click", { position });
    trackMeta("InitiateCheckout", { content_name: "Imersão HMH", value: 197, currency: "BRL", position });
  };
  return (
    <a
      href={CHECKOUT_IMERSAO}
      onClick={handleClick}
      className="hm-shine group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-[#25a06a] to-[#1a7d4e] px-7 py-4 text-base font-semibold uppercase tracking-wide text-white shadow-elevated transition-transform duration-200 hover:brightness-110 active:scale-[0.985]"
    >
      {children}
      <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
    </a>
  );
}

/* Countdown REAL até a Imersão (15/08/2026 09:30, horário de Brasília) */
const IMERSAO_TARGET = new Date("2026-08-15T09:30:00-03:00").getTime();

function Countdown() {
  const [secs, setSecs] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setSecs(Math.max(0, Math.floor((IMERSAO_TARGET - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const total = secs ?? 0;
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  const units: [string, number][] = [
    ["DIAS", d],
    ["HORAS", h],
    ["MIN", m],
    ["SEG", s],
  ];

  return (
    <div className="hm-glow bg-navy-grad mt-6 overflow-hidden rounded-3xl border border-gold/40 px-5 py-6 text-center text-white">
      <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-gold">
        <Clock className="h-4 w-4" /> Tempo Restante
      </p>
      <p className="font-display mt-2 text-2xl font-semibold">A Imersão começa em:</p>
      <div className="mt-4 flex items-stretch justify-center gap-1.5">
        {units.map(([label, value], i) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="flex min-w-[62px] flex-col rounded-2xl border border-white/15 bg-white/8 px-2 py-2.5 shadow-inner">
              <span className="text-3xl font-bold tabular-nums text-gold">{pad(value)}</span>
              <span className="mt-0.5 text-[10px] font-semibold tracking-[0.12em] text-white/55">
                {label}
              </span>
            </div>
            {i < units.length - 1 && <span className="text-2xl font-bold text-gold/70">:</span>}
          </div>
        ))}
      </div>
      <p className="mt-4 text-[15px] font-medium leading-relaxed text-white/90">
        Sábado 15/08 · 9h30 às 17h30 &nbsp;+&nbsp; Domingo 16/08 · 15h às 18h
      </p>
    </div>
  );
}

const GIFTS = [
  { title: "Bônus 1: Protocolo Katsu — Resultado em 5 Dias", value: "R$297" },
  { title: "Bônus 2: Curso Heranças da Mentalidade — Acesso Vitalício", value: "R$397" },
  { title: "Bônus 3: Mapeamento da Mente — Sessão individual de 30 min", value: "R$597" },
];

const LOTE1_ITEMS = [
  { bold: "Imersão HMH — AO VIVO com Hugo", rest: " · 15 e 16 de agosto" },
  { bold: "Bônus 1:", rest: " Protocolo Katsu — resultado em 5 dias (gravado, acesso vitalício)" },
  { bold: "Bônus 2:", rest: " Curso Heranças da Mentalidade — gravado, acesso vitalício (rever quantas vezes quiser)" },
  { bold: "Bônus 3:", rest: " Sua Música da Frequência da Riqueza (personalizada com seu nome, 528Hz)" },
  { bold: "Bônus 4:", rest: " Mapeamento da Mente — sessão individual de 30 min com um Estrategista da Mente treinado pelo Hugo (apenas 10 vagas)" },
  { bold: "", rest: "Grupo VIP no WhatsApp" },
];

const LOTE2_ITEMS = [
  "Mesmas 2 sessões ao vivo",
  "Mesmo treinamento incluso",
  "Bônus podem não estar disponíveis",
];

const COMPARISON: [string, string][] = [
  ["Só conhecimento — a Herança continua mais forte", "Remove a Herança na raiz, ao vivo"],
  ["Você aplica sozinho (e trava)", "O Hugo te guia pessoalmente"],
  ["Genérico, igual pra todo mundo", "Identifica a SUA programação específica"],
  ["O resultado nunca vem", "30 dias = mais que um ano inteiro"],
];

export function Vsl() {
  const [gift1, setGift1] = useState(false);
  const [offerOpen, setOfferOpen] = useState(false);
  const firedRef = useRef({ g1: false, off: false });

  useEffect(() => {
    track("funnel_vsl_view");
    trackMeta("ViewContent", { content_name: "VSL Heranças Mentais Herdadas" });
    const t1 = setTimeout(() => {
      setGift1(true);
      if (!firedRef.current.g1) {
        firedRef.current.g1 = true;
        fireConfetti("small");
        track("funnel_vsl_gift1_unlock", { at_seconds: T_GIFT_1 });
      }
    }, T_GIFT_1 * 1000);
    const t2 = setTimeout(() => {
      setOfferOpen(true);
      if (!firedRef.current.off) {
        firedRef.current.off = true;
        fireConfetti("big");
        track("funnel_vsl_offer_unlock", { at_seconds: T_OFFER });
      }
    }, T_OFFER * 1000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <section className="shadow-elevated ring-hairline rounded-3xl bg-card p-6">
      {/* Header — logo HMS (autoridade) */}
      <div className="flex flex-col items-center">
        <Image
          src="/images/hms-logo-h.webp"
          alt="Heranças da Mentalidade do Sucesso"
          width={820}
          height={82}
          className="h-auto w-full max-w-[340px]"
          priority
        />
        <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-gold">
          <Award className="h-3.5 w-3.5" /> Método Oriental · Premiado ONU
        </p>
      </div>

      {/* Vídeo — largura total, extravasa o padding do card pra máxima área */}
      <div className="bg-gold-foil relative -mx-6 mt-5 border-y-2 border-gold shadow-gold sm:-mx-6 sm:mt-6 sm:rounded-2xl sm:border-y-0 sm:p-[2px]">
        <div className="relative aspect-video w-full overflow-hidden bg-black sm:rounded-[calc(1rem-2px)]">
          <iframe
            src={PANDA_VSL_SRC}
            title="Método Oriental"
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full border-0"
          />
        </div>
      </div>

      {/* Presentes — liberação por tempo com confete */}
      <div className="mt-6 rounded-3xl border border-gold/30 bg-gold/5 p-4">
        <p className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Gift className="h-5 w-5 text-gold" /> Presentes que você ganha assistindo
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Continue assistindo — os <strong className="text-foreground">2 presentes</strong> serão liberados ao vivo pra você.
        </p>
        <div className="mt-3 space-y-3">
          {GIFTS.map((g, i) => {
            // Bonus 1 e 2 liberam no primeiro gatilho; Bonus 3 (musica) libera com a oferta
            const unlocked = i < 2 ? gift1 : offerOpen;
            if (unlocked) {
              return (
                <div
                  key={g.title}
                  className="hm-fade-up flex gap-3 rounded-2xl border border-gold/25 bg-cream p-4 shadow-card"
                >
                  <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-[#1d8755]" />
                  <div>
                    <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-gold">
                      <Gift className="h-3.5 w-3.5" /> Presente Liberado
                    </p>
                    <p className="mt-1 font-semibold leading-snug text-foreground">{g.title}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      Valor {g.value} — É seu de graça
                    </p>
                  </div>
                </div>
              );
            }
            return (
              <div
                key={g.title}
                className="flex gap-3 rounded-2xl border border-dashed border-muted-foreground/25 bg-secondary/40 p-4"
              >
                <Lock className="mt-0.5 h-6 w-6 shrink-0 text-muted-foreground/70" />
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                    Presente {i + 1}: bloqueado
                  </p>
                  <p className="mt-1 font-semibold leading-snug text-muted-foreground">
                    Continue assistindo para revelar…
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {offerOpen && (
      <>
      {/* Antes & Depois */}
      <div className="hm-fade-up mt-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
          Antes &amp; Depois
        </p>
        <h2 className="font-display mt-1 text-[1.7rem] font-semibold leading-tight tracking-tight text-foreground">
          Sua Transformação — Mente Aprisionada
        </h2>
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-card p-5 shadow-card">
        <p className="flex items-center gap-3 text-xl font-semibold text-foreground">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <X className="h-5 w-5" strokeWidth={2.5} />
          </span>
          Antes
        </p>
        <p className="mt-3 text-[15px] leading-relaxed text-foreground/85">
          Travado. Repetindo os mesmos anos. Vendo sua vida virar uma cópia carbono.
        </p>
      </div>

      <div className="mt-3 rounded-2xl border border-[#1d8755]/30 bg-[#1d8755]/6 p-5 shadow-card">
        <p className="flex items-center gap-3 text-xl font-semibold text-[#1a7d4e]">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1d8755]/15 text-[#1d8755]">
            <Check className="h-5 w-5" strokeWidth={2.5} />
          </span>
          Depois
        </p>
        <p className="mt-3 text-[15px] leading-relaxed text-foreground/85">
          Livre da Herança que te aprisionava. Executando. Vendo resultados que pareciam
          impossíveis.
        </p>
      </div>

      <div className="mt-3 flex gap-3 rounded-2xl bg-cream p-5">
        <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
        <div>
          <p className="font-semibold text-foreground">Esta é a transformação que te espera</p>
          <p className="mt-1 text-[15px] leading-relaxed text-muted-foreground">
            Quando a Herança Mental Herdada é removida, sua vida volta ao ritmo que era pra ter
            sido desde o começo.
          </p>
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
          A Oferta Completa
        </p>
        <h2 className="font-display mt-1 text-[1.7rem] font-semibold leading-tight tracking-tight text-foreground">
          Acesso à Imersão + 4 Bônus Exclusivos que valem <span className="text-gold-foil">R$ 1.985</span>
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-[15px] text-muted-foreground">
          A Imersão é o <strong className="text-foreground">workshop online ao vivo</strong> que o
          Hugo mostrou no vídeo — com ele te ajudando pessoalmente a remover a sua Herança —
          mais o <strong className="text-foreground">curso gravado</strong>, a
          <strong className="text-foreground"> sua música personalizada</strong> e uma
          <strong className="text-foreground"> sessão individual de Mapeamento da Mente</strong>.
        </p>
      </div>

      {/* Tabela comparativa */}
      <div className="ring-hairline mt-6 overflow-hidden rounded-2xl">
        <div className="grid grid-cols-2 text-sm">
          <div className="bg-secondary p-3 text-center font-semibold text-muted-foreground">
            Livros e cursos que você já tentou
          </div>
          <div className="bg-navy-grad p-3 text-center font-semibold text-white">A Imersão</div>
          {COMPARISON.map(([left, right], i) => (
            <div key={i} className="contents">
              <div className="flex gap-2 border-t border-border p-3 text-muted-foreground">
                <X className="mt-0.5 h-4 w-4 shrink-0 text-destructive" strokeWidth={2.5} />
                <span>{left}</span>
              </div>
              <div className="flex gap-2 border-t border-border bg-[#1d8755]/5 p-3 text-foreground">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#1d8755]" strokeWidth={2.5} />
                <span>{right}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Countdown />

      {/* 1º Lote — card premium escuro */}
      <div className="hm-glow hm-fade-up bg-gold-foil mt-6 rounded-3xl p-[2px]">
        <div className="bg-navy-grad relative overflow-hidden rounded-[calc(1.85rem-2px)] px-6 pb-6 pt-6 text-center text-white">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-gold">
              <Medal className="h-3.5 w-3.5" /> 1º Lote
            </span>
            <span className="hm-pulse inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-gold">
              <Crown className="h-3.5 w-3.5" /> Melhor custo-benefício
            </span>
          </div>

          <p className="hm-shine text-gold-foil font-display mt-3 inline-block text-6xl font-bold leading-none">
            R$ 197
          </p>
          <p className="mt-1 text-sm text-white/70">
            ou <strong className="text-white">12x R$ 19,70</strong>
          </p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-gold">
            15 e 16 de agosto · Apenas 10 vagas
          </p>

          <ul className="mt-5 space-y-3 text-left">
            {LOTE1_ITEMS.map((item, i) => (
              <li key={i} className="flex gap-3 text-[15px] leading-snug text-white/85">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#3ecf8e]" strokeWidth={2.5} />
                <span>
                  {item.bold && <strong className="text-white">{item.bold}</strong>}
                  {item.rest}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-6">
            <GreenCTA position="lote1">Quero minha vaga agora</GreenCTA>
          </div>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-sm text-white/60">
            <Lock className="h-3.5 w-3.5" /> Pagamento 100% seguro via Hotmart
          </p>
        </div>
      </div>

      {/* 2º Lote */}
      <div className="mt-5 rounded-3xl border border-border bg-secondary/50 p-6 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted-foreground/60 px-4 py-1.5 text-sm font-bold text-white">
          <Medal className="h-4 w-4" /> 2º LOTE
        </span>
        <p className="font-display mt-3 text-5xl font-bold text-muted-foreground">R$ 397</p>
        <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Valor Normal — Em Breve
        </p>

        <ul className="mt-5 space-y-3 text-left">
          {LOTE2_ITEMS.map((item) => (
            <li key={item} className="flex gap-3 text-[15px] leading-snug text-muted-foreground">
              <Check className="mt-0.5 h-5 w-5 shrink-0 opacity-60" strokeWidth={2.5} />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <button
          disabled
          className="mt-6 block w-full cursor-not-allowed rounded-2xl bg-muted-foreground/20 px-7 py-4 text-base font-semibold uppercase tracking-wide text-muted-foreground"
        >
          Aguardar próximo lote
        </button>
      </div>

      {/* Garantia */}
      <div className="mt-6 flex flex-col items-center rounded-3xl border border-border bg-card p-6 text-center shadow-card">
        <Image
          src="/images/garantia-30dias.webp"
          alt="Selo Garantia 30 dias"
          width={112}
          height={112}
          className="h-24 w-24"
          loading="lazy"
        />
        <p className="font-display mt-3 flex items-center gap-2 text-xl font-semibold text-foreground">
          <ShieldCheck className="h-5 w-5 text-[#1d8755]" /> Garantia de 30 dias
        </p>
        <p className="mt-1 text-[15px] leading-relaxed text-muted-foreground">
          Executou e não deu certo? Devolveremos o seu dinheiro sem perguntas.
        </p>
      </div>

      {/* Future-pacing */}
      <div className="mt-6 flex gap-3 rounded-3xl bg-cream p-5">
        <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
        <p className="text-[15px] leading-relaxed text-foreground/85">
          Imagine acordar amanhã <strong className="text-foreground">focado, com energia</strong>,
          executando o seu projeto sem aquele peso — e vendo o resultado que parecia impossível
          finalmente aparecer. É isso que acontece quando a Herança sai do caminho.
        </p>
      </div>

      {/* CTA final */}
      <div className="mt-6 text-center">
        <h2 className="font-display text-2xl font-semibold text-foreground">
          Não deixe 2026 ser igual a 2025
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-[15px] leading-relaxed text-muted-foreground">
          Você tem até a abertura do 2º lote para garantir sua vaga com o valor especial. Depois
          disso, o investimento sobe.
        </p>
        <div className="mt-4">
          <GreenCTA position="final">Quero minha vaga agora</GreenCTA>
        </div>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
          <Lock className="h-3.5 w-3.5" /> Pagamento 100% seguro via Hotmart · Garantia de 30 dias
        </p>
      </div>
      </>
      )}
    </section>
  );
}
