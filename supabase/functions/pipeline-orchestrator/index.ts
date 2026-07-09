import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Pipeline stages and gates. Each stage has:
 *  - table: where output is stored
 *  - requiresApproval: if true, orchestrator stops if any in_review exists AND won't advance
 *    past this stage until at least one approved row exists.
 *  - run: function that invokes the agent for this client (returns { title, content, extras })
 */

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function invokeAgent(name: string, body: Record<string, unknown>) {
  const r = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SERVICE_KEY}`,
      apikey: SERVICE_KEY,
    },
    body: JSON.stringify(body),
  });
  const data = await r.json();
  if (!r.ok || data?.error) throw new Error(data?.error || `${name} failed (${r.status})`);
  return data;
}

type Stage = {
  key: string;
  label: string;
  table: string;
  requiresApproval: boolean;
  run: (ctx: RunCtx) => Promise<{ row: Record<string, unknown> }>;
};

interface RunCtx {
  client: any;
  strategyContent?: string | null;
  strategyId?: string | null;
  priorContent?: string | null;
  reviewNotes?: string | null;
  parentId?: string | null;
  version?: number;
}

const STAGES: Stage[] = [
  {
    key: "strategy",
    label: "Strategy",
    table: "strategies",
    requiresApproval: true,
    run: async ({ client, priorContent, reviewNotes, parentId, version }) => {
      const extra = priorContent
        ? `\n\n--- PRIOR VERSION (revise per feedback) ---\n${priorContent}\n--- FEEDBACK ---\n${reviewNotes || "(none)"}`
        : "";
      const enrichedClient = extra ? { ...client, notes: (client.notes || "") + extra } : client;
      const data = await invokeAgent("strategist-agent", { client: enrichedClient, strategy_type: "full_funnel" });
      return {
        row: {
          client_id: client.id,
          title: `Full Funnel Strategy — ${client.company_name}`,
          content: data.strategy,
          strategy_type: "full_funnel",
          parent_id: parentId || null,
          version: version || 1,
        },
      };
    },
  },
  {
    key: "copy",
    label: "Copy",
    table: "copy_outputs",
    requiresApproval: true,
    run: async ({ client, strategyContent, strategyId, priorContent, reviewNotes, parentId, version }) => {
      const ctx = priorContent
        ? `PRIOR VERSION:\n${priorContent}\n\nHUMAN FEEDBACK:\n${reviewNotes || "(none)"}`
        : "";
      const data = await invokeAgent("copywriter-agent", {
        client, copy_type: "ad_copy", platform: "meta",
        strategy_context: strategyContent, additional_context: ctx,
      });
      return {
        row: {
          client_id: client.id,
          title: `Meta Ad Copy — ${client.company_name}`,
          content: data.copy,
          copy_type: "ad_copy",
          platform: "meta",
          strategy_id: strategyId || null,
          parent_id: parentId || null,
          version: version || 1,
        },
      };
    },
  },
  {
    key: "automation",
    label: "Automation",
    table: "automations",
    requiresApproval: true,
    run: async ({ client, strategyContent, strategyId, priorContent, reviewNotes, parentId, version }) => {
      const ctx = priorContent
        ? `PRIOR VERSION:\n${priorContent}\n\nHUMAN FEEDBACK:\n${reviewNotes || "(none)"}`
        : "";
      const data = await invokeAgent("automation-builder-agent", {
        client, automation_type: "nurture_sequence",
        strategy_context: strategyContent, additional_context: ctx,
      });
      return {
        row: {
          client_id: client.id,
          title: `Nurture Automation — ${client.company_name}`,
          content: data.automation || data.content || "",
          automation_type: "nurture_sequence",
          strategy_id: strategyId || null,
          parent_id: parentId || null,
          version: version || 1,
        },
      };
    },
  },
  {
    key: "funnel",
    label: "Funnel Design",
    table: "funnel_designs",
    requiresApproval: true,
    run: async ({ client, strategyContent, strategyId, priorContent, reviewNotes, parentId, version }) => {
      const ctx = priorContent
        ? `PRIOR VERSION:\n${priorContent}\n\nHUMAN FEEDBACK:\n${reviewNotes || "(none)"}`
        : "";
      const data = await invokeAgent("conversion-designer-agent", {
        client, funnel_type: "lead_gen",
        strategy_context: strategyContent, additional_context: ctx,
      });
      return {
        row: {
          client_id: client.id,
          title: `Lead-Gen Funnel — ${client.company_name}`,
          content: data.design || data.content || "",
          funnel_type: "lead_gen",
          strategy_id: strategyId || null,
          parent_id: parentId || null,
          version: version || 1,
        },
      };
    },
  },
  {
    key: "media",
    label: "Media Plan",
    table: "media_plans",
    requiresApproval: true, // budget stage gate
    run: async ({ client, strategyContent, strategyId, priorContent, reviewNotes, parentId, version }) => {
      const ctx = priorContent
        ? `PRIOR VERSION:\n${priorContent}\n\nHUMAN FEEDBACK:\n${reviewNotes || "(none)"}`
        : "";
      const data = await invokeAgent("media-buyer-agent", {
        client, platform: "meta",
        strategy_context: strategyContent, additional_context: ctx,
      });
      return {
        row: {
          client_id: client.id,
          title: `Meta Media Plan — ${client.company_name}`,
          content: data.plan || data.content || "",
          platform: "meta",
          strategy_id: strategyId || null,
          parent_id: parentId || null,
          version: version || 1,
        },
      };
    },
  },
  {
    key: "brief",
    label: "Creative Brief",
    table: "creative_briefs",
    requiresApproval: true, // brief gate before image gen
    run: async ({ client, strategyContent, strategyId, priorContent, reviewNotes, parentId, version }) => {
      const ctx = priorContent
        ? `PRIOR VERSION:\n${priorContent}\n\nHUMAN FEEDBACK:\n${reviewNotes || "(none)"}`
        : "";
      const data = await invokeAgent("graphic-designer-agent", {
        client, brief_type: "ad_creative",
        strategy_context: strategyContent, additional_context: ctx,
      });
      return {
        row: {
          client_id: client.id,
          title: `Ad Creative Brief — ${client.company_name}`,
          content: data.brief || data.content || "",
          brief_type: "ad_creative",
          strategy_id: strategyId || null,
          parent_id: parentId || null,
          version: version || 1,
        },
      };
    },
  },
  {
    key: "pm",
    label: "Project Plan",
    table: "project_tasks",
    requiresApproval: false, // final aggregation
    run: async ({ client, priorContent, reviewNotes, parentId, version }) => {
      const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
      const [s, c, m, a, f, b] = await Promise.all([
        supabase.from("strategies").select("title, strategy_type, review_status").eq("client_id", client.id),
        supabase.from("copy_outputs").select("title, copy_type, review_status").eq("client_id", client.id),
        supabase.from("media_plans").select("title, platform, review_status").eq("client_id", client.id),
        supabase.from("automations").select("title, automation_type, review_status").eq("client_id", client.id),
        supabase.from("funnel_designs").select("title, funnel_type, review_status").eq("client_id", client.id),
        supabase.from("creative_briefs").select("title, brief_type, review_status").eq("client_id", client.id),
      ]);
      const existing_outputs = {
        strategies: s.data || [], copy_outputs: c.data || [], media_plans: m.data || [],
        automations: a.data || [], funnel_designs: f.data || [], creative_briefs: b.data || [],
      };
      const ctx = priorContent
        ? `PRIOR VERSION:\n${priorContent}\n\nHUMAN FEEDBACK:\n${reviewNotes || "(none)"}`
        : "";
      const data = await invokeAgent("project-manager-agent", {
        client, existing_outputs, additional_context: ctx,
      });
      return {
        row: {
          client_id: client.id,
          title: `Project Plan — ${client.company_name}`,
          description: data.plan,
          agent_type: "project_manager",
          priority: "high",
          status: "todo",
          parent_id: parentId || null,
          version: version || 1,
        },
      };
    },
  },
];

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { client_id, action, stage_key, output_id } = await req.json();
    if (!client_id) throw new Error("client_id required");
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: client, error: cErr } = await supabase.from("clients").select("*").eq("id", client_id).single();
    if (cErr || !client) throw new Error("Client not found");

    // Load status per stage
    const status: Record<string, { approved: number; in_review: number; total: number; latestApprovedId?: string; latestApprovedContent?: string }> = {};
    for (const s of STAGES) {
      const contentCol = s.table === "project_tasks" ? "description" : "content";
      const { data } = await supabase
        .from(s.table as any)
        .select(`id, review_status, ${contentCol}, created_at`)
        .eq("client_id", client_id)
        .order("created_at", { ascending: false });
      const rows = (data as any[]) || [];
      const approved = rows.filter((r) => r.review_status === "approved");
      status[s.key] = {
        approved: approved.length,
        in_review: rows.filter((r) => r.review_status === "in_review").length,
        total: rows.length,
        latestApprovedId: approved[0]?.id,
        latestApprovedContent: approved[0]?.[contentCol],
      };
    }

    // Regenerate a specific output with feedback
    if (action === "regenerate" && output_id && stage_key) {
      const stage = STAGES.find((s) => s.key === stage_key);
      if (!stage) throw new Error("Unknown stage");
      const contentCol = stage.table === "project_tasks" ? "description" : "content";
      const { data: prior } = await supabase.from(stage.table as any).select("*").eq("id", output_id).single();
      if (!prior) throw new Error("Prior output not found");
      // Use latest approved strategy as upstream context
      const stratId = status.strategy.latestApprovedId;
      const stratContent = status.strategy.latestApprovedContent;
      const built = await stage.run({
        client,
        strategyContent: stratContent,
        strategyId: stratId,
        priorContent: (prior as any)[contentCol],
        reviewNotes: (prior as any).review_notes,
        parentId: output_id,
        version: ((prior as any).version || 1) + 1,
      });
      const { data: inserted, error: iErr } = await supabase.from(stage.table as any).insert({ ...built.row, review_status: "in_review" }).select().single();
      if (iErr) throw new Error(iErr.message);
      return json({ ran: [stage.key], new_output_id: (inserted as any).id, message: `Regenerated ${stage.label}` });
    }

    // Advance pipeline: run the next stage that has no output yet OR waiting_on if a gate is pending
    if (action === "advance" || !action) {
      for (const stage of STAGES) {
        const st = status[stage.key];
        if (stage.requiresApproval && st.in_review > 0) {
          return json({ waiting_on: stage.key, message: `Waiting on ${stage.label} approval`, status });
        }
        if (st.approved === 0 && st.total === 0) {
          // Need upstream strategy approved before we can chain (except strategy itself)
          if (stage.key !== "strategy" && !status.strategy.latestApprovedId) {
            return json({ waiting_on: "strategy", message: "Approve strategy first", status });
          }
          try {
            const built = await stage.run({
              client,
              strategyContent: status.strategy.latestApprovedContent,
              strategyId: status.strategy.latestApprovedId,
            });
            const { data: inserted, error: iErr } = await supabase.from(stage.table as any).insert({
              ...built.row,
              review_status: stage.requiresApproval ? "in_review" : "approved",
            }).select().single();
            if (iErr) throw new Error(iErr.message);
            return json({
              ran: [stage.key],
              new_output_id: (inserted as any).id,
              message: `Generated ${stage.label}`,
              waiting_on: stage.requiresApproval ? stage.key : null,
              status,
            });
          } catch (e: any) {
            return json({ error: `Stage ${stage.label} failed: ${e.message}`, status }, 500);
          }
        }
      }
      return json({ message: "Pipeline complete — all stages have outputs", status });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e: any) {
    console.error("orchestrator error:", e);
    return json({ error: e?.message || "Unknown error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
