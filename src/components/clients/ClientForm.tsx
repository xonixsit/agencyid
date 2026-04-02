import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
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
}

const fields: FieldDef[] = [
  { name: "company_name", label: "Company Name", required: true },
  { name: "industry", label: "Industry" },
  { name: "contact_name", label: "Contact Name" },
  { name: "contact_email", label: "Contact Email", type: "email" },
  { name: "website_url", label: "Website URL" },
  { name: "offer", label: "Core Offer", multiline: true, placeholder: "What product/service are they selling?" },
  { name: "target_audience", label: "Target Audience", multiline: true, placeholder: "Who are their ideal customers?" },
  { name: "positioning", label: "Positioning", multiline: true, placeholder: "How do they differentiate from competitors?" },
  { name: "goals", label: "Goals", multiline: true, placeholder: "What are their marketing goals?" },
  { name: "brand_voice", label: "Brand Voice", multiline: true, placeholder: "Describe the tone and style of their brand" },
  { name: "competitors", label: "Competitors", multiline: true, placeholder: "List key competitors" },
  { name: "budget", label: "Budget" },
];

export function ClientForm({ onClose }: ClientFormProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

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
            <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </label>
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

        <div className="col-span-2 flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="glow" disabled={loading}>
            {loading ? "Creating..." : "Create Client"}
          </Button>
        </div>
      </form>
    </div>
  );
}
