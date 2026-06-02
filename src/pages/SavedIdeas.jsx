import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { Bookmark, Loader2, GitCompare, X, Download } from "lucide-react";
import IdeaCard from "@/components/ui/IdeaCard";
import UpgradeModal from "@/components/ui/UpgradeModal";
import IdeaCompareView from "@/components/ui/IdeaCompareView";

export default function SavedIdeas() {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [activeFilter, setActiveFilter] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showCompare, setShowCompare] = useState(false);

  const { data: savedIdeas = [], isLoading } = useQuery({
    queryKey: ["savedIdeas", currentUser?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saved_ideas")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
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

  const PRESET_TAGS = ["High Potential", "In Progress", "Researching", "Validated", "On Hold"];
  const TAG_COLORS = {
    "High Potential": "bg-emerald-100 text-emerald-700 border-emerald-200",
    "In Progress":    "bg-blue-100 text-blue-700 border-blue-200",
    "Researching":    "bg-amber-100 text-amber-700 border-amber-200",
    "Validated":      "bg-purple-100 text-purple-700 border-purple-200",
    "On Hold":        "bg-rose-100 text-rose-700 border-rose-200",
  };

  const filteredIdeas = activeFilter
    ? savedIdeas.filter((idea) => (idea.tags || []).includes(activeFilter))
    : savedIdeas;

  const selectedIdeas = savedIdeas.filter((idea) => selectedIds.includes(idea.id));

  const handleExportCSV = () => {
    const headers = ["Idea Name", "Niche", "Problem", "Solution", "Target Market", "Pricing Model", "Tech Stack", "MVP Weeks", "Difficulty", "Tags", "Notes"];
    const rows = savedIdeas.map((idea) => [
      idea.idea_name,
      idea.niche,
      idea.problem,
      idea.solution,
      idea.target_market,
      idea.pricing_model,
      idea.tech_stack,
      idea.mvp_weeks,
      idea.difficulty,
      (idea.tags || []).join(", "),
      idea.notes || "",
    ].map((val) => `"${String(val ?? "").replace(/"/g, '""')}"`));

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ideaspark_saved_ideas_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((i) => i !== id)
        : prev.length < 3
        ? [...prev, id]
        : prev
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
      {showCompare && (
        <IdeaCompareView
          ideas={selectedIdeas}
          onClose={() => setShowCompare(false)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-6">
        <div className="flex items-center gap-2">
          <Bookmark className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-extrabold text-foreground">Saved Ideas</h1>
          {savedIdeas.length > 0 && (
            <span className="ml-1 text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {savedIdeas.length}
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {savedIdeas.length > 0 && (
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card text-sm font-semibold text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          )}

        {/* Compare button — appears when 2-3 selected */}
        {selectedIds.length >= 2 && (
          <button
            onClick={() => setShowCompare(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-lg shadow-primary/25 hover:bg-primary/90 transition-colors"
          >
            <GitCompare className="h-4 w-4" />
            Compare {selectedIds.length} Ideas
          </button>
        )}
        </div>
      </div>

      {/* Select mode hint */}
      {savedIdeas.length >= 2 && selectedIds.length === 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 border border-border rounded-xl px-4 py-2.5 mb-5">
          <GitCompare className="h-3.5 w-3.5 shrink-0" />
          Tip: I-check ang 2–3 ideas para ikumpara side-by-side.
        </div>
      )}

      {/* Selected count indicator */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-xl px-4 py-2.5 mb-5">
          <span className="text-xs font-semibold text-primary">
            {selectedIds.length} / 3 ideas selected
            {selectedIds.length === 3 && " — maximum reached"}
          </span>
          <button
            onClick={() => setSelectedIds([])}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            <X className="h-3 w-3" /> Clear
          </button>
        </div>
      )}

      {/* Tag filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setActiveFilter(null)}
          className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
            activeFilter === null
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-muted text-muted-foreground border-border hover:border-primary/40"
          }`}
        >
          All
        </button>
        {PRESET_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => setActiveFilter(activeFilter === tag ? null : tag)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
              activeFilter === tag
                ? TAG_COLORS[tag] + " opacity-100 ring-1 ring-offset-1"
                : TAG_COLORS[tag] + " opacity-60 hover:opacity-100"
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {!isLoading && savedIdeas.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Bookmark className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">No saved ideas yet</h3>
          <p className="text-muted-foreground">Generate ideas and save the ones you love!</p>
        </div>
      )}

      {!isLoading && savedIdeas.length > 0 && (
        <div className="grid gap-5 md:grid-cols-2">
          {filteredIdeas.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              niche={idea.niche}
              isSaved={true}
              savedId={idea.id}
              isPro={isPro}
              savedCount={savedIdeas.length}
              isSelected={selectedIds.includes(idea.id)}
              isSelectDisabled={selectedIds.length >= 3 && !selectedIds.includes(idea.id)}
              onToggleSelect={() => toggleSelect(idea.id)}
              onSaveLimitReached={() => setShowUpgrade(true)}
              onSaveChange={() => queryClient.invalidateQueries({ queryKey: ["savedIdeas"] })}
            />
          ))}
        </div>
      )}
    </div>
  );
}