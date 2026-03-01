const COLS = 10;
const ROWS = 20;
const BLOCK = 30;

const POINTS_BY_CLEAR = [0, 100, 300, 500, 800];

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

const COLORS = [
  "transparent",
  "#36e2ff",
  "#1b7bff",
  "#ff8b1b",
  "#f8d354",
  "#37d188",
  "#ba65ff",
  "#ff5370",
];

const boardCanvas = document.getElementById("board");
const boardCtx = boardCanvas.getContext("2d");
const nextCanvas = document.getElementById("next");
const nextCtx = nextCanvas.getContext("2d");

const scoreEl = document.getElementById("score");
const levelEl = document.getElementById("level");
const linesEl = document.getElementById("lines");
const statusEl = document.getElementById("status");

let board = createBoard();
let bag = [];
let nextType = null;
let current = null;
let score = 0;
let lines = 0;
let level = 1;
let dropCounter = 0;
let dropInterval = 800;
let lastTime = 0;
let paused = false;
let gameOver = false;

function createBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

function copyMatrix(matrix) {
  return matrix.map((row) => [...row]);
}

function shuffle(list) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function drawCell(ctx, x, y, colorId, size) {
  if (colorId === 0) return;
  ctx.fillStyle = COLORS[colorId];
  ctx.fillRect(x * size, y * size, size, size);
  ctx.fillStyle = "rgba(255,255,255,0.2)";
  ctx.fillRect(x * size + 2, y * size + 2, size - 4, 4);
}

function drawBoardGrid() {
  boardCtx.strokeStyle = "rgba(255,255,255,0.06)";
  boardCtx.lineWidth = 1;
  for (let x = 0; x <= COLS; x += 1) {
    boardCtx.beginPath();
    boardCtx.moveTo(x * BLOCK, 0);
    boardCtx.lineTo(x * BLOCK, ROWS * BLOCK);
    boardCtx.stroke();
  }
  for (let y = 0; y <= ROWS; y += 1) {
    boardCtx.beginPath();
    boardCtx.moveTo(0, y * BLOCK);
    boardCtx.lineTo(COLS * BLOCK, y * BLOCK);
    boardCtx.stroke();
  }
}

function drawMatrix(ctx, matrix, offsetX, offsetY, size) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value === 0) return;
      drawCell(ctx, x + offsetX, y + offsetY, value, size);
    });
  });
}

function collide(matrix, row, col) {
  for (let y = 0; y < matrix.length; y += 1) {
    for (let x = 0; x < matrix[y].length; x += 1) {
      if (matrix[y][x] === 0) continue;

      const boardY = row + y;
      const boardX = col + x;
      if (boardX < 0 || boardX >= COLS || boardY >= ROWS) return true;
      if (boardY >= 0 && board[boardY][boardX] !== 0) return true;
    }
  }
  return false;
}

function merge(matrix, row, col) {
  matrix.forEach((line, y) => {
    line.forEach((value, x) => {
      if (value !== 0 && row + y >= 0) {
        board[row + y][col + x] = value;
      }
    });
  });
}

function rotate(matrix) {
  const n = matrix.length;
  const rotated = Array.from({ length: n }, () => Array(n).fill(0));
  for (let y = 0; y < n; y += 1) {
    for (let x = 0; x < n; x += 1) {
      rotated[x][n - y - 1] = matrix[y][x];
    }
  }
  return rotated;
}

function refillBagIfNeeded() {
  if (bag.length === 0) {
    bag = shuffle(Object.keys(SHAPES));
  }
}

function pullType() {
  refillBagIfNeeded();
  return bag.pop();
}

function spawnPiece() {
  if (!nextType) nextType = pullType();
  const type = nextType;
  nextType = pullType();

  const matrix = copyMatrix(SHAPES[type]);
  const col = Math.floor((COLS - matrix[0].length) / 2);
  const row = -2;

  current = { matrix, row, col };
  if (collide(current.matrix, current.row, current.col)) {
    gameOver = true;
    statusEl.textContent = "게임 오버: R 키로 재시작";
  }
}

function clearLines() {
  let cleared = 0;
  for (let y = ROWS - 1; y >= 0; y -= 1) {
    if (board[y].every((value) => value !== 0)) {
      board.splice(y, 1);
      board.unshift(Array(COLS).fill(0));
      cleared += 1;
      y += 1;
    }
  }
  if (cleared > 0) {
    score += POINTS_BY_CLEAR[cleared] * level;
    lines += cleared;
    level = Math.floor(lines / 10) + 1;
    dropInterval = Math.max(100, 800 - (level - 1) * 60);
  }
}

function lockAndSpawn() {
  merge(current.matrix, current.row, current.col);
  clearLines();
  spawnPiece();
}

function moveHorizontally(dir) {
  if (paused || gameOver) return;
  const nextCol = current.col + dir;
  if (!collide(current.matrix, current.row, nextCol)) {
    current.col = nextCol;
  }
}

function softDrop() {
  if (paused || gameOver) return;
  const nextRow = current.row + 1;
  if (!collide(current.matrix, nextRow, current.col)) {
    current.row = nextRow;
    score += 1;
  } else {
    lockAndSpawn();
  }
  dropCounter = 0;
}

function hardDrop() {
  if (paused || gameOver) return;
  let distance = 0;
  while (!collide(current.matrix, current.row + 1, current.col)) {
    current.row += 1;
    distance += 1;
  }
  score += distance * 2;
  lockAndSpawn();
  dropCounter = 0;
}

function tryRotate() {
  if (paused || gameOver) return;
  const rotated = rotate(current.matrix);
  const kicks = [0, -1, 1, -2, 2];
  for (const kick of kicks) {
    if (!collide(rotated, current.row, current.col + kick)) {
      current.matrix = rotated;
      current.col += kick;
      return;
    }
  }
}

function resetGame() {
  board = createBoard();
  bag = [];
  nextType = null;
  score = 0;
  lines = 0;
  level = 1;
  dropInterval = 800;
  dropCounter = 0;
  lastTime = 0;
  paused = false;
  gameOver = false;
  statusEl.textContent = "게임 진행 중";
  spawnPiece();
}

function togglePause() {
  if (gameOver) return;
  paused = !paused;
  statusEl.textContent = paused ? "일시정지" : "게임 진행 중";
}

function draw() {
  boardCtx.clearRect(0, 0, boardCanvas.width, boardCanvas.height);
  drawBoardGrid();

  board.forEach((row, y) => {
    row.forEach((value, x) => {
      drawCell(boardCtx, x, y, value, BLOCK);
    });
  });

  if (current) {
    drawMatrix(boardCtx, current.matrix, current.col, current.row, BLOCK);
  }

  if (paused || gameOver) {
    boardCtx.fillStyle = "rgba(2, 17, 31, 0.6)";
    boardCtx.fillRect(0, 0, boardCanvas.width, boardCanvas.height);
    boardCtx.fillStyle = "#eef7ff";
    boardCtx.font = "700 28px 'Noto Sans KR', sans-serif";
    boardCtx.textAlign = "center";
    boardCtx.fillText(gameOver ? "GAME OVER" : "PAUSED", boardCanvas.width / 2, boardCanvas.height / 2);
  }
}

function drawNext() {
  nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
  nextCtx.fillStyle = "rgba(2, 17, 31, 0.9)";
  nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);

  if (!nextType) return;
  const matrix = SHAPES[nextType];
  const size = 24;
  const offsetX = (nextCanvas.width / size - matrix[0].length) / 2;
  const offsetY = (nextCanvas.height / size - matrix.length) / 2;
  drawMatrix(nextCtx, matrix, offsetX, offsetY, size);
}

function updateHud() {
  scoreEl.textContent = String(score);
  linesEl.textContent = String(lines);
  levelEl.textContent = String(level);
  drawNext();
}

function gameLoop(time = 0) {
  const deltaTime = time - lastTime;
  lastTime = time;

  if (!paused && !gameOver) {
    dropCounter += deltaTime;
    if (dropCounter >= dropInterval) {
      const nextRow = current.row + 1;
      if (!collide(current.matrix, nextRow, current.col)) {
        current.row = nextRow;
      } else {
        lockAndSpawn();
      }
      dropCounter = 0;
    }
  }

  draw();
  updateHud();
  requestAnimationFrame(gameLoop);
}

document.addEventListener("keydown", (event) => {
  if (
    ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space", "KeyP", "KeyR"].includes(event.code)
  ) {
    event.preventDefault();
  }

  if (event.code === "ArrowLeft") moveHorizontally(-1);
  if (event.code === "ArrowRight") moveHorizontally(1);
  if (event.code === "ArrowUp") tryRotate();
  if (event.code === "ArrowDown") softDrop();
  if (event.code === "Space") hardDrop();
  if (event.code === "KeyP") togglePause();
  if (event.code === "KeyR") resetGame();
});

resetGame();
requestAnimationFrame(gameLoop);
