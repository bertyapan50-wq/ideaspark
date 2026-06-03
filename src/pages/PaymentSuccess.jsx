import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { CheckCircle, Sparkles, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * PaymentSuccess page.
 *
 * SECURITY: This page does NOT write subscription data to the database.
 * Subscriptions are ONLY activated by the dodo-webhook.js serverless function
 * after verifying the Dodo Payments webhook signature.
 *
 * This page only reads the subscription status from Supabase to show
 * the user a confirmation once the webhook has processed.
 */
export default function PaymentSuccess() {
  const [searchParams]    = useSearchParams();
  const plan              = searchParams.get("plan") || "pro";
  const { currentUser }   = useAuth();

  const [status, setStatus]   = useState("pending"); // pending | confirmed | timeout
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (!currentUser?.email) return;

    let cancelled = false;

    // Poll Supabase every 2 seconds for up to 30 seconds waiting for webhook
    const poll = async () => {
      const MAX_ATTEMPTS = 15; // 15 × 2s = 30s

      for (let i = 0; i < MAX_ATTEMPTS; i++) {
        if (cancelled) return;

        const { data } = await supabase
          .from("subscriptions")
          .select("plan, status")
          .eq("user_email", currentUser.email)
          .eq("status", "active")
          .maybeSingle();

        if (data) {
          setStatus("confirmed");
          return;
        }

        setAttempts(i + 1);
        await new Promise((r) => setTimeout(r, 2000));
      }

      if (!cancelled) setStatus("timeout");
    };

    poll();
    return () => { cancelled = true; };
  }, [currentUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center space-y-6 max-w-md">

        {/* Confirmed */}
        {status === "confirmed" && (
          <>
            <div className="h-20 w-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-foreground mb-2">
                Payment Successful! 🎉
              </h1>
              <p className="text-muted-foreground">
                Welcome to{" "}
                <strong className="text-primary capitalize">{plan}</strong>!
                You now have full access to Conceptli.
              </p>
            </div>
            <Button asChild className="gap-2">
              <Link to="/">
                <Sparkles className="h-4 w-4" />
                Start Generating Ideas
              </Link>
            </Button>
          </>
        )}

        {/* Waiting for webhook */}
        {status === "pending" && (
          <>
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto animate-pulse">
              <Clock className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-foreground mb-2">
                Confirming your payment…
              </h1>
              <p className="text-muted-foreground text-sm">
                This usually takes just a few seconds.
                {attempts > 3 && " Hang tight, still processing…"}
              </p>
            </div>
          </>
        )}

        {/* Webhook took too long */}
        {status === "timeout" && (
          <>
            <div className="h-20 w-20 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto">
              <Clock className="h-10 w-10 text-yellow-500" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-foreground mb-2">
                Payment received!
              </h1>
              <p className="text-muted-foreground text-sm">
                Your account is being activated. This can take a minute.
                Please refresh the page or check back shortly.
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => window.location.reload()}>
                Refresh
              </Button>
              <Button asChild>
                <Link to="/">Go to App</Link>
              </Button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
