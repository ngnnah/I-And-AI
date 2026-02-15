// Game room - main gameplay screen

import { getLocalPlayer, setCurrentGameId, updateCurrentGame, getCurrentGame, isLocalPlayerTurn } from '../game/game-state.js';
import { listenToGame, joinGame } from '../game/firebase-config.js';
import { startGame, placeTokens, takeAnimalCard, placeAnimalCubes, endTurn } from '../game/firebase-sync.js';
import { renderHexBoard, renderCentralTokenGrid, renderAnimalCards } from '../ui/board-renderer.js';
import { ANIMAL_CARDS } from '../data/animal-cards.js';
import { canPlaceToken } from '../game/token-manager.js';
import { findPatternMatches } from '../game/pattern-matcher.js';
import { navigateTo } from '../main.js';

let currentGameId = null;
let unsubscribeGame = null;
let selectedTokens = []; // { index, color }
let selectedAnimalCard = null;

export async function init(params) {
  const { gameId } = params;
  if (!gameId) {
    navigateTo('lobby');
    return;
  }

  currentGameId = gameId;
  setCurrentGameId(gameId);

  // Rejoin game
  const player = getLocalPlayer();
  await joinGame(gameId, player.username, player.displayName, player.deviceId);

  // Listen to game updates
  unsubscribeGame = listenToGame(gameId, handleGameUpdate);

  // Setup UI handlers
  document.getElementById('back-to-lobby').addEventListener('click', () => navigateTo('lobby'));
  document.getElementById('start-game-btn')?.addEventListener('click', handleStartGame);
  document.getElementById('confirm-placement-btn')?.addEventListener('click', handleConfirmPlacement);
  document.getElementById('end-turn-btn')?.addEventListener('click', handleEndTurn);
}

function handleGameUpdate(gameData) {
  if (!gameData) {
    alert('Game not found');
    navigateTo('lobby');
    return;
  }

  updateCurrentGame(gameData);
  render(gameData);
}

function render(game) {
  const player = getLocalPlayer();

  // Update header
  document.getElementById('game-name').textContent = game.displayName;
  document.getElementById('game-status').textContent =
    game.status === 'waiting' ? 'Waiting for players' :
      isLocalPlayerTurn() ? 'Your turn!' : `${game.currentPlayerTurn}'s turn`;

  // Show/hide start button (host only, waiting status)
  const startBtn = document.getElementById('start-game-btn');
  if (startBtn) {
    startBtn.style.display =
      game.status === 'waiting' && game.hostId === player.username ? 'block' : 'none';
  }

  if (game.status !== 'playing') return;

  // Render central board
  if (game.centralBoard) {
    renderCentralTokenGrid('central-token-grid', game.centralBoard.tokens, handleTokenClick);
    renderAnimalCards('animal-cards', game.centralBoard.availableAnimals, ANIMAL_CARDS, handleAnimalCardClick);
  }

  // Render player's board
  const playerBoard = game.playerBoards[player.username];
  if (playerBoard) {
    renderHexBoard('player-board', playerBoard.hexGrid, {
      onHexClick: handleHexClick,
      selectedToken: selectedTokens.length > 0 ? selectedTokens[selectedTokens.length - 1].color : null,
      showExpansion: true
    });

    // Update score
    document.getElementById('player-score').textContent = `Score: ${playerBoard.score.total}`;
  }

  // Render players list
  renderPlayersList(game.players, game.currentPlayerTurn);

  // Update turn actions
  updateTurnActions(game);

  // Check game end
  if (game.status === 'finished') {
    showGameEnd(game);
  }
}

function renderPlayersList(players, currentTurn) {
  const container = document.getElementById('players-list');
  if (!container) return;

  container.innerHTML = '';

  for (const [username, playerData] of Object.entries(players)) {
    const isActive = username === currentTurn;
    const div = document.createElement('div');
    div.className = `player-item ${isActive ? 'active' : ''}`;
    div.textContent = `${isActive ? '🟢' : '○'} ${playerData.name}`;
    container.appendChild(div);
  }
}

function updateTurnActions(game) {
  const myTurn = isLocalPlayerTurn();
  const phase = game.turnPhase;

  // Update phase indicator
  document.getElementById('phase-indicator').textContent =
    phase === 'mandatory' ? 'Mandatory: Take 3 tokens' : 'Optional: Take animal or place cubes';

  // Selected tokens display
  document.getElementById('selected-tokens').textContent =
    selectedTokens.length > 0 ? `Selected: ${selectedTokens.map(t => '●').join(' ')} (${selectedTokens.length}/3)` : 'Select 3 tokens';

  // Confirm placement button
  const confirmBtn = document.getElementById('confirm-placement-btn');
  if (confirmBtn) {
    confirmBtn.disabled = !myTurn || phase !== 'mandatory' || selectedTokens.length !== 3;
  }

  // End turn button
  const endBtn = document.getElementById('end-turn-btn');
  if (endBtn) {
    endBtn.style.display = myTurn && phase === 'optional' ? 'block' : 'none';
  }
}

function handleTokenClick(index, color) {
  if (!isLocalPlayerTurn()) return;
  if (getCurrentGame().turnPhase !== 'mandatory') return;

  if (selectedTokens.length >= 3) {
    alert('Already selected 3 tokens');
    return;
  }

  selectedTokens.push({ index, color });

  // Visual feedback
  const tokenEl = document.querySelector(`[data-index="${index}"]`);
  if (tokenEl) {
    tokenEl.classList.add('selected');
  }

  render(getCurrentGame());
}

function handleHexClick(coord) {
  if (!isLocalPlayerTurn()) return;
  if (selectedTokens.length === 0) return;

  const game = getCurrentGame();
  const player = getLocalPlayer();
  const playerBoard = game.playerBoards[player.username];
  const hexKey = `${coord.q}_${coord.r}`;
  const hex = playerBoard.hexGrid[hexKey] || { stack: [], terrain: null };

  // Validate placement
  const lastToken = selectedTokens[selectedTokens.length - 1];
  const validation = canPlaceToken(hex, lastToken.color);

  if (!validation.valid) {
    alert(validation.reason);
    return;
  }

  // Add to placements (will be sent to Firebase on confirm)
  // For now, just select this hex
  alert('Click "Confirm Placement" to place all 3 tokens');
}

async function handleConfirmPlacement() {
  if (selectedTokens.length !== 3) {
    alert('Please select 3 tokens');
    return;
  }

  // For MVP, auto-place tokens on center hex and adjacent hexes
  const player = getLocalPlayer();
  const placements = selectedTokens.map((token, i) => ({
    tokenIndex: token.index,
    color: token.color,
    hexCoord: { q: i - 1, r: 0 } // Simple placement: -1_0, 0_0, 1_0
  }));

  try {
    await placeTokens(currentGameId, player.username, placements);
    selectedTokens = [];
    alert('Tokens placed! Now you can take an animal card or end turn.');
  } catch (error) {
    console.error('Failed to place tokens:', error);
    alert('Failed to place tokens');
  }
}

function handleAnimalCardClick(cardId, card) {
  if (!isLocalPlayerTurn()) return;
  if (getCurrentGame().turnPhase !== 'optional') return;

  selectedAnimalCard = card;
  alert(`Selected ${card.name}. Click to take card or place cubes.`);
}

async function handleEndTurn() {
  if (!isLocalPlayerTurn()) return;

  try {
    const player = getLocalPlayer();
    await endTurn(currentGameId, player.username);
  } catch (error) {
    console.error('Failed to end turn:', error);
    alert('Failed to end turn');
  }
}

async function handleStartGame() {
  try {
    await startGame(currentGameId);
  } catch (error) {
    console.error('Failed to start game:', error);
    alert('Failed to start game');
  }
}

function showGameEnd(game) {
  const modal = document.getElementById('game-end-modal');
  if (!modal) return;

  const standings = game.finalStandings || [];
  const standingsHtml = standings.map(p => `
    <div class="standing-item">
      <span>${p.rank}. ${p.name}</span>
      <span>${p.score} pts</span>
    </div>
  `).join('');

  modal.innerHTML = `
    <div class="modal-content">
      <h2>🎉 Game Over!</h2>
      <div class="standings">${standingsHtml}</div>
      <button onclick="window.location.reload()">Return to Lobby</button>
    </div>
  `;

  modal.style.display = 'flex';
}

export function cleanup() {
  if (unsubscribeGame) {
    unsubscribeGame();
    unsubscribeGame = null;
  }
  selectedTokens = [];
  selectedAnimalCard = null;
}
