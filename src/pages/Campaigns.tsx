import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Target, Loader2, ChevronDown, Save, Brain } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLatestStrategy } from "@/hooks/use-latest-strategy";
import ReactMarkdown from "react-markdown";
import { useSearchParams } from "react-router-dom";

const PLATFORMS = [
  { value: "meta", label: "Meta (Facebook/Instagram)" },
  { value: "google", label: "Google Ads" },
  { value: "tiktok", label: "TikTok Ads" },
  { value: "linkedin", label: "LinkedIn Ads" },
];

const OBJECTIVES = [
  { value: "conversions", label: "Conversions (Sales/Leads)" },
  { value: "traffic", label: "Traffic" },
  { value: "awareness", label: "Brand Awareness" },
  { value: "engagement", label: "Engagement" },
  { value: "app_installs", label: "App Installs" },
  { value: "video_views", label: "Video Views" },
];

const BUDGET_SPLITS = [
  { value: "balanced", label: "Balanced across funnel" },
  { value: "tofu_heavy", label: "Top-of-funnel heavy (60/25/15)" },
  { value: "bofu_heavy", label: "Bottom-of-funnel heavy (20/30/50)" },
  { value: "retargeting_focus", label: "Retargeting focus (30/20/50)" },
];

export default function Campaigns() {
  const [searchParams] = useSearchParams();
  const [selectedClientId, setSelectedClientId] = useState(searchParams.get("client") || "");
  const [platform, setPlatform] = useState("meta");
  const [objective, setObjective] = useState("conversions");
  const [budgetSplit, setBudgetSplit] = useState("balanced");
  const [generatedPlan, setGeneratedPlan] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: latestStrategy } = useLatestStrategy(selectedClientId);

  const { data: clients } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: savedPlans } = useQuery({
    queryKey: ["media_plans"],
    queryFn: async () => {
      const { data, error } = await supabase.from("media_plans").select("*, clients(company_name)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const client = clients?.find((c) => c.id === selectedClientId);
      if (!client) throw new Error("Select a client");

      const response = await supabase.functions.invoke("media-buyer-agent", {
        body: {
          client: {
            company_name: client.company_name,
            industry: client.industry,
            offer: client.offer,
            target_audience: client.target_audience,
            positioning: client.positioning,
            goals: client.goals,
            competitors: client.competitors,
            budget: client.budget,
          },
          platform,
          campaign_objective: objective,
          budget_split: BUDGET_SPLITS.find((b) => b.value === budgetSplit)?.label,
          strategy_context: latestStrategy?.content || null,
        },
      });

      if (response.error) throw response.error;
      return { ...response.data, client };
    },
    onSuccess: (data) => {
      setGeneratedPlan(data.media_plan);
      toast({ title: "Media plan generated" });
    },
    onError: (err: Error) => {
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!generatedPlan || !selectedClientId) throw new Error("Nothing to save");
      const client = clients?.find((c) => c.id === selectedClientId);
      const platformLabel = PLATFORMS.find((p) => p.value === platform)?.label || platform;
      const { error } = await supabase.from("media_plans").insert({
        client_id: selectedClientId,
        title: `${platformLabel} — ${OBJECTIVES.find((o) => o.value === objective)?.label || objective} — ${client?.company_name}`,
        content: generatedPlan,
        platform,
        campaign_objective: objective,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Media plan saved" });
      queryClient.invalidateQueries({ queryKey: ["media_plans"] });
    },
    onError: (err: Error) => {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    },
  });

  return (
    <AppLayout>
      <div className="space-y-6 animate-slide-up">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-3">
            <Target className="h-6 w-6 text-primary" />
            Media Buyer Agent
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Generate campaign structures with targeting, budget allocation, and scaling logic
          </p>
        </div>

        {/* Controls */}
        <div className="rounded-lg border border-border bg-card p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <SelectField
              label="Client"
              value={selectedClientId}
              onChange={setSelectedClientId}
              options={[{ value: "", label: "Select a client..." }, ...(clients?.map((c) => ({ value: c.id, label: c.company_name })) || [])]}
            />
            <SelectField
              label="Platform"
              value={platform}
              onChange={setPlatform}
              options={PLATFORMS}
            />
            <SelectField
              label="Campaign Objective"
              value={objective}
              onChange={setObjective}
              options={OBJECTIVES}
            />
            <SelectField
              label="Budget Split"
              value={budgetSplit}
              onChange={setBudgetSplit}
              options={BUDGET_SPLITS}
            />
          </div>

          {selectedClientId && latestStrategy && (
            <div className="flex items-center gap-2 text-xs text-primary">
              <Brain className="h-3.5 w-3.5" />
              <span>Strategy linked: {latestStrategy.title}</span>
            </div>
          )}

          <Button
            variant="glow"
            onClick={() => generateMutation.mutate()}
            disabled={!selectedClientId || generateMutation.isPending}
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating Media Plan...
              </>
            ) : (
              "Generate Media Plan"
            )}
          </Button>
        </div>

        {/* Output */}
        {generatedPlan && (
          <div className="rounded-lg border border-border bg-card p-6 glow-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                Generated Media Plan
              </h2>
              <Button
                variant="terminal"
                size="sm"
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
              >
                <Save className="h-3.5 w-3.5" />
                {saveMutation.isPending ? "Saving..." : "Save Plan"}
              </Button>
            </div>
            <div className="prose prose-invert prose-sm max-w-none prose-headings:text-foreground prose-p:text-secondary-foreground prose-strong:text-foreground prose-li:text-secondary-foreground prose-table:text-secondary-foreground prose-th:text-foreground prose-th:border-border prose-td:border-border">
              <ReactMarkdown>{generatedPlan}</ReactMarkdown>
            </div>
          </div>
        )}

        {/* Saved Plans */}
        {savedPlans && savedPlans.length > 0 && (
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">
              Saved Media Plans ({savedPlans.length})
            </h2>
            <div className="space-y-3">
              {savedPlans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => setGeneratedPlan(plan.content)}
                  className="w-full text-left rounded-md border border-border bg-background p-4 space-y-1 hover:border-primary/20 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-foreground">{plan.title}</h3>
                    <span className="text-xs text-muted-foreground font-mono">{plan.platform}</span>
                  </div>
                  <p className="text-xs text-dim">{new Date(plan.created_at).toLocaleDateString()}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function SelectField({ label, value, onChange, options }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
        {label}
      </label>
      <div className="relative">
        <select
          className="terminal-input w-full appearance-none pr-10"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      </div>
    </div>
  );
}
