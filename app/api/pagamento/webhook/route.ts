import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { enviarEmailConfirmacao } from "@/lib/email";

// Chave pública oficial do AbacatePay para validação HMAC (ver skills/skills-abacatepay.md)
const ABACATEPAY_PUBLIC_KEY =
  "t9dXRhHHo3yDEj5pVDYz0frf7q6bMKyMRmxxCPIPp3RCplBfXRxqlC6ZpiWmOqj4L63qEaeUOtrCI8P0VMUgo6iIga2ri9ogaHFs0WIIywSMg0q7RmBfybe1E5XJcfC4IW3alNqym0tXoAKkzvfEjZxV6bE0oG2zJrNNYmUCKZyV0KZ3JS8Votf9EAWWYdiDkMkpbMdPggfh1EqHlVkMiTady6jOR3hyzGEHrIz2Ret0xHKMbiqkr9HS1JhNHDX9";

function verifyAbacateSignature(rawBody: string, signatureFromHeader: string): boolean {
  if (!signatureFromHeader) return false;

  const bodyBuffer = Buffer.from(rawBody, "utf8");
  const expectedSig = crypto
    .createHmac("sha256", ABACATEPAY_PUBLIC_KEY)
    .update(bodyBuffer)
    .digest("base64");

  const A = Buffer.from(expectedSig);
  const B = Buffer.from(signatureFromHeader);

  return A.length === B.length && crypto.timingSafeEqual(A, B);
}

export async function POST(request: Request) {
  // 1. Validar secret na query string
  const url = new URL(request.url);
  const webhookSecret = url.searchParams.get("webhookSecret");
  if (webhookSecret !== process.env.ABACATEPAY_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-webhook-signature") ?? "";

  // 2. Validar assinatura HMAC (pode ser pulado em dev via SKIP_WEBHOOK_VALIDATION=true)
  const skipValidation = process.env.SKIP_WEBHOOK_VALIDATION === "true";
  if (!skipValidation && !verifyAbacateSignature(rawBody, signature)) {
    console.warn("[Webhook] Assinatura inválida — requisição rejeitada");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);

  // 3. Log bruto do webhook (sempre, para auditoria)
  await supabaseAdmin.from("webhook_logs").insert({
    evento: payload.event ?? "desconhecido",
    payload,
  });

  // 4. Processar checkout.completed + PAID
  if (payload.event === "checkout.completed" && payload.data?.checkout?.status === "PAID") {
    const pedidoId = payload.data.checkout.externalId;

    const { data: pedido } = await supabaseAdmin
      .from("pedidos")
      .select("id, status")
      .eq("id", pedidoId)
      .single();

    // Idempotência — já processado, não reprocessar
    if (pedido && pedido.status !== "aprovado") {
      const { error } = await supabaseAdmin.rpc("entregar_codigos_pedido", {
        p_pedido_id: pedidoId,
      });

      if (error) {
        console.error("[Webhook] Erro ao entregar códigos:", error);
      } else {
        const emailEnviado = await enviarEmailConfirmacao(pedidoId);
        if (!emailEnviado) {
          console.error(`[Webhook] Falha ao enviar e-mail de confirmação do pedido ${pedidoId}`);
        }
      }
    }
  }

  // 5. Processar checkout.refunded
  if (payload.event === "checkout.refunded") {
    const pedidoId = payload.data?.checkout?.externalId;
    if (pedidoId) {
      await supabaseAdmin
        .from("pedidos")
        .update({ status: "reembolsado" })
        .eq("id", pedidoId);
    }
  }

  // 6. Processar checkout.disputed
  if (payload.event === "checkout.disputed") {
    const pedidoId = payload.data?.checkout?.externalId;
    if (pedidoId) {
      await supabaseAdmin
        .from("pedidos")
        .update({ status: "em_disputa" })
        .eq("id", pedidoId);
    }
  }

  // Sempre responder 200 — AbacatePay reenvia em caso de falha
  return NextResponse.json({ ok: true });
}
