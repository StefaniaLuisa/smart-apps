# Stef's Personal Assistant — Architecture

**Goal:** help Stef stay on top of client work in less time, plan her week and day better, and get measurably better at her job — with every piece of information saved, accurate, and linked back to its source.

## 1. Capabilities

| # | Capability | Delivered by |
|---|---|---|
| 1 | **Daily work tracker** — end-of-day capture of wins, deliverables, insights, obstacles, what to improve tomorrow; hours worked and workload over time; evaluation-ready history; blind-spot detection | `/eod`, `/eval-packet`, dashboard History view |
| 2 | **Intraday check-ins** — Slack DMs through the day so nothing is missed: unanswered emails, Slack mentions, upcoming meetings, task changes | `/checkin` (scheduled 3×/day) |
| 3 | **Client intelligence & agendas** — live tasks with status/last comment/next action, what's outstanding or waiting, Stef's tasks, budget hours remaining and burn quality, recommendations (next tasks/projects for the client, how to work with them, how to communicate a given need) | `/brief <client>`, `/agenda <client>`, client profiles |
| 4 | **Meeting performance coaching** — after each recorded client meeting: talk-time balance, engagement, clarity, jargon vs. client level; constructive feedback; longitudinal speaking trends | `/coach`, `metrics/coaching.jsonl`, dashboard Coaching view |
| 5 | **Presentation/communication support** — translate technical jargon into succinct client-friendly language while prepping | jargon-translation pass inside `/agenda` and `/brief` |
| 6 | **Meeting transcript pipeline** — automatically download, organize, digest Fathom transcripts | `/digest-meetings` (scheduled nightly) |
| 7 | **Week/day planning engine** — recommendations on what to move, update, add, or re-estimate | `/plan-week` (scheduled Monday) |
| 8 | **Cowork/chat context** — awareness of what Claude sessions are doing on client projects | `data/context/inbox/` convention (see `integrations/cowork/CONTEXT.md`) |
| 9 | **Positive-feedback capture** — praise from Slack/Gmail/meetings saved verbatim with links | `/capture-feedback` (also runs inside `/eod` and `/digest-meetings`) |

## 2. System pattern

AI-agent powered. There is no server. Claude sessions — scheduled routines and on-demand slash skills — do the collection and synthesis; structured files in this private repo are the database; a tiny static-site generator renders the dashboard; Slack DM is the push channel.

```
                    ┌──────────────────────────────────────────────┐
   MCP connectors   │  Claude session (scheduled routine or skill) │
  Slack ───────────▶│                                              │
  Gmail ───────────▶│  1. read config/ + data/.state cursors       │
  Calendar ────────▶│  2. gather from sources (record gaps)        │──▶ Slack DM
  Drive ───────────▶│  3. synthesize                               │    (check-ins,
  Fathom ──────────▶│  4. write data/ files per DATA-MODEL         │     EOD prompt,
  Rize ────────────▶│  5. append metrics JSONL, update cursor      │     summaries)
  GitHub ──────────▶│  6. git commit + push                        │
                    └──────────────────────────────────────────────┘
  REST (no MCP)                        │
  Productive.io ◀── integrations/      ▼
     productive.mjs          apps/assistant/data/          dashboard/build.mjs
  Cowork sessions ──▶ data/context/inbox/ (convention)  ──▶  static dashboard
```

**Why agent-powered instead of a standalone web app:** the connectors (OAuth to Slack, Gmail, Calendar, Drive, Fathom, Rize) already exist in Stef's Claude environment; the synthesis work (digesting a transcript, judging budget burn, drafting an agenda) is LLM work anyway; and files-in-git gives versioning, portability, and zero infrastructure.

**Data duality:** narrative documents are markdown + YAML frontmatter (the story); longitudinal numbers are *also* appended to `data/metrics/*.jsonl` (the numbers). A six-month talk-time trend is a one-line filter over `coaching.jsonl`, never a parse of 180 markdown files.

## 3. Components

- **Skills** (`.claude/skills/*/SKILL.md`) — nine authoritative procedures; see table below. Skills are prompts, not code: they name the exact MCP tools to call and the exact schemas to write.
- **Data layer** (`data/`) — see `DATA-MODEL.md`. Everything source-linked; everything git-versioned.
- **Config** (`config/`) — `assistant.yml` (owner, timezone, work hours, Slack DM target, cadences, retention) and one `clients/<slug>.yml` per client (matchers that let jobs classify a Slack channel, email, meeting, or Productive project to a client).
- **Integrations** — MCP connectors for Slack/Gmail/Calendar/Drive/Fathom/Rize/GitHub; `integrations/productive/productive.mjs` REST CLI for Productive.io (token via env); `integrations/cowork/CONTEXT.md` convention for session context.
- **Dashboard** (`dashboard/`) — dependency-light Node generator (`yaml` + `marked` only) that renders `data/` into static HTML: Today, History, Clients, Coaching, Evaluation. Run locally; **never** publish (client data).
- **Scheduler** — Claude routines (cron triggers) in Stef's Claude environment, one per recurring job. GitHub Actions is deliberately *not* used: Actions runners have no access to the MCP connectors. Setup in `RUNBOOK.md`.

## 4. Jobs

| Job | Trigger | Inputs | Outputs |
|---|---|---|---|
| `/checkin` | routine 10:30 / 13:30 / 15:30 weekdays | Slack mentions+DMs since cursor, unanswered Gmail threads, Calendar next 3h, Productive task changes, Rize focus so far | Slack DM action list; `data/checkins/…`; cursor update |
| `/eod` | routine 16:45 weekdays sends the DM prompt; Stef replies there or runs `/eod` | Rize hours & allocation, today's Calendar, Slack/Gmail sent activity, Productive activity, today's check-ins, `context/inbox/` | `data/daily/…`; `metrics/hours.jsonl` + `workload.jsonl`; feedback files; Slack confirmation |
| `/digest-meetings` | routine 21:00 daily | Fathom meetings since cursor → summaries + transcripts | `data/meetings/<date-slug>/{meeting,transcript}.md`; queues `/coach` for client meetings |
| `/coach <meeting>` | chained from digest, or on demand | the meeting's transcript + trailing coaching metrics | `coaching.md`; `metrics/coaching.jsonl` |
| `/brief <client>` | on demand + Monday 07:30 for clients with meetings that week | Productive (tasks, comments, budgets), Slack channels, Gmail, last meeting record, client profile | `data/clients/<slug>/briefs/<date>.md`; profile learnings updated |
| `/agenda <client>` | on demand, usually after `/brief` | latest brief, last meeting's outstanding items, upcoming Calendar event | `data/clients/<slug>/agendas/<date>.md` (recap → outstanding → decisions → new topics), jargon-translated |
| `/plan-week` | routine Monday 08:00 | prior week's dailies + check-ins, Productive due/overdue, Calendar week ahead, budgets, `context/inbox/` | `data/weekly/…` rollup; `data/planning/…` move/update/add/re-estimate recommendations; Slack DM summary |
| `/capture-feedback` | sub-procedure of `/eod` & `/digest-meetings`; also standalone | a praise signal (Slack message, email, transcript quote) | `data/feedback/…` with verbatim quote + source |
| `/eval-packet [period]` | on demand | `data/**` only — no live calls | `data/evaluation/<period>.md` showcase: quantified wins, hours, feedback quotes, coaching growth, headwinds |

Common skill contract (enforced by each SKILL.md): read config + cursor → check each source's availability (missing → `gaps:`, continue) → write per DATA-MODEL → append metrics → update cursor → commit+push → DM if a notifying job.

## 5. Accuracy & links

- Canonical source object `{label, url, kind}` on every claim (see DATA-MODEL.md §1).
- Jobs only report what a source actually returned; anything unavailable is listed in `gaps:` — so a daily log reading "no Productive data (token not configured)" is correct behavior, and a fabricated task list is a bug.
- `scripts/validate-data.mjs` lints every data file's frontmatter against the schemas.

## 6. Security & privacy

- Private repo; `data/` holds client-confidential material (transcripts, emails, budgets).
- **Never** enable GitHub Pages or any public artifact from this repo.
- Secrets only in env vars / gitignored `.env` (`integrations/productive/.env.example` documents the two Productive variables).
- Transcript retention: digests (`meeting.md`) are kept forever; raw `transcript.md` files may be purged after `transcripts.retention_days` (default 90, in `config/assistant.yml`).

## 7. Risks & open questions

| Risk | Status / mitigation |
|---|---|
| Client confidentiality in git | Private repo + no-publish rule + transcript retention policy. Revisit if repo access ever widens. |
| Productive.io token | Needs token + org id from Stef (RUNBOOK §2). Read scopes and pagination behavior on large projects unverified until first run. |
| Fathom limits | History depth, rate limits, and diarization quality (talk-time math is only as good as speaker attribution) unverified until first `/digest-meetings` run. |
| Cowork context | Convention-based and unenforceable; sessions may forget to write the inbox note. Fallback: `/plan-week` scans Stef's recent GitHub commits/PRs. |
| Scheduling | Routines are timezone/DST-sensitive; confirm `config/assistant.yml` timezone. Each routine gets one supervised dry run before being trusted headless (Slack DM permissions in headless runs, connector auth expiry). |
| Rize attribution | Per-client hours depend on Stef's Rize projects mapping onto `config/clients/*.yml`; align names during setup. |

## 8. Roadmap

- **Phase 1 (this build):** data layer, docs, all nine skills authored, Productive CLI, dashboard, validator. `/eod` usable immediately.
- **Phase 2:** supervised dry runs of each scheduled job → create the four routines; fill in real `config/clients/*.yml`; first briefs and agendas in anger.
- **Phase 3:** coaching trendlines once ~10 meetings are digested; evaluation packet for the next review cycle; tune check-in signal/noise.
- **Later:** notes-tool integration (adapter slot in the data model's `kind` enum via `manual`/`drive` today), richer dashboard interactivity, possible mobile-friendly digest email.
