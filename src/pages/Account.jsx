import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { Crown, Bookmark, Zap, Sparkles, User, CheckCircle2, Link } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link as RouterLink } from "react-router-dom";

const FREE_SAVE_LIMIT = 3;
const FREE_GEN_LIMIT = 5;

export default function Account() {
  const { currentUser } = useAuth();

  const { data: savedIdeas = [] } = useQuery({
    queryKey: ["savedIdeas", currentUser?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("saved_ideas")
        .select("id")
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!currentUser?.id,
  });

  const { data: subscriptions = [], isLoading: isLoadingSub } = useQuery({
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

  const isPro = subscriptions.length > 0;
  const activeSub = subscriptions[0];
  const savedCount = savedIdeas.length;
  const genCount = parseInt(localStorage.getItem("Conceptli_genCount") || "0");

  const saveUsedPct = isPro ? 100 : Math.min((savedCount / FREE_SAVE_LIMIT) * 100, 100);
  const genUsedPct = isPro ? 100 : Math.min((genCount / FREE_GEN_LIMIT) * 100, 100);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="flex items-center gap-3 mb-10">
        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <User className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">My Account</h1>
          <p className="text-sm text-muted-foreground">{currentUser?.email}</p>
        </div>
      </div>

      {/* Subscription Status Card */}
      <div className={`rounded-2xl border p-6 mb-6 ${isPro ? "border-primary/30 bg-primary/5" : "border-border bg-card"}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {isPro ? (
              <Sparkles className="h-5 w-5 text-primary" />
            ) : (
              <Zap className="h-5 w-5 text-muted-foreground" />
            )}
            <h2 className="text-lg font-bold text-foreground">
              {isPro ? `Pro Plan` : "Free Plan"}
            </h2>
          </div>
          <Badge
            variant="outline"
            className={isPro
              ? "border-primary/40 text-primary bg-primary/10 font-semibold"
              : "border-border text-muted-foreground font-semibold"
            }
          >
            {isPro ? "● Active" : "Free"}
          </Badge>
        </div>

        {isPro && activeSub ? (
          <div className="space-y-1 text-sm text-muted-foreground">
            {activeSub.plan && (
              <p>Plan: <span className="text-foreground font-medium capitalize">{activeSub.plan}</span></p>
            )}
            {activeSub.created_at && (
              <p>Member since: <span className="text-foreground font-medium">
                {new Date(activeSub.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              </span></p>
            )}
            <div className="flex items-center gap-1.5 mt-3 text-primary text-xs font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Unlimited generations & saves
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground mb-4">
              Upgrade to Pro for unlimited idea generations and saves.
            </p>
            <RouterLink to="/pricing">
              <Button size="sm" className="rounded-xl font-semibold shadow-sm shadow-primary/20">
                <Crown className="h-3.5 w-3.5 mr-1.5" />
                Upgrade to Pro
              </Button>
            </RouterLink>
          </div>
        )}
      </div>

      {/* Usage Stats */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
        <h2 className="text-base font-bold text-foreground">Usage</h2>

        {/* Saved Ideas */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Bookmark className="h-4 w-4 text-primary" />
              Saved Ideas
            </div>
            <span className="text-sm font-semibold text-foreground">
              {isPro ? (
                <span className="text-primary">{savedCount} saved</span>
              ) : (
                <span className={savedCount >= FREE_SAVE_LIMIT ? "text-destructive" : "text-foreground"}>
                  {savedCount} / {FREE_SAVE_LIMIT}
                </span>
              )}
            </span>
          </div>
          {!isPro && (
            <>
              <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    savedCount >= FREE_SAVE_LIMIT ? "bg-destructive" : "bg-primary"
                  }`}
                  style={{ width: `${saveUsedPct}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                {savedCount >= FREE_SAVE_LIMIT
                  ? "Save limit reached — upgrade to save more ideas"
                  : `${FREE_SAVE_LIMIT - savedCount} save${FREE_SAVE_LIMIT - savedCount === 1 ? "" : "s"} remaining`}
              </p>
            </>
          )}
          {isPro && (
            <div className="w-full h-2 rounded-full bg-primary/20 overflow-hidden">
              <div className="h-full w-full rounded-full bg-primary/40" />
            </div>
          )}
        </div>

        {/* Idea Generations */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Zap className="h-4 w-4 text-accent" />
              Idea Generations
            </div>
            <span className="text-sm font-semibold text-foreground">
              {isPro ? (
                <span className="text-primary">{genCount} generated</span>
              ) : (
                <span className={genCount >= FREE_GEN_LIMIT ? "text-destructive" : "text-foreground"}>
                  {genCount} / {FREE_GEN_LIMIT}
                </span>
              )}
            </span>
          </div>
          {!isPro && (
            <>
              <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    genCount >= FREE_GEN_LIMIT ? "bg-destructive" : "bg-accent"
                  }`}
                  style={{ width: `${genUsedPct}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                {genCount >= FREE_GEN_LIMIT
                  ? "Generation limit reached — upgrade to generate more"
                  : `${FREE_GEN_LIMIT - genCount} generation${FREE_GEN_LIMIT - genCount === 1 ? "" : "s"} remaining`}
              </p>
            </>
          )}
          {isPro && (
            <div className="w-full h-2 rounded-full bg-primary/20 overflow-hidden">
              <div className="h-full w-full rounded-full bg-primary/40" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
