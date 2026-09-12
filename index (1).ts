import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PLANOS: Record<string, { nome: string; selo: string }> = {
  ESSENCE: { nome: "LUX-ESSENCE", selo: "ESSENCE" },
  DESFIRE: { nome: "LUX-DESFIRE", selo: "VERIFICADO" },
  ELITE: { nome: "LUX-ELITE", selo: "ELITE" },
  ROYAL: { nome: "LUX-ROYAL", selo: "ROYAL" },
};

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-signature, x-request-id",
  "Content-Type": "application/json",
};

async function hmac(secret: string, message: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: cors });
}

function normalizeStatus(status: string | undefined): "approved" | "rejected" | "pending" | "cancelled" | "paused" {
  if (status === "approved" || status === "authorized") return "approved";
  if (status === "rejected") return "rejected";
  if (status === "cancelled" || status === "canceled") return "cancelled";
  if (status === "paused") return "paused";
  return "pending";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ ok: true });

  try {
    const url = new URL(req.url);
    const body = await req.json().catch(() => ({}));
    const type = body?.type || body?.topic || url.searchParams.get("type") || url.searchParams.get("topic");
    const dataId = String(body?.data?.id || url.searchParams.get("data.id") || body?.id || "");
    const requestId = req.headers.get("x-request-id") || "";
    const signature = req.headers.get("x-signature") || "";
    const secret = Deno.env.get("MERCADOPAGO_WEBHOOK_SECRET") || "";

    // Em produção, nunca aceite notificações sem validar a assinatura.
    if (!secret) return json({ error: "webhook secret ausente" }, 503);
    if (!dataId) return json({ ok: true });

    {
      const ts = (signature.match(/(?:^|,)ts=([^,]+)/) || [])[1];
      const v1 = (signature.match(/(?:^|,)v1=([^,]+)/) || [])[1];
      if (!ts || !v1) return json({ error: "invalid signature" }, 401);
      const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
      const expected = await hmac(secret, manifest);
      if (expected.toLowerCase() !== v1.toLowerCase()) return json({ error: "invalid signature" }, 401);
    }

    // O Mercado Pago pode enviar payments, subscription_preapproval e
    // subscription_authorized_payment. Cada tópico tem um endpoint próprio.
    if (!type || !dataId) return json({ ok: true });

    const token = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!token) throw new Error("MERCADOPAGO_ACCESS_TOKEN ausente");

    const secretKeys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
    const secretKey = secretKeys.default || Deno.env.get("SUPABASE_SECRET_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if(!secretKey) throw new Error("Chave secreta do Supabase não disponível.");

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      secretKey,
      {auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}},
    );

    const mpHeaders = { Authorization: `Bearer ${token}` };
    let row: any = null;
    let paymentId: string | null = null;
    let paymentStatus: string | undefined;
    let subscriptionId: string | null = null;
    let subscriptionStatus: string | undefined;

    if (type === "payment") {
      const response = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(dataId)}`, { headers: mpHeaders });
      const payment = await response.json();
      if (!response.ok) throw new Error("Falha ao consultar pagamento no Mercado Pago");

      paymentId = String(payment.id);
      paymentStatus = payment.status;
      subscriptionId = payment?.metadata?.preapproval_id || payment?.preapproval_id || null;
      const external = payment.external_reference;

      if (external) {
        const result = await sb.from("pagamentos_planos").select("*").eq("external_reference", external).maybeSingle();
        row = result.data;
      }

      if (!row && subscriptionId) {
        const result = await sb.from("pagamentos_planos").select("*").eq("mp_subscription_id", String(subscriptionId)).order("created_at", { ascending: false }).limit(1).maybeSingle();
        row = result.data;
      }
    } else if (type === "subscription_preapproval") {
      subscriptionId = dataId;
      const response = await fetch(`https://api.mercadopago.com/preapproval/${encodeURIComponent(subscriptionId)}`, { headers: mpHeaders });
      const subscription = await response.json();
      if (!response.ok) throw new Error("Falha ao consultar assinatura no Mercado Pago");

      subscriptionStatus = subscription.status;
      const external = subscription.external_reference;
      const result = external
        ? await sb.from("pagamentos_planos").select("*").eq("external_reference", external).maybeSingle()
        : await sb.from("pagamentos_planos").select("*").eq("mp_subscription_id", subscriptionId).order("created_at", { ascending: false }).limit(1).maybeSingle();
      row = result.data;
    } else if (type === "subscription_authorized_payment") {
      const response = await fetch(`https://api.mercadopago.com/authorized_payments/${encodeURIComponent(dataId)}`, { headers: mpHeaders });
      const invoice = await response.json();
      if (!response.ok) throw new Error("Falha ao consultar cobrança recorrente no Mercado Pago");

      subscriptionId = invoice?.preapproval_id ? String(invoice.preapproval_id) : null;
      paymentId = invoice?.payment?.id ? String(invoice.payment.id) : null;
      paymentStatus = invoice?.payment?.status;

      if (subscriptionId) {
        const result = await sb.from("pagamentos_planos").select("*").eq("mp_subscription_id", subscriptionId).order("created_at", { ascending: false }).limit(1).maybeSingle();
        row = result.data;
      }
    } else {
      // Outros tópicos não alteram benefícios do usuário.
      return json({ ok: true });
    }

    if (!row) return json({ ok: true });

    const normalized = subscriptionStatus
      ? normalizeStatus(subscriptionStatus)
      : normalizeStatus(paymentStatus);

    const paymentUpdate: Record<string, unknown> = {
      status: normalized,
      updated_at: new Date().toISOString(),
    };
    if (paymentId) paymentUpdate.mp_payment_id = paymentId;
    if (subscriptionId) paymentUpdate.mp_subscription_id = subscriptionId;

    await sb.from("pagamentos_planos").update(paymentUpdate).eq("id", row.id);

    const plan = PLANOS[row.plano_codigo];
    if (!plan) return json({ ok: true });

    // Benefício premium só fica ativo quando a assinatura/pagamento está autorizado/aprovado.
    if (normalized === "approved") {
      await sb.from("modelo_perfis").update({
        plano_codigo: row.plano_codigo,
        plano_nome: plan.nome,
        plano_status: "ativo",
        selo_codigo: plan.selo,
        plano_inicio: row.plano_inicio || new Date().toISOString(),
        // A assinatura é recorrente; o webhook mantém o benefício sincronizado.
        plano_expira_em: null,
        mp_subscription_id: subscriptionId || row.mp_subscription_id,
        atualizado_em: new Date().toISOString(),
      }).eq("id", row.modelo_id);
    } else if (normalized === "paused") {
      await sb.from("modelo_perfis").update({
        plano_status: "pausado",
        atualizado_em: new Date().toISOString(),
      }).eq("id", row.modelo_id);
    } else if (normalized === "cancelled" || normalized === "rejected") {
      await sb.from("modelo_perfis").update({
        plano_codigo: "ESSENCE",
        plano_nome: "LUX-ESSENCE",
        plano_status: "ativo",
        selo_codigo: "ESSENCE",
        plano_expira_em: null,
        mp_subscription_id: null,
        atualizado_em: new Date().toISOString(),
      }).eq("id", row.modelo_id);
    }

    return json({ ok: true });
  } catch (error) {
    console.error("LUX Mercado Pago webhook:", error);
    return json({ error: error instanceof Error ? error.message : "Erro interno" }, 500);
  }
});
