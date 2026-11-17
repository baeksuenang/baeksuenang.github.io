/* 도트 캐릭터 — 클릭하면 손 흔들며 인사
   몸: 32칸 기준 좌표로 그려서 40x40 캔버스에 (DX, DY)만큼 옮겨 찍음.
   각 줄: { y: "x목록" }  (예: "3-5,9" = 3,4,5,9번 칸)
   팔: 어깨→팔꿈치→손목 관절 위치로 모양을 계산해서 도트로 변환 (외곽선 자동) */
(function () {
  const COLORS = { K: "#1d1d1d", W: "#ffffff", O: "#fc9d0d" };
  const SIZE = 40, DX = 4, DY = 5;

  // ---- 몸 ----
  const BODY = {
    K: {
      2: "12-13", 3: "11,14", 4: "10,15,18-21", 5: "16-17,22",
      6: "12-13,15,23", 7: "11,23", 8: "10,23", 9: "10,23", 10: "9,23", 11: "9,23",
      12: "10,22", 13: "11,22",
      14: "9,12-14,18-20,23", 15: "8,11,15,17,21,24", 16: "8,11,15-17,21,24",
      17: "8,11,15,17,21,24", 18: "9,12-14,18-20,23",
      19: "11,16,20", 20: "12,19", 21: "13-18",
      // 목, 목폴라, 어깨
      22: "10,13,19,22", 23: "9,13,19,23,25", 24: "7,9,12,20,23,26",
      25: "6,9,13-14,18-19,23,26", 26: "6,10,15-17,22,26", 27: "5,11-13,19-21,27",
      28: "5,14-18,27", 29: "5,27", 30: "5,28", 31: "5,28", 32: "5,28", 33: "5,28", 34: "5,28"
    },
    W: {
      5: "18-21", 6: "16-22", 7: "18-22", 8: "19-22", 9: "20-22", 10: "20-22",
      11: "21-22", 12: "20-21", 13: "20-21", 14: "21-22", 15: "22", 16: "22", 17: "22",
      18: "21-22", 19: "18-19", 20: "17-18", 22: "17-18", 23: "17-18,24",
      24: "17-19,21-22,24-25", 25: "20-22,24-25", 26: "18-21,23-25", 27: "22-26",
      28: "24-26", 29: "25-26", 30: "26-27", 31: "26-27", 32: "26-27", 33: "26-27", 34: "26-27"
    }
  };
  const GLINT = { W: { 15: "12,18" } }; // 안경 반짝

  // ---- 팔 (캔버스 좌표) ----
  const SHOULDER = [10.6, 31.6];  // 왼쪽 어깨
  const ELBOW = [5.0, 27.2];      // 팔꿈치 (옆으로 살짝 내려옴)
  const FOREARM = 7.4;            // 팔꿈치~손목 길이
  // 왼쪽 어깨선의 x (이 선 오른쪽은 몸통 → 팔 외곽선을 그리지 않음)
  const shoulderX = y => (y < 29 ? Infinity : y === 29 ? DX + 7 : y <= 31 ? DX + 6 : DX + 5);
  // 손 흔드는 각도(도). +는 머리 쪽으로 기울임
  const ANGLES = [-10, 0, 13];

  const LINES = [
    "Hi there!",
    "Nice to meet you!",
    "Thanks for stopping by :)",
    "Ask me about video VLMs!",
    "Still here? Hi again!",
    "My arm is getting tired...",
    "Okay, one last wave!"
  ];

  // ---------- 도형 → 도트 ----------
  const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k];
  function segDist(p, a, b) {
    const vx = b[0] - a[0], vy = b[1] - a[1];
    const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * vx + (p[1] - a[1]) * vy) / (vx * vx + vy * vy)));
    return Math.hypot(p[0] - a[0] - vx * t, p[1] - a[1] - vy * t);
  }
  function armFrame(deg) {
    const th = deg * Math.PI / 180;
    const dir = [Math.sin(th), -Math.cos(th)];   // 아래팔 방향 (위쪽)
    const perp = [Math.cos(th), Math.sin(th)];   // 손바닥 가로 방향 (머리 쪽 +)
    const wrist = add(ELBOW, dir, FOREARM);
    const hand = add(wrist, dir, 2.1);
    const capsules = [
      [SHOULDER, ELBOW, 2.0],                      // 윗팔
      [ELBOW, wrist, 1.6],                         // 아래팔
      [add(hand, perp, 1.5), add(add(hand, perp, 3.0), dir, 1.1), 0.8] // 엄지
    ];
    [-1.25, 0, 1.25].forEach(k => {                // 손가락 3개
      const base = add(hand, perp, k);
      capsules.push([add(base, dir, 1.0), add(base, dir, 2.7), 0.72]);
    });
    const inside = (x, y) => {
      const p = [x + 0.5, y + 0.5];
      const u = (p[0] - hand[0]) * perp[0] + (p[1] - hand[1]) * perp[1];
      const v = (p[0] - hand[0]) * dir[0] + (p[1] - hand[1]) * dir[1];
      if ((u / 2.2) ** 2 + (v / 2.4) ** 2 <= 1) return true; // 손바닥
      return capsules.some(([a, b, r]) => segDist(p, a, b) <= r);
    };
    const fill = [], line = [];
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
      if (inside(x, y)) fill.push([x, y]);
      else if (x <= shoulderX(y) &&
        (inside(x + 1, y) || inside(x - 1, y) || inside(x, y + 1) || inside(x, y - 1))) line.push([x, y]);
    }
    // 빛: 몸처럼 오른쪽에서 비춤 → 팔/손의 오른쪽 가장자리 안쪽을 흰색으로 (각도 따라 같이 움직임)
    const isLine = new Set(line.map(([x, y]) => x + "," + y));
    const light = fill.filter(([x, y]) => isLine.has((x + 1) + "," + y) ||
      (isLine.has((x + 1) + "," + (y - 1)) && isLine.has(x + "," + (y - 1))));
    return { fill, line, light };
  }
  const FRAMES = ANGLES.map(armFrame);

  function cells(spec) {
    const out = [];
    spec.split(",").forEach(p => {
      const [a, b] = p.split("-").map(Number);
      for (let x = a; x <= (b ?? a); x++) out.push(x);
    });
    return out;
  }
  function paint(ctx, layer) {
    for (const color of ["W", "K"]) {
      const rows = layer[color];
      if (!rows) continue;
      ctx.fillStyle = COLORS[color];
      for (const y in rows) cells(rows[y]).forEach(x => ctx.fillRect(x + DX, +y + DY, 1, 1));
    }
  }

  const box = document.querySelector(".pixel-me");
  if (!box) return;
  const canvas = box.querySelector("canvas");
  const bubble = box.querySelector(".bubble");
  const ctx = canvas.getContext("2d");
  canvas.width = canvas.height = SIZE;

  function draw(arm, glint) {
    ctx.fillStyle = COLORS.O;
    ctx.fillRect(0, 0, SIZE, SIZE);
    paint(ctx, BODY);
    if (glint) paint(ctx, GLINT);
    if (arm != null) {
      const f = FRAMES[arm];
      ctx.fillStyle = COLORS.O; f.fill.forEach(([x, y]) => ctx.fillRect(x, y, 1, 1));
      ctx.fillStyle = COLORS.W; f.light.forEach(([x, y]) => ctx.fillRect(x, y, 1, 1));
      ctx.fillStyle = COLORS.K; f.line.forEach(([x, y]) => ctx.fillRect(x, y, 1, 1));
    }
  }
  draw(null);

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let busy = false, count = 0, hinted = false, timers = [];

  function say(text, ms) {
    bubble.textContent = text;
    bubble.classList.add("show");
    timers.push(setTimeout(() => bubble.classList.remove("show"), ms));
  }

  function wave() {
    if (busy) return;
    busy = true;
    timers.forEach(clearTimeout); timers = [];
    say(LINES[count++ % LINES.length], 2200);

    if (reduce) {
      draw(1, true);
      timers.push(setTimeout(() => { draw(null); busy = false; }, 1400));
      return;
    }
    box.classList.remove("hop"); void box.offsetWidth; box.classList.add("hop");
    const seq = [1, 2, 1, 0, 1, 2, 1, 0, 1, 2, 1];
    const step = 110;
    seq.forEach((f, i) => timers.push(setTimeout(() => draw(f, i % 4 < 2), i * step)));
    timers.push(setTimeout(() => { draw(null); box.classList.remove("hop"); busy = false; }, seq.length * step + 200));
  }

  box.addEventListener("click", () => { hinted = true; wave(); });

  // 처음 한 번: 클릭 유도
  setTimeout(() => { if (!hinted) { hinted = true; say("psst... click me", 2600); } }, 1800);
})();
