import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/api/supabaseClient";
import { Check, Zap, Sparkles, Building2, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/AuthContext";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Get started and explore IdeaSpark",
    icon: Zap,
    color: "text-muted-foreground",
    features: [
      "5 idea generations total",
      "Save up to 3 ideas",
      "Basic idea details",
      "Community support",
    ],
    cta: "Current Plan",
    disabled: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$19",
    period: "/ month",
    description: "For indie hackers & solo founders",
    icon: Sparkles,
    color: "text-primary",
    popular: true,
    features: [
      "Unlimited idea generations",
      "Unlimited saved ideas",
      "Full idea breakdown",
      "Export ideas as PDF",
      "Priority support",
    ],
    cta: "Upgrade to Pro",
    // ✅ No VITE_ prefix fallback with secret value — product IDs are not secret,
    // but we still validate them server-side against env vars.
    dodoProductId: import.meta.env.VITE_DODO_PRO_PRODUCT_ID,
  },
  {
    id: "business",
    name: "Business",
    price: "$49",
    period: "/ month",
    description: "For teams & agencies",
    icon: Building2,
    color: "text-accent",
    features: [
      "Everything in Pro",
      "Up to 5 team members",
      "Team idea board",
      "Custom niche templates",
      "Dedicated support",
    ],
    cta: "Upgrade to Business",
    dodoProductId: import.meta.env.VITE_DODO_BUSINESS_PRODUCT_ID,
  },
];

export default function Pricing() {
  const { currentUser } = useAuth();

  const { data: subscriptions = [] } = useQuery({
    queryKey: ["mySubscription", currentUser?.email],
    queryFn: async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_email", currentUser?.email)
        .eq("status", "active");
      return data || [];
    },
    enabled: !!currentUser?.email,
  });

  const activePlan = subscriptions[0]?.plan || "free";

  const handleCheckout = async (plan) => {
    if (!plan.dodoProductId || plan.dodoProductId.startsWith("YOUR_")) {
      alert("Payment not configured. Please contact support.");
      return;
    }

    if (!currentUser) {
      alert("Please log in to upgrade.");
      return;
    }

    // ✅ Get the current session token to authenticate the serverless function
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.access_token) {
      alert("Session expired. Please log in again.");
      return;
    }

    const returnUrl = `${window.location.origin}/payment-success?plan=${plan.id}`;

    try {
      const response = await fetch("/.netlify/functions/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type":  "application/json",
          // ✅ Send auth token — server verifies this before creating checkout
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          productId: plan.dodoProductId,
          // ✅ Don't send userEmail/userName — server reads these from the token
          returnUrl,
        }),
      });

      if (response.status === 401) {
        alert("Authentication failed. Please log in again.");
        return;
      }

      if (response.status === 429) {
        alert("Too many requests. Please wait a moment and try again.");
        return;
      }

      const session_data = await response.json();
      if (session_data.checkout_url) {
        window.location.href = session_data.checkout_url;
      } else {
        alert("Could not create checkout session. Please try again.");
        console.error("Checkout error:", session_data);
      }
    } catch (e) {
      console.error("Checkout failed:", e);
      alert("Checkout failed. Please try again.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
      <div className="text-center mb-14">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
          <Crown className="h-3.5 w-3.5" />
          Simple, transparent pricing
        </div>
        <h1 className="text-4xl font-extrabold text-foreground tracking-tight mb-4">
          Invest in your next big idea
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Start free, upgrade when you're ready. No hidden fees, cancel anytime.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {PLANS.map((plan) => {
          const Icon = plan.icon;
          const isCurrent = activePlan === plan.id;
          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl border p-8 flex flex-col transition-all duration-300 ${
                plan.popular
                  ? "border-primary shadow-lg shadow-primary/10 bg-card"
                  : "border-border bg-card hover:border-primary/30"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-3 py-0.5 text-xs font-semibold">
                    Most Popular
                  </Badge>
                </div>
              )}
              <div className="mb-6">
                <div className="inline-flex items-center justify-center h-11 w-11 rounded-xl bg-primary/10 mb-4">
                  <Icon className={`h-5 w-5 ${plan.color}`} />
                </div>
                <h2 className="text-xl font-bold text-foreground">{plan.name}</h2>
                <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                <div className="flex items-baseline gap-1 mt-4">
                  <span className="text-4xl font-extrabold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-foreground">
                    <Check className="h-4 w-4 text-primary shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => !isCurrent && !plan.disabled && handleCheckout(plan)}
                disabled={isCurrent || plan.disabled}
                className={`w-full rounded-xl font-semibold ${plan.popular ? "shadow-lg shadow-primary/25" : ""}`}
                variant={plan.popular ? "default" : "outline"}
              >
                {isCurrent ? "✓ Current Plan" : plan.cta}
              </Button>
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-muted-foreground mt-10">
        Payments are securely processed by{" "}
        <a href="https://dodopayments.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
          Dodo Payments
        </a>
        . Cancel anytime from your account settings.
      </p>
    </div>
  );
}