(function () {
  const SWIPE_THRESHOLD = 20;

  const KEY_DIRECTIONS = {
    ArrowLeft: "left",
    ArrowRight: "right",
    ArrowUp: "up",
    ArrowDown: "down",
  };

  function setupInput(game, ui) {
    const boardEl = document.getElementById("board");

    function handleMove(direction) {
      const moved = game.move(direction);
      if (moved) ui.render();
    }

    document.addEventListener("keydown", (e) => {
      const direction = KEY_DIRECTIONS[e.key];
      if (!direction) return;
      e.preventDefault();
      handleMove(direction);
    });

    let touchStartX = 0;
    let touchStartY = 0;

    boardEl.addEventListener(
      "touchstart",
      (e) => {
        const touch = e.changedTouches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
      },
      { passive: true }
    );

    boardEl.addEventListener(
      "touchend",
      (e) => {
        const touch = e.changedTouches[0];
        const dx = touch.clientX - touchStartX;
        const dy = touch.clientY - touchStartY;

        if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) return;

        let direction;
        if (Math.abs(dx) > Math.abs(dy)) {
          direction = dx > 0 ? "right" : "left";
        } else {
          direction = dy > 0 ? "down" : "up";
        }

        handleMove(direction);
      },
      { passive: true }
    );
  }

  window.Game2048 = window.Game2048 || {};
  window.Game2048.setupInput = setupInput;

  document.addEventListener("DOMContentLoaded", () => {
    const game = window.Game2048.createGame();
    const ui = window.Game2048.createUI(game);
    window.Game2048.setupInput(game, ui);
  });
})();
