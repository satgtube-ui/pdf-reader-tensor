(() => {
  "use strict";

  const pdfUrl = "/notes/Gold%20Diagram.pdf#view=FitH&toolbar=1&navpanes=0";
  const body = document.body;
  const frame = document.getElementById("pdfFrame");
  const shield = document.getElementById("touchShield");
  const lockButton = document.getElementById("traceLock");
  const resetButton = document.getElementById("resetView");
  const status = document.getElementById("status");
  let locked = false;

  const blockTouch = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  ["touchstart", "touchmove", "touchend", "gesturestart", "gesturechange",
    "gestureend", "pointerdown", "pointermove", "wheel", "contextmenu"]
    .forEach((name) => shield.addEventListener(name, blockTouch, { passive: false }));

  const setLocked = (value) => {
    locked = value;
    body.classList.toggle("is-locked", locked);
    lockButton.setAttribute("aria-pressed", String(locked));
    lockButton.textContent = locked ? "Unlock" : "Trace lock";
    resetButton.disabled = locked;
    status.textContent = locked ? "Scroll and touch are frozen" : "Ready to study";
  };

  lockButton.addEventListener("click", () => setLocked(!locked));

  resetButton.addEventListener("click", () => {
    frame.src = "about:blank";
    window.setTimeout(() => { frame.src = pdfUrl; }, 20);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key.toLowerCase() === "l") setLocked(!locked);
  });
})();
