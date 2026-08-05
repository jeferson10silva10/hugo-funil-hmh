"use client";

import { Suspense, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { trackMeta } from "@/lib/analytics";

/**
 * Dispara o Purchase do produto principal (Imersão HMH) UMA ÚNICA VEZ por
 * transaction, não importa em qual página do pós-venda o comprador cair.
 *
 * Contexto: a URL de "Compras Aprovadas" do Hotmart aponta pra /upsell (pra pegar
 * o comprador no pico de intenção). Só que o comprador pode:
 *   - fechar no /upsell            → Purchase precisa ter disparado lá
 *   - recusar e ir pro /dowsell    → Purchase precisa ter disparado lá
 *   - chegar até /obrigado         → Purchase precisa ter disparado lá
 *
 * Se cada página disparasse por conta própria, o Meta contaria a mesma venda 3x.
 * A dedupe usa a MESMA chave de localStorage nas três (`hmh_purchase_fired_{transaction}`),
 * então só a primeira página carregada dispara — as seguintes ignoram.
 *
 * O eventID = transaction casa com o CAPI do Hotmart, então o Meta também
 * deduplica no lado dele entre pixel e servidor.
 */
export function PurchaseTracker({ valorPadrao = 77 }: { valorPadrao?: number }) {
  return (
    <Suspense fallback={null}>
      <PurchaseTrackerInner valorPadrao={valorPadrao} />
    </Suspense>
  );
}

function PurchaseTrackerInner({ valorPadrao }: { valorPadrao: number }) {
  const sp = useSearchParams();
  const jaRodou = useRef(false);

  useEffect(() => {
    if (jaRodou.current) return;
    jaRodou.current = true;
    if (typeof window === "undefined") return;

    // Hotmart anexa esses params na URL de retorno automaticamente
    const transaction = (sp.get("transaction") || "").trim();
    const valorParam = Number(sp.get("valor") || valorPadrao);
    const valor =
      Number.isFinite(valorParam) && valorParam > 0 ? valorParam : valorPadrao;

    // Sem transaction não dá pra deduplicar com segurança — não dispara,
    // evita inflar Purchase em visita orgânica/direta à página.
    if (!transaction) return;

    const key = `hmh_purchase_fired_${transaction}`;
    if (window.localStorage.getItem(key) === "1") return;

    trackMeta("Purchase", {
      value: valor,
      currency: "BRL",
      content_ids: ["6838813"],
      content_name: "Imersão HMH",
      content_type: "product",
      eventID: transaction,
    });

    window.localStorage.setItem(key, "1");
  }, [sp, valorPadrao]);

  return null;
}
