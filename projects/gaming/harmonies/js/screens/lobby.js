// Lobby screen - game browser

import { getLocalPlayer } from '../game/game-state.js';
import { ref, get, listenToGamesList, listenToPlayer } from '../game/firebase-config.js';
import { createGame, startGame } from '../game/firebase-sync.js';
import { joinGame } from '../game/firebase-config.js';
import { navigateTo } from '../main.js';

let unsubscribeGames = null;
let unsubscribePlayer = null;

export async function init() {
  const player = getLocalPlayer();
  if (!player) {
    navigateTo('player-setup');
    return;
  }

  renderPlayerInfo(player);
  await loadPlayerStats(player.username);

  // Listen to games list
  unsubscribeGames = listenToGamesList(renderGamesList);

  // Setup create game button
  document.getElementById('create-game-btn').addEventListener('click', handleCreateGame);
  document.getElementById('play-solo-btn').addEventListener('click', handlePlaySolo);
}

function renderPlayerInfo(player) {
  document.getElementById('player-name').textContent = player.displayName;
}

async function loadPlayerStats(username) {
  const playerRef = ref(`players/${username}`);
  const snapshot = await get(playerRef);

  if (snapshot.exists()) {
    const data = snapshot.val();
    const stats = data.stats || {};

    document.getElementById('games-played').textContent = stats.gamesPlayed || 0;
    document.getElementById('win-rate').textContent =
      stats.gamesPlayed > 0 ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) + '%' : '0%';
    document.getElementById('high-score').textContent = stats.highScore || 0;
  }
}

function renderGamesList(games) {
  const player = getLocalPlayer();
  const myGames = [];
  const waitingGames = [];
  const joinableGames = [];

  for (const [gameId, game] of Object.entries(games)) {
    if (game.status === 'finished') continue;

    const isMyGame = game.players && game.players[player.username];

    if (isMyGame) {
      if (game.status === 'playing') {
        myGames.push([gameId, game]);
      } else {
        waitingGames.push([gameId, game]);
      }
    } else if (game.status === 'waiting' && !game.settings.soloMode) {
      joinableGames.push([gameId, game]);
    }
  }

  renderGameSection('my-games-list', myGames, 'resume');
  renderGameSection('waiting-games-list', waitingGames, 'resume');
  renderGameSection('joinable-games-list', joinableGames, 'join');
}

function renderGameSection(containerId, games, actionType) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = '';

  if (games.length === 0) {
    container.innerHTML = '<div class="empty-message">No games</div>';
    return;
  }

  for (const [gameId, game] of games) {
    const card = document.createElement('div');
    card.className = 'game-card';

    const playerCount = Object.keys(game.players || {}).length;
    const maxPlayers = game.settings.maxPlayers;

    const isMyTurn = game.currentPlayerTurn === getLocalPlayer().username;

    card.innerHTML = `
      <div class="game-card-header">
        <span class="game-name">${game.displayName}</span>
        <span class="player-count">${playerCount}/${maxPlayers} players</span>
      </div>
      <div class="game-card-body">
        ${isMyTurn ? '<span class="your-turn">Your turn!</span>' : ''}
      </div>
      <button class="action-btn ${actionType}">${actionType === 'join' ? 'Join' : 'Resume'} →</button>
    `;

    card.querySelector('.action-btn').addEventListener('click', () => {
      if (actionType === 'join') {
        handleJoinGame(gameId);
      } else {
        handleResumeGame(gameId);
      }
    });

    container.appendChild(card);
  }
}

async function handleCreateGame() {
  const player = getLocalPlayer();

  try {
    const gameId = await createGame(player.username, player.displayName, { maxPlayers: 4 });
    navigateTo('game-room', { gameId });
  } catch (error) {
    console.error('Failed to create game:', error);
    alert('Failed to create game');
  }
}

async function handlePlaySolo() {
  const player = getLocalPlayer();

  try {
    const gameId = await createGame(player.username, player.displayName, {
      maxPlayers: 1,
      soloMode: true,
      displayName: `${player.displayName}'s Solo Game`
    });
    navigateTo('game-room', { gameId });
  } catch (error) {
    console.error('Failed to create solo game:', error);
    alert('Failed to create game');
  }
}

async function handleJoinGame(gameId) {
  const player = getLocalPlayer();

  try {
    await joinGame(gameId, player.username, player.displayName, player.deviceId);
    navigateTo('game-room', { gameId });
  } catch (error) {
    console.error('Failed to join game:', error);
    alert(error.message || 'Failed to join game');
  }
}

function handleResumeGame(gameId) {
  navigateTo('game-room', { gameId });
}

export function cleanup() {
  if (unsubscribeGames) {
    unsubscribeGames();
    unsubscribeGames = null;
  }
  if (unsubscribePlayer) {
    unsubscribePlayer();
    unsubscribePlayer = null;
  }
}
