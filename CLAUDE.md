# smart-apps

Multi-app repo of personal productivity tools for Stef (stef@4sitestudios.com). App #1 is **Stef's Personal Assistant** at `apps/assistant/` — read `apps/assistant/CLAUDE.md` before touching anything under that path.

## Repo conventions

- Each app lives under `apps/<name>/` with its own `CLAUDE.md`, `docs/`, and (if needed) `package.json`.
- Skills (slash commands) live at the repo root in `.claude/skills/` so Claude Code discovers them; skills belonging to the assistant are documented in `apps/assistant/docs/ARCHITECTURE.md`.
- Secrets are never committed. API tokens go in environment variables or a gitignored `.env` (see `apps/assistant/integrations/productive/.env.example`).
- This is a private repo containing client-related data under `apps/assistant/data/`. Never publish it (no public GitHub Pages, no public artifacts containing its contents).

## Cowork context convention (applies to EVERY Claude session in this repo/environment)

If you are a Claude session doing client work (any client project task, in any repo or app), append a short context note before your session ends so the assistant can include it in briefs and weekly planning:

Create a file `apps/assistant/data/context/inbox/YYYY-MM-DD-HHMM-<slug>.md`:

```markdown
---
date: <YYYY-MM-DD>
client: <client-slug or "internal">
---
what: <one line — what was worked on>
state: <one line — where it stands / what's next>
links: <PRs, docs, tasks touched>
```

Then commit it with your other changes. If you can't determine the client, use `internal`.
