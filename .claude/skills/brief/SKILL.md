---
name: brief
description: Full client brief — every live task with status/last comment/next action, Stef's tasks, what's waiting, budget hours and burn quality, plus recommendations for the client and how to communicate. Run before client meetings or any time.
argument-hint: <client-slug>
---

# /brief <client> — client intelligence snapshot

Read `apps/assistant/CLAUDE.md` first. Target schema: `brief`. Load `config/clients/<slug>.yml` and `data/clients/<slug>/profile.md` (create the profile from the config if missing).

## 1. Gather (missing source → `gaps`, continue)

- **Productive** (`node apps/assistant/integrations/productive/productive.mjs`, using the client's `project_ids`):
  - `tasks --project <id>` — every open task: title, status, assignee, due.
  - `comments --task <id>` for active tasks — last comment + who's waiting on whom.
  - `budgets --project <id>` — hours total/used/remaining.
- **Slack**: recent activity in the client's `slack_channels` — decisions, blockers, tone.
- **Gmail**: `mcp__Gmail__search_threads` on the client's `email_domains`, last 14 days — open questions, promised items.
- **Last meeting**: latest `data/meetings/**/meeting.md` with this client — `outstanding` + `needs_review_next_time` + action items.
- **Cowork context**: `data/context/{inbox,processed}/` notes for this client (last 14 days).
- **Drive** (if `drive_folder` set): `mcp__Google_Drive__list_recent_files` scoped to it — recently changed deliverables.

## 2. Synthesize

- Per-task line: status, last comment (one sentence), **next action and whose move it is**, link.
- `my_tasks` — Stef's; `waiting_on` — blocked items with who/since.
- `budget.burn_assessment`: `on-track | watch | over` — judge hours-used vs. work-remaining honestly, and say *which tasks are consuming budget well or poorly*.
- `recommendations` (each with reasoning grounded in the client's `goals`, past work, and current work):
  - next tasks/projects worth proposing to the client;
  - how to work with this client (update profile `how_to_work_with_them` if you learn something durable);
  - flag anything that should be re-estimated or moved (feeds /plan-week).
- End the brief body with: **"Want a breakdown of how to best communicate any of these to the client?"** — if Stef says yes for an item, add a section translating it into client-friendly language (no jargon, lead with impact, per the contact's `comms_style`).

## 3. Finish

Write `data/clients/<slug>/briefs/<date>.md` → validator → commit `assistant: brief <slug> <date>` → push. If run interactively, show Stef the brief inline too.
