---
name: week-review
description: Monday-morning retrospective of the prior week — all delivered work, what went well, successes logged from every channel with working links, anything that slipped, and what to watch this week. Runs Monday 6am; also on demand.
---

# /week-review — the week that was

Read `apps/assistant/CLAUDE.md` first. Target schema: `weekly` (writes `data/weekly/<year>/<year>-W<nn>.md` for the **prior** week). This is the backward-looking retrospective; the forward-looking planning lives in `/plan-day`. **Every claim must carry a working source link** — this record is what feeds evaluations, so a win with no link is not done.

Prior week = the Monday–Sunday that just ended. Cursor: none needed (derive the week from today's date).

## 1. Gather all delivered work from every channel (missing source → `gaps`, continue)

- **Daily logs**: last week's `data/daily/*.md` — wins, deliverables, obstacles, open loops, feedback refs.
- **Meetings**: `data/meetings/**/meeting.md` from last week — decisions, action items completed.
- **Productive**: tasks closed/moved last week per active client (`productive.mjs tasks --changed-since <last Monday>`), and budget movement.
- **Slack**: `mcp__Slack__slack_search_public_and_private` — Stef's shipped announcements and **praise directed at her** (thank-yous, kudos, reactions) across client channels last week.
- **Gmail**: `mcp__Gmail__search_threads` — delivered items and client appreciation last week.
- **Fathom**: client compliments captured in last week's coaching/meeting records.
- **Context inbox/processed**: work other Claude sessions logged.

## 2. Write the retrospective

Into the `weekly` doc, with these body sections (all source-linked):

- **Delivered** — everything that shipped last week, grouped by client, each linked to its Productive task / PR / Drive doc / meeting.
- **What went well** — the through-line: where the week had real impact. Concrete, not vague.
- **Successes & positive feedback** — every piece of praise, **verbatim quote + working link**; run `.claude/skills/capture-feedback/SKILL.md` for any not already captured, and reference the feedback files.
- **What got missed** — honestly: open loops that stayed open, deadlines that slipped, a client who went quiet, a task that stalled. Link each so it can be picked up.
- **Watch this week** — 2–4 things to bring up or pay attention to going forward (a budget nearing its cap, a client decision pending, a recurring obstacle).

Frontmatter: `hours_total`, `hours_by_client`, `top_wins`, `headwinds` (from obstacles), plus `missed` and `watch` lists, and `daily_refs`.

## 3. Finish

- Append trend numbers to `data/metrics/workload.jsonl` if not already present (weekly wins/hours).
- Run the validator → commit `assistant: week-review <year>-W<nn>` → push.
- DM Stef in Slack a scannable summary: hours + top 3 wins (linked), the single best piece of feedback (quoted + linked), anything missed, and this week's watch-items. Rebuild the dashboard so the History view reflects it.
