/**
 * Game Room Screen
 * Handles all game phases: waiting, discuss, placing, reveal
 */

import { listenToGame, leaveGame } from '../game/firebase-config.js';
import {
    startRound,
    startPlacing,
    setPlacedOrder,
    revealCards,
    nextRound
} from '../game/firebase-sync.js';
import {
    currentGame,
    localPlayer,
    updateCurrentGame,
    isLocalPlayerHost,
    clearCurrentGame
} from '../game/game-state.js';
import { navigateTo } from '../main.js';

// DOM elements - Header
const playerDisplayName = document.getElementById('player-display-name');
const gameCodeDisplay = document.getElementById('game-code-display');
const playerCountDisplay = document.getElementById('player-count-display');
const playerListContainer = document.getElementById('player-list');
const leaveGameBtn = document.getElementById('leave-game-btn');

// DOM elements - Phases
const phaseWaiting = document.getElementById('phase-waiting');
const phaseDiscuss = document.getElementById('phase-discuss');
const phasePlacing = document.getElementById('phase-placing');
const phaseReveal = document.getElementById('phase-reveal');

// DOM elements - Waiting phase
const roundCounter = document.getElementById('round-counter');
const successCounter = document.getElementById('success-counter');
const startRoundBtn = document.getElementById('start-round-btn');

// DOM elements - Discuss phase
const themeText = document.getElementById('theme-text');
const secretNumber = document.getElementById('secret-number');
const secretNumberValue = document.getElementById('secret-number-value');
const toggleNumberBtn = document.getElementById('toggle-number-btn');
const readyToPlaceBtn = document.getElementById('ready-to-place-btn');

// DOM elements - Placing phase
const themeReminderText = document.getElementById('theme-reminder-text');
const placedList = document.getElementById('placed-list');
const unplacedPlayers = document.getElementById('unplaced-players');
const revealBtn = document.getElementById('reveal-btn');

// DOM elements - Reveal phase
const revealThemeText = document.getElementById('reveal-theme-text');
const revealResults = document.getElementById('reveal-results');
const resultBanner = document.getElementById('result-banner');
const nextRoundBtn = document.getElementById('next-round-btn');

// State
let unsubscribeGame = null;
let numberVisible = true;

/**
 * Hide all phase divs
 */
function hideAllPhases() {
    phaseWaiting.classList.add('hidden');
    phaseDiscuss.classList.add('hidden');
    phasePlacing.classList.add('hidden');
    phaseReveal.classList.add('hidden');
}

/**
 * Get active players from game data
 * @param {Object} game - Game data
 * @returns {Array} Array of [playerId, playerData]
 */
function getActivePlayers(game) {
    if (!game.players) return [];
    return Object.entries(game.players).filter(([, p]) => p.isActive !== false);
}

/**
 * Render player list
 * @param {Object} players - Players object
 */
function renderPlayerList(players) {
    playerListContainer.innerHTML = '';

    if (!players || Object.keys(players).length === 0) {
        playerListContainer.innerHTML = '<p style="text-align: center; color: #999;">Waiting for players...</p>';
        return;
    }

    Object.entries(players).forEach(([playerId, player]) => {
        const item = document.createElement('div');
        item.className = 'player-item';

        const isHost = playerId === currentGame.data.hostId;

        item.innerHTML = `
            <span class="player-name">${player.name}</span>
            ${isHost ? '<span class="player-host">(Host)</span>' : ''}
        `;

        playerListContainer.appendChild(item);
    });
}

/**
 * Update game header info
 * @param {Object} game - Game data
 */
function updateGameHeader(game) {
    const displayName = localPlayer.name || currentGame.id;
    playerDisplayName.textContent = displayName;
    gameCodeDisplay.textContent = `Code: ${currentGame.id}`;

    const activePlayers = getActivePlayers(game);
    playerCountDisplay.textContent = `👥 ${activePlayers.length} players`;

    renderPlayerList(game.players);
}

// --- Phase Renders ---

/**
 * Render waiting phase
 * @param {Object} game - Game data
 */
function renderWaiting(game) {
    hideAllPhases();
    phaseWaiting.classList.remove('hidden');

    const roundIndex = game.gameState?.roundIndex ?? 0;
    const roundsTotal = game.settings?.roundsTotal ?? 1;
    const successCount = game.gameState?.successCount ?? 0;

    roundCounter.textContent = `Round ${roundIndex + 1} of ${roundsTotal}`;
    successCounter.textContent = `✅ ${successCount} rounds cleared`;

    const waitingHint = document.getElementById('waiting-hint');
    if (isLocalPlayerHost()) {
        startRoundBtn.classList.remove('hidden');
        waitingHint.classList.add('hidden');
    } else {
        startRoundBtn.classList.add('hidden');
        waitingHint.classList.remove('hidden');
    }
}

/**
 * Render discuss phase
 * @param {Object} game - Game data
 */
function renderDiscuss(game) {
    hideAllPhases();
    phaseDiscuss.classList.remove('hidden');

    const theme = game.gameState?.theme;
    const hand = game.gameState?.hands?.[localPlayer.id];

    themeText.textContent = theme?.text || '';

    // Reset visibility on new round
    numberVisible = true;
    secretNumberValue.textContent = hand != null ? hand : '?';
    secretNumber.classList.remove('number-hidden');

    const discussHint = document.getElementById('discuss-hint');
    if (isLocalPlayerHost()) {
        readyToPlaceBtn.classList.remove('hidden');
        discussHint.classList.add('hidden');
    } else {
        readyToPlaceBtn.classList.add('hidden');
        discussHint.classList.remove('hidden');
    }
}

/**
 * Render placing phase
 * @param {Object} game - Game data
 */
function renderPlacing(game) {
    hideAllPhases();
    phasePlacing.classList.remove('hidden');

    const theme = game.gameState?.theme;
    themeReminderText.textContent = theme?.text || '';

    const activePlayers = getActivePlayers(game);
    const placedOrder = game.gameState?.placedOrder || [];
    const placedSet = new Set(placedOrder);
    const unplacedPlayersList = activePlayers.filter(([id]) => !placedSet.has(id));
    const isHost = isLocalPlayerHost();

    // Render placed list
    placedList.innerHTML = '';
    placedOrder.forEach((playerId, index) => {
        const player = game.players[playerId];
        if (!player) return;

        const item = document.createElement('div');
        item.className = 'placed-item';

        let controlsHTML = '';
        if (isHost) {
            controlsHTML = `
                <span class="placement-controls">
                    <button class="move-up-btn" data-index="${index}" ${index === 0 ? 'disabled' : ''}>↑</button>
                    <button class="move-down-btn" data-index="${index}" ${index === placedOrder.length - 1 ? 'disabled' : ''}>↓</button>
                    <button class="remove-btn" data-index="${index}">✕</button>
                </span>
            `;
        }

        item.innerHTML = `
            <span class="placed-rank">${index + 1}.</span>
            <span class="placed-name">${player.name}</span>
            ${controlsHTML}
        `;

        placedList.appendChild(item);
    });

    // Render unplaced list
    unplacedPlayers.innerHTML = '';
    unplacedPlayersList.forEach(([playerId, player]) => {
        const item = document.createElement('div');
        item.className = 'unplaced-item';

        if (isHost) {
            item.innerHTML = `
                <span class="unplaced-name">${player.name}</span>
                <button class="place-btn" data-player-id="${playerId}">Place →</button>
            `;
        } else {
            item.innerHTML = `<span class="unplaced-name">${player.name}</span>`;
        }

        unplacedPlayers.appendChild(item);
    });

    // Reveal button: host only, enabled when all placed
    if (isHost) {
        revealBtn.classList.remove('hidden');
        revealBtn.disabled = placedOrder.length !== activePlayers.length;
    } else {
        revealBtn.classList.add('hidden');
    }
}

/**
 * Render reveal phase
 * @param {Object} game - Game data
 */
function renderReveal(game) {
    hideAllPhases();
    phaseReveal.classList.remove('hidden');

    const theme = game.gameState?.theme;
    revealThemeText.textContent = theme?.text || '';

    const placedOrder = game.gameState?.placedOrder || [];
    const hands = game.gameState?.hands || {};
    const firstErrorIndex = game.gameState?.firstErrorIndex ?? null;
    const allCorrect = firstErrorIndex === null;

    // Render cards in order
    revealResults.innerHTML = '';
    placedOrder.forEach((playerId, index) => {
        const player = game.players[playerId];
        if (!player) return;

        const number = hands[playerId];
        const isErrorPair = !allCorrect && (index === firstErrorIndex || index === firstErrorIndex - 1);

        const card = document.createElement('div');
        card.className = 'reveal-card';
        if (allCorrect) {
            card.classList.add('correct');
        } else if (isErrorPair) {
            card.classList.add('incorrect');
            card.classList.add('error-highlight');
        }

        card.innerHTML = `
            <span class="reveal-position">${index + 1}.</span>
            <span class="reveal-name">${player.name}</span>
            <span class="reveal-number">${number}</span>
        `;

        revealResults.appendChild(card);
    });

    // Result banner
    if (allCorrect) {
        resultBanner.textContent = '✅ Perfect!';
        resultBanner.className = 'result-banner success';
    } else {
        resultBanner.textContent = '❌ Not quite!';
        resultBanner.className = 'result-banner failure';
    }

    // Next round button (host only)
    if (isLocalPlayerHost()) {
        nextRoundBtn.classList.remove('hidden');
    } else {
        nextRoundBtn.classList.add('hidden');
    }
}

// --- Event Handlers ---

/**
 * Handle game update from Firebase listener
 * @param {Object} gameData - Game data snapshot
 */
function onGameUpdate(gameData) {
    if (!gameData || gameData.status === 'finished') {
        updateCurrentGame(gameData);
        navigateTo('game-over');
        return;
    }

    updateCurrentGame(gameData);
    updateGameHeader(gameData);

    const phase = gameData.gameState?.phase || 'waiting';

    switch (phase) {
        case 'waiting':
            renderWaiting(gameData);
            break;
        case 'discuss':
            renderDiscuss(gameData);
            break;
        case 'placing':
            renderPlacing(gameData);
            break;
        case 'reveal':
            renderReveal(gameData);
            break;
        default:
            renderWaiting(gameData);
    }
}

/**
 * Handle start round button click (host only)
 */
async function handleStartRound() {
    try {
        startRoundBtn.disabled = true;
        await startRound(currentGame.id);
    } catch (error) {
        console.error('Failed to start round:', error);
        alert('Failed to start round: ' + error.message);
    } finally {
        startRoundBtn.disabled = false;
    }
}

/**
 * Handle ready to place button click (host only)
 */
async function handleReadyToPlace() {
    try {
        readyToPlaceBtn.disabled = true;
        await startPlacing(currentGame.id);
    } catch (error) {
        console.error('Failed to start placing:', error);
        alert('Failed to start placing: ' + error.message);
    } finally {
        readyToPlaceBtn.disabled = false;
    }
}

/**
 * Handle number visibility toggle
 */
function handleNumberToggle() {
    numberVisible = !numberVisible;
    if (numberVisible) {
        secretNumber.classList.remove('number-hidden');
        toggleNumberBtn.textContent = '👁 tap to hide';
    } else {
        secretNumber.classList.add('number-hidden');
        toggleNumberBtn.textContent = '👁 tap to show';
    }
}

/**
 * Handle placement controls (place, move, remove)
 */
async function handlePlacementAction(action, detail) {
    const placedOrder = [...(currentGame.data.gameState?.placedOrder || [])];

    switch (action) {
        case 'place': {
            placedOrder.push(detail.playerId);
            break;
        }
        case 'move-up': {
            const idx = detail.index;
            if (idx > 0) {
                [placedOrder[idx - 1], placedOrder[idx]] = [placedOrder[idx], placedOrder[idx - 1]];
            }
            break;
        }
        case 'move-down': {
            const idx = detail.index;
            if (idx < placedOrder.length - 1) {
                [placedOrder[idx], placedOrder[idx + 1]] = [placedOrder[idx + 1], placedOrder[idx]];
            }
            break;
        }
        case 'remove': {
            placedOrder.splice(detail.index, 1);
            break;
        }
    }

    try {
        await setPlacedOrder(currentGame.id, placedOrder);
    } catch (error) {
        console.error('Failed to update placement:', error);
    }
}

/**
 * Handle reveal cards button click (host only)
 */
async function handleRevealCards() {
    try {
        revealBtn.disabled = true;
        await revealCards(currentGame.id);
    } catch (error) {
        console.error('Failed to reveal cards:', error);
        alert('Failed to reveal cards: ' + error.message);
    } finally {
        revealBtn.disabled = false;
    }
}

/**
 * Handle next round button click (host only)
 */
async function handleNextRound() {
    try {
        nextRoundBtn.disabled = true;
        await nextRound(currentGame.id);
    } catch (error) {
        console.error('Failed to start next round:', error);
        alert('Failed to start next round: ' + error.message);
    } finally {
        nextRoundBtn.disabled = false;
    }
}

/**
 * Handle leave game button click
 */
async function handleLeaveGame() {
    const confirmed = confirm('Are you sure you want to leave this game?');
    if (!confirmed) return;

    try {
        await leaveGame(currentGame.id, localPlayer.id);
        clearCurrentGame();
        navigateTo('lobby');
    } catch (error) {
        console.error('Failed to leave game:', error);
        alert('Failed to leave game: ' + error.message);
    }
}

/**
 * Start listening to game updates
 */
function startGameListener() {
    if (!currentGame.id) {
        console.error('No game ID set');
        return;
    }

    console.log('Starting game listener for:', currentGame.id);
    unsubscribeGame = listenToGame(currentGame.id, onGameUpdate);
}

/**
 * Stop listening to game updates
 */
function stopGameListener() {
    if (unsubscribeGame) {
        console.log('Stopping game listener');
        unsubscribeGame();
        unsubscribeGame = null;
    }
}

/**
 * Initialize screen
 */
function init() {
    // Static button listeners
    startRoundBtn.addEventListener('click', handleStartRound);
    readyToPlaceBtn.addEventListener('click', handleReadyToPlace);
    toggleNumberBtn.addEventListener('click', handleNumberToggle);
    revealBtn.addEventListener('click', handleRevealCards);
    nextRoundBtn.addEventListener('click', handleNextRound);
    leaveGameBtn.addEventListener('click', handleLeaveGame);

    // Event delegation for placement controls
    placedList.addEventListener('click', (e) => {
        const target = e.target;
        const index = parseInt(target.dataset.index);
        if (isNaN(index)) return;

        if (target.classList.contains('move-up-btn')) {
            handlePlacementAction('move-up', { index });
        } else if (target.classList.contains('move-down-btn')) {
            handlePlacementAction('move-down', { index });
        } else if (target.classList.contains('remove-btn')) {
            handlePlacementAction('remove', { index });
        }
    });

    unplacedPlayers.addEventListener('click', (e) => {
        const target = e.target;
        if (target.classList.contains('place-btn')) {
            const playerId = target.dataset.playerId;
            handlePlacementAction('place', { playerId });
        }
    });

    // Listen to screen changes
    window.addEventListener('screen-changed', (e) => {
        if (e.detail.screen === 'game-room') {
            startGameListener();
        } else {
            stopGameListener();
        }
    });

    console.log('Game room screen initialized');
}

// Initialize on load
init();
