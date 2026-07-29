"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { ShieldCheck, Sparkles, CheckCircle2, Flame, Clock } from "lucide-react";
import { track, trackMeta } from "@/lib/analytics";

const PANDA_UPSELL_SRC =
  "https://player-vz-76736fd2-919.tv.pandavideo.com.br/embed/?v=935035be-3f07-42be-9870-bf6a1b0d87ac&autoplay=1&preload=metadata";

const INCLUSOS = [
  "Treinamento Travas Enraizadas — Aulas gravadas com acesso vitalício",
  "2 Mentorias AO VIVO com Hugo Miyazaki — Microfone aberto",
  "Mentoria de Integração — Conexão com alunos do Programa Avançado",
  "Grupo VIP de Apoio — Suporte contínuo",
  "Atendimento Individual — Sessão exclusiva com consultor terapêutico",
  "Exercícios Chaves — Quebra de limites + Higiene mental",
];

const FAQ = [
  {
    q: "Posso parcelar?",
    a: "Sim. Você pode parcelar em até 12x de R$49,70 no cartão de crédito. Ou R$497 à vista.",
  },
  {
    q: "Quando começam as mentorias ao vivo?",
    a: "As datas exatas das 2 mentorias ao vivo com o Hugo são combinadas via grupo VIP após sua entrada. Todas são gravadas, então se você não puder participar ao vivo, assiste depois.",
  },
  {
    q: "E se eu não puder participar ao vivo?",
    a: "Tudo é gravado e fica disponível no seu acesso vitalício. Você não perde nada. Além disso, o Hugo responde perguntas enviadas com antecedência mesmo pra quem não pode assistir ao vivo.",
  },
  {
    q: "É diferente da Imersão que acabei de comprar?",
    a: "Sim. A Imersão HMH que você acabou de garantir é o método base — 100% gravado. A Mentoria Express te dá acesso direto ao Hugo Miyazaki, mentorias ao vivo, grupo VIP e atendimento individual pra acelerar a remoção das Heranças Mentais e travas enraizadas.",
  },
];

export default function UpsellPage() {
  const viewFired = useRef(false);

  useEffect(() => {
    if (viewFired.current) return;
    viewFired.current = true;
    track("upsell_view", { produto: "mentoria_express_trava_enraizada" });
    trackMeta("ViewContent", {
      content_ids: ["mentoria-express-trava-enraizada"],
      content_name: "Mentoria Express - Trava Enraizada",
      content_type: "product",
      value: 497,
      currency: "BRL",
    });
  }, []);

  return (
    <>
      <main className="min-h-dvh w-full bg-background pb-16">
        {/* Barra de topo — confirmação */}
        <div className="border-b border-emerald-500/30 bg-emerald-500/10 py-2 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700 sm:text-xs">
            <CheckCircle2 className="mr-1.5 inline h-3.5 w-3.5 -translate-y-[1px]" />
            Pedido HMH confirmado — Uma última mensagem
          </p>
        </div>

        <div className="mx-auto w-full max-w-2xl px-4 pt-6 sm:pt-10">
          {/* Hero de interrupção */}
          <section className="text-center">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-red-600">
              <Flame className="h-3.5 w-3.5" /> Espera! Antes de você sair
            </p>
            <h1 className="font-display mt-3 text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
              Eu preciso te fazer um <span className="text-gold-foil">convite final</span>
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Só aparece <strong>UMA vez</strong>. Assista o vídeo abaixo até o final.
            </p>
          </section>

          {/* Vídeo */}
          <section className="mt-6 sm:mt-8">
            <div className="bg-gold-foil relative -mx-4 border-y-2 border-gold shadow-gold sm:mx-0 sm:rounded-2xl sm:border-y-0 sm:p-[2px]">
              <div className="relative aspect-video w-full overflow-hidden bg-black sm:rounded-[calc(1rem-2px)]">
                <iframe
                  src={PANDA_UPSELL_SRC}
                  title="Convite final — Mentoria Express"
                  allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 h-full w-full border-0"
                />
              </div>
            </div>
            <p className="mt-3 text-center text-xs italic text-muted-foreground">
              Assista até o final para descobrir como acelerar sua transformação.
            </p>
          </section>

          {/* Oferta */}
          <section className="shadow-elevated ring-hairline mt-8 overflow-hidden rounded-3xl bg-card">
            <div className="bg-navy-grad px-6 py-6 text-center text-white">
              <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-gold">
                <Sparkles className="h-3.5 w-3.5" /> Oferta exclusiva de hoje
              </p>
              <h2 className="font-display mt-2 text-2xl font-semibold leading-tight sm:text-3xl">
                Acelere sua transformação com{" "}
                <span className="text-gold-foil">mentoria ao vivo</span>
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-white/85">
                A próxima etapa do método — agora com acesso direto ao Hugo Miyazaki
              </p>
            </div>

            <div className="px-6 py-6 sm:px-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold">
                O que está incluído
              </p>
              <ul className="mt-3 space-y-3">
                {INCLUSOS.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[14px] leading-relaxed">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span className="text-foreground/90">{item}</span>
                  </li>
                ))}
              </ul>

              {/* Preço */}
              <div className="mt-7 rounded-2xl border border-gold/30 bg-gold/5 p-5 text-center">
                <p className="text-xs text-muted-foreground line-through">
                  Valor real da mentoria: R$ 7.000
                </p>
                <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.16em] text-gold">
                  Hoje, pra quem assistiu até aqui:
                </p>
                <p className="font-display mt-2 text-4xl font-bold text-emerald-600 sm:text-5xl">
                  12x R$ 49,70
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  ou <strong className="text-foreground">R$ 497 à vista</strong>
                </p>
                <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-600">
                  <Clock className="h-3.5 w-3.5" /> Apenas 14 vagas — se esgotando
                </p>
              </div>
            </div>
          </section>

          {/* Widget Hotmart — Sales Funnel */}
          <section className="mt-8">
            <div
              id="hotmart-sales-funnel"
              className="min-h-[400px] w-full overflow-hidden rounded-2xl border border-border bg-white shadow-md"
            />
            <HotmartFunnelInit />
          </section>

          {/* Garantia */}
          <section className="mt-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 text-center">
            <ShieldCheck className="mx-auto h-8 w-8 text-emerald-600" />
            <h3 className="font-display mt-2 text-lg font-semibold text-foreground">
              Garantia de 30 dias incondicional
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Se nos primeiros 30 dias você sentir que esse método não é pra você, basta enviar um
              e-mail e devolvemos <strong>100%</strong> do seu investimento. Sem perguntas, sem
              burocracia.
            </p>
          </section>

          {/* FAQ */}
          <section className="mt-8">
            <h3 className="font-display mb-3 text-lg font-semibold text-foreground">
              Perguntas frequentes
            </h3>
            <div className="space-y-2">
              {FAQ.map((item, i) => (
                <FaqItem key={i} q={item.q} a={item.a} />
              ))}
            </div>
          </section>

          {/* Rodapé */}
          <section className="mt-10 text-center">
            <p className="text-xs text-muted-foreground">
              © Hugo Miyazaki · Método Oriental · Pagamento seguro Hotmart
            </p>
          </section>
        </div>
      </main>

      {/* Script do widget Hotmart — carrega depois do primeiro paint */}
      <Script
        src="https://checkout.hotmart.com/lib/hotmart-checkout-elements.js"
        strategy="afterInteractive"
      />
    </>
  );
}

/* Inicia o widget Sales Funnel depois que o script carrega */
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
          track("upsell_widget_mounted");
          trackMeta("AddToCart", {
            content_ids: ["mentoria-express-trava-enraizada"],
            value: 497,
            currency: "BRL",
          });
          return;
        } catch (e) {
          // silencioso
        }
      }
      if (tries++ < 40) setTimeout(tryInit, 250);
    };
    tryInit();
  }, []);
  return null;
}

/* FAQ colapsável */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="ring-hairline overflow-hidden rounded-xl bg-card">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          if (!open) track("upsell_faq_open", { pergunta: q });
        }}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold text-foreground hover:bg-muted/50"
      >
        <span>{q}</span>
        <span className="text-gold">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <p className="border-t border-border px-4 py-3 text-sm leading-relaxed text-muted-foreground">
          {a}
        </p>
      )}
    </div>
  );
}
