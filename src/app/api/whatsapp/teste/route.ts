import { NextResponse } from "next/server";
import { enviarTemplate, normalizarTelefoneBR, whatsappConfigurado } from "@/lib/mensageiro";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Endpoint TEMPORÁRIO de teste do WhatsApp.
 *
 *   GET /api/whatsapp/teste?hottok=...&to=5561999999999&template=hello_world&lang=en_US
 *
 * Protegido pelo mesmo HOTMART_HOTTOK (já configurado). Serve só pra validar
 * que o token/phone number id da Cloud API funcionam de ponta a ponta.
 * REMOVER depois do teste.
 */
/** Usa o token da env pra listar os números que ele realmente acessa. */
async function listarNumerosDasWabas() {
  const token = process.env.WHATSAPP_TOKEN;
  const versao = process.env.WHATSAPP_API_VERSION || "v21.0";
  if (!token) return { erro: "sem_token" };

  // WABAs candidatas da BM - 2K descobertas no Business Manager
  const wabas = [
    { nome: "Hugo Miyazaki Suporte (+55 62)", id: "1743231383509451" },
    { nome: "GESTOR (+55 18)", id: "970188032654595" },
  ];

  const resultado: Record<string, unknown> = {};
  for (const w of wabas) {
    try {
      const r = await fetch(
        `https://graph.facebook.com/${versao}/${w.id}/phone_numbers?fields=id,display_phone_number,verified_name,quality_rating`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const texto = await r.text();
      resultado[w.nome] = r.ok ? JSON.parse(texto) : { status: r.status, erro: texto.slice(0, 200) };
    } catch (e) {
      resultado[w.nome] = { erro: e instanceof Error ? e.message : String(e) };
    }
  }
  return resultado;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const hottok = url.searchParams.get("hottok");
  const expected = process.env.HOTMART_HOTTOK;
  if (!expected || hottok !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // ?listar=1 → descobre quais números o token acessa (não envia nada)
  if (url.searchParams.get("listar")) {
    return NextResponse.json({ numeros: await listarNumerosDasWabas() });
  }

  const to = url.searchParams.get("to") || "";
  const phoneIdOverride = url.searchParams.get("phone_id");
  if (phoneIdOverride) {
    // Envio direto com um phone number id específico, sem depender da env
    const token = process.env.WHATSAPP_TOKEN;
    const versao = process.env.WHATSAPP_API_VERSION || "v21.0";
    const numeroTo = normalizarTelefoneBR(to);
    const r = await fetch(`https://graph.facebook.com/${versao}/${phoneIdOverride}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: numeroTo,
        type: "template",
        template: {
          name: url.searchParams.get("template") || "hello_world",
          language: { code: url.searchParams.get("lang") || "en_US" },
        },
      }),
    });
    const texto = await r.text();
    return NextResponse.json({ phoneId: phoneIdOverride, status: r.status, resposta: texto.slice(0, 400) });
  }

  const template = url.searchParams.get("template") || "hello_world";
  const lang = url.searchParams.get("lang") || "en_US";

  const numero = normalizarTelefoneBR(to);
  const resultado = await enviarTemplate({
    telefone: to,
    template,
    idioma: lang,
    textoReferencia: `teste ${template}`,
  });

  return NextResponse.json({
    whatsappConfigurado: whatsappConfigurado(),
    numeroNormalizado: numero,
    template,
    idioma: lang,
    resultado,
  });
}
