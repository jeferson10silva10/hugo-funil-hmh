import { NextResponse } from "next/server";
import {
  buscarVencidos,
  carregarItem,
  desenfileirar,
  marcarEtapaEnviada,
  proximaEtapa,
  reguaConcluida,
  REGUA,
} from "@/lib/recuperacao";
import { enviarTemplate, whatsappConfigurado } from "@/lib/mensageiro";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Cron de recuperação — roda a cada 15 min (ver vercel.json).
 *
 * Varre a fila, encontra quem já venceu alguma etapa da régua, dispara a
 * mensagem e marca como enviada. Quem completa a régua sai da fila.
 *
 * Enquanto o WhatsApp não estiver configurado, o mensageiro roda em modo
 * SIMULADO: registra o que teria enviado e marca a etapa como concluída.
 * Isso valida toda a mecânica em produção sem mandar nada pra ninguém.
 * (Pra não "queimar" as etapas antes do canal existir, veja SIMULACAO_MARCA_ETAPA.)
 *
 * Segurança: a Vercel manda o header `Authorization: Bearer $CRON_SECRET`
 * automaticamente quando a env var CRON_SECRET existe. Se ela não existir,
 * o endpoint aceita qualquer chamada (útil pra testar manualmente).
 */

/**
 * Em modo simulado, marcar a etapa como enviada faria a pessoa "perder" a
 * mensagem quando o WhatsApp for ligado de verdade. Como o objetivo agora é
 * acumular base e validar a mecânica, deixamos FALSE: simula, loga, mas NÃO
 * consome a etapa. Vire TRUE se quiser que a simulação avance a régua.
 */
const SIMULACAO_MARCA_ETAPA = false;

const MENOR_JANELA_MINUTOS = Math.min(...REGUA.map((e) => e.aposMinutos));

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const inicio = Date.now();
  const simulado = !whatsappConfigurado();

  const resumo = {
    simulado,
    candidatos: 0,
    enviados: 0,
    semEtapaVencida: 0,
    encerrados: 0,
    falhas: 0,
    detalhes: [] as Array<Record<string, unknown>>,
  };

  try {
    const transactions = await buscarVencidos(MENOR_JANELA_MINUTOS);
    resumo.candidatos = transactions.length;

    for (const transaction of transactions) {
      const item = await carregarItem(transaction);
      if (!item) {
        // Item expirou no KV mas ficou na fila — limpa
        await desenfileirar(transaction, "item_inexistente");
        resumo.encerrados++;
        continue;
      }

      if (reguaConcluida(item)) {
        await desenfileirar(transaction, "regua_concluida");
        resumo.encerrados++;
        continue;
      }

      const etapa = proximaEtapa(item);
      if (!etapa) {
        resumo.semEtapaVencida++;
        continue;
      }

      const primeiroNome = (item.nome || "").split(" ")[0] || "";
      const resultado = await enviarTemplate({
        telefone: item.telefone,
        template: etapa.template,
        parametros: [primeiroNome],
        textoReferencia: etapa.texto(primeiroNome || "você"),
      });

      const deveMarcar =
        resultado.ok && (resultado.canal === "whatsapp" || SIMULACAO_MARCA_ETAPA);

      if (deveMarcar) {
        await marcarEtapaEnviada(transaction, etapa.id);
        resumo.enviados++;
      } else if (!resultado.ok) {
        resumo.falhas++;
      }

      resumo.detalhes.push({
        transaction,
        etapa: etapa.id,
        motivo: item.motivo,
        canal: resultado.canal,
        ok: resultado.ok,
        marcada: deveMarcar,
        ...(resultado.detalhe ? { detalhe: resultado.detalhe } : {}),
      });

      // Se acabou de completar a régua, tira da fila
      const atualizado = await carregarItem(transaction);
      if (atualizado && reguaConcluida(atualizado)) {
        await desenfileirar(transaction, "regua_concluida");
        resumo.encerrados++;
      }
    }

    console.log("[cron-recuperacao]", {
      ...resumo,
      detalhes: undefined,
      duracaoMs: Date.now() - inicio,
    });

    return NextResponse.json({ ok: true, ...resumo, duracaoMs: Date.now() - inicio });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "erro desconhecido";
    console.error("[cron-recuperacao] erro fatal", msg);
    return NextResponse.json({ error: msg, ...resumo }, { status: 500 });
  }
}
