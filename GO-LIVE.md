# Go-Live checklist — Stef's Personal Assistant

This is the one-time setup to take the assistant from "built" to "running on its own."
Work top to bottom. Nothing here is urgent — the app works on demand (you can run
`/eod`, `/brief <client>`, etc. any time) even before the scheduled routines are on.

Plain-language note: you don't need to be a developer for any of this. The terminal
steps are copy-paste. If a line ever prints red text, paste it back to Claude and ask.

---

## 1. Get the code onto GitHub and into `main`

The automated routines always read the **main** branch, so the app has to live there.

1. Download the latest bundle Claude sent you (`assistant-latest.bundle`) — it lands in
   your Downloads folder. (A "bundle" is just a file that carries the work; you can
   delete it afterward.)
2. Open the project in a terminal. In Zed: **Terminal → New Terminal**.
3. Paste this block and press Enter:

   ```bash
   cd /Users/stefjones/claude-code/worker-smarter-not-harder
   git fetch ~/Downloads/assistant-latest.bundle claude/work-tracker-architecture-j4xfsk:claude/work-tracker-architecture-j4xfsk
   git checkout claude/work-tracker-architecture-j4xfsk
   git push origin claude/work-tracker-architecture-j4xfsk
   git checkout main
   git merge claude/work-tracker-architecture-j4xfsk
   git push origin main
   ```

   What it does, line by line: go to your project folder → pull the work in from the
   bundle → switch onto it → upload it to GitHub → switch to your main branch → combine
   the work into main → upload main. The final push is what makes the routines able to
   see the app.

**Optional but recommended:** grant the Claude GitHub app **write** access to
`smart-apps` (GitHub.com → Settings → Integrations → Applications → Claude). After that,
Claude can push directly and this bundle step goes away for good — the routines can also
commit their own logs back to the repo.

---

## 2. Add the environment details (on claude.ai)

In the Claude Code **environment settings** for this project:

- **Environment variables** (so client briefs pull real tasks and budgets):
  - `PRODUCTIVE_API_TOKEN` — from Productive → Settings → API integrations → Generate token
  - `PRODUCTIVE_ORG_ID` — shown next to the token (Stef's org is `2650`)
  - `PRODUCTIVE_OWNER_EMAIL` — `stef@4sitestudios.com` (lets `my-tasks` resolve "me")
- **Connectors authorized on the environment:** Slack, Gmail, Google Calendar,
  Google Drive, Fathom, Rize, GitHub.
- **Network egress — add this host to the allowlist:** `api.productive.io`.
  The environment blocks outbound calls by default; without this host allowed, every
  Productive call fails with `403 — Host not in allowlist: api.productive.io` (the token
  is fine, the network just isn't). GitHub and npm are already reachable. If the policy
  offers "allow all outbound HTTPS" instead of a per-host allowlist, that works too.
- **Setup script (optional):** `cd apps/assistant && npm install` — so the dashboard's
  two dependencies are ready in any fresh session.

Then test the Productive connection from a terminal:
```bash
node apps/assistant/integrations/productive/productive.mjs projects
```
It should list your projects. `{"status":"not_configured"}` means the token isn't set yet
(the app treats that as a recorded gap, not an error). Once it works, add each client's
Productive project id to their `apps/assistant/config/clients/<slug>.yml`.

---

## 3. Turn on the scheduled routines

Five routines are already created (correct names, times, and instructions) but **paused**.
They must be finished in the **claude.ai Routines screen** so your connectors attach —
routines created any other way run without access to Slack/Gmail/Rize/etc.

For each `assistant-*` routine: open it → confirm **Slack, Gmail, Calendar, Drive, Fathom,
Rize** are attached → do one **test run** and check the Slack message looks right →
**enable** it.

| Routine | When (Central) | What it does |
|---|---|---|
| `assistant-checkin` | 8:30, 10:30, 1:30, 3:30 — weekdays | "What am I missing?" sweep → Slack DM if actionable |
| `assistant-eod` | 4:45pm weekdays | End-of-day log + 3 questions |
| `assistant-digest-meetings` | 4:00pm daily | Pull + digest Fathom meetings, coach client ones |
| `assistant-plan-day` | 8:00am daily | What to move / update / add / re-estimate today |
| `assistant-week-review` | Mondays 6:00am | Prior-week retrospective: wins (linked), misses, watch-items |

Schedules are Central time. Cron values live in `apps/assistant/docs/RUNBOOK.md`; when
daylight saving ends in November, shift each one hour later (or ask Claude to).

---

## 4. First-week shakedown

- Run `/eod` yourself each evening for a few days before trusting the routine — it's the
  fastest way to confirm the Slack/Rize/Calendar flow end to end.
- After your next recorded client call, run `/digest-meetings` then `/coach latest` to see
  the meeting digest and speaking feedback.
- **Rize hint:** your entries come in as AI *suggestions* tagged to "4Site Studios."
  Approve/re-tag them in Rize so per-client hours attribute correctly — the assistant can
  only report the client split as accurately as Rize holds it.
- Build the dashboard any time: `cd apps/assistant && npm run build && npx serve dashboard/dist`

---

## Where things live (quick map)

| Thing | Path |
|---|---|
| What each command does | `.claude/skills/<name>/SKILL.md` |
| Architecture & design | `apps/assistant/docs/ARCHITECTURE.md` |
| Data formats | `apps/assistant/docs/DATA-MODEL.md` |
| Setup & operations detail | `apps/assistant/docs/RUNBOOK.md` |
| Your logs, briefs, meetings | `apps/assistant/data/` |
| Client settings | `apps/assistant/config/clients/<slug>.yml` |
| Global settings (timezone, Slack handle) | `apps/assistant/config/assistant.yml` |
| Productive.io connection | `apps/assistant/integrations/productive/` |

**Privacy:** `apps/assistant/data/` holds client-confidential material. Keep the repo
private and never enable public GitHub Pages or publish the dashboard.
