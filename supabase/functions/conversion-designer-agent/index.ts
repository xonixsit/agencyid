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



const funnelTypePrompts: Record<string, string> = {
  lead_generation: `Design a lead generation funnel. Include:
- Opt-in page with headline formula, subhead, bullet points, form fields, CTA button
- Thank you / confirmation page with next steps
- Optional tripwire offer page
- Follow-up sequence trigger points
- Each section: layout type, copy placement zones, visual direction`,

  webinar: `Design a webinar registration funnel. Include:
- Registration page with urgency elements, social proof, speaker bio section
- Confirmation page with calendar add and pre-webinar content
- Webinar replay page with countdown timer section
- Offer page with pricing table, guarantee, FAQ accordion
- Each section: layout type, copy placement zones, visual direction`,

  sales_page: `Design a long-form sales page funnel. Include:
- Hero section with headline, subhead, hero image/video placement
- Problem agitation section with story framework
- Solution reveal with feature/benefit blocks
- Social proof section (testimonials, case studies, logos)
- Offer stack with pricing, bonuses, guarantee
- FAQ section and final CTA
- Order form / checkout page
- Each section: layout type, copy placement zones, visual direction`,

  application: `Design an application funnel for high-ticket offers. Include:
- Landing page with qualifying copy and "Apply Now" CTA
- Multi-step application form (qualification questions)
- Application confirmation / booking page
- Case study or proof page linked from confirmation
- Each section: layout type, copy placement zones, visual direction`,

  ecommerce: `Design an ecommerce product funnel. Include:
- Product page with image gallery, description, reviews, add-to-cart
- Cart page with upsell/cross-sell sections
- Checkout page with order bump
- Thank you page with post-purchase offer
- Each section: layout type, copy placement zones, visual direction`,
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { client, funnel_type, context, strategy_context, brand_context } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const typeInstructions = funnelTypePrompts[funnel_type] || funnelTypePrompts["lead_generation"];

    const systemPrompt = `You are an expert conversion designer and GoHighLevel (GHL) funnel architect. You design high-converting funnel structures that agencies can build directly in GHL's funnel builder.

Your outputs must be:
- Immediately buildable in GoHighLevel's funnel/website builder
- Include exact section types, layouts, and content placement zones
- Specify responsive behavior (desktop vs mobile stacking)
- Use GHL-compatible section and element terminology
- Include conversion optimization rationale for every design decision
- Reference proven layout patterns and frameworks

Format your response in clear markdown with:
1. **Funnel Overview** — purpose, page count, user flow diagram (text-based)
2. **Page-by-Page Blueprint** — for each page:
   - Page purpose and conversion goal
   - Section-by-section breakdown with:
     - Section type (hero, features, testimonials, CTA, etc.)
     - Layout structure (columns, widths, spacing)
     - Content placement (headline zone, body copy zone, image/video zone, button zone)
     - Design notes (colors from brand, typography hierarchy, whitespace)
   - Mobile responsiveness notes
3. **GHL Implementation Guide** — exact funnel builder settings, section templates to use, custom CSS notes
4. **Copy Framework** — headline formulas, subhead templates, CTA copy for each page
5. **Conversion Optimization Notes** — A/B test suggestions, heatmap focus areas, scroll depth targets`;

    const userPrompt = `Design a ${funnel_type.replace(/_/g, " ")} funnel for this client:

**Company:** ${client.company_name}
**Industry:** ${client.industry || "Not specified"}
**Offer:** ${client.offer || "Not specified"}
**Target Audience:** ${client.target_audience || "Not specified"}
**Brand Voice:** ${client.brand_voice || "Professional"}
**Positioning:** ${client.positioning || "Not specified"}
**Goals:** ${client.goals || "Not specified"}
**Website:** ${client.website_url || "Not specified"}
${context ? `\n**Additional Context:** ${context}` : ""}
${strategy_context ? `\n--- STRATEGY CONTEXT (align funnel design to this strategy) ---\n${strategy_context}\n--- END STRATEGY CONTEXT ---\n` : ""}

${typeInstructions}

Make every section description detailed enough for a designer to build without guessing. Include GHL funnel builder element types for each component.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://lovable.dev",
        "X-Title": "Conversion Designer Agent",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt + DOC_STANDARD },
          { role: "user", content: brandBlock(brand_context) + userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 5000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please wait a moment and try again." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please check your plan." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const design = data.choices?.[0]?.message?.content;

    return new Response(JSON.stringify({ design }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
