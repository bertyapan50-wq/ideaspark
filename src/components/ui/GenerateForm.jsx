import { useState } from "react";
import { Search, Loader2, RefreshCw, Shuffle, ChevronDown, ChevronUp } from "lucide-react";

const RANDOM_NICHES = [
  "Fitness & Wellness", "Remote Work Tools", "Pet Care", "Personal Finance",
  "EdTech for Kids", "Food & Meal Planning", "Mental Health", "Home Improvement",
  "Freelancer Productivity", "E-commerce Automation", "Travel Planning",
  "Sustainable Living", "Creator Economy", "Legal Tech for Freelancers",
  "Language Learning", "Sleep Optimization", "Senior Care Tech", "Parenting Tools",
  "Local Business Tools", "Cybersecurity for SMBs"
];

const NICHE_TEMPLATES = [
  { label: "Fitness Coaching", niche: "Online fitness coaching for busy professionals", category: "Health" },
  { label: "Mental Health", niche: "Mental health support and therapy tools for remote workers", category: "Health" },
  { label: "Sleep Tracking", niche: "Sleep optimization and insomnia solutions for shift workers", category: "Health" },
  { label: "Nutrition Planning", niche: "Personalized meal planning and nutrition tracking for athletes", category: "Health" },
  { label: "Freelancer Tools", niche: "Productivity and project management tools for freelancers", category: "Productivity" },
  { label: "Remote Teams", niche: "Async collaboration tools for distributed remote teams", category: "Productivity" },
  { label: "Deep Work", niche: "Focus and deep work tools for knowledge workers", category: "Productivity" },
  { label: "Meeting Tools", niche: "AI-powered meeting summaries and action item tracking", category: "Productivity" },
  { label: "Personal Finance", niche: "Personal budgeting and savings automation for millennials", category: "Finance" },
  { label: "Freelance Invoicing", niche: "Invoicing and tax management for self-employed freelancers", category: "Finance" },
  { label: "Crypto Tools", niche: "Crypto portfolio tracking and tax reporting for retail investors", category: "Finance" },
  { label: "Small Biz Finance", niche: "Cash flow management and forecasting for small businesses", category: "Finance" },
  { label: "Kids EdTech", niche: "Gamified learning platform for elementary school kids", category: "Education" },
  { label: "Language Learning", niche: "Conversational language learning for adult professionals", category: "Education" },
  { label: "Coding Bootcamps", niche: "Self-paced coding courses with job placement for career changers", category: "Education" },
  { label: "Corporate Training", niche: "Microlearning and skills training platform for enterprise teams", category: "Education" },
  { label: "Dropshipping Tools", niche: "Product research and supplier automation for dropshippers", category: "E-commerce" },
  { label: "Amazon Sellers", niche: "Listing optimization and inventory management for Amazon FBA sellers", category: "E-commerce" },
  { label: "Creator Merch", niche: "Print-on-demand merch store tools for content creators", category: "E-commerce" },
  { label: "Local Retail", niche: "Inventory and loyalty program tools for local retail stores", category: "E-commerce" },
  { label: "Newsletter Tools", niche: "Newsletter monetization and audience growth for independent writers", category: "Creator" },
  { label: "Podcast Tools", niche: "Podcast production, distribution, and monetization for indie podcasters", category: "Creator" },
  { label: "YouTube Creators", niche: "Analytics and sponsorship management tools for YouTube creators", category: "Creator" },
  { label: "Course Creators", niche: "Online course creation and community building for expert creators", category: "Creator" },
  { label: "Property Management", niche: "Tenant management and rent collection tools for landlords", category: "Real Estate" },
  { label: "Real Estate Agents", niche: "Lead generation and CRM tools for independent real estate agents", category: "Real Estate" },
  { label: "Short-term Rentals", niche: "Airbnb and short-term rental automation and pricing tools", category: "Real Estate" },
  { label: "HR for SMBs", niche: "Employee onboarding and HR compliance tools for small businesses", category: "Legal & HR" },
  { label: "Legal for Startups", niche: "Contract generation and legal document automation for startups", category: "Legal & HR" },
  { label: "Hiring Tools", niche: "AI-powered candidate screening and interview tools for recruiters", category: "Legal & HR" },
];

const CATEGORIES = ["All", "Health", "Productivity", "Finance", "Education", "E-commerce", "Creator", "Real Estate", "Legal & HR"];

const CARD_COLORS = {
  Health:        "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300",
  Productivity:  "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300",
  Finance:       "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300",
  Education:     "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300",
  "E-commerce":  "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300",
  Creator:       "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300",
  "Real Estate": "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300",
  "Legal & HR":  "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300",
};

const CAT_COLORS = {
  Health:        "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200",
  Productivity:  "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200",
  Finance:       "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200",
  Education:     "bg-violet-100 text-violet-700 border-violet-200 hover:bg-violet-200",
  "E-commerce":  "bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-200",
  Creator:       "bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200",
  "Real Estate": "bg-cyan-100 text-cyan-700 border-cyan-200 hover:bg-cyan-200",
  "Legal & HR":  "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200",
};

const CAT_ACTIVE_COLORS = {
  Health:        "bg-emerald-500 text-white border-emerald-500",
  Productivity:  "bg-blue-500 text-white border-blue-500",
  Finance:       "bg-amber-500 text-white border-amber-500",
  Education:     "bg-violet-500 text-white border-violet-500",
  "E-commerce":  "bg-rose-500 text-white border-rose-500",
  Creator:       "bg-orange-500 text-white border-orange-500",
  "Real Estate": "bg-cyan-500 text-white border-cyan-500",
  "Legal & HR":  "bg-slate-500 text-white border-slate-500",
};

export default function GenerateForm({ onGenerate, isLoading, hasResults, onSurpriseMe }) {
  const [niche, setNiche] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [showTemplates, setShowTemplates] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!niche.trim() || isLoading) return;
    onGenerate(niche.trim());
  };

  const handleTemplateClick = (template) => {
    setNiche(template.niche);
    setShowTemplates(false);
  };

  const filtered = activeCategory === "All"
    ? NICHE_TEMPLATES
    : NICHE_TEMPLATES.filter((t) => t.category === activeCategory);

  return (
    <div className="max-w-2xl mx-auto px-4 pb-10">
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              placeholder="e.g. Remote teams, Pet owners..."
              className="w-full h-12 pl-12 pr-4 text-sm rounded-xl border border-border bg-[#faf9ff] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={!niche.trim() || isLoading}
            className="h-12 px-6 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 hover:-translate-y-0.5 active:scale-95"
            style={{ background: "linear-gradient(135deg, #6352dc, #a855f7)", boxShadow: "0 3px 14px rgba(99,82,220,0.30)" }}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
              </span>
            ) : hasResults ? (
              <span className="flex items-center justify-center gap-2">
                <RefreshCw className="h-4 w-4" /> Regenerate
              </span>
            ) : (
              "Discover Ideas"
            )}
          </button>
        </div>
      </form>

      {/* Action Pills */}
      <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
        <button
          type="button"
          onClick={() => {
            const random = RANDOM_NICHES[Math.floor(Math.random() * RANDOM_NICHES.length)];
            setNiche(random);
            onSurpriseMe(random);
          }}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-1.5 text-sm rounded-full border-[1.5px] border-primary/40 text-primary hover:bg-primary/8 transition-colors font-medium disabled:opacity-50"
        >
          <Shuffle className="h-3.5 w-3.5" /> Surprise Me
        </button>

        <button
          type="button"
          onClick={() => setShowTemplates((v) => !v)}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-1.5 text-sm rounded-full border-[1.5px] border-border text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors font-medium disabled:opacity-50"
        >
          {showTemplates ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          {showTemplates ? "Hide Templates" : "Browse Templates"}
        </button>
      </div>

      {/* Templates Panel */}
      {showTemplates && (
        <div className="mt-4 rounded-2xl border bg-white overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
          style={{ borderColor: "rgba(99,82,220,0.12)", boxShadow: "0 4px 24px rgba(99,82,220,0.07)" }}
        >
          {/* Category Filter */}
          <div className="px-4 pt-4 pb-3 border-b" style={{ borderColor: "#f0eeff" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "#6352dc" }}>
              Browse by Category
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveCategory("All")}
                className={`text-xs font-semibold px-3 py-1 rounded-full border-[1.5px] transition-all ${
                  activeCategory === "All"
                    ? "bg-primary text-white border-primary"
                    : "bg-muted text-muted-foreground border-border hover:border-primary/40 hover:text-primary"
                }`}
              >
                All
              </button>
              {CATEGORIES.slice(1).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`text-xs font-semibold px-3 py-1 rounded-full border-[1.5px] transition-all ${
                    activeCategory === cat ? CAT_ACTIVE_COLORS[cat] : CAT_COLORS[cat]
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Templates Grid — 2 cols mobile, 3 cols desktop */}
          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
            {filtered.map((template) => (
              <button
                key={template.label}
                onClick={() => handleTemplateClick(template)}
                className={`text-left p-3 rounded-xl border-[1.5px] transition-all hover:-translate-y-0.5 hover:shadow-sm ${CARD_COLORS[template.category]}`}
              >
                <p className="text-xs font-bold leading-tight">{template.label}</p>
                <p className="text-xs font-normal opacity-70 mt-0.5 leading-tight line-clamp-2">
                  {template.niche}
                </p>
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t text-center" style={{ borderColor: "#f0eeff", background: "#faf9ff" }}>
            <p className="text-xs text-muted-foreground">
              {filtered.length} templates · Click para auto-fill ang niche
            </p>
          </div>
        </div>
      )}
    </div>
  );
}