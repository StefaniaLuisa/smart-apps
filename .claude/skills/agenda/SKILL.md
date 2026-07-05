---
name: agenda
description: Draft the next client meeting agenda — recap of last meeting, outstanding items, decisions needed, new topics — in succinct, jargon-free, client-ready language.
argument-hint: <client-slug> [meeting-date]
---

# /agenda <client> — client meeting agenda

Read `apps/assistant/CLAUDE.md` first. Target schema: `agenda`.

## 1. Inputs

- Latest `data/clients/<slug>/briefs/*.md` — if none exists or it's older than 3 days, run `/brief <slug>` first.
- Latest meeting record for this client — `outstanding`, `needs_review_next_time`, action items and their current state (check each against the brief: done? still open?).
- The target Calendar event: `mcp__Google_Calendar__list_events` — next event matching this client (or the given date). Record its link in `event_url`.
- Client profile — contacts' `comms_style` and the client's `goals`.

## 2. Draft — client-ready, not internal

Sections: **Recap of last meeting** (what was agreed, what got done since) → **Outstanding items** (whose move, what's needed) → **Decisions needed** (framed as clear either/or choices) → **New topics** (from the brief's recommendations worth raising now).

**Jargon-translation pass**: rewrite every technical item in plain language pitched to this client — lead with the outcome/impact, keep each item to 1–2 sentences, put the technical detail in a parenthetical only if useful. The agenda should be sendable to the client as-is.

Keep the whole agenda scannable in under a minute; meetings lose people after that.

## 3. Finish

- Write `data/clients/<slug>/agendas/<meeting-date>.md` per the `agenda` schema (internal notes, if any, go under a clearly marked `## Internal — do not send` section at the bottom).
- Offer: "Want this as a Google Doc to share?" — if yes, `mcp__Google_Drive__create_file` in the client's `drive_folder` and add the link to `sources`.
- Validator → commit `assistant: agenda <slug> <meeting-date>` → push.
