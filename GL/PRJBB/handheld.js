(function () {
  "use strict";

  const T = window.GAME_TEXT;
  const CONFIG = window.GAME_CONFIG;
  const frame = document.getElementById("game-frame");
  const stage = document.getElementById("screen-stage");
  const controls = document.getElementById("hardware-controls");
  const flash = document.getElementById("handheld-flash");

  document.title = CONFIG.browserTitle;
  document.querySelector('[data-input="a"]').textContent = T.handheld.a;
  document.querySelector('[data-input="b"]').textContent = T.handheld.b;
  document.querySelector('[data-input="up"]').setAttribute("aria-label", T.handheld.up);
  document.querySelector('[data-input="down"]').setAttribute("aria-label", T.handheld.down);
  document.querySelector('[data-input="left"]').setAttribute("aria-label", T.handheld.left);
  document.querySelector('[data-input="right"]').setAttribute("aria-label", T.handheld.right);
  document.querySelector('[data-input="a"]').setAttribute("aria-label", T.handheld.aAction);
  document.querySelector('[data-input="b"]').setAttribute("aria-label", T.handheld.bAction);
  document.getElementById("control-hint").textContent = T.handheld.hint;

  function fitScreen() {
    const scale = Math.min(stage.clientWidth / 960, stage.clientHeight / 540);
    stage.style.setProperty("--screen-scale", String(scale));
  }

  function sendInput(input) {
    if (!frame.contentWindow) return;
    frame.contentWindow.postMessage({ type: "project-baby-input", input: input }, "*");
    if (navigator.vibrate) navigator.vibrate(input === "a" || input === "b" ? 18 : 10);
    flash.classList.remove("is-active");
    void flash.offsetWidth;
    flash.classList.add("is-active");
  }

  function pressButton(button) {
    if (!button || button.disabled) return;
    button.classList.add("is-pressed");
    sendInput(button.dataset.input);
    window.setTimeout(function () { button.classList.remove("is-pressed"); }, 110);
  }

  controls.addEventListener("pointerdown", function (event) {
    const button = event.target.closest("[data-input]");
    if (!button) return;
    event.preventDefault();
    pressButton(button);
  });

  controls.addEventListener("click", function (event) {
    event.preventDefault();
  });

  document.addEventListener("keydown", function (event) {
    if (event.repeat) return;
    const keyMap = {
      ArrowUp: "up",
      ArrowDown: "down",
      ArrowLeft: "left",
      ArrowRight: "right",
      w: "up",
      s: "down",
      a: "left",
      d: "right",
      Enter: "a",
      " ": "a",
      z: "a",
      Backspace: "b",
      Escape: "b",
      x: "b"
    };
    const input = keyMap[event.key];
    if (!input) return;
    event.preventDefault();
    pressButton(document.querySelector('[data-input="' + input + '"]'));
  });

  window.addEventListener("resize", fitScreen);
  window.addEventListener("orientationchange", function () { window.setTimeout(fitScreen, 120); });
  if (window.ResizeObserver) new ResizeObserver(fitScreen).observe(stage);
  fitScreen();
})();
