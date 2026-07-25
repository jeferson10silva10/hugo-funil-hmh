"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
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

/* CTA verde da oferta */
function GreenCTA({ children }: { children: React.ReactNode }) {
  return (
    <a
      href={CHECKOUT_IMERSAO}
      className="hm-shine group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-[#25a06a] to-[#1a7d4e] px-7 py-4 text-base font-semibold uppercase tracking-wide text-white shadow-elevated transition-transform duration-200 hover:brightness-110 active:scale-[0.985]"
    >
      {children}
      <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
    </a>
  );
}

/* Countdown REAL até a Imersão (01/08/2026 09:30, horário de Brasília) */
const IMERSAO_TARGET = new Date("2026-08-01T09:30:00-03:00").getTime();

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
        Sábado 01/08 · 9h30 às 17h30 &nbsp;+&nbsp; Domingo 02/08 · 15h às 18h
      </p>
    </div>
  );
}

const GIFTS = [
  { title: "Bônus 1: Treinamento Heranças da Mentalidade de Sucesso", value: "R$497" },
  { title: "Bônus 2: Katsu Desafio — Resultado em 5 Dias", value: "R$197" },
];

const LOTE1_ITEMS = [
  { bold: "2 sessões AO VIVO", rest: " — Sábado 01/08 (9h30–17h30) + Domingo 02/08 (15h–18h)" },
  { bold: "", rest: "Bônus 1: Treinamento Heranças da Mentalidade de Sucesso" },
  { bold: "Bônus 2:", rest: " Katsu Desafio — Resultado em 5 Dias (gravado no Hotmart)" },
  { bold: "", rest: "Grupo VIP no WhatsApp" },
  { bold: "", rest: "Reunião tira-dúvidas com Hugo Miyazaki" },
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
  return (
    <section className="shadow-elevated ring-hairline rounded-3xl bg-card p-6">
      {/* Header */}
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">
          Protocolo de Remoção
        </p>
        <h1 className="font-display mt-1 text-[2rem] font-semibold leading-tight tracking-tight text-foreground">
          Heranças Mentais Herdadas
        </h1>
        <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <Award className="h-4 w-4 text-gold" /> Mestre da Medicina Oriental · Premiado ONU
        </p>
      </div>

      {/* Vídeo */}
      <div className="bg-gold-foil mt-5 rounded-2xl p-[2px] shadow-gold">
        <div className="relative aspect-video w-full overflow-hidden rounded-[calc(1rem-2px)] bg-black">
          <iframe
            src={PANDA_VSL_SRC}
            title="Protocolo de Remoção"
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full border-0"
          />
        </div>
      </div>

      {/* Presentes */}
      <div className="mt-6 rounded-3xl border border-gold/30 bg-gold/5 p-4">
        <p className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Gift className="h-5 w-5 text-gold" /> Presentes Liberados ao Assistir
        </p>
        <div className="mt-3 space-y-3">
          {GIFTS.map((g) => (
            <div
              key={g.title}
              className="flex gap-3 rounded-2xl border border-gold/25 bg-cream p-4 shadow-card"
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
          ))}
        </div>
      </div>

      {/* Antes & Depois */}
      <div className="mt-8 text-center">
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
          Acesso à Imersão + 2 Treinamentos Exclusivos que valem R$ 694
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-[15px] text-muted-foreground">
          A Imersão é o <strong className="text-foreground">workshop online ao vivo</strong> que o
          Hugo mostrou no vídeo — com ele te ajudando pessoalmente a remover a sua Herança.
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
            R$ 77
          </p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-gold">
            Próxima Turma · Vagas Limitadas
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
            <GreenCTA>Quero minha vaga agora</GreenCTA>
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
        <p className="font-display mt-3 text-5xl font-bold text-muted-foreground">R$ 147</p>
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
          src="https://hugomiyazakioriental.org/assets/garantia-30dias-Db4xU6mB.webp"
          alt="Selo Garantia 30 dias"
          width={112}
          height={112}
          className="h-24 w-24"
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
          <GreenCTA>Quero minha vaga agora</GreenCTA>
        </div>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
          <Lock className="h-3.5 w-3.5" /> Pagamento 100% seguro via Hotmart · Garantia de 30 dias
        </p>
      </div>
    </section>
  );
}
