import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { generateSong, letraFrequenciaRiqueza, PROMPT_FREQUENCIA_RIQUEZA } from "@/lib/mureka";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Webhook Hotmart — recebe eventos de compra e dispara geração de música.
 *
 * Configuração:
 * - URL: https://hugomiyazakiterapeuta.org/api/hotmart/webhook
 * - Versão payload: 2.0.0
 * - Eventos: PURCHASE_APPROVED (compra aprovada)
 *
 * Env vars necessárias:
 * - HOTMART_HOTTOK: token de segurança gerado no painel Hotmart
 * - MUREKA_API_KEY: já configurada
 * - KV_REST_API_URL / KV_REST_API_TOKEN: injetadas automaticamente pelo Vercel KV
 *
 * O que grava no KV (chave `venda:{transaction}`, TTL 30 dias):
 *   {
 *     nome: "Tatiany",
 *     email: "x@y.com",
 *     murekaTaskId: "...",
 *     valor: 77,
 *     evento: "PURCHASE_APPROVED",
 *     recebidoEm: 1701234567890,
 *   }
 */

type HotmartV2Payload = {
  id?: string;
  event?: string;
  version?: string;
  data?: {
    buyer?: { name?: string; email?: string };
    purchase?: {
      transaction?: string;
      status?: string;
      price?: { value?: number };
    };
    product?: { id?: number | string; name?: string };
  };
};

type VendaKV = {
  nome: string;
  email: string;
  murekaTaskId: string | null;
  valor: number;
  evento: string;
  recebidoEm: number;
  murekaErro?: string;
};

const TTL_30_DIAS_SEGUNDOS = 60 * 60 * 24 * 30;

export async function POST(req: Request) {
  try {
    // Log inicial pra debug em produção (Vercel Function Logs)
    const url = new URL(req.url);
    const hottokHeader = req.headers.get("x-hotmart-hottok") || req.headers.get("hottok");
    const hottokQuery = url.searchParams.get("hottok");
    const hottok = hottokHeader || hottokQuery;

    // Validação HOTTOK — só ativa se a env var estiver configurada
    const expected = process.env.HOTMART_HOTTOK;
    if (expected && expected.length > 0) {
      if (!hottok || hottok !== expected) {
        console.warn("[hotmart-webhook] HOTTOK inválido ou ausente", {
          recebido: hottok ? "***" : "vazio",
        });
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
      }
    }

    const payload = (await req.json().catch(() => null)) as HotmartV2Payload | null;
    if (!payload) {
      return NextResponse.json({ error: "payload inválido" }, { status: 400 });
    }

    // Extração defensiva — payload pode vir em v1 ou v2, com pequenas variações
    const evento = String(payload.event || "").toUpperCase();
    const buyer = payload.data?.buyer || {};
    const purchase = payload.data?.purchase || {};

    const nome = String(buyer.name || "").trim();
    const email = String(buyer.email || "").trim();
    const transaction = String(purchase.transaction || "").trim();
    const valor = Number(purchase.price?.value || 0);

    console.log("[hotmart-webhook] recebido", {
      evento,
      transaction,
      nome_primeiro: nome.split(" ")[0] || "",
      email_dominio: email.split("@")[1] || "",
      valor,
    });

    // Só reage a PURCHASE_APPROVED. Outros eventos (refund, cancel, etc) ignora.
    if (evento !== "PURCHASE_APPROVED") {
      return NextResponse.json({ ok: true, ignored: evento });
    }

    if (!transaction) {
      return NextResponse.json({ error: "transaction ausente" }, { status: 400 });
    }
    if (!nome || nome.length < 2) {
      return NextResponse.json({ error: "nome ausente" }, { status: 400 });
    }

    // Dispara geração de música — usa só primeiro nome
    const primeiroNome = nome.split(" ")[0] || nome;
    let murekaTaskId: string | null = null;
    let murekaErro: string | undefined;
    try {
      const task = await generateSong({
        lyrics: letraFrequenciaRiqueza(primeiroNome),
        prompt: PROMPT_FREQUENCIA_RIQUEZA,
      });
      murekaTaskId = task.id;
      console.log("[hotmart-webhook] mureka disparado", { transaction, murekaTaskId });
    } catch (e) {
      murekaErro = e instanceof Error ? e.message : String(e);
      console.error("[hotmart-webhook] falha ao gerar musica", {
        transaction,
        murekaErro,
      });
      // Não falha o webhook — grava a venda mesmo sem música, fallback na /obrigado
    }

    const venda: VendaKV = {
      nome,
      email,
      murekaTaskId,
      valor,
      evento,
      recebidoEm: Date.now(),
      ...(murekaErro ? { murekaErro } : {}),
    };

    await kv.set(`venda:${transaction}`, venda, { ex: TTL_30_DIAS_SEGUNDOS });

    return NextResponse.json({
      ok: true,
      transaction,
      musicaAgendada: !!murekaTaskId,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "erro desconhecido";
    console.error("[hotmart-webhook] erro fatal", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// GET pra healthcheck (facilita debug — Hotmart não usa)
export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "hotmart-webhook",
    aceita: "POST com payload v2.0.0 evento PURCHASE_APPROVED",
    hottokConfigurado: !!process.env.HOTMART_HOTTOK,
  });
}
