import crypto from "crypto";

/**
 * Verifies the Dodo Payments webhook signature.
 * Dodo uses Svix for webhook delivery — signature is in headers:
 *   svix-id, svix-timestamp, svix-signature
 */
function verifyDodoSignature(req, rawBody) {
  const webhookSecret = process.env.DODO_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error("Missing DODO_WEBHOOK_SECRET environment variable");
  }

  const svixId        = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    throw new Error("Missing Svix signature headers");
  }

  // Replay attack protection — reject webhooks older than 5 minutes
  const now = Math.floor(Date.now() / 1000);
  const ts  = parseInt(svixTimestamp, 10);
  if (Math.abs(now - ts) > 300) {
    throw new Error("Webhook timestamp too old — possible replay attack");
  }

  // Build the signed content: "<svix-id>.<svix-timestamp>.<raw-body>"
  const signedContent = `${svixId}.${svixTimestamp}.${rawBody}`;

  // The secret comes as "whsec_<base64>" — strip the prefix and decode
  const secretBytes = Buffer.from(
    webhookSecret.startsWith("whsec_")
      ? webhookSecret.slice(6)
      : webhookSecret,
    "base64"
  );

  const expectedSig = crypto
    .createHmac("sha256", secretBytes)
    .update(signedContent)
    .digest("base64");

  // svix-signature can be a space-separated list of "v1,<sig>" values
  const signatures = svixSignature.split(" ");
  const isValid = signatures.some((s) => {
    const [, sigValue] = s.split(",");
    return sigValue && crypto.timingSafeEqual(
      Buffer.from(sigValue),
      Buffer.from(expectedSig)
    );
  });

  if (!isValid) {
    throw new Error("Invalid webhook signature");
  }
}

/**
 * Maps a Dodo product ID to a plan name using env vars — never trust
 * product ID strings that contain the word "business" etc.
 */
function getPlanFromProductId(productId) {
  if (!productId) return null;
  if (productId === process.env.DODO_BUSINESS_PRODUCT_ID) return "business";
  if (productId === process.env.DODO_PRO_PRODUCT_ID)      return "pro";
  return null;
}

export default async (req) => {
  // Only accept POST
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Read raw body ONCE (needed for signature verification)
  let rawBody;
  try {
    rawBody = await req.text();
  } catch {
    return new Response("Could not read request body", { status: 400 });
  }

  // ✅ Verify signature before doing ANYTHING else
  try {
    verifyDodoSignature(req, rawBody);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return new Response("Unauthorized", { status: 401 });
  }

  // Parse payload after verification
  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid JSON payload", { status: 400 });
  }

  const eventType = payload.type;
  console.log("Dodo webhook received:", eventType);

  // Handle payment / subscription activation
  if (
    eventType === "payment.succeeded" ||
    eventType === "subscription.active"
  ) {
    const email     = payload.data?.customer?.email;
    const productId = payload.data?.product_cart?.[0]?.product_id;
    const plan      = getPlanFromProductId(productId);

    if (!email) {
      console.error("Webhook missing customer email");
      return new Response("Missing email", { status: 400 });
    }

    if (!plan) {
      console.error("Unknown product ID in webhook:", productId);
      return new Response("Unknown product", { status: 400 });
    }

    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.SUPABASE_URL,           // ✅ no VITE_ prefix — server only
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { error } = await supabase.from("subscriptions").upsert(
      {
        user_email: email,
        plan,
        status:     "active",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_email" }
    );

    if (error) {
      console.error("Supabase upsert error:", error.message);
      return new Response("Database error", { status: 500 });
    }

    console.log(`Subscription activated: ${email} → ${plan}`);
  }

  // Handle subscription cancellation / expiry
  if (
    eventType === "subscription.cancelled" ||
    eventType === "subscription.expired"
  ) {
    const email = payload.data?.customer?.email;
    if (email) {
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      await supabase
        .from("subscriptions")
        .update({ status: "inactive", updated_at: new Date().toISOString() })
        .eq("user_email", email);

      console.log(`Subscription deactivated: ${email}`);
    }
  }

  return new Response("ok", { status: 200 });
};

