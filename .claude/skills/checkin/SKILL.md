---
name: checkin
description: Intraday sweep across Slack, Gmail, Calendar, and Productive — DM Stef anything actionable she may have missed. Runs on a schedule (10:30/13:30/15:30 weekdays) or on demand.
---

# /checkin — "what am I missing right now?"

Read `apps/assistant/CLAUDE.md` first. Target schema: `checkin`. Read the cursor: `data/.state/last-run.json` → `checkin` (null → start of today's workday per `config/assistant.yml`).

## 1. Sweep sources since the cursor (missing source → `gaps`, continue)

- **Slack**: `mcp__Slack__slack_search_public_and_private` for mentions of Stef and unanswered DMs since cursor. An item is actionable if it asks her something, blocks someone, or is from a client channel (match via `config/clients/*.yml`).
- **Gmail**: `mcp__Gmail__search_threads` `is:unread newer_than:1d` plus threads where Stef is the last non-responder on a client domain. Actionable = client waiting on her, or deadline mentioned.
- **Calendar**: `mcp__Google_Calendar__list_events` next 3 hours — flag meetings lacking an agenda file in `data/clients/*/agendas/` and any meeting with a client for whom `outstanding` items exist in the latest meeting record.
- **Productive**: `node apps/assistant/integrations/productive/productive.mjs my-tasks --changed-since <cursor>` — new assignments, status changes, new comments on her tasks, tasks due today/tomorrow.
- **Rize** (context only): `mcp__Rize__get_my_time_allocation` today so far — mention only if wildly off plan (e.g. zero client hours by 13:30 on a delivery day).

## 2. Filter hard

Include ONLY items that are actionable by Stef and NOT already reported in an earlier check-in today (read today's `data/checkins/` files to dedupe). Empty result is a valid result.

## 3. Deliver + record

- If there are items: DM via `mcp__Slack__slack_send_message` to `slack.dm_target` — max 6 bullets, each `[urgency] what — why it matters (link)`. If empty: send nothing (no noise).
- Write `data/checkins/<year>/<date>-<HHMM>.md` per the `checkin` schema (write it even when empty, `items: []`, so dedupe and EOD have the record).
- Update `data/.state/last-run.json` → `checkin` = now (ISO with timezone offset).
- Commit: `assistant: checkin <date> <HHMM>` → push.
