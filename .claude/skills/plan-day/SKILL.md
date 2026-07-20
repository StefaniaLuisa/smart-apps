---
name: plan-day
description: Daily planning — reassess active tasks and projects each morning and recommend what to move, update, add, or re-estimate today. Runs every morning; also on demand.
---

# /plan-day — daily planning assessment

Read `apps/assistant/CLAUDE.md` first. Target schema: `plan-day`. This is the forward-looking daily counterpart to the Monday `/week-review` retrospective — keep it about *today and the next couple of days*, not a weekly recap.

## 1. Gather (missing source → `gaps`, continue)

- **Productive** (per active client in `config/clients/*.yml`): `node apps/assistant/integrations/productive/productive.mjs my-tasks` plus `tasks --project <id>` and `budgets --project <id>` for clients with work in flight — focus on due-today, due-tomorrow, overdue, and newly-changed tasks.
- **Calendar**: `mcp__Google_Calendar__list_events` for today and the next 2 days — how much of the day is already committed to meetings (that constrains what can realistically move).
- **Open loops**: read the last 2–3 `data/daily/*.md` files — `open_loops` that are still open.
- **Context inbox**: `data/context/inbox/*.md` — work other Claude sessions have in flight.
- **Latest briefs**: `data/clients/*/briefs/` for budget-burn flags.

## 2. Produce the daily plan

Write `moves`, each `{action, task, reason, source}` where `action` is one of:
- **move** — a task whose timing collides with today's meeting load or a deadline (be concrete: "3h of meetings this afternoon — pull the CLF QA into the morning").
- **update** — a Productive task whose status/estimate no longer matches reality (stale, done-but-open, wrong owner).
- **add** — a commitment found in a meeting, email, Slack, or context note that has no task yet.
- **re-estimate** — a task whose logged hours vs. remaining estimate say the estimate is wrong; flag `watch`/`over` budgets.

Then `focus`: the 3 things that matter most today, given deadlines and client goals.

Only surface items that are **actionable today** and changed since yesterday's plan (read yesterday's `data/planning/daily/*.md` to avoid repeating an unchanged recommendation verbatim).

## 3. Finish

- Write `data/planning/daily/<date>.md` per the `plan-day` schema.
- Run `node apps/assistant/scripts/validate-data.mjs`.
- Commit `assistant: plan-day <date>` → push.
- DM Stef in Slack (`config: slack.dm_target`): today's focus (3 lines) + the moves list, each with a working link. If nothing changed since yesterday, send a one-line "no changes to your plan today" rather than repeating it.
