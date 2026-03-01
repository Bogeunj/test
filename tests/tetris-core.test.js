const test = require("node:test");
const assert = require("node:assert/strict");

const {
  PIECE_TYPES,
  createBoard,
  collide,
  createRng,
  shuffleWithRng,
  TetrisEngine,
} = require("../tetris-core.js");

function generateSequence(seed, count) {
  const rand = createRng(seed);
  const sequence = [];
  let bag = [];

  while (sequence.length < count) {
    if (bag.length === 0) {
      bag = shuffleWithRng(PIECE_TYPES, rand);
    }

    sequence.push(bag.pop());
  }

  return sequence;
}

test("collide detects overlap and boundary cases", () => {
  const board = createBoard(20, 10);
  board[19][4] = 9;

  assert.equal(collide(board, [[1]], 19, 4), true);
  assert.equal(collide(board, [[1]], 18, 4), false);
  assert.equal(collide(board, [[1]], 20, 4), true);
  assert.equal(collide(board, [[1]], 0, -1), true);
});

test("line clear updates score and line counters", () => {
  const engine = new TetrisEngine({ seed: "line-clear-seed" });

  for (let x = 0; x < engine.cols; x += 1) {
    engine.board[19][x] = 2;
  }
  engine.board[19][4] = 0;

  engine.current = {
    type: "T",
    matrix: [[6]],
    row: 19,
    col: 4,
    rotation: 0,
  };

  engine.lockPiece();

  assert.equal(engine.lines, 1);
  assert.equal(engine.score, 100);
  assert.equal(engine.level, 1);
});

test("level up after every 10 lines lowers drop interval", () => {
  const engine = new TetrisEngine({ seed: "level-seed" });

  engine.lines = 9;
  engine.level = 1;
  engine.dropInterval = 800;

  for (let x = 0; x < engine.cols; x += 1) {
    engine.board[19][x] = 2;
  }
  engine.board[19][5] = 0;

  engine.current = {
    type: "L",
    matrix: [[3]],
    row: 19,
    col: 5,
    rotation: 0,
  };

  engine.lockPiece();

  assert.equal(engine.lines, 10);
  assert.equal(engine.level, 2);
  assert.equal(engine.dropInterval, 740);
});

test("SRS wall kick rotates piece near left wall", () => {
  const engine = new TetrisEngine({ seed: "srs-seed" });

  engine.spawnType("T");
  engine.current.col = -1;
  engine.current.row = 2;
  engine.current.rotation = 0;

  const rotated = engine.rotate(-1);

  assert.equal(rotated, true);
  assert.equal(engine.current.rotation, 3);
  assert.equal(engine.current.col, 0);
});

test("hold can be used once per active piece", () => {
  const engine = new TetrisEngine({ seed: "hold-seed" });

  const initialType = engine.current.type;

  assert.equal(engine.hold(), true);
  assert.equal(engine.holdType, initialType);
  assert.equal(engine.hold(), false);

  engine.hardDrop();

  assert.equal(engine.hold(), true);
});

test("same seed generates reproducible 7-bag sequence", () => {
  const sequenceA = generateSequence("repeatable-seed", 14);
  const sequenceB = generateSequence("repeatable-seed", 14);
  const sequenceC = generateSequence("different-seed", 14);

  assert.deepEqual(sequenceA, sequenceB);
  assert.notDeepEqual(sequenceA, sequenceC);

  const bag = [...sequenceA.slice(0, 7)].sort();
  assert.deepEqual(bag, [...PIECE_TYPES].sort());
});

test("spawn collision at top sets game over", () => {
  const engine = new TetrisEngine({ seed: "spawn-collision-seed" });
  engine.board[0] = engine.board[0].map(() => 9);

  engine.spawnType("I");

  assert.equal(engine.gameOver, true);
});

test("lock above visible board triggers top-out game over", () => {
  const engine = new TetrisEngine({ seed: "top-out-seed" });
  engine.current = {
    type: "I",
    matrix: [[1]],
    row: -1,
    col: 0,
    rotation: 0,
  };

  engine.lockPiece();

  assert.equal(engine.gameOver, true);
  assert.equal(engine.current, null);
});
