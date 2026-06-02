import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2, RefreshCw, Shuffle } from "lucide-react";

const RANDOM_NICHES = [
  "Fitness & Wellness", "Remote Work Tools", "Pet Care", "Personal Finance",
  "EdTech for Kids", "Food & Meal Planning", "Mental Health", "Home Improvement",
  "Freelancer Productivity", "E-commerce Automation", "Travel Planning",
  "Sustainable Living", "Creator Economy", "Legal Tech for Freelancers",
  "Language Learning", "Sleep Optimization", "Senior Care Tech", "Parenting Tools",
  "Local Business Tools", "Cybersecurity for SMBs"
];

export default function GenerateForm({ onGenerate, isLoading, hasResults, onSurpriseMe }) {
  const [niche, setNiche] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!niche.trim() || isLoading) return;
    onGenerate(niche.trim());
  };

  return (
    <div className="max-w-2xl mx-auto px-4 pb-10">
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              placeholder="e.g. Remote teams, Pet owners..."
              className="pl-12 h-13 text-base rounded-xl border-border bg-card shadow-sm focus-visible:ring-primary"
              disabled={isLoading}
            />
          </div>
          <Button
            type="submit"
            disabled={!niche.trim() || isLoading}
            className="h-13 px-6 rounded-xl font-semibold text-base shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Thinking…
              </>
            ) : hasResults ? (
              <>
                <RefreshCw className="h-5 w-5 mr-2" />
                Regenerate
              </>
            ) : (
              "Discover Ideas"
            )}
          </Button>
        </div>
      </form>
      <div className="flex justify-center mt-4">
        <button
          type="button"
          onClick={() => {
            const random = RANDOM_NICHES[Math.floor(Math.random() * RANDOM_NICHES.length)];
            setNiche(random);
            onSurpriseMe(random);
          }}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-1.5 text-sm rounded-full border border-primary/40 text-primary hover:bg-primary/10 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Shuffle className="h-3.5 w-3.5" />
          Surprise Me
        </button>
      </div>
      <div className="flex flex-wrap gap-2 mt-3 justify-center">
        {["Freelancers", "Healthcare", "Education", "Real Estate", "Fitness"].map((s) => (
          <button
            key={s}
            onClick={() => { setNiche(s); }}
            className="px-3 py-1 text-xs rounded-full bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors font-medium"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}