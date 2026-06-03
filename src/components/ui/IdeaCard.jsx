import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bookmark, BookmarkCheck, Target, Users, DollarSign, Code, Clock, ChevronDown, ChevronUp, Lock, Download, NotebookPen, Check, Rocket } from "lucide-react";
import { jsPDF } from "jspdf";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "sonner";
import TagSelector from "@/components/ui/TagSelector";
import BlueprintModal from "@/components/ui/BlueprintModal";

const difficultyConfig = {
  Easy: { color: "bg-emerald-100 text-emerald-700 border-emerald-200", bar: "bg-emerald-500", pct: 33 },
  Medium: { color: "bg-amber-100 text-amber-700 border-amber-200", bar: "bg-amber-500", pct: 66 },
  Hard: { color: "bg-rose-100 text-rose-700 border-rose-200", bar: "bg-rose-500", pct: 100 },
};

const FREE_SAVE_LIMIT = 3;

export default function IdeaCard({ idea, niche, isSaved, savedId, isPro, savedCount, onSaveLimitReached, isSelected, isSelectDisabled, onToggleSelect }) {
  const [expanded, setExpanded] = useState(false);
  const [tags, setTags] = useState(idea.tags || []);
  const [notes, setNotes] = useState(idea.notes || "");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);
  const [showNotes, setShowNotes] = useState(!!(idea.notes));

  const handleSaveNotes = async () => {
    if (!savedId) return;
    setIsSavingNotes(true);
    const { error } = await supabase
      .from("saved_ideas")
      .update({ notes })
      .eq("id", savedId);
    setIsSavingNotes(false);
    if (error) {
      toast.error("Failed to save notes.");
    } else {
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2000);
    }
  };
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const diff = difficultyConfig[idea.difficulty] || difficultyConfig.Medium;

  const saveIdea = useMutation({
    mutationFn: async () => {
      // Check limit before saving
      if (!isPro && savedCount >= FREE_SAVE_LIMIT) {
        onSaveLimitReached?.();
        throw new Error("LIMIT_REACHED");
      }
      const { error } = await supabase.from("saved_ideas").insert({
        user_id: user.id,
        niche,
        idea_name: idea.idea_name,
        problem: idea.problem,
        solution: idea.solution,
        target_market: idea.target_market,
        pricing_model: idea.pricing_model,
        tech_stack: idea.tech_stack,
        mvp_weeks: idea.mvp_weeks,
        difficulty: idea.difficulty,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedIdeas"] });
      toast.success("Idea saved to your collection!");
    },
    onError: (err) => {
      if (err.message !== "LIMIT_REACHED") toast.error("Failed to save idea.");
    },
  });

  const unsaveIdea = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("saved_ideas").delete().eq("id", savedId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedIdeas"] });
      toast.success("Idea removed from collection");
    },
    onError: () => toast.error("Failed to remove idea."),
  });

   const isAtLimit = !isPro && !isSaved && savedCount >= FREE_SAVE_LIMIT;
  const [showBlueprint, setShowBlueprint] = useState(false);

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;
    let y = 20;

    const addSection = (label, value) => {
      // Label
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(120, 120, 120);
      doc.text(label.toUpperCase(), margin, y);
      y += 6;

      // Value
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 30, 30);
      const lines = doc.splitTextToSize(value || "—", maxWidth);
      doc.text(lines, margin, y);
      y += lines.length * 6 + 8;

      // Check if new page needed
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    };

    // Header background
    doc.setFillColor(99, 74, 255);
    doc.roundedRect(margin, y - 4, maxWidth, 28, 4, 4, "F");

    // Difficulty badge
    const diffColors = { Easy: [16, 185, 129], Medium: [245, 158, 11], Hard: [239, 68, 68] };
    const [r, g, b] = diffColors[idea.difficulty] || diffColors.Medium;
    doc.setFillColor(255, 255, 255, 0.2);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(`${idea.difficulty}  ·  ${idea.mvp_weeks}w MVP`, margin + 4, y + 4);

    // Idea name
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    const nameLines = doc.splitTextToSize(idea.idea_name, maxWidth - 8);
    doc.text(nameLines, margin + 4, y + 12);
    y += nameLines.length * 8 + 20;

    // Niche tag
    if (niche) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(r, g, b);
      doc.text(`Niche: ${niche}`, margin, y);
      y += 12;
    }

    // Divider
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    // Sections
    addSection("Problem", idea.problem);
    addSection("Solution", idea.solution);
    addSection("Target Market", idea.target_market);
    addSection("Pricing Model", idea.pricing_model);
    addSection("Tech Stack", idea.tech_stack);
    addSection("MVP Timeline", `${idea.mvp_weeks} weeks`);
    addSection("Difficulty", idea.difficulty);
    if (notes) addSection("My Notes", notes);

    // Footer
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(180, 180, 180);
      doc.text("Generated by Conceptli", margin, 290);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 20, 290);
    }

    doc.save(`${idea.idea_name.replace(/\s+/g, "_")}.pdf`);
    toast.success("PDF downloaded!");
  };

  const handleBookmarkClick = () => {
    if (isAtLimit) {
      onSaveLimitReached?.();
      return;
    }
    isSaved ? unsaveIdea.mutate() : saveIdea.mutate();
  };

  return (
    <div className={`group bg-card rounded-2xl border p-6 hover:shadow-lg transition-all duration-300 ${
      isSelected
        ? "border-primary shadow-lg shadow-primary/10 ring-2 ring-primary/20"
        : "border-border hover:shadow-primary/5 hover:border-primary/20"
    }`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className={`text-xs font-semibold border ${diff.color}`}>
              {idea.difficulty}
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {idea.mvp_weeks}w MVP
            </span>
          </div>
          <h3 className="text-xl font-bold text-foreground leading-tight">{idea.idea_name}</h3>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {isSaved && (
            <button
              onClick={onToggleSelect}
              disabled={isSelectDisabled}
              title={isSelectDisabled ? "Max 3 ideas lang ang pwedeng ikumpara" : isSelected ? "I-deselect" : "Piliin para ikumpara"}
              className={`h-9 w-9 rounded-xl border-2 flex items-center justify-center transition-all ${
                isSelectDisabled
                  ? "opacity-30 cursor-not-allowed border-border"
                  : isSelected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:border-primary text-transparent hover:text-primary/40"
              }`}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className={`shrink-0 h-9 w-9 rounded-xl ${isAtLimit ? "opacity-60 cursor-pointer" : ""}`}
            onClick={handleBookmarkClick}
            disabled={saveIdea.isPending || unsaveIdea.isPending}
            title={isAtLimit ? `Free plan: max ${FREE_SAVE_LIMIT} saved ideas` : ""}
          >
            {isAtLimit ? (
              <Lock className="h-4 w-4 text-muted-foreground" />
            ) : isSaved ? (
              <BookmarkCheck className="h-5 w-5 text-primary fill-primary" />
            ) : (
              <Bookmark className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            )}
          </Button>
        </div>
      </div>

      {/* Free limit badge — only show on unsaved cards when at limit */}
      {isAtLimit && (
        <div className="mb-3 flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
          <Lock className="h-3 w-3 shrink-0" />
          <span>Free plan saves up to <strong>{FREE_SAVE_LIMIT} ideas</strong>. Upgrade to save more.</span>
        </div>
      )}

      <div className="space-y-3 mb-4">
        <div className="flex gap-2">
          <Target className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Problem</p>
            <p className="text-sm text-foreground leading-relaxed">{idea.problem}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Code className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Solution</p>
            <p className="text-sm text-foreground leading-relaxed">{idea.solution}</p>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="space-y-3 mb-4 pt-3 border-t border-border animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex gap-2">
            <Users className="h-4 w-4 text-accent mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Target Market</p>
              <p className="text-sm text-foreground">{idea.target_market}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <DollarSign className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Pricing Model</p>
              <p className="text-sm text-foreground">{idea.pricing_model}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Code className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Tech Stack</p>
              <p className="text-sm text-foreground">{idea.tech_stack}</p>
            </div>
          </div>
        </div>
      )}

      {/* Blueprint Button — Pro users only, visible on all cards */}
      {isPro && (
        <div className="mt-3">
          <button
            onClick={() => setShowBlueprint(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border bg-primary/5 border-primary/30 text-primary hover:bg-primary/10 transition-all"
          >
            <Rocket className="h-3.5 w-3.5" />
            Generate Startup Blueprint
          </button>
        </div>
      )}

      {/* Lock button — free users only, visible on all cards */}
      {!isPro && (
        <div className="mt-3">
          <button
            onClick={() => onSaveLimitReached?.()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border bg-muted border-border text-muted-foreground hover:border-primary/30 transition-all"
          >
            <Lock className="h-3.5 w-3.5" />
            Startup Blueprint — Pro Only
          </button>
        </div>
      )}

      {showBlueprint && (
        <BlueprintModal
          idea={idea}
          onClose={() => setShowBlueprint(false)}
        />
      )}

      {isSaved && (
        <TagSelector
          savedId={savedId}
          currentTags={tags}
          onTagsChange={setTags}
        />
      )}

      {/* Notes Section */}
      {isSaved && (
        <div className="mt-3">
          <button
            onClick={() => setShowNotes((v) => !v)}
            className="w-full flex items-center justify-between text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors py-1.5 group"
          >
            <span className="flex items-center gap-1.5">
              <NotebookPen className="h-3.5 w-3.5" />
              My Notes
              {notes && !showNotes && (
                <span className="text-xs text-primary font-normal italic truncate max-w-[140px]">
                  — {notes.slice(0, 40)}{notes.length > 40 ? "…" : ""}
                </span>
              )}
            </span>
            {showNotes ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>

          {showNotes && (
            <div className="mt-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
              <textarea
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value);
                  setNotesSaved(false);
                }}
                onBlur={handleSaveNotes}
                placeholder="Isulat mo dito ang iyong mga naiisip... halimbawa: 'Magandang ideya para sa Q3', 'Kailangan pang i-validate ang market', 'Possible competitor: X'"
                rows={4}
                className="w-full text-sm text-foreground bg-muted/40 border border-border rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 placeholder:text-muted-foreground/50 transition-all"
              />
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-xs text-muted-foreground">
                  {notes.length} characters
                </span>
                <button
                  onClick={handleSaveNotes}
                  disabled={isSavingNotes}
                  className={`text-xs font-semibold flex items-center gap-1 transition-colors ${
                    notesSaved
                      ? "text-emerald-600"
                      : "text-primary hover:text-primary/80"
                  }`}
                >
                  {notesSaved ? (
                    <>
                      <Check className="h-3 w-3" />
                      Saved
                    </>
                  ) : isSavingNotes ? (
                    "Saving…"
                  ) : (
                    "Save notes"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {isSaved && (
        <div className="pt-3 pb-1">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPDF}
            className="w-full rounded-xl text-xs font-semibold gap-1.5 text-muted-foreground hover:text-foreground border-dashed"
          >
            <Download className="h-3.5 w-3.5" />
            Download as PDF
          </Button>
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2 flex-1">
          <span className="text-xs text-muted-foreground font-medium">Difficulty</span>
          <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
            <div className={`h-full rounded-full ${diff.bar} transition-all duration-500`} style={{ width: `${diff.pct}%` }} />
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-primary font-medium flex items-center gap-1 hover:underline"
        >
          {expanded ? "Less" : "More details"}
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
      </div>
    </div>
  );
}
