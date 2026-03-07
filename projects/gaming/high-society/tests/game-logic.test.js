import { strict as assert } from 'assert';
import { describe, it } from 'node:test';

// Mock STATUS_CARDS for deterministic tests (avoids data/ import path issue in Node)
const MOCK_CARDS = [
  { id: 0,  type: 'luxury',   value: 1,  name: 'Perfume' },
  { id: 1,  type: 'luxury',   value: 2,  name: 'Champagne' },
  { id: 2,  type: 'luxury',   value: 3,  name: 'Haute Cuisine' },
  { id: 3,  type: 'luxury',   value: 4,  name: 'Casino' },
  { id: 4,  type: 'luxury',   value: 5,  name: 'Fine Clothes' },
  { id: 5,  type: 'luxury',   value: 6,  name: 'Holidays' },
  { id: 6,  type: 'luxury',   value: 7,  name: 'Art Collection' },
  { id: 7,  type: 'luxury',   value: 8,  name: 'Jewelry' },
  { id: 8,  type: 'luxury',   value: 9,  name: 'Thoroughbred' },
  { id: 9,  type: 'luxury',   value: 10, name: 'Country Estate' },
  { id: 10, type: 'prestige', value: 0,  name: 'Peerage' },
  { id: 11, type: 'prestige', value: 0,  name: 'Peerage' },
  { id: 12, type: 'prestige', value: 0,  name: 'Peerage' },
  { id: 13, type: 'disgrace', subtype: 'thief',    value: 0, name: 'Thief' },
  { id: 14, type: 'disgrace', subtype: 'scandale', value: 0, name: 'Scandale' },
  { id: 15, type: 'disgrace', subtype: 'passee',   value: 0, name: 'Passée' },
];

// Import functions directly — Node resolves file:// imports
import {
  getMoneyTotal,
  getBidTotal,
  removeBidFromHand,
  shuffleDeck,
  checkGameEnd,
  validateBid,
  getNextBidder,
  getActiveBidderCount,
  resolveLuxuryAuction,
  resolveDisgraceAuction,
  calculateScore,
  findEliminatedPlayer,
  getAllScores,
  getWinner,
  validatePlayerName,
} from '../js/game/game-logic.js';

// ============================================================
// Money helpers
// ============================================================

describe('getMoneyTotal', () => {
  it('sums denominations correctly', () => {
    assert.equal(getMoneyTotal([1, 2, 4, 8]), 15);
  });
  it('returns 0 for empty hand', () => {
    assert.equal(getMoneyTotal([]), 0);
  });
  it('handles null/undefined', () => {
    assert.equal(getMoneyTotal(null), 0);
    assert.equal(getMoneyTotal(undefined), 0);
  });
});

describe('removeBidFromHand', () => {
  it('removes each denomination once', () => {
    const result = removeBidFromHand([1, 2, 4, 6, 10], [2, 6]);
    assert.deepEqual(result.sort((a, b) => a - b), [1, 4, 10]);
  });
  it('handles duplicate denominations in bid', () => {
    const result = removeBidFromHand([2, 2, 4], [2]);
    assert.deepEqual(result.sort((a, b) => a - b), [2, 4]);
  });
  it('does not modify original hand', () => {
    const hand = [1, 2, 4];
    removeBidFromHand(hand, [2]);
    assert.deepEqual(hand, [1, 2, 4]);
  });
});

// ============================================================
// Deck
// ============================================================

describe('shuffleDeck', () => {
  it('returns same length', () => {
    const ids = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15];
    assert.equal(shuffleDeck(ids).length, 16);
  });
  it('contains same elements', () => {
    const ids = [0,1,2,3,4,5];
    const shuffled = shuffleDeck(ids);
    assert.deepEqual([...shuffled].sort((a,b)=>a-b), ids);
  });
  it('does not mutate original', () => {
    const ids = [0,1,2,3];
    const copy = [...ids];
    shuffleDeck(ids);
    assert.deepEqual(ids, copy);
  });
});

describe('checkGameEnd', () => {
  it('returns false for 0–3 red cards', () => {
    assert.equal(checkGameEnd(0), false);
    assert.equal(checkGameEnd(3), false);
  });
  it('returns true at 4 red cards', () => {
    assert.equal(checkGameEnd(4), true);
  });
  it('returns true above 4', () => {
    assert.equal(checkGameEnd(5), true);
  });
});

// ============================================================
// Bidding
// ============================================================

describe('validateBid', () => {
  it('rejects bid equal to current highest', () => {
    const result = validateBid(10, 10);
    assert.equal(result.valid, false);
  });
  it('rejects bid lower than current highest', () => {
    const result = validateBid(5, 10);
    assert.equal(result.valid, false);
  });
  it('accepts bid higher than current highest', () => {
    const result = validateBid(11, 10);
    assert.equal(result.valid, true);
    assert.equal(result.error, null);
  });
  it('accepts first bid (higher than 0)', () => {
    const result = validateBid(1, 0);
    assert.equal(result.valid, true);
  });
});

describe('getNextBidder', () => {
  const order = ['A', 'B', 'C', 'D'];
  it('returns next player in order', () => {
    assert.equal(getNextBidder('A', order, []), 'B');
    assert.equal(getNextBidder('C', order, []), 'D');
  });
  it('wraps around', () => {
    assert.equal(getNextBidder('D', order, []), 'A');
  });
  it('skips passed players', () => {
    assert.equal(getNextBidder('A', order, ['B']), 'C');
    assert.equal(getNextBidder('C', order, ['B', 'D']), 'A');
  });
  it('returns null when all remaining have passed', () => {
    assert.equal(getNextBidder('A', ['A'], ['A']), null);
  });
});

describe('getActiveBidderCount', () => {
  it('counts correctly', () => {
    assert.equal(getActiveBidderCount(['A','B','C'], ['B']), 2);
    assert.equal(getActiveBidderCount(['A','B','C'], ['A','B','C']), 0);
  });
});

// ============================================================
// Auction resolution — Luxury
// ============================================================

describe('resolveLuxuryAuction', () => {
  const players = {
    alice: { moneyCards: [10, 12, 20] },
    bob:   { moneyCards: [8, 15, 25] },
    carol: { moneyCards: [6, 10, 12] },
  };

  it('winner loses bid money', () => {
    const auction = {
      leadBidder: 'alice',
      bids: { alice: [10, 12], bob: [8], carol: [6] }
    };
    const { winnerId, moneyUpdates } = resolveLuxuryAuction(auction, players);
    assert.equal(winnerId, 'alice');
    // Alice bid 10+12=22, loses those cards
    assert.deepEqual(moneyUpdates.alice.sort((a,b)=>a-b), [20]);
  });

  it('losers money is not changed', () => {
    const auction = {
      leadBidder: 'alice',
      bids: { alice: [10, 12], bob: [8] }
    };
    const { moneyUpdates } = resolveLuxuryAuction(auction, players);
    assert.equal(moneyUpdates.bob, undefined); // bob not in moneyUpdates
  });
});

// ============================================================
// Auction resolution — Disgrace
// ============================================================

describe('resolveDisgraceAuction', () => {
  const players = {
    alice: { moneyCards: [10, 12, 20] },
    bob:   { moneyCards: [8, 15, 25] },
    carol: { moneyCards: [6, 10, 12] },
  };

  it('first passer takes card and keeps money', () => {
    const auction = {
      passed: ['bob'],
      bids: { alice: [10], bob: [6], carol: [8] }
    };
    const { winnerId, moneyUpdates } = resolveDisgraceAuction(auction, players);
    assert.equal(winnerId, 'bob');
    // Bob (first passer) retrieves money — not in updates
    assert.equal(moneyUpdates.bob, undefined);
  });

  it('bidders lose their bid money', () => {
    const auction = {
      passed: ['carol'],
      bids: { alice: [10, 12], bob: [8], carol: [6] }
    };
    const { moneyUpdates } = resolveDisgraceAuction(auction, players);
    // Alice bid 10+12=22
    assert.deepEqual(moneyUpdates.alice.sort((a,b)=>a-b), [20]);
    // Bob bid 8
    assert.deepEqual(moneyUpdates.bob.sort((a,b)=>a-b), [15, 25]);
    // Carol (first passer) unchanged
    assert.equal(moneyUpdates.carol, undefined);
  });
});

// ============================================================
// Scoring
// ============================================================

describe('calculateScore', () => {
  it('sums luxury values with no prestige', () => {
    // Cards: id 2 (3), id 5 (6), id 9 (10) = 19
    assert.equal(calculateScore([2, 5, 9], MOCK_CARDS), 19);
  });

  it('applies 1 prestige multiplier (x2)', () => {
    // luxury 3+6+10=19, x2 = 38
    assert.equal(calculateScore([2, 5, 9, 10], MOCK_CARDS), 38);
  });

  it('applies 2 prestige multipliers (x4)', () => {
    // luxury 5+10=15, x4 = 60
    assert.equal(calculateScore([4, 9, 10, 11], MOCK_CARDS), 60);
  });

  it('applies 3 prestige multipliers (x8)', () => {
    // luxury 10, x8 = 80
    assert.equal(calculateScore([9, 10, 11, 12], MOCK_CARDS), 80);
  });

  it('applies Scandale (halve score)', () => {
    // luxury 10 x2 = 20, Scandale → 10
    assert.equal(calculateScore([9, 10, 14], MOCK_CARDS), 10);
  });

  it('applies Passée (-5)', () => {
    // luxury 10 x2 = 20, Passée → 15
    assert.equal(calculateScore([9, 10, 15], MOCK_CARDS), 15);
  });

  it('floors Scandale on odd score', () => {
    // luxury 3+2=5, no prestige → 5, Scandale → floor(5/2) = 2
    assert.equal(calculateScore([1, 2, 14], MOCK_CARDS), 2);
  });

  it('does not go below 0', () => {
    // Only Passée, luxury 3 = 3 − 5 = −2 → clamped to 0
    assert.equal(calculateScore([2, 15], MOCK_CARDS), 0);
  });

  it('returns 0 for empty collection', () => {
    assert.equal(calculateScore([], MOCK_CARDS), 0);
  });

  it('Thief card has no direct score effect', () => {
    // Thief itself doesn't reduce score (effect is during game: discard a luxury)
    assert.equal(calculateScore([9, 13], MOCK_CARDS), 10);
  });
});

// ============================================================
// Elimination
// ============================================================

describe('findEliminatedPlayer', () => {
  it('eliminates player with least money', () => {
    const players = {
      alice: { isActive: true, moneyCards: [10, 20], joinedAt: 1000 },
      bob:   { isActive: true, moneyCards: [1, 2],   joinedAt: 2000 },
      carol: { isActive: true, moneyCards: [15, 25],  joinedAt: 3000 },
    };
    assert.equal(findEliminatedPlayer(players), 'bob');
  });

  it('tiebreaker: earlier joiner eliminated', () => {
    const players = {
      alice: { isActive: true, moneyCards: [10], joinedAt: 1000 },
      bob:   { isActive: true, moneyCards: [10], joinedAt: 2000 },
    };
    assert.equal(findEliminatedPlayer(players), 'alice');
  });

  it('ignores inactive players', () => {
    const players = {
      alice: { isActive: false, moneyCards: [1], joinedAt: 1000 },
      bob:   { isActive: true,  moneyCards: [10], joinedAt: 2000 },
    };
    assert.equal(findEliminatedPlayer(players), 'bob');
  });
});

// ============================================================
// Winner
// ============================================================

describe('getWinner', () => {
  it('returns player with highest score (excluding eliminated)', () => {
    const players = {
      alice: { isActive: true, moneyCards: [10], statusCards: [9, 10] }, // 10 x2 = 20
      bob:   { isActive: true, moneyCards: [8],  statusCards: [9] },     // 10
      carol: { isActive: true, moneyCards: [5],  statusCards: [7, 8] },  // 8+9 = 17
    };
    assert.equal(getWinner(players, 'carol', MOCK_CARDS), 'alice');
  });

  it('excludes eliminated player', () => {
    const players = {
      alice: { isActive: true, moneyCards: [1], statusCards: [9, 10, 11] }, // 10 x4 = 40
      bob:   { isActive: true, moneyCards: [5], statusCards: [7, 8, 9] },   // 8+9+10 = 27
    };
    // alice would win, but she's eliminated
    assert.equal(getWinner(players, 'alice', MOCK_CARDS), 'bob');
  });

  it('tiebreaker: most money remaining', () => {
    const players = {
      alice: { isActive: true, moneyCards: [10, 20], statusCards: [9] }, // score 10, money 30
      bob:   { isActive: true, moneyCards: [5, 10],  statusCards: [9] }, // score 10, money 15
    };
    assert.equal(getWinner(players, 'nobody', MOCK_CARDS), 'alice');
  });
});

// ============================================================
// Player name validation
// ============================================================

describe('validatePlayerName', () => {
  it('rejects empty name', () => {
    assert.equal(validatePlayerName('').valid, false);
    assert.equal(validatePlayerName('  ').valid, false);
  });

  it('rejects single character', () => {
    assert.equal(validatePlayerName('A').valid, false);
  });

  it('rejects names over 20 chars', () => {
    assert.equal(validatePlayerName('A'.repeat(21)).valid, false);
  });

  it('accepts valid name', () => {
    assert.equal(validatePlayerName('Alice').valid, true);
    assert.equal(validatePlayerName('AB').valid, true);
    assert.equal(validatePlayerName('A'.repeat(20)).valid, true);
  });
});

// ============================================================
// getAllScores
// ============================================================

describe('getAllScores', () => {
  it('computes scores for all active players', () => {
    const players = {
      alice: { isActive: true, statusCards: [9, 10] },    // 10 x2 = 20
      bob:   { isActive: true, statusCards: [7, 8] },     // 8+9 = 17
      carol: { isActive: false, statusCards: [9, 10] },   // inactive — excluded
    };
    const scores = getAllScores(players, MOCK_CARDS);
    assert.equal(scores.alice, 20);
    assert.equal(scores.bob, 17);
    assert.equal(scores.carol, undefined);
  });

  it('returns 0 score for player with no cards', () => {
    const players = {
      alice: { isActive: true, statusCards: [] },
    };
    const scores = getAllScores(players, MOCK_CARDS);
    assert.equal(scores.alice, 0);
  });

  it('handles all disgrace cards correctly', () => {
    const players = {
      alice: { isActive: true, statusCards: [13, 14, 15] }, // thief + scandale + passée
      // score: 0 luxury × 1 = 0 − 5 = −5 → halved = 0 (min 0)
    };
    const scores = getAllScores(players, MOCK_CARDS);
    assert.equal(scores.alice, 0);
  });
});

// ============================================================
// calculateScore — combined disgrace effects
// ============================================================

describe('calculateScore — combined disgrace effects', () => {
  it('Scandale + Passée both applied: passée reduces first, then halved', () => {
    // score = (1+2) × 1 = 3; − 5 passée = −2 → max 0; halved = 0
    const score = calculateScore([0, 1, 14, 15], MOCK_CARDS);
    assert.equal(score, 0);
  });

  it('Prestige + Passée: multiply then subtract', () => {
    // luxury: 5 (id=4); prestige: x2 → 10; passée: −5 → 5
    const score = calculateScore([4, 10, 15], MOCK_CARDS);
    assert.equal(score, 5);
  });

  it('Two Passée cards subtract 10', () => {
    // luxury sum: 1+2+3+4 = 10; prestige: ×1; passée ×2: 10 − 10 = 0
    const score = calculateScore([0, 1, 2, 3, 15, 15], MOCK_CARDS);
    assert.equal(score, 0);
  });

  it('Scandale halves a strong hand', () => {
    // luxury: 10 (id=9); prestige ×2 = 20; scandale: floor(20/2) = 10
    const score = calculateScore([9, 10, 14], MOCK_CARDS);
    assert.equal(score, 10);
  });
});

// ============================================================
// Edge cases: all players fold / last player forced to win
// ============================================================

describe('resolveLuxuryAuction — edge cases', () => {
  it('winner with no prior bid (zero-bid win) keeps full hand', () => {
    const auction = {
      leadBidder: 'alice',
      bids: {},  // alice never placed a bid (all others folded)
    };
    const players = {
      alice: { moneyCards: [1, 2, 4, 8] },
    };
    const result = resolveLuxuryAuction(auction, players);
    assert.equal(result.winnerId, 'alice');
    assert.deepEqual(result.moneyUpdates, {}); // no money changes
  });
});

describe('resolveDisgraceAuction — edge cases', () => {
  it('first passer with a bid keeps all their money', () => {
    const auction = {
      passed: ['alice', 'bob'],
      bids: {
        alice: [4],      // alice bid 4, then passed first → keeps money
        bob:   [6, 8],   // bob bid, loses it
      },
    };
    const players = {
      alice: { moneyCards: [1, 2, 4, 10] },
      bob:   { moneyCards: [3, 6, 8, 12] },
    };
    const result = resolveDisgraceAuction(auction, players);
    assert.equal(result.winnerId, 'alice');
    // Alice's money unchanged (not in moneyUpdates)
    assert.equal(result.moneyUpdates.alice, undefined);
    // Bob loses [6, 8]
    assert.deepEqual(result.moneyUpdates.bob.sort((a,b)=>a-b), [3, 12]);
  });

  it('second passer loses their bid', () => {
    const auction = {
      passed: ['carol', 'dave'],
      bids: { carol: [2], dave: [4] },
    };
    const players = {
      carol: { moneyCards: [2, 10, 20] },
      dave:  { moneyCards: [4, 12] },
    };
    const result = resolveDisgraceAuction(auction, players);
    assert.equal(result.winnerId, 'carol');
    assert.equal(result.moneyUpdates.carol, undefined); // kept money
    assert.deepEqual(result.moneyUpdates.dave.sort((a,b)=>a-b), [12]); // dave lost 4
  });
});

// ============================================================
// getNextBidder — edge cases
// ============================================================

describe('getNextBidder — edge cases', () => {
  it('wraps around when active bidder is last in order', () => {
    const next = getNextBidder('carol', ['alice', 'bob', 'carol'], []);
    assert.equal(next, 'alice');
  });

  it('skips passed players when wrapping', () => {
    // alice passed, so skip her when wrapping from carol
    const next = getNextBidder('carol', ['alice', 'bob', 'carol'], ['alice']);
    assert.equal(next, 'bob');
  });

  it('returns only remaining player if all others passed', () => {
    const next = getNextBidder('alice', ['alice', 'bob', 'carol'], ['bob', 'carol']);
    assert.equal(next, 'alice'); // only alice remains, cycles to herself
  });

  // foldOrPass scenario: activeBidder IS in passed (just folded)
  it('fold scenario: mid-order player folds, turn goes to next after them (not start)', () => {
    // bob folds → passed=[bob]; next should be carol, NOT alice
    const next = getNextBidder('bob', ['alice', 'bob', 'carol'], ['bob']);
    assert.equal(next, 'carol');
  });

  it('fold scenario: last player folds, turn wraps to first non-passed', () => {
    const next = getNextBidder('carol', ['alice', 'bob', 'carol'], ['carol']);
    assert.equal(next, 'alice');
  });

  it('fold scenario: skips multiple passed players after fold', () => {
    // bob folds, alice already passed → turn must skip both → goes to carol
    const next = getNextBidder('bob', ['alice', 'bob', 'carol'], ['bob', 'alice']);
    assert.equal(next, 'carol');
  });
});

// ============================================================
// validateBid — additional boundary tests
// ============================================================

describe('validateBid — boundary tests', () => {
  it('accepts bid of 1 when current highest is 0', () => {
    assert.equal(validateBid(1, 0).valid, true);
  });

  it('rejects bid of 0 against current highest 0', () => {
    assert.equal(validateBid(0, 0).valid, false);
  });

  it('rejects bid equal to current highest', () => {
    assert.equal(validateBid(15, 15).valid, false);
  });

  it('accepts large bid that clearly beats current', () => {
    assert.equal(validateBid(106, 100).valid, true);
  });

  it('error message mentions the current highest', () => {
    const { error } = validateBid(10, 20);
    assert.ok(error.includes('20'), `Expected error to mention 20, got: ${error}`);
  });
});

// ============================================================
// findEliminatedPlayer — zero money and all tied
// ============================================================

describe('findEliminatedPlayer — additional edge cases', () => {
  it('eliminates player with zero money', () => {
    const players = {
      alice: { isActive: true, moneyCards: [], joinedAt: 1000 },
      bob:   { isActive: true, moneyCards: [5], joinedAt: 2000 },
    };
    assert.equal(findEliminatedPlayer(players), 'alice');
  });

  it('with all players tied on money, eliminates first joiner', () => {
    const players = {
      late:  { isActive: true, moneyCards: [10], joinedAt: 3000 },
      early: { isActive: true, moneyCards: [10], joinedAt: 1000 },
      mid:   { isActive: true, moneyCards: [10], joinedAt: 2000 },
    };
    assert.equal(findEliminatedPlayer(players), 'early');
  });

  it('returns null for empty players map', () => {
    assert.equal(findEliminatedPlayer({}), null);
  });
});

// ============================================================
// calculateScore — prestige-only, luxury-only edge cases
// ============================================================

describe('calculateScore — edge cases', () => {
  it('prestige cards with no luxury cards = score 0', () => {
    // No luxury to multiply → 0 × 2^3 = 0
    const score = calculateScore([10, 11, 12], MOCK_CARDS);
    assert.equal(score, 0);
  });

  it('exactly one luxury + one prestige', () => {
    // luxury value 5 × 2 = 10
    const score = calculateScore([4, 10], MOCK_CARDS);
    assert.equal(score, 10);
  });

  it('Scandale with zero luxury = 0 (floor of 0 / 2)', () => {
    const score = calculateScore([14], MOCK_CARDS);
    assert.equal(score, 0);
  });

  it('score never goes negative', () => {
    // passée with no luxury: 0 - 5 = -5 → clamped to 0
    const score = calculateScore([15], MOCK_CARDS);
    assert.equal(score, 0);
  });

  it('Scandale applied after Passée reduction (not before)', () => {
    // luxury sum: 10 (id=9), prestige ×1 = 10, passée −5 = 5, scandale halves → 2
    const score = calculateScore([9, 14, 15], MOCK_CARDS);
    assert.equal(score, 2); // floor(5/2) = 2
  });

  it('three prestige multiplies by 8', () => {
    // luxury sum: 1+2 = 3; ×8 = 24
    const score = calculateScore([0, 1, 10, 11, 12], MOCK_CARDS);
    assert.equal(score, 24);
  });
});
