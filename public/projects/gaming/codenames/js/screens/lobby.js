/**
 * Lobby Screen — create, join, and resume games
 */

import { createGame, joinGame, listenToAllGames } from '../game/firebase-config.js';
import {
  getLocalPlayer, clearStoredPlayer, setCurrentGameId
} from '../game/game-state.js';
import { navigateTo } from '../main.js';

const lobbyPlayerName = document.getElementById('lobby-player-name');
const btnChangeName = document.getElementById('btn-change-name');
const btnCreateGame = document.getElementById('btn-create-game');
const joinCodeInput = document.getElementById('join-code-input');
const btnJoinCode = document.getElementById('btn-join-code');
const joinError = document.getElementById('join-error');
const gameListEl = document.getElementById('game-list');

let unsubscribeGames = null;

function showJoinError(msg) {
  joinError.textContent = msg;
  joinError.classList.remove('hidden');
}

function clearJoinError() {
  joinError.classList.add('hidden');
}

// Create game
btnCreateGame.addEventListener('click', async () => {
  btnCreateGame.disabled = true;
  try {
    const { id, name } = getLocalPlayer();
    const gameId = await createGame(name, id);
    setCurrentGameId(gameId);
    navigateTo('game-room');
  } catch (err) {
    console.error('Create game error:', err);
    alert('Failed to create game. Please try again.');
  } finally {
    btnCreateGame.disabled = false;
  }
});

// Join by code
btnJoinCode.addEventListener('click', () => handleJoinByCode());
joinCodeInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') handleJoinByCode();
});

async function handleJoinByCode() {
  clearJoinError();
  const code = joinCodeInput.value.trim().toUpperCase();
  if (!code) { showJoinError('Enter a game code'); return; }
  await doJoin(code);
}

async function doJoin(gameId) {
  try {
    const { id, name } = getLocalPlayer();
    await joinGame(gameId, name, id);
    setCurrentGameId(gameId);
    navigateTo('game-room');
  } catch (err) {
    showJoinError(err.message || 'Failed to join game');
  }
}

// Change name
btnChangeName.addEventListener('click', (e) => {
  e.preventDefault();
  clearStoredPlayer();
  navigateTo('player-setup');
});

// Render game list
function renderGameList(allGames) {
  const { id: myId } = getLocalPlayer();
  const entries = Object.entries(allGames || {});

  // Separate: my games (I'm a player) vs joinable (setup, I'm not in)
  const myGames = [];
  const joinableGames = [];

  for (const [gid, game] of entries) {
    if (game.status === 'finished') continue;
    const isMyGame = game.players && game.players[myId];
    if (isMyGame) {
      myGames.push([gid, game]);
    } else if (game.status === 'setup' || game.status === 'playing') {
      joinableGames.push([gid, game]);
    }
  }

  let html = '';

  if (myGames.length > 0) {
    html += '<div class="lobby-sub-section"><h3 style="font-size:0.8rem;color:#888;margin-bottom:6px;">YOUR GAMES</h3>';
    for (const [gid, game] of myGames) {
      const playerCount = Object.values(game.players || {}).filter(p => p.isActive).length;
      const statusLabel = game.status === 'setup' ? 'Setting up' : 'In progress';
      html += `
        <div class="game-list-item">
          <div class="game-info">
            <span class="game-name">${game.displayName}</span>
            <span class="game-meta">${gid} &middot; ${playerCount} players &middot; ${statusLabel}</span>
          </div>
          <button class="btn btn-sm btn-primary btn-resume" data-game-id="${gid}">Resume</button>
        </div>`;
    }
    html += '</div>';
  }

  if (joinableGames.length > 0) {
    if (myGames.length > 0) {
      html += '<div style="margin-top:12px"><h3 style="font-size:0.8rem;color:#888;margin-bottom:6px;">JOINABLE GAMES</h3>';
    }
    for (const [gid, game] of joinableGames) {
      const playerCount = Object.values(game.players || {}).filter(p => p.isActive).length;
      const statusHint = game.status === 'playing' ? ' &middot; In progress' : '';
      html += `
        <div class="game-list-item">
          <div class="game-info">
            <span class="game-name">${game.displayName}</span>
            <span class="game-meta">${gid} &middot; ${playerCount} players &middot; by ${game.createdBy}${statusHint}</span>
          </div>
          <button class="btn btn-sm btn-secondary btn-join-game" data-game-id="${gid}">Join</button>
        </div>`;
    }
    if (myGames.length > 0) html += '</div>';
  }

  if (!html) {
    html = '<p class="empty-message">No games available. Create one!</p>';
  }

  gameListEl.innerHTML = html;

  // Bind join/resume buttons
  gameListEl.querySelectorAll('.btn-join-game').forEach(btn => {
    btn.addEventListener('click', () => doJoin(btn.dataset.gameId));
  });
  gameListEl.querySelectorAll('.btn-resume').forEach(btn => {
    btn.addEventListener('click', () => {
      setCurrentGameId(btn.dataset.gameId);
      navigateTo('game-room');
    });
  });
}

// Lifecycle
window.addEventListener('screen-changed', (e) => {
  if (e.detail.screen === 'lobby') {
    const player = getLocalPlayer();
    lobbyPlayerName.textContent = player.name;
    joinCodeInput.value = '';
    clearJoinError();
    unsubscribeGames = listenToAllGames(renderGameList);
  } else {
    if (unsubscribeGames) { unsubscribeGames(); unsubscribeGames = null; }
  }
});
