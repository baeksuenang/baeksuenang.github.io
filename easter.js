/* 이스터 에그: 관심 분야 키워드에 마우스를 올리면 작은 애니메이션이 뜸.
   키워드 <li data-anim="..."> 와 아래 ANIMS 의 이름이 연결됨. 캔버스 크기 W x H. */
(function () {
  const W = 220, H = 130;
  const C = { k: "#1d2327", m: "#6a737b", l: "#e3e6e8", a: "#fc9d0d", d: "#a85f00", s: "#fff3e0" };
  const FONT = '"Outfit", system-ui, sans-serif';

  // ---------- 그리기 도구 ----------
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = u => u * u * (3 - 2 * u);
  const lerp = (a, b, u) => a + (b - a) * u;
  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function circle(ctx, x, y, r, fill, stroke, lw = 1.5) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
  }
  function text(ctx, s, x, y, size = 11, color = C.k, weight = 600, align = "center") {
    ctx.font = `${weight} ${size}px ${FONT}`; ctx.fillStyle = color;
    ctx.textAlign = align; ctx.textBaseline = "middle"; ctx.fillText(s, x, y);
  }
  // a에서 b로 가는 화살표 (양 끝을 ra, rb 만큼 줄임)
  function arrow(ctx, ax, ay, bx, by, color, lw = 1.3, ra = 0, rb = 0, dash) {
    const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
    const x1 = ax + ux * ra, y1 = ay + uy * ra, x2 = bx - ux * rb, y2 = by - uy * rb;
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = lw;
    ctx.setLineDash(dash || []);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - ux * 5, y2 - uy * 5); ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - ux * 7 - uy * 3.5, y2 - uy * 7 + ux * 3.5);
    ctx.lineTo(x2 - ux * 7 + uy * 3.5, y2 - uy * 7 - ux * 3.5); ctx.closePath(); ctx.fill();
    return [x1, y1, x2, y2];
  }
  function rng(seed) { // 항상 같은 난수 (매번 같은 모양)
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function gauss(r) { return Math.sqrt(-2 * Math.log(r() + 1e-9)) * Math.cos(2 * Math.PI * r()); }

  // ---------- 1. Video VLM: 영상 프레임 → 패치로 자르기 → LLM에 쏙 ----------
  function vlm(ctx, t) {
    const P = 2.8, p = (t % P) / P;
    const bx = 150, by = 30, bw = 58, bh = 60;           // LLM 상자
    const fy = 42, fw = 54, fh = 42, pw = 18, ph = 14;   // 프레임
    const fx = 16 + (p < 0.22 ? -80 * (1 - ease(p / 0.22)) : 0);
    const pal = [C.s, C.s, C.a, C.s, C.k, C.s, C.k, C.k, C.k]; // 해 + 산 그림
    const mouth = [bx + 6, by + bh / 2];

    // 점선 경로
    ctx.setLineDash([3, 4]); ctx.strokeStyle = C.l; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(78, fy + fh / 2); ctx.lineTo(bx - 4, fy + fh / 2); ctx.stroke(); ctx.setLineDash([]);

    // 필름 띠 (자르기 전까지)
    const filmA = p < 0.25 ? 1 : 1 - clamp((p - 0.25) / 0.12);
    if (filmA > 0) {
      ctx.globalAlpha = filmA;
      ctx.fillStyle = C.k; ctx.fillRect(fx - 6, fy - 11, fw + 12, fh + 22);
      ctx.fillStyle = "#fff";
      for (let i = 0; i < 6; i++) { ctx.fillRect(fx - 3 + i * 10, fy - 8, 5, 4); ctx.fillRect(fx - 3 + i * 10, fy + fh + 4, 5, 4); }
      ctx.globalAlpha = 1;
    }
    // 패치
    const gap = p < 0.25 ? 0 : 4 * ease(clamp((p - 0.25) / 0.13));
    let arrived = 0;
    for (let i = 0; i < 9; i++) {
      const r = Math.floor(i / 3), c = i % 3;
      const hx = fx + c * pw + (c - 1) * gap, hy = fy + r * ph + (r - 1) * gap;
      const s = 0.4 + i * 0.04, q = clamp((p - s) / 0.13);
      if (q >= 1) { arrived++; continue; }
      const e = ease(q);
      const x = lerp(hx, mouth[0] - pw / 2, e), y = lerp(hy, mouth[1] - ph / 2, e) - 26 * Math.sin(Math.PI * e);
      const sc = 1 - 0.6 * e;
      ctx.fillStyle = pal[i]; ctx.fillRect(x, y, pw * sc, ph * sc);
      ctx.strokeStyle = C.d; ctx.lineWidth = gap > 0 ? 1 : 0.4; ctx.strokeRect(x, y, pw * sc, ph * sc);
    }
    // LLM 상자 (먹을 때 꿀꺽)
    const g = p > 0.42 && p < 0.92 ? 0.06 * Math.max(0, Math.sin(((p - 0.42) / 0.04) * Math.PI)) : 0;
    ctx.save(); ctx.translate(bx + bw / 2, by + bh / 2); ctx.scale(1 + g, 1 + g);
    rr(ctx, -bw / 2, -bh / 2, bw, bh, 12); ctx.fillStyle = C.s; ctx.fill();
    ctx.strokeStyle = C.a; ctx.lineWidth = 2; ctx.stroke();
    text(ctx, "LLM", 0, 0, 14, C.d, 600);
    ctx.restore();
    // 들어간 토큰 수
    for (let i = 0; i < 9; i++) {
      ctx.fillStyle = i < arrived ? C.a : C.l;
      ctx.fillRect(bx + 2 + i * 6, by + bh + 10, 4, 4);
    }
  }

  // ---------- 2. Machine Learning: 퍼셉트론 ----------
  function ml(ctx, t) {
    const ins = [[26, 26], [26, 65], [26, 104]], S = [114, 65], A = [162, 65], O = [204, 65];
    const q = (t / 2.2) % 1;
    ins.forEach(([x, y], i) => {
      const w = Math.sin(t * 1.2 + i * 2.1);
      ctx.strokeStyle = w > 0 ? C.a : C.m; ctx.lineWidth = 0.8 + 2.6 * Math.abs(w);
      ctx.setLineDash(w > 0 ? [] : [3, 3]);
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(S[0], S[1]); ctx.stroke(); ctx.setLineDash([]);
      text(ctx, "w" + (i + 1), lerp(x, S[0], 0.45), lerp(y, S[1], 0.45) - 8, 9, C.m, 500);
      if (q < 0.5) { const u = q / 0.5; circle(ctx, lerp(x, S[0], u), lerp(y, S[1], u), 3, C.d); }
    });
    ctx.strokeStyle = C.k; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(S[0] + 15, S[1]); ctx.lineTo(A[0] - 13, A[1]); ctx.moveTo(A[0] + 13, A[1]); ctx.lineTo(O[0] - 10, O[1]); ctx.stroke();
    if (q >= 0.5 && q < 0.75) { const u = (q - 0.5) / 0.25; circle(ctx, lerp(S[0] + 15, A[0] - 13, u), S[1], 3, C.d); }
    if (q >= 0.75 && q < 0.92) { const u = (q - 0.75) / 0.17; circle(ctx, lerp(A[0] + 13, O[0] - 10, u), S[1], 3, C.d); }
    ins.forEach(([x, y], i) => { circle(ctx, x, y, 10, "#fff", C.k); text(ctx, "x" + (i + 1), x, y + 1, 10, C.k, 500); });
    circle(ctx, S[0], S[1], 15, "#fff", C.k, 1.6); text(ctx, "Σ", S[0], S[1] + 1, 15, C.k, 600);
    // 활성 함수 (계단)
    rr(ctx, A[0] - 13, A[1] - 12, 26, 24, 4); ctx.fillStyle = "#fff"; ctx.fill(); ctx.strokeStyle = C.k; ctx.lineWidth = 1.4; ctx.stroke();
    ctx.strokeStyle = C.a; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(A[0] - 9, A[1] + 6); ctx.lineTo(A[0], A[1] + 6); ctx.lineTo(A[0], A[1] - 6); ctx.lineTo(A[0] + 9, A[1] - 6); ctx.stroke();
    const on = q >= 0.9;
    circle(ctx, O[0], O[1], 10, on ? C.a : "#fff", on ? C.a : C.k); text(ctx, "y", O[0], O[1] + 1, 10, on ? "#fff" : C.k, 600);
  }

  // ---------- 3. NLP: BERT (양방향 인코더, [MASK] 맞히기) ----------
  function nlp(ctx, t) {
    const xs = [32, 84, 136, 188], toks = ["[CLS]", "I", "[MASK]", "AI"], bw = 44;
    const p = (t % 3.4) / 3.4;
    // 인코더 층 (겹쳐진 상자)
    for (let k = 2; k >= 0; k--) {
      rr(ctx, 8 + k * 3, 40 - k * 3, 204, 46, 8);
      ctx.fillStyle = k ? "#fff" : C.s; ctx.fill(); ctx.strokeStyle = k ? C.l : C.a; ctx.lineWidth = 1.3; ctx.stroke();
    }
    text(ctx, "Transformer Encoder", 110, 51, 9.5, C.d, 600);
    // 양방향 어텐션
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) {
      ctx.globalAlpha = 0.15 + 0.6 * (0.5 + 0.5 * Math.sin(t * 2.4 + i * 1.3 + j * 0.9));
      ctx.strokeStyle = C.a; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(xs[i], 80); ctx.quadraticCurveTo((xs[i] + xs[j]) / 2, 80 - 10 - (j - i) * 6, xs[j], 80); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // 입력 토큰 → 인코더 → 출력
    const up = (t * 0.9) % 1;
    xs.forEach((x, i) => {
      rr(ctx, x - bw / 2, 106, bw, 18, 4); ctx.fillStyle = "#fff"; ctx.fill(); ctx.strokeStyle = C.m; ctx.lineWidth = 1; ctx.stroke();
      text(ctx, toks[i], x, 115.5, 9, i === 2 ? C.d : C.k, i === 2 ? 600 : 500);
      ctx.strokeStyle = C.m; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, 105); ctx.lineTo(x, 88); ctx.moveTo(x, 37); ctx.lineTo(x, 28); ctx.stroke();
      circle(ctx, x, lerp(104, 89, up), 1.8, C.d);
      const isMask = i === 2, reveal = isMask && p > 0.45;
      rr(ctx, x - bw / 2, 8, bw, 18, 4);
      ctx.fillStyle = reveal ? C.a : "#fff"; ctx.fill();
      ctx.strokeStyle = isMask ? C.a : C.m; ctx.lineWidth = 1; ctx.stroke();
      const out = isMask ? (reveal ? "love" : "?") : ["C", "T₁", "", "T₃"][i];
      text(ctx, out, x, 17.5, 9.5, reveal ? "#fff" : isMask ? C.d : C.m, 600);
    });
  }

  // ---------- 4. Diffusion: 데이터 ⇄ 2차원 가우시안 ----------
  const DIFF = (() => {
    const r = rng(7), pts = [];
    for (let i = 0; i < 160; i++) {
      const th = 1.5 * Math.PI + 3 * Math.PI * (i / 160 + r() * 0.01);
      const rad = (th / (4.5 * Math.PI)) * 1.75;
      pts.push([rad * Math.cos(th) + gauss(r) * 0.04, rad * Math.sin(th) + gauss(r) * 0.04, gauss(r), gauss(r)]);
    }
    return pts;
  })();
  function diff(ctx, t) {
    // 데이터(나선) 잠깐 보여줌 → 노이즈 추가 → 가우시안에서 잠깐 멈춤 → 노이즈 제거
    const T = 6, ph = (t % T) / T;
    const s = ph < 0.15 ? 0 : ph < 0.5 ? ease((ph - 0.15) / 0.35) : ph < 0.65 ? 1 : 1 - ease((ph - 0.65) / 0.35);
    const ab = 1 - 0.998 * s * s; // 노이즈가 천천히 시작되도록
    const cx = 110, cy = 60, k = 22;
    ctx.strokeStyle = C.l; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx - 100, cy); ctx.lineTo(cx + 100, cy); ctx.moveTo(cx, cy - 56); ctx.lineTo(cx, cy + 56); ctx.stroke();
    ctx.globalAlpha = 0.85 * s; ctx.setLineDash([3, 3]); ctx.strokeStyle = C.d;
    [1, 2].forEach(n => { ctx.beginPath(); ctx.arc(cx, cy, k * n, 0, Math.PI * 2); ctx.stroke(); });
    ctx.setLineDash([]); ctx.globalAlpha = 1;
    ctx.fillStyle = C.a;
    DIFF.forEach(([x0, y0, ex, ey]) => {
      const x = Math.sqrt(ab) * x0 + Math.sqrt(1 - ab) * ex, y = Math.sqrt(ab) * y0 + Math.sqrt(1 - ab) * ey;
      ctx.beginPath(); ctx.arc(cx + k * x, cy - k * y, 1.7, 0, Math.PI * 2); ctx.fill();
    });
    const fwd = ph < 0.5;
    text(ctx, fwd ? "adding noise →" : "← denoising", 6, 124, 9.5, C.m, 500, "left");
    ctx.fillStyle = C.l; ctx.fillRect(150, 121, 64, 5);
    ctx.fillStyle = C.a; ctx.fillRect(150, 121, 64 * s, 5);
    text(ctx, "t", 144, 123.5, 9, C.m, 600);
  }

  // ---------- 5. Geometric Algorithms: 3차원 볼록 껍질 ----------
  const HULL = (() => {
    const r = rng(11), P = [];
    for (let i = 0; i < 12; i++) {
      const z = 2 * r() - 1, a = 2 * Math.PI * r(), q = Math.sqrt(1 - z * z), R = 0.85 + 0.15 * r();
      P.push([R * q * Math.cos(a), R * z, R * q * Math.sin(a)]);
    }
    for (let i = 0; i < 8; i++) {
      const R = 0.5 * r(), z = 2 * r() - 1, a = 2 * Math.PI * r(), q = Math.sqrt(1 - z * z);
      P.push([R * q * Math.cos(a), R * z, R * q * Math.sin(a)]);
    }
    const sub = (u, v) => [u[0] - v[0], u[1] - v[1], u[2] - v[2]];
    const cross = (u, v) => [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const dot = (u, v) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
    const F = [];
    for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) for (let k = j + 1; k < P.length; k++) {
      const n = cross(sub(P[j], P[i]), sub(P[k], P[i]));
      if (Math.hypot(...n) < 1e-9) continue;
      let pos = 0, neg = 0;
      for (let l = 0; l < P.length; l++) {
        if (l === i || l === j || l === k) continue;
        const d = dot(n, sub(P[l], P[i]));
        if (d > 1e-9) pos++; else if (d < -1e-9) neg++;
      }
      if (pos === 0) F.push([i, j, k, n]); else if (neg === 0) F.push([i, j, k, n.map(v => -v)]);
    }
    F.sort((a, b) => (P[a[0]][1] + P[a[1]][1] + P[a[2]][1]) - (P[b[0]][1] + P[b[1]][1] + P[b[2]][1]));
    const onHull = new Set(F.flatMap(f => f.slice(0, 3)));
    return { P, F, onHull };
  })();
  function geo(ctx, t) {
    const a = t * 0.7, b = 0.4, k = 46, cx = 110, cy = 60;
    const rot = ([x, y, z]) => {
      const x1 = x * Math.cos(a) + z * Math.sin(a), z1 = -x * Math.sin(a) + z * Math.cos(a);
      return [x1, y * Math.cos(b) - z1 * Math.sin(b), y * Math.sin(b) + z1 * Math.cos(b)];
    };
    const R = HULL.P.map(rot), pr = v => [cx + k * v[0], cy - k * v[1]];
    const cyc = 8, shown = Math.floor(HULL.F.length * clamp((t % cyc) / (cyc * 0.5)));
    const faces = HULL.F.slice(0, shown).map(f => ({ f, front: rot(f[3])[2] > 0 }));
    // 뒷면 → 앞면 순서
    [false, true].forEach(front => faces.filter(o => o.front === front).forEach(({ f }) => {
      const [p, q, r] = [pr(R[f[0]]), pr(R[f[1]]), pr(R[f[2]])];
      ctx.beginPath(); ctx.moveTo(...p); ctx.lineTo(...q); ctx.lineTo(...r); ctx.closePath();
      if (front) { ctx.fillStyle = "rgba(252,157,13,.18)"; ctx.fill(); ctx.strokeStyle = C.k; ctx.lineWidth = 1.1; ctx.setLineDash([]); }
      else { ctx.strokeStyle = C.m; ctx.lineWidth = 0.8; ctx.setLineDash([2, 3]); }
      ctx.stroke(); ctx.setLineDash([]);
    }));
    R.forEach((v, i) => {
      const [x, y] = pr(v), h = HULL.onHull.has(i);
      circle(ctx, x, y, h ? 2.6 : 1.8, h ? C.a : C.m);
    });
    text(ctx, `faces ${shown}/${HULL.F.length}`, 214, 124, 9, C.m, 500, "right");
  }

  // ---------- 6. Causal Inference: 근접 인과추론 그래프 ----------
  function causal(ctx, t) {
    const N = { U: [110, 20], Z: [28, 64], W: [192, 64], A: [72, 108], Y: [148, 108] }, r = 12;
    const E = [["U", "Z"], ["U", "W"], ["U", "A"], ["U", "Y"], ["Z", "A"], ["W", "Y"], ["A", "Y"]];
    E.forEach(([u, v], i) => {
      const main = u === "A" && v === "Y", hidden = u === "U";
      const [x1, y1, x2, y2] = arrow(ctx, ...N[u], ...N[v], main ? C.a : hidden ? C.m : C.k, main ? 2.6 : 1.2, r + 1, r + 2, hidden ? [3, 3] : null);
      const q = (t * 0.55 + i * 0.19) % 1;
      circle(ctx, lerp(x1, x2, q), lerp(y1, y2, q), main ? 3 : 2, main ? C.d : C.m);
    });
    Object.entries(N).forEach(([n, [x, y]]) => {
      const hid = n === "U", key = n === "A" || n === "Y";
      ctx.setLineDash(hid ? [3, 3] : []);
      circle(ctx, x, y, r, key ? C.s : "#fff", hid ? C.m : key ? C.a : C.k, 1.6);
      ctx.setLineDash([]);
      text(ctx, n, x, y + 1, 11, hid ? C.m : C.k, 600);
    });
  }

  // ---------- 7. Generative AI: NeRF (여러 장의 2D 사진 → 3D) ----------
  const CUBE = (() => {
    const V = [];
    for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) V.push([x, y, z]);
    const E = [];
    for (let i = 0; i < 8; i++) for (let j = i + 1; j < 8; j++) {
      const d = V[i].reduce((s, v, k) => s + (v !== V[j][k]), 0); if (d === 1) E.push([i, j]);
    }
    const F = [[0, 1, 3, 2, [-1, 0, 0]], [4, 5, 7, 6, [1, 0, 0]], [0, 1, 5, 4, [0, -1, 0]],
               [2, 3, 7, 6, [0, 1, 0]], [0, 2, 6, 4, [0, 0, -1]], [1, 3, 7, 5, [0, 0, 1]]];
    const r = rng(5), D = [];
    for (let i = 0; i < 110; i++) D.push([(2 * r() - 1) * 0.62, (2 * r() - 1) * 0.62, (2 * r() - 1) * 0.62]);
    return { V, E, F, D };
  })();
  function rot3(v, a, b) {
    const x1 = v[0] * Math.cos(a) + v[2] * Math.sin(a), z1 = -v[0] * Math.sin(a) + v[2] * Math.cos(a);
    return [x1, v[1] * Math.cos(b) - z1 * Math.sin(b), v[1] * Math.sin(b) + z1 * Math.cos(b)];
  }
  // 음영 있는 정육면체 (s: 크기 배율)
  function solidCube(ctx, cx, cy, k, a, b, s, alpha = 1) {
    const L = [-0.45, 0.6, 0.66];
    ctx.globalAlpha = alpha;
    CUBE.F.forEach(([i, j, m, n, nor]) => {
      const N = rot3(nor, a, b); if (N[2] <= 0) return;
      const lit = clamp(0.35 + 0.65 * (N[0] * L[0] + N[1] * L[1] + N[2] * L[2]));
      const col = [lerp(168, 255, lit), lerp(95, 214, lit), lerp(0, 150, lit)].map(Math.round);
      ctx.beginPath();
      [i, j, m, n].forEach((q, idx) => {
        const v = rot3(CUBE.V[q].map(c => c * s), a, b);
        ctx[idx ? "lineTo" : "moveTo"](cx + k * v[0], cy - k * v[1]);
      });
      ctx.closePath(); ctx.fillStyle = `rgb(${col})`; ctx.fill();
      ctx.strokeStyle = C.k; ctx.lineWidth = 0.9; ctx.stroke();
    });
    ctx.globalAlpha = 1;
  }
  function nerf(ctx, t) {
    const P = 4.4, p = (t % P) / P, a = t * 0.8, b = 0.45;
    const fade = p > 0.93 ? 1 - (p - 0.93) / 0.07 : 1;
    const views = [[30, 24, 0.35], [30, 63, 1.4], [30, 102, 2.6]];  // 서로 다른 각도에서 찍은 2D 사진
    const M = [97, 63], O = [176, 63];
    ctx.globalAlpha = fade;
    // 1) 2D 사진들
    views.forEach(([x, y, ang], i) => {
      const on = clamp((p - i * 0.05) / 0.08);
      ctx.globalAlpha = fade * on;
      ctx.fillStyle = "#fff"; ctx.fillRect(x - 19, y - 14, 38, 28);
      ctx.strokeStyle = C.k; ctx.lineWidth = 1.2; ctx.strokeRect(x - 19, y - 14, 38, 28);
      solidCube(ctx, x, y + 1, 7, ang, 0.4, 1, fade * on);
    });
    ctx.globalAlpha = fade;
    // 2) 광선 → MLP
    const q = clamp((p - 0.18) / 0.3);
    views.forEach(([x, y]) => {
      ctx.strokeStyle = C.l; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x + 20, y); ctx.lineTo(M[0] - 26, M[1]); ctx.stroke();
      if (q > 0 && q < 1) for (let j = 0; j < 3; j++) {
        const u = (q * 2.5 + j / 3) % 1;
        circle(ctx, lerp(x + 20, M[0] - 26, u), lerp(y, M[1], u), 2, C.a);
      }
    });
    rr(ctx, M[0] - 25, M[1] - 17, 50, 34, 7); ctx.fillStyle = C.s; ctx.fill();
    ctx.strokeStyle = C.a; ctx.lineWidth = 1.6 + (q > 0 && q < 1 ? Math.sin(t * 14) * 0.6 : 0); ctx.stroke();
    text(ctx, "NeRF", M[0], M[1] - 6, 11, C.d, 600);
    text(ctx, "(x,d)→(c,σ)", M[0], M[1] + 8, 7.5, C.d, 500);
    // 3) 볼륨 렌더링 → 3D
    const r2 = clamp((p - 0.42) / 0.25);
    arrow(ctx, M[0] + 26, M[1], O[0] - 40, O[1], r2 > 0 ? C.a : C.l, 1.3);
    ctx.setLineDash([2, 3]); ctx.strokeStyle = C.m; ctx.lineWidth = 0.8;     // 볼륨 상자
    CUBE.E.forEach(([i, j]) => {
      const u = rot3(CUBE.V[i], a, b), v = rot3(CUBE.V[j], a, b);
      ctx.beginPath(); ctx.moveTo(O[0] + 22 * u[0], O[1] - 22 * u[1]); ctx.lineTo(O[0] + 22 * v[0], O[1] - 22 * v[1]); ctx.stroke();
    });
    ctx.setLineDash([]);
    const solid = clamp((p - 0.62) / 0.14);
    const nPts = Math.floor(CUBE.D.length * r2);                            // 밀도(σ) 점들이 차오름
    ctx.fillStyle = C.a; ctx.globalAlpha = fade * (1 - solid) * 0.8;
    for (let i = 0; i < nPts; i++) {
      const v = rot3(CUBE.D[i], a, b);
      ctx.beginPath(); ctx.arc(O[0] + 22 * v[0], O[1] - 22 * v[1], 1.6, 0, Math.PI * 2); ctx.fill();
    }
    if (solid > 0) solidCube(ctx, O[0], O[1], 22, a, b, 0.62, fade * solid);
    ctx.globalAlpha = fade;
    text(ctx, "2D views", 30, 124, 8.5, C.m, 500);
    text(ctx, "3D scene", O[0], 124, 8.5, C.m, 500);
    ctx.globalAlpha = 1;
  }

  const ANIMS = {
    vlm: { draw: vlm, cap: "video frames → patches → into the LLM" },
    ml: { draw: ml, cap: "a perceptron: weighted sum → step → output" },
    nlp: { draw: nlp, cap: "BERT: bidirectional attention fills in [MASK]" },
    diff: { draw: diff, cap: "data ⇄ 2D Gaussian (forward noise / reverse denoise)" },
    geo: { draw: geo, cap: "building a 3D convex hull" },
    causal: { draw: causal, cap: "proximal causal inference: hidden U, proxies Z & W" },
    gen: { draw: nerf, cap: "NeRF: 2D views → rays → (color, density) → 3D" }
  };

  // ---------- 팝업 ----------
  const chips = document.querySelectorAll(".interests li[data-anim]");
  if (!chips.length) return;
  const pop = document.createElement("div");
  pop.className = "kw-pop"; pop.setAttribute("aria-hidden", "true");
  pop.innerHTML = '<canvas></canvas><div class="kw-cap"></div>';
  document.body.appendChild(pop);
  const cv = pop.querySelector("canvas"), cap = pop.querySelector(".kw-cap"), ctx = cv.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + "px"; cv.style.height = H + "px";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let raf = 0, cur = null, t0 = 0;

  function frame() {
    if (!cur) return;
    const t = reduce ? 1.3 : (performance.now() - t0) / 1000;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    ANIMS[cur].draw(ctx, t);
    if (!reduce) raf = requestAnimationFrame(frame);
  }
  function place(li) {
    const r = li.getBoundingClientRect(), pw = pop.offsetWidth, ph = pop.offsetHeight;
    const x = Math.max(8, Math.min(r.left + r.width / 2 - pw / 2, document.documentElement.clientWidth - pw - 8));
    let y = r.top - ph - 12; const below = y < 8; if (below) y = r.bottom + 12;
    pop.style.left = x + window.scrollX + "px"; pop.style.top = y + window.scrollY + "px";
    pop.style.setProperty("--ax", r.left + r.width / 2 - x + "px");
    pop.classList.toggle("below", below);
  }
  function show(li) {
    const key = li.dataset.anim; if (!ANIMS[key]) return;
    cap.textContent = ANIMS[key].cap; place(li);
    if (cur !== key) { cur = key; t0 = performance.now(); cancelAnimationFrame(raf); frame(); }
    pop.classList.add("show");
  }
  function hide() { pop.classList.remove("show"); cancelAnimationFrame(raf); cur = null; }

  chips.forEach(li => {
    li.addEventListener("mouseenter", () => show(li));
    li.addEventListener("mouseleave", hide);
    li.addEventListener("focus", () => show(li));
    li.addEventListener("blur", hide);
    li.addEventListener("click", e => { e.stopPropagation(); show(li); }); // 터치 화면
  });
  document.addEventListener("click", hide);
  window.addEventListener("resize", hide);
})();
