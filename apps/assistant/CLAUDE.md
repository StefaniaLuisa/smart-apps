# Stef's Personal Assistant — agent contract

You are operating inside Stef's Personal Assistant. Read `docs/DATA-MODEL.md` before writing any file under `data/`.

## Non-negotiable rules

1. **No claim without a source.** Every win, task status, quote, budget number, or recommendation you write must carry a working link (Slack permalink, Productive task URL, Fathom recording, Gmail thread, Drive doc, Calendar event). Use the canonical source object from DATA-MODEL.md. If something has no link (e.g. Stef told you verbally), use `kind: manual`.
2. **Graceful degradation, never silent omission.** If a source is unavailable (no Productive token, connector down), record it in the document's `gaps:` frontmatter list and keep going. Never fabricate data to fill a gap; never fail the whole job because one source is missing.
3. **Schemas are law.** Frontmatter must match `docs/DATA-MODEL.md`. Run `node scripts/validate-data.mjs` after writing data files.
4. **Metrics duality.** Any skill that produces numbers (hours, talk-time, workload) writes them BOTH in the document frontmatter AND as an append-only line in `data/metrics/*.jsonl`. Never rewrite or reorder existing JSONL lines.
5. **Commit discipline.** Data-writing skills end with: `git add` (scoped to the files touched) → commit message `assistant: <skill> <date/subject>` → `git push -u origin <current branch>`. Never commit `.env` or anything matching `.gitignore`.
6. **Privacy.** `data/` contains client-confidential material. Never copy its contents into public artifacts, public repos, public Pages, or external services beyond the connected ones. Transcript retention policy lives in `config/assistant.yml`.
7. **Cursors.** Recurring jobs (`/checkin`, `/digest-meetings`, `/plan-week`) read and update their cursor in `data/.state/last-run.json` so re-runs never double-report.

## Layout

- `config/` — `assistant.yml` (owner, timezone, cadences) and `clients/<slug>.yml` (per-client matchers: Productive project ids, Slack channels, email domains, Fathom title/attendee matchers, goals).
- `data/` — all assistant records; see DATA-MODEL.md.
- `integrations/productive/` — Node CLI for Productive.io (`node productive.mjs --help`). Reads `PRODUCTIVE_API_TOKEN` + `PRODUCTIVE_ORG_ID` from env or a local gitignored `.env`.
- `integrations/cowork/CONTEXT.md` — how other Claude sessions feed context into `data/context/inbox/`.
- `dashboard/` — static-site generator (`npm run build` from `apps/assistant/`).
- Skills live at repo root `.claude/skills/`; each SKILL.md is the authoritative procedure for its job.

## Client resolution

To map a Slack channel / email / meeting / Productive project to a client, load all `config/clients/*.yml` and match on the matcher fields. If nothing matches, use `client: unknown` and note it in `gaps:` rather than guessing.
