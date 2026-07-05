#!/usr/bin/env node
// Static dashboard generator: reads apps/assistant/data/ → writes dashboard/dist/.
// Deps: yaml (frontmatter), marked (markdown bodies). Charts are inline SVG,
// single-series blue per the dataviz conventions (thin marks, rounded data-ends,
// hover tooltips via the data-tip layer in base.html).

import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";
import { marked } from "marked";

const HERE = dirname(fileURLToPath(import.meta.url));
const APP = join(HERE, "..");
const DATA = join(APP, "data");
const DIST = join(HERE, "dist");
const TPL = readFileSync(join(HERE, "templates", "base.html"), "utf8");

// ---------- collection ----------

function* walk(dir) {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else yield p;
  }
}

function parseDoc(path) {
  const raw = readFileSync(path, "utf8");
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return null;
  try {
    return { path, fm: YAML.parse(m[1]) ?? {}, body: m[2] };
  } catch {
    return null;
  }
}

function collectDocs(type, dir) {
  const docs = [];
  for (const p of walk(join(DATA, dir))) {
    if (!p.endsWith(".md") || p.endsWith("transcript.md")) continue;
    const doc = parseDoc(p);
    if (doc && doc.fm.type === type) docs.push(doc);
  }
  docs.sort((a, b) => String(a.fm.date ?? a.path).localeCompare(String(b.fm.date ?? b.path)));
  return docs;
}

function readJsonl(name) {
  const p = join(DATA, "metrics", name);
  if (!existsSync(p)) return [];
  return readFileSync(p, "utf8")
    .split("\n")
    .filter((l) => l.trim())
    .map((l) => { try { return JSON.parse(l); } catch { return null; } })
    .filter(Boolean);
}

// ---------- html helpers ----------

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const md = (s) => marked.parse(s ?? "");

const PAGES = [
  ["index.html", "Today"],
  ["history.html", "History"],
  ["clients.html", "Clients"],
  ["coaching.html", "Coaching"],
  ["evaluation.html", "Evaluation"],
];

function page(file, title, content) {
  const nav = PAGES.map(([f, t]) => `<a href="${f}"${f === file ? ' class="active"' : ""}>${t}</a>`).join("");
  const html = TPL.replace("{{title}}", esc(title))
    .replace("{{nav}}", nav)
    .replace("{{content}}", content)
    .replace("{{generated}}", new Date().toISOString().slice(0, 16).replace("T", " "));
  writeFileSync(join(DIST, file), html);
  console.log(`  wrote ${file}`);
}

const tiles = (items) =>
  `<div class="tiles">${items.map(([v, l]) => `<div class="tile"><div class="v">${esc(v)}</div><div class="l">${esc(l)}</div></div>`).join("")}</div>`;

const sourceLinks = (sources = []) =>
  sources.filter((s) => s?.url).map((s) => `<a href="${esc(s.url)}">${esc(s.label ?? s.kind)}</a>`).join(" · ");

const gapsNote = (gaps = []) => (gaps.length ? `<p class="gap">Gaps: ${esc(gaps.join("; "))}</p>` : "");

// ---------- charts (single series; selective labels: latest + max only) ----------

function barChart(points, { unit = "", height = 150 } = {}) {
  if (!points.length) return `<p class="empty">No data yet.</p>`;
  const W = 720, PAD = { t: 14, r: 8, b: 22, l: 8 };
  const iw = W - PAD.l - PAD.r, ih = height - PAD.t - PAD.b;
  const max = Math.max(...points.map((p) => p.value), 1);
  const slot = iw / points.length;
  const bw = Math.min(26, Math.max(6, slot * 0.55));
  const maxI = points.findIndex((p) => p.value === Math.max(...points.map((q) => q.value)));
  let bars = "";
  points.forEach((p, i) => {
    const h = Math.max(2, (p.value / max) * ih);
    const x = PAD.l + i * slot + (slot - bw) / 2;
    const y = PAD.t + ih - h;
    // rounded data-end (top) only, anchored to the baseline
    bars += `<path class="bar" data-tip="${esc(p.tip ?? `${p.label}: ${p.value}${unit}`)}" d="M${x},${y + h} L${x},${y + 4} Q${x},${y} ${x + 4},${y} L${x + bw - 4},${y} Q${x + bw},${y} ${x + bw},${y + 4} L${x + bw},${y + h} Z"/>`;
    if (i === points.length - 1 || i === maxI)
      bars += `<text class="value-label" x="${x + bw / 2}" y="${y - 4}" text-anchor="middle">${esc(p.value)}${esc(unit)}</text>`;
    if (points.length <= 14 || i % Math.ceil(points.length / 10) === 0)
      bars += `<text class="axis-label" x="${x + bw / 2}" y="${height - 6}" text-anchor="middle">${esc(p.label)}</text>`;
  });
  return `<div class="chart"><svg viewBox="0 0 ${W} ${height}" role="img">
<line class="baseline" x1="${PAD.l}" y1="${PAD.t + ih}" x2="${W - PAD.r}" y2="${PAD.t + ih}"/>${bars}</svg></div>`;
}

function lineChart(points, { unit = "", height = 150, domain } = {}) {
  if (!points.length) return `<p class="empty">No data yet.</p>`;
  const W = 720, PAD = { t: 16, r: 30, b: 22, l: 30 };
  const iw = W - PAD.l - PAD.r, ih = height - PAD.t - PAD.b;
  const values = points.map((p) => p.value);
  const [lo, hi] = domain ?? [Math.min(...values, 0), Math.max(...values, 1)];
  const x = (i) => PAD.l + (points.length === 1 ? iw / 2 : (i / (points.length - 1)) * iw);
  const y = (v) => PAD.t + ih - ((v - lo) / (hi - lo || 1)) * ih;
  const d = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  let marks = `<path class="line" d="${d}"/>`;
  points.forEach((p, i) => {
    marks += `<circle class="dot" cx="${x(i).toFixed(1)}" cy="${y(p.value).toFixed(1)}" r="4.5" data-tip="${esc(p.tip ?? `${p.label}: ${p.value}${unit}`)}"/>`;
    const anchor = i === 0 ? "start" : i === points.length - 1 ? "end" : "middle";
    const ax = i === 0 ? PAD.l - 22 : i === points.length - 1 ? x(i) + 22 : x(i);
    if (i === 0 || i === points.length - 1)
      marks += `<text class="value-label" x="${ax.toFixed(1)}" y="${y(p.value) - 9}" text-anchor="${anchor}">${esc(p.value)}${esc(unit)}</text>`;
    if (points.length <= 12 || i % Math.ceil(points.length / 8) === 0)
      marks += `<text class="axis-label" x="${x(i).toFixed(1)}" y="${height - 6}" text-anchor="${anchor}">${esc(p.label)}</text>`;
  });
  return `<div class="chart"><svg viewBox="0 0 ${W} ${height}" role="img">
<line class="baseline" x1="${PAD.l}" y1="${PAD.t + ih}" x2="${W - PAD.r}" y2="${PAD.t + ih}"/>${marks}</svg></div>`;
}

// ---------- views ----------

function buildToday(dailies, checkins) {
  const latest = dailies[dailies.length - 1];
  if (!latest) return page("index.html", "Today", `<h1>Today</h1><p class="empty">No daily logs yet — run <code>/eod</code> tonight.</p>`);
  const fm = latest.fm;
  const clientHours = Object.entries(fm.hours_by_client ?? {}).map(([c, h]) => `${c} ${h}h`).join(" · ");
  const content = `
<h1>Latest day — ${esc(fm.date)}${fm.example ? ' <span class="meta">(example data)</span>' : ""}</h1>
${tiles([[fm.hours_worked ?? "–", "hours worked"], [fm.meetings_count ?? "–", "meetings"], [(fm.wins ?? []).length, "wins"], [(fm.open_loops ?? []).length, "open loops"]])}
${clientHours ? `<p class="meta">${esc(clientHours)}</p>` : ""}
${gapsNote(fm.gaps)}
<div class="doc">${md(latest.body)}</div>
${fm.sources?.length ? `<p class="meta">Sources: ${sourceLinks(fm.sources)}</p>` : ""}`;
  page("index.html", "Today", content);
}

function buildHistory(dailies, weeklies, hours, workload) {
  const hoursPts = hours.filter((r) => r.metric === "hours_worked")
    .map((r) => ({ label: r.date.slice(5), value: r.value, tip: `${r.date}: ${r.value}h worked${r.example ? " (example)" : ""}` }));
  const weeklyRows = weeklies.map((w) => `<tr><td>${esc(w.fm.week)}</td><td class="num">${esc(w.fm.hours_total ?? "–")}</td><td>${esc((w.fm.top_wins ?? [])[0] ?? "")}</td><td>${esc((w.fm.headwinds ?? [])[0] ?? "")}</td></tr>`).join("");
  const dailyRows = [...dailies].reverse().map((d) => `<tr><td>${esc(d.fm.date)}</td><td class="num">${esc(d.fm.hours_worked ?? "–")}</td><td>${(d.fm.wins ?? []).map(esc).join("<br>")}</td><td>${(d.fm.obstacles ?? []).map(esc).join("<br>")}</td></tr>`).join("");
  const content = `
<h1>History</h1>
<div class="card"><div class="chart-title">Hours worked per day</div>${barChart(hoursPts.slice(-30), { unit: "h" })}</div>
<h2>Weeks</h2>
<div class="card">${weeklyRows ? `<table><tr><th>Week</th><th>Hours</th><th>Top win</th><th>Headwind</th></tr>${weeklyRows}</table>` : `<p class="empty">No weekly rollups yet — they appear after the first <code>/plan-week</code>.</p>`}</div>
<h2>Days</h2>
<div class="card">${dailyRows ? `<table><tr><th>Date</th><th>Hours</th><th>Wins</th><th>Obstacles</th></tr>${dailyRows}</table>` : `<p class="empty">No daily logs yet.</p>`}</div>`;
  page("history.html", "History", content);
}

function buildClients(profiles, briefsByClient, feedback) {
  const cards = profiles.map((p) => {
    const slug = p.fm.slug;
    const brief = (briefsByClient[slug] ?? []).slice(-1)[0];
    const b = brief?.fm.budget;
    const pct = b?.hours_total ? Math.min(100, Math.round((b.hours_used / b.hours_total) * 100)) : null;
    const burn = b?.burn_assessment ?? "";
    const fb = feedback.filter((f) => f.fm.client === slug).length;
    return `<div class="card">
<h2 style="margin-top:0">${esc(p.fm.name ?? slug)}${p.fm.example ? ' <span class="meta">(example)</span>' : ""}</h2>
${b ? `<div data-tip="${esc(`${b.hours_used}/${b.hours_total}h used — ${b.hours_remaining}h remaining`)}">
  <div class="meta">Budget: ${esc(b.hours_used)}/${esc(b.hours_total)}h · <span class="status ${esc(burn)}">${burn === "on-track" ? "✓" : burn === "over" ? "✗" : "–"} ${esc(burn)}</span></div>
  <div class="budget-track"><div class="budget-fill" style="width:${pct}%"></div></div></div>` : `<p class="empty">No brief yet — run <code>/brief ${esc(slug)}</code>.</p>`}
${brief ? `<p class="meta">Latest brief: ${esc(brief.fm.date)} · ${(brief.fm.waiting_on ?? []).length} waiting · ${(brief.fm.my_tasks ?? []).length} of my tasks · ${fb} feedback captured</p>
<ul class="clean">${(brief.fm.recommendations ?? []).map((r) => `<li>💡 ${esc(r)}</li>`).join("")}</ul>` : ""}
<details><summary class="meta">Profile</summary><div class="doc">${md(p.body)}</div></details>
</div>`;
  }).join("");
  page("clients.html", "Clients", `<h1>Clients</h1>${cards || `<p class="empty">No client profiles yet — copy <code>config/clients/_template.yml</code> and run <code>/brief</code>.</p>`}`);
}

function buildCoaching(coachingDocs, coachingMetrics) {
  const talk = coachingMetrics.filter((r) => r.metric === "talk_pct")
    .map((r) => ({ label: r.date.slice(5), value: r.value, tip: `${r.date} ${r.meeting ?? ""}: ${r.value}% talk share${r.example ? " (example)" : ""}` }));
  const latest = coachingDocs[coachingDocs.length - 1];
  const s = latest?.fm.scores ?? {};
  const reports = [...coachingDocs].reverse().map((c) => `<div class="card">
<h2 style="margin-top:0">${esc(c.fm.date)} — ${esc(c.fm.meeting_ref?.split("/").slice(-2, -1)[0] ?? "meeting")}${c.fm.example ? ' <span class="meta">(example)</span>' : ""}</h2>
<p class="meta">talk ${esc(c.fm.metrics?.talk_pct)}% · client ${esc(c.fm.metrics?.client_talk_pct)}% · ${esc(c.fm.metrics?.questions_asked)} questions · ${esc(c.fm.metrics?.jargon_flags)} jargon flags</p>
<div class="doc">${md(c.body)}</div></div>`).join("");
  const content = `
<h1>Coaching</h1>
${latest ? tiles([[`${s.listening ?? "–"}/5`, "listening"], [`${s.clarity ?? "–"}/5`, "clarity"], [`${s.engagement ?? "–"}/5`, "engagement"], [`${s.level_match ?? "–"}/5`, "level match"]]) : ""}
<div class="card"><div class="chart-title">Talk share per recorded meeting (lower is usually better — leave room for the client)</div>${lineChart(talk.slice(-20), { unit: "%", domain: [0, 100] })}</div>
${reports || `<p class="empty">No coaching reports yet — they appear after <code>/digest-meetings</code> coaches your first recorded client meeting.</p>`}`;
  page("coaching.html", "Coaching", content);
}

function buildEvaluation(evals) {
  const docs = [...evals].reverse().map((e) => `<div class="card"><h2 style="margin-top:0">${esc(e.fm.period)}</h2>
${e.fm.totals ? tiles(Object.entries(e.fm.totals).map(([k, v]) => [v, k])) : ""}
<div class="doc">${md(e.body)}</div></div>`).join("");
  page("evaluation.html", "Evaluation", `<h1>Evaluation packets</h1>${docs || `<p class="empty">None yet — run <code>/eval-packet</code> when you want your work compiled for a review.</p>`}`);
}

// ---------- main ----------

mkdirSync(DIST, { recursive: true });
writeFileSync(join(DIST, "styles.css"), readFileSync(join(HERE, "templates", "styles.css")));

const dailies = collectDocs("daily", "daily");
const weeklies = collectDocs("weekly", "weekly");
const checkins = collectDocs("checkin", "checkins");
const profiles = collectDocs("client-profile", "clients");
const briefs = collectDocs("brief", "clients");
const coaching = collectDocs("coaching", "meetings");
const feedback = collectDocs("feedback", "feedback");
const evals = collectDocs("evaluation", "evaluation");

const briefsByClient = {};
for (const b of briefs) (briefsByClient[b.fm.client] ??= []).push(b);

console.log(`data: ${dailies.length} dailies, ${weeklies.length} weeklies, ${checkins.length} checkins, ${profiles.length} clients, ${briefs.length} briefs, ${coaching.length} coaching, ${feedback.length} feedback, ${evals.length} evaluations`);

buildToday(dailies, checkins);
buildHistory(dailies, weeklies, readJsonl("hours.jsonl"), readJsonl("workload.jsonl"));
buildClients(profiles, briefsByClient, feedback);
buildCoaching(coaching, readJsonl("coaching.jsonl"));
buildEvaluation(evals);

console.log(`done → ${relative(process.cwd(), DIST)}`);
