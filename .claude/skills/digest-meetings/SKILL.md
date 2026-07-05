---
name: digest-meetings
description: Pull new Fathom meetings, save transcripts, write structured digests (action items, decisions, outstanding items), and queue coaching for client meetings. Runs nightly or on demand.
---

# /digest-meetings — Fathom pipeline

Read `apps/assistant/CLAUDE.md` first. Target schema: `meeting`. Cursor: `data/.state/last-run.json` → `digest-meetings` (null → 7 days ago).

## 1. Discover

`mcp__Fathom__list_meetings` since the cursor. For each meeting not already present under `data/meetings/`:

## 2. For each new meeting

1. `mcp__Fathom__get_meeting_summary` and `mcp__Fathom__get_meeting_transcript` (pass the recording URL for timestamped deep links).
2. **Classify client**: match title + attendee names/domains against `fathom_matchers` and `email_domains` in `config/clients/*.yml`. No match → `client: internal` if all attendees are 4Site, else `client: unknown` + gap note.
3. Create `data/meetings/<year>/<date>-<slug>/`:
   - `transcript.md` — raw transcript, header noting the retention policy (`config: transcripts.retention_days`).
   - `meeting.md` — per the `meeting` schema: summary, attendees, `action_items` (each with owner, due if stated, and a source deep-link into the recording), `decisions`, `outstanding`, `needs_review_next_time`. Every claim must be traceable to the transcript.
4. **Praise scan**: if a client complimented Stef's work in the meeting, follow `.claude/skills/capture-feedback/SKILL.md` (source = Fathom deep link, quote verbatim).

## 3. Queue coaching

For each new meeting whose `client` is a real client slug (not internal/unknown), run `.claude/skills/coach/SKILL.md` on it now, in this session.

## 4. Finish

- Update cursor `digest-meetings` = now; run the validator.
- Commit: `assistant: digest-meetings <date> (<n> meetings)` → push.
- If ≥1 meeting was digested, DM Stef one line per meeting: title, top action item, coaching headline (if coached).
