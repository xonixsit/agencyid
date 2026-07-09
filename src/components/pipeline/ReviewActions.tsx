import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, XCircle, RefreshCw, Pencil, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  table: string;
  row: any;
  stageKey: string; // orchestrator stage id
  contentField?: "content" | "description";
  clientId: string;
  autoChain?: boolean;
}

const STATUS_STYLES: Record<string, string> = {
  in_review: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  approved: "bg-green-500/10 text-green-400 border-green-500/30",
  rejected: "bg-red-500/10 text-red-400 border-red-500/30",
  draft: "bg-muted text-muted-foreground border-border",
  deployed: "bg-blue-500/10 text-blue-400 border-blue-500/30",
};

export function ReviewActions({ table, row, stageKey, contentField = "content", clientId, autoChain }: Props) {
  const [busy, setBusy] = useState<"approve" | "reject" | "regen" | "edit" | null>(null);
  const [showRegen, setShowRegen] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [notes, setNotes] = useState("");
  const [editText, setEditText] = useState<string>(row[contentField] || "");
  const { toast } = useToast();
  const qc = useQueryClient();

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: [table] });
    qc.invalidateQueries({ queryKey: [table, clientId] });
    qc.invalidateQueries({ queryKey: ["review_queue"] });
    qc.invalidateQueries({ queryKey: ["pipeline_status", clientId] });
  };

  const setStatus = async (status: "approved" | "rejected", extraNotes?: string) => {
    setBusy(status === "approved" ? "approve" : "reject");
    const patch: any = { review_status: status };
    if (extraNotes !== undefined) patch.review_notes = extraNotes;
    const { error } = await supabase.from(table as any).update(patch).eq("id", row.id);
    setBusy(null);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: status === "approved" ? "Approved" : "Rejected" });
    invalidateAll();
    if (status === "approved" && autoChain) {
      // Kick pipeline forward
      const { data } = await supabase.functions.invoke("pipeline-orchestrator", {
        body: { client_id: clientId, action: "advance" },
      });
      if ((data as any)?.ran?.length) toast({ title: `Auto-chain: ${(data as any).message}` });
      invalidateAll();
    }
  };

  const regenerate = async () => {
    setBusy("regen");
    // save notes to prior first
    await supabase.from(table as any).update({ review_status: "rejected", review_notes: notes }).eq("id", row.id);
    const { data, error } = await supabase.functions.invoke("pipeline-orchestrator", {
      body: { client_id: clientId, action: "regenerate", stage_key: stageKey, output_id: row.id },
    });
    setBusy(null);
    setShowRegen(false);
    setNotes("");
    if (error || (data as any)?.error) {
      toast({ title: "Regenerate failed", description: (error?.message || (data as any)?.error) as string, variant: "destructive" });
      return;
    }
    toast({ title: "New version generated — awaiting review" });
    invalidateAll();
  };

  const saveEdit = async () => {
    setBusy("edit");
    // Insert a new version with the edited content
    const newRow: any = {
      ...row,
      [contentField]: editText,
      parent_id: row.id,
      version: (row.version || 1) + 1,
      review_status: "in_review",
      review_notes: null,
    };
    delete newRow.id;
    delete newRow.created_at;
    delete newRow.updated_at;
    const { error } = await supabase.from(table as any).insert(newRow);
    if (!error) {
      // mark parent rejected so it's out of queue
      await supabase.from(table as any).update({ review_status: "rejected" }).eq("id", row.id);
    }
    setBusy(null);
    setShowEdit(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Edited version saved — awaiting review" });
    invalidateAll();
  };

  const status = row.review_status || "in_review";

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className={cn("status-badge text-[10px] border", STATUS_STYLES[status])}>
        {status.replace("_", " ")}
        {row.version > 1 && <span className="ml-1 opacity-60">v{row.version}</span>}
      </span>
      {status === "in_review" && (
        <>
          <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" disabled={!!busy} onClick={() => setStatus("approved")}>
            {busy === "approve" ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
            Approve
          </Button>
          <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" disabled={!!busy} onClick={() => setShowEdit(true)}>
            <Pencil className="h-3 w-3" />
            Edit
          </Button>
          <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" disabled={!!busy} onClick={() => setShowRegen(true)}>
            <RefreshCw className="h-3 w-3" />
            Regenerate
          </Button>
          <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs text-muted-foreground" disabled={!!busy} onClick={() => setStatus("rejected")}>
            <XCircle className="h-3 w-3" />
            Reject
          </Button>
        </>
      )}

      <Dialog open={showRegen} onOpenChange={setShowRegen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Regenerate with feedback</DialogTitle></DialogHeader>
          <p className="text-xs text-muted-foreground">The agent will re-run using the previous version + your notes as extra context.</p>
          <Textarea rows={5} placeholder="What should change? Be specific." value={notes} onChange={(e) => setNotes(e.target.value)} />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowRegen(false)}>Cancel</Button>
            <Button onClick={regenerate} disabled={busy === "regen"}>
              {busy === "regen" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Regenerate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Edit output — saved as new version</DialogTitle></DialogHeader>
          <Textarea rows={20} value={editText} onChange={(e) => setEditText(e.target.value)} className="font-mono text-xs" />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowEdit(false)}>Cancel</Button>
            <Button onClick={saveEdit} disabled={busy === "edit"}>
              {busy === "edit" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save as new version
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Map database table -> orchestrator stage_key for use across the app
export const TABLE_TO_STAGE: Record<string, string> = {
  strategies: "strategy",
  copy_outputs: "copy",
  automations: "automation",
  funnel_designs: "funnel",
  media_plans: "media",
  creative_briefs: "brief",
  project_tasks: "pm",
  generated_visuals: "brief", // visuals attach to brief stage
};
