/**
 * Lobby Screen
 * Handles game list display, game creation, and joining
 */

import { createGame, joinGame, listenToAllGames } from '../game/firebase-config.js';
import { localPlayer, setCurrentGameId, clearStoredPlayerName } from '../game/game-state.js';
import { navigateTo } from '../main.js';

// DOM elements
const playerNameDisplay = document.getElementById('lobby-player-name');
const changeNameBtn = document.getElementById('change-name-btn');
const difficultyRadios = document.querySelectorAll('input[name="difficulty"]');
const createGameBtn = document.getElementById('create-game-btn');
const gameCodeInput = document.getElementById('join-code-input');
const joinByCodeBtn = document.getElementById('join-game-btn');
const gameListContainer = document.getElementById('game-list');
const difficultyOptions = document.querySelectorAll('.difficulty-option');

// Firebase unsubscribe function
let unsubscribeGames = null;

/**
 * Get selected difficulty
 * @returns {string} 'kids' or 'adults'
 */
function getSelectedDifficulty() {
    const checked = document.querySelector('input[name="difficulty"]:checked');
    return checked ? checked.value : 'kids';
}

/**
 * Render the game list
 * @param {Object} games - Games object from Firebase
 */
function renderGameList(games) {
    gameListContainer.innerHTML = '';

    if (!games || Object.keys(games).length === 0) {
        gameListContainer.innerHTML = '<p class="empty-state">No games available. Create one!</p>';
        return;
    }

    const gameEntries = Object.entries(games).filter(([, game]) => game.status !== 'finished');

    if (gameEntries.length === 0) {
        gameListContainer.innerHTML = '<p class="empty-state">No games available. Create one!</p>';
        return;
    }

    gameEntries.forEach(([gameId, game]) => {
        const item = createGameItem(gameId, game);
        gameListContainer.appendChild(item);
    });
}

/**
 * Create a game list item element
 * @param {string} gameId - Game ID
 * @param {Object} game - Game data
 * @returns {HTMLElement} Game item element
 */
function createGameItem(gameId, game) {
    const item = document.createElement('div');
    item.className = 'game-item';

    const playerCount = game.players ? Object.keys(game.players).length : 0;
    const displayName = game.displayName || gameId;
    const difficulty = game.settings?.difficulty || 'kids';

    item.innerHTML = `
        <div class="game-info">
            <div class="game-id">${displayName}</div>
            <div class="game-details">${playerCount} player(s) · ${difficulty} · ID: ${gameId}</div>
        </div>
        <button class="join-btn" data-game-id="${gameId}">Join</button>
    `;

    return item;
}

/**
 * Handle create game button click
 */
async function handleCreateGame() {
    const difficulty = getSelectedDifficulty();

    try {
        createGameBtn.disabled = true;
        createGameBtn.textContent = 'Creating...';

        const gameId = await createGame(localPlayer.name, localPlayer.id, difficulty);
        setCurrentGameId(gameId);

        // Auto-join the created game
        await joinGame(gameId, localPlayer.name, localPlayer.id);

        console.log(`Game created and joined: ${gameId} (${difficulty})`);
        
        // Show game ID to host in alert
        alert(`✅ Game created!\n\nGame ID: ${gameId}\n\nShare this ID with players so they can join.`);
        
        navigateTo('game-room');
    } catch (error) {
        console.error('Failed to create game:', error);
        alert('Failed to create game. Please try again.');
    } finally {
        createGameBtn.disabled = false;
        createGameBtn.textContent = 'Create New Game';
    }
}

/**
 * Handle join game (by ID from list or code input)
 * @param {string} gameId - Game ID to join
 */
async function handleJoinGame(gameId) {
    try {
        const success = await joinGame(gameId, localPlayer.name, localPlayer.id);

        if (success) {
            setCurrentGameId(gameId);
            console.log(`Joined game: ${gameId}`);
            navigateTo('game-room');
        } else {
            alert('Failed to join game. It may have already started or is full.');
        }
    } catch (error) {
        console.error('Failed to join game:', error);
        alert('Failed to join game: ' + error.message);
    }
}

/**
 * Handle join by code button click
 */
function handleJoinByCode() {
    const code = gameCodeInput.value.trim().toUpperCase();
    if (!code) {
        alert('Please enter a Game ID');
        return;
    }
    handleJoinGame(code);
}

/**
 * Handle change name button click
 */
function handleChangeName() {
    clearStoredPlayerName();
    localPlayer.id = null;
    localPlayer.name = null;
    navigateTo('player-setup');
}

/**
 * Start listening to games
 */
function startGameListener() {
    console.log('Starting game list listener...');
    unsubscribeGames = listenToAllGames((games) => {
        console.log('Games updated:', games ? Object.keys(games).length : 0);
        renderGameList(games);
    });
}

/**
 * Stop listening to games
 */
function stopGameListener() {
    if (unsubscribeGames) {
        console.log('Stopping game list listener...');
        unsubscribeGames();
        unsubscribeGames = null;
    }
}

/**
 * Initialize screen
 */
function init() {
    // Event delegation for join buttons (dynamically created)
    gameListContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('join-btn')) {
            const gameId = e.target.dataset.gameId;
            handleJoinGame(gameId);
        }
    });

    // Event listeners for static buttons
    createGameBtn.addEventListener('click', handleCreateGame);
    changeNameBtn.addEventListener('click', handleChangeName);
    joinByCodeBtn.addEventListener('click', handleJoinByCode);

    // Difficulty selection toggle
    difficultyOptions.forEach((option) => {
        option.addEventListener('click', () => {
            difficultyOptions.forEach((o) => o.classList.remove('selected'));
            option.classList.add('selected');
        });
    });

    // Listen to screen changes
    window.addEventListener('screen-changed', (e) => {
        if (e.detail.screen === 'lobby') {
            // Update player name display
            playerNameDisplay.textContent = localPlayer.name;

            // Start listening to games
            startGameListener();
        } else {
            // Stop listening when leaving lobby
            stopGameListener();
        }
    });

    console.log('Lobby screen initialized');
}

// Initialize on load
init();
