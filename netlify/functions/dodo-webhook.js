export default async (req) => {
  const payload = await req.json();
  const eventType = payload.type;

  if (eventType === "payment.succeeded" || eventType === "subscription.active") {
    const email = payload.data?.customer?.email;
    const plan = payload.data?.product_cart?.[0]?.product_id?.includes("business") ? "business" : "pro";

    if (email) {
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(
        process.env.VITE_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      await supabase.from("subscriptions").upsert({
        user_email: email,
        plan,
        status: "active",
      }, { onConflict: "user_email" });
    }
  }

  return new Response("ok", { status: 200 });
};

export const config = { path: "/api/dodo-webhook" };