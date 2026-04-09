import { AppLayout } from "@/components/layout/AppLayout";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { BarChart3, Loader2, Save, Layout, Brain } from "lucide-react";
import { useLatestStrategy } from "@/hooks/use-latest-strategy";
import ReactMarkdown from "react-markdown";

const FUNNEL_TYPES = [
  { value: "lead_generation", label: "Lead Generation Funnel" },
  { value: "webinar", label: "Webinar Funnel" },
  { value: "sales_page", label: "Sales Page Funnel" },
  { value: "application", label: "Application Funnel" },
  { value: "ecommerce", label: "Ecommerce Funnel" },
];

export default function ConversionDesigner() {
  const [selectedClientId, setSelectedClientId] = useState("");
  const [funnelType, setFunnelType] = useState("lead_generation");
  const [context, setContext] = useState("");
  const [generatedDesign, setGeneratedDesign] = useState("");
  const queryClient = useQueryClient();

  const { data: clients } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("*").order("company_name");
      if (error) throw error;
      return data;
    },
  });

  const { data: savedDesigns } = useQuery({
    queryKey: ["funnel_designs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("funnel_designs").select("*, clients(company_name)").order("created_at", { ascending: false }).limit(10);
      if (error) throw error;
      return data;
    },
  });

  const selectedClient = clients?.find((c) => c.id === selectedClientId);
  const { data: latestStrategy } = useLatestStrategy(selectedClientId);

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedClient) throw new Error("Select a client first");
      const { data, error } = await supabase.functions.invoke("conversion-designer-agent", {
        body: { client: selectedClient, funnel_type: funnelType, context, strategy_context: latestStrategy?.content || null },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data.design;
    },
    onSuccess: (design) => {
      setGeneratedDesign(design);
      toast.success("Funnel design generated!");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedClient || !generatedDesign) throw new Error("Nothing to save");
      const { error } = await supabase.from("funnel_designs").insert({
        client_id: selectedClient.id,
        title: `${funnelType.replace(/_/g, " ")} — ${selectedClient.company_name}`,
        content: generatedDesign,
        funnel_type: funnelType,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Funnel design saved!");
      queryClient.invalidateQueries({ queryKey: ["funnel_designs"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <AppLayout>
      <div className="space-y-6 animate-slide-up">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Conversion Designer
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            GHL-ready funnel structures with section layouts, copy placement, and flow design
          </p>
        </div>

        <Card className="border-border bg-card">
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5 block">Client</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                >
                  <option value="">Select a client...</option>
                  {clients?.map((c) => (
                    <option key={c.id} value={c.id}>{c.company_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5 block">Funnel Type</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={funnelType}
                  onChange={(e) => setFunnelType(e.target.value)}
                >
                  {FUNNEL_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5 block">Additional Context (optional)</label>
              <Textarea
                placeholder="Specific requirements, existing brand assets, preferred colors, etc."
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className="bg-background border-input"
              />
            </div>
            <div className="flex gap-2 items-center">
              {selectedClientId && latestStrategy && (
                <div className="flex items-center gap-2 text-xs text-primary mr-auto">
                  <Brain className="h-3.5 w-3.5" />
                  <span>Strategy linked: {latestStrategy.title}</span>
                </div>
              )}
              <Button onClick={() => generateMutation.mutate()} disabled={!selectedClientId || generateMutation.isPending}>
                {generateMutation.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Designing...</> : <><Layout className="h-4 w-4 mr-2" />Design Funnel</>}
              </Button>
              </Button>
              {generatedDesign && (
                <Button variant="outline" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                  <Save className="h-4 w-4 mr-2" />Save Design
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {generatedDesign && (
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground">Generated Funnel Design</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown>{generatedDesign}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        )}

        {savedDesigns && savedDesigns.length > 0 && (
          <div>
            <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">Saved Designs</h2>
            <div className="space-y-2">
              {savedDesigns.map((d: any) => (
                <Card key={d.id} className="border-border bg-card cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setGeneratedDesign(d.content)}>
                  <CardContent className="py-3 px-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{d.title}</p>
                      <p className="text-xs text-muted-foreground">{d.funnel_type?.replace(/_/g, " ")} · {new Date(d.created_at).toLocaleDateString()}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setGeneratedDesign(d.content); }}>Load</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
