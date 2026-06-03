import { useState, useEffect } from "react";
import { X, Loader2, Users, Rocket, TrendingUp, DollarSign, AlertTriangle, Map, Download } from "lucide-react";
import { jsPDF } from "jspdf";

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

// ─── PDF Generator ────────────────────────────────────────────────────────────
function generateBlueprintPDF(idea, blueprint) {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 18;
  const maxW = pageW - margin * 2;
  let y = 0;

  const PRIMARY = [99, 74, 255];
  const DARK = [20, 20, 30];
  const MUTED = [120, 120, 135];
  const LIGHT_BG = [248, 247, 255];
  const WHITE = [255, 255, 255];

  // ── Helpers ──
  const newPage = () => {
    doc.addPage();
    y = margin;
  };

  const checkPage = (needed = 20) => {
    if (y + needed > pageH - margin) newPage();
  };

  const sectionTitle = (title, iconChar) => {
    checkPage(18);
    doc.setFillColor(...PRIMARY);
    doc.roundedRect(margin, y, maxW, 12, 2, 2, "F");
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...WHITE);
    doc.text(`${iconChar}  ${title.toUpperCase()}`, margin + 4, y + 8);
    y += 17;
  };

  const labelValue = (label, value, indent = 0) => {
    const x = margin + indent;
    const w = maxW - indent;
    checkPage(14);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...MUTED);
    doc.text(label.toUpperCase(), x, y);
    y += 5;
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DARK);
    const lines = doc.splitTextToSize(value || "—", w);
    lines.forEach((line) => {
      checkPage(7);
      doc.text(line, x, y);
      y += 6;
    });
    y += 3;
  };

  const pill = (text, bgColor, textColor, x, pillY) => {
    const fs = 7.5;
    doc.setFontSize(fs);
    doc.setFont("helvetica", "bold");
    const tw = doc.getTextWidth(text);
    const pw = tw + 6;
    const ph = 5.5;
    doc.setFillColor(...bgColor);
    doc.roundedRect(x, pillY - 4, pw, ph, 1.5, 1.5, "F");
    doc.setTextColor(...textColor);
    doc.text(text, x + 3, pillY);
    return pw + 3;
  };

  const divider = () => {
    checkPage(6);
    doc.setDrawColor(220, 220, 230);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageW - margin, y);
    y += 6;
  };

  // ── COVER PAGE ──
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, pageW, 70, "F");

  // Diagonal accent
  doc.setFillColor(255, 255, 255, 0.06);
  doc.triangle(pageW - 40, 0, pageW, 0, pageW, 70, "F");

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255, 0.7);
  doc.text("STARTUP BLUEPRINT", margin, 18);

  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...WHITE);
  const nameLines = doc.splitTextToSize(idea.idea_name, maxW - 10);
  nameLines.forEach((line, i) => {
    doc.text(line, margin, 32 + i * 10);
  });

  y = 32 + nameLines.length * 10 + 6;
  if (idea.niche) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(200, 195, 255);
    doc.text(`Niche: ${idea.niche}`, margin, y);
    y += 7;
  }

  // Difficulty + MVP badge
  const diffColors = {
    Easy: [[16, 185, 129], [255, 255, 255]],
    Medium: [[245, 158, 11], [255, 255, 255]],
    Hard: [[239, 68, 68], [255, 255, 255]],
  };
  const [dc, dt] = diffColors[idea.difficulty] || diffColors.Medium;
  pill(idea.difficulty, dc, dt, margin, y);
  pill(`${idea.mvp_weeks}w MVP`, [255, 255, 255, 0.2], WHITE, margin + 40, y);
  y = 82;

  // Idea summary box
  doc.setFillColor(...LIGHT_BG);
  doc.roundedRect(margin, y, maxW, 48, 3, 3, "F");
  y += 8;
  labelValue("Problem", idea.problem);
  labelValue("Solution", idea.solution);
  y += 4;

  // ── TABLE OF CONTENTS ──
  y += 4;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...MUTED);
  doc.text("CONTENTS", margin, y);
  y += 6;

  const toc = [
    "01  User Personas",
    "02  MVP Features",
    "03  Go-to-Market Strategy",
    "04  Revenue Milestones",
    "05  Risk Assessment",
  ];
  toc.forEach((item) => {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DARK);
    doc.text(item, margin + 2, y);
    y += 7;
  });

  // Footer on cover
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...MUTED);
  doc.text("Generated by Conceptli · Pro Blueprint", margin, pageH - 10);
  doc.text(new Date().toLocaleDateString(), pageW - margin - 20, pageH - 10);

  // ── PAGE 2: PERSONAS ──
  newPage();
  sectionTitle("User Personas", "01");

  (blueprint.personas || []).forEach((p, i) => {
    checkPage(40);
    doc.setFillColor(...LIGHT_BG);
    doc.roundedRect(margin, y, maxW, 34, 3, 3, "F");

    // Avatar circle
    doc.setFillColor(...PRIMARY);
    doc.circle(margin + 10, y + 10, 6, "F");
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...WHITE);
    doc.text((p.name?.[0] || "?").toUpperCase(), margin + 7.5, y + 12.5);

    // Name + role
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK);
    doc.text(p.name || "User", margin + 20, y + 8);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MUTED);
    doc.text(p.role || "", margin + 20, y + 14);

    y += 20;

    // Pain + Goal side by side
    const halfW = (maxW - 4) / 2;
    // Pain box
    doc.setFillColor(255, 240, 240);
    doc.roundedRect(margin, y, halfW, 14, 2, 2, "F");
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(180, 60, 60);
    doc.text("PAIN POINT", margin + 2, y + 5);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DARK);
    const painLines = doc.splitTextToSize(p.pain_point || "", halfW - 4);
    doc.text(painLines[0] || "", margin + 2, y + 10);

    // Goal box
    doc.setFillColor(236, 253, 245);
    doc.roundedRect(margin + halfW + 4, y, halfW, 14, 2, 2, "F");
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(22, 130, 80);
    doc.text("GOAL", margin + halfW + 6, y + 5);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DARK);
    const goalLines = doc.splitTextToSize(p.goal || "", halfW - 4);
    doc.text(goalLines[0] || "", margin + halfW + 6, y + 10);

    y += 20;
    if (i < (blueprint.personas || []).length - 1) divider();
  });

  // ── PAGE 3: MVP FEATURES ──
  newPage();
  sectionTitle("MVP Features", "02");

  const priorityColors = {
    "Must Have":    { bg: [255, 235, 235], text: [180, 40, 40] },
    "Should Have":  { bg: [255, 248, 225], text: [160, 100, 0] },
    "Nice to Have": { bg: [235, 245, 255], text: [40, 100, 180] },
  };
  const effortColors = {
    Low:    [22, 163, 74],
    Medium: [202, 138, 4],
    High:   [220, 38, 38],
  };

  (blueprint.mvp_features || []).forEach((f, i) => {
    checkPage(18);
    doc.setFillColor(...(i % 2 === 0 ? LIGHT_BG : WHITE));
    doc.roundedRect(margin, y, maxW, 14, 2, 2, "F");

    // Feature name
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK);
    const fLines = doc.splitTextToSize(f.feature || "", maxW - 60);
    doc.text(fLines[0], margin + 3, y + 9);

    // Priority pill
    const pc = priorityColors[f.priority] || priorityColors["Should Have"];
    pill(f.priority || "", pc.bg, pc.text, pageW - margin - 52, y + 5);

    // Effort
    const ec = effortColors[f.effort] || effortColors.Medium;
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...ec);
    doc.text(`Effort: ${f.effort || ""}`, pageW - margin - 22, y + 9);

    y += 16;
  });

  // ── PAGE 4: GO-TO-MARKET ──
  newPage();
  sectionTitle("Go-to-Market Strategy", "03");

  if (blueprint.go_to_market) {
    const gtm = blueprint.go_to_market;

    // Launch strategy
    doc.setFillColor(...LIGHT_BG);
    doc.roundedRect(margin, y, maxW, 6, 2, 2, "F");
    y += 2;
    labelValue("Launch Strategy", gtm.launch_strategy, 0);

    divider();

    // Channels
    checkPage(20);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...MUTED);
    doc.text("MARKETING CHANNELS", margin, y);
    y += 7;

    let cx = margin;
    (gtm.channels || []).forEach((ch) => {
      if (cx + doc.getTextWidth(ch) + 14 > pageW - margin) {
        cx = margin;
        y += 9;
      }
      checkPage(10);
      const pw = pill(ch, [235, 232, 255], PRIMARY, cx, y);
      cx += pw + 2;
    });
    y += 12;

    divider();
    labelValue("First 100 Users Strategy", gtm.first_100_users);
  }

  // ── PAGE 5: REVENUE MILESTONES ──
  newPage();
  sectionTitle("Revenue Milestones", "04");

  (blueprint.revenue_milestones || []).forEach((m, i) => {
    checkPage(22);

    // Timeline dot + line
    const dotX = margin + 8;
    const dotY = y + 8;
    doc.setFillColor(...PRIMARY);
    doc.circle(dotX, dotY, 4, "F");
    if (i < (blueprint.revenue_milestones || []).length - 1) {
      doc.setDrawColor(...PRIMARY);
      doc.setLineWidth(0.5);
      doc.line(dotX, dotY + 4, dotX, dotY + 20);
    }

    doc.setFillColor(...LIGHT_BG);
    doc.roundedRect(margin + 18, y, maxW - 18, 16, 2, 2, "F");

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...PRIMARY);
    doc.text(`Month ${m.month}`, margin + 22, y + 6);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DARK);
    const mLines = doc.splitTextToSize(m.milestone || "", maxW - 60);
    doc.text(mLines[0] || "", margin + 22, y + 12);

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(22, 163, 74);
    doc.text(`MRR: ${m.mrr_target || ""}`, pageW - margin - 28, y + 9);

    y += 22;
  });

  // ── PAGE 6: RISKS ──
  newPage();
  sectionTitle("Risk Assessment", "05");

  const sevColors = {
    Low:    { bg: [236, 253, 245], text: [22, 130, 80], pill: [[220, 252, 231], [22, 101, 52]] },
    Medium: { bg: [255, 251, 235], text: [146, 64, 14], pill: [[254, 243, 199], [146, 64, 14]] },
    High:   { bg: [255, 241, 242], text: [159, 18, 57], pill: [[254, 226, 226], [153, 27, 27]] },
  };

  (blueprint.risks || []).forEach((r, i) => {
    const sc = sevColors[r.severity] || sevColors.Medium;
    checkPage(30);

    doc.setFillColor(...sc.bg);
    doc.roundedRect(margin, y, maxW, 26, 3, 3, "F");

    // Risk title row
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK);
    const rLines = doc.splitTextToSize(r.risk || "", maxW - 36);
    doc.text(rLines[0] || "", margin + 3, y + 8);

    pill(r.severity || "", sc.pill[0], sc.pill[1], pageW - margin - 22, y + 4);

    // Mitigation
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...MUTED);
    doc.text("MITIGATION", margin + 3, y + 15);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DARK);
    const mitLines = doc.splitTextToSize(r.mitigation || "", maxW - 6);
    doc.text(mitLines[0] || "", margin + 3, y + 21);

    y += 30;
    if (i < (blueprint.risks || []).length - 1) { y += 2; }
  });

  // ── FOOTER on all pages ──
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MUTED);
    doc.text("Generated by Conceptli · Pro Blueprint", margin, pageH - 8);
    doc.text(`${i} / ${totalPages}`, pageW - margin - 8, pageH - 8);
  }

  doc.save(`${idea.idea_name.replace(/\s+/g, "_")}_Blueprint.pdf`);
}

// ─── Style constants ───────────────────────────────────────────────────────────
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

// ─── Component ────────────────────────────────────────────────────────────────
export default function BlueprintModal({ idea, onClose }) {
  const [blueprint, setBlueprint] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("personas");
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    generateBlueprint(idea)
      .then(setBlueprint)
      .catch(() => setError("Failed to generate blueprint. Please try again."))
      .finally(() => setIsLoading(false));
  }, []);

  const handleDownloadPDF = () => {
    if (!blueprint) return;
    setIsDownloading(true);
    try {
      generateBlueprintPDF(idea, blueprint);
    } catch (err) {
      console.error("PDF generation error:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const TABS = [
    { id: "personas", label: "Personas",     icon: Users },
    { id: "mvp",      label: "MVP Features", icon: Rocket },
    { id: "gtm",      label: "Go-to-Market", icon: Map },
    { id: "revenue",  label: "Revenue",      icon: TrendingUp },
    { id: "risks",    label: "Risks",        icon: AlertTriangle },
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
          <div className="px-6 pb-6 flex items-center justify-between gap-3">
            {/* Download button — only show when blueprint is ready */}
            {blueprint && !error ? (
              <button
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 transition-all disabled:opacity-60"
              >
                {isDownloading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {isDownloading ? "Generating PDF…" : "Download Blueprint PDF"}
              </button>
            ) : (
              <div />
            )}

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
