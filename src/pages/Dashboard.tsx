import { AppLayout } from "@/components/layout/AppLayout";
import { AgentCard } from "@/components/dashboard/AgentCard";
import { StatsBar } from "@/components/dashboard/StatsBar";
import { Brain, PenTool, Target, Zap, Users, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const stats = [
  { label: "Active Clients", value: "0", change: "", positive: true },
  { label: "Strategies", value: "0", change: "", positive: true },
  { label: "Copy Outputs", value: "0", change: "", positive: true },
  { label: "Deployments", value: "0", change: "", positive: true },
];

const agents = [
  {
    icon: Brain,
    title: "Strategist",
    description: "Generates full funnel strategies, campaign architectures, and positioning frameworks from client data.",
    status: "active" as const,
    metric: "—",
    metricLabel: "strategies generated",
    path: "/strategist",
  },
  {
    icon: PenTool,
    title: "Copywriter",
    description: "Produces high-converting ad copy, email sequences, landing pages, and sales page content.",
    status: "active" as const,
    metric: "—",
    metricLabel: "outputs created",
    path: "/copywriter",
  },
  {
    icon: Target,
    title: "Media Buyer",
    description: "Maps campaign structures with audience targeting, budget allocation, and platform logic.",
    status: "active" as const,
    metric: "—",
    metricLabel: "campaigns mapped",
    path: "/campaigns",
  },
  {
    icon: Zap,
    title: "Automation Builder",
    description: "Creates CRM workflows, nurture sequences, and GHL-ready automation blueprints.",
    status: "active" as const,
    metric: "—",
    metricLabel: "automations built",
    path: "/automations",
  },
  {
    icon: Users,
    title: "Project Manager",
    description: "Assigns tasks, tracks deliverables, and manages client timelines across all agents.",
    status: "idle" as const,
    metric: "—",
    metricLabel: "tasks managed",
    path: "/",
  },
  {
    icon: BarChart3,
    title: "Conversion Designer",
    description: "Outputs GHL-ready funnel structures with section layouts, copy placement, and flow design.",
    status: "idle" as const,
    metric: "—",
    metricLabel: "funnels designed",
    path: "/",
  },
];

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="space-y-8 animate-slide-up">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Command Center
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            AI-powered marketing agency fulfilment system
          </p>
        </div>

        {/* Stats */}
        <StatsBar stats={stats} />

        {/* Agents Grid */}
        <div>
          <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-4">
            Agent Fleet
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {agents.map((agent) => (
              <AgentCard
                key={agent.title}
                icon={agent.icon}
                title={agent.title}
                description={agent.description}
                status={agent.status}
                metric={agent.metric}
                metricLabel={agent.metricLabel}
                onClick={() => navigate(agent.path)}
              />
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
