'use strict';

// ---------------------------------------------------------------------------
// Board geometry
//
// The board is a 15x15 grid with a cross-shaped track (Pachisi/Ludo style).
// The 52 cells that make up the shared outer ring are listed below in
// clockwise travel order, split into 4 arm "chains" of 13 cells each
// (Left -> Top -> Right -> Bottom). Each player's 4 tokens travel forward
// through this shared array (wrapping with %52) starting at their own
// start index, then peel off into their own 5-cell home lane, then finish
// at the center hub.
// ---------------------------------------------------------------------------

const RING = [
  // Left arm chain (0-12) - Violet's start at index 8
  [8,5],[8,4],[8,3],[8,2],[8,1],[8,0],[7,0],[6,0],[6,1],[6,2],[6,3],[6,4],[6,5],
  // Top arm chain (13-25) - Teal's start at index 21
  [5,6],[4,6],[3,6],[2,6],[1,6],[0,6],[0,7],[0,8],[1,8],[2,8],[3,8],[4,8],[5,8],
  // Right arm chain (26-38) - Amber's start at index 34
  [6,9],[6,10],[6,11],[6,12],[6,13],[6,14],[7,14],[8,14],[8,13],[8,12],[8,11],[8,10],[8,9],
  // Bottom arm chain (39-51) - Rose's start at index 47
  [9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[14,7],[14,6],[13,6],[12,6],[11,6],[10,6],[9,6],
];

const SAFE_ONLY_INDICES = [3, 16, 29, 42]; // marked safe cells (neutral marker)
const START_INDICES = [8, 21, 34, 47]; // one per player, tinted + marker
const SAFE_INDICES = new Set([...SAFE_ONLY_INDICES, ...START_INDICES]);

const PLAYERS = [
  {
    id: 'A', name: 'Violet', color: '#9184d9', startIdx: 8,
    yardCol: '1 / 7', yardRow: '1 / 7',
    home: [[7,1],[7,2],[7,3],[7,4],[7,5]],
  },
  {
    id: 'B', name: 'Teal', color: '#5fa88f', startIdx: 21,
    yardCol: '10 / 16', yardRow: '1 / 7',
    home: [[1,7],[2,7],[3,7],[4,7],[5,7]],
  },
  {
    id: 'C', name: 'Amber', color: '#c9a24d', startIdx: 34,
    yardCol: '10 / 16', yardRow: '10 / 16',
    home: [[7,13],[7,12],[7,11],[7,10],[7,9]],
  },
  {
    id: 'D', name: 'Rose', color: '#c96a6a', startIdx: 47,
    yardCol: '1 / 7', yardRow: '10 / 16',
    home: [[13,7],[12,7],[11,7],[10,7],[9,7]],
  },
];

const START_INDEX_TO_PLAYER = {};
PLAYERS.forEach(p => { START_INDEX_TO_PLAYER[p.startIdx] = p; });

const FINISH_S = 56;
const HOME_START_S = 51;

// ---------------------------------------------------------------------------
// Game state
// ---------------------------------------------------------------------------

let state = null;

function newGameState() {
  return {
    tokens: PLAYERS.map(() => [-1, -1, -1, -1]), // -1 = in yard
    currentPlayerIndex: 0,
    awaitingMove: false,
    currentScore: null,
    gameOver: false,
  };
}

function ringGlobalIndex(player, s) {
  return (player.startIdx + s) % 52;
}

function cellKeyFor(player, s) {
  if (s < 0) return null;
  if (s <= 50) {
    const [r, c] = RING[ringGlobalIndex(player, s)];
    return r + ',' + c;
  }
  if (s <= 55) {
    const [r, c] = player.home[s - HOME_START_S];
    return r + ',' + c;
  }
  return 'finished';
}

function computeNewS(s, score) {
  if (s < 0) return score - 1; // leaving the yard
  return s + score;
}

function isLegalMove(s, score) {
  if (s === FINISH_S) return false;
  return computeNewS(s, score) <= FINISH_S;
}

function getLegalTokenIndices(playerIndex, score) {
  return state.tokens[playerIndex]
    .map((s, i) => i)
    .filter(i => isLegalMove(state.tokens[playerIndex][i], score));
}

function moveToken(playerIndex, tokenIndex, score) {
  const player = PLAYERS[playerIndex];
  const s = state.tokens[playerIndex][tokenIndex];
  const newS = computeNewS(s, score);
  state.tokens[playerIndex][tokenIndex] = newS;

  if (s < 0) {
    log(`${player.name} brings a token out to start.`);
  }

  if (newS >= 0 && newS <= 50) {
    const gi = ringGlobalIndex(player, newS);
    if (!SAFE_INDICES.has(gi)) {
      PLAYERS.forEach((opp, oi) => {
        if (oi === playerIndex) return;
        state.tokens[oi].forEach((os, ti) => {
          if (os >= 0 && os <= 50 && ringGlobalIndex(opp, os) === gi) {
            state.tokens[oi][ti] = -1;
            log(`${player.name} captured one of ${opp.name}'s tokens!`);
          }
        });
      });
    }
  }

  if (newS === FINISH_S) {
    log(`${player.name}'s token reaches home!`);
  }
}

function playerHasWon(playerIndex) {
  return state.tokens[playerIndex].every(s => s === FINISH_S);
}

// ---------------------------------------------------------------------------
// Rendering: static board (built once)
// ---------------------------------------------------------------------------

function buildBoard() {
  const board = document.getElementById('board');
  board.innerHTML = '';

  PLAYERS.forEach(p => {
    const yard = document.createElement('div');
    yard.className = 'cell yard';
    yard.style.gridColumn = p.yardCol;
    yard.style.gridRow = p.yardRow;
    yard.style.background = `color-mix(in oklch, ${p.color} 14%, var(--neutral-900))`;
    yard.style.border = 'none';
    const panel = document.createElement('div');
    panel.className = 'yard-panel';
    panel.id = 'yard-' + p.id;
    yard.appendChild(panel);
    board.appendChild(yard);
  });

  RING.forEach(([r, c], i) => {
    const div = document.createElement('div');
    div.className = 'cell';
    div.dataset.key = r + ',' + c;
    div.style.gridColumn = (c + 1) + ' / ' + (c + 2);
    div.style.gridRow = (r + 1) + ' / ' + (r + 2);
    if (START_INDEX_TO_PLAYER[i]) {
      const p = START_INDEX_TO_PLAYER[i];
      div.classList.add('start-marker');
      div.style.setProperty('--marker-color', p.color);
      div.style.background = `color-mix(in oklch, ${p.color} 42%, var(--neutral-800))`;
    } else if (SAFE_INDICES.has(i)) {
      div.classList.add('safe');
    }
    board.appendChild(div);
  });

  PLAYERS.forEach(p => {
    p.home.forEach(([r, c]) => {
      const div = document.createElement('div');
      div.className = 'cell';
      div.dataset.key = r + ',' + c;
      div.style.gridColumn = (c + 1) + ' / ' + (c + 2);
      div.style.gridRow = (r + 1) + ' / ' + (r + 2);
      div.style.background = `color-mix(in oklch, ${p.color} 50%, var(--neutral-800))`;
      board.appendChild(div);
    });
  });

  const center = document.createElement('div');
  center.className = 'center-hub';
  const triColors = [PLAYERS[0].color, PLAYERS[1].color, PLAYERS[2].color, PLAYERS[3].color];
  const clips = [
    'polygon(0 0, 0 100%, 50% 50%)',   // left -> A
    'polygon(0 0, 100% 0, 50% 50%)',   // top -> B
    'polygon(100% 0, 100% 100%, 50% 50%)', // right -> C
    'polygon(0 100%, 100% 100%, 50% 50%)', // bottom -> D
  ];
  clips.forEach((clip, i) => {
    const tri = document.createElement('div');
    tri.className = 'tri';
    tri.style.clipPath = clip;
    tri.style.background = triColors[i];
    center.appendChild(tri);
  });
  const badge = document.createElement('div');
  badge.className = 'center-badge';
  badge.textContent = 'CP';
  center.appendChild(badge);
  const finishedTray = document.createElement('div');
  finishedTray.id = 'finishedTray';
  finishedTray.style.position = 'absolute';
  finishedTray.style.inset = '0';
  finishedTray.style.display = 'flex';
  finishedTray.style.flexWrap = 'wrap';
  finishedTray.style.alignContent = 'center';
  finishedTray.style.justifyContent = 'center';
  finishedTray.style.gap = '2px';
  finishedTray.style.zIndex = '3';
  center.appendChild(finishedTray);
  board.appendChild(center);
}

// ---------------------------------------------------------------------------
// Rendering: dynamic (tokens, sidebar) - re-run after every state change
// ---------------------------------------------------------------------------

function makeTokenEl(playerIndex, tokenIndex, movable) {
  const p = PLAYERS[playerIndex];
  const el = document.createElement('div');
  el.className = 'token' + (movable ? ' movable' : '');
  el.style.background = p.color;
  el.title = `${p.name} token ${tokenIndex + 1}`;
  if (movable) {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      onTokenClick(playerIndex, tokenIndex);
    });
  }
  return el;
}

function render() {
  document.querySelectorAll('.cell-tokens').forEach(el => el.remove());
  PLAYERS.forEach(p => { document.getElementById('yard-' + p.id).innerHTML = ''; });
  document.getElementById('finishedTray').innerHTML = '';

  const legal = state.awaitingMove
    ? getLegalTokenIndices(state.currentPlayerIndex, state.currentScore)
    : [];

  PLAYERS.forEach((p, pi) => {
    state.tokens[pi].forEach((s, ti) => {
      const movable = state.awaitingMove && pi === state.currentPlayerIndex && legal.includes(ti);
      const tokenEl = makeTokenEl(pi, ti, movable);

      if (s === -1) {
        document.getElementById('yard-' + p.id).appendChild(tokenEl);
      } else if (s === FINISH_S) {
        tokenEl.style.width = '14px';
        tokenEl.style.height = '14px';
        tokenEl.style.cursor = 'default';
        document.getElementById('finishedTray').appendChild(tokenEl);
      } else {
        const key = cellKeyFor(p, s);
        const cellEl = document.querySelector(`.cell[data-key="${key}"]`);
        if (!cellEl) return;
        let wrap = cellEl.querySelector('.cell-tokens');
        if (!wrap) {
          wrap = document.createElement('div');
          wrap.className = 'cell-tokens';
          cellEl.appendChild(wrap);
        }
        wrap.appendChild(tokenEl);
      }
    });
  });

  renderSidebar();
}

function renderSidebar() {
  const current = PLAYERS[state.currentPlayerIndex];

  const turnIndicator = document.getElementById('turnIndicator');
  turnIndicator.innerHTML = '';
  const dot = document.createElement('div');
  dot.className = 'turn-dot';
  dot.style.background = current.color;
  const label = document.createElement('span');
  label.textContent = state.gameOver ? 'Game over' : `${current.name}'s turn`;
  turnIndicator.appendChild(dot);
  turnIndicator.appendChild(label);

  const rollBtn = document.getElementById('rollBtn');
  rollBtn.disabled = state.gameOver || state.awaitingMove;
  rollBtn.textContent = state.awaitingMove ? 'Pick a highlighted token' : 'Toss sticks';

  const playersList = document.getElementById('playersList');
  playersList.innerHTML = '';
  PLAYERS.forEach((p, pi) => {
    const row = document.createElement('div');
    row.className = 'player-row' + (pi === state.currentPlayerIndex ? ' active' : '');
    const d = document.createElement('div');
    d.className = 'player-dot';
    d.style.background = p.color;
    const name = document.createElement('div');
    name.className = 'player-name';
    name.textContent = p.name;
    const finishedCount = state.tokens[pi].filter(s => s === FINISH_S).length;
    const progress = document.createElement('div');
    progress.className = 'player-progress';
    progress.textContent = `${finishedCount}/4 home`;
    row.appendChild(d);
    row.appendChild(name);
    row.appendChild(progress);
    playersList.appendChild(row);
  });
}

function log(msg) {
  const el = document.getElementById('log');
  const line = document.createElement('div');
  line.textContent = msg;
  el.appendChild(line);
  el.scrollTop = el.scrollHeight;
}

// ---------------------------------------------------------------------------
// Turn flow
// ---------------------------------------------------------------------------

function rollSticks() {
  const flats = [0, 1, 2, 3].map(() => Math.random() < 0.5);
  const flatCount = flats.filter(Boolean).length;
  const score = flatCount === 4 ? 8 : 4 - flatCount;

  const resultEl = document.getElementById('rollResult');
  resultEl.textContent = `Rolled: ${flatCount} flat / 4 sticks -> score ${score}${score === 8 ? ' (bonus turn!)' : ''}`;

  const current = PLAYERS[state.currentPlayerIndex];
  const legal = getLegalTokenIndices(state.currentPlayerIndex, score);

  if (legal.length === 0) {
    log(`${current.name} rolled ${score} - no legal move.`);
    advanceTurn(score);
    return;
  }

  state.awaitingMove = true;
  state.currentScore = score;
  render();
}

function onTokenClick(playerIndex, tokenIndex) {
  if (!state.awaitingMove || playerIndex !== state.currentPlayerIndex) return;
  const score = state.currentScore;
  moveToken(playerIndex, tokenIndex, score);

  if (playerHasWon(playerIndex)) {
    state.gameOver = true;
    render();
    showWin(PLAYERS[playerIndex]);
    return;
  }

  state.awaitingMove = false;
  state.currentScore = null;
  advanceTurn(score);
}

function advanceTurn(score) {
  if (score !== 8) {
    state.currentPlayerIndex = (state.currentPlayerIndex + 1) % 4;
  } else {
    log(`${PLAYERS[state.currentPlayerIndex].name} rolls again.`);
  }
  document.getElementById('rollResult').textContent = '';
  render();
}

function showWin(player) {
  const overlay = document.getElementById('winOverlay');
  document.getElementById('winText').textContent = `${player.name} wins!`;
  overlay.classList.remove('hidden');
}

function resetGame() {
  state = newGameState();
  document.getElementById('winOverlay').classList.add('hidden');
  document.getElementById('log').innerHTML = '';
  document.getElementById('rollResult').textContent = '';
  render();
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  buildBoard();
  state = newGameState();
  render();
  document.getElementById('rollBtn').addEventListener('click', rollSticks);
  document.getElementById('newGameBtn').addEventListener('click', resetGame);
});
