(function () {
  const BEST_SCORE_KEY = "2048-best-score";

  function getBestScore() {
    const stored = localStorage.getItem(BEST_SCORE_KEY);
    return stored ? parseInt(stored, 10) || 0 : 0;
  }

  function setBestScore(value) {
    localStorage.setItem(BEST_SCORE_KEY, String(value));
  }

  function createUI(game) {
    const boardEl = document.getElementById("board");
    const currentScoreEl = document.getElementById("current-score");
    const bestScoreEl = document.getElementById("best-score");
    const overlayEl = document.getElementById("overlay");
    const overlayMessageEl = document.getElementById("overlay-message");
    const newGameBtn = document.getElementById("new-game-btn");
    const overlayRetryBtn = document.getElementById("overlay-retry-btn");

    let bestScore = getBestScore();

    function render() {
      const { board, score, isGameOver, isWon } = game.state;
      const size = window.Game2048.SIZE;

      boardEl.innerHTML = "";
      boardEl.style.gridTemplateColumns = `repeat(${size}, 1fr)`;

      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          const value = board[r][c];
          const cell = document.createElement("div");
          cell.className = "cell";
          if (value !== 0) {
            cell.classList.add("tile", `tile-${value > 2048 ? "super" : value}`);
            cell.textContent = String(value);
          }
          boardEl.appendChild(cell);
        }
      }

      currentScoreEl.textContent = String(score);

      if (score > bestScore) {
        bestScore = score;
        setBestScore(bestScore);
      }
      bestScoreEl.textContent = String(bestScore);

      if (isGameOver) {
        showOverlay("게임 오버!");
      } else if (isWon) {
        showOverlay("2048 달성! 계속 진행하려면 닫으세요.", true);
      } else {
        hideOverlay();
      }
    }

    function showOverlay(message, dismissible) {
      overlayMessageEl.textContent = message;
      overlayEl.hidden = false;
      overlayRetryBtn.textContent = dismissible ? "계속하기" : "다시 시작";
    }

    function hideOverlay() {
      overlayEl.hidden = true;
    }

    function newGame() {
      game.reset();
      hideOverlay();
      render();
    }

    newGameBtn.addEventListener("click", newGame);
    overlayRetryBtn.addEventListener("click", () => {
      if (game.state.isGameOver) {
        newGame();
      } else {
        hideOverlay();
      }
    });

    render();

    return { render };
  }

  window.Game2048 = window.Game2048 || {};
  window.Game2048.createUI = createUI;
})();
