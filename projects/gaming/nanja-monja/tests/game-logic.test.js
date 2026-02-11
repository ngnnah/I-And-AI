/**
 * Unit tests for game-logic.js
 * Run with: node --test tests/game-logic.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
    validatePlayerName,
    validateCreatureName,
    createDeck,
    shuffleDeck,
    isGameOver,
    getRoundType,
    calculateWinner,
    isFirstTime,
    collectPile,
    countVotes,
    canPlayerFlipCard
} from '../js/game/game-logic.js';

describe('validatePlayerName', () => {
    it('should accept valid names', () => {
        assert.deepStrictEqual(validatePlayerName('Alice'), { valid: true, error: null });
        assert.deepStrictEqual(validatePlayerName('Bob123'), { valid: true, error: null });
        assert.deepStrictEqual(validatePlayerName('Player One'), { valid: true, error: null });
    });

    it('should reject empty names', () => {
        const result = validatePlayerName('');
        assert.strictEqual(result.valid, false);
        assert.ok(result.error);
    });

    it('should reject names with only spaces', () => {
        const result = validatePlayerName('   ');
        assert.strictEqual(result.valid, false);
        assert.ok(result.error);
    });

    it('should reject names longer than 20 characters', () => {
        const result = validatePlayerName('a'.repeat(21));
        assert.strictEqual(result.valid, false);
        assert.ok(result.error);
    });

    it('should trim whitespace from names', () => {
        const result = validatePlayerName('  Alice  ');
        assert.strictEqual(result.valid, true);
    });
});

describe('validateCreatureName', () => {
    it('should accept valid creature names', () => {
        assert.deepStrictEqual(validateCreatureName('Fluffy'), { valid: true, error: null });
        assert.deepStrictEqual(validateCreatureName('Mr. Whiskers'), { valid: true, error: null });
    });

    it('should reject empty names', () => {
        const result = validateCreatureName('');
        assert.strictEqual(result.valid, false);
        assert.ok(result.error);
    });

    it('should reject names with only spaces', () => {
        const result = validateCreatureName('   ');
        assert.strictEqual(result.valid, false);
        assert.ok(result.error);
    });

    it('should reject names longer than 50 characters', () => {
        const result = validateCreatureName('a'.repeat(51));
        assert.strictEqual(result.valid, false);
        assert.ok(result.error);
    });
});

describe('createDeck', () => {
    it('should create a deck with 60 cards (12 creatures × 5 copies)', () => {
        const deck = createDeck();
        assert.strictEqual(deck.length, 60);
    });

    it('should have 5 copies of each creature (12 creatures)', () => {
        const deck = createDeck();
        const counts = {};

        deck.forEach(cardId => {
            counts[cardId] = (counts[cardId] || 0) + 1;
        });

        // Each of the 12 creatures should appear exactly 5 times
        Object.values(counts).forEach(count => {
            assert.strictEqual(count, 5);
        });

        // Should have exactly 12 unique creatures
        assert.strictEqual(Object.keys(counts).length, 12);
    });

    it('should only contain creature IDs 0-11', () => {
        const deck = createDeck();
        deck.forEach(cardId => {
            assert.ok(cardId >= 0 && cardId <= 11);
        });
    });
});

describe('shuffleDeck', () => {
    it('should return a deck with the same cards', () => {
        const original = createDeck();
        const shuffled = shuffleDeck([...original]);

        // Same length
        assert.strictEqual(shuffled.length, original.length);

        // Same cards (when sorted)
        const sortedOriginal = [...original].sort();
        const sortedShuffled = [...shuffled].sort();
        assert.deepStrictEqual(sortedShuffled, sortedOriginal);
    });

    it('should shuffle the deck (very unlikely to be in same order)', () => {
        const original = createDeck();
        const shuffled = shuffleDeck([...original]);

        // Check that at least some cards are in different positions
        let differentPositions = 0;
        for (let i = 0; i < original.length; i++) {
            if (original[i] !== shuffled[i]) {
                differentPositions++;
            }
        }

        // At least 50% of cards should be in different positions
        assert.ok(differentPositions > original.length * 0.5);
    });
});

describe('isGameOver', () => {
    it('should return true when all cards are flipped', () => {
        // 4-card deck: after flipping last card (index 3), currentIndex = 3
        const deck = { cards: [0, 1, 2, 3], currentIndex: 3 };
        assert.strictEqual(isGameOver(deck), true);
    });

    it('should return false when cards remain', () => {
        // 4-card deck: after flipping 2 cards (indices 0-1), currentIndex = 1
        const deck = { cards: [0, 1, 2, 3], currentIndex: 1 };
        assert.strictEqual(isGameOver(deck), false);
    });

    it('should return false at start of game', () => {
        // currentIndex starts at -1 (no cards flipped yet)
        const deck = { cards: [0, 1, 2, 3], currentIndex: -1 };
        assert.strictEqual(isGameOver(deck), false);
    });

    it('should work correctly for 9-card deck (3x3 setting)', () => {
        // 9-card deck: after flipping all 9 cards (indices 0-8), currentIndex = 8
        const deck = { cards: new Array(9), currentIndex: 8 };
        assert.strictEqual(isGameOver(deck), true);

        // After flipping 8 cards (indices 0-7), currentIndex = 7, one card remains
        const deckWith1Left = { cards: new Array(9), currentIndex: 7 };
        assert.strictEqual(isGameOver(deckWith1Left), false);
    });

    it('should return false after tiebreaker card is appended', () => {
        // Deck is exhausted (all 4 cards flipped)
        const deck = { cards: [0, 1, 2, 3], currentIndex: 3 };
        assert.strictEqual(isGameOver(deck), true);

        // Tiebreaker: append one more card to deck
        deck.cards.push(0);
        assert.strictEqual(isGameOver(deck), false);
    });
});

describe('getRoundType', () => {
    it('should return "naming" for first occurrence of a creature', () => {
        const gameState = { creatureNames: {} };
        assert.strictEqual(getRoundType(0, gameState), 'naming');
    });

    it('should return "shouting" for subsequent occurrences', () => {
        const gameState = { creatureNames: { 0: 'Fluffy' } };
        assert.strictEqual(getRoundType(0, gameState), 'shouting');
    });

    it('should handle multiple creatures correctly', () => {
        const gameState = {
            creatureNames: {
                0: 'Fluffy',
                1: 'Spike'
            }
        };
        assert.strictEqual(getRoundType(0, gameState), 'shouting');
        assert.strictEqual(getRoundType(1, gameState), 'shouting');
        assert.strictEqual(getRoundType(2, gameState), 'naming');
    });
});

describe('calculateWinner', () => {
    it('should return player with most cards', () => {
        const players = {
            'p1': { name: 'Alice', cardsWon: 30 },
            'p2': { name: 'Bob', cardsWon: 20 },
            'p3': { name: 'Charlie', cardsWon: 10 }
        };
        const result = calculateWinner(players);
        assert.strictEqual(result.winnerId, 'p1');
        assert.strictEqual(result.maxCards, 30);
        assert.strictEqual(result.isTie, false);
    });

    it('should return one of the tied players when there is a tie', () => {
        const players = {
            'p1': { name: 'Alice', cardsWon: 30 },
            'p2': { name: 'Bob', cardsWon: 30 },
            'p3': { name: 'Charlie', cardsWon: 10 }
        };
        const result = calculateWinner(players);
        assert.ok(result.winnerId === 'p1' || result.winnerId === 'p2');
        assert.strictEqual(result.maxCards, 30);
        assert.strictEqual(result.isTie, true);
        assert.strictEqual(result.tiedPlayers.length, 2);
    });

    it('should handle single player', () => {
        const players = {
            'p1': { name: 'Alice', cardsWon: 60 }
        };
        const result = calculateWinner(players);
        assert.strictEqual(result.winnerId, 'p1');
        assert.strictEqual(result.maxCards, 60);
        assert.strictEqual(result.isTie, false);
    });

    it('should handle all players with zero cards', () => {
        const players = {
            'p1': { name: 'Alice', cardsWon: 0 },
            'p2': { name: 'Bob', cardsWon: 0 }
        };
        const result = calculateWinner(players);
        // Should have a valid winner
        assert.ok(result.winnerId);
        assert.strictEqual(typeof result.winnerId, 'string');
        assert.strictEqual(result.maxCards, 0);
        assert.strictEqual(result.isTie, true);
        assert.strictEqual(result.tiedPlayers.length, 2);
        // Winner should be one of the players
        assert.ok(result.winnerId in players);
    });
});

describe('isFirstTime', () => {
    it('should return true for first time seeing a creature', () => {
        const gameState = { creatureNames: {} };
        assert.strictEqual(isFirstTime(0, gameState), true);
    });

    it('should return false for creatures already named', () => {
        const gameState = { creatureNames: { 0: 'Fluffy' } };
        assert.strictEqual(isFirstTime(0, gameState), false);
    });

    it('should handle empty creatureNames object', () => {
        const gameState = { creatureNames: {} };
        assert.strictEqual(isFirstTime(5, gameState), true);
    });

    it('should handle missing creatureNames property', () => {
        const gameState = {};
        assert.strictEqual(isFirstTime(0, gameState), true);
    });

    it('should return true for different creature IDs', () => {
        const gameState = { creatureNames: { 0: 'Fluffy', 1: 'Spike' } };
        assert.strictEqual(isFirstTime(2, gameState), true);
    });
});

describe('collectPile', () => {
    it('should award pile to winner', () => {
        const gameState = { currentPile: [0, 1, 2, 3, 4] };
        const players = {
            'p1': { name: 'Alice', cardsWon: 10 },
            'p2': { name: 'Bob', cardsWon: 5 }
        };

        const result = collectPile('p1', gameState, players);

        assert.strictEqual(result['p1'].cardsWon, 15); // 10 + 5 pile cards
        assert.strictEqual(result['p2'].cardsWon, 5); // unchanged
        assert.deepStrictEqual(gameState.currentPile, []); // pile cleared
    });

    it('should initialize cardsWon if not present', () => {
        const gameState = { currentPile: [0, 1, 2] };
        const players = {
            'p1': { name: 'Alice' } // no cardsWon field
        };

        const result = collectPile('p1', gameState, players);

        assert.strictEqual(result['p1'].cardsWon, 3);
        assert.deepStrictEqual(gameState.currentPile, []);
    });

    it('should handle empty pile', () => {
        const gameState = { currentPile: [] };
        const players = {
            'p1': { name: 'Alice', cardsWon: 10 }
        };

        const result = collectPile('p1', gameState, players);

        assert.strictEqual(result['p1'].cardsWon, 10); // unchanged
        assert.deepStrictEqual(gameState.currentPile, []);
    });

    it('should handle missing pile (undefined)', () => {
        const gameState = {};
        const players = {
            'p1': { name: 'Alice', cardsWon: 10 }
        };

        const result = collectPile('p1', gameState, players);

        assert.strictEqual(result['p1'].cardsWon, 10); // unchanged (0 pile size)
        assert.deepStrictEqual(gameState.currentPile, []);
    });

    it('should return unchanged players for invalid player ID', () => {
        const gameState = { currentPile: [0, 1, 2] };
        const players = {
            'p1': { name: 'Alice', cardsWon: 10 }
        };

        const result = collectPile('p_invalid', gameState, players);

        // Should return players unchanged
        assert.deepStrictEqual(result, players);
    });
});

describe('countVotes', () => {
    it('should count votes correctly', () => {
        const votes = {
            'v1': 'p1', // voter 1 votes for player 1
            'v2': 'p1', // voter 2 votes for player 1
            'v3': 'p2'  // voter 3 votes for player 2
        };
        const claimants = ['p1', 'p2'];

        const result = countVotes(votes, claimants);

        assert.strictEqual(result.winnerId, 'p1');
        assert.deepStrictEqual(result.voteCounts, { p1: 2, p2: 1 });
        assert.strictEqual(result.isTie, false);
        assert.deepStrictEqual(result.tiedPlayers, []);
    });

    it('should handle tie votes (random selection)', () => {
        const votes = {
            'v1': 'p1',
            'v2': 'p2'
        };
        const claimants = ['p1', 'p2'];

        const result = countVotes(votes, claimants);

        // Winner should be one of the tied players
        assert.ok(result.winnerId === 'p1' || result.winnerId === 'p2');
        assert.deepStrictEqual(result.voteCounts, { p1: 1, p2: 1 });
        assert.strictEqual(result.isTie, true);
        assert.strictEqual(result.tiedPlayers.length, 2);
        assert.ok(result.tiedPlayers.includes('p1'));
        assert.ok(result.tiedPlayers.includes('p2'));
    });

    it('should handle no votes (all claimants at 0)', () => {
        const votes = {};
        const claimants = ['p1', 'p2', 'p3'];

        const result = countVotes(votes, claimants);

        // Should pick one randomly
        assert.ok(['p1', 'p2', 'p3'].includes(result.winnerId));
        assert.deepStrictEqual(result.voteCounts, { p1: 0, p2: 0, p3: 0 });
        assert.strictEqual(result.isTie, true);
    });

    it('should ignore votes for non-claimants', () => {
        const votes = {
            'v1': 'p1',
            'v2': 'p3', // p3 is not a claimant
            'v3': 'p2'
        };
        const claimants = ['p1', 'p2'];

        const result = countVotes(votes, claimants);

        // p3 vote should be ignored
        assert.strictEqual(result.voteCounts.p1, 1);
        assert.strictEqual(result.voteCounts.p2, 1);
        assert.ok(!result.voteCounts.hasOwnProperty('p3'));
    });

    it('should handle single claimant', () => {
        const votes = {
            'v1': 'p1',
            'v2': 'p1'
        };
        const claimants = ['p1'];

        const result = countVotes(votes, claimants);

        assert.strictEqual(result.winnerId, 'p1');
        assert.deepStrictEqual(result.voteCounts, { p1: 2 });
        assert.strictEqual(result.isTie, false);
    });

    it('should handle empty claimants array', () => {
        const votes = { 'v1': 'p1' };
        const claimants = [];

        const result = countVotes(votes, claimants);

        assert.strictEqual(result.winnerId, null);
        assert.deepStrictEqual(result.voteCounts, {});
        assert.strictEqual(result.isTie, false);
        assert.deepStrictEqual(result.tiedPlayers, []);
    });

    it('should handle three-way tie', () => {
        const votes = {
            'v1': 'p1',
            'v2': 'p2',
            'v3': 'p3'
        };
        const claimants = ['p1', 'p2', 'p3'];

        const result = countVotes(votes, claimants);

        assert.ok(['p1', 'p2', 'p3'].includes(result.winnerId));
        assert.deepStrictEqual(result.voteCounts, { p1: 1, p2: 1, p3: 1 });
        assert.strictEqual(result.isTie, true);
        assert.strictEqual(result.tiedPlayers.length, 3);
    });
});

describe('canPlayerFlipCard', () => {
    it('during naming phase, only current turn player can flip', () => {
        const gameState = {
            creatureNames: { 0: 'Fluffy', 1: 'Spike' }, // 2 out of 12 named
            currentTurnPlayerId: 'p2',
            roundType: null // Ready to flip
        };
        const hostId = 'p1';
        const setSize = 12;

        // Current turn player can flip
        assert.strictEqual(canPlayerFlipCard('p2', gameState, hostId, setSize), true);

        // Host cannot flip (not their turn)
        assert.strictEqual(canPlayerFlipCard('p1', gameState, hostId, setSize), false);

        // Other players cannot flip
        assert.strictEqual(canPlayerFlipCard('p3', gameState, hostId, setSize), false);
    });

    it('after all creatures named, only host can flip', () => {
        const gameState = {
            creatureNames: {
                0: 'A', 1: 'B', 2: 'C', 3: 'D', 4: 'E', 5: 'F',
                6: 'G', 7: 'H', 8: 'I', 9: 'J', 10: 'K', 11: 'L'
            }, // All 12 named
            currentTurnPlayerId: 'p2', // Turn should be ignored now
            roundType: null // Ready to flip
        };
        const hostId = 'p1';
        const setSize = 12;

        // Host can flip
        assert.strictEqual(canPlayerFlipCard('p1', gameState, hostId, setSize), true);

        // Current turn player cannot flip (turn-based flipping ends)
        assert.strictEqual(canPlayerFlipCard('p2', gameState, hostId, setSize), false);

        // Other players cannot flip
        assert.strictEqual(canPlayerFlipCard('p3', gameState, hostId, setSize), false);
    });

    it('no one can flip during naming round', () => {
        const gameState = {
            creatureNames: { 0: 'Fluffy' },
            currentTurnPlayerId: 'p2',
            currentCard: 1,
            roundType: 'naming' // Currently in naming round
        };
        const hostId = 'p1';
        const setSize = 12;

        // No one can flip during a round
        assert.strictEqual(canPlayerFlipCard('p1', gameState, hostId, setSize), false);
        assert.strictEqual(canPlayerFlipCard('p2', gameState, hostId, setSize), false);
        assert.strictEqual(canPlayerFlipCard('p3', gameState, hostId, setSize), false);
    });

    it('no one can flip during shouting round', () => {
        const gameState = {
            creatureNames: {
                0: 'A', 1: 'B', 2: 'C', 3: 'D', 4: 'E', 5: 'F',
                6: 'G', 7: 'H', 8: 'I', 9: 'J', 10: 'K', 11: 'L'
            },
            currentTurnPlayerId: 'p2',
            currentCard: 5,
            roundType: 'shouting' // Currently in shouting round
        };
        const hostId = 'p1';
        const setSize = 12;

        // No one can flip during a round
        assert.strictEqual(canPlayerFlipCard('p1', gameState, hostId, setSize), false);
        assert.strictEqual(canPlayerFlipCard('p2', gameState, hostId, setSize), false);
    });

    it('handles empty creatureNames object', () => {
        const gameState = {
            creatureNames: {}, // No creatures named yet
            currentTurnPlayerId: 'p1',
            roundType: null
        };
        const hostId = 'p1';
        const setSize = 12;

        // First player's turn
        assert.strictEqual(canPlayerFlipCard('p1', gameState, hostId, setSize), true);
        assert.strictEqual(canPlayerFlipCard('p2', gameState, hostId, setSize), false);
    });

    it('handles different card set sizes', () => {
        // Test with a hypothetical 6-card set
        const gameState = {
            creatureNames: { 0: 'A', 1: 'B', 2: 'C', 3: 'D', 4: 'E', 5: 'F' },
            currentTurnPlayerId: 'p2',
            roundType: null
        };
        const hostId = 'p1';
        const setSize = 6; // Different set size

        // All 6 creatures named - only host can flip
        assert.strictEqual(canPlayerFlipCard('p1', gameState, hostId, setSize), true);
        assert.strictEqual(canPlayerFlipCard('p2', gameState, hostId, setSize), false);
    });

    it('returns false for invalid inputs', () => {
        const validGameState = {
            creatureNames: {},
            currentTurnPlayerId: 'p1',
            roundType: null
        };

        // Missing playerId
        assert.strictEqual(canPlayerFlipCard(null, validGameState, 'p1', 12), false);

        // Missing gameState
        assert.strictEqual(canPlayerFlipCard('p1', null, 'p1', 12), false);

        // Missing hostId
        assert.strictEqual(canPlayerFlipCard('p1', validGameState, null, 12), false);

        // Missing setSize
        assert.strictEqual(canPlayerFlipCard('p1', validGameState, 'p1', null), false);
    });

    it('transition from naming to shouting phase', () => {
        const hostId = 'p1';
        const setSize = 12;

        // Naming phase: 11 out of 12 creatures named
        const namingPhaseState = {
            creatureNames: {
                0: 'A', 1: 'B', 2: 'C', 3: 'D', 4: 'E', 5: 'F',
                6: 'G', 7: 'H', 8: 'I', 9: 'J', 10: 'K'
            },
            currentTurnPlayerId: 'p3',
            roundType: null
        };

        // In naming phase, turn player can flip
        assert.strictEqual(canPlayerFlipCard('p3', namingPhaseState, hostId, setSize), true);
        assert.strictEqual(canPlayerFlipCard('p1', namingPhaseState, hostId, setSize), false);

        // Shouting phase: all 12 creatures named
        const shoutingPhaseState = {
            creatureNames: {
                0: 'A', 1: 'B', 2: 'C', 3: 'D', 4: 'E', 5: 'F',
                6: 'G', 7: 'H', 8: 'I', 9: 'J', 10: 'K', 11: 'L'
            },
            currentTurnPlayerId: 'p3', // Turn should now be ignored
            roundType: null
        };

        // In shouting phase, only host can flip
        assert.strictEqual(canPlayerFlipCard('p1', shoutingPhaseState, hostId, setSize), true);
        assert.strictEqual(canPlayerFlipCard('p3', shoutingPhaseState, hostId, setSize), false);
    });
});
