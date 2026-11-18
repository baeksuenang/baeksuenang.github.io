/* Off the Clock: chess.com 레이팅 + solved.ac 티어
   - chess.com: 공개 API를 방문할 때마다 바로 불러옴
   - solved.ac: 브라우저에서 직접 못 불러와서, GitHub Actions(.github/workflows/hobbies.yml)가
     하루 한 번 data/solvedac.json 으로 저장해 둔 것을 읽음 */
(function () {
  const CHESS_USER = "baekseunang";

  const fmt = n => Number(n).toLocaleString("en-US");
  function fill(card, big, label, stats) {
    card.querySelector('[data-f="big"]').innerHTML = big;
    card.querySelector('[data-f="label"]').textContent = label;
    card.querySelector('[data-f="stats"]').innerHTML =
      stats.map(([k, v]) => `<li><span>${k}</span><b>${v}</b></li>`).join("");
  }
  function icon(card, src) {
    const img = card.querySelector(".hobby-icon");
    img.src = src; img.hidden = false;
  }
  function failed(card) {
    card.querySelector('[data-f="big"]').textContent = "—";
    card.querySelector('[data-f="label"]').textContent = "Couldn’t load right now";
  }

  // ---- chess.com ----
  const chess = document.getElementById("hobby-chess");
  if (chess) {
    const base = `https://api.chess.com/pub/player/${CHESS_USER}`;
    Promise.all([fetch(base).then(r => r.json()), fetch(base + "/stats").then(r => r.json())])
      .then(([p, s]) => {
        if (p.avatar) icon(chess, p.avatar);
        const rating = k => (s[k] && s[k].last ? s[k].last.rating : null);
        const best = k => (s[k] && s[k].best ? s[k].best.rating : null);
        const rows = [];
        if (best("chess_rapid")) rows.push(["Best rapid", fmt(best("chess_rapid"))]);
        if (rating("chess_blitz")) rows.push(["Blitz", fmt(rating("chess_blitz"))]);
        if (rating("chess_bullet")) rows.push(["Bullet", fmt(rating("chess_bullet"))]);
        const r = s.chess_rapid && s.chess_rapid.record;
        if (r) rows.push(["Rapid games", fmt(r.win + r.loss + r.draw)]);
        fill(chess, rating("chess_rapid") ? fmt(rating("chess_rapid")) : "—", "Rapid rating", rows);
      })
      .catch(() => failed(chess));
  }

  // ---- solved.ac ----
  const TIERS = ["Unrated", "Bronze", "Silver", "Gold", "Platinum", "Diamond", "Ruby"];
  const TIER_COLORS = ["#2d2d2d", "#ad5600", "#435f7a", "#ec9a00", "#27e2a4", "#00b4fc", "#ff0062"];
  const ROMAN = ["V", "IV", "III", "II", "I"];
  const solved = document.getElementById("hobby-solved");
  if (solved) {
    fetch("data/solvedac.json", { cache: "no-cache" })
      .then(r => r.json())
      .then(d => {
        const t = d.tier, g = t === 0 ? 0 : Math.ceil(t / 5);
        const name = t === 0 ? "Unrated" : `${TIERS[g]} ${ROMAN[(t - 1) % 5]}`;
        icon(solved, `https://static.solved.ac/tier_small/${t}.svg`);
        fill(solved, `<span style="color:${TIER_COLORS[g]}">${name}</span>`, `Rating ${fmt(d.rating)}`, [
          ["Solved", fmt(d.solvedCount)],
          ["Class", d.class],
          ["Max streak", `${fmt(d.maxStreak)} days`]
        ]);
      })
      .catch(() => failed(solved));
  }
})();
