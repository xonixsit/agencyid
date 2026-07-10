import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Shield, User, Bell, Users, KeyRound } from "lucide-react";

export default function Settings() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [notifyReview, setNotifyReview] = useState(true);
  const [notifyWeekly, setNotifyWeekly] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setAvatarUrl(profile.avatar_url || "");
      setNotifyReview(profile.notify_review_ready);
      setNotifyWeekly(profile.notify_weekly_digest);
    }
  }, [profile]);

  const { data: team } = useQuery({
    queryKey: ["team"],
    queryFn: async () => {
      const { data: profs } = await supabase.from("profiles").select("*");
      const { data: roles } = await supabase.from("user_roles").select("*");
      return (profs || []).map((p) => ({ ...p, roles: (roles || []).filter((r) => r.user_id === p.id).map((r) => r.role) }));
    },
    enabled: isAdmin,
  });

  const saveProfile = async () => {
    setBusy(true);
    const { error } = await supabase.from("profiles").update({
      display_name: displayName || null,
      avatar_url: avatarUrl || null,
      notify_review_ready: notifyReview,
      notify_weekly_digest: notifyWeekly,
    }).eq("id", user!.id);
    setBusy(false);
    if (error) return toast({ title: "Save failed", description: error.message, variant: "destructive" });
    toast({ title: "Settings saved" });
    qc.invalidateQueries({ queryKey: ["profile"] });
  };

  const changePw = async () => {
    if (newPw.length < 8) return toast({ title: "Password must be 8+ chars", variant: "destructive" });
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setBusy(false);
    if (error) return toast({ title: "Update failed", description: error.message, variant: "destructive" });
    setNewPw("");
    toast({ title: "Password updated" });
  };

  const toggleRole = async (uid: string, hasAdmin: boolean) => {
    if (uid === user?.id) return toast({ title: "You can't change your own role", variant: "destructive" });
    if (hasAdmin) {
      await supabase.from("user_roles").delete().eq("user_id", uid).eq("role", "admin");
    } else {
      await supabase.from("user_roles").insert({ user_id: uid, role: "admin" });
    }
    qc.invalidateQueries({ queryKey: ["team"] });
    toast({ title: "Role updated" });
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>
        </div>

        <Section icon={<User className="h-4 w-4" />} title="Profile">
          <Field label="Display name">
            <input className="terminal-input w-full" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </Field>
          <Field label="Avatar URL">
            <input className="terminal-input w-full" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://…" />
          </Field>
        </Section>

        <Section icon={<Bell className="h-4 w-4" />} title="Notifications">
          <Toggle label="Email me when items are ready for review" checked={notifyReview} onChange={setNotifyReview} />
          <Toggle label="Weekly digest of pipeline activity" checked={notifyWeekly} onChange={setNotifyWeekly} />
        </Section>

        <div className="flex justify-end">
          <Button variant="glow" onClick={saveProfile} disabled={busy}>Save changes</Button>
        </div>

        <Section icon={<KeyRound className="h-4 w-4" />} title="Password">
          <div className="flex gap-2">
            <input type="password" className="terminal-input flex-1" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="New password (8+ chars)" />
            <Button variant="terminal" onClick={changePw} disabled={busy || !newPw}>Update password</Button>
          </div>
        </Section>

        {isAdmin && (
          <Section icon={<Users className="h-4 w-4" />} title="Team">
            <div className="space-y-2">
              {(team || []).map((m: any) => {
                const hasAdmin = m.roles.includes("admin");
                return (
                  <div key={m.id} className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2">
                    <div>
                      <div className="text-sm text-foreground">{m.display_name || "Unnamed"}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        {hasAdmin && <span className="inline-flex items-center gap-1 text-primary"><Shield className="h-3 w-3" /> admin</span>}
                        {!hasAdmin && <span>member</span>}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => toggleRole(m.id, hasAdmin)}>
                      {hasAdmin ? "Demote to member" : "Promote to admin"}
                    </Button>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-3">New signups become members. Anyone with the site link can register.</p>
          </Section>
        )}
      </div>
    </AppLayout>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-6 space-y-4">
      <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">{icon} {title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-mono uppercase text-muted-foreground block mb-1">{label}</label>
      {children}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (b: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="rounded border-border" />
      {label}
    </label>
  );
}
