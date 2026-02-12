/**
 * Game Room Screen — handles setup, playing, and finished phases
 */

import { listenToGame, leaveGame, joinGame } from '../game/firebase-config.js';
import {
  getLocalPlayer, getCurrentGame, setCurrentGameId, updateCurrentGame,
  clearCurrentGame, isLocalPlayerHost, isLocalPlayerSpymaster,
  getLocalPlayerTeam, getLocalPlayerData, isLocalPlayerTurn
} from '../game/game-state.js';
import { validateClue, canStartGame } from '../game/game-logic.js';
import { getModeConfig } from '../data/game-modes.js';
import {
  handleTeamJoin, handleStartGame, handleGiveClue,
  handleCardReveal, handleEndGuessing, handleNewGame
} from '../game/firebase-sync.js';
import { navigateTo } from '../main.js';

// --- DOM Elements ---
const gameDisplayName = document.getElementById('game-display-name');
const gameCode = document.getElementById('game-code');
const btnLeaveGame = document.getElementById('btn-leave-game');

// Setup phase
const phaseSetup = document.getElementById('phase-setup');
const redSpymasterSlot = document.getElementById('red-spymaster-slot');
const blueSpymasterSlot = document.getElementById('blue-spymaster-slot');
const redOperatives = document.getElementById('red-operatives');
const blueOperatives = document.getElementById('blue-operatives');
const setupErrors = document.getElementById('setup-errors');
const btnStartGame = document.getElementById('btn-start-game');

// Mid-game picker
const midGamePicker = document.getElementById('mid-game-picker');

// Playing phase
const phasePlaying = document.getElementById('phase-playing');
const turnIndicator = document.getElementById('turn-indicator');
const redScoreEl = document.getElementById('red-score');
const redTotalEl = document.getElementById('red-total');
const blueScoreEl = document.getElementById('blue-score');
const blueTotalEl = document.getElementById('blue-total');
const boardEl = document.getElementById('board');
const playerRoster = document.getElementById('player-roster');
const boardLegend = document.getElementById('board-legend');
const clueInputSection = document.getElementById('clue-input-section');
const clueWordInput = document.getElementById('clue-word-input');
const clueNumberSelect = document.getElementById('clue-number-select');
const btnGiveClue = document.getElementById('btn-give-clue');
const clueError = document.getElementById('clue-error');
const currentClueDisplay = document.getElementById('current-clue-display');
const currentClueWord = document.getElementById('current-clue-word');
const currentClueNumber = document.getElementById('current-clue-number');
const guessesRemaining = document.getElementById('guesses-remaining');
const statusMessage = document.getElementById('status-message');
const btnEndGuessing = document.getElementById('btn-end-guessing');
const clueLogEl = document.getElementById('clue-log');

// Finished phase
const phaseFinished = document.getElementById('phase-finished');
const winnerBanner = document.getElementById('winner-banner');
const winnerText = document.getElementById('winner-text');
const winReason = document.getElementById('win-reason');
const finishedBoard = document.getElementById('finished-board');
const finishedClueLog = document.getElementById('finished-clue-log');
const btnNewGame = document.getElementById('btn-new-game');
const btnBackLobby = document.getElementById('btn-back-lobby');

let unsubscribeGame = null;

// --- Lifecycle ---

window.addEventListener('screen-changed', (e) => {
  if (e.detail.screen === 'game-room') {
    startListening();
  } else {
    stopListening();
  }
});

function startListening() {
  const game = getCurrentGame();
  if (!game.id) { navigateTo('lobby'); return; }

  // Rejoin (reactivate) on reconnect
  const { id, name } = getLocalPlayer();
  joinGame(game.id, name, id).catch(() => {});

  unsubscribeGame = listenToGame(game.id, handleGameUpdate);
}

function stopListening() {
  if (unsubscribeGame) { unsubscribeGame(); unsubscribeGame = null; }
}

// --- Main Update Handler ---

function handleGameUpdate(data) {
  if (!data) {
    navigateTo('lobby');
    return;
  }

  updateCurrentGame(data);
  const game = getCurrentGame();

  // Header
  gameDisplayName.textContent = data.displayName || '';
  gameCode.textContent = game.id;

  // Show correct phase
  phaseSetup.classList.toggle('hidden', data.status !== 'setup');
  phasePlaying.classList.toggle('hidden', data.status !== 'playing');
  phaseFinished.classList.toggle('hidden', data.status !== 'finished');

  // Mid-game picker: show if game is playing but local player has no team
  const myData = getLocalPlayerData();
  const needsTeamPick = data.status === 'playing' && (!myData || !myData.team);
  midGamePicker.classList.toggle('hidden', !needsTeamPick);

  if (data.status === 'setup') renderSetupPhase(data);
  else if (data.status === 'playing') renderPlayingPhase(data);
  else if (data.status === 'finished') renderFinishedPhase(data);
}

// --- Setup Phase ---

function renderSetupPhase(data) {
  const myId = getLocalPlayer().id;
  const players = data.players || {};

  // Render team slots
  renderSpymasterSlot(redSpymasterSlot, players, 'red', myId);
  renderSpymasterSlot(blueSpymasterSlot, players, 'blue', myId);
  renderOperatives(redOperatives, players, 'red', myId);
  renderOperatives(blueOperatives, players, 'blue', myId);

  // Start button (host only)
  const isHost = isLocalPlayerHost();
  const { canStart, errors } = canStartGame(players);

  btnStartGame.classList.toggle('hidden', !isHost);
  btnStartGame.disabled = !canStart;

  if (isHost && !canStart && errors.length > 0) {
    setupErrors.textContent = errors.join('. ');
    setupErrors.classList.remove('hidden');
  } else {
    setupErrors.classList.add('hidden');
  }
}

function renderSpymasterSlot(slotEl, players, team, myId) {
  const spy = Object.entries(players).find(
    ([, p]) => p.isActive && p.team === team && p.role === 'spymaster'
  );

  if (spy) {
    const [pid, p] = spy;
    const isMe = pid === myId;
    slotEl.innerHTML = `<span>${p.name}${isMe ? ' (you)' : ''}</span>`;
    slotEl.classList.add('filled');
    slotEl.classList.toggle('is-me', isMe);
  } else {
    slotEl.innerHTML = '<span class="slot-empty">Click to join</span>';
    slotEl.classList.remove('filled', 'is-me');
  }
}

function renderOperatives(listEl, players, team, myId) {
  const ops = Object.entries(players).filter(
    ([, p]) => p.isActive && p.team === team && p.role === 'operative'
  );

  listEl.innerHTML = ops.map(([pid, p]) => {
    const isMe = pid === myId;
    return `<div class="operative-item${isMe ? ' is-me' : ''}">${p.name}${isMe ? ' (you)' : ''}</div>`;
  }).join('');
}

// Team join handlers
redSpymasterSlot.addEventListener('click', () => joinTeamRole('red', 'spymaster'));
blueSpymasterSlot.addEventListener('click', () => joinTeamRole('blue', 'spymaster'));

document.querySelectorAll('.btn-join-operative').forEach(btn => {
  btn.addEventListener('click', () => {
    joinTeamRole(btn.dataset.team, btn.dataset.role);
  });
});

async function joinTeamRole(team, role) {
  const game = getCurrentGame();
  if (!game.id || game.data?.status !== 'setup') return;
  const myId = getLocalPlayer().id;

  // If clicking spymaster slot that's already taken by someone else, ignore
  if (role === 'spymaster') {
    const players = game.data.players || {};
    const existing = Object.entries(players).find(
      ([, p]) => p.isActive && p.team === team && p.role === 'spymaster'
    );
    if (existing && existing[0] !== myId) return;
  }

  await handleTeamJoin(game.id, myId, team, role);
}

// Start game
btnStartGame.addEventListener('click', async () => {
  const game = getCurrentGame();
  if (!game.id) return;
  btnStartGame.disabled = true;
  try {
    await handleStartGame(game.id);
  } catch (err) {
    console.error('Start game error:', err);
  }
});

// --- Playing Phase ---

function renderPlayingPhase(data) {
  const gs = data.gameState;
  if (!gs) return;

  // Score bar
  const turnTeam = gs.currentTurn;
  const turnLabel = turnTeam === 'red' ? "Red Team's Turn" : "Blue Team's Turn";
  const phaseLabel = gs.phase === 'clue' ? '(giving clue)' : '(guessing)';
  turnIndicator.textContent = `${turnLabel} ${phaseLabel}`;
  turnIndicator.className = `turn-indicator ${turnTeam}`;

  redScoreEl.textContent = gs.redRevealed;
  redTotalEl.textContent = gs.redTotal;
  blueScoreEl.textContent = gs.blueRevealed;
  blueTotalEl.textContent = gs.blueTotal;

  // Legend (spymaster only)
  boardLegend.classList.toggle('hidden', !isLocalPlayerSpymaster());

  // Player roster
  renderPlayerRoster(data);

  // Board
  renderBoard(data, boardEl, false);

  // Clue area
  renderClueArea(data);

  // Clue log
  renderClueLog(data.clueLog, clueLogEl);
}

function renderPlayerRoster(data) {
  const players = data.players || {};
  const gs = data.gameState;
  const localId = getLocalPlayer().id;
  const activeTurn = gs.currentTurn;

  const buildTeamHtml = (team) => {
    const teamPlayers = Object.entries(players)
      .filter(([, p]) => p.isActive && p.team === team)
      .sort((a, b) => {
        // Spymaster first, then operatives
        if (a[1].role === 'spymaster') return -1;
        if (b[1].role === 'spymaster') return 1;
        return 0;
      });

    if (teamPlayers.length === 0) return '';

    const playersHtml = teamPlayers.map(([id, p]) => {
      const isYou = id === localId;
      const isActive = team === activeTurn;
      const classes = ['roster-player'];
      if (isActive) classes.push('is-active-turn');
      if (isYou) classes.push('is-you');
      const roleLabel = p.role === 'spymaster' ? 'SPY' : 'OP';
      const roleClass = p.role === 'spymaster' ? 'spymaster' : 'operative';
      const name = isYou ? `${p.name} (you)` : p.name;
      return `<span class="${classes.join(' ')}"><span class="roster-role ${roleClass}">${roleLabel}</span> ${name}</span>`;
    }).join('');

    return `<div class="roster-team ${team}">${playersHtml}</div>`;
  };

  playerRoster.innerHTML = buildTeamHtml('red') + buildTeamHtml('blue');
}

function renderBoard(data, container, isFinished) {
  const gs = data.gameState;
  const colorMap = data.board.colorMap;
  const revealed = gs.revealedCards;
  const totalCards = colorMap.length;
  const gameMode = data.gameMode || 'words';
  const config = getModeConfig(gameMode);
  const isPicture = config.cardType === 'image';
  const isSpy = isLocalPlayerSpymaster();
  const myTeam = getLocalPlayerTeam();
  const canClick = !isFinished && gs.phase === 'guess' && gs.currentTurn === myTeam && !isSpy;
  const myData = getLocalPlayerData();
  const isOperative = myData?.role === 'operative';

  container.innerHTML = '';
  container.className = isFinished
    ? (isPicture ? 'board board-pictures board-finished' : 'board board-finished')
    : (isPicture ? 'board board-pictures' : 'board');

  for (let i = 0; i < totalCards; i++) {
    const card = document.createElement('div');
    card.className = isPicture ? 'card card-picture' : 'card';

    if (isPicture) {
      const img = document.createElement('img');
      const cardId = data.board.cardIds[i];
      img.src = config.cardList
        ? `${config.imageDir}${config.cardList[cardId]}`
        : `${config.imageDir}card-${cardId}.jpg`;
      img.alt = `Card ${cardId}`;
      img.draggable = false;
      card.appendChild(img);
    } else {
      card.textContent = data.board.words[i];
    }

    if (revealed[i] || isFinished) {
      const color = colorMap[i];
      card.classList.add(`revealed-${color}`);
      if (isSpy && !isFinished) card.classList.add('revealed-dimmed');
    } else if (isSpy) {
      card.classList.add(`spy-${colorMap[i]}`);
    } else {
      card.classList.add('unrevealed');
      if (canClick && isOperative) {
        card.classList.add('clickable');
        card.addEventListener('click', () => onCardClick(i));
      }
    }

    container.appendChild(card);
  }
}

async function onCardClick(cardIndex) {
  const game = getCurrentGame();
  if (!game.id || !game.data) return;
  const gs = game.data.gameState;
  if (gs.revealedCards[cardIndex]) return;

  const myName = getLocalPlayer().name;
  await handleCardReveal(game.id, cardIndex, myName);
}

function renderClueArea(data) {
  const gs = data.gameState;
  const isSpy = isLocalPlayerSpymaster();
  const myTeam = getLocalPlayerTeam();
  const isMyTurn = gs.currentTurn === myTeam;

  // Hide all sections first
  clueInputSection.classList.add('hidden');
  currentClueDisplay.classList.add('hidden');
  btnEndGuessing.classList.add('hidden');
  clueError.classList.add('hidden');
  statusMessage.textContent = '';

  if (gs.phase === 'clue') {
    if (isSpy && isMyTurn) {
      // Active spymaster — show clue input
      clueInputSection.classList.remove('hidden');
    } else {
      // Everyone else waits
      const teamLabel = gs.currentTurn === 'red' ? 'Red' : 'Blue';
      statusMessage.textContent = `Waiting for ${teamLabel} Spymaster to give a clue...`;
    }
  } else if (gs.phase === 'guess') {
    // Show current clue
    if (gs.currentClue) {
      currentClueDisplay.classList.remove('hidden');
      currentClueWord.textContent = gs.currentClue.word;
      currentClueNumber.textContent = gs.currentClue.number;
      const remaining = gs.guessesRemaining >= 99 ? 'unlimited' : gs.guessesRemaining;
      guessesRemaining.textContent = `(${remaining} left)`;
    }

    const myData = getLocalPlayerData();
    const isOperative = myData?.role === 'operative';
    if (isMyTurn && isOperative) {
      btnEndGuessing.classList.remove('hidden');
      statusMessage.textContent = 'Click a card to guess, or end guessing.';
    } else if (isMyTurn && isSpy) {
      statusMessage.textContent = 'Your operatives are guessing...';
    } else {
      const teamLabel = gs.currentTurn === 'red' ? 'Red' : 'Blue';
      statusMessage.textContent = `${teamLabel} Team is guessing...`;
    }
  }
}

// Give clue
btnGiveClue.addEventListener('click', handleGiveClueClick);
clueWordInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') handleGiveClueClick();
});

async function handleGiveClueClick() {
  clueError.classList.add('hidden');
  const game = getCurrentGame();
  if (!game.id || !game.data) return;

  const word = clueWordInput.value.trim();
  const number = parseInt(clueNumberSelect.value, 10);
  const { valid, error } = validateClue(word, number, game.data.board.words || []);

  if (!valid) {
    clueError.textContent = error;
    clueError.classList.remove('hidden');
    return;
  }

  btnGiveClue.disabled = true;
  try {
    const myName = getLocalPlayer().name;
    const myTeam = getLocalPlayerTeam();
    await handleGiveClue(game.id, word, number, myName, myTeam);
    clueWordInput.value = '';
    clueNumberSelect.value = '1';
  } catch (err) {
    console.error('Give clue error:', err);
  } finally {
    btnGiveClue.disabled = false;
  }
}

// End guessing
btnEndGuessing.addEventListener('click', async () => {
  const game = getCurrentGame();
  if (!game.id) return;
  btnEndGuessing.disabled = true;
  try {
    await handleEndGuessing(game.id);
  } catch (err) {
    console.error('End guessing error:', err);
  } finally {
    btnEndGuessing.disabled = false;
  }
});

// --- Clue Log Renderer ---

function renderClueLog(clueLog, container) {
  if (!clueLog) {
    container.innerHTML = '<p class="empty-message">No clues yet</p>';
    return;
  }

  const entries = Array.isArray(clueLog) ? clueLog : Object.values(clueLog);
  container.innerHTML = entries.map(entry => {
    if (!entry) return '';
    const teamClass = entry.team === 'red' ? 'log-red' : 'log-blue';
    const guessesHtml = renderLogGuesses(entry.guesses);
    return `
      <div class="log-entry ${teamClass}">
        <div class="log-clue">${entry.spymaster}: "${entry.word}" (${entry.number})</div>
        ${guessesHtml ? `<div class="log-guesses">${guessesHtml}</div>` : ''}
      </div>`;
  }).join('');

  // Auto-scroll to bottom
  container.scrollTop = container.scrollHeight;
}

function renderLogGuesses(guesses) {
  if (!guesses) return '';
  const items = Array.isArray(guesses) ? guesses : Object.values(guesses);
  return items.map(g => {
    if (!g) return '';
    if (g.passed) return '<span class="log-passed">passed</span>';
    const cls = g.result === 'correct' ? 'log-correct' : 'log-wrong';
    const symbol = g.result === 'correct' ? '&check;' : '&cross;';
    return `<span class="${cls}">${g.word} ${symbol}</span>`;
  }).join(' &middot; ');
}

// --- Finished Phase ---

function renderFinishedPhase(data) {
  const gs = data.gameState;
  if (!gs) return;

  const winner = gs.winner;
  winnerBanner.className = `winner-banner ${winner}-wins`;
  const winnerLabel = winner === 'red' ? 'Red' : 'Blue';
  winnerText.textContent = `${winnerLabel} Team Wins!`;
  winnerText.className = `${winner}-wins-text`;

  if (gs.winReason === 'assassin') {
    const loser = winner === 'red' ? 'Blue' : 'Red';
    winReason.textContent = `${loser} Team revealed the Assassin!`;
  } else {
    winReason.textContent = `All ${winnerLabel} agents found!`;
  }

  // Render board with all cards revealed
  renderBoard(data, finishedBoard, true);

  // Clue log
  renderClueLog(data.clueLog, finishedClueLog);

  // New game button (host only)
  btnNewGame.classList.toggle('hidden', !isLocalPlayerHost());
}

btnNewGame.addEventListener('click', async () => {
  const game = getCurrentGame();
  if (!game.id) return;
  btnNewGame.disabled = true;
  try {
    await handleNewGame(game.id);
  } catch (err) {
    console.error('New game error:', err);
  } finally {
    btnNewGame.disabled = false;
  }
});

btnBackLobby.addEventListener('click', () => {
  clearCurrentGame();
  navigateTo('lobby');
});

// Mid-game team picker
midGamePicker.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-pick-team]');
  if (!btn) return;
  const team = btn.dataset.pickTeam;
  const game = getCurrentGame();
  if (!game.id) return;
  const myId = getLocalPlayer().id;
  await handleTeamJoin(game.id, myId, team, 'operative');
});

// Leave game
btnLeaveGame.addEventListener('click', async () => {
  const game = getCurrentGame();
  if (!game.id) return;
  const myId = getLocalPlayer().id;
  await leaveGame(game.id, myId);
  clearCurrentGame();
  navigateTo('lobby');
});

// Copy game code on click
gameCode.addEventListener('click', () => {
  navigator.clipboard?.writeText(gameCode.textContent).then(() => {
    const orig = gameCode.textContent;
    gameCode.textContent = 'Copied!';
    setTimeout(() => { gameCode.textContent = orig; }, 1000);
  });
});
