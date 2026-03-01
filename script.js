const BLOCK = 30;

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

if (!window.TetrisCore) {
  throw new Error("tetris-core.js가 먼저 로드되어야 합니다.");
}

const { DEFAULT_COLS, DEFAULT_ROWS, SHAPES, TetrisEngine } = window.TetrisCore;

const boardCanvas = document.getElementById("board");
const boardCtx = boardCanvas.getContext("2d");
const nextCanvas = document.getElementById("next");
const nextCtx = nextCanvas.getContext("2d");
const holdCanvas = document.getElementById("hold");
const holdCtx = holdCanvas.getContext("2d");

const scoreEl = document.getElementById("score");
const levelEl = document.getElementById("level");
const linesEl = document.getElementById("lines");
const seedEl = document.getElementById("seed-value");
const statusEl = document.getElementById("status");

const URL_SEED_KEY = "seed";

let activeSeed = resolveSeedFromUrl();
let engine = new TetrisEngine({
  cols: DEFAULT_COLS,
  rows: DEFAULT_ROWS,
  seed: activeSeed,
});

let dropCounter = 0;
let lastTime = 0;

function resolveSeedFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const value = params.get(URL_SEED_KEY);
  if (value && value.trim().length > 0) {
    return value.trim();
  }

  return String(Date.now());
}

function randomSeed() {
  return `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

function syncSeedToUrl(seed) {
  const url = new URL(window.location.href);
  url.searchParams.set(URL_SEED_KEY, seed);
  window.history.replaceState({}, "", url);
}

function updateStatus() {
  if (engine.gameOver) {
    statusEl.textContent = "게임 오버: R 재시작 / N 새 시드";
  } else if (engine.paused) {
    statusEl.textContent = "일시정지: P로 재개";
  } else {
    statusEl.textContent = "플레이 중";
  }
}

function resetGame(seed = activeSeed) {
  activeSeed = String(seed);
  engine.reset({ seed: activeSeed });
  dropCounter = 0;
  lastTime = 0;
  syncSeedToUrl(activeSeed);
  updateStatus();
}

function drawCell(ctx, x, y, colorId, size) {
  if (colorId === 0) return;

  ctx.fillStyle = COLORS[colorId];
  ctx.fillRect(x * size, y * size, size, size);

  ctx.fillStyle = "rgba(255,255,255,0.2)";
  ctx.fillRect(x * size + 2, y * size + 2, size - 4, 4);
}

function drawGhostCell(ctx, x, y, colorId, size) {
  if (colorId === 0) return;

  ctx.save();
  ctx.strokeStyle = `${COLORS[colorId]}AA`;
  ctx.lineWidth = 2;
  ctx.strokeRect(x * size + 3, y * size + 3, size - 6, size - 6);
  ctx.restore();
}

function drawMatrix(ctx, matrix, offsetX, offsetY, size, drawer = drawCell) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value === 0) return;
      drawer(ctx, x + offsetX, y + offsetY, value, size);
    });
  });
}

function drawBoardGrid() {
  boardCtx.strokeStyle = "rgba(255,255,255,0.06)";
  boardCtx.lineWidth = 1;

  for (let x = 0; x <= DEFAULT_COLS; x += 1) {
    boardCtx.beginPath();
    boardCtx.moveTo(x * BLOCK, 0);
    boardCtx.lineTo(x * BLOCK, DEFAULT_ROWS * BLOCK);
    boardCtx.stroke();
  }

  for (let y = 0; y <= DEFAULT_ROWS; y += 1) {
    boardCtx.beginPath();
    boardCtx.moveTo(0, y * BLOCK);
    boardCtx.lineTo(DEFAULT_COLS * BLOCK, y * BLOCK);
    boardCtx.stroke();
  }
}

function drawBoard() {
  boardCtx.clearRect(0, 0, boardCanvas.width, boardCanvas.height);
  drawBoardGrid();

  engine.board.forEach((row, y) => {
    row.forEach((value, x) => {
      drawCell(boardCtx, x, y, value, BLOCK);
    });
  });

  if (!engine.current) return;

  const ghostRow = engine.getGhostRow();
  if (ghostRow !== null) {
    drawMatrix(boardCtx, engine.current.matrix, engine.current.col, ghostRow, BLOCK, drawGhostCell);
  }

  drawMatrix(boardCtx, engine.current.matrix, engine.current.col, engine.current.row, BLOCK, drawCell);

  if (engine.paused || engine.gameOver) {
    boardCtx.fillStyle = "rgba(2, 17, 31, 0.6)";
    boardCtx.fillRect(0, 0, boardCanvas.width, boardCanvas.height);

    boardCtx.fillStyle = "#eef7ff";
    boardCtx.font = "700 28px 'Noto Sans KR', sans-serif";
    boardCtx.textAlign = "center";
    boardCtx.fillText(engine.gameOver ? "GAME OVER" : "PAUSED", boardCanvas.width / 2, boardCanvas.height / 2);
  }
}

function drawPreview(ctx, canvas, pieceType) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgba(2, 17, 31, 0.9)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (!pieceType) return;

  const matrix = SHAPES[pieceType];
  const size = 24;
  const offsetX = (canvas.width / size - matrix[0].length) / 2;
  const offsetY = (canvas.height / size - matrix.length) / 2;
  drawMatrix(ctx, matrix, offsetX, offsetY, size, drawCell);
}

function updateHud() {
  scoreEl.textContent = String(engine.score);
  linesEl.textContent = String(engine.lines);
  levelEl.textContent = String(engine.level);
  seedEl.textContent = activeSeed;

  drawPreview(nextCtx, nextCanvas, engine.nextType());
  drawPreview(holdCtx, holdCanvas, engine.holdType);
}

function gameLoop(time = 0) {
  const deltaTime = time - lastTime;
  lastTime = time;

  if (!engine.paused && !engine.gameOver) {
    dropCounter += deltaTime;

    while (dropCounter >= engine.dropInterval && !engine.gameOver) {
      engine.tick();
      dropCounter -= engine.dropInterval;
    }
  }

  drawBoard();
  updateHud();
  updateStatus();

  requestAnimationFrame(gameLoop);
}

function handleGameplayKey(event) {
  switch (event.code) {
    case "ArrowLeft":
      engine.move(-1);
      break;
    case "ArrowRight":
      engine.move(1);
      break;
    case "ArrowUp":
    case "KeyX":
      engine.rotate(1);
      break;
    case "KeyZ":
      engine.rotate(-1);
      break;
    case "ArrowDown":
      engine.softDrop();
      dropCounter = 0;
      break;
    case "Space":
      engine.hardDrop();
      dropCounter = 0;
      break;
    case "KeyC":
      engine.hold();
      break;
    default:
      break;
  }
}

document.addEventListener("keydown", (event) => {
  if (
    [
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "Space",
      "KeyX",
      "KeyZ",
      "KeyC",
      "KeyP",
      "KeyR",
      "KeyN",
    ].includes(event.code)
  ) {
    event.preventDefault();
  }

  if (event.code === "KeyP") {
    engine.togglePause();
    updateStatus();
    return;
  }

  if (event.code === "KeyR") {
    resetGame(activeSeed);
    return;
  }

  if (event.code === "KeyN") {
    resetGame(randomSeed());
    return;
  }

  handleGameplayKey(event);
});

resetGame(activeSeed);
requestAnimationFrame(gameLoop);
