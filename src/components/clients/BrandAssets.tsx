import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Upload, Trash2, Palette, Type, FileText, Link2, Image as ImageIcon, Plus, Loader2 } from "lucide-react";

type AssetType = "logo" | "image" | "color" | "font" | "document" | "link";

const TYPE_META: Record<AssetType, { label: string; icon: React.ComponentType<any>; needsFile: boolean; }> = {
  logo:     { label: "Logos",     icon: ImageIcon, needsFile: true },
  image:    { label: "Images",    icon: ImageIcon, needsFile: true },
  color:    { label: "Colors",    icon: Palette,   needsFile: false },
  font:     { label: "Fonts",     icon: Type,      needsFile: false },
  document: { label: "Guidelines", icon: FileText, needsFile: true },
  link:     { label: "References", icon: Link2,    needsFile: false },
};

export function BrandAssets({ clientId }: { clientId: string }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const [openType, setOpenType] = useState<AssetType | null>(null);

  const { data: assets } = useQuery({
    queryKey: ["brand_assets", clientId],
    queryFn: async () => {
      const { data, error } = await supabase.from("brand_assets").select("*").eq("client_id", clientId).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const remove = async (row: any) => {
    if (row.storage_path) await supabase.storage.from("client-assets").remove([row.storage_path]);
    await supabase.from("brand_assets").delete().eq("id", row.id);
    qc.invalidateQueries({ queryKey: ["brand_assets", clientId] });
  };

  const grouped = (assets || []).reduce<Record<string, any[]>>((acc, a) => {
    (acc[a.asset_type] ||= []).push(a); return acc;
  }, {});

  return (
    <div className="rounded-lg border border-border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-mono uppercase tracking-wider text-muted-foreground">Brand Assets</h2>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {(Object.keys(TYPE_META) as AssetType[]).map((t) => {
          const meta = TYPE_META[t];
          const Icon = meta.icon;
          const items = grouped[t] || [];
          return (
            <div key={t} className="rounded-md border border-border bg-background p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono uppercase text-muted-foreground">
                  <Icon className="h-3.5 w-3.5" /> {meta.label} ({items.length})
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setOpenType(t)}>
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="space-y-1.5">
                {items.map((a) => (
                  <AssetRow key={a.id} asset={a} onDelete={() => remove(a)} />
                ))}
                {!items.length && <p className="text-xs text-dim">None yet</p>}
              </div>
            </div>
          );
        })}
      </div>

      {openType && (
        <AddDialog
          type={openType}
          clientId={clientId}
          userId={user?.id}
          onClose={() => setOpenType(null)}
          onSaved={() => { qc.invalidateQueries({ queryKey: ["brand_assets", clientId] }); toast({ title: "Asset added" }); }}
        />
      )}
    </div>
  );
}

function AssetRow({ asset, onDelete }: { asset: any; onDelete: () => void }) {
  const [url, setUrl] = useState<string | null>(asset.file_url || null);
  const isImage = asset.asset_type === "logo" || asset.asset_type === "image";

  const openFile = async () => {
    if (asset.storage_path) {
      const { data } = await supabase.storage.from("client-assets").createSignedUrl(asset.storage_path, 3600);
      if (data?.signedUrl) window.open(data.signedUrl, "_blank");
    } else if (asset.value) {
      window.open(asset.value, "_blank");
    }
  };

  const loadImg = async () => {
    if (!asset.storage_path || url) return;
    const { data } = await supabase.storage.from("client-assets").createSignedUrl(asset.storage_path, 3600);
    if (data?.signedUrl) setUrl(data.signedUrl);
  };
  if (isImage && asset.storage_path && !url) loadImg();

  return (
    <div className="flex items-center gap-2 group">
      {asset.asset_type === "color" && (
        <span className="h-4 w-4 rounded border border-border shrink-0" style={{ background: asset.value }} />
      )}
      {isImage && url && (
        <img src={url} className="h-6 w-6 rounded object-cover border border-border" alt="" />
      )}
      <button onClick={openFile} className="text-xs text-foreground hover:text-primary truncate flex-1 text-left">
        {asset.title}
        {asset.value && asset.asset_type !== "color" && <span className="text-muted-foreground ml-1">· {asset.value.slice(0, 24)}</span>}
      </button>
      <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive">
        <Trash2 className="h-3 w-3" />
      </button>
    </div>
  );
}

function AddDialog({ type, clientId, userId, onClose, onSaved }: { type: AssetType; clientId: string; userId?: string; onClose: () => void; onSaved: () => void }) {
  const meta = TYPE_META[type];
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return toast({ title: "Title required", variant: "destructive" });
    setBusy(true);
    let storage_path: string | null = null;
    let file_url: string | null = null;
    try {
      if (meta.needsFile) {
        if (!file) { setBusy(false); return toast({ title: "File required", variant: "destructive" }); }
        const path = `${clientId}/${type}/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
        const { error: upErr } = await supabase.storage.from("client-assets").upload(path, file);
        if (upErr) throw upErr;
        storage_path = path;
      }
      const { error } = await supabase.from("brand_assets").insert({
        client_id: clientId,
        asset_type: type,
        title: title.trim(),
        value: !meta.needsFile ? value.trim() || null : null,
        storage_path,
        file_url,
        uploaded_by: userId || null,
      });
      if (error) throw error;
      onSaved();
      onClose();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 flex items-center justify-center p-6" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="w-full max-w-md rounded-lg border border-border bg-card p-6 space-y-4">
        <h3 className="text-sm font-semibold">Add {meta.label.replace(/s$/, "")}</h3>
        <div>
          <label className="text-xs font-mono uppercase text-muted-foreground block mb-1">Title</label>
          <input className="terminal-input w-full" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        </div>
        {type === "color" && (
          <div>
            <label className="text-xs font-mono uppercase text-muted-foreground block mb-1">Hex</label>
            <div className="flex gap-2">
              <input type="color" value={value || "#000000"} onChange={(e) => setValue(e.target.value)} className="h-9 w-14 rounded border border-border bg-background" />
              <input className="terminal-input flex-1" value={value} onChange={(e) => setValue(e.target.value)} placeholder="#22c55e" />
            </div>
          </div>
        )}
        {type === "font" && (
          <div>
            <label className="text-xs font-mono uppercase text-muted-foreground block mb-1">Font family / spec</label>
            <input className="terminal-input w-full" value={value} onChange={(e) => setValue(e.target.value)} placeholder="Inter, weight 400/600" />
          </div>
        )}
        {type === "link" && (
          <div>
            <label className="text-xs font-mono uppercase text-muted-foreground block mb-1">URL</label>
            <input type="url" className="terminal-input w-full" value={value} onChange={(e) => setValue(e.target.value)} placeholder="https://…" />
          </div>
        )}
        {meta.needsFile && (
          <div>
            <label className="text-xs font-mono uppercase text-muted-foreground block mb-1">File</label>
            <label className="flex items-center gap-2 rounded-md border border-dashed border-border bg-background px-3 py-4 cursor-pointer hover:border-primary/40">
              <Upload className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground truncate">{file?.name || "Click to choose file"}</span>
              <input type="file" className="hidden" accept={type === "document" ? ".pdf,.doc,.docx" : "image/*"} onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </label>
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="glow" disabled={busy}>{busy ? <Loader2 className="h-3 w-3 animate-spin" /> : "Add"}</Button>
        </div>
      </form>
    </div>
  );
}
