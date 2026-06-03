import { Outlet, Link, useLocation } from "react-router-dom";
import { Sparkles, Bookmark, LogOut, Crown, User, Menu, X } from "lucide-react";
import { supabase } from "@/api/supabaseClient";
import { useState } from "react";

export default function Layout() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-background font-inter">
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center group-hover:scale-105 transition-transform">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">Conceptli</span>
          </Link>
          {/* Desktop Nav */}
          <div className="hidden sm:flex items-center gap-1">
            <Link to="/" className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname === "/" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
              Generate
            </Link>
            <Link to="/saved" className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${location.pathname === "/saved" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
              <Bookmark className="h-4 w-4" />Saved
            </Link>
            <Link to="/pricing" className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${location.pathname === "/pricing" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
              <Crown className="h-4 w-4" />Pricing
            </Link>
            <Link to="/account" className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${location.pathname === "/account" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
              <User className="h-4 w-4" />Account
            </Link>
            <button onClick={handleLogout} className="ml-2 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title="Sign out">
              <LogOut className="h-4 w-4" />
            </button>
          </div>

          {/* Mobile Hamburger */}
          <button
            className="sm:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>
      {/* Mobile Dropdown Menu */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 sm:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}
      {menuOpen && (
        <div className="sm:hidden fixed top-16 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur-xl px-4 py-3 flex flex-col gap-1 shadow-lg">
          {[
            { to: "/", label: "Generate", icon: null },
            { to: "/saved", label: "Saved", icon: <Bookmark className="h-4 w-4" /> },
            { to: "/pricing", label: "Pricing", icon: <Crown className="h-4 w-4" /> },
            { to: "/account", label: "Account", icon: <User className="h-4 w-4" /> },
          ].map(({ to, label, icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === to
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {icon}{label}
            </Link>
          ))}
          <button
            onClick={() => { handleLogout(); setMenuOpen(false); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <LogOut className="h-4 w-4" />Sign out
          </button>
        </div>
      )}

      <main>
        <Outlet />
      </main>
    </div>
  );
}
