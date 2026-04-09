import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const copyTypePrompts: Record<string, string> = {
  ad_copy: `Write production-ready ad copy variations. Include:
- 3 primary text variations (different angles)
- 3 headlines per variation
- 3 descriptions per variation
- Clear CTAs
Format for direct paste into ad platforms.`,
  email_sequence: `Write a complete email nurture sequence. Include:
- 5-7 emails with subject lines, preview text, and full body copy
- Clear send timing recommendations
- Each email should have a specific purpose in the journey
- Include merge tags where appropriate (e.g., {{first_name}})`,
  landing_page: `Write complete landing page copy. Include:
- Hero section (headline, subheadline, CTA)
- Problem/agitation section
- Solution section with benefits
- Social proof section placeholders
- Feature breakdown
- FAQ section (5 questions)
- Final CTA section
Label each section for direct GHL implementation.`,
  sales_page: `Write a long-form sales page. Include:
- Attention-grabbing headline
- Story-driven opening
- Problem identification
- Solution presentation
- Benefit stacking
- Objection handling
- Testimonial placeholders
- Risk reversal / guarantee
- Multiple CTAs throughout
- P.S. section`,
  social_post: `Write 10 social media posts. Include:
- Mix of formats (carousel concepts, single posts, stories)
- Hooks for each post
- Hashtag suggestions
- Engagement prompts
- Content pillars covered`,
  headline: `Generate 20 headline variations across different frameworks:
- 5 benefit-driven headlines
- 5 curiosity-driven headlines
- 5 social proof headlines
- 5 urgency/scarcity headlines`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { client, copy_type, platform, additional_context, strategy_context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const typeInstructions = copyTypePrompts[copy_type] || copyTypePrompts.ad_copy;

    const systemPrompt = `You are an elite direct-response copywriter at a top marketing agency. You write copy that converts — not generic AI content.

Rules:
- Write like a human, not a robot
- Use the client's brand voice and positioning
- Every word must earn its place
- Be specific to the client's offer and audience
- Output must be production-ready — paste directly into GHL, ad platforms, or email tools
- No placeholder text — write the actual copy
- Format with clear markdown structure`;

    const userPrompt = `Write ${copy_type.replace(/_/g, " ")} for ${platform} for this client:

Company: ${client.company_name}
Industry: ${client.industry || "Not specified"}
Offer: ${client.offer || "Not specified"}
Target Audience: ${client.target_audience || "Not specified"}
Positioning: ${client.positioning || "Not specified"}
Goals: ${client.goals || "Not specified"}
Brand Voice: ${client.brand_voice || "Not specified"}

${typeInstructions}

${strategy_context ? `\n--- STRATEGY CONTEXT (use this to inform your copy) ---\n${strategy_context}\n--- END STRATEGY CONTEXT ---\n` : ""}
${additional_context ? `Additional context: ${additional_context}` : ""}`;

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
    const copy = data.choices?.[0]?.message?.content || "No copy generated";

    return new Response(JSON.stringify({ copy }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("copywriter error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
