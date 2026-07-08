import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import { useLatestStrategy } from "@/hooks/use-latest-strategy";
import { useSuggestContext } from "@/hooks/use-suggest-context";
import { Loader2, Copy, Save, Palette, ChevronDown, Brain, Sparkles, ImageIcon, Download, Trash2 } from "lucide-react";

const ASPECT_RATIOS = [
  { value: "1:1", label: "Square 1:1" },
  { value: "4:5", label: "Portrait 4:5" },
  { value: "9:16", label: "Story/Reel 9:16" },
  { value: "16:9", label: "Landscape 16:9" },
];

const BRIEF_TYPES = [
  { value: "ad_creative", label: "Ad Creative Brief" },
  { value: "social_content", label: "Social Content Design" },
  { value: "brand_identity", label: "Brand Identity Direction" },
  { value: "landing_page_design", label: "Landing Page Design" },
  { value: "video_creative", label: "Video Creative Direction" },
];

const PLATFORMS = [
  { value: "", label: "All Platforms" },
  { value: "meta", label: "Meta (FB/IG)" },
  { value: "google", label: "Google Ads" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "email", label: "Email" },
];

export default function GraphicDesigner() {
  const [selectedClientId, setSelectedClientId] = useState("");
  const [briefType, setBriefType] = useState("ad_creative");
  const [platform, setPlatform] = useState("");
  const [context, setContext] = useState("");
  const [generatedBrief, setGeneratedBrief] = useState("");
  const [currentBriefId, setCurrentBriefId] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [variations, setVariations] = useState(3);
  const [visualExtra, setVisualExtra] = useState("");
  const queryClient = useQueryClient();
  const { data: latestStrategy } = useLatestStrategy(selectedClientId);
  const { suggest, loading: suggesting } = useSuggestContext();

  const handleSuggestContext = async () => {
    try {
      const client = (await supabase.from("clients").select("*").eq("id", selectedClientId).maybeSingle()).data;
      if (!client) throw new Error("Select a client first");
      const text = await suggest({
        client, agent: "graphic_designer", subtype: briefType, platform,
        strategy_context: latestStrategy?.content || null, includePriorOutputs: true,
      });
      setContext(text);
    } catch (e: any) {
      toast({ title: "Suggestion failed", description: e.message, variant: "destructive" });
    }
  };

  const { data: clients } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("*").order("company_name");
      if (error) throw error;
      return data;
    },
  });

  const { data: savedBriefs } = useQuery({
    queryKey: ["creative_briefs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("creative_briefs" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as any[];
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const client = clients?.find((c) => c.id === selectedClientId);
      if (!client) throw new Error("Select a client");
      const { data, error } = await supabase.functions.invoke("graphic-designer-agent", {
        body: { client, brief_type: briefType, platform, context, strategy_context: latestStrategy?.content || null },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data.brief as string;
    },
    onSuccess: async (brief) => {
      setGeneratedBrief(brief);
      const client = clients?.find((c) => c.id === selectedClientId);
      const { data: inserted, error } = await supabase.from("creative_briefs" as any).insert({
        client_id: selectedClientId,
        title: `${BRIEF_TYPES.find((b) => b.value === briefType)?.label} — ${client?.company_name}`,
        content: brief,
        brief_type: briefType,
        platform: platform || null,
        visual_direction: context || null,
      }).select().maybeSingle();
      if (error) {
        toast({ title: "Generated but failed to save", description: error.message, variant: "destructive" });
      } else {
        setCurrentBriefId((inserted as any)?.id || null);
        toast({ title: "Creative brief generated & saved" });
        queryClient.invalidateQueries({ queryKey: ["creative_briefs"] });
      }
    },
    onError: (e: Error) => toast({ title: "Generation failed", description: e.message, variant: "destructive" }),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!generatedBrief || !selectedClientId) throw new Error("Nothing to save");
      const client = clients?.find((c) => c.id === selectedClientId);
      const { data: inserted, error } = await supabase.from("creative_briefs" as any).insert({
        client_id: selectedClientId,
        title: `${BRIEF_TYPES.find((b) => b.value === briefType)?.label} — ${client?.company_name}`,
        content: generatedBrief,
        brief_type: briefType,
        platform: platform || null,
        visual_direction: context || null,
      }).select().maybeSingle();
      if (error) throw error;
      setCurrentBriefId((inserted as any)?.id || null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creative_briefs"] });
      toast({ title: "Brief saved" });
    },
    onError: (e: Error) => toast({ title: "Save failed", description: e.message, variant: "destructive" }),
  });

  const { data: savedVisuals } = useQuery({
    queryKey: ["generated_visuals", selectedClientId],
    queryFn: async () => {
      if (!selectedClientId) return [];
      const { data, error } = await supabase
        .from("generated_visuals" as any)
        .select("*")
        .eq("client_id", selectedClientId)
        .order("created_at", { ascending: false })
        .limit(24);
      if (error) throw error;
      return data as any[];
    },
    enabled: !!selectedClientId,
  });

  const visualsMutation = useMutation({
    mutationFn: async () => {
      const client = clients?.find((c) => c.id === selectedClientId);
      if (!client) throw new Error("Select a client");
      if (!generatedBrief) throw new Error("Generate a creative brief first");
      const { data, error } = await supabase.functions.invoke("graphic-designer-image", {
        body: {
          client, brief: generatedBrief, platform,
          variations, aspect_ratio: aspectRatio, extra: visualExtra,
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      const visuals = (data as any).visuals as { label: string; prompt: string; image_url: string }[];
      const rows = visuals.map((v) => ({
        client_id: selectedClientId,
        brief_id: currentBriefId,
        title: `${client.company_name} · ${v.label}`,
        prompt: v.prompt,
        image_url: v.image_url,
        platform: platform || null,
        aspect_ratio: aspectRatio,
        variation_label: v.label,
      }));
      const { error: insErr } = await supabase.from("generated_visuals" as any).insert(rows);
      if (insErr) throw insErr;
      return visuals.length;
    },
    onSuccess: (n) => {
      toast({ title: `Generated ${n} visual${n === 1 ? "" : "s"}` });
      queryClient.invalidateQueries({ queryKey: ["generated_visuals", selectedClientId] });
    },
    onError: (e: Error) => toast({ title: "Visual generation failed", description: e.message, variant: "destructive" }),
  });

  const deleteVisual = async (id: string) => {
    const { error } = await supabase.from("generated_visuals" as any).delete().eq("id", id);
    if (error) return toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    queryClient.invalidateQueries({ queryKey: ["generated_visuals", selectedClientId] });
  };

  const downloadVisual = (url: string, name: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name.replace(/\s+/g, "_")}.png`;
    a.click();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedBrief);
    toast({ title: "Copied to clipboard" });
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-slide-up">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Graphic Designer</h1>
          <p className="text-sm text-muted-foreground mt-1">Creative direction, ad visuals & content design briefs</p>
        </div>

        <Card className="p-5 space-y-4 bg-card border-border">
          <div className="grid grid-cols-3 gap-4">
            <SelectField label="Client" value={selectedClientId} onChange={setSelectedClientId}
              options={(clients || []).map((c) => ({ value: c.id, label: c.company_name }))} placeholder="Select client" />
            <SelectField label="Brief Type" value={briefType} onChange={setBriefType}
              options={BRIEF_TYPES} />
            <SelectField label="Platform" value={platform} onChange={setPlatform}
              options={PLATFORMS} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-muted-foreground block">Additional Direction</label>
              <Button type="button" variant="ghost" size="sm" onClick={handleSuggestContext} disabled={!selectedClientId || suggesting} className="h-7 px-2 text-xs">
                {suggesting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
                Suggest with AI
              </Button>
            </div>
            <Textarea value={context} onChange={(e) => setContext(e.target.value)}
              placeholder="Specific visual references, colour preferences, style notes…" className="h-24 bg-muted/30 border-border" />
          </div>

          {selectedClientId && latestStrategy && (
            <div className="flex items-center gap-2 text-xs text-primary mb-2">
              <Brain className="h-3.5 w-3.5" />
              <span>Strategy linked: {latestStrategy.title}</span>
            </div>
          )}

          <Button onClick={() => generateMutation.mutate()} disabled={!selectedClientId || generateMutation.isPending}
            className="w-full">
            {generateMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating Brief…</> : <><Palette className="mr-2 h-4 w-4" />Generate Creative Brief</>}
          </Button>
        </Card>

        {generatedBrief && (
          <Card className="p-5 bg-card border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-mono uppercase tracking-wider text-muted-foreground">Generated Brief</h2>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleCopy}><Copy className="h-3.5 w-3.5 mr-1.5" />Copy</Button>
                <Button size="sm" variant="outline" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                  <Save className="h-3.5 w-3.5 mr-1.5" />Save
                </Button>
              </div>
            </div>
            <div className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown>{generatedBrief}</ReactMarkdown>
            </div>
          </Card>
        )}

        {generatedBrief && (
          <Card className="p-5 space-y-4 bg-card border-border">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-mono uppercase tracking-wider text-muted-foreground">Generate Visuals from Brief</h2>
                <p className="text-xs text-muted-foreground mt-1">Turn this creative brief into ready-to-post ad/social images.</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <SelectField label="Aspect Ratio" value={aspectRatio} onChange={setAspectRatio} options={ASPECT_RATIOS} />
              <SelectField label="Variations" value={String(variations)} onChange={(v) => setVariations(Number(v))}
                options={[{ value: "1", label: "1" }, { value: "2", label: "2" }, { value: "3", label: "3" }, { value: "4", label: "4" }]} />
              <div className="flex items-end">
                <Button onClick={() => visualsMutation.mutate()} disabled={visualsMutation.isPending || !selectedClientId}
                  className="w-full">
                  {visualsMutation.isPending
                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating…</>
                    : <><ImageIcon className="mr-2 h-4 w-4" />Generate Visuals</>}
                </Button>
              </div>
            </div>
            <Textarea value={visualExtra} onChange={(e) => setVisualExtra(e.target.value)}
              placeholder="Optional extra visual direction (e.g. 'focus on lifestyle shot with product overlay, add 20% off badge')"
              className="h-20 bg-muted/30 border-border" />
          </Card>
        )}

        {savedVisuals && savedVisuals.length > 0 && (
          <div>
            <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">Generated Visuals</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {savedVisuals.map((v) => (
                <Card key={v.id} className="overflow-hidden bg-card border-border group">
                  <div className="aspect-square bg-muted/20 flex items-center justify-center">
                    <img src={v.image_url} alt={v.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-2 space-y-1">
                    <p className="text-xs font-medium text-foreground truncate">{v.variation_label || "Variation"}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{v.aspect_ratio} · {v.platform || "any"}</p>
                    <div className="flex gap-1 pt-1">
                      <Button size="sm" variant="outline" className="flex-1 h-7 text-xs" onClick={() => downloadVisual(v.image_url, v.title)}>
                        <Download className="h-3 w-3 mr-1" />PNG
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => deleteVisual(v.id)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {savedBriefs && savedBriefs.length > 0 && (
          <div>
            <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">Saved Briefs</h2>
            <div className="space-y-2">
              {savedBriefs.map((b) => (
                <SavedBriefCard key={b.id} brief={b} onLoad={(content, id) => { setGeneratedBrief(content); setCurrentBriefId(id); }} />
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function SavedBriefCard({ brief, onLoad }: { brief: any; onLoad: (c: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Card className="p-3 bg-card border-border">
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setOpen(!open)}>
        <div>
          <p className="text-sm font-medium text-foreground">{brief.title}</p>
          <p className="text-xs text-muted-foreground">{brief.brief_type?.replace(/_/g, " ")} · {new Date(brief.created_at).toLocaleDateString()}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onLoad(brief.content); }}>Load</Button>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </div>
      {open && (
        <div className="mt-3 pt-3 border-t border-border prose prose-invert prose-sm max-w-none">
          <ReactMarkdown>{brief.content}</ReactMarkdown>
        </div>
      )}
    </Card>
  );
}

function SelectField({ label, value, onChange, options, placeholder }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-foreground">
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
