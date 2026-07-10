import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Zap } from "lucide-react";
import { z } from "zod";

const emailSchema = z.string().trim().email().max(255);
const pwSchema = z.string().min(8).max(72);

export default function Auth() {
  const { session, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const from = (location.state as any)?.from || "/";

  useEffect(() => { if (!loading && session) navigate(from, { replace: true }); }, [session, loading]);

  if (loading) return null;
  if (session) return <Navigate to={from} replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ep = emailSchema.safeParse(email);
    const pp = pwSchema.safeParse(password);
    if (!ep.success) return toast({ title: "Invalid email", variant: "destructive" });
    if (!pp.success) return toast({ title: "Password must be 8+ chars", variant: "destructive" });
    setBusy(true);
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { full_name: name || email.split("@")[0] },
        },
      });
      setBusy(false);
      if (error) return toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
      toast({ title: "Account created" });
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) return toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
    }
  };

  const google = async () => {
    setBusy(true);
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    setBusy(false);
    if (res.error) toast({ title: "Google sign-in failed", description: String((res.error as any)?.message || res.error), variant: "destructive" });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex items-center gap-2 justify-center">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <Zap className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-mono text-sm font-semibold text-foreground">AGENCY<span className="text-primary">.AI</span></span>
        </div>
        <div className="rounded-lg border border-border bg-card p-6 space-y-5">
          <div>
            <h1 className="text-lg font-semibold">{mode === "signin" ? "Sign in" : "Create account"}</h1>
            <p className="text-xs text-muted-foreground mt-1">Agency team access only.</p>
          </div>

          <Button type="button" variant="terminal" className="w-full" onClick={google} disabled={busy}>
            Continue with Google
          </Button>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px bg-border flex-1" /> or <div className="h-px bg-border flex-1" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === "signup" && (
              <div>
                <label className="text-xs font-mono uppercase text-muted-foreground">Name</label>
                <input className="terminal-input w-full mt-1" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            )}
            <div>
              <label className="text-xs font-mono uppercase text-muted-foreground">Email</label>
              <input type="email" className="terminal-input w-full mt-1" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="text-xs font-mono uppercase text-muted-foreground">Password</label>
              <input type="password" className="terminal-input w-full mt-1" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" variant="glow" className="w-full" disabled={busy}>
              {busy ? "…" : mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="w-full text-xs text-muted-foreground hover:text-foreground"
          >
            {mode === "signin" ? "No account? Sign up" : "Have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
