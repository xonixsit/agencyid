interface StatItem {
  label: string;
  value: string;
  change?: string;
  positive?: boolean;
}

export function StatsBar({ stats }: { stats: StatItem[] }) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-lg border border-border bg-card px-4 py-3"
        >
          <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-1">
            {stat.label}
          </p>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-xl font-bold text-foreground">
              {stat.value}
            </span>
            {stat.change && (
              <span
                className={`text-xs font-mono ${
                  stat.positive ? "text-status-active" : "text-status-error"
                }`}
              >
                {stat.change}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
