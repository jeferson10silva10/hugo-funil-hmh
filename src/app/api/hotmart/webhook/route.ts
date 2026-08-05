import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { generateSong, letraFrequenciaRiqueza, PROMPT_FREQUENCIA_RIQUEZA } from "@/lib/mureka";
import { enfileirar, desenfileirar, type MotivoPendencia } from "@/lib/recuperacao";
import { sendPurchaseCapi } from "@/lib/metaCapi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Webhook Hotmart — trata dois fluxos:
 *
 * 1. COMPRA APROVADA  → dispara a geração da música personalizada (Mureka) e
 *    grava a venda no KV pra /obrigado consultar. Também tira a pessoa da fila
 *    de recuperação, caso ela estivesse lá.
 *
 * 2. PENDÊNCIA (PIX/boleto não pago, carrinho abandonado) → coloca na fila de
 *    recuperação, que o cron /api/cron/recuperacao varre a cada 15 min.
 *
 * Configuração no Hotmart:
 *   URL: https://hugomiyazakiterapeuta.org/api/hotmart/webhook
 *   Versão do payload: 2.0.0
 *   Eventos: marcar TODOS os de compra (aprovada, boleto impresso, expirada,
 *            cancelada, reembolso, chargeback, carrinho abandonado)
 *
 * Env vars:
 *   HOTMART_HOTTOK           token de segurança do painel Hotmart
 *   MUREKA_API_KEY           geração de música
 *   KV_REST_API_URL/TOKEN    injetadas pelo Upstash/Vercel
 */

type HotmartV2Payload = {
  id?: string;
  event?: string;
  version?: string;
  data?: {
    buyer?: {
      name?: string;
      email?: string;
      phone?: string;
      checkout_phone?: string;
      checkout_phone_code?: string;
    };
    purchase?: {
      transaction?: string;
      status?: string;
      price?: { value?: number };
      payment?: { type?: string; billet_url?: string; pix_qrcode?: string };
      offer?: { code?: string };
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

/* Eventos que colocam a pessoa NA fila de recuperação */
const EVENTOS_PENDENCIA: Record<string, MotivoPendencia> = {
  PURCHASE_BILLET_PRINTED: "pix_ou_boleto_pendente",
  PURCHASE_OUT_OF_SHOPPING_CART: "carrinho_abandonado",
  CART_ABANDONMENT: "carrinho_abandonado",
  PURCHASE_DELAYED: "pix_ou_boleto_pendente",
  PURCHASE_EXPIRED: "pagamento_expirado",
};

/* Eventos que TIRAM a pessoa da fila (não faz sentido continuar cobrando) */
const EVENTOS_ENCERRAMENTO = new Set([
  "PURCHASE_APPROVED",
  "PURCHASE_COMPLETE",
  "PURCHASE_CANCELED",
  "PURCHASE_REFUNDED",
  "PURCHASE_CHARGEBACK",
  "PURCHASE_PROTEST",
]);

function extrairTelefone(buyer: NonNullable<HotmartV2Payload["data"]>["buyer"]): string {
  if (!buyer) return "";
  const ddi = (buyer.checkout_phone_code || "").replace(/\D/g, "");
  const numero = (buyer.checkout_phone || buyer.phone || "").replace(/\D/g, "");
  if (!numero) return "";
  // Se o DDI veio separado e o número não começa com ele, junta
  if (ddi && !numero.startsWith(ddi)) return `${ddi}${numero}`;
  return numero;
}

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const hottok =
      req.headers.get("x-hotmart-hottok") ||
      req.headers.get("hottok") ||
      url.searchParams.get("hottok");

    const expected = process.env.HOTMART_HOTTOK;
    if (expected && expected.length > 0) {
      if (!hottok || hottok !== expected) {
        console.warn("[hotmart-webhook] HOTTOK inválido ou ausente");
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
      }
    }

    const payload = (await req.json().catch(() => null)) as HotmartV2Payload | null;
    if (!payload) {
      return NextResponse.json({ error: "payload inválido" }, { status: 400 });
    }

    const evento = String(payload.event || "").toUpperCase();
    const buyer = payload.data?.buyer || {};
    const purchase = payload.data?.purchase || {};

    const nome = String(buyer.name || "").trim();
    const email = String(buyer.email || "").trim();
    const telefone = extrairTelefone(buyer);
    const transaction = String(purchase.transaction || "").trim();
    const valor = Number(purchase.price?.value || 0);

    console.log("[hotmart-webhook] recebido", {
      evento,
      transaction,
      primeiro_nome: nome.split(" ")[0] || "",
      tem_telefone: !!telefone,
      valor,
    });

    if (!transaction) {
      return NextResponse.json({ error: "transaction ausente" }, { status: 400 });
    }

    /* ---------- FLUXO 1: encerramento (aprovada, cancelada, reembolso...) ---------- */
    if (EVENTOS_ENCERRAMENTO.has(evento)) {
      await desenfileirar(transaction, evento).catch((e) =>
        console.error("[hotmart-webhook] falha ao desenfileirar", e)
      );

      // Só a compra aprovada gera música
      if (evento !== "PURCHASE_APPROVED" && evento !== "PURCHASE_COMPLETE") {
        return NextResponse.json({ ok: true, evento, saiuDaFila: true });
      }

      if (!nome || nome.length < 2) {
        return NextResponse.json({ error: "nome ausente" }, { status: 400 });
      }

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
        console.error("[hotmart-webhook] falha ao gerar musica", { transaction, murekaErro });
        // Não falha o webhook — a /obrigado tem fallback que gera on-demand
      }

      // Dispara o Purchase pro Meta direto do servidor — não depende do
      // navegador do comprador voltar pro site (pixel client-side é só reforço).
      try {
        await sendPurchaseCapi({ transaction, value: valor, email, telefone });
        console.log("[hotmart-webhook] Purchase enviado ao Meta CAPI", { transaction });
      } catch (e) {
        console.error("[hotmart-webhook] falha ao enviar Meta CAPI", {
          transaction,
          erro: e instanceof Error ? e.message : String(e),
        });
        // Não falha o webhook — a venda já foi processada
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
        evento,
        transaction,
        musicaAgendada: !!murekaTaskId,
        saiuDaFila: true,
      });
    }

    /* ---------- FLUXO 2: pendência → entra na fila de recuperação ----------
       Além dos eventos mapeados, tratamos QUALQUER compra com status de
       pagamento pendente (PIX/boleto gerado e não pago). O Hotmart nem sempre
       usa um evento dedicado pra "PIX gerado" — às vezes vem como PURCHASE_*
       com status waiting_payment. Cobrimos os dois casos. */
    const statusPurchase = String(purchase.status || "").toUpperCase();
    const tipoPagamento = String(purchase.payment?.type || "").toUpperCase();
    const pendentePorStatus =
      statusPurchase.includes("WAITING") ||
      statusPurchase.includes("PENDING") ||
      statusPurchase === "PRINTED_BILLET" ||
      statusPurchase === "PIX_EXPIRED";

    const motivo =
      EVENTOS_PENDENCIA[evento] ||
      (pendentePorStatus
        ? tipoPagamento === "PIX"
          ? "pix_ou_boleto_pendente"
          : "pix_ou_boleto_pendente"
        : undefined);

    if (motivo) {
      if (!telefone && !email) {
        console.warn("[hotmart-webhook] pendência sem contato — ignorada", { transaction });
        return NextResponse.json({ ok: true, evento, ignorado: "sem_contato" });
      }

      await enfileirar({
        transaction,
        nome: nome || "",
        email,
        telefone,
        motivo,
        eventoOriginal: evento,
        valor,
        criadoEm: Date.now(),
      });

      console.log("[hotmart-webhook] enfileirado na recuperação", { transaction, motivo });
      return NextResponse.json({ ok: true, evento, enfileirado: true, motivo });
    }

    /* ---------- Evento que não nos interessa ---------- */
    return NextResponse.json({ ok: true, ignored: evento });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "erro desconhecido";
    console.error("[hotmart-webhook] erro fatal", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// Healthcheck — facilita conferir se o deploy pegou as env vars.
// Também expõe o TOTAL de itens na fila de recuperação (só o número, sem dados
// de pessoas — não é sensível).
export async function GET() {
  let filaTotal: number | null = null;
  try {
    filaTotal = await kv.zcard("recuperacao:fila");
  } catch {
    filaTotal = null;
  }
  return NextResponse.json({
    ok: true,
    endpoint: "hotmart-webhook",
    hottokConfigurado: !!process.env.HOTMART_HOTTOK,
    whatsappConfigurado: !!(
      process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_TOKEN
    ),
    cronSecretConfigurado: !!process.env.CRON_SECRET,
    carrinhosNaFilaRecuperacao: filaTotal,
    eventosTratados: {
      encerramento: Array.from(EVENTOS_ENCERRAMENTO),
      pendencia: Object.keys(EVENTOS_PENDENCIA),
    },
  });
}
