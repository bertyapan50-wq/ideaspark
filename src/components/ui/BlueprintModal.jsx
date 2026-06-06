import { useState, useEffect } from "react";
import { X, Loader2, Download } from "lucide-react";
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

// ─── PDF Generator ─────────────────────────────────────────────────────────────
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

  const newPage = () => { doc.addPage(); y = margin; };
  const checkPage = (needed = 20) => { if (y + needed > pageH - margin) newPage(); };

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
    lines.forEach((line) => { checkPage(7); doc.text(line, x, y); y += 6; });
    y += 3;
  };

  const pill = (text, bgColor, textColor, x, pillY) => {
    doc.setFontSize(7.5);
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

  // Cover
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, pageW, 70, "F");
  doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(255, 255, 255, 0.7);
  doc.text("STARTUP BLUEPRINT", margin, 18);
  doc.setFontSize(20); doc.setFont("helvetica", "bold"); doc.setTextColor(...WHITE);
  const nameLines = doc.splitTextToSize(idea.idea_name, maxW - 10);
  nameLines.forEach((line, i) => doc.text(line, margin, 32 + i * 10));
  y = 32 + nameLines.length * 10 + 6;
  if (idea.niche) {
    doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(200, 195, 255);
    doc.text(`Niche: ${idea.niche}`, margin, y); y += 7;
  }
  const diffColors = { Easy: [[16,185,129],[255,255,255]], Medium: [[245,158,11],[255,255,255]], Hard: [[239,68,68],[255,255,255]] };
  const [dc, dt] = diffColors[idea.difficulty] || diffColors.Medium;
  pill(idea.difficulty, dc, dt, margin, y);
  pill(`${idea.mvp_weeks}w MVP`, [255,255,255,0.2], WHITE, margin + 40, y);
  y = 82;
  doc.setFillColor(...LIGHT_BG);
  doc.roundedRect(margin, y, maxW, 48, 3, 3, "F");
  y += 8;
  labelValue("Problem", idea.problem);
  labelValue("Solution", idea.solution);
  y += 4;
  doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(...MUTED);
  doc.text("CONTENTS", margin, y); y += 6;
  ["01  User Personas","02  MVP Features","03  Go-to-Market Strategy","04  Revenue Milestones","05  Risk Assessment"].forEach((item) => {
    doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(...DARK);
    doc.text(item, margin + 2, y); y += 7;
  });
  doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...MUTED);
  doc.text("Generated by Conceptli · Pro Blueprint", margin, pageH - 10);
  doc.text(new Date().toLocaleDateString(), pageW - margin - 20, pageH - 10);

  // Personas
  newPage(); sectionTitle("User Personas", "01");
  (blueprint.personas || []).forEach((p, i) => {
    checkPage(40);
    doc.setFillColor(...LIGHT_BG); doc.roundedRect(margin, y, maxW, 34, 3, 3, "F");
    doc.setFillColor(...PRIMARY); doc.circle(margin + 10, y + 10, 6, "F");
    doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(...WHITE);
    doc.text((p.name?.[0] || "?").toUpperCase(), margin + 7.5, y + 12.5);
    doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(...DARK);
    doc.text(p.name || "User", margin + 20, y + 8);
    doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(...MUTED);
    doc.text(p.role || "", margin + 20, y + 14);
    y += 20;
    const halfW = (maxW - 4) / 2;
    doc.setFillColor(255, 240, 240); doc.roundedRect(margin, y, halfW, 14, 2, 2, "F");
    doc.setFontSize(6.5); doc.setFont("helvetica", "bold"); doc.setTextColor(180, 60, 60);
    doc.text("PAIN POINT", margin + 2, y + 5);
    doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...DARK);
    doc.text((doc.splitTextToSize(p.pain_point || "", halfW - 4))[0] || "", margin + 2, y + 10);
    doc.setFillColor(236, 253, 245); doc.roundedRect(margin + halfW + 4, y, halfW, 14, 2, 2, "F");
    doc.setFontSize(6.5); doc.setFont("helvetica", "bold"); doc.setTextColor(22, 130, 80);
    doc.text("GOAL", margin + halfW + 6, y + 5);
    doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...DARK);
    doc.text((doc.splitTextToSize(p.goal || "", halfW - 4))[0] || "", margin + halfW + 6, y + 10);
    y += 20;
    if (i < (blueprint.personas || []).length - 1) divider();
  });

  // MVP
  newPage(); sectionTitle("MVP Features", "02");
  const priorityColors = { "Must Have": { bg: [255,235,235], text: [180,40,40] }, "Should Have": { bg: [255,248,225], text: [160,100,0] }, "Nice to Have": { bg: [235,245,255], text: [40,100,180] } };
  const effortColors = { Low: [22,163,74], Medium: [202,138,4], High: [220,38,38] };
  (blueprint.mvp_features || []).forEach((f, i) => {
    checkPage(18);
    doc.setFillColor(...(i % 2 === 0 ? LIGHT_BG : WHITE));
    doc.roundedRect(margin, y, maxW, 14, 2, 2, "F");
    doc.setFontSize(9.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...DARK);
    doc.text((doc.splitTextToSize(f.feature || "", maxW - 60))[0], margin + 3, y + 9);
    const pc = priorityColors[f.priority] || priorityColors["Should Have"];
    pill(f.priority || "", pc.bg, pc.text, pageW - margin - 52, y + 5);
    const ec = effortColors[f.effort] || effortColors.Medium;
    doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...ec);
    doc.text(`Effort: ${f.effort || ""}`, pageW - margin - 22, y + 9);
    y += 16;
  });

  // GTM
  newPage(); sectionTitle("Go-to-Market Strategy", "03");
  if (blueprint.go_to_market) {
    const gtm = blueprint.go_to_market;
    doc.setFillColor(...LIGHT_BG); doc.roundedRect(margin, y, maxW, 6, 2, 2, "F"); y += 2;
    labelValue("Launch Strategy", gtm.launch_strategy, 0);
    divider();
    checkPage(20);
    doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...MUTED);
    doc.text("MARKETING CHANNELS", margin, y); y += 7;
    let cx = margin;
    (gtm.channels || []).forEach((ch) => {
      if (cx + doc.getTextWidth(ch) + 14 > pageW - margin) { cx = margin; y += 9; }
      checkPage(10);
      const pw = pill(ch, [235,232,255], PRIMARY, cx, y);
      cx += pw + 2;
    });
    y += 12; divider();
    labelValue("First 100 Users Strategy", gtm.first_100_users);
  }

  // Revenue
  newPage(); sectionTitle("Revenue Milestones", "04");
  (blueprint.revenue_milestones || []).forEach((m, i) => {
    checkPage(22);
    const dotX = margin + 8; const dotY = y + 8;
    doc.setFillColor(...PRIMARY); doc.circle(dotX, dotY, 4, "F");
    if (i < (blueprint.revenue_milestones || []).length - 1) {
      doc.setDrawColor(...PRIMARY); doc.setLineWidth(0.5); doc.line(dotX, dotY + 4, dotX, dotY + 20);
    }
    doc.setFillColor(...LIGHT_BG); doc.roundedRect(margin + 18, y, maxW - 18, 16, 2, 2, "F");
    doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(...PRIMARY);
    doc.text(`Month ${m.month}`, margin + 22, y + 6);
    doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(...DARK);
    doc.text((doc.splitTextToSize(m.milestone || "", maxW - 60))[0] || "", margin + 22, y + 12);
    doc.setFontSize(8.5); doc.setFont("helvetica", "bold"); doc.setTextColor(22, 163, 74);
    doc.text(`MRR: ${m.mrr_target || ""}`, pageW - margin - 28, y + 9);
    y += 22;
  });

  // Risks
  newPage(); sectionTitle("Risk Assessment", "05");
  const sevColors = {
    Low: { bg: [236,253,245], text: [22,130,80], pill: [[220,252,231],[22,101,52]] },
    Medium: { bg: [255,251,235], text: [146,64,14], pill: [[254,243,199],[146,64,14]] },
    High: { bg: [255,241,242], text: [159,18,57], pill: [[254,226,226],[153,27,27]] },
  };
  (blueprint.risks || []).forEach((r) => {
    const sc = sevColors[r.severity] || sevColors.Medium;
    checkPage(30);
    doc.setFillColor(...sc.bg); doc.roundedRect(margin, y, maxW, 26, 3, 3, "F");
    doc.setFontSize(9.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...DARK);
    doc.text((doc.splitTextToSize(r.risk || "", maxW - 36))[0] || "", margin + 3, y + 8);
    pill(r.severity || "", sc.pill[0], sc.pill[1], pageW - margin - 22, y + 4);
    doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...MUTED);
    doc.text("MITIGATION", margin + 3, y + 15);
    doc.setFont("helvetica", "normal"); doc.setTextColor(...DARK);
    doc.text((doc.splitTextToSize(r.mitigation || "", maxW - 6))[0] || "", margin + 3, y + 21);
    y += 32;
  });

  // Footer
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(...MUTED);
    doc.text("Generated by Conceptli · Pro Blueprint", margin, pageH - 8);
    doc.text(`${i} / ${totalPages}`, pageW - margin - 8, pageH - 8);
  }
  doc.save(`${idea.idea_name.replace(/\s+/g, "_")}_Blueprint.pdf`);
}

// ─── Tab config ────────────────────────────────────────────────────────────────
const TABS = [
  { id: "personas", label: "Personas",     emoji: "👥" },
  { id: "mvp",      label: "MVP Features", emoji: "⚙️" },
  { id: "gtm",      label: "Go-to-Market", emoji: "📡" },
  { id: "revenue",  label: "Revenue",      emoji: "📈" },
  { id: "risks",    label: "Risks",        emoji: "⚠️" },
];

const PRIORITY_STYLES = {
  "Must Have":    { bg: "rgba(239,68,68,0.12)",   color: "#fca5a5", border: "rgba(239,68,68,0.25)" },
  "Should Have":  { bg: "rgba(251,191,36,0.12)",  color: "#fde68a", border: "rgba(251,191,36,0.25)" },
  "Nice to Have": { bg: "rgba(99,102,241,0.12)",  color: "#a5b4fc", border: "rgba(99,102,241,0.25)" },
};
const EFFORT_COLORS = { Low: "#34d399", Medium: "#fbbf24", High: "#f87171" };
const SEVERITY_STYLES = {
  Low:    { bg: "rgba(16,185,129,0.08)",  border: "rgba(16,185,129,0.2)",  accent: "#10b981", badgeBg: "rgba(16,185,129,0.12)",  badgeColor: "#6ee7b7" },
  Medium: { bg: "rgba(251,191,36,0.08)",  border: "rgba(251,191,36,0.2)",  accent: "#f59e0b", badgeBg: "rgba(251,191,36,0.12)",  badgeColor: "#fde68a" },
  High:   { bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.2)",   accent: "#ef4444", badgeBg: "rgba(239,68,68,0.12)",   badgeColor: "#fca5a5" },
};

// Avatar colors cycling
const AVATAR_GRADIENTS = [
  "linear-gradient(135deg,#6366f1,#8b5cf6)",
  "linear-gradient(135deg,#0891b2,#0e7490)",
  "linear-gradient(135deg,#d946ef,#a21caf)",
  "linear-gradient(135deg,#f59e0b,#d97706)",
];

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
    try { generateBlueprintPDF(idea, blueprint); }
    catch (err) { console.error("PDF generation error:", err); }
    finally { setIsDownloading(false); }
  };

  // Tab count badges
  const tabCounts = blueprint ? {
    personas: blueprint.personas?.length,
    mvp: blueprint.mvp_features?.length,
    revenue: blueprint.revenue_milestones?.length,
    risks: blueprint.risks?.length,
  } : {};

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      background: "rgba(0,0,0,0.72)",
      backdropFilter: "blur(6px)",
      display: "flex", alignItems: "flex-start", justifyContent: "center",
      padding: "16px", overflowY: "auto",
    }}>
      <div style={{
        background: "#0f1117",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "20px",
        width: "100%", maxWidth: "740px",
        margin: "32px auto",
        boxShadow: "0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(99,102,241,0.1)",
        overflow: "hidden",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}>

        {/* ── Header ── */}
        <div style={{
          background: "linear-gradient(135deg,#12151f 0%,#181c2e 100%)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "20px 24px",
          display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
            <div style={{
              width: "46px", height: "46px", borderRadius: "12px", flexShrink: 0,
              background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "20px", boxShadow: "0 4px 20px rgba(99,102,241,0.35)",
            }}>🚀</div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px" }}>
                <span style={{
                  fontSize: "10px", fontWeight: 700, letterSpacing: "0.6px",
                  textTransform: "uppercase", color: "#a5b4fc",
                  background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.25)",
                  borderRadius: "20px", padding: "3px 10px",
                }}>Startup Blueprint</span>
                <span style={{
                  fontSize: "10px", fontWeight: 700, color: "#fbbf24",
                  background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.2)",
                  borderRadius: "20px", padding: "3px 8px",
                }}>⚡ PRO</span>
              </div>
              <h2 style={{ fontSize: "18px", fontWeight: 800, color: "#f1f5f9", lineHeight: 1.2, margin: 0 }}>
                {idea.idea_name}
              </h2>
              <p style={{ fontSize: "12px", color: "#475569", marginTop: "3px" }}>{idea.target_market}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: "32px", height: "32px", borderRadius: "8px", flexShrink: 0,
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
              color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* ── Loading ── */}
        {isLoading && (
          <div style={{ padding: "72px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" }}>
            <div style={{
              width: "60px", height: "60px", borderRadius: "16px",
              background: "linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.2))",
              border: "1px solid rgba(99,102,241,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Loader2 size={26} color="#a5b4fc" style={{ animation: "spin 1s linear infinite" }} />
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ color: "#e2e8f0", fontWeight: 700, fontSize: "15px", margin: 0 }}>
                Building your blueprint…
              </p>
              <p style={{ color: "#475569", fontSize: "13px", marginTop: "6px" }}>
                Generating personas, features, strategy &amp; more
              </p>
            </div>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div style={{ padding: "48px 24px", textAlign: "center" }}>
            <p style={{ color: "#f87171", fontSize: "14px" }}>{error}</p>
            <button onClick={onClose} style={{ marginTop: "12px", color: "#a5b4fc", fontSize: "13px", background: "none", border: "none", cursor: "pointer" }}>
              Close
            </button>
          </div>
        )}

        {/* ── Content ── */}
        {!isLoading && !error && blueprint && (
          <>
            {/* Tabs */}
            <div style={{
              display: "flex", borderBottom: "1px solid rgba(255,255,255,0.06)",
              padding: "0 24px", background: "#0f1117", overflowX: "auto", gap: "0",
            }}>
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    padding: "13px 14px",
                    fontSize: "11.5px", fontWeight: 600, whiteSpace: "nowrap",
                    borderBottom: `2px solid ${activeTab === tab.id ? "#6366f1" : "transparent"}`,
                    color: activeTab === tab.id ? "#a5b4fc" : "#475569",
                    background: "none", border: "none",
                    borderBottom: `2px solid ${activeTab === tab.id ? "#6366f1" : "transparent"}`,
                    cursor: "pointer", transition: "color 0.15s", letterSpacing: "0.2px",
                  }}
                >
                  <span style={{ fontSize: "13px" }}>{tab.emoji}</span>
                  {tab.label}
                  {tabCounts[tab.id] && (
                    <span style={{
                      fontFamily: "monospace", fontSize: "9px",
                      background: activeTab === tab.id ? "rgba(99,102,241,0.25)" : "rgba(99,102,241,0.12)",
                      color: activeTab === tab.id ? "#a5b4fc" : "#6366f1",
                      borderRadius: "4px", padding: "1px 5px", marginLeft: "2px",
                    }}>{tabCounts[tab.id]}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <style>{`
              .bp-scroll::-webkit-scrollbar { width: 4px; }
              .bp-scroll::-webkit-scrollbar-track { background: transparent; }
              .bp-scroll::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.25); border-radius: 4px; }
              .bp-scroll::-webkit-scrollbar-thumb:hover { background: rgba(99,102,241,0.45); }
              .bp-scroll { scrollbar-width: thin; scrollbar-color: rgba(99,102,241,0.25) transparent; }
            `}</style>
            <div className="bp-scroll" style={{ padding: "24px", maxHeight: "420px", overflowY: "auto" }}>

              {/* Personas */}
              {activeTab === "personas" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {(blueprint.personas || []).map((p, i) => (
                    <div key={i} style={{
                      background: "#151823",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: "14px", padding: "18px", paddingTop: "22px",
                      position: "relative", overflow: "hidden",
                    }}>
                      {/* Top accent bar */}
                      <div style={{
                        position: "absolute", top: 0, left: 0, right: 0, height: "3px",
                        background: "linear-gradient(90deg,#6366f1,#8b5cf6)",
                        borderRadius: "14px 14px 0 0",
                      }} />
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
                        <div style={{
                          width: "38px", height: "38px", borderRadius: "50%", flexShrink: 0,
                          background: AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length],
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "14px", fontWeight: 800, color: "#fff",
                        }}>
                          {p.name?.[0] || "?"}
                        </div>
                        <div>
                          <p style={{ fontSize: "14px", fontWeight: 700, color: "#e2e8f0", margin: 0 }}>{p.name}</p>
                          <p style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>{p.role}</p>
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                        <div style={{
                          background: "rgba(239,68,68,0.07)",
                          border: "1px solid rgba(239,68,68,0.15)",
                          borderRadius: "10px", padding: "12px",
                        }}>
                          <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase", color: "#f87171", marginBottom: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
                            ⚡ Pain Point
                          </p>
                          <p style={{ fontSize: "12px", color: "#94a3b8", lineHeight: 1.55, margin: 0 }}>{p.pain_point}</p>
                        </div>
                        <div style={{
                          background: "rgba(16,185,129,0.07)",
                          border: "1px solid rgba(16,185,129,0.15)",
                          borderRadius: "10px", padding: "12px",
                        }}>
                          <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase", color: "#34d399", marginBottom: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
                            🎯 Goal
                          </p>
                          <p style={{ fontSize: "12px", color: "#94a3b8", lineHeight: 1.55, margin: 0 }}>{p.goal}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* MVP Features */}
              {activeTab === "mvp" && (
                <div>
                  <p style={{ fontSize: "10px", fontWeight: 600, color: "#475569", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "14px" }}>
                    Core features para sa MVP
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {(blueprint.mvp_features || []).map((f, i) => {
                      const ps = PRIORITY_STYLES[f.priority] || PRIORITY_STYLES["Should Have"];
                      return (
                        <div key={i} style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px",
                          padding: "13px 16px",
                          background: "#151823",
                          border: "1px solid rgba(255,255,255,0.05)",
                          borderRadius: "10px", transition: "border-color 0.15s",
                        }}>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: "13px", fontWeight: 600, color: "#e2e8f0", margin: 0 }}>{f.feature}</p>
                            <p style={{ fontSize: "11px", color: EFFORT_COLORS[f.effort] || "#94a3b8", marginTop: "3px", fontWeight: 500 }}>
                              Effort: {f.effort}
                            </p>
                          </div>
                          <span style={{
                            fontSize: "10px", fontWeight: 700,
                            background: ps.bg, color: ps.color,
                            border: `1px solid ${ps.border}`,
                            borderRadius: "6px", padding: "4px 10px", whiteSpace: "nowrap", flexShrink: 0,
                          }}>{f.priority}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Go-to-Market */}
              {activeTab === "gtm" && blueprint.go_to_market && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {[
                    { title: "🚀 Launch Strategy", content: blueprint.go_to_market.launch_strategy },
                    { title: "📡 First 100 Users", content: blueprint.go_to_market.first_100_users },
                  ].map((block, i) => (
                    <div key={i} style={{
                      background: "#151823", border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: "12px", padding: "18px",
                    }}>
                      <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.5px", color: "#475569", marginBottom: "10px", textTransform: "uppercase" }}>
                        {block.title}
                      </p>
                      <p style={{ fontSize: "13px", color: "#94a3b8", lineHeight: 1.65, margin: 0 }}>{block.content}</p>
                    </div>
                  ))}
                  <div style={{
                    background: "#151823", border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: "12px", padding: "18px",
                  }}>
                    <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.5px", color: "#475569", marginBottom: "12px", textTransform: "uppercase" }}>
                      📢 Marketing Channels
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {(blueprint.go_to_market.channels || []).map((c, i) => (
                        <span key={i} style={{
                          fontSize: "11px", fontWeight: 600,
                          color: "#a5b4fc", background: "rgba(99,102,241,0.1)",
                          border: "1px solid rgba(99,102,241,0.2)",
                          borderRadius: "6px", padding: "4px 12px",
                        }}>{c}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Revenue */}
              {activeTab === "revenue" && (
                <div>
                  <p style={{ fontSize: "10px", fontWeight: 600, color: "#475569", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "20px" }}>
                    Revenue milestones roadmap
                  </p>
                  <div style={{ position: "relative", paddingLeft: "28px" }}>
                    {/* Vertical line */}
                    <div style={{
                      position: "absolute", left: "10px", top: "8px", bottom: "8px",
                      width: "1px",
                      background: "linear-gradient(180deg,#6366f1,rgba(99,102,241,0.05))",
                    }} />
                    {(blueprint.revenue_milestones || []).map((m, i) => (
                      <div key={i} style={{ position: "relative", marginBottom: "14px" }}>
                        {/* Dot */}
                        <div style={{
                          position: "absolute", left: "-22px", top: "14px",
                          width: "8px", height: "8px", borderRadius: "50%",
                          background: "#6366f1", border: "2px solid #0f1117",
                          boxShadow: "0 0 0 2px #6366f1",
                        }} />
                        <div style={{
                          background: "#151823", border: "1px solid rgba(255,255,255,0.06)",
                          borderRadius: "10px", padding: "14px",
                        }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                            <span style={{
                              fontFamily: "monospace", fontSize: "10px", fontWeight: 600,
                              color: "#6366f1", background: "rgba(99,102,241,0.1)",
                              borderRadius: "4px", padding: "2px 8px",
                            }}>Month {m.month}</span>
                            <span style={{ fontSize: "13px", fontWeight: 700, color: "#34d399" }}>{m.mrr_target}</span>
                          </div>
                          <p style={{ fontSize: "12px", color: "#94a3b8", lineHeight: 1.5, margin: 0 }}>{m.milestone}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Risks */}
              {activeTab === "risks" && (
                <div>
                  <p style={{ fontSize: "10px", fontWeight: 600, color: "#475569", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "14px" }}>
                    Risk assessment at mitigation
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {(blueprint.risks || []).map((r, i) => {
                      const ss = SEVERITY_STYLES[r.severity] || SEVERITY_STYLES.Medium;
                      return (
                        <div key={i} style={{
                          background: ss.bg,
                          border: `1px solid ${ss.border}`,
                          borderLeft: `3px solid ${ss.accent}`,
                          borderRadius: "12px", padding: "16px",
                        }}>
                          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px", marginBottom: "10px" }}>
                            <p style={{ fontSize: "13px", fontWeight: 600, color: "#e2e8f0", flex: 1, margin: 0 }}>{r.risk}</p>
                            <span style={{
                              fontSize: "10px", fontWeight: 700,
                              background: ss.badgeBg, color: ss.badgeColor,
                              border: `1px solid ${ss.border}`,
                              borderRadius: "5px", padding: "3px 9px", flexShrink: 0,
                            }}>{r.severity}</span>
                          </div>
                          <p style={{ fontSize: "10px", fontWeight: 700, color: "#475569", letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: "4px" }}>
                            Mitigation
                          </p>
                          <p style={{ fontSize: "12px", color: "#64748b", lineHeight: 1.55, margin: 0 }}>{r.mitigation}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          </>
        )}

        {/* ── Footer ── */}
        {!isLoading && (
          <div style={{
            padding: "16px 24px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            background: "#0c0e13",
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px",
          }}>
            {blueprint && !error ? (
              <button
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  padding: "9px 18px", borderRadius: "10px",
                  fontSize: "12px", fontWeight: 600,
                  color: "#a5b4fc", background: "rgba(99,102,241,0.1)",
                  border: "1px solid rgba(99,102,241,0.2)",
                  cursor: isDownloading ? "not-allowed" : "pointer",
                  opacity: isDownloading ? 0.6 : 1, transition: "all 0.15s",
                  fontFamily: "inherit",
                }}
              >
                {isDownloading
                  ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                  : <Download size={14} />}
                {isDownloading ? "Generating PDF…" : "Download Blueprint PDF"}
              </button>
            ) : <div />}

            <button
              onClick={onClose}
              style={{
                padding: "10px 24px", borderRadius: "10px",
                fontSize: "13px", fontWeight: 700, color: "#fff",
                background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                border: "none", cursor: "pointer", transition: "all 0.15s",
                fontFamily: "inherit",
              }}
            >
              Close
            </button>
          </div>
        )}

      </div>
    </div>
  );
}