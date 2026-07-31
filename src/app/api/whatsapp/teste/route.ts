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
export async function GET(req: Request) {
  const url = new URL(req.url);
  const hottok = url.searchParams.get("hottok");
  const expected = process.env.HOTMART_HOTTOK;
  if (!expected || hottok !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const to = url.searchParams.get("to") || "";
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
