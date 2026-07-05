# Data model

All assistant records live under `apps/assistant/data/`. Narrative documents are **markdown with YAML frontmatter**; longitudinal numbers are **also appended to `data/metrics/*.jsonl`** (one JSON object per line, append-only). File and directory names are lowercase kebab-case; dates are ISO (`YYYY-MM-DD`), weeks are ISO weeks (`YYYY-Wnn`).

Validation: `node scripts/validate-data.mjs` (run from `apps/assistant/`).

## 1. The source object (used everywhere)

Every claim links back to where it came from. In frontmatter lists and inline links alike:

```yaml
sources:
  - { label: "Task #48211 — Homepage QA", url: "https://app.productive.io/…/tasks/48211", kind: productive }
  - { label: "Jane's Slack thanks", url: "https://….slack.com/archives/C0…/p17…", kind: slack }
  - { label: "Kickoff recording", url: "https://fathom.video/calls/…", kind: fathom }
```

`kind` enum: `slack | gmail | calendar | productive | fathom | drive | rize | github | cowork | manual`.

`manual` is for things Stef said directly (no URL required; omit `url` or leave empty). Every other kind requires a working `url`.

## 2. Common frontmatter fields

| Field | Req | Notes |
|---|---|---|
| `type` | ✔ | one of the document types below |
| `date` | ✔ | ISO date the record is about (not when written) |
| `sources` | ✔ (may be `[]`) | list of source objects |
| `gaps` | – | list of strings recording degraded sources, e.g. `"productive: token not configured"` |

## 3. Document types

### `daily` — `data/daily/YYYY/YYYY-MM-DD.md`

```yaml
---
type: daily
date: 2026-07-03
hours_worked: 7.4                 # from Rize
hours_by_client: { acme: 3.1, internal: 2.3 }   # client slugs from config/clients/
meetings_count: 3
wins: ["Shipped homepage QA round"]
obstacles: ["Waited 4h on client asset delivery"]
insights: ["Acme responds faster to Loom than email"]
improve_tomorrow: ["Batch email to 2 windows"]
open_loops: ["Globex SOW awaiting signature"]
feedback_refs: ["feedback/2026/2026-07-03-acme-praise-from-jane.md"]
sources: []
gaps: []
---
## Wins
- Shipped homepage QA ([Task #48211](…), [Slack thread](…))
…body sections mirror the frontmatter lists, with inline source links…
```

Body headings (all optional): `## Wins`, `## Delivered`, `## Insights`, `## Obstacles`, `## Improve tomorrow`, `## Open loops`, `## Notes`.

### `checkin` — `data/checkins/YYYY/YYYY-MM-DD-HHMM.md`

```yaml
---
type: checkin
date: 2026-07-03
time: "13:30"
items:                             # only actionable, deduped vs earlier check-ins that day
  - { what: "Unanswered email from Jane re: launch date", urgency: high, source: { label: "…", url: "…", kind: gmail } }
sources: []
gaps: []
---
```

### `weekly` — `data/weekly/YYYY/YYYY-Wnn.md`

```yaml
---
type: weekly
week: 2026-W27
hours_total: 38.2
hours_by_client: { acme: 14.0 }
top_wins: []                       # strings
headwinds: []                      # rolled up from daily obstacles
trend_notes: []
daily_refs: ["daily/2026/2026-06-29.md"]
sources: []
gaps: []
---
```

### `meeting` — `data/meetings/YYYY/YYYY-MM-DD-<slug>/meeting.md`

The canonical digest. Sibling files: `transcript.md` (raw Fathom transcript; purgeable per retention policy), `coaching.md`.

```yaml
---
type: meeting
date: 2026-07-03
client: acme                       # slug, or "internal" / "unknown"
title: "Acme homepage kickoff"
fathom_url: "https://fathom.video/calls/…"
attendees: [{ name: "Jane Doe", org: "Acme" }]
duration_min: 47
action_items: [{ owner: stef, item: "Send revised timeline", due: 2026-07-07, source: { … } }]
decisions: []
outstanding: []                    # raised but unresolved
needs_review_next_time: []
sources: []
gaps: []
---
## Summary
…
```

### `coaching` — `…/coaching.md` (same folder as its meeting)

```yaml
---
type: coaching
date: 2026-07-03
meeting_ref: "meetings/2026/2026-07-03-acme-kickoff/meeting.md"
metrics:
  talk_pct: 58                     # Stef's share of words/time
  client_talk_pct: 34
  longest_monologue_min: 4.5
  questions_asked: 7
  jargon_flags: 3                  # jargon used without client-level explanation
scores:                            # 1–5
  listening: 3
  clarity: 4
  engagement: 4
  level_match: 3
sources: []
gaps: []
---
## What went well
## What to improve (and how)
## Trend vs. recent meetings
```

### `client-profile` — `data/clients/<slug>/profile.md` (living document, updated in place)

```yaml
---
type: client-profile
slug: acme
name: "Acme Corporation"
contacts: [{ name: "Jane Doe", email: "jane@acme.com", role: "Marketing Dir", comms_style: "brief, visual, dislikes jargon" }]
goals: ["Relaunch site before Q4 campaign"]
how_to_work_with_them: []          # learned over time by /brief and /coach
sources: []
gaps: []
---
```

(Matcher config — Productive project ids, Slack channels, email domains, Fathom matchers — lives in `config/clients/<slug>.yml`, not here.)

### `brief` — `data/clients/<slug>/briefs/YYYY-MM-DD.md` (dated snapshot)

```yaml
---
type: brief
client: acme
date: 2026-07-03
budget: { hours_total: 120, hours_used: 84, hours_remaining: 36, burn_assessment: "on-track" }  # on-track | watch | over
my_tasks: [{ title: "…", status: "…", url: "…" }]
waiting_on: [{ what: "…", who: "…", since: 2026-06-30, source: { … } }]
tasks:                             # every live task in the project
  - { title: "…", status: "…", last_comment: "…", next_action: "…", owner: "…", url: "…" }
recommendations: []                # next tasks/projects for the client, working-style advice
sources: []
gaps: []
---
```

### `agenda` — `data/clients/<slug>/agendas/YYYY-MM-DD.md`

```yaml
---
type: agenda
client: acme
date: 2026-07-08                   # the meeting date
event_url: ""                      # calendar event link if known
brief_ref: "clients/acme/briefs/2026-07-03.md"
sources: []
gaps: []
---
## Recap of last meeting
## Outstanding items
## Decisions needed
## New topics
```
Agenda bodies are client-ready: jargon translated, succinct.

### `feedback` — `data/feedback/YYYY/YYYY-MM-DD-<slug>.md`

```yaml
---
type: feedback
date: 2026-07-03
from: "Jane Doe (Acme)"
client: acme
channel_kind: slack                # same enum as source kind
quote: "Stef, this looks fantastic — exactly what we asked for."   # VERBATIM
context: "After homepage QA delivery"
sources: [{ label: "Slack thread", url: "…", kind: slack }]
---
```

### `plan` — `data/planning/YYYY-Wnn.md`

```yaml
---
type: plan
week: 2026-W28
moves:
  - { action: move, task: "…", reason: "…", source: { … } }      # action: move | update | add | re-estimate
focus: []                          # suggested priorities for the week
sources: []
gaps: []
---
```

### `evaluation` — `data/evaluation/<period>.md` (e.g. `2026-H1.md`)

```yaml
---
type: evaluation
period: "2026-H1"
generated: 2026-07-03
totals: { hours: 812, meetings: 96, wins: 143, feedback_count: 22 }
sources: []
---
## Highlights (quantified, linked)
## Positive feedback (verbatim quotes)
## Growth (coaching trend)
## Headwinds overcome
```

### `context` — `data/context/inbox/YYYY-MM-DD-HHMM-<slug>.md`

Written by *other* Claude sessions (see `integrations/cowork/CONTEXT.md`): frontmatter `date`, `client`; body lines `what:`, `state:`, `links:`. Consumed by `/eod` and `/plan-week`, then moved to `data/context/processed/`.

## 4. Metrics JSONL — `data/metrics/*.jsonl`

Append-only; one observation per line; never edit or reorder existing lines. Every line: `date` (ISO) + `metric` + `value` (+ dimensions). `"example": true` marks seed data safe to delete.

- **`hours.jsonl`** — `{"date":"2026-07-03","metric":"hours_worked","value":7.4}` and `{"date":"2026-07-03","metric":"hours_client","client":"acme","value":3.1}`
- **`workload.jsonl`** — `{"date":"2026-07-03","metric":"meetings_count","value":3}`, `{"date":"2026-07-03","metric":"open_loops","value":4}`, `{"date":"2026-07-03","metric":"wins_count","value":2}`
- **`coaching.jsonl`** — `{"date":"2026-07-03","metric":"talk_pct","value":58,"meeting":"2026-07-03-acme-kickoff"}` — one line per coaching metric and score.

## 5. State — `data/.state/last-run.json`

```json
{ "checkin": "2026-07-03T15:30:00-04:00", "digest-meetings": "2026-07-02T21:00:00-04:00", "plan-week": null }
```

Keys are job names; values are the ISO timestamp of the last successful run (the cursor). Jobs read their key before gathering and write it after committing outputs.
