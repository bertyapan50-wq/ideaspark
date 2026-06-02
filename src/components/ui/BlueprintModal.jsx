import { useState, useEffect } from "react";
import { X, Loader2, Users, Rocket, TrendingUp, DollarSign, AlertTriangle, Map } from "lucide-react";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

async function generateBlueprint(idea) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      max_tokens: 3000,
      messages: [
        {
          role: "system",
          content: `You are a startup advisor. Return ONLY valid JSON, no markdown, no explanation.`,
        },
        {
          role: "user",
          content: `Generate a full startup blueprint for this SaaS idea:
Name: ${idea.idea_name}
Problem: ${idea.problem}
Solution: ${idea.solution}
Target Market: ${idea.target_market}

Return ONLY this JSON structure:
{
  "personas": [
    { "name": "string", "role": "string", "pain_point": "string", "goal": "string" }
  ],
  "mvp_features": [
    { "feature": "string", "priority": "Must Have" | "Should Have" | "Nice to Have", "effort": "Low" | "Medium" | "High" }
  ],
  "go_to_market": {
    "launch_strategy": "string",
    "channels": ["string"],
    "first_100_users": "string"
  },
  "revenue_milestones": [
    { "month": number, "milestone": "string", "mrr_target": "string" }
  ],
  "risks": [
    { "risk": "string", "severity": "Low" | "Medium" | "High", "mitigation": "string" }
  ]
}`,
        },
      ],
    }),
  });
  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || "{}";
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

const PRIORITY_COLORS = {
  "Must Have":    "bg-rose-100 text-rose-700 border-rose-200",
  "Should Have":  "bg-amber-100 text-amber-700 border-amber-200",
  "Nice to Have": "bg-blue-100 text-blue-700 border-blue-200",
};

const EFFORT_COLORS = {
  Low:    "text-emerald-600",
  Medium: "text-amber-600",
  High:   "text-rose-600",
};

const SEVERITY_COLORS = {
  Low:    "bg-emerald-100 text-emerald-700 border-emerald-200",
  Medium: "bg-amber-100 text-amber-700 border-amber-200",
  High:   "bg-rose-100 text-rose-700 border-rose-200",
};

export default function BlueprintModal({ idea, onClose }) {
  const [blueprint, setBlueprint] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("personas");

  useEffect(() => {
    generateBlueprint(idea)
      .then(setBlueprint)
      .catch(() => setError("Failed to generate blueprint. Please try again."))
      .finally(() => setIsLoading(false));
  }, []);

  const TABS = [
    { id: "personas",    label: "Personas",    icon: Users },
    { id: "mvp",         label: "MVP Features", icon: Rocket },
    { id: "gtm",         label: "Go-to-Market", icon: Map },
    { id: "revenue",     label: "Revenue",      icon: TrendingUp },
    { id: "risks",       label: "Risks",        icon: AlertTriangle },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-background rounded-2xl border border-border w-full max-w-3xl my-8 shadow-2xl">

        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-border">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <Rocket className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  Startup Blueprint
                </span>
              </div>
              <h2 className="text-lg font-extrabold text-foreground leading-tight">{idea.idea_name}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{idea.target_market}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Loader2 className="h-7 w-7 text-primary animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-foreground font-semibold">Building your blueprint…</p>
              <p className="text-sm text-muted-foreground mt-1">Generating personas, features, strategy & more</p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-6 text-center">
            <p className="text-destructive text-sm">{error}</p>
            <button onClick={onClose} className="mt-3 text-xs text-primary hover:underline">Close</button>
          </div>
        )}

        {/* Content */}
        {!isLoading && !error && blueprint && (
          <>
            {/* Tabs */}
            <div className="flex overflow-x-auto border-b border-border px-6 gap-1 pt-2">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="p-6">

              {/* Personas Tab */}
              {activeTab === "personas" && (
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground mb-4">Ang mga target users ng iyong produkto.</p>
                  {(blueprint.personas || []).map((p, i) => (
                    <div key={i} className="rounded-xl border border-border p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                          {p.name?.[0] || "?"}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.role}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        <div className="bg-rose-50 border border-rose-100 rounded-lg p-2.5">
                          <p className="text-xs font-semibold text-rose-600 mb-1">Pain Point</p>
                          <p className="text-xs text-foreground">{p.pain_point}</p>
                        </div>
                        <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-2.5">
                          <p className="text-xs font-semibold text-emerald-600 mb-1">Goal</p>
                          <p className="text-xs text-foreground">{p.goal}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* MVP Features Tab */}
              {activeTab === "mvp" && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground mb-4">Mga features na kailangan para sa MVP.</p>
                  {(blueprint.mvp_features || []).map((f, i) => (
                    <div key={i} className="flex items-start justify-between gap-3 rounded-xl border border-border p-4">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">{f.feature}</p>
                        <p className={`text-xs font-medium mt-1 ${EFFORT_COLORS[f.effort]}`}>
                          Effort: {f.effort}
                        </p>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full border shrink-0 ${PRIORITY_COLORS[f.priority]}`}>
                        {f.priority}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Go-to-Market Tab */}
              {activeTab === "gtm" && blueprint.go_to_market && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-border p-4">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Launch Strategy</p>
                    <p className="text-sm text-foreground leading-relaxed">{blueprint.go_to_market.launch_strategy}</p>
                  </div>
                  <div className="rounded-xl border border-border p-4">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Marketing Channels</p>
                    <div className="flex flex-wrap gap-2">
                      {(blueprint.go_to_market.channels || []).map((c, i) => (
                        <span key={i} className="text-xs font-semibold px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl border border-border p-4">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">First 100 Users</p>
                    <p className="text-sm text-foreground leading-relaxed">{blueprint.go_to_market.first_100_users}</p>
                  </div>
                </div>
              )}

              {/* Revenue Tab */}
              {activeTab === "revenue" && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground mb-4">Revenue milestones para sa unang buwan.</p>
                  {(blueprint.revenue_milestones || []).map((m, i) => (
                    <div key={i} className="flex items-start gap-4 rounded-xl border border-border p-4">
                      <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                        <span className="text-xs font-extrabold text-emerald-700">M{m.month}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">{m.milestone}</p>
                        <p className="text-xs text-emerald-600 font-bold mt-1">MRR Target: {m.mrr_target}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Risks Tab */}
              {activeTab === "risks" && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground mb-4">Mga potential na risk at kung paano ito harapin.</p>
                  {(blueprint.risks || []).map((r, i) => (
                    <div key={i} className="rounded-xl border border-border p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground">{r.risk}</p>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border shrink-0 ${SEVERITY_COLORS[r.severity]}`}>
                          {r.severity}
                        </span>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-2.5">
                        <p className="text-xs font-semibold text-muted-foreground mb-1">Mitigation</p>
                        <p className="text-xs text-foreground">{r.mitigation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          </>
        )}

        {/* Footer */}
        {!isLoading && (
          <div className="px-6 pb-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}