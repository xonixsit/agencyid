import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Turn a creative brief + client into concise, image-model-ready prompts.
async function buildPrompts(params: {
  apiKey: string;
  client: any;
  brief: string;
  platform?: string;
  variations: number;
  aspect_ratio: string;
  extra?: string;
  brand_context?: string | null;
}): Promise<{ label: string; prompt: string }[]> {
  const { apiKey, client, brief, platform, variations, aspect_ratio, extra, brand_context } = params;

  const sys = `You are an art director. Turn a creative brief into ${variations} distinct, production-ready IMAGE GENERATION prompts for an ad/social post. Each prompt must be a single vivid paragraph (60-110 words) describing: subject, composition, lighting, color palette (reference hex codes when the brief lists them), art style, mood, and any on-image text. Respect the platform aspect ratio ${aspect_ratio}. Return ONLY a JSON array of ${variations} objects with fields "label" (short 2-4 word variation name) and "prompt" (the image prompt). No commentary.`;

  const user = `Client: ${client.company_name}
Industry: ${client.industry || "n/a"}
Offer: ${client.offer || "n/a"}
Audience: ${client.target_audience || "n/a"}
Brand voice: ${client.brand_voice || "n/a"}
Platform: ${platform || "generic social"}
${extra ? `Extra direction: ${extra}\n` : ""}${brand_context ? `--- CLIENT BRAND ASSETS (must be respected: colors, fonts, logo usage, captions, style guide) ---\n${brand_context}\n--- END BRAND ASSETS ---\n` : ""}
--- CREATIVE BRIEF ---
${brief}
--- END BRIEF ---`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) throw new Error(`prompt-gen failed ${res.status}: ${await res.text()}`);
  const data = await res.json();
  let text: string = data.choices?.[0]?.message?.content || "[]";
  // strip code fences if present
  text = text.replace(/```json|```/g, "").trim();
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start >= 0 && end > start) text = text.slice(start, end + 1);
  const arr = JSON.parse(text);
  return arr.slice(0, variations).map((x: any, i: number) => ({
    label: String(x.label || `Variation ${i + 1}`),
    prompt: String(x.prompt || ""),
  }));
}

async function generateImage(apiKey: string, prompt: string): Promise<string> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image-preview",
      messages: [{ role: "user", content: prompt }],
      modalities: ["image", "text"],
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`image-gen ${res.status}: ${t}`);
  }
  const data = await res.json();
  const url = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!url) throw new Error("No image returned");
  return url; // data:image/png;base64,....
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not set");
    const { client, brief, platform, variations = 3, aspect_ratio = "1:1", extra, brand_context } = await req.json();
    if (!client?.company_name || !brief) throw new Error("client and brief are required");

    const prompts = await buildPrompts({
      apiKey, client, brief, platform, variations: Math.min(Math.max(variations, 1), 4), aspect_ratio, extra, brand_context,
    });

    const results: { label: string; prompt: string; image_url: string }[] = [];
    for (const p of prompts) {
      try {
        const img = await generateImage(apiKey, p.prompt);
        results.push({ label: p.label, prompt: p.prompt, image_url: img });
      } catch (e) {
        console.error("image gen failed for variation", p.label, e);
      }
    }
    if (results.length === 0) throw new Error("All image generations failed");

    return new Response(JSON.stringify({ visuals: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("graphic-designer-image error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    const status = msg.includes("429") ? 429 : msg.includes("402") ? 402 : 500;
    return new Response(JSON.stringify({ error: msg }), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
