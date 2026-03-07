/**
 * Lobby Screen — create/join games, view active games and history.
 */
import { createGame, joinGame, listenToAllGames, getGameHistory } from '../game/firebase-config.js';
import { getLocalPlayer, setCurrentGameId } from '../game/game-state.js';
import { navigateTo } from '../main.js';

const playerNameEl  = document.getElementById('lobby-player-name');
const changeNameBtn = document.getElementById('lobby-change-name-btn');
const createGameBtn = document.getElementById('create-game-btn');
const joinCodeInput = document.getElementById('join-code-input');
const joinCodeBtn   = document.getElementById('join-code-btn');
const joinErrorEl   = document.getElementById('join-error');
const gamesListEl   = document.getElementById('lobby-games-list');
const historyListEl = document.getElementById('lobby-history-list');

let unsubscribeGames = null;

// ============================================================
// Init / Cleanup
// ============================================================

window.addEventListener('screen-changed', ({ detail }) => {
  if (detail.screen === 'lobby') {
    onEnterLobby();
  } else {
    onLeaveLobby();
  }
});

function onEnterLobby() {
  const player = getLocalPlayer();
  playerNameEl.textContent = player.name;

  unsubscribeGames = listenToAllGames(renderGamesList);
  loadHistory();
}

function onLeaveLobby() {
  if (unsubscribeGames) {
    unsubscribeGames();
    unsubscribeGames = null;
  }
}

// ============================================================
// Create Game
// ============================================================

createGameBtn.addEventListener('click', async () => {
  const { id, name } = getLocalPlayer();
  createGameBtn.disabled = true;
  try {
    const gameId = await createGame(name, id);
    enterGame(gameId);
  } catch (err) {
    alert(`Failed to create game: ${err.message}`);
  } finally {
    createGameBtn.disabled = false;
  }
});

// ============================================================
// Join by Code
// ============================================================

joinCodeBtn.addEventListener('click', handleJoinByCode);
joinCodeInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') handleJoinByCode();
});

async function handleJoinByCode() {
  const code = joinCodeInput.value.trim().toUpperCase();
  if (!code) {
    showJoinError('Enter a room code');
    return;
  }

  joinCodeBtn.disabled = true;
  clearJoinError();

  try {
    const { id, name } = getLocalPlayer();
    await joinGame(code, name, id);
    enterGame(code);
  } catch (err) {
    showJoinError(err.message);
  } finally {
    joinCodeBtn.disabled = false;
  }
}

function showJoinError(msg) {
  joinErrorEl.textContent = msg;
  joinErrorEl.classList.remove('hidden');
}

function clearJoinError() {
  joinErrorEl.classList.add('hidden');
}

// ============================================================
// Games List
// ============================================================

function renderGamesList(allGames) {
  const { id: myId } = getLocalPlayer();
  const entries = Object.entries(allGames || {}).filter(([, g]) => g.status !== 'finished');

  if (entries.length === 0) {
    gamesListEl.innerHTML = '<p class="empty-state">No active games. Create one!</p>';
    return;
  }

  gamesListEl.innerHTML = entries.map(([gameId, game]) => {
    const playerCount = Object.values(game.players || {}).filter(p => p.isActive).length;
    const isMyGame = game.players && game.players[myId];
    const statusLabel = game.status === 'lobby' ? 'Waiting' : 'In Progress';
    const pillClass = game.status === 'lobby' ? 'pill-lobby' : 'pill-playing';

    return `
      <div class="game-list-item" data-game-id="${gameId}">
        <div>
          <div class="game-name">${game.displayName || gameId}</div>
          <div class="game-meta">${playerCount} player${playerCount !== 1 ? 's' : ''} · ${gameId}${isMyGame ? ' · Your game' : ''}</div>
        </div>
        <span class="game-status-pill ${pillClass}">${statusLabel}</span>
      </div>
    `;
  }).join('');

  gamesListEl.querySelectorAll('.game-list-item').forEach(el => {
    el.addEventListener('click', async () => {
      const gameId = el.dataset.gameId;
      const { id, name } = getLocalPlayer();
      try {
        await joinGame(gameId, name, id);
        enterGame(gameId);
      } catch (err) {
        alert(`Cannot join: ${err.message}`);
      }
    });
  });
}

// ============================================================
// Game History
// ============================================================

async function loadHistory() {
  try {
    const history = await getGameHistory(10);
    renderHistory(history);
  } catch {
    historyListEl.innerHTML = '<p class="empty-state">Could not load history.</p>';
  }
}

function renderHistory(history) {
  if (!history || history.length === 0) {
    historyListEl.innerHTML = '<p class="empty-state">No games played yet.</p>';
    return;
  }

  historyListEl.innerHTML = history.map(game => {
    const winnerName = game.players?.[game.winner]?.name || '—';
    const playerList = Object.values(game.players || {}).map(p => p.name).join(', ');
    const elapsed = game.duration ? `${Math.round(game.duration / 60000)}m` : '';
    return `
      <div class="game-list-item">
        <div>
          <div class="game-name">${game.displayName || game.gameId}</div>
          <div class="game-meta">Winner: ${winnerName} · ${playerList}${elapsed ? ` · ${elapsed}` : ''}</div>
        </div>
        <span class="game-status-pill pill-finished">Finished</span>
      </div>
    `;
  }).join('');
}

// ============================================================
// Change Name
// ============================================================

changeNameBtn.addEventListener('click', () => {
  navigateTo('player-setup');
});

// ============================================================
// Navigation
// ============================================================

function enterGame(gameId) {
  setCurrentGameId(gameId);
  navigateTo('game-room');
}
