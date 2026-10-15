/* Biểu đồ SVG thuần (không cần thư viện): donut, cột nhóm, đường, thanh ngang. */
(function (G) {
  "use strict";
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  /** Trả về {max, step} sao cho trục chia thành ≤ 5 khoảng với số nguyên đẹp. */
  function scale(m) {
    if (m <= 4) return { max: 4, step: 1 };
    const raw = m / 4, p = 10 ** Math.floor(Math.log10(raw)), n = raw / p;
    const step = (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
    return { max: step * Math.ceil(m / step), step };
  }
  function gridLines(max, step, L, W, Rr, T, ih) {
    let g = "";
    for (let v = 0; v <= max + 1e-9; v += step) {
      const y = T + ih - (ih * v) / max;
      g += `<line x1="${L}" x2="${W - Rr}" y1="${y}" y2="${y}" class="grid"/><text x="${L - 6}" y="${y + 4}" text-anchor="end" class="ax">${v}</text>`;
    }
    return g;
  }

  function donut(items, centerLabel) { // items: [label, value, color]
    const total = items.reduce((a, b) => a + b[1], 0);
    const R = 62, r = 40, cx = 80, cy = 80;
    let a0 = -Math.PI / 2, paths = "";
    if (!total) paths = `<circle cx="${cx}" cy="${cy}" r="${(R + r) / 2}" fill="none" stroke="#EEE9DC" stroke-width="${R - r}"/>`;
    items.forEach(([l, v, c]) => {
      if (!v) return;
      const a1 = a0 + (v / total) * Math.PI * 2 - (items.filter((i) => i[1]).length > 1 ? 0.02 : 0);
      if (v === total) { paths += `<circle cx="${cx}" cy="${cy}" r="${(R + r) / 2}" fill="none" stroke="${c}" stroke-width="${R - r}"/>`; return; }
      const p = (rad, a) => [cx + rad * Math.cos(a), cy + rad * Math.sin(a)];
      const [x0, y0] = p(R, a0), [x1, y1] = p(R, a1), [x2, y2] = p(r, a1), [x3, y3] = p(r, a0);
      const big = a1 - a0 > Math.PI ? 1 : 0;
      paths += `<path d="M${x0} ${y0} A${R} ${R} 0 ${big} 1 ${x1} ${y1} L${x2} ${y2} A${r} ${r} 0 ${big} 0 ${x3} ${y3}Z" fill="${c}"><title>${esc(l)}: ${v}</title></path>`;
      a0 += (v / total) * Math.PI * 2;
    });
    const legend = items.map(([l, v, c]) => `<li><i style="background:${c}"></i><span>${esc(l)}</span><b>${v}</b></li>`).join("");
    return `<div class="donut"><svg viewBox="0 0 160 160" role="img" aria-label="Biểu đồ trạng thái">${paths}
      <text x="80" y="78" text-anchor="middle" class="d-num">${total}</text><text x="80" y="96" text-anchor="middle" class="d-lbl">${esc(centerLabel || "công việc")}</text></svg>
      <ul class="legend">${legend}</ul></div>`;
  }

  function bars(cats, series) { // series: [name, color, values[]]
    const W = 560, H = 220, L = 34, B = 26, T = 10, Rr = 8;
    const { max, step } = scale(Math.max(1, ...series.flatMap((s) => s[2])));
    const iw = W - L - Rr, ih = H - T - B, gw = iw / cats.length;
    const bw = Math.min(16, (gw * 0.7) / series.length);
    let g = gridLines(max, step, L, W, Rr, T, ih);
    cats.forEach((c, i) => {
      const x0 = L + gw * i + (gw - bw * series.length) / 2;
      series.forEach(([n, col, vals], j) => {
        const h = (vals[i] / max) * ih;
        g += `<rect x="${x0 + j * bw}" y="${T + ih - h}" width="${bw - 2}" height="${h}" rx="3" fill="${col}"><title>${esc(n)} ${esc(c)}: ${vals[i]}</title></rect>`;
      });
      g += `<text x="${L + gw * i + gw / 2}" y="${H - 8}" text-anchor="middle" class="ax">${esc(c)}</text>`;
    });
    return `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img">${g}</svg>${legendRow(series)}`;
  }

  function line(cats, series) {
    const W = 560, H = 220, L = 34, B = 26, T = 12, Rr = 14;
    const { max, step: ystep } = scale(Math.max(1, ...series.flatMap((s) => s[2])));
    const iw = W - L - Rr, ih = H - T - B, step = cats.length > 1 ? iw / (cats.length - 1) : 0;
    let g = gridLines(max, ystep, L, W, Rr, T, ih);
    cats.forEach((c, i) => { g += `<text x="${L + step * i}" y="${H - 8}" text-anchor="middle" class="ax">${esc(c)}</text>`; });
    series.forEach(([n, col, vals]) => {
      const pts = vals.map((v, i) => [L + step * i, T + ih - (v / max) * ih]);
      g += `<polyline points="${pts.map((p) => p.join(",")).join(" ")}" fill="none" stroke="${col}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>`;
      pts.forEach((p, i) => { g += `<circle cx="${p[0]}" cy="${p[1]}" r="3.6" fill="#fff" stroke="${col}" stroke-width="2"><title>${esc(n)} ${esc(cats[i])}: ${vals[i]}</title></circle>`; });
    });
    return `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img">${g}</svg>${legendRow(series)}`;
  }

  function hbars(items, color) { // items: [label, value]
    if (!items.length) return `<p class="muted">Chưa có dữ liệu.</p>`;
    const max = Math.max(...items.map((i) => i[1]));
    return `<div class="hbars">${items.sort((a, b) => b[1] - a[1]).map(([l, v]) =>
      `<div class="hb"><span class="hb-l" title="${esc(l)}">${esc(l)}</span><span class="hb-t"><span style="width:${(v / max) * 100}%;background:${color || "#C8102E"}"></span></span><b>${v}</b></div>`).join("")}</div>`;
  }
  const legendRow = (series) => `<div class="legend-row">${series.map(([n, c]) => `<span><i style="background:${c}"></i>${esc(n)}</span>`).join("")}</div>`;

  G.Charts = { donut, bars, line, hbars, esc };
})(window);
