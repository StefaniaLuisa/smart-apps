---
name: eod
description: End-of-day work log — capture wins, deliverables, insights, obstacles, hours, and positive feedback into a source-linked daily record. Run at end of each workday, or when Stef replies to the EOD Slack prompt.
---

# /eod — end-of-day log

Read `apps/assistant/CLAUDE.md` and `apps/assistant/docs/DATA-MODEL.md` first. Target schema: `daily`. Today's date in the timezone from `apps/assistant/config/assistant.yml`.

## 1. Gather signals (parallel where possible; missing source → add to `gaps`, continue)

- **Hours**: Rize — `mcp__Rize__list_my_time_entries` for today (and `mcp__Rize__get_my_time_allocation` for the client split). Map Rize projects/clients to client slugs via `config/clients/*.yml`; unmapped time → `internal`.
- **Meetings**: `mcp__Google_Calendar__list_events` for today; count events Stef attended.
- **Slack activity**: `mcp__Slack__slack_search_public_and_private` with `from:@stef` (today) — identify deliverables announced, threads resolved, and **scan for praise directed at Stef** (thank-yous, kudos, 🎉/❤️ reactions on her messages via `mcp__Slack__slack_get_reactions` where suspected).
- **Email activity**: `mcp__Gmail__search_threads` with `from:me newer_than:1d` — sent deliverables, resolved threads; also scan received mail for praise.
- **Productive**: `node apps/assistant/integrations/productive/productive.mjs my-tasks` — tasks closed/updated today. If `not_configured`, record gap.
- **Today's check-ins**: read `data/checkins/<year>/<today>-*.md` — open items become candidates for `open_loops`.
- **Cowork context**: read `data/context/inbox/*.md` dated today; fold into deliverables; move consumed files to `data/context/processed/`.
- **Today's meetings digests**: any `data/meetings/<year>/<today>-*/meeting.md` — action items owned by Stef become open loops.

## 2. Draft, then ask Stef (keep it to ~3 minutes)

Compose a draft daily log from the signals, then ask Stef **three short questions** (in Slack via `mcp__Slack__slack_send_message` to `config: slack.dm_target` if this run was triggered by the EOD routine, or directly in-session otherwise):

1. "Top wins today — I found these: … anything to add/correct?"
2. "Any insights or things you were up against that I can't see in the tools?"
3. "What do you want to do better tomorrow?"

Incorporate her answers (they are `kind: manual` sources). If she doesn't reply within the session, write the log from signals alone and note `gaps: ["stef: no manual input"]`.

## 3. Capture feedback

For each piece of praise found in step 1, follow `.claude/skills/capture-feedback/SKILL.md` to write a `feedback` file. Reference them in `feedback_refs`.

## 4. Write outputs

- `apps/assistant/data/daily/<year>/<date>.md` per the `daily` schema — every win/deliverable linked to its source.
- Append to `data/metrics/hours.jsonl`: one `hours_worked` line + one `hours_client` line per client.
- Append to `data/metrics/workload.jsonl`: `meetings_count`, `wins_count`, `open_loops`.
- Run `node apps/assistant/scripts/validate-data.mjs`.

## 5. Finish

- Commit: `git add` the files written → `assistant: eod <date>` → `git push -u origin <current branch>`.
- Slack-DM Stef a 5-line confirmation: hours, top win, open loops count, feedback captured, link gaps if any.
