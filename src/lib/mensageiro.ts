/**
 * Conector de envio de mensagem — plugável.
 *
 * Hoje: se as env vars do WhatsApp não existirem, ele apenas REGISTRA o envio
 * (modo simulação) e devolve sucesso. Isso permite rodar toda a régua de
 * recuperação em produção, acumulando a base e validando os disparos, ANTES do
 * token do WhatsApp estar pronto.
 *
 * Quando as env vars chegarem, ele passa a enviar de verdade — sem mudar
 * nenhuma linha do cron nem do webhook.
 *
 * Env vars pra ativar o WhatsApp Cloud API:
 *   WHATSAPP_PHONE_NUMBER_ID  → ID do número na API (NÃO é o telefone)
 *   WHATSAPP_TOKEN            → token permanente do Usuário do Sistema
 *   WHATSAPP_API_VERSION      → opcional, default v21.0
 */

const GRAPH_BASE = "https://graph.facebook.com";

export type ResultadoEnvio = {
  ok: boolean;
  canal: "whatsapp" | "simulado";
  detalhe?: string;
  idMensagem?: string;
};

export function whatsappConfigurado() {
  return !!(process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_TOKEN);
}

/**
 * Normaliza telefone brasileiro pro formato que a Meta espera: 55DDDNNNNNNNNN.
 * Aceita entrada com +, espaços, parênteses, traços.
 * Retorna null se não conseguir montar algo plausível.
 */
export function normalizarTelefoneBR(bruto: string): string | null {
  const digitos = (bruto || "").replace(/\D/g, "");
  if (digitos.length < 10) return null;

  // Já veio com código do país
  if (digitos.startsWith("55") && (digitos.length === 12 || digitos.length === 13)) {
    return digitos;
  }
  // Veio só DDD + número
  if (digitos.length === 10 || digitos.length === 11) {
    return `55${digitos}`;
  }
  return null;
}

/**
 * Envia um template do WhatsApp. Se não estiver configurado, simula.
 *
 * `parametros` preenche as variáveis {{1}}, {{2}}... do template, na ordem.
 */
export async function enviarTemplate(args: {
  telefone: string;
  template: string;
  parametros?: string[];
  idioma?: string;
  /** Só pra log — o texto que o template representa. */
  textoReferencia?: string;
}): Promise<ResultadoEnvio> {
  const numero = normalizarTelefoneBR(args.telefone);
  if (!numero) {
    return { ok: false, canal: "simulado", detalhe: "telefone_invalido" };
  }

  if (!whatsappConfigurado()) {
    console.log("[mensageiro] SIMULADO (WhatsApp ainda não configurado)", {
      para: numero.slice(0, 4) + "****" + numero.slice(-2),
      template: args.template,
      texto: args.textoReferencia?.slice(0, 120),
    });
    return { ok: true, canal: "simulado", detalhe: "whatsapp_nao_configurado" };
  }

  const versao = process.env.WHATSAPP_API_VERSION || "v21.0";
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
  const token = process.env.WHATSAPP_TOKEN!;

  const componentes = args.parametros?.length
    ? [
        {
          type: "body",
          parameters: args.parametros.map((p) => ({ type: "text", text: p })),
        },
      ]
    : undefined;

  try {
    const res = await fetch(`${GRAPH_BASE}/${versao}/${phoneId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: numero,
        type: "template",
        template: {
          name: args.template,
          language: { code: args.idioma || "pt_BR" },
          ...(componentes ? { components: componentes } : {}),
        },
      }),
    });

    const texto = await res.text();
    if (!res.ok) {
      console.error("[mensageiro] falha WhatsApp", res.status, texto.slice(0, 300));
      return { ok: false, canal: "whatsapp", detalhe: `${res.status}: ${texto.slice(0, 200)}` };
    }

    const data = JSON.parse(texto) as { messages?: Array<{ id?: string }> };
    return {
      ok: true,
      canal: "whatsapp",
      idMensagem: data.messages?.[0]?.id,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[mensageiro] erro de rede", msg);
    return { ok: false, canal: "whatsapp", detalhe: msg };
  }
}
