/* Path — matching engine (runs in the browser on synthetic data).
   profile -> feature vector -> embedding -> k nearest profiles -> per-path success probability */
(function () {
  const D = window.PATH_DATA;
  const E = (window.PATH = {});

  E.rng = function (seed) {
    let a = seed >>> 0;
    const r = () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    r.gauss = () => { let u = 0; while (u === 0) u = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r()); };
    r.pick = (arr) => arr[Math.floor(r() * arr.length)];
    return r;
  };
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const sigmoid = (z) => 1 / (1 + Math.exp(-z));
  E.sigmoid = sigmoid;

  // ---------- features ----------
  E.features = function (p) {
    const f = {
      gpa: clamp((p.gpa - 2) / 2, 0, 1),
      experience: clamp(p.exp / 8, 0, 1),
      econ: (p.econ - 1) / 4,
      lowIncome: 1 - (p.econ - 1) / 4,
      languages: clamp((p.languages - 1) / 4, 0, 1),
      level: p.level / 4,
    };
    D.STRENGTHS.forEach((s) => (f[s.k] = clamp((p.s[s.k] || 0) / 10, 0, 1)));
    return f;
  };

  const FEAT_W = { gpa: 1, experience: 0.8, econ: 0.9, languages: 0.5, level: 0.7, research: 1, coding: 1, quant: 1, writing: 1, leadership: 0.8, entrepreneurship: 1, communication: 0.7, design: 0.7 };
  E.EMBED_KEYS = Object.keys(FEAT_W);
  E.NEAR = 150; // "similar profiles" counts are reported among this many nearest

  // "Embedding" = weighted numeric features + field / region one-hots.
  // In production this would be a text-embedding of the generated CV; here it is transparent on purpose.
  E.embed = function (p) {
    const f = E.features(p);
    const v = E.EMBED_KEYS.map((k) => f[k] * FEAT_W[k]);
    D.FIELDS.forEach((x) => v.push(p.field === x ? 0.5 : 0));
    D.REGIONS.forEach((x) => v.push(p.region === x ? 0.25 : 0));
    return v;
  };

  E.templateLogit = function (t, f) {
    let z = t.base - 1.3; // most ambitious routes succeed less often than not
    for (const k in t.w) z += t.w[k] * (f[k] - 0.5) * 2;
    return z;
  };

  E.eligible = function (nodeId, u) {
    const n = D.NODES[nodeId];
    return !n.elig || n.elig(u);
  };

  // ---------- synthetic population ----------
  const FIELD_BIAS = {
    "Computer Science": { coding: 3, quant: 2, research: 1 },
    Economics: { quant: 2, writing: 2, communication: 1 },
    Biology: { research: 3, writing: 1 },
    Engineering: { quant: 2, coding: 2, design: 1 },
    "Social Sciences": { writing: 3, communication: 2, leadership: 1 },
  };

  E.generatePopulation = function (N = 360, seed = 11) {
    const R = E.rng(seed);
    const pop = [];
    for (let i = 0; i < N; i++) {
      const field = R.pick(D.FIELDS);
      const region = R.pick(D.REGIONS);
      const econ = clamp(Math.round(1 + R() * 4.4 - 0.2), 1, 5);
      const s = {};
      D.STRENGTHS.forEach((x) => {
        s[x.k] = clamp(Math.round(4 + R.gauss() * 2 + (FIELD_BIAS[field][x.k] || 0)), 0, 10);
      });
      const p = {
        id: "P-" + (1000 + Math.floor(R() * 9000)),
        first: R.pick(D.FIRST), last: R.pick(D.LAST),
        field, region, city: R.pick(D.CITIES[region]), econ,
        gpa: clamp(+(3.25 + R.gauss() * 0.4).toFixed(2), 2.2, 4.0),
        exp: clamp(Math.round(R() * 5), 0, 8),
        languages: clamp(Math.round(1 + R() * 3.5), 1, 5),
        level: Math.floor(R() * 5),
        s,
        cohort: 2012 + Math.floor(R() * 9),
      };
      const f = E.features(p);
      // goal: field affinity + a little personality
      const gw = D.GOALS.map((g) => g.aff[field] * Math.exp(0.6 * R.gauss()));
      let gr = R() * gw.reduce((a, b) => a + b, 0), gi = 0;
      while ((gr -= gw[gi]) > 0) gi++;
      const goal = D.GOALS[gi].id;
      // template: people tend to choose paths they fit
      const ts = D.TEMPLATES.map((t, ti) => ({ t, ti })).filter((o) => o.t.goal === goal && o.t.steps.every((n) => E.eligible(n, p)));
      const tw = ts.map((o) => Math.exp(0.5 * E.templateLogit(o.t, f) + 0.7 * R.gauss()));
      let tr = R() * tw.reduce((a, b) => a + b, 0), k = 0;
      while ((tr -= tw[k]) > 0) k++;
      const { t, ti } = ts[k];
      const success = R() < sigmoid(E.templateLogit(t, f) + 0.5 * R.gauss());
      p.goal = goal; p.template = ti; p.success = success;
      // items completed in [steps..., goal]; on failure, item `reached` is where they stopped
      p.reached = success ? t.steps.length + 1 : Math.floor(R() * (t.steps.length + 1));
      p.vec = E.embed(p);
      pop.push(p);
    }
    // centre embeddings
    const dim = pop[0].vec.length;
    E.mean = Array(dim).fill(0);
    pop.forEach((p) => p.vec.forEach((v, j) => (E.mean[j] += v / N)));
    pop.forEach((p) => (p.cvec = p.vec.map((v, j) => v - E.mean[j])));
    E.pop = pop;
    E.pca();
    return pop;
  };

  const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
  const norm = (a) => Math.sqrt(dot(a, a)) || 1;
  E.centre = (vec) => vec.map((v, j) => v - E.mean[j]);
  E.cos = (a, b) => dot(a, b) / (norm(a) * norm(b));

  // 2-component PCA by power iteration, for the profile map
  E.pca = function () {
    const X = E.pop.map((p) => p.cvec), dim = X[0].length;
    const comps = [];
    for (let c = 0; c < 2; c++) {
      let v = Array.from({ length: dim }, (_, i) => Math.sin(i * 1.7 + c));
      for (let it = 0; it < 80; it++) {
        const nv = Array(dim).fill(0);
        X.forEach((x) => { const s = dot(x, v); x.forEach((xi, j) => (nv[j] += s * xi)); });
        comps.forEach((u) => { const s = dot(nv, u); nv.forEach((_, j) => (nv[j] -= s * u[j])); });
        const n = norm(nv); v = nv.map((x) => x / n);
      }
      comps.push(v);
    }
    E.comps = comps;
    E.pop.forEach((p) => (p.xy = [dot(p.cvec, comps[0]), dot(p.cvec, comps[1])]));
  };
  E.project = (cvec) => [dot(cvec, E.comps[0]), dot(cvec, E.comps[1])];

  // ---------- matching ----------
  E.match = function (user, K) {
    const cvec = E.centre(E.embed(user));
    const scored = E.pop.map((p) => {
      const c = E.cos(cvec, p.cvec);
      return { p, sim: (c + 1) / 2 };
    }).sort((a, b) => b.sim - a.sim);
    const nb = scored.slice(0, K);
    nb.forEach((n) => (n.w = Math.pow(n.sim, 10)));
    return { cvec, xy: E.project(cvec), neighbours: nb, all: scored };
  };

  // Success probability for each path toward `goal`:
  // Bayesian blend of (a) weighted outcomes of similar profiles who took that path and
  // (b) a prior from the path's fit to the user's features.
  E.paths = function (user, goal, match, opts) {
    const f = E.features(user);
    const ALPHA = 3;
    const out = [];
    D.TEMPLATES.forEach((t, ti) => {
      if (t.goal !== goal) return;
      const prior = sigmoid(E.templateLogit(t, f));
      let sw = 0, ss = 0, n = 0;
      match.neighbours.forEach(({ p, w }) => {
        if (p.template !== ti) return;
        sw += w; ss += w * (p.success ? 1 : 0);
      });
      match.all.slice(0, E.NEAR).forEach(({ p }) => { if (p.template === ti) n++; });
      // the full population also informs the path, at lower weight
      let pw = 0, ps = 0;
      match.all.forEach(({ p, sim }) => { if (p.template === ti) { const w = Math.pow(sim, 10) * 0.08; pw += w; ps += w * (p.success ? 1 : 0); } });
      const neff = sw + pw;
      const prob = (ss + ps + ALPHA * prior) / (neff + ALPHA);
      const se = Math.sqrt(prob * (1 - prob) / (neff + ALPHA));
      const months = t.steps.reduce((a, s) => a + D.NODES[s].months, 0);
      const cost = Math.max(...t.steps.map((s) => D.NODES[s].cost));
      const reasons = [];
      const ineligible = t.steps.filter((s) => !E.eligible(s, user));
      if (ineligible.length) reasons.push("not eligible: " + ineligible.map((s) => D.NODES[s].name).join(", "));
      if (opts.funded && cost >= 2) reasons.push("includes unfunded tuition");
      if (!opts.relocate && t.steps.some((s) => D.NODES[s].abroad)) reasons.push("requires relocating");
      if (months / 12 > opts.horizon) reasons.push(`takes ${(months / 12).toFixed(1)} yrs > horizon`);
      if (opts.exclude.some((x) => t.steps.includes(x))) reasons.push("contains an excluded step");
      if (opts.lock.some((x) => !t.steps.includes(x))) reasons.push("misses a required step");
      out.push({ ti, t, steps: t.steps, prob, lo: Math.max(0, prob - 1.28 * se), hi: Math.min(1, prob + 1.28 * se), n, neff, prior, months, cost, blocked: reasons });
    });
    out.sort((a, b) => (a.blocked.length > 0) - (b.blocked.length > 0) || b.prob - a.prob);
    return out;
  };
})();
