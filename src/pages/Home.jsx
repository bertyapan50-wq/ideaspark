import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { Lightbulb, Loader2 } from "lucide-react";
import HeroSection from "@/components/ui/HeroSection";
import GenerateForm from "@/components/ui/GenerateForm";
import IdeaCard from "@/components/ui/IdeaCard";
import UpgradeModal from "@/components/ui/UpgradeModal";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const FREE_LIMIT = 5;

async function generateIdeasFromGroq(niche) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      max_tokens: 2000,
      messages: [
        {
          role: "system",
          content: `You are a SaaS idea generator. Return ONLY valid JSON array, no markdown, no explanation.`,
        },
        {
          role: "user",
          content: `Generate 4 SaaS ideas for the "${niche}" niche. Return a JSON array with exactly this structure:
[{
  "idea_name": "string",
  "problem": "string",
  "solution": "string",
  "target_market": "string",
  "pricing_model": "string",
  "tech_stack": "string",
  "mvp_weeks": number,
  "difficulty": "Easy" | "Medium" | "Hard"
}]`,
        },
      ],
    }),
  });

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || "[]";
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

export default function Home() {
  const [ideas, setIdeas] = useState([]);
  const [currentNiche, setCurrentNiche] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();

  const { data: savedIdeas = [] } = useQuery({
    queryKey: ["savedIdeas", currentUser?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("saved_ideas")
        .select("*")
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!currentUser?.id,
  });

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

  const isPro = subscriptions.length > 0;
  const generationCount = parseInt(localStorage.getItem("Conceptli_genCount") || "0");

  const handleGenerate = async (niche) => {
    if (!isPro && generationCount >= FREE_LIMIT) {
      setShowUpgrade(true);
      return;
    }
    setIsLoading(true);
    setCurrentNiche(niche);
    try {
      const generated = await generateIdeasFromGroq(niche);
      setIdeas(generated);
      localStorage.setItem("Conceptli_genCount", String(generationCount + 1));
    } catch (err) {
      console.error("Generation error:", err);
      alert("Failed to generate ideas. Check your Groq API key.");
    }
    setIsLoading(false);
  };

  const isSaved = (ideaName) => savedIdeas.some((s) => s.idea_name === ideaName);
  const getSavedId = (ideaName) => savedIdeas.find((s) => s.idea_name === ideaName)?.id;

  return (
    <div>
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
      <HeroSection />
      <GenerateForm
  onGenerate={handleGenerate}
  isLoading={isLoading}
  hasResults={ideas.length > 0}
  onSurpriseMe={(randomNiche) => handleGenerate(randomNiche)}
/>

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Loader2 className="h-7 w-7 text-primary animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-foreground font-semibold">Analyzing real pain points…</p>
            <p className="text-sm text-muted-foreground mt-1">Finding validated opportunities in your niche</p>
          </div>
        </div>
      )}

      {!isLoading && ideas.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
          <div className="flex items-center gap-2 mb-6">
            <Lightbulb className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-bold text-foreground">
              {ideas.length} ideas for <span className="text-primary">{currentNiche}</span>
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {ideas.map((idea, i) => (
              <IdeaCard
                key={`${idea.idea_name}-${i}`}
                idea={idea}
                niche={currentNiche}
                isSaved={isSaved(idea.idea_name)}
                savedId={getSavedId(idea.idea_name)}
                onSaveChange={() => queryClient.invalidateQueries({ queryKey: ["savedIdeas"] })}
              isPro={isPro}
              savedCount={savedIdeas.length}
              onSaveLimitReached={() => setShowUpgrade(true)}
              />
            ))}
          </div>
        </div>
      )}

      {!isLoading && ideas.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
          <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mb-6">
            <Lightbulb className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">Every billion-dollar company started with a single idea</h3>
          <p className="text-muted-foreground max-w-md">
            Enter a niche above and let AI discover validated SaaS opportunities — backed by real pain points, not guesswork.
          </p>
        </div>
      )}
    </div>
  );
}
