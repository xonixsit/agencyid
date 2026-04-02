import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { Building2, ArrowRight } from "lucide-react";

export function ClientList() {
  const navigate = useNavigate();
  const { data: clients, isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-lg border border-border bg-card animate-pulse" />
        ))}
      </div>
    );
  }

  if (!clients?.length) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card/50 py-16 text-center">
        <Building2 className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No clients yet</p>
        <p className="text-xs text-dim mt-1">Add your first client to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {clients.map((client) => (
        <button
          key={client.id}
          onClick={() => navigate(`/clients/${client.id}`)}
          className="w-full flex items-center justify-between rounded-lg border border-border bg-card px-5 py-4 text-left transition-all hover:border-primary/20 hover:bg-card/80 group"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
              <Building2 className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-foreground">{client.company_name}</h3>
              <p className="text-xs text-muted-foreground">
                {client.industry || "No industry"} · {client.contact_name || "No contact"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span
              className={cn(
                "status-badge",
                client.status === "active" && "bg-status-active/10 text-status-active",
                client.status === "onboarding" && "bg-status-info/10 text-status-info",
                client.status === "paused" && "bg-status-warning/10 text-status-warning",
                client.status === "completed" && "bg-muted text-muted-foreground"
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  client.status === "active" && "bg-status-active",
                  client.status === "onboarding" && "bg-status-info",
                  client.status === "paused" && "bg-status-warning",
                  client.status === "completed" && "bg-muted-foreground"
                )}
              />
              {client.status}
            </span>
            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </button>
      ))}
    </div>
  );
}
