import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Builds a compact markdown summary of a client's brand assets
 * (logos, colors, fonts, captions, guidelines, references) so every
 * agent can respect the client's brand system when generating output.
 */
export function buildBrandContext(assets: any[] | undefined): string | null {
  if (!assets?.length) return null;

  const by = (t: string) => assets.filter((a) => a.asset_type === t);
  const lines: string[] = [];

  const colors = by("color");
  if (colors.length) {
    lines.push(`**Brand colors:** ${colors.map((c) => `${c.title} (${c.value || "n/a"})`).join(", ")}`);
  }

  const fonts = by("font");
  if (fonts.length) {
    lines.push(`**Typography:** ${fonts.map((f) => `${f.title}${f.value ? ` — ${f.value}` : ""}`).join("; ")}`);
  }

  const logos = by("logo");
  if (logos.length) {
    lines.push(`**Logos on file:** ${logos.map((l) => l.title).join(", ")} (use brand lockup, never recreate the mark)`);
  }

  const images = by("image");
  if (images.length) {
    lines.push(`**Brand imagery on file:** ${images.map((i) => i.title).join(", ")}`);
  }

  const captions = by("caption");
  if (captions.length) {
    lines.push(
      `**Approved captions / taglines:**\n${captions.map((c) => `- ${c.title}${c.value ? `: ${c.value}` : ""}`).join("\n")}`,
    );
  }

  const guidelines = by("guideline");
  if (guidelines.length) {
    lines.push(
      `**Brand guidelines / style guide:**\n${guidelines.map((g) => `- ${g.title}${g.value ? `: ${g.value}` : ""}`).join("\n")}`,
    );
  }

  const docs = by("document");
  if (docs.length) {
    lines.push(`**Guideline documents on file:** ${docs.map((d) => d.title).join(", ")}`);
  }

  const links = by("link");
  if (links.length) {
    lines.push(`**Reference links:** ${links.map((l) => `${l.title}${l.value ? ` (${l.value})` : ""}`).join(", ")}`);
  }

  return lines.length ? lines.join("\n") : null;
}

export function useBrandContext(clientId?: string | null) {
  const { data: assets } = useQuery({
    queryKey: ["brand_assets", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brand_assets")
        .select("*")
        .eq("client_id", clientId as string)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!clientId,
  });

  return { brandContext: buildBrandContext(assets), assetCount: assets?.length ?? 0 };
}
