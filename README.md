# smart-apps

Apps that help me make my work goals.

## Apps

| App | What it does | Docs |
|---|---|---|
| [`apps/assistant`](apps/assistant/) | **Stef's Personal Assistant** — daily work tracking, intraday Slack check-ins, client briefs & agendas, Fathom meeting digestion, post-meeting speaking coaching, weekly planning, and an evaluation-packet builder. AI-agent powered: Claude collects from Slack/Gmail/Calendar/Drive/Fathom/Rize/Productive.io and writes source-linked records here. | [Architecture](apps/assistant/docs/ARCHITECTURE.md) · [Data model](apps/assistant/docs/DATA-MODEL.md) · [Runbook](apps/assistant/docs/RUNBOOK.md) |

## Quick start (assistant)

```bash
cd apps/assistant
npm install
npm run build     # generates the dashboard into dashboard/dist/
npx serve dashboard/dist
```

Day-to-day you don't run code — you talk to Claude:

- `/eod` — end-of-day log (wins, insights, hours, feedback)
- `/checkin` — "what am I missing right now?" sweep across Slack/Gmail/Calendar/tasks
- `/brief <client>` — full client brief: tasks, statuses, budget, recommendations
- `/agenda <client>` — draft the next client meeting agenda
- `/coach <meeting>` — speaking/performance feedback from a Fathom recording
- `/digest-meetings` — pull + digest new Fathom meetings
- `/plan-week` — weekly rollup + planning recommendations
- `/eval-packet [period]` — compile your evaluation showcase

See the [Runbook](apps/assistant/docs/RUNBOOK.md) for one-time setup (Productive.io token, scheduled routines).
