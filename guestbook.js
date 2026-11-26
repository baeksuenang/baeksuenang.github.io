/* 방명록 (이스터 에그를 깨면 나오는 Off the Clock 안)
   글은 Supabase 테이블 public.guestbook 에 저장 (만드는 SQL: supabase/guestbook.sql).
   아래 두 값은 Supabase → Project Settings → API 의 Project URL 과 anon/publishable 키.
   이 키는 공개용이라 웹페이지에 넣어도 됨 (읽기·쓰기 권한은 SQL 의 규칙으로 제한). */
(function () {
  const SUPABASE_URL = "";
  const SUPABASE_KEY = "";

  const box = document.getElementById("guestbook");
  if (!box) return;
  const form = document.getElementById("gb-form"), list = document.getElementById("gb-list");
  const status = document.getElementById("gb-status");
  const ready = SUPABASE_URL && SUPABASE_KEY;
  const api = SUPABASE_URL + "/rest/v1/guestbook";
  const headers = { apikey: SUPABASE_KEY, "Content-Type": "application/json" };
  const COOLDOWN = 60 * 1000;   // 한 사람이 1분에 한 번만

  if (!ready) {
    form.hidden = true;
    list.innerHTML = '<li class="gb-empty">The guestbook opens soon.</li>';
    return;
  }

  const fmtDate = s => new Date(s).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  function render(rows) {
    list.innerHTML = "";
    if (!rows.length) { list.innerHTML = '<li class="gb-empty">No notes yet. Be the first!</li>'; return; }
    rows.forEach(r => {
      const li = document.createElement("li");
      const head = document.createElement("div"); head.className = "gb-head";
      const b = document.createElement("b"); b.textContent = r.name;          // textContent: 글 속 HTML은 그대로 글자로만 보임
      const time = document.createElement("time"); time.textContent = fmtDate(r.created_at);
      head.append(b, time);
      const p = document.createElement("p"); p.textContent = r.message;
      li.append(head, p); list.append(li);
    });
  }
  function load() {
    fetch(`${api}?select=name,message,created_at&order=created_at.desc&limit=50`, { headers })
      .then(r => { if (!r.ok) throw r; return r.json(); })
      .then(render)
      .catch(() => { list.innerHTML = '<li class="gb-empty">Couldn’t load notes right now.</li>'; });
  }
  let loaded = false;
  document.addEventListener("otc:open", () => { if (!loaded) { loaded = true; load(); } });

  form.addEventListener("submit", e => {
    e.preventDefault();
    const fd = new FormData(form);
    if (fd.get("website")) return;                         // 봇이 채우는 숨은 칸
    const name = String(fd.get("name")).trim(), message = String(fd.get("message")).trim();
    if (!name || !message) return;
    let last = 0; try { last = +localStorage.getItem("gb-last") || 0; } catch (_) {}
    if (Date.now() - last < COOLDOWN) { status.textContent = "Just a moment before the next note."; return; }

    const btn = form.querySelector("button"); btn.disabled = true; status.textContent = "Sending…";
    fetch(api, { method: "POST", headers: { ...headers, Prefer: "return=minimal" }, body: JSON.stringify({ name, message }) })
      .then(r => { if (!r.ok) throw r; })
      .then(() => {
        try { localStorage.setItem("gb-last", String(Date.now())); } catch (_) {}
        form.reset(); status.textContent = "Thanks! 🙌"; load();
      })
      .catch(() => { status.textContent = "Couldn’t send. Please try again later."; })
      .finally(() => { btn.disabled = false; });
  });
})();
