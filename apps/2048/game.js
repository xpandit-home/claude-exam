(function () {
  const SIZE = 4;

  function createEmptyBoard() {
    return Array.from({ length: SIZE }, () => new Array(SIZE).fill(0));
  }

  function cloneBoard(board) {
    return board.map((row) => row.slice());
  }

  function getEmptyCells(board) {
    const cells = [];
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (board[r][c] === 0) cells.push([r, c]);
      }
    }
    return cells;
  }

  function spawnRandomTile(board) {
    const empty = getEmptyCells(board);
    if (empty.length === 0) return false;
    const [r, c] = empty[Math.floor(Math.random() * empty.length)];
    board[r][c] = Math.random() < 0.9 ? 2 : 4;
    return true;
  }

  // 0이 아닌 값만 추출 후 인접한 같은 값 병합, 길이 4로 패딩
  function slideAndMergeRow(row) {
    const compact = row.filter((v) => v !== 0);
    const merged = [];
    let scoreGain = 0;
    let moved = false;

    let i = 0;
    while (i < compact.length) {
      if (i + 1 < compact.length && compact[i] === compact[i + 1]) {
        const value = compact[i] * 2;
        merged.push(value);
        scoreGain += value;
        i += 2;
      } else {
        merged.push(compact[i]);
        i += 1;
      }
    }

    while (merged.length < SIZE) merged.push(0);

    for (let k = 0; k < SIZE; k++) {
      if (row[k] !== merged[k]) moved = true;
    }

    return { row: merged, scoreGain, moved };
  }

  function transpose(board) {
    const result = createEmptyBoard();
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        result[c][r] = board[r][c];
      }
    }
    return result;
  }

  function reverseRows(board) {
    return board.map((row) => row.slice().reverse());
  }

  // 모든 방향을 "왼쪽으로 슬라이드"로 정규화해서 처리
  function moveBoard(board, direction) {
    let working = cloneBoard(board);
    let didTranspose = false;
    let didReverse = false;

    if (direction === "up" || direction === "down") {
      working = transpose(working);
      didTranspose = true;
    }
    if (direction === "right" || direction === "down") {
      working = reverseRows(working);
      didReverse = true;
    }

    let moved = false;
    let scoreGain = 0;
    const resultRows = [];

    for (let r = 0; r < SIZE; r++) {
      const { row, scoreGain: gain, moved: rowMoved } = slideAndMergeRow(working[r]);
      resultRows.push(row);
      scoreGain += gain;
      if (rowMoved) moved = true;
    }

    let result = resultRows;
    if (didReverse) result = reverseRows(result);
    if (didTranspose) result = transpose(result);

    return { board: result, moved, scoreGain };
  }

  function boardsEqual(a, b) {
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (a[r][c] !== b[r][c]) return false;
      }
    }
    return true;
  }

  function hasWinningTile(board) {
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (board[r][c] >= 2048) return true;
      }
    }
    return false;
  }

  function canMove(board) {
    if (getEmptyCells(board).length > 0) return true;
    const directions = ["left", "right", "up", "down"];
    for (const dir of directions) {
      const { moved } = moveBoard(board, dir);
      if (moved) return true;
    }
    return false;
  }

  function createGame() {
    const state = {
      board: createEmptyBoard(),
      score: 0,
      isGameOver: false,
      isWon: false,
    };

    function reset() {
      state.board = createEmptyBoard();
      state.score = 0;
      state.isGameOver = false;
      state.isWon = false;
      spawnRandomTile(state.board);
      spawnRandomTile(state.board);
    }

    function move(direction) {
      if (state.isGameOver) return false;

      const before = state.board;
      const { board: after, moved, scoreGain } = moveBoard(before, direction);

      if (!moved || boardsEqual(before, after)) {
        return false;
      }

      state.board = after;
      state.score += scoreGain;
      spawnRandomTile(state.board);

      if (!state.isWon && hasWinningTile(state.board)) {
        state.isWon = true;
      }

      if (!canMove(state.board)) {
        state.isGameOver = true;
      }

      return true;
    }

    reset();

    return {
      state,
      reset,
      move,
    };
  }

  window.Game2048 = window.Game2048 || {};
  window.Game2048.createGame = createGame;
  window.Game2048.SIZE = SIZE;
})();
