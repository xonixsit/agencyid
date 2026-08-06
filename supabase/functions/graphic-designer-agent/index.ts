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



const briefTypePrompts: Record<string, string> = {
  ad_creative: `Generate a comprehensive AD CREATIVE BRIEF including:
- Visual concept and art direction
- Headline and body copy placement zones
- Image/video style direction (photography style, illustration style, or mixed media)
- Color palette with hex codes (primary, secondary, accent)
- Typography recommendations (heading font, body font, CTA font)
- Platform-specific dimension specs and safe zones
- 3 creative variations with different visual approaches
- CTA button design (shape, color, placement)
- Brand consistency guidelines`,

  social_content: `Generate a SOCIAL CONTENT DESIGN BRIEF including:
- Content series concept (3-5 post templates)
- Visual theme and aesthetic direction
- Grid/feed layout strategy
- Story and Reel visual frameworks
- Color palette with hex codes
- Typography system for social
- Image treatment style (filters, overlays, frames)
- Carousel design structure
- Brand watermark/logo placement rules
- Engagement-driving visual elements`,

  brand_identity: `Generate a BRAND IDENTITY DIRECTION BRIEF including:
- Visual identity concept and mood
- Logo usage guidelines and clear space rules
- Primary and secondary color palette with hex codes
- Typography hierarchy (3 font recommendations with use cases)
- Photography/imagery style direction
- Iconography style
- Pattern/texture recommendations
- Brand collateral templates (business card, letterhead, social)
- Do's and Don'ts visual examples
- Tone-to-visual translation guide`,

  landing_page_design: `Generate a LANDING PAGE DESIGN BRIEF including:
- Above-the-fold hero section concept
- Visual hierarchy and content flow
- Section-by-section layout with wireframe descriptions
- Color usage per section
- Image/graphic placement and style for each section
- CTA design and placement strategy
- Social proof visual treatment
- Mobile-responsive design notes
- Micro-interaction and animation suggestions
- Typography scale and spacing system`,

  video_creative: `Generate a VIDEO CREATIVE DIRECTION BRIEF including:
- Storyboard outline (scene-by-scene visual descriptions)
- Opening hook visual concept (first 3 seconds)
- Color grading and mood direction
- Text overlay style and animation
- B-roll shot list with visual descriptions
- Thumbnail design concept
- End screen/CTA frame design
- Music/audio mood direction
- Transition style recommendations
- Platform-specific format specs (16:9, 9:16, 1:1)`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { client, brief_type, platform, context, strategy_context, brand_context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const typeInstructions = briefTypePrompts[brief_type] || briefTypePrompts.ad_creative;

    const systemPrompt = `You are an elite creative director at a top-tier digital marketing agency. You produce production-ready creative briefs that designers and content creators can immediately execute on.

Your outputs must be:
- Visually specific with exact color hex codes, font recommendations, and layout specs
- Platform-aware with correct dimensions and safe zones
- Brand-aligned with the client's voice and positioning
- Include multiple creative variations and approaches
- Reference current design trends relevant to the client's industry
- Structured for direct handoff to designers or GHL page builders

Format with clear markdown headers, bullet points, and organized sections.`;

    const userPrompt = `${typeInstructions}

Client Details:
Company: ${client.company_name}
Industry: ${client.industry || "Not specified"}
Offer: ${client.offer || "Not specified"}
Target Audience: ${client.target_audience || "Not specified"}
Positioning: ${client.positioning || "Not specified"}
Brand Voice: ${client.brand_voice || "Not specified"}
Goals: ${client.goals || "Not specified"}
${platform ? `Platform: ${platform}` : ""}
${context ? `Additional Context: ${context}` : ""}
${strategy_context ? `\n--- STRATEGY CONTEXT (align creative direction to this strategy) ---\n${strategy_context}\n--- END STRATEGY CONTEXT ---\n` : ""}

Deliver a complete, production-ready creative brief that a designer could execute immediately.`;

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
    const brief = data.choices?.[0]?.message?.content || "No brief generated";

    return new Response(JSON.stringify({ brief }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("graphic-designer error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
