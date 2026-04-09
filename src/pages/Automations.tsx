import { AppLayout } from "@/components/layout/AppLayout";
import { Zap, Loader2, Save, ChevronDown, Brain } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useLatestStrategy } from "@/hooks/use-latest-strategy";
import ReactMarkdown from "react-markdown";

const AUTOMATION_TYPES = [
  { value: "nurture_sequence", label: "Nurture Sequence" },
  { value: "crm_workflow", label: "CRM Workflow" },
  { value: "booking_funnel", label: "Booking Funnel" },
  { value: "reactivation", label: "Reactivation Campaign" },
  { value: "onboarding", label: "Client Onboarding" },
];

export default function Automations() {
  const [selectedClientId, setSelectedClientId] = useState("");
  const [automationType, setAutomationType] = useState("nurture_sequence");
  const [context, setContext] = useState("");
  const [generatedAutomation, setGeneratedAutomation] = useState("");

  const { data: clients } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("*").order("company_name");
      if (error) throw error;
      return data;
    },
  });

  const { data: savedAutomations, refetch: refetchSaved } = useQuery({
    queryKey: ["automations", selectedClientId],
    queryFn: async () => {
      let query = supabase.from("automations").select("*").order("created_at", { ascending: false });
      if (selectedClientId) query = query.eq("client_id", selectedClientId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const selectedClient = clients?.find((c) => c.id === selectedClientId);
  const { data: latestStrategy } = useLatestStrategy(selectedClientId);

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedClient) throw new Error("Select a client first");
      const { data, error } = await supabase.functions.invoke("automation-builder-agent", {
        body: { client: selectedClient, automation_type: automationType, context, strategy_context: latestStrategy?.content || null },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data.automation;
    },
    onSuccess: (automation) => {
      setGeneratedAutomation(automation);
      toast.success("Automation blueprint generated");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedClient || !generatedAutomation) throw new Error("Nothing to save");
      const typeLabel = AUTOMATION_TYPES.find((t) => t.value === automationType)?.label || automationType;
      const { error } = await supabase.from("automations").insert({
        client_id: selectedClient.id,
        title: `${typeLabel} — ${selectedClient.company_name}`,
        automation_type: automationType,
        content: generatedAutomation,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Automation saved");
      refetchSaved();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <AppLayout>
      <div className="space-y-6 animate-slide-up">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-3">
            <Zap className="h-6 w-6 text-primary" />
            Automation Builder
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Generate GHL-ready CRM workflows, nurture sequences, and automation blueprints
          </p>
        </div>

        {/* Controls */}
        <Card className="p-5 space-y-4 bg-card border-border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField label="Client" value={selectedClientId} onChange={setSelectedClientId} options={(clients || []).map((c) => ({ value: c.id, label: c.company_name }))} placeholder="Select client" />
            <SelectField label="Automation Type" value={automationType} onChange={setAutomationType} options={AUTOMATION_TYPES} />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Additional Context (optional)</label>
            <Textarea value={context} onChange={(e) => setContext(e.target.value)} placeholder="e.g. Focus on SMS-heavy nurture, 7-day sequence, webinar funnel..." className="bg-background border-border text-sm" rows={2} />
          </div>
          {selectedClientId && latestStrategy && (
            <div className="flex items-center gap-2 text-xs text-primary mb-2">
              <Brain className="h-3.5 w-3.5" />
              <span>Strategy linked: {latestStrategy.title}</span>
            </div>
          )}
          <Button onClick={() => generateMutation.mutate()} disabled={!selectedClientId || generateMutation.isPending} className="w-full">
            {generateMutation.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating Blueprint...</> : "Generate Automation"}
          </Button>
        </Card>

        {/* Generated Output */}
        {generatedAutomation && (
          <Card className="p-5 bg-card border-border space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-mono uppercase tracking-wider text-muted-foreground">Generated Blueprint</h2>
              <Button size="sm" variant="outline" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                <Save className="h-4 w-4 mr-1" />Save
              </Button>
            </div>
            <div className="prose prose-invert prose-sm max-w-none text-foreground">
              <ReactMarkdown>{generatedAutomation}</ReactMarkdown>
            </div>
          </Card>
        )}

        {/* Saved Automations */}
        {savedAutomations && savedAutomations.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Saved Automations</h2>
            {savedAutomations.map((a) => (
              <SavedAutomationCard key={a.id} automation={a} onLoad={() => setGeneratedAutomation(a.content)} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function SavedAutomationCard({ automation, onLoad }: { automation: any; onLoad: () => void }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Card className="p-4 bg-card border-border">
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div>
          <p className="text-sm font-medium text-foreground">{automation.title}</p>
          <p className="text-xs text-muted-foreground">{automation.automation_type.replace(/_/g, " ")} · {new Date(automation.created_at).toLocaleDateString()}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">{automation.status}</Badge>
          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onLoad(); }}>Load</Button>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} />
        </div>
      </div>
      {expanded && (
        <div className="mt-3 pt-3 border-t border-border prose prose-invert prose-sm max-w-none text-foreground">
          <ReactMarkdown>{automation.content}</ReactMarkdown>
        </div>
      )}
    </Card>
  );
}

function SelectField({ label, value, onChange, options, placeholder }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; placeholder?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground">
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
