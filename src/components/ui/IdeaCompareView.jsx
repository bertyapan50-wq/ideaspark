import { X, Target, Users, DollarSign, Code, Clock, TrendingUp, NotebookPen } from "lucide-react";

const difficultyRank = { Easy: 1, Medium: 2, Hard: 3 };

const difficultyColors = {
  Easy: "text-emerald-600 bg-emerald-50 border-emerald-200",
  Medium: "text-amber-600 bg-amber-50 border-amber-200",
  Hard: "text-rose-600 bg-rose-50 border-rose-200",
};

const ROWS = [
  { key: "problem",       label: "Problem",       icon: Target,      iconColor: "text-destructive" },
  { key: "solution",      label: "Solution",       icon: Code,        iconColor: "text-primary" },
  { key: "target_market", label: "Target Market",  icon: Users,       iconColor: "text-accent" },
  { key: "pricing_model", label: "Pricing Model",  icon: DollarSign,  iconColor: "text-emerald-600" },
  { key: "tech_stack",    label: "Tech Stack",     icon: Code,        iconColor: "text-blue-500" },
  { key: "mvp_weeks",     label: "MVP Timeline",   icon: Clock,       iconColor: "text-violet-500" },
  { key: "notes",         label: "My Notes",       icon: NotebookPen, iconColor: "text-amber-500" },
];

export default function IdeaCompareView({ ideas, onClose }) {
  // Highlight shortest MVP
  const minMvp = Math.min(...ideas.map((i) => i.mvp_weeks));
  // Highlight easiest difficulty
  const minDiff = Math.min(...ideas.map((i) => difficultyRank[i.difficulty] || 2));

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-background rounded-2xl border border-border w-full max-w-5xl my-8 shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-foreground">Idea Comparison</h2>
              <p className="text-xs text-muted-foreground">
                Ikukumpara ang {ideas.length} ideas — i-highlight ang mga kalamangan ng bawat isa
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Idea name headers */}
        <div className="grid border-b border-border"
          style={{ gridTemplateColumns: `180px repeat(${ideas.length}, 1fr)` }}
        >
          <div className="p-4" />
          {ideas.map((idea, i) => (
            <div key={idea.id} className={`p-4 border-l border-border ${i === 0 ? "bg-primary/5" : i === 1 ? "bg-accent/5" : "bg-emerald-500/5"}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`h-2 w-2 rounded-full ${i === 0 ? "bg-primary" : i === 1 ? "bg-accent" : "bg-emerald-500"}`} />
                <span className="text-xs text-muted-foreground font-medium">Idea {i + 1}</span>
              </div>
              <h3 className="font-bold text-foreground text-sm leading-tight">{idea.idea_name}</h3>
              {idea.niche && (
                <span className="text-xs text-muted-foreground mt-0.5 block">{idea.niche}</span>
              )}
            </div>
          ))}
        </div>

        {/* Difficulty & MVP row */}
        <div className="grid border-b border-border bg-muted/30"
          style={{ gridTemplateColumns: `180px repeat(${ideas.length}, 1fr)` }}
        >
          <div className="p-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Difficulty / MVP</span>
          </div>
          {ideas.map((idea, i) => {
            const isEasiest = difficultyRank[idea.difficulty] === minDiff;
            const isFastest = idea.mvp_weeks === minMvp;
            return (
              <div key={idea.id} className="p-4 border-l border-border space-y-1.5">
                <span className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-full border ${difficultyColors[idea.difficulty]}`}>
                  {idea.difficulty}
                  {isEasiest && <span className="ml-1">✓ Easiest</span>}
                </span>
                <div className={`text-sm font-semibold ${isFastest ? "text-emerald-600" : "text-foreground"}`}>
                  {idea.mvp_weeks} weeks
                  {isFastest && <span className="ml-1.5 text-xs font-normal text-emerald-600">⚡ Fastest</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Content rows */}
        {ROWS.map((row, rowIdx) => {
          const Icon = row.icon;
          return (
            <div
              key={row.key}
              className={`grid border-b border-border ${rowIdx % 2 === 0 ? "" : "bg-muted/20"}`}
              style={{ gridTemplateColumns: `180px repeat(${ideas.length}, 1fr)` }}
            >
              <div className="p-4 flex items-start gap-2 pt-5">
                <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${row.iconColor}`} />
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider leading-tight">
                  {row.label}
                </span>
              </div>
              {ideas.map((idea) => (
                <div key={idea.id} className="p-4 border-l border-border">
                  <p className="text-sm text-foreground leading-relaxed">
                    {row.key === "mvp_weeks"
                      ? `${idea[row.key]} weeks`
                      : idea[row.key] || "—"}
                  </p>
                </div>
              ))}
            </div>
          );
        })}

        {/* Tags row */}
        <div className="grid border-b border-border"
          style={{ gridTemplateColumns: `180px repeat(${ideas.length}, 1fr)` }}
        >
          <div className="p-4 flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tags</span>
          </div>
          {ideas.map((idea) => (
            <div key={idea.id} className="p-4 border-l border-border">
              {(idea.tags || []).length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {idea.tags.map((tag) => (
                    <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">No tags</span>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Tapos na
          </button>
        </div>
      </div>
    </div>
  );
}
