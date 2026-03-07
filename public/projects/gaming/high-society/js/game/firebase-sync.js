/**
 * High Society — Firebase Sync Layer
 * All writes to Firebase and game lifecycle management.
 */
import { database, ref, set, get, update, listenToGame, saveGameHistory, updateGame } from './firebase-config.js';
import { STATUS_CARDS, MONEY_DENOMINATIONS, isRedCard, getAuctionType } from '../data/cards.js';
import {
  shuffleDeck,
  checkGameEnd,
  validateBid,
  getNextBidder,
  getActiveBidderCount,
  getBidTotal,
  resolveLuxuryAuction,
  resolveDisgraceAuction,
  calculateScore,
  findEliminatedPlayer,
  getWinner,
  getAllScores,
} from './game-logic.js';

// ============================================================
// Game Lifecycle
// ============================================================

/**
 * Start the game: shuffle deck, set turn order, reveal first card.
 * Host only.
 * @param {string} gameId
 * @param {object} players
 */
export async function startGame(gameId, players) {
  const activePlayers = Object.entries(players)
    .filter(([, p]) => p.isActive)
    .sort(([, a], [, b]) => a.joinedAt - b.joinedAt); // clockwise = join order

  if (activePlayers.length < 3) {
    throw new Error('Need at least 3 players to start');
  }

  const turnOrder = activePlayers.map(([id]) => id);
  const allCardIds = STATUS_CARDS.map(c => c.id);
  const cardOrder = shuffleDeck(allCardIds);

  // Reveal first card
  const firstCardId = cardOrder[0];
  const firstCard = STATUS_CARDS[firstCardId];
  const firstAuctionType = getAuctionType(firstCard);
  const redCardsRevealed = isRedCard(firstCard) ? 1 : 0;

  // If first card is already the 4th red (impossible with only 6 red cards total but be safe)
  if (checkGameEnd(redCardsRevealed)) {
    // Skip to end game (edge case: shouldn't happen with standard deck)
    await _endGameNoCards(gameId, players, turnOrder);
    return;
  }

  await updateGame(gameId, {
    status: 'playing',
    'gameState/phase': 'bidding',
    'gameState/turnOrder': turnOrder,
    'gameState/lastWinner': turnOrder[0],
    'gameState/winner': null,
    'deck/cardOrder': cardOrder,
    'deck/currentIndex': 0,
    'deck/redCardsRevealed': redCardsRevealed,
    'auction/cardId': firstCardId,
    'auction/auctionType': firstAuctionType,
    'auction/bids': {},
    'auction/passed': [],
    'auction/activeBidder': turnOrder[0],
    'auction/currentHighest': 0,
    'auction/leadBidder': null,
  });
}

// ============================================================
// Bidding
// ============================================================

/**
 * Place a bid. Active bidder only.
 * Bids are CUMULATIVE: new cards are ADDED to existing committed cards on the table.
 * Cards already on the table cannot be taken back until the auction resolves.
 *
 * @param {string} gameId
 * @param {string} playerId
 * @param {number[]} newCards - Additional money cards to add to current bid
 */
export async function placeBid(gameId, playerId, newCards) {
  const snap = await get(ref(database, `hs-games/${gameId}`));
  if (!snap.exists()) throw new Error('Game not found');

  const game = snap.val();
  const auction = game.auction || {};

  if (auction.activeBidder !== playerId) throw new Error('Not your turn');
  if ((auction.passed || []).includes(playerId)) throw new Error('You have already passed');

  // Accumulate: new cards are added on top of already-committed cards
  const existingBid   = auction.bids?.[playerId] || [];
  const combinedBid   = [...existingBid, ...newCards];
  const combinedTotal = getBidTotal(combinedBid);

  const { valid, error } = validateBid(combinedTotal, auction.currentHighest || 0);
  if (!valid) throw new Error(error);

  const turnOrder  = game.gameState?.turnOrder || [];
  const passed     = auction.passed || [];
  const nextBidder = getNextBidder(playerId, turnOrder, passed);

  const updates = {
    [`auction/bids/${playerId}`]: combinedBid,
    'auction/currentHighest': combinedTotal,
    'auction/leadBidder': playerId,
    'auction/activeBidder': nextBidder,
  };

  await updateGame(gameId, updates);
}

/**
 * Fold (luxury auction) or Pass (disgrace auction).
 *
 * Luxury: player withdraws, retrieves their bid money (handled at resolution).
 * Disgrace: FIRST player to call pass takes the card for free.
 *
 * @param {string} gameId
 * @param {string} playerId
 */
export async function foldOrPass(gameId, playerId) {
  const snap = await get(ref(database, `hs-games/${gameId}`));
  if (!snap.exists()) throw new Error('Game not found');

  const game = snap.val();
  const auction = game.auction || {};

  if (auction.activeBidder !== playerId) throw new Error('Not your turn');

  const turnOrder  = game.gameState?.turnOrder || [];
  const passed     = [...(auction.passed || []), playerId];
  const remaining  = turnOrder.filter(id => !passed.includes(id));

  if (auction.auctionType === 'disgrace') {
    // First passer in disgrace = immediately takes the card (auction ends)
    if ((auction.passed || []).length === 0) {
      // This player is the first to pass → resolve now
      await _resolveAuction(gameId, game, playerId);
      return;
    }
    // Should not normally reach here (auction resolves on first pass in disgrace)
  }

  // Luxury: fold this player out
  const updates = {
    'auction/passed': passed,
  };

  if (remaining.length === 1) {
    // One player left → they win the luxury auction
    const winner = remaining[0];
    await updateGame(gameId, updates);
    await _resolveAuction(gameId, { ...game, auction: { ...auction, passed } }, winner);
  } else if (remaining.length === 0) {
    // All folded (edge case: last player is forced winner)
    const winner = playerId; // The last folder wins by default (shouldn't happen normally)
    await updateGame(gameId, { 'auction/passed': passed });
    await _resolveAuction(gameId, { ...game, auction: { ...auction, passed } }, winner);
  } else {
    updates['auction/activeBidder'] = getNextBidder(playerId, turnOrder, passed);
    await updateGame(gameId, updates);
  }
}

// ============================================================
// Auction Resolution (internal)
// ============================================================

/**
 * Resolve the current auction and advance to the next card.
 * @param {string} gameId
 * @param {object} game - Full game snapshot
 * @param {string} forcedWinner - Used when resolution is triggered externally
 */
async function _resolveAuction(gameId, game, forcedWinner) {
  const auction  = game.auction || {};
  const players  = game.players || {};
  const deck     = game.deck || {};
  const gameState = game.gameState || {};

  let winnerId;
  let moneyUpdates = {};

  if (auction.auctionType === 'disgrace') {
    // Winner = first passer (forcedWinner in this context)
    winnerId = forcedWinner;
    const result = resolveDisgraceAuction(auction, players);
    moneyUpdates = result.moneyUpdates;
  } else {
    // Luxury: winner = forcedWinner (last remaining bidder)
    winnerId = forcedWinner || auction.leadBidder;
    const result = resolveLuxuryAuction({ ...auction, leadBidder: winnerId }, players);
    moneyUpdates = result.moneyUpdates;
  }

  const wonCardId = auction.cardId;
  const wonCard   = STATUS_CARDS[wonCardId];

  // Build player updates
  const playerUpdates = {};

  // Apply money changes
  for (const [pid, newMoneyCards] of Object.entries(moneyUpdates)) {
    playerUpdates[pid] = {
      ...(playerUpdates[pid] || {}),
      moneyCards: newMoneyCards,
    };
  }

  // Give card to winner
  const winnerCards = [
    ...(players[winnerId]?.statusCards || []),
    wonCardId,
  ];

  playerUpdates[winnerId] = {
    ...(playerUpdates[winnerId] || {}),
    statusCards: winnerCards,
  };

  // Handle Thief card: always set pendingThief — player chooses which luxury to discard via modal
  if (wonCard.subtype === 'thief') {
    playerUpdates[winnerId].pendingThief = true;
  }

  // Handle pendingThief: if winner already had pendingThief and wins a luxury card
  if (wonCard.type === 'luxury' && players[winnerId]?.pendingThief) {
    // Discard the just-won luxury card (the Thief's deferred effect triggers)
    playerUpdates[winnerId].statusCards = winnerCards.filter(id => id !== wonCardId);
    playerUpdates[winnerId].pendingThief = false;
  }

  // Append to auction log
  const winnerBidAmount = auction.auctionType === 'luxury'
    ? getBidTotal(auction.bids?.[winnerId] || [])
    : 0;
  const existingLog = gameState.auctionLog || [];
  const logEntry = {
    cardId: wonCardId,
    cardName: wonCard.name,
    cardEmoji: wonCard.emoji,
    auctionType: auction.auctionType,
    winnerId,
    winnerName: players[winnerId]?.name || '?',
    bidAmount: winnerBidAmount,
    round: existingLog.length + 1,
  };

  // Advance deck
  const nextIndex = (deck.currentIndex || 0) + 1;
  let redCardsRevealed = deck.redCardsRevealed || 0;

  let deckUpdates = { 'deck/currentIndex': nextIndex };
  let nextAuctionUpdates = {};

  // Check if next card triggers game end
  const cardOrder = deck.cardOrder || [];
  const nextCardId = cardOrder[nextIndex];

  if (nextCardId !== undefined) {
    const nextCard = STATUS_CARDS[nextCardId];
    if (isRedCard(nextCard)) {
      redCardsRevealed++;
      deckUpdates['deck/redCardsRevealed'] = redCardsRevealed;
    }
  }

  const gameEnds = checkGameEnd(redCardsRevealed) || nextCardId === undefined;

  // Build full update object
  const updates = {
    ...deckUpdates,
  };

  // Apply player updates
  for (const [pid, changes] of Object.entries(playerUpdates)) {
    for (const [field, value] of Object.entries(changes)) {
      updates[`players/${pid}/${field}`] = value;
    }
  }

  if (gameEnds) {
    // Finalize game
    const updatedPlayers = _applyPlayerUpdates(players, playerUpdates);
    const eliminatedId = findEliminatedPlayer(updatedPlayers);
    const scores = getAllScores(updatedPlayers);
    const winnerId2 = getWinner(updatedPlayers, eliminatedId);

    updates['status'] = 'finished';
    updates['gameState/phase'] = 'finished';
    updates['gameState/winner'] = winnerId2;
    updates['gameState/eliminatedPlayer'] = eliminatedId;
    updates['gameState/scores'] = scores;
    updates['gameState/auctionLog'] = [...existingLog, logEntry];
    updates['auction'] = null;

    await updateGame(gameId, updates);
    await saveGameHistory(gameId, {
      ...game,
      players: updatedPlayers,
      gameState: {
        ...gameState,
        winner: winnerId2,
        eliminatedPlayer: eliminatedId,
        scores,
      }
    });
  } else {
    // Start next auction
    const nextAuctionType = getAuctionType(STATUS_CARDS[nextCardId]);
    nextAuctionUpdates = {
      'auction/cardId': nextCardId,
      'auction/auctionType': nextAuctionType,
      'auction/bids': {},
      'auction/passed': [],
      'auction/activeBidder': winnerId,
      'auction/currentHighest': 0,
      'auction/leadBidder': null,
    };

    updates['gameState/lastWinner'] = winnerId;
    updates['gameState/auctionLog'] = [...existingLog, logEntry];

    await updateGame(gameId, { ...updates, ...nextAuctionUpdates });
  }
}

/**
 * Apply playerUpdates object to a players snapshot (pure, for scoring).
 */
function _applyPlayerUpdates(players, updates) {
  const result = {};
  for (const [id, p] of Object.entries(players)) {
    result[id] = { ...p, ...(updates[id] || {}) };
  }
  return result;
}

/**
 * End game when no cards remain (edge case).
 */
async function _endGameNoCards(gameId, players, turnOrder) {
  const eliminatedId = findEliminatedPlayer(players);
  const scores = getAllScores(players);
  const winnerId = getWinner(players, eliminatedId);

  await updateGame(gameId, {
    status: 'finished',
    'gameState/phase': 'finished',
    'gameState/winner': winnerId,
    'gameState/eliminatedPlayer': eliminatedId,
    'gameState/scores': scores,
    'auction': null,
  });
}

// ============================================================
// Thief: Manual discard (if player chooses which luxury to discard)
// ============================================================

/**
 * Discard a luxury card (manual Thief resolution).
 * @param {string} gameId
 * @param {string} playerId
 * @param {number} cardId - ID of luxury card to discard
 */
export async function discardLuxuryCard(gameId, playerId, cardId) {
  const snap = await get(ref(database, `hs-games/${gameId}/players/${playerId}`));
  if (!snap.exists()) throw new Error('Player not found');

  const player = snap.val();
  const newCards = (player.statusCards || []).filter(id => id !== cardId);

  await updateGame(gameId, {
    [`players/${playerId}/statusCards`]: newCards,
    [`players/${playerId}/pendingThief`]: false,
  });
}
