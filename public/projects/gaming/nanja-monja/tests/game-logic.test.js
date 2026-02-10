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
    calculateWinner
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
        const deck = { cards: [0, 1, 2, 3], currentIndex: 3 };
        assert.strictEqual(isGameOver(deck), true);
    });

    it('should return false when cards remain', () => {
        const deck = { cards: [0, 1, 2, 3], currentIndex: 2 };
        assert.strictEqual(isGameOver(deck), false);
    });

    it('should return false at start of game', () => {
        const deck = { cards: [0, 1, 2, 3], currentIndex: -1 };
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
