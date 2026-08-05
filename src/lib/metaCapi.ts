import { createHash } from "crypto";

/**
 * Meta Conversions API — envia o Purchase direto do servidor, sem depender
 * do navegador do comprador (que pode fechar a aba, ter ad blocker, etc.).
 *
 * Usa o mesmo event_id = transaction que o pixel do navegador (PurchaseTracker.tsx)
 * já usa como eventID — o Meta deduplica os dois lados automaticamente.
 *
 * Env vars: NEXT_PUBLIC_META_PIXEL_ID (já existe), META_CAPI_ACCESS_TOKEN (novo,
 * gerado em Events Manager → Infância Herdada → Configurações → API de Conversões).
 */

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN;
const GRAPH_VERSION = "v21.0";

function sha256(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

type PurchaseCapiArgs = {
  transaction: string;
  value: number;
  email?: string;
  telefone?: string; // dígitos com DDI, sem formatação
  eventSourceUrl?: string;
};

export async function sendPurchaseCapi(args: PurchaseCapiArgs): Promise<void> {
  if (!PIXEL_ID || !ACCESS_TOKEN) {
    throw new Error("META_CAPI: NEXT_PUBLIC_META_PIXEL_ID ou META_CAPI_ACCESS_TOKEN ausente");
  }

  const userData: Record<string, string[]> = {};
  if (args.email) userData.em = [sha256(args.email)];
  if (args.telefone) userData.ph = [sha256(args.telefone)];

  const body = {
    data: [
      {
        event_name: "Purchase",
        event_time: Math.floor(Date.now() / 1000),
        event_id: args.transaction,
        action_source: "website",
        event_source_url: args.eventSourceUrl || "https://hugomiyazakiterapeuta.org/obrigado",
        user_data: userData,
        custom_data: {
          currency: "BRL",
          value: args.value,
          content_ids: ["hmh-imersao-77"],
          content_name: "Imersão HMH",
          content_type: "product",
        },
      },
    ],
  };

  const res = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
  const text = await res.text();
  if (!res.ok) throw new Error(`Meta CAPI ${res.status}: ${text.slice(0, 500)}`);
}
