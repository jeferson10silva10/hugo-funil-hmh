"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Award, ArrowRight, Lock, Sparkles, ShieldCheck, Volume2, VolumeX, AlertTriangle } from "lucide-react";
import { QUIZ_QUESTIONS } from "@/data/quiz";
import { Vsl } from "./Vsl";

type Stage = "landing" | "quiz" | "loading" | "diagnostico" | "bridge" | "vsl";

export function Funnel() {
  const [stage, setStage] = useState<Stage>("landing");
  const [qIndex, setQIndex] = useState(0);
  const [, setAnswers] = useState<string[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playTransition = useCallback(() => {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio(
          "https://hugomiyazakioriental.org/assets/transition-audio-DgTe1d2w.mp3"
        );
        audioRef.current.volume = 0.6;
      }
      audioRef.current.currentTime = 0;
      void audioRef.current.play().catch(() => {});
    } catch {
      /* áudio é enfeite, nunca bloqueia o fluxo */
    }
  }, []);

  const startQuiz = () => {
    setStage("quiz");
  };

  // Áudio preparatório toca no momento da virada diagnóstico → vídeo (clique do CTA do diagnóstico)
  const goToVideo = () => {
    playTransition();
    setStage("bridge");
  };

  const answer = (key: string) => {
    setAnswers((prev) => [...prev, key]);
    if (qIndex < QUIZ_QUESTIONS.length - 1) {
      setQIndex((i) => i + 1);
    } else {
      setStage("loading");
    }
  };

  return (
    <main className="flex min-h-dvh w-full items-start justify-center px-4 py-8 sm:items-center">
      <div className="w-full max-w-md">
        {stage === "landing" && <Landing onStart={startQuiz} />}
        {stage === "quiz" && <Quiz index={qIndex} onAnswer={answer} />}
        {stage === "loading" && <Loading onDone={() => setStage("diagnostico")} />}
        {stage === "diagnostico" && <Diagnostico onNext={goToVideo} />}
        {stage === "bridge" && <Bridge onNext={() => setStage("vsl")} />}
        {stage === "vsl" && <Vsl />}
      </div>
    </main>
  );
}

/* Botão primário premium reutilizável */
function PrimaryButton({
  children,
  onClick,
  as = "button",
  href,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  as?: "button" | "a";
  href?: string;
}) {
  const cls =
    "group relative flex w-full items-center justify-center gap-2 rounded-2xl bg-navy-grad px-7 py-4 text-base font-semibold uppercase tracking-wide text-white shadow-elevated transition-transform duration-200 active:scale-[0.985]";
  const inner = (
    <>
      {children}
      <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
    </>
  );
  if (as === "a" && href) {
    return (
      <a href={href} className={cls}>
        {inner}
      </a>
    );
  }
  return (
    <button onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}

/* ---------------- Landing ---------------- */
function Landing({ onStart }: { onStart: () => void }) {
  return (
    <section className="shadow-elevated ring-hairline rounded-3xl bg-card p-7">
      <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-gold/25 bg-gold/8 px-4 py-2">
        <Award className="h-4 w-4 text-gold" strokeWidth={2.2} />
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">
          Diagnóstico Oriental HMH
        </span>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl shadow-card">
        <Image
          src="https://hugomiyazakioriental.org/images/crianca-ouvidos-768.webp"
          alt="Padrão familiar herdado"
          width={768}
          height={432}
          className="h-auto w-full object-cover"
          priority
        />
      </div>

      <p className="mt-6 text-center text-[13px] font-semibold uppercase tracking-[0.14em] text-gold">
        Não é preguiça. Não é falta de disciplina.
      </p>
      <h1 className="font-display mt-2 text-center text-[2rem] font-semibold leading-[1.08] tracking-tight text-foreground">
        Você jurou que <span className="text-gold-foil">2026</span> seria diferente. Eai?
      </h1>

      <p className="mx-auto mt-3 max-w-sm text-center text-[15px] leading-relaxed text-muted-foreground">
        Metade do ano já passou e tá tudo igual a 2025. Existe uma Herança que
        instalaram na sua mente antes dos 7 anos — descubra qual está te sabotando,
        em 7 perguntas.
      </p>

      <div className="mt-7">
        <PrimaryButton onClick={onStart}>Quero descobrir agora</PrimaryButton>
      </div>

      <div className="mt-5 flex items-center justify-center gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-navy/70" /> Gratuito
        </span>
        <span className="h-1 w-1 rounded-full bg-border" />
        <span>2 minutos</span>
        <span className="h-1 w-1 rounded-full bg-border" />
        <span>Resultado personalizado</span>
      </div>
      <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground/80">
        Método de <span className="font-medium text-foreground/70">Hugo Miyazaki</span> —
        +10 mil pessoas atendidas · Premiado pela ONU
      </p>
    </section>
  );
}

/* ---------------- Quiz ---------------- */
function Quiz({ index, onAnswer }: { index: number; onAnswer: (k: string) => void }) {
  const q = QUIZ_QUESTIONS[index];
  const total = QUIZ_QUESTIONS.length;
  const progress = ((index + 1) / total) * 100;

  return (
    <section className="shadow-elevated ring-hairline rounded-3xl bg-card p-7">
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        <span>
          Pergunta <span className="text-navy">{String(index + 1).padStart(2, "0")}</span> de{" "}
          {total}
        </span>
        <span className="text-gold">{Math.round(progress)}%</span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="bg-gold-foil h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <h2 className="font-display mt-6 text-[1.6rem] font-semibold leading-snug tracking-tight text-foreground">
        {q.question}
      </h2>

      <div className="mt-6 flex flex-col gap-3">
        {q.options.map((opt) => (
          <button
            key={opt.key}
            onClick={() => onAnswer(opt.key)}
            className="group flex items-center gap-4 rounded-2xl border border-border/80 bg-card p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-navy/30 hover:shadow-card"
          >
            <span className="bg-navy-grad flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-base font-bold text-white shadow-card">
              {opt.key}
            </span>
            <span className="text-[15px] leading-snug text-foreground">{opt.text}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Loading + Respiração japonesa (Hara) — vídeo guiado ---------------- */
const BREATH_TOTAL = 34; // segundos — duração do vídeo respiracao.mp4

function Loading({ onDone }: { onDone: () => void }) {
  const [pct, setPct] = useState(0);
  const [muted, setMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const start = performance.now();
    const DURATION = BREATH_TOTAL * 1000;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(100, Math.round(((now - start) / DURATION) * 100));
      setPct(p);
      if (p < 100) raf = requestAnimationFrame(tick);
      else setTimeout(onDone, 400);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onDone]);

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
    if (!v.muted) void v.play().catch(() => {});
  };

  const left = Math.max(0, Math.ceil(((100 - pct) / 100) * BREATH_TOTAL));

  return (
    <section className="bg-navy-grad shadow-elevated flex min-h-[80dvh] flex-col items-center justify-between overflow-hidden rounded-3xl px-6 py-8 text-center">
      <div className="flex w-full flex-col items-center">
        <Image
          src="/images/hms-logo.webp"
          alt="Heranças da Mentalidade do Sucesso"
          width={640}
          height={640}
          className="h-14 w-14 object-contain"
          priority
        />
        <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
          Respiração do Hara · Técnica Japonesa
        </p>
        <h2 className="font-display mt-1 text-xl font-semibold text-white">
          Antes do seu diagnóstico, respire comigo
        </h2>
      </div>

      {/* Vídeo guiado — autoplay mudo, botão de som */}
      <div className="relative mt-3 w-full max-w-[280px] overflow-hidden rounded-3xl border-2 border-gold/40 shadow-gold">
        <div className="relative aspect-[9/16] w-full bg-black">
          <video
            ref={videoRef}
            src="/videos/respiracao.mp4"
            poster="/videos/respiracao-poster.jpg"
            autoPlay
            muted
            playsInline
            preload="auto"
            className="absolute inset-0 h-full w-full object-cover"
            onEnded={onDone}
          />
          <button
            onClick={toggleMute}
            aria-label={muted ? "Ativar som" : "Silenciar"}
            className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-black/80"
          >
            {muted ? (
              <>
                <VolumeX className="h-3.5 w-3.5" /> Ativar som
              </>
            ) : (
              <>
                <Volume2 className="h-3.5 w-3.5" /> Som ligado
              </>
            )}
          </button>
        </div>
      </div>

      <div className="mt-4 flex w-full flex-col items-center">
        <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-white/12">
          <div
            className="bg-gold-foil h-full rounded-full transition-[width] duration-150"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-2 text-sm font-semibold tabular-nums text-white/85">
          {left > 0 ? `Seu prontuário em ${left}s` : "Pronto!"}
        </p>
        <p className="mt-3 flex items-center gap-1.5 text-xs text-white/55">
          <Lock className="h-3.5 w-3.5" /> Suas respostas são completamente confidenciais
        </p>
      </div>
    </section>
  );
}

/* ---------------- Prova social (Instagram verificado do Hugo) ---------------- */
function HugoProof() {
  return (
    <div className="overflow-hidden rounded-2xl shadow-card ring-1 ring-border/70">
      <Image
        src="https://hugomiyazakioriental.org/assets/hugo-instagram-BLdWfVDx.webp"
        alt="Perfil verificado de Hugo Miyazaki no Instagram — 290 mil seguidores"
        width={700}
        height={364}
        className="h-auto w-full"
      />
    </div>
  );
}

/* ---------------- Diagnóstico ---------------- */
function Diagnostico({ onNext }: { onNext: () => void }) {
  const date = new Date().toLocaleDateString("pt-BR");
  return (
    <section className="shadow-elevated ring-hairline overflow-hidden rounded-3xl bg-card">
      {/* Banner do diagnóstico — Mente Sabotadora × Mente Próspera */}
      <Image
        src="/images/diagnostico-banner.webp"
        alt="Diagnóstico HMH — Mente Sabotadora versus Mente Próspera"
        width={1200}
        height={560}
        className="h-auto w-full"
        priority
      />
      <div className="flex items-center justify-between border-b border-border px-7 py-3 text-[13px] text-muted-foreground">
        <span className="font-medium text-foreground/80">Data: {date}</span>
        <span className="flex items-center gap-1 uppercase tracking-wide">
          <Lock className="h-3.5 w-3.5" /> Confidencial
        </span>
      </div>

      <div className="px-7 pb-7 pt-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Tipo de Herança Identificada
        </p>
        <h1 className="font-display text-[2rem] font-semibold leading-tight tracking-tight text-foreground">
          Mente Aprisionada
        </h1>
        <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1 text-sm font-semibold text-destructive">
          <Lock className="h-3.5 w-3.5" /> Diagnóstico Severo
        </p>

        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Grau de Ativação
        </p>
        <div className="mt-2 flex items-center gap-3">
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-gradient-to-r from-destructive/70 to-destructive"
              style={{ width: "87%" }}
            />
          </div>
          <span className="font-display text-2xl font-semibold text-destructive">87%</span>
        </div>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Mais alto que <strong className="text-foreground">8 em cada 10</strong> pessoas que
          fizeram este teste.
        </p>

        <div className="my-6 h-px bg-border" />

        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Diagnóstico Completo
        </p>
        <h2 className="font-display mt-1 text-xl font-semibold text-foreground">
          Sua Herança Mental está em ESTADO SEVERO
        </h2>

        <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-foreground/85">
          <p>Você não tem um problema de disciplina.</p>
          <p>Você não tem um problema de motivação.</p>
          <p>
            Você tem uma Herança Mental Herdada de Aprisionamento. Uma programação que foi
            instalada em você nos primeiros 7 anos de vida.
          </p>
          <p>Ela está rodando há décadas em segundo plano. Sabotando toda decisão que você toma.</p>
          <p>
            A cada vez que você tenta crescer, ela ativa. A cada vez que você decide mudar, ela
            contra-ataca.
          </p>
          <p>
            Sozinho, você não vai sair daí. Não porque você é fraco. Porque a Herança foi feita
            pra ser invisível.
          </p>
        </div>

        <div className="hm-glow-red mt-5 flex gap-3 rounded-2xl border-l-4 border-destructive bg-destructive/8 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-destructive">
              ⚠ Prognóstico sem intervenção
            </p>
            <p className="mt-1.5 text-[15px] leading-relaxed text-foreground/90">
              Se você não remover essa Herança nos <strong className="text-destructive">próximos 6 meses</strong>, 2026 vai ser igual a 2025. Que foi igual a 2024. <strong className="text-foreground">E você sabe disso.</strong>
            </p>
          </div>
        </div>

        <div className="mt-5 flex gap-3 rounded-2xl border border-gold/30 bg-gold/8 p-4">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
          <p className="text-[15px] leading-relaxed text-foreground/85">
            Mas escuta: <strong className="text-foreground">isso não é culpa sua.</strong> Você
            não escolheu essa programação — ela foi instalada quando você era criança, sem você
            perceber. E é <strong className="text-foreground">exatamente por isso que dá pra
            remover.</strong> Não sozinho — comigo do seu lado, no próximo vídeo.
          </p>
        </div>

        <div className="mt-6 border-t border-border pt-5">
          <p className="font-display text-lg font-semibold text-foreground">Hugo Miyazaki</p>
          <p className="text-sm text-muted-foreground">Mestre da Medicina Oriental</p>
          <p className="text-sm text-muted-foreground">
            Premiado pelas Forças Internacionais da Paz / ONU
          </p>
          <div className="mt-4">
            <HugoProof />
          </div>
        </div>

        <div className="mt-6">
          <PrimaryButton onClick={onNext}>Quero remover essa Herança</PrimaryButton>
        </div>
        <p className="mt-3 text-center text-sm text-muted-foreground">
          Próximo passo: assistir ao Protocolo de Remoção
        </p>
      </div>
    </section>
  );
}

/* ---------------- Bridge ---------------- */
function Bridge({ onNext }: { onNext: () => void }) {
  const [left, setLeft] = useState(15);
  useEffect(() => {
    const iv = setInterval(() => setLeft((l) => (l > 0 ? l - 1 : 0)), 1000);
    return () => clearInterval(iv);
  }, []);
  const ready = left <= 0;

  return (
    <section className="shadow-elevated ring-hairline rounded-3xl bg-card p-7">
      <div className="flex justify-center">
        <Image
          src="/images/hms-emblem.webp"
          alt="Heranças da Mentalidade do Sucesso"
          width={240}
          height={240}
          className="h-16 w-16 rounded-full ring-1 ring-gold/30"
        />
      </div>
      <div className="mt-6 space-y-4 text-[17px] leading-relaxed text-foreground/85">
        <p>Você acabou de descobrir o nome da força invisível que vem te travando.</p>
        <p className="font-display text-xl font-semibold text-foreground">
          Mas isso ainda é só o começo.
        </p>
        <p>
          Por trás da verdade que você conhece… existe uma outra verdade. E é essa verdade que
          vira a chave.
        </p>
        <p>
          Eu vou te revelar exatamente como essa Herança foi instalada dentro da sua mente e o
          que precisa ser feito para quebrar esse padrão.
        </p>
        <p className="font-semibold text-foreground">Assista o próximo vídeo até o final.</p>
        <p>Ele irá mudar a forma de como você enxerga a sua própria vida.</p>
      </div>

      <div className="mt-7">
        {ready ? (
          <div className="hm-fade-up">
            <PrimaryButton onClick={onNext}>Assistir ao vídeo</PrimaryButton>
          </div>
        ) : (
          <button
            disabled
            className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-2xl bg-secondary px-7 py-4 text-base font-semibold uppercase tracking-wide text-muted-foreground"
          >
            <Lock className="h-4 w-4" /> Liberando o vídeo em {left}s
          </button>
        )}
      </div>
    </section>
  );
}

export { PrimaryButton };
