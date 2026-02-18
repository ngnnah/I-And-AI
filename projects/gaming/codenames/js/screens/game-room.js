/**
 * Game Room Screen — handles setup, playing, and finished phases
 */

import { listenToGame, leaveGame, joinGame } from '../game/firebase-config.js';
import {
  getLocalPlayer, getCurrentGame, setCurrentGameId, updateCurrentGame,
  clearCurrentGame, isLocalPlayerHost, isLocalPlayerSpymaster,
  getLocalPlayerTeam, getLocalPlayerData, isLocalPlayerTurn
} from '../game/game-state.js';
import { validateClue, canStartGame, calculateRound, getActionPrompt, generateInspirationWords } from '../game/game-logic.js';
import { getModeConfig } from '../data/game-modes.js';
import {
  handleTeamJoin, handleStartGame, handleGiveClue,
  handleCardReveal, handleEndGuessing, handleNewGame,
  handleCancelGame, handleRematch
} from '../game/firebase-sync.js';
import { navigateTo } from '../main.js';

// --- DOM Elements ---
const gameDisplayName = document.getElementById('game-display-name');
const gameCode = document.getElementById('game-code');
const localPlayerInfo = document.getElementById('local-player-info');
const btnLeaveGame = document.getElementById('btn-leave-game');

// Setup phase
const phaseSetup = document.getElementById('phase-setup');
const redSpymasterSlot = document.getElementById('red-spymaster-slot');
const blueSpymasterSlot = document.getElementById('blue-spymaster-slot');
const redOperatives = document.getElementById('red-operatives');
const blueOperatives = document.getElementById('blue-operatives');
const setupErrors = document.getElementById('setup-errors');
const btnStartGame = document.getElementById('btn-start-game');
const btnCancelGameSetup = document.getElementById('btn-cancel-game-setup');

// Mid-game picker
const midGamePicker = document.getElementById('mid-game-picker');

// Playing phase
const phasePlaying = document.getElementById('phase-playing');
const roundIndicator = document.getElementById('round-indicator');
const actionPrompt = document.getElementById('action-prompt');
const redScoreEl = document.getElementById('red-score');
const redTotalEl = document.getElementById('red-total');
const blueScoreEl = document.getElementById('blue-score');
const blueTotalEl = document.getElementById('blue-total');
const btnCancelGame = document.getElementById('btn-cancel-game');
const inspirationPanel = document.getElementById('inspiration-panel');
const inspirationWord1 = document.getElementById('inspiration-word-1');
const inspirationWord2 = document.getElementById('inspiration-word-2');
const inspirationWord3 = document.getElementById('inspiration-word-3');
const btnRegenerateInspiration = document.getElementById('btn-regenerate-inspiration');
const boardEl = document.getElementById('board');
const playerRoster = document.getElementById('player-roster');
const boardLegend = document.getElementById('board-legend');
const clueInputSection = document.getElementById('clue-input-section');
const clueWordInput = document.getElementById('clue-word-input');
const clueNumberButtons = document.getElementById('clue-number-buttons');
const btnGiveClue = document.getElementById('btn-give-clue');
const clueError = document.getElementById('clue-error');
const currentClueDisplay = document.getElementById('current-clue-display');
const currentClueWord = document.getElementById('current-clue-word');
const currentClueNumber = document.getElementById('current-clue-number');
const guessesRemaining = document.getElementById('guesses-remaining');
const statusMessage = document.getElementById('status-message');
const btnStartGuessing = document.getElementById('btn-start-guessing');
const btnEndGuessing = document.getElementById('btn-end-guessing');
const clueLogEl = document.getElementById('clue-log');

// Finished phase
const phaseFinished = document.getElementById('phase-finished');
const winnerBanner = document.getElementById('winner-banner');
const winnerText = document.getElementById('winner-text');
const winReason = document.getElementById('win-reason');
const finishedBoard = document.getElementById('finished-board');
const finishedClueLog = document.getElementById('finished-clue-log');
const btnRematch = document.getElementById('btn-rematch');
const btnNewGame = document.getElementById('btn-new-game');
const btnBackLobby = document.getElementById('btn-back-lobby');

// Guess confirmation dialog
const guessConfirmOverlay = document.getElementById('guess-confirm-overlay');
const guessConfirmText = document.getElementById('guess-confirm-text');
const btnConfirmGuess = document.getElementById('btn-confirm-guess');
const btnCancelGuess = document.getElementById('btn-cancel-guess');
// Confirmation dialog removed for better UX - cards reveal immediately

// Start guessing state
let isGuessingActive = false;

let unsubscribeGame = null;
let previouslyRevealedCards = []; // Track which cards were revealed in previous render
let selectedClueNumber = 1; // Track the currently selected clue number

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

  // Reset card tracking for new game session
  previouslyRevealedCards = [];

  // Rejoin (reactivate) on reconnect
  const { id, name } = getLocalPlayer();
  joinGame(game.id, name, id).catch(() => {});

  unsubscribeGame = listenToGame(game.id, handleGameUpdate);
}

function stopListening() {
  if (unsubscribeGame) { unsubscribeGame(); unsubscribeGame = null; }
  previouslyRevealedCards = []; // Clear tracking when leaving
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
  
  // Update local player info in header
  const myData = getLocalPlayerData();
  const gameMode = data.gameMode || 'words';
  const config = getModeConfig(gameMode);
  const isDuet = config.isDuet;
  
  if (myData) {
    if (isDuet) {
      // Duet mode: show player perspective (P1/P2)
      const players = data.players || {};
      const activePlayerIds = Object.keys(players)
        .filter(id => players[id].isActive)
        .sort();
      const myId = getLocalPlayer().id;
      const playerIndex = activePlayerIds.indexOf(myId);
      const perspective = playerIndex === 0 ? 'P1' : playerIndex === 1 ? 'P2' : 'Spectator';
      
      localPlayerInfo.textContent = `${myData.name} • ${perspective}`;
      localPlayerInfo.className = 'local-player-info duet';
      localPlayerInfo.classList.remove('hidden');
    } else if (myData.team && myData.role) {
      // Competitive mode: show team and role
      const teamName = myData.team.charAt(0).toUpperCase() + myData.team.slice(1);
      const roleLabel = myData.role === 'spymaster' ? 'Spymaster' : 'Operative';
      localPlayerInfo.textContent = `${myData.name} • ${teamName} ${roleLabel}`;
      localPlayerInfo.className = `local-player-info ${myData.team}`;
      localPlayerInfo.classList.remove('hidden');
    } else {
      localPlayerInfo.classList.add('hidden');
    }
  } else {
    localPlayerInfo.classList.add('hidden');
  }

  // Show correct phase
  phaseSetup.classList.toggle('hidden', data.status !== 'setup');
  phasePlaying.classList.toggle('hidden', data.status !== 'playing');
  phaseFinished.classList.toggle('hidden', data.status !== 'finished');

  // Add turn-based class to active phase (competitive mode only)
  if (!isDuet && data.status === 'playing' && data.gameState?.currentTurn) {
    phasePlaying.className = `phase ${data.gameState.currentTurn}-turn`;
  } else if (data.status === 'playing') {
    phasePlaying.className = 'phase';
  }

  // Mid-game picker: show if game is playing but local player has no team (competitive mode only)
  const needsTeamPick = !isDuet && data.status === 'playing' && (!myData || !myData.team);
  midGamePicker.classList.toggle('hidden', !needsTeamPick);

  if (data.status === 'setup') renderSetupPhase(data);
  else if (data.status === 'playing') renderPlayingPhase(data);
  else if (data.status === 'finished') renderFinishedPhase(data);
}

// --- Setup Phase ---

function renderSetupPhase(data) {
  const myId = getLocalPlayer().id;
  const players = data.players || {};
  const gameMode = data.gameMode || 'words';
  const config = getModeConfig(gameMode);
  const isDuet = config.isDuet;

  if (isDuet) {
    // Duet mode: Simple player list, no team selection
    // Hide competitive UI, show Duet UI
    document.getElementById('teams-container')?.classList.add('hidden');
    document.getElementById('setup-instruction-competitive')?.classList.add('hidden');
    document.getElementById('duet-players-container')?.classList.remove('hidden');
    document.getElementById('setup-instruction-duet')?.classList.remove('hidden');
    
    // List all active players
    const activePlayers = Object.entries(players).filter(([, p]) => p.isActive);
    const playerCount = activePlayers.length;
    
    const duetPlayersList = document.getElementById('duet-players-list');
    if (duetPlayersList) {
      duetPlayersList.innerHTML = activePlayers.map(([id, p], index) => {
        const isYou = id === myId;
        const perspective = index === 0 ? 'P1' : index === 1 ? 'P2' : `P${index + 1}`;
        return `
          <div class="duet-player-item ${isYou ? 'is-me' : ''}">
            <span class="player-perspective">${perspective}</span>
            <span class="player-name">${p.name}${isYou ? ' (you)' : ''}</span>
          </div>
        `;
      }).join('');
    }
    
    // Show setup message
    setupErrors.classList.remove('hidden');
    setupErrors.textContent = `${playerCount} player(s) joined. Need at least 2 to start.`;
    
    // Start button (host only)
    const isHost = isLocalPlayerHost();
    const canStart = playerCount >= 2;
    
    btnStartGame.classList.toggle('hidden', !isHost);
    btnStartGame.disabled = !canStart;
    btnCancelGameSetup.classList.toggle('hidden', !isHost);
  } else {
    // Competitive mode: Show team selection
    document.getElementById('teams-container')?.classList.remove('hidden');
    document.getElementById('setup-instruction-competitive')?.classList.remove('hidden');
    document.getElementById('duet-players-container')?.classList.add('hidden');
    document.getElementById('setup-instruction-duet')?.classList.add('hidden');
    
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

    // Cancel button (host only)
    btnCancelGameSetup.classList.toggle('hidden', !isHost);

    if (isHost && !canStart && errors.length > 0) {
      setupErrors.textContent = errors.join('. ');
      setupErrors.classList.remove('hidden');
    } else {
      setupErrors.classList.add('hidden');
    }
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

// Cancel game (setup phase)
btnCancelGameSetup.addEventListener('click', async () => {
  if (!confirm('Are you sure you want to cancel this game? This will end the game for all players.')) {
    return;
  }
  const game = getCurrentGame();
  if (!game.id) return;
  try {
    await handleCancelGame(game.id);
    navigateTo('lobby');
  } catch (err) {
    console.error('Cancel game error:', err);
  }
});

// Cancel game (playing phase)
btnCancelGame.addEventListener('click', async () => {
  if (!confirm('Are you sure you want to cancel this game? This will end the game for all players.')) {
    return;
  }
  const game = getCurrentGame();
  if (!game.id) return;
  try {
    await handleCancelGame(game.id);
    navigateTo('lobby');
  } catch (err) {
    console.error('Cancel game error:', err);
  }
});

// Regenerate inspiration words (client-side only)
btnRegenerateInspiration.addEventListener('click', () => {
  const game = getCurrentGame();
  const boardWords = game.data?.board?.words || [];
  const gameMode = game.data?.gameMode || 'pictures';
  const newWords = generateInspirationWords(boardWords, [], gameMode);
  
  inspirationWord1.textContent = newWords[0] || '—';
  inspirationWord2.textContent = newWords[1] || '—';
  inspirationWord3.textContent = newWords[2] || '—';
});

// --- Playing Phase ---

function renderPlayingPhase(data) {
  const gs = data.gameState;
  if (!gs) return;

  const gameMode = data.gameMode || 'words';
  const config = getModeConfig(gameMode);
  const isDuet = config.isDuet;

  // Round indicator
  const currentRound = calculateRound(data.clueLog, data.startingTeam);
  roundIndicator.textContent = `Round ${currentRound}`;

  // Scores - different for Duet vs competitive
  if (isDuet) {
    // Duet mode: Show turns and mistakes
    const turnsUsed = gs.turnsUsed || 0;
    const mistakesMade = gs.mistakesMade || 0;
    const maxTurns = config.maxTurns || 9;
    const maxMistakes = config.maxMistakes || 9;
    
    redScoreEl.textContent = turnsUsed;
    redTotalEl.textContent = maxTurns;
    blueScoreEl.textContent = mistakesMade;
    blueTotalEl.textContent = maxMistakes;
    
    // Update labels (need to add elements for this or reuse existing)
    // For now, use the existing score elements
  } else {
    // Competitive mode: Show team scores
    redScoreEl.textContent = gs.redRevealed;
    redTotalEl.textContent = gs.redTotal;
    blueScoreEl.textContent = gs.blueRevealed;
    blueTotalEl.textContent = gs.blueTotal;
  }

  // Cancel button (host only)
  const isHost = isLocalPlayerHost();
  btnCancelGame.classList.toggle('hidden', !isHost);

  // Action prompt with team colors
  const myTeam = getLocalPlayerTeam();
  const myRole = getLocalPlayerData()?.role;
  
  let promptText = '';
  
  if (isDuet) {
    // Duet mode prompts - show whose turn it is
    const clueDisplay = gs.currentClue ? `${gs.currentClue.word} ${gs.currentClue.number}` : '';
    const greenRevealed = gs.greenRevealed || 0;
    const greenTotal = config.greenCount || 15;
    const currentPlayer = gs.currentPlayer || 1;
    
    // Determine if it's the local player's turn
    const players = data.players || {};
    const activePlayerIds = Object.keys(players).filter(id => players[id].isActive).sort();
    const myId = getLocalPlayer().id;
    const playerIndex = activePlayerIds.indexOf(myId);
    const isMyTurn = (playerIndex === 0 && currentPlayer === 1) || (playerIndex === 1 && currentPlayer === 2);
    
    const currentPlayerLabel = currentPlayer === 1 ? 'P1' : 'P2';
    
    if (gs.phase === 'clue') {
      if (isMyTurn) {
        promptText = `🤝 YOUR TURN (${currentPlayerLabel}): Give a clue (${greenRevealed}/${greenTotal} green found)`;
      } else {
        promptText = `🤝 ${currentPlayerLabel} is giving a clue... (${greenRevealed}/${greenTotal} green found)`;
      }
    } else if (gs.phase === 'guess') {
      if (isMyTurn) {
        promptText = `🤝 YOUR TURN (${currentPlayerLabel}): Guessing "${clueDisplay}" (${gs.guessesRemaining} left)`;
      } else {
        promptText = `🤝 ${currentPlayerLabel} is guessing "${clueDisplay}"`;
      }
    }
  } else {
    // Competitive mode prompts
    const turnTeam = gs.currentTurn;
    const teamLabel = turnTeam === 'red' ? 'Red' : 'Blue';
    const clueDisplay = gs.currentClue ? `${gs.currentClue.word} ${gs.currentClue.number}` : '';
    
    if (gs.phase === 'clue') {
      if (myRole === 'spymaster' && myTeam === turnTeam) {
        promptText = '🎯 YOUR TURN: Give a clue';
      } else {
        promptText = `${teamLabel} is giving a clue...`;
      }
    } else if (gs.phase === 'guess') {
      if (myRole === 'operative' && myTeam === turnTeam) {
        promptText = `🎯 ${teamLabel} is guessing "${clueDisplay}" (${gs.guessesRemaining} left)`;
      } else {
        promptText = `${teamLabel} is guessing "${clueDisplay}"`;
      }
    }
  }
  
  actionPrompt.textContent = promptText;
  
  // Set color classes
  actionPrompt.className = 'action-prompt';
  
  if (isDuet) {
    // Duet mode: always show cooperative color
    actionPrompt.classList.add('my-turn'); // Use my-turn for active state
  } else {
    // Competitive mode: highlight based on whose turn it is
    const turnTeam = gs.currentTurn;
    const isMyTurn = turnTeam === myTeam && (
      (gs.phase === 'clue' && myRole === 'spymaster') ||
      (gs.phase === 'guess' && myRole === 'operative')
    );
    if (isMyTurn) {
      actionPrompt.classList.add('my-turn');
    } else {
      actionPrompt.classList.add(`${turnTeam}-turn`);
    }
  }

  // Inspiration panel (spymasters only for competitive, everyone for Duet)
  const isSpy = isLocalPlayerSpymaster();
  inspirationPanel.classList.toggle('hidden', !(isSpy || isDuet));
  if (isSpy || isDuet) {
    // Generate local inspiration words if not already displayed
    if (!inspirationWord1.textContent || inspirationWord1.textContent === '—') {
      const boardWords = data.board?.words || [];
      const gameMode = data.gameMode || 'pictures';
      const words = generateInspirationWords(boardWords, [], gameMode);
      inspirationWord1.textContent = words[0] || '—';
      inspirationWord2.textContent = words[1] || '—';
      inspirationWord3.textContent = words[2] || '—';
    }
  }

  // Legend (spymaster only for competitive, everyone for Duet)
  boardLegend.classList.toggle('hidden', !(isSpy || isDuet));

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
  const localId = getLocalPlayer().id;
  const gameMode = data.gameMode || 'words';
  const config = getModeConfig(gameMode);
  const isDuet = config.isDuet;

  if (isDuet) {
    // Duet mode: Show all players in order (P1, P2, spectators)
    const activePlayerIds = Object.keys(players)
      .filter(id => players[id].isActive)
      .sort(); // Sort for consistent P1/P2 assignment
    
    const playerBadges = activePlayerIds.map((id, index) => {
      const p = players[id];
      const isYou = id === localId;
      const perspective = index === 0 ? 'P1' : index === 1 ? 'P2' : 'Spectator';
      const name = isYou ? `${p.name} (you)` : p.name;
      return `<span class="player-badge duet"><span class="role-icon">${perspective}</span>${name}</span>`;
    });

    playerRoster.innerHTML = `
      <div class="roster-duet">${playerBadges.join(' ') || '<span class="empty-message" style="color: var(--text-muted); font-size: 0.8rem;">No players</span>'}</div>
    `;
  } else {
    // Competitive mode: Show red and blue teams
    const redPlayers = [];
    const bluePlayers = [];

    Object.entries(players).forEach(([id, p]) => {
      if (!p.isActive || !p.team || !p.role) return;
      
      const isYou = id === localId;
      const roleIcon = p.role === 'spymaster' ? '🎯' : '🔍';
      const name = isYou ? `${p.name} (you)` : p.name;
      const badge = `<span class="player-badge ${p.team}"><span class="role-icon">${roleIcon}</span>${name}</span>`;
      
      if (p.team === 'red') redPlayers.push(badge);
      else if (p.team === 'blue') bluePlayers.push(badge);
    });

    playerRoster.innerHTML = `
      <div class="roster-red-team">${redPlayers.join(' ') || '<span class="empty-message" style="color: var(--text-muted); font-size: 0.8rem;">No red players</span>'}</div>
      <div class="roster-divider"></div>
      <div class="roster-blue-team">${bluePlayers.join(' ') || '<span class="empty-message" style="color: var(--text-muted); font-size: 0.8rem;">No blue players</span>'}</div>
    `;
  }
}

function renderBoard(data, container, isFinished) {
  const gs = data.gameState;
  const gameMode = data.gameMode || 'words';
  const config = getModeConfig(gameMode);
  const isDuet = config.isDuet;
  
  // Handle Duet mode's dual color maps
  let colorMap;
  let revealed;
  
  if (isDuet) {
    // Use board/revealed for Duet mode
    revealed = data.board.revealed || [];
    
    // Determine player perspective (P1 or P2)
    const localId = getLocalPlayer().id;
    const players = data.players || {};
    const activePlayerIds = Object.keys(players)
      .filter(id => players[id].isActive)
      .sort(); // Sort alphabetically for consistent ordering
    
    const playerIndex = activePlayerIds.indexOf(localId);
    const isP1 = playerIndex === 0;
    
    // Use appropriate color map based on perspective
    colorMap = isP1 ? data.board.colorMapP1 : data.board.colorMapP2;
    
    // Fallback to P1 if no map found
    if (!colorMap) colorMap = data.board.colorMapP1 || [];
  } else {
    // Standard competitive mode
    colorMap = data.board.colorMap;
    revealed = gs.revealedCards;
  }
  
  const totalCards = colorMap.length;
  const isPicture = config.cardType === 'image';
  const isSpy = isLocalPlayerSpymaster();
  const myTeam = getLocalPlayerTeam();
  const canClick = !isFinished && gs.phase === 'guess' && (isDuet || gs.currentTurn === myTeam) && !isSpy;

  container.innerHTML = '';
  
  // Build class names
  let classNames = ['board'];
  if (isDuet) classNames.push('board-duet');
  if (isPicture) classNames.push('board-pictures');
  if (isFinished) classNames.push('board-finished');
  container.className = classNames.join(' ');

  for (let i = 0; i < totalCards; i++) {
    const card = document.createElement('div');
    card.className = isPicture ? 'card card-picture' : 'card';

    // Add card number
    const cardNumber = document.createElement('div');
    cardNumber.className = 'card-number';
    cardNumber.textContent = i + 1;
    card.appendChild(cardNumber);

    if (isPicture && data.board.cardIds) {
      const img = document.createElement('img');
      const cardId = data.board.cardIds[i];
      img.src = config.cardList
        ? `${config.imageDir}${config.cardList[cardId]}`
        : `${config.imageDir}card-${cardId}.jpg`;
      img.alt = `Card ${cardId}`;
      img.draggable = false;
      card.appendChild(img);
    } else {
      const cardText = document.createElement('div');
      cardText.className = 'card-text';
      cardText.textContent = data.board.words ? data.board.words[i] : `Card ${i + 1}`;
      card.appendChild(cardText);
    }

    const isRevealed = revealed[i] || isFinished;
    const wasAlreadyRevealed = previouslyRevealedCards[i];
    const isNewlyRevealed = isRevealed && !wasAlreadyRevealed && !isFinished;

    if (isRevealed) {
      const color = colorMap[i];
      card.classList.add(`revealed-${color}`);
      if (isNewlyRevealed) {
        card.classList.add('just-revealed');
      }
      if ((isSpy || isDuet) && !isFinished) card.classList.add('revealed-dimmed');
    } else if (isSpy || isDuet) {
      // Show spy view for spymasters OR everyone in Duet mode
      card.classList.add(`spy-${colorMap[i]}`);
    } else {
      card.classList.add('unrevealed');
      if (canClick) {
        // Check if it's player's turn for Duet mode
        let canClickCard = false;
        if (isDuet) {
          const currentPlayer = gs.currentPlayer || 1;
          const players = data.players || {};
          const activePlayerIds = Object.keys(players).filter(id => players[id].isActive).sort();
          const myId = getLocalPlayer().id;
          const playerIndex = activePlayerIds.indexOf(myId);
          const isMyTurn = (playerIndex === 0 && currentPlayer === 1) || (playerIndex === 1 && currentPlayer === 2);
          // Duet mode: must click Start Guessing first
          canClickCard = isMyTurn && isGuessingActive;
        } else {
          // Competitive mode: only clickable after Start Guessing
          canClickCard = isGuessingActive;
        }
        
        if (canClickCard) {
          card.classList.add('clickable');
          card.addEventListener('click', () => onCardClick(i));
        }
      }
    }

    container.appendChild(card);
  }
  
  // Update the tracking array for next render
  if (!isFinished) {
    previouslyRevealedCards = [...revealed];
  }
}

async function onCardClick(cardIndex) {
  const game = getCurrentGame();
  if (!game.id || !game.data) return;
  
  const data = game.data;
  const gs = data.gameState;
  const myRole = getLocalPlayerData()?.role;
  const myTeam = getLocalPlayerTeam();
  const gameMode = data.gameMode || 'words';
  const config = getModeConfig(gameMode);
  const isDuet = config.isDuet;

  // Check if player can guess
  if (gs.phase !== 'guess') return;
  
  // In Duet mode, both players can guess; in competitive mode, only current team's operative can guess
  if (isDuet) {
    // Duet: only current player can guess
    const currentPlayer = gs.currentPlayer || 1;
    const players = data.players || {};
    const activePlayerIds = Object.keys(players).filter(id => players[id].isActive).sort();
    const myId = getLocalPlayer().id;
    const playerIndex = activePlayerIds.indexOf(myId);
    const isMyTurn = (playerIndex === 0 && currentPlayer === 1) || (playerIndex === 1 && currentPlayer === 2);
    
    if (!isMyTurn) return;
  } else {
    // Competitive: only operatives on current turn can guess
    if (myRole !== 'operative' || myTeam !== gs.currentTurn) return;
  }

  // Card already revealed - check correct array based on mode
  const revealedArray = isDuet ? (data.board.revealed || []) : (gs.revealedCards || []);
  if (revealedArray[cardIndex]) return;

  // Reveal card immediately (no confirmation needed)
  const myName = getLocalPlayer().name;
  await handleCardReveal(game.id, cardIndex, myName);
}

function renderClueArea(data) {
  const gs = data.gameState;
  const gameMode = data.gameMode || 'words';
  const config = getModeConfig(gameMode);
  const isDuet = config.isDuet;
  
  const isSpy = isLocalPlayerSpymaster();
  const myTeam = getLocalPlayerTeam();
  const isMyTurn = gs.currentTurn === myTeam;

  // Hide all sections first
  clueInputSection.classList.add('hidden');
  currentClueDisplay.classList.add('hidden');
  btnStartGuessing.classList.add('hidden');
  btnEndGuessing.classList.add('hidden');
  clueError.classList.add('hidden');
  statusMessage.textContent = '';

  // Reset guessing state when entering clue phase
  if (gs.phase === 'clue') {
    isGuessingActive = false;
  }

  if (gs.phase === 'clue') {
    if (isDuet) {
      // Duet: only current player can give a clue
      const currentPlayer = gs.currentPlayer || 1;
      const players = data.players || {};
      const activePlayerIds = Object.keys(players).filter(id => players[id].isActive).sort();
      const myId = getLocalPlayer().id;
      const playerIndex = activePlayerIds.indexOf(myId);
      const isMyTurn = (playerIndex === 0 && currentPlayer === 1) || (playerIndex === 1 && currentPlayer === 2);
      
      if (isMyTurn) {
        clueInputSection.classList.remove('hidden');
      } else {
        const currentPlayerLabel = currentPlayer === 1 ? 'P1' : 'P2';
        statusMessage.textContent = `Waiting for ${currentPlayerLabel} to give a clue...`;
      }
    } else if (isSpy && isMyTurn) {
      // Competitive: Active spymaster shows clue input
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

    if (isDuet) {
      // Duet: only current player can guess and end guessing
      const currentPlayer = gs.currentPlayer || 1;
      const players = data.players || {};
      const activePlayerIds = Object.keys(players).filter(id => players[id].isActive).sort();
      const myId = getLocalPlayer().id;
      const playerIndex = activePlayerIds.indexOf(myId);
      const isMyTurn = (playerIndex === 0 && currentPlayer === 1) || (playerIndex === 1 && currentPlayer === 2);
      
      if (isMyTurn) {
        if (!isGuessingActive) {
          // Show Start Guessing button
          btnStartGuessing.classList.remove('hidden');
          statusMessage.textContent = 'Click "Start Guessing" when ready to make your guesses.';
        } else {
          // Show End Guessing button (guessing is active)
          btnEndGuessing.classList.remove('hidden');
          statusMessage.textContent = 'Click a card to guess, or end guessing.';
        }
      } else {
        const currentPlayerLabel = currentPlayer === 1 ? 'P1' : 'P2';
        statusMessage.textContent = `${currentPlayerLabel} is guessing...`;
      }
    } else {
      // Competitive mode
      const myData = getLocalPlayerData();
      const isOperative = myData?.role === 'operative';
      if (isMyTurn && isOperative) {
        if (!isGuessingActive) {
          // Show Start Guessing button
          btnStartGuessing.classList.remove('hidden');
          statusMessage.textContent = 'Click "Start Guessing" when ready to make your guesses.';
        } else {
          // Show End Guessing button (guessing is active)
          btnEndGuessing.classList.remove('hidden');
          statusMessage.textContent = 'Click a card to guess, or end guessing.';
        }
      } else if (isMyTurn && isSpy) {
        statusMessage.textContent = 'Your operatives are guessing...';
      } else {
        const teamLabel = gs.currentTurn === 'red' ? 'Red' : 'Blue';
        statusMessage.textContent = `${teamLabel} Team is guessing...`;
      }
    }
  }
}

// Give clue
btnGiveClue.addEventListener('click', handleGiveClueClick);
clueWordInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') handleGiveClueClick();
});

// Clue number button selection
clueNumberButtons.addEventListener('click', (e) => {
  const btn = e.target.closest('.btn-clue-number');
  if (!btn) return;
  
  const number = parseInt(btn.dataset.number, 10);
  selectedClueNumber = number;
  
  // Update button states
  clueNumberButtons.querySelectorAll('.btn-clue-number').forEach(b => {
    b.classList.toggle('selected', b === btn);
  });
});

// Initialize first button as selected
const firstBtn = clueNumberButtons.querySelector('.btn-clue-number[data-number="1"]');
if (firstBtn) firstBtn.classList.add('selected');

async function handleGiveClueClick() {
  clueError.classList.add('hidden');
  const game = getCurrentGame();
  if (!game.id || !game.data) return;

  const word = clueWordInput.value.trim();
  const number = selectedClueNumber;
  const { valid, error } = validateClue(word, number, game.data.board.words || []);

  if (!valid) {
    clueError.textContent = error;
    clueError.classList.remove('hidden');
    return;
  }

  btnGiveClue.disabled = true;
  try {
    const myName = getLocalPlayer().name;
    const gameMode = game.data.gameMode || 'words';
    const config = getModeConfig(gameMode);
    const myTeam = config.isDuet ? 'duet' : getLocalPlayerTeam();
    
    await handleGiveClue(game.id, word, number, myName, myTeam);
    clueWordInput.value = '';
    // Reset to number 1
    selectedClueNumber = 1;
    clueNumberButtons.querySelectorAll('.btn-clue-number').forEach(b => {
      b.classList.toggle('selected', b.dataset.number === '1');
    });
  } catch (err) {
    console.error('Give clue error:', err);
  } finally {
    btnGiveClue.disabled = false;
  }
}

// Start guessing (competitive mode only - prevents accidental taps)
btnStartGuessing.addEventListener('click', () => {
  isGuessingActive = true;
  // Re-render to update UI
  const game = getCurrentGame();
  if (game.data) {
    renderClueArea(game.data);
    renderBoard(game.data, boardEl, false);
  }
});

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
    // Duet mode won't have a team field, so default to neutral styling
    const teamClass = entry.team === 'red' ? 'log-red' : entry.team === 'blue' ? 'log-blue' : '';
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
    
    // Use actual card color for styling
    const color = g.color || (g.result === 'correct' ? 'team' : 'neutral');
    const cls = `log-guess log-guess-${color}`;
    const symbol = g.result === 'correct' ? '✓' : '✗';
    return `<span class="${cls}">${g.word} ${symbol}</span>`;
  }).join(' · ');
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

  // Rematch and New game buttons (host only)
  const isHost = isLocalPlayerHost();
  btnRematch.classList.toggle('hidden', !isHost);
  btnNewGame.classList.toggle('hidden', !isHost);
  
  // Trigger victory confetti
  launchConfetti(winner);
}

// Confetti celebration
function launchConfetti(winner) {
  const container = document.getElementById('confetti-container');
  if (!container) return;
  
  container.innerHTML = ''; // Clear old confetti
  
  const colors = winner === 'red' 
    ? ['#d32f2f', '#f44336', '#ef5350', '#ffcdd2', '#ff8a80']
    : ['#1565c0', '#2196f3', '#42a5f5', '#bbdefb', '#82b1ff'];
  
  const confettiCount = 150;
  
  for (let i = 0; i < confettiCount; i++) {
    setTimeout(() => {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.left = Math.random() * 100 + '%';
      confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
      confetti.style.animationDelay = '0s';
      container.appendChild(confetti);
      
      // Remove after animation
      setTimeout(() => confetti.remove(), 5000);
    }, i * 20);
  }
}

btnRematch.addEventListener('click', async () => {
  const game = getCurrentGame();
  if (!game.id) return;
  btnRematch.disabled = true;
  try {
    await handleRematch(game.id);
  } catch (err) {
    console.error('Rematch error:', err);
  } finally {
    btnRematch.disabled = false;
  }
});

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

// Guess confirmation dialog handlers - DISABLED (cards reveal immediately)
/*
btnConfirmGuess.addEventListener('click', async () => {
  if (pendingCardIndex !== null) {
    const game = getCurrentGame();
    const myName = getLocalPlayer().name;
    await handleCardReveal(game.id, pendingCardIndex, myName);
    pendingCardIndex = null;
  }
  guessConfirmOverlay.classList.add('hidden');
});

btnCancelGuess.addEventListener('click', () => {
  pendingCardIndex = null;
  guessConfirmOverlay.classList.add('hidden');
});

// Close on overlay click
guessConfirmOverlay.addEventListener('click', (e) => {
  if (e.target === guessConfirmOverlay) {
    pendingCardIndex = null;
    guessConfirmOverlay.classList.add('hidden');
  }
});
*/
