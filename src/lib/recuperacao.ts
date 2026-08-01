import { kv } from "@vercel/kv";

/**
 * Recuperação de venda — carrinho abandonado e pagamento pendente.
 *
 * COMO FUNCIONA
 *   1. O webhook do Hotmart avisa quando alguém gerou PIX/boleto e não pagou,
 *      ou abandonou o checkout. A gente enfileira essa pessoa.
 *   2. Um cron varre a fila a cada 15 min e dispara a próxima etapa da régua
 *      pra quem já "venceu" o tempo.
 *   3. Se a compra for aprovada (ou cancelada/reembolsada), sai da fila.
 *
 * ESTRUTURA NO KV (Upstash Redis)
 *   recuperacao:fila            → sorted set. score = timestamp de quando entrou.
 *                                 Permite buscar "quem entrou antes de X" em O(log n).
 *   recuperacao:{transaction}   → hash com os dados da pessoa e o que já foi enviado.
 *
 * O canal de envio (WhatsApp / e-mail / SMS) é plugável — ver enviarMensagem().
 */

export const FILA_KEY = "recuperacao:fila";
export const TTL_ITEM_SEGUNDOS = 60 * 60 * 24 * 15; // 15 dias

/* ============ Régua de recuperação ============ */

export type Etapa = {
  id: string;
  /** Minutos após a entrada na fila em que essa etapa dispara. */
  aposMinutos: number;
  /** Nome do template no WhatsApp Business (quando o canal estiver ligado). */
  template: string;
  /** Texto de referência — usado no fallback de e-mail e pra submeter o template. */
  texto: (nome: string) => string;
};

export const REGUA: Etapa[] = [
  {
    id: "e1_5min",
    aposMinutos: 5,
    template: "hmh_pix_pendente_5min",
    texto: (nome) =>
      `Oi ${nome}! Vi que você gerou o PIX pra garantir sua vaga mas o ` +
      `pagamento ainda não caiu. O código continua válido — é só finalizar ` +
      `por aqui pra não perder a vaga 👇`,
  },
  {
    id: "e2_3h",
    aposMinutos: 180,
    template: "hmh_pagamento_pendente_3h",
    texto: (nome) =>
      `${nome}, passando pra avisar: sua reserva na Imersão HMH expira hoje. ` +
      `Depois disso a vaga volta pro lote e o valor muda. Finaliza aqui 👇`,
  },
  {
    id: "e3_24h",
    aposMinutos: 1440,
    template: "hmh_pagamento_pendente_24h",
    texto: (nome) =>
      `${nome}, última chamada. Sua vaga sai da reserva em 2 horas. ` +
      `Se ainda quiser participar, é agora 👇`,
  },
];

/* ============ Tipos ============ */

export type MotivoPendencia =
  | "pix_ou_boleto_pendente"
  | "carrinho_abandonado"
  | "pagamento_expirado"
  | "outro";

export type ItemRecuperacao = {
  transaction: string;
  nome: string;
  email: string;
  telefone: string;
  motivo: MotivoPendencia;
  eventoOriginal: string;
  valor: number;
  criadoEm: number;
  /** IDs das etapas da régua já disparadas — evita mandar a mesma 2x. */
  etapasEnviadas: string[];
  /** Preenchido quando sai da fila: aprovado, cancelado, regua_concluida. */
  encerradoPor?: string;
  encerradoEm?: number;
};

/* ============ Operações na fila ============ */

export function chaveItem(transaction: string) {
  return `recuperacao:${transaction}`;
}

/** Coloca (ou atualiza) alguém na fila de recuperação. */
export async function enfileirar(item: Omit<ItemRecuperacao, "etapasEnviadas">) {
  const existente = (await kv.get(chaveItem(item.transaction))) as ItemRecuperacao | null;

  // Já está na fila — só atualiza os dados, preserva o que já foi enviado
  const registro: ItemRecuperacao = {
    ...item,
    etapasEnviadas: existente?.etapasEnviadas ?? [],
  };

  await kv.set(chaveItem(item.transaction), registro, { ex: TTL_ITEM_SEGUNDOS });
  await kv.zadd(FILA_KEY, { score: item.criadoEm, member: item.transaction });
  return registro;
}

/** Tira da fila — compra aprovada, cancelada, ou régua esgotada. */
export async function desenfileirar(transaction: string, motivo: string) {
  await kv.zrem(FILA_KEY, transaction);
  const item = (await kv.get(chaveItem(transaction))) as ItemRecuperacao | null;
  if (item) {
    await kv.set(
      chaveItem(transaction),
      { ...item, encerradoPor: motivo, encerradoEm: Date.now() },
      { ex: TTL_ITEM_SEGUNDOS }
    );
  }
  return !!item;
}

/**
 * Transactions que entraram na fila há pelo menos `minutos`.
 * Usa o score do sorted set (timestamp de entrada), então o Redis já devolve
 * filtrado — não precisa carregar a fila inteira pra memória.
 */
export async function buscarVencidos(minutos: number, limite = 200): Promise<string[]> {
  const corte = Date.now() - minutos * 60_000;
  const membros = await kv.zrange(FILA_KEY, 0, corte, {
    byScore: true,
    count: limite,
    offset: 0,
  });
  return (membros as string[]) ?? [];
}

export async function carregarItem(transaction: string): Promise<ItemRecuperacao | null> {
  return (await kv.get(chaveItem(transaction))) as ItemRecuperacao | null;
}

export async function marcarEtapaEnviada(transaction: string, etapaId: string) {
  const item = await carregarItem(transaction);
  if (!item) return null;
  if (item.etapasEnviadas.includes(etapaId)) return item;
  const atualizado: ItemRecuperacao = {
    ...item,
    etapasEnviadas: [...item.etapasEnviadas, etapaId],
  };
  await kv.set(chaveItem(transaction), atualizado, { ex: TTL_ITEM_SEGUNDOS });
  return atualizado;
}

/**
 * Qual etapa deve ser disparada agora pra esse item.
 * Retorna null quando não há nada vencido ou a régua já acabou.
 *
 * Pega sempre a ETAPA MAIS AVANÇADA vencida e ainda não enviada — assim, se o
 * cron ficar fora do ar por horas, a pessoa não recebe as 3 mensagens em sequência;
 * recebe só a mais atual.
 */
export function proximaEtapa(item: ItemRecuperacao, agora = Date.now()): Etapa | null {
  const minutosNaFila = (agora - item.criadoEm) / 60_000;
  const vencidasNaoEnviadas = REGUA.filter(
    (e) => minutosNaFila >= e.aposMinutos && !item.etapasEnviadas.includes(e.id)
  );
  if (vencidasNaoEnviadas.length === 0) return null;
  return vencidasNaoEnviadas[vencidasNaoEnviadas.length - 1];
}

/** Já passou por toda a régua? Então pode sair da fila. */
export function reguaConcluida(item: ItemRecuperacao) {
  return REGUA.every((e) => item.etapasEnviadas.includes(e.id));
}
