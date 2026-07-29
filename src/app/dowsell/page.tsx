"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { Sparkles, Gift, ShieldCheck, Flame } from "lucide-react";
import { track, trackMeta } from "@/lib/analytics";

/**
 * DOWNSELL 2 — Libertação da Trava Enraizada (oferta 77wy5zwx / R$397)
 * Cliente cai aqui depois de recusar UPSELL 1 (R$497).
 *
 * UX: roleta gamificada — sempre para em "20% OFF + BÔNUS AULA" (fatia 4).
 * Após parar, revela widget Sales Funnel do Hotmart pro checkout do R$397.
 *
 * Rota tem typo intencional (dowsell) pra bater com a URL configurada no
 * Hotmart Sales Funnel Widget: https://www.hugomiyazakiterapeuta.org/dowsell
 */

type Fatia = {
  label: string;
  sub?: string;
  color: string;
  textColor?: string;
  win?: boolean;
};

const FATIAS: Fatia[] = [
  { label: "5% OFF", color: "#6b7280", textColor: "#fff" }, // 0
  { label: "10% OFF", color: "#94a3b8", textColor: "#0f172a" }, // 1
  { label: "15% OFF", color: "#8b5cf6", textColor: "#fff" }, // 2
  { label: "PDF Bônus", color: "#ec4899", textColor: "#fff" }, // 3
  {
    label: "20% OFF",
    sub: "+ AULA BÔNUS",
    color: "#c89b4a",
    textColor: "#0f172a",
    win: true,
  }, // 4 ← rigged winner
  { label: "5% OFF", color: "#6b7280", textColor: "#fff" }, // 5
  { label: "10% OFF", color: "#94a3b8", textColor: "#0f172a" }, // 6
  { label: "Tente de novo", color: "#ef4444", textColor: "#fff" }, // 7
];

const WIN_INDEX = 4;
const N = FATIAS.length;
const ANGLE = 360 / N;

export default function DowsellPage() {
  const viewFired = useRef(false);

  useEffect(() => {
    if (viewFired.current) return;
    viewFired.current = true;
    track("dowsell_view", { produto: "trava_enraizada_downsell_397" });
    trackMeta("ViewContent", {
      content_ids: ["mentoria-express-downsell-397"],
      content_name: "Mentoria Express - Downsell R$397",
      content_type: "product",
      value: 397,
      currency: "BRL",
    });
  }, []);

  return (
    <>
      <main className="min-h-dvh w-full bg-background pb-16">
        <div className="mx-auto w-full max-w-2xl px-4 pt-6 sm:pt-10">
          {/* Hero */}
          <section className="text-center">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-red-600">
              <Flame className="h-3.5 w-3.5" /> Última chance — só aparece 1 vez
            </p>
            <h1 className="font-display mt-3 text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
              Espera! Eu tenho um{" "}
              <span className="text-gold-foil">último presente</span> pra você
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Você recusou a Mentoria Express. Tudo bem. Mas antes de sair,
              <br className="hidden sm:inline" /> gire a roleta abaixo e{" "}
              <strong className="text-foreground">descubra o desconto que sobrou pra você</strong>.
            </p>
          </section>

          {/* Roleta */}
          <section className="mt-8">
            <Roleta />
          </section>
        </div>
      </main>

      {/* Script Hotmart carregado no fim */}
      <Script
        src="https://checkout.hotmart.com/lib/hotmart-checkout-elements.js"
        strategy="afterInteractive"
      />
    </>
  );
}

/* =========================================================
   ROLETA — SVG 8 fatias, sempre para na fatia 4 (20% OFF)
   ========================================================= */

type Estado = "idle" | "spinning" | "landed";

function Roleta() {
  const [estado, setEstado] = useState<Estado>("idle");
  const [rotation, setRotation] = useState(0);

  const girar = () => {
    if (estado !== "idle") return;
    track("dowsell_roleta_giro", {});

    // Cálculo: ponteiro fica em 0° (topo). Cada fatia = 45°.
    // Pra parar no CENTRO da fatia WIN_INDEX, a roleta precisa rodar de forma
    // que o centro dessa fatia fique em 0°.
    // Centro da fatia i = i * 45 + 22.5
    // Roleta gira NEGATIVO (sentido anti-horário) até -centro (mod 360).
    const centerFatia = WIN_INDEX * ANGLE + ANGLE / 2; // 202.5°
    const stopAt = 360 - centerFatia; // 157.5° (giro positivo pra o ponteiro cair no centro)
    const voltas = 8; // 8 voltas cheias
    const rotFinal = voltas * 360 + stopAt;

    setEstado("spinning");
    // pequeno delay pra o setState de estado propagar antes do CSS transition
    requestAnimationFrame(() => setRotation(rotFinal));

    // duração igual ao transition CSS
    window.setTimeout(() => {
      setEstado("landed");
      track("dowsell_roleta_ganhou", { premio: "20_off_aula_bonus" });
      trackMeta("AddToCart", {
        content_ids: ["mentoria-express-downsell-397"],
        value: 397,
        currency: "BRL",
      });
    }, 5200);
  };

  return (
    <div className="flex flex-col items-center">
      {/* Container da roleta */}
      <div className="relative w-full max-w-[360px] aspect-square">
        {/* Ponteiro no topo */}
        <div className="absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-2">
          <div className="h-0 w-0 border-l-[14px] border-r-[14px] border-t-[26px] border-l-transparent border-r-transparent border-t-red-600 drop-shadow-md" />
        </div>

        {/* Anel externo dourado */}
        <div className="bg-gold-foil absolute inset-0 rounded-full p-[6px] shadow-gold">
          <div
            className="relative h-full w-full overflow-hidden rounded-full bg-black"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition:
                estado === "spinning"
                  ? "transform 5s cubic-bezier(0.17, 0.67, 0.32, 0.99)"
                  : "none",
            }}
          >
            <svg viewBox="0 0 200 200" className="h-full w-full">
              {FATIAS.map((f, i) => {
                const startAngle = i * ANGLE - 90; // -90 pra começar no topo
                const endAngle = startAngle + ANGLE;
                const midAngle = startAngle + ANGLE / 2;
                const largeArc = ANGLE > 180 ? 1 : 0;
                const x1 = 100 + 100 * Math.cos((startAngle * Math.PI) / 180);
                const y1 = 100 + 100 * Math.sin((startAngle * Math.PI) / 180);
                const x2 = 100 + 100 * Math.cos((endAngle * Math.PI) / 180);
                const y2 = 100 + 100 * Math.sin((endAngle * Math.PI) / 180);
                const textX = 100 + 62 * Math.cos((midAngle * Math.PI) / 180);
                const textY = 100 + 62 * Math.sin((midAngle * Math.PI) / 180);
                const subX = 100 + 62 * Math.cos((midAngle * Math.PI) / 180);
                const subY = 100 + 62 * Math.sin((midAngle * Math.PI) / 180) + 7;
                return (
                  <g key={i}>
                    <path
                      d={`M100,100 L${x1},${y1} A100,100 0 ${largeArc},1 ${x2},${y2} Z`}
                      fill={f.color}
                      stroke="#0f172a"
                      strokeWidth="0.5"
                    />
                    <text
                      x={textX}
                      y={f.sub ? textY : textY + 3}
                      transform={`rotate(${midAngle + 90}, ${textX}, ${textY})`}
                      textAnchor="middle"
                      fontSize="9"
                      fontWeight="800"
                      fill={f.textColor || "#0f172a"}
                    >
                      {f.label}
                    </text>
                    {f.sub && (
                      <text
                        x={subX}
                        y={subY}
                        transform={`rotate(${midAngle + 90}, ${subX}, ${subY})`}
                        textAnchor="middle"
                        fontSize="5.5"
                        fontWeight="700"
                        fill={f.textColor || "#0f172a"}
                      >
                        {f.sub}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Centro dourado */}
              <circle cx="100" cy="100" r="14" fill="#c89b4a" stroke="#0f172a" strokeWidth="1.5" />
              <circle cx="100" cy="100" r="4" fill="#0f172a" />
            </svg>
          </div>
        </div>
      </div>

      {/* Botão / Resultado */}
      <div className="mt-8 w-full">
        {estado === "idle" && (
          <button
            type="button"
            onClick={girar}
            className="hm-pulse block w-full rounded-2xl bg-gold-foil px-6 py-4 text-center text-base font-bold uppercase tracking-wide text-navy shadow-elevated hover:brightness-105 active:scale-[.99]"
          >
            🎰 GIRAR A ROLETA AGORA
          </button>
        )}

        {estado === "spinning" && (
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground animate-pulse">
              Girando... boa sorte 🍀
            </p>
          </div>
        )}

        {estado === "landed" && <Resultado />}
      </div>
    </div>
  );
}

/* =========================================================
   RESULTADO — Card de "ganhou" + Widget Hotmart embutido
   ========================================================= */

function Resultado() {
  return (
    <section className="animate-in fade-in slide-in-from-bottom-4 space-y-6 duration-700">
      {/* Card de vitória */}
      <div className="ring-hairline overflow-hidden rounded-3xl bg-card shadow-elevated">
        <div className="bg-navy-grad px-6 py-6 text-center text-white">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-gold">
            <Sparkles className="h-3.5 w-3.5" /> Parabéns!
          </p>
          <h2 className="font-display mt-2 text-2xl font-semibold leading-tight sm:text-3xl">
            Você ganhou{" "}
            <span className="text-gold-foil">20% OFF + Aula Bônus</span>
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-white/85">
            Este desconto foi liberado exclusivamente pra você
            <br className="hidden sm:inline" /> — <strong>e é único</strong>. Se sair, não volta.
          </p>
        </div>

        <div className="px-6 py-6 text-center sm:px-8">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Preço original da Mentoria
          </p>
          <p className="text-lg text-muted-foreground line-through">R$ 497,00</p>

          <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-600">
            Seu preço com o desconto
          </p>
          <p className="font-display text-5xl font-bold text-emerald-600 sm:text-6xl">
            R$ 397
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            ou 12x de <strong className="text-foreground">R$ 39,70</strong>
          </p>

          <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-gold/10 px-3 py-1.5 text-xs font-bold text-gold">
            <Gift className="h-3.5 w-3.5" /> + Aula Bônus AO VIVO exclusiva
          </p>
        </div>

        {/* Widget Hotmart */}
        <div className="border-t border-border px-6 py-6 sm:px-8">
          <p className="mb-3 text-center text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            👇 Finalize aqui embaixo
          </p>
          <div
            id="hotmart-sales-funnel"
            className="min-h-[400px] w-full overflow-hidden rounded-2xl border border-border bg-white shadow-sm"
          />
          <HotmartFunnelInit />
        </div>
      </div>

      {/* Garantia */}
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 text-center">
        <ShieldCheck className="mx-auto h-7 w-7 text-emerald-600" />
        <p className="mt-2 text-sm font-semibold text-foreground">
          Garantia de 30 dias incondicional
        </p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Não gostou? Devolvemos 100% do seu investimento. Sem perguntas.
        </p>
      </div>
    </section>
  );
}

/* =========================================================
   Inicializa widget Sales Funnel do Hotmart
   ========================================================= */
function HotmartFunnelInit() {
  useEffect(() => {
    let tries = 0;
    const tryInit = () => {
      const w = window as unknown as {
        checkoutElements?: { init: (t: string) => { mount: (sel: string) => void } };
      };
      if (w.checkoutElements) {
        try {
          w.checkoutElements.init("salesFunnel").mount("#hotmart-sales-funnel");
          track("dowsell_widget_mounted");
          return;
        } catch {
          // silencioso
        }
      }
      if (tries++ < 40) window.setTimeout(tryInit, 250);
    };
    tryInit();
  }, []);
  return null;
}
