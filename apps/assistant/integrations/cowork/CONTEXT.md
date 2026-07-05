# Cowork context capture

The assistant wants to know what Claude sessions are doing on client projects so briefs
and weekly planning reflect work-in-flight, not just what's in Productive.

## The convention (also stated in the root CLAUDE.md, which every session reads)

Any Claude session in this environment that does client work writes, before it ends:

`apps/assistant/data/context/inbox/YYYY-MM-DD-HHMM-<slug>.md`

```markdown
---
date: 2026-07-05
client: acme
---
what: Implemented the donation-form validation fixes
state: PR open, awaiting review; deploy blocked on client DNS change
links: https://github.com/4site/acme-site/pull/42
```

`client` is a slug from `config/clients/`, or `internal`.

## Consumption

- `/eod` folds today's inbox notes into the daily log and moves them to `data/context/processed/`.
- `/brief` and `/plan-week` read both `inbox/` and recent `processed/` notes for their client.

## Reliability

This is convention-based and best-effort — sessions outside this repo/environment won't
know about it. Fallback: `/plan-week` also scans Stef's recent GitHub commits and PRs
(GitHub connector) for work the inbox missed. Treat context notes as hints, not truth;
anything important should be verified against Productive/Slack before being asserted
with a source link.
