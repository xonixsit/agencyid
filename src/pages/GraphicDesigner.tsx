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
import { Loader2, Copy, Save, Palette, ChevronDown, Brain } from "lucide-react";

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
  const queryClient = useQueryClient();
  const { data: latestStrategy } = useLatestStrategy(selectedClientId);

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
      const { error } = await supabase.from("creative_briefs" as any).insert({
        client_id: selectedClientId,
        title: `${BRIEF_TYPES.find((b) => b.value === briefType)?.label} — ${client?.company_name}`,
        content: brief,
        brief_type: briefType,
        platform: platform || null,
        visual_direction: context || null,
      });
      if (error) {
        toast({ title: "Generated but failed to save", description: error.message, variant: "destructive" });
      } else {
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
      const { error } = await supabase.from("creative_briefs" as any).insert({
        client_id: selectedClientId,
        title: `${BRIEF_TYPES.find((b) => b.value === briefType)?.label} — ${client?.company_name}`,
        content: generatedBrief,
        brief_type: briefType,
        platform: platform || null,
        visual_direction: context || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creative_briefs"] });
      toast({ title: "Brief saved" });
    },
    onError: (e: Error) => toast({ title: "Save failed", description: e.message, variant: "destructive" }),
  });

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
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Additional Direction</label>
            <Textarea value={context} onChange={(e) => setContext(e.target.value)}
              placeholder="Specific visual references, colour preferences, style notes…" className="h-20 bg-muted/30 border-border" />
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

        {savedBriefs && savedBriefs.length > 0 && (
          <div>
            <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">Saved Briefs</h2>
            <div className="space-y-2">
              {savedBriefs.map((b) => (
                <SavedBriefCard key={b.id} brief={b} onLoad={(content) => setGeneratedBrief(content)} />
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
