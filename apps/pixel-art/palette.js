(function () {
  window.PixelArt = window.PixelArt || {};

  const DEFAULT_COLORS = [
    "#000000", "#ffffff", "#ff0000", "#00ff00",
    "#0000ff", "#ffff00", "#ff00ff", "#00ffff",
    "#ff8800", "#8800ff", "#00ff88", "#ff0088",
    "#888888", "#444444", "#cccccc", "#884400",
  ];

  window.PixelArt.DEFAULT_COLORS = DEFAULT_COLORS;

  function initPalette() {
    window.PixelArt.state.palette = [...DEFAULT_COLORS];
    if (!DEFAULT_COLORS.includes(window.PixelArt.state.activeColor)) {
      window.PixelArt.state.activeColor = DEFAULT_COLORS[0];
    }
  }

  function addCustomColor(hex) {
    const palette = window.PixelArt.state.palette;

    if (palette.includes(hex)) {
      window.PixelArt.state.activeColor = hex;
      return;
    }

    palette.push(hex);

    // 최대 32색 초과 시 가장 오래된 커스텀색(기본 16색 이후) 제거
    while (palette.length > 32) {
      palette.splice(DEFAULT_COLORS.length, 1);
    }

    window.PixelArt.state.activeColor = hex;
  }

  function removeCustomColor(hex) {
    if (DEFAULT_COLORS.includes(hex)) return;

    const palette = window.PixelArt.state.palette;
    const idx = palette.indexOf(hex);
    if (idx === -1) return;

    palette.splice(idx, 1);

    if (window.PixelArt.state.activeColor === hex) {
      window.PixelArt.state.activeColor = palette[0] || DEFAULT_COLORS[0];
    }
  }

  window.PixelArt.initPalette = initPalette;
  window.PixelArt.addCustomColor = addCustomColor;
  window.PixelArt.removeCustomColor = removeCustomColor;
})();
