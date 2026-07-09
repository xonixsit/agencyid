import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building2, Globe, Mail, User, Target, Megaphone, Palette, Trophy, Users, DollarSign, FileText, Sparkles, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { downloadOutputPdf } from "@/lib/pdf-export";
import { PipelineBoard } from "@/components/pipeline/PipelineBoard";
import { ReviewActions, TABLE_TO_STAGE } from "@/components/pipeline/ReviewActions";

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

function OutputCard({ item, typeField, agentLabel, clientName, table, clientId, autoChain }: { item: any; typeField?: string; agentLabel: string; clientName?: string; table: string; clientId: string; autoChain?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const contentField: "content" | "description" = table === "project_tasks" ? "description" : "content";
  const body = item[contentField] || "";
  const typeVal = typeField && item[typeField] ? String(item[typeField]).replace(/_/g, " ") : undefined;
  const stageKey = TABLE_TO_STAGE[table];

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setDownloading(true);
    try {
      await downloadOutputPdf({
        title: item.title,
        subtitle: clientName,
        agentLabel,
        meta: {
          Type: typeVal,
          Platform: item.platform,
          Status: item.review_status || item.status,
          Version: item.version ? `v${item.version}` : undefined,
          Created: new Date(item.created_at).toLocaleDateString(),
        },
        content: body,
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="rounded-md border border-border bg-background p-4 space-y-3">
      <div className="flex items-start justify-between gap-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-medium text-foreground">{item.title}</h3>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            {typeVal && <span className="font-mono">{typeVal}</span>}
            {item.platform && <span>· {item.platform}</span>}
            <span>· {new Date(item.created_at).toLocaleDateString()}</span>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleDownload} disabled={downloading} title="Download PDF">
          <Download className="h-3.5 w-3.5" />
        </Button>
      </div>
      {!expanded && (
        <p className="text-xs text-muted-foreground line-clamp-2 whitespace-pre-wrap">
          {body.slice(0, 200)}...
        </p>
      )}
      {expanded && (
        <div className="prose prose-invert prose-sm max-w-none mt-2">
          <ReactMarkdown>{body}</ReactMarkdown>
        </div>
      )}
      {item.review_notes && (
        <p className="text-xs text-yellow-400/80 border-l-2 border-yellow-500/40 pl-2">Feedback: {item.review_notes}</p>
      )}
      {stageKey && (
        <ReviewActions table={table} row={item} stageKey={stageKey} contentField={contentField} clientId={clientId} autoChain={autoChain} />
      )}
    </div>
  );
}

function OutputSection({ title, count, items, typeField, generatePath, generateLabel, agentLabel, clientName }: {
  title: string; count: number; items: any[]; typeField?: string;
  generatePath?: string; generateLabel?: string; agentLabel: string; clientName?: string;
}) {
  const navigate = useNavigate();
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-mono uppercase tracking-wider text-muted-foreground">
          {title} ({count})
        </h2>
        {generatePath && (
          <Button variant="ghost" size="sm" onClick={() => navigate(generatePath)}>
            {generateLabel || "Generate New"}
          </Button>
        )}
      </div>
      {!items.length ? (
        <p className="text-xs text-dim py-6 text-center">No {title.toLowerCase()} generated yet</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <OutputCard key={item.id} item={item} typeField={typeField} agentLabel={agentLabel} clientName={clientName} />
          ))}
        </div>
      )}
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

  const { data: mediaPlans } = useQuery({
    queryKey: ["media_plans", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("media_plans").select("*").eq("client_id", id!).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: automations } = useQuery({
    queryKey: ["automations", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("automations").select("*").eq("client_id", id!).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: funnelDesigns } = useQuery({
    queryKey: ["funnel_designs", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("funnel_designs").select("*").eq("client_id", id!).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: creativeBriefs } = useQuery({
    queryKey: ["creative_briefs", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("creative_briefs").select("*").eq("client_id", id!).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: projectTasks } = useQuery({
    queryKey: ["project_tasks", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("project_tasks").select("*").eq("client_id", id!).order("created_at", { ascending: false });
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
          <Button variant="ghost" className="mt-4" onClick={() => navigate("/clients")}>Back to Clients</Button>
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
              <Sparkles className="h-4 w-4" /> Strategy
            </Button>
            <Button variant="terminal" onClick={() => navigate(`/copywriter?client=${client.id}`)}>
              <FileText className="h-4 w-4" /> Copy
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

        <OutputSection title="Strategies" count={strategies?.length || 0} items={strategies || []}
          typeField="strategy_type" generatePath={`/strategist?client=${client.id}`}
          agentLabel="Strategist" clientName={client.company_name} />

        <OutputSection title="Copy Outputs" count={copyOutputs?.length || 0} items={copyOutputs || []}
          typeField="copy_type" generatePath={`/copywriter?client=${client.id}`}
          agentLabel="Copywriter" clientName={client.company_name} />

        <OutputSection title="Media Plans" count={mediaPlans?.length || 0} items={mediaPlans || []}
          typeField="campaign_objective" generatePath={`/campaigns?client=${client.id}`}
          agentLabel="Media Buyer" clientName={client.company_name} />

        <OutputSection title="Automations" count={automations?.length || 0} items={automations || []}
          typeField="automation_type" generatePath={`/automations?client=${client.id}`}
          agentLabel="Automation Builder" clientName={client.company_name} />

        <OutputSection title="Funnel Designs" count={funnelDesigns?.length || 0} items={funnelDesigns || []}
          typeField="funnel_type" generatePath={`/funnels?client=${client.id}`}
          agentLabel="Conversion Designer" clientName={client.company_name} />

        <OutputSection title="Creative Briefs" count={creativeBriefs?.length || 0} items={creativeBriefs || []}
          typeField="brief_type" generatePath={`/designer?client=${client.id}`}
          agentLabel="Graphic Designer" clientName={client.company_name} />

        <OutputSection title="Project Plans" count={projectTasks?.length || 0} items={projectTasks || []}
          typeField="agent_type" generatePath={`/project-manager?client=${client.id}`}
          agentLabel="Project Manager" clientName={client.company_name} />
      </div>
    </AppLayout>
  );
}
