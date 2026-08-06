import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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



serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { client, existing_outputs, additional_context, brand_context } = await req.json();
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are an elite Project Manager for a digital marketing agency. You coordinate all agent outputs into a unified project plan.

Your job:
1. Review the client profile and any existing deliverables (strategies, copy, media plans, automations, funnels, creative briefs)
2. Generate a comprehensive project task list with clear assignments, priorities, due dates, and dependencies
3. Identify gaps — what hasn't been generated yet and needs to be
4. Create a timeline with milestones

OUTPUT FORMAT (Markdown):
## Project Overview
Brief summary of client status and deliverable coverage.

## Task Breakdown
For each task:
### [Task Title]
- **Agent**: Which agent owns this (Strategist/Copywriter/Media Buyer/Automation Builder/Conversion Designer/Graphic Designer)
- **Priority**: Critical / High / Medium / Low
- **Status**: Todo / In Progress / Done
- **Dependencies**: What must be completed first
- **Description**: Clear deliverable description
- **Due**: Relative timeline (Day 1, Day 3, Week 1, etc.)

## Timeline & Milestones
Week-by-week breakdown with key milestones.

## Gap Analysis
What's missing and what should be generated next.

## Risk Flags
Any blockers, missing client data, or potential issues.

Be specific, actionable, and production-ready. Every task should be assignable to an agent.`;

    const outputSummary = existing_outputs
      ? `\n\nExisting deliverables:\n${JSON.stringify(existing_outputs, null, 2)}`
      : "\n\nNo deliverables generated yet.";

    const contextBlock = additional_context ? `\n\nAdditional Context from PM:\n${additional_context}` : "";
    const userPrompt = `Create a full project plan for this client:\n\nCompany: ${client.company_name}\nIndustry: ${client.industry || "Not specified"}\nOffer: ${client.offer || "Not specified"}\nTarget Audience: ${client.target_audience || "Not specified"}\nGoals: ${client.goals || "Not specified"}\nBudget: ${client.budget || "Not specified"}\nBrand Voice: ${client.brand_voice || "Not specified"}${outputSummary}${contextBlock}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt + DOC_STANDARD },
          { role: "user", content: brandBlock(brand_context) + userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limited. Please wait and try again." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const plan = data.choices?.[0]?.message?.content;
    if (!plan) throw new Error("No plan generated");

    return new Response(JSON.stringify({ plan }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
