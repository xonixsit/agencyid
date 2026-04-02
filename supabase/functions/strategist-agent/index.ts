import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { client, strategy_type } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a senior marketing strategist at a top-tier digital marketing agency. You create production-ready funnel strategies that can be directly implemented in GoHighLevel (GHL).

Your outputs must be:
- Specific and actionable, not generic
- Structured for direct implementation
- Include exact copy direction, not just "write compelling copy"
- Reference the client's specific offer, audience, and positioning
- Include funnel flow with specific page types and their purposes
- Map out the customer journey with touchpoints

Format your strategy with clear sections using markdown headers.`;

    const userPrompt = `Create a ${strategy_type.replace(/_/g, " ")} strategy for this client:

Company: ${client.company_name}
Industry: ${client.industry || "Not specified"}
Offer: ${client.offer || "Not specified"}
Target Audience: ${client.target_audience || "Not specified"}
Positioning: ${client.positioning || "Not specified"}
Goals: ${client.goals || "Not specified"}
Brand Voice: ${client.brand_voice || "Not specified"}
Competitors: ${client.competitors || "Not specified"}
Budget: ${client.budget || "Not specified"}

Provide:
1. **Executive Summary** - 2-3 sentence overview
2. **Funnel Architecture** - Each stage with specific pages, their purpose, and conversion goals
3. **Campaign Structure** - Channels, ad types, targeting logic
4. **Key Messages** - Primary and secondary messaging by funnel stage
5. **Content Requirements** - Specific copy needs for each funnel element
6. **CRM Automation Flow** - Trigger-based sequences and nurture paths
7. **KPIs & Benchmarks** - Specific metrics to track at each stage
8. **GHL Implementation Notes** - Specific GHL features and workflows to use`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted. Add funds in Settings > Workspace > Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI generation failed");
    }

    const data = await response.json();
    const strategy = data.choices?.[0]?.message?.content || "No strategy generated";

    return new Response(JSON.stringify({ strategy }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("strategist error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
