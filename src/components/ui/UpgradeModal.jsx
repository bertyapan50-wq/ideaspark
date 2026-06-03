import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Crown, Sparkles, X } from "lucide-react";

export default function UpgradeModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card rounded-2xl border border-border p-8 max-w-md w-full relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="text-center">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-5">
            <Crown className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-extrabold text-foreground mb-2">You've hit the free limit</h2>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            Free accounts can generate up to <strong>5 idea sets</strong>. Upgrade to Pro for unlimited generations, unlimited saves, and more.
          </p>

          <div className="bg-muted/50 rounded-xl p-4 mb-6 text-left space-y-2">
            {["Unlimited idea generations", "Unlimited saved ideas", "Full idea breakdown", "Priority support"].map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm text-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                {f}
              </div>
            ))}
          </div>

          <Link to="/pricing" onClick={onClose}>
            <Button className="w-full rounded-xl font-semibold h-11 shadow-lg shadow-primary/25">
              <Crown className="h-4 w-4 mr-2" />
              See Pricing Plans
            </Button>
          </Link>
          <button
            onClick={onClose}
            className="mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
