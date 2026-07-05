---
name: eval-packet
description: Compile an evaluation showcase for any period — quantified wins with links, hours and workload, verbatim feedback quotes, coaching growth, and headwinds overcome. For yearly reviews or any check-in.
argument-hint: [period, e.g. 2026, 2026-H1, 2026-Q3, or a date range]
---

# /eval-packet — your work, quantified and linked

Read `apps/assistant/docs/DATA-MODEL.md` §`evaluation`. **Data-only skill: reads `data/**`, makes no live connector calls.** Default period: year-to-date.

## 1. Aggregate the period

- **Totals** from `metrics/*.jsonl`: hours worked, meetings held, wins count; plus feedback count from `data/feedback/`.
- **Highlights**: from `weekly/` `top_wins` (fall back to dailies), pick the strongest 8–12 — each stated as impact ("Shipped X, which unblocked Y"), each with its source link. Group by client.
- **Positive feedback**: every `feedback` record in the period — verbatim quotes with attribution and links. This section is the star; don't trim it.
- **Growth**: coaching trend from `coaching.jsonl` — talk-time and scores, first-third vs. last-third of the period ("talk share 64% → 52%; listening score 3 → 4.2"). Skip gracefully if fewer than 3 coached meetings.
- **Headwinds overcome**: from `weekly/` `headwinds` — what she was up against, and what shipped despite it. Frame as resilience, not complaint.
- **Blind spots & goals** (internal-only section): recurring `improve_tomorrow` themes that never resolved, clients/skills under-invested in — honest input for her own goal-setting, clearly marked as not for the packet.

## 2. Write

`data/evaluation/<period>.md` per the `evaluation` schema. Two audiences, one file: the body reads well enough to hand to a manager (skip the internal section); numbers are exact; every claim linked.

## 3. Finish

Validator → commit `assistant: eval-packet <period>` → push. Offer: "Want this as a Google Doc for your review meeting?" (`mcp__Google_Drive__create_file` if yes). Rebuild the dashboard (`npm run build` in `apps/assistant/`) so the Evaluation view shows it.
