import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useLatestStrategy(clientId: string) {
  return useQuery({
    queryKey: ["latest_strategy", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("strategies")
        .select("id, title, content, strategy_type, status")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });
}
