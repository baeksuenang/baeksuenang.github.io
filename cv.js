/* CV 셀: 마우스가 없는 화면(폰)에서는 탭하면 펼치고/접기. 마우스는 CSS :hover 로 처리 */
(function () {
  document.querySelectorAll(".cell.has-more").forEach(cell => {
    cell.addEventListener("click", e => {
      if (e.target.closest("a")) return;          // 링크/사진은 그대로 열림
      if (window.matchMedia("(hover: hover)").matches) return;
      const open = !cell.classList.contains("open");
      document.querySelectorAll(".cell.open").forEach(c => c.classList.remove("open"));
      cell.classList.toggle("open", open);
    });
  });
})();
