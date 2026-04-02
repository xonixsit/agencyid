import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface AgentCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  status: "active" | "idle" | "processing";
  metric?: string;
  metricLabel?: string;
  onClick?: () => void;
}

export function AgentCard({
  icon: Icon,
  title,
  description,
  status,
  metric,
  metricLabel,
  onClick,
}: AgentCardProps) {
  return (
    <button
      onClick={onClick}
      className="agent-card text-left w-full group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
          <Icon className="h-4.5 w-4.5 text-primary" />
        </div>
        <span
          className={cn(
            "status-badge",
            status === "active" && "bg-status-active/10 text-status-active",
            status === "idle" && "bg-muted text-muted-foreground",
            status === "processing" && "bg-status-warning/10 text-status-warning"
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              status === "active" && "bg-status-active animate-pulse-glow",
              status === "idle" && "bg-muted-foreground",
              status === "processing" && "bg-status-warning animate-pulse-glow"
            )}
          />
          {status}
        </span>
      </div>

      <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed mb-3">
        {description}
      </p>

      {metric && (
        <div className="border-t border-border pt-3">
          <span className="font-mono text-lg font-bold text-foreground">
            {metric}
          </span>
          {metricLabel && (
            <span className="ml-2 text-xs text-muted-foreground">
              {metricLabel}
            </span>
          )}
        </div>
      )}
    </button>
  );
}
