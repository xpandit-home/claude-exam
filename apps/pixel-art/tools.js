(function () {
  const PA = window.PixelArt;

  function getCell(clientX, clientY, canvas) {
    const rect = canvas.getBoundingClientRect();
    const col = Math.floor((clientX - rect.left) / rect.width * PA.SIZE);
    const row = Math.floor((clientY - rect.top) / rect.height * PA.SIZE);
    if (col < 0 || col >= PA.SIZE || row < 0 || row >= PA.SIZE) return null;
    return { row, col };
  }

  function applyTool(row, col) {
    const { activeTool, activeColor, pixels } = PA.state;
    if (activeTool === "pen") {
      pixels[row][col] = activeColor;
    } else if (activeTool === "eraser") {
      pixels[row][col] = null;
    }
  }

  function bucketFill(row, col) {
    const { activeColor, pixels } = PA.state;
    const target = pixels[row][col];

    // null도 색상값으로 취급; 같은 색이면 즉시 리턴 (무한루프 방지)
    if (target === activeColor) return;

    const queue = [[row, col]];
    const visited = Array.from({ length: PA.SIZE }, () => Array(PA.SIZE).fill(false));
    visited[row][col] = true;

    while (queue.length) {
      const [r, c] = queue.shift();
      pixels[r][c] = activeColor;

      const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      for (const [dr, dc] of dirs) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nr >= PA.SIZE || nc < 0 || nc >= PA.SIZE) continue;
        if (visited[nr][nc]) continue;
        if (pixels[nr][nc] !== target) continue;
        visited[nr][nc] = true;
        queue.push([nr, nc]);
      }
    }
  }

  function attachTools(canvas) {
    let isDrawing = false;

    function onStart(clientX, clientY) {
      const cell = getCell(clientX, clientY, canvas);
      if (!cell) return;

      if (PA.state.activeTool === "bucket") {
        bucketFill(cell.row, cell.col);
        PA.render();
        PA.saveSnapshot();
        if (PA.triggerSave) PA.triggerSave();
        return;
      }

      isDrawing = true;
      applyTool(cell.row, cell.col);
      PA.render();
    }

    function onMove(clientX, clientY) {
      if (!isDrawing) return;
      const cell = getCell(clientX, clientY, canvas);
      if (!cell) return;
      applyTool(cell.row, cell.col);
      PA.render();
    }

    function onEnd() {
      if (!isDrawing) return;
      isDrawing = false;
      PA.saveSnapshot();
      if (PA.triggerSave) PA.triggerSave();
    }

    canvas.addEventListener("mousedown", e => {
      if (e.button !== 0) return;
      e.preventDefault();
      onStart(e.clientX, e.clientY);
    });

    canvas.addEventListener("mousemove", e => {
      onMove(e.clientX, e.clientY);
    });

    window.addEventListener("mouseup", onEnd);

    canvas.addEventListener("touchstart", e => {
      e.preventDefault();
      const t = e.touches[0];
      onStart(t.clientX, t.clientY);
    }, { passive: false });

    canvas.addEventListener("touchmove", e => {
      e.preventDefault();
      const t = e.touches[0];
      onMove(t.clientX, t.clientY);
    }, { passive: false });

    canvas.addEventListener("touchend", e => {
      e.preventDefault();
      onEnd();
    }, { passive: false });
  }

  window.PixelArt.attachTools = attachTools;
  window.PixelArt.bucketFill = bucketFill;
})();
