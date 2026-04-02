import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PenTool, Loader2, ChevronDown, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

const copyTypes = [
  { value: "ad_copy", label: "Ad Copy" },
  { value: "email_sequence", label: "Email Sequence" },
  { value: "landing_page", label: "Landing Page" },
  { value: "sales_page", label: "Sales Page" },
  { value: "social_post", label: "Social Post" },
  { value: "headline", label: "Headlines" },
];

const platforms = [
  { value: "meta", label: "Meta (Facebook/Instagram)" },
  { value: "google", label: "Google Ads" },
  { value: "email", label: "Email" },
  { value: "website", label: "Website" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "tiktok", label: "TikTok" },
];

export default function Copywriter() {
  const [selectedClientId, setSelectedClientId] = useState("");
  const [copyType, setCopyType] = useState("ad_copy");
  const [platform, setPlatform] = useState("meta");
  const [additionalContext, setAdditionalContext] = useState("");
  const [generatedCopy, setGeneratedCopy] = useState("");
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const { data: clients } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const client = clients?.find((c) => c.id === selectedClientId);
      if (!client) throw new Error("Select a client");

      const response = await supabase.functions.invoke("copywriter-agent", {
        body: {
          client: {
            company_name: client.company_name,
            industry: client.industry,
            offer: client.offer,
            target_audience: client.target_audience,
            positioning: client.positioning,
            goals: client.goals,
            brand_voice: client.brand_voice,
          },
          copy_type: copyType,
          platform,
          additional_context: additionalContext,
        },
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: (data) => {
      setGeneratedCopy(data.copy);
      toast({ title: "Copy generated" });
    },
    onError: (err: Error) => {
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
    },
  });

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-slide-up">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-3">
            <PenTool className="h-6 w-6 text-primary" />
            Copywriter Agent
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Generate production-ready marketing copy
          </p>
        </div>

        {/* Controls */}
        <div className="rounded-lg border border-border bg-card p-5 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5">Client</label>
              <div className="relative">
                <select className="terminal-input w-full appearance-none pr-10" value={selectedClientId} onChange={(e) => setSelectedClientId(e.target.value)}>
                  <option value="">Select a client...</option>
                  {clients?.map((c) => (
                    <option key={c.id} value={c.id}>{c.company_name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5">Copy Type</label>
              <div className="relative">
                <select className="terminal-input w-full appearance-none pr-10" value={copyType} onChange={(e) => setCopyType(e.target.value)}>
                  {copyTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5">Platform</label>
              <div className="relative">
                <select className="terminal-input w-full appearance-none pr-10" value={platform} onChange={(e) => setPlatform(e.target.value)}>
                  {platforms.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5">Additional Context</label>
            <textarea
              className="terminal-input w-full min-h-[80px] resize-y"
              placeholder="Any specific angles, promotions, or constraints..."
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
            />
          </div>

          <Button variant="glow" onClick={() => generateMutation.mutate()} disabled={!selectedClientId || generateMutation.isPending}>
            {generateMutation.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" />Generating Copy...</>
            ) : (
              "Generate Copy"
            )}
          </Button>
        </div>

        {/* Output */}
        {generatedCopy && (
          <div className="rounded-lg border border-border bg-card p-6 glow-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Generated Copy</h2>
              <Button variant="ghost" size="sm" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4 text-status-active" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <div className="prose prose-invert prose-sm max-w-none prose-headings:text-foreground prose-p:text-secondary-foreground prose-strong:text-foreground">
              <ReactMarkdown>{generatedCopy}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
