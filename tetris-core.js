const DEFAULT_COLS = 10;
const DEFAULT_ROWS = 20;
const BASE_DROP_INTERVAL = 800;
const MIN_DROP_INTERVAL = 100;
const LEVEL_STEP_LINES = 10;

const POINTS_BY_CLEAR = [0, 100, 300, 500, 800];

const PIECE_TYPES = ["I", "J", "L", "O", "S", "T", "Z"];

const SHAPES = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  J: [
    [2, 0, 0],
    [2, 2, 2],
    [0, 0, 0],
  ],
  L: [
    [0, 0, 3],
    [3, 3, 3],
    [0, 0, 0],
  ],
  O: [
    [4, 4],
    [4, 4],
  ],
  S: [
    [0, 5, 5],
    [5, 5, 0],
    [0, 0, 0],
  ],
  T: [
    [0, 6, 0],
    [6, 6, 6],
    [0, 0, 0],
  ],
  Z: [
    [7, 7, 0],
    [0, 7, 7],
    [0, 0, 0],
  ],
};

const JLSTZ_KICKS = {
  "0>1": [
    [0, 0],
    [-1, 0],
    [-1, 1],
    [0, -2],
    [-1, -2],
  ],
  "1>0": [
    [0, 0],
    [1, 0],
    [1, -1],
    [0, 2],
    [1, 2],
  ],
  "1>2": [
    [0, 0],
    [1, 0],
    [1, -1],
    [0, 2],
    [1, 2],
  ],
  "2>1": [
    [0, 0],
    [-1, 0],
    [-1, 1],
    [0, -2],
    [-1, -2],
  ],
  "2>3": [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, -2],
    [1, -2],
  ],
  "3>2": [
    [0, 0],
    [-1, 0],
    [-1, -1],
    [0, 2],
    [-1, 2],
  ],
  "3>0": [
    [0, 0],
    [-1, 0],
    [-1, -1],
    [0, 2],
    [-1, 2],
  ],
  "0>3": [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, -2],
    [1, -2],
  ],
};

const I_KICKS = {
  "0>1": [
    [0, 0],
    [-2, 0],
    [1, 0],
    [-2, -1],
    [1, 2],
  ],
  "1>0": [
    [0, 0],
    [2, 0],
    [-1, 0],
    [2, 1],
    [-1, -2],
  ],
  "1>2": [
    [0, 0],
    [-1, 0],
    [2, 0],
    [-1, 2],
    [2, -1],
  ],
  "2>1": [
    [0, 0],
    [1, 0],
    [-2, 0],
    [1, -2],
    [-2, 1],
  ],
  "2>3": [
    [0, 0],
    [2, 0],
    [-1, 0],
    [2, 1],
    [-1, -2],
  ],
  "3>2": [
    [0, 0],
    [-2, 0],
    [1, 0],
    [-2, -1],
    [1, 2],
  ],
  "3>0": [
    [0, 0],
    [1, 0],
    [-2, 0],
    [1, -2],
    [-2, 1],
  ],
  "0>3": [
    [0, 0],
    [-1, 0],
    [2, 0],
    [-1, 2],
    [2, -1],
  ],
};

function createBoard(rows = DEFAULT_ROWS, cols = DEFAULT_COLS) {
  return Array.from({ length: rows }, () => Array(cols).fill(0));
}

function copyMatrix(matrix) {
  return matrix.map((row) => [...row]);
}

function rotateMatrix(matrix, dir) {
  const n = matrix.length;
  const rotated = Array.from({ length: n }, () => Array(n).fill(0));

  for (let y = 0; y < n; y += 1) {
    for (let x = 0; x < n; x += 1) {
      if (dir === 1) {
        rotated[x][n - y - 1] = matrix[y][x];
      } else {
        rotated[n - x - 1][y] = matrix[y][x];
      }
    }
  }

  return rotated;
}

function collide(board, matrix, row, col) {
  const rows = board.length;
  const cols = board[0].length;

  for (let y = 0; y < matrix.length; y += 1) {
    for (let x = 0; x < matrix[y].length; x += 1) {
      if (matrix[y][x] === 0) continue;

      const boardY = row + y;
      const boardX = col + x;

      if (boardX < 0 || boardX >= cols || boardY >= rows) return true;
      if (boardY >= 0 && board[boardY][boardX] !== 0) return true;
    }
  }

  return false;
}

function merge(board, matrix, row, col) {
  let topOut = false;

  matrix.forEach((line, y) => {
    line.forEach((value, x) => {
      if (value !== 0) {
        const boardY = row + y;
        if (boardY < 0) {
          topOut = true;
          return;
        }
        board[boardY][col + x] = value;
      }
    });
  });

  return topOut;
}

function clearFullLines(board) {
  let cleared = 0;
  const cols = board[0].length;

  for (let y = board.length - 1; y >= 0; y -= 1) {
    if (board[y].every((value) => value !== 0)) {
      board.splice(y, 1);
      board.unshift(Array(cols).fill(0));
      cleared += 1;
      y += 1;
    }
  }

  return cleared;
}

function hashSeed(seed) {
  const value = String(seed ?? "default-seed");
  let hash = 2166136261;

  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function createRng(seed) {
  let state = hashSeed(seed);
  if (state === 0) state = 0x6d2b79f5;

  return function nextRandom() {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleWithRng(list, rand) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getKickTable(type) {
  if (type === "I") return I_KICKS;
  if (type === "O") return null;
  return JLSTZ_KICKS;
}

function getKickTests(type, from, to) {
  if (type === "O") return [[0, 0]];
  const table = getKickTable(type);
  const key = `${from}>${to}`;
  return table[key] ?? [[0, 0]];
}

function createPiece(type, cols) {
  const matrix = copyMatrix(SHAPES[type]);
  const col = Math.floor((cols - matrix[0].length) / 2);

  return {
    type,
    matrix,
    row: -1,
    col,
    rotation: 0,
  };
}

class TetrisEngine {
  constructor(options = {}) {
    this.cols = options.cols ?? DEFAULT_COLS;
    this.rows = options.rows ?? DEFAULT_ROWS;
    this.seed = options.seed ?? String(Date.now());

    this.reset({ seed: this.seed });
  }

  reset(options = {}) {
    if (options.seed !== undefined) {
      this.seed = String(options.seed);
    }

    this.random = createRng(this.seed);
    this.board = createBoard(this.rows, this.cols);
    this.bag = [];
    this.nextQueue = [];
    this.current = null;
    this.holdType = null;
    this.holdLocked = false;

    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.dropInterval = BASE_DROP_INTERVAL;
    this.paused = false;
    this.gameOver = false;

    this.ensureQueue(2);
    this.spawnFromQueue();
  }

  ensureQueue(minLength = 1) {
    while (this.nextQueue.length < minLength) {
      this.refillBagIfNeeded();
      this.nextQueue.push(this.bag.pop());
    }
  }

  refillBagIfNeeded() {
    if (this.bag.length === 0) {
      this.bag = shuffleWithRng(PIECE_TYPES, this.random);
    }
  }

  spawnFromQueue() {
    this.ensureQueue(2);
    const type = this.nextQueue.shift();
    this.ensureQueue(2);

    this.current = createPiece(type, this.cols);
    this.holdLocked = false;

    if (collide(this.board, this.current.matrix, this.current.row, this.current.col)) {
      this.gameOver = true;
    }
  }

  spawnType(type) {
    this.current = createPiece(type, this.cols);

    if (collide(this.board, this.current.matrix, this.current.row, this.current.col)) {
      this.gameOver = true;
    }
  }

  canPlace(matrix, row, col) {
    return !collide(this.board, matrix, row, col);
  }

  move(dx) {
    if (this.paused || this.gameOver || !this.current) return false;

    const nextCol = this.current.col + dx;
    if (this.canPlace(this.current.matrix, this.current.row, nextCol)) {
      this.current.col = nextCol;
      return true;
    }

    return false;
  }

  rotate(direction = 1) {
    if (this.paused || this.gameOver || !this.current) return false;

    if (this.current.type === "O") {
      return true;
    }

    const rotated = rotateMatrix(this.current.matrix, direction);
    const from = this.current.rotation;
    const to = (from + (direction === 1 ? 1 : 3)) % 4;
    const kicks = getKickTests(this.current.type, from, to);

    for (const [dx, dy] of kicks) {
      const nextCol = this.current.col + dx;
      const nextRow = this.current.row - dy;

      if (this.canPlace(rotated, nextRow, nextCol)) {
        this.current.matrix = rotated;
        this.current.col = nextCol;
        this.current.row = nextRow;
        this.current.rotation = to;
        return true;
      }
    }

    return false;
  }

  softDrop() {
    if (this.paused || this.gameOver || !this.current) return { moved: false, locked: false };

    const nextRow = this.current.row + 1;
    if (this.canPlace(this.current.matrix, nextRow, this.current.col)) {
      this.current.row = nextRow;
      this.score += 1;
      return { moved: true, locked: false };
    }

    this.lockPiece();
    return { moved: false, locked: true };
  }

  tick() {
    if (this.paused || this.gameOver || !this.current) return { moved: false, locked: false };

    const nextRow = this.current.row + 1;
    if (this.canPlace(this.current.matrix, nextRow, this.current.col)) {
      this.current.row = nextRow;
      return { moved: true, locked: false };
    }

    this.lockPiece();
    return { moved: false, locked: true };
  }

  hardDrop() {
    if (this.paused || this.gameOver || !this.current) return 0;

    let distance = 0;
    while (this.canPlace(this.current.matrix, this.current.row + 1, this.current.col)) {
      this.current.row += 1;
      distance += 1;
    }

    this.score += distance * 2;
    this.lockPiece();
    return distance;
  }

  hold() {
    if (this.paused || this.gameOver || !this.current || this.holdLocked) return false;

    const currentType = this.current.type;

    if (this.holdType === null) {
      this.holdType = currentType;
      this.spawnFromQueue();
    } else {
      const swapType = this.holdType;
      this.holdType = currentType;
      this.spawnType(swapType);
    }

    this.holdLocked = true;
    return true;
  }

  lockPiece() {
    if (!this.current) return;

    const topOut = merge(this.board, this.current.matrix, this.current.row, this.current.col);
    if (topOut) {
      this.gameOver = true;
      this.current = null;
      return;
    }

    const cleared = clearFullLines(this.board);

    if (cleared > 0) {
      this.score += POINTS_BY_CLEAR[cleared] * this.level;
      this.lines += cleared;
      this.level = Math.floor(this.lines / LEVEL_STEP_LINES) + 1;
      this.dropInterval = Math.max(
        MIN_DROP_INTERVAL,
        BASE_DROP_INTERVAL - (this.level - 1) * 60,
      );
    }

    this.spawnFromQueue();
  }

  getGhostRow() {
    if (!this.current) return null;

    let row = this.current.row;
    while (this.canPlace(this.current.matrix, row + 1, this.current.col)) {
      row += 1;
    }

    return row;
  }

  togglePause() {
    if (this.gameOver) return this.paused;
    this.paused = !this.paused;
    return this.paused;
  }

  nextType() {
    return this.nextQueue[0] ?? null;
  }
}

const TetrisCore = {
  DEFAULT_COLS,
  DEFAULT_ROWS,
  BASE_DROP_INTERVAL,
  MIN_DROP_INTERVAL,
  POINTS_BY_CLEAR,
  PIECE_TYPES,
  SHAPES,
  createBoard,
  copyMatrix,
  rotateMatrix,
  collide,
  merge,
  clearFullLines,
  hashSeed,
  createRng,
  shuffleWithRng,
  getKickTests,
  TetrisEngine,
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = TetrisCore;
}

if (typeof window !== "undefined") {
  window.TetrisCore = TetrisCore;
}
