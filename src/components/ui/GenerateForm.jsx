import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  // Health & Wellness
  { label: "Fitness Coaching", niche: "Online fitness coaching for busy professionals", category: "Health" },
  { label: "Mental Health", niche: "Mental health support and therapy tools for remote workers", category: "Health" },
  { label: "Sleep Tracking", niche: "Sleep optimization and insomnia solutions for shift workers", category: "Health" },
  { label: "Nutrition Planning", niche: "Personalized meal planning and nutrition tracking for athletes", category: "Health" },

  // Productivity
  { label: "Freelancer Tools", niche: "Productivity and project management tools for freelancers", category: "Productivity" },
  { label: "Remote Teams", niche: "Async collaboration tools for distributed remote teams", category: "Productivity" },
  { label: "Deep Work", niche: "Focus and deep work tools for knowledge workers", category: "Productivity" },
  { label: "Meeting Tools", niche: "AI-powered meeting summaries and action item tracking", category: "Productivity" },

  // Finance
  { label: "Personal Finance", niche: "Personal budgeting and savings automation for millennials", category: "Finance" },
  { label: "Freelance Invoicing", niche: "Invoicing and tax management for self-employed freelancers", category: "Finance" },
  { label: "Crypto Tools", niche: "Crypto portfolio tracking and tax reporting for retail investors", category: "Finance" },
  { label: "Small Biz Finance", niche: "Cash flow management and forecasting for small businesses", category: "Finance" },

  // Education
  { label: "Kids EdTech", niche: "Gamified learning platform for elementary school kids", category: "Education" },
  { label: "Language Learning", niche: "Conversational language learning for adult professionals", category: "Education" },
  { label: "Coding Bootcamps", niche: "Self-paced coding courses with job placement for career changers", category: "Education" },
  { label: "Corporate Training", niche: "Microlearning and skills training platform for enterprise teams", category: "Education" },

  // E-commerce
  { label: "Dropshipping Tools", niche: "Product research and supplier automation for dropshippers", category: "E-commerce" },
  { label: "Amazon Sellers", niche: "Listing optimization and inventory management for Amazon FBA sellers", category: "E-commerce" },
  { label: "Creator Merch", niche: "Print-on-demand merch store tools for content creators", category: "E-commerce" },
  { label: "Local Retail", niche: "Inventory and loyalty program tools for local retail stores", category: "E-commerce" },

  // Creator Economy
  { label: "Newsletter Tools", niche: "Newsletter monetization and audience growth for independent writers", category: "Creator" },
  { label: "Podcast Tools", niche: "Podcast production, distribution, and monetization for indie podcasters", category: "Creator" },
  { label: "YouTube Creators", niche: "Analytics and sponsorship management tools for YouTube creators", category: "Creator" },
  { label: "Course Creators", niche: "Online course creation and community building for expert creators", category: "Creator" },

  // Real Estate
  { label: "Property Management", niche: "Tenant management and rent collection tools for landlords", category: "Real Estate" },
  { label: "Real Estate Agents", niche: "Lead generation and CRM tools for independent real estate agents", category: "Real Estate" },
  { label: "Short-term Rentals", niche: "Airbnb and short-term rental automation and pricing tools", category: "Real Estate" },

  // Legal & HR
  { label: "HR for SMBs", niche: "Employee onboarding and HR compliance tools for small businesses", category: "Legal & HR" },
  { label: "Legal for Startups", niche: "Contract generation and legal document automation for startups", category: "Legal & HR" },
  { label: "Hiring Tools", niche: "AI-powered candidate screening and interview tools for recruiters", category: "Legal & HR" },
];

const CATEGORIES = ["All", "Health", "Productivity", "Finance", "Education", "E-commerce", "Creator", "Real Estate", "Legal & HR"];

const CATEGORY_COLORS = {
  Health:        "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200",
  Productivity:  "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200",
  Finance:       "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200",
  Education:     "bg-violet-100 text-violet-700 border-violet-200 hover:bg-violet-200",
  "E-commerce":  "bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-200",
  Creator:       "bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200",
  "Real Estate": "bg-cyan-100 text-cyan-700 border-cyan-200 hover:bg-cyan-200",
  "Legal & HR":  "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200",
};

const ACTIVE_CATEGORY_COLORS = {
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

      {/* Surprise Me + Browse Templates */}
      <div className="flex items-center justify-center gap-3 mt-4">
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

        <button
          type="button"
          onClick={() => setShowTemplates((v) => !v)}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-1.5 text-sm rounded-full border border-border text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors font-medium disabled:opacity-50"
        >
          {showTemplates ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          {showTemplates ? "Hide Templates" : "Browse Templates"}
        </button>
      </div>

      {/* Templates Panel */}
      {showTemplates && (
        <div className="mt-4 rounded-2xl border border-border bg-card shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">

          {/* Category Filter */}
          <div className="px-4 pt-4 pb-3 border-b border-border">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
              Browse by Category
            </p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`text-xs font-semibold px-3 py-1 rounded-full border transition-all ${
                    activeCategory === cat
                      ? cat === "All"
                        ? "bg-primary text-primary-foreground border-primary"
                        : ACTIVE_CATEGORY_COLORS[cat]
                      : cat === "All"
                      ? "bg-muted text-muted-foreground border-border hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                      : CATEGORY_COLORS[cat]
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Templates Grid */}
          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
            {filtered.map((template) => (
              <button
                key={template.label}
                onClick={() => handleTemplateClick(template)}
                className={`text-left p-3 rounded-xl border transition-all group hover:shadow-sm ${
                  CATEGORY_COLORS[template.category]
                }`}
              >
                <p className="text-xs font-bold leading-tight">{template.label}</p>
                <p className="text-xs font-normal opacity-70 mt-0.5 leading-tight line-clamp-2">
                  {template.niche}
                </p>
              </button>
            ))}
          </div>

          {/* Footer hint */}
          <div className="px-4 py-2.5 border-t border-border bg-muted/30">
            <p className="text-xs text-muted-foreground text-center">
              {filtered.length} templates · Click para auto-fill ang niche
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
