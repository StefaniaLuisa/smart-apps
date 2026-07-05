---
name: coach
description: Analyze a recorded client meeting for how Stef performed — talk-time balance, engagement, clarity, jargon vs. client level — and write constructive coaching feedback with longitudinal trends.
argument-hint: <meeting folder, Fathom URL, or "latest">
---

# /coach — meeting performance coaching

Read `apps/assistant/CLAUDE.md` first. Target schema: `coaching`.

## 1. Resolve the meeting

- Argument is a `data/meetings/...` folder → use its `transcript.md` (fetch via `mcp__Fathom__get_meeting_transcript` if the transcript was purged).
- Argument is a Fathom URL → `mcp__Fathom__get_recording_by_url` then `get_meeting_transcript`; digest it first per `/digest-meetings` §2 if no folder exists yet.
- `latest` / no argument → most recent client meeting under `data/meetings/`.

## 2. Compute metrics (be honest about diarization quality; note doubts in `gaps`)

From the speaker-attributed transcript:
- `talk_pct` — Stef's share of words; `client_talk_pct` — client attendees' share.
- `longest_monologue_min` — Stef's longest uninterrupted stretch (estimate from timestamps).
- `questions_asked` — genuine questions Stef asked the client (not rhetorical).
- `jargon_flags` — technical terms Stef used without a plain-language translation, judged against this client's `comms_style` in `data/clients/<slug>/profile.md`.

## 3. Score 1–5 with evidence

`listening` (did she leave room, build on client's words), `clarity` (structured, succinct explanations), `engagement` (energy, client participation elicited), `level_match` (explanations pitched to the client's technical level). Each score must cite at least one transcript moment (timestamped deep link).

## 4. Write constructive feedback

`data/meetings/<...>/coaching.md` per the `coaching` schema:
- **What went well** — specific, quoted moments.
- **What to improve (and how)** — max 3 items, each with a concrete technique (e.g. "end explanations >60s with a check-in question"), never generic advice.
- **Trend vs. recent meetings** — compare against the trailing 5–10 entries in `data/metrics/coaching.jsonl`; call out improvement explicitly (motivation matters).

Tone: a supportive speaking coach — direct about the gap, specific about the fix, generous about the win.

## 5. Finish

- Append one line per metric AND per score to `data/metrics/coaching.jsonl` (see DATA-MODEL §4).
- Update `how_to_work_with_them` in the client profile if the meeting revealed a durable preference.
- Validator → commit `assistant: coach <meeting-slug>` → push.
- If run standalone (not from /digest-meetings), DM Stef the headline: one win, one improvement, trend line.
