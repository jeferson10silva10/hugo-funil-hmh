"use client";

import { useEffect, useRef } from "react";
import { track } from "@/lib/analytics";

/**
 * Dispara um evento UMA ÚNICA VEZ quando o elemento entra de fato na tela.
 *
 * Por que existe: `funnel_vsl_offer_unlock` só diz que o TIMER liberou a oferta —
 * não que a pessoa rolou a página até ver o preço. Sem isso, não dá pra separar
 * "não viu o preço" de "viu o preço e não quis pagar", que são problemas
 * completamente diferentes (o primeiro é de página, o segundo é de oferta).
 *
 * Uso:
 *   const ref = useVisivelUmaVez<HTMLDivElement>("funnel_oferta_visivel", { preco: 197 });
 *   <div ref={ref}> ...card de preço... </div>
 */
export function useVisivelUmaVez<T extends HTMLElement>(
  evento: string,
  props: Record<string, string | number | boolean> = {},
  /** Fração do elemento que precisa estar visível pra contar. */
  threshold = 0.5
) {
  const ref = useRef<T | null>(null);
  const jaDisparou = useRef(false);
  // Congela as props na primeira render — evita que um objeto novo a cada
  // render recrie o observer e re-dispare o evento.
  const propsRef = useRef(props);

  useEffect(() => {
    const el = ref.current;
    if (!el || jaDisparou.current) return;

    // Navegador sem IntersectionObserver: dispara na hora, melhor que perder o dado
    if (typeof IntersectionObserver === "undefined") {
      jaDisparou.current = true;
      track(evento, propsRef.current);
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !jaDisparou.current) {
            jaDisparou.current = true;
            track(evento, propsRef.current);
            obs.disconnect();
          }
        }
      },
      { threshold }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [evento, threshold]);

  return ref;
}
