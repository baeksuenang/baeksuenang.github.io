/* 방명록 (이스터 에그를 깨면 나오는 Off the Clock 안)
   giscus: 글은 이 저장소의 GitHub Discussions 에 "guestbook" 이라는 글 하나의 댓글로 저장됨.
   데이터베이스 없음. 쓰려면 방문자가 GitHub 로그인 필요. 지우기·숨기기는 GitHub Discussions 에서.
   설정값은 https://giscus.app 에서 확인 가능 */
(function () {
  const GISCUS = {
    repo: "baeksuenang/baeksuenang.github.io",
    repoId: "R_kgDOVx3l4w",
    category: "Guestbook",
    categoryId: "DIC_kwDOVx3l484DL_Tz"
  };

  const box = document.getElementById("gb-giscus");
  if (!box) return;
  if (!GISCUS.categoryId) { box.innerHTML = '<p class="gb-empty">The guestbook opens soon.</p>'; return; }

  let loaded = false;
  document.addEventListener("otc:open", () => {   // 이스터 에그가 깨질 때 한 번만 불러옴
    if (loaded) return; loaded = true;
    const s = document.createElement("script");
    s.src = "https://giscus.app/client.js";
    Object.entries({
      "data-repo": GISCUS.repo, "data-repo-id": GISCUS.repoId,
      "data-category": GISCUS.category, "data-category-id": GISCUS.categoryId,
      "data-mapping": "specific", "data-term": "guestbook", "data-strict": "1",
      "data-reactions-enabled": "1", "data-emit-metadata": "0", "data-input-position": "top",
      "data-theme": "https://baeksuenang.github.io/giscus-theme.css?v=1",   // 주황 테마 (giscus-theme.css)
       "data-lang": "en", "data-loading": "lazy"
    }).forEach(([k, v]) => s.setAttribute(k, v));
    s.crossOrigin = "anonymous"; s.async = true;
    box.appendChild(s);
  });
})();
