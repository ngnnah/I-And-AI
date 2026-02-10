/**
 * Unit tests for card-sets.js
 * Run with: node --test tests/card-sets.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
    getAllCardSets,
    getCardSet,
    getCardImage,
    getCard,
    getSetSize,
    CREATURES,
    getCreatureImage,
    getCreature
} from '../js/data/card-sets.js';

describe('getAllCardSets', () => {
    it('should return an array of card sets', () => {
        const sets = getAllCardSets();
        assert.ok(Array.isArray(sets));
        assert.strictEqual(sets.length, 6); // Exactly 6 sets
    });

    it('should include all expected sets', () => {
        const sets = getAllCardSets();
        const setIds = sets.map(s => s.id);
        assert.ok(setIds.includes('creatures'));
        assert.ok(setIds.includes('animals'));
        assert.ok(setIds.includes('cats'));
        assert.ok(setIds.includes('nature'));
        assert.ok(setIds.includes('summer'));
        assert.ok(setIds.includes('toys'));
    });

    it('each set should have exactly 12 cards', () => {
        const sets = getAllCardSets();
        sets.forEach(set => {
            assert.ok(set.id);
            assert.ok(set.name);
            assert.ok(set.description);
            assert.ok(Array.isArray(set.cards));
            assert.strictEqual(set.cards.length, 12); // All sets have exactly 12 cards
        });
    });
});

describe('getCardSet', () => {
    it('should return the creatures set', () => {
        const set = getCardSet('creatures');
        assert.strictEqual(set.id, 'creatures');
        assert.strictEqual(set.name, 'Creatures');
        assert.strictEqual(set.cards.length, 12);
    });

    it('should return the animals set', () => {
        const set = getCardSet('animals');
        assert.strictEqual(set.id, 'animals');
        assert.strictEqual(set.name, 'Animals');
        assert.strictEqual(set.cards.length, 12);
    });

    it('should return the cats set', () => {
        const set = getCardSet('cats');
        assert.strictEqual(set.id, 'cats');
        assert.strictEqual(set.name, 'Cats');
        assert.strictEqual(set.cards.length, 12);
    });

    it('should return the nature set', () => {
        const set = getCardSet('nature');
        assert.strictEqual(set.id, 'nature');
        assert.strictEqual(set.name, 'Nature');
        assert.strictEqual(set.cards.length, 12);
    });

    it('should return the summer set', () => {
        const set = getCardSet('summer');
        assert.strictEqual(set.id, 'summer');
        assert.strictEqual(set.name, 'Summer');
        assert.strictEqual(set.cards.length, 12);
    });

    it('should return the toys set', () => {
        const set = getCardSet('toys');
        assert.strictEqual(set.id, 'toys');
        assert.strictEqual(set.name, 'Toys');
        assert.strictEqual(set.cards.length, 12);
    });

    it('should throw error for invalid set ID', () => {
        assert.throws(() => {
            getCardSet('invalid_set');
        }, /Card set not found/);
    });
});

describe('getCardImage', () => {
    it('should return correct image path for creatures set', () => {
        const imgPath = getCardImage('creatures', 0);
        assert.strictEqual(imgPath, 'assets/creatures/cat-box.png');
    });

    it('should return correct image path for animals set', () => {
        const imgPath = getCardImage('animals', 0);
        assert.strictEqual(imgPath, 'assets/animals/bear.png');
    });

    it('should return correct image path for cats set', () => {
        const imgPath = getCardImage('cats', 0);
        assert.strictEqual(imgPath, 'assets/cats/beehive.png');
    });

    it('should return correct image path for nature set', () => {
        const imgPath = getCardImage('nature', 0);
        assert.strictEqual(imgPath, 'assets/nature/biking.png');
    });

    it('should return correct image path for summer set', () => {
        const imgPath = getCardImage('summer', 0);
        assert.strictEqual(imgPath, 'assets/summer/beach-ball.png');
    });

    it('should return correct image path for toys set', () => {
        const imgPath = getCardImage('toys', 0);
        assert.strictEqual(imgPath, 'assets/toys/alphabetical.png');
    });

    it('should throw error for invalid card ID (negative)', () => {
        assert.throws(() => {
            getCardImage('creatures', -1);
        }, /Invalid card ID/);
    });

    it('should throw error for invalid card ID (too large)', () => {
        assert.throws(() => {
            getCardImage('creatures', 12);
        }, /Invalid card ID/);
    });

    it('should throw error for invalid set ID', () => {
        assert.throws(() => {
            getCardImage('invalid_set', 0);
        }, /Card set not found/);
    });
});

describe('getCard', () => {
    it('should return correct card data for creatures', () => {
        const card = getCard('creatures', 0);
        assert.deepStrictEqual(card, {
            id: 0,
            name: 'Cat Box',
            imgPath: 'assets/creatures/cat-box.png'
        });
    });

    it('should return correct card data for animals', () => {
        const card = getCard('animals', 0);
        assert.deepStrictEqual(card, {
            id: 0,
            name: 'Bear',
            imgPath: 'assets/animals/bear.png'
        });
    });

    it('should return correct card data for cats', () => {
        const card = getCard('cats', 0);
        assert.deepStrictEqual(card, {
            id: 0,
            name: 'Beehive',
            imgPath: 'assets/cats/beehive.png'
        });
    });

    it('should return correct card data for nature', () => {
        const card = getCard('nature', 0);
        assert.deepStrictEqual(card, {
            id: 0,
            name: 'Biking',
            imgPath: 'assets/nature/biking.png'
        });
    });

    it('should return correct card data for summer', () => {
        const card = getCard('summer', 0);
        assert.deepStrictEqual(card, {
            id: 0,
            name: 'Beach Ball',
            imgPath: 'assets/summer/beach-ball.png'
        });
    });

    it('should return correct card data for toys', () => {
        const card = getCard('toys', 0);
        assert.deepStrictEqual(card, {
            id: 0,
            name: 'Alphabetical',
            imgPath: 'assets/toys/alphabetical.png'
        });
    });

    it('should throw error for invalid card ID', () => {
        assert.throws(() => {
            getCard('creatures', 12);
        }, /Invalid card ID/);
    });
});

describe('getSetSize', () => {
    it('should return 12 for all sets', () => {
        assert.strictEqual(getSetSize('creatures'), 12);
        assert.strictEqual(getSetSize('animals'), 12);
        assert.strictEqual(getSetSize('cats'), 12);
        assert.strictEqual(getSetSize('nature'), 12);
        assert.strictEqual(getSetSize('summer'), 12);
        assert.strictEqual(getSetSize('toys'), 12);
    });

    it('should throw error for invalid set ID', () => {
        assert.throws(() => {
            getSetSize('invalid_set');
        }, /Card set not found/);
    });
});

describe('Backward Compatibility', () => {
    it('CREATURES should be an array of 12 cards', () => {
        assert.ok(Array.isArray(CREATURES));
        assert.strictEqual(CREATURES.length, 12);
    });

    it('CREATURES should match creatures set cards', () => {
        const creaturesSet = getCardSet('creatures');
        assert.deepStrictEqual(CREATURES, creaturesSet.cards);
    });

    it('getCreatureImage should work like getCardImage for creatures', () => {
        const legacyPath = getCreatureImage(5);
        const newPath = getCardImage('creatures', 5);
        assert.strictEqual(legacyPath, newPath);
    });

    it('getCreature should work like getCard for creatures', () => {
        const legacyCard = getCreature(3);
        const newCard = getCard('creatures', 3);
        assert.deepStrictEqual(legacyCard, newCard);
    });
});

describe('Card Set Data Integrity', () => {
    it('all sets should have unique IDs within set', () => {
        const sets = getAllCardSets();
        sets.forEach(set => {
            const ids = set.cards.map(c => c.id);
            const uniqueIds = [...new Set(ids)];
            assert.strictEqual(ids.length, uniqueIds.length);
        });
    });

    it('card IDs should be sequential from 0 to 11', () => {
        const sets = getAllCardSets();
        sets.forEach(set => {
            const ids = set.cards.map(c => c.id).sort((a, b) => a - b);
            const expected = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
            assert.deepStrictEqual(ids, expected);
        });
    });

    it('all cards should have non-empty names', () => {
        const sets = getAllCardSets();
        sets.forEach(set => {
            set.cards.forEach(card => {
                assert.ok(card.name && card.name.trim().length > 0);
            });
        });
    });

    it('all cards should have valid image paths', () => {
        const sets = getAllCardSets();
        sets.forEach(set => {
            set.cards.forEach(card => {
                assert.ok(card.imgPath && card.imgPath.startsWith('assets/'));
                assert.ok(card.imgPath.endsWith('.png'));
            });
        });
    });
});
