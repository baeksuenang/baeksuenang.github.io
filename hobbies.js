/* Off the Clock (이스터 에그)
   관심 분야 아래 옅은 "hmm… wanna click?" 을 여러 번 누르면 금이 가다가 깨지고,
   그 자리에 Off the Clock(solved.ac, chess.com 카드)이 나타남.
   데이터: solved.ac 는 GitHub Actions(.github/workflows/hobbies.yml)가 매일 저장한
   data/solvedac.json, chess.com 은 열릴 때 공개 API에서 바로 불러옴 */
(function () {
  const HITS = 5;                       // 몇 번 눌러야 깨지는지
  const LINES = ["hmm… wanna click?", "oh? again?", "a little harder…", "it’s cracking!", "one more!"];
  const CHESS_USER = "baekseunang";

  const btn = document.getElementById("crack"), section = document.getElementById("otc");
  if (!btn || !section) return;
  const label = btn.querySelector(".crack-text");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let hits = 0;

  btn.addEventListener("click", () => {
    if (btn.classList.contains("broken")) return;
    hits++;
    btn.dataset.hits = Math.min(hits, 4);
    btn.classList.remove("shake"); void btn.offsetWidth; btn.classList.add("shake");
    if (hits < HITS) { label.textContent = LINES[hits]; return; }
    shatter();
  });

  // 글자들이 조각처럼 흩어지고 → 섹션 등장
  function shatter() {
    btn.classList.add("broken");
    const text = label.textContent;
    label.innerHTML = [...text].map(c => `<span class="ch">${c}</span>`).join("");
    const chars = label.querySelectorAll(".ch");
    requestAnimationFrame(() => chars.forEach(ch => {
      const a = Math.random() * Math.PI * 2, d = 40 + Math.random() * 90;
      ch.style.transform = `translate(${Math.cos(a) * d}px, ${Math.sin(a) * d * 0.6 + 30}px) rotate(${(Math.random() - .5) * 240}deg)`;
      ch.style.opacity = "0";
    }));
    setTimeout(() => {
      btn.parentElement.remove();
      section.hidden = false;
      if (!reduce) section.classList.add("reveal");
      load();
      document.dispatchEvent(new Event("otc:open")); // 방명록(guestbook.js)이 이때 글을 불러옴
    }, reduce ? 0 : 650);
  }

  // ---------- 카드 채우기 ----------
  const fmt = n => Number(n).toLocaleString("en-US");
  const getJSON = url => fetch(url, { cache: "no-cache" }).then(r => { if (!r.ok) throw r; return r.json(); });
  function fill(card, big, label, stats) {
    card.querySelector('[data-f="big"]').innerHTML = big;
    card.querySelector('[data-f="label"]').textContent = label;
    card.querySelector('[data-f="stats"]').innerHTML =
      stats.map(([k, v]) => `<li><span>${k}</span><b>${v}</b></li>`).join("");
  }
  function icon(card, src) { const img = card.querySelector(".hobby-icon"); img.src = src; img.hidden = false; }
  function failed(card) { fill(card, "—", "Couldn’t load right now", []); }

  const TIERS = ["Unrated", "Bronze", "Silver", "Gold", "Platinum", "Diamond", "Ruby"];
  const COLORS = ["#2d2d2d", "#ad5600", "#435f7a", "#ec9a00", "#1fbf8a", "#00a6e8", "#ff0062"];
  const ROMAN = ["V", "IV", "III", "II", "I"];

  function load() {
    const solved = document.getElementById("hobby-solved");
    getJSON("data/solvedac.json").then(d => {
      const t = typeof d.tier === "number" ? d.tier : 0, g = t ? Math.ceil(t / 5) : 0;
      icon(solved, `https://static.solved.ac/tier_small/${t}.svg`);
      fill(solved, `<span style="color:${COLORS[g]}">${t ? `${TIERS[g]} ${ROMAN[(t - 1) % 5]}` : "Unrated"}</span>`,
        `Rating ${fmt(d.rating)}`,
        [["Solved", fmt(d.solvedCount)], ["Class", d.class], ["Max streak", `${fmt(d.maxStreak)} days`]]);
    }).catch(() => failed(solved));

    const chess = document.getElementById("hobby-chess");
    const base = `https://api.chess.com/pub/player/${CHESS_USER}`;
    Promise.all([getJSON(base), getJSON(base + "/stats")]).then(([p, s]) => {
      if (p.avatar) icon(chess, p.avatar);
      const last = k => (s[k] && s[k].last ? fmt(s[k].last.rating) : "—");
      const best = k => (s[k] && s[k].best ? fmt(s[k].best.rating) : "—");
      const r = s.chess_rapid && s.chess_rapid.record;
      fill(chess, last("chess_rapid"), "Rapid rating", [
        ["Best rapid", best("chess_rapid")], ["Blitz", last("chess_blitz")], ["Bullet", last("chess_bullet")],
        ...(r ? [["Rapid games", fmt(r.win + r.loss + r.draw)]] : [])
      ]);
    }).catch(() => failed(chess));
  }
})();
