/**
 * Game Room Screen
 * Handles main gameplay interface and logic
 */

import { listenToGame, startGame, ref, database, update, get } from '../game/firebase-config.js';
import {
    handleCardFlip,
    handleNaming,
    handleShoutClaim,
    handlePileWin,
    checkAndHandleGameEnd,
    handleNameAcknowledgement,
    checkAndClearAcknowledgements
} from '../game/firebase-sync.js';
import {
    currentGame,
    localPlayer,
    updateCurrentGame,
    isLocalPlayerHost,
    clearCurrentGame
} from '../game/game-state.js';
import { getCardImage, getSetSize, getCard } from '../data/card-sets.js';
import { validateCreatureName, getRoundType } from '../game/game-logic.js';
import { navigateTo } from '../main.js';

// DOM elements - Game Header
const gameIdDisplay = document.getElementById('game-id-display');
const playerListContainer = document.getElementById('player-list');
const gameStatusDiv = document.getElementById('game-status');
const phaseBanner = document.getElementById('phase-banner');

// DOM elements - Card Area
const cardArea = document.getElementById('card-area');
const currentCardImg = document.getElementById('current-card');
const cardPlaceholder = document.getElementById('card-placeholder');

// DOM elements - Pile Info
const pileCountSpan = document.getElementById('pile-count');
const deckProgressSpan = document.getElementById('deck-progress');

// DOM elements - Actions
const startGameBtn = document.getElementById('start-game-btn');
const flipCardBtn = document.getElementById('flip-card-btn');
const namingSection = document.getElementById('naming-section');
const creatureNameInput = document.getElementById('creature-name-input');
const submitNameBtn = document.getElementById('submit-name-btn');
const namingErrorDiv = document.getElementById('naming-error');
const shoutBtn = document.getElementById('shout-btn');
const skipRoundBtn = document.getElementById('skip-round-btn');
const showNamesBtn = document.getElementById('show-names-btn');

// DOM elements - Status
const statusMessage = document.getElementById('status-message');

// DOM elements - Creatures Dropdown
const toggleCreaturesBtn = document.getElementById('toggle-creatures-btn');
const creaturesDropdown = document.getElementById('creatures-dropdown');

// DOM elements - Acknowledgment
const acknowledgmentSection = document.getElementById('acknowledgment-section');
const acknowledgeBtn = document.getElementById('acknowledge-btn');
const ackCreatureNameSpan = document.getElementById('ack-creature-name');
const ackStatusDiv = document.getElementById('ack-status');

// DOM elements - Game Controls
const leaveGameBtn = document.getElementById('leave-game-btn');
const hostControlsDiv = document.getElementById('host-controls');
const pauseGameBtn = document.getElementById('pause-game-btn');
const endGameBtn = document.getElementById('end-game-btn');

// State
let unsubscribeGame = null;
let autoAwardTimeoutId = null; // Track auto-award timeout to cancel if needed

/**
 * Show error message in naming section
 */
function showNamingError(message) {
    namingErrorDiv.textContent = message;
    namingErrorDiv.classList.remove('hidden');
}

/**
 * Hide naming error message
 */
function hideNamingError() {
    namingErrorDiv.classList.add('hidden');
}

/**
 * Update status message
 */
function setStatusMessage(message, isVisible = true) {
    statusMessage.textContent = message;
    statusMessage.style.display = isVisible ? 'block' : 'none';
}

/**
 * Render player list with scores
 */
function renderPlayerList(players) {
    playerListContainer.innerHTML = '';

    if (!players || Object.keys(players).length === 0) {
        playerListContainer.innerHTML = '<p style="text-align: center; color: #999;">Waiting for players...</p>';
        return;
    }

    const currentTurnPlayerId = currentGame.data.gameState?.currentTurnPlayerId;
    const creatureNames = currentGame.data.gameState?.creatureNames || {};
    const cardSetId = currentGame.data.cardSetId || 'creatures';
    const setSize = currentGame.data.variation || getSetSize(cardSetId); // Use game's variation setting
    const allCreaturesNamed = Object.keys(creatureNames).length === setSize;
    const roundType = currentGame.data.gameState?.roundType;

    Object.entries(players).forEach(([playerId, player]) => {
        const item = document.createElement('div');
        item.className = 'player-item';

        const isHost = playerId === currentGame.data.hostId;
        // During shouting phase (all creatures named), only host flips
        // So show turn indicator for host if all creatures named and not in a naming round
        const isCurrentTurn = allCreaturesNamed && !roundType
            ? isHost  // Only host can flip after all creatures named
            : playerId === currentTurnPlayerId;  // Normal turn-based in naming phase
        const cardsWon = player.cardsWon || 0;

        item.innerHTML = `
            <div>
                <span class="player-name">${player.name}</span>
                ${isHost ? '<span class="player-host">(Host)</span>' : ''}
                ${isCurrentTurn ? '<span class="player-host" style="background-color: #ff9800;">👉 Turn</span>' : ''}
            </div>
            <span class="player-score">${cardsWon} cards</span>
        `;

        playerListContainer.appendChild(item);
    });
}

/**
 * Update game header info
 */
function updateGameHeader(game) {
    const displayName = game.displayName || currentGame.id; // Fallback for old games
    gameIdDisplay.textContent = displayName;

    // Update game status
    if (game.status === 'waiting') {
        gameStatusDiv.textContent = 'Waiting for host to start game...';
        gameStatusDiv.style.display = 'block';
    } else if (game.status === 'playing') {
        gameStatusDiv.style.display = 'none';
    } else if (game.status === 'paused') {
        gameStatusDiv.textContent = '⏸ Game Paused';
        gameStatusDiv.style.display = 'block';
    }

    // Show/hide host controls
    if (isLocalPlayerHost()) {
        hostControlsDiv.classList.remove('hidden');

        // Update pause button text based on game status
        if (game.status === 'paused') {
            pauseGameBtn.textContent = '▶ Resume';
        } else {
            pauseGameBtn.textContent = '⏸ Pause';
        }
    } else {
        hostControlsDiv.classList.add('hidden');
    }

    renderPlayerList(game.players);
}

// Track previous deck index for animation (detects new card flip)
let previousDeckIndex = -1;

/**
 * Update card display with flip animation
 */
function updateCardDisplay(game) {
    const { currentCard } = game.gameState || {};

    if (currentCard === null || currentCard === undefined) {
        // No card flipped yet
        currentCardImg.classList.add('hidden');
        cardPlaceholder.classList.remove('hidden');
        cardPlaceholder.textContent = game.status === 'waiting' ? 'Waiting to start...' : 'Ready to flip...';
        previousDeckIndex = -1;
    } else {
        const cardSetId = game.cardSetId || 'creatures';
        const imgPath = getCardImage(cardSetId, currentCard);
        const currentDeckIndex = game.deck?.currentIndex ?? -1;

        // Check if a new card was flipped (deck index changed)
        const newCardFlipped = previousDeckIndex !== -1 && currentDeckIndex !== previousDeckIndex;

        console.log('🎴 Card Display:', {
            previousDeckIndex,
            currentDeckIndex,
            currentCard,
            newCardFlipped,
            isHidden: currentCardImg.classList.contains('hidden')
        });

        if (newCardFlipped && !currentCardImg.classList.contains('hidden')) {
            // Animate card flip: fade out old card, then fade in new card
            console.log('✨ Starting card flip animation');
            currentCardImg.classList.add('flipping-out');

            setTimeout(() => {
                // Change image and animate in
                currentCardImg.src = imgPath;
                currentCardImg.classList.remove('flipping-out');
                currentCardImg.classList.add('flipping-in');
                console.log('✨ Card flipping in');

                // Remove animation class after animation completes
                setTimeout(() => {
                    currentCardImg.classList.remove('flipping-in');
                    console.log('✨ Animation complete');
                }, 400);
            }, 300);
        } else {
            // First card or no animation needed
            console.log('📍 No animation (first card or hidden)');
            currentCardImg.src = imgPath;
            currentCardImg.classList.remove('hidden');
            cardPlaceholder.classList.add('hidden');
        }

        previousDeckIndex = currentDeckIndex;
    }
}

/**
 * Update pile and deck info
 */
function updatePileInfo(game) {
    const pileSize = game.gameState?.currentPile?.length || 0;
    const deckIndex = game.deck?.currentIndex ?? -1; // Start at -1, so no cards flipped = -1
    const deckSize = game.deck?.cards?.length || 0;

    pileCountSpan.textContent = `Pile: ${pileSize} cards`;
    // currentIndex is the index of last flipped card, so add 1 to show count
    deckProgressSpan.textContent = `Deck: ${deckIndex + 1}/${deckSize}`;
}

/**
 * Show/hide action buttons based on game state
 */
function updateActionButtons(game) {
    // Hide all buttons initially
    startGameBtn.classList.add('hidden');
    flipCardBtn.classList.add('hidden');
    namingSection.classList.add('hidden');
    shoutBtn.classList.add('hidden');
    skipRoundBtn.classList.add('hidden');
    acknowledgmentSection.classList.add('hidden');
    phaseBanner.classList.add('hidden');
    phaseBanner.textContent = 'All creatures discovered! Shouting phase only';
    hideNamingError();

    // Show tiebreaker banner if in tiebreaker mode
    if (game.gameState?.tiebreaker) {
        phaseBanner.textContent = '\u2694\uFE0F TIEBREAKER ROUND! \u2694\uFE0F';
        phaseBanner.classList.remove('hidden');
    }

    // Hide claimant selection if it exists
    const claimantContainer = document.getElementById('claimant-selection');
    if (claimantContainer) {
        claimantContainer.classList.add('hidden');
    }

    if (game.status === 'waiting') {
        // Show "Start Game" for host
        if (isLocalPlayerHost()) {
            startGameBtn.classList.remove('hidden');
            setStatusMessage('Click "Start Game" to begin');
        } else {
            setStatusMessage('Waiting for host to start the game...');
        }
        return;
    }

    if (game.status === 'paused') {
        // Game is paused - hide all action buttons
        if (isLocalPlayerHost()) {
            setStatusMessage('Game paused. Click "Resume" to continue');
        } else {
            setStatusMessage('Game paused by host. Waiting to resume...');
        }
        return;
    }

    if (game.status === 'playing') {
        const roundType = game.gameState?.roundType;
        const currentTurnPlayerId = game.gameState?.currentTurnPlayerId;
        const isMyTurn = currentTurnPlayerId === localPlayer.id;
        const currentPlayerName = game.players[currentTurnPlayerId]?.name || 'Unknown';

        // Check if there are pending acknowledgments
        const acknowledgements = game.gameState?.nameAcknowledgements || {};
        const hasPendingAcks = Object.keys(acknowledgements).length > 0;

        if (hasPendingAcks) {
            // Show acknowledgment UI
            checkAcknowledgmentStatus(game);
            return;
        }

        if (!roundType) {
            // Ready to flip next card
            // Check if all creatures have been named
            const creatureNames = game.gameState?.creatureNames || {};
            const cardSetId = game.cardSetId || 'creatures';
            const setSize = currentGame.data.variation || getSetSize(cardSetId); // Use game's variation setting
            const allCreaturesNamed = Object.keys(creatureNames).length === setSize;

            if (allCreaturesNamed) {
                // All creatures named - only host can flip (shouting phase)
                // Show phase transition banner to all players
                phaseBanner.classList.remove('hidden');

                if (isLocalPlayerHost()) {
                    flipCardBtn.classList.remove('hidden');
                    setStatusMessage("Flip the next card");
                } else {
                    setStatusMessage('Waiting for host to flip the next card...');
                }
            } else {
                // Still naming creatures - turn-based flipping
                if (isMyTurn) {
                    flipCardBtn.classList.remove('hidden');
                    setStatusMessage("It's your turn! Flip the next card");
                } else {
                    setStatusMessage(`Waiting for ${currentPlayerName} to flip the next card...`);
                }
            }
        } else if (roundType === 'naming') {
            // Naming round - current turn player (who flipped) names the creature
            if (isMyTurn) {
                namingSection.classList.remove('hidden');
                creatureNameInput.value = '';
                setStatusMessage("It's your turn! Name this new creature");
            } else {
                setStatusMessage(`Waiting for ${currentPlayerName} to name this creature...`);
            }
        } else if (roundType === 'shouting') {
            // Shouting round - all players can shout
            const creatureNames = game.gameState?.creatureNames || {};
            const cardSetId = game.cardSetId || 'creatures';
            const setSize = currentGame.data.variation || getSetSize(cardSetId); // Use game's variation setting
            const allCreaturesNamed = Object.keys(creatureNames).length === setSize;

            // Only show phase banner if all creatures have been discovered
            if (allCreaturesNamed) {
                phaseBanner.classList.remove('hidden');
            }

            const creatureName = game.gameState.creatureNames[game.gameState.currentCard];
            shoutBtn.textContent = "I shouted!";
            shoutBtn.disabled = false; // Re-enable button for new round
            shoutBtn.classList.remove('hidden');

            // Show skip button for host (in case no one shouted or everyone forgot)
            if (isLocalPlayerHost()) {
                skipRoundBtn.classList.remove('hidden');
            }

            setStatusMessage(`It's "${creatureName}"! Did you shout first?`);
        }
    }
}

/**
 * Check acknowledgment status and show UI
 */
function checkAcknowledgmentStatus(game) {
    const acknowledgements = game.gameState?.nameAcknowledgements || {};
    // Sort player IDs by joinedAt timestamp to ensure consistent ordering
    const activePlayers = Object.keys(game.players)
        .filter(id => game.players[id].isActive)
        .sort((a, b) => game.players[a].joinedAt - game.players[b].joinedAt);
    const acknowledgedPlayers = Object.keys(acknowledgements).filter(id => acknowledgements[id]);

    const hasAcknowledged = acknowledgements[localPlayer.id] === true;
    const creatureId = game.gameState.currentCard;
    const creatureName = game.gameState.creatureNames[creatureId];

    // Show acknowledgment section
    acknowledgmentSection.classList.remove('hidden');
    ackCreatureNameSpan.textContent = `"${creatureName}"`;

    if (hasAcknowledged) {
        acknowledgeBtn.disabled = true;
        acknowledgeBtn.textContent = 'Acknowledged ✓';
        ackStatusDiv.textContent = `Waiting for others... (${acknowledgedPlayers.length}/${activePlayers.length})`;
        setStatusMessage('Waiting for all players to acknowledge the name...');
    } else {
        acknowledgeBtn.disabled = false;
        acknowledgeBtn.textContent = 'Got it! ✓';
        ackStatusDiv.textContent = `${acknowledgedPlayers.length}/${activePlayers.length} players acknowledged`;
        setStatusMessage('New creature named! Acknowledge to continue');
    }
}

/**
 * Handle acknowledge button click
 */
async function handleAcknowledge() {
    try {
        acknowledgeBtn.disabled = true;
        await handleNameAcknowledgement(currentGame.id, localPlayer.id);

        // Check if all have acknowledged
        const allAcknowledged = await checkAndClearAcknowledgements(currentGame.id);

        if (allAcknowledged) {
            console.log('All players acknowledged, acknowledgements cleared');
        }
    } catch (error) {
        console.error('Failed to acknowledge:', error);
        acknowledgeBtn.disabled = false;
    }
}

/**
 * Toggle creatures dropdown
 */
function toggleCreaturesDropdown() {
    const isHidden = creaturesDropdown.classList.contains('hidden');

    if (isHidden) {
        renderCreaturesDropdown();
        creaturesDropdown.classList.remove('hidden');
        toggleCreaturesBtn.textContent = '✖ Hide';
    } else {
        creaturesDropdown.classList.add('hidden');
        toggleCreaturesBtn.textContent = '📋 Named Creatures';
    }
}

/**
 * Render creatures dropdown with images
 */
function renderCreaturesDropdown() {
    const creatureNames = currentGame.data?.gameState?.creatureNames || {};
    creaturesDropdown.innerHTML = '';

    const entries = Object.entries(creatureNames);

    if (entries.length === 0) {
        creaturesDropdown.innerHTML = '<p style="text-align: center; color: #999; padding: 10px;">No creatures named yet</p>';
        return;
    }

    const cardSetId = currentGame.data?.cardSetId || 'creatures';

    entries.forEach(([creatureId, name]) => {
        const item = document.createElement('div');
        item.className = 'creature-item';

        const img = document.createElement('img');
        img.src = getCardImage(cardSetId, parseInt(creatureId));
        img.alt = name;

        const nameSpan = document.createElement('span');
        nameSpan.className = 'creature-item-name';
        nameSpan.textContent = name;

        item.appendChild(img);
        item.appendChild(nameSpan);
        creaturesDropdown.appendChild(item);
    });
}

/**
 * Check if host needs to select winner from multiple claimants
 */
async function checkClaimantSelection(game) {
    const claimedBy = game.gameState?.claimedBy || [];

    // Clear any existing auto-award timeout
    if (autoAwardTimeoutId) {
        clearTimeout(autoAwardTimeoutId);
        autoAwardTimeoutId = null;
    }

    if (claimedBy.length >= 2) {
        // Multiple claims - host selects winner
        if (isLocalPlayerHost()) {
            showHostClaimantSelection(game);
        } else {
            // Non-host players wait
            const claimantNames = claimedBy.map(id => game.players[id]?.name || 'Unknown').join(', ');
            setStatusMessage(`Multiple players shouted: ${claimantNames}. Waiting for host to decide...`);
        }
    } else if (claimedBy.length === 1) {
        // Single claim - auto-award the pile after brief delay
        const winnerId = claimedBy[0];
        const winnerName = game.players[winnerId]?.name || 'Unknown';
        setStatusMessage(`${winnerName} gets the pile! (only claimant)`);

        // Auto-award after 2 seconds to allow for lag/late clicks
        autoAwardTimeoutId = setTimeout(async () => {
            try {
                // Verify still only 1 claimant (in case state changed during timeout)
                const gameSnapshot = await get(ref(database, `games/${currentGame.id}`));
                const latestGameData = gameSnapshot.val();

                if (!latestGameData) {
                    console.warn('Game not found during auto-award');
                    autoAwardTimeoutId = null;
                    return;
                }

                const currentClaimedBy = latestGameData.gameState?.claimedBy || [];

                // Only award if still exactly 1 claimant and it's the same winner
                if (currentClaimedBy.length === 1 && currentClaimedBy[0] === winnerId) {
                    await handlePileWin(currentGame.id, winnerId);
                    await checkAndHandleGameEnd(currentGame.id);
                }

                autoAwardTimeoutId = null;
            } catch (error) {
                console.error('Failed to award pile:', error);
                autoAwardTimeoutId = null;
            }
        }, 2000);
    } else if (claimedBy.length === 0 && game.gameState?.roundType === 'shouting') {
        setStatusMessage('Waiting for someone to claim they shouted first...');
    }
}

/**
 * Show host the list of claimants to select winner
 */
function showHostClaimantSelection(game) {
    const claimedBy = game.gameState.claimedBy || [];

    setStatusMessage('Multiple players shouted! Select who shouted first:');

    // Find or create claimant buttons container
    let claimantContainer = document.getElementById('claimant-selection');
    if (!claimantContainer) {
        claimantContainer = document.createElement('div');
        claimantContainer.id = 'claimant-selection';
        claimantContainer.className = 'claimant-selection';

        const actionsDiv = document.getElementById('actions');
        actionsDiv.appendChild(claimantContainer);
    }

    // Clear and populate with claimant buttons
    claimantContainer.innerHTML = '';
    claimantContainer.classList.remove('hidden');

    claimedBy.forEach(playerId => {
        const button = document.createElement('button');
        const playerName = game.players[playerId]?.name || 'Unknown';
        button.textContent = `${playerName} shouted first`;
        button.className = 'btn-primary claimant-btn';
        button.onclick = () => handleHostSelectWinner(playerId);
        claimantContainer.appendChild(button);
    });
}

/**
 * Host selects the winner from multiple claimants
 */
async function handleHostSelectWinner(winnerId) {
    try {
        const claimantContainer = document.getElementById('claimant-selection');
        if (claimantContainer) {
            claimantContainer.classList.add('hidden');
        }

        await handlePileWin(currentGame.id, winnerId);
        await checkAndHandleGameEnd(currentGame.id);

        const winnerName = currentGame.data.players[winnerId]?.name || 'Unknown';
        setStatusMessage(`${winnerName} gets the pile!`);
    } catch (error) {
        console.error('Failed to award pile:', error);
        alert('Failed to award pile: ' + error.message);
    }
}

/**
 * Handle game state updates from Firebase
 */
function handleGameUpdate(gameData) {
    if (!gameData) {
        console.error('Game not found');
        alert('Game not found. Returning to lobby.');
        clearCurrentGame();
        navigateTo('lobby');
        return;
    }

    // Update local game state
    updateCurrentGame(gameData);

    console.log('Game updated:', gameData);

    // Update UI
    updateGameHeader(gameData);
    updateCardDisplay(gameData);
    updatePileInfo(gameData);
    updateActionButtons(gameData);
    checkClaimantSelection(gameData);

    // Check if game finished
    if (gameData.status === 'finished') {
        console.log('Game finished!');
        setTimeout(() => navigateTo('game-over'), 1000);
    }
}

/**
 * Handle start game button click
 */
async function handleStartGame() {
    try {
        startGameBtn.disabled = true;
        await startGame(currentGame.id);
        console.log('Game started');
    } catch (error) {
        console.error('Failed to start game:', error);
        alert('Failed to start game: ' + error.message);
        startGameBtn.disabled = false;
    }
}

/**
 * Handle flip card button click
 */
async function handleFlip() {
    try {
        flipCardBtn.disabled = true;
        await handleCardFlip(currentGame.id);
        // Don't check game end here - let the round (naming/shouting) complete first.
        // checkAndHandleGameEnd is called after naming and after pile award.
    } catch (error) {
        console.error('Failed to flip card:', error);
        alert('Failed to flip card: ' + error.message);
    } finally {
        flipCardBtn.disabled = false;
    }
}

/**
 * Handle submit name button click
 */
async function handleSubmitName() {
    hideNamingError();

    const name = creatureNameInput.value.trim();

    // Validate creature name
    const validation = validateCreatureName(name);
    if (!validation.valid) {
        showNamingError(validation.error);
        return;
    }

    // Check for duplicate names
    const existingNames = Object.values(currentGame.data.gameState.creatureNames || {});
    const isDuplicate = existingNames.some(existingName =>
        existingName.toLowerCase() === name.toLowerCase()
    );

    if (isDuplicate) {
        showNamingError(`"${name}" is already used for another creature. Choose a different name.`);
        return;
    }

    try {
        submitNameBtn.disabled = true;
        submitNameBtn.textContent = 'Submitting...';

        const creatureId = currentGame.data.gameState.currentCard;

        // Prepare acknowledgments (namer auto-acknowledges)
        // Sort player IDs by joinedAt timestamp to ensure consistent ordering
        const activePlayers = Object.keys(currentGame.data.players)
            .filter(id => currentGame.data.players[id].isActive)
            .sort((a, b) => currentGame.data.players[a].joinedAt - currentGame.data.players[b].joinedAt);
        const ackObj = {};
        activePlayers.forEach(id => {
            // Namer auto-acknowledges (they already know the name)
            ackObj[id] = (id === localPlayer.id);
        });

        // Single atomic update: name + acknowledgements
        const success = await handleNaming(currentGame.id, creatureId, name, localPlayer.id, ackObj);

        if (success) {
            console.log('Name submitted:', name);
        }

        // Check if game ended after naming
        await checkAndHandleGameEnd(currentGame.id);
    } catch (error) {
        console.error('Failed to submit name:', error);
        showNamingError('Failed to submit name. It may have been named already.');
    } finally {
        submitNameBtn.disabled = false;
        submitNameBtn.textContent = 'Submit Name';
    }
}

/**
 * Handle "I shouted!" button click
 */
async function handleShout() {
    try {
        shoutBtn.disabled = true;
        await handleShoutClaim(currentGame.id, localPlayer.id);
        console.log('Shout claimed');
    } catch (error) {
        console.error('Failed to claim shout:', error);
        alert('Failed to claim shout: ' + error.message);
        shoutBtn.disabled = false;
    }
}

/**
 * Handle "Skip Round" button click (host only)
 */
async function handleSkipRound() {
    if (!isLocalPlayerHost()) return;

    try {
        skipRoundBtn.disabled = true;
        const gameRef = ref(database, `games/${currentGame.id}`);

        // Reset round state
        await update(gameRef, {
            'gameState/roundType': null,
            'gameState/claimedBy': [],
            'gameState/votes': {}
        });

        console.log('Round skipped');

        // Check if game should end (e.g., last card's round was skipped)
        await checkAndHandleGameEnd(currentGame.id);
    } catch (error) {
        console.error('Failed to skip round:', error);
        alert('Failed to skip round: ' + error.message);
    } finally {
        skipRoundBtn.disabled = false;
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
    unsubscribeGame = listenToGame(currentGame.id, handleGameUpdate);
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
 * Handle leave game button click
 */
async function handleLeaveGame() {
    const confirmed = confirm('Are you sure you want to leave this game?');
    if (!confirmed) return;

    try {
        // Mark player as inactive
        await update(ref(database, `games/${currentGame.id}/players/${localPlayer.id}`), {
            isActive: false
        });

        // Clear current game and navigate to lobby
        clearCurrentGame();
        navigateTo('lobby');
    } catch (error) {
        console.error('Failed to leave game:', error);
        alert('Failed to leave game: ' + error.message);
    }
}

/**
 * Handle pause game button click (host only)
 */
async function handlePauseGame() {
    if (!isLocalPlayerHost()) {
        alert('Only the host can pause the game');
        return;
    }

    try {
        pauseGameBtn.disabled = true;

        const game = currentGame.data;
        const newStatus = game.status === 'paused' ? 'playing' : 'paused';

        await update(ref(database, `games/${currentGame.id}`), {
            status: newStatus
        });

        pauseGameBtn.textContent = newStatus === 'paused' ? '▶ Resume' : '⏸ Pause';
    } catch (error) {
        console.error('Failed to pause/resume game:', error);
        alert('Failed to pause/resume game: ' + error.message);
    } finally {
        pauseGameBtn.disabled = false;
    }
}

/**
 * Handle end game button click (host only)
 */
async function handleEndGame() {
    if (!isLocalPlayerHost()) {
        alert('Only the host can end the game');
        return;
    }

    const confirmed = confirm('Are you sure you want to end the game now? Final scores will be calculated.');
    if (!confirmed) return;

    try {
        endGameBtn.disabled = true;
        endGameBtn.textContent = 'Ending...';

        // End game immediately (triggers game over)
        await checkAndHandleGameEnd(currentGame.id, true); // Force end

        setStatusMessage('Game ended by host');
    } catch (error) {
        console.error('Failed to end game:', error);
        alert('Failed to end game: ' + error.message);
    } finally {
        endGameBtn.disabled = false;
        endGameBtn.textContent = '⏹ End Game';
    }
}

/**
 * Initialize screen
 */
function init() {
    // Event listeners for action buttons
    startGameBtn.addEventListener('click', handleStartGame);
    flipCardBtn.addEventListener('click', handleFlip);
    submitNameBtn.addEventListener('click', handleSubmitName);
    shoutBtn.addEventListener('click', handleShout);
    skipRoundBtn.addEventListener('click', handleSkipRound);
    acknowledgeBtn.addEventListener('click', handleAcknowledge);
    toggleCreaturesBtn.addEventListener('click', toggleCreaturesDropdown);

    // Event listeners for game controls
    leaveGameBtn.addEventListener('click', handleLeaveGame);
    pauseGameBtn.addEventListener('click', handlePauseGame);
    endGameBtn.addEventListener('click', handleEndGame);

    // Handle Enter key in naming input
    creatureNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSubmitName();
        }
    });

    // Listen to screen changes
    window.addEventListener('screen-changed', (e) => {
        if (e.detail.screen === 'game-room') {
            // Start listening to game
            startGameListener();
        } else {
            // Stop listening when leaving game room
            stopGameListener();
        }
    });

    console.log('Game room screen initialized');
}

// Initialize on load
init();
