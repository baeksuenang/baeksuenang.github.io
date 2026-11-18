/* 프로필 사진 — 누를 때마다 "찰칵" 하고 다음 사진으로.
   사진 추가: images/ 에 400x480(5:6) 사진을 넣고 아래 목록에 경로 추가 */
(function () {
  const PHOTOS = [
    "images/profile-4.jpg",   // 첫 화면 사진 (노란 머리)
    "images/profile-1.jpg",
    "images/profile-2.jpg",
    "images/profile-3.jpg"
  ];

  const box = document.querySelector(".photo");
  if (!box) return;
  const img = box.querySelector("img");
  PHOTOS.slice(1).forEach(src => { new Image().src = src; }); // 미리 불러오기

  let i = 0, audio;

  // 셔터 소리: 아주 짧은 잡음 두 번 (파일 없이 브라우저에서 합성)
  function shutter() {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      [0, 0.07].forEach((t, k) => {
        const len = Math.floor(audio.sampleRate * 0.035);
        const buf = audio.createBuffer(1, len, audio.sampleRate);
        const d = buf.getChannelData(0);
        for (let n = 0; n < len; n++) d[n] = (Math.random() * 2 - 1) * (1 - n / len) ** 3;
        const src = audio.createBufferSource(), gain = audio.createGain(), hp = audio.createBiquadFilter();
        hp.type = "highpass"; hp.frequency.value = k ? 2500 : 1500;
        gain.gain.value = k ? 0.18 : 0.28;
        src.buffer = buf; src.connect(hp); hp.connect(gain); gain.connect(audio.destination);
        src.start(audio.currentTime + t);
      });
    } catch (e) { /* 소리 없이도 동작 */ }
  }

  box.addEventListener("click", () => {
    shutter();
    box.classList.remove("snap"); void box.offsetWidth; box.classList.add("snap");
    setTimeout(() => { i = (i + 1) % PHOTOS.length; img.src = PHOTOS[i]; }, 90);
  });
})();
