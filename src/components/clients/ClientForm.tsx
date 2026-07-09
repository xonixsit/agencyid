import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { X, Sparkles, RefreshCw, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface ClientFormProps {
  onClose: () => void;
}

interface FieldDef {
  name: string;
  label: string;
  required?: boolean;
  type?: string;
  multiline?: boolean;
  placeholder?: string;
  aiGenerated?: boolean;
}

const fields: FieldDef[] = [
  { name: "company_name", label: "Company Name", required: true },
  { name: "industry", label: "Industry" },
  { name: "contact_name", label: "Contact Name" },
  { name: "contact_email", label: "Contact Email", type: "email" },
  { name: "website_url", label: "Website URL" },
  { name: "offer", label: "Core Offer", multiline: true, placeholder: "What product/service are they selling?", aiGenerated: true },
  { name: "target_audience", label: "Target Audience", multiline: true, placeholder: "Who are their ideal customers?", aiGenerated: true },
  { name: "positioning", label: "Positioning", multiline: true, placeholder: "How do they differentiate from competitors?", aiGenerated: true },
  { name: "goals", label: "Goals", multiline: true, placeholder: "What are their marketing goals?", aiGenerated: true },
  { name: "brand_voice", label: "Brand Voice", multiline: true, placeholder: "Describe the tone and style of their brand", aiGenerated: true },
  { name: "competitors", label: "Competitors", multiline: true, placeholder: "List key competitors", aiGenerated: true },
  { name: "budget", label: "Budget" },
];

const AI_FIELDS = fields.filter((f) => f.aiGenerated).map((f) => f.name);

export function ClientForm({ onClose }: ClientFormProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [autoChain, setAutoChain] = useState(true);
  const [loading, setLoading] = useState(false);
  const [autofilling, setAutofilling] = useState(false);
  const [regenField, setRegenField] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const runAutofill = async (mode: "all" | "field", field?: string) => {
    if (!formData.website_url?.trim()) {
      toast({ title: "Enter a website URL first", variant: "destructive" });
      return;
    }
    if (mode === "all") setAutofilling(true);
    else setRegenField(field!);

    const current: Record<string, string> = {};
    for (const k of AI_FIELDS) if (formData[k]) current[k] = formData[k];

    const { data, error } = await supabase.functions.invoke("client-autofill", {
      body: {
        website_url: formData.website_url,
        company_name: formData.company_name,
        industry: formData.industry,
        mode,
        field,
        current,
      },
    });

    if (mode === "all") setAutofilling(false);
    else setRegenField(null);

    if (error || data?.error) {
      toast({ title: "Auto-fill failed", description: (data?.error || error?.message) as string, variant: "destructive" });
      return;
    }

    const generated = (data?.fields || {}) as Record<string, string>;
    setFormData((prev) => ({ ...prev, ...generated }));
    toast({ title: mode === "all" ? "Fields auto-filled from website" : "Field regenerated" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.company_name?.trim()) {
      toast({ title: "Company name is required", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("clients").insert({
      company_name: formData.company_name,
      industry: formData.industry || null,
      contact_name: formData.contact_name || null,
      contact_email: formData.contact_email || null,
      website_url: formData.website_url || null,
      offer: formData.offer || null,
      target_audience: formData.target_audience || null,
      positioning: formData.positioning || null,
      goals: formData.goals || null,
      brand_voice: formData.brand_voice || null,
      competitors: formData.competitors || null,
      budget: formData.budget || null,
      auto_chain: autoChain,
    });

    setLoading(false);
    if (error) {
      toast({ title: "Failed to create client", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Client created" });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      onClose();
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-6 glow-border">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-foreground">New Client Onboarding</h2>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
        {fields.map((field) => (
          <div key={field.name} className={field.multiline ? "col-span-2" : ""}>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground">
                {field.label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </label>
              {field.name === "website_url" && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 gap-1 text-xs"
                  disabled={autofilling || !formData.website_url}
                  onClick={() => runAutofill("all")}
                >
                  {autofilling ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                  {autofilling ? "Analyzing…" : "Auto-fill from website"}
                </Button>
              )}
              {field.aiGenerated && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 gap-1 text-xs"
                  disabled={regenField === field.name || autofilling || !formData.website_url}
                  onClick={() => runAutofill("field", field.name)}
                  title="Regenerate this field from website"
                >
                  {regenField === field.name ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3" />
                  )}
                  Regenerate
                </Button>
              )}
            </div>
            {field.multiline ? (
              <textarea
                className="terminal-input w-full min-h-[80px] resize-y"
                placeholder={field.placeholder}
                value={formData[field.name] || ""}
                onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
              />
            ) : (
              <input
                type={field.type || "text"}
                className="terminal-input w-full"
                value={formData[field.name] || ""}
                onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
              />
            )}
          </div>
        ))}

        <div className="col-span-2 flex items-center justify-between gap-3 pt-2 border-t border-border">
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
            <input type="checkbox" checked={autoChain} onChange={(e) => setAutoChain(e.target.checked)} className="rounded border-border" />
            <span>Auto-chain agents — after each approval, run the next stage automatically</span>
          </label>
          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="glow" disabled={loading}>
              {loading ? "Creating..." : "Create Client"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
