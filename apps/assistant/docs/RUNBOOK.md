# Runbook — setup & operations

## 1. First-time checklist

1. Confirm `config/assistant.yml` — especially `timezone` and `slack.dm_target`.
2. Create one `config/clients/<slug>.yml` per active client (copy `_template.yml`). The matcher fields are what let scheduled jobs classify meetings, channels, and emails, so fill them as completely as you can.
3. Set up the Productive.io token (§2).
4. Run `/eod` once interactively tonight — it works immediately with the connectors already in your Claude environment (Rize, Calendar, Slack, Gmail) and will simply record a `gap` for anything not yet configured.
5. After a few days of manual use, do one supervised dry run of each scheduled job (§3), then create the routines.

## 2. Productive.io token

Productive.io has no Claude connector, so the assistant uses a small REST client at `integrations/productive/productive.mjs`.

1. In Productive: **Settings → API integrations → Generate new token** (read-only if offered).
2. Note your **organization ID** (shown alongside the token, also visible in the Productive URL).
3. Provide both to the assistant either way:
   - **Claude environment variables** (preferred for scheduled runs): set `PRODUCTIVE_API_TOKEN`, `PRODUCTIVE_ORG_ID`, and `PRODUCTIVE_OWNER_EMAIL` in your Claude Code environment settings.
   - **Local `.env`**: copy `integrations/productive/.env.example` to `.env` in the same folder (gitignored) and fill it in.
4. **Allowlist the Productive host in the environment's network egress:** `api.productive.io`. The environment blocks outbound calls by default; without this, every Productive call returns `403 — Host not in allowlist: api.productive.io` even with a valid token.
5. Test: `node integrations/productive/productive.mjs projects` → should list your projects. Without a token it prints `{"status":"not_configured", …}` and exits 0 — skills treat that as a `gap`, never a failure. A `403 … not in allowlist` means step 4 isn't done yet.
5. Add each client's Productive project ids to their `config/clients/<slug>.yml`.

## 3. Scheduled routines

Recurring jobs run as **Claude routines** (cron triggers) in this environment — *not* GitHub Actions, which can't reach the connectors. Create them from any Claude session by asking:

> "Create a routine named `assistant-checkin` that runs at 10:30, 13:30 and 15:30 on weekdays, starting a fresh session in this environment with the prompt: `Run /checkin`."

Recommended set (times are in your `config/assistant.yml` timezone — routines are UTC-based, so recompute after DST changes or ask Claude to):

| Routine | Schedule (America/Chicago) | Cron (UTC, CDT/UTC−5) | Prompt |
|---|---|---|---|
| `assistant-checkin` | 08:30, 10:30, 13:30, 15:30 Mon–Fri | `30 13,15,18,20 * * 1-5` | `Run /checkin` |
| `assistant-eod` | 16:45 Mon–Fri | `45 21 * * 1-5` | `Run /eod` |
| `assistant-digest-meetings` | 16:00 daily | `0 21 * * *` | `Run /digest-meetings` |
| `assistant-plan-day` | 08:00 daily | `0 13 * * *` | `Run /plan-day` |
| `assistant-week-review` | 06:00 Monday | `0 11 * * 1` | `Run /week-review` |

Note: cron times are **UTC** and the table's UTC column assumes Central Daylight Time (UTC−5, roughly Mar–Nov). When the US falls back to Standard Time (UTC−6), add one hour to each UTC value (e.g. checkin becomes `30 14,16,19,21 * * 1-5`) or ask Claude to recompute. The routines are created disabled; enable them only after a supervised dry run of each.

**Supervised dry run first:** before trusting a routine headless, run its skill once in an interactive session and confirm it can (a) reach every connector, (b) send the Slack DM, (c) commit and push. Headless sessions inherit the environment's permissions — if a dry run hits a permission prompt, add the needed rule to `.claude/settings.json` first.

## 4. Dashboard

```bash
cd apps/assistant
npm install        # once
npm run build      # reads data/ → writes dashboard/dist/
npx serve dashboard/dist
```

Views: **Today** (latest daily log, open loops, gaps), **History** (hours/wins over time), **Clients** (profile + latest brief + budget per client), **Coaching** (talk-time & score trends), **Evaluation** (generated packets). Rebuild any time; it's stateless.

**Never publish `dashboard/dist/`** — it renders client-confidential data. No GitHub Pages, no public hosting.

## 5. Data hygiene

- Validate after manual edits: `npm run validate` (wraps `scripts/validate-data.mjs`).
- Raw transcripts (`data/meetings/**/transcript.md`) may be deleted after `transcripts.retention_days` (config, default 90); digests stay forever. Ask Claude to "purge expired transcripts" — it will check dates against the policy before deleting.
- Example/seed records are marked `example: true` (frontmatter) or `"example": true` (JSONL) — delete them once real data exists: ask Claude to "remove the assistant's example seed data".
- Everything is git — a bad write is always recoverable via history.

## 6. Troubleshooting

| Symptom | Fix |
|---|---|
| Skill reports `gap: productive` | Token/org id missing or wrong — §2 step 4 to test. |
| Routine ran but no Slack DM | Check the routine's session log; usually a permission prompt in headless mode. Re-run supervised, then allowlist. |
| Dashboard empty | `npm run build` output lists files parsed; check data files pass `npm run validate`. |
| Double-reported check-in items | Cursor didn't advance — inspect `data/.state/last-run.json`; it must be committed by each run. |
| Wrong client on a meeting | Improve `fathom_matchers` / attendee domains in that client's config file; re-run `/digest-meetings` for that meeting. |
