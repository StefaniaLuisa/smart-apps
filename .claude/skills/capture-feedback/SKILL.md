---
name: capture-feedback
description: Save a piece of positive feedback (Slack message, email, meeting quote) as a permanent, source-linked record for evaluations. Runs standalone or as a sub-procedure of /eod and /digest-meetings.
argument-hint: [link or paste of the feedback]
---

# /capture-feedback — praise, preserved verbatim

Read `apps/assistant/docs/DATA-MODEL.md` §`feedback`.

## 1. Resolve the feedback

- Given a Slack permalink → `mcp__Slack__slack_read_thread` for the exact message and author.
- Given a Gmail link/thread → `mcp__Gmail__get_thread`.
- Given a Fathom moment → quote from the transcript with a timestamped deep link.
- Given pasted text with no link → `kind: manual`, note who said it and where.

## 2. Write the record

`data/feedback/<year>/<date>-<slug>.md`:
- `quote` — **verbatim**, never paraphrased (this is what gets shown at evaluation time).
- `from` — person + org; `client` — resolved slug (or `internal` for colleague praise — that counts too).
- `context` — one line: what the praise was for.
- `sources` — the permalink.

## 3. Finish

Validator → commit `assistant: capture-feedback <slug>` → push (skip commit if called from another skill — the caller commits). If standalone, confirm to Stef in one line.
