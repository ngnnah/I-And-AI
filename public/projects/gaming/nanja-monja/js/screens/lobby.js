/**
 * Lobby Screen
 * Handles game list display, game creation, and joining
 */

import { createGame, joinGame, listenToAllGames, getGameHistory } from '../game/firebase-config.js';
import { localPlayer, setCurrentGameId, clearStoredPlayerName } from '../game/game-state.js';
import { navigateTo } from '../main.js';
import { getAllCardSets } from '../data/card-sets.js';

// DOM elements
const playerNameDisplay = document.getElementById('lobby-player-name');
const changeNameBtn = document.getElementById('change-name-btn');
const cardSetGallery = document.getElementById('card-set-gallery');
const createGameBtn = document.getElementById('create-game-btn');
const gameListContainer = document.getElementById('game-list');
const historyContainer = document.getElementById('history-list');
const toggleHistoryBtn = document.getElementById('toggle-history-btn');
const variationButtons = document.getElementById('variation-buttons');
const duplicationButtons = document.getElementById('duplication-buttons');
const variationValue = document.getElementById('variation-value');
const duplicationValue = document.getElementById('duplication-value');
const variationInfo = document.getElementById('variation-info');
const totalCardsDisplay = document.getElementById('total-cards-display');

// Firebase unsubscribe function
let unsubscribeGames = null;

// History state
let showAllHistory = false;

// Selected card set
let selectedCardSetId = 'creatures';

// Selected game settings
let selectedVariation = 12;
let selectedDuplication = 5;

/**
 * Render the game list
 * @param {Object} games - Games object from Firebase
 */
function renderGameList(games) {
    console.log('🎨 Rendering game list...');
    
    // Clear existing list
    gameListContainer.innerHTML = '';

    if (!games || Object.keys(games).length === 0) {
        console.log('⚠️ No games found in Firebase');
        gameListContainer.innerHTML = '<p class="empty-state">No games available. Create one!</p>';
        return;
    }

    // Separate games into ongoing (player is in) and available (can join)
    const ongoingGames = [];
    const availableGames = [];

    Object.entries(games).forEach(([gameId, game]) => {
        console.log(`📊 Processing game ${gameId}:`, {
            status: game.status,
            hasPlayers: !!game.players,
            playerCount: game.players ? Object.keys(game.players).length : 0,
            isPlayerIn: game.players && game.players[localPlayer.id]
        });

        // Skip finished games
        if (game.status === 'finished') {
            console.log(`⏭️ Skipping finished game ${gameId}`);
            return;
        }

        const isPlayerIn = game.players && game.players[localPlayer.id];

        if (isPlayerIn) {
            // Player is in this game (active or inactive)
            console.log(`✅ Adding ${gameId} to ongoing games`);
            ongoingGames.push([gameId, game]);
        } else if (game.status === 'waiting') {
            // Available to join
            console.log(`🎯 Adding ${gameId} to available games`);
            availableGames.push([gameId, game]);
        } else {
            console.log(`❌ Game ${gameId} not shown - status: ${game.status}, isPlayerIn: ${isPlayerIn}`);
        }
    });

    // Sort both lists alphabetically by display name
    const sortGames = (a, b) => {
        const nameA = a[1].displayName || a[0];
        const nameB = b[1].displayName || b[0];
        return nameA.localeCompare(nameB);
    };
    ongoingGames.sort(sortGames);
    availableGames.sort(sortGames);

    // Render ongoing games first (if any)
    if (ongoingGames.length > 0) {
        const header = document.createElement('h3');
        header.textContent = 'Your Games';
        header.className = 'games-section-header';
        gameListContainer.appendChild(header);

        ongoingGames.forEach(([gameId, game]) => {
            const gameItem = createGameItem(gameId, game, true);
            gameListContainer.appendChild(gameItem);
        });
    }

    // Render available games
    if (availableGames.length > 0) {
        if (ongoingGames.length > 0) {
            const header = document.createElement('h3');
            header.textContent = 'Available Games';
            header.className = 'games-section-header';
            gameListContainer.appendChild(header);
        }

        availableGames.forEach(([gameId, game]) => {
            const gameItem = createGameItem(gameId, game, false);
            gameListContainer.appendChild(gameItem);
        });
    }

    // Show empty state if no games at all
    if (ongoingGames.length === 0 && availableGames.length === 0) {
        gameListContainer.innerHTML = '<p class="empty-state">No games available. Create one!</p>';
    }
}

/**
 * Create a game list item element
 * @param {string} gameId - Game ID
 * @param {Object} game - Game data
 * @param {boolean} isOngoing - Whether the player is already in this game
 * @returns {HTMLElement} Game item element
 */
function createGameItem(gameId, game, isOngoing = false) {
    const item = document.createElement('div');
    item.className = 'game-item';
    if (isOngoing) {
        item.classList.add('ongoing');
    }

    const playerCount = game.players ? Object.keys(game.players).length : 0;
    const hostName = game.createdBy || 'Unknown';
    const displayName = game.displayName || gameId; // Fallback to gameId for old games

    // Determine button text and status label
    let buttonText = 'Join';
    let statusLabel = '';

    if (isOngoing) {
        const playerData = game.players[localPlayer.id];
        const isActive = playerData && playerData.isActive;

        if (game.status === 'playing' || game.status === 'paused') {
            buttonText = isActive ? 'Continue' : 'Rejoin';
            statusLabel = game.status === 'paused' ? ' <span class="status-badge paused">⏸ Paused</span>' : ' <span class="status-badge playing">▶ Playing</span>';
        } else if (game.status === 'waiting') {
            buttonText = 'Continue';
            statusLabel = ' <span class="status-badge waiting">⏳ Waiting</span>';
        }
    }

    item.innerHTML = `
        <div class="game-info">
            <div class="game-id">${displayName}${statusLabel}</div>
            <div class="game-host">Host: ${hostName}</div>
            <div class="game-players">${playerCount} player(s)</div>
        </div>
        <button class="join-btn" data-game-id="${gameId}">${buttonText}</button>
    `;

    return item;
}

/**
 * Populate card set selector with tile gallery
 */
function populateCardSetSelector() {
    const cardSets = getAllCardSets();

    cardSetGallery.innerHTML = '';

    cardSets.forEach(set => {
        const tile = document.createElement('div');
        tile.className = 'card-set-tile';
        tile.dataset.setId = set.id;

        // Mark first set as selected by default
        if (set.id === selectedCardSetId) {
            tile.classList.add('selected');
        }

        // Create preview images (show first 4 cards)
        const previewHTML = set.cards.slice(0, 4).map(card =>
            `<img src="${card.imgPath}" alt="${card.name}" class="card-set-preview-img">`
        ).join('');

        tile.innerHTML = `
            <div class="card-set-tile-checkmark">✓</div>
            <div class="card-set-tile-header">
                <span class="card-set-tile-name">${set.name}</span>
                <span class="card-set-tile-count">${set.cards.length} cards</span>
            </div>
            <div class="card-set-tile-description">${set.description}</div>
            <div class="card-set-tile-preview">
                ${previewHTML}
            </div>
        `;

        // Add click handler
        tile.addEventListener('click', () => handleCardSetSelection(set.id));

        cardSetGallery.appendChild(tile);
    });
}

/**
 * Handle card set selection
 */
function handleCardSetSelection(setId) {
    selectedCardSetId = setId;

    // Update UI - remove selected class from all tiles
    const allTiles = cardSetGallery.querySelectorAll('.card-set-tile');
    allTiles.forEach(tile => tile.classList.remove('selected'));

    // Add selected class to clicked tile
    const selectedTile = cardSetGallery.querySelector(`[data-set-id="${setId}"]`);
    if (selectedTile) {
        selectedTile.classList.add('selected');
    }

    // Update variation limits for the new card set
    updateVariationLimits();
}

/**
 * Update variation max and info based on selected card set
 */
function updateVariationLimits() {
    const cardSets = getAllCardSets();
    const selectedSet = cardSets.find(set => set.id === selectedCardSetId);

    if (selectedSet) {
        const maxCards = selectedSet.cards.length;
        variationInfo.textContent = `of ${maxCards}`;

        // Ensure current value doesn't exceed max
        if (selectedVariation > maxCards) {
            selectedVariation = maxCards;
            updateVariationUI();
        }

        updateTotalCards();
    }
}

/**
 * Update total cards calculation
 */
function updateTotalCards() {
    const total = selectedVariation * selectedDuplication;
    totalCardsDisplay.textContent = total;
}

/**
 * Handle variation button click
 */
function handleVariationClick(value) {
    selectedVariation = parseInt(value);
    updateVariationUI();
    updateTotalCards();
}

/**
 * Handle duplication button click
 */
function handleDuplicationClick(value) {
    selectedDuplication = parseInt(value);
    updateDuplicationUI();
    updateTotalCards();
}

/**
 * Update variation UI (selected state and display value)
 */
function updateVariationUI() {
    variationValue.textContent = selectedVariation;

    // Update button states
    const buttons = variationButtons.querySelectorAll('.setting-btn');
    buttons.forEach(btn => {
        const btnValue = parseInt(btn.dataset.value);
        if (btnValue === selectedVariation) {
            btn.classList.add('selected');
        } else {
            btn.classList.remove('selected');
        }
    });
}

/**
 * Update duplication UI (selected state and display value)
 */
function updateDuplicationUI() {
    duplicationValue.textContent = selectedDuplication;

    // Update button states
    const buttons = duplicationButtons.querySelectorAll('.setting-btn');
    buttons.forEach(btn => {
        const btnValue = parseInt(btn.dataset.value);
        if (btnValue === selectedDuplication) {
            btn.classList.add('selected');
        } else {
            btn.classList.remove('selected');
        }
    });
}

/**
 * Handle create game button click
 */
async function handleCreateGame() {
    try {
        createGameBtn.disabled = true;
        createGameBtn.textContent = 'Creating...';

        const gameId = await createGame(localPlayer.name, localPlayer.id, selectedCardSetId, selectedVariation, selectedDuplication);
        setCurrentGameId(gameId);

        console.log(`Game created: ${gameId} with card set: ${selectedCardSetId}, variation: ${selectedVariation}, duplication: ${selectedDuplication}`);
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
 * Handle join game button click
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
    console.log('🎮 Starting game list listener...');
    unsubscribeGames = listenToAllGames((games) => {
        console.log('🔄 Games updated:', games ? Object.keys(games).length : 0);
        if (games) {
            console.log('📋 Game IDs:', Object.keys(games));
            console.log('🔍 Full game data:', games);
        }
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
 * Render game history
 */
async function renderGameHistory() {
    const limit = showAllHistory ? 20 : 3;
    const history = await getGameHistory(limit);

    historyContainer.innerHTML = '';

    // Convert to array for rendering
    const historyArray = Object.values(history);

    if (historyArray.length === 0) {
        historyContainer.innerHTML = '<p class="empty-state">No completed games yet</p>';
        toggleHistoryBtn.style.display = 'none';
        return;
    }

    historyArray.forEach(game => {
        const item = createHistoryItem(game);
        historyContainer.appendChild(item);
    });

    // Show/hide toggle button based on history count
    toggleHistoryBtn.style.display = historyArray.length > 3 ? 'block' : 'none';
    toggleHistoryBtn.textContent = showAllHistory ? 'Show Less' : 'Show More';
}

/**
 * Create a history item element
 * @param {object} game - Game history data
 * @returns {HTMLElement} History item element
 */
function createHistoryItem(game) {
    const item = document.createElement('div');
    item.className = 'history-item';

    // Format duration (milliseconds to minutes)
    const durationMinutes = Math.floor(game.duration / 60000);
    const durationSeconds = Math.floor((game.duration % 60000) / 1000);
    const durationText = `${durationMinutes}m ${durationSeconds}s`;

    // Format date
    const date = new Date(game.finishedAt);
    const dateText = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Get winner name
    const winner = game.players[game.winner];
    const winnerName = winner ? winner.name : 'Unknown';
    const winnerCards = winner ? winner.cardsWon : 0;

    // Get all players sorted by cards won
    const playersList = Object.values(game.players)
        .sort((a, b) => b.cardsWon - a.cardsWon)
        .map(p => `${p.name} (${p.cardsWon})`)
        .join(', ');

    item.innerHTML = `
        <div class="history-header">
            <span class="history-date">${dateText}</span>
            <span class="history-duration">${durationText}</span>
        </div>
        <div class="history-winner">🏆 ${winnerName} won with ${winnerCards} cards</div>
        <div class="history-players">${playersList}</div>
    `;

    return item;
}

/**
 * Handle toggle history button click
 */
function handleToggleHistory() {
    showAllHistory = !showAllHistory;
    renderGameHistory();
}

/**
 * Initialize screen
 */
function init() {
    // Populate card set selector
    populateCardSetSelector();

    // Event listeners for game settings buttons
    variationButtons.addEventListener('click', (e) => {
        if (e.target.classList.contains('setting-btn')) {
            handleVariationClick(e.target.dataset.value);
        }
    });

    duplicationButtons.addEventListener('click', (e) => {
        if (e.target.classList.contains('setting-btn')) {
            handleDuplicationClick(e.target.dataset.value);
        }
    });

    // Initialize variation limits and total cards
    updateVariationLimits();

    // Event delegation for join buttons (since they're dynamically created)
    gameListContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('join-btn')) {
            const gameId = e.target.dataset.gameId;
            handleJoinGame(gameId);
        }
    });

    // Event listeners for static buttons
    createGameBtn.addEventListener('click', handleCreateGame);
    changeNameBtn.addEventListener('click', handleChangeName);
    toggleHistoryBtn.addEventListener('click', handleToggleHistory);

    // Listen to screen changes
    window.addEventListener('screen-changed', (e) => {
        if (e.detail.screen === 'lobby') {
            // Update player name display
            playerNameDisplay.textContent = localPlayer.name;

            // Start listening to games
            startGameListener();

            // Load game history
            renderGameHistory();
        } else {
            // Stop listening when leaving lobby
            stopGameListener();
        }
    });

    console.log('Lobby screen initialized');
}

// Initialize on load
init();
