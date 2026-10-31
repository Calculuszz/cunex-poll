// Load generator for the STAGING API. Replays what the web app asks the API
// for, with many virtual users (VUs), and reports latency per endpoint.
//
//   node loadtest/run.mjs <seed.json> --mode journey --stages 60s:100,180s:100 --out result.json
//
// --mode journey : open the poll page, 3 question pages, submit, results page
//                  (each page = the API calls the web server makes for it)
// --mode watch   : keep the live results open (GET results every 5 s, ETag)
// --stages       : comma list of <duration>:<target VUs>, ramped linearly
// --think        : pause between pages in ms, e.g. 1000-3000
import { readFileSync, writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
const seed = JSON.parse(readFileSync(args[0], 'utf8'));
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? def : args[i + 1];
};
const mode = opt('mode', 'journey');
const stages = opt('stages', '30s:5')
  .split(',')
  .map((s) => {
    const [d, t] = s.split(':');
    return {
      ms: parseFloat(d) * (d.endsWith('m') ? 60_000 : 1000),
      target: Number(t),
    };
  });
const [thinkMin, thinkMax] = opt('think', '1000-3000').split('-').map(Number);
const out = opt('out', null);

const API = `${seed.api}/api/v1`;
const poll = seed.pollId;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const think = () => sleep(thinkMin + Math.random() * (thinkMax - thinkMin));

// ---- metrics
const samples = new Map(); // label -> latencies (ms)
const statuses = new Map(); // "label status" -> count
const timeline = []; // per 10 s window
let windowReqs = [];
let nextSid = 0;
const takeSid = () => seed.sids[nextSid++ % seed.sids.length];

function record(label, ms, status) {
  if (!samples.has(label)) samples.set(label, []);
  samples.get(label).push(ms);
  const k = `${label} ${status}`;
  statuses.set(k, (statuses.get(k) ?? 0) + 1);
  windowReqs.push({ ms, ok: status >= 200 && status < 400 });
}

async function call(label, sid, path, init = {}) {
  const t0 = performance.now();
  let status = 0;
  try {
    const res = await fetch(`${API}${path}`, {
      ...init,
      headers: {
        Cookie: `sid=${sid}`,
        Origin: seed.origin,
        'Content-Type': 'application/json',
        ...init.headers,
      },
      signal: AbortSignal.timeout(30_000),
    });
    status = res.status;
    const body = res.status === 304 ? null : await res.text();
    return { status, headers: res.headers, body };
  } catch {
    status = 0; // network error / timeout
    return { status, headers: new Headers(), body: null };
  } finally {
    record(label, performance.now() - t0, status);
  }
}

// What the web server fetches to render one poll page.
async function pageLoad(sid, extra = []) {
  await call('me', sid, '/me');
  await Promise.all([
    call('poll', sid, `/polls/${poll}`),
    call('faculties', sid, '/faculties'),
    ...extra.map((f) => f()),
  ]);
}

function answers() {
  return seed.elements.map((e) => {
    if (e.type === 'text_question')
      return { elementId: e.id, text: 'ทดสอบโหลด' };
    if (e.type === 'multi_choice')
      return {
        elementId: e.id,
        optionIds: e.options.slice(0, 1 + Math.floor(Math.random() * 2)),
      };
    return {
      elementId: e.id,
      optionIds: [e.options[Math.floor(Math.random() * e.options.length)]],
    };
  });
}

let ballotsOk = 0;
async function journey(alive) {
  while (alive()) {
    const sid = takeSid();
    await pageLoad(sid); // poll intro
    for (let page = 0; page < 3 && alive(); page++) {
      await think();
      await pageLoad(sid); // question page
    }
    if (!alive()) return;
    await think();
    const r = await call('ballot', sid, `/polls/${poll}/ballot`, {
      method: 'PUT',
      body: JSON.stringify({ answers: answers() }),
    });
    if (r.status === 200 || r.status === 201) ballotsOk++;
    await pageLoad(sid, [() => call('results', sid, `/polls/${poll}/results`)]); // results page
    await think();
  }
}

async function watch(alive) {
  const sid = takeSid();
  let etag = null;
  while (alive()) {
    const r = await call('results', sid, `/polls/${poll}/results`, {
      headers: etag ? { 'If-None-Match': etag } : {},
    });
    etag = r.headers.get('etag') ?? etag;
    await sleep(5000);
  }
}

// ---- scheduler: keeps the number of live VUs on the ramp
const started = Date.now();
const total = stages.reduce((s, x) => s + x.ms, 0);
function targetAt(t) {
  let from = 0;
  let acc = 0;
  for (const s of stages) {
    if (t <= acc + s.ms)
      return Math.round(from + ((s.target - from) * (t - acc)) / s.ms);
    acc += s.ms;
    from = s.target;
  }
  return 0;
}
let live = 0;
const vus = [];
const tick = setInterval(() => {
  const t = Date.now() - started;
  const target = t >= total ? 0 : targetAt(t);
  while (live < target) {
    const id = live++;
    vus.push(
      (mode === 'watch' ? watch : journey)(
        () => id < live && Date.now() - started < total,
      ),
    );
  }
  if (live > target) live = target;
}, 250);

const pct = (arr, p) => {
  if (arr.length === 0) return null;
  const s = [...arr].sort((a, b) => a - b);
  return Math.round(
    s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))],
  );
};
const reporter = setInterval(() => {
  const w = windowReqs;
  windowReqs = [];
  const t = Math.round((Date.now() - started) / 1000);
  const row = {
    t,
    vus: live,
    rps: Math.round(w.length / 10),
    p50: pct(
      w.map((x) => x.ms),
      50,
    ),
    p95: pct(
      w.map((x) => x.ms),
      95,
    ),
    errors: w.filter((x) => !x.ok).length,
  };
  timeline.push(row);
  console.log(
    `t=${t}s vus=${row.vus} rps=${row.rps} p50=${row.p50}ms p95=${row.p95}ms errors=${row.errors}`,
  );
}, 10_000);

await sleep(total + 500);
clearInterval(tick);
live = 0;
await Promise.allSettled(vus);
clearInterval(reporter);

const summary = {
  mode,
  stages: opt('stages', ''),
  durationS: Math.round((Date.now() - started) / 1000),
  ballotsOk,
  endpoints: {},
  statuses: Object.fromEntries(statuses),
  timeline,
};
let all = [];
for (const [label, arr] of samples) {
  all = all.concat(arr);
  summary.endpoints[label] = {
    n: arr.length,
    p50: pct(arr, 50),
    p95: pct(arr, 95),
    p99: pct(arr, 99),
    max: Math.round(Math.max(...arr)),
  };
}
summary.all = {
  n: all.length,
  p50: pct(all, 50),
  p95: pct(all, 95),
  p99: pct(all, 99),
};
const bad = [...statuses]
  .filter(([k]) => !/ (2\d\d|304)$/.test(k))
  .reduce((s, [, n]) => s + n, 0);
summary.errorRate = all.length ? +((bad / all.length) * 100).toFixed(2) : 0;
console.log(JSON.stringify({ ...summary, timeline: undefined }, null, 2));
if (out) writeFileSync(out, JSON.stringify(summary, null, 2));
