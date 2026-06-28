(function () {
  window.PixelArt = window.PixelArt || {};

  const SIZE = 16;
  const LOGICAL = 384;

  let canvas, ctx, dpr;

  function createPixels() {
    return Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
  }

  const state = {
    pixels: createPixels(),
    activeTool: "pen",
    activeColor: "#000000",
    palette: [],
    history: [],
    historyIndex: -1,
  };

  window.PixelArt.state = state;
  window.PixelArt.SIZE = SIZE;

  function getCSSVar(name) {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim();
  }

  function render() {
    if (!canvas || !ctx) return;

    const cellSize = LOGICAL / SIZE;
    const bg = getCSSVar("--color-canvas-bg") || "#e8e8e8";
    const gridColor = getCSSVar("--color-grid") || "#c8c8c8";

    ctx.save();
    ctx.clearRect(0, 0, LOGICAL, LOGICAL);

    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const color = state.pixels[r][c];
        ctx.fillStyle = color !== null ? color : bg;
        ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
      }
    }

    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    for (let i = 0; i <= SIZE; i++) {
      const pos = i * cellSize;
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, LOGICAL);
      ctx.moveTo(0, pos);
      ctx.lineTo(LOGICAL, pos);
    }
    ctx.stroke();
    ctx.restore();
  }

  function initEditor(canvasEl) {
    canvas = canvasEl;
    dpr = window.devicePixelRatio || 1;

    canvas.width = LOGICAL * dpr;
    canvas.height = LOGICAL * dpr;

    ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    render();
  }

  function saveSnapshot() {
    const snapshot = state.pixels.map(row => [...row]);

    state.history = state.history.slice(0, state.historyIndex + 1);
    state.history.push(snapshot);

    if (state.history.length > 50) {
      state.history.shift();
    } else {
      state.historyIndex++;
    }

    if (window.PixelArt.updateUndoRedo) window.PixelArt.updateUndoRedo();
  }

  function undo() {
    if (state.historyIndex <= 0) return;
    state.historyIndex--;
    state.pixels = state.history[state.historyIndex].map(row => [...row]);
    render();
    if (window.PixelArt.triggerSave) window.PixelArt.triggerSave();
    if (window.PixelArt.updateUndoRedo) window.PixelArt.updateUndoRedo();
  }

  function redo() {
    if (state.historyIndex >= state.history.length - 1) return;
    state.historyIndex++;
    state.pixels = state.history[state.historyIndex].map(row => [...row]);
    render();
    if (window.PixelArt.triggerSave) window.PixelArt.triggerSave();
    if (window.PixelArt.updateUndoRedo) window.PixelArt.updateUndoRedo();
  }

  window.PixelArt.render = render;
  window.PixelArt.initEditor = initEditor;
  window.PixelArt.saveSnapshot = saveSnapshot;
  window.PixelArt.undo = undo;
  window.PixelArt.redo = redo;
  window.PixelArt.createPixels = createPixels;
})();
