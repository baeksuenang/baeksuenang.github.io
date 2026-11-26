# 연구자 홈페이지

순수 HTML/CSS로 만든 연구자 홈페이지입니다. (빌드 도구 불필요)

## 파일

- `index.html` — About (소개, 관심 분야, 연락처 아이콘)
- `publications.html` — 논문 목록 (연도별)
- `files/` — 논문 PDF
- `cv.html` + `cv.js` — 항목이 셀(상자). `<div class="cell-more">` 에 넣은 사진/링크는 마우스를 올리면 펼쳐짐 (폰은 탭). Education / Research Experience / Awards / Timeline / Skills
- `style.css` — 디자인 (맨 위 `--accent` 가 포인트 색)
- `images/profile-1~4.jpg` + `photos.js` — 프로필 사진 (누를 때마다 찰칵 하고 다음 사진). 사진 추가는 400x480 크기로 넣고 `PHOTOS` 목록에 경로 추가
- `easter.js` — 관심 분야 키워드에 마우스를 올리면 뜨는 애니메이션 (키워드의 `data-anim` 과 `ANIMS` 이름이 연결)
- `guestbook.js` — 이스터 에그 안 방명록 (giscus: 이 저장소의 GitHub Discussions 에 저장, 데이터베이스 없음) + `giscus-theme.css` (방명록 주황 테마)
- `hobbies.js` + `data/solvedac.json` + `.github/workflows/hobbies.yml` — 이스터 에그: 관심 분야 아래 "hmm… wanna click?" 을 5번 누르면 깨지고 Off the Clock(solved.ac·체스 카드)이 나타남. solved.ac 는 매일 새벽 3시 자동 갱신 (저장소 Secrets 에 SOLVEDAC_CLIENT_ID / SOLVEDAC_CLIENT_SECRET 필요)
- `pixel-me.js` — 이름 옆 도트 캐릭터 (클릭하면 손 흔들며 인사). 대사는 `LINES` 배열에서 수정

## 수정 방법

- **논문**: `publications.html`의 `<li class="pub">` 블록 복사. 새 연도는 `<div class="pub-year">` 블록째 복사
- **이력 / 수상**: `cv.html`의 `<li class="entry">` 블록 복사
- **타임라인**: `cv.html`의 `<ul class="timeline">` 안 `<li>` 복사

## GitHub Pages로 배포하기

`https://<내아이디>.github.io` 주소로 만들려면 **저장소 이름을 정확히 `<내아이디>.github.io`** 로 하세요.

1. GitHub에서 새 저장소 만들기 → 이름: `<내아이디>.github.io`, Public, README 추가하지 않기
2. 이 폴더에서:
   ```bash
   git init
   git add .
   git commit -m "첫 홈페이지"
   git branch -M main
   git remote add origin https://github.com/<내아이디>/<내아이디>.github.io.git
   git push -u origin main
   ```
3. 저장소 **Settings → Pages** → Source: `Deploy from a branch`, Branch: `main` / `/ (root)` → Save
4. 1~2분 뒤 `https://<내아이디>.github.io` 에서 확인

이후에는 수정하고 `git add . && git commit -m "수정" && git push` 만 하면 자동으로 반영됩니다.

## 로컬에서 미리 보기

```bash
python -m http.server 5500
```
브라우저에서 http://localhost:5500 열기.

## 수정이 바로 안 보일 때

GitHub Pages 는 CSS/JS 를 브라우저에 10분간 저장해 둡니다. `style.css` 나 `*.js` 를 고치면
세 HTML 파일의 `?v=날짜` 값을 새 값으로 바꿔 주세요 (예: `?v=20261118b` → `?v=20261120a`).
