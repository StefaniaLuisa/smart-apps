#!/usr/bin/env node
// Productive.io API v2 client (JSON:API) — zero dependencies.
// Auth: PRODUCTIVE_API_TOKEN + PRODUCTIVE_ORG_ID from the environment or a
// gitignored .env next to this file. Without them, every command prints
// {"status":"not_configured"} and exits 0 so callers can degrade gracefully.

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const API = "https://api.productive.io/api/v2";
const HERE = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const envPath = join(HERE, ".env");
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
  return { token: process.env.PRODUCTIVE_API_TOKEN, org: process.env.PRODUCTIVE_ORG_ID };
}

function out(obj) {
  console.log(JSON.stringify(obj, null, 2));
}

// Flatten a JSON:API resource: id + type + attributes + relationship ids.
function flatten(resource) {
  const flat = { id: resource.id, type: resource.type, ...resource.attributes };
  for (const [name, rel] of Object.entries(resource.relationships ?? {})) {
    const d = rel.data;
    if (d) flat[`${name}_id`] = Array.isArray(d) ? d.map((x) => x.id) : d.id;
  }
  return flat;
}

async function get(auth, path, params = {}, { paginate = true } = {}) {
  const items = [];
  let page = 1;
  const MAX_PAGES = 10;
  while (page <= MAX_PAGES) {
    const url = new URL(`${API}/${path}`);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
    url.searchParams.set("page[number]", String(page));
    url.searchParams.set("page[size]", "100");
    const res = await fetch(url, {
      headers: {
        "X-Auth-Token": auth.token,
        "X-Organization-Id": auth.org,
        "Content-Type": "application/vnd.api+json",
      },
    });
    if (!res.ok) {
      const body = await res.text();
      out({ status: "error", http: res.status, path, detail: body.slice(0, 500) });
      process.exit(1);
    }
    const json = await res.json();
    const data = Array.isArray(json.data) ? json.data : [json.data];
    items.push(...data.map(flatten));
    const total = json.meta?.total_pages ?? 1;
    if (!paginate || page >= total || !Array.isArray(json.data)) break;
    page += 1;
  }
  return items;
}

function arg(flag) {
  const i = process.argv.indexOf(flag);
  return i > -1 ? process.argv[i + 1] : undefined;
}

const HELP = `Productive.io client — usage:
  node productive.mjs projects                         list active projects
  node productive.mjs tasks --project <id>             open tasks in a project
       [--changed-since <ISO date>]                    only tasks updated since
  node productive.mjs my-tasks [--changed-since <ISO>] open tasks assigned to me
  node productive.mjs task <id>                        one task, full detail
  node productive.mjs comments --task <id>             comments on a task (newest first)
  node productive.mjs budgets --project <id>           budgets for a project
  node productive.mjs time --project <id> [--after <ISO date>]   time entries
  node productive.mjs raw <path> [key=value ...]       any GET, e.g. raw tasks filter[project_id]=1

Env: PRODUCTIVE_API_TOKEN, PRODUCTIVE_ORG_ID (or .env beside this script).
Output: JSON to stdout. Not configured => {"status":"not_configured"} exit 0.`;

async function main() {
  const cmd = process.argv[2];
  if (!cmd || cmd === "--help" || cmd === "-h") {
    console.log(HELP);
    return;
  }
  const auth = loadEnv();
  if (!auth.token || !auth.org) {
    out({
      status: "not_configured",
      hint: "Set PRODUCTIVE_API_TOKEN and PRODUCTIVE_ORG_ID (see .env.example and docs/RUNBOOK.md §2).",
    });
    return;
  }

  switch (cmd) {
    case "projects":
      out(await get(auth, "projects", { "filter[status]": "1" }));
      break;
    case "tasks": {
      const params = { "filter[project_id]": req("--project"), "filter[status]": "1" };
      const since = arg("--changed-since");
      if (since) params["filter[updated_at][gt_eq]"] = since;
      out(await get(auth, "tasks", params));
      break;
    }
    case "my-tasks": {
      const me = await get(auth, "organization_memberships", {}, { paginate: false });
      const personId = me[0]?.person_id;
      const params = { "filter[assignee_id]": personId, "filter[status]": "1" };
      const since = arg("--changed-since");
      if (since) params["filter[updated_at][gt_eq]"] = since;
      out(await get(auth, "tasks", params));
      break;
    }
    case "task":
      out(await get(auth, `tasks/${process.argv[3]}`, {}, { paginate: false }));
      break;
    case "comments":
      out(await get(auth, "comments", { "filter[task_id]": req("--task"), sort: "-created_at" }));
      break;
    case "budgets":
      out(await get(auth, "budgets", { "filter[project_id]": req("--project") }));
      break;
    case "time": {
      const params = { "filter[project_id]": req("--project") };
      const after = arg("--after");
      if (after) params["filter[after]"] = after;
      out(await get(auth, "time_entries", params));
      break;
    }
    case "raw": {
      const path = process.argv[3];
      const params = Object.fromEntries(
        process.argv.slice(4).filter((a) => a.includes("=")).map((a) => a.split(/=(.*)/s).slice(0, 2))
      );
      out(await get(auth, path, params));
      break;
    }
    default:
      console.log(HELP);
      process.exit(1);
  }

  function req(flag) {
    const v = arg(flag);
    if (!v) {
      console.error(`Missing required ${flag}. See --help.`);
      process.exit(1);
    }
    return v;
  }
}

main().catch((err) => {
  out({ status: "error", detail: String(err) });
  process.exit(1);
});
