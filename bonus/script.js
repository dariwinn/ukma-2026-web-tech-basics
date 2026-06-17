'use strict';

const errorCountEl  = document.getElementById('error-count');
const selectedLabel = document.getElementById('selected-label');
const boardEl       = document.getElementById('sudoku-board');
const messageEl     = document.getElementById('game-message');
const notesChk      = document.getElementById('notes-mode');

let solution, puzzle, board, notes, selected, errors, gameOver;
const MAX_ERR  = 3;
const ROW_N    = ['A','B','C','D','E','F','G','H','I'];
const COL_N    = ['1','2','3','4','5','6','7','8','9'];

let pivot = null;

function wdrData() {
  return Array.from({ length: 81 }, (_, i) => {
    const r = Math.floor(i / 9), c = i % 9;
    let type = 'empty', value = 0;
    if (puzzle[i])          { type = 'given'; value = puzzle[i]; }
    else if (board[i])      { type = 'user';  value = board[i];  }
    else if (notes[i].size) { type = 'note';  value = notes[i].size; }
    return { Row: ROW_N[r], Col: COL_N[c], Type: type, Value: value };
  });
}

function initWDR() {
  if (pivot) { try { pivot.dispose(); } catch(e){} }
  pivot = new WebDataRocks({
    container: '#pivot-container',
    toolbar: false,
    report: {
      dataSource: { data: wdrData() },
      slice: {
        rows:     [{ uniqueName: 'Row' }],
        columns:  [{ uniqueName: 'Col' }],
        measures: [{ uniqueName: 'Value', aggregation: 'sum' }]
      },
      options: { grid: { showHeaders: false, showTotals: 'off', showGrandTotals: 'off' } },
      formats: [{ name: '', decimalPlaces: 0, nullValue: '' }]
    }
  });
}

function syncWDR() {
  if (pivot) pivot.updateData({ data: wdrData() });
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function isValid(b, idx, num) {
  const r = Math.floor(idx / 9), c = idx % 9;
  const br = Math.floor(r / 3) * 3, bc = Math.floor(c / 3) * 3;
  for (let i = 0; i < 9; i++) {
    if (b[r*9+i] === num || b[i*9+c] === num) return false;
    if (b[(br + Math.floor(i/3)) * 9 + (bc + i%3)] === num) return false;
  }
  return true;
}

function solve(b, rand = false) {
  const e = b.indexOf(0);
  if (e === -1) return true;
  for (const n of (rand ? shuffle([1,2,3,4,5,6,7,8,9]) : [1,2,3,4,5,6,7,8,9])) {
    if (isValid(b, e, n)) { b[e] = n; if (solve(b, rand)) return true; b[e] = 0; }
  }
  return false;
}

function countSol(b) {
  const e = b.indexOf(0); if (e === -1) return 1;
  let n = 0;
  for (let v = 1; v <= 9; v++) {
    if (isValid(b, e, v)) { b[e] = v; n += countSol(b); b[e] = 0; if (n > 1) return n; }
  }
  return n;
}

function generate() {
  solution = Array(81).fill(0);
  solve(solution, true);
  puzzle = [...solution];
  let removed = 0;
  for (const i of shuffle([...Array(81).keys()])) {
    if (removed >= 40) break;          // залишаємо ≥41 підказки
    const bk = puzzle[i]; puzzle[i] = 0;
    if (countSol([...puzzle]) === 1) removed++;
    else puzzle[i] = bk;
  }
}

function render() {
  boardEl.innerHTML = '';
  for (let i = 0; i < 81; i++) {
    const r = Math.floor(i / 9), c = i % 9;
    const cell = document.createElement('div');
    cell.className = 's-cell';
    cell.dataset.idx = i;
    cell.dataset.row = r;
    cell.dataset.col = c;

    if (puzzle[i]) {
      cell.classList.add('given');
      cell.textContent = puzzle[i];
    } else if (board[i]) {
      cell.classList.add(board[i] === solution[i] ? 'user-entered' : 'error');
      cell.textContent = board[i];
    } else if (notes[i].size) {
      const ng = document.createElement('div');
      ng.className = 'notes-grid';
      for (let n = 1; n <= 9; n++) {
        const d = document.createElement('div');
        d.className = 'note-digit';
        d.textContent = notes[i].has(n) ? n : '';
        ng.appendChild(d);
      }
      cell.appendChild(ng);
    }

    cell.addEventListener('click', () => selectCell(i));
    boardEl.appendChild(cell);
  }
  highlight();
}

function highlight() {
  document.querySelectorAll('.s-cell').forEach(el =>
    el.classList.remove('selected', 'hl-zone', 'hl-num')
  );
  if (selected < 0) return;
  const sr = Math.floor(selected / 9), sc = selected % 9;
  const selVal = board[selected] || puzzle[selected];
  document.querySelectorAll('.s-cell').forEach(el => {
    const i = +el.dataset.idx, r = +el.dataset.row, c = +el.dataset.col;
    if (i === selected) { el.classList.add('selected'); return; }
    if (r === sr || c === sc || (Math.floor(r/3) === Math.floor(sr/3) && Math.floor(c/3) === Math.floor(sc/3)))
      el.classList.add('hl-zone');
    if (selVal && (board[i] || puzzle[i]) === selVal) el.classList.add('hl-num');
  });
}

function selectCell(i) {
  if (gameOver) return;
  selected = i;
  selectedLabel.textContent = `Рядок ${ROW_N[Math.floor(i/9)]}  ·  Колонка ${COL_N[i%9]}`;
  highlight();
}

function enterNum(num) {
  if (gameOver || selected < 0 || puzzle[selected]) return;
  if (notesChk.checked) {
    board[selected] = 0;
    notes[selected].has(num) ? notes[selected].delete(num) : notes[selected].add(num);
    render(); syncWDR(); return;
  }
  notes[selected].clear();
  board[selected] = num;
  if (num !== solution[selected]) {
    errors++;
    errorCountEl.textContent = errors;
    if (errors >= MAX_ERR) { render(); syncWDR(); endGame(false); return; }
  }
  render(); syncWDR();
  if (board.every((v, i) => puzzle[i] ? true : v === solution[i])) endGame(true);
}

function clearCell() {
  if (gameOver || selected < 0 || puzzle[selected]) return;
  board[selected] = 0; notes[selected].clear();
  render(); syncWDR();
}

function endGame(win) {
  gameOver = true;
  messageEl.classList.remove('hidden');
  messageEl.innerHTML = win
    ? `<div>ПЕРЕМОГА!</div><p>Головоломку розв'язано!</p><button onclick="startGame()">НОВА ГРА</button>`
    : `<div>ГРА ЗАКІНЧЕНА</div><p>Перевищено ліміт помилок</p><button onclick="startGame()">НОВА ГРА</button>`;
}

function startGame() {
  generate();
  board    = puzzle.map(v => v || 0);
  notes    = Array.from({ length: 81 }, () => new Set());
  selected = -1; errors = 0; gameOver = false;
  errorCountEl.textContent = '0';
  selectedLabel.textContent = 'Оберіть клітинку';
  messageEl.classList.add('hidden');
  render();
  initWDR();
}
//
document.addEventListener('keydown', e => {
  if (gameOver) return;
  if (e.key >= '1' && e.key <= '9') { enterNum(+e.key); return; }
  if (e.key === 'Backspace' || e.key === 'Delete') { clearCell(); return; }
  const dirs = { ArrowUp: [-1,0], ArrowDown: [1,0], ArrowLeft: [0,-1], ArrowRight: [0,1] };
  if (!dirs[e.key]) return;
  e.preventDefault();
  if (selected < 0) { selectCell(0); return; }
  const [dr, dc] = dirs[e.key];
  const r = Math.floor(selected / 9), c = selected % 9;
  selectCell(((r + dr + 9) % 9) * 9 + (c + dc + 9) % 9);
});

document.getElementById('new-game-btn').addEventListener('click', startGame);
document.getElementById('clear-btn').addEventListener('click', clearCell);
document.querySelectorAll('.num-btn').forEach(btn =>
  btn.addEventListener('click', () => enterNum(+btn.dataset.num))
);

startGame();
