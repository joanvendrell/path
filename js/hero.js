/* Hero: a field of opportunities; the route through the point nearest the cursor lights up */
(function () {
  const canvas = document.getElementById("hero-canvas");
  if (!canvas) return;
  const hero = canvas.parentElement;
  const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const alpha = (c, a) => {
    const n = parseInt(c.replace("#", ""), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  };
  const R = window.PATH.rng(5);
  const typeColors = ["--accent", "--amber", "--teal", "--violet", "--sky"];
  let W = 0, H = 0, cols = [], nodes = [];
  const mouse = { x: -1e4, y: -1e4, t: -1e9 };
  let path = [], pathT = 0;

  function init() {
    W = canvas.clientWidth; H = hero.clientHeight;
    const C = Math.max(5, Math.min(9, Math.round(W / 170)));
    nodes = []; cols = [];
    for (let c = 0; c < C; c++) {
      const n = c === 0 || c === C - 1 ? 3 : 4 + Math.floor(R() * 3);
      const col = [];
      for (let i = 0; i < n; i++) {
        const nd = {
          c, x: (W * (c + 0.5)) / C + (R() - 0.5) * 40, y: (H * (i + 0.5)) / n + (R() - 0.5) * 50,
          ph: R() * 6.28, col: typeColors[Math.floor(R() * typeColors.length)], next: [], prev: [], e: 0,
        };
        col.push(nd); nodes.push(nd);
      }
      cols.push(col);
    }
    for (let c = 0; c < C - 1; c++) {
      cols[c].forEach((a) => {
        const sorted = cols[c + 1].slice().sort((p, q) => Math.abs(p.y - a.y) - Math.abs(q.y - a.y));
        const k = 1 + Math.floor(R() * 2);
        sorted.slice(0, k).forEach((b) => { a.next.push(b); b.prev.push(a); });
      });
      cols[c + 1].forEach((b) => { if (!b.prev.length) { const a = cols[c][Math.floor(R() * cols[c].length)]; a.next.push(b); b.prev.push(a); } });
    }
  }

  function routeThrough(nd) {
    const back = [];
    let cur = nd;
    while (cur.prev.length) { cur = cur.prev.reduce((a, b) => (Math.abs(b.y - nd.y) < Math.abs(a.y - nd.y) ? b : a)); back.unshift(cur); }
    const fwd = [];
    cur = nd;
    while (cur.next.length) { cur = cur.next.reduce((a, b) => (Math.abs(b.y - nd.y) < Math.abs(a.y - nd.y) ? b : a)); fwd.push(cur); }
    return [...back, nd, ...fwd];
  }

  hero.addEventListener("pointermove", (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; mouse.t = performance.now();
  });
  hero.addEventListener("pointerleave", () => { mouse.t = -1e9; });

  let last = null;
  function frame(t) {
    const dpr = window.devicePixelRatio || 1;
    if (!nodes.length || Math.abs(canvas.clientWidth - W) > 2 || Math.abs(hero.clientHeight - H) > 2) init();
    if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) { canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); }
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    let cx = mouse.x, cy = mouse.y;
    if (t - mouse.t > 3000) { cx = W * (0.55 + 0.35 * Math.sin(t / 6100)); cy = H * (0.5 + 0.3 * Math.sin(t / 4300 + 1)); }
    const pos = (n) => [n.x + Math.sin(t / 1900 + n.ph) * 6, n.y + Math.cos(t / 2300 + n.ph) * 6];
    let best = nodes[0], bd = Infinity;
    nodes.forEach((n) => { const [x, y] = pos(n); const d = Math.hypot(x - cx, y - cy); if (d < bd) { bd = d; best = n; } });
    if (best !== last) { last = best; path = routeThrough(best); pathT = t; }
    const onPath = new Set(path);

    const line = css("--ink-3"), acc = css("--accent");
    ctx.lineWidth = 1;
    nodes.forEach((a) => a.next.forEach((b) => {
      const [x1, y1] = pos(a), [x2, y2] = pos(b);
      ctx.strokeStyle = alpha(line, 0.18);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.bezierCurveTo((x1 + x2) / 2, y1, (x1 + x2) / 2, y2, x2, y2); ctx.stroke();
    }));
    // highlighted route, drawn progressively
    const prog = Math.min(1, (t - pathT) / 900) * (path.length - 1);
    ctx.lineWidth = 2.4; ctx.strokeStyle = alpha(acc, 0.85);
    for (let i = 0; i < path.length - 1; i++) {
      const f = Math.max(0, Math.min(1, prog - i));
      if (f <= 0) break;
      const [x1, y1] = pos(path[i]), [x2, y2] = pos(path[i + 1]);
      ctx.beginPath();
      const N = 24;
      for (let s = 0; s <= N * f; s++) {
        const u = s / N, mx = (x1 + x2) / 2;
        const bx = (1 - u) ** 3 * x1 + 3 * (1 - u) ** 2 * u * mx + 3 * (1 - u) * u * u * mx + u ** 3 * x2;
        const by = (1 - u) ** 3 * y1 + 3 * (1 - u) ** 2 * u * y1 + 3 * (1 - u) * u * u * y2 + u ** 3 * y2;
        s ? ctx.lineTo(bx, by) : ctx.moveTo(bx, by);
      }
      ctx.stroke();
    }
    nodes.forEach((n) => {
      n.e += ((onPath.has(n) ? 1 : 0) - n.e) * 0.08;
      const [x, y] = pos(n);
      const c = css(n.col);
      ctx.fillStyle = n.e > 0.1 ? alpha(c, 0.4 + 0.6 * n.e) : alpha(line, 0.4);
      ctx.beginPath(); ctx.arc(x, y, 3.5 + n.e * 3.5, 0, 6.283); ctx.fill();
      if (n.e > 0.5) { ctx.strokeStyle = alpha(c, 0.35 * n.e); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, 10 + n.e * 3, 0, 6.283); ctx.stroke(); }
    });
  }

  let on = false, raf = 0;
  const tick = (t) => { if (!on) return; frame(t); raf = requestAnimationFrame(tick); };
  new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting && !on) { on = true; raf = requestAnimationFrame(tick); }
    else if (!e.isIntersecting && on) { on = false; cancelAnimationFrame(raf); }
  })).observe(canvas);
  window.addEventListener("resize", () => { nodes = []; });
})();
