import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AGENT_GUIDANCE: Record<string, string> = {
  copywriter: "Suggest angles, promos, hooks, tone tweaks, must-have phrases, and constraints tailored to the copy type and platform.",
  media_buyer: "Suggest budget skews, priority audiences, creative angles, testing focus, and platform-specific constraints.",
  automation_builder: "Suggest trigger events, channel mix (email/SMS), sequence length, timing cadence, and conditional branches.",
  conversion_designer: "Suggest funnel steps to emphasize, offer sequencing, upsell/downsell logic, lead magnet ideas, and UX priorities.",
  graphic_designer: "Suggest visual references, color direction, typography feel, layout style, motion/format ideas, and asset requirements.",
  project_manager: "Suggest priority milestones, timeline compression areas, risk flags, and the next best deliverables to sequence.",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { client, agent, subtype, platform, existing_outputs, strategy_context } = await req.json();
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const guidance = AGENT_GUIDANCE[agent] || "Suggest relevant context specific to this task.";

    const outputsSummary = existing_outputs
      ? Object.entries(existing_outputs)
          .filter(([, v]: any) => Array.isArray(v) && v.length)
          .map(([k, v]: any) => `${k}: ${v.map((x: any) => x.title || x.strategy_type || x.copy_type || "item").slice(0, 5).join("; ")}`)
          .join("\n")
      : "";

    const systemPrompt = `You write concise, high-signal "Additional Context" notes for a marketing agency AI agent. Output 3-6 short bullet points (max ~90 words total). No preamble, no headings — just the bullets. Be specific to the client, task type, and prior work. Avoid generic advice.`;

    const userPrompt = `Agent: ${agent}${subtype ? ` (${subtype})` : ""}${platform ? ` — platform: ${platform}` : ""}
Guidance: ${guidance}

Client:
- Company: ${client?.company_name || "n/a"}
- Industry: ${client?.industry || "n/a"}
- Offer: ${client?.offer || "n/a"}
- Audience: ${client?.target_audience || "n/a"}
- Positioning: ${client?.positioning || "n/a"}
- Goals: ${client?.goals || "n/a"}
- Brand voice: ${client?.brand_voice || "n/a"}
- Budget: ${client?.budget || "n/a"}
- Competitors: ${client?.competitors || "n/a"}

${outputsSummary ? `Prior deliverables:\n${outputsSummary}\n` : ""}${strategy_context ? `\nStrategy excerpt:\n${String(strategy_context).slice(0, 1500)}\n` : ""}

Write the additional context bullets now.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.8,
        max_tokens: 500,
      }),
    });

    if (!res.ok) {
      if (res.status === 429) return new Response(JSON.stringify({ error: "Rate limited. Try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (res.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI gateway error: ${res.status}`);
    }

    const data = await res.json();
    const context = data.choices?.[0]?.message?.content?.trim() || "";
    return new Response(JSON.stringify({ context }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
