import { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { CheckCircle, Sparkles, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PaymentSuccess() {
  const [searchParams]  = useSearchParams();
  const plan            = searchParams.get("plan") || "pro";
  const { currentUser } = useAuth();
  const navigate        = useNavigate();

  const [status, setStatus]     = useState("pending");
  const [attempts, setAttempts] = useState(0);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!currentUser?.email) return;
    let cancelled = false;

    const poll = async () => {
      const MAX_ATTEMPTS = 15;
      for (let i = 0; i < MAX_ATTEMPTS; i++) {
        if (cancelled) return;
        const { data } = await supabase
          .from("subscriptions")
          .select("plan, status")
          .eq("user_email", currentUser.email)
          .eq("status", "active")
          .maybeSingle();

        if (data) { setStatus("confirmed"); return; }
        setAttempts(i + 1);
        await new Promise((r) => setTimeout(r, 2000));
      }
      if (!cancelled) setStatus("timeout");
    };

    poll();
    return () => { cancelled = true; };
  }, [currentUser]);

  // Auto redirect after confirmed
  useEffect(() => {
    if (status !== "confirmed") return;
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(timer); navigate("/account"); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [status, navigate]);

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
              <p className="text-sm text-muted-foreground mt-3">
                Redirecting to your account in <strong>{countdown}</strong>s...
              </p>
            </div>
            <Button asChild className="gap-2">
              <Link to="/account">
                <Sparkles className="h-4 w-4" />
                Go to Account Now
              </Link>
            </Button>
          </>
        )}

        {/* Pending */}
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

        {/* Timeout */}
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
                Your account is being activated. Please refresh or check back shortly.
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => window.location.reload()}>
                Refresh
              </Button>
              <Button asChild>
                <Link to="/account">Go to Account</Link>
              </Button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}