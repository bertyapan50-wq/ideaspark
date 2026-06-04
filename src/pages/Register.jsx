import { useState } from "react";
import { supabase } from "@/api/supabaseClient";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Eye, EyeOff, Sparkles, UserPlus, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import GoogleIcon from "@/components/ui/GoogleIcon";
import AuthLayout from "@/components/ui/AuthLayout";

const FRIENDLY_ERRORS = {
  "User already registered": "May account na ang email na ito. Mag-login na lang.",
  "Password should be at least 6 characters": "Ang password ay dapat hindi bababa sa 6 na characters.",
  "Unable to validate email address: invalid format": "Hindi valid ang format ng email address.",
};

function PasswordStrength({ password }) {
  const checks = [
  { label: "6+ characters", pass: password.length >= 6 },
  { label: "Uppercase letter", pass: /[A-Z]/.test(password) },
  { label: "Number", pass: /[0-9]/.test(password) },
];
  const score = checks.filter((c) => c.pass).length;
  const colors = ["bg-destructive", "bg-amber-400", "bg-emerald-500"];
  const labels = ["Weak", "Fair", "Strong"];

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              i < score ? colors[score - 1] : "bg-muted"
            }`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className={`text-xs font-medium ${score === 3 ? "text-emerald-600" : score === 2 ? "text-amber-600" : "text-destructive"}`}>
          {labels[score - 1] || ""}
        </span>
        <div className="flex gap-2">
          {checks.map((c) => (
            <span key={c.label} className={`text-xs ${c.pass ? "text-emerald-600" : "text-muted-foreground"}`}>
              {c.pass ? "✓" : "○"} {c.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function PasswordMatchIndicator({ password, confirm }) {
  if (!confirm) return null;
  const match = password === confirm;
  return (
    <div className={`flex items-center gap-1.5 mt-1.5 text-xs font-medium ${match ? "text-emerald-600" : "text-destructive"}`}>
      {match
        ? <><CheckCircle2 className="h-3.5 w-3.5" /> Passwords match</>
: <><XCircle className="h-3.5 w-3.5" /> Passwords do not match</>
      }
    </div>
  );
}

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const passwordsMatch = password === confirmPassword;
  const canSubmit = !loading && password.length >= 6 && passwordsMatch && confirmPassword.length > 0;

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!passwordsMatch) {
      setError("Hindi magkatugma ang passwords. Pakiulit.");
      return;
    }
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) {
      setError(FRIENDLY_ERRORS[error.message] || error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
  };

  if (success) {
    return (
      <AuthLayout title="Check your email!" subtitle={`Nagpadala kami ng confirmation link sa ${email}`}>
        <div className="text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
            <Sparkles className="h-8 w-8 text-emerald-600" />
          </div>
          <p className="text-sm text-muted-foreground">
            I-click ang link sa iyong email para ma-activate ang iyong account.
          </p>
          <Button variant="outline" className="w-full" onClick={() => navigate("/login")}>
            Back to Login
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start generating ideas for free"
      footer={
        <>
          May account na?{" "}
          <Link to="/login" className="text-primary hover:underline font-medium">
            Sign in
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

        <form onSubmit={handleRegister} className="space-y-4">
          {/* Full Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Juan dela Cruz"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          {/* Email */}
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

          {/* Password */}
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
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
            <PasswordStrength password={password} />
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className={`pr-10 transition-colors ${
                  confirmPassword
                    ? passwordsMatch
                      ? "border-emerald-400 focus-visible:ring-emerald-300"
                      : "border-destructive focus-visible:ring-destructive/30"
                    : ""
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <PasswordMatchIndicator password={password} confirm={confirmPassword} />
          </div>

          {/* Error */}
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {/* Submit */}
          <Button type="submit" className="w-full" disabled={!canSubmit}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
            Create Account
          </Button>
        </form>
      </div>
    </AuthLayout>
  );
}