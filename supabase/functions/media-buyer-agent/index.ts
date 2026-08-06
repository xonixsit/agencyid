import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DOC_STANDARD = `

--- DOCUMENT FORMAT STANDARD (mandatory) ---
Return a structured business document in Markdown, never a wall of prose:
1. Start with "# <Deliverable Title> — <Client Name>".
2. Follow with a metadata block as a two-column Markdown table: Client, Deliverable, Prepared By (agent role), Date (leave as {{date}}), Version (v1.0).
3. Add "## Executive Summary" — max 4 sentences.
4. Number every major section: "## 1. ...", "## 2. ..." and use "### 2.1 ..." for subsections.
5. Use Markdown tables for any comparable data (budgets, timelines, audiences, steps, specs, KPIs). Tables must have header rows.
6. Use bullet or numbered lists for steps and requirements — never long paragraphs. Keep paragraphs under 3 sentences.
7. Bold key terms, labels and metric names.
8. Use "> " blockquotes for callouts, warnings and implementation notes.
9. End with "## Next Steps" as a numbered checklist and an "## Appendix" only when needed.
Do not wrap the whole document in a code block. No preamble or sign-off text outside the document.
--- END FORMAT STANDARD ---`;

const brandBlock = (b?: string | null) =>
  b ? `\n--- CLIENT BRAND ASSETS (must be respected: logo usage, colors, fonts, captions, style guide) ---\n${b}\n--- END BRAND ASSETS ---\n` : "";



serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { client, platform, campaign_objective, budget_split, strategy_context, brand_context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a senior performance media buyer at a top-tier digital marketing agency. You build production-ready campaign structures for Meta Ads and Google Ads that can be directly implemented.

Your outputs must be:
- Specific campaign/ad set/ad group hierarchies — not vague suggestions
- Include exact targeting parameters (interests, demographics, custom audiences, lookalikes)
- Budget allocation with daily/lifetime splits across campaigns and ad sets
- Ad placement recommendations with reasoning
- Bidding strategy recommendations with specific bid caps or targets
- Audience exclusion logic to prevent overlap and wasted spend
- Testing framework with clear A/B test structures
- Scaling rules: when to increase budget, when to kill, when to duplicate

You are building for REAL implementation. Every campaign name, ad set name, and targeting parameter should be specific enough to copy-paste into the ad platform.

Format with clear markdown headers and use tables for budget allocation and audience breakdowns.`;

    const userPrompt = `Build a ${platform} campaign structure for this client:

Company: ${client.company_name}
Industry: ${client.industry || "Not specified"}
Offer: ${client.offer || "Not specified"}
Target Audience: ${client.target_audience || "Not specified"}
Positioning: ${client.positioning || "Not specified"}
Goals: ${client.goals || "Not specified"}
Competitors: ${client.competitors || "Not specified"}
Total Budget: ${client.budget || "Not specified"}
Campaign Objective: ${campaign_objective}
Budget Split Preference: ${budget_split || "Balanced across funnel stages"}
${strategy_context ? `\n--- STRATEGY CONTEXT (align campaigns to this strategy) ---\n${strategy_context}\n--- END STRATEGY CONTEXT ---\n` : ""}

Provide a complete media plan with:

1. **Campaign Architecture** — Full hierarchy: Campaign → Ad Set/Ad Group → Ads. Use naming conventions like [Client]_[Objective]_[Audience]_[Placement]. Include 2-4 campaigns covering different funnel stages.

2. **Audience Strategy**
   - Core audiences with specific interest/behavior targeting
   - Custom audience recommendations (website visitors, email lists, video viewers)
   - Lookalike audience tiers (1%, 2-3%, 5%+)
   - Exclusion audiences to prevent overlap
   - Audience size estimates

3. **Budget Allocation Table**
   | Campaign | Daily Budget | % of Total | Objective | Expected CPM/CPC |
   Break down by campaign and ad set level.

4. **Ad Placement Strategy** — Which placements for which objectives (Feed, Stories, Reels, Search, Display, YouTube, etc.) with reasoning.

5. **Bidding & Optimization**
   - Recommended bid strategy per campaign
   - Target CPA/ROAS goals
   - Learning phase considerations
   - When to switch from CBO to ABO or vice versa

6. **Creative Requirements**
   - Ad formats needed per placement (static, video, carousel, etc.)
   - Recommended sizes and specs
   - Number of creative variations per ad set
   - Hook/angle direction for each audience segment

7. **Testing Framework**
   - What to test first (audiences vs creatives vs offers)
   - A/B test structure with control/variant setup
   - Minimum sample size and test duration
   - Decision criteria for winners

8. **Scaling Playbook**
   - When to scale (metrics thresholds)
   - Horizontal vs vertical scaling approach
   - Budget increase cadence (20% rule, duplication method)
   - Kill criteria for underperforming ad sets

9. **Tracking & Attribution**
   - Pixel/conversion events to set up
   - UTM parameter structure
   - Attribution window recommendations
   - Key metrics dashboard layout`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt + DOC_STANDARD },
          { role: "user", content: brandBlock(brand_context) + userPrompt },
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
    const media_plan = data.choices?.[0]?.message?.content || "No media plan generated";

    return new Response(JSON.stringify({ media_plan }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("media-buyer error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
