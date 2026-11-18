/* Off the Clock
   - solved.ac 티어: 문장 안에 작은 배지로 보임 (data/solvedac.json)
   - chess / 듀오링고: "chess", "language-learning streak" 단어에 마우스를 올리면 점수가 뜨는 이스터 에그
   데이터: chess.com 은 방문할 때 바로 불러오고, solved.ac·듀오링고는 GitHub Actions
   (.github/workflows/hobbies.yml)가 매일 data/*.json 으로 저장해 둔 것을 읽음 */
(function () {
  const CHESS_USER = "baekseunang";
  const fmt = n => Number(n).toLocaleString("en-US");
  const getJSON = url => fetch(url, { cache: "no-cache" }).then(r => { if (!r.ok) throw r; return r.json(); });

  // ---------- solved.ac 배지 ----------
  const TIERS = ["Unrated", "Bronze", "Silver", "Gold", "Platinum", "Diamond", "Ruby"];
  const COLORS = ["#2d2d2d", "#ad5600", "#435f7a", "#ec9a00", "#1fbf8a", "#00a6e8", "#ff0062"];
  const ROMAN = ["V", "IV", "III", "II", "I"];
  const badge = document.getElementById("solved-badge");
  if (badge) {
    getJSON("data/solvedac.json").then(d => {
      const t = typeof d.tier === "number" ? d.tier : 0, g = t ? Math.ceil(t / 5) : 0;
      const name = t ? `${TIERS[g]} ${ROMAN[(t - 1) % 5]}` : "Unrated";
      const img = badge.querySelector("img");
      img.src = `https://static.solved.ac/tier_small/${t}.svg`; img.hidden = false;
      badge.querySelector("span").textContent = name;
      badge.style.color = COLORS[g];
      badge.title = `solved.ac · ${fmt(d.solvedCount)} solved · rating ${fmt(d.rating)}`;
    }).catch(() => {});
  }

  // ---------- 이스터 에그 내용 ----------
  const content = {};
  getJSON(`https://api.chess.com/pub/player/${CHESS_USER}`)
    .then(p => Promise.all([p, getJSON(`https://api.chess.com/pub/player/${CHESS_USER}/stats`)]))
    .then(([p, s]) => {
      const last = k => (s[k] && s[k].last ? fmt(s[k].last.rating) : "—");
      const best = k => (s[k] && s[k].best ? fmt(s[k].best.rating) : "—");
      content.chess = `
        <div class="egg-head">${p.avatar ? `<img src="${p.avatar}" alt="">` : ""}
          <div><b>chess.com</b><span>${p.username}</span></div></div>
        <div class="egg-big">${last("chess_rapid")}<small>rapid</small></div>
        <ul class="egg-stats">
          <li><span>Best rapid</span><b>${best("chess_rapid")}</b></li>
          <li><span>Blitz</span><b>${last("chess_blitz")}</b></li>
          <li><span>Bullet</span><b>${last("chess_bullet")}</b></li>
        </ul>`;
    }).catch(() => { content.chess = `<div class="egg-big">♟<small>couldn’t load</small></div>`; });

  getJSON("data/duolingo.json").then(d => {
    const courses = (d.courses || []).slice(0, 3)
      .map(c => `<li><span>${c.title}</span><b>${fmt(c.xp)} XP</b></li>`).join("");
    content.duo = `
      <div class="egg-head"><div class="egg-flame">🔥</div><div><b>Duolingo</b><span>daily streak</span></div></div>
      <div class="egg-big">${fmt(d.streak)}<small>days in a row</small></div>
      <ul class="egg-stats">${courses}<li><span>Total</span><b>${fmt(d.totalXp)} XP</b></li></ul>`;
  }).catch(() => { content.duo = `<div class="egg-big">🔥<small>couldn’t load</small></div>`; });

  // ---------- 팝업 ----------
  const eggs = document.querySelectorAll(".egg[data-egg]");
  if (!eggs.length) return;
  const pop = document.createElement("div");
  pop.className = "kw-pop egg-pop"; pop.setAttribute("aria-hidden", "true");
  document.body.appendChild(pop);

  function place(el) {
    const r = el.getBoundingClientRect(), pw = pop.offsetWidth, ph = pop.offsetHeight;
    const x = Math.max(8, Math.min(r.left + r.width / 2 - pw / 2, document.documentElement.clientWidth - pw - 8));
    let y = r.top - ph - 12; const below = y < 8; if (below) y = r.bottom + 12;
    pop.style.left = x + window.scrollX + "px"; pop.style.top = y + window.scrollY + "px";
    pop.style.setProperty("--ax", r.left + r.width / 2 - x + "px");
    pop.classList.toggle("below", below);
  }
  function show(el) {
    pop.innerHTML = content[el.dataset.egg] || `<div class="egg-big">…<small>loading</small></div>`;
    place(el); pop.classList.add("show");
  }
  const hide = () => pop.classList.remove("show");
  eggs.forEach(el => {
    el.addEventListener("mouseenter", () => show(el));
    el.addEventListener("mouseleave", hide);
    el.addEventListener("focus", () => show(el));
    el.addEventListener("blur", hide);
  });
  window.addEventListener("resize", hide);
})();
