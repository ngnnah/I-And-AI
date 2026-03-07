/**
 * Game Room Screen — bidding UI, card display, scores.
 * Handles all three in-game phases: lobby, playing, finished.
 */
import { listenToGame, leaveGame } from '../game/firebase-config.js';
import { startGame, placeBid, foldOrPass, discardLuxuryCard } from '../game/firebase-sync.js';
import { getLocalPlayer, getCurrentGame, updateCurrentGame, setCurrentGameId, clearCurrentGame, isLocalPlayerHost, isLocalPlayerActiveBidder, hasLocalPlayerPassed } from '../game/game-state.js';
import { getBidTotal, calculateScore, getMoneyTotal, removeBidFromHand } from '../game/game-logic.js';
import { STATUS_CARDS } from '../data/cards.js';
import { navigateTo } from '../main.js';
import { playSound } from '../game/sounds.js';

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
const committedBidAreaEl  = document.getElementById('committed-bid-area');
const committedBidCardsEl = document.getElementById('committed-bid-cards');
const committedBidTotalEl = document.getElementById('committed-bid-total');
const stagedBidArea       = document.getElementById('staged-bid-area');
const stagedBidCards      = document.getElementById('staged-bid-cards');
const stagedBidTotal      = document.getElementById('staged-bid-total');
const myHandCardsEl   = document.getElementById('my-hand-cards');
const myActionsEl     = document.getElementById('my-actions');
const confirmBidBtn   = document.getElementById('confirm-bid-btn');
const foldPassBtn     = document.getElementById('fold-pass-btn');

// Auction log + bid feedback
const auctionLogEl   = document.getElementById('auction-log');
const bidsHighestEl  = document.getElementById('bids-highest');
const bidHintEl      = document.getElementById('bid-hint');

// Finished phase
const winnerBannerEl    = document.getElementById('winner-banner');
const finalScoresEl     = document.getElementById('final-scores');
const finalCollectionsEl= document.getElementById('final-collections');
const backToLobbyBtn    = document.getElementById('back-to-lobby-btn');

// ---- Local state ----
let unsubscribe = null;
let stagedCards = []; // denominations currently staged for bid
let prevActiveBidder = null; // track turn changes for sound
let prevCardId = null;       // track card changes to gate reveal animation

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
  prevActiveBidder = null;
  prevCardId = null;
  finishedSoundPlayed = false;

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

  // Clear stale staged cards when it's not our turn
  if (!isMyTurn || iHavePassed) {
    stagedCards = [];
  }

  // Sound: play "your turn" chime when turn transitions to local player
  if (isMyTurn && !iHavePassed && auction.activeBidder !== prevActiveBidder) {
    playSound('yourTurn');
  }
  prevActiveBidder = auction.activeBidder;

  // --- Current card (only re-render + animate when card changes) ---
  const card = STATUS_CARDS[auction.cardId];
  if (auction.cardId !== prevCardId) {
    renderStatusCard(currentCardEl, card);
    prevCardId = auction.cardId;
  }

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

  // --- Deck progress ---
  const deck = game.deck || {};
  const totalCards = (deck.cardOrder || []).length || 16;
  const cardsLeft  = totalCards - (deck.currentIndex || 0);
  const redRevealed = deck.redCardsRevealed || 0;
  const redDanger  = redRevealed >= 3 ? 'deck-danger' : redRevealed === 2 ? 'deck-warning' : '';
  const deckInfoEl = document.getElementById('deck-info');
  if (deckInfoEl) {
    deckInfoEl.innerHTML = `
      <span class="deck-cards-left">${cardsLeft} card${cardsLeft !== 1 ? 's' : ''} left</span>
      <span class="deck-red ${redDanger}">${redRevealed}/3 red revealed${redRevealed >= 3 ? ' — NEXT RED ENDS GAME' : ''}</span>
    `;
  }

  // --- All players' bids ---
  playersBidsEl.innerHTML = turnOrder.map(pid => {
    const p = players[pid];
    if (!p) return '';
    const bidCards   = auction.bids?.[pid] || [];
    const bidTotal   = getBidTotal(bidCards);
    const hasPassed  = passed.includes(pid);
    const isActive   = auction.activeBidder === pid;
    const isLocal    = pid === myId;
    const cardCount  = (p.statusCards || []).length;
    const score      = calculateScore(p.statusCards || [], STATUS_CARDS);
    const passLabel  = pid === passed[0] && auction.auctionType === 'disgrace' ? 'took card' : 'folded';
    const netMoney   = getMoneyTotal(p.moneyCards || []) - bidTotal;

    return `
      <div class="player-bid-slot
        ${isActive && !hasPassed ? 'is-active-bidder' : ''}
        ${hasPassed ? 'has-passed' : ''}
        ${isLocal ? 'is-local' : ''}
      ">
        <div class="slot-color-bar" style="background:var(--color-${p.color})"></div>
        <div class="slot-name">${p.name}${isLocal ? ' <em>(you)</em>' : ''}</div>
        <div class="slot-bid-row">
          <span class="slot-total">${bidTotal > 0 ? bidTotal : '—'}</span>
          <span class="slot-money">${netMoney}💰</span>
        </div>
        <div class="slot-score">${cardCount} card${cardCount !== 1 ? 's' : ''} · score ${score}</div>
        <div class="slot-status ${hasPassed ? 'slot-passed' : isActive ? 'slot-bidding' : ''}">
          ${hasPassed ? passLabel : isActive ? 'bidding...' : ''}
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

  // --- My identity + hand ---
  const myColor    = myData.color || 'crimson';
  const myBidCards = auction.bids?.[myId] || [];  // cards already on table (committed)
  const myAvailableMoney = getMoneyTotal(myData.moneyCards || []) - getBidTotal(myBidCards);
  myMoneyTotalEl.textContent = `${myAvailableMoney}`;
  const myIdentityEl = document.getElementById('my-identity');
  if (myIdentityEl) {
    const myCards = (myData.statusCards || []).map(id => STATUS_CARDS[id]).filter(Boolean);
    const myScore = calculateScore(myData.statusCards || [], STATUS_CARDS);
    myIdentityEl.innerHTML = `
      <span class="my-color-dot" style="background:var(--color-${myColor})"></span>
      <span class="my-name">${myData.name || getLocalPlayer().name}</span>
      <span class="my-score-badge">score ${myScore}</span>
      ${myCards.length > 0 ? `<div class="my-cards-row">${myCards.map(c => `<span class="my-card-chip ${c.type !== 'luxury' ? 'chip-red' : ''}" title="${c.name}">${c.emoji}${c.value || ''}</span>`).join('')}</div>` : ''}
    `;
  }
  renderMyHand(myData.moneyCards || [], myBidCards, myColor, isMyTurn && !iHavePassed);

  // --- Bids header: highest bid ---
  if (bidsHighestEl) {
    const currentHighest = auction.currentHighest || 0;
    const leadName = auction.leadBidder ? players[auction.leadBidder]?.name : null;
    if (currentHighest > 0) {
      bidsHighestEl.textContent = `Highest: ${currentHighest}${leadName ? ` (${leadName})` : ''}`;
      bidsHighestEl.className = 'bids-highest';
    } else {
      bidsHighestEl.textContent = auction.auctionType === 'disgrace' ? 'Bid to pressure others' : 'No bids yet';
      bidsHighestEl.className = 'bids-highest no-bids';
    }
  }

  // Show/hide actions
  myActionsEl.classList.toggle('hidden', !isMyTurn || iHavePassed);

  if (isMyTurn && !iHavePassed) {
    const committedTotal = getBidTotal(myBidCards);
    const stagedTotal    = getBidTotal(stagedCards);
    const combinedTotal  = committedTotal + stagedTotal;
    const currentHighest = auction.currentHighest || 0;
    const bidValid       = combinedTotal > currentHighest && stagedCards.length > 0;

    confirmBidBtn.disabled = !bidValid;
    if (stagedCards.length > 0) {
      confirmBidBtn.textContent = committedTotal > 0
        ? `Raise to ${combinedTotal}`
        : `Bid ${combinedTotal}`;
    } else {
      confirmBidBtn.textContent = committedTotal > 0 ? 'Add more cards' : 'Select cards to bid';
    }

    foldPassBtn.textContent = auction.auctionType === 'disgrace'
      ? 'Pass (take card, keep money)'
      : 'Fold (get money back)';

    // Bid hint feedback
    if (bidHintEl) {
      if (stagedCards.length === 0) {
        if (committedTotal > 0) {
          bidHintEl.textContent = `${committedTotal} on table — add more cards or fold`;
          bidHintEl.className = 'bid-hint hint-need';
        } else {
          bidHintEl.textContent = currentHighest > 0
            ? `Min bid to beat: ${currentHighest + 1}`
            : 'Select money cards from your hand';
          bidHintEl.className = 'bid-hint hint-need';
        }
      } else if (bidValid) {
        bidHintEl.textContent = committedTotal > 0
          ? `✓ Raising bid: ${committedTotal} + ${stagedTotal} = ${combinedTotal}`
          : `✓ Bid ${combinedTotal}`;
        bidHintEl.className = 'bid-hint hint-valid';
      } else {
        const needed = currentHighest - combinedTotal + 1;
        bidHintEl.textContent = `Need ${needed} more to beat ${currentHighest}`;
        bidHintEl.className = 'bid-hint hint-error';
      }
    }
  } else if (bidHintEl) {
    bidHintEl.textContent = '';
    bidHintEl.className = 'bid-hint';
  }

  // Auction history log
  renderAuctionLog(game.gameState?.auctionLog || []);

  // Pending Thief
  if (myData.pendingThief && myData.statusCards?.length > 0) {
    renderThiefModal(game, myId);
  }
}

/**
 * Render the local player's money hand.
 * @param {number[]} moneyCards   - All money cards the player still holds
 * @param {number[]} committedCards - Cards already committed on the table (locked in)
 * @param {string}  myColor       - Player color for theming
 * @param {boolean} interactive   - Whether it's currently the player's turn
 */
function renderMyHand(moneyCards, committedCards, myColor, interactive) {
  // Available hand = full hand minus committed cards
  const available = removeBidFromHand(moneyCards, committedCards);

  // Ensure staged cards only reference available cards (guard against stale state)
  const availableCopy = [...available];
  stagedCards = stagedCards.filter(d => {
    const idx = availableCopy.indexOf(d);
    if (idx !== -1) { availableCopy.splice(idx, 1); return true; }
    return false;
  });

  // --- Committed area (on table, locked) ---
  if (committedBidAreaEl) {
    if (committedCards.length > 0) {
      committedBidAreaEl.classList.remove('hidden');
      committedBidCardsEl.innerHTML = [...committedCards].sort((a, b) => a - b).map(d =>
        `<div class="money-card color-${myColor} committed">${d}</div>`
      ).join('');
      committedBidTotalEl.textContent = `= ${getBidTotal(committedCards)}`;
    } else {
      committedBidAreaEl.classList.add('hidden');
    }
  }

  // --- Interactive hand (available cards not yet committed) ---
  const sortedAvailable = [...available].sort((a, b) => a - b);

  myHandCardsEl.innerHTML = sortedAvailable.map(denom => {
    const isStaged = stagedCards.includes(denom);
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

  // --- Staged area (new cards being added this turn) ---
  if (stagedCards.length > 0) {
    stagedBidArea.classList.remove('hidden');
    stagedBidCards.innerHTML = stagedCards.map(d =>
      `<div class="money-card color-${myColor} staged" data-staged="${d}">${d}</div>`
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
    playSound('untick');
  } else {
    stagedCards.push(denom);
    playSound('tick');
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
    playSound('bid');
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
    playSound('fold');
    await foldOrPass(gameId, playerId);
    stagedCards = [];
  } catch (err) {
    alert(`Action failed: ${err.message}`);
    foldPassBtn.disabled = false;
  }
});

// ---- Auction log ----
function renderAuctionLog(log) {
  if (!auctionLogEl) return;
  if (log.length === 0) {
    auctionLogEl.classList.add('hidden');
    return;
  }

  auctionLogEl.classList.remove('hidden');
  const recent = [...log].reverse().slice(0, 5);
  auctionLogEl.innerHTML = `
    <div class="auction-log-title">Recent Auctions</div>
    ${recent.map(entry => {
      const isDisgrace = entry.auctionType === 'disgrace';
      return `
        <div class="auction-log-entry ${isDisgrace ? 'log-disgrace' : 'log-luxury'}">
          <span class="log-emoji">${entry.cardEmoji}</span>
          <span class="log-card-name">${entry.cardName}</span>
          <span class="log-winner">→ ${entry.winnerName}</span>
          ${!isDisgrace && entry.bidAmount > 0 ? `<span class="log-bid">for ${entry.bidAmount}</span>` : ''}
          ${isDisgrace ? '<span class="log-bid">passed</span>' : ''}
        </div>
      `;
    }).join('')}
  `;
}

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

let finishedSoundPlayed = false;

function renderFinishedPhase(game) {
  const players   = game.players || {};
  const gameState = game.gameState || {};
  const winnerId  = gameState.winner;
  const elimId    = gameState.eliminatedPlayer;
  const scores    = gameState.scores || {};

  // Play win/lose sound once on entering finished phase
  if (!finishedSoundPlayed) {
    finishedSoundPlayed = true;
    const { id: myId } = getLocalPlayer();
    if (myId === winnerId) playSound('gameWin');
    else if (myId === elimId) playSound('gameLose');
    else playSound('winCard'); // runner-up — positive but not full fanfare
  }

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
