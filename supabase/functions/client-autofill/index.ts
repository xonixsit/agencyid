import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FIELDS = ["offer", "target_audience", "positioning", "goals", "brand_voice", "competitors"] as const;
type Field = typeof FIELDS[number];

const FIELD_INSTRUCTIONS: Record<Field, string> = {
  offer: "Describe the core product or service the company sells (2-4 sentences).",
  target_audience: "Describe the ideal customer profile: demographics, roles, pain points, desires (2-4 sentences).",
  positioning: "How the company differentiates from competitors and its unique value proposition (2-4 sentences).",
  goals: "Likely marketing/business goals based on the site (2-4 sentences, use bullet-like phrasing).",
  brand_voice: "Tone, style, and personality of the brand as reflected on the site (2-3 sentences).",
  competitors: "List 3-5 likely competitors with a short reason each. Use short bullet lines.",
};

async function fetchSiteText(url: string): Promise<string> {
  try {
    const normalized = url.startsWith("http") ? url : `https://${url}`;
    const res = await fetch(normalized, { headers: { "User-Agent": "Mozilla/5.0 LovableBot" } });
    if (!res.ok) return "";
    const html = await res.text();
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return text.slice(0, 12000);
  } catch (e) {
    console.error("fetch site failed:", e);
    return "";
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { website_url, company_name, industry, mode = "all", field, current = {} } = await req.json();
    if (!website_url) throw new Error("website_url required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const siteText = await fetchSiteText(website_url);

    const targetFields: Field[] = mode === "field" && field && FIELDS.includes(field as Field)
      ? [field as Field]
      : [...FIELDS];

    const instructions = targetFields.map((f) => `- ${f}: ${FIELD_INSTRUCTIONS[f]}`).join("\n");

    const systemPrompt = `You are a marketing research analyst. Analyze the provided website content and return concise, specific, plausible marketing profile fields as JSON. Never invent obviously false facts; when uncertain, keep it directional but useful. Output MUST be a valid JSON object with exactly these keys: ${targetFields.join(", ")}. Values must be plain text (bullet lines allowed using "- ").`;

    const userPrompt = `Company: ${company_name || "Unknown"}
Industry: ${industry || "Unknown"}
Website URL: ${website_url}

Existing values (avoid duplicating, refine or replace):
${JSON.stringify(current, null, 2)}

Website extracted text (may be partial):
"""
${siteText || "(no content could be fetched, infer from URL and company name only)"}
"""

Generate the following fields:
${instructions}

Return ONLY a JSON object.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI generation failed");
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || "{}";
    let parsed: Record<string, string> = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) parsed = JSON.parse(m[0]);
    }

    const fields: Record<string, string> = {};
    for (const f of targetFields) {
      if (typeof parsed[f] === "string") fields[f] = parsed[f];
      else if (parsed[f]) fields[f] = String(parsed[f]);
    }

    return new Response(JSON.stringify({ fields }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("client-autofill error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
