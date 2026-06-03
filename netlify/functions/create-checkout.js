import crypto from "crypto";

// Simple in-memory rate limiter (resets on function cold start)
const rateLimitMap = new Map();
const RATE_LIMIT_MAX    = 5;
const RATE_LIMIT_WINDOW = 60_000;

function isRateLimited(email) {
  const now    = Date.now();
  const record = rateLimitMap.get(email);

  if (!record || now - record.windowStart > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(email, { count: 1, windowStart: now });
    return false;
  }

  if (record.count >= RATE_LIMIT_MAX) return true;

  record.count++;
  return false;
}

async function verifySupabaseToken(authHeader) {
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Missing or malformed Authorization header");
  }

  const token = authHeader.slice(7);

  const res = await fetch(
    `${process.env.SUPABASE_URL}/auth/v1/user`,
    { headers: { Authorization: `Bearer ${token}`, apikey: process.env.SUPABASE_ANON_KEY } }
  );

  if (!res.ok) throw new Error("Invalid or expired auth token");

  const user = await res.json();
  if (!user?.email) throw new Error("Could not resolve user from token");

  return user;
}

function isAllowedProductId(productId) {
  const proId  = process.env.DODO_PRO_PRODUCT_ID;
  const bizId  = process.env.DODO_BUSINESS_PRODUCT_ID;
  const allowed = [proId, bizId].filter(Boolean);

  // TEMP DEBUG — remove after confirming fix
  console.log("ENV PRO:", proId);
  console.log("ENV BIZ:", bizId);
  console.log("Received productId:", productId);
  console.log("Allowed list:", allowed);

  return allowed.includes(productId);
}

export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let verifiedUser;
  try {
    verifiedUser = await verifySupabaseToken(req.headers.get("authorization"));
  } catch (err) {
    console.error("Auth check failed:", err.message);
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { productId, returnUrl } = body;
  const userEmail = verifiedUser.email;
  const userName  = verifiedUser.user_metadata?.full_name || userEmail;

  if (!productId || !isAllowedProductId(productId)) {
    console.error("Invalid product ID:", productId);
    return new Response(JSON.stringify({ error: "Invalid product" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const parsed  = new URL(returnUrl);
    const allowed = new URL(process.env.SITE_URL || "https://yourapp.netlify.app");
    if (parsed.origin !== allowed.origin) throw new Error("Origin mismatch");
  } catch {
    return new Response(JSON.stringify({ error: "Invalid return URL" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (isRateLimited(userEmail)) {
    return new Response(JSON.stringify({ error: "Too many requests. Please wait." }), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!process.env.DODO_API_KEY) {
    return new Response(JSON.stringify({ error: "Payment service not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const response = await fetch("https://test.dodopayments.com/checkouts", {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${process.env.DODO_API_KEY}`,
      },
      body: JSON.stringify({
        product_cart: [{ product_id: productId, quantity: 1 }],
        customer: {
          email: userEmail,
          name:  userName,
        },
        return_url: returnUrl,
      }),
    });

    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    if (!response.ok) {
      console.error("Dodo API error:", response.status, text);
      return new Response(JSON.stringify({ error: "Payment provider error" }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("CREATE CHECKOUT ERROR:", err.message);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};