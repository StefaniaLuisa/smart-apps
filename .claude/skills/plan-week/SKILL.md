---
name: plan-week
description: Monday planning — roll up last week (wins, hours, headwinds), then recommend which tasks/projects to move, update, add, or re-estimate this week. Also pre-briefs clients with meetings this week.
---

# /plan-week — weekly rollup + planning engine

Read `apps/assistant/CLAUDE.md` first. Target schemas: `weekly` (last week) + `plan` (this week). Cursor: `data/.state/last-run.json` → `plan-week`.

## 1. Roll up last week → `data/weekly/<year>/<year>-W<nn>.md`

From last week's `data/daily/` files + `metrics/*.jsonl`: `hours_total`, `hours_by_client`, `top_wins` (pick the 3–5 with the most impact), `headwinds` (aggregate the dailies' `obstacles` — this is the "what I was up against" record), `trend_notes` (hours vs. prior weeks, coaching trend if meetings were coached, blind spots you can see across the dailies — e.g. a client consistently absent from `hours_by_client`, recurring obstacle types, open loops that survived all week).

## 2. Plan this week → `data/planning/<year>-W<nn>.md`

Inputs: Productive due/overdue + budgets (`productive.mjs tasks/budgets` per client), `mcp__Google_Calendar__list_events` for the week ahead, surviving `open_loops`, latest briefs, `data/context/{inbox,processed}/`.

Produce `moves`, each `{action: move|update|add|re-estimate, task, reason, source}`:
- **move** — deadline vs. calendar-capacity collisions (be concrete: "Thu is 5h of meetings; move X to Wed").
- **update** — tasks whose Productive status/description no longer matches reality (stale last comment, done-but-open).
- **add** — commitments found in meetings/emails/Slack that have no task yet.
- **re-estimate** — tasks whose burn (hours logged vs. remaining estimate) says the estimate is wrong; flag budget `watch`/`over` projects.

Plus `focus`: the 3 things that matter most this week, given client goals and deadlines.

## 3. Pre-brief meeting clients

For each client with a meeting this week (Calendar), run `/brief <slug>` if their latest brief is older than 3 days.

## 4. Finish

Validator → update cursor → commit `assistant: plan-week <year>-W<nn>` → push → DM Stef: last week in 3 lines (hours, top win, biggest headwind) + this week's focus + the moves list with links.
