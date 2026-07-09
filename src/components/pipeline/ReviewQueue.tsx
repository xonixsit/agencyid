import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ExternalLink, PauseCircle } from "lucide-react";

const SOURCES = [
  { table: "strategies", label: "Strategy", contentField: "content" },
  { table: "copy_outputs", label: "Copy", contentField: "content" },
  { table: "automations", label: "Automation", contentField: "content" },
  { table: "funnel_designs", label: "Funnel", contentField: "content" },
  { table: "media_plans", label: "Media Plan", contentField: "content" },
  { table: "creative_briefs", label: "Creative Brief", contentField: "content" },
  { table: "project_tasks", label: "Project Plan", contentField: "description" },
];

export function ReviewQueue() {
  const navigate = useNavigate();

  const { data: items } = useQuery({
    queryKey: ["review_queue"],
    queryFn: async () => {
      const all: any[] = [];
      const { data: clients } = await supabase.from("clients").select("id, company_name");
      const clientMap = new Map((clients || []).map((c) => [c.id, c.company_name]));
      await Promise.all(
        SOURCES.map(async (s) => {
          const { data } = await supabase
            .from(s.table as any)
            .select("id, title, client_id, created_at, review_status")
            .eq("review_status", "in_review")
            .order("created_at", { ascending: false })
            .limit(20);
          (data as any[] | null)?.forEach((r) => all.push({ ...r, __source: s.label, __client: clientMap.get(r.client_id) }));
        })
      );
      return all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },
  });

  if (!items) return null;

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <PauseCircle className="h-4 w-4 text-yellow-400" />
        <h2 className="text-sm font-mono uppercase tracking-wider text-muted-foreground">
          Awaiting Your Review ({items.length})
        </h2>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-dim py-4 text-center">Queue clear — nothing pending approval.</p>
      ) : (
        <div className="space-y-2">
          {items.slice(0, 10).map((item) => (
            <div key={`${item.__source}-${item.id}`} className="flex items-center justify-between gap-3 rounded-md border border-border bg-background p-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                <p className="text-xs text-muted-foreground">
                  <span className="font-mono">{item.__source}</span> · {item.__client || "Unknown client"} · {new Date(item.created_at).toLocaleDateString()}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate(`/clients/${item.client_id}`)}>
                Review <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
