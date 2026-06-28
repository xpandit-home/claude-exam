(function () {
  const PA = window.PixelArt;

  let saveTimer = null;

  function triggerSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveState, 500);
  }

  function saveState() {
    try {
      const data = {
        version: 1,
        pixels: PA.state.pixels,
        palette: PA.state.palette,
        activeColor: PA.state.activeColor,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem("pixel-art-state", JSON.stringify(data));
    } catch (_) {
      // QuotaExceededError 무시
    }
  }

  function loadState() {
    try {
      const raw = localStorage.getItem("pixel-art-state");
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (data.version !== 1) return false;
      if (Array.isArray(data.pixels)) PA.state.pixels = data.pixels;
      if (Array.isArray(data.palette) && data.palette.length) {
        PA.state.palette = data.palette;
      }
      if (data.activeColor) PA.state.activeColor = data.activeColor;
      return true;
    } catch (_) {
      return false;
    }
  }

  function exportPNG() {
    const now = new Date();
    const pad = n => String(n).padStart(2, "0");
    const ts = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

    const scale = 10;
    const off = document.createElement("canvas");
    off.width = PA.SIZE * scale;
    off.height = PA.SIZE * scale;
    const ctx = off.getContext("2d");
    ctx.clearRect(0, 0, off.width, off.height);

    for (let r = 0; r < PA.SIZE; r++) {
      for (let c = 0; c < PA.SIZE; c++) {
        const color = PA.state.pixels[r][c];
        if (color !== null) {
          ctx.fillStyle = color;
          ctx.fillRect(c * scale, r * scale, scale, scale);
        }
      }
    }

    const link = document.createElement("a");
    link.download = `pixel-art-${ts}.png`;
    link.href = off.toDataURL("image/png");
    link.click();
  }

  function renderPalette() {
    const grid = document.getElementById("palette-grid");
    const preview = document.getElementById("current-color-preview");
    if (!grid || !preview) return;

    preview.style.background = PA.state.activeColor;
    grid.innerHTML = "";

    PA.state.palette.forEach(color => {
      const sw = document.createElement("button");
      sw.className = "palette-swatch" + (color === PA.state.activeColor ? " active" : "");
      sw.style.background = color;
      sw.title = PA.DEFAULT_COLORS.includes(color)
        ? color
        : color + " (우클릭으로 삭제)";

      sw.addEventListener("click", () => {
        PA.state.activeColor = color;
        renderPalette();
      });

      if (!PA.DEFAULT_COLORS.includes(color)) {
        sw.addEventListener("contextmenu", e => {
          e.preventDefault();
          PA.removeCustomColor(color);
          renderPalette();
          triggerSave();
        });
      }

      grid.appendChild(sw);
    });
  }

  function updateToolButtons() {
    document.querySelectorAll(".tool-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.tool === PA.state.activeTool);
    });
  }

  function updateUndoRedo() {
    const btnUndo = document.getElementById("btn-undo");
    const btnRedo = document.getElementById("btn-redo");
    if (btnUndo) btnUndo.disabled = PA.state.historyIndex <= 0;
    if (btnRedo) btnRedo.disabled = PA.state.historyIndex >= PA.state.history.length - 1;
  }

  function clearCanvas() {
    PA.state.pixels = PA.createPixels();
    PA.render();
    PA.saveSnapshot();
    triggerSave();
  }

  function initUI() {
    const canvas = document.getElementById("pixel-canvas");

    // 저장된 상태 복원 또는 기본 팔레트 초기화
    const loaded = loadState();
    if (!loaded) PA.initPalette();

    PA.initEditor(canvas);
    PA.attachTools(canvas);

    // 초기 스냅샷 저장 (undo 기준점)
    PA.saveSnapshot();
    updateUndoRedo();

    // 도구 버튼
    document.querySelectorAll(".tool-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        PA.state.activeTool = btn.dataset.tool;
        updateToolButtons();
      });
    });
    updateToolButtons();

    // PNG 내보내기
    document.getElementById("btn-export")?.addEventListener("click", exportPNG);

    // 캔버스 초기화
    document.getElementById("btn-clear")?.addEventListener("click", clearCanvas);

    // Undo / Redo 버튼
    document.getElementById("btn-undo")?.addEventListener("click", () => PA.undo());
    document.getElementById("btn-redo")?.addEventListener("click", () => PA.redo());

    // 커스텀 색상 추가
    const colorInput = document.getElementById("color-input");
    document.getElementById("btn-add-color")?.addEventListener("click", () => {
      colorInput?.click();
    });
    colorInput?.addEventListener("input", e => {
      PA.addCustomColor(e.target.value);
      renderPalette();
      triggerSave();
    });

    // 테마 변경 시 캔버스 재렌더 (CSS 변수가 바뀌므로)
    new MutationObserver(() => PA.render()).observe(
      document.documentElement,
      { attributes: true, attributeFilter: ["data-theme"] }
    );

    // 키보드 단축키
    document.addEventListener("keydown", e => {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (!e.ctrlKey && !e.metaKey) {
        if (e.key === "p" || e.key === "P") {
          PA.state.activeTool = "pen";
          updateToolButtons();
        } else if (e.key === "e" || e.key === "E") {
          PA.state.activeTool = "eraser";
          updateToolButtons();
        } else if (e.key === "b" || e.key === "B") {
          PA.state.activeTool = "bucket";
          updateToolButtons();
        }
      }

      if (e.ctrlKey || e.metaKey) {
        if (e.key === "s") {
          e.preventDefault();
          exportPNG();
        } else if (e.key === "z" && !e.shiftKey) {
          e.preventDefault();
          PA.undo();
        } else if (e.key === "y" || (e.key === "z" && e.shiftKey)) {
          e.preventDefault();
          PA.redo();
        }
      }
    });

    renderPalette();
  }

  // 다른 모듈에서 참조할 수 있도록 노출
  PA.triggerSave = triggerSave;
  PA.updateUndoRedo = updateUndoRedo;
  PA.renderPalette = renderPalette;

  document.addEventListener("DOMContentLoaded", initUI);
})();
