
# Agent Pipeline with Human-in-the-Loop

Turn the 7 standalone agents into one orchestrated flow. Agents chain automatically; humans gate the critical stages.

## The flow

```text
Client profile
   ↓
Strategist  ──►  [GATE: approve strategy]
   ↓
Copywriter ─┐
Automation  ├──►  [GATE: approve each output]
Funnels    ─┘
   ↓
Media Buyer ──►  [GATE: approve budget plan]
   ↓
Creative Brief ──►  [GATE: approve brief]
   ↓
Graphic Designer (visuals)  ──►  [GATE: approve visuals]
   ↓
Project Manager (aggregates + timeline)
```

Between gates, the next stage runs automatically. At a gate, the pipeline pauses until a human clicks approve, edits inline, or asks for a regen with feedback notes.

## What gets built

### 1. Status workflow (schema)
Every output table (`strategies`, `copy_outputs`, `media_plans`, `automations`, `funnel_designs`, `creative_briefs`, `generated_visuals`, `project_tasks`) gets:
- `review_status` — `draft | in_review | approved | rejected | deployed` (default `in_review`)
- `review_notes` — text, human feedback for revisions
- `version` — int, incremented on regen
- `parent_id` — self-ref, links a regen to its predecessor (keeps history)

Downstream agents only read `approved` upstream context.

### 2. Orchestrator edge function — `pipeline-orchestrator`
Input: `{ client_id }`. Logic:
1. Look at approved outputs for this client.
2. Determine next stage per the flow above.
3. If next stage is behind a gate that has nothing pending → run that agent.
4. If a gate has an `in_review` item → stop and return `waiting_on: <stage>`.
5. Return `{ ran: [...], waiting_on, next_action }`.

Called by a "Run pipeline" button on the client page and after every approval.

### 3. Revision loop
Two options on every output card:
- **Edit inline** — textarea, saves as new version (`parent_id` set, `version++`, `review_status='in_review'`).
- **Regenerate with notes** — user types feedback, agent re-runs with client + strategy + prior version + notes as context. Saved as new version.

Approving a version marks it `approved`; older versions stay in history (collapsible).

### 4. Client pipeline board (on `/clients/:id`)
Kanban-style row of stage cards:

```text
[Strategy ✓] → [Copy 3/4 ✓] → [Automation ⏳] → [Media ⏸ gate] → [Funnels –] → [Creative –] → [Visuals –] → [PM –]
```

Each card: status chip, count, "Review" button (jumps to pending item), "Run next" button when idle.

### 5. Global review queue (on `/` Dashboard)
"Awaiting your review" list across all clients — every `in_review` output, newest first, with quick approve / reject / open buttons.

### 6. Auto-chain toggle
`clients.auto_chain boolean default true`. When ON, orchestrator runs the next stage after every approval automatically. When OFF, human clicks "Run next stage" manually.

## Technical notes

- **Schema**: single migration adds the 4 columns to all 8 output tables + `auto_chain` to `clients`. Existing rows backfill to `review_status='approved'` so nothing blocks day-one.
- **Orchestrator**: pure TS in one edge function; calls existing agent functions internally via `supabase.functions.invoke`. No new model calls added — reuses the 7 agents already deployed.
- **Regen with notes**: each agent function already accepts `additional_context`; orchestrator concatenates `review_notes` + prior content into it. No agent function needs changes except adding an optional `prior_version` field to the prompt template.
- **Gates as config**: array in orchestrator — `['strategy','copy','automation','funnel','media','brief','visuals']` with `requiresApproval: true` on the four the user picked. Easy to toggle later.
- **UI**: two new components — `PipelineBoard` (client page) and `ReviewQueue` (dashboard). Existing agent pages get an approve/reject/regen strip on each saved output card.
- **RLS**: unchanged pattern — authenticated users have full access (agency team).

## Out of scope for this pass
- Email/Slack notifications when a gate is hit (can add later)
- Per-team-member assignment of reviewers (all team members can approve for now)
- Automatic deploy to GHL (Phase 2)

## Rollout order
1. Migration (schema + backfill)
2. Orchestrator edge function
3. Approve/reject/regen strip on existing output cards
4. `PipelineBoard` on client detail
5. `ReviewQueue` on dashboard
6. Auto-chain toggle on client form

Ready to build — confirm and I'll ship it.
