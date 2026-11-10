/* Path — UI */
(function () {
  const D = window.PATH_DATA, E = window.PATH;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const alpha = (c, a) => { const n = parseInt(c.replace("#", ""), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pct = (x) => Math.round(x * 100) + "%";
  const trunc = (s, n) => (s.length > n ? s.slice(0, n - 1) + "…" : s);
  const GOAL_COLORS = ["--accent", "--violet", "--amber", "--coral", "--sky", "--teal"];
  const goalById = (id) => D.GOALS.find((g) => g.id === id);
  const goalColor = (id) => GOAL_COLORS[D.GOALS.findIndex((g) => g.id === id)];
  const COST = ["Funded / paid", "Partial cost", "Tuition"];
  const LANGS = {
    "Latin America": ["Spanish", "English", "Portuguese", "French", "Quechua"],
    "Sub-Saharan Africa": ["English", "Yoruba", "French", "Swahili", "Hausa"],
    "South Asia": ["English", "Hindi", "Marathi", "Bengali", "Urdu"],
    "East Asia": ["English", "Mandarin", "Korean", "Japanese", "Vietnamese"],
    Europe: ["English", "Spanish", "French", "German", "Italian"],
    "North America": ["English", "Spanish", "French", "Mandarin", "Korean"],
    "Middle East & N. Africa": ["Arabic", "English", "French", "Turkish", "Farsi"],
  };

  // ---------- state ----------
  E.generatePopulation(1200, 11);
  const S = {
    user: null, goal: "g_rs", K: 30,
    opts: { funded: false, relocate: true, horizon: 10, lock: [], exclude: [] },
    sel: null, hover: null, node: null, match: null, paths: [],
  };

  // ---------- profile form ----------
  const sel = (el, items, val) => { el.innerHTML = items.map((x, i) => `<option value="${i}">${esc(x)}</option>`).join(""); if (val != null) el.value = val; };
  function initForm() {
    sel($("#pf-region"), D.REGIONS);
    sel($("#pf-field"), D.FIELDS);
    sel($("#pf-level"), D.LEVELS);
    $("#pf-strengths").innerHTML = D.STRENGTHS.map((s) => `<div class="field"><label for="pf-s-${s.k}">${s.label} <output id="pf-s-${s.k}-o"></output></label><input type="range" id="pf-s-${s.k}" min="0" max="10" step="1"></div>`).join("");
    $("#presets").innerHTML = D.PRESETS.map((p, i) => `<button class="btn sm" data-i="${i}">${esc(p.name.split(" ")[0])} · ${esc(p.city)}</button>`).join(" ");
    $("#presets").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) loadPreset(D.PRESETS[+b.dataset.i]); });
    $("#pf-region").addEventListener("change", () => { fillCities(); readForm(); });
    $("#pf").addEventListener("input", (e) => { if (e.target.id !== "pf-region") readForm(); });
  }
  function fillCities(val) {
    const cities = D.CITIES[D.REGIONS[+$("#pf-region").value]];
    $("#pf-city").innerHTML = cities.map((c) => `<option>${esc(c)}</option>`).join("");
    if (val && cities.includes(val)) $("#pf-city").value = val;
  }
  function loadPreset(p) {
    $("#pf-name").value = p.name;
    $("#pf-region").value = D.REGIONS.indexOf(p.region); fillCities(p.city);
    $("#pf-econ").value = p.econ;
    $("#pf-field").value = D.FIELDS.indexOf(p.field);
    $("#pf-level").value = p.level;
    $("#pf-degree").value = p.degree; $("#pf-school").value = p.school;
    $("#pf-gpa").value = p.gpa; $("#pf-exp").value = p.exp; $("#pf-languages").value = p.languages;
    D.STRENGTHS.forEach((s) => ($("#pf-s-" + s.k).value = p.s[s.k]));
    S.goal = p.goal; S.sel = null; S.node = null; S.opts.lock = []; S.opts.exclude = [];
    $$("#presets button").forEach((b) => b.classList.toggle("on", D.PRESETS[+b.dataset.i] === p));
    readForm();
  }
  function readForm() {
    const u = {
      name: $("#pf-name").value.trim() || "Your name",
      region: D.REGIONS[+$("#pf-region").value], city: $("#pf-city").value,
      econ: +$("#pf-econ").value, field: D.FIELDS[+$("#pf-field").value], level: +$("#pf-level").value,
      degree: $("#pf-degree").value.trim(), school: $("#pf-school").value.trim(),
      gpa: +$("#pf-gpa").value, exp: +$("#pf-exp").value, languages: +$("#pf-languages").value, s: {},
    };
    D.STRENGTHS.forEach((s) => (u.s[s.k] = +$("#pf-s-" + s.k).value));
    $("#pf-econ-o").textContent = D.ECON[u.econ - 1];
    $("#pf-gpa-o").textContent = u.gpa.toFixed(2);
    $("#pf-exp-o").textContent = u.exp + (u.exp === 1 ? " year" : " years");
    $("#pf-languages-o").textContent = u.languages;
    D.STRENGTHS.forEach((s) => ($("#pf-s-" + s.k + "-o").textContent = u.s[s.k]));
    S.user = u;
    schedule();
  }

  let pending = false;
  function schedule() { if (pending) return; pending = true; requestAnimationFrame(() => { pending = false; update(); }); }

  function update() {
    S.match = E.match(S.user, S.K);
    S.paths = E.paths(S.user, S.goal, S.match, S.opts);
    const open = S.paths.filter((p) => !p.blocked.length);
    if (S.sel == null || !open.some((p) => p.ti === S.sel)) S.sel = open.length ? open[0].ti : null;
    renderCV(); renderMap(); renderNeighbours(); renderGoals(); renderChips(); renderGraph(); renderCards(); renderPlan(); renderNode(); renderOpps(); renderPeople();
  }

  // ---------- CV ----------
  function renderCV() {
    const u = S.user, f = E.features(u);
    const top = D.STRENGTHS.slice().sort((a, b) => u.s[b.k] - u.s[a.k]);
    const g = goalById(S.goal);
    const langs = LANGS[u.region].slice(0, u.languages);
    const bullets = {
      research: "Contributed to a faculty-led research project; co-authored a poster",
      coding: "Built and maintained a Python data pipeline used by 3 student teams",
      quant: "Top 10% in probability & statistics coursework; ran regression analyses",
      writing: "Published op-eds and policy briefs in the student journal",
      leadership: "Led a 12-person student organisation; managed a $4k budget",
      entrepreneurship: "Co-founded a campus venture that reached 300 users",
      communication: "Delivered workshops to 150+ high-school students",
      design: "Designed the UX for a community app prototype",
    };
    const cvec = S.match.cvec;
    const mx = Math.max(...cvec.map(Math.abs)) || 1;
    const acc = css("--accent"), cor = css("--coral");
    $("#cv").innerHTML = `
      <h3>${esc(u.name)}</h3>
      <div class="meta">${esc(u.city)}, ${esc(u.region)} · ${esc(D.LEVELS[u.level])} · ${esc(u.field)}</div>
      <p class="summary">${esc(D.LEVELS[u.level])} in ${esc(u.field.toLowerCase())} with strengths in ${top[0].label.toLowerCase()} and ${top[1].label.toLowerCase()}, working toward a career as ${/^[AEIOUM]/.test(g.name) ? "an" : "a"} ${esc(g.name)}.</p>
      <h6>Education</h6>
      <p><b>${esc(u.degree || "Degree")}</b>, ${esc(u.school || "Institution")} · GPA ${u.gpa.toFixed(2)}/4.0</p>
      <h6>Experience</h6>
      <ul>${u.exp ? `<li>${u.exp} year${u.exp > 1 ? "s" : ""} of professional experience</li>` : ""}${top.slice(0, 3).map((s) => `<li>${bullets[s.k]}</li>`).join("")}</ul>
      <h6>Languages</h6><p>${langs.map(esc).join(" · ")}</p>
      <h6>Strengths</h6>
      <div class="skills">${D.STRENGTHS.map((s) => `<div class="skill"><span>${s.label}</span><span class="bar"><i style="width:${u.s[s.k] * 10}%"></i></span></div>`).join("")}</div>
      <div class="embed">
        <div class="tiny" style="display:flex;justify-content:space-between"><span>CV embedding · ${cvec.length} dims (centred)</span><span>private: economic level <b>${esc(D.ECON[u.econ - 1])}</b> is used for matching, never printed</span></div>
        <div class="embed-strip" style="grid-template-columns:repeat(${cvec.length},1fr)">${cvec.map((v) => `<i style="background:${alpha(v >= 0 ? acc : cor, 0.12 + 0.88 * Math.abs(v) / mx)}"></i>`).join("")}</div>
        <div class="vec">v = [${cvec.map((v) => v.toFixed(2)).join(", ")}]</div>
      </div>`;
  }

  // ---------- profile map ----------
  let mapPts = [];
  function renderMap() {
    const cv = $("#map");
    const h = 430, w = cv.clientWidth || 600, dpr = window.devicePixelRatio || 1;
    cv.width = w * dpr; cv.height = h * dpr; cv.style.height = h + "px";
    const ctx = cv.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const all = E.pop.map((p) => p.xy).concat([S.match.xy]);
    const xs = all.map((p) => p[0]), ys = all.map((p) => p[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const pad = 18;
    const X = (v) => pad + ((v - x0) / (x1 - x0 || 1)) * (w - 2 * pad);
    const Y = (v) => pad + ((v - y0) / (y1 - y0 || 1)) * (h - 2 * pad);
    ctx.fillStyle = css("--bg-2"); ctx.fillRect(0, 0, w, h);
    const nbSet = new Map(S.match.neighbours.map((n) => [n.p, n]));
    const ux = X(S.match.xy[0]), uy = Y(S.match.xy[1]);
    const maxW = S.match.neighbours[0].w;
    S.match.neighbours.forEach((n) => {
      ctx.strokeStyle = alpha(css("--accent"), 0.08 + 0.45 * n.w / maxW);
      ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(ux, uy); ctx.lineTo(X(n.p.xy[0]), Y(n.p.xy[1])); ctx.stroke();
    });
    mapPts = [];
    E.pop.forEach((p) => {
      const x = X(p.xy[0]), y = Y(p.xy[1]), nb = nbSet.has(p);
      const c = css(goalColor(p.goal));
      ctx.fillStyle = alpha(c, nb ? 0.95 : 0.4);
      ctx.beginPath();
      if (p.success) ctx.arc(x, y, nb ? 4.6 : 3.2, 0, 6.283);
      else { const r = nb ? 4 : 2.8; ctx.rect(x - r, y - r, 2 * r, 2 * r); }
      ctx.fill();
      if (nb) { ctx.strokeStyle = css("--card"); ctx.lineWidth = 1.2; ctx.stroke(); }
      mapPts.push({ x, y, p });
    });
    ctx.fillStyle = css("--ink"); ctx.strokeStyle = css("--bg");
    ctx.lineWidth = 3;
    ctx.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 4.5 : 11, a = -Math.PI / 2 + (i * Math.PI) / 5; ctx[i ? "lineTo" : "moveTo"](ux + r * Math.cos(a), uy + r * Math.sin(a)); } ctx.closePath();
    ctx.stroke(); ctx.fill();
    ctx.font = "600 12px Inter, sans-serif"; ctx.textBaseline = "middle";
    const label = "You";
    const lx = ux + 14 + ctx.measureText(label).width > w ? ux - 14 - ctx.measureText(label).width : ux + 14;
    ctx.lineWidth = 4; ctx.strokeStyle = css("--bg-2"); ctx.strokeText(label, lx, uy); ctx.fillText(label, lx, uy);

    $("#map-legend").innerHTML = D.GOALS.map((g) => `<span><i style="background:var(${goalColor(g.id)})"></i>${g.name}</span>`).join("") +
      `<span><i style="background:var(--ink-3)"></i>reached goal</span><span><i class="sq" style="background:var(--ink-3)"></i>stopped</span>`;

    const nb = S.match.neighbours;
    const sameGoal = nb.filter((n) => n.p.goal === S.goal);
    const sr = sameGoal.length ? sameGoal.filter((n) => n.p.success).length / sameGoal.length : 0;
    $("#sim-stats").innerHTML = [
      { k: "Closest match", v: pct(nb[0].sim), c: "good" },
      { k: "Mean similarity (k)", v: pct(nb.reduce((a, n) => a + n.sim, 0) / nb.length) },
      { k: `Neighbours → ${goalById(S.goal).name}`, v: sameGoal.length },
      { k: "…of whom reached it", v: sameGoal.length ? pct(sr) : "—", c: sr >= 0.5 ? "good" : "warn" },
    ].map((s) => `<div class="stat ${s.c || ""}"><div class="k">${esc(s.k)}</div><div class="v">${s.v}</div></div>`).join("");
  }
  $("#map").addEventListener("pointermove", (e) => {
    const r = e.target.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top;
    let best = null, bd = 12;
    mapPts.forEach((m) => { const d = Math.hypot(m.x - mx, m.y - my); if (d < bd) { bd = d; best = m; } });
    const p = best && best.p;
    $("#map-hover").textContent = p ? `${p.id} · ${p.field} · ${p.city} · ${D.ECON[p.econ - 1]} · → ${goalById(p.goal).name} ${p.success ? "✓ reached" : "✗ stopped"}` : "Hover a dot to inspect a profile.";
  });

  function trajHTML(p) {
    const t = D.TEMPLATES[p.template];
    const items = t.steps.map((s) => D.NODES[s].name).concat([goalById(p.goal).name]);
    return items.map((name, i) => {
      const cls = i < p.reached ? "done" : i === p.reached ? "fail" : "";
      return `<span class="s ${cls} ${i === items.length - 1 ? "goal" : ""}">${esc(trunc(name, 28))}</span>`;
    }).join('<span class="ar">→</span>');
  }
  function renderNeighbours() {
    $("#nb-list").innerHTML = S.match.neighbours.slice(0, 14).map(({ p, sim }) => `
      <div class="nb">
        <div class="nb-top"><b>${p.id} <span class="tiny">cohort ${p.cohort}</span></b><span class="sim">${pct(sim)} similar</span></div>
        <div class="who">${esc(p.field)} · ${esc(p.city)} · ${D.ECON[p.econ - 1]} · GPA ${p.gpa.toFixed(2)}</div>
        <div class="traj">${trajHTML(p)}</div>
      </div>`).join("");
  }

  // ---------- goals & constraints ----------
  function renderGoals() {
    $("#goals").innerHTML = D.GOALS.map((g) => {
      const ps = E.paths(S.user, g.id, S.match, S.opts).filter((p) => !p.blocked.length);
      const best = ps.length ? ps[0].prob : null;
      return `<button class="goal-btn ${g.id === S.goal ? "on" : ""}" data-g="${g.id}"><b>${g.name}</b><span class="${best >= 0.5 ? "hi" : ""}">${best != null ? "best route " + pct(best) : "no open route"}</span></button>`;
    }).join("");
  }
  $("#goals").addEventListener("click", (e) => {
    const b = e.target.closest(".goal-btn"); if (!b) return;
    S.goal = b.dataset.g; S.sel = null; S.node = null; S.opts.lock = []; S.opts.exclude = [];
    update();
  });
  function renderChips() {
    $("#c-chips").innerHTML =
      S.opts.lock.map((id) => `<span class="chip teal">required: ${esc(D.NODES[id].name)} <button data-rm="lock" data-id="${id}" aria-label="remove">×</button></span>`).join("") +
      S.opts.exclude.map((id) => `<span class="chip coral">excluded: ${esc(D.NODES[id].name)} <button data-rm="exclude" data-id="${id}" aria-label="remove">×</button></span>`).join("");
  }
  $("#c-chips").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-rm]"); if (!b) return;
    S.opts[b.dataset.rm] = S.opts[b.dataset.rm].filter((x) => x !== b.dataset.id); update();
  });
  $("#c-funded").addEventListener("change", (e) => { S.opts.funded = e.target.checked; update(); });
  $("#c-relocate").addEventListener("change", (e) => { S.opts.relocate = e.target.checked; update(); });
  const hz = $("#c-horizon");
  const hzOut = () => ($("#c-horizon-o").textContent = hz.value + " years");
  hz.addEventListener("input", () => { S.opts.horizon = +hz.value; hzOut(); schedule(); }); hzOut();
  const kIn = $("#k");
  const kOut = () => ($("#k-o").textContent = kIn.value);
  kIn.addEventListener("input", () => { S.K = +kIn.value; kOut(); schedule(); }); kOut();

  // ---------- graph ----------
  const SVGNS = "http://www.w3.org/2000/svg";
  function renderGraph() {
    const svg = $("#graph");
    const paths = S.paths, goal = goalById(S.goal);
    const active = S.hover != null ? S.hover : S.sel;
    const activePath = paths.find((p) => p.ti === active);
    // columns
    const cols = [["you"], [], [], [], [], [goal.id]];
    paths.forEach((p) => p.steps.forEach((s) => { const c = D.NODES[s].stage; if (!cols[c].includes(s)) cols[c].push(s); }));
    const maxN = Math.max(...cols.map((c) => c.length), 2);
    const W = 1000, top = 46, rowH = 74, H = top + maxN * rowH + 10;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    const colX = (c) => 75 + c * 170;
    const pos = {};
    cols.forEach((col, c) => col.forEach((id, i) => (pos[id] = [colX(c), top + ((H - top - 10) * (i + 0.5)) / col.length])));
    const NW = 146, NH = 50;

    // edges aggregated
    const edges = new Map();
    const maxFlow = Math.max(...paths.map((p) => p.n), 1);
    paths.forEach((p) => {
      const seq = ["you", ...p.steps, goal.id];
      for (let i = 0; i < seq.length - 1; i++) {
        const k = seq[i] + ">" + seq[i + 1];
        const e = edges.get(k) || { a: seq[i], b: seq[i + 1], flow: 0, open: false, hot: false };
        e.flow += p.n / maxFlow; e.open = e.open || !p.blocked.length; e.hot = e.hot || p.ti === active;
        edges.set(k, e);
      }
    });
    const ink3 = css("--ink-3"), acc = css("--accent");
    let html = "";
    const heads = ["Now", "Year 0–1", "Years 1–3", "Years 3–6", "Years 6–9", "Goal"];
    heads.forEach((h, c) => (html += `<text class="colh" x="${colX(c)}" y="20" text-anchor="middle" fill="${css("--ink-3")}">${h}</text>`));
    const edgeList = [...edges.values()].sort((a, b) => a.hot - b.hot);
    edgeList.forEach((e) => {
      const [x1, y1] = pos[e.a], [x2, y2] = pos[e.b];
      const sx = e.a === "you" ? x1 + 28 : x1 + NW / 2, tx = x2 - NW / 2;
      const mx = (sx + tx) / 2;
      const wdt = 1.5 + 7 * Math.min(1, e.flow);
      const stroke = e.hot ? acc : e.open ? alpha(ink3, 0.45) : alpha(ink3, 0.18);
      html += `<path class="edge ${e.hot ? "hot" : ""}" d="M${sx},${y1} C${mx},${y1} ${mx},${y2} ${tx},${y2}" stroke="${stroke}" stroke-width="${e.hot ? Math.max(3, wdt) : wdt}" ${!e.open && !e.hot ? 'stroke-dasharray="3 4"' : ""} stroke-linecap="round"/>`;
    });
    // start node
    const [yx, yy] = pos.you;
    html += `<g><circle cx="${yx}" cy="${yy}" r="28" fill="${css("--ink")}"/><text x="${yx}" y="${yy + 4}" text-anchor="middle" fill="${css("--bg")}" font-size="13" font-weight="600">You</text>
      <text x="${yx}" y="${yy + 46}" text-anchor="middle" fill="${css("--ink-3")}" font-size="10">${esc(trunc(S.user.city, 16))}</text></g>`;
    // step nodes
    const openNodes = new Set();
    paths.forEach((p) => { if (!p.blocked.length) p.steps.forEach((s) => openNodes.add(s)); });
    cols.slice(1, 5).flat().forEach((id) => {
      const n = D.NODES[id], T = D.TYPES[n.type], [x, y] = pos[id];
      const onActive = activePath && activePath.steps.includes(id);
      const locked = S.opts.lock.includes(id), excl = S.opts.exclude.includes(id);
      const dim = !openNodes.has(id) && !onActive;
      const stroke = locked ? css("--teal") : excl ? css("--coral") : onActive ? acc : css("--line");
      html += `<g class="node ${dim ? "dim" : ""}" data-id="${id}" tabindex="0" role="button" aria-label="${esc(n.name)}">
        <rect class="box" x="${x - NW / 2}" y="${y - NH / 2}" width="${NW}" height="${NH}" rx="10" fill="${css(S.node === id ? T.soft : "--card")}" stroke="${stroke}" stroke-width="${onActive || locked || excl ? 2 : 1}" ${excl ? 'stroke-dasharray="4 3"' : ""}/>
        <rect x="${x - NW / 2}" y="${y - NH / 2}" width="5" height="${NH}" rx="2.5" fill="${css(T.color)}"/>
        <text x="${x - NW / 2 + 13}" y="${y - 5}" font-size="11" font-weight="500" fill="${css("--ink")}">${esc(trunc(n.name, 21))}</text>
        <text x="${x - NW / 2 + 13}" y="${y + 11}" font-size="9.5" fill="${css("--ink-3")}">${esc(trunc((locked ? "★ " : "") + n.org, 24))}</text>
      </g>`;
    });
    // goal
    const [gx, gy] = pos[goal.id];
    const best = paths.find((p) => !p.blocked.length);
    const gp = activePath ? activePath.prob : best ? best.prob : 0;
    html += `<g><rect x="${gx - NW / 2}" y="${gy - 34}" width="${NW}" height="68" rx="12" fill="${css("--ink")}"/>
      <text x="${gx}" y="${gy - 12}" text-anchor="middle" font-size="12" font-weight="600" fill="${css("--bg")}">${esc(trunc(goal.name, 22))}</text>
      <text x="${gx}" y="${gy + 3}" text-anchor="middle" font-size="9.5" fill="${css("--bg")}" fill-opacity="0.7">${esc(goal.org)}</text>
      <text x="${gx}" y="${gy + 22}" text-anchor="middle" font-size="14" font-family="JetBrains Mono, monospace" fill="${css("--teal")}">${activePath || best ? pct(gp) : "—"}</text></g>`;
    svg.innerHTML = html;

    $("#graph-legend").innerHTML = Object.values(D.TYPES).map((t) => `<span><i class="sq" style="background:var(${t.color})"></i>${t.label}</span>`).join("") +
      `<span style="margin-left:auto">edge width = similar profiles who took that step</span>`;
  }
  $("#graph").addEventListener("click", (e) => {
    const g = e.target.closest(".node"); if (!g) return;
    S.node = g.dataset.id; renderGraph(); renderNode();
    if (window.innerWidth < 900) $("#node-panel").scrollIntoView({ block: "nearest", behavior: "smooth" });
  });
  $("#graph").addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const g = e.target.closest(".node"); if (!g) return;
    e.preventDefault(); S.node = g.dataset.id; renderGraph(); renderNode();
  });

  // ---------- path cards ----------
  function renderCards() {
    const el = $("#path-cards");
    if (!S.paths.length) { el.innerHTML = ""; return; }
    const open = S.paths.filter((p) => !p.blocked.length);
    const teal = "var(--teal)", amber = "var(--amber)", coral = "var(--coral)";
    let html = open.map((p, i) => {
      const c = p.prob >= 0.5 ? teal : p.prob >= 0.3 ? amber : coral;
      return `<div class="pcard ${p.ti === S.sel ? "on" : ""}" data-ti="${p.ti}">
        <div class="rank">Route ${String.fromCharCode(65 + i)}${i === 0 ? " · best for you" : ""}</div>
        <div class="prob" style="color:${c}">${pct(p.prob)}<small>80% CI ${pct(p.lo)}–${pct(p.hi)}</small></div>
        <div class="pbar"><span class="ci" style="left:${p.lo * 100}%;width:${(p.hi - p.lo) * 100}%;background:${c}"></span><span class="pt" style="left:calc(${p.prob * 100}% - 1.5px);background:${c}"></span></div>
        <div class="meta"><span>⏱ ${(p.months / 12).toFixed(1)} yrs</span><span>${COST[p.cost]}</span><span>${p.n} of ${E.NEAR} nearest took it</span></div>
        <div class="steps">${p.steps.map((s) => esc(D.NODES[s].name)).join(" → ")}</div>
      </div>`;
    }).join("");
    const blocked = S.paths.filter((p) => p.blocked.length);
    if (!open.length) html = `<div class="empty" style="grid-column:1/-1">No route satisfies your constraints. Relax a constraint or remove a required / excluded step.</div>`;
    if (blocked.length) html += `<div class="pcard" style="cursor:default;background:var(--bg-2)"><div class="rank">Hidden routes (${blocked.length})</div><div class="steps">${blocked.map((p) => `<div style="margin-top:4px"><b>${pct(p.prob)}</b> · ${esc(p.steps.map((s) => D.NODES[s].name).join(" → "))}<br><span class="tiny">${esc(p.blocked.join("; "))}</span></div>`).join("")}</div></div>`;
    el.innerHTML = html;
  }
  $("#path-cards").addEventListener("click", (e) => { const c = e.target.closest(".pcard[data-ti]"); if (!c) return; S.sel = +c.dataset.ti; renderCards(); renderGraph(); renderPlan(); });
  $("#path-cards").addEventListener("pointerover", (e) => { const c = e.target.closest(".pcard[data-ti]"); const v = c ? +c.dataset.ti : null; if (v !== S.hover) { S.hover = v; renderGraph(); } });
  $("#path-cards").addEventListener("pointerleave", () => { S.hover = null; renderGraph(); });

  // ---------- plan & node detail ----------
  const fmtDate = (d) => (/^\d{4}/.test(d) ? new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : d);
  function renderPlan() {
    const p = S.paths.find((x) => x.ti === S.sel);
    if (!p) { $("#plan-panel").innerHTML = `<h5>Action plan</h5><p class="small muted">Select a route to see the plan.</p>`; return; }
    let m = 0;
    const items = p.steps.map((id) => {
      const n = D.NODES[id], T = D.TYPES[n.type];
      const when = m === 0 ? "Start now" : `From month ${m}`;
      m += n.months;
      return `<li><span class="dotm" style="background:var(${T.color})"></span>
        <span class="when">${when} · ${n.months} months · apply by ${fmtDate(n.deadline)}</span><br>
        <b>${esc(n.name)}</b> <span class="small muted">· ${esc(n.org)}</span><br>
        <span class="todo">→ ${esc(n.tip)}</span></li>`;
    }).join("");
    const g = goalById(S.goal);
    $("#plan-panel").innerHTML = `<h5>Action plan · ${pct(p.prob)} to ${esc(g.name)}</h5>
      <ul class="plan">${items}<li><span class="dotm" style="background:var(--ink)"></span><span class="when">≈ ${(m / 12).toFixed(1)} years from now</span><br><b>${esc(g.name)}</b> <span class="small muted">· ${esc(g.org)} · typical pay ${esc(g.salary)}</span></li></ul>
      <p class="tiny" style="margin:0">Prior from profile fit: ${pct(p.prior)} · ${p.n} of your ${E.NEAR} nearest profiles took this route (effective n ${p.neff.toFixed(1)}).</p>`;
  }
  function renderNode() {
    const el = $("#node-panel");
    const id = S.node;
    if (!id || !D.NODES[id]) {
      el.innerHTML = `<h5>Opportunity detail</h5><p class="small muted">Click any node in the graph to see deadlines, funding, eligibility and the similar profiles who took it. From there you can <b>require</b> it (all routes must pass through it) or <b>exclude</b> it.</p>`;
      return;
    }
    const n = D.NODES[id], T = D.TYPES[n.type];
    const takers = S.match.all.slice(0, E.NEAR).filter(({ p }) => D.TEMPLATES[p.template].steps.includes(id));
    const reached = takers.filter(({ p }) => p.success).length;
    const elig = E.eligible(id, S.user);
    const locked = S.opts.lock.includes(id), excl = S.opts.exclude.includes(id);
    const scraped = 1 + ((id.charCodeAt(2) * 7) % 23);
    el.innerHTML = `<h5>${esc(n.name)}</h5>
      <div style="display:flex;gap:6px;flex-wrap:wrap"><span class="chip ${T.chip}">${T.label}</span><span class="chip">${esc(n.org)}</span>${n.abroad ? '<span class="chip">abroad</span>' : ""}${elig ? "" : '<span class="chip coral">not eligible</span>'}</div>
      <dl class="kv">
        <dt>Deadline</dt><dd>${fmtDate(n.deadline)}</dd>
        <dt>Funding</dt><dd>${esc(n.funding)}</dd>
        <dt>Duration</dt><dd>${n.months} months</dd>
        <dt>Acceptance</dt><dd>${pct(n.accept)} overall</dd>
        <dt>Requirements</dt><dd>${esc(n.req)}${n.eligText ? ` · <i>${esc(n.eligText)}</i>` : ""}</dd>
        ${n.advisor ? `<dt>Advisor</dt><dd>${esc(n.advisor)}</dd>` : ""}
        <dt>Similar profiles</dt><dd>${takers.length} of your ${E.NEAR} nearest took it · ${takers.length ? pct(reached / takers.length) : "—"} reached their goal</dd>
        <dt>Source</dt><dd class="mono">${esc(n.src)} · scraped ${scraped}h ago</dd>
      </dl>
      <div class="btn-row" style="margin-top:8px">
        <button class="btn sm ${locked ? "on" : ""}" data-act="lock">${locked ? "✓ Required" : "Require this step"}</button>
        <button class="btn sm ${excl ? "on" : ""}" data-act="exclude">${excl ? "✓ Excluded" : "Exclude"}</button>
        <button class="btn sm" data-act="save">☆ Save</button>
      </div>`;
  }
  $("#node-panel").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-act]"); if (!b) return;
    const id = S.node, a = b.dataset.act;
    if (a === "save") { toast(`Saved “${D.NODES[id].name}” to your shortlist`); return; }
    const other = a === "lock" ? "exclude" : "lock";
    S.opts[other] = S.opts[other].filter((x) => x !== id);
    S.opts[a] = S.opts[a].includes(id) ? S.opts[a].filter((x) => x !== id) : [...S.opts[a], id];
    S.sel = null; update();
  });

  // ---------- opportunities ----------
  function renderOpps() {
    const g = goalById(S.goal);
    $("#opp-goal").textContent = g.name;
    const open = S.paths.filter((p) => !p.blocked.length).slice(0, 3);
    const rows = new Map();
    open.forEach((p) => p.steps.slice(0, 2).forEach((id) => { if (!rows.has(id) || rows.get(id) < p.prob) rows.set(id, p.prob); }));
    const list = [...rows.entries()].sort((a, b) => {
      const da = D.NODES[a[0]].deadline, db = D.NODES[b[0]].deadline;
      return (/^\d/.test(db) - /^\d/.test(da)) || da.localeCompare(db);
    });
    if (!list.length) { $("#opp-table").innerHTML = `<tr><td class="muted">No open routes under the current constraints.</td></tr>`; return; }
    $("#opp-table").innerHTML = `<thead><tr><th>Opportunity</th><th>Type</th><th>Deadline</th><th>Funding</th><th>Acceptance</th><th>Best route via it</th></tr></thead><tbody>` +
      list.map(([id, prob]) => {
        const n = D.NODES[id], T = D.TYPES[n.type];
        return `<tr><td><b>${esc(n.name)}</b><br><span class="tiny">${esc(n.org)} · ${esc(n.src)}</span></td><td><span class="chip ${T.chip}">${T.label}</span></td>
          <td class="mono">${fmtDate(n.deadline)}</td><td class="small">${esc(n.funding)}</td><td class="mono">${pct(n.accept)}</td>
          <td><div style="display:flex;gap:8px;align-items:center"><div class="mini-bar" style="flex:1"><i style="width:${prob * 100}%"></i></div><span class="mono">${pct(prob)}</span></div></td></tr>`;
      }).join("") + "</tbody>";
  }
  $("#sources").innerHTML = D.SOURCES.map((s) => `<div class="src"><span>${s.name}<br><span class="tiny">${s.n.toLocaleString("en-US")} pages indexed</span></span><span class="live">updated ${s.ago} ago</span></div>`).join("");

  // ---------- mentors ----------
  function renderPeople() {
    const g = goalById(S.goal);
    const mentors = S.match.all.filter(({ p }) => p.goal === S.goal && p.success).slice(0, 4);
    const best = S.paths.find((p) => p.ti === S.sel) || S.paths[0];
    const advisors = [];
    S.paths.filter((p) => !p.blocked.length).forEach((p) => p.steps.forEach((s) => { const n = D.NODES[s]; if (n.advisor && !advisors.some((a) => a.id === s)) advisors.push({ id: s, n }); }));
    const avatar = (name, color) => `<div class="avatar" style="background:var(${color})">${esc(name.split(" ").map((w) => w[0]).join("").slice(0, 2))}</div>`;
    let html = mentors.map(({ p, sim }) => {
      const t = D.TEMPLATES[p.template];
      const shared = best ? t.steps.filter((s) => best.steps.includes(s)).length : 0;
      return `<div class="person">
        <div class="hd">${avatar(p.first + " " + p.last, goalColor(S.goal))}<div><b>${esc(p.first)} ${esc(p.last)}</b><span class="role">${esc(g.name)} · from ${esc(p.city)}</span></div></div>
        <div class="why">${pct(sim)} similar starting profile · ${esc(p.field)}, ${D.ECON[p.econ - 1].toLowerCase()} background${shared ? ` · shares ${shared} step${shared > 1 ? "s" : ""} with your selected route` : ""}</div>
        <div class="traj">${trajHTML(p)}</div>
        <button class="btn sm" data-intro="${esc(p.first)}">Request intro</button>
      </div>`;
    }).join("");
    html += advisors.slice(0, 3).map(({ n }) => `<div class="person">
        <div class="hd">${avatar(n.advisor.replace(/^(Dr\.|Prof\.)\s*/, ""), "--violet")}<div><b>${esc(n.advisor)}</b><span class="role">Advisor · ${esc(n.org.replace(/^Lab of /, "") + (n.org.startsWith("Lab") ? "'s lab" : ""))}</span></div></div>
        <div class="why">Runs <b>${esc(n.name)}</b>, which is on one of your open routes. Accepting students · deadline ${fmtDate(n.deadline)}.</div>
        <button class="btn sm" data-intro="${esc(n.advisor)}">Draft outreach email</button>
      </div>`).join("");
    $("#people").innerHTML = html || `<div class="empty">No mentors found for this goal among similar profiles yet.</div>`;
  }
  $("#people").addEventListener("click", (e) => { const b = e.target.closest("button[data-intro]"); if (b) toast(`Demo: an intro request to ${b.dataset.intro} would be sent here`); });

  // ---------- misc ----------
  let tt;
  function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(tt); tt = setTimeout(() => t.classList.remove("show"), 2600); }

  $("#hs-profiles").textContent = E.pop.length;
  $("#hs-opps").textContent = Object.keys(D.NODES).length;
  $("#hs-goals").textContent = D.GOALS.length;

  // theme
  try { const t = localStorage.getItem("path-theme"); if (t) document.documentElement.dataset.theme = t; } catch (e) {}
  $("#theme-btn").addEventListener("click", () => {
    const dark = document.documentElement.dataset.theme ? document.documentElement.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    const t = dark ? "light" : "dark";
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem("path-theme", t); } catch (e) {}
    update();
  });
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", update);
  let rt; window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(renderMap, 120); });

  // reveal + active nav
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.06 });
  $$(".reveal").forEach((el) => io.observe(el));
  const links = $$(".nav-links a");
  const nio = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) links.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id)); }), { rootMargin: "-45% 0px -50% 0px" });
  links.forEach((a) => { const s = document.querySelector(a.getAttribute("href")); s && nio.observe(s); });

  initForm();
  loadPreset(D.PRESETS[0]);
  document.fonts && document.fonts.ready.then(() => update());
})();
