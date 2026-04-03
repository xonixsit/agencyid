import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building2, Globe, Mail, User, Target, Megaphone, Palette, Trophy, Users, DollarSign, FileText, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const statusColor = (s: string) =>
  s === "active" ? "bg-status-active/10 text-status-active" :
  s === "onboarding" ? "bg-status-info/10 text-status-info" :
  s === "paused" ? "bg-status-warning/10 text-status-warning" :
  "bg-muted text-muted-foreground";

const dotColor = (s: string) =>
  s === "active" ? "bg-status-active" :
  s === "onboarding" ? "bg-status-info" :
  s === "paused" ? "bg-status-warning" :
  "bg-muted-foreground";

interface InfoItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
  full?: boolean;
}

function InfoItem({ icon, label, value, full }: InfoItemProps) {
  if (!value) return null;
  return (
    <div className={cn("space-y-1", full && "col-span-2")}>
      <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="text-sm text-foreground whitespace-pre-wrap">{value}</p>
    </div>
  );
}

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: client, isLoading } = useQuery({
    queryKey: ["client", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: strategies } = useQuery({
    queryKey: ["strategies", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("strategies").select("*").eq("client_id", id!).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: copyOutputs } = useQuery({
    queryKey: ["copy_outputs", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("copy_outputs").select("*").eq("client_id", id!).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-4 animate-pulse">
          <div className="h-8 w-48 rounded bg-muted" />
          <div className="h-64 rounded-lg border border-border bg-card" />
        </div>
      </AppLayout>
    );
  }

  if (!client) {
    return (
      <AppLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Client not found</p>
          <Button variant="ghost" className="mt-4" onClick={() => navigate("/clients")}>
            Back to Clients
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 animate-slide-up">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/clients")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 border border-primary/20">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground tracking-tight">{client.company_name}</h1>
                <p className="text-xs text-muted-foreground">{client.industry || "No industry"}</p>
              </div>
              <span className={cn("status-badge ml-2", statusColor(client.status))}>
                <span className={cn("h-1.5 w-1.5 rounded-full", dotColor(client.status))} />
                {client.status}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="terminal" onClick={() => navigate(`/strategist?client=${client.id}`)}>
              <Sparkles className="h-4 w-4" />
              Generate Strategy
            </Button>
            <Button variant="terminal" onClick={() => navigate(`/copywriter?client=${client.id}`)}>
              <FileText className="h-4 w-4" />
              Generate Copy
            </Button>
          </div>
        </div>

        {/* Client Profile Card */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-sm font-mono uppercase tracking-wider text-muted-foreground mb-4">Client Profile</h2>
          <div className="grid grid-cols-2 gap-5">
            <InfoItem icon={<User className="h-3.5 w-3.5" />} label="Contact" value={client.contact_name} />
            <InfoItem icon={<Mail className="h-3.5 w-3.5" />} label="Email" value={client.contact_email} />
            <InfoItem icon={<Globe className="h-3.5 w-3.5" />} label="Website" value={client.website_url} />
            <InfoItem icon={<DollarSign className="h-3.5 w-3.5" />} label="Budget" value={client.budget} />
            <InfoItem icon={<Target className="h-3.5 w-3.5" />} label="Core Offer" value={client.offer} full />
            <InfoItem icon={<Users className="h-3.5 w-3.5" />} label="Target Audience" value={client.target_audience} full />
            <InfoItem icon={<Megaphone className="h-3.5 w-3.5" />} label="Positioning" value={client.positioning} full />
            <InfoItem icon={<Trophy className="h-3.5 w-3.5" />} label="Goals" value={client.goals} full />
            <InfoItem icon={<Palette className="h-3.5 w-3.5" />} label="Brand Voice" value={client.brand_voice} full />
            <InfoItem icon={<Building2 className="h-3.5 w-3.5" />} label="Competitors" value={client.competitors} full />
            {client.notes && <InfoItem icon={<FileText className="h-3.5 w-3.5" />} label="Notes" value={client.notes} full />}
          </div>
        </div>

        {/* Strategies */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-mono uppercase tracking-wider text-muted-foreground">
              Strategies ({strategies?.length || 0})
            </h2>
            <Button variant="ghost" size="sm" onClick={() => navigate(`/strategist?client=${client.id}`)}>
              Generate New
            </Button>
          </div>
          {!strategies?.length ? (
            <p className="text-xs text-dim py-6 text-center">No strategies generated yet</p>
          ) : (
            <div className="space-y-3">
              {strategies.map((s) => (
                <div key={s.id} className="rounded-md border border-border bg-background p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-foreground">{s.title}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-mono">{s.strategy_type.replace(/_/g, " ")}</span>
                      <span className={cn(
                        "status-badge text-xs",
                        s.status === "approved" ? "bg-status-active/10 text-status-active" : "bg-muted text-muted-foreground"
                      )}>
                        {s.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-3 whitespace-pre-wrap">{s.content.slice(0, 300)}...</p>
                  <p className="text-xs text-dim">{new Date(s.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Copy Outputs */}
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-mono uppercase tracking-wider text-muted-foreground">
              Copy Outputs ({copyOutputs?.length || 0})
            </h2>
            <Button variant="ghost" size="sm" onClick={() => navigate(`/copywriter?client=${client.id}`)}>
              Generate New
            </Button>
          </div>
          {!copyOutputs?.length ? (
            <p className="text-xs text-dim py-6 text-center">No copy generated yet</p>
          ) : (
            <div className="space-y-3">
              {copyOutputs.map((c) => (
                <div key={c.id} className="rounded-md border border-border bg-background p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-foreground">{c.title}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-mono">{c.copy_type.replace(/_/g, " ")}</span>
                      {c.platform && <span className="text-xs text-dim">· {c.platform}</span>}
                      <span className={cn(
                        "status-badge text-xs",
                        c.status === "approved" ? "bg-status-active/10 text-status-active" : "bg-muted text-muted-foreground"
                      )}>
                        {c.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-3 whitespace-pre-wrap">{c.content.slice(0, 300)}...</p>
                  <p className="text-xs text-dim">{new Date(c.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
