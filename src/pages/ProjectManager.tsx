import { AppLayout } from "@/components/layout/AppLayout";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ListChecks, Plus, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";

const PRIORITY_COLORS: Record<string, string> = {
  critical: "bg-red-500/20 text-red-400 border-red-500/30",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  low: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

const STATUS_ICONS: Record<string, typeof CheckCircle2> = {
  todo: Clock,
  in_progress: Loader2,
  done: CheckCircle2,
  blocked: AlertCircle,
};

export default function ProjectManager() {
  const [selectedClientId, setSelectedClientId] = useState("");
  const [generatedPlan, setGeneratedPlan] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: clients } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("*").order("company_name");
      if (error) throw error;
      return data;
    },
  });

  const { data: tasks } = useQuery({
    queryKey: ["project_tasks", selectedClientId],
    queryFn: async () => {
      const q = supabase.from("project_tasks").select("*").order("created_at", { ascending: false });
      if (selectedClientId) q.eq("client_id", selectedClientId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const client = clients?.find((c) => c.id === selectedClientId);
      if (!client) throw new Error("Select a client");

      // Fetch existing outputs for context
      const [strategies, copyOutputs, mediaPlans, automations, funnels, briefs] = await Promise.all([
        supabase.from("strategies").select("title, strategy_type, status").eq("client_id", selectedClientId),
        supabase.from("copy_outputs").select("title, copy_type, status").eq("client_id", selectedClientId),
        supabase.from("media_plans").select("title, platform, status").eq("client_id", selectedClientId),
        supabase.from("automations").select("title, automation_type, status").eq("client_id", selectedClientId),
        supabase.from("funnel_designs").select("title, funnel_type, status").eq("client_id", selectedClientId),
        supabase.from("creative_briefs").select("title, brief_type, status").eq("client_id", selectedClientId),
      ]);

      const existing_outputs = {
        strategies: strategies.data || [],
        copy_outputs: copyOutputs.data || [],
        media_plans: mediaPlans.data || [],
        automations: automations.data || [],
        funnel_designs: funnels.data || [],
        creative_briefs: briefs.data || [],
      };

      const { data, error } = await supabase.functions.invoke("project-manager-agent", {
        body: { client, existing_outputs },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data.plan;
    },
    onSuccess: async (plan) => {
      setGeneratedPlan(plan);
      const { error } = await supabase.from("project_tasks").insert({
        client_id: selectedClientId,
        title: `Project Plan — ${clients?.find((c) => c.id === selectedClientId)?.company_name}`,
        description: plan,
        agent_type: "project_manager",
        priority: "high",
        status: "todo",
      });
      if (error) {
        toast({ title: "Plan generated but failed to save", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Project plan generated & saved" });
        queryClient.invalidateQueries({ queryKey: ["project_tasks"] });
      }
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedClientId || !generatedPlan) throw new Error("No plan to save");
      const { error } = await supabase.from("project_tasks").insert({
        client_id: selectedClientId,
        title: `Project Plan — ${clients?.find((c) => c.id === selectedClientId)?.company_name}`,
        description: generatedPlan,
        agent_type: "project_manager",
        priority: "high",
        status: "todo",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Plan saved" });
      queryClient.invalidateQueries({ queryKey: ["project_tasks"] });
    },
    onError: (err: Error) => {
      toast({ title: "Error saving", description: err.message, variant: "destructive" });
    },
  });

  return (
    <AppLayout>
      <div className="space-y-8 animate-slide-up">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Project Manager</h1>
          <p className="text-sm text-muted-foreground mt-1">
            AI-powered task assignment, deliverable tracking, and client timelines across all agents
          </p>
        </div>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base font-mono">Generate Project Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Client</label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>
                  {clients?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button onClick={() => generateMutation.mutate()} disabled={!selectedClientId || generateMutation.isPending}>
                {generateMutation.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</> : <><ListChecks className="h-4 w-4 mr-2" />Generate Plan</>}
              </Button>
              {generatedPlan && (
                <Button variant="outline" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                  <Plus className="h-4 w-4 mr-2" />Save Plan
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {generatedPlan && (
          <Card className="border-border bg-card">
            <CardHeader><CardTitle className="text-base font-mono">Generated Plan</CardTitle></CardHeader>
            <CardContent>
              <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown>{generatedPlan}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        )}

        {tasks && tasks.length > 0 && (
          <div>
            <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">Saved Plans & Tasks</h2>
            <div className="space-y-3">
              {tasks.map((task) => {
                const StatusIcon = STATUS_ICONS[task.status] || Clock;
                return (
                  <Card key={task.id} className="border-border bg-card">
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <StatusIcon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-foreground">{task.title}</p>
                            {task.description && (
                              <details className="mt-2">
                                <summary className="text-xs text-muted-foreground cursor-pointer">View details</summary>
                                <div className="prose prose-invert prose-sm max-w-none mt-2">
                                  <ReactMarkdown>{task.description}</ReactMarkdown>
                                </div>
                              </details>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Badge variant="outline" className={PRIORITY_COLORS[task.priority] || ""}>{task.priority}</Badge>
                          <Badge variant="outline">{task.agent_type}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
