import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type AgentKey =
  | "copywriter"
  | "media_buyer"
  | "automation_builder"
  | "conversion_designer"
  | "graphic_designer"
  | "project_manager";

interface Args {
  client: any;
  agent: AgentKey;
  subtype?: string;
  platform?: string;
  strategy_context?: string | null;
  includePriorOutputs?: boolean;
}

export function useSuggestContext() {
  const [loading, setLoading] = useState(false);

  const suggest = async ({ client, agent, subtype, platform, strategy_context, includePriorOutputs }: Args): Promise<string> => {
    if (!client?.id) throw new Error("Select a client first");
    setLoading(true);
    try {
      let existing_outputs: any = undefined;
      if (includePriorOutputs) {
        const [s, c, m, a, f, b] = await Promise.all([
          supabase.from("strategies").select("title, strategy_type").eq("client_id", client.id),
          supabase.from("copy_outputs").select("title, copy_type").eq("client_id", client.id),
          supabase.from("media_plans").select("title, platform").eq("client_id", client.id),
          supabase.from("automations").select("title, automation_type").eq("client_id", client.id),
          supabase.from("funnel_designs").select("title, funnel_type").eq("client_id", client.id),
          supabase.from("creative_briefs").select("title, brief_type").eq("client_id", client.id),
        ]);
        existing_outputs = {
          strategies: s.data || [],
          copy_outputs: c.data || [],
          media_plans: m.data || [],
          automations: a.data || [],
          funnel_designs: f.data || [],
          creative_briefs: b.data || [],
        };
      }

      const { data, error } = await supabase.functions.invoke("context-suggester", {
        body: { client, agent, subtype, platform, strategy_context, existing_outputs },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return (data as any).context as string;
    } finally {
      setLoading(false);
    }
  };

  return { suggest, loading };
}
