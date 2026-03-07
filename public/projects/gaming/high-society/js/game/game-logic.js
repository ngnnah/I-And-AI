/**
 * High Society — Pure Game Logic
 * No Firebase, no DOM. All functions are deterministic and testable.
 */

import { STATUS_CARDS } from '../data/cards.js';

// ============================================================
// Money helpers
// ============================================================

/**
 * Sum an array of money denominations.
 * @param {number[]} cards
 * @returns {number}
 */
export function getMoneyTotal(cards) {
  return (cards || []).reduce((sum, v) => sum + v, 0);
}

/**
 * Sum an array of money denominations (alias for staged bids).
 * @param {number[]} cards
 * @returns {number}
 */
export function getBidTotal(cards) {
  return getMoneyTotal(cards);
}

/**
 * Remove bid cards from a hand. Each denomination removed once per occurrence.
 * @param {number[]} hand - Player's current money cards
 * @param {number[]} bid  - Cards to remove
 * @returns {number[]} Remaining hand
 */
export function removeBidFromHand(hand, bid) {
  const remaining = [...hand];
  for (const denom of bid) {
    const idx = remaining.indexOf(denom);
    if (idx !== -1) remaining.splice(idx, 1);
  }
  return remaining;
}

// ============================================================
// Deck helpers
// ============================================================

/**
 * Shuffle an array of card IDs using Fisher-Yates.
 * @param {number[]} cardIds
 * @returns {number[]} Shuffled copy
 */
export function shuffleDeck(cardIds) {
  const arr = [...cardIds];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Returns true if game should end (4th red card revealed).
 * @param {number} redCardsRevealed
 * @returns {boolean}
 */
export function checkGameEnd(redCardsRevealed) {
  return redCardsRevealed >= 4;
}

// ============================================================
// Bidding validation
// ============================================================

/**
 * Validate a proposed bid.
 * @param {number} newBidTotal
 * @param {number} currentHighest
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validateBid(newBidTotal, currentHighest) {
  if (newBidTotal <= currentHighest) {
    return { valid: false, error: `Bid must be higher than ${currentHighest}` };
  }
  return { valid: true, error: null };
}

/**
 * Get the next bidder in turn order, skipping passed players.
 * Works correctly whether activeBidder is in passed or not
 * (e.g. when called after a fold where the folder is already in passed).
 *
 * @param {string} activeBidder - Current/just-acted player ID
 * @param {string[]} turnOrder  - All player IDs in clockwise order
 * @param {string[]} passed     - Player IDs who have already passed/folded
 * @returns {string|null} Next player ID or null if none remain
 */
export function getNextBidder(activeBidder, turnOrder, passed) {
  const n = turnOrder.length;
  const startIdx = turnOrder.indexOf(activeBidder);
  if (startIdx === -1) return null;

  for (let i = 1; i <= n; i++) {
    const candidate = turnOrder[(startIdx + i) % n];
    if (!passed.includes(candidate)) return candidate;
  }
  return null; // all passed
}

/**
 * Count how many players are still active in the current auction.
 * @param {string[]} turnOrder
 * @param {string[]} passed
 * @returns {number}
 */
export function getActiveBidderCount(turnOrder, passed) {
  return turnOrder.filter(id => !passed.includes(id)).length;
}

// ============================================================
// Auction resolution
// ============================================================

/**
 * Resolve a LUXURY or PRESTIGE auction.
 * Winner = leadBidder (highest current bid).
 * Winner loses their bid money. All others get their money back (no change).
 *
 * @param {object} auction - Current auction state
 * @param {object} players - Players map { playerId: playerData }
 * @returns {{ winnerId: string, moneyUpdates: object }}
 *   moneyUpdates: { playerId: number[] } — new moneyCards arrays for affected players
 */
export function resolveLuxuryAuction(auction, players) {
  const winnerId = auction.leadBidder;
  const moneyUpdates = {};

  for (const [playerId, bidCards] of Object.entries(auction.bids || {})) {
    if (playerId === winnerId) {
      // Winner loses bid money
      moneyUpdates[playerId] = removeBidFromHand(players[playerId].moneyCards, bidCards);
    }
    // Losers: money unchanged (already got it back when they folded — or retroactively here)
  }

  return { winnerId, moneyUpdates };
}

/**
 * Resolve a DISGRACE auction.
 * The first player in `auction.passed` voluntarily took the card + retrieves their money (no loss).
 * All players who placed bids during this auction lose their bid money.
 *
 * @param {object} auction - Current auction state
 * @param {object} players - Players map
 * @returns {{ winnerId: string, moneyUpdates: object }}
 *   winnerId = the player stuck with the disgrace card (first passer, or last remaining if none passed)
 */
export function resolveDisgraceAuction(auction, players) {
  // First passer takes the card for free (retrieves bid money)
  // All bidders lose their bid money
  const firstPasser = auction.passed && auction.passed[0];
  const moneyUpdates = {};

  for (const [playerId, bidCards] of Object.entries(auction.bids || {})) {
    if (playerId === firstPasser) {
      // First passer: retrieves all bid money (no loss)
      // moneyCards unchanged
    } else {
      // Everyone who bid loses their bid money
      moneyUpdates[playerId] = removeBidFromHand(players[playerId].moneyCards, bidCards);
    }
  }

  return { winnerId: firstPasser, moneyUpdates };
}

// ============================================================
// Scoring
// ============================================================

/**
 * Calculate the final prestige score for a player.
 *
 * Formula:
 *   base = sum of luxury card values owned
 *   multiplied = base × (2 ^ number of prestige cards owned)
 *   final = multiplied − (5 × passee count)
 *   if Scandale: final = floor(final / 2)
 *
 * @param {number[]} statusCardIds - IDs of cards the player owns
 * @param {object[]} [allCards]    - Card definitions (defaults to STATUS_CARDS)
 * @returns {number}
 */
export function calculateScore(statusCardIds, allCards = STATUS_CARDS) {
  const owned = (statusCardIds || []).map(id => allCards[id]).filter(Boolean);

  const luxurySum = owned
    .filter(c => c.type === 'luxury')
    .reduce((s, c) => s + c.value, 0);

  const prestigeCount = owned.filter(c => c.type === 'prestige').length;
  const passeeCount   = owned.filter(c => c.subtype === 'passee').length;
  const hasScandale   = owned.some(c => c.subtype === 'scandale');

  let score = luxurySum * Math.pow(2, prestigeCount);
  score -= passeeCount * 5;
  if (hasScandale) score = Math.floor(score / 2);

  return Math.max(0, score);
}

/**
 * Find the player to eliminate (least money remaining).
 * Tiebreaker: player who joined earlier (lower joinedAt) is eliminated.
 *
 * @param {object} players - Players map
 * @returns {string|null} Player ID to eliminate
 */
export function findEliminatedPlayer(players) {
  const active = Object.entries(players)
    .filter(([, p]) => p.isActive)
    .map(([id, p]) => ({
      id,
      money: getMoneyTotal(p.moneyCards || []),
      joinedAt: p.joinedAt || 0
    }))
    .sort((a, b) => {
      if (a.money !== b.money) return a.money - b.money; // least money first
      return a.joinedAt - b.joinedAt;                    // earlier joiner if tied
    });

  return active.length ? active[0].id : null;
}

/**
 * Get scores for all active players.
 * @param {object} players
 * @param {object[]} [allCards]
 * @returns {object} { playerId: score }
 */
export function getAllScores(players, allCards = STATUS_CARDS) {
  const scores = {};
  for (const [id, p] of Object.entries(players)) {
    if (p.isActive) {
      scores[id] = calculateScore(p.statusCards || [], allCards);
    }
  }
  return scores;
}

/**
 * Determine the winner (highest score, excluding eliminated player).
 * Tiebreaker: most remaining money.
 *
 * @param {object} players
 * @param {string} eliminatedId
 * @param {object[]} [allCards]
 * @returns {string|null} Winner player ID
 */
export function getWinner(players, eliminatedId, allCards = STATUS_CARDS) {
  const eligible = Object.entries(players)
    .filter(([id, p]) => p.isActive && id !== eliminatedId)
    .map(([id, p]) => ({
      id,
      score: calculateScore(p.statusCards || [], allCards),
      money: getMoneyTotal(p.moneyCards || [])
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score; // highest score
      return b.money - a.money;                          // most money if tied
    });

  return eligible.length ? eligible[0].id : null;
}

/**
 * Validate a player name.
 * @param {string} name
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validatePlayerName(name) {
  const trimmed = (name || '').trim();
  if (!trimmed) return { valid: false, error: 'Name cannot be empty' };
  if (trimmed.length < 2) return { valid: false, error: 'Name must be at least 2 characters' };
  if (trimmed.length > 20) return { valid: false, error: 'Name must be 20 characters or less' };
  return { valid: true, error: null };
}
