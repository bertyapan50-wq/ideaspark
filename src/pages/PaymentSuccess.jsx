import { useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { CheckCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const plan = searchParams.get("plan") || "pro";
  const { currentUser } = useAuth();

  useEffect(() => {
    // Save subscription to Supabase
    if (currentUser?.email) {
      supabase.from("subscriptions").upsert({
        user_id: currentUser.id,
        user_email: currentUser.email,
        plan,
        status: "active",
      }, { onConflict: "user_email" });
    }
  }, [currentUser, plan]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="h-20 w-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
          <CheckCircle className="h-10 w-10 text-green-500" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-foreground mb-2">Payment Successful! 🎉</h1>
          <p className="text-muted-foreground">
            Welcome to <strong className="text-primary capitalize">{plan}</strong>! You now have unlimited access to IdeaSpark.
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link to="/">
            <Sparkles className="h-4 w-4" />
            Start Generating Ideas
          </Link>
        </Button>
      </div>
    </div>
  );
}