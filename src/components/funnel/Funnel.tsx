"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Award, ArrowRight, Lock, Sparkles, ShieldCheck, Volume2, VolumeX, AlertTriangle,
  Coins, TrendingDown, Sprout,
  Ban, Waves, Timer,
  RotateCcw, Split, Turtle,
  Angry, Flame, Compass,
  Weight, Brain, BatteryLow,
  HeartHandshake, HeartCrack, User,
  Copy, Undo2, Mountain,
  type LucideIcon,
} from "lucide-react";
import { QUIZ_QUESTIONS, PERFIS, calcularArquetipo, citarResposta, type Arquetipo } from "@/data/quiz";
import { track, trackMeta } from "@/lib/analytics";
import { Vsl } from "./Vsl";

type Stage = "landing" | "quiz" | "nome" | "loading" | "diagnostico" | "experiencia" | "calibracao" | "bridge" | "vsl";

export function Funnel() {
  const [stage, setStage] = useState<Stage>("landing");
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [genero, setGenero] = useState<"homem" | "mulher" | null>(null);
  const [nome, setNome] = useState("");
  const [musicaTaskId, setMusicaTaskId] = useState<string | null>(null);
  const [musicaUrl, setMusicaUrl] = useState<string | null>(null);
  const arquetipo: Arquetipo = answers.length >= QUIZ_QUESTIONS.length
    ? calcularArquetipo(answers)
    : "aprisionada"; // fallback antes do quiz terminar
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

  const selectGender = (g: "homem" | "mulher") => {
    setGenero(g);
    track("funnel_gender_select", { genero: g });
    track("funnel_quiz_start", { genero: g });
    setStage("quiz");
  };

  const goToVideo = () => {
    track("funnel_diag_cta_click", { arquetipo });
    playTransition();
    // depois do diagnostico vai pra EXPERIENCIA (ritual + musica + transicao)
    setStage("experiencia");
  };

  const [nota, setNota] = useState<number | null>(null);
  const submitNota = (n: number) => {
    setNota(n);
    const faixa = n >= 5 ? "forte" : "sutil";
    track("calibracao_nota", { nota: n, faixa });
    // depois da nota vai pra bridge (a proxima etapa antes da VSL)
    setStage("bridge");
  };

  const submitName = (n: string) => {
    const clean = n.trim();
    setNome(clean);
    track("funnel_name_submit", { genero: genero ?? "", tem_nome: clean.length > 0 });
    // dispara geracao da musica personalizada em BACKGROUND (nao trava o funil)
    if (clean.length >= 2) {
      void fetch("/api/musica/gerar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: clean }),
      })
        .then((r) => r.json())
        .then((j: { taskId?: string; error?: string }) => {
          if (j.taskId) {
            setMusicaTaskId(j.taskId);
            track("musica_gerar_dispatch", { taskId: j.taskId });
          } else {
            track("musica_gerar_erro", { erro: j.error ?? "sem_taskId" });
          }
        })
        .catch(() => {
          track("musica_gerar_erro", { erro: "fetch_failed" });
        });
    }
    setStage("loading");
  };

  // polling do status da musica em background enquanto a pessoa passa por respiracao+diagnostico+bridge
  useEffect(() => {
    if (!musicaTaskId || musicaUrl) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const r = await fetch(`/api/musica/status?id=${musicaTaskId}`);
        const j: { url?: string; status?: string } = await r.json();
        if (cancelled) return;
        if (j.url) {
          setMusicaUrl(j.url);
          track("musica_pronta", { taskId: musicaTaskId });
        } else if (j.status === "failed" || j.status === "cancelled") {
          track("musica_falhou", { taskId: musicaTaskId, status: j.status });
        }
      } catch {
        /* ignora erro pontual */
      }
    };
    const iv = setInterval(poll, 5000);
    void poll();
    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, [musicaTaskId, musicaUrl]);

  const answer = (key: string) => {
    const q = QUIZ_QUESTIONS[qIndex];
    const opt = q.options.find((o) => o.key === key);
    const nextAnswers = [...answers, key];
    track("funnel_quiz_answer", {
      qId: q.id,
      qIndex: qIndex + 1,
      option: key,
      weight: opt?.weight ?? "",
    });
    setAnswers(nextAnswers);
    if (qIndex < QUIZ_QUESTIONS.length - 1) {
      setQIndex((i) => i + 1);
    } else {
      const finalArquetipo = calcularArquetipo(nextAnswers);
      track("funnel_quiz_complete", { arquetipo: finalArquetipo, total: nextAnswers.length, genero: genero ?? "" });
      trackMeta("Lead", { content_name: "Diagnóstico HMH", arquetipo: finalArquetipo, genero: genero ?? "" });
      setStage("nome");
    }
  };

  return (
    <main className="flex min-h-dvh w-full items-start justify-center px-4 py-8 sm:items-center">
      <div className="w-full max-w-md">
        {stage === "landing" && <Landing onSelectGender={selectGender} />}
        {stage === "quiz" && <Quiz index={qIndex} onAnswer={answer} />}
        {stage === "nome" && <NameStep onSubmit={submitName} />}
        {stage === "loading" && <Loading onDone={() => setStage("diagnostico")} />}
        {stage === "diagnostico" && (
          <Diagnostico
            onNext={goToVideo}
            arquetipo={arquetipo}
            answers={answers}
            nome={nome}
            musicaUrl={musicaUrl}
          />
        )}
        {stage === "experiencia" && (
          <Experiencia
            nome={nome}
            musicaUrl={musicaUrl}
            onDone={() => setStage("calibracao")}
          />
        )}
        {stage === "calibracao" && <Calibracao nome={nome} onSubmit={submitNota} />}
        {stage === "bridge" && <Bridge onNext={() => setStage("vsl")} musicaUrl={musicaUrl} nota={nota} />}
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

/* ---------------- Landing (abre com escolha binária — foot-in-the-door) ---------------- */
function Landing({ onSelectGender }: { onSelectGender: (g: "homem" | "mulher") => void }) {
  useEffect(() => {
    track("funnel_landing_view");
  }, []);
  return (
    <section className="shadow-elevated ring-hairline rounded-3xl bg-card p-7">
      <Image
        src="/images/hms-logo-h.webp"
        alt="Heranças da Mentalidade do Sucesso"
        width={820}
        height={82}
        className="mx-auto h-auto w-full max-w-[300px]"
        priority
      />
      <p className="mx-auto mt-2 flex w-fit items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-gold">
        <Award className="h-3.5 w-3.5" /> Diagnóstico Oriental
      </p>

      <h1 className="font-display mt-6 text-center text-[2.05rem] font-semibold leading-[1.08] tracking-tight text-foreground">
        Descubra qual <span className="text-gold-foil">Herança Mental</span> está te travando
      </h1>

      {/* Escolha binária: o 1º toque JÁ inicia o quiz (reduz a fricção de começar) */}
      <p className="mt-7 text-center text-[13px] font-semibold uppercase tracking-[0.16em] text-gold">
        Pra começar, me diz quem é você:
      </p>
      <div className="mt-4 grid grid-cols-2 gap-4">
        {([
          ["homem", "Homem", "0ms", "bg-navy-grad"],
          ["mulher", "Mulher", "130ms", "bg-gradient-to-br from-[#d94f8c] to-[#96285e]"],
        ] as const).map(([value, label, delay, bg]) => (
          <button
            key={value}
            onClick={() => onSelectGender(value)}
            style={{ animationDelay: delay }}
            className={`hm-fade-up hm-shine group relative flex flex-col items-center gap-3 rounded-3xl ${bg} p-6 shadow-elevated ring-1 ring-gold/40 transition-all duration-200 hover:-translate-y-1 hover:shadow-gold hover:ring-gold/80 active:scale-[0.98]`}
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/12 ring-2 ring-gold/50 transition-transform duration-200 group-hover:scale-110">
              <User className="h-8 w-8 text-gold" strokeWidth={2} />
            </span>
            <span className="text-lg font-bold uppercase tracking-wider text-white">{label}</span>
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.18em] text-gold/90">
              Toque aqui
              <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" />
            </span>
          </button>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-center gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-navy/70" /> 100% confidencial
        </span>
        <span className="h-1 w-1 rounded-full bg-border" />
        <span>2 minutos</span>
        <span className="h-1 w-1 rounded-full bg-border" />
        <span>Resultado na hora</span>
      </div>
      <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground/80">
        Método de <span className="font-medium text-foreground/70">Hugo Miyazaki</span> —
        +10 mil pessoas atendidas · Premiado pela ONU
      </p>
    </section>
  );
}

/* Ícones por pergunta × opção — semântica temática, mantém tom clínico */
const QUIZ_ICONS: Record<number, [LucideIcon, LucideIcon, LucideIcon]> = {
  1: [Coins, TrendingDown, Sprout],           // frases da infância sobre dinheiro
  2: [Ban, Waves, Timer],                     // travar / dispersão / demora
  3: [RotateCcw, Split, Turtle],              // abandona / termina uns / demora
  4: [Angry, Flame, Compass],                 // rancor / inquietude / próprio ritmo
  5: [Weight, Brain, BatteryLow],             // peso / inquietação mental / cansaço
  6: [HeartHandshake, HeartCrack, User],      // largo pelo outro / culpa / eu (raro)
  7: [Copy, Undo2, Mountain],                 // igual demais / puxava de volta / cresce
};

/* ---------------- Quiz ---------------- */
function Quiz({ index, onAnswer }: { index: number; onAnswer: (k: string) => void }) {
  const q = QUIZ_QUESTIONS[index];
  const total = QUIZ_QUESTIONS.length;
  const progress = ((index + 1) / total) * 100;

  return (
    <section className="shadow-elevated ring-hairline rounded-3xl bg-card p-7">
      <Image
        src="/images/hms-logo-h.webp"
        alt="Heranças da Mentalidade do Sucesso"
        width={820}
        height={82}
        className="mx-auto mb-5 h-auto w-full max-w-[220px] opacity-90"
      />
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
        {q.options.map((opt, i) => {
          const IconCmp = QUIZ_ICONS[q.id]?.[i];
          return (
            <button
              key={opt.key}
              onClick={() => onAnswer(opt.key)}
              className="group flex items-center gap-4 rounded-2xl border border-border/80 bg-card p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-navy/30 hover:shadow-card"
            >
              <span className="bg-navy-grad flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-card">
                {IconCmp ? <IconCmp className="h-[22px] w-[22px]" strokeWidth={1.9} /> : opt.key}
              </span>
              <span className="text-[15px] leading-snug text-foreground">{opt.text}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

/* ---------------- Captura de nome (última etapa antes da respiração) ---------------- */
function NameStep({ onSubmit }: { onSubmit: (n: string) => void }) {
  const [nome, setNome] = useState("");
  useEffect(() => {
    track("funnel_name_view");
  }, []);
  const ready = nome.trim().length >= 2;
  const submit = () => {
    if (ready) onSubmit(nome.trim());
  };
  return (
    <section className="shadow-elevated ring-hairline rounded-3xl bg-card p-7">
      <Image
        src="/images/hms-logo-h.webp"
        alt="Heranças da Mentalidade do Sucesso"
        width={820}
        height={82}
        className="mx-auto mb-5 h-auto w-full max-w-[220px] opacity-90"
      />
      <p className="text-center text-xs font-semibold uppercase tracking-[0.16em] text-gold">
        Última etapa
      </p>
      <h2 className="font-display mt-2 text-center text-[1.7rem] font-semibold leading-snug tracking-tight text-foreground">
        Como podemos te chamar?
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-center text-[14px] leading-relaxed text-muted-foreground">
        Seu diagnóstico é <strong className="text-foreground">personalizado com o seu nome</strong>.
        É só o primeiro nome.
      </p>

      <input
        type="text"
        inputMode="text"
        autoComplete="given-name"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
        placeholder="Seu primeiro nome"
        autoFocus
        maxLength={40}
        className="mt-6 w-full rounded-2xl border border-border bg-secondary/40 px-5 py-4 text-center text-lg font-medium text-foreground outline-none transition focus:border-navy/50 focus:ring-2 focus:ring-navy/15"
      />

      <div className="mt-5">
        {ready ? (
          <div className="hm-fade-up">
            <PrimaryButton onClick={submit}>Ver meu diagnóstico</PrimaryButton>
          </div>
        ) : (
          <button
            disabled
            className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-2xl bg-secondary px-7 py-4 text-base font-semibold uppercase tracking-wide text-muted-foreground"
          >
            Ver meu diagnóstico
          </button>
        )}
      </div>

      <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <Lock className="h-3.5 w-3.5" /> Seus dados são confidenciais
      </p>
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
    track("funnel_loading_view");
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
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">
          Respiração do Hara · Técnica dos Monges Zen
        </p>
        <h2 className="font-display mt-1 text-xl font-semibold text-white">
          Respire comigo antes de ver seu diagnóstico
        </h2>
        <p className="mx-auto mt-2 max-w-[300px] text-[13px] leading-snug text-white/75">
          Mesma respiração que os monges zen usam há <strong className="text-white">800 anos</strong>{" "}
          pra <strong className="text-gold">cortar o cortisol e destravar a mente</strong> —
          comprovada por Harvard. É o ritual que o Hugo faz antes de cada atendimento.
        </p>
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
        src="/assets/hugo-instagram.webp"
        alt="Perfil verificado de Hugo Miyazaki no Instagram — 290 mil seguidores"
        width={700}
        height={364}
        className="h-auto w-full"
        sizes="(max-width: 640px) 100vw, 700px"
        loading="lazy"
      />
    </div>
  );
}

/* ---------------- Música de fundo do diagnóstico (autoplay-safe · para ao sair) ----------------
   Regra dos navegadores: áudio com som não pode dar autoplay. Começa no 1º gesto do usuário
   (scroll/toque/clique — sempre acontece ao ler), volume 0.35 com fade-in, loop, botão 🔊/🔇.
   Só renderiza o botão se o mp3 existir (onCanPlay). Pausa ao desmontar (ir pra VSL). */
function DiagBgm({ musicaUrl }: { musicaUrl?: string | null }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [available, setAvailable] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [usingPersonalized, setUsingPersonalized] = useState(false);
  const startedRef = useRef(false);
  // fallback pra instrumental generica enquanto a musica personalizada nao chega
  const src = musicaUrl || "/audio/diagnostico.mp3";
  // loop so na generica; a musica personalizada tem letra e nao faz sentido em loop
  const shouldLoop = !musicaUrl;

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.volume = 0;
    const TARGET = 0.42;
    let fade: ReturnType<typeof setInterval> | undefined;
    const fadeIn = () => {
      fade = setInterval(() => {
        a.volume = Math.min(TARGET, a.volume + 0.03);
        if (a.volume >= TARGET && fade) clearInterval(fade);
      }, 120);
    };
    const start = () => {
      if (startedRef.current) return;
      const p = a.play();
      if (p && typeof p.then === "function") {
        p.then(() => {
          startedRef.current = true;
          setPlaying(true);
          fadeIn();
        }).catch(() => {});
      }
    };
    const evs = ["pointerdown", "touchstart", "scroll", "keydown"] as const;
    evs.forEach((ev) => window.addEventListener(ev, start, { once: true, passive: true }));
    return () => {
      evs.forEach((ev) => window.removeEventListener(ev, start));
      if (fade) clearInterval(fade);
      a.pause(); // para a música ao sair do diagnóstico (ir pra VSL)
    };
  }, []);

  // quando a personalizada fica pronta: fade-out da atual, troca src, fade-in
  useEffect(() => {
    if (!musicaUrl || usingPersonalized) return;
    const a = audioRef.current;
    if (!a) return;
    setUsingPersonalized(true);
    const startVol = a.volume;
    let step = 0;
    const fadeOut = setInterval(() => {
      step += 1;
      a.volume = Math.max(0, startVol - step * 0.04);
      if (a.volume <= 0) {
        clearInterval(fadeOut);
        a.src = musicaUrl;
        a.loop = false;
        a.currentTime = 0;
        void a.play().catch(() => {});
        const fadeIn = setInterval(() => {
          a.volume = Math.min(0.55, a.volume + 0.04);
          if (a.volume >= 0.55) clearInterval(fadeIn);
        }, 100);
      }
    }, 80);
    return () => clearInterval(fadeOut);
  }, [musicaUrl, usingPersonalized]);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      startedRef.current = true;
      void a.play().catch(() => {});
      setPlaying(true);
    } else {
      a.pause();
      setPlaying(false);
    }
  };

  return (
    <>
      <audio
        ref={audioRef}
        src={src}
        loop={shouldLoop}
        preload="auto"
        onCanPlay={() => setAvailable(true)}
        onError={() => setAvailable(false)}
      />
      {available && (
        <button
          onClick={toggle}
          aria-label={playing ? "Silenciar música" : "Ativar música"}
          className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full px-4 py-3 text-white shadow-elevated ring-1 transition hover:scale-105 ${
            usingPersonalized
              ? "bg-gradient-to-r from-[#c2680f] to-[#e29638] ring-gold/70"
              : "bg-navy-grad ring-gold/50"
          }`}
        >
          {playing ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          {usingPersonalized && (
            <span className="text-[10px] font-bold uppercase tracking-[0.14em]">Sua música</span>
          )}
        </button>
      )}
    </>
  );
}

/* ---------------- Diagnóstico (adaptativo por arquétipo) ---------------- */
function Diagnostico({
  onNext,
  arquetipo,
  answers,
  nome,
  musicaUrl,
}: {
  onNext: () => void;
  arquetipo: Arquetipo;
  answers: string[];
  nome: string;
  musicaUrl?: string | null;
}) {
  useEffect(() => {
    track("funnel_diag_view", { arquetipo });
  }, [arquetipo]);
  const date = new Date().toLocaleDateString("pt-BR");
  const perfil = PERFIS[arquetipo];
  // Prova personalizada: cita a resposta da pergunta de auto-sacrifício (q6) — a corda mais forte da VSL
  const citaAutoSacrificio = citarResposta(answers, 6);
  const isSevero = perfil.severidadeCor === "vermelho";
  return (
    <>
      <DiagBgm musicaUrl={musicaUrl} />
      <section className="shadow-elevated ring-hairline overflow-hidden rounded-3xl bg-card">
      <div className="border-b border-border px-7 py-4">
        <Image
          src="/images/hms-logo-h.webp"
          alt="Heranças da Mentalidade do Sucesso"
          width={820}
          height={82}
          className="mx-auto h-auto w-full max-w-[260px]"
        />
      </div>
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
        <span className="font-medium text-foreground/80">
          {nome ? `Paciente: ${nome}` : `Data: ${date}`}
        </span>
        <span className="flex items-center gap-1 uppercase tracking-wide">
          <Lock className="h-3.5 w-3.5" /> Confidencial
        </span>
      </div>

      <div className="px-7 pb-7 pt-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Tipo de Herança Identificada
        </p>
        <h1 className="font-display text-[2rem] font-semibold leading-tight tracking-tight text-foreground">
          {perfil.nomeCurto}
        </h1>
        <p
          className={`mt-1.5 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${
            isSevero
              ? "bg-destructive/10 text-destructive"
              : "bg-[#c2680f]/10 text-[#c2680f]"
          }`}
        >
          <Lock className="h-3.5 w-3.5" /> Diagnóstico {isSevero ? "Severo" : "Moderado"}
        </p>

        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Grau de Ativação
        </p>
        <div className="mt-2 flex items-center gap-3">
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-secondary">
            <div
              className={`h-full rounded-full ${
                isSevero
                  ? "bg-gradient-to-r from-destructive/70 to-destructive"
                  : "bg-gradient-to-r from-[#e29638]/70 to-[#c2680f]"
              }`}
              style={{ width: `${perfil.grau}%` }}
            />
          </div>
          <span
            className={`font-display text-2xl font-semibold ${
              isSevero ? "text-destructive" : "text-[#c2680f]"
            }`}
          >
            {perfil.grau}%
          </span>
        </div>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Mais alto que{" "}
          <strong className="text-foreground">
            {perfil.grau >= 85 ? "8 em cada 10" : perfil.grau >= 70 ? "7 em cada 10" : "6 em cada 10"}
          </strong>{" "}
          pessoas que fizeram este teste.
        </p>

        <div className="my-6 h-px bg-border" />

        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Diagnóstico Completo
        </p>
        <h2 className="font-display mt-1 text-xl font-semibold text-foreground">
          {nome ? `${nome}, sua` : "Sua"} Herança Mental está em {perfil.severidade}
        </h2>

        <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-foreground/85">
          {perfil.frasesDor.map((f, i) => (
            <p key={i}>{f}</p>
          ))}
        </div>

        {/* Prova personalizada — cita a resposta da pessoa (auto-sacrifício) */}
        {citaAutoSacrificio && (
          <div className="hm-fade-up mt-5 rounded-2xl border-l-4 border-navy bg-navy/5 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-navy">
              A sua resposta prova isso
            </p>
            <p className="mt-1.5 text-[15px] leading-relaxed text-foreground/90">
              Você marcou:{" "}
              <em className="font-semibold text-foreground">
                &ldquo;{citaAutoSacrificio}&rdquo;
              </em>
              . Esse é exatamente o padrão nº 1 de quem tem a sua Herança ativa — e é a raiz do
              porquê você trabalha, trabalha, trabalha e não sai do lugar.
            </p>
          </div>
        )}

        <div className="hm-glow-red mt-5 flex gap-3 rounded-2xl border-l-4 border-destructive bg-destructive/8 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-destructive">
              ⚠ Prognóstico sem intervenção
            </p>
            <p className="mt-1.5 text-[15px] leading-relaxed text-foreground/90">
              {perfil.prognostico}
            </p>
          </div>
        </div>

        <div className="mt-5 flex gap-3 rounded-2xl border border-gold/30 bg-gold/8 p-4">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
          <p className="text-[15px] leading-relaxed text-foreground/85">{perfil.reframe}</p>
        </div>

        {/* Ishin-Denshin — autoridade cultural japonesa (Medicina Oriental) */}
        <div className="mt-5 rounded-2xl border border-gold/40 bg-navy-grad p-5 text-white">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gold">
            🇯🇵 Medicina Oriental Japonesa
          </p>
          <p className="mt-2 text-[15px] leading-relaxed text-white/90">{perfil.ganchoJapones}</p>
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
    </>
  );
}

/* ---------------- Bridge ---------------- */
/* ---------------- EXPERIÊNCIA (ritual + música + transição) ---------------- */
/* Regra de ouro: NUNCA trava se a música não estiver pronta.
   Fluxo: ritual (áudio Hugo) -> tenta música com timeout 3s -> se ok toca até fim, se não pula.
   Áudio de transição (Hugo) sempre toca no fim, pra levar pra calibração. */
function Experiencia({ nome, musicaUrl, onDone }: { nome: string; musicaUrl?: string | null; onDone: () => void }) {
  type Phase = "intro" | "ritual" | "musica" | "transicao";
  const [phase, setPhase] = useState<Phase>("intro");
  const [ready, setReady] = useState(false); // pessoa clicou "estou pronto"
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    track("experiencia_view", { tem_musica: !!musicaUrl });
  }, [musicaUrl]);

  // sequencia dos audios apos "estou pronto"
  useEffect(() => {
    if (!ready) return;
    const a = audioRef.current;
    if (!a) return;
    if (phase === "ritual") {
      a.src = "/audio/hugo/ritual.mp3";
      a.volume = 0.9;
      void a.play().catch(() => setPhase("musica"));
      a.onended = () => setPhase("musica");
    } else if (phase === "musica") {
      // se tem musica pronta => toca. se nao (ainda gerando, erro, timeout) => pula pra transicao
      if (musicaUrl) {
        track("musica_ouvida", { url: musicaUrl });
        a.src = musicaUrl;
        a.volume = 0.55;
        a.onended = () => setPhase("transicao");
        void a.play().catch(() => {
          track("musica_skip_fallback", { motivo: "play_error" });
          setPhase("transicao");
        });
      } else {
        track("musica_skip_fallback", { motivo: "nao_pronta" });
        setPhase("transicao");
      }
    } else if (phase === "transicao") {
      a.src = "/audio/hugo/transicao.mp3";
      a.volume = 0.9;
      a.onended = () => onDone();
      void a.play().catch(() => onDone());
    }
  }, [phase, ready, musicaUrl, onDone]);

  // botao "estou pronto" arma tudo
  const start = () => {
    track("ritual_start");
    setReady(true);
    setPhase("ritual");
  };

  const skip = () => {
    track("experiencia_skip", { phase });
    onDone();
  };

  const displayName = nome || "Você";

  return (
    <>
      <audio ref={audioRef} preload="auto" />
      <section className="shadow-elevated bg-navy-grad relative overflow-hidden rounded-3xl p-8 text-center text-white">
        {!ready ? (
          // TELA 1: convite pro ritual
          <>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gold">
              ✦ Experiência única ✦
            </p>
            <h2 className="font-display mt-3 text-[1.9rem] font-semibold leading-tight text-white">
              {displayName}, você está prestes a viver algo que{" "}
              <span className="text-gold-foil">99% das pessoas nunca viveram.</span>
            </h2>
            <p className="mt-5 text-[15px] leading-relaxed text-white/85">
              Uma frequência criada especificamente pra você — pra desprogramar a herança mental
              que te trava, e ativar padrões de sucesso na sua mente.
            </p>

            <div className="mt-6 rounded-2xl border border-gold/30 bg-white/6 p-5 text-left">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-gold">
                Antes de começar:
              </p>
              <ul className="mt-3 space-y-2 text-[14px] leading-relaxed text-white/90">
                <li className="flex gap-2">🎧 <span>Coloque um fone de ouvido</span></li>
                <li className="flex gap-2">🧘 <span>Sente-se confortavelmente</span></li>
                <li className="flex gap-2">👁 <span>Feche os olhos e deixe sua mente vagar</span></li>
                <li className="flex gap-2">🌬️ <span>Respire fundo três vezes</span></li>
              </ul>
            </div>

            <button
              onClick={start}
              className="hm-glow bg-gold-foil text-navy mt-7 flex w-full items-center justify-center gap-2 rounded-2xl px-7 py-4 text-base font-bold uppercase tracking-wide shadow-elevated transition active:scale-[0.98]"
            >
              ✦ Estou pronto(a) — iniciar
            </button>

            <button
              onClick={skip}
              className="mt-4 text-xs text-white/50 underline underline-offset-4 hover:text-white/75"
            >
              pular ritual
            </button>
          </>
        ) : (
          // TELA 2: rodando (olhos fechados)
          <>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gold">
              {phase === "ritual" && "Instruções"}
              {phase === "musica" && (musicaUrl ? "🎵 Sua frequência" : "✦ Preparando")}
              {phase === "transicao" && "✦ Retornando"}
            </p>
            <h2 className="font-display mt-4 text-[1.6rem] font-semibold leading-snug text-white">
              {phase === "ritual" && "Feche os olhos e respire."}
              {phase === "musica" && (musicaUrl ? `${displayName}, deixe a frequência agir.` : "Um momento…")}
              {phase === "transicao" && "Respire. Volte com calma."}
            </h2>

            {/* pulsar visual — bolinha respirando */}
            <div className="mt-10 flex justify-center">
              <div className="hm-pulse relative flex h-32 w-32 items-center justify-center rounded-full border-2 border-gold/60">
                <div className="hm-pulse absolute inset-2 rounded-full border border-gold/40" />
                <div className="hm-pulse absolute inset-6 rounded-full bg-gold/15" />
                <span className="text-3xl">✦</span>
              </div>
            </div>

            <p className="mt-10 text-xs text-white/45">
              o próximo passo aparece automaticamente
            </p>
            <button
              onClick={skip}
              className="mt-6 text-[11px] text-white/40 underline underline-offset-4 hover:text-white/70"
            >
              pular
            </button>
          </>
        )}
      </section>
    </>
  );
}

/* ---------------- CALIBRAÇÃO (0-10) ---------------- */
function Calibracao({ nome, onSubmit }: { nome: string; onSubmit: (n: number) => void }) {
  useEffect(() => {
    track("calibracao_view");
  }, []);
  const displayName = nome || "Você";
  return (
    <section className="shadow-elevated ring-hairline rounded-3xl bg-card p-7">
      <p className="text-center text-[11px] font-bold uppercase tracking-[0.18em] text-gold">
        Sem pensar muito
      </p>
      <h2 className="font-display mt-2 text-center text-[1.7rem] font-semibold leading-tight text-foreground">
        {displayName}, de <span className="text-gold-foil">0 a 10</span>,
        quanto você sentiu a mudança agora?
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-center text-[13px] leading-relaxed text-muted-foreground">
        Responda com o que veio primeiro — a mente que responde rápido é a mais verdadeira.
      </p>

      <div className="mt-7 grid grid-cols-6 gap-2 sm:grid-cols-11">
        {Array.from({ length: 11 }, (_, i) => i).map((n) => (
          <button
            key={n}
            onClick={() => onSubmit(n)}
            className="hm-fade-up bg-navy-grad group flex aspect-square items-center justify-center rounded-xl text-lg font-bold text-white shadow-card ring-1 ring-gold/25 transition hover:-translate-y-0.5 hover:ring-gold/70 active:scale-95"
            style={{ animationDelay: `${n * 40}ms` }}
          >
            {n}
          </button>
        ))}
      </div>

      <div className="mt-6 flex justify-between text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        <span>nada</span>
        <span>muito forte</span>
      </div>
    </section>
  );
}

function Bridge({ onNext, musicaUrl, nota }: { onNext: () => void; musicaUrl?: string | null; nota: number | null }) {
  const [left, setLeft] = useState(15);
  useEffect(() => {
    track("funnel_bridge_view", { nota: nota ?? -1 });
    const iv = setInterval(() => setLeft((l) => (l > 0 ? l - 1 : 0)), 1000);
    return () => clearInterval(iv);
  }, [nota]);
  const ready = left <= 0;
  const handleClick = () => {
    track("funnel_bridge_cta_click");
    onNext();
  };
  // (audio de validacao do Hugo aqui foi REMOVIDO — Hugo ja fala bastante na Experiencia+Calibracao;
  // o `nota` continua sendo capturado no PostHog pra segmentar copy/CTAs no futuro se necessario)
  void nota; // evita 'unused' warning; ja e usado no track do useEffect

  return (
    <>
      {/* musica da pessoa continua tocando de fundo, se estiver disponivel */}
      <DiagBgm musicaUrl={musicaUrl} />
      <section className="shadow-elevated ring-hairline rounded-3xl bg-card p-7">
      <div className="flex justify-center">
        <Image
          src="/images/hms-logo-h.webp"
          alt="Heranças da Mentalidade do Sucesso"
          width={820}
          height={82}
          className="h-auto w-full max-w-[280px]"
        />
      </div>
      <div className="mt-6 space-y-4 text-[17px] leading-relaxed text-foreground/85">
        <p className="font-display text-xl font-semibold text-foreground">
          Você sentiu a frequência agir dentro de você.
        </p>
        <p>
          Agora eu vou te mostrar <strong className="text-foreground">exatamente por que essa
          herança foi instalada</strong> — e o que fazer pra remover ela pra sempre.
        </p>
        <p className="font-semibold text-foreground">Assista o próximo vídeo. Ele muda tudo.</p>
      </div>

      <div className="mt-7">
        {ready ? (
          <div className="hm-fade-up">
            <PrimaryButton onClick={handleClick}>Assistir ao vídeo</PrimaryButton>
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
    </>
  );
}

export { PrimaryButton };
