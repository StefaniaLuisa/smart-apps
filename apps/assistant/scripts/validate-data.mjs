#!/usr/bin/env node
// Lints apps/assistant/data/ against docs/DATA-MODEL.md. Exit 1 on any error.

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

const DATA = join(dirname(fileURLToPath(import.meta.url)), "..", "data");
const KINDS = ["slack", "gmail", "calendar", "productive", "fathom", "drive", "rize", "github", "cowork", "manual"];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// required frontmatter fields per document type
const REQUIRED = {
  daily: ["date", "hours_worked", "wins", "sources"],
  checkin: ["date", "time", "items", "sources"],
  weekly: ["week", "hours_total", "sources"],
  meeting: ["date", "client", "title", "fathom_url", "action_items", "sources"],
  coaching: ["date", "meeting_ref", "metrics", "scores", "sources"],
  "client-profile": ["slug", "name", "sources"],
  brief: ["client", "date", "budget", "tasks", "sources"],
  agenda: ["client", "date", "brief_ref", "sources"],
  feedback: ["date", "from", "client", "channel_kind", "quote", "sources"],
  plan: ["week", "moves", "sources"],
  "plan-day": ["date", "moves", "sources"],
  evaluation: ["period", "generated", "totals", "sources"],
  context: ["date", "client"],
};

const errors = [];
const err = (file, msg) => errors.push(`${relative(process.cwd(), file)}: ${msg}`);

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else yield p;
  }
}

function checkSources(file, sources) {
  if (!Array.isArray(sources)) return err(file, "`sources` must be a list");
  for (const s of sources) {
    if (typeof s !== "object" || s === null) { err(file, "source entries must be objects"); continue; }
    if (!s.kind || !KINDS.includes(s.kind)) err(file, `source kind "${s.kind}" not in [${KINDS.join(", ")}]`);
    if (s.kind !== "manual" && !s.url) err(file, `source "${s.label ?? "?"}" (${s.kind}) has no url`);
  }
}

function checkDoc(file) {
  const raw = readFileSync(file, "utf8");
  const m = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return err(file, "missing YAML frontmatter");
  let fm;
  try { fm = YAML.parse(m[1]) ?? {}; } catch (e) { return err(file, `frontmatter parse error: ${e.message}`); }

  // context-inbox notes have no `type`; infer from path
  const isContext = /data[\/\\]context[\/\\]/.test(file);
  const type = fm.type ?? (isContext ? "context" : undefined);
  if (!type || !REQUIRED[type]) return err(file, `unknown or missing type: "${fm.type}"`);

  for (const field of REQUIRED[type]) {
    if (fm[field] === undefined || fm[field] === null) err(file, `[${type}] missing required field: ${field}`);
  }
  const dateVal = fm.date ?? fm.generated;
  if (dateVal !== undefined && !ISO_DATE.test(String(dateVal))) err(file, `date "${dateVal}" is not YYYY-MM-DD`);
  if (fm.week !== undefined && !/^\d{4}-W\d{2}$/.test(String(fm.week))) err(file, `week "${fm.week}" is not YYYY-Wnn`);
  if (fm.sources !== undefined) checkSources(file, fm.sources);
  if (fm.gaps !== undefined && !Array.isArray(fm.gaps)) err(file, "`gaps` must be a list");
}

function checkJsonl(file) {
  readFileSync(file, "utf8").split("\n").forEach((line, i) => {
    if (!line.trim()) return;
    let row;
    try { row = JSON.parse(line); } catch { return err(file, `line ${i + 1}: invalid JSON`); }
    if (!row.date || !ISO_DATE.test(row.date)) err(file, `line ${i + 1}: bad/missing date`);
    if (!row.metric) err(file, `line ${i + 1}: missing metric`);
    if (typeof row.value !== "number") err(file, `line ${i + 1}: value must be a number`);
  });
}

let mdCount = 0, jsonlCount = 0;
for (const p of walk(DATA)) {
  const name = p.split(/[\/\\]/).pop();
  if (name === ".gitkeep" || name === "transcript.md") continue;
  if (p.includes(`${join("data", ".state")}`) || /[\/\\]\.state[\/\\]/.test(p)) {
    if (name.endsWith(".json")) { try { JSON.parse(readFileSync(p, "utf8")); } catch { err(p, "invalid JSON"); } }
    continue;
  }
  if (p.endsWith(".md")) { mdCount++; checkDoc(p); }
  else if (p.endsWith(".jsonl")) { jsonlCount++; checkJsonl(p); }
}

if (!existsSync(DATA)) { console.error("no data/ directory"); process.exit(1); }
console.log(`checked ${mdCount} markdown docs, ${jsonlCount} jsonl files`);
if (errors.length) {
  console.error(`\n${errors.length} error(s):`);
  for (const e of errors) console.error("  ✗ " + e);
  process.exit(1);
}
console.log("all valid ✓");
