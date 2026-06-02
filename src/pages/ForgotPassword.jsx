import { useState } from "react";
import { supabase } from "@/api/supabaseClient";
import { Link } from "react-router-dom";
import { Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AuthLayout from "@/components/ui/AuthLayout";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Magpapadala kami ng reset link sa iyong email"
      footer={
        <Link to="/login" className="text-primary hover:underline font-medium">
          ← Back to Login
        </Link>
      }
    >
      {sent ? (
        <div className="text-center space-y-4">
          <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
            <Mail className="h-7 w-7 text-emerald-600" />
          </div>
          <div>
            <p className="text-foreground font-semibold">Email sent!</p>
            <p className="text-sm text-muted-foreground mt-1">
              Tingnan ang iyong inbox para sa reset link na ipinadala sa <strong>{email}</strong>.
            </p>
          </div>
          <Button variant="outline" className="w-full" asChild>
            <Link to="/login">Back to Login</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
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

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
            Send Reset Link
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}