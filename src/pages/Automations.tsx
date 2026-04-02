import { AppLayout } from "@/components/layout/AppLayout";
import { Zap } from "lucide-react";

export default function Automations() {
  return (
    <AppLayout>
      <div className="space-y-6 animate-slide-up">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-3">
            <Zap className="h-6 w-6 text-primary" />
            Automations
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Automation Builder agent — coming in Phase 2
          </p>
        </div>
        <div className="rounded-lg border border-dashed border-border bg-card/50 py-20 text-center">
          <Zap className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">GHL automation blueprints will be available soon</p>
          <p className="text-xs text-dim mt-1">CRM workflows, nurture sequences, trigger-based automations</p>
        </div>
      </div>
    </AppLayout>
  );
}
