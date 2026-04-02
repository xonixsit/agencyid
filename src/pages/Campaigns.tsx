import { AppLayout } from "@/components/layout/AppLayout";
import { Target } from "lucide-react";

export default function Campaigns() {
  return (
    <AppLayout>
      <div className="space-y-6 animate-slide-up">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-3">
            <Target className="h-6 w-6 text-primary" />
            Campaigns
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Media Buyer agent — coming in Phase 2
          </p>
        </div>
        <div className="rounded-lg border border-dashed border-border bg-card/50 py-20 text-center">
          <Target className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Campaign structure mapping will be available soon</p>
          <p className="text-xs text-dim mt-1">Meta & Google campaign logic, audience targeting, budget allocation</p>
        </div>
      </div>
    </AppLayout>
  );
}
