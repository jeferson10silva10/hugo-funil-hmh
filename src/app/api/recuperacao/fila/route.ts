import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import {
  FILA_KEY,
  carregarItem,
  proximaEtapa,
  REGUA,
  type ItemRecuperacao,
} from "@/lib/recuperacao";
import { whatsappConfigurado } from "@/lib/mensageiro";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Painel de diagnóstico da fila de recuperação.
 *
 *   GET /api/recuperacao/fila
 *
 * Mostra quem está na fila, há quanto tempo, quais etapas já receberam e qual
 * é a próxima. Serve pra confirmar que os eventos do Hotmart estão chegando,
 * sem precisar esperar 30 min pelo cron.
 *
 * Dados sensíveis (telefone, e-mail) vêm mascarados.
 * Protegido por CRON_SECRET quando a env var existir.
 */

function mascararEmail(email: string) {
  if (!email || !email.includes("@")) return "";
  const [user, dominio] = email.split("@");
  return `${user.slice(0, 2)}***@${dominio}`;
}

function mascararTelefone(tel: string) {
  const d = (tel || "").replace(/\D/g, "");
  if (d.length < 6) return "";
  return `${d.slice(0, 4)}****${d.slice(-2)}`;
}

function humanizarTempo(ms: number) {
  const min = Math.floor(ms / 60_000);
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h${min % 60 ? ` ${min % 60}min` : ""}`;
  return `${Math.floor(h / 24)}d ${h % 24}h`;
}

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const url = new URL(req.url);
    const auth = req.headers.get("authorization");
    const viaQuery = url.searchParams.get("secret");
    if (auth !== `Bearer ${secret}` && viaQuery !== secret) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  try {
    const total = await kv.zcard(FILA_KEY);
    const membros = ((await kv.zrange(FILA_KEY, 0, 49)) as string[]) ?? [];

    const agora = Date.now();
    const itens = [];
    for (const transaction of membros) {
      const item = (await carregarItem(transaction)) as ItemRecuperacao | null;
      if (!item) {
        itens.push({ transaction, erro: "item_sem_dados" });
        continue;
      }
      const etapa = proximaEtapa(item, agora);
      itens.push({
        transaction,
        primeiroNome: (item.nome || "").split(" ")[0] || "",
        email: mascararEmail(item.email),
        telefone: mascararTelefone(item.telefone),
        motivo: item.motivo,
        evento: item.eventoOriginal,
        valor: item.valor,
        naFilaHa: humanizarTempo(agora - item.criadoEm),
        etapasEnviadas: item.etapasEnviadas,
        proximaEtapa: etapa?.id ?? null,
        proximaEtapaVencida: !!etapa,
      });
    }

    return NextResponse.json({
      ok: true,
      whatsappConfigurado: whatsappConfigurado(),
      modo: whatsappConfigurado() ? "envio_real" : "simulado",
      totalNaFila: total,
      mostrando: itens.length,
      regua: REGUA.map((e) => ({ id: e.id, aposMinutos: e.aposMinutos, template: e.template })),
      itens,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "erro desconhecido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
