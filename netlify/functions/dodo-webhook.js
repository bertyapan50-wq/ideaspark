import crypto from "crypto";

function verifyDodoSignature(req, rawBody) {
  const webhookSecret = process.env.DODO_WEBHOOK_SECRET;
  if (!webhookSecret) throw new Error("Missing DODO_WEBHOOK_SECRET");

  const webhookId        = req.headers.get("webhook-id");
  const webhookTimestamp = req.headers.get("webhook-timestamp");
  const webhookSignature = req.headers.get("webhook-signature");

  if (!webhookId || !webhookTimestamp || !webhookSignature)
    throw new Error("Missing webhook signature headers");

  const now = Math.floor(Date.now() / 1000);
  const ts  = parseInt(webhookTimestamp, 10);
  if (Math.abs(now - ts) > 300)
    throw new Error("Webhook timestamp too old");

  const signedContent = `${webhookId}.${webhookTimestamp}.${rawBody}`;
  const secretBytes = Buffer.from(
    webhookSecret.startsWith("whsec_") ? webhookSecret.slice(6) : webhookSecret,
    "base64"
  );

  const expectedSig = crypto
    .createHmac("sha256", secretBytes)
    .update(signedContent)
    .digest("base64");

  const signatures = webhookSignature.split(" ");
  const isValid = signatures.some((s) => {
    const [, sigValue] = s.split(",");
    if (!sigValue) return false;
    try {
      return crypto.timingSafeEqual(Buffer.from(sigValue), Buffer.from(expectedSig));
    } catch { return false; }
  });

  if (!isValid) throw new Error("Invalid webhook signature");
}

function getPlanFromProductId(productId) {
  if (!productId) return null;
  if (productId === process.env.DODO_BUSINESS_PRODUCT_ID) return "business";
  if (productId === process.env.DODO_PRO_PRODUCT_ID) return "pro";
  return null;
}

export default async (req) => {
  if (req.method !== "POST")
    return new Response("Method not allowed", { status: 405 });

  let rawBody;
  try { rawBody = await req.text(); }
  catch { return new Response("Could not read body", { status: 400 }); }

  try { verifyDodoSignature(req, rawBody); }
  catch (err) {
    console.error("Signature verification failed:", err.message);
    return new Response("Unauthorized", { status: 401 });
  }

  let payload;
  try { payload = JSON.parse(rawBody); }
  catch { return new Response("Invalid JSON", { status: 400 }); }

  const eventType = payload.type;
  console.log("Dodo webhook received:", eventType);

  if (eventType === "payment.succeeded" || eventType === "subscription.active") {
    const email     = payload.data?.customer?.email;
    const productId = payload.data?.product_id ?? payload.data?.product_cart?.[0]?.product_id;
    const plan      = getPlanFromProductId(productId);

    if (!email) {
      console.error("Missing customer email");
      return new Response("Missing email", { status: 400 });
    }

    if (!plan) {
      console.error("Unknown product ID in webhook:", productId);
      return new Response("Unknown product", { status: 400 });
    }

    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    const { error } = await supabase.from("subscriptions").upsert(
      { user_email: email, plan, status: "active" },
      { onConflict: "user_email" }
    );

    if (error) {
      console.error("Supabase upsert error:", error.message);
      return new Response("Database error", { status: 500 });
    }

    console.log(`Subscription activated: ${email} → ${plan}`);
  }

  if (eventType === "subscription.cancelled" || eventType === "subscription.expired") {
    const email = payload.data?.customer?.email;
    if (email) {
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
      await supabase.from("subscriptions").update({ status: "inactive" }).eq("user_email", email);
      console.log(`Subscription deactivated: ${email}`);
    }
  }

  return new Response("ok", { status: 200 });
};