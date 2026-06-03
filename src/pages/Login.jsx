import { useState } from "react";
import { supabase } from "@/api/supabaseClient";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Eye, EyeOff, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import GoogleIcon from "@/components/ui/GoogleIcon";
import AuthLayout from "@/components/ui/AuthLayout";

const FRIENDLY_ERRORS = {
  "Invalid login credentials": "Mali ang email o password. Subukan ulit.",
  "Email not confirmed": "Hindi pa na-confirm ang iyong email. Tingnan ang iyong inbox.",
  "Too many requests": "Masyadong maraming attempts. Maghintay ng ilang minuto.",
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(FRIENDLY_ERRORS[error.message] || error.message);
      setLoading(false);
    } else {
      navigate("/");
    }
  };

  const handleGoogle = async () => {
    console.log("Attempting Google OAuth...");
    console.log("Origin:", window.location.origin);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your Conceptli account"
      footer={
        <>
          Wala pang account?{" "}
          <Link to="/register" className="text-primary hover:underline font-medium">
            Sign up for free
          </Link>
        </>
      }
    >
      <div className="space-y-5">
        <Button variant="outline" className="w-full" onClick={handleGoogle}>
          <GoogleIcon className="h-4 w-4 mr-2" />
          Continue with Google
        </Button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <LogIn className="h-4 w-4 mr-2" />}
            Sign In
          </Button>
        </form>
      </div>
    </AuthLayout>
  );
}
