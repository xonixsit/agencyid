import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Brain, Loader2, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

export default function Strategist() {
  const [selectedClientId, setSelectedClientId] = useState("");
  const [strategyType, setStrategyType] = useState("full_funnel");
  const [generatedStrategy, setGeneratedStrategy] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: clients } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const client = clients?.find((c) => c.id === selectedClientId);
      if (!client) throw new Error("Select a client");

      const response = await supabase.functions.invoke("strategist-agent", {
        body: {
          client: {
            company_name: client.company_name,
            industry: client.industry,
            offer: client.offer,
            target_audience: client.target_audience,
            positioning: client.positioning,
            goals: client.goals,
            brand_voice: client.brand_voice,
            competitors: client.competitors,
            budget: client.budget,
          },
          strategy_type: strategyType,
        },
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: async (data) => {
      setGeneratedStrategy(data.strategy);
      // Persist strategy to database so downstream agents can reference it
      const client = clients?.find((c) => c.id === selectedClientId);
      const { error } = await supabase.from("strategies").insert({
        client_id: selectedClientId,
        title: `${strategyType.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())} Strategy — ${client?.company_name || "Client"}`,
        content: data.strategy,
        strategy_type: strategyType as any,
        status: "draft",
      });
      if (error) {
        console.error("Failed to save strategy:", error);
        toast({ title: "Strategy generated but failed to save", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Strategy generated & saved" });
      }
      queryClient.invalidateQueries({ queryKey: ["strategies"] });
      queryClient.invalidateQueries({ queryKey: ["latest_strategy", selectedClientId] });
    },
    onError: (err: Error) => {
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
    },
  });

  return (
    <AppLayout>
      <div className="space-y-6 animate-slide-up">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-3">
            <Brain className="h-6 w-6 text-primary" />
            Strategist Agent
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Generate full funnel strategies from client data
          </p>
        </div>

        {/* Controls */}
        <div className="rounded-lg border border-border bg-card p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
                Client
              </label>
              <div className="relative">
                <select
                  className="terminal-input w-full appearance-none pr-10"
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                >
                  <option value="">Select a client...</option>
                  {clients?.map((c) => (
                    <option key={c.id} value={c.id}>{c.company_name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
                Strategy Type
              </label>
              <div className="relative">
                <select
                  className="terminal-input w-full appearance-none pr-10"
                  value={strategyType}
                  onChange={(e) => setStrategyType(e.target.value)}
                >
                  <option value="full_funnel">Full Funnel</option>
                  <option value="top_of_funnel">Top of Funnel</option>
                  <option value="mid_funnel">Mid Funnel</option>
                  <option value="bottom_funnel">Bottom of Funnel</option>
                  <option value="retention">Retention</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>

          <Button
            variant="glow"
            onClick={() => generateMutation.mutate()}
            disabled={!selectedClientId || generateMutation.isPending}
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating Strategy...
              </>
            ) : (
              "Generate Strategy"
            )}
          </Button>
        </div>

        {/* Output */}
        {generatedStrategy && (
          <div className="rounded-lg border border-border bg-card p-6 glow-border">
            <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">
              Generated Strategy
            </h2>
            <div className="prose prose-invert prose-sm max-w-none prose-headings:text-foreground prose-p:text-secondary-foreground prose-strong:text-foreground prose-li:text-secondary-foreground">
              <ReactMarkdown>{generatedStrategy}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
