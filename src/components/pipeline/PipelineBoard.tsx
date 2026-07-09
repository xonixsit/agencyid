import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Play, Loader2, CheckCircle2, Clock, PauseCircle, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

const STAGES = [
  { key: "strategy", label: "Strategy", table: "strategies" },
  { key: "copy", label: "Copy", table: "copy_outputs" },
  { key: "automation", label: "Automation", table: "automations" },
  { key: "funnel", label: "Funnel", table: "funnel_designs" },
  { key: "media", label: "Media Plan", table: "media_plans" },
  { key: "brief", label: "Creative Brief", table: "creative_briefs" },
  { key: "pm", label: "Project Plan", table: "project_tasks" },
];

export function PipelineBoard({ clientId }: { clientId: string }) {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: status } = useQuery({
    queryKey: ["pipeline_status", clientId],
    queryFn: async () => {
      const results: Record<string, { approved: number; in_review: number; total: number }> = {};
      await Promise.all(
        STAGES.map(async (s) => {
          const { data } = await supabase.from(s.table as any).select("review_status").eq("client_id", clientId);
          const rows = (data as any[]) || [];
          results[s.key] = {
            approved: rows.filter((r) => r.review_status === "approved").length,
            in_review: rows.filter((r) => r.review_status === "in_review").length,
            total: rows.length,
          };
        })
      );
      return results;
    },
  });

  const advance = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("pipeline-orchestrator", {
        body: { client_id: clientId, action: "advance" },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data;
    },
    onSuccess: (data: any) => {
      toast({ title: data.message || "Pipeline advanced" });
      qc.invalidateQueries({ queryKey: ["pipeline_status", clientId] });
      STAGES.forEach((s) => qc.invalidateQueries({ queryKey: [s.table] }));
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const waitingStage = STAGES.find((s) => (status?.[s.key]?.in_review ?? 0) > 0)?.key;

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-mono uppercase tracking-wider text-muted-foreground">Agent Pipeline</h2>
          <p className="text-xs text-dim mt-1">
            {waitingStage
              ? `Paused: awaiting review on ${STAGES.find((s) => s.key === waitingStage)?.label}`
              : "Ready to advance to the next stage"}
          </p>
        </div>
        <Button variant="glow" size="sm" onClick={() => advance.mutate()} disabled={advance.isPending}>
          {advance.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
          Run Next Stage
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {STAGES.map((s, i) => {
          const st = status?.[s.key] || { approved: 0, in_review: 0, total: 0 };
          const state = st.in_review > 0 ? "review" : st.approved > 0 ? "done" : st.total > 0 ? "draft" : "empty";
          const Icon = state === "done" ? CheckCircle2 : state === "review" ? PauseCircle : state === "draft" ? Clock : Circle;
          return (
            <div
              key={s.key}
              className={cn(
                "relative rounded-md border p-3 text-center transition-colors",
                state === "done" && "border-status-active/40 bg-status-active/5",
                state === "review" && "border-yellow-500/40 bg-yellow-500/5",
                state === "draft" && "border-border bg-muted/30",
                state === "empty" && "border-dashed border-border bg-background",
              )}
            >
              <div className="text-[10px] font-mono text-muted-foreground mb-1">{String(i + 1).padStart(2, "0")}</div>
              <Icon
                className={cn(
                  "h-4 w-4 mx-auto mb-1",
                  state === "done" && "text-status-active",
                  state === "review" && "text-yellow-400",
                  state === "draft" && "text-muted-foreground",
                  state === "empty" && "text-dim",
                )}
              />
              <div className="text-xs font-medium text-foreground truncate">{s.label}</div>
              <div className="text-[10px] text-muted-foreground mt-1">
                {st.approved}✓ {st.in_review > 0 && `· ${st.in_review}⏸`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
