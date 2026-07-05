# Productive.io API cheatsheet (for skills)

Client: `node apps/assistant/integrations/productive/productive.mjs <command>` — run `--help` for commands. All output is JSON on stdout. `{"status":"not_configured"}` (exit 0) means no token: record a `gap` and move on. `{"status":"error", ...}` (exit 1) means a real failure: report it, don't fabricate.

## Command → question it answers

| Command | Question |
|---|---|
| `projects` | What projects exist / what's the project id for client X? |
| `tasks --project <id>` | Every open task: title, status, assignee, due date, description |
| `tasks --project <id> --changed-since <ISO>` | What changed since the cursor? (check-ins) |
| `my-tasks` | Stef's open tasks across all projects |
| `task <id>` | Full detail on one task |
| `comments --task <id>` | Last comment / who's waiting on whom (newest first) |
| `budgets --project <id>` | Hours budgeted vs. used vs. remaining |
| `time --project <id> --after <date>` | Time entries — which tasks are consuming budget |
| `raw <path> key=value ...` | Anything else (JSON:API GET) |

## Notes & caveats (verify on first configured run)

- API is JSON:API; the client flattens `attributes` and turns relationships into `*_id` fields. Task URLs for humans: `https://app.productive.io/<org_id>/tasks/<task_id>` — build these for `sources`, don't link the API.
- `filter[status]=1` = open tasks (2 = closed).
- **Unverified until first real run:** exact filter syntax for `updated_at`/`after`, the `budgets` endpoint shape (budgets may live on deals/services in some org configurations), and `organization_memberships` as the way to resolve "me". If a command errors, use `raw` to probe (`raw tasks filter[project_id]=<id> per_page=1`) and update this file + the client with what you learn.
- Rate limits: unpublished but real; the client caps pagination at 10×100 per call. Prefer `--changed-since` filters over full pulls.
