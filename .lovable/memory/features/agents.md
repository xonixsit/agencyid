---
name: Agent architecture
description: 7 agent roles for marketing agency fulfilment, all active
type: feature
---
## Agent Roles

1. **Strategist** ✅ — Full funnel strategy generation from client data
2. **Copywriter** ✅ — Ad copy, emails, landing pages, sales pages
3. **Media Buyer** ✅ — Meta/Google campaign structures, targeting, budget allocation, scaling playbooks
4. **Automation Builder** ✅ — CRM workflows, nurture sequences, GHL automations (5 types)
5. **Project Manager** ✅ — Task assignment, deliverable tracking, timelines across all agents
6. **Conversion Designer** ✅ — GHL funnel structures, page layouts, section design (5 funnel types)
7. **Graphic Designer** ✅ — Creative direction, ad visuals, content design briefs (5 brief types)

## Architecture

- Each agent = Supabase edge function calling Lovable AI (Gemini 3 Flash)
- Structured system prompts enforce production-ready, GHL-compatible output
- Client data flows through: Onboarding → Strategy → Copy/Media/Automation/Funnels/Creative
- PM agent aggregates all outputs for gap analysis and timeline planning
- Outputs stored in dedicated tables: strategies, copy_outputs, media_plans, automations, funnel_designs, creative_briefs, project_tasks
