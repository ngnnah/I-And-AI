/**
 * Game Room Screen — bidding UI, card display, scores.
 * Handles all three in-game phases: lobby, playing, finished.
 */
import { listenToGame, leaveGame } from '../game/firebase-config.js';
import { startGame, placeBid, foldOrPass, discardLuxuryCard } from '../game/firebase-sync.js';
import { getLocalPlayer, getCurrentGame, updateCurrentGame, setCurrentGameId, clearCurrentGame, isLocalPlayerHost, isLocalPlayerActiveBidder, hasLocalPlayerPassed } from '../game/game-state.js';
import { getBidTotal, calculateScore, getMoneyTotal } from '../game/game-logic.js';
import { STATUS_CARDS } from '../data/cards.js';
import { navigateTo } from '../main.js';

// ---- DOM refs ----
const backBtn         = document.getElementById('game-back-btn');
const displayNameEl   = document.getElementById('game-display-name');
const codeBadgeEl     = document.getElementById('game-code-badge');
const headerStatusEl  = document.getElementById('game-header-status');

// Phase containers
const phaseLobby    = document.getElementById('game-phase-lobby');
const phasePlaying  = document.getElementById('game-phase-playing');
const phaseFinished = document.getElementById('game-phase-finished');

// Lobby phase
const waitingCodeEl   = document.getElementById('waiting-code');
const waitingPlayersEl= document.getElementById('waiting-players');
const startGameBtn    = document.getElementById('start-game-btn');
const startGameHint   = document.getElementById('start-game-hint');

// Playing phase
const currentCardEl   = document.getElementById('current-card');
const auctionBannerEl = document.getElementById('auction-type-banner');
const playersBidsEl   = document.getElementById('players-bids');
const turnIndicatorEl = document.getElementById('turn-indicator');
const myPanel         = document.getElementById('my-panel');
const myMoneyTotalEl  = document.getElementById('my-money-total');
const stagedBidArea   = document.getElementById('staged-bid-area');
const stagedBidCards  = document.getElementById('staged-bid-cards');
const stagedBidTotal  = document.getElementById('staged-bid-total');
const myHandCardsEl   = document.getElementById('my-hand-cards');
const myActionsEl     = document.getElementById('my-actions');
const confirmBidBtn   = document.getElementById('confirm-bid-btn');
const foldPassBtn     = document.getElementById('fold-pass-btn');

// Finished phase
const winnerBannerEl    = document.getElementById('winner-banner');
const finalScoresEl     = document.getElementById('final-scores');
const finalCollectionsEl= document.getElementById('final-collections');
const backToLobbyBtn    = document.getElementById('back-to-lobby-btn');

// ---- Local state ----
let unsubscribe = null;
let stagedCards = []; // denominations currently staged for bid

// ============================================================
// Screen lifecycle
// ============================================================

window.addEventListener('screen-changed', ({ detail }) => {
  if (detail.screen === 'game-room') {
    onEnterGameRoom();
  } else {
    onLeaveGameRoom();
  }
});

function onEnterGameRoom() {
  const { id: gameId } = getCurrentGame();
  if (!gameId) { navigateTo('lobby'); return; }

  stagedCards = [];

  unsubscribe = listenToGame(gameId, game => {
    if (!game) { navigateTo('lobby'); return; }
    updateCurrentGame(game);
    renderGame(game, gameId);
  });
}

function onLeaveGameRoom() {
  if (unsubscribe) { unsubscribe(); unsubscribe = null; }
}

// ============================================================
// Main render
// ============================================================

function renderGame(game, gameId) {
  displayNameEl.textContent  = game.displayName || gameId;
  codeBadgeEl.textContent    = gameId;
  headerStatusEl.textContent = game.status;

  // Show correct phase
  phaseLobby.classList.add('hidden');
  phasePlaying.classList.add('hidden');
  phaseFinished.classList.add('hidden');

  if (game.status === 'lobby') {
    phaseLobby.classList.remove('hidden');
    renderLobbyPhase(game, gameId);
  } else if (game.status === 'playing') {
    phasePlaying.classList.remove('hidden');
    renderPlayingPhase(game, gameId);
  } else if (game.status === 'finished') {
    phaseFinished.classList.remove('hidden');
    renderFinishedPhase(game);
  }
}

// ============================================================
// Lobby Phase
// ============================================================

function renderLobbyPhase(game, gameId) {
  waitingCodeEl.textContent = gameId;

  const players = Object.entries(game.players || {}).filter(([, p]) => p.isActive);

  waitingPlayersEl.innerHTML = players.map(([id, p]) => `
    <div class="waiting-player-row">
      <div class="player-color-dot" style="background: var(--color-${p.color})"></div>
      <span class="player-name-badge">${p.name}</span>
      ${id === game.hostId ? '<span class="host-tag">HOST</span>' : ''}
    </div>
  `).join('');

  const isHost = isLocalPlayerHost();
  const playerCount = players.length;
  const canStart = isHost && playerCount >= 3 && playerCount <= 5;

  startGameBtn.classList.toggle('hidden', !isHost);
  startGameBtn.disabled = !canStart;

  if (isHost) {
    startGameHint.textContent = playerCount < 3
      ? `Need ${3 - playerCount} more player${3 - playerCount !== 1 ? 's' : ''} to start`
      : playerCount > 5
        ? 'Too many players (max 5)'
        : '';
  } else {
    startGameHint.textContent = 'Waiting for host to start...';
  }
}

startGameBtn.addEventListener('click', async () => {
  const { data: game } = getCurrentGame();
  if (!game) return;
  startGameBtn.disabled = true;
  try {
    await startGame(getCurrentGame().id, game.players);
  } catch (err) {
    alert(`Cannot start: ${err.message}`);
    startGameBtn.disabled = false;
  }
});

// ============================================================
// Playing Phase
// ============================================================

function renderPlayingPhase(game, gameId) {
  const auction   = game.auction || {};
  const players   = game.players || {};
  const turnOrder = game.gameState?.turnOrder || [];
  const passed    = auction.passed || [];
  const { id: myId } = getLocalPlayer();
  const myData    = players[myId] || {};
  const isMyTurn  = auction.activeBidder === myId;
  const iHavePassed = passed.includes(myId);

  // --- Current card ---
  const card = STATUS_CARDS[auction.cardId];
  renderStatusCard(currentCardEl, card);

  // --- Auction type banner ---
  if (auction.auctionType === 'disgrace') {
    auctionBannerEl.textContent = 'AVOID THIS CARD — Pass to take it (free) or bid to pressure others';
    auctionBannerEl.className   = 'auction-type-banner auction-disgrace';
  } else {
    auctionBannerEl.textContent = card?.type === 'prestige'
      ? 'PRESTIGE AUCTION — Highest bid wins the x2 multiplier'
      : 'LUXURY AUCTION — Highest bid wins';
    auctionBannerEl.className   = 'auction-type-banner auction-luxury';
  }

  // --- All players' bids ---
  playersBidsEl.innerHTML = turnOrder.map(pid => {
    const p = players[pid];
    if (!p) return '';
    const bidCards  = auction.bids?.[pid] || [];
    const bidTotal  = getBidTotal(bidCards);
    const hasPassed = passed.includes(pid);
    const isActive  = auction.activeBidder === pid;
    const isLocal   = pid === myId;

    return `
      <div class="player-bid-slot
        ${isActive && !hasPassed ? 'is-active-bidder' : ''}
        ${hasPassed ? 'has-passed' : ''}
        ${isLocal ? 'is-local' : ''}
      ">
        <div class="slot-name">${p.name}</div>
        <div class="slot-total">${bidTotal > 0 ? bidTotal : '—'}</div>
        <div class="slot-money">${getMoneyTotal(p.moneyCards || [])} left</div>
        <div class="slot-status ${hasPassed ? 'slot-passed' : isActive ? 'slot-bidding' : ''}">
          ${hasPassed ? (pid === (passed[0]) && auction.auctionType === 'disgrace' ? 'took card' : 'folded') : isActive ? 'bidding...' : ''}
        </div>
      </div>
    `;
  }).join('');

  // --- Turn indicator ---
  if (isMyTurn && !iHavePassed) {
    turnIndicatorEl.textContent = 'Your turn to bid or fold/pass';
    turnIndicatorEl.className   = 'turn-indicator your-turn';
  } else if (iHavePassed) {
    turnIndicatorEl.textContent = 'You have folded — waiting for auction to end';
    turnIndicatorEl.className   = 'turn-indicator';
  } else {
    const activeName = players[auction.activeBidder]?.name || '...';
    turnIndicatorEl.textContent = `Waiting for ${activeName}`;
    turnIndicatorEl.className   = 'turn-indicator';
  }

  // --- My hand and actions ---
  myMoneyTotalEl.textContent = `Total: ${getMoneyTotal(myData.moneyCards || [])}`;
  renderMyHand(myData.moneyCards || [], isMyTurn && !iHavePassed);

  // Show/hide actions
  myActionsEl.classList.toggle('hidden', !isMyTurn || iHavePassed);

  if (isMyTurn && !iHavePassed) {
    const stagedTotal = getBidTotal(stagedCards);
    const currentHighest = auction.currentHighest || 0;
    const bidValid = stagedTotal > currentHighest;

    confirmBidBtn.disabled  = !bidValid || stagedCards.length === 0;
    confirmBidBtn.textContent = stagedCards.length > 0
      ? `Bid ${stagedTotal}`
      : 'Select cards to bid';

    foldPassBtn.textContent = auction.auctionType === 'disgrace'
      ? 'Pass (take card, keep money)'
      : 'Fold (get money back)';
  }

  // Pending Thief
  if (myData.pendingThief && myData.statusCards?.length > 0) {
    renderThiefModal(game, myId);
  }
}

function renderMyHand(moneyCards, interactive) {
  // Show cards in hand, mark any staged ones
  const sortedHand = [...moneyCards].sort((a, b) => a - b);

  myHandCardsEl.innerHTML = sortedHand.map(denom => {
    const isStaged = stagedCards.includes(denom);
    const myColor  = getLocalPlayer().color || 'crimson';
    // (color is stored in game state, use what we have)
    return `
      <div class="money-card color-${myColor} ${isStaged ? 'staged' : ''} ${!interactive ? 'disabled' : ''}"
           data-denom="${denom}">
        ${denom}
      </div>
    `;
  }).join('');

  if (interactive) {
    myHandCardsEl.querySelectorAll('.money-card:not(.disabled)').forEach(el => {
      el.addEventListener('click', () => toggleStagedCard(Number(el.dataset.denom)));
    });
  }

  // Staged area
  if (stagedCards.length > 0) {
    stagedBidArea.classList.remove('hidden');
    const myColor = getLocalPlayer().color || 'crimson';
    stagedBidCards.innerHTML = stagedCards.map(d =>
      `<div class="money-card color-${myColor} staged" style="cursor:pointer" data-staged="${d}">${d}</div>`
    ).join('');
    stagedBidTotal.textContent = `= ${getBidTotal(stagedCards)}`;

    stagedBidCards.querySelectorAll('.money-card').forEach(el => {
      el.addEventListener('click', () => toggleStagedCard(Number(el.dataset.staged)));
    });
  } else {
    stagedBidArea.classList.add('hidden');
  }
}

function toggleStagedCard(denom) {
  const idx = stagedCards.indexOf(denom);
  if (idx !== -1) {
    stagedCards.splice(idx, 1);
  } else {
    stagedCards.push(denom);
  }
  // Re-render (triggers via game listener on next update, but force local repaint)
  const { data: game } = getCurrentGame();
  if (game) renderPlayingPhase(game, getCurrentGame().id);
}

// ---- Bid actions ----
confirmBidBtn.addEventListener('click', async () => {
  if (stagedCards.length === 0) return;
  const { id: gameId } = getCurrentGame();
  const { id: playerId } = getLocalPlayer();
  confirmBidBtn.disabled = true;
  try {
    await placeBid(gameId, playerId, [...stagedCards]);
    stagedCards = [];
  } catch (err) {
    alert(`Bid failed: ${err.message}`);
    confirmBidBtn.disabled = false;
  }
});

foldPassBtn.addEventListener('click', async () => {
  const { id: gameId } = getCurrentGame();
  const { id: playerId } = getLocalPlayer();
  foldPassBtn.disabled = true;
  try {
    await foldOrPass(gameId, playerId);
    stagedCards = [];
  } catch (err) {
    alert(`Action failed: ${err.message}`);
    foldPassBtn.disabled = false;
  }
});

// ---- Thief modal (inline) ----
function renderThiefModal(game, myId) {
  const myCards  = game.players[myId].statusCards || [];
  const luxuries = myCards.filter(id => STATUS_CARDS[id]?.type === 'luxury');
  if (luxuries.length === 0) return;

  // Simple inline overlay
  const existing = document.getElementById('thief-modal');
  if (existing) return; // already showing

  const overlay = document.createElement('div');
  overlay.id = 'thief-modal';
  overlay.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:100;
    display:flex;align-items:center;justify-content:center;padding:24px;
  `;
  overlay.innerHTML = `
    <div style="background:#2a1f1a;border:2px solid #c0392b;border-radius:12px;padding:24px;max-width:380px;width:100%;text-align:center;">
      <div style="font-size:1.5rem;color:#c0392b;margin-bottom:8px;">🦹 Thief!</div>
      <p style="color:#c4a87a;margin-bottom:16px;font-size:.9rem;">
        You must discard one of your luxury cards.
      </p>
      <div id="thief-card-list" style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:16px;"></div>
    </div>
  `;

  const list = overlay.querySelector('#thief-card-list');
  luxuries.forEach(cardId => {
    const card = STATUS_CARDS[cardId];
    const btn = document.createElement('button');
    btn.className = 'btn btn-danger';
    btn.textContent = `${card.emoji} ${card.name} (${card.value})`;
    btn.addEventListener('click', async () => {
      overlay.remove();
      await discardLuxuryCard(getCurrentGame().id, getLocalPlayer().id, cardId);
    });
    list.appendChild(btn);
  });

  document.body.appendChild(overlay);
}

// ============================================================
// Status Card renderer
// ============================================================

function renderStatusCard(el, card) {
  if (!card) { el.innerHTML = ''; return; }

  const isRed = card.type === 'prestige' || card.type === 'disgrace';
  el.className = `status-card ${isRed ? 'card-red' : 'card-luxury'}`;

  el.innerHTML = `
    <div class="card-type-label">${card.type.toUpperCase()}</div>
    <div class="card-emoji">${card.emoji}</div>
    <div class="card-name">${card.name}</div>
    ${card.value ? `<div class="card-value">${card.value}</div>` : ''}
    ${card.effect ? `<div class="card-effect">${card.effect}</div>` : ''}
  `;
}

// ============================================================
// Finished Phase
// ============================================================

function renderFinishedPhase(game) {
  const players   = game.players || {};
  const gameState = game.gameState || {};
  const winnerId  = gameState.winner;
  const elimId    = gameState.eliminatedPlayer;
  const scores    = gameState.scores || {};

  // Winner banner
  const winnerData = players[winnerId];
  winnerBannerEl.innerHTML = winnerData ? `
    <div class="winner-label">Winner</div>
    <div class="winner-name">${winnerData.name}</div>
    <div class="winner-score">Score: ${scores[winnerId] ?? '—'}</div>
  ` : '<div class="winner-name">Game Over</div>';

  // Scores
  const sortedPlayers = Object.entries(players)
    .filter(([, p]) => p.isActive)
    .map(([id, p]) => ({
      id, name: p.name, color: p.color,
      score: scores[id] ?? calculateScore(p.statusCards || [], STATUS_CARDS),
      money: getMoneyTotal(p.moneyCards || []),
      eliminated: id === elimId,
      winner: id === winnerId,
    }))
    .sort((a, b) => {
      if (a.eliminated && !b.eliminated) return 1;
      if (!a.eliminated && b.eliminated) return -1;
      return b.score - a.score;
    });

  let rank = 1;
  finalScoresEl.innerHTML = sortedPlayers.map(p => {
    const display = p.eliminated ? '☠' : rank++;
    return `
      <div class="score-row ${p.eliminated ? 'eliminated' : ''} ${p.winner ? 'winner' : ''}">
        <div class="score-rank">${display}</div>
        <div class="score-name">
          <span style="color:var(--color-${p.color})">${p.name}</span>
          ${p.eliminated ? '<span class="score-eliminated-tag">eliminated</span>' : ''}
        </div>
        <div>
          <div class="score-value">${p.eliminated ? '—' : p.score}</div>
          <div class="score-money-left">${p.money} money</div>
        </div>
      </div>
    `;
  }).join('');

  // Collections
  finalCollectionsEl.innerHTML = sortedPlayers.map(p => {
    const player = players[p.id];
    const cards  = (player.statusCards || []).map(id => STATUS_CARDS[id]).filter(Boolean);
    return `
      <div class="collection-row">
        <div class="collection-name" style="color:var(--color-${p.color})">${p.name}'s cards:</div>
        ${cards.length === 0 ? '<span style="color:#9a8060;font-size:.85rem">None</span>' : ''}
        ${cards.map(c => {
          const isRed = c.type !== 'luxury';
          return `<span class="collection-card-chip ${isRed ? 'chip-red' : ''}">${c.emoji} ${c.name}${c.value ? ` (${c.value})` : ''}</span>`;
        }).join('')}
      </div>
    `;
  }).join('');
}

backToLobbyBtn.addEventListener('click', () => {
  clearCurrentGame();
  navigateTo('lobby');
});

// ============================================================
// Back button
// ============================================================

backBtn.addEventListener('click', async () => {
  const { id: gameId } = getCurrentGame();
  const { id: playerId } = getLocalPlayer();
  if (gameId) {
    await leaveGame(gameId, playerId).catch(() => {});
  }
  clearCurrentGame();
  navigateTo('lobby');
});
