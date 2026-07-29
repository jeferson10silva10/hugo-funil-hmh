import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/venda/status?transaction=HP123ABC
 *
 * Retorna dados da venda gravados pelo webhook do Hotmart. Usado pela /obrigado
 * pra descobrir o nome do comprador e o taskId da música Mureka.
 *
 * Nunca vaza email completo — só primeira letra + domínio (pra debug leve).
 */

type VendaKV = {
  nome?: string;
  email?: string;
  murekaTaskId?: string | null;
  valor?: number;
  evento?: string;
  recebidoEm?: number;
  murekaErro?: string;
};

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const transaction = (url.searchParams.get("transaction") || "").trim();
    if (!transaction) {
      return NextResponse.json({ error: "transaction obrigatoria" }, { status: 400 });
    }

    const venda = (await kv.get(`venda:${transaction}`)) as VendaKV | null;

    if (!venda) {
      return NextResponse.json(
        {
          found: false,
          transaction,
          msg: "venda ainda nao processada pelo webhook",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      found: true,
      transaction,
      nome: venda.nome ?? "",
      primeiroNome: (venda.nome ?? "").split(" ")[0] || "",
      murekaTaskId: venda.murekaTaskId ?? null,
      valor: venda.valor ?? 0,
      recebidoEm: venda.recebidoEm ?? null,
      temErro: !!venda.murekaErro,
      // Debug: expor mensagem do erro Mureka enquanto testamos
      murekaErro: venda.murekaErro ?? null,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "erro desconhecido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
