/* ════════════════════════════════════════
   ZenTiles — app.js
   ════════════════════════════════════════ */

'use strict';

// ── PWA: Register Service Worker ──────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js')
      .then(reg => console.log('[ZenTiles] SW registered:', reg.scope))
      .catch(err => console.warn('[ZenTiles] SW registration failed:', err));
  });
}

// ── Haptics ───────────────────────────────────────────────────────────────────
// Gracefully wraps the Web Vibration API — silently no-ops on unsupported devices.
const haptics = {
  // A single crisp tick — tile flip
  tap() {
    navigator.vibrate?.(10);
  },
  // Two quick pulses — pair matched ✅
  match() {
    navigator.vibrate?.([30, 40, 60]);
  },
  // Short sharp buzz — mismatch ❌
  wrong() {
    navigator.vibrate?.([60, 30, 60]);
  },
  // Celebration rumble — board cleared 🎉
  win() {
    navigator.vibrate?.([40, 30, 80, 30, 120, 40, 200]);
  }
};

// ── Zen Symbols Pool (18 symbols) ─────────────────────────────────────────────
const ZEN_SYMBOLS = [
  '☯️', '🌊', '🧘', '🌸', '🌙', '🎋',
  '⛩️', '🍵', '⛰️', '🕊️', '🕯️', '🌀',
  '🪁', '🐚', '💎', '🍃', '☀️', '🏮'
];

// ── DOM References ────────────────────────────────────────────────────────────
const homeScreen   = document.getElementById('home-screen');
const gameScreen   = document.getElementById('game-screen');
const gridContainer = document.getElementById('grid-container');
const statMoves    = document.getElementById('stat-moves');
const statTimer    = document.getElementById('stat-timer');
const statBest     = document.getElementById('stat-best');
const winOverlay   = document.getElementById('win-overlay');
const winMovesEl   = document.getElementById('win-moves');
const winTimeEl    = document.getElementById('win-time');
const winBestEl    = document.getElementById('win-best');

// ── State ─────────────────────────────────────────────────────────────────────
let currentMode    = 'beginner';   // 'beginner' | 'expert'
let moves          = 0;
let seconds        = 0;
let timerInterval  = null;
let firstCard      = null;
let secondCard     = null;
let lockBoard      = false;
let matchedPairs   = 0;
let totalPairs     = 0;

// ── Utilities ─────────────────────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function getBestKey(mode) {
  return `zentiles_best_${mode}`;
}

function loadBest(mode) {
  const val = localStorage.getItem(getBestKey(mode));
  return val ? parseInt(val, 10) : null;
}

function saveBest(mode, movesCount) {
  const current = loadBest(mode);
  if (current === null || movesCount < current) {
    localStorage.setItem(getBestKey(mode), movesCount);
    return true; // new record
  }
  return false;
}

function renderBest() {
  const best = loadBest(currentMode);
  statBest.textContent = best !== null ? best : '—';
}

// ── Timer ─────────────────────────────────────────────────────────────────────
function startTimer() {
  clearInterval(timerInterval);
  seconds = 0;
  statTimer.textContent = formatTime(seconds);
  timerInterval = setInterval(() => {
    seconds++;
    statTimer.textContent = formatTime(seconds);
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
}

// ── View Switching ────────────────────────────────────────────────────────────
function showHome() {
  gameScreen.classList.add('hidden');
  homeScreen.classList.remove('hidden');
  stopTimer();
}

function showGame(mode) {
  currentMode = mode;
  homeScreen.classList.add('hidden');
  gameScreen.classList.remove('hidden');
  winOverlay.classList.add('hidden');
  initGame(mode);
}

// ── Grid Generator ────────────────────────────────────────────────────────────
function initGame(mode) {
  // Reset state
  moves         = 0;
  matchedPairs  = 0;
  firstCard     = null;
  secondCard    = null;
  lockBoard     = false;
  statMoves.textContent = '0';
  statTimer.textContent = '0:00';
  renderBest();

  const gridSize  = mode === 'expert' ? 6 : 4;
  totalPairs      = (gridSize * gridSize) / 2;

  // Pick symbols
  const symbols = shuffle(ZEN_SYMBOLS).slice(0, totalPairs);
  const pairs   = shuffle([...symbols, ...symbols]);

  // Build grid
  gridContainer.innerHTML = '';
  gridContainer.className = '';
  gridContainer.classList.add(mode === 'expert' ? 'grid-6' : 'grid-4');

  pairs.forEach((symbol, index) => {
    const tile = createTile(symbol, index);
    gridContainer.appendChild(tile);
  });

  startTimer();
}

function createTile(symbol, index) {
  const tile = document.createElement('div');
  tile.className = 'tile';
  tile.dataset.symbol = symbol;
  tile.style.animationDelay = `${index * 0.03}s`;

  const inner = document.createElement('div');
  inner.className = 'tile-inner';

  const back  = document.createElement('div');
  back.className = 'tile-face tile-back';
  back.innerHTML = '<span style="opacity:0.18;font-size:0.8em;">☯</span>';

  const front = document.createElement('div');
  front.className = 'tile-face tile-front';
  front.textContent = symbol;

  inner.appendChild(back);
  inner.appendChild(front);
  tile.appendChild(inner);

  tile.addEventListener('click', () => onTileClick(tile));
  return tile;
}

// ── Game Logic ────────────────────────────────────────────────────────────────
function onTileClick(tile) {
  if (lockBoard)                         return;
  if (tile === firstCard)                return;
  if (tile.classList.contains('matched')) return;
  if (tile.classList.contains('flipped')) return;

  tile.classList.add('flipped');
  haptics.tap();

  if (!firstCard) {
    firstCard = tile;
    return;
  }

  secondCard = tile;
  lockBoard  = true;
  incrementMoves();
  checkMatch();
}

function incrementMoves() {
  moves++;
  statMoves.textContent = moves;
}

function checkMatch() {
  const isMatch = firstCard.dataset.symbol === secondCard.dataset.symbol;
  isMatch ? handleMatch() : handleMismatch();
}

function handleMatch() {
  matchedPairs++;

  const c1 = firstCard;
  const c2 = secondCard;

  // Brief delay for delight, then mark matched
  setTimeout(() => {
    haptics.match();
    c1.classList.add('matched');
    c2.classList.add('matched');
    c1.classList.remove('flipped');
    c2.classList.remove('flipped');

    resetTurn();

    if (matchedPairs === totalPairs) {
      stopTimer();
      haptics.win();
      setTimeout(showWin, 600);
    }
  }, 380);
}

function handleMismatch() {
  const c1 = firstCard;
  const c2 = secondCard;

  setTimeout(() => {
    haptics.wrong();
    c1.classList.add('wrong');
    c2.classList.add('wrong');
  }, 200);

  setTimeout(() => {
    c1.classList.remove('flipped', 'wrong');
    c2.classList.remove('flipped', 'wrong');
    resetTurn();
  }, 950);
}

function resetTurn() {
  firstCard = null;
  secondCard = null;
  lockBoard  = false;
}

// ── Win Screen ────────────────────────────────────────────────────────────────
function showWin() {
  const isRecord = saveBest(currentMode, moves);
  const best     = loadBest(currentMode);

  winMovesEl.textContent = moves;
  winTimeEl.textContent  = formatTime(seconds);
  winBestEl.textContent  = best !== null ? best : '—';

  // If new record, animate the best label
  if (isRecord) {
    winBestEl.style.animation = 'none';
    requestAnimationFrame(() => {
      winBestEl.style.animation = 'spin-in 0.6s ease';
    });
  }

  winOverlay.classList.remove('hidden');
  renderBest();
}

// ── Event Listeners ───────────────────────────────────────────────────────────
document.getElementById('btn-beginner').addEventListener('click', () => showGame('beginner'));
document.getElementById('btn-expert').addEventListener('click',   () => showGame('expert'));
document.getElementById('btn-back').addEventListener('click',     showHome);
document.getElementById('btn-play-again').addEventListener('click', () => showGame(currentMode));
document.getElementById('btn-win-home').addEventListener('click',  showHome);
