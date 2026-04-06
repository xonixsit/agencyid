import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const automationTypePrompts: Record<string, string> = {
  nurture_sequence: `Create a multi-step nurture email/SMS sequence. Include:
- Trigger event (e.g. form submission, tag added)
- Sequence timeline (delays between messages)
- Each step: channel (email/SMS), subject line, message content, CTA
- Conditional branches based on engagement (opened, clicked, replied)
- Exit conditions
- GHL workflow structure with wait steps and if/else branches`,

  crm_workflow: `Create a CRM automation workflow. Include:
- Trigger event and conditions
- Pipeline stage movements
- Task assignments and due dates
- Internal notifications
- Contact field updates
- Tag management (add/remove)
- GHL pipeline and opportunity management steps`,

  booking_funnel: `Create a booking/appointment funnel automation. Include:
- Lead capture trigger
- Qualification steps (tag-based or form-based)
- Calendar booking integration steps
- Reminder sequence (email + SMS before appointment)
- No-show follow-up sequence
- Post-appointment follow-up
- GHL calendar and workflow integration`,

  reactivation: `Create a client/lead reactivation campaign automation. Include:
- Segment identification criteria (inactive period, last engagement)
- Multi-channel outreach sequence (email, SMS, voicemail drop)
- Re-engagement offers and incentives
- Response handling branches
- Win-back vs archive decision logic
- GHL tag-based segmentation and workflow`,

  onboarding: `Create a new client/customer onboarding automation. Include:
- Welcome sequence (email + SMS)
- Account setup tasks and checklists
- Milestone-based progression
- Check-in touchpoints
- Resource delivery schedule
- Feedback collection points
- GHL onboarding pipeline with stage automation`,
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { client, automation_type, context } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const typeInstructions = automationTypePrompts[automation_type] || automationTypePrompts["nurture_sequence"];

    const systemPrompt = `You are an expert CRM automation architect and GoHighLevel (GHL) specialist. You build production-ready automation workflows that agencies can implement directly into GHL.

Your outputs must be:
- Immediately implementable in GoHighLevel
- Include exact trigger names, action types, and wait durations
- Use proper GHL terminology (workflows, triggers, actions, pipelines, opportunities, tags)
- Include conditional logic with if/else branches
- Specify exact timing for delays and follow-ups
- Include both the strategic rationale AND the technical implementation

Format your response in clear markdown with:
1. **Automation Overview** — purpose, trigger, expected outcome
2. **Workflow Blueprint** — step-by-step with timing, channels, and conditions
3. **GHL Implementation Guide** — exact settings, trigger names, action configurations
4. **Message Templates** — actual copy for each touchpoint (emails, SMS)
5. **Optimization Notes** — A/B test suggestions, KPIs to track`;

    const userPrompt = `Build a ${automation_type.replace(/_/g, " ")} automation for this client:

**Company:** ${client.company_name}
**Industry:** ${client.industry || "Not specified"}
**Offer:** ${client.offer || "Not specified"}
**Target Audience:** ${client.target_audience || "Not specified"}
**Brand Voice:** ${client.brand_voice || "Professional"}
**Goals:** ${client.goals || "Not specified"}
**Budget:** ${client.budget || "Not specified"}
${context ? `\n**Additional Context:** ${context}` : ""}

${typeInstructions}

Make every message template ready to copy-paste. Use the client's brand voice throughout. Include specific GHL workflow node types for each step.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://lovable.dev",
        "X-Title": "Automation Builder Agent",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
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
    const automation = data.choices?.[0]?.message?.content;

    return new Response(JSON.stringify({ automation }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
